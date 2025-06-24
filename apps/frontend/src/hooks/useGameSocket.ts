import { useEffect } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "@/lib/store";
import { Chess } from "chess.js";
import { MSG, type ServerMessage, type JoinGameClientMessage, type MakeMoveClientMessage, type ResignClientMessage, type ReconnectClientMessage, type MovePayload } from "@eechess/shared";

export function useGameSocket() {
    const socket = useSocket();
    const {
        game,
        setGame,
        setStarted,
        setPlayerColor,
        setIsSeeking,
        setGameOver,
        setGameResult,
        setGameId,
        playerColor,
    } = useGameStore();

    useEffect(() => {
        if (!socket) return;

        const gameId = localStorage.getItem('gameId');
        if (gameId) {
            const message: ReconnectClientMessage = { type: MSG.RECONNECT };
            socket.send(JSON.stringify(message));
        }

        // Check for game ID in URL for spectating
        const urlParams = new URLSearchParams(window.location.search);
        const gameIdFromUrl = urlParams.get('gameId');
        if (gameIdFromUrl) {
            const message: JoinGameClientMessage = { type: MSG.JOIN_GAME, payload: { gameId: gameIdFromUrl } };
            socket.send(JSON.stringify(message));
        }

        socket.onmessage = (event) => {
            try {
                const message: ServerMessage = JSON.parse(event.data);
                handleServerMessage(message);
            } catch (error) {
                console.error("Error parsing message from server:", event.data, error);
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'isSeeking' && event.newValue === 'false') {
                setIsSeeking(false);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        }
    }, [socket, game, setGame, setPlayerColor, setStarted, setIsSeeking, setGameOver, setGameResult, playerColor, setGameId]);

    const handleServerMessage = (message: ServerMessage) => {
        switch (message.type) {
            case MSG.INIT_GAME:
                const newGame = message.payload.fen ? new Chess(message.payload.fen) : new Chess();
                setGame(newGame);
                setPlayerColor(message.payload.color === "white" ? "w" : "b");
                setStarted(true);
                setIsSeeking(false);
                setGameId(message.payload.gameId);
                localStorage.setItem('gameId', message.payload.gameId);
                localStorage.setItem('isSeeking', 'false');
                break;
            case MSG.GAME_STATE:
                setGame(new Chess(message.payload.fen));
                setPlayerColor(null);
                setStarted(true);
                setIsSeeking(false);
                setGameId(message.payload.gameId);
                break;
            case MSG.MOVE:
                const move = message.payload;
                const gameCopy = new Chess(game.fen());
                if (gameCopy.move(move)) {
                    setGame(gameCopy);
                } else {
                    console.warn("Invalid move received from server", move);
                }
                break;
            case MSG.GAME_OVER:
                handleGameOver(message.payload.winner);
                break;
            default:
                console.warn("No such message", message);
        }
    };

    const handleGameOver = (winner: "white" | "black" | null) => {
        setGameOver(true);
        const isDraw = !winner;
        localStorage.removeItem('gameId');
        localStorage.removeItem('isSeeking');

        if (isDraw) {
            setGameResult("Draw!");
        } else {
            if (playerColor) {
                // Player is participating in the game
                const playerWon = (winner === "white" && playerColor === "w") ||
                    (winner === "black" && playerColor === "b");
                setGameResult(`You ${playerWon ? 'won' : 'lost'}!`);
            } else {
                // Spectator is watching the game
                setGameResult(`${winner === "white" ? "White" : "Black"} won!`);
            }
        }

        setStarted(false);
        setPlayerColor(null);
    };

    const sendMove = (from: string, to: string, piece: string) => {
        if (!socket || !playerColor) return false;
        if (playerColor !== piece[0] || playerColor !== game.turn()) return false;

        const promotion = piece[1].toLowerCase() ?? "q";
        const gameCopy = new Chess(game.fen());

        try {
            const moveResult = gameCopy.move({ from, to, promotion });
            if (moveResult === null) {
                return false;
            }
            const move: MovePayload = { from, to, promotion };
            const message: MakeMoveClientMessage = { type: MSG.MAKE_MOVE, payload: { move } };
            socket.send(JSON.stringify(message));
            setGame(gameCopy);
            return true;
        } catch (e) {
            console.warn("Invalid move attempted:", { from, to }, e);
            return false;
        }
    };

    const startGame = () => {
        if (!socket) return;

        const isSeeking = localStorage.getItem('isSeeking');
        if (isSeeking === 'true') {
            // another tab is already seeking
            return;
        }

        setIsSeeking(true);
        localStorage.setItem('isSeeking', 'true');
        const message: JoinGameClientMessage = { type: MSG.JOIN_GAME };
        socket.send(JSON.stringify(message));
    };

    const spectateGame = (gameId: string) => {
        if (!socket || !gameId) return;
        const message: JoinGameClientMessage = { type: MSG.JOIN_GAME, payload: { gameId } };
        socket.send(JSON.stringify(message));
    };

    const resignGame = () => {
        if (!socket) return;
        const message: ResignClientMessage = { type: MSG.RESIGN };
        socket.send(JSON.stringify(message));
    };

    return {
        socket,
        sendMove,
        startGame,
        spectateGame,
        resignGame,
    };
} 