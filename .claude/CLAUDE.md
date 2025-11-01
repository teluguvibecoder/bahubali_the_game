# Claude Code Instructions for Slingshot Physics Game

This document provides context and guidelines for working with this Angry Birds-style slingshot game codebase.

## Project Overview

A browser-based physics game built with:
- **React 18.2** - Component framework
- **Vite 5.0** - Build tool and dev server
- **Matter.js 0.19** - 2D rigid body physics engine
- **Howler.js 2.2** - Audio management
- **GSAP 3.12** - UI animations and tweens

**Game Type:** Single-player, browser-based, no backend required
**Language:** Plain JavaScript (not TypeScript)
**Architecture:** Functional React components with hooks

## Project Structure

```
bahubali_game/
├── src/
│   ├── physics/
│   │   └── engine.js          # Physics engine setup and helper functions
│   ├── App.jsx                # Root component with header/footer
│   ├── Game.jsx               # Main game component (core logic)
│   ├── main.jsx               # React DOM entry point
│   └── styles.css             # Global styles
├── public/
│   └── ASSETS_README.txt      # Asset guidelines
├── index.html                 # HTML entry point
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration
└── README.md                  # User documentation
```

## Key Architecture Decisions

### 1. Physics Engine Pattern

**Location:** `src/physics/engine.js`

All Matter.js-related setup is isolated in this module. It exports pure functions that create and configure physics bodies:

- `createEngine()` - Initialize Matter.js engine
- `createRenderer()` - Set up canvas renderer
- `createBoundaries()` - Create ground and walls
- `createTower()` - Generate block towers
- `createProjectile()` - Create the slingshot projectile
- `createSlingshot()` - Create elastic constraint

**Pattern:** These are factory functions that take parameters and return configured Matter.js objects. They do NOT manage React state.

### 2. Game Component Pattern

**Location:** `src/Game.jsx`

The Game component is the central orchestrator. It:
- Uses `useRef` hooks to store mutable physics objects (engine, bodies, constraints)
- Uses `useState` for UI state (score, canReset)
- Runs physics initialization in `useEffect` on mount
- Handles cleanup properly to avoid memory leaks

**Important:** Physics objects (bodies, engine, world) are stored in refs, NOT state, because:
- They mutate frequently (every physics tick)
- Re-rendering on every physics update would be wasteful
- Matter.js manages them internally

### 3. Event Handling

**Mouse/Touch Controls:** Matter.js MouseConstraint handles drag detection
**Collision Detection:** Matter.Events.on('collisionStart') handles impacts
**Game Loop:** Matter.Runner drives the physics updates

### 4. Audio Pattern

Howl instances are created once at module level (not in component state) to avoid recreation on re-renders. Placeholder sounds use data URIs but should be replaced with real files in production.

## Code Conventions

### Naming

- **React components:** PascalCase (e.g., `Game`, `App`)
- **Functions:** camelCase (e.g., `createEngine`, `launchProjectile`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `CANVAS_WIDTH`, `SLINGSHOT_X`)
- **Refs:** Suffix with `Ref` (e.g., `engineRef`, `projectileRef`)

### File Organization

- **Physics logic:** Goes in `src/physics/engine.js`
- **Game logic:** Goes in `src/Game.jsx`
- **UI/layout:** Goes in `src/App.jsx`
- **Styles:** Goes in `src/styles.css` (single global stylesheet)

### Comments

- Use JSDoc-style comments for exported functions
- Add inline comments for non-obvious physics calculations
- Explain "why" not "what" when the code is complex

## Common Tasks

### Adding a New Block Type

1. Create a new function in `src/physics/engine.js`:
   ```javascript
   export function createStoneBlock(world, x, y) {
     const block = Matter.Bodies.rectangle(x, y, 40, 30, {
       label: 'stoneBlock',
       density: 0.01,  // Heavier than normal blocks
       render: { fillStyle: '#808080' }
     });
     Matter.World.add(world, block);
     return block;
   }
   ```

2. Use it in `src/Game.jsx` during tower creation

### Adding a New Sound Effect

1. Add the Howl instance to the `sounds` object in `Game.jsx`:
   ```javascript
   const sounds = {
     launch: new Howl({ src: ['/sounds/launch.mp3'] }),
     hit: new Howl({ src: ['/sounds/hit.mp3'] }),
     explosion: new Howl({ src: ['/sounds/explosion.mp3'] })  // New
   };
   ```

2. Play it where needed: `sounds.explosion.play()`

### Modifying Physics Parameters

**Gravity:** `src/physics/engine.js:10`
```javascript
gravity: { x: 0, y: 1 }  // Increase y for stronger gravity
```

**Slingshot elasticity:** `src/physics/engine.js:138`
```javascript
stiffness: 0.05  // Lower = more stretchy/powerful
```

**Block density:** `src/physics/engine.js:93`
```javascript
density: 0.001  // Lower = easier to knock over
```

### Adding a New Level

1. Define level data structure:
   ```javascript
   const level2 = {
     towers: [
       { x: 500, y: CANVAS_HEIGHT - 50, columns: 4, rows: 6 },
       { x: 800, y: CANVAS_HEIGHT - 50, columns: 2, rows: 8 }
     ],
     projectiles: 3
   };
   ```

2. Create a level loader function that reads this data and calls `createTower()` for each tower

### Debugging Physics Issues

**Wireframe mode:** Set `wireframes: true` in `createRenderer()` options (engine.js:27)
**Render collision points:** Add to render options: `showCollisions: true`
**Slow motion:** Modify engine timing:
```javascript
engine.timing.timeScale = 0.5;  // Half speed
```

## Important Technical Details

