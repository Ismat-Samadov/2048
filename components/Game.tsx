'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { use2048, type Direction } from '@/hooks/use2048';

const PADDING = 10;
const GAP = 10;

const TILE_STYLES: Record<number, { background: string; color: string; shadow: string }> = {
  2:    { background: '#f5ede0', color: '#7a6b5e', shadow: '0 2px 8px rgba(0,0,0,0.15)' },
  4:    { background: '#eddfc8', color: '#7a6b5e', shadow: '0 2px 8px rgba(0,0,0,0.15)' },
  8:    { background: 'linear-gradient(135deg, #ff9f43, #f0882e)', color: '#fff', shadow: '0 4px 16px rgba(255,159,67,0.45)' },
  16:   { background: 'linear-gradient(135deg, #ff7043, #e64a19)', color: '#fff', shadow: '0 4px 16px rgba(255,112,67,0.45)' },
  32:   { background: 'linear-gradient(135deg, #ff5252, #c62828)', color: '#fff', shadow: '0 4px 16px rgba(255,82,82,0.45)' },
  64:   { background: 'linear-gradient(135deg, #e040fb, #aa00ff)', color: '#fff', shadow: '0 4px 16px rgba(224,64,251,0.45)' },
  128:  { background: 'linear-gradient(135deg, #ffca28, #ff8f00)', color: '#fff', shadow: '0 4px 20px rgba(255,202,40,0.55)' },
  256:  { background: 'linear-gradient(135deg, #ffa726, #e65100)', color: '#fff', shadow: '0 4px 20px rgba(255,167,38,0.55)' },
  512:  { background: 'linear-gradient(135deg, #26c6da, #00838f)', color: '#fff', shadow: '0 4px 22px rgba(38,198,218,0.55)' },
  1024: { background: 'linear-gradient(135deg, #42a5f5, #1565c0)', color: '#fff', shadow: '0 4px 26px rgba(66,165,245,0.6)' },
  2048: { background: 'linear-gradient(135deg, #ab47bc, #6a1b9a)', color: '#fff', shadow: '0 4px 30px rgba(171,71,188,0.7)' },
};

function getTileStyle(value: number) {
  const style = TILE_STYLES[value] ?? {
    background: 'linear-gradient(135deg, #ec407a, #880e4f)',
    color: '#fff',
    shadow: '0 4px 34px rgba(236,64,122,0.75)',
  };
  return {
    background: style.background,
    color: style.color,
    boxShadow: style.shadow,
  };
}

function getFontSize(value: number, cellSize: number): number {
  const digits = String(value).length;
  const base = cellSize * 0.42;
  if (digits <= 2) return base;
  if (digits === 3) return base * 0.75;
  if (digits === 4) return base * 0.6;
  return base * 0.48;
}

function ScoreBox({ label, value }: { label: string; value: number }) {
  const [display, setDisplay] = useState(value);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (value !== display) {
      setBump(true);
      setDisplay(value);
      const t = setTimeout(() => setBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [value, display]);

  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-4 py-2 min-w-[80px]"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <span className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <motion.span
        key={display}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="text-xl font-black"
        style={{ color: bump ? '#ffd700' : '#fff' }}
      >
        {display.toLocaleString()}
      </motion.span>
    </div>
  );
}

