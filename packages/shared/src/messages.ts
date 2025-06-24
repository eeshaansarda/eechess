export const MSG = {
  JOIN_GAME: "joinGame",
  INIT_GAME: "initGame",
  MAKE_MOVE: "makeMove",
  MOVE: "move",
  GAME_STATE: "gameState",
  GAME_OVER: "gameOver",
  ERROR: "error",
} as const;

// Client to Server
export type ClientEvents = "joinGame" | "makeMove" | "resign";

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
};

export type MakeMoveClientMessage = {
    type: typeof MSG.MAKE_MOVE;
    payload: {
        move: MovePayload;
    }
};

export type ClientMessage = JoinGameClientMessage | MakeMoveClientMessage;

// Server Messages
export type InitGameServerMessage = {
    type: typeof MSG.INIT_GAME;
    payload: {
        color: "white" | "black";
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

export type ServerMessage = InitGameServerMessage | MoveServerMessage | GameOverServerMessage;