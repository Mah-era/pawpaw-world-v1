# PAWPAW WORLD 3D — Detailed Project Report

## Executive Summary

PAWPAW WORLD 3D is a finished browser game in which the player controls PawPaw, a cyber-cat with one glowing cybernetic eye, exploring a dense neon city in full 3D from a third-person, mouse-look perspective. It began as a 2D Canvas game and was rebuilt as a real-time 3D experience using Three.js, then deepened into an activity-rich, mission-driven open city.

The finished project combines relaxed third-person traversal and parkour, a guided main-mission chain, interconnected NPC side-quests, timed courier deliveries, rotating city tasks, a FLOW action combo, hidden discoveries, collectibles, lore, kitten rescues, Paw Shrine rebuilding, a vendor economy, XP and levels, achievements, an information-rich city map, and local saves.

The game keeps its original identity — a non-combat cyberpunk cat exploration experience with rain, rooftops, secrets, old transit ghosts, scattered-AI fragments, and a warm emotional center — and presents it with cinematic rendering and a reactive soundscape.

## Technical Summary

The game is a static browser project with no build step:

- Vanilla JavaScript, ES modules
- Three.js (r160) real-time WebGL rendering, vendored locally in `vendor/`
- Post-processing (bloom, tone mapping) vendored in `vendor/jsm/`
- WebAudio for a procedural music bed, reactive ambience, and sound effects
- localStorage persistence
- No heavy frameworks, no bundler, no internet requirement at runtime
- No real-money, paid loot, or gambling systems

A local static server is required because browsers do not load ES modules over `file://`. `serve.py` is a small `http.server` wrapper with caching disabled so edits appear on reload; any static server works.

## Project Structure

```text
index.html           Title screen, HUD, map/journal/shop/dialogue modal markup
style.css            Neon UI: animated title, HUD panels, trackers, compass, map
serve.py             Static dev server (caching disabled)
vendor/three.module.js  Vendored Three.js r160
vendor/jsm/             Vendored post-processing (EffectComposer, RenderPass,
                     UnrealBloomPass, OutputPass, shaders)
src/data.js          Constants, districts, lore, shop, kittens, missions,
                     side-quests, discoveries, achievements, shared state
src/world.js         Procedural city, PBR facades, lighting, shrine, vendor,
                     quest NPCs, citizens, drones, traffic, ziplines, rain,
                     day/night, discoveries, per-frame world animation
src/player.js        PawPaw mesh and animation, movement physics, collision,
                     zipline riding, third-person mouse-look + zoom camera
src/game.js          Collectibles, missions, side-quests, discoveries, courier
                     jobs, FLOW combo, rotating tasks, economy, XP, achievements,
                     interactions, map data, save/load
src/ui.js            HUD, mission/side-quest trackers, compass, popups, floaters,
                     city map, journal/shop/dialogue modals
src/fx.js            GPU-friendly particle pool, ambient emitters, reward
                     floaters, screen flashes
src/audio.js         WebAudio music bed, reverb bus, reactive ambience, SFX
archive/legacy-2d/   The original 2D Canvas version, unchanged
README.md            Overview, controls, run instructions
docs/user-manual.md   Player-facing manual
docs/project-report.md   This document
```

### Module Responsibilities

`index.html` defines the WebGL canvas, the cinematic title screen (kicker, animated title, embers, scanline, rotating taglines), the HUD (stats, trackers, compass, tasks, hints), and the shared modal used for the map, journal, shop, dialogue, and lore.

`style.css` defines the neon interface: the animated gradient title with power-flicker, glassmorphic HUD panels, the mission and side-quest trackers, the compass, the FLOW meter, the courier chip, popups and toasts, the city-map layout, and a full-screen vignette/scanline overlay.

`src/data.js` holds world constants, the five district definitions, lore text (data chips and memories), the shop catalog, kitten definitions, courier destinations, the main mission chain, the NPC side-quest chain, the hidden discovery list, achievements, the rotating task pool, the seeded RNG, and the live shared `state` object that the save system serializes.

`src/world.js` builds the entire city from a fixed seed (identical every visit): the road grid and PBR-textured buildings, district set-pieces, the Paw Shrine and Mei's stall, quest NPCs, citizens and robots, hover traffic, drones, ziplines, pigeons, the elevated/ghost train, rain, lighting, the horizon skyline, hidden-discovery beacons, and all per-frame world animation. It also exposes `setRendererCaps` so textures use the GPU's maximum anisotropy.

`src/player.js` creates PawPaw's articulated mesh and animates it (walk/run gait, squash-and-stretch, idle sit/stretch/purr, blink, tail, meow head-tilt). It runs movement physics — acceleration, jumping, coyote time, double jump, dash, glide, capsule-vs-AABB collision — plus zipline riding, and the smoothed, wall-aware third-person camera with mouse-look and wheel/pinch zoom.

