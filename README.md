# Slingshot Physics Game

A minimal Angry Birds-style slingshot game built with React, Vite, Matter.js, Howler.js, and GSAP.

## Features

- **Physics-based gameplay** using Matter.js for realistic collisions and gravity
- **Slingshot mechanics** with mouse and touch drag-and-release controls
- **Two tower targets** with destructible blocks
- **Sound effects** using Howler.js (launch, hit, crumble)
- **Smooth animations** with GSAP for UI polish
- **Camera follow** that tracks the projectile as it flies
- **Score tracking** with collision-based scoring
- **Reset functionality** to restart the level
- **Responsive design** that works on desktop and mobile

## Project Structure

```
bahubali_game/
├── public/
│   └── ASSETS_README.txt      # Guide for adding custom assets
├── src/
│   ├── physics/
│   │   └── engine.js          # Matter.js physics setup and helpers
│   ├── App.jsx                # Main app component with GSAP animations
│   ├── Game.jsx               # Core game logic and slingshot mechanics
│   ├── main.jsx               # React entry point
│   └── styles.css             # Global styles with responsive design
├── index.html                 # HTML entry point
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Installation

### Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Setup Steps

1. **Navigate to the project directory:**
   ```bash
   cd bahubali_game
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   The terminal will show a local URL (typically `http://localhost:5173`). Open it in your browser.

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the production-ready app to the `/dist` folder
- `npm run preview` - Preview the production build locally

## How to Play

1. **Aim:** Click and drag the red projectile (ball) backward to pull the slingshot
2. **Release:** Let go to launch the projectile toward the towers
3. **Destroy:** Knock down the colored blocks to score points
4. **Reset:** Click the "Reset" button to restart the level

### Controls

- **Mouse:** Click and drag the projectile
- **Touch:** Tap and drag on mobile devices

## Technical Details

### Dependencies

- **React 18.2** - UI framework
- **Vite 5.0** - Fast build tool and dev server
- **Matter.js 0.19** - 2D physics engine
- **Howler.js 2.2** - Web audio library
- **GSAP 3.12** - Animation library

### Key Components

#### Game.jsx
- Main game loop and state management
- Slingshot drag-and-release mechanics
- Collision detection and scoring
- Camera follow logic
- Audio integration

#### physics/engine.js
- Physics engine initialization
- World boundary creation (ground, walls)
- Tower generation with stacked blocks
- Projectile and slingshot constraint setup
- Helper functions for physics bodies

#### App.jsx
- GSAP-powered title animations
- Component layout and structure

## Code Highlights

### Slingshot Mechanics

The slingshot uses a Matter.js constraint that keeps the projectile tethered to an anchor point. When the user drags the projectile, the constraint stretches. On release, the constraint is removed, and the stored elastic energy launches the projectile.

```javascript
// src/Game.jsx:228-238
function launchProjectile() {
  // Remove the slingshot constraint to release projectile
  Matter.World.remove(engineRef.current.world, slingshotRef.current);
  hasLaunchedRef.current = true;
  sounds.launch.play();
}
```

### Collision Detection

The game listens for collision events and plays appropriate sounds. Blocks take damage from high-impact collisions:

```javascript
// src/Game.jsx:164-180
Matter.Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((pair) => {
    const impactForce = pair.collision.depth;
    if (impactForce > 3) {
      damageBlock(block);
    }
  });
});
```

### Camera Follow

A simple camera system translates the viewport when the projectile moves beyond 60% of the screen width:

```javascript
// src/Game.jsx:129-141
if (projectileX > CANVAS_WIDTH * 0.6) {
  const offsetX = projectileX - CANVAS_WIDTH * 0.4;
  Matter.Render.lookAt(render, {
    min: { x: offsetX, y: 0 },
    max: { x: offsetX + CANVAS_WIDTH, y: CANVAS_HEIGHT }
  });
}
```

## Customization

### Adding Real Audio Files

1. Download CC0 sound effects from freesound.org or mixkit.co
2. Place them in `/public/sounds/` directory
3. Update the Howl instances in `Game.jsx`:

