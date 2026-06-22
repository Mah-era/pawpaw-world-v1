// ============ PAWPAW WORLD — META HOOKS (XP / CHALLENGES / FEVER / BONUS EVENTS) ============
"use strict";

// ================= PAW LEVEL (XP) =================
G.TITLES = ["STREET KITTEN", "GUTTER RUNNER", "NEON PROWLER", "WIRE DANCER",
  "ROOF GHOST", "STORM CHASER", "VOID SURFER", "CITY LEGEND"];

G.xpNeed = lv => 80 + lv * 45;
G.pawTitle = () => G.TITLES[Math.min(Math.floor((G.state.level - 1) / 3), G.TITLES.length - 1)];

G.gainXP = function (n) {
  const s = G.state;
  if (G.fever()) n *= 2;
  if (s.skills.explore_xp) n *= 1.2;
  s.xp += Math.round(n);
  while (s.xp >= G.xpNeed(s.level)) {
    s.xp -= G.xpNeed(s.level);
    s.level++;
    s.skillPoints = (s.skillPoints || 0) + 1;
    const credits = 10 + s.level * 5;
    s.counts.credits += credits; s.stats.credEarned += credits;
    const newTitle = (s.level - 1) % 3 === 0 && s.level > 1;
    G.ui.notify("⬆ PAW LEVEL " + s.level + "  (+1 upgrade point, +" + credits + "¢)" + (newTitle ? "  ◆ TITLE: " + G.pawTitle() : ""), "ach");
    G.audio.fanfare();
    if (G.fx) G.fx.burst(G.player.x, G.player.y - 10, "#ffe14d", 26);
    G.saveGame();
  }
};

// ================= FEVER MODE =================
let feverWas = false;
G.fever = () => G.flow && G.flow.combo >= 10;

function updateFever() {
  const f = G.fever();
  if (f && !feverWas) {
    G.ui.notify("🔥 FEVER — double credits & XP while the chain lives!", "ach");
    G.audio.zap();
  }
  feverWas = f;
}

// fever doubles credit payouts (wraps G.earn once)
const baseEarn = G.earn;
G.earn = function (amount, why) {
  if (G.fever()) amount *= 2;
  baseEarn(amount, why);
  G.gainXP(amount); // every credit earned is XP too
};

// ================= ROTATING CHALLENGES =================
const CH_DEFS = {
  kibble:  { metric: () => G.state.counts.food,                 n: t => 10 + t * 4,        label: n => "Collect " + n + " kibble" },
  zips:    { metric: () => G.state.stats.zips,                  n: t => 3 + Math.ceil(t / 2), label: n => "Ride " + n + " ziplines" },
  jobs:    { metric: () => G.state.stats.jobs,                  n: t => 1 + Math.floor(t / 2), label: n => "Complete " + n + " courier job" + (n > 1 ? "s" : "") },
  dist:    { metric: () => Math.floor(G.state.stats.dist / 40), n: t => 400 + t * 150,     label: n => "Travel " + n + "m" },
  wjumps:  { metric: () => G.state.stats.walljumps,             n: t => 6 + t * 3,         label: n => "Do " + n + " wall jumps" },
  races:   { metric: () => G.state.stats.raceRuns || 0,         n: () => 1,                label: () => "Finish any race" },
  wisp:    { metric: () => G.state.stats.wisps,                 n: () => 1,                label: () => "Catch a data wisp" },
  combo:   { live: true,                                        n: t => 6 + Math.min(14, t * 2), label: n => "Hit a x" + n + " flow combo" },
};

G.challenges = { active: [], tier: 0 };

function assignChallenge() {
  const used = G.challenges.active.map(c => c.type);
  const pool = Object.keys(CH_DEFS).filter(k => !used.includes(k));
  const type = pool[Math.floor(Math.random() * pool.length)];
  const def = CH_DEFS[type], t = G.challenges.tier;
  const n = def.n(t);
  G.challenges.active.push({
    type, n,
    base: def.live ? 0 : def.metric(),
    label: def.label(n),
  });
}

