// ============ PawPaw-World-3D-v1 — PAWPAW, PHYSICS & MOUSE-LOOK CAMERA ============
import * as THREE from "three";
import { CFG, state, keys } from "./data.js";
import { sfx } from "./audio.js";
import { burst } from "./fx.js";

const RADIUS = 0.42;
const HEIGHT = 0.9;

function mat(color, emissive = 0, eInt = 0, rough = 0.9) {
  // high roughness + a little flat-ish response reads as soft matte fur, not plastic
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, emissive: emissive || 0x000000, emissiveIntensity: eInt });
}

// smooth, high-poly sphere so the body/head read as round and soft, not faceted
const SPH = new THREE.SphereGeometry(1, 36, 28);

export function createPlayer(scene) {
  const g = new THREE.Group();            // origin = feet
  const cat = new THREE.Group();          // heading rotation
  const squash = new THREE.Group();       // squash & stretch
  cat.add(squash);
  g.add(cat);

  // calico palette: white fur base with black + ginger patches (matches ref art)
  const orange = 0xf6efe0, cream = 0xfffaf2, dark = 0x2b2420, ginger = 0xdd8636;

  // --- body: rounded loaf (white) ---
  const body = new THREE.Mesh(SPH, mat(orange));
  body.scale.set(0.27, 0.23, 0.42);
  body.position.y = 0.42;
  squash.add(body);
  const rump = new THREE.Mesh(SPH, mat(orange));
  rump.scale.set(0.24, 0.22, 0.24);
  rump.position.set(0, 0.42, -0.3);
  squash.add(rump);
  // calico patches: a black saddle and a ginger blotch over the white coat
  const patch1 = new THREE.Mesh(SPH, mat(dark));
  patch1.scale.set(0.22, 0.16, 0.22);
  patch1.position.set(0.08, 0.56, -0.12);
  squash.add(patch1);
  const patch2 = new THREE.Mesh(SPH, mat(ginger));
  patch2.scale.set(0.19, 0.15, 0.2);
  patch2.position.set(-0.13, 0.54, 0.06);
  squash.add(patch2);
  const patch3 = new THREE.Mesh(SPH, mat(ginger));      // ginger blotch on the rump
  patch3.scale.set(0.16, 0.14, 0.16);
  patch3.position.set(0.13, 0.45, -0.34);
  squash.add(patch3);
  const chest = new THREE.Mesh(SPH, mat(cream));
  chest.scale.set(0.2, 0.18, 0.2);
  chest.position.set(0, 0.38, 0.28);
  squash.add(chest);

  // --- head ---
  const head = new THREE.Group();
  const skull = new THREE.Mesh(SPH, mat(orange));
  skull.scale.set(0.2, 0.18, 0.19);
  head.add(skull);
  const facePatch = new THREE.Mesh(SPH, mat(dark));   // black half-mask over one ear
  facePatch.scale.set(0.12, 0.14, 0.14);
  facePatch.position.set(-0.09, 0.06, 0.0);
  head.add(facePatch);
  const facePatch2 = new THREE.Mesh(SPH, mat(ginger)); // ginger patch over the other
  facePatch2.scale.set(0.11, 0.12, 0.12);
  facePatch2.position.set(0.1, 0.07, -0.01);
  head.add(facePatch2);
  const muzzle = new THREE.Mesh(SPH, mat(cream));
  muzzle.scale.set(0.1, 0.08, 0.09);
  muzzle.position.set(0, -0.06, 0.15);
  head.add(muzzle);
  const nose = new THREE.Mesh(SPH, mat(0xff7b9c));
  nose.scale.set(0.03, 0.022, 0.022);
  nose.position.set(0, -0.03, 0.235);
  head.add(nose);
  // soft cheek fluff so the face isn't a hard egg
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(SPH, mat(cream));
    cheek.scale.set(0.075, 0.06, 0.06);
    cheek.position.set(s * 0.13, -0.04, 0.08);
    head.add(cheek);
  }
  // ears: smooth pivots (rounded base, soft tip) — perk when happy in the loop
  const ears = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.11, 0.18, -0.01);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 18), mat(s < 0 ? dark : ginger));
    ear.position.y = 0.06;
    ear.rotation.z = -s * 0.18;
    pivot.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.11, 18), mat(0xffb3c6));
    inner.position.set(0, 0.05, 0.012);
    inner.rotation.z = -s * 0.18;
    pivot.add(inner);
    const tuft = new THREE.Mesh(SPH, mat(cream));   // fuzzy ear base
    tuft.scale.set(0.045, 0.03, 0.04);
    tuft.position.y = -0.02;
    pivot.add(tuft);
    head.add(pivot);
    ears.push(pivot);
  }
  // eyes: bright green like the ref — one keeps a faint cyber ring (PawPaw's tell)
  const cyberEye = new THREE.Mesh(SPH, mat(0x163a16, 0x7ed957, 1.6));
  cyberEye.scale.set(0.042, 0.05, 0.02);
  cyberEye.position.set(-0.08, 0.04, 0.16);
  head.add(cyberEye);
  const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.011, 6, 14), mat(0x39455f, 0x7ed957, 0.5));
  eyeRing.position.set(-0.08, 0.04, 0.165);
  head.add(eyeRing);
  const eye = new THREE.Mesh(SPH, mat(0x163a16, 0x7ed957, 1.4));
  eye.scale.set(0.04, 0.05, 0.02);
  eye.position.set(0.08, 0.04, 0.165);
  head.add(eye);
  // tiny dark pupils so the green eyes read as alive
  for (const ex of [-0.08, 0.08]) {
    const pupil = new THREE.Mesh(SPH, mat(0x0a1a0a));
    pupil.scale.set(0.018, 0.034, 0.012);
    pupil.position.set(ex, 0.04, 0.178);
    head.add(pupil);
  }
  const eyes = [cyberEye, eye];
  for (const e of eyes) e.userData.baseY = e.scale.y;
  // whiskers
  const whiskMat = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.7 });
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.006), whiskMat);
      w.position.set(s * 0.14, -0.04 - i * 0.025, 0.13);
      w.rotation.y = s * 0.5;
      w.rotation.z = s * (0.06 + i * 0.12);
      head.add(w);
    }
  }
  head.position.set(0, 0.66, 0.4);
  squash.add(head);

  // --- collar + glowing tag ---
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.032, 8, 18), mat(state.collar, state.collar, 1.6));
  collar.rotation.x = Math.PI / 2 - 0.3;
  collar.position.set(0, 0.56, 0.33);
  squash.add(collar);
  const tag = new THREE.Mesh(SPH, mat(0xffe14d, 0xffe14d, 1.8));
  tag.scale.setScalar(0.035);
  tag.position.set(0, 0.48, 0.4);
  squash.add(tag);

  // --- legs (rounded) ---
  const legs = [];
  for (const [lx, lz] of [[-0.14, 0.26], [0.14, 0.26], [-0.14, -0.26], [0.14, -0.26]]) {
    const pivot = new THREE.Group();
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 16), mat(orange));
    leg.position.y = -0.15;
    pivot.add(leg);
    const paw = new THREE.Mesh(SPH, mat(cream));
    paw.scale.set(0.055, 0.045, 0.065);
    paw.position.set(0, -0.3, 0.01);
    pivot.add(paw);
    pivot.position.set(lx, 0.32, lz);
    squash.add(pivot);
    legs.push(pivot);
  }

  // --- tail: 4 curving segments ---
  const tailSegs = [];
  let parent = squash, ty = 0.5, tz = -0.46;
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Group();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.045 - i * 0.007, 0.052 - i * 0.007, 0.2, 16), mat(i === 3 ? dark : i === 2 ? ginger : orange));
    m.rotation.x = Math.PI / 2;
    m.position.z = -0.09;
    seg.add(m);
    seg.position.set(0, ty, tz);
    parent.add(seg);
    parent = seg;
    ty = 0; tz = -0.17;
    tailSegs.push(seg);
  }

  // soft glow so PawPaw reads at night (gentle — the white coat is already bright)
  const glow = new THREE.PointLight(0xfff0d8, 1.0, 8, 1.8);
  glow.position.set(0, 1.6, 0);
  g.add(glow);

  // collect materials so the camera can fade the cat when it pulls in close
  const fadeMats = [];
  cat.traverse(o => {
    if (o.material) {
      o.material.transparent = true;
      fadeMats.push(o.material);
    }
  });

  scene.add(g);

  const player = {
    g, cat, squash, legs, tailSegs, collar, head, eyes, ears, fadeMats, catFade: 1,
    happyT: 0,                   // brief smile/squint after a reward or meow
    pos: g.position,
    vel: new THREE.Vector3(),
    yaw: 0, pitch: -0.16,
    lookDX: 0, lookDY: 0,        // smoothed mouse input
    facing: 0,
    grounded: false,
    jumpsUsed: 0,
    coyote: 0,
    jumpBuffer: 0,
    dashT: 0, dashCD: 0,
    runPhase: 0,
    idleT: 0,                    // time stood still → sit
    blinkT: 2,
    stepT: 0,
    meowT: 0,
    zoom: 1,            // wheel / two-finger zoom multiplier
    carrying: null,
    fellFrom: 0,
    fovKick: 0,
    camDip: 0,
  };
  g.position.set(32, 0, 30);    // spawn in the plaza, framing the glowing shrine
  return player;
}

