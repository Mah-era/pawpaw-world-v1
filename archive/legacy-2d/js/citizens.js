// ============ PAWPAW WORLD — LIVING CITY (NPCS, VEHICLES, DRONES) ============
"use strict";

G.npcs = []; G.vehicles = []; G.drones = [];

G.CHATTER = [
  "Rain again? The seeders are drunk.", "Saw that calico on the 40th floor. Forty. Floors.",
  "Noodle-9 raised prices. Tragedy.", "My drone followed a cat home. Keeping both.",
  "Line 9 ran on time again. Empty. Again.", "The billboard winked at me. I winked back.",
  "Apex rooftop's off-limits. So obviously I'm going.", "Heard the mast at the docks hums at night.",
  "New collar firmware dropped. Cats only.", "The old AI? Still here. In the vending machines.",
  "Synth-latte. Double. No data harvesting, please.", "Puddles look better than the real thing.",
  "Someone's feeding the rooftop cats. Bless them.", "Lost my keycard in the alleys. Third time.",
  "The holograms dance better in the rain.", "Quiet shift. Even the drones are bored.",
];

const NPC_PALETTES = [
  ["#3a4a6b", "#ffb347"], ["#5b3a6b", "#00f0ff"], ["#2d5b4f", "#ff2bd6"],
  ["#6b3a3a", "#aaff00"], ["#44486b", "#4dffc4"], ["#33384a", "#ff5e5e"],
];

G.initCitizens = function () {
  const SY = G.CFG.STREET_Y, rng = G.makeRng(777);
  const N = (x1, x2, type, phase, opts) => {
    G.npcs.push(Object.assign({
      x: x1 + rng() * (x2 - x1), y: SY, x1, x2, type, phase: phase || "always",
      dir: rng() < 0.5 ? -1 : 1, speed: 40 + rng() * 50, pal: NPC_PALETTES[Math.floor(rng() * 6)],
      state: "walk", t: rng() * 4, line: null, lineT: 0, ph: rng() * 7, umbrella: rng() < 0.4,
      gatherX: null,
    }, opts || {}));
  };
  // street wanderers per zone
  for (let i = 0; i < 7; i++) N(2700, 6400, ["worker", "courier", "technician"][i % 3], i < 4 ? "always" : "night");
  for (let i = 0; i < 4; i++) N(6500, 7400, "worker", "always");
  for (let i = 0; i < 6; i++) N(7500, 10500, "suit", i < 3 ? "day" : "always");
  for (let i = 0; i < 3; i++) N(10700, 12400, "technician", "always");
  for (let i = 0; i < 3; i++) N(200, 2500, "hacker", "night");
  // stationary characters
  const fix = (x, y, type, name, opts) => G.npcs.push(Object.assign({
    x, y, x1: x, x2: x, type, name, phase: "always", dir: -1, speed: 0,
    pal: NPC_PALETTES[(x | 0) % 6], state: "stand", t: 0, line: null, lineT: 0, ph: x % 7, fixed: true,
  }, opts || {}));
  [3160, 3680, 4280, 4810, 5390, 5915].forEach((x, i) => fix(x + 30, SY, "vendor", "Vendor"));
  fix(5790, 1200, "gardener", "Vega", { dir: 1 });          // rooftop garden
  fix(5320, G.CFG.UNDER_Y, "hacker", "Patch");              // hacker den
  fix(5470, G.CFG.UNDER_Y, "hacker", "Solder");
  fix(9010, SY, "suit", "Ms. Vance");                       // delivery target
  fix(1360, SY, "technician", "Greasy Jin");                // delivery target
  fix(4080, SY, "performer", "Static Quartet", { phase: "night" });

  // hover cars: two lanes above the road
  for (let i = 0; i < 9; i++) {
    G.vehicles.push({
      x: rng() * G.CFG.WORLD_W, y: 2470 + rng() * 20, v: 160 + rng() * 120, dir: 1,
      len: 70 + rng() * 40, color: G.SIGN_COLORS[i % 7], type: i % 4 === 0 ? "transit" : "car",
    });
    G.vehicles.push({
      x: rng() * G.CFG.WORLD_W, y: 2380 + rng() * 20, v: 160 + rng() * 120, dir: -1,
      len: 70 + rng() * 40, color: G.SIGN_COLORS[(i + 3) % 7], type: i % 5 === 0 ? "truck" : "car",
    });
  }
  // drones
  for (let i = 0; i < 8; i++) {
    G.drones.push({
      x: rng() * G.CFG.WORLD_W, y: 1700 + rng() * 700, baseY: 1700 + rng() * 700,
      vx: (rng() < 0.5 ? -1 : 1) * (50 + rng() * 60), ph: rng() * 7,
      type: i < 6 ? "cargo" : "police", failing: 0, dead: 0,
    });
  }
};

G.npcVisible = function (n) {
  if (n.phase === "always") return true;
  const h = G.time.hours;
  const isDay = h > 7 && h < 19;
  return n.phase === "day" ? isDay : !isDay;
};

