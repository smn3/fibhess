import React, { useContext } from 'react';
import { GameContext } from '../GameContext';
import type { PlayerColor } from '../models';
import { Piece as PieceComponent } from './Piece';
import { getTotalBoardStrength } from '../gameLogic';

export const PlayerBox: React.FC<{ player?: PlayerColor }> = ({ player }) => {
  const context = useContext(GameContext);
  if (!context) return null;
  const { state } = context;
  const { currentPlayer, playerPieces, board, computerPlayer } = state;

  const displayPlayer = player || currentPlayer;
  const inventory = playerPieces[displayPlayer];
  const boardStrength = getTotalBoardStrength(board, displayPlayer);

  const isCurrent = displayPlayer === currentPlayer;
  const isCPU = displayPlayer === computerPlayer;

  return (
    <div>
      <h3>
        {displayPlayer.toUpperCase()}{' '}
        {isCPU && <span style={{ color: '#88f', fontSize: '0.85em' }}>(CPU)</span>}
        {isCurrent && !isCPU && <span style={{ fontSize: '0.85em' }}> (Your turn)</span>}{' '}
        <span style={{ fontSize: '0.85em', fontWeight: 'normal' }}>
          Strength: {boardStrength}
        </span>
      </h3>
      <div className="pieces">
        {inventory.map((piece) => (
          <PieceComponent key={piece.id} piece={piece} />
        ))}
      </div>
    </div>
  );
};