`src/game.js` is the gameplay brain: collectible placement and pickup, the main-mission engine, the NPC side-quest state machine, hidden-discovery triggers (with an "nudge out of buildings" pass so every fixed spot is reachable), courier jobs and streaks, the FLOW combo, rotating city tasks, the economy and vendor, XP and leveling, achievements, all interaction handling, map data, and save/load.

`src/ui.js` renders the HUD and all overlays: stats, the mission and side-quest trackers, the compass, popups, world-space reward floaters, the city map (with distance rings, route, markers, legend, how-to, and zoom), and the journal, shop, dialogue, and lore modals.

`src/fx.js` runs a fixed-size particle pool (one draw call) for bursts and ambient emitters (steam, shrine petals, fountains), plus world-space text floaters and DOM screen flashes.

`src/audio.js` builds the WebAudio graph: a master compressor, a ping-pong feedback-delay "space" (reverb) bus, an evolving four-chord music bed with a bell-melody arpeggio, three reactive ambience layers (rain, traffic, neon buzz) driven by the player's surroundings, and the full sound-effect set including footsteps and the title sting.

## Core Game Identity

A relaxing, non-combat cyberpunk cat. The mood is warm and curious rather than tense: neon on wet streets, rain, rooftop gardens, loyal empty trains, and a scattered city AI that "stayed because it loved" the city. There is no enemy and no permanent failure. The reward is exploration, small surprises, and a city that always has something nearby to do.

## Rendering and Visual Direction

The renderer targets a cinematic neon look while staying performant (~60 fps):

- **Bloom post-processing** (UnrealBloomPass) so every neon sign, window, and collectible genuinely glows.
- **ACES filmic tone mapping** with tuned exposure for rich, filmic color.
- **MSAA render target + maximum anisotropic filtering + mipmaps** on all surfaces — this removed the "pixelated" edges and blocky windows of earlier builds.
- **Image-based lighting**: a small procedural "neon room" is baked into an environment map so wet roads, metal, and glass pick up colored reflections.
- **Wet PBR ground**: a roughness map carves near-mirror puddles into the asphalt and a bump map adds tile relief.
- **Procedural facades**: each building face is a generated texture with panel seams, lit/dark/curtained windows, AC units with drip stains, grime streaks, and glowing ground-floor storefronts.
- **Atmosphere**: warm amber night palette, exponential fog that fades to city-glow, drifting street-haze sprites, volumetric lamp cones, a glowing parallax horizon skyline, searchlights, and a moon disc.

## Final Core Gameplay Loop

1. Follow the gold compass/beam to the current main mission and complete it; it unlocks the next.
2. Help quest NPCs with interconnected side-errands for larger rewards and the next character.
3. Take courier jobs and build a streak multiplier.
4. Clear the three rotating City Tasks, which refill as you finish them.
5. Chain a FLOW combo across quick actions for bonus credits.
6. Explore for hidden discoveries, caches, and high-up collectibles.
7. Rescue kittens to grow the shrine; spend credits at Mei's; level up; chase achievements.

The systems reinforce each other: a single kibble grab can tick a task, extend a combo, and happen mid-delivery, all funneled through one event hook.

## World and Exploration

The city is one continuous 3D space, ~400 m across, divided into five districts, each visually distinct:

- **Back Alley Network** — narrow, secretive: graffiti, dumpsters, clutter, steam, and glowing eyes in the dark.
- **Neon Market** — warm and crowded: food stalls, lantern strings, a giant rotating holo-cat, and a street performer.
- **Transit Plaza** — the calm heart: the Paw Shrine, a fountain, and concentric floor rings.
- **Corporate Sector** — tall, cold, clean: round glass towers, ring lights, and sweeping searchlights.
- **Old Signal Docks** — windy and lonely: an antenna farm, holo-fish, and an elevated train that sometimes runs as a ghost.

Buildings are generated from a fixed seed in three silhouettes (simple towers, tiered setbacks, cylinders) and dressed with balconies, pipes, railings, water towers, pagoda roofs, rooftop gardens, antennas with blinking lights, animated billboards, and vertical neon signs. An apex spire with a sky beacon anchors the skyline, reached by a rising skyway of neon platforms.

## Movement, Parkour, and Climbing

PawPaw moves at a cat's scale with snappy, forgiving physics: walk, sprint, jump, double jump (unlockable), teleport dash (unlockable), and glide (purchasable). Coyote time and a jump buffer keep platforming smooth. The camera is a smoothed third-person follow that marches in front of walls to avoid clipping, with a sprint FOV kick and wheel/pinch zoom.

