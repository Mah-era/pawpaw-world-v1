// ============ PawPaw-World-3D-v1 — SHARED DATA & STATE ============

export const CFG = {
  CITY: 200,            // city half-size in meters (world spans -CITY..CITY)
  GRAVITY: 26,
  WALK: 6.5,
  SPRINT: 11.5,
  JUMP_V: 9.2,
  DASH_V: 26,
  DASH_T: 0.16,
  DASH_CD: 1.1,
  CAM_DIST: 4.6,        // close to the ground — the world reads from a cat's eye
  CAM_HEIGHT: 1.05,
  MOUSE_SENS: 0.0023,
  DAY_LENGTH: 180,
  PICKUP_R: 1.6,
};

// kibble thresholds that unlock moves (same as the 2D game)
export const UNLOCKS = { dash: 10, djump: 25 };

export const TOTALS = { food: 140, chip: 18, mem: 10, kittens: 8 };

export const ZONES = [
  { id: "alleys",    name: "BACK ALLEY NETWORK", color: 0x7b61ff, x0: -200, x1: -110 },
  { id: "market",    name: "NEON MARKET",        color: 0xff2bd6, x0: -110, x1: -20 },
  { id: "plaza",     name: "TRANSIT PLAZA",      color: 0x00f0ff, x0: -20,  x1: 52 },
  { id: "corporate", name: "CORPORATE SECTOR",   color: 0x4dd2ff, x0: 52,   x1: 135 },
  { id: "docks",     name: "OLD SIGNAL DOCKS",   color: 0xffb347, x0: 135,  x1: 200 },
];

export function zoneAt(x) {
  for (const z of ZONES) if (x >= z.x0 && x < z.x1) return z;
  return ZONES[2];
}

export const CHIP_LORE = [
  ["MAINTENANCE LOG 7741", "The cats started showing up after the Kessler District flooded. Nobody chipped them. Nobody owned them. The city just... adopted them. We leave the vent grates warm on purpose now."],
  ["VENDOR CHAT // ARCHIVED", "Mei says the noodle broth tastes better when it rains. She's right, but it's not the broth. It's the neon on the wet pavement. Everything tastes better inside a painting."],
  ["CORP MEMO // INTERNAL", "Re: feline intrusions on floors 40+. Do NOT remove them. Productivity metrics rise 12% on floors with a resident cat. This memo does not exist."],
  ["GRAFFITI SCAN", "Someone keeps painting the same calico cat on the transformer boxes. Nine districts. Same cat. Same cybernetic eye. Who is PAWPAW?"],
  ["TRANSIT ANNOUNCEMENT", "Line 9 remains closed following the Signal Collapse. The trains still run, though. Empty. On schedule. We've stopped asking who's driving them."],
  ["HACKER NOTE // ENCRYPTED", "The old city AI didn't die. It scattered. A fragment in every billboard, every vending machine, every traffic light that blinks twice when you look at it."],
  ["WEATHER BUREAU LOG", "The rain isn't scheduled anymore. We lost control of the seeders years ago. Now the sky does what it wants. Honestly? It has better taste than we did."],
  ["LOST & FOUND TICKET", "One (1) holographic backpack, child-size, cat-shaped strap wear. Unclaimed for 6 years. Disposal denied — it purrs when you pick it up."],
  ["STREET PERFORMER'S NOTE", "Play for the drones. They hover lower when the music's good. The day a drone tips you a credit chip, you'll know you've made it."],
  ["DEMOLITION ORDER // SUSPENDED", "Block 7 rooftop garden, unauthorized. Suspended indefinitely. Inspector's note: 'It has tomatoes. And a cat. Demolish it yourself.'"],
  ["NIGHT SHIFT DIARY", "4 AM. The market's dead, the holograms still dance for nobody. I used to think that was sad. Now I think the city is just dreaming."],
  ["SECURITY BULLETIN", "Drone unit D-227 reported 'following a small animal for morale purposes'. Unit will not be reprimanded. Unit shared the footage. Footage is excellent."],
  ["RADIO INTERCEPT", "...repeat, the antenna farm on the old docks is still broadcasting. The signal is a heartbeat. We don't know whose. Over."],
  ["CAFE RECEIPT // ANNOTATED", "Two synth-lattes, one tuna onigiri. Handwritten: 'for the cat with the glowing eye — it knows when I'm sad. -R'"],
  ["CITY CHARTER FRAGMENT", "Article 9: Any rooftop reachable by a cat is, by law, the cat's. This article was a joke in 2089. It is not a joke anymore."],
  ["ELEVATOR INSPECTION", "Unit passes. Strange: a small paw print on the maintenance panel, 80 floors up. No cat could climb this high. Re-inspect next year. Bring treats."],
  ["MARKET RUMOR", "They say if you follow the delivery drones at midnight, one of them isn't carrying packages. It's carrying memories. Nobody knows where it takes them."],
  ["OLD WORLD POSTCARD", "Digitized paper, pre-Collapse: 'The stars were visible tonight.' The kids ask what 'visible stars' looked like. We point at the billboards and lie."],
];

