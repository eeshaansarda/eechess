import { create } from 'zustand';
import { Chess, type Square } from 'chess.js';

interface GameState {
  game: Chess;
  started: boolean;
  playerColor: 'w' | 'b' | null;
  isSeeking: boolean;
  gameOver: boolean;
  gameResult: string | null;
  setGame: (game: Chess) => void;
  setStarted: (started: boolean) => void;
  setPlayerColor: (color: 'w' | 'b' | null) => void;
  setIsSeeking: (isSeeking: boolean) => void;
  setGameOver: (gameOver: boolean) => void;
  setGameResult: (result: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  game: new Chess(),
  started: false,
  playerColor: null,
  isSeeking: false,
  gameOver: false,
  gameResult: null,
  setGame: (game) => set({ game }),
  setStarted: (started) => set({ started }),
  setPlayerColor: (color) => set({ playerColor: color }),
  setIsSeeking: (isSeeking) => set({ isSeeking }),
  setGameOver: (gameOver) => set({ gameOver }),
  setGameResult: (result) => set({ gameResult: result }),
  resetGame: () => set({
    game: new Chess(),
    started: false,
    playerColor: null,
    isSeeking: false,
    gameOver: false,
    gameResult: null,
  }),
})); 