import { useEffect, useRef } from "react";
import Matter from "matter-js";

const Practice = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const renderRef = useRef(null);
  const wallImgRef = useRef(null);

  // Store references for resize handling
  const pivotRef = useRef({ x: 200, y: 0 });
  const dimensionsRef = useRef({
    wallWidth: 500,
    wallHeight: 700,
    treeHeight: 0
  });

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
    const wallWidth = 500;
    const wallHeight = 700;

    // Store dimensions for later use
    dimensionsRef.current.wallWidth = wallWidth;
    dimensionsRef.current.wallHeight = wallHeight;

    const wall = Bodies.rectangle(
      width - wallWidth / 2 - 50, // Center the wall properly from the right edge
      height - wallHeight / 2 - 15, // Align with ground (ground is at height - 15)
      wallWidth,
      wallHeight,
      {
        isStatic: true,
        label: "wall",
        render: {
          visible: false, // hide in Matter's renderer (physics still works)
        },
      }
    );

    // Tree and tree events ===============================================================================================
    // Main logic lies here only
    const scale = 0.25;
    const treePixelHeight = 500;
    const treeHeight = treePixelHeight * scale;

    // Store tree height for later use
    dimensionsRef.current.treeHeight = treeHeight;

    // Pivot point at the base of the tree
    const pivotX = 200;
    const pivotY = height - 50;

    // Store pivot points for resize handling
    pivotRef.current.x = pivotX;
    pivotRef.current.y = pivotY;

    // Create the tree body
    const coconutTree = Bodies.rectangle(
      pivotX,
      pivotY - 20 - treeHeight / 2,
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
      pivotY - treeHeight, // Near the top of the tree
      15,
      {
        label: "coconut",
        restitution: 0.8,
        friction: 0.01,
        render: {
          fillStyle: "#ff0000ff", // Brown color for coconut
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
      const maxAngle = +1; // ~28 degrees limit
      const clampedAngle = Math.max(Math.min(angle, maxAngle), -maxAngle); // limits the input angle with in allowed range.

      // Use stored pivot references
      const currentPivotX = pivotRef.current.x;
      const currentPivotY = pivotRef.current.y;
      const currentTreeHeight = dimensionsRef.current.treeHeight;

      // Calculate new position to keep base fixed
      const centerToBase = currentTreeHeight / 2;
      const newX = currentPivotX + centerToBase * Math.sin(clampedAngle);
      const newY = currentPivotY - 20 - centerToBase * Math.cos(clampedAngle);

      Matter.Body.setAngle(coconutTree, clampedAngle);
      Matter.Body.setPosition(coconutTree, { x: newX, y: newY });

      return clampedAngle;
    }

    // Function to update coconut position based on tree rotation
    function updateCoconutPosition(angle) {
      // Use stored pivot references
      const currentPivotX = pivotRef.current.x;
      const currentPivotY = pivotRef.current.y;
      const currentTreeHeight = dimensionsRef.current.treeHeight;

      // Position the coconut relative to the tree's rotated position
      const coconutOffsetX = 20 * Math.cos(angle) - 40 * Math.sin(angle);
      const coconutOffsetY = 20 * Math.sin(angle) + 40 * Math.cos(angle);

      const newCoconutX = currentPivotX + coconutOffsetX;
      const newCoconutY = currentPivotY - currentTreeHeight + coconutOffsetY;

      Matter.Body.setPosition(coconut, { x: newCoconutX, y: newCoconutY });
      Matter.Body.setVelocity(coconut, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(coconut, 0);
    }

    // coconut functions
    function attachCoconutToTree() {
      console.log("🔴 ATTACHING COCONUT");
      console.log("Tree angle:", coconutTree.angle);
      console.log(
        "Coconut position BEFORE:",
        coconut.position.x,
        coconut.position.y
      );
      // Matter.Body.setStatic(coconut, true);
      updateCoconutPosition(coconutTree.angle);
      console.log(
        "Coconut position AFTER:",
        coconut.position.x,
        coconut.position.y
      );
      console.log("Is coconut static?", coconut.isStatic);
    }

    function detachCoconutFromTree() {
      console.log("🟢 DETACHING COCONUT");
      // Matter.Body.setStatic(coconut, false);
      console.log("Is coconut static?", coconut.isStatic);
    }

    Matter.Events.on(mouseConstraint, "startdrag", (event) => {
      console.log("🖱️ START DRAG", event.body.label);
      if (event.body === coconutTree) {
        isDragging = true;
        releasing = false;
        attachCoconutToTree();
      }
    });

    Matter.Events.on(mouseConstraint, "mousemove", () => {
      if (!isDragging || mouseConstraint.body !== coconutTree) return;

      const mousePos = mouse.position;
      const currentPivotX = pivotRef.current.x;
      const dx = mousePos.x - currentPivotX;

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

        detachCoconutFromTree(); // now the coconut can fly

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
      if (isDragging) {
        updateCoconutPosition(coconutTree.angle);
      }
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

    let resetScheduled = false;

    // Reset coconut when it goes off screen or after some time
    Matter.Events.on(engine, "afterUpdate", () => {
      // 🔁 Sync wall image with physics body
      if (wallImgRef.current) {
        const { x, y } = wall.position;
        const wallWidth = dimensionsRef.current.wallWidth;
        const wallHeight = dimensionsRef.current.wallHeight;

        // Position the image to match the physics body center
        wallImgRef.current.style.left = `${x - wallWidth / 2}px`;
        wallImgRef.current.style.top = `${y - wallHeight / 2}px`;
        wallImgRef.current.style.width = `${wallWidth}px`;
        wallImgRef.current.style.height = `${wallHeight}px`;
      }

      // Reset coconut if it falls off screen
      if (
        coconut.position.y > height + 100 ||
        coconut.position.x < -100 ||
        coconut.position.x > width + 100
      ) {
        if (!resetScheduled) {
          resetScheduled = true;
          setTimeout(() => {
            console.log("⏰ RESET TRIGGERED");
            console.log("Tree angle before reset:", coconutTree.angle);
            rotateTreeAroundBase(0);
            releasing = false;
            isDragging = false;
            console.log("Tree angle after reset:", coconutTree.angle);

            attachCoconutToTree();
            resetScheduled = false;
          }, 1000);
        }
      }
    });

    // Optional: Add keyboard reset
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        // updateCoconutPosition(coconutTree.angle);
        attachCoconutToTree();
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

      // Reposition ground (use consistent height - 15)
      Body.setPosition(ground, { x: width / 2, y: height - 15 });
      Body.setVertices(
        ground,
        Vertices.fromPath(`0 0 ${width} 0 ${width} 40 0 40`)
      );
      ground.render.sprite.xScale = width / 800;
      ground.render.sprite.yScale = 40 / 100;

      // Reposition wall (use same calculation as initial setup)
      const wallWidth = dimensionsRef.current.wallWidth;
      const wallHeight = dimensionsRef.current.wallHeight;
      Body.setPosition(wall, {
        x: width - wallWidth / 2 - 50,
        y: height - wallHeight / 2 - 15,
      });

      // Recalculate tree position based on new height
      const newPivotX = pivotRef.current.x; // Keep x same (200)
      const newPivotY = height - 50;
      const treeHeight = dimensionsRef.current.treeHeight;

      // Update stored pivot point
      pivotRef.current.y = newPivotY;

      Body.setPosition(coconutTree, {
        x: newPivotX,
        y: newPivotY - 20 - treeHeight / 2,
      });

      // Update coconut position to match tree
      const coconutOffsetX = 20;
      const coconutOffsetY = -treeHeight + 40;
      Body.setPosition(coconut, {
        x: newPivotX + coconutOffsetX,
        y: newPivotY + coconutOffsetY,
      });
      Body.setVelocity(coconut, { x: 0, y: 0 });
      Body.setAngularVelocity(coconut, 0);

      // Reset tree angle on resize
      Body.setAngle(coconutTree, 0);
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

        <img
          ref={wallImgRef}
          src="/game_assets/entrance_wall.png"
          className="wall-img"
          alt="Mahishmati wall"
        />
      </div>
    </>
  );
};

export default Practice;