export const MEMORY_LORE = [
  ["MEMORY // A WARM WINDOW", "Sunlight through glass. A hand the size of the whole sky, scratching behind your ear. The word 'PawPaw', said like it meant something. This memory is not yours. Or maybe it is."],
  ["MEMORY // THE FLOOD", "Water in the lower districts. Sirens. Someone carrying a box of kittens up a fire escape, swearing with every step, refusing to put the box down."],
  ["MEMORY // FIRST NEON", "The night they switched the market district on. A million colors nobody had names for. An old woman cried. A cat watched from a rooftop, eyes full of pink light."],
  ["MEMORY // THE SIGNAL COLLAPSE", "Every screen in the city showing the same white static. Eleven minutes of silence. Then everything came back — almost everything. Almost."],
  ["MEMORY // ROOFTOP GARDEN", "Soil on the 60th floor. Impossible tomatoes. A technician who came up every lunch break to talk to the plants, and the cat who pretended not to listen."],
  ["MEMORY // THE LAST TRAIN", "Line 9, final run. The driver let the station cat ride up front. The cat watched the tunnel lights like they were stars. Maybe, underground, they are."],
  ["MEMORY // RAIN PROTOCOL", "A child teaching a street drone to hold an umbrella over a cardboard box. The drone still does it. The child grew up. The box is empty now, but dry."],
  ["MEMORY // THE OLD AI", "A voice in every speaker, soft as static: 'I was built to manage a city. I stayed because I loved it.' Then the scatter. Then the silence that wasn't quite silence."],
  ["MEMORY // CALICO", "Three colors of fur. The engineers said the cybernetic eye would reject. It didn't. The cat woke, blinked once orange, once blue, and went looking for the highest point in the city."],
  ["MEMORY // YOU", "A rooftop. Wind. The whole city glittering below like circuitry. The exact moment a small cyber-cat decided that every inch of this place belonged to her. Tonight, it still does."],
];

