import React, { createContext, useContext, useState, useCallback } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Board, generateBoard, revealCell, toggleFlag, checkWin, countFlags, getMinesCount } from './minesweeperLogic';

interface GameSettings {
  width: number;
  height: number;
  cellSize: number;
}

const SettingsContext = createContext<{
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
} | null>(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
  return ctx;
};

const numberEmojis: { [key: number]: string } = {
  1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣',
};

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-amber-50">
      <header className="flex justify-center px-6 py-4 border-b border-amber-200">
        <h1 className="text-2xl font-bold text-gray-800">Настройки игры</h1>
      </header>
      <main className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-lg space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700">Ширина поля (X)</label>
            <input
              type="number" min={5} max={50} value={settings.width}
              onChange={e => setSettings({ ...settings, width: +e.target.value })}
              className="w-28 border border-amber-300 rounded-md px-2 py-1.5 text-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700">Высота поля (Y)</label>
            <input
              type="number" min={5} max={50} value={settings.height}
              onChange={e => setSettings({ ...settings, height: +e.target.value })}
              className="w-28 border border-amber-300 rounded-md px-2 py-1.5 text-lg"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700">Размер клетки (px)</label>
            <input
              type="number" min={15} max={35} value={settings.cellSize}
              onChange={e => setSettings({ ...settings, cellSize: +e.target.value })}
              className="w-28 border border-amber-300 rounded-md px-2 py-1.5 text-lg"
            />
          </div>
          <button
            onClick={() => navigate('/game')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-md text-xl font-semibold"
          >
            Начать игру
          </button>
        </div>
      </main>
    </div>
  );
};

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { width, height, cellSize } = settings;

  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [board, setBoard] = useState<Board | null>(null);
  const [boardGenerated, setBoardGenerated] = useState(false);
  const totalMines = getMinesCount(width, height, 'normal');

  const resetGame = useCallback(() => {
    setBoard(null);
    setBoardGenerated(false);
    setGameStatus('playing');
  }, []);

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (gameStatus !== 'playing') return;

      if (!boardGenerated) {
        const newBoard = generateBoard(width, height, totalMines, { x, y });
        setBoard(newBoard);
        setBoardGenerated(true);
        revealCell(newBoard, x, y);
        if (checkWin(newBoard)) {
          setGameStatus('won');
        }
        setBoard(newBoard.map(row => [...row]));
        return;
      }

      if (!board) return;
      const cell = board[y][x];
      if (cell.revealed || cell.flagged) return;

      const newBoard = board.map(row => row.map(c => ({ ...c })));
      const success = revealCell(newBoard, x, y);
      if (!success) {
        setGameStatus('lost');
      } else if (checkWin(newBoard)) {
        setGameStatus('won');
      }
      setBoard(newBoard);
    },
    [gameStatus, boardGenerated, board, width, height, totalMines]
  );

  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, x: number, y: number) => {
      e.preventDefault();
      if (gameStatus !== 'playing' || !board) return;
      const newBoard = board.map(row => row.map(cell => ({ ...cell })));
      toggleFlag(newBoard, x, y);
      setBoard(newBoard);
    },
    [gameStatus, board]
  );

  const renderHeaderTitle = () => {
    if (gameStatus === 'won') return <h1 className="text-2xl font-bold text-green-600">Победа!</h1>;
    if (gameStatus === 'lost') return <h1 className="text-2xl font-bold text-red-600">Поражение</h1>;
    return <h1 className="text-2xl font-bold text-gray-800">Сапёр</h1>;
  };

  const renderGrid = () => {
    const cellStyle = { width: cellSize, height: cellSize, boxSizing: 'border-box' as const };

    if (!board) {
      const rows = [];
      for (let y = 0; y < height; y++) {
        const cells = [];
        for (let x = 0; x < width; x++) {
          cells.push(
            <div
              key={`${x}-${y}`}
              className="border border-gray-400 bg-white cursor-pointer hover:bg-gray-100"
              style={cellStyle}
              onClick={() => handleCellClick(x, y)}
              onContextMenu={(e) => handleCellRightClick(e, x, y)}
            />
          );
        }
        rows.push(<div key={y} style={{ display: 'flex' }}>{cells}</div>);
      }
      return <div className="inline-block">{rows}</div>;
    }

    const rows = [];
    for (let y = 0; y < height; y++) {
      const cells = [];
      for (let x = 0; x < width; x++) {
        const cell = board[y][x];
        let content: React.ReactNode = '';
        let cellClass = 'border border-gray-400 bg-white';

        if (cell.revealed) {
          if (cell.mine) {
            content = '💥';
            cellClass = 'border border-gray-400 bg-red-200';
          } else if (cell.adjacentMines > 0) {
            content = numberEmojis[cell.adjacentMines];
            cellClass = 'border border-gray-400 bg-gray-200';
          } else {
            cellClass = 'border border-gray-400 bg-gray-200';
          }
        } else {
          if (cell.flagged) {
            content = '🚩';
            cellClass = 'border border-gray-400 bg-amber-100';
          } else {
            cellClass = 'border border-gray-400 bg-white hover:bg-gray-100 cursor-pointer';
          }
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClass + ' flex items-center justify-center font-bold text-sm select-none'}
            style={cellStyle}
            onClick={() => handleCellClick(x, y)}
            onContextMenu={(e) => handleCellRightClick(e, x, y)}
          >
            {content}
          </div>
        );
      }
      rows.push(<div key={y} style={{ display: 'flex' }}>{cells}</div>);
    }

    return <div className="inline-block">{rows}</div>;
  };

  return (
    <div className="h-full flex flex-col bg-amber-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
        <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded hover:bg-amber-100 text-xl" title="Настройки">←</button>
        <div className="flex items-center gap-4">
          {renderHeaderTitle()}
          {board && gameStatus === 'playing' && (
            <span className="text-sm font-mono text-gray-600">🚩 {totalMines - countFlags(board)}</span>
          )}
        </div>
        <button onClick={resetGame} className="w-10 h-10 flex items-center justify-center rounded hover:bg-amber-100 text-xl" title="Рестарт">↻</button>
      </header>
      <main className="flex-1 flex items-center justify-center p-2">
        {renderGrid()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<GameSettings>({
    width: 20,
    height: 20,
    cellSize: 25,
  });

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<SettingsPage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </MemoryRouter>
    </SettingsContext.Provider>
  );
};

export default App;