### Matter.js Body Management

**DO:**
- Store bodies in refs, not state
- Remove bodies from world when no longer needed
- Check if refs exist before accessing (null checks)

**DON'T:**
- Mutate body properties directly (use Matter.Body.set methods)
- Add the same body to world twice
- Forget to remove bodies (causes memory leaks)

### Canvas Rendering

The game uses Matter.Render which manages the canvas directly. If you need custom rendering:

1. Set `wireframes: false` in render options
2. Use `render.fillStyle` properties on bodies for colors
3. For sprites, use `render.sprite.texture` properties

### Camera/Viewport

Current implementation: Simple viewport translation when projectile moves right (Game.jsx:129-141)

To improve:
- Add smooth lerping between camera positions
- Implement zoom in/out based on action
- Add camera shake on big impacts

### Performance Considerations

- **Limit active bodies:** Remove off-screen bodies regularly (see `removeOutOfBoundsBodies()`)
- **Optimize collision checks:** Use collision filtering for static bodies
- **Reduce render complexity:** Use simple shapes instead of complex sprites when possible
- **Throttle updates:** Camera follow updates every 100ms, not every frame

## State Management

### React State (useState)
- `score` - Player's current score (displayed in UI)
- `canReset` - Whether reset button is enabled

### Refs (useRef)
- `canvasRef` - Reference to canvas DOM element
- `engineRef` - Matter.js engine instance
- `renderRef` - Matter.js renderer instance
- `runnerRef` - Matter.js runner instance
- `projectileRef` - Current projectile body
- `slingshotRef` - Current slingshot constraint
- `blocksRef` - Array of all block bodies
- `isDraggingRef` - Whether user is dragging projectile
- `hasLaunchedRef` - Whether projectile has been launched

**Why refs for physics?** Physics objects update 60+ times per second. Using state would trigger 60+ re-renders per second, which is wasteful. Refs allow mutations without re-renders.

## Testing Approach

Currently no automated tests. For manual testing:

1. **Slingshot mechanics:** Drag and release should feel responsive
2. **Collisions:** Blocks should topple realistically
3. **Camera follow:** Should track projectile smoothly
4. **Reset:** Should clear all bodies and recreate scene
5. **Audio:** All three sounds should play at appropriate times
6. **Mobile:** Touch drag should work on mobile devices

## Common Pitfalls

### 1. Memory Leaks
**Symptom:** Performance degrades over time
**Cause:** Not cleaning up Matter.js objects in useEffect cleanup
**Fix:** Ensure `useEffect` return function clears engine, runner, and world

### 2. Stale Closures in Event Handlers
**Symptom:** Event handlers use old state values
**Cause:** Event listeners capture variables at creation time
**Fix:** Use refs for values that change, or recreate listeners when dependencies change

### 3. Double-Adding Bodies
**Symptom:** Physics behaves erratically
**Cause:** Adding the same body to world multiple times
**Fix:** Check if body already exists before adding, or clear world before adding

### 4. Canvas Not Updating
**Symptom:** Canvas is blank or frozen
**Cause:** Renderer not started, or canvas ref not set
**Fix:** Ensure `Matter.Render.run()` is called after renderer creation

## Enhancement Roadmap

### Phase 1: Core Improvements
- Add trajectory prediction line
- Improve camera smoothing (lerp)
- Add camera shake on impacts
- Better mobile touch controls

### Phase 2: Content
- Multiple projectile types (split, speed boost, explosive)
- Level progression system with JSON configs
- Star rating (1-3 stars based on performance)
- Obstacles and special blocks (TNT, ice, stone)

### Phase 3: Polish
- Particle effects on collisions
- Better sprites and textures
- Background music
- Animated enemies/targets
- Parallax backgrounds

### Phase 4: Persistence
- LocalStorage for high scores
- Level unlock progression
- Settings menu (volume, graphics quality)
- Achievement system

## External Resources

**Matter.js Docs:** https://brm.io/matter-js/docs/
**Howler.js Docs:** https://howlerjs.com/
**GSAP Docs:** https://greensock.com/docs/
**React Docs:** https://react.dev/

## Modification Guidelines

When making changes:

1. **Preserve separation of concerns:** Physics logic stays in `physics/engine.js`, game logic in `Game.jsx`
2. **Maintain cleanup:** Always add corresponding cleanup for resources created in `useEffect`
3. **Keep it simple:** This is a prototype - prioritize clarity over optimization
4. **Comment complex physics:** Explain collision thresholds, force calculations, etc.
5. **Test on mobile:** Touch events behave differently than mouse events

## Code Style

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for strings
- **Semicolons:** Yes, always
- **Line length:** Aim for <100 characters
- **Destructuring:** Use for readability: `const { engine, world } = createEngine()`

## Dependencies Version Notes

- **React:** v18.2+ required for concurrent features
- **Matter.js:** v0.19 is stable, avoid v0.20 (breaking changes)
- **Howler:** v2.2+ for spatial audio support
- **GSAP:** v3.12+ for modern syntax
- **Vite:** v5.0+ for optimal dev experience

## Quick Reference: Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `createEngine()` | physics/engine.js:7 | Initialize physics engine |
| `createTower()` | physics/engine.js:85 | Generate block towers |
| `launchProjectile()` | Game.jsx:228 | Release slingshot |
| `setupCollisionDetection()` | Game.jsx:156 | Handle impacts |
| `resetGame()` | Game.jsx:249 | Restart level |
| `removeOutOfBoundsBodies()` | Game.jsx:192 | Cleanup fallen objects |

---

**Last Updated:** 2025-10-30
**Code Version:** 1.0.0
**Maintainer:** Project generated for learning purposes
