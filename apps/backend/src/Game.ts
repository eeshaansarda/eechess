import { User } from "./User.js";
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
    private player1: User;
    private player2: User;
    private spectators: User[] = [];
    private board: Chess;
    private moves: MovePayload[];
    //private startTime: Date;
    private onGameOver: (winner: string) => void;

    constructor(player1: User, player2: User, onGameOver: (winner: string) => void) {
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

    hasPlayer(user: User) {
        return this.player1 === user || this.player2 === user;
    }

    addSpectator(user: User) {
        this.spectators.push(user);
        const gameStateMessage: GameStateServerMessage = {
            type: MSG.GAME_STATE,
            payload: {
                moves: this.moves,
                turn: this.board.turn(),
                fen: this.board.fen(),
                gameId: this.id
            }
        };
        user.send(JSON.stringify(gameStateMessage));
    }

    makeMove(user: User, move: MovePayload) {
        if (!this.isCorrectPlayerTurn(user)) return;

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

        const opponent = (user === this.player1) ? this.player2 : this.player1;
        const moveMessage: MoveServerMessage = {
            type: MSG.MOVE,
            payload: move
        };
        opponent.send(JSON.stringify(moveMessage));
        this.spectators.forEach(s => s.send(JSON.stringify(moveMessage)));
    }

    public resign(resigningUser: User) {
        if (!this.hasPlayer(resigningUser)) {
            return;
        }
    
        const winner = resigningUser === this.player1 ? "black" : "white";
    
        const gameOverMessage: GameOverServerMessage = {
            type: MSG.GAME_OVER,
            payload: { winner }
        };
        this.broadcast(JSON.stringify(gameOverMessage));

        this.onGameOver(winner);
    }

    public removeSpectator(user: User) {
        this.spectators = this.spectators.filter(s => s !== user);
    }

    public playerDisconnected(disconnectedUser: User) {
        if (this.hasPlayer(disconnectedUser)) {
            const winner = disconnectedUser === this.player1 ? "black" : "white";

            const gameOverMessage: GameOverServerMessage = {
                type: MSG.GAME_OVER,
                payload: { winner }
            };
            this.broadcast(JSON.stringify(gameOverMessage));
    
            this.onGameOver(winner);
        } else {
            this.removeSpectator(disconnectedUser);
        }
    }

    private isCorrectPlayerTurn(user: User): boolean {
        return (this.board.turn() === 'w' && user === this.player1) ||
               (this.board.turn() === 'b' && user === this.player2);
    }

    private broadcast(message: string) {
        this.player1.send(message);
        this.player2.send(message);
        this.spectators.forEach(s => {
            s.send(message);
        });
    }
}