Every building advertises a way up through consistent "climb language": pawprints painted on the ground, glowing single-jump crate steps, fire escapes, awnings over shop doors, balconies, and roof-to-roof bridges. Rideable **ziplines** carry the player from high roofs to low ones (press E to mount, Space to bail). A "CLIMB ME" tower beside the spawn teaches the vocabulary immediately. Climb routes are seeded with kibble trails so collecting naturally leads upward.

## Character and Animation

PawPaw is a rounded calico built from primitives, with ears, a four-segment curving tail, whiskers, a glowing cyan cyber-eye, an amber natural eye, and a tinted collar. The animation set includes a speed-scaled walk/run gait, squash-and-stretch in the air and on landing, a sit pose when idle, a luxurious stretch and an audible purr after standing still, blinking, a tail that streams when fast and wraps when sitting, a chin-up meow pose, and a soft glow light so the cat reads at night. Carried kittens ride on PawPaw's back.

## Controls

| Input | Action |
|---|---|
| Mouse | Look around (pointer lock) |
| W A S D / arrows | Move relative to the camera |
| Shift | Sprint |
| Space | Jump / double jump / glide / bail off a zipline |
| X | Teleport dash (after unlock) |
| E | Context interact (talk, take job, rescue, deliver, open cache, tap, scan, ride, scratch) |
| F | Meow |
| Wheel / two-finger / pinch | Zoom camera (and map) |
| M | City map |
| J | Journal |
| Esc | Release mouse / pause; close modals |

## Progression Systems

### Main Missions

A data-driven chain (`MISSIONS`) keeps exactly one mission active at all times, with a fixed gold beam, an on-screen compass, and a dashed route on the map. Mission types include reach-a-place (goto), collect, rings, deliver, cache, zipline, wisp, scan, rescue, and shrine-level. Reach-based missions complete from a per-frame distance check; action-based missions advance through the shared event hook. Each completion advances the chain; the tail mission is repeatable so the player is never stranded.

### NPC Side-Quests

Four named characters (`SIDE_QUESTS`: Solder → Vega → Patch → Jin) stand at fixed, building-nudged positions with name tags, personal lights, and state markers. Each quest is a small state machine: **offerable → active → found → done**. Talking accepts the quest and shows dialogue; a cyan beam marks the errand; reaching it (some require a rooftop climb) sets it to "found"; returning to the NPC turns it in for a reward. Completing one quest unlocks the next character's, and the whole chain is gated behind main-story progress, so the city's stories interconnect.

### Courier Jobs

Courier boards issue timed deliveries to named destinations. A beam and a HUD chip show the drop-off, distance, direction, and countdown. Successful deliveries build a streak that multiplies payouts; an expired job resets the streak.

### Rotating City Tasks

Three short goals from a pool (`OBJ_TYPES`) are always on-screen — collect kibble, jump rings, knock cans, ride ziplines, catch wisps, scatter pigeons, tap vending machines, deliver, dash, scan posters. Completing one pays out and immediately spawns a fresh task.

### FLOW Combo

Every quick action funnels through one event hook that increments a combo with a few-second window. Sustaining the chain pays out scaling bonus credits when it lapses, rewarding fluid, continuous play.

## Collectibles and Micro-Activities

- **Holo-kibble (140)** — gates ability unlocks: 10 for Teleport Dash, 25 for Double Jump.
- **Data chips (18)** and **lost memories (10)** — each archives a lore entry in the journal; placed on rooftops and high points.
- **Hidden caches (4)** — violet cubes with large payouts and lore.
- **Lost kittens (8)** — carried to the shrine.
- **Neon rings, vending machines, posters, cans, data wisps** — repeatable micro-activities for credits, lore, and combo fuel. Data wisps spawn frequently and flee, giving an always-available moving target.

## Hidden Discoveries

Eight discovery zones (`DISCOVERIES`) are placed in out-of-the-way corners — alley dead-ends, the docks, the drowned arcade, and rooftops that require climbing (enforced with a minimum-height check). Entering one for the first time reveals a lore fragment and pays credits and XP. At initialization each ground-level discovery, errand, and NPC is nudged out of any building footprint it overlapped, guaranteeing every fixed spot is physically reachable — a correctness fix found and resolved during playtesting.

## Lost Kittens and the Paw Shrine

