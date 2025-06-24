import { useGameStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState } from "react";

type Props = {
    onStart: () => void;
    onSpectate: (gameId: string) => void;
    onResign: () => void;
};

export function GameInfo({ onStart, onSpectate, onResign }: Props) {
    const { started, isSeeking, gameId, game, playerColor } = useGameStore();
    const [spectatorId, setSpectatorId] = useState('');

    if (!started) {
        return (
            <div className="flex flex-col gap-4">
                <Button 
                    onClick={onStart} 
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
                        <Button 
                            onClick={() => onSpectate(spectatorId)} 
                            variant="secondary"
                        >
                            Spectate
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
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
            {playerColor && (
                <Button onClick={onResign} variant="destructive">Resign</Button>
            )}
        </div>
    );
} 