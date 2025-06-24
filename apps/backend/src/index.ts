import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager.js';
import { User } from './User.js';

const app = express();
const PORT = 8080;
const server = http.createServer(app);

app.get('/', (req: Request, res: Response) => {
    res.send('Hello, world!');
});

const wss = new WebSocketServer({ server });
const gameManager = new GameManager();

wss.on('connection', (ws) => {
    const user = new User(ws);
    gameManager.addUser(user);
    console.log("Users connected: ", gameManager.usersSize());

    user.on('close', () => {
        console.log("Connection closed");
        gameManager.removeUser(user);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});