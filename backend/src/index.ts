import { WebSocketServer, WebSocket } from 'ws';
import { GameManager } from './GameManager';

const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();

wss.on('connection', (ws: WebSocket) => {
    // create new user
    gameManager.addUser(ws);

    ws.on('disconnect', () => gameManager.removeUser(ws))
    ws.send('hi');
});

