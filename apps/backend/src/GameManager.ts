import { WebSocket } from "ws";
import { Game } from "./Game.js";
import { MSG } from '@eechess/shared'
import { z } from 'zod';

const moveMessageSchema = z.object({
    type: z.literal(MSG.MAKE_MOVE),
    payload: z.object({
        move: z.object({
            from: z.string(),
            to: z.string(),
            promotion: z.string().optional()
        })
    })
});

const joinGameMessageSchema = z.object({
    type: z.literal(MSG.JOIN_GAME),
    payload: z.object({
        gameId: z.string().optional()
    }).optional()
});

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.addHandler(socket);
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);
        
        const game = this.games.find(game => game.hasPlayer(socket));
        if (game) {
            game.playerDisconnected(socket);
            return;
        }

        const spectatorGame = this.games.find(g => g.removeSpectator(socket));
        if (spectatorGame) {
            spectatorGame.removeSpectator(socket);
        }

        if (socket === this.pendingUser) {
            this.pendingUser = null;
        }
    }

    usersSize(): number {
        return this.users.length;
    }

    private addHandler(socket: WebSocket){
        socket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                
                if (joinGameMessageSchema.safeParse(message).success) {
                    const parsedMessage = joinGameMessageSchema.parse(message);
                    this.handleNewGame(socket, parsedMessage.payload?.gameId);
                } else if (moveMessageSchema.safeParse(message).success) {
                    const parsedMessage = moveMessageSchema.parse(message);
                    const game = this.games.find(game => game.hasPlayer(socket));
                    if (game) {
                        game.makeMove(socket, parsedMessage.payload.move);
                    }
                }
            } catch(e) {
                console.error(e);
            }
        });
    }

    private handleNewGame(socket: WebSocket, gameId?: string) {
        if (gameId) {
            const game = this.games.find(g => g.id === gameId);
            if (game) {
                game.addSpectator(socket);
                console.log(`Spectator added to game ${gameId}`);
            } else {
                console.error(`Game not found: ${gameId}`);
            }
            return;
        }

        if(this.pendingUser) {
            const game = new Game(this.pendingUser, socket, (winner: string) => {
                console.log(`Game over. Winner: ${winner}. Removing game.`);
                this.games = this.games.filter(g => g !== game);
            });
            this.games.push(game);
            this.pendingUser = null;
        } else {
            this.pendingUser = socket;
        }
    }
}