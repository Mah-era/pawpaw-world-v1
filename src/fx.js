// ============ PawPaw-World-3D-v1 — PARTICLES & SCREEN FEEDBACK ============
import * as THREE from "three";

const N = 1000;
let points, posAttr, colAttr;
const P = [];           // particle pool
const emitters = [];    // ambient emitters { pos, rate, acc, opts }
const tmp = new THREE.Vector3();

export function initFx(scene) {
  fxScene = scene;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  // soft round glow sprite so particles aren't hard squares
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const mat = new THREE.PointsMaterial({
    size: 0.22, vertexColors: true, transparent: true,
    map: new THREE.CanvasTexture(c), alphaTest: 0.01,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  posAttr = geo.attributes.position;
  colAttr = geo.attributes.color;
  for (let i = 0; i < N; i++) {
    P.push({ alive: false, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, life: 0, max: 1, r: 0, g: 0, b: 0, grav: 0, drag: 1 });
    posAttr.setXYZ(i, 0, -999, 0);
  }
}

let cursor = 0;
function spawn(x, y, z, vx, vy, vz, life, color, grav, drag) {
  const p = P[cursor];
  cursor = (cursor + 1) % N;
  p.alive = true;
  p.x = x; p.y = y; p.z = z;
  p.vx = vx; p.vy = vy; p.vz = vz;
  p.life = life; p.max = life;
  p.r = ((color >> 16) & 255) / 255;
  p.g = ((color >> 8) & 255) / 255;
  p.b = (color & 255) / 255;
  p.grav = grav; p.drag = drag;
}

// burst of sparks at a point
export function burst(pos, { count = 14, color = 0xffb347, speed = 3, life = 0.7, up = 1.5, grav = 5, drag = 2, spread = 1 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * speed * spread;
    spawn(
      pos.x, pos.y, pos.z,
      Math.cos(a) * r, up + Math.random() * speed, Math.sin(a) * r,
      life * (0.6 + Math.random() * 0.7), color, grav, drag
    );
  }
}

// gentle continuous emitter (steam, shrine petals, fountain, music notes)
export function addEmitter(x, y, z, opts) {
  emitters.push({ x, y, z, acc: Math.random(), ...opts });
}

export function updateFx(dt) {
  for (const e of emitters) {
    e.acc += dt * e.rate;
    while (e.acc > 1) {
      e.acc -= 1;
      const s = e.spread ?? 0.4;
      spawn(
        e.x + (Math.random() - 0.5) * s * 2, e.y, e.z + (Math.random() - 0.5) * s * 2,
        (Math.random() - 0.5) * (e.vx ?? 0.3), (e.vy ?? 1) * (0.7 + Math.random() * 0.6), (Math.random() - 0.5) * (e.vx ?? 0.3),
        (e.life ?? 2) * (0.7 + Math.random() * 0.6),
        Array.isArray(e.color) ? e.color[(Math.random() * e.color.length) | 0] : e.color,
        e.grav ?? 0, e.drag ?? 1
      );
    }
  }
  for (let i = 0; i < N; i++) {
    const p = P[i];
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.alive = false;
      posAttr.setXYZ(i, 0, -999, 0);
      colAttr.setXYZ(i, 0, 0, 0);
      continue;
    }
    const f = Math.max(0, 1 - p.drag * dt);
    p.vx *= f; p.vz *= f;
    p.vy -= p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    const k = Math.min(1, p.life / p.max * 1.6);   // fade to black = invisible (additive)
    posAttr.setXYZ(i, p.x, p.y, p.z);
    colAttr.setXYZ(i, p.r * k, p.g * k, p.b * k);
  }
  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
}

// ---------- floating reward text ("+5¢") rising in world space ----------
let fxScene = null;
const floaters = [];
export function floatText(pos, text, colorCss = "#ffe14d") {
  if (!fxScene) return;
  const c = document.createElement("canvas");
  c.width = 128; c.height = 48;
  const g = c.getContext("2d");
  g.font = "bold 30px 'Courier New', monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = colorCss; g.shadowBlur = 10;
  g.fillStyle = colorCss;
  g.fillText(text, 64, 25);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
  s.scale.set(1.5, 0.56, 1);
  s.position.copy(pos);
  fxScene.add(s);
  floaters.push({ s, life: 1.1 });
}

export function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.life -= dt;
    f.s.position.y += dt * 1.1;
    f.s.material.opacity = Math.min(1, f.life * 2.2);
    if (f.life <= 0) {
      fxScene.remove(f.s);
      f.s.material.map.dispose();
      f.s.material.dispose();
      floaters.splice(i, 1);
    }
  }
}

// ---------- screen glow flash ----------
let flashEl = null, flashT = 0, flashDur = 0.5;
export function flash(color = "rgba(0,240,255,0.16)", dur = 0.5) {
  if (!flashEl) {
    flashEl = document.createElement("div");
    flashEl.id = "screen-flash";
    document.body.appendChild(flashEl);
  }
  flashEl.style.background = `radial-gradient(ellipse at 50% 60%, ${color}, transparent 70%)`;
  flashT = dur; flashDur = dur;
}

export function updateFlash(dt) {
  if (!flashEl || flashT <= 0) return;
  flashT -= dt;
  flashEl.style.opacity = Math.max(0, flashT / flashDur);
}
