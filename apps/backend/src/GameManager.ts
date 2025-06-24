import { User } from "./User.js";
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
    private pendingUser: User | null;
    private users: User[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser(user: User) {
        this.users.push(user);
        this.addHandler(user);
    }

    removeUser(user: User) {
        this.users = this.users.filter(u => u !== user);
        
        const game = this.games.find(game => game.hasPlayer(user));
        if (game) {
            game.playerDisconnected(user);
            return;
        }

        const spectatorGame = this.games.find(g => g.removeSpectator(user));
        if (spectatorGame) {
            spectatorGame.removeSpectator(user);
        }

        if (user === this.pendingUser) {
            this.pendingUser = null;
        }
    }

    usersSize(): number {
        return this.users.length;
    }

    private addHandler(user: User){
        user.on('message', (data) => {
            try {
                const rawMessage = JSON.parse(data.toString());
                const message = messageSchema.parse(rawMessage);
                
                switch (message.type) {
                    case MSG.JOIN_GAME:
                        this.handleNewGame(user, message.payload?.gameId);
                        break;
                    case MSG.MAKE_MOVE: {
                        const game = this.games.find(game => game.hasPlayer(user));
                        if (game) {
                            game.makeMove(user, message.payload.move);
                        }
                        break;
                    }
                    case MSG.RESIGN: {
                        const game = this.games.find(game => game.hasPlayer(user));
                        if (game) {
                            game.resign(user);
                        }
                        break;
                    }
                }
            } catch(e) {
                console.error(e);
            }
        });
    }

    private handleNewGame(user: User, gameId?: string) {
        if (gameId) {
            const game = this.games.find(g => g.id === gameId);
            if (game) {
                game.addSpectator(user);
                console.log(`Spectator added to game ${gameId}`);
            } else {
                console.error(`Game not found: ${gameId}`);
            }
            return;
        }

        if(this.pendingUser) {
            const game = new Game(this.pendingUser, user, (winner: string) => {
                console.log(`Game over. Winner: ${winner}. Removing game.`);
                this.games = this.games.filter(g => g !== game);
            });
            this.games.push(game);
            this.pendingUser = null;
        } else {
            this.pendingUser = user;
        }
    }
}