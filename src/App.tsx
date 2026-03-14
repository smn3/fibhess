import React from 'react';
import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { GameProvider, GameContext } from './GameContext';
import { Board } from './components/Board';
import { PlayerBox } from './components/PlayerBox';
import { BoardSizeContext } from './BoardSizeContext';
import { getTotalBoardStrength } from './gameLogic';
import type { PlayerColor } from './models';
import './App.css';

const COLS = 10;
const ROWS = 10;
const SIDEBAR_PX = 190; // sidebar width (landscape) or height (portrait)
const GAP = 8;

/** Measures the actual rendered size of a DOM element via ResizeObserver. */
function useElementSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

const WinModal: React.FC<{ winner: PlayerColor; onClose: () => void; onPlayAgain: () => void }> = ({
  winner, onClose, onPlayAgain,
}) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  }}>
    <div style={{
      background: '#1e1e2e', color: '#fff', borderRadius: '12px',
      padding: '32px 40px', minWidth: '280px', textAlign: 'center',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative',
    }}>
      <button onClick={onClose} aria-label="Close" style={{
        position: 'absolute', top: '10px', right: '14px',
        background: 'none', border: 'none', color: '#aaa',
        fontSize: '1.4em', cursor: 'pointer', lineHeight: 1,
      }}>×</button>
      <div style={{ fontSize: '2.5em', marginBottom: '8px' }}>
        {winner === 'red' ? '🔴' : '🔵'}
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: '1.6em' }}>{winner.toUpperCase()} wins!</h2>
      <p style={{ color: '#aaa', margin: '0 0 24px' }}>The opponent lost all their pieces.</p>
      <button onClick={onPlayAgain} style={{
        background: '#5566cc', color: '#fff', border: 'none',
        padding: '10px 28px', borderRadius: '6px', fontSize: '1em', cursor: 'pointer',
      }}>Play again</button>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const context = React.useContext(GameContext);
  if (!context) return null;
  const { state, dispatch } = context;

  const [dismissed, setDismissed] = React.useState(false);

  // Measure the root container — this is the ground truth for available space
  const rootRef = React.useRef<HTMLDivElement>(null);
  const { w: rootW, h: rootH } = useElementSize(rootRef);

  const isLandscape = rootW > rootH;

  // Cell size: largest integer that fits the board in the space left after the sidebar
  const cellSize = React.useMemo(() => {
    if (rootW === 0 || rootH === 0) return 10; // not measured yet
    let availW: number, availH: number;
    if (isLandscape) {
      availW = rootW - SIDEBAR_PX - GAP;
      availH = rootH;
    } else {
      availW = rootW;
      availH = rootH - SIDEBAR_PX - GAP;
    }
    return Math.max(4, Math.floor(Math.min(availW / COLS, availH / ROWS)));
  }, [rootW, rootH, isLandscape]);

  // Win detection
  const redStrength = getTotalBoardStrength(state.board, 'red');
  const blueStrength = getTotalBoardStrength(state.board, 'blue');
  let winner: PlayerColor | null = null;
  if (state.currentPhase === 'play') {
    if (redStrength === 0) winner = 'blue';
    else if (blueStrength === 0) winner = 'red';
  }

  React.useEffect(() => {
    if (state.currentPhase === 'setup') setDismissed(false);
  }, [state.currentPhase]);

  const vsComputerActive = state.computerPlayer !== null;

  const startVsComputer = () => {
    if (state.computerPlayer !== null) return;
    const cpuColor: PlayerColor = Math.random() < 0.5 ? 'red' : 'blue';
    dispatch({ type: 'startVsComputer', cpuPlayer: cpuColor });
  };

  const sidebar = (
    <div
      className="sidebar"
      style={isLandscape
        ? { width: SIDEBAR_PX, flexShrink: 0 }
        : { height: SIDEBAR_PX, flexShrink: 0 }
      }
    >
      <div className="player-box" style={{ opacity: state.currentPlayer === 'red' ? 1 : 0.55 }}>
        <PlayerBox player="red" />
      </div>
      <div className="player-box" style={{ opacity: state.currentPlayer === 'blue' ? 1 : 0.55 }}>
        <PlayerBox player="blue" />
      </div>
      <div className="controls">
        <button onClick={() => dispatch({ type: 'randomize' })}>Place random</button>
        <button
          onClick={startVsComputer}
          style={{ background: vsComputerActive ? '#4a4' : '#446', color: '#fff', border: 'none' }}
        >
          {vsComputerActive ? `vs CPU (${state.computerPlayer!.toUpperCase()})` : 'vs Computer'}
        </button>
        {vsComputerActive && (
          <button onClick={() => dispatch({ type: 'setComputerPlayer', player: null })}>
            2-player
          </button>
        )}
      </div>
    </div>
  );

  return (
    <BoardSizeContext.Provider value={cellSize}>
      <div
        ref={rootRef}
        className={`app-root ${isLandscape ? 'landscape' : 'portrait'}`}
      >
        {winner && !dismissed && (
          <WinModal
            winner={winner}
            onClose={() => setDismissed(true)}
            onPlayAgain={() => { setDismissed(false); window.location.reload(); }}
          />
        )}
        {/* Board area: fixed to exactly the computed board size, centered */}
        <div className="board-area">
          <Board />
        </div>
        {sidebar}
      </div>
    </BoardSizeContext.Provider>
  );
};

function App() {
  return (
    <GameProvider>
      <DndProvider options={HTML5toTouch}>
        <AppContent />
      </DndProvider>
    </GameProvider>
  );
}

export default App;
