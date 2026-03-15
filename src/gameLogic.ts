import type { Cell, Piece, PieceType, PlayerColor, GameState, GameAction, ScoredMove } from './models';
import { v4 as uuidv4 } from 'uuid';

// initial helper functions are moved here for easier testing (no React)

// helper to build initial inventory
export function makeInitialPieces(owner: PlayerColor): Piece[] {
  const types: PieceType[] = [];
  types.push(8 as PieceType);
  types.push(5 as PieceType, 5 as PieceType);
  types.push(3 as PieceType, 3 as PieceType, 3 as PieceType);
  types.push(2 as PieceType, 2 as PieceType, 2 as PieceType, 2 as PieceType, 2 as PieceType);
  types.push(1 as PieceType, 1 as PieceType, 1 as PieceType, 1 as PieceType, 1 as PieceType, 1 as PieceType, 1 as PieceType, 1 as PieceType);
  return types.map((t) => ({ id: uuidv4(), owner, type: t }));
}

export function makeEmptyBoard(): Cell[][] {
  return Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, () => ({ piece: null }))
  );
}

export function computeStrength(
  board: Cell[][],
  centerX: number,
  centerY: number,
  player: PlayerColor
) {
  let sum = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = centerX + dx;
      const y = centerY + dy;
      if (x < 0 || x >= 10 || y < 0 || y >= 10) continue;
      const p = board[y][x].piece;
      if (p && p.owner === player) {
        sum += p.type;
      }
    }
  }
  return sum;
}

// compute total strength of all pieces on board for a player
export function getTotalBoardStrength(board: Cell[][], player: PlayerColor): number {
  let total = 0;
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const piece = board[y][x].piece;
      if (piece && piece.owner === player) {
        total += piece.type;
      }
    }
  }
  return total;
}

export const initialState: GameState = {
  board: makeEmptyBoard(),
  currentPhase: 'setup' as const,
  currentPlayer: 'red' as PlayerColor,
  playerPieces: {
    red: makeInitialPieces('red'),
    blue: makeInitialPieces('blue'),
  },
  computerPlayer: null,
};

// ---------------------------------------------------------------------------
// AI helpers
// ---------------------------------------------------------------------------

/**
 * Returns all valid king-moves the given player can make in the current state,
 * together with the "reward" (net score gain for that player after the move).
 *
 * A move is accepted only when:
 *   - The piece belongs to the player whose turn it is.
 *   - The target is exactly 1 square away (king rule).
 *   - If the target is empty    → reward = 0 (pure repositioning).
 *   - If the target is occupied by an opponent:
 *       attacker total-strength > defender total-strength → capture succeeds
 *       reward = captured piece type value (positive gain)
 *       attacker total-strength <= defender total-strength → capture fails
 *       reward = negative (piece lost), move is excluded.
 */
export function computeValidMoves(state: GameState, player: PlayerColor): ScoredMove[] {
  const moves: ScoredMove[] = [];
  const opponent: PlayerColor = player === 'red' ? 'blue' : 'red';
  const board = state.board;

  for (let fy = 0; fy < 10; fy++) {
    for (let fx = 0; fx < 10; fx++) {
      const piece = board[fy][fx].piece;
      if (!piece || piece.owner !== player) continue;

      // 8 neighbours (king moves)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const tx = fx + dx;
          const ty = fy + dy;
          if (tx < 0 || tx >= 10 || ty < 0 || ty >= 10) continue;

          const target = board[ty][tx].piece;

          if (!target) {
            // empty square – always valid, reward 0
            moves.push({ from: { x: fx, y: fy }, to: { x: tx, y: ty }, reward: 0 });
          } else if (target.owner === opponent) {
            // attack – see if it would succeed
            const atkSum = computeStrength(board, tx, ty, player);
            const defSum = computeStrength(board, tx, ty, opponent);
            if (atkSum > defSum) {
              // successful capture: gain the value of the captured piece
              moves.push({
                from: { x: fx, y: fy },
                to: { x: tx, y: ty },
                reward: target.type,
              });
            }
            // else: would fail → skip (not worthwhile)
          }
          // friendly piece on target → illegal, skip
        }
      }
    }
  }

  return moves;
}

