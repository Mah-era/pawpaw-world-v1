// ============ PAWPAW WORLD — PLAYER (PAWPAW THE CYBER-CAT) ============
"use strict";

G.initPlayer = function (x, y) {
  G.player = {
    x: x || 4600, y: y || G.CFG.STREET_Y - 30,
    w: 44, h: 28, vx: 0, vy: 0,
    onGround: false, groundType: null, facing: 1,
    coyote: 0, jumpBuf: 0, dropT: 0,
    canDjump: true, wallDir: 0, wallRunT: 0, wallRunning: false,
    dashT: 0, dashCd: 0, slideT: 0,
    hanging: null, climbing: null, zip: null, zipCd: 0,
    idleT: 0, legT: 0, tailT: 0, landPop: 0, airT: 0, gliding: false,
    speedTier: 0, // 0 idle 1 walk 2 run 3 sprint
  };
};

G.updatePlayer = function (dt) {
  const p = G.player, C = G.CFG, k = G.keys;
  p.tailT += dt;
  if (G.state.modal || G.state.photoMode) { p.idleT += dt; return; }

  // ---- timers ----
  p.coyote -= dt; p.jumpBuf -= dt; p.dropT -= dt; p.dashCd -= dt; p.zipCd -= dt;
  if (k.jumpP) { p.jumpBuf = C.JUMP_BUFFER; k.jumpP = false; }

  const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
  if (dir !== 0 && !p.hanging) p.facing = dir;
  const moving = dir !== 0;
  if (moving || !p.onGround || p.climbing || p.zip) p.idleT = 0; else p.idleT += dt;

  // ================= ZIPLINE =================
  if (p.zip) {
    const z = p.zip.line, len = Math.hypot(z.x2 - z.x1, z.y2 - z.y1);
    p.zip.t += (520 / len) * dt;
    p.x = z.x1 + (z.x2 - z.x1) * p.zip.t;
    p.y = z.y1 + (z.y2 - z.y1) * p.zip.t + 26;
    p.facing = z.x2 > z.x1 ? 1 : -1;
    p.vx = (z.x2 - z.x1) / len * 520; p.vy = (z.y2 - z.y1) / len * 520;
    if (G.fx) G.fx.spark(p.x, p.y - 26, 1);
    if (p.jumpBuf > 0) { p.jumpBuf = 0; p.vy = C.JUMP_V * 0.75; p.zip = null; p.zipCd = 0.4; G.audio.blip(620); return; }
    if (p.zip && p.zip.t >= 1) { p.zip = null; p.zipCd = 0.4; }
    return;
  }

  // distance + airtime stats
  G.state.stats.dist += Math.abs(p.vx) * dt;
  p.airT = p.onGround || p.climbing || p.hanging ? 0 : p.airT + dt;

  // ================= LADDER / PIPE CLIMB =================
  if (p.climbing) {
    const l = p.climbing;
    p.vx = 0; p.vy = 0;
    if (k.up) p.y -= C.CLIMB * dt;
    if (k.down) p.y += C.CLIMB * dt;
    p.x += (l.x + 13 - p.x) * Math.min(1, dt * 12);
    p.canDjump = true; p.legT += dt * (k.up || k.down ? 6 : 0);
    if (p.y < l.y - 6) { p.y = l.y - 18; p.climbing = null; p.vy = -240; } // top exit
    if (p.y > l.y + l.h) { p.climbing = null; }
    if (p.jumpBuf > 0) { p.jumpBuf = 0; p.climbing = null; p.vy = C.JUMP_V * 0.72; p.vx = dir * 220; G.audio.blip(520); }
    return;
  }

  // ================= LEDGE HANG =================
  if (p.hanging) {
    p.vx = 0; p.vy = 0; p.canDjump = true;
    if (k.up || p.jumpBuf > 0) { // climb up
      p.jumpBuf = 0;
      p.x = p.hanging.side < 0 ? p.hanging.rect.x + 20 : p.hanging.rect.x + p.hanging.rect.w - 20;
      p.y = p.hanging.rect.y - p.h / 2 - 2;
      p.vy = -260; p.hanging = null;
      if (G.fx) G.fx.dust(p.x, p.y + p.h / 2, 4);
      if (G.flow) G.flow.add("climb", 10);
      G.audio.blip(480);
    } else if (k.down) { p.hanging = null; p.vy = 60; }
    return;
  }

  // ================= DASH =================
  if (p.dashT > 0) {
    p.dashT -= dt;
    if (G.fx) G.fx.trail(p.x, p.y, p.facing);
    moveAndCollide(p, dt);
    if (p.dashT <= 0) { p.vx *= 0.4; p.vy *= 0.4; }
    return;
  }
  if (k.dashP) {
    k.dashP = false;
    if (G.state.abilities.dash && p.dashCd <= 0) {
      let dx = dir, dy = (k.up ? -1 : 0) + (k.down ? 1 : 0);
      if (!dx && !dy) dx = p.facing;
      const m = Math.hypot(dx, dy) || 1;
      p.vx = (dx / m) * C.DASH_V; p.vy = (dy / m) * C.DASH_V * 0.85;
      p.dashT = C.DASH_T;
      p.dashCd = C.DASH_CD * (G.state.upgrades.phase ? 0.6 : 1);
      p.slideT = 0;
      G.state.stats.dashes++;
      if (G.flow) G.flow.add("dash", 8);
      G.audio.dash(); G.cam.shake = Math.max(G.cam.shake, 3);
      if (G.state.style.afterimage && G.fx) G.fx.trail(p.x - p.facing * 8, p.y, p.facing);
      return;
    }
  }

  // ================= HORIZONTAL =================
  const sprint = k.sprint && moving;
  const spdMul = (G.state.upgrades.turbo ? 1.12 : 1) * (G.state.buffT > 0 ? 1.25 : 1);
  let target = 0;
  if (moving) target = dir * (sprint ? C.SPRINT : (k.walk ? C.WALK : C.RUN)) * spdMul;
  p.speedTier = !moving ? 0 : sprint ? 3 : k.walk ? 1 : 2;
  // neon trail cosmetic
  if (G.state.style.trail && sprint && p.onGround && G.fx && Math.random() < 0.55)
    G.fx.add({ x: p.x - p.facing * 14, y: p.y + 12, vx: -p.facing * 30, vy: -16, life: 0.45, type: "burst", color: G.state.style.trailColor || "#00f0ff", size: 2.4 });
  if (G.state.style.pawsteps && sprint && p.onGround && G.fx && Math.random() < 0.24)
    G.fx.add({ x: p.x - p.facing * 20, y: p.y + 16, vx: -p.facing * 8, vy: -8, life: 0.55, type: "paw", color: G.state.style.collar, size: 6 });

  // slide
  if (p.slideT > 0) {
    p.slideT -= dt;
    p.vx = p.facing * C.SPRINT * (0.8 + 0.5 * (p.slideT / C.SLIDE_T));
    if (G.fx && Math.random() < 0.5) G.fx.dust(p.x - p.facing * 16, p.y + p.h / 2, 1);
  } else if (k.down && sprint && p.onGround && Math.abs(p.vx) > C.RUN) {
    p.slideT = C.SLIDE_T;
    if (G.flow) G.flow.add("slide", 6);
    G.audio.blip(300);
  } else {
    const accel = p.onGround ? 2400 : 1500;
    if (target > p.vx) p.vx = Math.min(target, p.vx + accel * dt);
    else if (target < p.vx) p.vx = Math.max(target, p.vx - accel * dt);
    if (!moving && p.onGround) p.vx *= Math.pow(0.0001, dt); // friction
  }

  // ================= WALL INTERACTIONS =================
  const pushingWall = p.wallDir !== 0 && dir === p.wallDir && !p.onGround;
  if (pushingWall && G.state.abilities.wallrun && p.wallRunT < 0.35 && p.vy > -120) {
    if (!p.wallRunning && G.flow) G.flow.add("wallrun", 12);
    p.wallRunning = true; p.wallRunT += dt; p.vy = -440 * (1 - p.wallRunT * 1.6);
    if (G.fx && Math.random() < 0.6) G.fx.dust(p.x + p.wallDir * p.w / 2, p.y, 1);
  } else {
    p.wallRunning = false;
    if (pushingWall && p.vy > C.WALL_SLIDE) p.vy = C.WALL_SLIDE; // wall slide
  }
  if (p.onGround) p.wallRunT = 0;

  // ================= JUMP =================
  const jMul = G.state.upgrades.coil ? 1.08 : 1;
  if (p.jumpBuf > 0) {
    if (p.onGround || p.coyote > 0) {
      p.vy = C.JUMP_V * jMul; p.jumpBuf = 0; p.coyote = 0; p.onGround = false;
      G.state.stats.jumps++;
      if (G.fx) G.fx.dust(p.x, p.y + p.h / 2, 5);
      if (G.state.style.sparkle && G.fx) G.fx.burst(p.x, p.y + p.h / 2, G.state.style.collar, 10);
      G.audio.blip(440);
    } else if (p.wallDir !== 0) { // wall jump
      p.vy = C.JUMP_V * 0.92 * jMul; p.vx = -p.wallDir * C.WALL_JUMP_X; p.facing = -p.wallDir;
      p.jumpBuf = 0; p.wallRunT = 0; p.canDjump = true;
      G.state.stats.walljumps++;
      if (G.flow) G.flow.add("walljump", 15);
      if (G.fx) G.fx.dust(p.x + p.wallDir * p.w / 2, p.y, 5);
      G.audio.blip(500);
    } else if (G.state.abilities.djump && p.canDjump) {
      p.vy = C.JUMP_V * 0.86 * jMul; p.canDjump = false; p.jumpBuf = 0;
      if (G.flow) G.flow.add("djump", 10);
      if (G.fx) G.fx.ring(p.x, p.y + p.h / 2);
      G.audio.blip(560);
    }
  }

  // ================= GRAVITY / GLIDE =================
  p.gliding = false;
  p.vy += C.GRAVITY * dt;
  if (p.vy > 0 && k.jump && G.state.upgrades.glide && !p.onGround) {
    p.gliding = true;
    p.vy = Math.min(p.vy, 150);
    if (G.fx && Math.random() < 0.25) G.fx.dust(p.x, p.y - 8, 1);
  } else {
    if (p.vy > 0 && !k.jump) p.vy += C.GRAVITY * 0.35 * dt; // snappier fall
    if (p.vy < 0 && !k.jump) p.vy += C.GRAVITY * 0.9 * dt;  // variable jump height
  }
  p.vy = Math.min(p.vy, 1400);

  // ================= MOVE & COLLIDE =================
  const wasGround = p.onGround, prevVy = p.vy, hadAir = p.airT;
  moveAndCollide(p, dt);

  if (p.onGround && !wasGround) { // landed
    p.canDjump = true; p.landPop = 0.18;
    if (hadAir > 1.1 && G.flow) G.flow.add("bigair", 20);
    if (prevVy > 700) { if (G.fx) G.fx.dust(p.x, p.y + p.h / 2, 8); G.audio.land(); G.cam.shake = Math.max(G.cam.shake, prevVy / 500); }
    else if (G.fx) G.fx.dust(p.x, p.y + p.h / 2, 3);
  }
  if (wasGround && !p.onGround) p.coyote = C.COYOTE;
  if (p.onGround) p.canDjump = true;
  p.landPop = Math.max(0, p.landPop - dt);

  // ================= LADDER ATTACH =================
  if ((k.up || k.down) && !p.zip) {
    for (const l of G.world.ladders) {
      if (p.x > l.x - 10 && p.x < l.x + l.w + 10 && p.y + p.h / 2 > l.y && p.y - p.h / 2 < l.y + l.h) {
        if (!(k.down && p.onGround && p.groundType !== "wire")) { p.climbing = l; p.zip = null; return; }
      }
    }
  }

  // ================= LEDGE GRAB =================
  if (!p.onGround && p.vy > 40 && p.wallDir !== 0 && !p.climbing) {
    for (const s of G.solidsNear(p.x, p.y, 120)) {
      const sideX = p.wallDir < 0 ? s.x + s.w : s.x;
      if (Math.abs((p.x + p.wallDir * p.w / 2) - sideX) < 8 && s.y > p.y - 10 && s.y < p.y + 18 && s.h > 30) {
        p.hanging = { rect: s, side: p.wallDir };
        p.x = sideX + (p.wallDir < 0 ? p.w / 2 - 4 : -p.w / 2 + 4);
        p.y = s.y + 12; p.vx = 0; p.vy = 0;
        G.audio.blip(380);
        return;
      }
    }
  }

  // ================= ZIPLINE ATTACH =================
  if (!p.onGround && p.zipCd <= 0) {
    for (const z of G.world.ziplines) {
      const minX = Math.min(z.x1, z.x2), maxX = Math.max(z.x1, z.x2);
      if (p.x < minX - 10 || p.x > maxX + 10) continue;
      const t = (p.x - z.x1) / (z.x2 - z.x1);
      if (t < 0 || t > 0.95) continue;
      const ly = z.y1 + (z.y2 - z.y1) * t;
      if (Math.abs(p.y - 26 - ly) < 22 && p.vy > -100) {
        p.zip = { line: z, t }; p.vy = 0;
        G.state.stats.zips++;
        if (G.flow) G.flow.add("zipline", 12);
        G.audio.blip(700);
        if (!G.state.flags.zip) { G.state.flags.zip = 1; G.ui.guide(G.GUIDE.firstZip); }
        return;
      }
    }
  }

  // anim
  p.legT += dt * Math.abs(p.vx) / 28;
};

