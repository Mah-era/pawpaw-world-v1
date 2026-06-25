# PawPaw‑World‑3D‑v1 — Complete Project Report

> A fully 3D, non‑combat cyberpunk **cat exploration** game that runs entirely in the browser with no build step, no dependencies beyond a vendored copy of Three.js, and no network requirement at runtime.

| | |
|---|---|
| **Project name** | PawPaw‑World‑3D‑v1 |
| **Live game** | https://mah-era.github.io/PawPaw-World-3D-v1/ |
| **Visual report (HTML)** | https://mah-era.github.io/PawPaw-World-3D-v1/docs/PAWPAW_WORLD_Report.html |
| **Repository** | https://github.com/Mah-era/PawPaw-World-3D-v1 |
| **Engine / stack** | Vanilla JavaScript (ES modules) · Three.js r160 (vendored) · WebGL · WebAudio · `localStorage` |
| **Build system** | None — static files served from any HTTP server |
| **Source size** | ~6,500 lines across 8 JS modules |
| **Origin** | Rebuilt from an earlier 2D Canvas game (preserved under `archive/legacy-2d/`) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Pillars & Player Fantasy](#2-design-pillars--player-fantasy)
3. [Functional Specification](#3-functional-specification)
   - 3.1 [Controls & Input](#31-controls--input)
   - 3.2 [Core Gameplay Loops](#32-core-gameplay-loops)
   - 3.3 [The City & Its Districts](#33-the-city--its-districts)
   - 3.4 [Main Mission Chain](#34-main-mission-chain)
   - 3.5 [NPC Side‑Quests](#35-npc-side-quests)
   - 3.6 [Named Neighbors](#36-named-neighbors)
   - 3.7 [Collectibles & Totals](#37-collectibles--totals)
   - 3.8 [Lost Kittens & the Paw Shrine](#38-lost-kittens--the-paw-shrine)
   - 3.9 [Hidden Discoveries & Caches](#39-hidden-discoveries--caches)
   - 3.10 [Rotating City Tasks](#310-rotating-city-tasks)
   - 3.11 [Collection Sets](#311-collection-sets)
   - 3.12 [FLOW Combo & FEVER](#312-flow-combo--fever)
   - 3.13 [Courier Jobs](#313-courier-jobs)
   - 3.14 [Economy, Shop & Upgrades](#314-economy-shop--upgrades)
   - 3.15 [Achievements](#315-achievements)
   - 3.16 [Weather, Atmosphere & Live Situations](#316-weather-atmosphere--live-situations)
   - 3.17 [Progression, HUD, Map & Journal](#317-progression-hud-map--journal)
   - 3.18 [Save System](#318-save-system)
   - 3.19 [Narrative & Lore](#319-narrative--lore)
   - 3.20 [Onboarding (ORB‑E)](#320-onboarding-orb-e)
4. [Technical Architecture](#4-technical-architecture)
   - 4.1 [Technology Stack](#41-technology-stack)
   - 4.2 [Module Breakdown](#42-module-breakdown)
   - 4.3 [Rendering Pipeline](#43-rendering-pipeline)
   - 4.4 [Lighting & Image‑Based Lighting](#44-lighting--image-based-lighting)
   - 4.5 [Procedural City Generation](#45-procedural-city-generation)
   - 4.6 [Player Physics & Camera](#46-player-physics--camera)
   - 4.7 [Particle / FX System](#47-particle--fx-system)
   - 4.8 [Audio Engine](#48-audio-engine)
   - 4.9 [UI Layer](#49-ui-layer)
   - 4.10 [Game State & Persistence](#410-game-state--persistence)
   - 4.11 [Main Loop & Timing](#411-main-loop--timing)
   - 4.12 [Performance Engineering](#412-performance-engineering)
   - 4.13 [Deployment & CI](#413-deployment--ci)
   - 4.14 [Report Tooling](#414-report-tooling)
5. [Repository Layout](#5-repository-layout)
6. [Configuration Reference](#6-configuration-reference)
7. [Build, Run & Develop](#7-build-run--develop)
8. [Known Limitations & Future Work](#8-known-limitations--future-work)
9. [Recent Engineering Highlights](#9-recent-engineering-highlights)

---

## 1. Executive Summary

**PawPaw‑World‑3D‑v1** is a real‑time 3D browser game in which the player controls **PawPaw**, a green‑eyed calico cat with one cybernetic eye, roaming a dense, rain‑slicked cyberpunk city from a third‑person, mouse‑look camera. There is **no combat and no hard failure state** — the reward loop is exploration, traversal, collection, small surprises, and a city packed with interconnected things to do.

The game began life as a 2D HTML Canvas title and was rebuilt into a full 3D experience with cinematic rendering (real bloom, ACES tone mapping, image‑based lighting), a reactive WebAudio soundscape, a 20‑step guided mission chain, four interconnected NPC side‑quest chains, eight named neighbors, 177+ collectibles, rotating city tasks, a FLOW/FEVER combo economy, repeatable courier jobs, weather, and timed live "street events" (including a city blackout that cuts building lights for ~7 seconds).

Technically, it is deliberately **dependency‑light and static**: vanilla JavaScript ES modules, a single vendored copy of Three.js r160 and its post‑processing example modules, WebAudio, and `localStorage`. There is no bundler, no framework, no transpilation, and no runtime network access. The entire city is generated from a fixed seed, so every visit is identical, and the full game state is serialized to the browser on a timer and on exit.

---

## 2. Design Pillars & Player Fantasy

- **Cozy, not tense.** A warm amber‑night palette over saturated neon and mirror‑wet streets. The mood is curious and inviting; the city "stayed because it loved" its people.
- **Every rooftop is yours.** Cat‑scale traversal is a first‑class pillar: pawprints and glowing crates mark a climb route up almost every building.
- **Always something nearby.** A unified event hook means a single quick action can tick a rotating task, extend a combo, and advance a delivery at once. An on‑screen hint and compass always point at the nearest worthwhile thing.
- **Guided but open.** A gold world beam and compass keep players oriented through the mission chain, while leaving the order of activities entirely free.
- **Nothing is missable.** No fail states; missions, kittens, and discoveries wait indefinitely.

---

## 3. Functional Specification

### 3.1 Controls & Input

| Input | Action |
|---|---|
| **Mouse** | Look around — pointer‑lock, smoothed third‑person camera with automatic wall avoidance |
| **W A S D / Arrows** | Move relative to the camera (diagonals supported) |
| **Shift** | Sprint |
| **Space** | Jump → double‑jump after unlock → hold while falling to **glide** (after the Cloud Pads upgrade) |
| **X** (or K) | Teleport‑dash toward the camera heading (after collecting 10 kibble) |
| **E** | Interact: NPC dialogue, kittens, shrine, posters, vending machines, courier boards, ziplines, caches, Mei's shop |
| **F** | Meow — animates PawPaw, alerts citizens, scatters pigeons, feeds the FLOW combo |
| **Mouse wheel / two‑finger scroll / pinch** | Zoom the third‑person camera (clamped 0.45×–2.6×) |
| **M** | City map (route, district bands, distance rings, markers) |
| **J** | Journal (collections, quests, discoveries, achievements, lore) |
| **Esc** | Release mouse / pause; closes modals |

Pointer‑lock drives the play/pause model: releasing the mouse pauses the simulation (unless a modal is open), and clicking the canvas re‑captures it. Movement keys are cleared on window `blur` so the cat never "sticks." Sensitivity is `MOUSE_SENS = 0.0023`.

### 3.2 Core Gameplay Loops

1. **Follow the gold beam** — one main mission is always active, marked by a beam, compass, HUD tracker, and a street‑following map route.
2. **Help the city's people** — four gated quest NPCs plus eight named neighbors.
3. **Run courier jobs** — timed deliveries with a streak multiplier.
4. **Chase rotating City Tasks** — three short goals always on‑screen, refilling as completed.
5. **Chain a FLOW combo** — quick consecutive actions build a combo that cashes out for bonus credits, with a ×10 **FEVER** rush.
6. **Explore for secrets** — eight hidden discoveries in alley dead‑ends and on rooftops.
7. **Collect & grow** — 140 holo‑kibble, 18 data chips, 10 lost memories, 8 kittens, 4 caches, rings, vending machines, posters.
8. **Spend & level** — earn credits and XP from everything; upgrade at Mei's stall; level up; chase achievements.

### 3.3 The City & Its Districts

The world spans **−200…+200 m** on each axis (`CFG.CITY = 200`) and is divided into five horizontal‑banded districts (by X range):

| District | X range | Accent color | Character |
|---|---|---|---|
| **Back Alley Network** | −200 … −110 | violet | Graffiti, steam, clutter, glowing eyes in the dark |
| **Neon Market** | −110 … −20 | magenta | Food stalls, lanterns, a giant rotating holo‑cat, Mei's stall |
| **Transit Plaza** | −20 … 52 | cyan | The Paw Shrine, fountain, concentric floor rings — the calm heart |
| **Corporate Sector** | 52 … 135 | sky‑blue | Round glass towers, ring‑lit roofs, sweeping searchlights |
| **Old Signal Docks** | 135 … 200 | amber | Antenna farm, holo‑fish, an elevated (sometimes "ghost") train |

A day/night cycle runs on a `DAY_LENGTH = 180 s` loop, beginning just before dawn for peak neon hours.

### 3.4 Main Mission Chain

The chain deliberately **tours every system** instead of repeating an objective type. There are **20 authored missions** plus **1 repeatable endless‑tail** mission. Each mission's `type` drives both its completion trigger and its compass/map waypoint.

| # | Title | Type | Goal | Reward (¢ / XP) |
|---|---|---|---|---|
| m1 | First Steps | goto | Reach the Paw Shrine | 25 / 30 |
| m2 | Hungry Paws | collect | 8 holo‑kibble | 30 / 40 |
| m3 | Meet Mei | goto | Visit Mei's stall | 30 / 40 |
| m4 | Light Footed | rings | 3 neon rings | 35 / 45 |
| m5 | Found Family | rescue | Carry a kitten to the shrine | 50 / 60 |
| m6 | On the Clock | deliver | 2 courier deliveries | 55 / 60 |
| m7 | Top of the World | goto | Climb to the Apex Spire rooftop | 60 / 70 |
| m8 | City Secrets | cache | Crack a hidden cache | 75 / 80 |
| m9 | Wire Walker | zip | Ride 2 ziplines | 50 / 60 |
| m10 | Street Stories | scan | 2 lore posters | 40 / 50 |
| m11 | Signal's Edge | goto | Reach the antenna farm | 60 / 70 |
| m12 | Den Mother | shrine | Shrine to level 4 (4 kittens) | 120 / 140 |
| m13 | Neighbor Network | npc | Talk to 3 named neighbors | 70 / 80 |
| m14 | Backstreet Truths | discover | Find 2 hidden discoveries | 85 / 100 |
| m15 | Flow Training | combo | FLOW combo ×8+ | 75 / 90 |
| m16 | Street Reputation | level | Reach paw level 3 | 90 / 80 |
| m17 | Poster Run | scan | 4 lore posters | 70 / 80 |
| m18 | Catch the Static | wisp | Catch 4 data wisps | 95 / 100 |
| m19 | Trusted Paws | deliver | 4 courier deliveries | 110 / 110 |
| m20 | All Kittens Home | shrine | Rescue all 8 kittens | 180 / 180 |
| mE | City Courier | deliver | 3 more deliveries (**repeatable**) | 90 / 90 |

### 3.5 NPC Side‑Quests

Four characters form a single interconnected chain — finishing one unlocks the next, and each is **gated** behind a minimum main‑mission index. Each quest uses an offer → multi‑step errand (marked by a colored beam) → return‑for‑reward structure.

| Quest | Giver | Gate | Steps | Unlocks | Reward (¢ / XP) |
|---|---|---|---|---|---|
| sq_solder | **Solder** | 1 | Find the magnet‑spanner → tap the alley breaker | Vega | 60 / 70 |
| sq_vega | **Vega** | 1 | Sky‑sample from the CLIMB‑ME roof → warm it at the fountain | Patch | 80 / 90 |
| sq_patch | **Patch** | 2 | Ping the corporate signal‑node → scramble the rooftop relay | Jin | 100 / 110 |
| sq_jin | **Jin** | 3 | Listen under the tallest mast → follow the echo to Line 9 → return to the dock board | — | 150 / 160 |

The chain carries the game's central narrative thread: the scattered city AI, the loyal driverless Line‑9 trains, and the meaning of "found family."

### 3.6 Named Neighbors

Eight additional characters give one‑off conversations and first‑meeting rewards, making each district feel inhabited outside the formal quest chain: **Rina** (Noodle Cart Regular), **Bolt** (Courier Mechanic), **Mara** (Alley Gardener), **Omo‑7** (Office Bot), **Lux** (Signal Diver), **Sable** (Plaza Watcher), **Pix** (Billboard Painter), and **Grit** (Rooftop Runner).

### 3.7 Collectibles & Totals

| Collectible | Total | Notes |
|---|---|---|
| Holo‑kibble | **140** | 10 unlocks Teleport Dash; 25 unlocks Double Jump |
| Data chips | **18** | Each unlocks a lore entry (17 authored chip logs) |
| Lost memories | **10** | Each unlocks a memory lore entry |
| Lost kittens | **8** | Carried to the shrine |
| Hidden caches | **4** | Secret‑room flavor + credits |
| Neon rings, data wisps, vending machines, lore posters | many | Feed tasks, combos, and credits |

Totals are defined centrally in `TOTALS = { food: 140, chip: 18, mem: 10, kittens: 8 }`. The headline "177+ collectibles" comes from summing the major fixed collectibles.

### 3.8 Lost Kittens & the Paw Shrine

Eight named kittens (Miso, Null, Pebble, Saffron, Mica, Byte, Taro, Lantern — each with a personality trait and fur color) are scattered across the city. The player scoops one onto PawPaw's back with **E** and carries it to the glowing **Paw Shrine** in Transit Plaza. Each rescue permanently raises the shrine level; missions m12 and m20 gate on shrine level 4 and 8.

### 3.9 Hidden Discoveries & Caches

- **8 hidden discoveries** — silent trigger zones in out‑of‑the‑way corners; some (`minY`) require a rooftop climb. First entry pays credits and reveals a piece of city lore (e.g., *Forgotten Mural*, *Secret Roof Garden*, *Drowned Arcade*, *Apex Service Nook* at 38 m up, *Line 9 Platform*).
- **4 hidden caches** — pulsing violet secrets opened with **E**, each with its own short story (*Forgotten Room*, *Hacker Den*, *Heartbeat Relay*, *Apex Service Nook*).

### 3.10 Rotating City Tasks

Three short‑term objectives are always on‑screen and **replace themselves immediately** on completion, drawn from ten types (`OBJ_TYPES`), each with escalating tiers:

collect holo‑kibble · jump neon rings · knock over cans · ride ziplines · catch data wisps · scatter pigeon flocks · tap vending machines · complete courier jobs · teleport‑dash · scan lore posters.

### 3.11 Collection Sets

Five themed sets each pay a large one‑time completion bonus, tracked in the journal:

| Set | Target | Reward |
|---|---|---|
| Full Belly | 140 kibble | 200 ¢ |
| Neon Archive | 18 chips | 250 ¢ |
| Memory Lane | 10 memories | 300 ¢ |
| Den Family | 8 kittens | 400 ¢ |
| Vault Breaker | 4 caches | 250 ¢ |

### 3.12 FLOW Combo & FEVER

Any quick actions chained in a row (kibble, rings, cans, wisps, ziplines, dashes, meows…) build a **FLOW combo** through one unified event hook. A decay timer ends the chain and pays out scaled credits. Hitting **×10** ignites **FEVER** — an ~8‑second rush that doubles credit income with an intensified music mix, particles, and a molten screen‑edge vignette.

### 3.13 Courier Jobs

Courier boards across the districts offer timed deliveries to named landmarks (`COURIER_DESTS` — the shrine, Mei's stall, the plaza fountain, the apex spire, the antenna farm, Noodle Row, the CLIMB‑ME tower, and more). A destination beam, distance, and countdown guide the run; **back‑to‑back deliveries build a streak multiplier** that resets on a miss.

### 3.14 Economy, Shop & Upgrades

Credits and XP pour in from nearly every action. **Mei's stall** sells movement upgrades, a consumable, and cosmetics:

| Item | Effect | Cost |
|---|---|---|
| Synth‑Tuna Snack | +25% speed for 90 s (consumable) | 15 |
| Turbo Paws | Sprint +12% (permanent) | 150 |
| Coil Muscles | Jump +8% (permanent) | 150 |
| Phase Capacitor | Dash cooldown −40% | 200 |
| Cloud Pads | Hold Space to glide while falling | 250 |
| Kibble Magnet | Pulls in nearby kibble | 180 |
| Collar: Cyan / Lime / Amber | Cosmetic collar color | 60 each |

### 3.15 Achievements

**20 achievements** track milestones across collection, traversal, economy, social, and mastery — from *First Taste* (first kibble) and *Vacuum Paws* (all 140 kibble) to *Skyline Royalty* (stand above 40 m), *Flow State* (×10 combo), *City Legend* (finish the chain), *Good Neighbor* (all side‑quests), and *Cache Hunter* (all 4 caches).

### 3.16 Weather, Atmosphere & Live Situations

Atmosphere is **systemic**, not a static backdrop. Lighting, fog, rain, sound, traffic, and timed street events combine into recognizable situations:

- **Rain** — falling particles, reactive rain ambience, intensified puddle glow and wet‑road reflections (the "bonus" is visual/atmospheric; credit multipliers come from FEVER, not weather).
- **Fog + haze** — exponential distance fog, district‑colored drifting haze, volumetric lamp cones, skyline depth.
- **Day / Night shift** — a 180 s cycle blending night, dusk, and daylight with changing hemisphere and directional light.
- **City Blackout** — building **window lights cut out entirely for ~7 seconds** (only street lamps and neon remain), then surge back. *(See §9 for the implementation.)*
- **Other street events** — neon‑sign shorts, courier sky‑drops, data‑wisp swarms, pop‑up street festivals, traffic whooshes, and the elevated train (occasionally a "ghost train").
- **FEVER rush** — the ×10 combo reward situation.

### 3.17 Progression, HUD, Map & Journal

Progress is readable live, reviewable in the journal, and restored on the next session. The compact HUD shows kibble/chips/memories/kittens, credits, paw level, and an XP bar. Trackers cover the active mission (title, objective, numeric progress, reward, compass, distance, beam, route), the current side‑quest step, courier status (destination, distance, bearing, countdown, streak), FLOW/FEVER state, and three simultaneous city‑task bars.

- **City Map (M)** — player heading, district bands, distance rings, a street‑following route to the objective, plus markers for quests, neighbors, activities, landmarks, and secrets.
- **Journal (J)** — main story, NPC quests, named neighbors, discoveries, collection sets, achievements, totals, and lifetime statistics.

### 3.18 Save System

The entire run is serialized to `localStorage` under the key `pawpaw3d.save`, automatically **every ~8 seconds** while playing and again on `beforeunload`. Persisted state includes collectibles, credits, XP/level, abilities, upgrades, collar color, kitten rescues, shrine level, achievements, main‑mission index and progress, side‑quest states and steps, neighbor‑talk flags, discoveries, courier streak, the active courier job, and the player's position. The title screen detects a save and offers **START NEW** (clears it) or **RESUME WANDER**.

### 3.19 Narrative & Lore

The fiction is delivered ambiently through **17 data‑chip logs**, **10 restored memories**, **10 scannable posters**, NPC dialogue, and discovery flavor text. Threads include: a scattered city AI ("I was built to manage a city. I stayed because I loved it."), the loyal driverless Line‑9 trains, rain seeders the city lost control of, rooftop gardens protected by civic charter, and PawPaw's own origin as a calico with a cybernetic eye who "went looking for the highest point in the city."

### 3.20 Onboarding (ORB‑E)

A nav‑companion named **ORB‑E** delivers context‑sensitive, one‑time tips (`GUIDE`) the first time the player encounters each system — kibble, the dash/double‑jump unlocks, chips, kittens, wisps, Mei's shop, rooftops, rain, caches, climb trails, the apex spire, vending machines, rings, posters, the map, courier boards, FLOW, and neighbors — so the game teaches itself without a tutorial wall.

---

## 4. Technical Architecture

### 4.1 Technology Stack

- **Language:** Vanilla JavaScript, ES modules (no transpilation).
- **Rendering:** Three.js **r160**, vendored locally at `vendor/three.module.js` and loaded via an `importmap` (`"three": "./vendor/three.module.js"`). Post‑processing example modules are vendored under `vendor/jsm/postprocessing/`.
- **Audio:** Native WebAudio (no audio files — everything is synthesized/scheduled).
- **Persistence:** `localStorage`.
- **No** bundler, framework, package manager at runtime, or network dependency. The game runs from any static HTTP server.

### 4.2 Module Breakdown

| Module | Lines | Responsibility |
|---|---|---|
| `src/main.js` | ~287 | Boot, renderer/scene/camera, post‑processing pipeline, IBL env bake, pointer‑lock + keyboard + wheel input, start/resume flow, the render loop and timing, the `__PAW` debug handle |
| `src/world.js` | ~2,150 | Procedural city from a fixed seed: PBR facade textures, buildings, lighting, shrine, NPCs/citizens/bots, traffic, ziplines, rain, day/night, signs, climb routes |
| `src/player.js` | ~603 | The articulated cat model, movement physics, collision, jump/dash/glide, zipline riding, expressions/animation, and the wall‑aware mouse‑look camera |
| `src/game.js` | ~1,596 | Missions, side‑quests, discoveries, courier jobs, FLOW/FEVER, rotating tasks, economy, XP, mini‑events (incl. blackout), and save/load |
| `src/ui.js` | ~443 | HUD, trackers, compass, the city map renderer, and the journal / shop / dialogue modals |
| `src/fx.js` | ~165 | A single pooled `THREE.Points` particle system, ambient emitters, reward floaters, and screen flashes |
| `src/audio.js` | ~219 | A reverb‑bussed WebAudio music bed, reactive ambience layers, and the full SFX set |
| `src/data.js` | ~364 | Constants, districts, lore, shop, missions, quests, NPCs, discoveries, collection sets, the seeded RNG, and the shared live `state` object |

`index.html` (~98 lines) provides the canvas, the title/HUD/modal DOM, and the importmap; `style.css` (~594 lines) styles the neon UI.

### 4.3 Rendering Pipeline

The frame is composed through a Three.js `EffectComposer`:

```
Scene + Camera (70° FOV)
      → RenderPass
      → UnrealBloomPass  (strength 0.26, radius 0.45, threshold 0.88)
      → OutputPass       (ACES filmic tone mapping, exposure 1.12)
      → 4× MSAA HalfFloat render target → canvas
```

Key choices (all in `main.js`):

- **`WebGLRenderer({ antialias: true })`**, with `setPixelRatio(min(devicePixelRatio, 2))` to cap fill cost on high‑DPR screens.
- The composer renders into a `WebGLRenderTarget` of `type: HalfFloatType, samples: 4` — **4× MSAA**. Without explicit samples, the composer would bypass the canvas's own anti‑aliasing and reintroduce jaggies, so MSAA is configured on the render target itself.
- **Selective bloom:** UnrealBloom is tuned low with a high threshold (0.88) so only genuine neon blooms rather than the whole frame.
- **ACES filmic** tone mapping at exposure 1.12 gives rich, non‑clipping color.
- The camera is a `PerspectiveCamera(70, aspect, 0.1, 1500)`.
- A `resize` handler keeps camera aspect, renderer, and composer sizes in sync.

### 4.4 Lighting & Image‑Based Lighting

At boot, `main.js` bakes a tiny **"neon room"** into an environment map: a handful of emissive `MeshBasicMaterial` panels (magenta wall, cyan wall, amber storefront glow, violet back, pale skylight, warm floor) are placed in an off‑screen scene and prefiltered with a **`PMREMGenerator`** (`scene.environment`, `environmentIntensity = 0.5`). This means every PBR material in the city — wet roads, metal, glass, window trim — picks up plausible colored reflections without any runtime light cost. On top of the IBL sit a hemisphere light and a directional key, both driven by the day/night cycle, plus per‑sign emissive glow and volumetric lamp cones.

### 4.5 Procedural City Generation

- **Deterministic RNG:** a small LCG (`makeRng`, `s = s*1664525 + 1013904223`) seeds the whole world, so every building, route, sign, and prop is identical on every visit.
- **Procedural PBR facades:** building textures are drawn to off‑screen canvases (`windowTexture`, `facadeTexture`, `drawWindow`) with panel seams, lit/dark window grids, grime streaks, and warm storefront glow, then used as both `map` and `emissiveMap` so windows actually emit light. Materials are **cached and shared** across buildings to keep the material/texture count bounded.
- **Districts** are assigned purely by X position (`zoneAt`), tinting signage and haze per zone.
- **Climb routes** (`parkourStack`) generate glowing crate steps, pawprint trails, and occasional rooftop rings up the side of buildings, and register a traversal trail in `world.trailSpots`.
- The city also seeds citizens, bots, drones, hover‑car traffic, ziplines, holo‑cats, holo‑fish, an elevated train, signs/billboards, puddles, haze billboards, and street litter.

### 4.6 Player Physics & Camera

- **Movement constants** (`CFG`): walk 6.5, sprint 11.5, gravity 26, jump velocity 9.2, dash velocity 26 over 0.16 s with a 1.1 s cooldown.
- **Collision** is capsule‑vs‑AABB against the world's collider set, with **coyote time** and a **jump buffer** for forgiving platforming, plus double‑jump, teleport‑dash, and glide (gated behind kibble thresholds and the Cloud Pads upgrade).
- **The cat model** is built from smooth high‑poly primitives with squash‑and‑stretch, a walk gait, blinking, emotive squints, ear/tail motion, and idle states (sit, stretch, purr).
- **Third‑person camera** (`updateCamera`): smoothed follow at `CAM_DIST = 4.6`, `CAM_HEIGHT = 1.05`, that **slides in front of geometry** instead of clipping and **fades the cat to transparent** only when it pulls in very close (the `catFade` / `fadeMats` mechanism — this is why distance is preferred for character screenshots).

### 4.7 Particle / FX System

`fx.js` renders **all** sparks, bursts, confetti, reward floaters, and ambient emitters from **one pooled `THREE.Points` cloud** with shared position/color buffer attributes and `frustumCulled = false`. The pool is allocated once; the hot loop reuses slots rather than creating per‑effect objects, keeping per‑frame allocation near zero. Screen flashes and floating reward text are handled alongside.

### 4.8 Audio Engine

`audio.js` builds a pure WebAudio graph (initialized on the first user gesture, as browsers require): a **reverb‑bussed**, chord‑progression music bed with a bell melody, plus distance‑**reactive ambience layers** (rain, traffic, neon buzz) that swell with what's nearby, and the full SFX set (footsteps, jumps, pickups, meow, stretch, purr, whoosh, title sting). No audio assets are shipped — everything is synthesized and scheduled.

### 4.9 UI Layer

`ui.js` owns the DOM HUD and the canvas‑drawn city map, plus the journal/shop/dialogue modals. The HUD stays compact during play; opening the journal or a shop modal releases pointer‑lock so buttons are clickable, and clicking the dimmed background closes the modal and re‑locks the mouse. The map is an information‑rich top‑down render (route, district bands, distance rings, markers).

### 4.10 Game State & Persistence

A single shared `state` object (`data.js`) holds all live progress: counts, abilities, upgrades, collar, collected UIDs, kittens, shrine level, achievements, flags, lifetime stats, XP/level, courier streak, active job, rotating objectives, mission index/progress, side‑quest states/steps, neighbor flags, and discoveries. `game.js` serializes this to `localStorage` (`pawpaw3d.save`) on a timer and on exit, and reconstructs it on resume.

### 4.11 Main Loop & Timing

`main.js` drives a `requestAnimationFrame` loop with a **fixed‑max delta** (`dt` clamped to 0.05 s) to prevent physics blow‑ups after a stall. A `setInterval(33 ms)` fallback keeps the simulation ticking even when the tab is hidden (where rAF pauses). The loop advances `dayT` on the 180 s cycle, updates player → game → world → FX in order, runs the cinematic title‑orbit camera before the game starts (and the gameplay camera after), and finally calls `composer.render()`. A debug handle, `window.__PAW = { state, player, world, camera, renderer, scene, composer, game }`, is exposed for automated smoke tests and tooling.

### 4.12 Performance Engineering

- Seeded generation + **shared/cached materials and textures** bound GPU memory and draw setup.
- A **single pooled particle system** eliminates per‑effect allocations.
- **Pixel‑ratio cap** at 2 and a tuned, selective bloom keep fill cost in check.
- The result is a steady **~60 fps** with the full post‑processing stack on commodity hardware.

### 4.13 Deployment & CI

Deployment is a **static GitHub Pages** publish via `.github/workflows/deploy-pages.yml`: on every push to `main` (or manual dispatch), the workflow checks out the repo, uploads the whole tree as a Pages artifact (`actions/upload-pages-artifact`), and deploys it (`actions/deploy-pages`). There is no build step — the repository root *is* the site. The live game is served at the Pages root and the HTML report under `docs/`.

### 4.14 Report Tooling

- **`tools/build_report.js`** — a zero‑dependency Node script that generates the self‑contained visual report `docs/PAWPAW_WORLD_Report.html`, inlining every screenshot as base64 and embedding videos by relative path. Re‑run it after changing screenshots or copy.
- **`tools/serve.py`** — a tiny caching‑disabled static dev server (`python3 tools/serve.py <port>`).
- **`tools/capture_server.py`** — a one‑off local receiver used to re‑capture report screenshots and the 360° turntable video directly from the running game (it accepts posted data‑URL frames and writes them into `assets/report/`).

---

## 5. Repository Layout

```text
index.html                 Deployed game entry point, importmap, UI markup
style.css                  Neon interface styling
src/
  main.js                  Boot, input, render loop, post-processing, IBL
  world.js                 Procedural city, lighting, NPCs, traffic, rain
  player.js                Cat model, movement physics, mouse-look camera
  game.js                  Missions, quests, courier, FLOW/FEVER, save/load
  ui.js                    HUD, map, journal/shop/dialogue modals
  fx.js                    Pooled particle system, floaters, flashes
  audio.js                 Reverb-bussed music bed + reactive ambience
  data.js                  Constants, content tables, seeded RNG, state
vendor/
  three.module.js          Vendored Three.js r160
  jsm/postprocessing/      EffectComposer, RenderPass, UnrealBloom, OutputPass…
assets/report/
  images/                  In-game report screenshots
  videos/                  Deployment-ready report videos (gameplay, 360° study)
docs/
  PAWPAW_WORLD_Report.html Generated visual project report
  PROJECT_REPORT.md        This document
tools/
  build_report.js          Regenerates the HTML report
  serve.py                 Local static dev server
  capture_server.py        One-off in-game screenshot/video receiver
archive/legacy-2d/         Preserved original 2D Canvas version
.github/workflows/         GitHub Pages deployment automation
```

---

## 6. Configuration Reference

Central tunables live in `CFG` (`src/data.js`):

| Key | Value | Meaning |
|---|---|---|
| `CITY` | 200 | City half‑size in meters (world spans −200…200) |
| `GRAVITY` | 26 | Gravity acceleration |
| `WALK` | 6.5 | Walk speed |
| `SPRINT` | 11.5 | Sprint speed |
| `JUMP_V` | 9.2 | Jump impulse velocity |
| `DASH_V` | 26 | Dash velocity |
| `DASH_T` | 0.16 | Dash duration (s) |
| `DASH_CD` | 1.1 | Dash cooldown (s) |
| `CAM_DIST` | 4.6 | Third‑person camera distance |
| `CAM_HEIGHT` | 1.05 | Camera height |
| `MOUSE_SENS` | 0.0023 | Mouse‑look sensitivity |
| `DAY_LENGTH` | 180 | Day/night cycle length (s) |
| `PICKUP_R` | 1.6 | Collectible pickup radius |
| `UNLOCKS.dash` | 10 | Kibble to unlock Teleport Dash |
| `UNLOCKS.djump` | 25 | Kibble to unlock Double Jump |

---

## 7. Build, Run & Develop

**Run locally** (a server is required — ES modules don't load from `file://`):

```bash
python3 tools/serve.py 8741
# then open http://localhost:8741
```

`tools/serve.py` is a plain `http.server` with caching disabled so edits show on reload; `python3 -m http.server 8741` also works.

On the title screen choose **START NEW** (erases any save) or **RESUME WANDER**, then click the canvas to capture the mouse.

**Regenerate the HTML report** after changing screenshots or copy:

```bash
node tools/build_report.js
```

**Deploy:** push to `main` — GitHub Actions publishes the repository root to Pages automatically.

---

## 8. Known Limitations & Future Work

- **Report HTML size.** `docs/PAWPAW_WORLD_Report.html` inlines all screenshots as base64 and is large (~20+ MB); lowering JPEG quality or externalizing images would shrink it substantially.
- **Procedural atmosphere shots.** Some district "mood" framings (a tight foggy alley, the antenna farm) are hard to compose from the procedural layout for marketing screenshots.
- **No mobile touch controls.** Input assumes a mouse + keyboard with pointer‑lock; touch is limited to pinch‑zoom.
- **Single fixed seed.** The city is intentionally identical every visit; there is no seed selection or regeneration UI.

---

## 9. Recent Engineering Highlights

- **Trees removed** from the world generation (rooftop cone trees and the palm‑tree field) for a cleaner cyberpunk silhouette.
- **Blackout overhaul.** The city blackout previously only dimmed the ambient hemisphere light. It now **collects every building‑window material and dims their emissive to zero**, so building lights genuinely go out for **~7 seconds** while **street lamps and neon remain**, then surge back — a much more readable "blackout" both in play and in the report.
- **Report re‑capture.** Character, landmark, district, NPC, and situation screenshots were re‑captured at their **actual in‑game coordinates** (driving the camera through the live game via the `__PAW` handle), and a clean **360° character‑study turntable video** was re‑recorded, so every gallery image matches its caption and the cat renders solid rather than camera‑faded.
- **Report features.** The HTML report gained a step‑by‑step **How‑to‑Play** section, **auto‑playing clips on scroll**, an expanded **Technical Architecture** section, and dedicated **NPC encounter** images.

---

*This document describes PawPaw‑World‑3D‑v1 as implemented in the `main` branch. It is generated from a direct reading of the source — `src/*.js`, `index.html`, and the deployment workflow — and is intended as the authoritative technical and functional reference for the project.*