/**
 * Greedily picks the move with the highest reward for `player`.
 * Ties are broken at random so the CPU doesn't always prefer the same square.
 * Returns null when no valid moves are available.
 */
export function chooseBestMove(state: GameState, player: PlayerColor): ScoredMove | null {
  const moves = computeValidMoves(state, player);
  if (moves.length === 0) return null;

  const maxReward = Math.max(...moves.map((m) => m.reward));
  const best = moves.filter((m) => m.reward === maxReward);
  return best[Math.floor(Math.random() * best.length)];
}

// debugging helper
function logBoard(board: Cell[][]) {
  console.log('board state:');
  board.forEach((row) => {
    const line = row
      .map((cell) => {
        if (!cell.piece) return '--';
        const p = cell.piece;
        return `${p.owner[0].toUpperCase()}${p.type}`;
      })
      .join(' ');
    console.log(line);
  });
}

// simple in-place shuffle
function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// helper to check adjacency (one square in any direction, not the same cell)
function isAdjacent(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0);
}


/**
 * Game reducer that processes all game actions.
 * This is pure game logic independent of React.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  console.log('gameReducer action', action);
  switch (action.type) {
    case 'randomize': {
      console.log('handling randomize');
      // copy board and get list of empty positions
      const board = state.board.map((row) => row.map((cell) => ({ ...cell })));
      const empties: { x: number; y: number }[] = [];
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          if (!board[y][x].piece) {
            empties.push({ x, y });
          }
        }
      }
      shuffleArray(empties);
      let idx = 0;
      // place all remaining pieces in arbitrary order (red then blue)
      (['red', 'blue'] as PlayerColor[]).forEach((color) => {
        state.playerPieces[color].forEach((piece) => {
          if (idx >= empties.length) return; // nothing left
          const pos = empties[idx++];
          board[pos.y][pos.x].piece = { ...piece, x: pos.x, y: pos.y };
        });
      });
      const newState: GameState = {
        ...state,
        board,
        playerPieces: { red: [], blue: [] },
        currentPhase: 'play',
        currentPlayer: 'red',
      };
      console.log('board after randomize:');
      logBoard(newState.board);
      return newState;
    }
    case 'drop': {
      console.log('handling drop');
      const { piece, x, y } = action;

      // ignore duplicate drops when piece already placed here
      const existing = state.board[y][x].piece;
      if (existing && existing.id === piece.id) {
        console.log('drop ignored - already placed', piece.id);
        return state;
      }

      // placement from box (no coordinates yet)
      if (piece.x === undefined || piece.y === undefined) {
        if (piece.owner !== state.currentPlayer) {
          console.log('place rejected - wrong owner', piece.owner, state.currentPlayer);
          return state;
        }
        // clone every row and cell so we don't mutate previous state
        const board = state.board.map((row) => row.map((cell) => ({ ...cell })));
        if (board[y][x].piece) {
          console.log('place rejected - occupied');
          return state;
        }
        console.log('placing piece at', x, y);
        // give the piece its coordinates when placed
        const placed: Piece = { ...piece, x, y };
        board[y][x].piece = placed;
        // remove placed piece from inventory (id match)
        const pieces = state.playerPieces[piece.owner].filter((p) => p.id !== piece.id);
        const playerPieces = { ...state.playerPieces, [piece.owner]: pieces };
        const nextPlayer: PlayerColor = state.currentPlayer === 'red' ? 'blue' : 'red';
        let nextPhase = state.currentPhase;
        if (
          state.currentPhase === 'setup' &&
          playerPieces.red.length === 0 &&
          playerPieces.blue.length === 0
        ) {
          nextPhase = 'play';
        }
        console.log('place success, newPhase', nextPhase, 'nextPlayer', nextPlayer);
        const newStatePlacement = { ...state, board, playerPieces, currentPlayer: nextPlayer, currentPhase: nextPhase };
        console.log('board after drop/place:');
        logBoard(newStatePlacement.board);
        return newStatePlacement;
      }

      // moving piece from board (coordinates provided on piece)
      if (piece.x !== undefined && piece.y !== undefined) {
        // only current player may move pieces
        if (piece.owner !== state.currentPlayer) {
          console.log('move rejected - not your piece', piece.owner, state.currentPlayer);
          return state;
        }
        const from = { x: piece.x, y: piece.y };
        // deep clone every cell again
        const boardCopy = state.board.map((row) => row.map((cell) => ({ ...cell })));
        const target = boardCopy[y][x].piece;
        // enforce adjacency rule
        if (!isAdjacent(from, { x, y })) {
          console.log('attack rejected - not adjacent', from, { x, y });
          return state;
        }
        // if attacking opponent
        if (target && target.owner !== piece.owner) {
          const attacker = boardCopy[from.y][from.x].piece;
          const defender = target;
          if (attacker && defender) {
            const atkSum = computeStrength(boardCopy, x, y, attacker.owner);
            const defSum = computeStrength(boardCopy, x, y, defender.owner);
            if (atkSum > defSum) {
              boardCopy[y][x].piece = { ...attacker, x, y };
            }
            // defender stays if atkSum <= defSum
          }
          boardCopy[from.y][from.x].piece = null;
        } else {
          // normal move
          boardCopy[from.y][from.x].piece = null;
          boardCopy[y][x].piece = { ...piece, x, y };
        }
        const nextPlayer: PlayerColor = state.currentPlayer === 'red' ? 'blue' : 'red';
        const newStateMove = { ...state, board: boardCopy, currentPlayer: nextPlayer };
        console.log('board after drop/move:');
        logBoard(newStateMove.board);
        return newStateMove;
      }
      return state;
    }
    case 'place': {
      console.log('handling place');
      const { piece, x, y } = action;

      // Validate the piece belongs to current player
      if (piece.owner !== state.currentPlayer) {
        console.log('place rejected - wrong owner', piece.owner, state.currentPlayer);
        return state;
      }

      const board = state.board.map((row) => row.slice());
      if (board[y][x].piece) {
        console.log('place rejected - occupied');
        return state;
      }
      console.log('placing piece at', x, y);
      board[y][x].piece = piece;
      // remove piece from inventory
      // remove placed piece by id
      const pieces = state.playerPieces[piece.owner].filter((p) => p.id !== piece.id);
      const playerPieces = { ...state.playerPieces, [piece.owner]: pieces };
      const nextPlayer: PlayerColor = state.currentPlayer === 'red' ? 'blue' : 'red';
      let nextPhase = state.currentPhase;
      // check if blue just placed last piece -> start
      if (
        state.currentPhase === 'setup' &&
        playerPieces.red.length === 0 &&
        playerPieces.blue.length === 0
      ) {
        nextPhase = 'play';
      }
      console.log('place success, newPhase', nextPhase, 'nextPlayer', nextPlayer);
      const newStatePlace = { ...state, board, playerPieces, currentPlayer: nextPlayer, currentPhase: nextPhase };
      console.log('board after place:');
      logBoard(newStatePlace.board);
      return newStatePlace;
    }
    case 'start': {
      const newStateStart: GameState = { ...state, currentPhase: 'play' };
      console.log('board after start:');
      logBoard(newStateStart.board);
      return newStateStart;
    }
    case 'move': {
      console.log('handling move');
      // Only allow moves during play phase
      if (state.currentPhase !== 'play') {
        console.log('move rejected - not play phase');
        return state;
      }
      const { from, to } = action;
      // enforce king-move rule: target must be exactly 1 square away
      if (!isAdjacent(from, to)) {
        console.log('move rejected - not adjacent (king move only)', from, to);
        return state;
      }
      // Deep-clone every cell so mutations don't bleed into previous state.
      const board = state.board.map((row) => row.map((cell) => ({ ...cell })));
      const piece = board[from.y][from.x].piece;
      if (!piece) {
        console.log('move rejected - no piece at from');
        return state;
      }
      if (piece.owner !== state.currentPlayer) {
        console.log('move rejected - not your piece', piece.owner, state.currentPlayer);
        return state;
      }
      board[from.y][from.x] = { piece: null };
      board[to.y][to.x] = { piece: { ...piece, x: to.x, y: to.y } };
      const nextPlayer: PlayerColor = state.currentPlayer === 'red' ? 'blue' : 'red';
      console.log('move success, next player', nextPlayer);
      const newStateMove = { ...state, board, currentPlayer: nextPlayer };
      console.log('board after move:');
      logBoard(newStateMove.board);
      return newStateMove;
    }
    case 'attack': {
      console.log('handling attack');
      // Only allow attacks during play phase
      if (state.currentPhase !== 'play') {
        console.log('attack rejected - not play phase');
        return state;
      }

      const { from, to } = action;
      // adjacency enforcement
      if (!isAdjacent(from, to)) {
        console.log('attack rejected - not adjacent', from, to);
        return state;
      }
      // Deep-clone every cell so mutations don't bleed into previous state.
      const board = state.board.map((row) => row.map((cell) => ({ ...cell })));
      const attacker = board[from.y][from.x].piece;
      const defender = board[to.y][to.x].piece;
      if (!attacker || !defender) {
        console.log('attack rejected - missing attacker/defender');
        return state;
      }
      if (attacker.owner !== state.currentPlayer) {
        console.log('attack rejected - not your piece', attacker.owner, state.currentPlayer);
        return state;
      }
      // compute sums
      const atkSum = computeStrength(board, to.x, to.y, attacker.owner);
      const defSum = computeStrength(board, to.x, to.y, defender.owner);
      if (atkSum > defSum) {
        // attacker wins, occupying square
        board[to.y][to.x] = { piece: { ...attacker, x: to.x, y: to.y } };
      }
      // defender holds or wins; attacker removed, square unchanged either way
      board[from.y][from.x] = { piece: null };
      const nextPlayer: PlayerColor = state.currentPlayer === 'red' ? 'blue' : 'red';
      console.log('attack resolved, next player', nextPlayer);
      const newStateAttack = { ...state, board, currentPlayer: nextPlayer };
      console.log('board after attack:');
      logBoard(newStateAttack.board);
      return newStateAttack;
    }
    case 'end': {
      const newStateEnd: GameState = { ...state, currentPhase: 'finished' };
      console.log('board after end:');
      logBoard(newStateEnd.board);
      return newStateEnd;
    }
    case 'setComputerPlayer': {
      return { ...state, computerPlayer: action.player };
    }
    case 'startVsComputer': {
      // Atomically randomize the board AND set the computer player in one dispatch,
      // so there is no window where computerPlayer is null when the useEffect fires.
      // Clear all existing pieces first so we start from a blank board.
      const board = state.board.map((row) => row.map(() => ({ piece: null })));
      const empties: { x: number; y: number }[] = [];
      for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
          empties.push({ x, y });
        }
      }
      shuffleArray(empties);
      let idx = 0;
      // Use fresh pieces from the initial inventory (ignore whatever is in state)
      (['red', 'blue'] as PlayerColor[]).forEach((color) => {
        initialState.playerPieces[color].forEach((piece) => {
          if (idx >= empties.length) return;
          const pos = empties[idx++];
          board[pos.y][pos.x].piece = { ...piece, x: pos.x, y: pos.y };
        });
      });
      const newState: GameState = {
        ...state,
        board,
        playerPieces: { red: [], blue: [] },
        currentPhase: 'play',
        currentPlayer: 'red',
        computerPlayer: action.cpuPlayer,
      };
      console.log('startVsComputer: cpu =', action.cpuPlayer);
      logBoard(newState.board);
      return newState;
    }
    default:
      return state;
  }
}
