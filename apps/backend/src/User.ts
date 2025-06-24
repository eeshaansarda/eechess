import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

export class User extends EventEmitter {
    public readonly playerId: string;
    private socket: WebSocket;

    constructor(socket: WebSocket, existingPlayerId?: string) {
        super();
        this.socket = socket;
        this.playerId = existingPlayerId || Math.random().toString(36).substring(2, 9);

        this.socket.on('message', (data) => {
            this.emit('message', data.toString());
        });

        this.socket.on('close', () => {
            this.emit('close');
        });
    }

    public send(message: string) {
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(message);
        }
    }
}