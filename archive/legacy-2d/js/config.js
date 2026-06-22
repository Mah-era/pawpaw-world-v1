// ============ PAWPAW WORLD — CONFIG & SHARED STATE ============
"use strict";

const G = {}; // global game namespace

G.CFG = {
  WORLD_W: 12800,
  WORLD_H: 3700,
  STREET_Y: 2800,      // top of street surface
  UNDER_Y: 3460,       // underground tunnel floor
  GRAVITY: 2300,
  WALK: 190,
  RUN: 330,
  SPRINT: 480,
  JUMP_V: -760,
  WALL_SLIDE: 130,
  WALL_JUMP_X: 430,
  CLIMB: 170,
  DASH_V: 980,
  DASH_T: 0.16,
  DASH_CD: 1.1,
  SLIDE_T: 0.45,
  COYOTE: 0.12,
  JUMP_BUFFER: 0.14,
  DAY_LENGTH: 360,     // seconds for full day/night cycle
  CAM_LERP: 5.5,
};

// Ability unlock thresholds (holographic cat food)
G.UNLOCKS = { dash: 10, djump: 25, wallrun: 45 };

G.TOTALS = {
  food: 140, chip: 18, mem: 10, art: 5, leg: 2, key: 2,
  photos: 9, kittens: 8, terminals: 4, races: 3, quests: 3, npcHelp: 6,
  secrets: 6, mysteries: 5, shrine: 5, miniGames: 12, hiddenRewards: 12,
};