export function setCollarColor(player, color) {
  player.collar.material.color.setHex(color);
  player.collar.material.emissive.setHex(color);
}

// ---------- mouse-look (with smoothing) ----------
export function applyLook(player, dx, dy) {
  player.lookDX += dx;
  player.lookDY += dy;
}

// ---------- physics helpers ----------
function resolveHorizontal(p, colliders) {
  const feet = p.pos.y, head = p.pos.y + HEIGHT;
  for (const c of colliders) {
    const bot = c.bot || 0;
    if (feet >= c.top - 0.32 || head <= bot + 0.05) continue;
    const cx = Math.max(c.minX, Math.min(p.pos.x, c.maxX));
    const cz = Math.max(c.minZ, Math.min(p.pos.z, c.maxZ));
    const dx = p.pos.x - cx, dz = p.pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= RADIUS * RADIUS) continue;
    if (d2 > 1e-6) {
      const d = Math.sqrt(d2), push = (RADIUS - d) / d;
      p.pos.x += dx * push;
      p.pos.z += dz * push;
    } else {
      const pl = p.pos.x - c.minX, pr = c.maxX - p.pos.x;
      const pn = p.pos.z - c.minZ, pf = c.maxZ - p.pos.z;
      const m = Math.min(pl, pr, pn, pf);
      if (m === pl) p.pos.x = c.minX - RADIUS;
      else if (m === pr) p.pos.x = c.maxX + RADIUS;
      else if (m === pn) p.pos.z = c.minZ - RADIUS;
      else p.pos.z = c.maxZ + RADIUS;
    }
  }
}