export default function Game() {
  const { tiles, score, bestScore, gameOver, won, move, restart, keepPlaying } = use2048();
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!boardRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setBoardSize(entries[0].contentRect.width);
    });
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);

  const cellSize = boardSize > 0 ? (boardSize - 2 * PADDING - 3 * GAP) / 4 : 0;
  const calcX = useCallback((col: number) => PADDING + col * (cellSize + GAP), [cellSize]);
  const calcY = useCallback((row: number) => PADDING + row * (cellSize + GAP), [cellSize]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        move(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 12) return;
    if (absDx > absDy) move(dx > 0 ? 'right' : 'left');
    else move(dy > 0 ? 'down' : 'up');
    touchStart.current = null;
  }, [move]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 select-none"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Header */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-4">
        <div>
          <h1 className="text-5xl font-black tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
            2048
          </h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Join tiles, reach 2048!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBox label="Score" value={score} />
          <ScoreBox label="Best" value={bestScore} />
        </div>
      </div>

      {/* Controls row */}
      <div className="w-full max-w-[500px] flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          ← → ↑ ↓ or swipe
        </p>
        <button
          onClick={restart}
          className="text-xs font-bold px-4 py-2 rounded-lg transition-all duration-150 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
            color: '#1a1a1a',
          }}
        >
          New Game
        </button>
      </div>

      {/* Board */}
      <div className="w-full max-w-[500px] relative">
        <div
          ref={boardRef}
          className="relative w-full rounded-2xl overflow-hidden"
          style={{
            aspectRatio: '1 / 1',
            background: 'rgba(20, 16, 50, 0.9)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {/* Empty cells */}
          {Array.from({ length: 16 }).map((_, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: cellSize,
                  height: cellSize,
                  left: PADDING + col * (cellSize + GAP),
                  top: PADDING + row * (cellSize + GAP),
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.045)',
                }}
              />
            );
          })}

          {/* Tiles */}
          <AnimatePresence>
            {boardSize > 0 && tiles.map((tile) => (
              <motion.div
                key={tile.id}
                initial={{
                  scale: tile.isNew ? 0 : 1,
                  x: calcX(tile.col),
                  y: calcY(tile.row),
                }}
                animate={{
                  scale: tile.isMerged ? [1, 1.18, 1] : 1,
                  x: calcX(tile.col),
                  y: calcY(tile.row),
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{
                  x: { duration: 0.1, ease: 'easeInOut' },
                  y: { duration: 0.1, ease: 'easeInOut' },
                  scale: tile.isMerged
                    ? { duration: 0.2, times: [0, 0.5, 1] }
                    : { duration: 0.15, ease: 'backOut' },
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: cellSize,
                  height: cellSize,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  zIndex: tile.isMerged ? 10 : 5,
                  ...getTileStyle(tile.value),
                }}
              >
                <span style={{
                  fontSize: getFontSize(tile.value, cellSize),
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}>
                  {tile.value.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Game Over overlay */}
          <AnimatePresence>
            {gameOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                style={{ background: 'rgba(10, 6, 30, 0.88)', backdropFilter: 'blur(6px)', zIndex: 20 }}
              >
                <motion.div
                  initial={{ scale: 0.7, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-4 p-8 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="text-4xl">😔</span>
                  <h2 className="text-3xl font-black"
                    style={{ color: '#fff' }}>Game Over</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm">
                    Final score: <span className="font-bold text-white">{score.toLocaleString()}</span>
                  </p>
                  <button
                    onClick={restart}
                    className="mt-2 px-8 py-3 rounded-xl font-bold text-base transition-all duration-150 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #ffd700, #ff8c00)', color: '#1a1a1a' }}
                  >
                    Try Again
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Win overlay */}
          <AnimatePresence>
            {won && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
                style={{ background: 'rgba(10, 6, 30, 0.88)', backdropFilter: 'blur(6px)', zIndex: 20 }}
              >
                <motion.div
                  initial={{ scale: 0.7, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-4 p-8 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <span className="text-4xl">🎉</span>
                  <h2 className="text-3xl font-black"
                    style={{
                      background: 'linear-gradient(135deg, #ffd700, #ab47bc)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>You Win!</h2>
                  <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-sm text-center">
                    You reached <span className="font-bold text-white">2048!</span><br />
                    Keep going for a higher score?
                  </p>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={keepPlaying}
                      className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #ab47bc, #6a1b9a)', color: '#fff' }}
                    >
                      Keep Playing
                    </button>
                    <button
                      onClick={restart}
                      className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      New Game
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-6 text-xs text-center max-w-[300px]"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        Merge tiles with the same number to get to 2048
      </p>
    </div>
  );
}
