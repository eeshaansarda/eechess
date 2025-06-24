import { useGameSocket } from "@/hooks/useGameSocket";
import { useGameStore } from "@/lib/store";
import { GameBoard } from "@/components/GameBoard";
import { GameInfo } from "@/components/GameInfo";
import { GameOverDialog } from "@/components/GameOverDialog";

function Game() {
    const { socket, sendMove, startGame, spectateGame, resignGame } = useGameSocket();
    const { resetGame } = useGameStore();

    if (!socket) {
        return (
            <div className="flex min-h-svh items-center justify-center bg-slate-900 text-white">
                Connecting...
            </div>
        );
    }

    return (
        <div className="flex min-h-svh items-center justify-center bg-slate-900">
            <GameOverDialog onGoToLobby={resetGame} />
            <div className="grid w-full max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-3 md:p-8">
                <GameBoard onMove={sendMove} />
                <div className="flex flex-col gap-6 rounded-lg bg-slate-800 p-6 shadow-lg md:col-span-1">
                    <h1 className="text-4xl font-bold text-white tracking-tighter">eechess</h1>
                    <GameInfo 
                        onStart={startGame}
                        onSpectate={spectateGame}
                        onResign={resignGame}
                    />
                </div>
            </div>
        </div>
    );
}

export default Game;