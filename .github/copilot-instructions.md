# Bomber-Copilot Copilot Instructions

## Build, Test, and Lint Commands

```bash
# Install dependencies
npm install

# Development server (port 8080, with anonymous usage tracking)
npm run dev

# Development server (without anonymous usage tracking)
npm run dev-nolog

# Production build
npm run build

# Production build (without logging)
npm run build-nolog

# Deploy to GitHub Pages (gh-pages branch)
npm run deploy
```

ESLint is configured but no explicit lint command exists in package.json. To check code, use:
```bash
npx eslint src/ --ext .ts,.tsx
```

TypeScript compilation is handled by Vite during dev/build.

## Architecture Overview

This is a **Phaser 4 game built with React and TypeScript**, using Vite for bundling.

### High-Level Structure

- **React Layer** (`src/App.tsx`, `src/PhaserGame.tsx`): Main React application that mounts the Phaser game
- **Phaser Game** (`src/game/main.ts`): Game configuration and scene initialization
- **Scenes** (`src/game/scenes/`): Phaser scenes following the scene lifecycle (Boot → Preloader → MainMenu → Game → GameOver)
- **Game Logic** (`src/game/Player.ts`, `src/game/Enemy.ts`, `src/game/Bomb.ts`): Player, enemy, and bomb entity classes
- **Map** (`src/game/MapGenerator.ts`): Procedural tile-based map generation
- **Communication** (`src/game/EventBus.ts`): Event emitter for React-to-Phaser and Phaser-to-React communication

### Canvas Setup

- **Size**: 720px × 624px (15 cols × 13 rows of 48px tiles)
- **Tile System**: Three tile types defined in MapGenerator: `TILE_FLOOR` (0), `TILE_WALL` (1, indestructible), `TILE_BLOCK` (2, destructible)
- **Map Generation**: ~60% destructible blocks randomly placed, with safe zones around player spawn (1,1) and enemy spawns (bottom-right area)

### Scene Lifecycle

1. **Boot**: Entry point, transitions to Preloader
2. **Preloader**: Loads assets (sprites, animations, audio)
3. **MainMenu**: Menu screen (from template)
4. **Game**: Active gameplay scene with player, enemies, bombs, and collision handling
5. **GameOver**: End screen

### React-Phaser Bridge

- **PhaserGame.tsx**: Wraps Phaser game initialization and lifecycle
- **EventBus**: Phaser's EventEmitter used for bidirectional communication
  - Phaser scenes emit `"current-scene-ready"` when active and ready
  - React and Phaser components can emit/listen to custom events
- **useLayoutEffect** in PhaserGame ensures game is created once and destroyed on unmount

### Entity Classes

- **Player**: Tile-based movement, bomb placement, sprite with directional walk animations. Stats: `bombRange`, `maxBombs`, `activeBombs`
- **Enemy**: AI pathfinding behavior toward player or random movement (implementation in Enemy.ts)
- **Bomb**: Explosion timer and blast radius (range-based damage in four directions)

## Key Conventions

### File Organization
- Scene files in `src/game/scenes/` are PascalCase class definitions
- Utility/entity files (`Player.ts`, `Enemy.ts`, etc.) are alongside game config in `src/game/`
- Exported utilities like MapGenerator use named exports

### Tile-Based Coordinate System
- All game positions use **tile coordinates** (col, row), not pixel coordinates
- Conversion: pixel = (tileX or tileY) × TILE_SIZE + TILE_SIZE/2 (to center on tile)
- Constants: `TILE_SIZE = 48`, `MAP_COLS = 15`, `MAP_ROWS = 13`

### Scene Communication Pattern
- Scenes emit `EventBus.emit('current-scene-ready', this)` in `create()` to notify React layer
- Custom events follow kebab-case naming: `'event-name'`
- Always clean up listeners in scene `shutdown` event or React cleanup functions

### Sprite Depth Ordering
- Player sprite uses depth 10 to render above game objects
- Adjust depth values when adding UI elements or new entity types

### Vite Configuration
- Dev config: `vite/config.dev.mjs` (port 8080, hot reload enabled)
- Prod config: `vite/config.prod.mjs` (optimized build)
- Assets: Static assets in `public/assets/` are copied to `dist/assets/` on build
- Bundled assets: Imported assets (e.g., `import logoImg from './assets/logo.png'`) are inlined or hashed

### TypeScript
- Strict mode enabled with `noUnusedLocals` and `noUnusedParameters`
- JSX target is `react-jsx` (no need for React import in files with JSX)
- Module resolution uses bundler mode for Vite compatibility

### ESLint Rules
- React Hooks plugin enforces hook dependency arrays
- React Refresh warns if non-component exports appear in component files
- Recommended TypeScript ESLint rules applied
