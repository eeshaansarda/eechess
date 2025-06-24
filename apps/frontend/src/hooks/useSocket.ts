import { useEffect, useState } from "react";

const WS_URL = "ws://localhost:8080";

function getPlayerId() {
    let playerId = localStorage.getItem('playerId');
    if (!playerId) {
        playerId = Math.random().toString(36).substring(2, 9);
        localStorage.setItem('playerId', playerId);
    }
    return playerId;
}

export function useSocket() {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const playerId = getPlayerId();
        const wsUrl = `${WS_URL}?playerId=${playerId}`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            setSocket(ws);
        }

        ws.onclose = () => {
            setSocket(null);
        }

        return () => {
            ws.close();
        }
    }, []);

    return socket;
}