// ---------- seeded RNG so the city is identical every visit ----------
G.makeRng = function (seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

// ---------- zone definitions ----------
G.ZONES = {
  alleys:    { name: "BACK ALLEY NETWORK", color: "#7b61ff", music: "dark" },
  market:    { name: "NEON MARKET",        color: "#ff2bd6", music: "busy" },
  plaza:     { name: "TRANSIT PLAZA",      color: "#00f0ff", music: "busy" },
  corporate: { name: "CORPORATE SECTOR",   color: "#4dd2ff", music: "clean" },
  docks:     { name: "OLD SIGNAL DOCKS",   color: "#ffb347", music: "dark" },
  rooftops:  { name: "ROOFTOP LAYER",      color: "#aaff00", music: "calm" },
  under:     { name: "UNDERGROUND",        color: "#ff6a00", music: "deep" },
};

G.zoneAt = function (x, y) {
  if (y > G.CFG.STREET_Y + 90) return "under";
  if (y < 1500) return "rooftops";
  if (x < 2600) return "alleys";
  if (x < 6200) return "market";
  if (x < 7400) return "plaza";
  if (x < 10600) return "corporate";
  return "docks";
};

// ---------- lore: data chips ----------
G.CHIP_LORE = [
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

// ---------- lore: lost memories ----------
G.MEMORY_LORE = [
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

// ---------- artifacts & legendaries ----------
G.ARTIFACT_LORE = [
  ["PRE-COLLAPSE COFFEE MUG", "Ceramic. Unbroken. Reads 'WORLD'S OKAYEST ENGINEER'. Carbon dating: 2041. Priceless."],
  ["ORIGINAL NEON TUBE", "Hand-bent glass from the first market sign. Still glows faintly without power. Physicists are upset about this."],
  ["DRONE D-227'S CAMERA", "Decommissioned with honors. The memory card contains 41,000 photographs of cats. All in focus."],
  ["THE DRIVER'S CAP", "Found in the cab of Line 9's last train. The trains still run on schedule. The cap was left like an answer."],
  ["AI CORE FRAGMENT", "A shard of the old city AI. Warm to the touch. If you hold it near a speaker, it hums a lullaby in machine code."],
];
G.LEGENDARY_LORE = [
  ["THE FIRST COLLAR", "The prototype cyber-collar, serial 001. Whoever wore it first mapped every rooftop in the district. The map is etched inside, microscopic. It matches your routes exactly."],
  ["HEART OF THE CITY", "A crystallized data-bloom from the very center of the old AI. It pulses at 72 beats per minute. A human heart's pace. The city is alive, and now you can prove it."],
];

// ---------- guide (ORB-E) lines ----------
G.GUIDE = {
  intro: "Hey! I'm <b>ORB-E</b>, your nav-companion. This city is yours, PawPaw. Wander anywhere — press <b>M</b> for the city map or <b>J</b> for quests, completion, skills, cosmetics, shrine, and records.",
  shopTip: "That's a <b>vendor</b>! Spend credits on permanent upgrades — gliding, magnet paws, faster sprints. Earn credits from <b>everything</b>: combos, jobs, races, wisps.",
  boardTip: "A <b>courier board</b>! Take timed delivery jobs — each one you complete back-to-back raises the pay. Break the streak and it resets. How long can you run?",
  kittenTip: "A lost <b>kitten</b>! Scoop it up with <b>E</b> and carry it to the <b>Paw Shrine</b> on the market rooftops. The city pays well for found family.",
  wispTip: "A <b>data wisp</b>! A fragment of the scattered AI. Chase it down and pounce before it dissipates — it drops credits and feeds your flow combo.",
  flowTip: "Nice moves! Chaining tricks — wall jumps, ziplines, dashes, big air — builds your <b>FLOW combo</b>. The longer the chain, the bigger the credit payout when it ends.",
  questTip: "See the gold <b>!</b> markers? Citizens with stories. Three of them have quests that pay well and go somewhere strange.",
  firstFood: "That's <b>holo-kibble</b>! Collect it to unlock new moves. <b>10</b> unlocks the Teleport Dash.",
  dashUnlock: "Teleport Dash online! Press <b>X</b> in any direction to blink forward. Cooldown ~1s.",
  djumpUnlock: "<b>Double Jump</b> online! Your paw thrusters now fire mid-air. The rooftops just got closer.",
  wallUnlock: "<b>Wall Run</b> online! Hold toward a wall while airborne to run up it briefly, jump to kick away.",
  firstChip: "A <b>data chip</b>! Fragments of the city's story. I'll archive everything you find.",
  firstZip: "That cable is a <b>zipline</b> — jump onto it to ride. Press jump to let go.",
  firstTp: "A <b>transit node</b>! Activate nodes to fast-travel between them. Explorers love these.",
  rooftop: "The Rooftop Layer. Quiet up here, isn't it? Locals say the highest antenna grants a wish. Locals say a lot of things.",
  under: "The Underground. Watch for the old Line 9 tunnel — and listen. Sometimes the trains still sing.",
  rain: "Heavy rain inbound. The neon doubles itself in the puddles. Photographers call this 'free money'.",
  photo: "Press <b>P</b> for photo mode any time. There are landmarks worth shooting — I'll mark them when you're close.",
  race: "A <b>parkour challenge</b>! Pass the rings before the timer dies. Your saved ghost appears on reruns so you can chase your best line.",
  hack: "A hackable terminal. Trace the signal sequence to breach it. Secrets love locked doors.",
  delivery: "A courier job! Grab the package, find the recipient. The city rewards reliable paws.",
};

// ---------- shop catalog ----------
G.SHOP = [
  { id: "snack",  name: "Synth-Tuna Snack",  desc: "+25% speed for 90 seconds", cost: 15, consumable: true },
  { id: "turbo",  name: "Turbo Paws",        desc: "Sprint +12% — permanent", cost: 150 },
  { id: "coil",   name: "Coil Muscles",      desc: "Jump +8% — permanent", cost: 150 },
  { id: "phase",  name: "Phase Capacitor",   desc: "Dash cooldown −40%", cost: 200 },
  { id: "glide",  name: "Cloud Pads",        desc: "Hold JUMP while falling to glide", cost: 250 },
  { id: "magnet", name: "Kibble Magnet",     desc: "Pulls in nearby kibble", cost: 180 },
  { id: "sniffer",name: "Lore Sniffer",      desc: "Pings when hidden lore is near", cost: 220 },
  { id: "trail",  name: "Neon Trail",        desc: "Cosmetic sprint trail", cost: 120 },
  { id: "collar0",name: "Collar: Cyan",      desc: "Style", cost: 60, collar: "#00f0ff" },
  { id: "collar1",name: "Collar: Lime",      desc: "Style", cost: 60, collar: "#aaff00" },
  { id: "collar2",name: "Collar: Amber",     desc: "Style", cost: 60, collar: "#ffb347" },
  { id: "trailPink", name: "Trail: Hot Pink", desc: "Cosmetic neon trail color", cost: 90, styleKey: "trailColor", styleVal: "#ff2bd6" },
  { id: "trailGold", name: "Trail: Gold", desc: "Cosmetic neon trail color", cost: 110, styleKey: "trailColor", styleVal: "#ffe14d" },
  { id: "pawsteps", name: "Pawstep Particles", desc: "Tiny glowing pawprints while sprinting", cost: 140, styleKey: "pawsteps", styleVal: true },
  { id: "sparkle", name: "Jump Sparkle", desc: "Spark burst on strong jumps", cost: 130, styleKey: "sparkle", styleVal: true },
  { id: "afterimage", name: "Dash Afterimage", desc: "Longer dash echo effect", cost: 160, styleKey: "afterimage", styleVal: true },
  { id: "shadowSkin", name: "Rooftop Shadow Skin", desc: "Rare PawPaw skin variant", cost: 240, styleKey: "skin", styleVal: "shadow" },
  { id: "sunsetSkin", name: "Sunset Calico Skin", desc: "Rare PawPaw skin variant", cost: 220, styleKey: "skin", styleVal: "sunset" },
  { id: "econCourier", name: "Courier Ledger", desc: "+20% courier board credits", cost: 180, econ: true },
  { id: "econFlow", name: "Flow Cashback", desc: "+25% credits from flow combo payouts", cost: 170, econ: true },
  { id: "econRace", name: "Medal Sponsor", desc: "Better race medal rewards", cost: 200, econ: true },
  { id: "discount", name: "Vendor Friend", desc: "15% vendor discount after purchase", cost: 210, econ: true },
  { id: "cacheBoost", name: "Mystery Cache Tuner", desc: "Better supply capsule rewards", cost: 190, econ: true },
  { id: "eventPay", name: "City Event Broker", desc: "Higher payout from random city events", cost: 190, econ: true },
  { id: "setBonus", name: "Collection Appraiser", desc: "Bonus rewards for completed collectible sets", cost: 160, econ: true },
  { id: "hintPulse", name: "Collectible Hint Pulse", desc: "Occasionally pings secret rooms and lore", cost: 230 },
  { id: "photoFilter", name: "Photo Filter: Neon Rain", desc: "Unlocks a photo mode filter", cost: 90, styleKey: "filter", styleVal: "neon-rain" },
  { id: "shrineLanterns", name: "Shrine Lantern Set", desc: "Decoration item for Paw Shrine", cost: 120, shrineDecor: "lanterns" },
  { id: "shrineGarden", name: "Shrine Garden Theme", desc: "Decoration theme for the rebuilt shrine", cost: 180, shrineDecor: "garden" },
];

G.SKILLS = [
  { id: "move_air", branch: "Movement", name: "Soft Landing", desc: "Keep flow alive longer after big jumps.", cost: 1 },
  { id: "move_dash", branch: "Movement", name: "Dash Memory", desc: "Dash gives extra flow and sparkle.", cost: 2 },
  { id: "explore_ping", branch: "Exploration", name: "Secret Whiskers", desc: "Secret-room hint pings become stronger.", cost: 1 },
  { id: "explore_xp", branch: "Exploration", name: "Curious Paws", desc: "+20% XP from discoveries and secrets.", cost: 2 },
  { id: "econ_courier", branch: "Economy", name: "Courier Bonus", desc: "+20% courier payouts.", cost: 1 },
  { id: "econ_flow", branch: "Economy", name: "Flow Broker", desc: "+25% flow payout credits.", cost: 1 },
  { id: "econ_vendor", branch: "Economy", name: "Vendor Discount", desc: "Street vendors charge less.", cost: 2 },
  { id: "econ_streak", branch: "Economy", name: "Streak Cushion", desc: "First missed courier timer protects the streak.", cost: 2 },
  { id: "style_paw", branch: "Style", name: "Pawstep Glow", desc: "Unlock glowing pawstep particles.", cost: 1, styleKey: "pawsteps", styleVal: true },
  { id: "style_jump", branch: "Style", name: "Jump Sparkle", desc: "Unlock jump sparkle effects.", cost: 1, styleKey: "sparkle", styleVal: true },
  { id: "style_dash", branch: "Style", name: "Dash Afterimage", desc: "Unlock dash afterimage effects.", cost: 2, styleKey: "afterimage", styleVal: true },
  { id: "style_shadow", branch: "Style", name: "Rooftop Shadow", desc: "Unlock the rare rooftop skin.", cost: 3, styleKey: "skin", styleVal: "shadow" },
];

G.SECRET_ROOMS = [
  { id: "forgotten", name: "Forgotten Room", x: 1010, y: 2730, r: 120, reward: "collar violet", lore: "Graffiti clue: Line 9 remembers every closed door.", cosmetic: "secretViolet", key: "alley" },
  { id: "den", name: "Hacker Den Cache", x: 5380, y: 3380, r: 155, reward: "data badge", lore: "Patch's old cache still listens for small paws.", terminal: "den", mini: "signal safe" },
  { id: "spire", name: "Apex Service Nook", x: 8365, y: 240, r: 110, reward: "sky badge", lore: "A maintenance hatch opens only above the cloudline." },
  { id: "mast", name: "Heartbeat Relay", x: 12330, y: 1210, r: 120, reward: "shrine piece", lore: "The mast pulses in the same rhythm as the AI core.", key: "docks" },
  { id: "arcade", name: "Drowned Arcade Backroom", x: 2200, y: 3400, r: 150, reward: "lost token", lore: "The last cabinet keeps a score nobody can erase.", mini: "arcade decode" },
  { id: "garden", name: "Garden Root Cellar", x: 5680, y: 1180, r: 120, reward: "living lantern", lore: "Vega hid seedlings where the rain cannot forget them.", cosmetic: "livingLantern" },
];

G.MYSTERIES = [
  { id: "line9", name: "What happened to Line 9?", need: () => G.state.quests.line9 === 99 || G.state.discovered.line9 },
  { id: "ghosttrain", name: "Why the ghost train appears", need: () => G.state.quests.line9 === 99 },
  { id: "ai", name: "What the scattered AI really is", need: () => G.state.quests.grid === 99 },
  { id: "pawpaw", name: "Why PawPaw links to city systems", need: () => G.state.counts.leg >= 1 },
  { id: "shrine", name: "What the Paw Shrine connects to", need: () => (G.state.shrine.level || 0) >= 4 },
];

G.NPC_ERRANDS = [
  { id: "missing_item", giver: "Solder", name: "MISSING SPANNER", type: "reach", x: 4960, y: 3460, r: 130, reward: 45,
    offer: "Solder dropped a magnet spanner near the underground junction.", done: "Solder remembers. The next terminal hums a little warmer for you." },
  { id: "lost_robot", giver: "Ms. Vance", name: "LOST OFFICE BOT", type: "guide", x: 9000, y: 2800, r: 150, reward: 55,
    offer: "A tiny office bot is circling Transit Plaza. Stand near Corporate Atrium to guide it home.", done: "Ms. Vance logs PawPaw as an approved consultant." },
  { id: "neon_repair", giver: "Patch", name: "NEON SIGN REPAIR", type: "terminal", terminal: "billboard", reward: 50,
    offer: "Patch wants one more neon panel restored above Noodle Row.", done: "Patch tags the billboard with a tiny glowing paw." },
  { id: "food_delivery", giver: "Vega", name: "ROOFTOP SNACK", type: "food", n: 35, reward: 45,
    offer: "Vega needs enough holo-kibble to lure shy rooftop seedlings out.", done: "Vega sets aside a shrine sprout for PawPaw." },
  { id: "memory_chip", giver: "Greasy Jin", name: "MEMORY CHIP SEARCH", type: "chip", n: 6, reward: 55,
    offer: "Jin needs recovered city chips to compare against old Line 9 logs.", done: "Jin recognizes the timestamp and goes very quiet." },
  { id: "landmark_photo", giver: "Static Quartet", name: "LANDMARK ALBUM", type: "photo", n: 3, reward: 60,
    offer: "The Quartet needs three landmark shots for tonight's projection set.", done: "The Quartet adds PawPaw's silhouette to the chorus." },
];

// ---------- quest chains ----------
G.QUESTS = [
  { id: "grid", giver: "Patch", at: [5320, 3460], name: "GHOST IN THE GRID", reward: 120,
    steps: [
      { type: "reach", x: 2200, y: 3400, r: 170, text: "Find the Drowned Arcade — one cabinet is still alive." },
      { type: "hack", id: "billboard", text: "Restore the mega-billboard above Noodle Row. Give it a bigger screen." },
      { type: "return", text: "Return to Patch in the hacker den." }],
    offer: "Patch: That dead arcade in the west tunnel? One cabinet still boots. The old city AI is squatting in it. Go see for yourself — then we'll give the poor thing a bigger screen.",
    done: "Patch: The billboard's singing in machine code. You just gave a homeless god a cathedral, cat. Credits. Take them." },
  { id: "green", giver: "Vega", at: [5790, 1200], name: "GREEN THUMBS", reward: 120,
    steps: [
      { type: "reach", x: 3320, y: 1470, r: 120, text: "Visit the Paw Shrine. Vega swears the offerings sprout overnight." },
      { type: "seed", x: 12000, y: 2800, text: "Collect the seed crate waiting at the Old Signal Docks." },
      { type: "return", text: "Bring the seeds back to Vega at the Rooftop Garden." }],
    offer: "Vega: Tomatoes need friends. There's a real seed crate at the docks — pre-Collapse stock — and a shrine that grows miracles. Check both for me?",
    done: "Vega: REAL seeds! The roof will be a jungle by spring. You're getting the first tomato, cat. No arguments." },
  { id: "line9", giver: "Greasy Jin", at: [1360, 2800], name: "THE LAST DRIVER", reward: 150,
    steps: [
      { type: "reach", x: 6950, y: 3400, r: 190, text: "Go down to the Line 9 platform." },
      { type: "witness", text: "Wait on the platform for the empty train. Watch it pass. Listen." },
      { type: "collect", loreIdx: 3, text: "Find the Driver's Cap. Rumor says it rests where the last zipline ends, on a docks rooftop." },
      { type: "return", text: "Tell Jin what you found." }],
    offer: "Jin: My uncle drove Line 9. They never found him after the Collapse — but his trains still run on time, empty, every night. Find out why. Please.",
    done: "Jin: His cap. After all these years... The trains aren't haunted, cat. They're loyal. That's different. Thank you." },
];

// ---------- achievements ----------
G.ACH = [
  ["kib1", "First Taste", "Collect your first holo-kibble"],
  ["kib50", "Kibble Hoarder", "Collect 50 holo-kibble"],
  ["kib140", "Vacuum Paws", "Collect 140 holo-kibble"],
  ["chips", "Archivist", "Recover all 18 data chips"],
  ["mems", "Total Recall", "Recover all 10 lost memories"],
  ["arts", "Relic Hunter", "Find all 5 rare artifacts"],
  ["legs", "Mythkeeper", "Claim both legendary collectibles"],
  ["lands", "Cartographer", "Discover all 14 landmarks"],
  ["tps", "Node Walker", "Activate all 8 transit nodes"],
  ["photos", "Shutter Cat", "Archive all 5 photo targets"],
  ["race1g", "Gold Whiskers", "Earn a gold medal in any race"],
  ["race3g", "Podium Sweep", "Gold in all three races"],
  ["jobs10", "Reliable Paws", "Complete 10 courier board jobs"],
  ["combo10", "Flow State", "Hit a x10 flow combo"],
  ["combo25", "Liquid Motion", "Hit a x25 flow combo"],
  ["zip25", "Line Rider", "Ride 25 ziplines"],
  ["wall50", "Off The Walls", "Perform 50 wall jumps"],
  ["dist10", "Marathon Cat", "Travel 10 km on foot"],
  ["cred1k", "Kilonaire", "Earn 1,000 lifetime credits"],
  ["shop1", "Retail Therapy", "Buy something from a vendor"],
  ["chromed", "Fully Chromed", "Own every permanent upgrade"],
  ["kit8", "Den Mother", "Rescue all 8 lost kittens"],
  ["wisp5", "Bug Catcher", "Catch 5 data wisps"],
  ["quests", "City Historian", "Finish all three story arcs"],
  ["nap", "Rooftop Nap", "Fall asleep on a rooftop"],
];

// ---------- kittens ----------
G.KITTENS = [
  { id: "k1", name: "Miso", trait: "brave but dramatic", x: 425, y: 2715, c: "#e8893a" },
  { id: "k2", name: "Null", trait: "quiet and clever", x: 1210, y: 2035, c: "#26222b" },
  { id: "k3", name: "Pebble", trait: "sleepy and trusting", x: 2620, y: 3445, c: "#bfb6a8" },
  { id: "k4", name: "Saffron", trait: "tiny rooftop climber", x: 4480, y: 1335, c: "#e8893a" },
  { id: "k5", name: "Mica", trait: "follows every sound", x: 6660, y: 2285, c: "#8a8f9e" },
  { id: "k6", name: "Byte", trait: "chews cables", x: 8790, y: 985, c: "#26222b" },
  { id: "k7", name: "Taro", trait: "polite and hungry", x: 10110, y: 1085, c: "#d9c9a0" },
  { id: "k8", name: "Lantern", trait: "glows near rain", x: 11960, y: 2725, c: "#e8893a" },
];

// ---------- courier board spots ----------
G.BOARD_SPOTS = [
  ["Noodle Row", 4200, 2800], ["Old Court", 1310, 2800], ["Transit Plaza", 6950, 2800],
  ["Corporate Atrium", 9000, 2800], ["Docks Gate", 11650, 2800], ["Rooftop Garden", 5760, 1200],
  ["Underground Junction", 4950, 3460], ["Station Roof", 6950, 2300],
  ["Drowned Arcade", 2200, 3460], ["Observation Deck", 9690, 700],
];

// ---------- live shared state ----------
G.state = {
  started: false,
  paused: false,
  modal: null,        // "dialog" | "hack" | "teleport" | "map" | "journal" | "shop" | null
  photoMode: false,
  discovered: {},     // landmark id -> true
  tpUnlocked: {},     // teleport id -> true
  flags: {},          // one-time guide triggers etc.
  counts: { food: 0, chip: 0, mem: 0, art: 0, leg: 0, key: 0, photos: 0, credits: 0, shrine: 0, badges: 0 },
  abilities: { dash: false, djump: false, wallrun: false },
  upgrades: {},       // shop upgrade id -> true
  style: { collar: "#ff2bd6", trail: false, trailColor: "#00f0ff", pawsteps: false, sparkle: false, afterimage: false, skin: "calico", filter: "" },
  stats: { dist: 0, jumps: 0, walljumps: 0, dashes: 0, zips: 0, maxCombo: 0, credEarned: 0, jobs: 0, wisps: 0, raceRuns: 0, golds: 0, perfectJobs: 0 },
  ach: {},            // achievement id -> true
  quests: {},         // quest id -> step index (undefined = not offered, 99 = done)
  kittens: {},        // kitten id -> rescued
  boardStreak: 0,
  courierShield: false,
  secrets: {},
  mysteries: {},
  hiddenRewards: {},
  miniGames: {},
  npcHelp: {},
  setRewards: {},
  cosmetics: {},
  shrine: { level: 0, decor: {} },
  skills: {},
  skillPoints: 0,
  buffT: 0,           // snack speed buff seconds remaining
  xp: 0, level: 1,    // paw level
  completionPct: 0,
};

G.keys = {};
G.cam = { x: 3000, y: 2300, shake: 0 };
