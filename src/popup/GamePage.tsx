import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './SettingsContext';
import { Board, generateBoard, revealCell, toggleFlag, checkWin, countFlags, getMinesCount } from './minesweeperLogic';

const numberEmojis: { [key: number]: string } = {
  1: '1️⃣',
  2: '2️⃣',
  3: '3️⃣',
  4: '4️⃣',
  5: '5️⃣',
  6: '6️⃣',
  7: '7️⃣',
  8: '8️⃣',
};

const HEADER_HEIGHT = 48;
const MAIN_PADDING = 16;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 550;

const GamePage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { width, height, withTimer, cellSize, timerDuration, difficulty } = settings;

  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const [board, setBoard] = useState<Board | null>(null);
  const [boardGenerated, setBoardGenerated] = useState(false);
  const totalMines = getMinesCount(width, height, difficulty);

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

export default GamePage;