G.updateCitizens = function (dt) {
  const rainHurry = G.weather.rainAmt > 0.6 ? 1.6 : 1;
  for (const n of G.npcs) {
    if (!G.npcVisible(n)) continue;
    n.t -= dt; n.lineT -= dt; n.ph += dt;
    if (n.fixed) {
      // face the player when close
      if (Math.abs(G.player.x - n.x) < 120 && Math.abs(G.player.y - n.y) < 60) n.dir = G.player.x > n.x ? 1 : -1;
      continue;
    }
    if (n.gatherX != null) { // street performance event draws a crowd
      const d = n.gatherX - n.x;
      if (Math.abs(d) > 60) { n.x += Math.sign(d) * n.speed * 1.4 * dt; n.dir = Math.sign(d); n.state = "walk"; }
      else n.state = "stand";
      continue;
    }
    if (n.state === "walk") {
      n.x += n.dir * n.speed * rainHurry * dt;
      if (n.x < n.x1) { n.x = n.x1; n.dir = 1; }
      if (n.x > n.x2) { n.x = n.x2; n.dir = -1; }
      if (n.t < 0) { n.state = "stand"; n.t = 1.5 + Math.random() * 3; }
    } else if (n.t < 0) { n.state = "walk"; n.t = 3 + Math.random() * 5; if (Math.random() < 0.3) n.dir *= -1; }
    // chatter when near another npc
    if (n.lineT < -8 && Math.random() < dt * 0.15) {
      for (const m of G.npcs) {
        if (m !== n && !m.fixed && Math.abs(m.x - n.x) < 90 && Math.abs(m.y - n.y) < 40) {
          n.line = G.CHATTER[Math.floor(Math.random() * G.CHATTER.length)];
          n.lineT = 3.5; n.state = "stand"; n.t = 4; m.state = "stand"; m.t = 4;
          break;
        }
      }
    }
  }
  for (const v of G.vehicles) {
    v.x += v.v * v.dir * dt;
    if (v.dir > 0 && v.x > G.CFG.WORLD_W + 200) v.x = -200;
    if (v.dir < 0 && v.x < -200) v.x = G.CFG.WORLD_W + 200;
  }
  for (const d of G.drones) {
    d.ph += dt;
    if (d.dead > 0) { d.dead -= dt; if (d.dead <= 0) { d.y = d.baseY; d.failing = 0; } continue; }
    if (d.failing > 0) {
      d.failing += dt; d.y += 300 * d.failing * dt; d.x += Math.sin(d.ph * 14) * 3;
      if (G.fx && Math.random() < 0.4) G.fx.spark(d.x, d.y, 2);
      if (d.y > G.CFG.STREET_Y - 20) {
        if (G.fx) G.fx.burst(d.x, G.CFG.STREET_Y - 20, "#ffb347", 16);
        G.audio.thud(); d.dead = 18; d.y = -999;
      }
      continue;
    }
    d.x += d.vx * dt; d.y = d.baseY + Math.sin(d.ph * 1.4) * 26;
    if (d.x < 100) { d.x = 100; d.vx = Math.abs(d.vx); }
    if (d.x > G.CFG.WORLD_W - 100) { d.x = G.CFG.WORLD_W - 100; d.vx = -Math.abs(d.vx); }
  }
};

// ---------- drawing ----------
G.drawCitizens = function (ctx, view) {
  const SY = G.CFG.STREET_Y;
  for (const n of G.npcs) {
    if (!G.npcVisible(n)) continue;
    if (n.x < view.x - 60 || n.x > view.x + view.w + 60) continue;
    if (n.y < view.y - 80 || n.y > view.y + view.h + 80) continue;
    drawNpc(ctx, n);
  }
  for (const v of G.vehicles) {
    if (v.x < view.x - 250 || v.x > view.x + view.w + 250) continue;
    drawVehicle(ctx, v);
  }
  for (const d of G.drones) {
    if (d.dead > 0 || d.x < view.x - 80 || d.x > view.x + view.w + 80) continue;
    if (d.y < view.y - 80 || d.y > view.y + view.h + 80) continue;
    drawDrone(ctx, d);
  }
};

