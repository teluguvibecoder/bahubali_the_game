import { useDeferredValue, useEffect, useRef, useState } from "react";
import Matter, { Events, use } from "matter-js";

const Iteration2 = () => {
  const sceneRef = useRef(null);
  const engineRef = useRef(Matter.Engine.create());
  const renderRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const musicRef = useRef(null);
  const releaseSfxRefs = useRef([]);

  const sfxFiles = [
    "/music/sfx/1_.mp3",
    "/music/sfx/2_.mp3",
    "/music/sfx/3_.mp3",
    "/music/sfx/4_.mp3",
    "/music/sfx/5_.mp3",
    "/music/sfx/6_.mp3",
  ];

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

    let resizeTimeout = null;

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
    const scale = 0.25;

    // Ground====================================================================================================================================================================
    const groundHeight = 40;
    const groundY = height - groundHeight / 2; // Ground center position (bottom edge at screen bottom)
    const ground = Bodies.rectangle(width / 2, groundY, width, groundHeight, {
      isStatic: true,
      label: "ground",
      render: {
        fillStyle: "#964b00",
      },
    });

    // Ground end ====================================================================================================================================================================

    // Mahishmati wall ===============================================================================================================================================================
    const WALL_IMG_WIDTH = 1882;
    const WALL_IMG_HEIGHT = 2572;

    const wallTargetHeightRatio = 0.7;

    const wallScale = (height * wallTargetHeightRatio) / WALL_IMG_HEIGHT;

    const wallWidth = WALL_IMG_WIDTH * wallScale;
    const wallHeight = WALL_IMG_HEIGHT * wallScale;

    const wall = Bodies.rectangle(
      width - wallWidth / 2, // Center the wall properly from the right edge
      height - wallHeight / 2, // Align with ground bottom
      wallWidth,
      wallHeight,
      {
        isStatic: true,
        label: "wall",
        render: {
          sprite: {
            texture: "/game_assets/entrance_wall.png",
            xScale: wallScale,
            yScale: wallScale,
          },
        },
      }
    );
    // Mahishmati wall end ===========================================================================================================================================================

    // Coconut Tree ==================================================================================================================================================================
    const TREE_IMG_WIDTH = 677;
    const TREE_IMG_HEIGHT = 961;

    const treeTargetHeightRatio = 0.3;

    const treePositionX = 150;
    const treePositionY = groundY - groundHeight / 2; // This is the ground top surface

    const treeScale = (height * treeTargetHeightRatio) / TREE_IMG_HEIGHT;

    const treeWidth = TREE_IMG_WIDTH * treeScale;
    const treeHeight = TREE_IMG_HEIGHT * treeScale;

    const coconutTree = Bodies.rectangle(
      treePositionX,
      treePositionY - treeHeight / 2,
      treeWidth,
      treeHeight,
      {
        isStatic: false,
        label: "tree",
        render: {
          sprite: {
            texture: "/game_assets/coconut_tree.png",
            xScale: treeScale,
            yScale: treeScale,
          },
          //   fillStyle: "transparent",
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
        Body.setAngularVelocity(coconutTree, 0);
      } else if (relative > maxFront) {
        // too far front
        Body.setAngle(coconutTree, initialTreeAngle + maxFront);
        Body.setAngularVelocity(coconutTree, 0);
      }
    });
    // Coconut Tree End ==============================================================================================================================================================

    // Coconut for reference =========================================================================================================================================================
    const SOLDIER_IMG_WIDTH = 2142;
    const SOLDIER_IMG_HEIGHT = 3027;
    const soldierTargetHeightRatio = 0.2;

    const soldierScale =
      (height * soldierTargetHeightRatio) / SOLDIER_IMG_HEIGHT;

    const soldierRadius =
      (Math.min(SOLDIER_IMG_WIDTH, SOLDIER_IMG_HEIGHT) * soldierScale) / 2;

    const coconut = Bodies.circle(
      treePositionX + treeWidth / 2, // Position on the tree
      treePositionY - treeHeight / 2, // Near the top of the tree
      soldierRadius,
      {
        label: "coconut",
        restitution: 0.8,
        friction: 0.01,
        render: {
          sprite: {
            texture: "/game_assets/soldier.png",
            xScale: soldierScale,
            yScale: soldierScale,
          },
        },
      }
    );

    Matter.Body.setInertia(coconut, Infinity);

    const coconutConstraint = Constraint.create({
      bodyA: coconutTree,
      // local point near the right edge, roughly center vertically
      pointA: {
        x: treeWidth / 2, // right side minus a bit
        y: 0,
      },
      bodyB: coconut,
      pointB: {
        x: 0,
        y: 0,
      },
      length: 0,
      stiffness: 0.4,
    });
    // Coconut for reference End =====================================================================================================================================================
    // soldiers left ====================================================================================
    const LEFT_WIDTH_SOLDIERS_IMG = 6000;
    const LEFT_HEIGHT_SOLDIERS_IMG = 846;

    const leftSoldierTargetRatio = 0.15;

    const leftSoldierScale =
      (height * leftSoldierTargetRatio) / LEFT_HEIGHT_SOLDIERS_IMG;

    const leftSoldierWidth = LEFT_WIDTH_SOLDIERS_IMG * leftSoldierScale;
    const leftSoldierHeight = LEFT_HEIGHT_SOLDIERS_IMG * leftSoldierScale;

    const leftSoldierPositionX = width / 2 - 100;
    const groundTopY = groundY - groundHeight / 2;
    const leftSoldierPositionY = groundTopY - leftSoldierHeight / 2;

    const leftSoldier = Bodies.rectangle(
      leftSoldierPositionX,
      leftSoldierPositionY,
      leftSoldierWidth,
      leftSoldierHeight,
      {
        isStatic: false,
        label: "tree",
        render: {
          sprite: {
            texture: "/game_assets/full_soldiers.png",
            xScale: leftSoldierScale,
            yScale: leftSoldierScale,
          },
          //   fillStyle: "transparent",
        },
      }
    );
    // soldiers left end ====================================================================================
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

    const getLaunchVelocity = () => {
      const launchPower = coconutTree.angle * 50;
      return {
        x: -launchPower,
        y: -Math.abs(launchPower) * 0.5,
      };
    };

    // play random sound
    const playRandomReleaseSound = () => {
      const list = releaseSfxRefs.current.filter(Boolean);
      if (!list.length) return;

      const index = Math.floor(Math.random() * list.length);
      const audio = list[index];

      audio.currentTime = 0;
      audio.volume = 1;
      audio.play().catch((err) => console.warn("Audio play blocked : ", err));
    };
    // play random sound ends

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
        const launchVelocity = getLaunchVelocity();

        Body.setVelocity(coconut, launchVelocity);
        Body.setAngularVelocity(coconut, 0);

        // play random sound
        playRandomReleaseSound();

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

    // Trajectory ===============================================================================
    const getTrajectoryPoints = (start, velocity, steps = 60) => {
      const { Engine, World, Bodies, Body } = Matter; // or from the destructured vars

      // 1) Create a tiny engine with same gravity
      const tempEngine = Engine.create();
      tempEngine.world.gravity.x = engine.world.gravity.x;
      tempEngine.world.gravity.y = engine.world.gravity.y;
      tempEngine.world.gravity.scale = engine.world.gravity.scale;

      // 2) Make a small body similar to the soldier
      const tempBody = Bodies.circle(
        start.x,
        start.y,
        coconut.circleRadius || 10,
        {
          frictionAir: coconut.frictionAir,
          restitution: coconut.restitution,
          mass: coconut.mass,
        }
      );

      World.add(tempEngine.world, tempBody);

      // 3) Apply same launch velocity
      Body.setVelocity(tempBody, { x: velocity.x, y: velocity.y });

      const points = [];
      const delta = 1000 / 60; // simulate 60 FPS

      // 4) Step the temp engine forward & collect positions
      for (let i = 0; i < steps; i++) {
        Engine.update(tempEngine, delta);
        points.push({ x: tempBody.position.x, y: tempBody.position.y });

        // stop if way off screen
        if (
          tempBody.position.x < -width * 0.5 ||
          tempBody.position.x > width * 1.5 ||
          tempBody.position.y > height * 2
        ) {
          break;
        }
      }

      return points;
    };

    // Trajectory Ends ===========================================================================

    // Reset coconut function ================================================================================================================================================================
    function resetCoconut() {
      // straight tree
      Body.setAngle(coconutTree, initialTreeAngle);
      Body.setAngularVelocity(coconutTree, 0);

      // use the current tree size/position instead of initial constants
      const treeBounds = coconutTree.bounds;
      const treeWidthNow = treeBounds.max.x - treeBounds.min.x;
      const treeHeightNow = treeBounds.max.y - treeBounds.min.y;

      const resetX = coconutTree.position.x + treeWidthNow / 2 - soldierRadius;
      const resetY = coconutTree.position.y - treeHeightNow / 2;

      Body.setPosition(coconut, { x: resetX, y: resetY });
      Body.setVelocity(coconut, { x: 0, y: 0 });
      Body.setAngularVelocity(coconut, 0);

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

      // 🎯 2) Draw trajectory when aiming (dragging & not yet released)
      if (isDragging && !coconutReleased) {
        const launchVelocity = getLaunchVelocity();
        const points = getTrajectoryPoints(
          coconut.position,
          launchVelocity,
          60
        );

        ctx.save();
        ctx.fillStyle = "#ffffff";

        points.forEach((p) => {
          const radius = 3;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      }
    });

    // Game logic End ========================================================================================================================================================================

    // Resize code for mobile and desktop ============================================================================================================================================
    const handleResize = () => {
      // stop spamming changes while device is in the middle of rotating
      if (resizeTimeout) clearTimeout(resizeTimeout);

      // temporarily pause the engine
      engine.timing.timeScale = 0; // freeze simulation

      resizeTimeout = setTimeout(() => {
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

        Body.setVertices(
          ground,
          Vertices.fromPath(
            `0 0 ${width} 0 ${width} ${groundHeight} 0 ${groundHeight}`
          )
        );

        Body.setPosition(ground, {
          x: width / 2,
          y: groundY,
        });

        if (ground.render.sprite) {
          ground.render.sprite.xScale = width / 800; // scales the actual sprite images
          ground.render.sprite.yScale = 40 / 100;
        }

        // Reposition wall
        const wallTargetHeightRatio = 0.7;
        const wallScale = (height * wallTargetHeightRatio) / WALL_IMG_HEIGHT;

        const wallWidth = WALL_IMG_WIDTH * wallScale;
        const wallHeight = WALL_IMG_HEIGHT * wallScale;

        Body.setVertices(
          wall,
          Vertices.fromPath(
            `0 0 ${wallWidth} 0 ${wallWidth} ${wallHeight} 0 ${wallHeight}`
          )
        );

        Body.setPosition(wall, {
          x: width - wallWidth / 2,
          y: height - wallHeight / 2, // Match initial setup
        });

        if (wall.render.sprite) {
          wall.render.sprite.xScale = wallScale;
          wall.render.sprite.yScale = wallScale;
        }

        // Recalculate the tree position (match initial setup)
        const treeTargetHeightRatio = 0.3;
        const newTreeScale = (height * treeTargetHeightRatio) / TREE_IMG_HEIGHT;

        const newTreeWidth = TREE_IMG_WIDTH * newTreeScale;
        const newTreeHeight = TREE_IMG_HEIGHT * newTreeScale;

        // Recalculate tree Y based on new ground
        const newTreePositionY = groundY - groundHeight / 2;

        // Update tree body shape to match new width/height
        Body.setVertices(
          coconutTree,
          Vertices.fromPath(
            `${-newTreeWidth / 2} ${-newTreeHeight / 2} ` +
              `${newTreeWidth / 2} ${-newTreeHeight / 2} ` +
              `${newTreeWidth / 2} ${newTreeHeight / 2} ` +
              `${-newTreeWidth / 2} ${newTreeHeight / 2}`
          )
        );

        // Update tree body position
        Body.setPosition(coconutTree, {
          x: treePositionX,
          y: newTreePositionY - newTreeHeight / 2,
        });

        // Update hinge position
        treeHinge.pointA.x = coconutTree.position.x;
        treeHinge.pointA.y = coconutTree.position.y + newTreeHeight / 2;

        coconutConstraint.pointA.x = newTreeWidth - 10;
        coconutConstraint.pointA.y = -newTreeHeight / 2;

        //update coconut constraint anchor to match new tree size
        const bottomOffset = coconutTree.bounds.max.y - coconutTree.position.y;
        treeHinge.pointB.x = 0;
        treeHinge.pointB.y = newTreeHeight / 2;

        Body.setAngle(coconutTree, initialTreeAngle);
        Body.setAngularVelocity(coconutTree, 0);

        if (coconutTree.render.sprite) {
          coconutTree.render.sprite.xScale = newTreeScale;
          coconutTree.render.sprite.yScale = newTreeScale;
        }

        // Handle soldier
        const soldierTargetHeightRatio = 0.2;

        const soldierScale =
          (height * soldierTargetHeightRatio) / SOLDIER_IMG_HEIGHT;

        if (coconut.render.sprite) {
          coconut.render.sprite.xScale = soldierScale;
          coconut.render.sprite.yScale = soldierScale;
        }

        resetCoconut();

        // >>> SOLDIERS RESIZE & REPOSITION <<<
        const LEFT_WIDTH_SOLDIERS_IMG = 6000;
        const LEFT_HEIGHT_SOLDIERS_IMG = 846;
        const leftSoldierTargetRatio = 0.15;

        // recalculate scale based on new screen height
        const newLeftSoldierScale =
          (height * leftSoldierTargetRatio) / LEFT_HEIGHT_SOLDIERS_IMG;

        // recalc dimensions
        const newLeftSoldierWidth =
          LEFT_WIDTH_SOLDIERS_IMG * newLeftSoldierScale;
        const newLeftSoldierHeight =
          LEFT_HEIGHT_SOLDIERS_IMG * newLeftSoldierScale;

        // ground top Y (top edge of ground rectangle)
        const groundTopY = groundY - groundHeight / 2;

        // position soldiers so their bottom rests on ground
        const newLeftSoldierX = width / 2;
        const newLeftSoldierY = groundTopY - newLeftSoldierHeight / 2;

        // update Matter body vertices & position
        Body.setVertices(
          leftSoldier,
          Vertices.fromPath(
            `${-newLeftSoldierWidth / 2} ${-newLeftSoldierHeight / 2} ` +
              `${newLeftSoldierWidth / 2} ${-newLeftSoldierHeight / 2} ` +
              `${newLeftSoldierWidth / 2} ${newLeftSoldierHeight / 2} ` +
              `${-newLeftSoldierWidth / 2} ${newLeftSoldierHeight / 2}`
          )
        );

        Body.setPosition(leftSoldier, {
          x: newLeftSoldierX,
          y: newLeftSoldierY,
        });

        // update scaling for the sprite
        if (leftSoldier.render.sprite) {
          leftSoldier.render.sprite.xScale = newLeftSoldierScale;
          leftSoldier.render.sprite.yScale = newLeftSoldierScale;
        }

        // resume simulation
        engine.timing.timeScale = 1;
      }, 300);
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
      leftSoldier,
    ]);

    // Run the engine==================================================================================================================================================================
    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Clean up code ==================================================================================================================================================================
    return () => {
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

  // Play or pause music when game starts
  useEffect(() => {
    // console.log(hasStarted, musicRef.current, "--------");
    if (hasStarted && musicRef.current) {
      // console.log("inside");
      musicRef.current
        .play()
        .catch((err) => console.warn("Autoplay blocked:", err));
    } else if (!hasStarted && musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
    }
  }, [hasStarted]);

  const toggleFullScreen = async () => {
    const element = document.getElementsByClassName("scene-container")[0];

    if (!element) return;

    const isFullscreen =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement;

    if (!isFullscreen) {
      try {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }

        // orientation change
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch (err) {
        console.warn("Full screen failed", err);
      }
    } else {
      //exit full screen
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      // unlock orientation
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
    }
  };

  const handleStart = async () => {
    setHasStarted(true);
    await toggleFullScreen();
  };

  return (
    <>
      {/* start overlay */}
      {!hasStarted && (
        <div className="start-overlay" onClick={handleStart}>
          <div className="start-box">
            <h1>Click to start</h1>
            <p>Best experienced</p>
          </div>
        </div>
      )}

      <div className="scene-container">
        <video
          loop
          autoPlay
          muted
          playsInline
          src="/game_assets/mountain_bg.mp4"
          className="bg-video"
        />
        <div ref={sceneRef} className="scene"></div>
      </div>

      {/* 🎵 background music */}
      <audio ref={musicRef} src="/music/music_bg.mp3" loop preload="auto" />

      {/* Dynamic SFX loader  */}
      {sfxFiles.map((src, i) => (
        <audio
          key={i}
          ref={(el) => (releaseSfxRefs.current[i] = el)}
          src={src}
          preload="auto"
        />
      ))}
    </>
  );
};

export default Iteration2;
