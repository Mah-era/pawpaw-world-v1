// ============ PAWPAW WORLD — ACTIVITIES, COLLECTIBLES, PROGRESSION ============
"use strict";

G.items = []; G.terminals = []; G.deliveries = []; G.photoTargets = [];
G.races = { list: [], active: null };
G.interact = null;

G.initActivities = function () {
  const SY = G.CFG.STREET_Y, UY = G.CFG.UNDER_Y, rng = G.makeRng(2024);
  const I = (type, x, y, lore) => G.items.push({ id: type + G.items.length, type, x, y, lore, taken: false, ph: rng() * 7 });

  // ---------- holographic cat food (generated along traversal routes) ----------
  for (const b of G.world.buildings) {
    if (b.station) continue;
    const n = 3;
    for (let i = 0; i < n; i++) I("food", b.x + b.w * (0.2 + 0.3 * i), b.y - 26);
  }
  for (const o of G.world.oneways) {
    if ((o.type === "escape" || o.type === "washer") && rng() < 0.5) I("food", o.x + o.w / 2, o.y - 22);
  }
  for (const w of G.world.wires) for (let i = 1; i <= 3; i++)
    I("food", w.x1 + (w.x2 - w.x1) * i / 4, w.y - 22);
  for (let x = 600; x < 12400; x += 420) if (rng() < 0.8) I("food", x, UY - 36);
  [3160, 3680, 4280, 4810, 5390, 5915, 1310, 6950, 9000, 11650].forEach(x => I("food", x + 40, SY - 40));
  for (const z of G.world.ziplines) I("food", (z.x1 + z.x2) / 2, (z.y1 + z.y2) / 2 + 26);

  // ---------- data chips ----------
  const chips = [[200, 1870], [985, 2745], [1490, 1270], [2350, 1420], [3165, 2640], [3450, 1470],
    [4000, 1970], [4575, 1320], [5100, 1720], [5560, 1170], [6230, 1870], [6950, 2270],
    [7700, 770], [8360, 420], [9370, 1050], [10300, 1070], [11000, 2170], [7665, 3290]];
  chips.forEach((p, i) => I("chip", p[0], p[1], G.CHIP_LORE[i % G.CHIP_LORE.length]));

  // ---------- lost memories ----------
  const mems = [[5380, 3420], [5680, 1150], [6950, 3420], [2200, 3420], [12356, 1900],
    [160, 1870], [9690, 670], [7050, 2260], [3590, 1470], [10310, 2760]];
  mems.forEach((p, i) => I("mem", p[0], p[1], G.MEMORY_LORE[i]));

  // ---------- rare artifacts ----------
  const arts = [[5480, 3420], [5840, 1170], [2080, 3420], [12100, 2270], [3320, 1460]];
  arts.forEach((p, i) => I("art", p[0], p[1], G.ARTIFACT_LORE[i]));

  // ---------- legendary ----------
  I("leg", 8365, 200, G.LEGENDARY_LORE[0]);  // apex antenna tip
  I("leg", 12330, 1170, G.LEGENDARY_LORE[1]); // heartbeat mast top
  I("key", 720, 2690, ["SPECIAL KEY // ALLEY", "A brass data-key painted into a graffiti clue. It points toward a forgotten room."]);
  I("key", 11650, 2070, ["SPECIAL KEY // DOCKS", "A salt-worn relay key from the antenna farm. It unlocks a heartbeat service hatch."]);

  // ---------- hacking terminals ----------
  G.terminals.push(
    { id: "den", x: 5080, y: UY, label: "Breach sealed door", door: "den", hacked: false },
    { id: "room", x: 905, y: SY, label: "Breach sealed door", door: "room", hacked: false },
    { id: "billboard", x: 4500, y: 1350, label: "Restore mega-billboard", action: "billboard", hacked: false },
    { id: "corp", x: 9900, y: SY, label: "Override grav-lift", action: "beam", hacked: false },
  );

  // ---------- deliveries ----------
  G.deliveries.push(
    { id: "ramen", title: "HOT RAMEN RUN", pickup: { x: 4250, y: SY }, drop: { x: 5790, y: 1200 }, who: "Vega @ Rooftop Garden", reward: 40, state: 0 },
    { id: "data", title: "COLD DATA", pickup: { x: 4900, y: UY }, drop: { x: 9010, y: SY }, who: "Ms. Vance @ Corporate Atrium", reward: 60, state: 0 },
    { id: "parts", title: "SPARE PARTS", pickup: { x: 11700, y: SY }, drop: { x: 1360, y: SY }, who: "Greasy Jin @ Old Court", reward: 80, state: 0 },
  );

  // ---------- parkour races ----------
  G.races.list.push(
    { id: "market", name: "MARKET ROOFTOP RUN", start: { x: 2740, y: 1850 }, limit: 75, done: false,
      checks: [[3450, 1500], [4000, 1500], [4575, 1350], [5110, 1750], [5680, 1200]] },
    { id: "alley", name: "ALLEY SCRAMBLE", start: { x: 1310, y: SY }, limit: 65, done: false,
      checks: [[1390, 2430], [1330, 2090], [1500, 1300], [1800, 1800], [2370, 1450]] },
    { id: "corp", name: "CORPORATE DROP", start: { x: 10320, y: 1100 }, limit: 50, done: false,
      checks: [[10605, 1340], [11000, 2200], [11630, 2050], [12000, SY]] },
  );

  // ---------- photography missions ----------
  [
    ["THE APEX SPIRE", 8360, 600, 460], ["THE HEARTBEAT MAST", 12330, 1350, 460],
    ["ROOFTOP GARDEN", 5680, 1150, 320], ["NOODLE ROW", 4200, 2700, 320],
    ["LINE 9 PLATFORM", 6950, 3380, 320], ["GHOST TRAIN MOMENT", 6950, 3380, 520, "ghost"],
    ["KITTEN SHRINE FAMILY", 3320, 1480, 260, "kitten"], ["ROOFTOP JUMP", 5000, 1320, 99999, "jump"],
    ["NEON MARKET IN RAIN", 4200, 2700, 420, "rain"],
  ].forEach(t => G.photoTargets.push({ name: t[0], x: t[1], y: t[2], r: t[3], kind: t[4] || "place", got: false }));
};

