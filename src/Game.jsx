import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

/**
 * Core idea:
 * - Create a slingshot anchor + hero circle (Matter.Body)
 * - Attach with a Constraint (sling). Add MouseConstraint to drag.
 * - On enddrag when hero released, remove sling so body flies.
 * - After short delay, spawn a ragdoll at hero position:
 *    create several bodies (head, torso, upper/lower limbs) and constraints between them
 *    copy current velocity from hero to ragdoll parts for continuity
 * - Remove the single hero body after ragdoll spawns
 *
 * This file uses Matter.Render for quick visuals (shapes).
 */

export default function Game() {
  const sceneRef = useRef(null);
  const engineRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [launched, setLaunched] = useState(false);

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

    const width = 900;
    const height = 540;

    // render
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "#0b0a0a",
      },
    });

    // ground and walls
    const ground = Bodies.rectangle(width / 2, height - 10, width, 40, {
      isStatic: true,
      render: { fillStyle: "#222" },
    });
    const leftWall = Bodies.rectangle(-30, height / 2, 60, height, {
      isStatic: true,
    });
    const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, {
      isStatic: true,
    });

    // slingshot anchor point
    const anchor = { x: 140, y: 360 };

    // hero (projectile) - single circle that will be replaced by ragdoll on release
    let hero = Bodies.circle(anchor.x, anchor.y, 18, {
      density: 0.004,
      restitution: 0.2,
      frictionAir: 0.02,
      render: { fillStyle: "#ff5252" }, // red hero
    });

    // simple platform for the sling
    const platform = Bodies.rectangle(140, 420, 120, 16, {
      isStatic: true,
      render: { fillStyle: "#6b5b3a" },
    });

    // create target stack (blocks)
    function createTower(x, y) {
      const blocks = [];
      const w = 60,
        h = 40;
      blocks.push(
        Bodies.rectangle(x, y, w, h, { render: { fillStyle: "#b38b59" } })
      );
      blocks.push(
        Bodies.rectangle(x + 70, y, w, h, { render: { fillStyle: "#b38b59" } })
      );
      blocks.push(
        Bodies.rectangle(x + 35, y - 55, 120, 30, {
          render: { fillStyle: "#8b5e3c" },
        })
      );
      return blocks;
    }
    const towers = [...createTower(620, 420), ...createTower(760, 420)];

    // sling constraint: pointA is fixed anchor, bodyB = hero
    let sling = Constraint.create({
      pointA: anchor,
      bodyB: hero,
      stiffness: 0.02,
      render: { strokeStyle: "#ffffff", lineWidth: 3 },
    });

    // add everything to world
    World.add(engine.world, [
      ground,
      leftWall,
      rightWall,
      platform,
      hero,
      sling,
      ...towers,
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

    // collision-based removal: if body falls below canvas, remove it
    Events.on(engine, "afterUpdate", () => {
      Composite.allBodies(engine.world).forEach((b) => {
        if (!b.isStatic && b.position.y > height + 200) {
          try {
            World.remove(engine.world, b);
          } catch (e) {}
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

    // spawn ragdoll: create multiple bodies + constraints mimicking limbs,
    // copy hero's position & velocity so motion feels continuous
    function spawnRagdollFromHero(heroBody, world) {
      if (!heroBody) return;
      // read current state
      const pos = Matter.Vector.clone(heroBody.position);
      const vel = Matter.Vector.clone(heroBody.velocity);
      const angle = heroBody.angle;

      // create ragdoll pieces (simple shapes)
      const head = Bodies.circle(pos.x, pos.y - 20, 12, {
        density: 0.001,
        frictionAir: 0.02,
        render: { fillStyle: "#ffd6a5" },
      });
      const torso = Bodies.rectangle(pos.x, pos.y + 4, 28, 36, {
        density: 0.002,
        frictionAir: 0.02,
        render: { fillStyle: "#6b8cff" },
      });
      const upperArmL = Bodies.rectangle(pos.x - 18, pos.y - 2, 10, 24, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#6b8cff" },
      });
      const upperArmR = Bodies.rectangle(pos.x + 18, pos.y - 2, 10, 24, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#6b8cff" },
      });
      const lowerArmL = Bodies.rectangle(pos.x - 30, pos.y + 10, 10, 20, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#6b8cff" },
      });
      const lowerArmR = Bodies.rectangle(pos.x + 30, pos.y + 10, 10, 20, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#6b8cff" },
      });
      const upperLegL = Bodies.rectangle(pos.x - 8, pos.y + 30, 12, 28, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#5e4b8b" },
      });
      const upperLegR = Bodies.rectangle(pos.x + 8, pos.y + 30, 12, 28, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#5e4b8b" },
      });
      const lowerLegL = Bodies.rectangle(pos.x - 8, pos.y + 55, 12, 24, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#5e4b8b" },
      });
      const lowerLegR = Bodies.rectangle(pos.x + 8, pos.y + 55, 12, 24, {
        density: 0.001,
        frictionAir: 0.03,
        render: { fillStyle: "#5e4b8b" },
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

      // place ragdoll parts into world
      World.add(world, [
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

      // copy velocity/angle from hero so ragdoll continues motion
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
      pieces.forEach((p) => {
        Body.setVelocity(p, vel);
        Body.setAngularVelocity(p, heroBody.angularVelocity || 0);
      });

      // remove original hero body from world
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
        <div>Launched: {launched ? "Yes" : "No"}</div>
        <div className="hint">
          Drag the red circle, release to launch → ragdoll spawns
        </div>
      </div>
    </div>
  );
}
