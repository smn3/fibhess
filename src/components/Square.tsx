import React from 'react';
import { useDrop } from 'react-dnd';
import type { Piece as PieceModel } from '../models';
import { Piece as PieceComponent } from './Piece';
import { useCellSize } from '../BoardSizeContext';

interface SquareProps {
  x: number;
  y: number;
  piece: PieceModel | null;
  onDrop: (piece: PieceModel, x: number, y: number) => void;
}

export const Square: React.FC<SquareProps> = ({ x, y, piece, onDrop }) => {
  const cellSize = useCellSize();
  //console.log('Square render', x, y, piece);
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'piece',
    drop: (item: PieceModel, monitor) => {
      if (monitor.didDrop()) return; // prevent duplicate nested drops
      // ignore if square already contains this exact piece (duplicate after update)
      if (piece && piece.id === item.id) {
        return;
      }
      onDrop(item, x, y);
    },
    canDrop: (item: PieceModel) => {
      // reject if the target square is occupied by the same player
      if (piece && piece.owner === item.owner) return false;
      // if the piece is already on the board, enforce king-move adjacency
      if (item.x !== undefined && item.y !== undefined) {
        const dx = Math.abs(item.x - x);
        const dy = Math.abs(item.y - y);
        const isAdjacent = dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
        if (!isAdjacent) return false;
      }
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [x, y, piece, onDrop]);

  const bgColor = (x + y) % 2 === 0 ? '#fff' : '#eee';
  const highlight = isOver && canDrop ? '#afa' : '';

  return (
    <div
      ref={drop as any}
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: highlight || bgColor,
        border: '1px solid #999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {piece && <PieceComponent piece={piece} />}
    </div>
  );
};