// ---------- collision resolution ----------
function moveAndCollide(p, dt) {
  const solids = G.solidsNear(p.x, p.y, 300);
  // X axis
  p.x += p.vx * dt;
  p.wallDir = 0;
  let box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
  for (const s of solids) {
    if (!G.rectsOverlap(box, s)) continue;
    if (p.vx > 0) { p.x = s.x - p.w / 2; p.wallDir = 1; }
    else if (p.vx < 0) { p.x = s.x + s.w + p.w / 2; p.wallDir = -1; }
    p.vx = 0;
    box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
  }
  // probe walls even when not moving into them (for wallslide/grab while holding dir)
  if (p.wallDir === 0 && !p.onGround) {
    const probe = { x: p.x - p.w / 2 - 3, y: p.y - p.h / 2 + 4, w: p.w + 6, h: p.h - 8 };
    for (const s of solids) if (G.rectsOverlap(probe, s)) {
      p.wallDir = (s.x + s.w / 2 > p.x) ? 1 : -1; break;
    }
  }
  // Y axis
  const prevFeet = p.y + p.h / 2;
  p.y += p.vy * dt;
  p.onGround = false; p.groundType = null;
  box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
  for (const s of solids) {
    if (!G.rectsOverlap(box, s)) continue;
    if (p.vy > 0) { p.y = s.y - p.h / 2; p.vy = 0; p.onGround = true; p.groundType = s.type; }
    else if (p.vy < 0) { p.y = s.y + s.h + p.h / 2; p.vy = 0; }
    box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
  }
  // one-way platforms (incl. wires)
  if (p.vy >= 0 && p.dropT <= 0) {
    const feet = p.y + p.h / 2;
    for (const o of G.world.oneways) {
      if (p.x < o.x - 4 || p.x > o.x + o.w + 4) continue;
      if (prevFeet <= o.y + 6 && feet >= o.y && feet <= o.y + 26) {
        p.y = o.y - p.h / 2; p.vy = 0; p.onGround = true;
        p.groundType = o.type === "wire" ? "wire" : "oneway";
      }
    }
  }
  // drop through: S+jump while on oneway
  if (p.onGround && (p.groundType === "oneway" || p.groundType === "wire") && G.keys.down && p.jumpBuf > 0) {
    p.dropT = 0.25; p.jumpBuf = 0; p.onGround = false; p.y += 8;
  }
}

