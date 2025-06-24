import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { 
    MSG, 
    GameOverServerMessage, 
    InitGameServerMessage, 
    MoveServerMessage,
    MovePayload,
    GameStateServerMessage
} from "@eechess/shared";

export class Game {
    public id: string;
    private player1: WebSocket;
    private player2: WebSocket;
    private spectators: WebSocket[] = [];
    private board: Chess;
    private moves: MovePayload[];
    //private startTime: Date;
    private onGameOver: (winner: string) => void;

    constructor(player1: WebSocket, player2: WebSocket, onGameOver: (winner: string) => void) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.player1 = player1;
        this.player2 = player2;
        this.onGameOver = onGameOver;
        this.board = new Chess();
        this.moves = [];
        this.spectators = [];
        //this.startTime = new Date();
        const initGameForPlayer1: InitGameServerMessage = {
            type: MSG.INIT_GAME,
            payload: {
                color: "white",
                gameId: this.id
            }
        };
        this.player1.send(JSON.stringify(initGameForPlayer1));

        const initGameForPlayer2: InitGameServerMessage = {
            type: MSG.INIT_GAME,
            payload: {
                color: "black",
                gameId: this.id
            }
        };
        this.player2.send(JSON.stringify(initGameForPlayer2));
    }

    hasPlayer(socket: WebSocket) {
        return this.player1 === socket || this.player2 === socket;
    }

    addSpectator(socket: WebSocket) {
        this.spectators.push(socket);
        const gameStateMessage: GameStateServerMessage = {
            type: MSG.GAME_STATE,
            payload: {
                moves: this.moves,
                turn: this.board.turn(),
                fen: this.board.fen(),
                gameId: this.id
            }
        };
        socket.send(JSON.stringify(gameStateMessage));
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
            this.broadcast(JSON.stringify(gameOverMessage));

            this.onGameOver(winner || "draw");
            return;
        }

        const opponent = (socket === this.player1) ? this.player2 : this.player1;
        const moveMessage: MoveServerMessage = {
            type: MSG.MOVE,
            payload: move
        };
        opponent.send(JSON.stringify(moveMessage));
        this.spectators.forEach(s => s.send(JSON.stringify(moveMessage)));
    }

    public removeSpectator(socket: WebSocket) {
        this.spectators = this.spectators.filter(s => s !== socket);
    }

    public playerDisconnected(disconnectedSocket: WebSocket) {
        if (this.hasPlayer(disconnectedSocket)) {
            const winner = disconnectedSocket === this.player1 ? "black" : "white";

            const gameOverMessage: GameOverServerMessage = {
                type: MSG.GAME_OVER,
                payload: { winner }
            };
            this.broadcast(JSON.stringify(gameOverMessage));
    
            this.onGameOver(winner);
        } else {
            this.removeSpectator(disconnectedSocket);
        }
    }

    private isCorrectPlayerTurn(socket: WebSocket): boolean {
        return (this.board.turn() === 'w' && socket === this.player1) ||
               (this.board.turn() === 'b' && socket === this.player2);
    }

    private broadcast(message: string) {
        this.player1.send(message);
        this.player2.send(message);
        this.spectators.forEach(s => {
            if (s.readyState === WebSocket.OPEN) {
                s.send(message)
            }
        });
    }
}