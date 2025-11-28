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
    const groundY = height - 15;
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
      height - wallHeight / 2 - 30, // Align with ground (ground is at height - 15)
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
    const treePositionY = groundY - groundHeight / 2;

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
    const mouse = Mouse.create(render.canva);
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

        World.remove(engine.world, coconutConstraint);
        coconutReleased = true;

        const spinBoost = 1.8;
        Body.setAngularVelocity(
          coconutTree,
          coconutTree.angularVelocity * spinBoost
        );

        Body.applyForce(coconut, coconut.position, {
          x: 0.02, // forward
          y: -0.01, // a bit upward
        });
      }
    });

    // Game Grad, mouse logics End ===================================================================================================================================================

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
      const groundY = height - 15;

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
      const wallHeight = height * 0.62;

      Body.setPosition(wall, {
        x: width - wallWidth / 2 - 5,
        y: height - wallHeight / 2 - 30,
      });

      Body.setVertices(
        wall,
        Vertices.fromPath(
          `0 0 ${wallWidth} 0 ${wallWidth} ${wallHeight} 0 ${wallHeight} $`
        )
      );

      // Recalculate the tree position
      const treeOffsetX = 100;
      const treeOffsetFromBottom = 90;

      Body.setPosition(coconutTree, {
        x: treeOffsetX,
        y: height - treeOffsetFromBottom,
      });
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Resize code for mobile and desktop Ends =======================================================================================================================================

    // Trigger Full screen on mobiles==================================================================================================================================================
    // const enableFullScreen = async () => {
    //   try {
    //     if (sceneRef.current && !document.fullscreenElement) {
    //       await sceneRef.current.requestFullscreen();
    //     }
    //     if (screen.orientation && screen.orientation.lock) {
    //       await screen.orientation.lock("landscape");
    //     }
    //   } catch (err) {
    //     console.warn("Full screen or orientation lock failed: ", err);
    //   }
    // };

    // // Tridder full screen
    // window.addEventListener("touchstart", enableFullScreen, { once: true });
    // window.addEventListener("click", enableFullScreen, { once: true });
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
      window.removeEventListener("touchstart", enableFullScreen);
      window.removeEventListener("click", enableFullScreen);
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