```javascript
const sounds = {
  launch: new Howl({ src: ['/sounds/launch.mp3'], volume: 0.5 }),
  hit: new Howl({ src: ['/sounds/hit.mp3'], volume: 0.6 }),
  crumble: new Howl({ src: ['/sounds/crumble.mp3'], volume: 0.4 })
};
```

### Changing Colors and Physics

Edit `src/physics/engine.js` to modify:
- Block colors (line 105: `getRandomBlockColor()`)
- Block sizes (line 85-86: `blockWidth`, `blockHeight`)
- Physics properties (density, restitution, friction)
- Gravity strength (line 10: `gravity: { x: 0, y: 1 }`)

### Adjusting Slingshot Power

Modify the stiffness value in `createSlingshot()` (physics/engine.js:138):
```javascript
stiffness: 0.05  // Lower = more elastic/powerful
```

## Easy Next Steps

Here are suggested enhancements to expand the game:

### 1. Multiple Bird Abilities
Add different projectile types with special powers:
```javascript
// Red bird: standard
// Blue bird: splits into three on click
// Yellow bird: speed boost on click
// Black bird: explodes on impact
```

### 2. Particle Effects
Add visual feedback using Matter.js or a library like `particles.js`:
- Dust clouds on impact
- Block fragments when destroyed
- Smoke trail behind projectile

### 3. Level System
Create a JSON structure for levels:
```javascript
const levels = [
  {
    towers: [
      { x: 600, y: 500, columns: 3, rows: 5 },
      { x: 900, y: 500, columns: 2, rows: 4 }
    ],
    projectiles: 3,
    targetScore: 100
  }
];
```

### 4. Star Rating System
Award 1-3 stars based on:
- Number of projectiles used
- Final score
- Blocks remaining

### 5. Mobile Polish
- Add haptic feedback on collisions (vibration API)
- Improve touch controls with better drag indicators
- Optimize canvas resolution for mobile devices

### 6. Power-ups and Obstacles
- Add TNT blocks that explode
- Ice blocks that are slippery
- Stone blocks that are harder to break
- Wind zones that affect projectile trajectory

### 7. Persistent State
Use localStorage to save:
- High scores
- Unlocked levels
- User preferences (sound on/off)

### 8. Trajectory Preview
Show a dotted line predicting the projectile path before release (requires calculating parabolic trajectory).

### 9. Enemies/Targets
Add animated targets (e.g., pigs, monsters) that move or hide behind blocks.

### 10. Background Parallax
Add multiple background layers that scroll at different speeds for depth effect.

## Troubleshooting

### Issue: Canvas not rendering
- Check browser console for errors
- Ensure all dependencies installed (`npm install`)
- Try clearing browser cache

### Issue: Physics behaving strangely
- Check that only one instance of the game is running
- Verify Matter.js version compatibility
- Reset the game and check console for warnings

### Issue: Sounds not playing
- Check browser autoplay policies (user interaction required)
- Verify Howler.js is properly installed
- Replace data URI sounds with real audio files

### Issue: Performance problems
- Reduce the number of blocks
- Lower canvas resolution
- Enable Matter.js engine optimization:
  ```javascript
  engine.positionIterations = 6;
  engine.velocityIterations = 4;
  ```

## Free Asset Resources

### Sounds (CC0 License)
- **Freesound.org** - Search: "slingshot", "impact", "wood break"
- **Mixkit.co** - Free game sound effects
- **OpenGameArt.org** - Physics game sound packs

### Graphics (CC0 License)
- **Kenney.nl** - Game asset packs (Physics Assets Pack recommended)
- **OpenGameArt.org** - Sprites and tilesets
- **itch.io** - Free game asset bundles

## License

This project is provided as-is for educational and development purposes.

## Credits

- Built with React, Vite, Matter.js, Howler.js, and GSAP
- Inspired by Angry Birds gameplay mechanics
- Created as a minimal prototype for learning physics-based game development

## Contributing

Feel free to fork this project and add your own features! Some ideas:
- Better graphics and animations
- More sophisticated AI for moving targets
- Multiplayer support
- Level editor

---

**Happy coding!** If you build something cool with this, share it!
