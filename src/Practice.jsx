import { useEffect, useRef } from "react";
import Matter from "matter-js";

const Practice = () => {
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

    // Ground
    const ground = Bodies.rectangle(width / 2, height - 15, width, 40, {
      isStatic: true,
      label: "ground",
      render: {
        sprite: {
          // public/game_assets/land.png
          texture: "/game_assets/land-bg.png",
          xScale: 3, // start with 1, adjust later
          yScale: 0.8,
        },
        // For debugging, you can comment sprite out and use:
        // fillStyle: "green",
      },
    });

    // Mahishmati Wall
    const wall = Bodies.rectangle(990, height - 450, 80, 300, {
      isStatic: true,
      label: "wall",
      render: {
        sprite: {
          texture: "/game_assets/entrance_wall.png",
          xScale: 0.3,
          yScale: 0.3,
        },
      },
    });

    // Tree and tree events ===============================================================================================
    // Main logic lies here only
    const scale = 0.3;
    const treePixelHeight = 300;
    const treeHeight = treePixelHeight * scale;

    // Pivot point at the base of the tree
    const pivotX = 200;
    const pivotY = height - 150;

    // Create the tree body
    const coconutTree = Bodies.rectangle(
      pivotX,
      pivotY - treeHeight / 2,
      90,
      treeHeight,
      {
        isStatic: true,
        label: "tree",
        render: {
          sprite: {
            texture: "/game_assets/coconut_tree.png",
            xScale: scale,
            yScale: scale,
          },
        },
      }
    );

    // Create a coconut/ball on the tree
    const coconut = Bodies.circle(
      pivotX + 20, // Position on the tree
      pivotY - treeHeight + 40, // Near the top of the tree
      15,
      {
        label: "coconut",
        restitution: 0.8,
        friction: 0.01,
        render: {
          fillStyle: "#8B4513", // Brown color for coconut
        },
      }
    );

    World.add(engine.world, [ground, wall, coconutTree, coconut]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Handle drag events
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.002,
        render: { visible: false },
      },
    });
    World.add(engine.world, mouseConstraint);

    let isDragging = false;
    let releasing = false;
    let initialCoconutPosition = {
      x: coconut.position.x,
      y: coconut.position.y,
    };

    // Function to rotate tree around its base
    function rotateTreeAroundBase(angle) {
      const maxAngle = 0.5; // ~28 degrees limit
      const clampedAngle = Math.max(Math.min(angle, maxAngle), -maxAngle);

      // Calculate new position to keep base fixed
      const centerToBase = treeHeight / 2;
      const newX = pivotX + centerToBase * Math.sin(clampedAngle);
      const newY = pivotY - centerToBase * Math.cos(clampedAngle);

      Matter.Body.setAngle(coconutTree, clampedAngle);
      Matter.Body.setPosition(coconutTree, { x: newX, y: newY });

      return clampedAngle;
    }

    // Function to update coconut position based on tree rotation
    function updateCoconutPosition(angle) {
      // Position the coconut relative to the tree's rotated position
      const coconutOffsetX = 20 * Math.cos(angle) - 40 * Math.sin(angle);
      const coconutOffsetY = 20 * Math.sin(angle) + 40 * Math.cos(angle);

      const newCoconutX = pivotX + coconutOffsetX;
      const newCoconutY = pivotY - treeHeight + 40 + coconutOffsetY;

      Matter.Body.setPosition(coconut, { x: newCoconutX, y: newCoconutY });
      Matter.Body.setVelocity(coconut, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(coconut, 0);
    }

    Matter.Events.on(mouseConstraint, "startdrag", (event) => {
      if (event.body === coconutTree) {
        isDragging = true;
        releasing = false;

        // Reset coconut to tree when starting to drag
        updateCoconutPosition(coconutTree.angle);
      }
    });

    Matter.Events.on(mouseConstraint, "mousemove", () => {
      if (!isDragging || mouseConstraint.body !== coconutTree) return;

      const mousePos = mouse.position;
      const dx = mousePos.x - pivotX;

      // Map mouse drag to angle (-0.5 to 0.5 radians)
      const angle = dx * 0.01;
      const clampedAngle = rotateTreeAroundBase(angle);

      // Update coconut position to follow the tree
      updateCoconutPosition(clampedAngle);
    });

    Matter.Events.on(mouseConstraint, "enddrag", (event) => {
      if (event.body === coconutTree) {
        isDragging = false;
        releasing = true;

        // Launch the coconut when releasing!
        const launchPower = coconutTree.angle * 50; // Power based on how far tree was bent
        const launchVelocity = {
          x: -launchPower, // Launch in opposite direction of bend
          y: -Math.abs(launchPower) * 0.5, // Some upward velocity
        };

        Matter.Body.setVelocity(coconut, launchVelocity);
        Matter.Body.setAngularVelocity(coconut, launchPower * 0.1);
      }
    });

    // Smooth spring-back for the tree
    Matter.Events.on(engine, "beforeUpdate", () => {
      if (releasing) {
        const currentAngle = coconutTree.angle;
        const nextAngle = currentAngle * 0.7; // Spring back damping

        if (Math.abs(nextAngle) < 0.01) {
          rotateTreeAroundBase(0);
          releasing = false;
        } else {
          rotateTreeAroundBase(nextAngle);
        }
      }
    });

    // Reset coconut when it goes off screen or after some time
    Matter.Events.on(engine, "afterUpdate", () => {
      // Reset coconut if it falls off screen
      if (
        coconut.position.y > height + 100 ||
        coconut.position.x < -100 ||
        coconut.position.x > width + 100
      ) {
        // Wait a bit before resetting
        setTimeout(() => {
          updateCoconutPosition(coconutTree.angle);
        }, 1000);
      }
    });

    // Optional: Add keyboard reset
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        updateCoconutPosition(coconutTree.angle);
      }
    });

    // Ends ===============================================================================================================
    // Handle responsive resize =======================================================================================
    const handleResize = () => {
      const { width, height } = getSize();

      // Update canvas size
      render.canvas.width = width;
      render.canvas.height = height;

      render.bounds.max.x = width;
      render.bounds.max.y = height;

      render.options.width = width;
      render.options.height = height;

      // Move + reshape ground
      Body.setPosition(ground, { x: width / 2, y: height - 20 });
      Body.setVertices(
        ground,
        Vertices.fromPath(`0 0 ${width} 0 ${width} 40 0 40`)
      );

      // OPTIONAL: scale sprite to match new width/height
      ground.render.sprite.xScale = width / 800; // based on original img width
      ground.render.sprite.yScale = 40 / 100; // based on original img height
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    // size ends here ============================================================================================
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);

      Render.stop(render);
      Runner.stop(runner);
      World.clear(engine.world);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, []);

  return (
    <>
      <div className="scene-container">
        <video
          muted
          playsInline
          src="/game_assets/bg.mp4"
          className="bg-video"
        />
        <div ref={sceneRef} className="scene"></div>
      </div>
    </>
  );
};

export default Practice;
