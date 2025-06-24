import { useGameStore } from "@/lib/store";
import Chessboard from "./Chessboard";
import type { Square } from "chess.js";

type Props = {
    onMove: (from: Square, to: Square, piece: string) => boolean;
};

export function GameBoard({ onMove }: Props) {
    const { game, playerColor } = useGameStore();

    return (
        <div className="md:col-span-2">
            <Chessboard 
                position={game.fen()} 
                onMove={onMove} 
                playerColor={playerColor} 
            />
        </div>
    );
} 