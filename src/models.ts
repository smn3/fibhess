export type PlayerColor = 'red' | 'blue';
export type PieceType = 1 | 2 | 3 | 5 | 8;

export interface Piece {
  id: string;
  owner: PlayerColor;
  type: PieceType;
  x?: number;
  y?: number;
}

export interface Cell {
  piece: Piece | null;
}

export type GameStage = 'setup' | 'play' | 'finished';

export interface GameState {
  board: Cell[][];
  currentPhase: 'setup' | 'play' | 'finished';
  currentPlayer: PlayerColor;
  // inventory now contains full Piece objects (no x/y) so ids stay stable
  playerPieces: Record<PlayerColor, Piece[]>;
  /** Which player (if any) is controlled by the computer. */
  computerPlayer: PlayerColor | null;
}

/** A candidate move with the net score gain it produces for the moving player. */
export interface ScoredMove {
  from: { x: number; y: number };
  to: { x: number; y: number };
  reward: number;
}

export type GameAction =
  | { type: 'place'; piece: Piece; x: number; y: number }
  | { type: 'move'; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: 'attack'; from: { x: number; y: number }; to: { x: number; y: number } }
  | { type: 'drop'; piece: Piece; x: number; y: number }
  | { type: 'start' }
  | { type: 'end' }
  | { type: 'randomize' }
  | { type: 'setComputerPlayer'; player: PlayerColor | null }
  | { type: 'startVsComputer'; cpuPlayer: PlayerColor };

