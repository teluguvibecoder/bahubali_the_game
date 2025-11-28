import { useDeferredValue, useEffect, useRef } from "react";
import Matter, { Events } from "matter-js";

const Iteration2 = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const renderRef = useRef(null);

  useEffect(() => {
    const {
      Engine,
      Render,
      Runner,
      World,
      Bodies,
      Body,
      Vertices,
      Constraint,
      Mouse,
      MouseConstraint,
    } = Matter;
    const engine = engineRef.current;

    const getSize = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const { width, height } = getSize();

    // Create renderer
    const render = Render.create({
      element: sceneRef.current,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
      },
    });

    renderRef.current = render;

    // Ground====================================================================================================================================================================
    const groundHeight = 40;
    const groundY = height - groundHeight / 2; // Ground center position (bottom edge at screen bottom)
    const ground = Bodies.rectangle(width / 2, groundY, width, groundHeight, {
      isStatic: true,
      label: "ground",
      render: {
        fillStyle: "#3cff00ff",
      },
    });

    // Ground end ====================================================================================================================================================================

    // Mahishmati wall ===============================================================================================================================================================
    const wallWidth = width * 0.15;
    const wallHeight = height * 0.6;

    const wall = Bodies.rectangle(
      width - wallWidth / 2 - 5, // Center the wall properly from the right edge
      height - wallHeight / 2, // Align with ground bottom
      wallWidth,
      wallHeight,
      {
        isStatic: true,
        label: "wall",
        render: {
          fillStyle: "#ff8800ff",
        },
      }
    );
    // Mahishmati wall end ===========================================================================================================================================================

    // Coconut Tree ==================================================================================================================================================================
    const treePositionX = 150;
    const treePositionY = groundY - groundHeight / 2; // This is the ground top surface

    const treeWidth = 50;
    const treeHeight = 150;

    const coconutTree = Bodies.rectangle(
      treePositionX,
      treePositionY - treeHeight / 2,
      treeWidth,
      treeHeight,
      {
        isStatic: false,
        label: "tree",
        render: {
          fillStyle: "#0080ffff", // Brown color for coconut
        },
      }
    );

    // hinge constraint: attach bottom of the tree to a fixed world point(treebase)
    const treeHinge = Constraint.create({
      pointA: {
        x: treePositionX,
        y: treePositionY,
      },
      bodyB: coconutTree,
      pointB: {
        x: 0,
        y: treeHeight / 2,
      },
      length: 0,
      stiffness: 1,
    });

    const initialTreeAngle = coconutTree.angle;

    // allow pulling back to 60 deg and forward 10 deg
    const maxBack = Math.PI / 3; // 60 deg
    const maxFront = Math.PI / 18; // 10 deg

    Events.on(engine, "beforeUpdate", () => {
      if (isDragging) return;
      const current = coconutTree.angle;
      const relative = current - initialTreeAngle;

      if (relative < -maxBack) {
        // too far back
        Body.setAngle(coconutTree, initialTreeAngle - maxBack);
        Body.setAngularVelocity(coconutReleased, 0);
      } else if (relative > maxFront) {
        // too far front
        Body.setAngle(coconutTree, initialTreeAngle + maxFront);
        Body.setAngularVelocity(coconutTree, 0);
      }
    });
    // Coconut Tree End ==============================================================================================================================================================

    // Coconut for reference =========================================================================================================================================================
    const coconutRadius = 15;
    const coconut = Bodies.circle(
      treePositionX + treeWidth / 2 - coconutRadius, // Position on the tree
      treePositionY - treeHeight / 2, // Near the top of the tree
      coconutRadius,
      {
        label: "coconut",
        restitution: 0.8,
        friction: 0.01,
        render: {
          fillStyle: "#ff0000ff", // Brown color for coconut
        },
      }
    );

    const coconutConstraint = Constraint.create({
      bodyA: coconutTree,
      pointA: {
        x: treeWidth,
        y: -treeHeight / 4,
      },
      bodyB: coconut,
      pointB: {
        x: 0,
        y: 0,
      },
      length: 0,
      stiffness: 1,
    });
    // Coconut for reference End =====================================================================================================================================================

    // Game drag, mouse logics =======================================================================================================================================================
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    render.mouse = mouse;

    let coconutReleased = false;
    let isDragging = false;
    let releasing = false;
    let resetScheduled = false;
    let score = 0;
    let hasPassedWall = false;
    let hasHitWall = false;

    Events.on(mouseConstraint, "startdrag", (event) => {
      if (event.body === coconut) {
        isDragging = true;
      } else {
        mouseConstraint.constraint.bodyB = null;
      }
    });

    Events.on(mouseConstraint, "enddrag", (event) => {
      if (event.body === coconut && !coconutReleased) {
        isDragging = false;
        releasing = true;

        World.remove(engine.world, coconutConstraint);
        coconutReleased = true;

        // Reset tracking flags for new throw
        hasPassedWall = false;
        hasHitWall = false;

        // Launch the coconut based on tree angle (transferred from Practice.jsx)
        const launchPower = coconutTree.angle * 50;
        const launchVelocity = {
          x: -launchPower, // Launch in opposite direction of bend
          y: -Math.abs(launchPower) * 0.5, // Some upward velocity
        };

        Body.setVelocity(coconut, launchVelocity);
        Body.setAngularVelocity(coconut, launchPower * 0.1);

        // Schedule automatic reset after 4 seconds (whether on screen or off)
        if (!resetScheduled) {
          resetScheduled = true;
          setTimeout(() => {
            resetCoconut();
          }, 4000);
        }
      }
    });

    // Game Grad, mouse logics End ===================================================================================================================================================

    // Reset coconut function ================================================================================================================================================================
    function resetCoconut() {
      // Reset tree angle
      Body.setAngle(coconutTree, initialTreeAngle);
      Body.setAngularVelocity(coconutTree, 0);

      // Reset coconut position
      const resetX = treePositionX + treeWidth / 2 - coconutRadius;
      const resetY = treePositionY - treeHeight / 2;
      Body.setPosition(coconut, { x: resetX, y: resetY });
      Body.setVelocity(coconut, { x: 0, y: 0 });
      Body.setAngularVelocity(coconut, 0);

      // Reattach constraint
      if (coconutReleased) {
        World.add(engine.world, coconutConstraint);
        coconutReleased = false;
      }

      releasing = false;
      isDragging = false;
      resetScheduled = false;
      hasPassedWall = false;
      hasHitWall = false;
    }

    // Collision detection with wall (lose point) ===========================================================================================================================================
    Events.on(engine, "collisionStart", (event) => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];

        // Check if coconut hit the wall
        if (
          (bodyA === coconut && bodyB === wall) ||
          (bodyA === wall && bodyB === coconut)
        ) {
          if (!hasHitWall) {
            hasHitWall = true;
            score -= 1;
            console.log("Hit wall! Score:", score);
          }
        }
      }
    });

    // Check if coconut crosses the wall (gain point) =======================================================================================================================================
    Events.on(engine, "afterUpdate", () => {
      if (coconutReleased && !hasPassedWall && !hasHitWall) {
        const wallLeftEdge = wall.position.x - wallWidth / 2;

        if (coconut.position.x > wallLeftEdge) {
          hasPassedWall = true;
          score += 1;
          console.log("Passed wall! Score:", score);
        }
      }
    });

    Events.on(render, "afterRender", () => {
      const ctx = render.context;

      // Use current render size (handles resize correctly)
      const w = render.options.width;
      const h = render.options.height;

      ctx.save();
      ctx.fillStyle = "#ff0000ff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.font = "bold 36px Arial";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";

      const scoreText = `Score: ${score}`;
      const padding = 20;

      ctx.strokeText(scoreText, w - padding, padding);
      ctx.fillText(scoreText, w - padding, padding);
      ctx.restore();
    });

    // Game logic End ========================================================================================================================================================================

    // Resize code for mobile and desktop ============================================================================================================================================
    const handleResize = () => {
      const { width, height } = getSize();

      // Update canvas size
      render.canvas.width = width; // changing the DOM itself
      render.canvas.height = height;
      render.bounds.max.x = width; //Make the visible area’s right boundary equal to the current screen width.
      render.bounds.max.y = height;
      render.options.width = width; //It updates that stored width value to match the current window width (after a resize).
      render.options.height = height;

      // Reposition the ground
      const groundHeight = 40;
      const groundY = height - groundHeight / 2; // Match initial setup

      Body.setPosition(ground, {
        x: width / 2,
        y: groundY,
      });
      Body.setVertices(
        ground,
        Vertices.fromPath(
          `0 0 ${width} 0 ${width} ${groundHeight} 0 ${groundHeight}`
        )
      );

      if (ground.render.sprite) {
        ground.render.sprite.xScale = width / 800; // scales the actual sprite images
        ground.render.sprite.yScale = 40 / 100;
      }

      // Reposition wall
      const wallWidth = width * 0.15;
      const wallHeight = height * 0.6;

      Body.setPosition(wall, {
        x: width - wallWidth / 2 - 5,
        y: height - wallHeight / 2, // Match initial setup
      });

      Body.setVertices(
        wall,
        Vertices.fromPath(
          `0 0 ${wallWidth} 0 ${wallWidth} ${wallHeight} 0 ${wallHeight}`
        )
      );

      // Recalculate the tree position (match initial setup)
      const newTreePositionY = groundY - groundHeight / 2; // Ground top surface
      const treeHeight = 150;

      Body.setPosition(coconutTree, {
        x: treePositionX,
        y: newTreePositionY - treeHeight / 2,
      });

      // Update hinge position
      treeHinge.pointA.x = treePositionX;
      treeHinge.pointA.y = newTreePositionY;
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Resize code for mobile and desktop Ends =======================================================================================================================================

    // Trigger Full screen on mobiles==================================================================================================================================================

    // trigger full screen ends here =================================================================================================================================================

    // Add the objects to the environment ============================================================================================================================================
    World.add(engine.world, [
      ground,
      coconut,
      coconutTree,
      treeHinge,
      coconutConstraint,
      mouseConstraint,
      wall,
    ]);

    // Run the engine==================================================================================================================================================================
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Clean up code ==================================================================================================================================================================
    return () => {
      // Remove fullscreen listeners
      document.removeEventListener("touchstart", handleFirstTouch);
      document.removeEventListener("click", handleFirstTouch);

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);

      Runner.stop(runner);
      Render.stop(render);
      Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
    };
  }, []);
  return (
    <>
      <div className="scene-container">
        {/* <video
          muted
          playsInline
          src="/game_assets/bg.mp4"
          className="bg-video"
        /> */}
        <div ref={sceneRef} className="scene"></div>
      </div>
    </>
  );
};

export default Iteration2;
