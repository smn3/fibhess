import React, { createContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { GameState, GameAction } from './models';
import { gameReducer, initialState as storedInitial, chooseBestMove } from './gameLogic';

// we'll derive initialState inside to remain typed
const initialState: typeof storedInitial = storedInitial;

export type { GameState, GameAction };

// initialState imported from gameLogic
export { storedInitial as initialState };

interface GameProviderProps {
  children: ReactNode;
}

export const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export const GameProvider = ({ children }: GameProviderProps) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Auto-play the computer's turn whenever it becomes the computer's move.
  useEffect(() => {
    const { computerPlayer, currentPlayer, currentPhase } = state;
    if (
      currentPhase !== 'play' ||
      computerPlayer === null ||
      currentPlayer !== computerPlayer
    ) {
      return;
    }

    // Small delay so the human can see the board update before the CPU moves.
    const timer = setTimeout(() => {
      const best = chooseBestMove(state, computerPlayer);
      if (best) {
        dispatch({ type: 'move', from: best.from, to: best.to });
      } else {
        // No valid move – skip turn (pass).
        console.log('CPU has no valid moves, passing.');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [state]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};
