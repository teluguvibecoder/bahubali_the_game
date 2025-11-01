PLACEHOLDER ASSETS FOR SLINGSHOT PHYSICS GAME
==============================================

This folder should contain audio and image assets for the game.
Currently, the game uses embedded placeholder sounds (data URIs) but you can replace them with actual files.

RECOMMENDED ASSETS STRUCTURE:
-----------------------------

/public
  /sounds
    - launch.mp3 or launch.wav    (slingshot release sound)
    - hit.mp3 or hit.wav          (projectile hitting block)
    - crumble.mp3 or crumble.wav  (block breaking/crumbling)
    - background.mp3              (optional background music)

  /images
    - projectile.png              (bird/projectile sprite, ~30x30px)
    - block.png                   (block texture, ~40x30px)
    - slingshot.png               (slingshot frame graphic)
    - background.jpg              (background scene)

FREE ASSET SOURCES (CC0 / Public Domain):
-----------------------------------------

SOUND EFFECTS:
- Freesound.org (search for CC0 licensed sounds)
  * Search terms: "slingshot", "impact", "wood break", "whoosh"
  * Filter by: Creative Commons 0 license

- OpenGameArt.org (sound effects section)
  * Look for physics game sound packs
  * Many have CC0 or CC-BY licenses

- Mixkit.co (free sound effects)
  * All sounds are free for commercial use
  * Good selection of game SFX

IMAGES/SPRITES:
- OpenGameArt.org
  * Search: "angry birds", "physics game", "blocks"
  * Many sprite packs available

- Kenney.nl
  * Huge collection of free game assets
  * All CC0 licensed
  * "Physics Assets Pack" recommended

- itch.io (free game assets)
  * Filter by "free" and check licenses
  * Many developers share assets

CURRENT IMPLEMENTATION:
-----------------------
The game currently works without external assets:
- Sounds use embedded placeholder beeps (data URIs)
- Graphics are drawn using Matter.js shapes (circles, rectangles)
- Colors are defined in the physics/engine.js file

TO USE REAL ASSETS:
-------------------
1. Download audio files and place them in /public/sounds/
2. Update the Howl instances in Game.jsx:

   const sounds = {
     launch: new Howl({ src: ['/sounds/launch.mp3'] }),
     hit: new Howl({ src: ['/sounds/hit.mp3'] }),
     crumble: new Howl({ src: ['/sounds/crumble.mp3'] })
   };

3. For custom sprites, modify the render options in physics/engine.js
   to use sprite textures instead of fillStyle colors.

RECOMMENDED SOUND CHARACTERISTICS:
---------------------------------
- Launch: Quick whoosh/twang sound (0.2-0.5s duration)
- Hit: Sharp impact/thud (0.1-0.3s duration)
- Crumble: Wood breaking/cracking (0.3-0.6s duration)
- Format: MP3 or WAV, 44.1kHz, keep files under 100KB each
