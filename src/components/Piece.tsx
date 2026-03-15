import React, { useContext } from 'react';
import { useDrag } from 'react-dnd';
import { GameContext } from '../GameContext';
import { useCellSize } from '../BoardSizeContext';
import type { Piece as PieceModel } from '../models';

// Eagerly import all piece images so Vite bundles them correctly
const pieceImages: Record<string, string> = import.meta.glob(
  '/assets/*.png',
  { eager: true, import: 'default' }
) as Record<string, string>;

interface PieceProps {
  piece: PieceModel;
}

export const Piece: React.FC<PieceProps> = ({ piece }) => {
  const context = useContext(GameContext);
  const state = context ? context.state : null;
  const canDrag: boolean = !!(
    state &&
    state.currentPlayer === piece.owner &&
    state.currentPlayer !== state.computerPlayer &&
    ((piece.x === undefined && state.currentPhase === 'setup') ||
      (piece.x !== undefined && state.currentPhase === 'play'))
  );

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'piece',
    item: piece,
    canDrag: canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [canDrag]);

  const cellSize = useCellSize();
  const pieceSize = Math.round(cellSize * 0.98);
  const imgKey = `/assets/${piece.owner}_${piece.type}.png`;
  const imgSrc = pieceImages[imgKey];
  return (
    <div
      ref={drag as any}
      style={{
        opacity: isDragging ? 0.5 : 1,
        width: pieceSize,
        height: pieceSize,
        cursor: 'move',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <img
        src={imgSrc}
        alt={`${piece.owner} ${piece.type}`}
        style={{ width: '100%', height: '100%', display: 'block' }}
        draggable={false}
      />
    </div>
  );
};
