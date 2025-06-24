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

import { INIT_GAME, MOVE, GAME_OVER } from "@eechess/shared";

function Game() {
    const socket = useSocket();
    const [game, setGame] = useState(new Chess());
    const [started, setStarted] = useState(false);
    const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
    const [isSeeking, setIsSeeking] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [gameResult, setGameResult] = useState<string | null>(null);

    useEffect(() => {
        if(!socket) return;
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                switch(message.type) {
                    case INIT_GAME:
                        setGame(new Chess());
                        setPlayerColor(message.payload.color === "white" ? "w" : "b");
                        setStarted(true);
                        setIsSeeking(false);
                        break;
                    case MOVE:
                        const move = message.payload;
                        const gameCopy = new Chess(game.fen());
                        if (gameCopy.move(move)) {
                            setGame(gameCopy);
                        } else {
                            console.warn("Invalid move received from server", move);
                        }
                        break;
                    case GAME_OVER:
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
    }, [socket, game]);

    function handleMove(from: Square, to: Square, piece: string) {
        if(playerColor !== piece[0] || playerColor !== game.turn()) return false;
        const promotion = piece[1].toLowerCase() ?? "q";
        const gameCopy = new Chess(game.fen());
        
        try {
            const move = gameCopy.move({ from, to, promotion });
            if (move === null) {
                return false;
            }
        } catch (e) {
            console.warn("Invalid move attempted:", { from, to }, e);
            return false;
        }

        socket?.send(JSON.stringify({ type: MOVE, payload: { move: { from, to, promotion } } }));
        setGame(gameCopy);
        return true;
    }

    function handleStart() {
        setIsSeeking(true);
        socket?.send(JSON.stringify({ type: INIT_GAME }));
    }

    function resetGame() {
        setGameOver(false);
        setGameResult(null);
        setGame(new Chess());
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
                        <Button onClick={() => {
                            resetGame();
                            handleStart();
                        }}>Play Again</Button>
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