// ---------- discovery percentage ----------
G.discoveryPct = function () {
  const s = G.state;
  const lm = Object.keys(s.discovered).length / G.world.landmarks.length * 40;
  const tp = Object.keys(s.tpUnlocked).length / G.world.teleports.length * 15;
  const lore = (s.counts.chip + s.counts.mem + s.counts.art + s.counts.leg) / 35 * 30;
  const ph = G.photoTargets.filter(t => t.got).length / G.photoTargets.length * 10;
  const fd = Math.min(1, s.counts.food / 140) * 5;
  return Math.min(100, Math.round(lm + tp + lore + ph + fd));
};

// ================= UPDATE =================
G.updateActivities = function (dt) {
  const p = G.player, s = G.state;

  // ----- kibble magnet upgrade -----
  if (s.upgrades.magnet) {
    for (const it of G.items) {
      if (it.taken || it.type !== "food") continue;
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
      if (d < 110 && d > 4) { it.x += dx / d * 340 * dt; it.y += dy / d * 340 * dt; }
    }
  }

  // ----- collectible pickups -----
  for (const it of G.items) {
    if (it.taken) continue;
    if (Math.abs(it.x - p.x) > 30 || Math.abs(it.y - p.y) > 34) continue;
    it.taken = true;
    if (it.type === "food") {
      s.counts.food++;
      if (G.gainXP) G.gainXP(4);
      if (G.flow) G.flow.feed();
      G.audio.ping(); if (G.fx) G.fx.burst(it.x, it.y, "#ffb347", 8);
      if (!s.flags.food) { s.flags.food = 1; G.ui.guide(G.GUIDE.firstFood); }
      checkUnlocks();
    } else {
      const key = { chip: "chip", mem: "mem", art: "art", leg: "leg", key: "key" }[it.type];
      s.counts[key]++;
      if (G.gainXP) G.gainXP(it.type === "key" ? 35 : 25);
      G.audio.chime();
      if (G.fx) G.fx.burst(it.x, it.y, { chip: "#00f0ff", mem: "#ff2bd6", art: "#aaff00", leg: "#ffffff", key: "#ffe14d" }[it.type], 16);
      if (it.lore) G.ui.dialog(it.lore[0], it.lore[1]);
      if (it.type === "chip" && !s.flags.chip) { s.flags.chip = 1; setTimeout(() => G.ui.guide(G.GUIDE.firstChip), 400); }
      if (it.type === "art" || it.type === "leg") G.awardMystery("rare-" + it.id, it.type === "leg" ? "legendary city badge" : "rare city badge", it.type === "leg");
      if (it.type === "key") G.awardMystery("key-" + it.id, "special key", false);
    }
    checkSetRewards();
    G.saveGame();
  }

  // ----- landmark discovery -----
  for (const lm of G.world.landmarks) {
    if (s.discovered[lm.id]) continue;
    if (Math.hypot(lm.x - p.x, lm.y - p.y) < lm.r) {
      s.discovered[lm.id] = true;
      G.ui.banner(lm.name); G.audio.chime();
      if (G.gainXP) G.gainXP(30);
      G.saveGame();
    }
  }

  // ----- teleport node proximity unlock -----
  for (const tp of G.world.teleports) {
    if (s.tpUnlocked[tp.id]) continue;
    if (Math.hypot(tp.x - p.x, tp.y - p.y) < 80) {
      s.tpUnlocked[tp.id] = true;
      G.ui.notify("◉ TRANSIT NODE ONLINE — " + tp.name, "gold");
      if (G.gainXP) G.gainXP(20);
      G.audio.chime();
      if (!s.flags.tp) { s.flags.tp = 1; G.ui.guide(G.GUIDE.firstTp); }
      G.saveGame();
    }
  }

  // ----- zone guide hints -----
  const zone = G.zoneAt(p.x, p.y);
  if (zone === "rooftops" && !s.flags.roof) { s.flags.roof = 1; G.ui.guide(G.GUIDE.rooftop); }
  if (zone === "under" && !s.flags.under) { s.flags.under = 1; G.ui.guide(G.GUIDE.under); }
  if (!s.flags.photoTip && s.playT > 75) { s.flags.photoTip = 1; G.ui.guide(G.GUIDE.photo); }
  s.playT = (s.playT || 0) + dt;

  // ----- beam lift physics -----
  for (const b of G.world.beams) {
    if (!b.on) continue;
    if (p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h) {
      p.vy = Math.max(p.vy - 4200 * dt, -540);
      p.canDjump = true;
      if (G.fx && Math.random() < 0.4) G.fx.spark(p.x, p.y + 14, 1);
    }
  }

  // ----- active race -----
  const R = G.races.active;
  if (R) {
    R.elapsed = (R.elapsed || 0) + dt;
    R.t -= dt;
    // ghost recording @10Hz
    R.recT -= dt;
    if (R.recT <= 0) { R.recT = 0.1; R.rec.push([Math.round(p.x), Math.round(p.y)]); }
    const c = R.race.checks[R.idx];
    if (c && Math.hypot(c[0] - p.x, c[1] - p.y) < 75) {
      R.idx++; G.audio.blip(700 + R.idx * 60);
      if (G.fx) G.fx.ring(c[0], c[1]);
      if (R.idx >= R.race.checks.length) finishRace(R);
    }
    if (R.t <= 0 && G.races.active && !R.overtime) {
      R.overtime = true;
      R.t = 0;
      G.ui.notify("RACE BONUS TIMER EXPIRED — finish for practice rewards", "pink");
    }
  }

  // ----- deliveries auto-complete at drop -----
  for (const d of G.deliveries) {
    if (d.state !== 1) continue;
    if (Math.hypot(d.drop.x - p.x, d.drop.y - p.y) < 75) {
      d.state = 2; G.earn(d.reward, "delivered to " + d.who);
      G.ui.notify("📦 DELIVERED — " + d.title, "gold");
      G.audio.chime(); G.ui.objective(null); G.saveGame();
    }
  }

  // ----- find nearest interactable -----
  G.interact = null;
  let best = 70;
  const consider = (x, y, type, obj, label) => {
    const dd = Math.hypot(x - p.x, y - p.y);
    if (dd < best) { best = dd; G.interact = { type, obj, label }; }
  };
  for (const tp of G.world.teleports) if (s.tpUnlocked[tp.id]) consider(tp.x, tp.y, "teleport", tp, "Fast travel");
  for (const t of G.terminals) consider(t.x, t.y, "terminal", t, t.hacked ? "Terminal (breached)" : "Hack terminal");
  for (const d of G.deliveries) if (d.state === 0) consider(d.pickup.x, d.pickup.y, "pickup", d, "Pick up: " + d.title);
  for (const r of G.races.list) if (!G.races.active) {
    const tag = r.medal ? " [" + G.MEDAL_NAMES[r.medal] + (r.best ? " " + r.best.toFixed(1) + "s" : "") + "]" : "";
    consider(r.start.x, r.start.y, "race", r, (r.done ? "Re-run: " : "Start race: ") + r.name + tag);
  }
  if (G.progressionInteracts) G.progressionInteracts(consider);
};

