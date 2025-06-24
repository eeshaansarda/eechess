import { WebSocketServer, WebSocket } from 'ws';
import { GameManager } from './GameManager.js';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });
const gameManager = new GameManager();

wss.on('connection', (ws: WebSocket) => {
    // create new user
    gameManager.addUser(ws);

    ws.on('disconnect', () => gameManager.removeUser(ws));
});

setInterval(() => {
    console.log("Users connected: ", gameManager.usersSize());
}, 10000);