// ---------- PawPaw rendering ----------
G.drawPlayer = function (ctx) {
  const p = G.player, t = p.tailT;
  ctx.save();
  ctx.translate(p.x, p.y);

  const sleeping = p.idleT > 22, sitting = p.idleT > 6 && !sleeping;
  const stretch = p.idleT > 14 && p.idleT < 16;
  let squash = 1 - p.landPop * 1.4;
  if (p.slideT > 0) squash = 0.6;

  if (p.zip) { // hanging from zipline
    ctx.scale(p.facing, 1);
    drawCatBody(ctx, t, 0, true, p);
    ctx.restore(); return;
  }
  if (p.hanging) {
    ctx.scale(p.hanging.side, 1); // face the wall
    ctx.rotate(-0.25);
    drawCatBody(ctx, t, 0, false, p, "hang");
    ctx.restore(); return;
  }
  if (p.climbing) {
    ctx.scale(p.facing >= 0 ? 1 : -1, 1);
    ctx.rotate(-1.2);
    drawCatBody(ctx, p.legT * 0.4, 1, false, p, "climb");
    ctx.restore(); return;
  }

  ctx.scale(p.facing, squash);
  if (p.wallRunning) ctx.rotate(-0.5);
  else if (!p.onGround) ctx.rotate(Math.max(-0.22, Math.min(0.3, p.vy / 2600)));
  if (sleeping) drawCatSleeping(ctx, t);
  else if (sitting) drawCatSitting(ctx, t, stretch);
  else drawCatBody(ctx, p.legT, Math.abs(p.vx) > 10 ? 1 : 0, false, p);
  ctx.restore();

  // sleep z's
  if (sleeping && G.fx && Math.random() < 0.02) G.fx.zzz(p.x, p.y - 24);
};

