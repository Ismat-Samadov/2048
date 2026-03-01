# 2048

A beautiful, responsive tile-sliding number puzzle game built with Next.js and framer-motion.

![2048 Game](public/favicon.svg)

## How to Play

- **Goal:** Slide tiles on the board and merge matching numbers to reach the **2048** tile.
- **Controls:**
  - **Arrow keys** or **W A S D** on desktop
  - **Swipe** in any direction on mobile
- After two tiles with the same number collide, they merge into one with double the value.
- Every move spawns a new tile (2 or 4) in a random empty cell.
- The game ends when no moves are left.
- Reach 2048 to win — you can keep playing beyond that for a higher score!

## Features

- Smooth tile slide & merge animations powered by framer-motion
- Score counter with best score saved in localStorage
- Win / Game Over overlays
- Fully responsive — works on any screen size
- Mobile-friendly swipe gestures with scroll prevention
- Keyboard support (arrow keys + WASD)
- Dark gradient design with vibrant tile color palette

## Tech Stack

| Tool | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | React framework (App Router) |
| [React 19](https://react.dev) | UI library |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility styling |
| [framer-motion](https://www.framer-motion.com) | Animations |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  layout.tsx        # Metadata, viewport config
  page.tsx          # Entry point
  globals.css       # Base styles
components/
  Game.tsx          # Full game UI (board, tiles, overlays, input handling)
hooks/
  use2048.ts        # Game logic (move algorithm, scoring, win/lose detection)
public/
  favicon.svg       # Custom SVG favicon
```

## Build

```bash
npm run build
npm start
```
