import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

interface Move {
    from: string;
    to: string;
}

export class Game {
    private player1: WebSocket;
    private player2: WebSocket;
    private board: Chess;
    private moves: Move[];
    //private startTime: Date;
    private onGameOver: (winner: string) => void;

    constructor(player1: WebSocket, player2: WebSocket, onGameOver: (winner: string) => void) {
        this.player1 = player1;
        this.player2 = player2;
        this.onGameOver = onGameOver;
        this.board = new Chess();
        this.moves = [];
        //this.startTime = new Date();

        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white"
            }
        }));

        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black"
            }
        }));
    }

    hasPlayer(socket: WebSocket) {
        return this.player1 === socket || this.player2 === socket;
    }

    makeMove(socket: WebSocket, move: Move) {
        if (!this.isCorrectPlayerTurn(socket)) return;

        try {
            this.board.move(move);
            this.moves.push(move);
        } catch(e) {
            console.log(e);
            return;
        }

        if (this.board.isGameOver()) {
            const winner = this.board.turn() === "w" ? "black" : "white";
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: { winner }
            }));
            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: { winner }
            }));
            this.onGameOver(winner);
            return;
        }

        const opponent = (socket === this.player1) ? this.player2 : this.player1;
        opponent.send(JSON.stringify({
            type: MOVE,
            payload: move
        }));
    }

    public playerDisconnected(disconnectedSocket: WebSocket) {
        const winner = disconnectedSocket === this.player1 ? "black" : "white";
        const opponent = disconnectedSocket === this.player1 ? this.player2 : this.player1;

        opponent.send(JSON.stringify({
            type: GAME_OVER,
            payload: { winner }
        }));

        this.onGameOver(winner);
    }

    private isCorrectPlayerTurn(socket: WebSocket): boolean {
        return (this.board.turn() === 'w' && socket === this.player1) ||
               (this.board.turn() === 'b' && socket === this.player2);
    }
}