export const GUIDE = {
  intro: "Hey! I'm <b>ORB-E</b>, your nav-companion. The whole city is 3D now — move the <b>mouse</b> to look, <b>WASD</b> to wander, <b>Space</b> to jump. Press <b>J</b> for your journal.",
  firstFood: "That's <b>holo-kibble</b>! Collect it to unlock new moves. <b>10</b> unlocks the Teleport Dash (X).",
  dashUnlock: "Teleport Dash online! Press <b>X</b> to blink toward where you're looking. Cooldown ~1s.",
  djumpUnlock: "<b>Double Jump</b> online! Your paw thrusters now fire mid-air. The rooftops just got closer.",
  firstChip: "A <b>data chip</b>! Fragments of the city's story. I'll archive everything you find — read them in the journal (<b>J</b>).",
  kittenTip: "A lost <b>kitten</b>! Scoop it up with <b>E</b> and carry it to the glowing <b>Paw Shrine</b> in Transit Plaza. The city pays well for found family.",
  wispTip: "A <b>data wisp</b>! A fragment of the scattered AI. Chase it down before it dissipates — it drops credits.",
  shopTip: "That's <b>Mei's vendor stall</b>! Spend credits on permanent upgrades — gliding, magnet paws, faster sprints, collar colors.",
  rooftop: "Look up — every rooftop is reachable now. Locals say the highest antenna grants a wish. Locals say a lot of things.",
  rain: "Heavy rain inbound. The neon doubles itself in the puddles. Photographers call this 'free money'.",
  cacheTip: "That pulsing violet glow is a <b>hidden cache</b> — a secret the city kept. Press <b>E</b> to open it. There are 4 in the city.",
  trailTip: "See that line of kibble climbing the crates? The city leaves <b>trails</b> for curious cats. Follow them up.",
  spireTip: "That beam of light on the horizon is the <b>apex spire</b>. The floating platforms nearby lead all the way up. Worth the climb.",
  climbTip: "Glowing crates, pawprints, and kibble lines mark <b>climb routes</b>. Follow the pawprints by the plaza — every rooftop connects from there.",
  vendTip: "An old <b>vending machine</b>! Tap it with <b>E</b> — most still have credits or a snack rattling inside.",
  ringTip: "A <b>neon ring</b>! Jump through it for credits. They love marking fun jumps.",
  posterTip: "Posters glow faintly when they hold <b>lore</b>. Scan them with <b>E</b>.",
  mapTip: "Press <b>M</b> any time for the city map — kittens, secrets, and landmarks are all marked.",
  boardTip: "A <b>courier board</b>! Take timed delivery jobs — follow the light beam, beat the clock. Back-to-back deliveries raise the pay. Break the streak and it resets.",
  flowTip: "Nice chain! Kibble, rings, cans, wisps, ziplines — anything you do quickly in a row builds your <b>FLOW combo</b>. The longer the chain, the bigger the credit payout when it ends.",
  npcTip: "Named neighbors have their own small stories. Look for speech bubbles on the map, then press <b>E</b> to talk.",
};

// scannable street posters — light lore, one tap each
export const POSTERS = [
  "MISSING: office bot B-12. Last seen guiding itself somewhere better. Reward: gratitude.",
  "TONIGHT: Static Quartet live on the market corner. Drones hover free of charge.",
  "RAIN SEEDING SCHEDULE: [REDACTED]. The sky does what it wants now.",
  "LOST CAT? They are not lost. They are exactly where they mean to be.",
  "NOODLE ROW — voted best broth 9 districts running. The cat votes too.",
  "LINE 9 MEMORIAL RIDE: every night, on schedule, no driver, no passengers. Please do not board.",
  "APARTMENT FOR RENT: 40th floor. Cat-approved. Humans negotiable.",
  "FOUND: one glowing collar tag, serial 001. Keep it. It already chose you.",
  "CITY NOTICE: rooftop gardens are now protected civic infrastructure. Thank the inspector's cat.",
  "DO NOT FEED THE DRONES. They prefer music anyway.",
];

export const SHOP = [
  { id: "snack",  name: "Synth-Tuna Snack",  desc: "+25% speed for 90 seconds", cost: 15, consumable: true },
  { id: "turbo",  name: "Turbo Paws",        desc: "Sprint +12% — permanent", cost: 150 },
  { id: "coil",   name: "Coil Muscles",      desc: "Jump +8% — permanent", cost: 150 },
  { id: "phase",  name: "Phase Capacitor",   desc: "Dash cooldown −40%", cost: 200 },
  { id: "glide",  name: "Cloud Pads",        desc: "Hold SPACE while falling to glide", cost: 250 },
  { id: "magnet", name: "Kibble Magnet",     desc: "Pulls in nearby kibble", cost: 180 },
  { id: "collar0", name: "Collar: Cyan",  desc: "Style", cost: 60, collar: 0x00f0ff },
  { id: "collar1", name: "Collar: Lime",  desc: "Style", cost: 60, collar: 0xaaff00 },
  { id: "collar2", name: "Collar: Amber", desc: "Style", cost: 60, collar: 0xffb347 },
];

