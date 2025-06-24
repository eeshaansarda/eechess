import { useSocket } from "@/hooks/useSocket";
import Chessboard from "@/components/Chessboard";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { MSG, type ServerMessage, type MakeMoveClientMessage, type JoinGameClientMessage, type MovePayload } from "@eechess/shared";
import { useGameStore } from "@/lib/store";

function Game() {
    const socket = useSocket();
    const {
        game,
        started,
        playerColor,
        isSeeking,
        gameOver,
        gameResult,
        gameId,
        setGame,
        setStarted,
        setPlayerColor,
        setIsSeeking,
        setGameOver,
        setGameResult,
        setGameId,
        resetGame
    } = useGameStore();
    const [spectatorId, setSpectatorId] = useState('');

    useEffect(() => {
        if(!socket) return;

        const urlParams = new URLSearchParams(window.location.search);
        const gameIdFromUrl = urlParams.get('gameId');
        if (gameIdFromUrl) {
            const message: JoinGameClientMessage = { type: MSG.JOIN_GAME, payload: { gameId: gameIdFromUrl } };
            socket.send(JSON.stringify(message));
        }

        socket.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data);

                switch(message.type) {
                    case MSG.INIT_GAME:
                        setGame(new Chess());
                        setPlayerColor(message.payload.color === "white" ? "w" : "b");
                        setStarted(true);
                        setIsSeeking(false);
                        setGameId(message.payload.gameId);
                        break;
                    case MSG.GAME_STATE:
                        setGame(new Chess(message.payload.fen));
                        setPlayerColor(null);
                        setStarted(true);
                        setIsSeeking(false);
                        setGameId(message.payload.gameId);
                        break;
                    case MSG.MOVE:
                        const move = message.payload;
                        const gameCopy = new Chess(game.fen());
                        if (gameCopy.move(move)) {
                            setGame(gameCopy);
                        } else {
                            console.warn("Invalid move received from server", move);
                        }
                        break;
                    case MSG.GAME_OVER:
                        setGameOver(true);
                        const winner = message.payload.winner;
                        const isDraw = !winner;

                        if(isDraw) {
                            setGameResult("Draw!");
                        } else {
                            if (playerColor) {
                                // Player is participating in the game
                                const playerWon = (winner === "white" && playerColor === "w") || 
                                                  (winner === "black" && playerColor === "b");
                                setGameResult(`You ${playerWon ? 'won' : 'lost'}!`);
                            } else {
                                // Spectator is watching the game
                                setGameResult(`${winner === "white" ? "White" : "Black"} won!`);
                            }
                        }

                        setStarted(false);
                        setPlayerColor(null);
                        break;
                    default:
                        console.warn("No such message", message);
                }
            } catch (error) {
                console.error("Error parsing message from server:", event.data, error);
            }
        };
    }, [socket, game, setGame, setPlayerColor, setStarted, setIsSeeking, setGameOver, setGameResult, playerColor, setGameId]);

    function handleMove(from: Square, to: Square, piece: string) {
        if(!playerColor) return false;
        if(playerColor !== piece[0] || playerColor !== game.turn()) return false;
        const promotion = piece[1].toLowerCase() ?? "q";
        const gameCopy = new Chess(game.fen());
        
        try {
            const moveResult = gameCopy.move({ from, to, promotion });
            if (moveResult === null) {
                return false;
            }
            const move: MovePayload = { from, to, promotion };
            const message: MakeMoveClientMessage = { type: MSG.MAKE_MOVE, payload: { move }};
            socket?.send(JSON.stringify(message));
        } catch (e) {
            console.warn("Invalid move attempted:", { from, to }, e);
            return false;
        }
        setGame(gameCopy);
        return true;
    }

    function handleStart() {
        if (!socket) return;
        setIsSeeking(true);
        const message: JoinGameClientMessage = { type: MSG.JOIN_GAME };
        socket?.send(JSON.stringify(message));
    }

    function handleSpectate() {
        if (!socket || !spectatorId) return;
        const message: JoinGameClientMessage = { type: MSG.JOIN_GAME, payload: { gameId: spectatorId } };
        socket.send(JSON.stringify(message));
    }

    function resetAndStart() {
        resetGame();
        handleStart();
    }

    function goToLobby() {
        resetGame();
    }

    if(!socket) return <div className="flex min-h-svh items-center justify-center bg-slate-900 text-white">Connecting...</div>
    return (
        <div className="flex min-h-svh items-center justify-center bg-slate-900">
            <Dialog open={gameOver} onOpenChange={setGameOver}>
                <DialogContent className="bg-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>{gameResult}</DialogTitle>
                        <DialogDescription>
                            The game has ended.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        {playerColor ? (
                            <Button onClick={resetAndStart} size="lg" variant="secondary">Play Again</Button>
                        ) : (
                            <Button onClick={goToLobby} size="lg" variant="secondary">Go to Lobby</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="grid w-full max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-3 md:p-8">
                <div className="md:col-span-2">
                    <Chessboard position={game.fen()} onMove={handleMove} playerColor={playerColor} />
                </div>
                <div className="flex flex-col gap-6 rounded-lg bg-slate-800 p-6 shadow-lg md:col-span-1">
                    <h1 className="text-4xl font-bold text-white tracking-tighter">eechess</h1>
                    
                    { !started && (
                        <div className="flex flex-col gap-4">
                             <Button 
                                onClick={handleStart} 
                                disabled={isSeeking}
                                size="lg"
                                variant="secondary"
                                >
                                {isSeeking ? "Seeking opponent..." : "Play"}
                            </Button>

                            <div>
                                <h3 className="mb-2 text-xl font-semibold text-white">Spectate a game</h3>
                                <div className="flex items-center">
                                    <Input 
                                        placeholder="Game ID" 
                                        className="mr-2 bg-slate-700 border-slate-600 text-white"
                                        onChange={(e) => setSpectatorId(e.target.value)}
                                        value={spectatorId}
                                    />
                                    <Button onClick={handleSpectate} variant="secondary">Spectate</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {started && (
                        <div className="text-white space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold">Game ID</h3>
                                <p className="text-lg select-all font-mono text-slate-400">{gameId}</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">Turn</h3>
                                <p className="text-lg text-slate-400">{game.turn() === 'w' ? 'White' : 'Black'}</p>
                            </div>
                            {playerColor && (
                                <div>
                                    <h3 className="text-xl font-semibold">You are</h3>
                                    <p className="text-lg text-slate-400">{playerColor === 'w' ? 'White' : 'Black'}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Game;