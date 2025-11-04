import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

/**
 * Baahubali-themed slingshot game with sprite-based rendering
 * - Ball projectile launches from coconut tree slingshot
 * - Transforms into ragdoll soldier mid-air
 * - Environment includes tree, cannon, elephant, wall, and kingdom gate
 * - Win condition: soldier reaches gate sensor
 * - Fail condition: hits cannon/wall before gate
 */

export default function Game() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [gameStatus, setGameStatus] = useState(""); // "victory" or "failed"

  useEffect(() => {
    // --- basic Matter setup ---
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Constraint = Matter.Constraint;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const Composite = Matter.Composite;
    const Events = Matter.Events;

    const engine = Engine.create();
    engine.gravity.y = 1.0;
    engineRef.current = engine;

    const width = 1200;
    const height = 600;

    // render with background image
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent", // We'll add Land.png as canvas background
      },
    });

    // Add background image to canvas
    const canvas = render.canvas;
    canvas.style.backgroundImage = "url('/game_assets/land.png')";
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";

    // ground (invisible, for physics only)
    const ground = Bodies.rectangle(width / 2, height - 10, width, 40, {
      isStatic: true,
      label: "ground",
      render: { fillStyle: "transparent" },
    });
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height, {
      isStatic: true,
      label: "leftWall",
    });
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, {
      isStatic: true,
      label: "rightWall",
    });

    // --- ENVIRONMENT SPRITES ---
    // Coconut tree (slingshot base) at far left
    const tree = Bodies.rectangle(120, height - 120, 80, 160, {
      isStatic: true,
      label: "tree",
      render: {
        sprite: {
          texture: "/game_assets/coconut_tree.png",
          xScale: 0.3,
          yScale: 0.3,
        },
      },
    });

    // Goat ram obstacle on the right
    const goatRam = Bodies.rectangle(900, height - 80, 100, 80, {
      isStatic: true,
      label: "goatRam",
      render: {
        sprite: {
          texture: "/game_assets/goat.png",
          xScale: 0.3,
          yScale: 0.3,
        },
      },
    });

    // Fort entrance wall on the right (obstacle before the goal)
    const wall = Bodies.rectangle(1050, height - 150, 80, 300, {
      isStatic: true,
      label: "wall",
      render: {
        sprite: {
          texture: "/game_assets/entrance_wall.png",
          xScale: 0.5,
          yScale: 0.5,
        },
      },
    });

    // Gate sensor (invisible trigger for win condition - behind the wall)
    const gateSensor = Bodies.rectangle(1150, height - 100, 100, 200, {
      isStatic: true,
      isSensor: true, // No physical collision, only detection
      label: "gateSensor",
      render: { fillStyle: "rgba(0, 255, 0, 0.1)" }, // Slightly visible for debugging
    });

    // --- PROJECTILE ---
    // Slingshot anchor point (on coconut tree)
    const anchor = { x: 120, y: height - 150 };

    // Hero (projectile) - starts as small soldier sprite
    let hero = Bodies.circle(anchor.x, anchor.y, 15, {
      density: 0.004,
      restitution: 0.2,
      frictionAir: 0.02,
      label: "hero",
      render: {
        sprite: {
          texture: "/game_assets/soldier.png",
          xScale: 0.04, // Smaller scale for ball form
          yScale: 0.04,
        },
      },
    });

    // Sling constraint: pointA is fixed anchor, bodyB = hero
    let sling = Constraint.create({
      pointA: anchor,
      bodyB: hero,
      stiffness: 0.02,
      render: { strokeStyle: "#8B4513", lineWidth: 4 }, // Brown slingshot
    });

    // Add everything to world
    World.add(engine.world, [
      ground,
      leftWall,
      rightWall,
      tree,
      goatRam,
      wall,
      gateSensor,
      hero,
      sling,
    ]);

    // add mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.02, render: { visible: false } },
    });
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // helper to reset the scene: remove everything and recreate
    function resetScene() {
      // clear world and re-add defaults by reloading page state
      World.clear(engine.world, true);
      Engine.clear(engine);

      // re-run effect by setting running false and letting cleanup create again is messy;
      // simpler: reload window (quick hack for prototype). In production you would re-create objects.
      window.location.reload();
    }

    // Collision-based removal: if body falls below canvas, remove it
    Events.on(engine, "afterUpdate", () => {
      Composite.allBodies(engine.world).forEach((b) => {
        if (!b.isStatic && b.position.y > height + 200) {
          try {
            World.remove(engine.world, b);
          } catch (e) {}
        }
      });
    });

    // --- WIN/FAIL DETECTION ---
    // Track if ragdoll parts have been created
    let ragdollParts = [];

    // Collision detection for win/fail conditions
    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        // Check if any ragdoll part reaches the gate sensor -> WIN
        if (
          (bodyA.label === "gateSensor" && ragdollParts.includes(bodyB)) ||
          (bodyB.label === "gateSensor" && ragdollParts.includes(bodyA))
        ) {
          if (gameStatus === "") {
            setGameStatus("victory");
          }
        }

        // Check if projectile or ragdoll hits goatRam/wall before gate -> FAIL
        const isRagdollOrHero =
          ragdollParts.includes(bodyA) ||
          ragdollParts.includes(bodyB) ||
          bodyA.label === "hero" ||
          bodyB.label === "hero";

        const hitObstacle =
          bodyA.label === "goatRam" ||
          bodyB.label === "goatRam" ||
          bodyA.label === "wall" ||
          bodyB.label === "wall";

        if (isRagdollOrHero && hitObstacle && gameStatus === "") {
          // Only fail if they haven't reached the gate yet
          setTimeout(() => {
            if (gameStatus === "") {
              setGameStatus("failed");
            }
          }, 500); // Small delay to see if they make it over
        }
      });
    });

    // detect release: when mouse ends drag and body was hero -> detach sling
    Events.on(mouseConstraint, "enddrag", (e) => {
      if (!e.body) return;
      if (e.body === hero) {
        // delay tiny bit to avoid immediate ragdoll spawn while still held
        setTimeout(() => {
          // detach sling so hero flies
          try {
            World.remove(engine.world, sling);
          } catch (e) {}
          setLaunched(true);
          // spawn ragdoll after a short delay (so hero is moving)
          setTimeout(() => spawnRagdollFromHero(hero, engine.world), 300);
        }, 20);
      }
    });

    // Spawn ragdoll: create multiple bodies + constraints mimicking soldier limbs
    // Copy hero's position & velocity so motion feels continuous
    // Use soldier.png sprite for all body parts
    function spawnRagdollFromHero(heroBody, world) {
      if (!heroBody) return;
      // Read current state
      const pos = Matter.Vector.clone(heroBody.position);
      const vel = Matter.Vector.clone(heroBody.velocity);
      const angle = heroBody.angle;

      // Soldier sprite configuration (applied to all body parts)
      const soldierSprite = {
        texture: "/game_assets/soldier.png",
        xScale: 0.08,
        yScale: 0.08,
      };

      // Create ragdoll pieces with soldier sprite
      const head = Bodies.circle(pos.x, pos.y - 20, 12, {
        density: 0.001,
        frictionAir: 0.02,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const torso = Bodies.rectangle(pos.x, pos.y + 4, 28, 36, {
        density: 0.002,
        frictionAir: 0.02,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const upperArmL = Bodies.rectangle(pos.x - 18, pos.y - 2, 10, 24, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const upperArmR = Bodies.rectangle(pos.x + 18, pos.y - 2, 10, 24, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const lowerArmL = Bodies.rectangle(pos.x - 30, pos.y + 10, 10, 20, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const lowerArmR = Bodies.rectangle(pos.x + 30, pos.y + 10, 10, 20, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const upperLegL = Bodies.rectangle(pos.x - 8, pos.y + 30, 12, 28, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const upperLegR = Bodies.rectangle(pos.x + 8, pos.y + 30, 12, 28, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const lowerLegL = Bodies.rectangle(pos.x - 8, pos.y + 55, 12, 24, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });
      const lowerLegR = Bodies.rectangle(pos.x + 8, pos.y + 55, 12, 24, {
        density: 0.001,
        frictionAir: 0.03,
        label: "ragdollPart",
        render: {
          sprite: soldierSprite,
        },
      });

      // joints (constraints) connect pieces — simple revolute-like constraints
      const neck = Constraint.create({
        bodyA: head,
        pointA: { x: 0, y: 12 },
        bodyB: torso,
        pointB: { x: 0, y: -18 },
        stiffness: 0.6,
        length: 0,
        render: { visible: false },
      });
      const shoulderL = Constraint.create({
        bodyA: upperArmL,
        pointA: { x: 0, y: -10 },
        bodyB: torso,
        pointB: { x: -12, y: -8 },
        stiffness: 0.5,
        length: 0,
        render: { visible: false },
      });
      const shoulderR = Constraint.create({
        bodyA: upperArmR,
        pointA: { x: 0, y: -10 },
        bodyB: torso,
        pointB: { x: 12, y: -8 },
        stiffness: 0.5,
        length: 0,
        render: { visible: false },
      });
      const elbowL = Constraint.create({
        bodyA: lowerArmL,
        pointA: { x: 0, y: -8 },
        bodyB: upperArmL,
        pointB: { x: 0, y: 10 },
        stiffness: 0.6,
        length: 0,
        render: { visible: false },
      });
      const elbowR = Constraint.create({
        bodyA: lowerArmR,
        pointA: { x: 0, y: -8 },
        bodyB: upperArmR,
        pointB: { x: 0, y: 10 },
        stiffness: 0.6,
        length: 0,
        render: { visible: false },
      });
      const hipL = Constraint.create({
        bodyA: upperLegL,
        pointA: { x: 0, y: -12 },
        bodyB: torso,
        pointB: { x: -8, y: 14 },
        stiffness: 0.5,
        length: 0,
        render: { visible: false },
      });
      const hipR = Constraint.create({
        bodyA: upperLegR,
        pointA: { x: 0, y: -12 },
        bodyB: torso,
        pointB: { x: 8, y: 14 },
        stiffness: 0.5,
        length: 0,
        render: { visible: false },
      });
      const kneeL = Constraint.create({
        bodyA: lowerLegL,
        pointA: { x: 0, y: -10 },
        bodyB: upperLegL,
        pointB: { x: 0, y: 12 },
        stiffness: 0.6,
        length: 0,
        render: { visible: false },
      });
      const kneeR = Constraint.create({
        bodyA: lowerLegR,
        pointA: { x: 0, y: -10 },
        bodyB: upperLegR,
        pointB: { x: 0, y: 12 },
        stiffness: 0.6,
        length: 0,
        render: { visible: false },
      });

      // Store ragdoll parts for collision detection
      const pieces = [
        head,
        torso,
        upperArmL,
        upperArmR,
        lowerArmL,
        lowerArmR,
        upperLegL,
        upperLegR,
        lowerLegL,
        lowerLegR,
      ];

      // Add to global ragdoll tracking
      ragdollParts.push(...pieces);

      // Place ragdoll parts and constraints into world
      World.add(world, [
        ...pieces,
        neck,
        shoulderL,
        shoulderR,
        elbowL,
        elbowR,
        hipL,
        hipR,
        kneeL,
        kneeR,
      ]);

      // Copy velocity/angle from hero so ragdoll continues motion
      pieces.forEach((p) => {
        Body.setVelocity(p, vel);
        Body.setAngularVelocity(p, heroBody.angularVelocity || 0);
      });

      // Remove original hero body from world
      try {
        World.remove(world, heroBody);
      } catch (e) {}
    }

    // UI controls: Reset button
    const controls = document.createElement("div");
    controls.style.position = "absolute";
    controls.style.left = "18px";
    controls.style.top = "8px";
    controls.style.zIndex = 10;
    controls.innerHTML = '<button id="resetBtn">Reset</button>';
    sceneRef.current.appendChild(controls);
    document.getElementById("resetBtn").addEventListener("click", () => {
      // quick reset approach
      window.location.reload();
    });

    // run engine and renderer
    Engine.run(engine);
    Render.run(render);

    setRunning(true);

    // cleanup on unmount
    return () => {
      try {
        Render.stop(render);
        Engine.clear(engine);
        render.canvas.remove();
        render.textures = {};
      } catch (e) {}
    };
  }, []); // run once

  return (
    <div className="gameWrap">
      <div ref={sceneRef} className="scene" />
      <div className="hud">
        <div className="hint">
          Drag the ball from the coconut tree and launch the soldier to reach
          the kingdom gate!
        </div>
        {launched && !gameStatus && (
          <div style={{ color: "#FFA500", fontWeight: "bold", marginTop: "10px" }}>
            Soldier launched! Watch the trajectory...
          </div>
        )}
        {gameStatus === "victory" && (
          <div
            style={{
              color: "#00FF00",
              fontWeight: "bold",
              fontSize: "24px",
              marginTop: "10px",
            }}
          >
            🎉 VICTORY! The soldier reached the kingdom! 🎉
          </div>
        )}
        {gameStatus === "failed" && (
          <div
            style={{
              color: "#FF0000",
              fontWeight: "bold",
              fontSize: "20px",
              marginTop: "10px",
            }}
          >
            ❌ Try Again! The soldier was blocked by obstacles.
          </div>
        )}
      </div>
    </div>
  );
}
