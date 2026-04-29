export interface Cell {
  revealed: boolean;
  flagged: boolean;
  mine: boolean;
  adjacentMines: number;
}

export type Board = Cell[][];

interface Position {
  x: number;
  y: number;
}

export type Difficulty = 'light' | 'normal' | 'extreme';

function createEmptyBoard(width: number, height: number): Board {
  const board: Board = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({
        revealed: false,
        flagged: false,
        mine: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

function placeMines(board: Board, totalMines: number, safePositions: Position[]): void {
  const height = board.length;
  const width = board[0].length;
  const safeSet = new Set(safePositions.map(p => `${p.x},${p.y}`));

  const allPositions: Position[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!safeSet.has(`${x},${y}`)) {
        allPositions.push({ x, y });
      }
    }
  }

  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  const mines = allPositions.slice(0, Math.min(totalMines, allPositions.length));
  for (const { x, y } of mines) {
    board[y][x].mine = true;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (board[y][x].mine) continue;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height && board[ny][nx].mine) {
            count++;
          }
        }
      }
      board[y][x].adjacentMines = count;
    }
  }
}

export function generateBoard(
  width: number,
  height: number,
  totalMines: number,
  firstClick: Position
): Board {
  const board = createEmptyBoard(width, height);

  const safeZone: Position[] = [{ x: firstClick.x, y: firstClick.y }];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = firstClick.x + dx;
      const ny = firstClick.y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        safeZone.push({ x: nx, y: ny });
      }
    }
  }

  placeMines(board, totalMines, safeZone);
  return board;
}

export function revealCell(board: Board, x: number, y: number): boolean {
  const height = board.length;
  const width = board[0].length;
  if (x < 0 || x >= width || y < 0 || y >= height) return false;

  const cell = board[y][x];
  if (cell.revealed || cell.flagged) return false;

  cell.revealed = true;

  if (cell.mine) {
    revealAllMines(board);
    return false;
  }

  if (cell.adjacentMines === 0) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        revealCell(board, x + dx, y + dy);
      }
    }
  }

  return true;
}

function revealAllMines(board: Board): void {
  for (const row of board) {
    for (const cell of row) {
      if (cell.mine) {
        cell.revealed = true;
      }
    }
  }
}

export function toggleFlag(board: Board, x: number, y: number): void {
  const height = board.length;
  const width = board[0].length;
  if (x < 0 || x >= width || y < 0 || y >= height) return;

  const cell = board[y][x];
  if (cell.revealed) return;
  cell.flagged = !cell.flagged;
}

export function checkWin(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.mine && !cell.revealed) return false;
    }
  }
  return true;
}

export function countFlags(board: Board): number {
  let flags = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.flagged) flags++;
    }
  }
  return flags;
}

export function getMinesCount(width: number, height: number, difficulty: Difficulty): number {
  let percentage: number;
  switch (difficulty) {
    case 'light':
      percentage = 0.10;
      break;
    case 'normal':
      percentage = 0.15;
      break;
    case 'extreme':
      percentage = 0.20;
      break;
  }
  return Math.max(1, Math.floor(width * height * percentage));
}