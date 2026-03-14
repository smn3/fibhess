import React, { useContext, useCallback } from 'react';
import { GameContext } from '../GameContext';
import { Square } from './Square';
import type { Piece as PieceModel } from '../models';

export const Board: React.FC = () => {
  const context = useContext(GameContext);
  if (!context) return null;
  const { state, dispatch } = context;
  //console.log('Board render', state.board);

  // keep track of last processed drop to avoid duplicates
  const lastDropRef = React.useRef<{id:string,x:number,y:number}|null>(null);

  const handleDrop = useCallback((piece: PieceModel, x: number, y: number) => {
    // ignore repeat dispatches for same piece/target
    if (lastDropRef.current &&
        lastDropRef.current.id === piece.id &&
        lastDropRef.current.x === x &&
        lastDropRef.current.y === y) {
      console.log('handleDrop skipped duplicate', piece.id, x, y);
      return;
    }
    lastDropRef.current = { id: piece.id, x, y };
    console.log('handleDrop invoked', { piece, x, y });
    dispatch({ type: 'drop', piece, x, y });
  }, [dispatch]);

  return (
    <div style={{ display: 'inline-block' }}>
      {state.board.map((row, y) => (
        <div key={y} style={{ display: 'flex' }}>
          {row.map((cell, x) => (
            <Square
              key={`${x}-${y}`}
              x={x}
              y={y}
              piece={cell.piece}
              onDrop={handleDrop}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
