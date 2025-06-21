import { type Square } from "chess.js";
import { Chessboard as Board } from "react-chessboard";

type Props = {
    position: string;
    onMove: (from: Square, to: Square, piece: string) => boolean;
    playerColor: "w" | "b" | null;
}

function Chessboard({ position, onMove, playerColor }: Props) {
    return <Board
        position={position}
        onPieceDrop={onMove}
        boardOrientation={playerColor === "b" ? "black" : "white"}
        />
}

export default Chessboard;