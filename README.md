# Chess

## Current flow
Send ws messages from two clients
{
  "type": "init_game"
}

Play a move
{
  "type": "move",
  "move": {
    "from": "e2",
    "to": "e4"
  }
}

## Features to add
- Add chess clock
- Add spectators
- Add state management
- Reconnecting (validation problem, need to add auth)(workaround can be storing user id in the frontend)