// ============ PAWPAW WORLD — RENDERER ============
"use strict";

let cvs, ctx, scale = 1, drops = [], stars = [], far1 = [], far2 = [], puddles = [];

// ---------------- particles ----------------
G.fx = {
  parts: [],
  add(p) { if (this.parts.length < 400) this.parts.push(Object.assign({ t: 0 }, p)); },
  dust(x, y, n) { for (let i = 0; i < n; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 60, life: 0.5, type: "dust", size: 2 + Math.random() * 3 }); },
  burst(x, y, color, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = 60 + Math.random() * 160; this.add({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.7, type: "burst", color, size: 2 + Math.random() * 2.5 }); } },
  spark(x, y, n) { for (let i = 0; i < n; i++) this.add({ x, y, vx: (Math.random() - 0.5) * 140, vy: Math.random() * 120, life: 0.4, type: "burst", color: "#ffd34d", size: 1.5 + Math.random() * 1.5 }); },
  ring(x, y) { this.add({ x, y, vx: 0, vy: 0, life: 0.4, type: "ring", size: 6 }); },
  trail(x, y, f) { this.add({ x, y, vx: 0, vy: 0, life: 0.3, type: "trail", size: 20, f }); },
  note(x, y) { this.add({ x, y, vx: (Math.random() - 0.5) * 30, vy: -50, life: 1.6, type: "note", color: ["#ff2bd6", "#00f0ff", "#aaff00"][Math.floor(Math.random() * 3)], size: 11 }); },
  zzz(x, y) { this.add({ x, y, vx: 8, vy: -26, life: 2, type: "zzz", size: 10 }); },
  update(dt) {
    this.parts = this.parts.filter(p => (p.t += dt) < p.life);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === "burst") p.vy += 300 * dt; }
  },
  draw(c) {
    for (const p of this.parts) {
      const k = 1 - p.t / p.life;
      c.globalAlpha = k;
      if (p.type === "dust") { c.fillStyle = "rgba(180,190,210,0.5)"; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
      else if (p.type === "burst") { c.fillStyle = p.color; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); }
      else if (p.type === "ring") { c.strokeStyle = "#00f0ff"; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.size + p.t * 90, 0, 7); c.stroke(); }
      else if (p.type === "trail") { c.fillStyle = "rgba(0,240,255,0.35)"; c.beginPath(); c.ellipse(p.x, p.y, 22, 10, 0, 0, 7); c.fill(); }
      else if (p.type === "paw") {
        c.fillStyle = p.color || "#00f0ff";
        c.shadowColor = p.color || "#00f0ff"; c.shadowBlur = 6;
        c.beginPath(); c.ellipse(p.x, p.y, p.size * 0.55, p.size * 0.36, 0, 0, 7); c.fill();
        c.fillRect(p.x - p.size * 0.45, p.y - p.size * 0.55, p.size * 0.22, p.size * 0.22);
        c.fillRect(p.x, p.y - p.size * 0.66, p.size * 0.22, p.size * 0.22);
        c.fillRect(p.x + p.size * 0.36, p.y - p.size * 0.45, p.size * 0.22, p.size * 0.22);
        c.shadowBlur = 0;
      }
      else if (p.type === "note") { c.fillStyle = p.color; c.font = p.size + "px monospace"; c.fillText("♪", p.x, p.y); }
      else if (p.type === "zzz") { c.fillStyle = "rgba(200,220,255,0.8)"; c.font = p.size + "px monospace"; c.fillText("z", p.x, p.y); }
    }
    c.globalAlpha = 1;
  },
};

// ---------------- init ----------------
G.initRender = function () {
  cvs = document.getElementById("game");
  ctx = cvs.getContext("2d");
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = innerHeight / 860;
  };
  resize(); window.addEventListener("resize", resize);

  const rng = G.makeRng(99);
  for (let i = 0; i < 130; i++) stars.push({ x: rng() * 4000, y: rng() * 900, tw: rng() * 7 });
  let x = -200;
  while (x < G.CFG.WORLD_W * 0.2 + 3000) { const w = 90 + rng() * 160; far1.push({ x, w, h: 260 + rng() * 620 }); x += w + rng() * 60; }
  x = -200;
  while (x < G.CFG.WORLD_W * 0.42 + 3000) { const w = 70 + rng() * 150; far2.push({ x, w, h: 200 + rng() * 660, ant: rng() < 0.4, tint: rng() }); x += w + rng() * 50; }
  // puddles along the street
  for (let px = 200; px < G.CFG.WORLD_W - 200; px += 300 + rng() * 400) puddles.push({ x: px, w: 70 + rng() * 130 });
  // pre-render building facades
  for (const b of G.world.buildings) { if (!b.station) makeFacade(b); }
};

function makeFacade(b) {
  const rng = G.makeRng(b.seed);
  const c1 = document.createElement("canvas"); c1.width = b.w; c1.height = b.h;
  const c2 = document.createElement("canvas"); c2.width = b.w; c2.height = b.h;
  const a = c1.getContext("2d"), l = c2.getContext("2d");
  const pal = {
    alley: ["#15121f", "#0d0b15"], market: ["#1d1429", "#120d1c"],
    corp: ["#101a2c", "#0a1019"], dock: ["#1a1712", "#100e0a"], plaza: ["#141a28", "#0d1118"],
  }[b.style];
  const g = a.createLinearGradient(0, 0, 0, b.h);
  g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  a.fillStyle = g; a.fillRect(0, 0, b.w, b.h);
  // edge shading + parapet
  a.fillStyle = "rgba(0,0,0,0.35)"; a.fillRect(b.w - 10, 0, 10, b.h);
  a.fillStyle = "rgba(255,255,255,0.07)"; a.fillRect(0, 0, 6, b.h); a.fillRect(0, 0, b.w, 7);
  if (b.style === "corp") {
    // glass strips
    for (let wx = 10; wx < b.w - 18; wx += 26) {
      a.fillStyle = "rgba(10,16,28,0.9)"; a.fillRect(wx, 12, 18, b.h - 24);
      a.fillStyle = "rgba(120,200,255,0.06)"; a.fillRect(wx + 2, 12, 5, b.h - 24);
      for (let wy = 16; wy < b.h - 40; wy += 38) if (rng() < 0.35) {
        l.fillStyle = rng() < 0.6 ? "rgba(170,220,255,0.75)" : "rgba(255,225,170,0.7)";
        l.fillRect(wx + 1, wy, 16, 26);
      }
    }
    // diagonal sheen
    const sh = a.createLinearGradient(0, 0, b.w, b.h * 0.6);
    sh.addColorStop(0.42, "rgba(140,220,255,0)"); sh.addColorStop(0.5, "rgba(140,220,255,0.08)"); sh.addColorStop(0.58, "rgba(140,220,255,0)");
    a.fillStyle = sh; a.fillRect(0, 0, b.w, b.h);
  } else {
    const cw = 26, chh = 36, mx = 16;
    for (let wy = 22; wy < b.h - 50; wy += chh + 18) {
      for (let wx = mx; wx < b.w - cw - 8; wx += cw + 16) {
        a.fillStyle = "rgba(8,10,18,0.95)"; a.fillRect(wx, wy, cw, chh);
        a.fillStyle = "rgba(255,255,255,0.05)"; a.fillRect(wx, wy, cw, 3);
        if (rng() < (b.style === "dock" ? 0.18 : 0.4)) {
          const warm = rng();
          l.fillStyle = warm < 0.45 ? "rgba(255,214,150,0.8)" : warm < 0.75 ? "rgba(160,225,255,0.75)" : "rgba(255,140,200,0.6)";
          l.fillRect(wx + 1, wy + 1, cw - 2, chh - 2);
          if (rng() < 0.3) { l.fillStyle = "rgba(0,0,0,0.5)"; l.fillRect(wx + 4 + rng() * 12, wy + 6, 6, chh - 10); } // figure silhouette
        }
      }
    }
    if (b.style === "alley") { // grime + drainpipe
      for (let i = 0; i < 14; i++) { a.fillStyle = "rgba(0,0,0," + (0.1 + rng() * 0.2) + ")"; a.beginPath(); a.ellipse(rng() * b.w, rng() * b.h, 14 + rng() * 30, 8 + rng() * 18, 0, 0, 7); a.fill(); }
      a.fillStyle = "#0a0c12"; a.fillRect(b.w * 0.8, 0, 7, b.h);
    }
  }
  b.tex = c1; b.lit = c2;
}

