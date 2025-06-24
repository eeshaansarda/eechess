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
    }),
    z.object({
        type: z.literal(MSG.RECONNECT)
    })
]);

export class GameManager {
    private games: Game[];
    private pendingUser: User | null;
    private users: User[];
    private usersByPlayerId: Map<string, User>;
    private gamesAwaitingReconnection: Map<string, Game>;

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.usersByPlayerId = new Map<string, User>();
        this.gamesAwaitingReconnection = new Map<string, Game>();
    }

    addUser(user: User) {
        this.users.push(user);
        this.usersByPlayerId.set(user.playerId, user);
        this.addHandler(user);
    }

    removeUser(user: User) {
        this.users = this.users.filter(u => u !== user);
        this.usersByPlayerId.delete(user.playerId);
        
        const game = this.games.find(game => game.hasPlayer(user));
        if (game) {
            const disconnectedPlayerId = game.playerDisconnected(user);
            if (disconnectedPlayerId) {
                this.gamesAwaitingReconnection.set(disconnectedPlayerId, game);
                // setting a timeout to end the game if the player does not reconnect
                setTimeout(() => {
                    if (this.gamesAwaitingReconnection.has(disconnectedPlayerId)) {
                        console.log(`Game ${game.id} expired due to no reconnection.`);
                        game.forceEnd(disconnectedPlayerId);
                        this.gamesAwaitingReconnection.delete(disconnectedPlayerId);
                        this.games = this.games.filter(g => g.id !== game.id);
                    }
                }, 60 * 1000); // 60 seconds
            }
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
                        this.handleNewGame(user, message.payload);
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
                    case MSG.RECONNECT: {
                        this.handleReconnect(user);
                        break;
                    }
                }
            } catch(e) {
                console.error(e);
            }
        });
    }

    private handleReconnect(user: User) {
        const game = this.gamesAwaitingReconnection.get(user.playerId);
        if (game) {
            this.gamesAwaitingReconnection.delete(user.playerId);
            game.reconnectPlayer(user.playerId, user);
            console.log(`Player ${user.playerId} reconnected to game ${game.id}`);
        } else {
            console.log(`No game found for player ${user.playerId} to reconnect to.`);
        }
    }

    private handleNewGame(user: User, payload?: { gameId?: string }) {
        const { gameId } = payload || {};

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
            if (this.pendingUser.playerId === user.playerId) return;
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