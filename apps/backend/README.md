# Chess Game Backend

This is the backend server for a real-time multiplayer chess game. It uses WebSockets to handle communication between clients and manages game state, matchmaking, and player connections.

## Features

-   **Real-time Gameplay:** Uses WebSockets for low-latency communication.
-   **Matchmaking:** Automatically pairs two players to start a new game.
-   **State Management:** Powered by `chess.js` for robust game logic.
-   **Input Validation:** Ensures message integrity and security with `zod`.
-   **Graceful Disconnects:** Handles player disconnections and ends games appropriately.
-   **Draw Detection:** Recognizes draws from stalemate, threefold repetition, and insufficient material.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/)

### Installation

1.  Navigate to the `backend` directory:
    ```sh
    cd backend
    ```

2.  Install the required dependencies:
    ```sh
    npm install
    ```

## Running the Server

1.  **Build the Project**

    Compile the TypeScript code into JavaScript:
    ```sh
    npm run build
    ```

2.  **Start the Server**

    Run the compiled code:
    ```sh
    npm run start
    ```

    The WebSocket server will start and listen for connections on `ws://localhost:8080`.

## WebSocket API

The server communicates with clients using a JSON-based message protocol. All messages should have a `type` and an optional `payload`.

### Incoming Messages (Client to Server)

-   **`INIT_GAME`**: Sent by a client to request a new game. The server will add the client to a queue and start a game once another player joins.
    ```json
    {
      "type": "init_game"
    }
    ```

-   **`MOVE`**: Sent by a client to make a move in an ongoing game.
    ```json
    {
      "type": "move",
      "payload": {
        "move": {
          "from": "e2",
          "to": "e4"
        }
      }
    }
    ```

### Outgoing Messages (Server to Client)

-   **`INIT_GAME`**: Sent to each player when a new game starts, assigning their color.
    ```json
    {
      "type": "init_game",
      "payload": {
        "color": "white"
      }
    }
    ```

-   **`MOVE`**: Broadcast to the opponent after a valid move is made.
    ```json
    {
      "type": "move",
      "payload": {
        "from": "e2",
        "to": "e4"
      }
    }
    ```

-   **`GAME_OVER`**: Sent to both players when the game ends. The `winner` property will be `"white"`, `"black"`, or `null` in the case of a draw.
    ```json
    {
      "type": "game_over",
      "payload": {
        "winner": "white"
      }
    }
    ``` 