import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './SettingsContext';
import { Board, generateBoard, revealCell, toggleFlag, checkWin, countFlags, getMinesCount } from './minesweeperLogic';
import {
  TILE_UNCLEARED, TILE_FLAG, TILE_MINE,
  TILE_0, TILE_1, TILE_2, TILE_3, TILE_4, TILE_5, TILE_6, TILE_7, TILE_8,
  spriteToDataURL
} from './sprites';

const HEADER_HEIGHT = 48;
const MAIN_PADDING = 16;
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 550;

const DIGIT_SPRITES = [TILE_0, TILE_1, TILE_2, TILE_3, TILE_4, TILE_5, TILE_6, TILE_7, TILE_8];

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

  const spriteCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    spriteCacheRef.current.clear();
  }, [cellSize]);

  const getSpriteSrc = useCallback(
    (bits: number[], size: number, bg: string | null, pixel: string = 'black') => {
      const key = `${bits.join(',')}-${size}-${bg}-${pixel}`;
      const cache = spriteCacheRef.current;
      if (cache.has(key)) return cache.get(key)!;
      const url = spriteToDataURL(bits, size, bg, pixel);
      cache.set(key, url);
      return url;
    },
    []
  );

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
    if (gameStatus === 'won') return <h1 className="text-2xl font-bold text-green-600">Победа!</h1>;
    if (gameStatus === 'lost') return <h1 className="text-2xl font-bold text-red-600">Поражение</h1>;
    if (withTimer && remainingTime !== null) return <span className="text-2xl font-mono font-bold">{remainingTime}</span>;
    return <h1 className="text-2xl font-bold text-gray-800">Сапёр</h1>;
  };

  const renderGrid = () => {
    const rows = [];
    for (let y = 0; y < height; y++) {
      const cells = [];
      for (let x = 0; x < width; x++) {
        const isRealBoard = !!board;
        let bits: number[];
        let bgColor: string | null = null;
        let pixelColor = 'black';
        let cellBg = '#c0c0c0'; // фон самой клетки (под спрайтом)

        if (!isRealBoard) {
          bits = TILE_UNCLEARED;
        } else {
          const cell = board![y][x];
          if (!cell.revealed) {
            bits = cell.flagged ? TILE_FLAG : TILE_UNCLEARED;
            if (cell.flagged) {
              pixelColor = '#FF0000';
            }
          } else {
            if (cell.mine) {
              bits = TILE_MINE;
              cellBg = '#FF0000';
            } else {
              bits = DIGIT_SPRITES[cell.adjacentMines] || TILE_0;
              cellBg = '#808080';
            }
          }
        }

        const src = getSpriteSrc(bits, cellSize, bgColor, pixelColor);

        const isFirstRow = y === 0;
        const isFirstCol = x === 0;

        const cellStyle: React.CSSProperties = {
          width: cellSize,
          height: cellSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderTopColor: '#ffffff',
          borderLeftColor: '#ffffff',
          borderBottomColor: '#808080',
          borderRightColor: '#808080',
          backgroundColor: cellBg,
          boxSizing: 'border-box',
          marginTop: isFirstRow ? '0' : '-1px',
          marginLeft: isFirstCol ? '0' : '-1px',
        };

        cells.push(
          <div
            key={`${x}-${y}`}
            style={cellStyle}
            onClick={() => handleCellClick(x, y)}
            onContextMenu={(e) => handleCellRightClick(e, x, y)}
          >
            <img src={src} alt="" style={{ width: cellSize, height: cellSize, imageRendering: 'pixelated' }} />
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
        <button onClick={() => navigate('/')} className="w-10 h-10 flex items-center justify-center rounded hover:bg-amber-100 transition-colors text-xl" title="Настройки">←</button>
        <div className="flex items-center gap-4">
          {renderHeaderTitle()}
          {board && gameStatus === 'playing' && (
            <span className="text-sm font-mono text-gray-600">
              🚩 {totalMines - countFlags(board)}
            </span>
          )}
        </div>
        <button onClick={handleRestart} className="w-10 h-10 flex items-center justify-center rounded hover:bg-amber-100 transition-colors text-xl" title="Рестарт">↻</button>
      </header>
      <main className="flex-1 flex items-center justify-center p-2">
        {renderGrid()}
      </main>
    </div>
  );
};

export default GamePage;