// medal: 0 none, 1 bronze (finish), 2 silver, 3 gold
G.raceMedalFor = function (race, elapsed) {
  if (elapsed <= race.limit * 0.55) return 3;
  if (elapsed <= race.limit * 0.72) return 2;
  return 1;
};
G.MEDAL_NAMES = ["—", "BRONZE", "SILVER", "GOLD"];

function finishRace(R) {
  const r = R.race, elapsed = R.elapsed || (r.limit - R.t);
  G.races.active = null;
  r.done = true;
  G.state.stats.raceRuns = (G.state.stats.raceRuns || 0) + 1;
  const medal = G.raceMedalFor(r, elapsed);
  const improvedTime = r.best == null || elapsed < r.best;
  if (improvedTime) { r.best = elapsed; r.ghost = R.rec; }
  const prevMedal = r.medal || 0;
  if (medal > prevMedal) {
    r.medal = medal;
    const sponsor = (G.state.upgrades.econRace ? 1.25 : 1);
    G.earn(Math.round([0, 30, 60, 120][medal] * sponsor), G.MEDAL_NAMES[medal] + " — " + r.name);
    if (medal === 3 && prevMedal < 3) G.state.stats.golds = (G.state.stats.golds || 0) + 1;
  } else {
    G.earn(10, "race finished");
  }
  if (improvedTime) {
    if (G.fx) G.fx.burst(G.player.x, G.player.y - 20, "#ffffff", 32);
    G.cam.shake = Math.max(G.cam.shake, 4);
  }
  G.ui.notify("🏁 " + r.name + " — " + elapsed.toFixed(1) + "s [" + G.MEDAL_NAMES[medal] + "]" +
    (improvedTime ? " ◆ NEW BEST" : ""), "gold");
  G.audio.chime(); G.ui.objective(null); G.saveGame();
}