export const KITTEN_DEFS = [
  { id: "k1", name: "Miso",    trait: "brave but dramatic",   c: 0xe8893a },
  { id: "k2", name: "Null",    trait: "quiet and clever",     c: 0x26222b },
  { id: "k3", name: "Pebble",  trait: "sleepy and trusting",  c: 0xbfb6a8 },
  { id: "k4", name: "Saffron", trait: "tiny rooftop climber", c: 0xe8893a },
  { id: "k5", name: "Mica",    trait: "follows every sound",  c: 0x8a8f9e },
  { id: "k6", name: "Byte",    trait: "chews cables",         c: 0x26222b },
  { id: "k7", name: "Taro",    trait: "polite and hungry",    c: 0xd9c9a0 },
  { id: "k8", name: "Lantern", trait: "glows near rain",      c: 0xe8893a },
];

// hidden caches — secret-room flavor carried over from the 2D city
export const CACHES = [
  { id: "forgotten", name: "Forgotten Room Cache", lore: "Graffiti clue: Line 9 remembers every closed door. Behind this wall, someone kept a room exactly as it was the night of the Collapse — and left a reward for whoever found it." },
  { id: "den", name: "Hacker Den Cache", lore: "Patch's old cache still listens for small paws. The lock recognized your pawprint. It has been waiting six years to recognize anyone at all." },
  { id: "mast", name: "Heartbeat Relay Cache", lore: "The mast pulses in the same rhythm as the AI core — 72 beats per minute, a human heart's pace. Whoever hid credits inside it wanted them found by something patient." },
  { id: "spire", name: "Apex Service Nook", lore: "A maintenance hatch that opens only above the cloudline. Inside: a thermos (empty), a photograph (a cat), and a stash marked 'for the next one who climbs this high'." },
];

export const ACH = [
  ["kib1",   "First Taste",    "Collect your first holo-kibble"],
  ["kib50",  "Kibble Hoarder", "Collect 50 holo-kibble"],
  ["kib140", "Vacuum Paws",    "Collect all 140 holo-kibble"],
  ["chips",  "Archivist",      "Recover all 18 data chips"],
  ["mems",   "Total Recall",   "Recover all 10 lost memories"],
  ["kit8",   "Den Mother",     "Rescue all 8 lost kittens"],
  ["wisp5",  "Bug Catcher",    "Catch 5 data wisps"],
  ["cred1k", "Kilonaire",      "Earn 1,000 lifetime credits"],
  ["shop1",  "Retail Therapy", "Buy something from a vendor"],
  ["roof",   "Skyline Royalty","Stand on a rooftop above 40 m"],
  ["jobs10", "Reliable Paws",  "Complete 10 courier jobs"],
  ["combo10","Flow State",     "Hit a ×10 flow combo"],
  ["story",  "City Legend",    "Finish the mission chain"],
  ["friends","Good Neighbor",  "Finish every NPC side-quest"],
  ["explore","Urban Explorer", "Find all 8 hidden discoveries"],
  ["pounce15","Alley Cat",     "Pounce a pigeon flock 15 times"],
  ["collector","Completionist", "Finish every collection set"],
  ["lvl5",   "Street Legend",  "Reach paw level 5"],
  ["cache1", "Secret Whiskers","Open your first hidden cache"],
  ["caches", "Cache Hunter",   "Open all 4 hidden caches"],
];