// ---------------- helpers ----------------
function inOutage(x) {
  const e = G.eventActive("outage");
  return e && x > e.x1 && x < e.x2;
}

const SKY_STOPS = [ // [t, top, mid, horizon]
  [0.0, "#02030a", "#060818", "#10142e"],
  [0.22, "#02030a", "#070a1c", "#141a38"],
  [0.30, "#1a1030", "#4a2048", "#c4544a"],
  [0.42, "#2c4a6e", "#5a7a9e", "#a8b8c8"],
  [0.5, "#3a5a80", "#6e8eb0", "#c0ccd8"],
  [0.62, "#2c4a6e", "#5a7a9e", "#a8b8c8"],
  [0.74, "#241038", "#5e2452", "#e06a4a"],
  [0.82, "#0a0618", "#140e2e", "#30204e"],
  [1.0, "#02030a", "#060818", "#10142e"],
];
function lerpColor(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = ((pa >> 16) + (((pb >> 16) - (pa >> 16)) * t)) | 0;
  const g2 = (((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t)) | 0;
  const bl = ((pa & 255) + (((pb & 255) - (pa & 255)) * t)) | 0;
  return `rgb(${r},${g2},${bl})`;
}
function skyColors(t) {
  for (let i = 0; i < SKY_STOPS.length - 1; i++) {
    const A = SKY_STOPS[i], B = SKY_STOPS[i + 1];
    if (t >= A[0] && t <= B[0]) {
      const k = (t - A[0]) / (B[0] - A[0]);
      return [lerpColor(A[1], B[1], k), lerpColor(A[2], B[2], k), lerpColor(A[3], B[3], k)];
    }
  }
  return [SKY_STOPS[0][1], SKY_STOPS[0][2], SKY_STOPS[0][3]];
}

// ---------------- main render ----------------
G.render = function (dt) {
  const p = G.player, C = G.CFG, now = performance.now() / 1000;
  const vw = innerWidth / scale, vh = innerHeight / scale;

  // camera
  const tx = p.x + p.facing * 60 + p.vx * 0.12, ty = p.y - 60;
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * C.CAM_LERP);
  G.cam.y += (ty - G.cam.y) * Math.min(1, dt * C.CAM_LERP);
  G.cam.x = Math.max(vw / 2, Math.min(C.WORLD_W - vw / 2, G.cam.x));
  G.cam.y = Math.max(vh / 2 - 600, Math.min(C.WORLD_H - vh / 2, G.cam.y));
  G.cam.shake = Math.max(0, G.cam.shake - dt * 14);
  const shx = (Math.random() - 0.5) * G.cam.shake, shy = (Math.random() - 0.5) * G.cam.shake;
  const view = { x: G.cam.x - vw / 2, y: G.cam.y - vh / 2, w: vw, h: vh };

  // ----- sky (screen space) -----
  const [cTop, cMid, cHor] = skyColors(G.time.t);
  const sky = ctx.createLinearGradient(0, 0, 0, innerHeight);
  sky.addColorStop(0, cTop); sky.addColorStop(0.55, cMid); sky.addColorStop(1, cHor);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, innerWidth, innerHeight);

  const night = 1 - G.time.light;
  // stars
  if (night > 0.45) {
    ctx.fillStyle = "#cfe0ff";
    for (const s of stars) {
      const sx = (s.x - view.x * 0.04) % (innerWidth + 100), sy = s.y % (innerHeight * 0.6);
      ctx.globalAlpha = (night - 0.45) * (0.4 + 0.6 * Math.abs(Math.sin(now + s.tw)));
      ctx.fillRect((sx + innerWidth + 100) % (innerWidth + 100) - 50, sy, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  // moon
  if (night > 0.3) {
    const mx = innerWidth * 0.74 - view.x * 0.02, my = innerHeight * 0.16;
    ctx.globalAlpha = (night - 0.3) * 1.2;
    const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 70);
    mg.addColorStop(0, "rgba(220,235,255,0.9)"); mg.addColorStop(0.3, "rgba(200,220,255,0.25)"); mg.addColorStop(1, "rgba(200,220,255,0)");
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, 70, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ----- parallax skylines -----
  const horizonY = (C.STREET_Y - view.y) * scale; // screen y of street
  drawSkyline(far1, 0.12, "#0a0e1c", horizonY, view, night, now, false);
  drawSkyline(far2, 0.28, "#0e1326", horizonY, view, night, now, true);

  // ----- world space -----
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-view.x + shx, -view.y + shy);

  drawUnderground(view, now);
  drawStreet(view, night, now);
  drawBuildings(view, night, now);
  drawInfra(view, night, now);
  drawActivityMarkers(view, now);
  drawItems(view, now);
  if (G.drawProgression) G.drawProgression(ctx, view, now);
  if (G.drawMeta) G.drawMeta(ctx, view, now);
  drawGhostTrain(now);
  G.drawCitizens(ctx, view);
  G.drawPlayer(ctx);
  G.fx.update(dt); G.fx.draw(ctx);
  drawSweep(now);
  ctx.restore();

  // ----- screen-space atmosphere -----
  drawRain(dt, view);
  // fog
  const fog = G.weather.fog + (p.y > C.STREET_Y + 90 ? 0.12 : 0);
  if (fog > 0.02) {
    const fg = ctx.createLinearGradient(0, 0, 0, innerHeight);
    fg.addColorStop(0, `rgba(110,130,165,${fog * 0.25})`);
    fg.addColorStop(0.7, `rgba(90,105,140,${fog * 0.55})`);
    fg.addColorStop(1, `rgba(80,95,130,${fog * 0.7})`);
    ctx.fillStyle = fg; ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
  // night tint
  ctx.fillStyle = `rgba(6,10,30,${night * 0.18})`;
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  // lightning
  if (G.weather.flash > 0.02) {
    ctx.fillStyle = `rgba(220,230,255,${G.weather.flash * 0.55})`;
    ctx.fillRect(0, 0, innerWidth, innerHeight);
  }
  // vignette
  const vg = ctx.createRadialGradient(innerWidth / 2, innerHeight / 2, innerHeight * 0.42, innerWidth / 2, innerHeight / 2, innerHeight * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(2,4,12,0.5)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, innerWidth, innerHeight);
  // fever glow
  if (G.drawFeverOverlay) G.drawFeverOverlay(ctx);
};

function drawSkyline(layer, k, col, horizonY, view, night, now, lit) {
  ctx.fillStyle = col;
  const span = 4400;
  for (const b of layer) {
    const sx = (b.x - view.x * k) % span;
    const x = ((sx + span) % span) - 300;
    if (x > innerWidth + 50) continue;
    const h = b.h * scale * 0.9;
    ctx.fillStyle = col;
    ctx.fillRect(x, horizonY - h, b.w * scale, h + 400);
    if (b.ant) { ctx.fillRect(x + b.w * scale * 0.4, horizonY - h - 36 * scale, 3, 36 * scale); ctx.fillStyle = "rgba(255,60,80," + (0.4 + 0.5 * Math.sin(now * 2 + b.x)) + ")"; ctx.fillRect(x + b.w * scale * 0.4 - 1, horizonY - h - 38 * scale, 5, 4); }
    if (lit && night > 0.3) {
      ctx.fillStyle = b.tint < 0.5 ? "rgba(0,200,255,0.10)" : "rgba(255,60,200,0.08)";
      ctx.fillRect(x, horizonY - h, b.w * scale, h * 0.25);
      ctx.fillStyle = "rgba(255,230,170,0.35)";
      for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 3; wx++)
        if ((((b.x | 0) * 7 + wx * 13 + wy * 31) % 9) < 3) ctx.fillRect(x + 6 + wx * (b.w * scale / 3.4), horizonY - h + 10 + wy * (h / 4.6), 4, 5);
    }
  }
}

function drawUnderground(view, now) {
  const C = G.CFG;
  if (view.y + view.h < C.STREET_Y + 80) return;
  // cavern fill
  ctx.fillStyle = "#070609";
  ctx.fillRect(view.x, C.STREET_Y + 120, view.w, C.WORLD_H - C.STREET_Y);
  // back wall with panel seams
  ctx.fillStyle = "#0d0b10";
  ctx.fillRect(view.x, C.STREET_Y + 120, view.w, C.UNDER_Y - C.STREET_Y - 120);
  ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 2;
  for (let x = Math.floor(view.x / 160) * 160; x < view.x + view.w; x += 160) {
    ctx.beginPath(); ctx.moveTo(x, C.STREET_Y + 120); ctx.lineTo(x, C.UNDER_Y); ctx.stroke();
  }
  // pipes along ceiling
  ctx.fillStyle = "#15121a";
  ctx.fillRect(view.x, C.STREET_Y + 130, view.w, 10);
  ctx.fillRect(view.x, C.STREET_Y + 148, view.w, 6);
  // hazard lights
  for (let x = Math.floor(view.x / 400) * 400; x < view.x + view.w; x += 400) {
    const on = Math.sin(now * 2 + x) > 0;
    ctx.fillStyle = on ? "rgba(255,106,0,0.85)" : "rgba(120,50,0,0.4)";
    ctx.fillRect(x, C.STREET_Y + 170, 8, 8);
    if (on) { const g = ctx.createRadialGradient(x + 4, C.STREET_Y + 174, 2, x + 4, C.STREET_Y + 174, 60); g.addColorStop(0, "rgba(255,106,0,0.25)"); g.addColorStop(1, "rgba(255,106,0,0)"); ctx.fillStyle = g; ctx.fillRect(x - 56, C.STREET_Y + 114, 120, 120); }
  }
  // rails on the floor
  ctx.fillStyle = "#1c1a20";
  ctx.fillRect(view.x, C.UNDER_Y - 8, view.w, 4);
  ctx.fillRect(view.x, C.UNDER_Y - 18, view.w, 3);
}

function drawStreet(view, night, now) {
  const C = G.CFG, SY = C.STREET_Y;
  if (view.y > SY + 200 || view.y + view.h < SY) return;
  // road surface behind (drawn under building line)
  ctx.fillStyle = "#0b0d14";
  ctx.fillRect(view.x, SY, view.w, 120);
  // wet sheen
  const wet = G.weather.wet;
  const sg = ctx.createLinearGradient(0, SY, 0, SY + 60);
  sg.addColorStop(0, `rgba(90,140,200,${0.10 + wet * 0.12})`); sg.addColorStop(1, "rgba(90,140,200,0)");
  ctx.fillStyle = sg; ctx.fillRect(view.x, SY, view.w, 60);
  // lane markings
  ctx.fillStyle = "rgba(255,210,80,0.25)";
  for (let x = Math.floor(view.x / 90) * 90; x < view.x + view.w; x += 90) ctx.fillRect(x, SY + 64, 40, 3);
  // puddle reflections
  for (const pd of puddles) {
    if (pd.x + pd.w < view.x || pd.x > view.x + view.w) continue;
    ctx.globalAlpha = wet * 0.8;
    ctx.fillStyle = "#0e1322";
    ctx.beginPath(); ctx.ellipse(pd.x + pd.w / 2, SY + 14, pd.w / 2, 6, 0, 0, 7); ctx.fill();
    const pg = ctx.createLinearGradient(0, SY + 4, 0, SY + 26);
    const hue = (pd.x % 600) < 300 ? "0,240,255" : "255,43,214";
    pg.addColorStop(0, `rgba(${hue},${0.22 * night + 0.06})`); pg.addColorStop(1, `rgba(${hue},0)`);
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.ellipse(pd.x + pd.w / 2, SY + 14, pd.w / 2 - 6, 5, 0, 0, 7); ctx.fill();
    // rain ripples
    if (G.weather.rainAmt > 0.15 && Math.random() < G.weather.rainAmt * 0.3) {
      ctx.strokeStyle = `rgba(160,200,255,0.35)`; ctx.lineWidth = 1;
      const rx = pd.x + Math.random() * pd.w;
      ctx.beginPath(); ctx.ellipse(rx, SY + 12 + Math.random() * 8, 3 + Math.random() * 6, 1.6, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawBuildings(view, night, now) {
  const SY = G.CFG.STREET_Y;
  for (const b of G.world.buildings) {
    if (b.x + b.w < view.x - 50 || b.x > view.x + view.w + 50) continue;
    if (b.station) { drawStation(b, night, now); continue; }
    if (b.tex) ctx.drawImage(b.tex, b.x, b.y);
    // lit windows (stronger at night, off during outage)
    if (b.lit && !inOutage(b.x + b.w / 2)) {
      ctx.globalAlpha = 0.25 + 0.75 * night;
      ctx.drawImage(b.lit, b.x, b.y);
      ctx.globalAlpha = 1;
    }
    // water tower
    if (b.tower) {
      ctx.fillStyle = "#181420";
      ctx.fillRect(b.tower.x + 8, b.tower.y - 110, 10, 110); ctx.fillRect(b.tower.x + 70, b.tower.y - 110, 10, 110);
      ctx.fillStyle = "#221c2e"; G.rr(ctx, b.tower.x - 8, b.tower.y - 150, 104, 70, 10);
      ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(b.tower.x - 8, b.tower.y - 150, 104, 8);
    }
    if (b.antennaSmall) {
      ctx.strokeStyle = "#2a2436"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(b.antennaSmall, b.y); ctx.lineTo(b.antennaSmall, b.y - 70); ctx.stroke();
      ctx.fillStyle = `rgba(255,60,80,${0.4 + 0.5 * Math.sin(now * 2.4 + b.x)})`;
      ctx.fillRect(b.antennaSmall - 2.4, b.y - 74, 5, 5);
    }
  }
  // generic solids (AC units, dumpsters, crates, bridges, mast, etc.)
  for (const s of G.world.solids) {
    if (s.x + s.w < view.x || s.x > view.x + view.w || s.y > view.y + view.h || s.y + s.h < view.y) continue;
    switch (s.type) {
      case "ac": ctx.fillStyle = "#1d1926"; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fillRect(s.x, s.y, s.w, 4);
        ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1;
        for (let i = 6; i < s.w - 4; i += 7) { ctx.beginPath(); ctx.moveTo(s.x + i, s.y + 8); ctx.lineTo(s.x + i, s.y + s.h - 5); ctx.stroke(); }
        break;
      case "dumpster": ctx.fillStyle = "#1a2a22"; G.rr(ctx, s.x, s.y, s.w, s.h, 4);
        ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.fillRect(s.x, s.y, s.w, 5); break;
      case "crate": ctx.fillStyle = "#2a2418"; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = "rgba(255,179,71,0.25)"; ctx.lineWidth = 1.4; ctx.strokeRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4); break;
      case "vending": {
        ctx.fillStyle = "#141826"; ctx.fillRect(s.x, s.y, s.w, s.h);
        const on = !inOutage(s.x);
        ctx.fillStyle = on ? "rgba(0,240,255,0.5)" : "rgba(0,80,90,0.3)";
        ctx.fillRect(s.x + 6, s.y + 8, s.w - 12, 40);
        ctx.fillStyle = on ? "rgba(255,43,214,0.5)" : "rgba(90,20,70,0.3)";
        ctx.fillRect(s.x + 6, s.y + 54, s.w - 12, 14); break;
      }
      case "bridge": case "antplat":
        ctx.fillStyle = "#1c2030"; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "rgba(0,240,255,0.35)"; ctx.fillRect(s.x, s.y, s.w, 2); break;
      case "mast":
        ctx.fillStyle = "#161420"; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = `rgba(255,43,100,${0.5 + 0.5 * Math.sin(now * 1.2)})`;
        ctx.fillRect(s.x + s.w / 2 - 3, s.y - 8, 6, 6); break;
      case "ugwall": ctx.fillStyle = "#13101a"; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = "rgba(255,106,0,0.2)"; ctx.fillRect(s.x, s.y, s.w, 4); break;
      case "street": ctx.fillStyle = "#10131d"; ctx.fillRect(s.x, s.y, s.w, 14);
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(s.x, s.y, s.w, 2.4); break;
    }
  }
  // closed doors
  for (const d of G.world.doors) {
    if (d.open || d.x + d.w < view.x || d.x > view.x + view.w) continue;
    ctx.fillStyle = "#1a1626"; ctx.fillRect(d.x, d.y, d.w, d.h);
    const pl = 0.5 + 0.5 * Math.sin(now * 3);
    ctx.fillStyle = `rgba(255,60,80,${0.4 + pl * 0.4})`;
    ctx.fillRect(d.x + d.w / 2 - 2, d.y + 10, 4, d.h - 20);
  }
}

function drawStation(b, night, now) {
  const SY = G.CFG.STREET_Y;
  // glass canopy
  ctx.fillStyle = "rgba(80,140,200,0.12)";
  ctx.beginPath(); ctx.moveTo(b.x, b.y + 40); ctx.quadraticCurveTo(b.x + b.w / 2, b.y - 50, b.x + b.w, b.y + 40); ctx.lineTo(b.x + b.w, b.y + 46); ctx.lineTo(b.x, b.y + 46); ctx.fill();
  ctx.fillStyle = "#1c2030"; ctx.fillRect(b.x, b.y, b.w, 40);
  ctx.fillStyle = "rgba(0,240,255,0.3)"; ctx.fillRect(b.x, b.y, b.w, 3);
  // pillars
  ctx.fillStyle = "#171b2a"; ctx.fillRect(b.x + 20, b.y + 40, 40, b.h - 40); ctx.fillRect(b.x + b.w - 60, b.y + 40, 40, b.h - 40);
  // interior glow
  const ig = ctx.createLinearGradient(0, b.y + 40, 0, SY);
  ig.addColorStop(0, "rgba(120,200,255,0.10)"); ig.addColorStop(1, "rgba(120,200,255,0.02)");
  ctx.fillStyle = ig; ctx.fillRect(b.x + 60, b.y + 40, b.w - 120, b.h - 40);
  // sign
  ctx.font = "bold 26px monospace"; ctx.fillStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 12;
  ctx.fillText("TRANSIT ⬡ PLAZA", b.x + b.w / 2 - 115, b.y + 28);
  ctx.shadowBlur = 0;
}

function drawInfra(view, night, now) {
  // one-way platforms
  for (const o of G.world.oneways) {
    if (o.x + o.w < view.x || o.x > view.x + view.w || o.y > view.y + view.h + 30 || o.y < view.y - 30) continue;
    switch (o.type) {
      case "escape":
        ctx.fillStyle = "#1e1a28"; ctx.fillRect(o.x, o.y, o.w, 6);
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
        for (let i = 4; i < o.w; i += 9) { ctx.beginPath(); ctx.moveTo(o.x + i, o.y); ctx.lineTo(o.x + i, o.y + 6); ctx.stroke(); }
        ctx.strokeStyle = "#1e1a28"; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(o.x + 3, o.y); ctx.lineTo(o.x + 3, o.y - 26); ctx.moveTo(o.x + o.w - 3, o.y); ctx.lineTo(o.x + o.w - 3, o.y - 26);
        ctx.moveTo(o.x, o.y - 26); ctx.lineTo(o.x + o.w, o.y - 26); ctx.stroke();
        break;
      case "washer":
        ctx.fillStyle = "#1c2233"; ctx.fillRect(o.x, o.y, o.w, 7);
        ctx.strokeStyle = "rgba(150,180,220,0.25)"; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(o.x + 6, o.y); ctx.lineTo(o.x + 6, o.y - 60); ctx.moveTo(o.x + o.w - 6, o.y); ctx.lineTo(o.x + o.w - 6, o.y - 60); ctx.stroke();
        break;
      case "awning": {
        ctx.fillStyle = "rgba(255,43,214,0.45)";
        ctx.beginPath(); ctx.moveTo(o.x, o.y + 8); ctx.lineTo(o.x + o.w / 2, o.y - 2); ctx.lineTo(o.x + o.w, o.y + 8); ctx.fill(); break;
      }
      case "balcony": ctx.fillStyle = "#1d2130"; ctx.fillRect(o.x, o.y, o.w, 6);
        ctx.fillStyle = "rgba(0,240,255,0.25)"; ctx.fillRect(o.x, o.y, o.w, 2); break;
      case "platform": ctx.fillStyle = "#221c2e"; ctx.fillRect(o.x, o.y, o.w, 8); break;
      case "ugplat": ctx.fillStyle = "#1a1622"; ctx.fillRect(o.x, o.y, o.w, 8);
        ctx.fillStyle = "rgba(255,106,0,0.3)"; ctx.fillRect(o.x, o.y, o.w, 2); break;
    }
  }
  // wires (with sag visual)
  ctx.lineWidth = 2;
  for (const w of G.world.wires) {
    if (w.x2 < view.x || w.x1 > view.x + view.w) continue;
    ctx.strokeStyle = "rgba(140,160,190,0.5)";
    ctx.beginPath(); ctx.moveTo(w.x1, w.y);
    ctx.quadraticCurveTo((w.x1 + w.x2) / 2, w.y + 14, w.x2, w.y); ctx.stroke();
  }
  // ladders & pipes
  for (const l of G.world.ladders) {
    if (l.x + 30 < view.x || l.x > view.x + view.w || l.y > view.y + view.h || l.y + l.h < view.y) continue;
    if (l.type === "pipe") {
      ctx.fillStyle = "#241e30"; ctx.fillRect(l.x + 8, l.y, 10, l.h);
      ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fillRect(l.x + 9, l.y, 3, l.h);
      for (let y = l.y + 30; y < l.y + l.h; y += 120) { ctx.fillStyle = "#2c2438"; ctx.fillRect(l.x + 4, y, 18, 8); }
    } else {
      ctx.strokeStyle = "#3a3344"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(l.x + 4, l.y); ctx.lineTo(l.x + 4, l.y + l.h);
      ctx.moveTo(l.x + 22, l.y); ctx.lineTo(l.x + 22, l.y + l.h); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "#322c3e";
      for (let y = l.y + 8; y < l.y + l.h; y += 22) { ctx.beginPath(); ctx.moveTo(l.x + 4, y); ctx.lineTo(l.x + 22, y); ctx.stroke(); }
    }
  }
  // ziplines
  for (const z of G.world.ziplines) {
    if (Math.max(z.x1, z.x2) < view.x || Math.min(z.x1, z.x2) > view.x + view.w) continue;
    ctx.strokeStyle = "rgba(0,240,255,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(z.x1, z.y1); ctx.lineTo(z.x2, z.y2); ctx.stroke();
    const t = (now * 0.4) % 1, gx = z.x1 + (z.x2 - z.x1) * t, gy = z.y1 + (z.y2 - z.y1) * t;
    ctx.fillStyle = "rgba(0,240,255,0.7)"; ctx.fillRect(gx - 2, gy - 2, 4, 4);
    ctx.fillStyle = "#2a2436"; ctx.fillRect(z.x1 - 4, z.y1 - 6, 8, 8); ctx.fillRect(z.x2 - 4, z.y2 - 6, 8, 8);
  }
  // beams (grav-lifts)
  for (const b of G.world.beams) {
    if (!b.on || b.x + b.w < view.x || b.x > view.x + view.w) continue;
    const bg = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
    bg.addColorStop(0, "rgba(0,240,255,0)"); bg.addColorStop(0.5, `rgba(0,240,255,${0.18 + 0.08 * Math.sin(now * 5)})`); bg.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = bg; ctx.fillRect(b.x, b.y, b.w, b.h);
    for (let y = b.y + ((now * 160) % 60); y < b.y + b.h; y += 60) {
      ctx.fillStyle = "rgba(180,250,255,0.5)"; ctx.fillRect(b.x + 8, y, b.w - 16, 2);
    }
  }
  drawProps(view, night, now);
  drawSigns(view, night, now);
}

function drawProps(view, night, now) {
  const SY = G.CFG.STREET_Y;
  for (const pr of G.world.props) {
    if (pr.x < view.x - 300 || pr.x > view.x + view.w + 300) continue;
    const y = pr.y || SY;
    switch (pr.type) {
      case "stall": {
        ctx.fillStyle = "#1c1626"; ctx.fillRect(pr.x - 55, y - 120, 110, 120);
        ctx.fillStyle = pr.color; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(pr.x - 62, y - 120); ctx.lineTo(pr.x - 49, y - 138); ctx.lineTo(pr.x + 49, y - 138); ctx.lineTo(pr.x + 62, y - 120); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,220,160,0.25)"; ctx.fillRect(pr.x - 48, y - 112, 96, 60);
        ctx.font = "11px monospace"; ctx.fillStyle = pr.color;
        ctx.shadowColor = pr.color; ctx.shadowBlur = 8;
        ctx.fillText(pr.name, pr.x - ctx.measureText(pr.name).width / 2, y - 124);
        ctx.shadowBlur = 0;
        // steam
        if (G.fx && Math.random() < 0.05) G.fx.add({ x: pr.x + (Math.random() - 0.5) * 60, y: y - 120, vx: 0, vy: -30, life: 1.4, type: "dust", size: 5 });
        break;
      }
      case "lamp": {
        ctx.fillStyle = "#1a1722"; ctx.fillRect(pr.x - 3, y - 150, 6, 150);
        ctx.fillRect(pr.x - 16, y - 150, 32, 5);
        const on = !inOutage(pr.x) && night > 0.2;
        ctx.fillStyle = on ? "rgba(255,230,170,0.9)" : "#332e26";
        ctx.fillRect(pr.x - 12, y - 145, 8, 4); ctx.fillRect(pr.x + 4, y - 145, 8, 4);
        if (on) {
          const g = ctx.createRadialGradient(pr.x, y - 100, 10, pr.x, y - 60, 130);
          g.addColorStop(0, "rgba(255,225,160,0.13)"); g.addColorStop(1, "rgba(255,225,160,0)");
          ctx.fillStyle = g; ctx.fillRect(pr.x - 130, y - 200, 260, 210);
        }
        break;
      }
      case "bench": ctx.fillStyle = "#1c1826"; ctx.fillRect(pr.x - 30, y - 18, 60, 5); ctx.fillRect(pr.x - 26, y - 13, 5, 13); ctx.fillRect(pr.x + 21, y - 13, 5, 13); break;
      case "graffiti": {
        ctx.font = "bold 22px monospace";
        const txts = ["WHO IS PAWPAW?", "线9 LIVES", "THE AI SCATTERED ↯"];
        ctx.fillStyle = ["rgba(255,43,214,0.5)", "rgba(170,255,0,0.45)", "rgba(0,240,255,0.45)"][pr.v];
        ctx.save(); ctx.translate(pr.x, y - 60); ctx.rotate(-0.06);
        ctx.fillText(txts[pr.v], 0, 0); ctx.restore(); break;
      }
      case "shrine": {
        const lv = G.state.shrine.level || 0;
        ctx.fillStyle = "#231c30"; G.rr(ctx, pr.x - 28 - lv * 4, pr.y - 44 - lv * 3, 56 + lv * 8, 44 + lv * 3, 5);
        if (lv > 0) {
          ctx.strokeStyle = `rgba(255,225,77,${0.25 + lv * 0.08})`; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.arc(pr.x, pr.y - 24, 38 + lv * 7 + Math.sin(now * 2) * 2, 0, 7); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,179,71,0.9)";
        ctx.font = "20px monospace"; ctx.fillText("🐾", pr.x - 11, pr.y - 14);
        for (let i = 0; i < 3 + lv; i++) {
          const fl = 0.5 + 0.4 * Math.sin(now * 3 + i * 2);
          ctx.fillStyle = `rgba(255,200,90,${fl})`;
          ctx.fillRect(pr.x - 24 + i * 12, pr.y - 4, 3, 4);
        }
        if (G.state.shrine.decor.lanterns) {
          ctx.strokeStyle = "rgba(255,220,150,0.35)";
          ctx.beginPath(); ctx.moveTo(pr.x - 70, pr.y - 58); ctx.quadraticCurveTo(pr.x, pr.y - 76, pr.x + 70, pr.y - 58); ctx.stroke();
        }
        G.KITTENS.forEach((k, i) => {
          if (!G.state.kittens[k.id]) return;
          const ox = -74 + (i % 4) * 48, oy = i < 4 ? 12 : 34;
          G.drawKitten(ctx, pr.x + ox, pr.y + oy, k.c, now + i, false);
        });
        break;
      }
      case "garden": {
        for (let i = 0; i < 6; i++) {
          const gx = pr.x - 90 + i * 36;
          ctx.fillStyle = "#2a2118"; ctx.fillRect(gx, pr.y - 14, 26, 14);
          ctx.fillStyle = ["#3f7d46", "#52a05a", "#3a7050"][i % 3];
          ctx.beginPath(); ctx.ellipse(gx + 13, pr.y - 20, 12, 9 + Math.sin(now + i) * 1.5, 0, 0, 7); ctx.fill();
          if (i % 2) { ctx.fillStyle = "#e05a4a"; ctx.fillRect(gx + 10, pr.y - 24, 4, 4); }
        }
        // string lights
        ctx.strokeStyle = "rgba(255,220,150,0.3)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pr.x - 100, pr.y - 60); ctx.quadraticCurveTo(pr.x, pr.y - 40, pr.x + 100, pr.y - 60); ctx.stroke();
        for (let i = 0; i < 7; i++) {
          const lx = pr.x - 90 + i * 30, ly = pr.y - 57 + Math.sin(i / 6 * Math.PI) * 16;
          ctx.fillStyle = `rgba(255,225,150,${0.6 + 0.3 * Math.sin(now * 2 + i)})`;
          ctx.fillRect(lx, ly, 3.4, 3.4);
        }
        break;
      }
      case "arcade": {
        for (let i = 0; i < 4; i++) {
          const ax = pr.x - 80 + i * 44;
          ctx.fillStyle = "#16121e"; ctx.fillRect(ax, pr.y - 64, 34, 64);
          const alive = i === 2;
          ctx.fillStyle = alive ? `rgba(0,240,255,${0.4 + 0.3 * Math.sin(now * 7)})` : "rgba(40,50,70,0.5)";
          ctx.fillRect(ax + 5, pr.y - 56, 24, 18);
        }
        ctx.fillStyle = "rgba(40,80,120,0.25)";
        ctx.fillRect(pr.x - 90, pr.y - 4, 180, 4); // shallow water
        break;
      }
      case "line9": {
        ctx.fillStyle = "#141220"; ctx.fillRect(pr.x - 160, pr.y - 110, 320, 12);
        ctx.fillStyle = "#0f0d18"; ctx.fillRect(pr.x - 150, pr.y - 98, 14, 98); ctx.fillRect(pr.x + 136, pr.y - 98, 14, 98);
        ctx.font = "bold 16px monospace";
        ctx.fillStyle = `rgba(255,106,0,${0.55 + 0.3 * Math.sin(now * 1.5)})`;
        ctx.shadowColor = "#ff6a00"; ctx.shadowBlur = 10;
        ctx.fillText("LINE ⑨", pr.x - 28, pr.y - 86);
        ctx.shadowBlur = 0;
        break;
      }
      case "denprops": {
        for (let i = 0; i < 3; i++) {
          const dx = pr.x - 60 + i * 56;
          ctx.fillStyle = "#10141f"; ctx.fillRect(dx, pr.y - 46, 40, 46);
          ctx.fillStyle = `rgba(${i % 2 ? "170,255,0" : "0,240,255"},${0.35 + 0.25 * Math.sin(now * 4 + i * 2)})`;
          ctx.fillRect(dx + 4, pr.y - 40, 32, 20);
        }
        break;
      }
      case "antfarm": {
        for (let i = 0; i < 3; i++) {
          const ax = pr.x - 40 + i * 40;
          ctx.strokeStyle = "#241f2e"; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(ax, pr.y); ctx.lineTo(ax, pr.y - 90 - i * 25); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(ax - 12, pr.y - 60 - i * 20); ctx.lineTo(ax + 12, pr.y - 60 - i * 20); ctx.stroke();
          ctx.fillStyle = `rgba(255,60,80,${0.4 + 0.5 * Math.sin(now * 2 + i * 1.4)})`;
          ctx.fillRect(ax - 2, pr.y - 94 - i * 25, 4, 4);
        }
        break;
      }
    }
  }
}

function drawSigns(view, night, now) {
  const glitch = G.eventActive("glitch");
  const bright = 0.55 + 0.45 * night;
  for (const s of G.world.signs) {
    if (s.x < view.x - 200 || s.x > view.x + view.w + 200) continue;
    if (inOutage(s.x)) continue;
    let alpha = bright * (s.fl > 0.8 ? (Math.sin(now * 11 + s.fl * 40) > -0.6 ? 1 : 0.25) : 1);
    if (glitch && Math.random() < 0.25) alpha *= Math.random();
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color; ctx.shadowColor = s.color; ctx.shadowBlur = 14;
    if (s.vertical) {
      ctx.font = "bold 17px monospace";
      const chars = [...s.text];
      chars.forEach((ch, i) => ctx.fillText(ch, s.x + (glitch ? (Math.random() - 0.5) * 4 : 0), s.y + i * 20));
      ctx.shadowBlur = 0;
      ctx.strokeStyle = s.color; ctx.globalAlpha = alpha * 0.5; ctx.lineWidth = 1.4;
      ctx.strokeRect(s.x - 6, s.y - 16, 26, chars.length * 20 + 8);
    } else {
      ctx.font = s.corp ? "bold 24px monospace" : "bold 15px monospace";
      ctx.fillText(s.text, s.x - ctx.measureText(s.text).width / 2, s.y);
    }
    ctx.restore();
  }
  // mega billboard
  const m = G.world.megaSign;
  if (m && m.x + m.w > view.x && m.x < view.x + view.w) {
    ctx.fillStyle = "#0c0a14"; ctx.fillRect(m.x, m.y, m.w, m.h);
    ctx.strokeStyle = "#241f30"; ctx.lineWidth = 4; ctx.strokeRect(m.x, m.y, m.w, m.h);
    ctx.fillStyle = "#1a1626"; ctx.fillRect(m.x + m.w / 2 - 6, m.y + m.h, 12, 250);
    if (m.on) {
      const hue = (now * 30) % 360;
      const gg = ctx.createLinearGradient(m.x, m.y, m.x + m.w, m.y + m.h);
      gg.addColorStop(0, `hsla(${hue},90%,55%,0.25)`); gg.addColorStop(1, `hsla(${(hue + 90) % 360},90%,55%,0.25)`);
      ctx.fillStyle = gg; ctx.fillRect(m.x + 4, m.y + 4, m.w - 8, m.h - 8);
      ctx.font = "bold 30px monospace"; ctx.fillStyle = "#fff";
      ctx.shadowColor = "#ff2bd6"; ctx.shadowBlur = 18;
      ctx.fillText("PAWPAW ♥ CITY", m.x + 40, m.y + m.h / 2 + 10);
      ctx.shadowBlur = 0;
    } else if (Math.random() < 0.02 && G.fx) G.fx.spark(m.x + Math.random() * m.w, m.y + m.h, 2);
  }
  // holograms
  for (const h of G.world.holos) {
    if (h.x < view.x - 100 || h.x > view.x + view.w + 100) continue;
    if (inOutage(h.x)) continue;
    const ph = now + h.ph, fl = glitch ? 0.3 + Math.random() * 0.7 : 1;
    ctx.save(); ctx.translate(h.x, h.y + Math.sin(ph) * 8);
    ctx.globalAlpha = (0.35 + 0.25 * night) * fl;
    ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 2;
    if (h.type === "ring") {
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 26 + i * 12, (26 + i * 12) * Math.abs(Math.sin(ph * 0.7 + i)), 0, 0, 7); ctx.stroke(); }
    } else if (h.type === "diamond") {
      ctx.rotate(ph * 0.8);
      ctx.strokeStyle = "#ff2bd6";
      ctx.strokeRect(-18, -18, 36, 36);
      ctx.rotate(0.78); ctx.strokeRect(-13, -13, 26, 26);
    } else { // cat hologram
      ctx.strokeStyle = "#aaff00";
      ctx.beginPath(); ctx.ellipse(0, 6, 20, 11, 0, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(16, -6, 9, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(10, -11); ctx.lineTo(12, -19); ctx.lineTo(17, -13); ctx.moveTo(19, -13); ctx.lineTo(23, -19); ctx.lineTo(24, -11); ctx.stroke();
    }
    // beam under hologram
    ctx.globalAlpha *= 0.4;
    const bg = ctx.createLinearGradient(0, 0, 0, 120);
    bg.addColorStop(0, "rgba(0,240,255,0.5)"); bg.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(-5, 20); ctx.lineTo(5, 20); ctx.lineTo(16, 120); ctx.lineTo(-16, 120); ctx.fill();
    ctx.restore();
  }
}

function drawActivityMarkers(view, now) {
  // teleport nodes
  for (const tp of G.world.teleports) {
    if (tp.x < view.x - 120 || tp.x > view.x + view.w + 120) continue;
    const un = G.state.tpUnlocked[tp.id], col = un ? "#00f0ff" : "#3a5566";
    const y = tp.y - 34 + Math.sin(now * 1.6 + tp.x) * 5;
    ctx.save(); ctx.translate(tp.x, y);
    ctx.strokeStyle = col; ctx.lineWidth = 2.4;
    ctx.globalAlpha = un ? 0.9 : 0.5;
    ctx.beginPath(); ctx.ellipse(0, 14, 30, 8 * Math.abs(Math.sin(now * 1.2)) + 3, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 14, 18, 5 * Math.abs(Math.sin(now * 1.2 + 1)) + 2, 0, 0, 7); ctx.stroke();
    if (un) {
      ctx.shadowColor = col; ctx.shadowBlur = 12;
      ctx.fillStyle = col; ctx.font = "16px monospace"; ctx.fillText("⬡", -7, 0);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // terminals
  for (const t of G.terminals) {
    if (t.x < view.x - 60 || t.x > view.x + view.w + 60) continue;
    ctx.fillStyle = "#141826"; ctx.fillRect(t.x - 12, t.y - 44, 24, 44);
    const col = t.hacked ? "#aaff00" : "#ff3355";
    ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.fillRect(t.x - 8, t.y - 38, 16, 12);
    ctx.shadowBlur = 0;
  }
  // race rings
  for (const r of G.races.list) {
    if (r.start.x > view.x - 100 && r.start.x < view.x + view.w + 100) {
      const col = r.done ? "#aaff00" : "#ffb347";
      ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6 + 0.3 * Math.sin(now * 3);
      ctx.beginPath(); ctx.arc(r.start.x, r.start.y - 40, 26, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.font = "13px monospace"; ctx.fillStyle = col;
      ctx.fillText("🏁", r.start.x - 8, r.start.y - 35);
    }
  }
  const R = G.races.active;
  if (R) {
    R.race.checks.forEach((c, i) => {
      if (i < R.idx) return;
      const next = i === R.idx;
      ctx.strokeStyle = next ? "#aaff00" : "rgba(255,179,71,0.35)";
      ctx.lineWidth = next ? 4 : 2;
      const rr2 = next ? 30 + Math.sin(now * 6) * 5 : 24;
      ctx.beginPath(); ctx.arc(c[0], c[1] - 20, rr2, 0, 7); ctx.stroke();
      if (next) { // guide line column
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "#aaff00"; ctx.fillRect(c[0] - 2, c[1] - 320, 4, 300);
        ctx.globalAlpha = 1;
      }
    });
  }
  // deliveries
  for (const d of G.deliveries) {
    if (d.state === 0 && d.pickup.x > view.x - 60 && d.pickup.x < view.x + view.w + 60) {
      const y = d.pickup.y - 26 + Math.sin(now * 2) * 4;
      ctx.fillStyle = "#3a3424"; ctx.fillRect(d.pickup.x - 12, y - 12, 24, 20);
      ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 1.6; ctx.strokeRect(d.pickup.x - 12, y - 12, 24, 20);
      ctx.fillStyle = "#ffb347"; ctx.font = "16px monospace";
      ctx.fillText("!", d.pickup.x - 3, y - 20);
    }
    if (d.state === 1 && d.drop.x > view.x - 60 && d.drop.x < view.x + view.w + 60) {
      const y = d.drop.y - 70 + Math.sin(now * 3) * 6;
      ctx.fillStyle = "#aaff00"; ctx.shadowColor = "#aaff00"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(d.drop.x, y + 14); ctx.lineTo(d.drop.x - 9, y); ctx.lineTo(d.drop.x + 9, y); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

function drawItems(view, now) {
  for (const it of G.items) {
    if (it.taken || it.x < view.x - 40 || it.x > view.x + view.w + 40 || it.y < view.y - 40 || it.y > view.y + view.h + 40) continue;
    const y = it.y + Math.sin(now * 2.4 + it.ph) * 5;
    ctx.save(); ctx.translate(it.x, y);
    if (it.type === "food") {
      ctx.fillStyle = "rgba(255,179,71,0.9)"; ctx.shadowColor = "#ffb347"; ctx.shadowBlur = 8;
      ctx.rotate(now + it.ph);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillRect(-2, -2, 4, 4);
    } else if (it.type === "chip") {
      ctx.fillStyle = "#00f0ff"; ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 12;
      ctx.fillRect(-7, -9, 14, 18);
      ctx.shadowBlur = 0; ctx.fillStyle = "#04121a";
      ctx.fillRect(-4, -6, 8, 5); ctx.fillRect(-4, 1, 8, 2);
    } else if (it.type === "mem") {
      ctx.rotate(0.78);
      ctx.fillStyle = "rgba(255,43,214,0.85)"; ctx.shadowColor = "#ff2bd6"; ctx.shadowBlur = 14;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.shadowBlur = 0; ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(-3, -3, 6, 6);
    } else if (it.type === "art") {
      ctx.fillStyle = "#aaff00"; ctx.shadowColor = "#aaff00"; ctx.shadowBlur = 14;
      star(ctx, 0, 0, 5, 10, 4.6); ctx.fill();
      ctx.shadowBlur = 0;
    } else if (it.type === "key") {
      ctx.fillStyle = "#ffe14d"; ctx.shadowColor = "#ffe14d"; ctx.shadowBlur = 14;
      ctx.fillRect(-9, -3, 16, 6); ctx.fillRect(5, -8, 5, 5); ctx.fillRect(5, 3, 5, 5);
      ctx.beginPath(); ctx.arc(-10, 0, 6, 0, 7); ctx.strokeStyle = "#ffe14d"; ctx.lineWidth = 3; ctx.stroke();
      ctx.shadowBlur = 0;
    } else { // legendary
      const pl = 1 + Math.sin(now * 4) * 0.25;
      ctx.scale(pl, pl);
      ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#ff2bd6"; ctx.shadowBlur = 22;
      star(ctx, 0, 0, 6, 13, 6); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
}

function star(c, x, y, n, R, r) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2, rad = i % 2 === 0 ? R : r;
    c[i === 0 ? "moveTo" : "lineTo"](x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  c.closePath();
}

function drawGhostTrain(now) {
  const e = G.eventActive("ghosttrain");
  if (!e) return;
  const x = -500 + (e.t / e.dur) * (G.CFG.WORLD_W + 1200);
  const y = G.CFG.UNDER_Y - 44;
  ctx.save();
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 4; i++) {
    const cx = x - i * 130;
    ctx.fillStyle = "#0e1018"; G.rr(ctx, cx, y, 120, 44, 8);
    ctx.fillStyle = "rgba(150,230,255,0.5)";
    for (let wx = 10; wx < 110; wx += 24) ctx.fillRect(cx + wx, y + 10, 14, 12);
  }
  ctx.fillStyle = "rgba(0,240,255,0.5)";
  ctx.fillRect(x + 116, y + 14, 10, 8);
  ctx.globalAlpha = 0.25; ctx.fillStyle = "#7adfff";
  ctx.fillRect(x - 520 - 60, y + 6, 540, 30);
  ctx.restore();
  if (G.player.y > G.CFG.STREET_Y + 90) G.cam.shake = Math.max(G.cam.shake, 2);
}

function drawSweep(now) {
  const e = G.eventActive("sweep");
  if (!e) return;
  const x = e.x + Math.sin(e.t * 0.8) * 500;
  ctx.save();
  ctx.translate(x, 300); ctx.rotate(Math.sin(e.t * 1.3) * 0.3);
  const g = ctx.createLinearGradient(0, 0, 0, 2600);
  g.addColorStop(0, "rgba(255,255,230,0.16)"); g.addColorStop(1, "rgba(255,255,230,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(-260, 2600); ctx.lineTo(260, 2600); ctx.lineTo(20, 0); ctx.fill();
  ctx.restore();
}

let rainPool = [];
function drawRain(dt, view) {
  const amt = G.weather.rainAmt;
  if (G.player.y > G.CFG.STREET_Y + 90) return; // dry underground
  const want = Math.floor(amt * 130);
  while (rainPool.length < want) rainPool.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, v: 700 + Math.random() * 500, l: 10 + Math.random() * 14 });
  if (rainPool.length > want) rainPool.length = want;
  if (!want) return;
  const slant = G.weather.cur === "storm" ? 0.35 : 0.12;
  ctx.strokeStyle = "rgba(160,190,230,0.32)"; ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (const d of rainPool) {
    d.y += d.v * dt; d.x += d.v * slant * dt;
    if (d.y > innerHeight) { d.y = -20; d.x = Math.random() * innerWidth; }
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.l * slant * 2, d.y - d.l);
  }
  ctx.stroke();
}