function checkUnlocks() {
  const s = G.state, n = s.counts.food;
  if (!s.abilities.dash && n >= G.UNLOCKS.dash) { s.abilities.dash = true; G.ui.guide(G.GUIDE.dashUnlock, 9); G.audio.chime(); }
  if (!s.abilities.djump && n >= G.UNLOCKS.djump) { s.abilities.djump = true; G.ui.guide(G.GUIDE.djumpUnlock, 9); G.audio.chime(); }
  if (!s.abilities.wallrun && n >= G.UNLOCKS.wallrun) { s.abilities.wallrun = true; G.ui.guide(G.GUIDE.wallUnlock, 9); G.audio.chime(); }
  G.ui.refreshAbilities();
}

function checkSetRewards() {
  const s = G.state;
  const sets = [
    ["food", s.counts.food >= G.TOTALS.food, "complete holo-kibble set"],
    ["chip", s.counts.chip >= G.TOTALS.chip, "complete data chip set"],
    ["mem", s.counts.mem >= G.TOTALS.mem, "complete lost memory set"],
    ["art", s.counts.art >= G.TOTALS.art, "complete artifact set"],
    ["leg", s.counts.leg >= G.TOTALS.leg, "complete legendary set"],
  ];
  for (const [id, done, label] of sets) {
    if (!done || s.setRewards[id]) continue;
    s.setRewards[id] = true;
    G.awardMystery("set-" + id, label + " bonus", true);
    G.earn(s.upgrades.setBonus ? 160 : 90, label);
    if (G.gainXP) G.gainXP(80);
  }
}