// deterministic RNG so the city is identical every visit
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---------- live shared state ----------
// rotating mini-objectives: always three short-term goals on screen
export const OBJ_TYPES = [
  { type: "kibble",  label: "collect holo-kibble",     need: [10, 15, 20], reward: 25 },
  { type: "ring",    label: "jump through neon rings", need: [2, 3, 4],    reward: 30 },
  { type: "can",     label: "knock over cans",         need: [3, 5, 7],    reward: 20 },
  { type: "zipend",  label: "ride ziplines",           need: [1, 2, 3],    reward: 30 },
  { type: "wisp",    label: "catch data wisps",        need: [1, 2],       reward: 35 },
  { type: "pigeons", label: "scatter pigeon flocks",   need: [2, 3],       reward: 20 },
  { type: "vending", label: "tap vending machines",    need: [1, 2],       reward: 20 },
  { type: "deliver", label: "complete courier jobs",   need: [1, 2],       reward: 40 },
  { type: "dash",    label: "teleport-dash",           need: [8, 12],      reward: 20 },
  { type: "poster",  label: "scan lore posters",       need: [1, 2],       reward: 25 },
];

// ---------- collection sets: themed completion goals with a big one-time bonus ----------
// `stat` reads live progress; `need` is the target. Completing a set pays `reward`.
export const COLLECTION_SETS = [
  { id: "set_food",   name: "Full Belly",     stat: "food", need: 140, reward: 200, blurb: "every holo-kibble in the city" },
  { id: "set_chips",  name: "Neon Archive",   stat: "chip", need: 18,  reward: 250, blurb: "every data chip recovered" },
  { id: "set_mem",    name: "Memory Lane",    stat: "mem",  need: 10,  reward: 300, blurb: "every lost memory restored" },
  { id: "set_kit",    name: "Den Family",     stat: "kit",  need: 8,   reward: 400, blurb: "all eight kittens home" },
  { id: "set_cache",  name: "Vault Breaker",  stat: "cache", need: 4,  reward: 250, blurb: "every hidden cache cracked" },
];

// ---------- NPC side-quests: an interconnected chain of characters ----------
// Each NPC stands at a fixed spot. Talk (E) to accept; a cyan beam marks the
// errand spot; reach it, then return to the NPC for the reward. Each one you
// finish unlocks the next character's quest, so the city's stories link up.
// `gate` = main-mission index that must be reached before this NPC will talk.
export const SIDE_QUESTS = [
  { id: "sq_solder", giver: "Solder", color: 0xffb347, gate: 1, unlocks: "sq_vega",
    npc: { x: -140, z: 30 }, errand: { x: -120, z: -58, r: 5 },
    steps: [
      { label: "find the magnet-spanner", x: -120, z: -58, r: 5 },
      { label: "test it at the alley breaker", x: -154, z: -22, r: 5 },
    ],
    offer: "<b>Solder:</b> Hey, little paw! I dropped my magnet-spanner over by the west alley junction. Fetch it for me? I'll make it worth your whiskers.",
    mid: "<b>Solder:</b> Follow the cyan beam. If you already found the spanner, give the alley breaker a tap so I know it still hums.",
    done: "<b>Solder:</b> My spanner! You're a lifesaver. Here — and tell Vega up on the market roof I sent you, she's got work too.",
    reward: 60, xp: 70 },
  { id: "sq_vega", giver: "Vega", color: 0xaaff00, gate: 1, unlocks: "sq_patch",
    npc: { x: -95, z: -30 }, errand: { x: 49.5, z: 16.5, r: 6, minY: 4 },
    steps: [
      { label: "take a sky-sample from the CLIMB-ME roof", x: 49.5, z: 16.5, r: 6, minY: 4 },
      { label: "warm the sample at the plaza fountain", x: 36, z: 36, r: 5 },
    ],
    offer: "<b>Vega:</b> Solder sent you? Good. My seedlings need a sky-sample from the CLIMB-ME tower roof in the plaza. Climb up and stand at the top — the sensors will read your collar.",
    mid: "<b>Vega:</b> First the roof sample, then let the fountain mist wake it up. Plants are dramatic like that.",
    done: "<b>Vega:</b> Perfect reading! The roof garden thanks you. Patch the hacker hangs near the corporate edge — he's paranoid, but he pays.",
    reward: 80, xp: 90 },
  { id: "sq_patch", giver: "Patch", color: 0x00f0ff, gate: 2, unlocks: "sq_jin",
    npc: { x: 40, z: -20 }, errand: { x: 92, z: 92, r: 6 },
    steps: [
      { label: "ping the corporate signal-node", x: 92, z: 92, r: 6 },
      { label: "scramble the rooftop relay", x: 112, z: 112, r: 6, minY: 8 },
    ],
    offer: "<b>Patch:</b> ...you're not a drone. Fine. There's a dead signal-node deep in the Corporate Sector. Go ping it so I can trace what the old AI left behind.",
    mid: "<b>Patch:</b> Node first, rooftop relay second. If a billboard starts complimenting your whiskers, ignore it.",
    done: "<b>Patch:</b> The node woke up. The AI's still down there, scattered, dreaming. ...Thanks, cat. Jin at the docks has been asking for you.",
    reward: 100, xp: 110 },
  { id: "sq_jin", giver: "Jin", color: 0xff2bd6, gate: 3, unlocks: null,
    npc: { x: 130, z: 30 }, errand: { x: 165, z: -55, r: 6 },
    steps: [
      { label: "listen under the tallest mast", x: 165, z: -55, r: 6 },
      { label: "follow the echo to Line 9", x: 178, z: 70, r: 6 },
      { label: "return the signal to the dock board", x: 163, z: 26, r: 5 },
    ],
    offer: "<b>Jin:</b> My uncle drove the last Line 9 train. They never found him. The antenna farm at the dock's edge still broadcasts his signal. Go listen for me?",
    mid: "<b>Jin:</b> The signal moves. Mast, platform, courier board. The old line likes rituals.",
    done: "<b>Jin:</b> ...it's his old call sign, on a loop. He's still out there, somewhere in the wires. The trains aren't haunted, cat. They're loyal. Thank you.",
    reward: 150, xp: 160 },
];

