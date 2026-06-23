# PawPaw-World-3D-v1 — User Manual

PawPaw-World-3D-v1 is a 3D cyber-cat exploration game. You play PawPaw, a calico cat with one glowing cybernetic eye, roaming a dense neon city. There is no combat and no hard failure — almost everything you do gives credits, XP, collectibles, lore, or progress.

**Live deployment:** https://mah-era.github.io/PawPaw-World-3D-v1/  
**Project report:** https://mah-era.github.io/PawPaw-World-3D-v1/docs/PAWPAW_WORLD_Report.html

## Starting the Game

Run a local server and open the page (ES modules will not load from a `file://` path):

```bash
python3 tools/serve.py 8741
```

Then visit `http://localhost:8741`.

On the title screen:

- **START NEW** — begin a fresh game (erases any existing save).
- **RESUME WANDER** — continue your saved game (shown only if a save exists).

After entering, **click the screen** to capture the mouse for look control. Press **Esc** at any time to release the mouse and pause; click again to resume.

## Controls

| Input | Action |
|---|---|
| Mouse | Look around |
| W A S D / arrows | Move (relative to the camera) |
| Shift | Sprint |
| Space | Jump (double jump once unlocked); hold while falling to glide if you own Cloud Pads; press to bail off a zipline |
| X | Teleport dash (once unlocked) |
| E | Interact with whatever the on-screen prompt names |
| F | Meow |
| Mouse wheel / two-finger scroll / pinch | Zoom the camera in and out (zooms the map too, when open) |
| M | Open the city map |
| J | Open the journal |
| Esc | Release the mouse / pause; close any open menu |

## The Heads-Up Display

- **Top-left panel** — your collectible counts (kibble, chips, memories, kittens), credits, and the XP/level bar.
- **Mission tracker** (under the panel) — your current main mission, its progress, and reward.
- **Side-quest tracker** (below that) — appears when you have accepted an NPC errand.
- **Compass** (top-center) — an arrow and distance to your current objective.
- **City Tasks** (top-right) — three rotating short-term goals.
- **Courier chip** (top-center) — appears during a timed delivery, with destination, distance, time left, and streak.
- **FLOW meter** (right) — your current action combo.
- **Nearby hint** (bottom-left) — the closest worthwhile thing to do, with a direction arrow.
- **ORB-E messages** (bottom) — your nav-companion's tips.

## What to Do

There is always something nearby. Pick whatever you like:

**Short-session goals**

- Follow the gold compass arrow and finish the current main mission.
- Complete one rotating City Task.
- Take and deliver one courier job.
- Chase one data wisp.
- Scratch a passer-by (E) or meow (F) to scatter pigeons.
- Find one hidden discovery.

**Longer-session goals**

- Work through the main mission chain to the apex spire and beyond.
- Help all four quest NPCs (Solder → Vega → Patch → Jin).
- Rescue all 8 lost kittens and grow the Paw Shrine.
- Find all 8 hidden discoveries.
- Collect all 140 kibble, 18 chips, and 10 memories.
- Build a long courier streak and a high FLOW combo.

## Main Missions

A main mission is always active and always points somewhere. A **gold beam** in the world and the **compass** mark the goal; the **map** draws a dashed route to it. Missions ask you to reach a place, collect, deliver, ride ziplines, crack a cache, rescue a kitten, or climb — and each one you finish unlocks the next. The chain ends in a repeatable courier loop, so you are never left with nothing to do.

## NPC Side-Quests

Four named characters stand around the districts, each glowing with a `!` marker when they have work. Walk up and press **E** to read their request and accept it. A **cyan beam** then marks the errand spot — reach it (some require climbing to a rooftop), then return to the NPC and press **E** again to turn it in for a reward. Finishing one character's quest introduces the next, so their stories connect. Track their status in the **Journal → NPC Quests**.

## Courier Jobs