// ================= INTERACTION =================
G.doInteract = function () {
  const it = G.interact;
  if (!it) return;
  if (it.type === "teleport") { G.ui.openTeleport(); }
  else if (it.type === "terminal") {
    const t = it.obj;
    if (t.hacked) { G.ui.notify("Terminal already breached.", ""); return; }
    if (!G.state.flags.hackTip) { G.state.flags.hackTip = 1; G.ui.guide(G.GUIDE.hack); }
    G.ui.startHack(() => {
      t.hacked = true;
      if (t.door) { const d = G.world.doors.find(x => x.id === t.door); if (d) d.open = true; G.ui.notify("⬢ DOOR UNSEALED", "gold"); }
      if (t.action === "billboard") { G.world.megaSign.on = true; G.ui.notify("⬢ MEGA-BILLBOARD RESTORED", "gold"); }
      if (t.action === "beam") { G.world.beams.find(b => b.id === "corp").on = true; G.ui.notify("⬢ GRAV-LIFT ONLINE — step into the beam", "gold"); }
      G.state.miniGames["hack-" + t.id] = true;
      G.earn(25, "terminal breached");
      G.audio.chime(); G.saveGame();
    });
  }
  else if (it.type === "pickup") {
    const d = it.obj; d.state = 1;
    G.ui.notify("📦 PICKED UP — " + d.title, "");
    G.ui.objective("DELIVER: " + d.who);
    if (!G.state.flags.delivTip) { G.state.flags.delivTip = 1; G.ui.guide(G.GUIDE.delivery); }
    G.audio.blip(520);
  }
  else if (it.type === "race") {
    const r = it.obj;
    if (!G.state.flags.raceTip) { G.state.flags.raceTip = 1; G.ui.guide(G.GUIDE.race); }
    if (G.flow) G.flow.cash();
    G.races.active = { race: r, idx: 0, t: r.limit, elapsed: 0, rec: [], recT: 0 };
    const gold = (r.limit * 0.55).toFixed(1), silver = (r.limit * 0.72).toFixed(1);
    G.ui.objective("RACE: " + r.name + "  GOLD " + gold + "s · SILVER " + silver + "s" + (r.best ? " · BEST " + r.best.toFixed(1) + "s" : ""));
    G.audio.blip(700);
  }
  else if (it.type === "board") {
    if (G.board.active) { G.ui.notify("Finish the current job first.", ""); return; }
    if (!G.state.flags.board) { G.state.flags.board = 1; G.ui.guide(G.GUIDE.boardTip, 9); }
    G.acceptBoardJob();
  }
  else if (it.type === "kitten") {
    if (G.carryKitten) { G.ui.notify("Paws full — one kitten at a time.", ""); return; }
    G.carryKitten = it.obj;
    G.audio.mew();
    G.ui.notify("🐱 Kitten aboard! Carry it to the PAW SHRINE (market rooftops)", "gold");
    G.ui.objective("KITTEN → Paw Shrine, above Neon Market");
  }
  else if (it.type === "talk") { G.talkTo(it.obj.name); }
  else if (it.type === "shop") {
    if (!G.state.flags.shop) { G.state.flags.shop = 1; G.ui.guide(G.GUIDE.shopTip, 9); }
    G.ui.openShop();
  }
  else if (it.type === "shrine") { G.ui.openShrine(); }
};

// ================= TELEPORT TRAVEL =================
G.teleportTo = function (tp) {
  const p = G.player;
  if (G.fx) G.fx.burst(p.x, p.y, "#00f0ff", 20);
  p.x = tp.x; p.y = tp.y - 40; p.vx = 0; p.vy = 0; p.zip = null; p.climbing = null; p.hanging = null;
  G.cam.x = tp.x; G.cam.y = tp.y - 200;
  if (G.fx) G.fx.burst(tp.x, tp.y - 40, "#00f0ff", 24);
  G.audio.dash(); G.cam.shake = 4;
};

// ================= PHOTOGRAPHY =================
G.takePhoto = function () {
  const flash = document.getElementById("photo-flash");
  flash.classList.add("snap");
  setTimeout(() => flash.classList.remove("snap"), 60);
  G.audio.blip(900);
  const cx = G.cam.x, cy = G.cam.y;
  let hit = null;
  for (const t of G.photoTargets) {
    if (t.got || Math.hypot(t.x - cx, t.y - cy) >= t.r) continue;
    const ok = t.kind === "ghost" ? !!G.eventActive("ghosttrain")
      : t.kind === "kitten" ? Object.keys(G.state.kittens).length > 0
      : t.kind === "jump" ? G.player.airT > 0.35 && G.zoneAt(G.player.x, G.player.y) === "rooftops"
      : t.kind === "rain" ? G.weather.rainAmt > 0.2
      : true;
    if (ok) { t.got = true; hit = t; break; }
  }
  G.state.counts.photos++;
  if (hit) {
    G.earn(20, "photo archived: " + hit.name);
    if (G.gainXP) G.gainXP(25);
    G.audio.chime(); G.saveGame();
  } else {
    G.ui.notify("📷 Photo saved to gallery", "");
  }
};