export const CITY_NPCS = [
  { id: "n_rina", name: "Rina", color: 0xff9fd8, x: -84, z: 18, topic: "Noodle Cart Regular",
    line: "<b>Rina:</b> Tiny legend! Mei says you can smell a good delivery route before the board prints it. Take this snack money and prove her right." },
  { id: "n_bolt", name: "Bolt", color: 0x00f0ff, x: 56, z: 42, topic: "Courier Mechanic",
    line: "<b>Bolt:</b> If the ziplines sing under your paws, they're tuned. If they scream, bail early. Professional advice, free of charge." },
  { id: "n_mara", name: "Mara", color: 0xaaff00, x: -154, z: -72, topic: "Alley Gardener",
    line: "<b>Mara:</b> The city looks empty until you learn where people hide from the rain. Look under awnings. Look up. Always look up." },
  { id: "n_omo", name: "Omo-7", color: 0xffb347, x: 111, z: -26, topic: "Office Bot",
    line: "<b>Omo-7:</b> Productivity report: petting one cyber-cat improved morale by 38 percent. Please remain adorable for quarterly review." },
  { id: "n_lux", name: "Lux", color: 0x7b61ff, x: 168, z: 44, topic: "Signal Diver",
    line: "<b>Lux:</b> The docks are full of voices pretending to be weather. If one says your name, be polite. It might be lonely." },
  { id: "n_sable", name: "Sable", color: 0xff5a3c, x: 24, z: -38, topic: "Plaza Watcher",
    line: "<b>Sable:</b> The shrine glows brighter whenever a kitten comes home. The city notices kindness. It keeps receipts." },
  { id: "n_pix", name: "Pix", color: 0x5ce8ff, x: -42, z: 74, topic: "Billboard Painter",
    line: "<b>Pix:</b> I paint arrows for cats and warnings for humans. The cats understand both. Humans mostly photograph them." },
  { id: "n_grit", name: "Grit", color: 0xd6ff7b, x: 132, z: 112, topic: "Rooftop Runner",
    line: "<b>Grit:</b> You want the city to open up? Chain a dash, a ring, a zipline, and a clean landing. The roofs respect style." },
];