Find a **courier board** (▣ on the map) and press **E** to take a timed delivery. A beam marks the drop-off and a HUD chip shows the destination, distance, an arrow, and the countdown. Deliver before time runs out and your **streak** multiplies the payout; miss it and the streak resets.

## Hidden Discoveries

Eight secret spots are tucked into alley dead-ends, the docks, the drowned arcade, and rooftops you must climb to reach. Walking into one reveals a piece of city lore and pays out credits and XP. Found discoveries are listed in the **Journal**; undiscovered ones show as faint `◇` diamonds on the map.

## Collecting and Climbing

- **Holo-kibble** — 140 scattered through the streets and along climb routes. Collecting **10** unlocks the **Teleport Dash (X)**; **25** unlocks the **Double Jump**.
- **Data chips (18)** and **lost memories (10)** — sit on rooftops and high places; each carries a lore entry archived in the Journal.
- **Hidden caches (4)** — pulsing violet cubes with big payouts and lore.
- **Neon rings, vending machines, posters, cans** — quick micro-activities for credits, lore, and combo fuel.

Almost every building has a visible way up. **Pawprints** and **glowing crates** mark climb routes; look for crate stacks, fire escapes, awnings, balconies, roof-to-roof bridges, and rideable **ziplines** (press E to ride, Space to bail). A "CLIMB ME" tower sits right next to where you start.

## Lost Kittens and the Paw Shrine

Eight named kittens are lost in the city. Press **E** to scoop one up, then carry it to the **Paw Shrine** in the plaza (follow the ♥ hint). Each kitten delivered grows the shrine — lanterns, a gate, floating orbs, and finally a sky beacon — and rescued kittens stay and play around it.

## The FLOW Combo

Doing things quickly in a row — kibble, rings, cans, wisps, ziplines, dashes, scattering pigeons, deliveries — builds a **FLOW combo**. Keep the chain alive and it cashes out for bonus credits when it ends. The longer the chain, the bigger the payout.

## Meowing and Playful Interaction

Press **F** to **meow** anywhere: it scatters nearby pigeon flocks, makes passers-by turn and react, and adds to your combo. Walk up to a citizen and press **E** to give them a friendly **scritch** — they hop happily and sometimes tip you a credit.

## The City Map (M)

Press **M** for a full district map showing your position and facing, a **compass rose**, **distance rings** (50/100/150 m) around you, the dashed route and distance to your mission goal, and labelled markers for the shrine, vendor, quest NPCs, courier boards, kittens, caches, ziplines, rings, vending machines, posters, and undiscovered secrets. A legend and a "How to Play" panel sit beside it. **Scroll or pinch** to zoom the map in and out.

## The Journal (J)

Press **J** to review:

- **Collection** — kibble, chips, memories, kittens, shrine level, wisps, distance travelled, courier jobs, best combo.
- **Main Story** — your current mission and overall progress.
- **NPC Quests** — each character's status.
- **Hidden Discoveries** — which secrets you have found.
- **Achievements** — the full checklist.
- **Lore Archives** — every data chip and lost memory you have recovered.

## XP, Levels, and Upgrades

Earn XP from collecting, missions, side-quests, deliveries, discoveries, kitten rescues, wisps, and combos. Leveling up awards a celebratory burst and keeps your paw level climbing. Spend **credits** at **Mei's vendor stall** (¢ on the map) on permanent upgrades — faster sprint, higher jump, shorter dash cooldown, gliding Cloud Pads, a kibble magnet — plus a speed-boost snack and collar colors.

## Saving

Everything important saves automatically to localStorage every few seconds and when you leave: collectibles, credits, XP and level, abilities and upgrades, collar color, kitten rescues, shrine level, achievements, main-mission progress, side-quest states, discoveries, courier streak, rotating tasks, and your position. Close the browser and return any time — your city remembers you.

## Comfort Notes

There is no combat, no timer you can permanently fail, and no penalty for falling. Explore at your own pace; the compass and nearby hint will always show you something to do.
