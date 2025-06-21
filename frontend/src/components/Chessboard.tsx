import { Chess, type Square } from "chess.js";
import { useState } from "react";
import { Chessboard as Board } from "react-chessboard";

function Chessboard() {
    const [game, setGame] = useState(new Chess());

    function onDrop(from: Square, to: Square, piece: any) {
        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({ from, to, promotion: piece[1].toLowerCase() ?? "q" });
        // pass this move on to socket

        if (move === null) {
            return false;
        }

        setGame(gameCopy);
        return true;
    }
    return <Board
        position={game.fen()}
        onPieceDrop={onDrop}
        />
}

export default Chessboard;