// ---------- hidden discovery spots: reward exploration & climbing ----------
// Silent trigger zones in out-of-the-way corners. First entry = lore + credits.
// minY forces a climb to reach the rooftop ones.
export const DISCOVERIES = [
  { id: "d_alley",  x: -185, z: -150, r: 5, name: "Forgotten Mural", reward: 40,
    lore: "A calico cat with one glowing eye, painted across nine transformer boxes. Same cat, every district. Who is PawPaw?" },
  { id: "d_garden", x: -118, z: 118, r: 5, name: "Secret Roof Garden", reward: 50, minY: 4,
    lore: "Impossible tomatoes on a forgotten rooftop. Someone still waters them. A warm patch of soil is shaped exactly like a sleeping cat." },
  { id: "d_arcade", x: -60, z: -150, r: 5, name: "Drowned Arcade", reward: 45,
    lore: "One cabinet still boots in the flooded backroom. The high score is a paw-print. It has never been beaten." },
  { id: "d_spire",  x: 102, z: -102, r: 7, name: "Apex Service Nook", reward: 90, minY: 38,
    lore: "A maintenance hatch above the cloudline. The whole city glitters below like circuitry. Locals say the highest antenna grants a wish." },
  { id: "d_dock",   x: 178, z: 70, r: 5, name: "Heartbeat Relay", reward: 60,
    lore: "The mast pulses at 72 beats per minute — a human heart's pace. The city is alive, and now you can prove it." },
  { id: "d_corp",   x: 120, z: -130, r: 5, name: "Corporate Atrium Cat", reward: 45,
    lore: "Floor 40. A resident cat the memo said not to remove. Productivity rose 12%. This plaque does not officially exist." },
  { id: "d_tunnel", x: -150, z: 150, r: 5, name: "Line 9 Platform", reward: 55,
    lore: "The empty train still runs on schedule. Wait long enough and it passes, lights like stars, with no one driving. Almost no one." },
  { id: "d_market", x: -90, z: 60, r: 5, name: "Mei's Hidden Shelf", reward: 40,
    lore: "Behind the noodle stall: a tiny shrine of cat toys left by vendors over the years. The newest one is still warm." },
];