function updateChallenges() {
  while (G.challenges.active.length < 3) assignChallenge();
  for (let i = G.challenges.active.length - 1; i >= 0; i--) {
    const c = G.challenges.active[i], def = CH_DEFS[c.type];
    const prog = def.live ? (G.flow ? G.flow.combo : 0) : def.metric() - c.base;
    c.prog = Math.min(c.n, Math.max(0, prog));
    if (c.prog >= c.n) {
      G.challenges.active.splice(i, 1);
      G.challenges.tier++;
      const pay = 20 + G.challenges.tier * 8;
      G.ui.notify("✦ CHALLENGE — " + c.label + "  (+" + pay + "¢)", "ach");
      G.audio.chime();
      G.earn(pay, null);
      G.gainXP(25);
      G.saveGame();
    }
  }
}

// ================= CITY BONUS EVENTS =================
G.bonus = { type: null, t: 0, dur: 0 };
let bonusTimer = 70;
let rainDrops = [];

function startBonus() {
  const type = ["rush", "rain", "swarm"][Math.floor(Math.random() * 3)];
  if (G.state.upgrades.eventPay) {
    G.earn(20, "city event broker");
    if (G.gainXP) G.gainXP(18);
  }
  if (type === "swarm") {
    for (let i = 0; i < 3; i++) G.spawnWisp(true);
    G.ui.notify("⚡ WISP SWARM — three fragments loose nearby!", "ach");
    G.audio.zap();
    return; // no countdown needed; wisps carry their own life
  }
  G.bonus.type = type;
  G.bonus.dur = G.bonus.t = type === "rush" ? 90 : 45;
  if (type === "rush") G.ui.notify("🚦 RUSH HOUR — courier jobs pay DOUBLE for 90s!", "ach");
  else G.ui.notify("▣ KIBBLE RAIN — the sky is feeding you. 45 seconds!", "ach");
  G.audio.fanfare();
}

G.rushActive = () => G.bonus.type === "rush" && G.bonus.t > 0;

function updateBonus(dt) {
  if (G.bonus.type) {
    G.bonus.t -= dt;
    if (G.bonus.type === "rain" && Math.random() < dt * 3 && rainDrops.length < 40) {
      rainDrops.push({
        x: G.player.x + (Math.random() - 0.5) * 1100,
        y: Math.max(400, G.player.y - 480 - Math.random() * 150),
        vy: 180 + Math.random() * 120, life: 9, ph: Math.random() * 7,
      });
    }
    if (G.bonus.t <= 0) { G.bonus.type = null; }
  } else {
    bonusTimer -= dt;
    if (bonusTimer <= 0) { startBonus(); bonusTimer = 100 + Math.random() * 70; }
  }
  // falling kibble
  const p = G.player;
  for (let i = rainDrops.length - 1; i >= 0; i--) {
    const d = rainDrops[i];
    d.y += d.vy * dt; d.life -= dt; d.ph += dt;
    if (Math.abs(d.x - p.x) < 30 && Math.abs(d.y - p.y) < 34) {
      G.state.counts.food++;
      G.gainXP(4);
      if (G.flow) G.flow.feed();
      G.audio.ping();
      if (G.fx) G.fx.burst(d.x, d.y, "#ffb347", 8);
      rainDrops.splice(i, 1);
    } else if (d.life <= 0 || d.y > G.CFG.UNDER_Y) rainDrops.splice(i, 1);
  }
}

// ================= SUPPLY DRONE & MYSTERY CAPSULES =================
G.supply = null;
let supplyTimer = 50;

const CAPSULE_LOOT = [
  // [weight, fn, label]
  [38, () => G.earn(25, null), "25¢"],
  [20, () => G.earn(60, null), "60¢ — nice pull"],
  [15, () => { G.state.buffT = 90; }, "SNACK RUSH — 90s of speed"],
  [10, () => G.earn(120, null), "120¢ — big pull!"],
  [12, () => G.gainXP(80), "+80 XP data cache"],
  [5,  () => { G.earn(300, null); }, "💎 JACKPOT — 300¢!!"],
];

function openCapsule() {
  let roll = Math.random() * 100, pick = CAPSULE_LOOT[0];
  if (G.state.upgrades.cacheBoost) roll *= 0.72;
  for (const l of CAPSULE_LOOT) { roll -= l[0]; if (roll <= 0) { pick = l; break; } }
  pick[1]();
  G.awardMystery("capsule-" + (Object.keys(G.state.hiddenRewards).length % 24), "supply capsule", pick[0] <= 10);
  G.ui.notify("📦 CAPSULE: " + pick[2], pick[0] <= 10 ? "ach" : "gold");
  G.audio.fanfare();
}

