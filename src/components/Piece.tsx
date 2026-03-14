import React, { useContext } from 'react';
import { useDrag } from 'react-dnd';
import { GameContext } from '../GameContext';
import { useCellSize } from '../BoardSizeContext';
import type { Piece as PieceModel } from '../models';

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

  const color = piece.owner === 'red' ? '#faa' : '#aaf';
  const cellSize = useCellSize();
  const pieceSize = Math.round(cellSize * 0.82);
  const fontSize = Math.max(10, Math.round(cellSize * 0.36));
  return (
    <div
      ref={drag as any}
      style={{
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: color,
        width: pieceSize,
        height: pieceSize,
        border: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'move',
        touchAction: 'none',
        fontSize,
        fontWeight: 'bold',
        borderRadius: 3,
        userSelect: 'none',
      }}
    >
      {piece.type}
    </div>
  );
};