Eight named kittens with personalities are scattered through the city. The player scoops one up (it rides on PawPaw's back) and carries it to the Paw Shrine in the plaza. Each delivery visibly grows the shrine — lanterns ringing the base, a vermilion gate at level two, orbiting orbs at five, and a sky beacon at eight — and rescued kittens remain and idle around the shrine.

## Economy and Vendor

Credits come from nearly everything: collectibles, missions, side-quests, deliveries, discoveries, caches, wisps, rings, vending machines, scritches, and FLOW payouts. Mei's vendor stall sells permanent movement upgrades (sprint, jump, dash cooldown, gliding Cloud Pads, kibble magnet), a consumable speed snack, and collar colors. Purchases persist in the save.

## XP, Levels, and Achievements

XP accrues from all rewarding actions; leveling up triggers a particle burst, flash, and sound. Achievements span collection milestones, kitten rescues, courier jobs, FLOW combos, rooftop height, finishing the main story, helping every NPC, and finding every discovery. The journal shows the full checklist.

## Map and Guidance

The city map (M) renders the five district columns, a street grid, the player's position and facing, a compass rose, distance rings at 50/100/150 m, a dashed route with a numeric distance to the mission goal, and labelled markers for the shrine, vendor, quest NPCs, active errands, courier boards, kittens, caches, ziplines, rings, vending machines, posters, and undiscovered secrets. A two-column legend and a "How to Play" panel sit beside it, and the map zooms with scroll or pinch, re-centering on the player. In the world, an on-screen compass and a nearby-activity hint (with a direction arrow) always point to the closest worthwhile thing, prioritizing active quest objectives.

## Audio Design

The WebAudio graph routes through a master compressor and a ping-pong feedback-delay "space" bus that gives melodic sounds an alley reverb. The music bed is an evolving four-chord progression (A-minor family) with a slow filter sweep and a soft bell-melody arpeggio drifting through the reverb. Three noise/oscillator ambience layers — rain hiss, distant traffic rumble, and neon buzz — are smoothly driven each frame by the player's surroundings (rain state, nearby cars, nearby signs). Sound effects cover pickups, jumps, dashes, landings, footsteps, deliveries, the meow, scritch, zipline, and a cinematic title sting that plays on the first user gesture.

## User Interface and Game Feel

Feedback is layered but not spammy: bottom-screen popups and achievement toasts, world-space "+credits" floaters, an animated XP bar, a pulsing credit counter, particle bursts on pickups and rewards, screen-glow flashes on big moments, the FLOW meter, a glitch-style district banner on zone entry, and a vignette/scanline overlay for a CRT feel. The opening screen is a cinematic camera orbit over the lit city behind an animated title with a kicker, drifting embers, a sweeping scanline, and rotating taglines.

## Save System

The full `state` object is serialized to localStorage every few seconds and on exit, and restored on Resume: collectibles, credits, XP and level, abilities and upgrades, collar color, kitten rescues and shrine level, achievements, flags, stats, main-mission index and progress, side-quest states, discoveries, courier streak, rotating tasks, and the player's position. A new game clears the save; the dev server disables caching so updated code always loads.

## Difficulty Philosophy

The game is deliberately relaxing. There is no combat, no health, no timer that can permanently fail the player, and no penalty for falling. Guidance (compass, beam, nearby hint, map) keeps the player oriented while leaving the order of activities entirely open. The intent is a cozy, curious city to inhabit rather than a challenge to beat.

## Final Content Counts

- 5 districts
- 140 holo-kibble, 18 data chips, 10 lost memories
- 8 lost kittens, 4 hidden caches
- 1 main mission chain (12 missions + a repeatable tail)
- 4 interconnected NPC side-quests
- 8 hidden discoveries
- 3 courier boards with endless timed jobs and a streak multiplier
- 10 rotating City Task types (3 active at a time)
- Neon rings, vending machines, posters, cans, and frequently spawning data wisps
- A vendor with movement upgrades, a snack, and collar colors
- An achievement set covering collection, story, social, and exploration

## Verification

The project was syntax-checked with Node and smoke-tested in a browser through a local server. Confirmed working with zero console errors at a steady ~60 fps: movement, sprint, and jump physics; mouse-look and wheel/pinch zoom; the title-screen orbit and start flow; the main-mission chain (reach checks complete and advance the chain); the full NPC side-quest loop (accept → errand reach → return → reward → next quest unlocked); hidden-discovery triggers including the out-of-building nudge that makes every fixed spot reachable; the kitten rescue → shrine delivery loop with shrine growth; courier jobs and streaks; the FLOW combo; vendor purchases; the city map rendering all marker types with correct, legible distances; the journal; and save/load across reloads.

## Final Result

PAWPAW WORLD 3D is a complete, polished, non-combat cyberpunk cat exploration game: a cinematic, reflective neon city that is dense with interconnected things to do — a guided main story, character side-quests, courier work, rotating tasks, hidden discoveries, collectibles, climbing, kitten rescues, and an economy — all wrapped in bloom-lit visuals, a reactive soundscape, and a clear guidance and map system, running entirely in the browser with no build step and no dependencies beyond a vendored Three.js.
