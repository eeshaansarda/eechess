import { useSocket } from "@/hooks/useSocket";
import Chessboard from "@/components/Chessboard";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Chess, type Square } from "chess.js";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

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
        setGame,
        setStarted,
        setPlayerColor,
        setIsSeeking,
        setGameOver,
        setGameResult,
        resetGame
    } = useGameStore();

    useEffect(() => {
        if(!socket) return;
        socket.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data);

                switch(message.type) {
                    case MSG.INIT_GAME:
                        setGame(new Chess());
                        setPlayerColor(message.payload.color === "white" ? "w" : "b");
                        setStarted(true);
                        setIsSeeking(false);
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
                            const playerWon = (winner === "white" && playerColor === "w") || 
                                              (winner === "black" && playerColor === "b");
                            setGameResult(`You ${playerWon ? 'won' : 'lost'}!`)
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
    }, [socket, game, setGame, setPlayerColor, setStarted, setIsSeeking, setGameOver, setGameResult, playerColor]);

    function handleMove(from: Square, to: Square, piece: string) {
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
        setIsSeeking(true);
        const message: JoinGameClientMessage = { type: MSG.JOIN_GAME };
        socket?.send(JSON.stringify(message));
    }

    function resetAndStart() {
        resetGame();
        handleStart();
    }

    if(!socket) return <div>Connecting...</div>
    return (
        <div className="flex min-h-svh items-center justify-center bg-[#262522]">
            <Dialog open={gameOver} onOpenChange={setGameOver}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{gameResult}</DialogTitle>
                        <DialogDescription>
                            The game has ended.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={resetAndStart}>Play Again</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className="grid w-full max-w-7xl grid-cols-1 gap-8 p-8 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Chessboard position={game.fen()} onMove={handleMove} playerColor={playerColor} />
                </div>
                <div className="rounded-lg bg-[#1c1b19] p-6 shadow-lg md:col-span-1">
                    <h2 className="mb-4 text-2xl font-bold text-white">Game Controls</h2>
                    {
                    !started && <Button 
                        onClick={handleStart} 
                        disabled={isSeeking}
                        className="w-full bg-[#b58863] py-3 text-lg font-semibold text-white shadow-md transition-colors hover:bg-[#a57853]">
                        {isSeeking ? "Seeking opponent..." : "Play"}
                    </Button>
                    }
                </div>
            </div>
        </div>
    );
}

export default Game;