function updateSupply(dt) {
  const p = G.player;
  if (!G.supply) {
    supplyTimer -= dt;
    if (supplyTimer <= 0) {
      const side = Math.random() < 0.5 ? -1 : 1;
      G.supply = {
        x: Math.max(200, Math.min(G.CFG.WORLD_W - 200, p.x - side * 850)),
        y: Math.max(700, Math.min(2500, p.y - 220)),
        vx: side * 105, life: 26, ph: 0,
      };
      G.ui.notify("📦 SUPPLY DRONE passing — pounce it for a capsule!", "pink");
      supplyTimer = 85 + Math.random() * 75;
    }
    return;
  }
  const sdr = G.supply;
  sdr.life -= dt; sdr.ph += dt;
  sdr.x += sdr.vx * dt;
  sdr.y += Math.sin(sdr.ph * 1.6) * 18 * dt;
  if (Math.hypot(sdr.x - p.x, sdr.y - p.y) < 42) {
    if (G.fx) G.fx.burst(sdr.x, sdr.y, "#ffe14d", 24);
    G.audio.thud();
    G.supply = null;
    openCapsule();
    if (G.flow) G.flow.add("supply", 18);
  } else if (sdr.life <= 0 || sdr.x < 100 || sdr.x > G.CFG.WORLD_W - 100) G.supply = null;
}

// ================= UPDATE & DRAW =================
let chT = 0;
G.updateMeta = function (dt) {
  updateFever();
  updateBonus(dt);
  updateSupply(dt);
  chT -= dt;
  if (chT <= 0) { chT = 0.4; updateChallenges(); }
};

G.drawMeta = function (ctx, view, now) {
  // falling kibble
  for (const d of rainDrops) {
    if (d.x < view.x - 30 || d.x > view.x + view.w + 30) continue;
    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.ph * 3);
    ctx.fillStyle = "rgba(255,179,71,0.95)";
    ctx.shadowColor = "#ffb347"; ctx.shadowBlur = 8;
    ctx.fillRect(-5, -5, 10, 10);
    ctx.shadowBlur = 0;
    ctx.restore();
    // little fall trail
    ctx.strokeStyle = "rgba(255,179,71,0.25)"; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(d.x, d.y - 8); ctx.lineTo(d.x, d.y - 22); ctx.stroke();
  }
  // supply drone
  if (G.supply) {
    const s = G.supply;
    if (s.x > view.x - 80 && s.x < view.x + view.w + 80) {
      ctx.save(); ctx.translate(s.x, s.y);
      ctx.fillStyle = "#1d2333"; G.rr(ctx, -14, -22, 28, 13, 4);
      ctx.strokeStyle = "rgba(180,220,255,0.35)"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-19, -25); ctx.lineTo(-4, -25); ctx.moveTo(4, -25); ctx.lineTo(19, -25); ctx.stroke();
      // dangling capsule
      ctx.strokeStyle = "#3a4456"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 0); ctx.stroke();
      const pl = 0.6 + 0.4 * Math.sin(now * 5);
      ctx.fillStyle = "#3a3424"; G.rr(ctx, -10, 0, 20, 16, 3);
      ctx.strokeStyle = `rgba(255,225,77,${pl})`; ctx.lineWidth = 1.6; ctx.strokeRect(-10, 0, 20, 16);
      ctx.fillStyle = `rgba(255,225,77,${pl})`;
      ctx.font = "bold 12px monospace"; ctx.fillText("?", -3.4, 12);
      ctx.shadowColor = "#ffe14d"; ctx.shadowBlur = 10;
      ctx.fillRect(-2, -28, 4, 4);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }
};

// screen-space fever glow (called at end of render)
G.drawFeverOverlay = function (ctx) {
  if (!G.fever()) return;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 160);
  const g = ctx.createRadialGradient(innerWidth / 2, innerHeight / 2, innerHeight * 0.36,
    innerWidth / 2, innerHeight / 2, innerHeight * 0.85);
  g.addColorStop(0, "rgba(255,43,214,0)");
  g.addColorStop(1, `rgba(255,43,214,${0.10 + pulse * 0.10})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, innerWidth, innerHeight);
};