function drawNpc(ctx, n) {
  const bob = n.state === "walk" ? Math.abs(Math.sin(n.ph * 7)) * 2.4 : Math.sin(n.ph * 1.2) * 0.8;
  const x = n.x, y = n.y - 26 - bob;
  ctx.save();
  // legs
  if (n.state === "walk") {
    const sw = Math.sin(n.ph * 7) * 6;
    ctx.strokeStyle = "#1c2030"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.lineTo(x + sw, n.y - 1);
    ctx.moveTo(x, y + 12); ctx.lineTo(x - sw, n.y - 1); ctx.stroke();
  } else {
    ctx.strokeStyle = "#1c2030"; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 3, y + 12); ctx.lineTo(x - 3, n.y - 1);
    ctx.moveTo(x + 3, y + 12); ctx.lineTo(x + 3, n.y - 1); ctx.stroke();
  }
  // coat
  ctx.fillStyle = n.pal[0];
  G.rr(ctx, x - 8, y - 10, 16, 24, 4);
  // head
  ctx.fillStyle = "#c9a182";
  ctx.beginPath(); ctx.arc(x, y - 16, 6.4, 0, 7); ctx.fill();
  // visor glow
  ctx.fillStyle = n.pal[1];
  ctx.shadowColor = n.pal[1]; ctx.shadowBlur = 5;
  ctx.fillRect(x - 5 + (n.dir > 0 ? 2 : 0), y - 18, 8, 2.4);
  ctx.shadowBlur = 0;
  // umbrella in heavy rain
  if (G.weather.rainAmt > 0.6 && n.umbrella && n.y === G.CFG.STREET_Y) {
    ctx.strokeStyle = "#3a4a5a"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 4, y - 8); ctx.lineTo(x + 4, y - 34); ctx.stroke();
    ctx.fillStyle = n.pal[1]; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(x + 4, y - 32, 16, Math.PI, 0); ctx.fill(); ctx.globalAlpha = 1;
  }
  // performer notes
  if (n.type === "performer" && G.npcVisible(n) && G.fx && Math.random() < 0.04) G.fx.note(x, y - 30);
  // vendor stall lighting handled by props; gardener gets a watering can pose
  // speech bubble
  if (n.line && n.lineT > 0) {
    ctx.font = "11px monospace";
    const w = ctx.measureText(n.line).width + 14;
    ctx.fillStyle = "rgba(8,14,30,0.85)";
    G.rr(ctx, x - w / 2, y - 52, w, 20, 4);
    ctx.strokeStyle = "rgba(0,240,255,0.4)"; ctx.lineWidth = 1;
    ctx.strokeRect(x - w / 2, y - 52, w, 20);
    ctx.fillStyle = "#cfeeff";
    ctx.fillText(n.line, x - w / 2 + 7, y - 38);
  }
  ctx.restore();
}

function drawVehicle(ctx, v) {
  const y = v.y + Math.sin(performance.now() / 300 + v.x) * 3;
  ctx.save();
  ctx.globalAlpha = 0.92;
  const grad = ctx.createLinearGradient(v.x, y, v.x + v.len, y);
  grad.addColorStop(0, "#11141f"); grad.addColorStop(1, "#1d2333");
  ctx.fillStyle = grad;
  G.rr(ctx, v.x, y, v.len, v.type === "truck" ? 26 : 16, 7);
  if (v.type === "transit") { ctx.fillStyle = "rgba(170,220,255,0.5)"; for (let i = 6; i < v.len - 8; i += 12) ctx.fillRect(v.x + i, y + 4, 7, 6); }
  // light strip + engine glow
  ctx.fillStyle = v.color; ctx.shadowColor = v.color; ctx.shadowBlur = 8;
  ctx.fillRect(v.x + (v.dir > 0 ? v.len - 6 : 0), y + 3, 6, 3);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,240,255,0.5)";
  ctx.fillRect(v.x + 8, y + (v.type === "truck" ? 26 : 16), v.len - 16, 2.4);
  // motion trail
  ctx.globalAlpha = 0.18; ctx.fillStyle = v.color;
  ctx.fillRect(v.x - v.dir * 26, y + 6, 26, 3);
  ctx.restore();
}

function drawDrone(ctx, d) {
  ctx.save();
  const wob = d.failing > 0 ? Math.sin(d.ph * 20) * 4 : 0;
  ctx.translate(d.x, d.y); ctx.rotate(wob * 0.04);
  ctx.fillStyle = "#1d2333";
  G.rr(ctx, -12, -6, 24, 12, 4);
  ctx.fillStyle = "#11141f"; ctx.fillRect(-16, -8, 8, 4); ctx.fillRect(8, -8, 8, 4);
  // rotor shimmer
  ctx.strokeStyle = "rgba(180,220,255,0.35)"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-17, -9); ctx.lineTo(-3, -9); ctx.moveTo(3, -9); ctx.lineTo(17, -9); ctx.stroke();
  const col = d.type === "police" ? "#ff3355" : "#00f0ff";
  ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 7;
  ctx.fillRect(-2.4, 0, 4.8, 3.4);
  ctx.shadowBlur = 0;
  if (d.type === "cargo") { ctx.fillStyle = "#3a3424"; ctx.fillRect(-7, 6, 14, 10); ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 1; ctx.strokeRect(-7, 6, 14, 10); }
  // police searchlight at night
  if (d.type === "police" && G.time.light < 0.45) {
    const a = Math.sin(d.ph * 0.7) * 0.5;
    ctx.save(); ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, "rgba(255,240,200,0.30)"); g.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(-46, 250); ctx.lineTo(46, 250); ctx.lineTo(4, 4); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
