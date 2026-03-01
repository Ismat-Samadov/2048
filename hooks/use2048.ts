'use client';

import { useState, useCallback, useEffect } from 'react';

const GRID_SIZE = 4;
let nextId = 1;

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

interface MoveResult {
  tiles: Tile[];
  score: number;
  moved: boolean;
}

function createTile(value: number, row: number, col: number): Tile {
  return { id: nextId++, value, row, col, isNew: true, isMerged: false };
}

function tilesTo2D(tiles: Tile[]): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(null)
  );
  tiles.forEach((t) => {
    grid[t.row][t.col] = t;
  });
  return grid;
}

function transpose(grid: (Tile | null)[][]): (Tile | null)[][] {
  return grid[0].map((_, i) => grid.map((row) => row[i]));
}

function reverseRows(grid: (Tile | null)[][]): (Tile | null)[][] {
  return grid.map((row) => [...row].reverse());
}

function flipRows(grid: (Tile | null)[][]): (Tile | null)[][] {
  return [...grid].reverse();
}

function slideLeft(grid: (Tile | null)[][]): {
  grid: (Tile | null)[][];
  score: number;
  moved: boolean;
} {
  let score = 0;
  let moved = false;

  const newGrid = grid.map((row) => {
    const oldValues = row.map((t) => t?.value ?? 0).join(',');
    const nonNull = row.filter(Boolean) as Tile[];
    const result: (Tile | null)[] = [];
    let i = 0;

    while (i < nonNull.length) {
      if (i + 1 < nonNull.length && nonNull[i].value === nonNull[i + 1].value) {
        const val = nonNull[i].value * 2;
        score += val;
        result.push({ ...nonNull[i], value: val, isMerged: true, isNew: false });
        i += 2;
      } else {
        result.push({ ...nonNull[i], isMerged: false, isNew: false });
        i++;
      }
    }

    while (result.length < GRID_SIZE) result.push(null);

    const newValues = result.map((t) => t?.value ?? 0).join(',');
    if (oldValues !== newValues) moved = true;

    return result;
  });

  return { grid: newGrid, score, moved };
}

function performMove(tiles: Tile[], direction: Direction): MoveResult {
  let grid = tilesTo2D(tiles);

  if (direction === 'right') grid = reverseRows(grid);
  else if (direction === 'up') grid = transpose(grid);
  else if (direction === 'down') grid = transpose(flipRows(grid));

  const { grid: slid, score, moved } = slideLeft(grid);

  let resultGrid: (Tile | null)[][];
  if (direction === 'right') resultGrid = reverseRows(slid);
  else if (direction === 'up') resultGrid = transpose(slid);
  else if (direction === 'down') resultGrid = flipRows(transpose(slid));
  else resultGrid = slid;

  const newTiles: Tile[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = resultGrid[r][c];
      if (tile) newTiles.push({ ...tile, row: r, col: c });
    }
  }

  return { tiles: newTiles, score, moved };
}

function getEmptyCells(tiles: Tile[]): { row: number; col: number }[] {
  const occupied = new Set(tiles.map((t) => `${t.row},${t.col}`));
  const cells: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!occupied.has(`${r},${c}`)) cells.push({ row: r, col: c });
    }
  }
  return cells;
}

function spawnTile(tiles: Tile[]): Tile[] {
  const empty = getEmptyCells(tiles);
  if (!empty.length) return tiles;
  const cell = empty[Math.floor(Math.random() * empty.length)];
  return [...tiles, createTile(Math.random() < 0.9 ? 2 : 4, cell.row, cell.col)];
}

function isGameOver(tiles: Tile[]): boolean {
  if (getEmptyCells(tiles).length > 0) return false;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = tiles.find((t) => t.row === r && t.col === c);
      if (!tile) continue;
      const right = tiles.find((t) => t.row === r && t.col === c + 1);
      if (right && right.value === tile.value) return false;
      const down = tiles.find((t) => t.row === r + 1 && t.col === c);
      if (down && down.value === tile.value) return false;
    }
  }
  return true;
}

function initGame(): Tile[] {
  let tiles: Tile[] = [];
  tiles = spawnTile(tiles);
  tiles = spawnTile(tiles);
  return tiles;
}

export function use2048() {
  const [tiles, setTiles] = useState<Tile[]>(() => initGame());
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [hasContinued, setHasContinued] = useState(false);

  // Load best score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('2048-best');
    if (saved) setBestScore(parseInt(saved, 10));
  }, []);

  // Clear animation flags after animations complete
  useEffect(() => {
    const hasAnimating = tiles.some((t) => t.isNew || t.isMerged);
    if (!hasAnimating) return;
    const timer = setTimeout(() => {
      setTiles((prev) => prev.map((t) => ({ ...t, isNew: false, isMerged: false })));
    }, 300);
    return () => clearTimeout(timer);
  }, [tiles]);

  const move = useCallback(
    (direction: Direction) => {
      if (gameOver || (won && !hasContinued)) return;

      setTiles((prevTiles) => {
        const result = performMove(prevTiles, direction);
        if (!result.moved) return prevTiles;

        const newTiles = spawnTile(result.tiles);

        setScore((prev) => {
          const newScore = prev + result.score;
          setBestScore((best) => {
            const newBest = Math.max(best, newScore);
            localStorage.setItem('2048-best', newBest.toString());
            return newBest;
          });
          return newScore;
        });

        if (!hasContinued && newTiles.some((t) => t.value >= 2048)) {
          setWon(true);
        }

        if (isGameOver(newTiles)) {
          setGameOver(true);
        }

        return newTiles;
      });
    },
    [gameOver, won, hasContinued]
  );

  const restart = useCallback(() => {
    setTiles(initGame());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setHasContinued(false);
  }, []);

  const keepPlaying = useCallback(() => {
    setHasContinued(true);
    setWon(false);
  }, []);

  return { tiles, score, bestScore, gameOver, won, move, restart, keepPlaying };
}
