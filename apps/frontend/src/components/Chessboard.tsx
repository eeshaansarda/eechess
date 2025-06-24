import { type Square } from "chess.js";
import { Chessboard as Board } from "react-chessboard";
import { memo } from "react";

type Props = {
    position: string;
    onMove: (from: Square, to: Square, piece: string) => boolean;
    playerColor: "w" | "b" | null;
}

const Chessboard = memo(({ position, onMove, playerColor }: Props) => {
    return <Board
        position={position}
        onPieceDrop={onMove}
        boardOrientation={playerColor === "b" ? "black" : "white"}
        customBoardStyle={{
            borderRadius: "4px",
        }}
        customDarkSquareStyle={{
            backgroundColor: "#475569",
        }}
        customLightSquareStyle={{
            backgroundColor: "#94a3b8",
        }}
        />
});

export default Chessboard;