function overlapsXZ(p, c) {
  return p.pos.x > c.minX - RADIUS * 0.7 && p.pos.x < c.maxX + RADIUS * 0.7 &&
         p.pos.z > c.minZ - RADIUS * 0.7 && p.pos.z < c.maxZ + RADIUS * 0.7;
}

// ---------- main update ----------
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), wish = new THREE.Vector3();

// quadratic bezier along a zipline
function zipPoint(zl, t, out) {
  const u = 1 - t;
  out.set(
    u * u * zl.a.x + 2 * u * t * zl.c.x + t * t * zl.b.x,
    u * u * zl.a.y + 2 * u * t * zl.c.y + t * t * zl.b.y,
    u * u * zl.a.z + 2 * u * t * zl.c.z + t * t * zl.b.z
  );
  return out;
}
const zipPos = new THREE.Vector3(), zipAhead = new THREE.Vector3();

export function updatePlayer(p, dt, world, onEvent) {
  const c = CFG;

  // smoothed mouse-look: consume buffered deltas with a soft filter
  const smooth = Math.min(1, 22 * dt);
  const useDX = p.lookDX * smooth, useDY = p.lookDY * smooth;
  p.lookDX -= useDX; p.lookDY -= useDY;
  p.yaw -= useDX * CFG.MOUSE_SENS;
  p.pitch -= useDY * CFG.MOUSE_SENS;
  p.pitch = Math.max(-1.25, Math.min(0.65, p.pitch));

  // ---------- zipline ride: hang from the cable, jump to bail ----------
  if (p.zip) {
    const z = p.zip;
    z.t += (15 / z.zl.len) * dt;
    const t = Math.min(1, z.t);
    zipPoint(z.zl, t, zipPos);
    zipPoint(z.zl, Math.min(1, t + 0.03), zipAhead);
    p.pos.set(zipPos.x, zipPos.y - 1.0, zipPos.z);
    p.facing = Math.atan2(zipAhead.x - zipPos.x, zipAhead.z - zipPos.z);
    p.cat.rotation.y = p.facing;
    p.cat.position.y = 0.12;
    for (const l of p.legs) l.rotation.x = -0.9;            // dangling
    p.tailSegs.forEach((s, i) => { s.rotation.x = 0.7 + Math.sin(performance.now() / 130 + i) * 0.2; });
    burst(new THREE.Vector3(zipPos.x, zipPos.y, zipPos.z), { count: 1, color: 0x00f0ff, speed: 0.4, life: 0.3, up: 0, grav: 0, drag: 4 });
    if (keys.jumpP || t >= 1) {
      keys.jumpP = false;
      zipAhead.sub(zipPos).normalize();
      p.vel.set(zipAhead.x * 9, 2.4, zipAhead.z * 9);
      p.zip = null;
      p.grounded = false;
      sfx.zipend();
      onEvent("zipend");
    }
    return;
  }

  fwd.set(-Math.sin(p.yaw), 0, -Math.cos(p.yaw));
  right.set(Math.cos(p.yaw), 0, -Math.sin(p.yaw));
  wish.set(0, 0, 0);
  if (keys.fwd) wish.add(fwd);
  if (keys.back) wish.sub(fwd);
  if (keys.right) wish.add(right);
  if (keys.left) wish.sub(right);
  const moving = wish.lengthSq() > 0;
  if (moving) wish.normalize();

  let speed = keys.sprint ? c.SPRINT : c.WALK;
  if (state.upgrades.turbo) speed *= 1.12;
  if (state.buffT > 0) speed *= 1.25;

  // dash
  if (p.dashCD > 0) p.dashCD -= dt;
  if (keys.dashP && state.abilities.dash && p.dashCD <= 0 && p.dashT <= 0) {
    p.dashT = c.DASH_T;
    p.dashCD = state.upgrades.phase ? c.DASH_CD * 0.6 : c.DASH_CD;
    const dir = moving ? wish.clone() : fwd.clone();
    p.vel.x = dir.x * c.DASH_V;
    p.vel.z = dir.z * c.DASH_V;
    if (p.vel.y < 0) p.vel.y = 0;
    p.fovKick = 1;
    sfx.dash();
    burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.5, p.pos.z), { count: 16, color: state.collar, speed: 2, life: 0.5, up: 0.5, grav: 0, drag: 3 });
    onEvent("dash");
  }
  keys.dashP = false;

  if (p.dashT > 0) {
    p.dashT -= dt;
    // dash trail sparks
    burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.45, p.pos.z), { count: 3, color: 0x00f0ff, speed: 0.5, life: 0.4, up: 0.3, grav: 0, drag: 4 });
  } else {
    // snappy acceleration, gentle air control
    const accel = p.grounded ? 58 : 20;
    if (moving) {
      p.vel.x += (wish.x * speed - p.vel.x) * Math.min(1, accel * dt / speed);
      p.vel.z += (wish.z * speed - p.vel.z) * Math.min(1, accel * dt / speed);
    } else {
      const f = p.grounded ? Math.max(0, 1 - 13 * dt) : Math.max(0, 1 - 1.2 * dt);
      p.vel.x *= f; p.vel.z *= f;
    }
  }

  // jumping
  if (p.grounded) { p.coyote = 0.12; p.jumpsUsed = 0; }
  else p.coyote -= dt;
  if (keys.jumpP) { p.jumpBuffer = 0.14; keys.jumpP = false; }
  else if (p.jumpBuffer > 0) p.jumpBuffer -= dt;
  const jumpV = state.upgrades.coil ? c.JUMP_V * 1.08 : c.JUMP_V;
  if (p.jumpBuffer > 0) {
    if (p.coyote > 0) {
      p.vel.y = jumpV; p.grounded = false; p.coyote = 0; p.jumpsUsed = 1;
      p.jumpBuffer = 0;
      sfx.jump();
      if (state.upgrades.sparkle || true) burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.1, p.pos.z), { count: 8, color: 0x9fd8ff, speed: 1.4, life: 0.45, up: 0.6, grav: 3, drag: 2 });
    } else if (state.abilities.djump && p.jumpsUsed < 2) {
      p.vel.y = jumpV * 0.95; p.jumpsUsed = 2;
      p.jumpBuffer = 0;
      sfx.djump();
      burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.1, p.pos.z), { count: 14, color: 0x00f0ff, speed: 2, life: 0.5, up: 0.4, grav: 2, drag: 2 });
      onEvent("djump");
    }
  }

  // gravity: floatier up, heavier down = a cat-like jump arc
  let grav = p.vel.y > 0 ? c.GRAVITY : c.GRAVITY * 1.35;
  if (state.upgrades.glide && keys.jump && p.vel.y < 0) {
    p.vel.y = Math.max(p.vel.y, -2.6);
    grav = 6;
    burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.8, p.pos.z), { count: 1, color: 0xaaff00, speed: 0.3, life: 0.5, up: -0.5, grav: 0, drag: 2 });
  }
  p.vel.y -= grav * dt;
  if (p.vel.y < -38) p.vel.y = -38;

  // integrate horizontal
  p.pos.x += p.vel.x * dt;
  p.pos.z += p.vel.z * dt;
  const lim = c.CITY + 60;
  p.pos.x = Math.max(-lim, Math.min(lim, p.pos.x));
  p.pos.z = Math.max(-lim, Math.min(lim, p.pos.z));
  resolveHorizontal(p, world.colliders);

  // integrate vertical
  const py0 = p.pos.y;
  p.pos.y += p.vel.y * dt;
  let landed = false;
  if (p.vel.y <= 0) {
    if (py0 >= 0 && p.pos.y <= 0) { p.pos.y = 0; landed = true; }
    for (const col of world.colliders) {
      if (!overlapsXZ(p, col)) continue;
      if (py0 >= col.top - 0.05 && p.pos.y <= col.top) { p.pos.y = col.top; landed = true; }
    }
  } else {
    for (const col of world.colliders) {
      const bot = col.bot || 0;
      if (bot <= 0.01 || !overlapsXZ(p, col)) continue;
      if (py0 + HEIGHT <= bot && p.pos.y + HEIGHT > bot) { p.pos.y = bot - HEIGHT; p.vel.y = 0; }
    }
  }

  if (landed && !p.grounded) {
    const fall = p.fellFrom - p.pos.y;
    if (fall > 2.5) {
      sfx.land();
      p.camDip = Math.min(0.5, fall * 0.04);
      burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.05, p.pos.z), { count: Math.min(22, 6 + fall * 2), color: 0x8fa4c8, speed: 2.2, life: 0.5, up: 0.4, grav: 4, drag: 2.5 });
    }
    onEvent("land", fall);
  }
  if (!landed && p.grounded) p.fellFrom = p.pos.y;
  if (!p.grounded && p.vel.y > 0) p.fellFrom = Math.max(p.fellFrom, p.pos.y);
  p.grounded = landed;
  if (landed) p.vel.y = 0;

  state.stats.dist += Math.hypot(p.vel.x, p.vel.z) * dt;

  // pawsteps: soft footstep taps + sparkles, cadence scales with speed
  const hSpeed = Math.hypot(p.vel.x, p.vel.z);
  if (p.grounded && hSpeed > 1.5) {
    p.stepT -= dt;
    if (p.stepT <= 0) {
      p.stepT = Math.max(0.12, 0.5 - hSpeed * 0.035);
      sfx.foot();
      if (hSpeed > 8) burst(new THREE.Vector3(p.pos.x, p.pos.y + 0.04, p.pos.z), { count: 2, color: state.collar, speed: 0.5, life: 0.5, up: 0.5, grav: 2, drag: 2 });
    }
  }

  // ---------- animation ----------
  if (hSpeed > 0.5) {
    const target = Math.atan2(p.vel.x, p.vel.z);
    let d = target - p.facing;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    p.facing += d * Math.min(1, 14 * dt);
    p.cat.rotation.z = -d * 0.6;            // lean into turns
    p.idleT = 0;
  } else {
    p.cat.rotation.z *= Math.max(0, 1 - 8 * dt);
    if (p.grounded) p.idleT += dt;
  }
  p.cat.rotation.y = p.facing;

  p.runPhase += dt * (4 + hSpeed * 1.7);
  const swing = p.grounded ? Math.min(1, hSpeed / 6) : 0;
  p.legs[0].rotation.x = Math.sin(p.runPhase) * 0.95 * swing;
  p.legs[1].rotation.x = -Math.sin(p.runPhase) * 0.95 * swing;
  p.legs[2].rotation.x = -Math.sin(p.runPhase) * 0.95 * swing;
  p.legs[3].rotation.x = Math.sin(p.runPhase) * 0.95 * swing;
  if (!p.grounded) for (const l of p.legs) l.rotation.x = p.vel.y > 0 ? -0.7 : -0.3;   // pounce / ready-to-land

  // squash & stretch: stretch in the air, squash on land, sit when idle
  let sy = 1, sxz = 1;
  if (!p.grounded) {
    sy = 1 + Math.min(0.22, Math.abs(p.vel.y) * 0.015);
    sxz = 1 / Math.sqrt(sy);
  } else if (p.camDip > 0.02) {
    sy = 1 - p.camDip * 0.7;
    sxz = 1 + p.camDip * 0.4;
  }
  const sitting = p.idleT > 3;
  if (sitting) {
    // sit: haunches down, head up, tail wraps
    p.squash.rotation.x = -0.5;
    p.squash.position.y = -0.06;
  } else {
    p.squash.rotation.x *= Math.max(0, 1 - 10 * dt);
    p.squash.position.y *= Math.max(0, 1 - 10 * dt);
  }
  p.squash.scale.x += (sxz - p.squash.scale.x) * Math.min(1, 16 * dt);
  p.squash.scale.y += (sy - p.squash.scale.y) * Math.min(1, 16 * dt);
  p.squash.scale.z += (sxz - p.squash.scale.z) * Math.min(1, 16 * dt);

  // long idle: a luxurious cat stretch, then a quiet purr
  if (p.idleT < 0.1) { p.stretched = false; p.purred = false; }
  if (p.idleT > 9 && !p.stretched) { p.stretched = true; p.stretchT = 1.3; sfx.stretch(); }
  if (p.stretchT > 0) {
    p.stretchT -= dt;
    const k = Math.sin(((1.3 - p.stretchT) / 1.3) * Math.PI);
    p.squash.scale.z += k * 0.28;          // front paws forward, back arched
    p.squash.rotation.x = -0.15 - k * 0.3;
  }
  if (p.idleT > 15 && !p.purred) { p.purred = true; sfx.purr(); }

  // body bob + head tilt + ear/blink life
  p.squash.children.forEach(() => {});
  const bob = p.grounded ? Math.abs(Math.sin(p.runPhase)) * 0.05 * swing : 0.08;
  p.cat.position.y = bob;
  if (p.meowT > 0) p.meowT -= dt;
  if (p.happyT > 0) p.happyT -= dt;
  p.head.rotation.x = p.meowT > 0 ? -0.4 : (sitting ? -0.25 : Math.sin(p.runPhase * 0.5) * 0.04);   // chin-up meow

  // ---------- expressions: blink, happy squint, sleepy lids ----------
  p.blinkT -= dt;
  let blink = 0;
  if (p.blinkT <= 0) { blink = 1; if (p.blinkT <= -0.13) p.blinkT = 2 + Math.random() * 3; }  // ~0.13s closed
  const happy = p.meowT > 0 || p.happyT > 0;
  const sleepy = sitting || p.idleT > 6;
  const squint = Math.max(blink, happy ? 0.55 : 0, sleepy ? 0.4 : 0);
  for (const e of p.eyes) e.scale.y = e.userData.baseY * (1 - 0.9 * squint);
  // ears: perk forward + together when happy, relax otherwise
  const earTarget = happy ? -0.22 : (sleepy ? 0.12 : 0);
  for (let i = 0; i < p.ears.length; i++) {
    p.ears[i].rotation.x += (earTarget - p.ears[i].rotation.x) * Math.min(1, 10 * dt);
    const lean = happy ? -0.05 : 0;                    // tip slightly inward when happy
    p.ears[i].rotation.z += (lean * (i === 0 ? 1 : -1) - p.ears[i].rotation.z) * Math.min(1, 8 * dt);
  }
  // tail: relaxed wave, wraps when sitting, streams when fast
  for (let i = 0; i < p.tailSegs.length; i++) {
    const seg = p.tailSegs[i];
    if (sitting) {
      seg.rotation.x = 0.1;
      seg.rotation.y = 0.55;
    } else if (hSpeed > 8) {
      seg.rotation.x = 0.12 + Math.sin(p.runPhase * 1.4 + i) * 0.1;
      seg.rotation.y = Math.sin(p.runPhase * 0.9 + i * 0.8) * 0.15;
    } else {
      seg.rotation.x = 0.45 + Math.sin(p.runPhase * 0.7 + i) * 0.25;
      seg.rotation.y = Math.sin(p.runPhase * 0.5 + i * 0.8) * 0.3;
    }
  }

  if (p.carrying) {
    p.carrying.mesh.position.set(p.pos.x, p.pos.y + 0.78 * p.squash.scale.y, p.pos.z);
    p.carrying.mesh.rotation.y = p.facing;
  }

  // decay feel-timers
  p.camDip *= Math.max(0, 1 - 4 * dt);
  p.fovKick *= Math.max(0, 1 - 5 * dt);
}

