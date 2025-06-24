import { WebSocket } from "ws";
import { Game } from "./Game.js";
import { MSG } from '@eechess/shared'
import { z } from 'zod';

const messageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal(MSG.JOIN_GAME),
        payload: z.object({
            gameId: z.string().optional()
        }).optional()
    }),
    z.object({
        type: z.literal(MSG.MAKE_MOVE),
        payload: z.object({
            move: z.object({
                from: z.string(),
                to: z.string(),
                promotion: z.string().optional()
            })
        })
    }),
    z.object({
        type: z.literal(MSG.RESIGN)
    })
]);

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
                const rawMessage = JSON.parse(data.toString());
                const message = messageSchema.parse(rawMessage);
                
                switch (message.type) {
                    case MSG.JOIN_GAME:
                        this.handleNewGame(socket, message.payload?.gameId);
                        break;
                    case MSG.MAKE_MOVE: {
                        const game = this.games.find(game => game.hasPlayer(socket));
                        if (game) {
                            game.makeMove(socket, message.payload.move);
                        }
                        break;
                    }
                    case MSG.RESIGN: {
                        const game = this.games.find(game => game.hasPlayer(socket));
                        if (game) {
                            game.resign(socket);
                        }
                        break;
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