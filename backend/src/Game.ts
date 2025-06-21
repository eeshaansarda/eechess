import { WebSocket } from "ws";

export class Game {
    private player1: WebSocket;
    private player2: WebSocket;
    private board: null;
    private moves: null;
    private startTime: Date;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = null; // todo
        this.moves = null; // todo
        this.startTime = new Date();
    }
}