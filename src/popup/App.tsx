import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Board, generateBoard, revealCell, toggleFlag, checkWin, countFlags, defaultMinesCount } from './minesweeperLogic';
import flagImage from './assets/flag.png';
import mineImage from './assets/mine.png';

interface GameSettings {
  width: number;
  height: number;
  withTimer: boolean;
  cellSize: number;       
  timerDuration: number;  
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
            <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
              Ширина поля (X)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={50}
                value={settings.width}
                onChange={(e) => setSettings({ ...settings, width: +e.target.value })}
                className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                5…50
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
              Высота поля (Y)
            </label>
            <div className="relative">
              <input
                type="number"
                min={5}
                max={50}
                value={settings.height}
                onChange={(e) => setSettings({ ...settings, height: +e.target.value })}
                className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                5…50
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
              Размер клетки (px)
            </label>
            <div className="relative">
              <input
                type="number"
                min={15}
                max={35}
                value={settings.cellSize}
                onChange={(e) => setSettings({ ...settings, cellSize: +e.target.value })}
                className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                15…35
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="withTimer"
              checked={settings.withTimer}
              onChange={(e) => setSettings({ ...settings, withTimer: e.target.checked })}
              className="h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-400"
            />
            <label htmlFor="withTimer" className="text-lg text-gray-700">
              Игра со временем
            </label>
          </div>

          {settings.withTimer && (
            <div className="flex items-center justify-between">
              <label className="text-lg font-medium text-gray-700 whitespace-nowrap">
                Время на игру (сек)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={999}
                  value={settings.timerDuration}
                  onChange={(e) => setSettings({ ...settings, timerDuration: +e.target.value })}
                  className="w-28 border border-amber-300 rounded-md px-2 py-1.5 pr-10 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  10…999
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => navigate('/game')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-md text-xl font-semibold transition-colors"
          >
            Начать игру
          </button>
        </div>
      </main>
    </div>
  );
};

const HEADER_HEIGHT = 48;
const MAIN_PADDING = 16;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 550;

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { width, height, withTimer, cellSize, timerDuration } = settings;

  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const [board, setBoard] = useState<Board | null>(null);
  const [boardGenerated, setBoardGenerated] = useState(false);
  const totalMines = defaultMinesCount(width, height);

  const [sizeDiff, setSizeDiff] = useState<{ x: number; y: number } | null>(null);
  const windowIdRef = useRef<number | null>(null);

  useEffect(() => {
    chrome.windows.getCurrent((win) => {
      if (win?.id) {
        windowIdRef.current = win.id;
        const diffX = (win.width ?? DEFAULT_WIDTH) - window.innerWidth;
        const diffY = (win.height ?? DEFAULT_HEIGHT) - window.innerHeight;
        setSizeDiff({ x: diffX, y: diffY });
      }
    });
  }, []);

  const requestWindowResize = useCallback(
    (innerWidth: number, innerHeight: number) => {
      if (!windowIdRef.current || !sizeDiff) return;
      const outerW = innerWidth + sizeDiff.x;
      const outerH = innerHeight + sizeDiff.y;
      chrome.runtime.sendMessage({
        action: 'resizeGameWindow',
        windowId: windowIdRef.current,
        width: Math.ceil(outerW),
        height: Math.ceil(outerH),
      });
    },
    [sizeDiff]
  );

  const requestResizeRef = useRef(requestWindowResize);
  useEffect(() => {
    requestResizeRef.current = requestWindowResize;
  }, [requestWindowResize]);

  useEffect(() => {
    if (!sizeDiff || gameStatus !== 'playing') return;
    const innerW = width * cellSize + MAIN_PADDING;
    const innerH = height * cellSize + HEADER_HEIGHT + MAIN_PADDING;
    requestWindowResize(innerW, innerH);
  }, [gameStatus, width, height, cellSize, requestWindowResize, sizeDiff]);

  useEffect(() => {
    return () => {
      requestResizeRef.current?.(DEFAULT_WIDTH, DEFAULT_HEIGHT);
    };
  }, []);

  useEffect(() => {
    if (gameStatus === 'playing' && withTimer) {
      setRemainingTime(timerDuration);
      timerRef.current = window.setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null || prev <= 1) {
            stopTimer();
            setGameStatus('lost');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => stopTimer();
  }, [gameStatus, withTimer, timerDuration]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    stopTimer();
    setBoard(null);
    setBoardGenerated(false);
    setGameStatus('playing');
    setRemainingTime(null);
  }, [stopTimer]);

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
          stopTimer();
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
        stopTimer();
      } else if (checkWin(newBoard)) {
        setGameStatus('won');
        stopTimer();
      }

      setBoard(newBoard);
    },
    [gameStatus, boardGenerated, board, width, height, totalMines, stopTimer]
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

  const handleRestart = () => resetGame();

  const renderHeaderTitle = () => {
    if (gameStatus === 'won')
      return <h1 className="text-2xl font-bold text-green-600">Победа!</h1>;
    if (gameStatus === 'lost')
      return <h1 className="text-2xl font-bold text-red-600">Поражение</h1>;
    if (withTimer && remainingTime !== null)
      return <span className="text-2xl font-mono font-bold">{remainingTime}</span>;
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
        rows.push(
          <div key={y} style={{ display: 'flex' }}>
            {cells}
          </div>
        );
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
            content = (
              <img
                src={mineImage}
                alt="mine"
                style={{ width: cellSize, height: cellSize, imageRendering: 'auto' }}
              />
            );
            cellClass = 'border border-gray-400 bg-red-200';
          } else if (cell.adjacentMines > 0) {
            content = cell.adjacentMines;
            cellClass = 'border border-gray-400 bg-gray-200';
          } else {
            cellClass = 'border border-gray-400 bg-gray-200';
          }
        } else {
          if (cell.flagged) {
            content = (
              <img
                src={flagImage}
                alt="flag"
                style={{ width: cellSize, height: cellSize, imageRendering: 'auto' }}
              />
            );
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
      rows.push(
        <div key={y} style={{ display: 'flex' }}>
          {cells}
        </div>
      );
    }

    return <div className="inline-block">{rows}</div>;
  };

  return (
    <div className="h-full flex flex-col bg-amber-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-amber-100 transition-colors text-xl"
          title="Настройки"
        >
          ←
        </button>

        <div className="flex items-center gap-4">
          {renderHeaderTitle()}
          {board && gameStatus === 'playing' && (
            <span className="text-sm font-mono text-gray-600">
              🚩 {totalMines - countFlags(board)}
            </span>
          )}
        </div>

        <button
          onClick={handleRestart}
          className="w-10 h-10 flex items-center justify-center rounded hover:bg-amber-100 transition-colors text-xl"
          title="Рестарт"
        >
          ↻
        </button>
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
    withTimer: false,
    cellSize: 25,
    timerDuration: 999,
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