import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { 
    MSG, 
    GameOverServerMessage, 
    InitGameServerMessage, 
    MoveServerMessage,
    MovePayload
} from "@eechess/shared";

export class Game {
    private player1: WebSocket;
    private player2: WebSocket;
    private board: Chess;
    private moves: MovePayload[];
    //private startTime: Date;
    private onGameOver: (winner: string) => void;

    constructor(player1: WebSocket, player2: WebSocket, onGameOver: (winner: string) => void) {
        this.player1 = player1;
        this.player2 = player2;
        this.onGameOver = onGameOver;
        this.board = new Chess();
        this.moves = [];
        //this.startTime = new Date();
        const initGameForPlayer1: InitGameServerMessage = {
            type: MSG.INIT_GAME,
            payload: {
                color: "white"
            }
        };
        this.player1.send(JSON.stringify(initGameForPlayer1));

        const initGameForPlayer2: InitGameServerMessage = {
            type: MSG.INIT_GAME,
            payload: {
                color: "black"
            }
        };
        this.player2.send(JSON.stringify(initGameForPlayer2));
    }

    hasPlayer(socket: WebSocket) {
        return this.player1 === socket || this.player2 === socket;
    }

    makeMove(socket: WebSocket, move: MovePayload) {
        if (!this.isCorrectPlayerTurn(socket)) return;

        try {
            this.board.move(move);
            this.moves.push(move);
        } catch(e) {
            console.log(e);
            return;
        }

        if (this.board.isGameOver()) {
            let winner: "white" | "black" | null = null;
            if (this.board.isCheckmate()) {
                winner = this.board.turn() === "w" ? "black" : "white";
            }
            const gameOverMessage: GameOverServerMessage = {
                type: MSG.GAME_OVER,
                payload: { winner }
            };
            this.player1.send(JSON.stringify(gameOverMessage));
            this.player2.send(JSON.stringify(gameOverMessage));

            this.onGameOver(winner || "draw");
            return;
        }

        const opponent = (socket === this.player1) ? this.player2 : this.player1;
        const moveMessage: MoveServerMessage = {
            type: MSG.MOVE,
            payload: move
        };
        opponent.send(JSON.stringify(moveMessage));
    }

    public playerDisconnected(disconnectedSocket: WebSocket) {
        const winner = disconnectedSocket === this.player1 ? "black" : "white";
        const opponent = disconnectedSocket === this.player1 ? this.player2 : this.player1;

        const gameOverMessage: GameOverServerMessage = {
            type: MSG.GAME_OVER,
            payload: { winner }
        };
        opponent.send(JSON.stringify(gameOverMessage));

        this.onGameOver(winner);
    }

    private isCorrectPlayerTurn(socket: WebSocket): boolean {
        return (this.board.turn() === 'w' && socket === this.player1) ||
               (this.board.turn() === 'b' && socket === this.player2);
    }
}