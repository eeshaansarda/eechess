import { WebSocket } from "ws";
import { Game } from "./Game";
import { INIT_GAME, MOVE } from './messages'

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
        
        if (socket === this.pendingUser) {
            this.pendingUser = null;
            return;
        }

        const game = this.games.find(game => game.hasPlayer(socket));
        if (game) {
            game.playerDisconnected(socket);
        }
    }

    usersSize(): number {
        return this.users.length;
    }

    private addHandler(socket: WebSocket){
        socket.on('message', (data) => {
            try{
                const message = JSON.parse(data.toString());
                if(message.type === INIT_GAME) {
                    this.handleNewGame(socket);
                } else if(message.type === MOVE) {
                    const game = this.games.find(game => game.hasPlayer(socket));
                    if(game) game.makeMove(socket, message.move)
                }
            } catch(e) {
                console.error(e);
            }
        });
    }

    private handleNewGame(socket: WebSocket) {
        if(this.pendingUser) {
            const game = new Game(this.pendingUser, socket, (winner) => {
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