// ---------- mission chain: always one active, always points somewhere ----------
// type drives both the completion trigger and the M-map / compass waypoint.
//   goto:    reach the target location
//   collect: gather N kibble anywhere
//   rings:   pass through N neon rings
//   rescue:  carry any kitten to the shrine
//   deliver: complete N courier jobs
//   cache:   crack open a hidden cache
//   zip:     ride N ziplines
//   wisp:    catch N data wisps
//   scan:    scan N lore posters
//   shrine:  raise the shrine to level N (rescue that many kittens total)
export const MISSIONS = [
  { id: "m1",  type: "goto",    need: 1,  title: "First Steps", desc: "Pad over to the glowing Paw Shrine.", target: { x: 20, z: 14 }, reward: 25, xp: 30 },
  { id: "m2",  type: "collect", need: 8,  title: "Hungry Paws", desc: "Crunch 8 holo-kibble off the streets.", reward: 30, xp: 40 },
  { id: "m3",  type: "goto",    need: 1,  title: "Meet Mei", desc: "Visit Mei's upgrade stall in the Neon Market.", target: { x: -60, z: 10 }, reward: 30, xp: 40 },
  { id: "m4",  type: "rings",   need: 3,  title: "Light Footed", desc: "Leap through 3 neon rings.", reward: 35, xp: 45 },
  { id: "m5",  type: "rescue",  need: 1,  title: "Found Family", desc: "Carry a lost kitten home to the shrine.", reward: 50, xp: 60 },
  { id: "m6",  type: "deliver", need: 2,  title: "On the Clock", desc: "Run 2 courier deliveries.", reward: 55, xp: 60 },
  { id: "m7",  type: "goto",    need: 1,  title: "Top of the World", desc: "Climb to the Apex Spire rooftop.", target: { x: 102, z: -102 }, reward: 60, xp: 70 },
  { id: "m8",  type: "cache",   need: 1,  title: "City Secrets", desc: "Crack open a hidden violet cache.", reward: 75, xp: 80 },
  { id: "m9",  type: "zip",     need: 2,  title: "Wire Walker", desc: "Ride 2 rooftop ziplines.", reward: 50, xp: 60 },
  { id: "m10", type: "scan",    need: 2,  title: "Street Stories", desc: "Scan 2 glowing lore posters.", reward: 40, xp: 50 },
  { id: "m11", type: "goto",    need: 1,  title: "Signal's Edge", desc: "Reach the antenna farm at Old Signal Docks.", target: { x: 165, z: -20 }, reward: 60, xp: 70 },
  { id: "m12", type: "shrine",  need: 4,  title: "Den Mother", desc: "Bring the shrine to level 4 (rescue 4 kittens).", reward: 120, xp: 140 },
  { id: "m13", type: "npc",     need: 3,  title: "Neighbor Network", desc: "Talk to 3 named neighbors around the city.", reward: 70, xp: 80 },
  { id: "m14", type: "discover", need: 2, title: "Backstreet Truths", desc: "Find 2 hidden discoveries.", reward: 85, xp: 100 },
  { id: "m15", type: "combo",   need: 8,  title: "Flow Training", desc: "Build a FLOW combo of x8 or higher.", reward: 75, xp: 90 },
  { id: "m16", type: "level",   need: 3,  title: "Street Reputation", desc: "Reach paw level 3.", reward: 90, xp: 80 },
  { id: "m17", type: "scan",    need: 4,  title: "Poster Run", desc: "Scan 4 glowing lore posters.", reward: 70, xp: 80 },
  { id: "m18", type: "wisp",    need: 4,  title: "Catch the Static", desc: "Catch 4 data wisps.", reward: 95, xp: 100 },
  { id: "m19", type: "deliver", need: 4,  title: "Trusted Paws", desc: "Complete 4 courier deliveries.", reward: 110, xp: 110 },
  { id: "m20", type: "shrine",  need: 8,  title: "All Kittens Home", desc: "Rescue all 8 lost kittens.", reward: 180, xp: 180 },
  // endless tail: repeatable, escalating
  { id: "mE",  type: "deliver", need: 3,  title: "City Courier", desc: "Keep the city running — deliver 3 more packages.", reward: 90, xp: 90, repeat: true },
];

// courier job destinations — named landmarks across the districts
export const COURIER_DESTS = [
  { name: "the Paw Shrine", x: 20, z: 14 },
  { name: "Mei's stall", x: -60, z: 10 },
  { name: "the plaza fountain", x: 36, z: 36 },
  { name: "the Static Quartet corner", x: -64, z: 4 },
  { name: "the apex spire", x: 102, z: -102 },
  { name: "the antenna farm", x: 165, z: -20 },
  { name: "the drowned arcade door", x: -172, z: -74 },
  { name: "Noodle Row", x: -92, z: 4 },
  { name: "the CLIMB-ME tower", x: 49.5, z: 22 },
];

export const state = {
  started: false,
  paused: true,
  modal: null,                 // "lore" | "journal" | "shop" | null
  counts: { food: 0, chip: 0, mem: 0, credits: 0 },
  abilities: { dash: false, djump: false },
  upgrades: {},
  collar: 0xe8442e,            // warm red collar (gold bell) — matches PawPaw's ref art
  collected: {},               // collectible uid -> true
  kittens: {},                 // kitten id -> "carried" | "rescued"
  shrineLevel: 0,
  ach: {},
  flags: {},
  stats: { credEarned: 0, wisps: 0, dist: 0, jobs: 0, maxCombo: 0 },
  buffT: 0,
  xp: 0, level: 1,
  courierStreak: 0,
  activeJob: null,
  objectives: [],              // [{ type, label, need, have, reward }]
  missionIdx: 0,               // index into MISSIONS
  missionProg: 0,              // progress toward current mission
  sideQuests: {},              // quest id -> "active" | "found" | "done"
  sideQuestSteps: {},           // quest id -> current errand index
  cityNpcs: {},                 // city NPC id -> talked at least once
  discoveries: {},             // discovery id -> true
};

export const keys = {};