function catColors() {
  if (G.state.style.skin === "shadow") return { orange: "#2c2840", black: "#080912", white: "#5b617a", dark: "#05060b" };
  if (G.state.style.skin === "sunset") return { orange: "#ff9d4d", black: "#6d3550", white: "#ffe2bf", dark: "#2a1822" };
  return { orange: "#e8893a", black: "#26222b", white: "#efe7dc", dark: "#1a1721" };
}

function drawCatBody(ctx, legT, moving, zip, p, mode) {
  const c = catColors();
  const bob = moving ? Math.sin(legT * 2) * 1.6 : Math.sin(legT * 0.08) * 0.8;

  // tail (animated)
  ctx.strokeStyle = c.orange; ctx.lineWidth = 7; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-18, -2 + bob * 0.4);
  const tw = Math.sin(p.tailT * (moving ? 9 : 2.4)) * (moving ? 5 : 7);
  ctx.quadraticCurveTo(-30, -14 + tw, -27, -26 + tw * 1.4);
  ctx.stroke();
  ctx.strokeStyle = c.black; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(-28.4, -20.7 + tw * 1.2); ctx.lineTo(-27, -26 + tw * 1.4); ctx.stroke();

  // legs
  ctx.strokeStyle = c.white; ctx.lineWidth = 6;
  const legs = [[-12, 0], [-7, 2], [9, 2], [14, 0]];
  legs.forEach(([lx], i) => {
    const ph = moving ? Math.sin(legT * 2 + i * 1.7) * 6 : 0;
    const lift = moving ? Math.max(0, Math.cos(legT * 2 + i * 1.7)) * 4 : 0;
    ctx.strokeStyle = i % 2 ? c.white : c.orange;
    ctx.beginPath(); ctx.moveTo(lx, 4 + bob);
    if (zip) ctx.lineTo(lx * 0.6, -20); // reach up to line
    else if (mode === "hang") ctx.lineTo(lx * 0.5, -14);
    else ctx.lineTo(lx + ph, 14 - lift);
    ctx.stroke();
    // neon paw implant glint
    if (!zip && mode !== "hang") {
      ctx.fillStyle = "#00f0ff"; ctx.globalAlpha = 0.9;
      ctx.fillRect(lx + ph - 1.5, 12 - lift, 3, 2.5); ctx.globalAlpha = 1;
    }
  });

  // body (calico patches)
  ctx.fillStyle = c.white;
  rr(ctx, -20, -10 + bob, 40, 18, 9);
  ctx.fillStyle = c.orange;
  ctx.beginPath(); ctx.ellipse(-8, -6 + bob, 11, 7, 0.2, 0, 7); ctx.fill();
  ctx.fillStyle = c.black;
  ctx.beginPath(); ctx.ellipse(8, -8 + bob, 8, 5.4, -0.25, 0, 7); ctx.fill();

  // holographic backpack
  ctx.fillStyle = "rgba(0,240,255,0.28)";
  rr(ctx, -14, -17 + bob, 12, 9, 3);
  ctx.strokeStyle = "rgba(0,240,255,0.7)"; ctx.lineWidth = 1;
  ctx.strokeRect(-14, -17 + bob, 12, 9);

  // head
  const hy = -14 + bob;
  ctx.fillStyle = c.white;
  ctx.beginPath(); ctx.ellipse(20, hy, 11, 9.6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c.orange; // orange patch over left ear/eye
  ctx.beginPath(); ctx.ellipse(16, hy - 5, 7, 5, 0.4, 0, 7); ctx.fill();
  // ears
  ctx.fillStyle = c.orange;
  ctx.beginPath(); ctx.moveTo(12, hy - 6); ctx.lineTo(14, hy - 15); ctx.lineTo(19, hy - 8); ctx.fill();
  ctx.fillStyle = c.black;
  ctx.beginPath(); ctx.moveTo(22, hy - 8); ctx.lineTo(26, hy - 15); ctx.lineTo(28, hy - 6); ctx.fill();
  // cyber eye (glowing) + normal eye
  ctx.fillStyle = "#00f0ff";
  ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 7;
  ctx.fillRect(23.5, hy - 3.5, 4.6, 3.4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.ellipse(17.5, hy - 1.6, 1.7, 2.2, 0, 0, 7); ctx.fill();
  // nose + whiskers
  ctx.fillStyle = "#d96a7b"; ctx.fillRect(29, hy + 1.6, 2.4, 1.8);
  ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(28, hy + 3); ctx.lineTo(35, hy + 1.5);
  ctx.moveTo(28, hy + 4); ctx.lineTo(35, hy + 5);
  ctx.stroke();
  // collar (neon, shop-customizable)
  const collar = G.state.style.collar;
  ctx.strokeStyle = collar; ctx.lineWidth = 2.6;
  ctx.shadowColor = collar; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(16, hy + 6, 6.4, -0.5, 2.3); ctx.stroke();
  ctx.shadowBlur = 0;
  // glide membrane
  if (p.gliding) {
    ctx.fillStyle = "rgba(0,240,255,0.22)";
    ctx.beginPath(); ctx.moveTo(-18, -4 + bob);
    ctx.quadraticCurveTo(0, 14 + bob, 18, -4 + bob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.5)"; ctx.lineWidth = 1.2; ctx.stroke();
  }
  // carried kitten rides the backpack
  if (G.carryKitten && G.drawKitten) G.drawKitten(ctx, -6, -20 + bob, G.carryKitten.c, p.tailT, false);
}

function drawCatSitting(ctx, t, stretch) {
  const c = catColors();
  // tail wraps around
  ctx.strokeStyle = c.orange; ctx.lineWidth = 6.4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-12, 12);
  ctx.quadraticCurveTo(-22, 14, -20 + Math.sin(t * 1.8) * 2.4, 6);
  ctx.stroke();
  if (stretch) { // big stretch forward
    ctx.fillStyle = c.white;
    ctx.beginPath(); ctx.moveTo(-14, 12); ctx.quadraticCurveTo(-4, -16, 18, 4);
    ctx.lineTo(16, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.orange;
    ctx.beginPath(); ctx.ellipse(-4, 2, 9, 6, 0.5, 0, 7); ctx.fill();
  } else { // upright sit
    ctx.fillStyle = c.white;
    ctx.beginPath(); ctx.ellipse(0, 2, 13, 13.6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = c.orange;
    ctx.beginPath(); ctx.ellipse(-4, 4, 8, 8, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = c.black;
    ctx.beginPath(); ctx.ellipse(7, 0, 5.4, 7, -0.2, 0, 7); ctx.fill();
  }
  const hy = stretch ? 0 : -14, hx = stretch ? 16 : 3;
  const tilt = Math.sin(t * 0.7) * 0.1; // looking around
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(tilt);
  ctx.fillStyle = c.white;
  ctx.beginPath(); ctx.ellipse(0, 0, 10.4, 9.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c.orange;
  ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-7, -14); ctx.lineTo(-1, -7); ctx.fill();
  ctx.fillStyle = c.black;
  ctx.beginPath(); ctx.moveTo(3, -7); ctx.lineTo(7, -14); ctx.lineTo(9, -5); ctx.fill();
  ctx.fillStyle = "#00f0ff"; ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 7;
  ctx.fillRect(3.4, -2.2, 4.4, 3.2); ctx.shadowBlur = 0;
  ctx.fillStyle = c.dark;
  ctx.beginPath(); ctx.ellipse(-3, -1, 1.6, 2.1, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#d96a7b"; ctx.fillRect(-0.6, 2.8, 2.2, 1.7);
  ctx.strokeStyle = G.state.style.collar; ctx.lineWidth = 2.4;
  ctx.shadowColor = G.state.style.collar; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(0, 7.4, 6, 0.3, 2.8); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.restore();
}

function drawCatSleeping(ctx, t) {
  const c = catColors();
  const br = 1 + Math.sin(t * 1.6) * 0.04; // breathing
  ctx.save(); ctx.scale(br, 1 / br);
  ctx.fillStyle = c.white;
  ctx.beginPath(); ctx.ellipse(0, 8, 17, 9.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c.orange;
  ctx.beginPath(); ctx.ellipse(-5, 6, 9, 6, 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = c.black;
  ctx.beginPath(); ctx.ellipse(8, 5, 6, 4.4, -0.3, 0, 7); ctx.fill();
  // tucked head
  ctx.fillStyle = c.white;
  ctx.beginPath(); ctx.ellipse(10, 8, 8, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = c.orange;
  ctx.beginPath(); ctx.moveTo(6, 3); ctx.lineTo(8, -3); ctx.lineTo(12, 3); ctx.fill();
  // closed eyes
  ctx.strokeStyle = c.dark; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(11, 7); ctx.quadraticCurveTo(13, 8.4, 15, 7); ctx.stroke();
  // tail curled over nose
  ctx.strokeStyle = c.orange; ctx.lineWidth = 6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-14, 10); ctx.quadraticCurveTo(0, 17, 13, 13); ctx.stroke();
  // dim cyber eye still glows faintly
  ctx.fillStyle = "rgba(0,240,255,0.35)"; ctx.fillRect(13.4, 6, 3.4, 1.6);
  ctx.restore();
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();
}
G.rr = rr;
