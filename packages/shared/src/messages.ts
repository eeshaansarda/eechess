export const MSG = {
  JOIN_GAME: "joinGame",
  INIT_GAME: "initGame",
  MAKE_MOVE: "makeMove",
  MOVE: "move",
  GAME_STATE: "gameState",
  GAME_OVER: "gameOver",
  ERROR: "error",
  RESIGN: "resign",
  RECONNECT: "reconnect",
} as const;

// Client to Server
export type ClientEvents = "joinGame" | "makeMove" | "resign" | "reconnect";

// Server to Client
export type ServerEvents = "initGame" | "move" | "gameOver" | "gameState";

// Message Payloads
export type MovePayload = {
    from: string;
    to: string;
    promotion?: string;
}

// Client Messages
export type JoinGameClientMessage = {
    type: typeof MSG.JOIN_GAME;
    payload?: {
        gameId?: string;
    }
};

export type MakeMoveClientMessage = {
    type: typeof MSG.MAKE_MOVE;
    payload: {
        move: MovePayload;
    }
};

export type ResignClientMessage = {
    type: typeof MSG.RESIGN;
}

export type ReconnectClientMessage = {
    type: typeof MSG.RECONNECT;
}

export type ClientMessage = JoinGameClientMessage | MakeMoveClientMessage | ResignClientMessage | ReconnectClientMessage;

// Server Messages
export type InitGameServerMessage = {
    type: typeof MSG.INIT_GAME;
    payload: {
        color: "white" | "black";
        gameId: string;
        fen?: string;
        moves?: MovePayload[];
    }
}

export type MoveServerMessage = {
    type: typeof MSG.MOVE;
    payload: MovePayload;
}

export type GameOverServerMessage = {
    type: typeof MSG.GAME_OVER;
    payload: {
        winner: "white" | "black" | null;
    }
}

export type GameStateServerMessage = {
    type: typeof MSG.GAME_STATE;
    payload: {
        moves: MovePayload[];
        turn: "w" | "b";
        fen: string;
        gameId: string;
    }
}

export type ServerMessage = InitGameServerMessage | MoveServerMessage | GameOverServerMessage | GameStateServerMessage;