// ================= SAVE / LOAD =================
G.saveGame = function () {
  try {
    const s = G.state;
    localStorage.setItem("pawpaw-save", JSON.stringify({
      counts: s.counts, abilities: s.abilities, discovered: s.discovered,
      tpUnlocked: s.tpUnlocked, flags: s.flags, playT: s.playT,
      taken: G.items.map(i => i.taken ? 1 : 0).join(""),
      hacked: G.terminals.filter(t => t.hacked).map(t => t.id),
      races: G.races.list.filter(r => r.done).map(r => r.id),
      raceData: G.races.list.map(r => ({ id: r.id, best: r.best, medal: r.medal, ghost: r.ghost })),
      deliv: G.deliveries.filter(d => d.state === 2).map(d => d.id),
      photos: G.photoTargets.filter(t => t.got).map(t => t.name),
      px: Math.round(G.player.x), py: Math.round(G.player.y),
      timeT: G.time.t,
      upgrades: s.upgrades, style: s.style, stats: s.stats, ach: s.ach,
      quests: s.quests, kittens: s.kittens, boardStreak: s.boardStreak,
      courierShield: s.courierShield, secrets: s.secrets, mysteries: s.mysteries,
      hiddenRewards: s.hiddenRewards, miniGames: s.miniGames, npcHelp: s.npcHelp,
      cosmetics: s.cosmetics, shrine: s.shrine, skills: s.skills, skillPoints: s.skillPoints,
      setRewards: s.setRewards, completionPct: G.completionPct ? G.completionPct() : s.completionPct,
      xp: s.xp, level: s.level, chTier: G.challenges ? G.challenges.tier : 0, chActive: G.challenges ? G.challenges.active : [],
    }));
  } catch (e) { /* storage unavailable */ }
};

G.loadGame = function () {
  let d;
  try { d = JSON.parse(localStorage.getItem("pawpaw-save")); } catch (e) { return false; }
  if (!d) return false;
  const s = G.state;
  Object.assign(s.counts, d.counts); Object.assign(s.abilities, d.abilities);
  s.discovered = d.discovered || {}; s.tpUnlocked = d.tpUnlocked || {};
  s.flags = d.flags || {}; s.playT = d.playT || 0;
  if (d.taken) [...d.taken].forEach((c, i) => { if (G.items[i]) G.items[i].taken = c === "1"; });
  (d.hacked || []).forEach(id => {
    const t = G.terminals.find(t => t.id === id);
    if (!t) return;
    t.hacked = true;
    if (t.door) { const dr = G.world.doors.find(x => x.id === t.door); if (dr) dr.open = true; }
    if (t.action === "billboard") G.world.megaSign.on = true;
    if (t.action === "beam") G.world.beams[0].on = true;
  });
  (d.races || []).forEach(id => { const r = G.races.list.find(r => r.id === id); if (r) r.done = true; });
  (d.raceData || []).forEach(rd => {
    const r = G.races.list.find(r => r.id === rd.id);
    if (r) { r.best = rd.best; r.medal = rd.medal; r.ghost = rd.ghost; }
  });
  Object.assign(s.upgrades, d.upgrades || {});
  Object.assign(s.style, d.style || {});
  Object.assign(s.stats, d.stats || {});
  Object.assign(s.ach, d.ach || {});
  Object.assign(s.quests, d.quests || {});
  Object.assign(s.kittens, d.kittens || {});
  s.boardStreak = d.boardStreak || 0;
  s.courierShield = !!d.courierShield;
  Object.assign(s.secrets, d.secrets || {});
  Object.assign(s.mysteries, d.mysteries || {});
  Object.assign(s.hiddenRewards, d.hiddenRewards || {});
  Object.assign(s.miniGames, d.miniGames || {});
  Object.assign(s.npcHelp, d.npcHelp || {});
  Object.assign(s.cosmetics, d.cosmetics || {});
  Object.assign(s.shrine, d.shrine || {});
  Object.assign(s.skills, d.skills || {});
  Object.assign(s.setRewards, d.setRewards || {});
  s.skillPoints = d.skillPoints || 0;
  s.completionPct = d.completionPct || 0;
  s.xp = d.xp || 0; s.level = d.level || 1;
  if (G.challenges) { G.challenges.tier = d.chTier || 0; G.challenges.active = d.chActive || []; }
  if (s.upgrades.glide) document.getElementById("ab-glide").classList.remove("hidden", "locked");
  (d.deliv || []).forEach(id => { const dl = G.deliveries.find(x => x.id === id); if (dl) dl.state = 2; });
  (d.photos || []).forEach(n => { const t = G.photoTargets.find(t => t.name === n); if (t) t.got = true; });
  if (d.px != null) { G.player.x = d.px; G.player.y = d.py; G.cam.x = d.px; G.cam.y = d.py - 100; }
  if (d.timeT != null) G.time.t = d.timeT;
  return true;
};
