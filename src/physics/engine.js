import Matter from 'matter-js';

/**
 * Create and configure a Matter.js physics engine
 * @returns {Object} Matter.js engine and world
 */
export function createEngine() {
  // Create the physics engine
  const engine = Matter.Engine.create({
    gravity: { x: 0, y: 1 } // Standard downward gravity
  });

  return {
    engine,
    world: engine.world
  };
}

/**
 * Create a Matter.js renderer attached to a canvas
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Object} engine - Matter.js engine
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} Matter.js render instance
 */
export function createRenderer(canvas, engine, width, height) {
  const render = Matter.Render.create({
    canvas: canvas,
    engine: engine,
    options: {
      width: width,
      height: height,
      wireframes: false, // Use colored fills instead of wireframes
      background: '#87CEEB', // Sky blue background
      pixelRatio: 1, // Force 1:1 pixel ratio for consistent rendering
      hasBounds: false,
      enabled: true,
      wireframeBackground: 'transparent'
    }
  });

  return render;
}

/**
 * Create ground and walls for the physics world
 * @param {Object} world - Matter.js world
 * @param {number} width - World width
 * @param {number} height - World height
 */
export function createBoundaries(world, width, height) {
  const wallThickness = 50;

  // Ground
  const ground = Matter.Bodies.rectangle(
    width / 2,
    height - 25,
    width,
    wallThickness,
    {
      isStatic: true,
      label: 'ground',
      render: { fillStyle: '#8B4513' } // Brown ground
    }
  );

  // Left wall (invisible, far left)
  const leftWall = Matter.Bodies.rectangle(
    -25,
    height / 2,
    wallThickness,
    height * 2,
    {
      isStatic: true,
      label: 'leftWall',
      render: { fillStyle: '#666' }
    }
  );

  // Right wall (invisible, far right)
  const rightWall = Matter.Bodies.rectangle(
    width + 25,
    height / 2,
    wallThickness,
    height * 2,
    {
      isStatic: true,
      label: 'rightWall',
      render: { fillStyle: '#666' }
    }
  );

  Matter.World.add(world, [ground, leftWall, rightWall]);
}

/**
 * Create a stack/tower of blocks
 * @param {Object} world - Matter.js world
 * @param {number} x - X position of tower base
 * @param {number} y - Y position of tower base
 * @param {number} columns - Number of columns
 * @param {number} rows - Number of rows
 * @returns {Array} Array of block bodies
 */
export function createTower(world, x, y, columns, rows) {
  const blockWidth = 40;
  const blockHeight = 30;
  const blocks = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const block = Matter.Bodies.rectangle(
        x + col * (blockWidth + 5),
        y - row * (blockHeight + 2),
        blockWidth,
        blockHeight,
        {
          label: 'block',
          density: 0.001, // Light blocks that fall easily
          restitution: 0.3, // Some bounciness
          friction: 0.5,
          render: {
            fillStyle: getRandomBlockColor()
          }
        }
      );
      blocks.push(block);
    }
  }

  Matter.World.add(world, blocks);
  return blocks;
}

/**
 * Get a random color for blocks
 */
function getRandomBlockColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Create a projectile (bird)
 * @param {Object} world - Matter.js world
 * @param {number} x - X position
 * @param {number} y - Y position
 * @returns {Object} Projectile body
 */
export function createProjectile(world, x, y) {
  const projectile = Matter.Bodies.circle(x, y, 15, {
    label: 'projectile',
    density: 0.004, // Heavier for impact
    restitution: 0.8, // Bouncy
    friction: 0.3,
    render: {
      fillStyle: '#FF4444' // Red bird
    }
  });

  Matter.World.add(world, projectile);
  return projectile;
}

/**
 * Create slingshot constraint
 * @param {Object} world - Matter.js world
 * @param {Object} projectile - Projectile body
 * @param {number} anchorX - Anchor X position
 * @param {number} anchorY - Anchor Y position
 * @returns {Object} Constraint
 */
export function createSlingshot(world, projectile, anchorX, anchorY) {
  const slingshot = Matter.Constraint.create({
    pointA: { x: anchorX, y: anchorY },
    bodyB: projectile,
    stiffness: 0.05, // How elastic the slingshot is
    length: 0, // Rest length
    render: {
      strokeStyle: '#8B4513',
      lineWidth: 3
    }
  });

  Matter.World.add(world, slingshot);
  return slingshot;
}