// ---------- third-person camera ----------
const camTarget = new THREE.Vector3(), camDir = new THREE.Vector3(), camPos = new THREE.Vector3(), probe = new THREE.Vector3();
const smoothTarget = new THREE.Vector3(34, 1.4, 34);

function pointBlocked(v, colliders) {
  if (v.y < 0.25) return true;
  for (const c of colliders) {
    const bot = c.bot || 0;
    if (v.x > c.minX - 0.3 && v.x < c.maxX + 0.3 &&
        v.z > c.minZ - 0.3 && v.z < c.maxZ + 0.3 &&
        v.y > bot - 0.1 && v.y < c.top + 0.3) return true;
  }
  return false;
}

export function updateCamera(p, camera, world, dt = 0.016) {
  // smooth follow point (slight lag = sense of weight)
  camTarget.set(p.pos.x, p.pos.y + CFG.CAM_HEIGHT - p.camDip, p.pos.z);
  smoothTarget.lerp(camTarget, Math.min(1, 14 * dt));

  camDir.set(
    Math.sin(p.yaw) * Math.cos(p.pitch),
    -Math.sin(p.pitch),
    Math.cos(p.yaw) * Math.cos(p.pitch)
  );
  // a touch more distance at sprint speed; collision march pulls it in
  const hSpeed = Math.hypot(p.vel.x, p.vel.z);
  const wantDist = (CFG.CAM_DIST + Math.min(1.6, hSpeed * 0.09)) * (p.zoom || 1);
  let dist = wantDist;
  for (let i = 1; i <= 16; i++) {
    const d = (wantDist * i) / 16;
    probe.copy(smoothTarget).addScaledVector(camDir, d);
    if (pointBlocked(probe, world.colliders)) { dist = Math.max(0.8, ((i - 1) / 16) * wantDist - 0.25); break; }
  }
  camPos.copy(smoothTarget).addScaledVector(camDir, dist);
  // intro: ease in slowly from the title orbit, then snap back to tight follow
  const intro = p.camIntro || 0;
  if (intro > 0) p.camIntro = Math.max(0, intro - dt / 2.6);
  camera.position.lerp(camPos, Math.min(1, (16 - 14.5 * intro) * dt));
  camera.lookAt(smoothTarget);

  // fade PawPaw out as the camera pulls in (tight alleys), back in when it frees up
  const wantFade = Math.max(0, Math.min(1, (dist - 1.0) / 1.6));
  p.catFade += (wantFade - p.catFade) * Math.min(1, 10 * dt);
  for (const m of p.fadeMats) m.opacity = p.catFade;

  // sprint / dash FOV kick
  const targetFov = 70 + Math.min(8, Math.max(0, hSpeed - 7) * 0.9) + p.fovKick * 10;
  camera.fov += (targetFov - camera.fov) * Math.min(1, 8 * dt);
  camera.updateProjectionMatrix();
}
