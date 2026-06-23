// ============ PawPaw-World-3D-v1 — DENSE CAT-SCALE CITY ============
import * as THREE from "three";
import { CFG, zoneAt, makeRng, POSTERS, SIDE_QUESTS, CITY_NPCS, DISCOVERIES } from "./data.js";
import { addEmitter } from "./fx.js";
import { sfx } from "./audio.js";

const BOX = new THREE.BoxGeometry(1, 1, 1);
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const PITCH = 34;                 // tight blocks — streets ~10 m wide

// crisp textures: real trilinear + anisotropic filtering (kills the "pixelated" look)
let MAX_ANISO = 8;
export function setRendererCaps(renderer) {
  MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
}
function crisp(tex, srgb = true) {
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = MAX_ANISO;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

// ---------- canvas textures ----------
function windowTexture(rng, tintHex, facade = "#181410") {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 256;       // 2× res — windows no longer blocky
  const g = c.getContext("2d");
  g.fillStyle = facade;
  g.fillRect(0, 0, 128, 256);
  const palette = ["#ffd98a", "#9fefff", tintHex, "#fff6e8", "#ff9fd8"];
  for (let y = 12; y < 248; y += 20) {
    for (let x = 8; x < 120; x += 18) {
      if (rng() < 0.45) {
        g.fillStyle = palette[(rng() * palette.length) | 0];
        g.globalAlpha = 0.5 + rng() * 0.5;
        // soft-edged window with a brighter core
        g.shadowColor = g.fillStyle; g.shadowBlur = 6;
        g.fillRect(x, y, 12, 12);
        g.shadowBlur = 0;
      }
    }
  }
  g.globalAlpha = 1;
  return crisp(new THREE.CanvasTexture(c));
}

// ---------- rich procedural facades: panels, windows, grime, storefronts ----------
function drawWindow(g, rng, tintCss, x, y, w, h) {
  g.fillStyle = "#0c0a07";
  g.fillRect(x - 2, y - 2, w + 4, h + 4);
  const r = rng();
  if (r < 0.42) {
    const lit = g.createLinearGradient(0, y, 0, y + h);
    if (r < 0.28) { lit.addColorStop(0, "#f3cf96"); lit.addColorStop(1, "#a86c34"); }
    else if (r < 0.36) { lit.addColorStop(0, "#9adcec"); lit.addColorStop(1, "#3a7a94"); }
    else { lit.addColorStop(0, tintCss); lit.addColorStop(1, "#0e0b08"); }
    g.fillStyle = lit;
    g.fillRect(x, y, w, h);
    // curtain / blind shadow
    if (rng() < 0.5) { g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(x, y + h * (0.3 + rng() * 0.4), w, 2 + rng() * 3); }
  } else {
    g.fillStyle = "#0d0b09";
    g.fillRect(x, y, w, h);
    g.strokeStyle = "rgba(160,190,220,0.13)";
    g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x + 2, y + h - 2); g.lineTo(x + w - 2, y + 2); g.stroke();
  }
}

function facadeTexture(rng, tintCss, floors, storefront) {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 512;
  const g = c.getContext("2d");
  const baseTones = ["#1c1712", "#191510", "#201a13", "#171411", "#1d1a16"];
  g.fillStyle = baseTones[(rng() * baseTones.length) | 0];
  g.fillRect(0, 0, 256, 512);
  // vertical panel seams + tone shifts
  let px = 0;
  while (px < 256) {
    const pw = 28 + rng() * 50;
    if (rng() < 0.4) { g.fillStyle = `rgba(255,255,255,${0.015 + rng() * 0.03})`; g.fillRect(px, 0, pw, 512); }
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(px, 0, 2, 512);
    px += pw;
  }
  const sfH = storefront ? 88 : 0;
  const bodyH = 512 - sfH - 12;
  const fh = bodyH / floors;
  const style = rng();
  for (let f = 0; f < floors; f++) {
    const fy = 12 + f * fh;
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(0, fy + fh - 3, 256, 3);                      // floor slab shadow
    if (style < 0.45) {
      for (let wx = 14; wx < 234; wx += 34) drawWindow(g, rng, tintCss, wx, fy + fh * 0.18, 22, fh * 0.58);
    } else if (style < 0.75) {
      for (let wx = 10; wx < 200; wx += 62) drawWindow(g, rng, tintCss, wx, fy + fh * 0.22, 48, fh * 0.45);
    } else {
      for (let wx = 12; wx < 236; wx += 26) drawWindow(g, rng, tintCss, wx, fy + fh * 0.2, 16, fh * 0.4);
    }
    // AC unit + drip stain
    if (rng() < 0.6) {
      const ax = 14 + rng() * 210, ay = fy + fh * 0.55;
      g.fillStyle = "#2e2c28"; g.fillRect(ax, ay, 18, 12);
      g.fillStyle = "#1a1815"; g.fillRect(ax + 2, ay + 2, 14, 8);
      const dg = g.createLinearGradient(0, ay + 14, 0, ay + 74);
      dg.addColorStop(0, "rgba(0,0,0,0.3)"); dg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = dg; g.fillRect(ax + 2, ay + 14, 14, 60);
    }
  }
  // long grime streaks
  for (let i = 0; i < 9; i++) {
    const gx = rng() * 246, gy = rng() * 380, gl = 60 + rng() * 130, gw = 6 + rng() * 16;
    const gr = g.createLinearGradient(0, gy, 0, gy + gl);
    gr.addColorStop(0, `rgba(0,0,0,${0.2 + rng() * 0.25})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(gx, gy, gw, gl);
  }
  if (storefront) {
    const sy = 512 - sfH;
    // colored sign band with glyph blocks
    g.fillStyle = tintCss; g.globalAlpha = 0.85;
    g.fillRect(0, sy, 256, 20);
    g.globalAlpha = 1;
    g.fillStyle = "rgba(0,0,0,0.75)";
    let tx = 8;
    while (tx < 240) { const tw = 6 + rng() * 16; g.fillRect(tx, sy + 4, tw, 12); tx += tw + 5 + rng() * 9; }
    // warm glowing shop window with mullions
    const wg = g.createLinearGradient(0, sy + 22, 0, 512);
    wg.addColorStop(0, "#e0ae6e"); wg.addColorStop(1, "#8a5526");
    g.fillStyle = wg;
    g.fillRect(8, sy + 24, 240, sfH - 32);
    g.fillStyle = "rgba(40,20,8,0.85)";
    for (let mx = 8; mx < 248; mx += 40) g.fillRect(mx, sy + 24, 4, sfH - 32);
    g.fillRect(8, sy + 24, 240, 3);
    g.fillStyle = "rgba(60,30,12,0.5)";   // shelf / interior silhouettes
    for (let i = 0; i < 5; i++) g.fillRect(14 + rng() * 215, sy + 36 + rng() * 28, 14 + rng() * 22, 8);
  }
  g.fillStyle = "#100d0a";
  g.fillRect(0, 0, 256, 12);                                  // parapet cap
  return crisp(new THREE.CanvasTexture(c));
}

function roofTexture(rng) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = ["#221c14", "#1e1912", "#252016"][(rng() * 3) | 0];
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) {
    g.fillStyle = `rgba(0,0,0,${0.08 + rng() * 0.18})`;
    g.beginPath();
    g.arc(rng() * 256, rng() * 256, 6 + rng() * 30, 0, 7);
    g.fill();
  }
  g.strokeStyle = "rgba(0,0,0,0.4)"; g.lineWidth = 10;
  g.strokeRect(5, 5, 246, 246);
  for (let i = 0; i < 4; i++) {                                // vents & hatches
    const vx = 24 + rng() * 190, vy = 24 + rng() * 190;
    g.fillStyle = "#15110c"; g.fillRect(vx, vy, 22 + rng() * 18, 16 + rng() * 12);
    g.fillStyle = "rgba(255,255,255,0.05)"; g.fillRect(vx + 2, vy + 2, 10, 4);
  }
  return crisp(new THREE.CanvasTexture(c));
}

function textSprite(text, color, w = 256, fontPx = 46, vertical = false) {
  const c = document.createElement("canvas");
  c.width = vertical ? 64 : w; c.height = vertical ? w : 64;
  const g = c.getContext("2d");
  g.font = `bold ${fontPx}px 'Courier New', monospace`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = color; g.shadowBlur = 18;
  g.fillStyle = color;
  if (vertical) {
    const chars = text.split("");
    chars.forEach((ch, i) => g.fillText(ch, 32, 40 + i * (w - 60) / Math.max(1, chars.length - 1)));
  } else {
    g.fillText(text, w / 2, 34);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(c.width / 22, c.height / 22), mat);
}

function billboardTexture(rng) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 64;
  const g = c.getContext("2d");
  const hues = [["#ff2bd6", "#3a0a33"], ["#00f0ff", "#062a33"], ["#aaff00", "#1d330a"], ["#ffb347", "#33240a"]];
  const [fg, bg] = hues[(rng() * hues.length) | 0];
  g.fillStyle = bg; g.fillRect(0, 0, 128, 64);
  g.strokeStyle = fg; g.lineWidth = 3; g.strokeRect(3, 3, 122, 58);
  g.fillStyle = fg;
  g.font = "bold 17px 'Courier New', monospace";
  g.textAlign = "center";
  const ads = ["SYNTH-TUNA", "ホロ・キブル", "DRINK NEON", "PAW-COLA", "DREAM BIG", "猫カフェ", "FLY SAFE", "EAT NOODLES"];
  g.fillText(ads[(rng() * ads.length) | 0], 64, 28);
  g.font = "10px 'Courier New', monospace";
  g.fillText("● ● ●", 64, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function graffitiTexture(rng, line1, line2) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 96;
  const g = c.getContext("2d");
  const cols = ["#ff2bd6", "#aaff00", "#00f0ff", "#ffb347"];
  const col = cols[(rng() * cols.length) | 0];
  g.strokeStyle = col; g.fillStyle = col;
  g.shadowColor = col; g.shadowBlur = 10;
  g.lineWidth = 3;
  g.font = "bold 15px 'Courier New', monospace";
  g.textAlign = "center";
  g.save();
  g.translate(64, 40); g.rotate((rng() - 0.5) * 0.25);
  g.fillText(line1, 0, 0);
  if (line2) g.fillText(line2, 0, 20);
  g.restore();
  g.beginPath(); g.arc(100, 76, 7, 0, 7); g.fill();
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(91 + i * 9, 64, 3, 0, 7); g.fill(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function posterTexture(rng, idx) {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 96;
  const g = c.getContext("2d");
  const themes = [["#2a1a3a", "#ff2bd6"], ["#0a2a33", "#00f0ff"], ["#332a0a", "#ffb347"], ["#13260a", "#aaff00"]];
  const [bg, fg] = themes[idx % themes.length];
  g.fillStyle = bg; g.fillRect(0, 0, 64, 96);
  g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(2, 2, 60, 92);
  g.fillStyle = fg;
  g.font = "bold 11px 'Courier New', monospace"; g.textAlign = "center";
  g.fillText(["MISSING", "LIVE", "NOTICE", "LOST?", "RAMEN", "LINE 9", "RENT", "FOUND", "CIVIC", "DRONES"][idx % 10], 32, 22);
  g.fillRect(10, 34, 44, 3);
  for (let i = 0; i < 4; i++) { g.globalAlpha = 0.5; g.fillRect(10, 44 + i * 9, 24 + rng() * 20, 2.5); }
  g.globalAlpha = 1;
  g.beginPath(); g.arc(48, 80, 5, 0, 7); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function pawTexture(colorCss) {
  const c = document.createElement("canvas");
  c.width = c.height = 48;
  const g = c.getContext("2d");
  g.fillStyle = colorCss;
  g.shadowColor = colorCss; g.shadowBlur = 8;
  g.beginPath(); g.ellipse(24, 30, 9, 8, 0, 0, 7); g.fill();
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(13 + i * 11, 15, 4, 0, 7); g.fill(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let glowTexCache = null;
function glowTexture() {
  if (glowTexCache) return glowTexCache;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  glowTexCache = new THREE.CanvasTexture(c);
  return glowTexCache;
}

function groundTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  // warm grimy asphalt / old tile blocks, dark wet roads
  g.fillStyle = "#332a20"; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#403527"; g.lineWidth = 14; g.strokeRect(60, 60, 452, 452);
  // tile seams inside the block
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 2;
  for (let i = 110; i < 460; i += 50) {
    g.beginPath(); g.moveTo(i, 60); g.lineTo(i, 452); g.stroke();
    g.beginPath(); g.moveTo(60, i); g.lineTo(452, i); g.stroke();
  }
  // grime blotches
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(${10 + Math.random() * 20 | 0},${8 + Math.random() * 14 | 0},6,${0.12 + Math.random() * 0.2})`;
    g.beginPath();
    g.arc(Math.random() * 512, Math.random() * 512, 8 + Math.random() * 36, 0, 7);
    g.fill();
  }
  g.fillStyle = "#1a140d";
  g.fillRect(0, 0, 512, 52); g.fillRect(0, 0, 52, 512);
  g.strokeStyle = "rgba(255,190,110,0.35)";
  g.lineWidth = 3; g.setLineDash([18, 26]);
  g.beginPath(); g.moveTo(0, 26); g.lineTo(512, 26); g.stroke();
  g.beginPath(); g.moveTo(26, 0); g.lineTo(26, 512); g.stroke();
  g.setLineDash([]);
  const tex = crisp(new THREE.CanvasTexture(c));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// roughness map: bright = rough asphalt, dark = smooth puddles that mirror neon
function groundRoughnessTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#9a9a9a";                       // base roughness ~0.6
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#6a6a6a";                       // roads a touch glossier
  g.fillRect(0, 0, 512, 52); g.fillRect(0, 0, 52, 512);
  for (let i = 0; i < 26; i++) {                 // puddles: near-mirror
    const r = 14 + Math.random() * 42;
    const grad = g.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
    grad.addColorStop(0, "#161616");
    grad.addColorStop(0.8, "#3a3a3a");
    grad.addColorStop(1, "#9a9a9a");
    g.save();
    g.translate(Math.random() * 512, Math.random() * 512);
    g.scale(1 + Math.random(), 0.6 + Math.random() * 0.5);
    g.fillStyle = grad;
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
    g.restore();
  }
  const tex = crisp(new THREE.CanvasTexture(c), false);   // data map: keep linear
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function groundBumpTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#404040"; g.lineWidth = 3;     // tile grout sits lower
  for (let i = 60; i < 512; i += 50) {
    g.beginPath(); g.moveTo(i, 60); g.lineTo(i, 452); g.stroke();
    g.beginPath(); g.moveTo(60, i); g.lineTo(452, i); g.stroke();
  }
  g.fillStyle = "#303030";
  g.fillRect(0, 46, 512, 8); g.fillRect(46, 0, 8, 512);   // curb drop to road
  for (let i = 0; i < 60; i++) {                  // pebbly noise
    g.fillStyle = Math.random() < 0.5 ? "#8a8a8a" : "#747474";
    g.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
  }
  const tex = crisp(new THREE.CanvasTexture(c), false);   // data map: keep linear
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ---------- shared materials ----------
const darkMat = new THREE.MeshStandardMaterial({ color: 0x261f15, roughness: 0.8, metalness: 0.3 });
const crateMat = new THREE.MeshStandardMaterial({ color: 0x4a3d26, roughness: 0.8, metalness: 0.15 });
const crateGlowMat = new THREE.MeshStandardMaterial({ color: 0x4a4028, roughness: 0.75, emissive: 0x00f0ff, emissiveIntensity: 0.12 });
const cardboardMat = new THREE.MeshStandardMaterial({ color: 0x6b5232, roughness: 0.95, metalness: 0.02 });
const tarpMats = [0x1d4a44, 0x4a2a1d, 0x2c3a1d, 0x36204a].map(c =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, metalness: 0.05, side: THREE.DoubleSide }));
const waterTowerMat = new THREE.MeshStandardMaterial({ color: 0x4a3528, roughness: 0.85, metalness: 0.15 });
const parapetMat = new THREE.MeshStandardMaterial({ color: 0x241d15, roughness: 0.85, metalness: 0.1 });
const roofConeMats = [0x5a2a22, 0x2a4a3a, 0x32325a].map(c =>
  new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, metalness: 0.1 }));
const lampConeGeo = new THREE.ConeGeometry(1.5, 3.7, 10, 1, true);
const pipeMat = new THREE.MeshStandardMaterial({ color: 0x2a3248, roughness: 0.55, metalness: 0.7 });
const railMat = new THREE.MeshStandardMaterial({ color: 0x39455f, roughness: 0.5, metalness: 0.8 });
const greenMat = new THREE.MeshStandardMaterial({ color: 0x2c6b3f, roughness: 0.9, emissive: 0x1c5b2f, emissiveIntensity: 0.25 });
function neonMat(color, i = 1.6) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i });
}

export function buildWorld(scene) {
  const rng = makeRng(20890214);
  const world = {
    colliders: [],
    buildings: [],            // { x,z,w,d,h } for bridges & placement
    roofSpots: [],
    streetSpots: [],
    trailSpots: [],
    cacheSpots: [],
    ringSpots: [],            // good places for neon jump-rings
    rings: [],                // { m, uid } built below, pruned by game from save
    vendings: [],             // { g, front, x, z, id }
    posters: [],              // { m, x, z, idx }
    cans: [],                 // { m, x, z, alive }
    signs: [],
    billboards: [],
    drones: [],
    cityNpcs: [],
    citizens: [],
    cars: [],
    bots: [],
    fish: [],
    holoCats: [],
    beams: [],
    puddles: [],
    blinkers: [],
    markers: [],              // bobbing activity icons
    shrinePos: new THREE.Vector3(20, 0, 14),
    vendorPos: new THREE.Vector3(-60, 0, 10),
    performerPos: new THREE.Vector3(-64, 0, 4),
    spirePos: new THREE.Vector3(102, 0, -102),
    shrineGroup: null,
    shrineLanterns: [],
    shrineDecor: { gate: false, orbs: [], beacon: null },
    train: null,
    rain: null,
    rainOn: false,
    sky: { hemi: null, moon: null },
  };

  // ---------- lights / sky: 80s Vice City magenta→teal dusk ----------
  const hemi = new THREE.HemisphereLight(0xff7ac8, 0x2a1840, 1.45);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xff9ed8, 0.85);   // warm sunset key light
  moon.position.set(0, 90, -180);
  scene.add(moon);
  const fill = new THREE.DirectionalLight(0x4de0ff, 0.4);    // teal fill from the other side
  fill.position.set(-120, 60, 120);
  scene.add(fill);
  world.sky.hemi = hemi; world.sky.moon = moon; world.sky.fill = fill;
  scene.fog = new THREE.FogExp2(0x2a1438, 0.0072);
  scene.background = new THREE.Color(0x241038);

  // big synthwave sky dome: magenta horizon → teal → indigo, with scanlines
  {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 256;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.00, "#120630");   // top indigo
    grad.addColorStop(0.45, "#3a1252");
    grad.addColorStop(0.62, "#7a1c6e");
    grad.addColorStop(0.74, "#d6346f");   // magenta band
    grad.addColorStop(0.84, "#ff7a4d");   // orange
    grad.addColorStop(0.92, "#ffc24d");   // sun-glow
    grad.addColorStop(1.00, "#ffe0a0");
    g.fillStyle = grad; g.fillRect(0, 0, 16, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(700, 24, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    scene.add(dome);

    // the iconic banded sunset sun on the horizon
    const sc = document.createElement("canvas");
    sc.width = sc.height = 256;
    const sg = sc.getContext("2d");
    const sun = sg.createLinearGradient(0, 0, 0, 256);
    sun.addColorStop(0, "#fff0b0"); sun.addColorStop(0.5, "#ff9a3c"); sun.addColorStop(1, "#ff2e7e");
    sg.fillStyle = sun; sg.beginPath(); sg.arc(128, 128, 120, 0, 7); sg.fill();
    // black scanline gaps across the lower half
    sg.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 7; i++) sg.fillRect(0, 150 + i * 14, 256, 5 + i);
    const stex = new THREE.CanvasTexture(sc);
    stex.colorSpace = THREE.SRGBColorSpace;
    const sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(150, 150),
      new THREE.MeshBasicMaterial({ map: stex, transparent: true, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    sunMesh.position.set(0, 50, -640);
    scene.add(sunMesh);
    world.sun = sunMesh;
  }

  // ---------- ground (wet asphalt, PBR: puddles mirror the env map) ----------
  const gRepeat = Math.round((CFG.CITY * 2 + 160) / PITCH);
  const gTex = groundTexture();
  const gRough = groundRoughnessTexture();
  const gBump = groundBumpTexture();
  for (const t of [gTex, gRough, gBump]) t.repeat.set(gRepeat, gRepeat);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CFG.CITY * 2 + 160, CFG.CITY * 2 + 160),
    new THREE.MeshStandardMaterial({
      map: gTex, roughnessMap: gRough, bumpMap: gBump, bumpScale: 1.2,
      roughness: 1, metalness: 0.45, envMapIntensity: 0.85,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // glowing puddles
  const puddleGeo = new THREE.CircleGeometry(1, 16);
  for (let i = 0; i < 90; i++) {
    const col = [0x00f0ff, 0xff2bd6, 0x7b61ff][(rng() * 3) | 0];
    const m = new THREE.Mesh(puddleGeo, new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    const lane = (((rng() * 11) | 0) - 5) * PITCH + 17;
    if (rng() < 0.5) m.position.set((rng() - 0.5) * 2 * CFG.CITY, 0.02, lane + (rng() - 0.5) * 5);
    else m.position.set(lane + (rng() - 0.5) * 5, 0.02, (rng() - 0.5) * 2 * CFG.CITY);
    m.scale.set(0.9 + rng() * 3.2, 0.8 + rng() * 1.8, 1);
    scene.add(m);
    world.puddles.push({ m, t: rng() * 9 });
  }

  // stars
  {
    const n = 800, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rng() * Math.PI * 2, r = 420 + rng() * 300;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 70 + rng() * 360;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbcd7ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 })));
  }

  // ---------- horizon: endless skyline silhouette + city glow ----------
  {
    const c = document.createElement("canvas");
    c.width = 2048; c.height = 256;
    const g = c.getContext("2d");
    // city-glow gradient rising from the horizon line
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "rgba(8,9,20,0)");
    grad.addColorStop(0.55, "rgba(24,12,48,0.25)");
    grad.addColorStop(0.8, "rgba(96,24,110,0.55)");
    grad.addColorStop(1, "rgba(40,140,170,0.85)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 2048, 256);
    // distant towers
    let x = 0;
    while (x < 2048) {
      const w = 16 + rng() * 44;
      const h = 40 + rng() * 130;
      g.fillStyle = "rgba(4,5,12,0.96)";
      g.fillRect(x, 256 - h, w, h);
      const cols = ["#ff2bd6", "#00f0ff", "#ffb347", "#aaff00", "#7b61ff"];
      for (let wy = 256 - h + 6; wy < 246; wy += 9) {
        for (let wx = x + 3; wx < x + w - 4; wx += 7) {
          if (rng() < 0.22) {
            g.fillStyle = rng() < 0.75 ? "rgba(255,220,150,0.8)" : cols[(rng() * cols.length) | 0];
            g.fillRect(wx, wy, 3, 4);
          }
        }
      }
      // a few rooftop beacons
      if (rng() < 0.3) {
        g.fillStyle = "#ff4455";
        g.fillRect(x + w / 2, 256 - h - 4, 2, 2);
      }
      x += w + 2 + rng() * 14;
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(3, 1);
    const skyline = new THREE.Mesh(
      new THREE.CylinderGeometry(620, 620, 170, 64, 1, true),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    skyline.position.y = 84;
    scene.add(skyline);
    world.skyline = skyline;
  }

  // ---------- helpers ----------
  function collide(x, y, z, w, h, d) {
    world.colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, top: y + h, bot: y });
  }
  function block(x, y, z, w, h, d, mat, solid = true) {
    const m = new THREE.Mesh(BOX, mat);
    m.scale.set(w, h, d);
    m.position.set(x, y + h / 2, z);
    scene.add(m);
    if (solid) collide(x, y, z, w, h, d);
    return m;
  }
  function cylinder(x, y, z, r, h, mat, solid = false) {
    const m = new THREE.Mesh(CYL, mat);
    m.scale.set(r * 2, h, r * 2);
    m.position.set(x, y + h / 2, z);
    scene.add(m);
    if (solid) collide(x, y, z, r * 1.6, h, r * 1.6);
    return m;
  }
  const pawTexCyan = pawTexture("#5ce8ff");
  const pawTexAmber = pawTexture("#ffd98a");
  function pawprint(x, z, angle = 0, amber = false) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55),
      new THREE.MeshBasicMaterial({ map: amber ? pawTexAmber : pawTexCyan, transparent: true, opacity: 0.85, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = angle;
    m.position.set(x, 0.04, z);
    scene.add(m);
    return m;
  }
  function pawTrail(x0, z0, x1, z1) {
    const n = Math.max(3, Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.6));
    const ang = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pawprint(x0 + (x1 - x0) * t + (i % 2 ? 0.25 : -0.25), z0 + (z1 - z0) * t, -ang, i % 4 === 0);
    }
  }
  function marker(text, colorCss, x, y, z) {
    const s = textSprite(text, colorCss, 64, 44);
    s.position.set(x, y, z);
    scene.add(s);
    world.markers.push({ m: s, baseY: y, ph: rng() * 9 });
    return s;
  }

  // fake neon reflection pooling on the wet ground — the Stray look
  const glowGeo = new THREE.PlaneGeometry(1, 1);
  function groundGlow(x, z, color, sx = 3, sz = 4.5, op = 0.17) {
    const m = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
      map: glowTexture(), color, transparent: true, opacity: op,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(sx, sz, 1);
    m.position.set(x, 0.035, z);
    scene.add(m);
    return m;
  }
  world.groundGlow = groundGlow;

  const winTexCache = {};
  function towerMat(tintHex) {
    if (!winTexCache[tintHex]) winTexCache[tintHex] = [];
    const arr = winTexCache[tintHex];
    if (arr.length < 4) {
      const facades = ["#1a1510", "#15120c", "#1d1812", "#141710"];
      const m = new THREE.MeshStandardMaterial({
        map: windowTexture(rng, "#" + tintHex.toString(16).padStart(6, "0"), facades[arr.length]),
        roughness: 0.85, metalness: 0.2,
        emissive: 0xffffff, emissiveIntensity: 1.0,
      });
      m.emissiveMap = m.map;
      arr.push(m);
    }
    return arr[(rng() * arr.length) | 0];
  }

  // full 6-face material set: detailed facades on the walls, grimy roof on top
  const facadeCache = { roofs: null };
  function buildingMats(tintHex, h, storefront = true) {
    if (!facadeCache.roofs) {
      facadeCache.roofs = [];
      for (let i = 0; i < 4; i++) {
        facadeCache.roofs.push(new THREE.MeshStandardMaterial({ map: roofTexture(rng), roughness: 0.9, metalness: 0.1 }));
      }
    }
    const tintCss = "#" + tintHex.toString(16).padStart(6, "0");
    const floors = Math.max(3, Math.min(11, Math.round(h / 2.4)));
    const key = tintHex + (floors <= 5 ? "L" : "H") + (storefront ? "S" : "");
    if (!facadeCache[key]) facadeCache[key] = [];
    const arr = facadeCache[key];
    if (arr.length < 3) {
      const mk = () => {
        const m = new THREE.MeshStandardMaterial({
          map: facadeTexture(rng, tintCss, floors <= 5 ? 4 : 8, storefront),
          roughness: 0.82, metalness: 0.18,
          emissive: 0xffffff, emissiveIntensity: 0.6,
        });
        m.emissiveMap = m.map;
        return m;
      };
      arr.push([mk(), mk()]);
    }
    const [fa, fb] = arr[(rng() * arr.length) | 0];
    const roof = facadeCache.roofs[(rng() * 4) | 0];
    return [fa, fa, roof, darkMat, fb, fb];
  }

  // climb route: glowing crate steps (1.4 m — single-jumpable) + pawprints at the base
  function parkourStack(b, side) {
    const sx = b.x + side * (b.w / 2 + 1.8);
    let y = 0, step = 0;
    const trail = [];
    while (y + 1.4 < b.h && step <= 14) {
      const cx = sx + (step % 2) * 2.1 * side;
      const cz = b.z + ((step >> 1) % 2 ? 1.2 : -1.2);
      block(cx, y, cz, 2.4, 1.4, 2.4, step % 2 === 0 ? crateGlowMat : crateMat);
      trail.push({ x: cx, y: y + 2, z: cz });
      y += 1.4; step++;
    }
    trail.push({ x: b.x + side * b.w * 0.25, y: b.h + 0.6, z: b.z });
    world.trailSpots.push(trail);
    pawprint(sx - side * 1.8, b.z, side > 0 ? -Math.PI / 2 : Math.PI / 2);
    pawprint(sx - side * 0.9, b.z + 0.5, side > 0 ? -Math.PI / 2 : Math.PI / 2, true);
    if (rng() < 0.5) world.ringSpots.push({ x: sx, y: y + 1.4, z: b.z });
  }

  // fire escape: zig-zag ledges up a wall
  function fireEscape(b) {
    const side = rng() < 0.5 ? 1 : -1;
    const fx = b.x + side * (b.w / 2 + 0.7);
    let y = 1.5;
    const trail = [];
    let k = 0;
    while (y < b.h - 0.5 && k < 10) {
      const fz = b.z + ((k % 2) * 2 - 1) * 1.3;
      block(fx, y, fz, 1.7, 0.14, 1.1, railMat);
      const strip = block(fx, y + 0.14, fz - 0.5, 1.7, 0.05, 0.07, neonMat(0xffb347, 1.2), false);
      trail.push({ x: fx, y: y + 0.8, z: fz });
      y += 1.5; k++;
    }
    trail.push({ x: b.x, y: b.h + 0.6, z: b.z });
    world.trailSpots.push(trail);
    pawprint(fx + side * 0.9, b.z, side > 0 ? Math.PI / 2 : -Math.PI / 2);
  }

  function roofDecor(b, tint) {
    const choice = rng();
    if (choice < 0.2) {
      cylinder(b.x + (rng() - 0.5) * b.w * 0.3, b.h + 0.7, b.z + (rng() - 0.5) * b.d * 0.3, 0.9, 1.5, pipeMat);
      cylinder(b.x + (rng() - 0.5) * b.w * 0.3, b.h, b.z, 0.1, 0.8, railMat);
    } else if (choice < 0.4) {
      const ax = b.x + (rng() - 0.5) * b.w * 0.4, az = b.z + (rng() - 0.5) * b.d * 0.4;
      cylinder(ax, b.h, az, 0.07, 3 + rng() * 3, railMat);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), neonMat(0xff3344, 2.5));
      tip.position.set(ax, b.h + 3 + rng() * 3, az);
      scene.add(tip);
      world.blinkers.push({ m: tip, t: rng() * 5 });
    } else if (choice < 0.56) {
      block(b.x, b.h, b.z + (rng() - 0.5) * 2, Math.min(5, b.w * 0.5), 0.35, Math.min(3.5, b.d * 0.5), greenMat, false);
      for (let i = 0; i < 3; i++) {
        const tree = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 6), greenMat);
        tree.position.set(b.x + (rng() - 0.5) * 2.6, b.h + 0.8, b.z + (rng() - 0.5) * 1.8);
        scene.add(tree);
      }
    } else if (choice < 0.72) {
      block(b.x + (rng() - 0.5) * b.w * 0.4, b.h, b.z + (rng() - 0.5) * b.d * 0.4, 1.7, 1, 1.7, darkMat);
    }
    // classic rooftop water tower — a little perch with personality
    if (b.h > 8 && rng() < 0.22) {
      const wx = b.x + (rng() - 0.5) * b.w * 0.3, wz = b.z + (rng() - 0.5) * b.d * 0.3;
      for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
        cylinder(wx + dx, b.h, wz + dz, 0.07, 1.1, railMat);
      }
      cylinder(wx, b.h + 1.1, wz, 1.05, 1.7, waterTowerMat, true);
      const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.7, 12), waterTowerMat);
      cap.position.set(wx, b.h + 3.15, wz);
      scene.add(cap);
    }
    // roof edge: solid parapet lip or thin railing
    if (rng() < 0.75) {
      const lip = rng() < 0.55;
      const rh = lip ? 0.5 : 0.45, tk = lip ? 0.3 : 0.07;
      const m2 = lip ? parapetMat : railMat;
      block(b.x, b.h, b.z - b.d / 2 + tk / 2 + 0.05, b.w, rh, tk, m2, false);
      block(b.x, b.h, b.z + b.d / 2 - tk / 2 - 0.05, b.w, rh, tk, m2, false);
      block(b.x - b.w / 2 + tk / 2 + 0.05, b.h, b.z, tk, rh, b.d, m2, false);
      block(b.x + b.w / 2 - tk / 2 - 0.05, b.h, b.z, tk, rh, b.d, m2, false);
    }
  }

  let vendCount = 0, posterCount = 0;
  function shopfront(b, tint) {
    const face = rng() < 0.5 ? 1 : -1;     // +z or -z face
    const fz = b.z + face * (b.d / 2 + 0.02);
    // doorway: dark inset + glowing frame
    const doorX = b.x + (rng() - 0.5) * (b.w - 3);
    block(doorX, 0, fz + face * 0.06, 1.3, 2.1, 0.12, new THREE.MeshStandardMaterial({ color: 0x05060c }), false);
    block(doorX, 2.15, fz + face * 0.1, 1.5, 0.09, 0.09, neonMat(tint, 1.4), false);
    block(doorX - 0.78, 0, fz + face * 0.1, 0.09, 2.2, 0.09, neonMat(tint, 1.4), false);
    block(doorX + 0.78, 0, fz + face * 0.1, 0.09, 2.2, 0.09, neonMat(tint, 1.4), false);
    // warm spill from the doorway + neon reflection on the wet street
    groundGlow(doorX, fz + face * 1.6, 0xffb070, 2.6, 3.2, 0.13);
    groundGlow(doorX, fz + face * 2.4, tint, 2.8, 4.6, 0.15);
    // protruding lit sign board over the door (like a hanging shop sign)
    if (rng() < 0.65) {
      const sCol = [0xff2bd6, 0x00f0ff, 0xaaff00, 0xffb347, 0xff5a3c][(rng() * 5) | 0];
      const sy = 3.1 + rng() * 1.6;
      block(doorX + 1.1, sy, fz + face * 0.7, 0.16, 1.5, 0.7, neonMat(sCol, 1.1), false);
      block(doorX + 1.1, sy + 1.5, fz + face * 0.35, 0.08, 0.08, 0.8, railMat, false);
      groundGlow(doorX + 1.1, fz + face * 1.4, sCol, 1.8, 3, 0.12);
    }
    // clutter at the base of the wall: stacked boxes & junk
    const clutterN = 1 + ((rng() * 3) | 0);
    for (let i = 0; i < clutterN; i++) {
      const cw = 0.6 + rng() * 0.8;
      const cx2 = doorX + (rng() < 0.5 ? -1 : 1) * (2.8 + rng() * 3), cz2 = fz + face * (0.5 + rng() * 0.4);
      block(cx2, 0, cz2, cw, 0.5 + rng() * 0.7, cw, rng() < 0.4 ? cardboardMat : crateMat);
      if (rng() < 0.4) block(cx2 + 0.2, 0.5 + rng() * 0.7, cz2, cw * 0.7, 0.4, cw * 0.7, cardboardMat, false);
    }
    // tarp canopy slung overhead across the alley
    if (rng() < 0.35) {
      const tarp = new THREE.Mesh(new THREE.PlaneGeometry(3.5 + rng() * 2.5, 2.6 + rng() * 1.6),
        tarpMats[(rng() * tarpMats.length) | 0]);
      tarp.position.set(doorX + (rng() - 0.5) * 4, 4.4 + rng() * 1.8, fz + face * (1.6 + rng()));
      tarp.rotation.x = -0.35 - rng() * 0.3;
      tarp.rotation.y = (rng() - 0.5) * 0.5;
      scene.add(tarp);
    }
    // awning above the door — solid, a cat platform
    if (rng() < 0.75) {
      block(doorX, 2.5, fz + face * 0.9, 3, 0.16, 1.7, neonMat(tint, 0.35));
      // crate beside it: ground → crate → awning
      block(doorX + 2.2, 0, fz + face * 0.8, 1.6, 1.3, 1.6, crateGlowMat);
      world.trailSpots.push([
        { x: doorX + 2.2, y: 1.9, z: fz + face * 0.8 },
        { x: doorX, y: 3.2, z: fz + face * 0.9 },
      ]);
      if (rng() < 0.45) world.ringSpots.push({ x: doorX, y: 3.9, z: fz + face * 0.9 });
    }
    // vending machine
    if (vendCount < 14 && rng() < 0.4) {
      const vx = doorX - 2.4, vz = fz + face * 0.5;
      const g = new THREE.Group();
      block(vx, 0, vz, 0.95, 1.9, 0.7, darkMat);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: [0x00f0ff, 0xffb347, 0xff2bd6][vendCount % 3], emissiveIntensity: 0.7, roughness: 0.4 }));
      front.position.set(vx, 1.05, vz + face * 0.37);
      if (face < 0) front.rotation.y = Math.PI;
      scene.add(front);
      groundGlow(vx, vz + face * 1.3, [0x00f0ff, 0xffb347, 0xff2bd6][vendCount % 3], 2, 2.8, 0.18);
      world.vendings.push({ front, x: vx, z: vz, id: "vm" + vendCount });
      vendCount++;
    }
    // poster
    if (posterCount < 12 && rng() < 0.4) {
      const px = doorX + (rng() < 0.5 ? -3.6 : 3.4), pz = fz + face * 0.08;
      const idx = posterCount % POSTERS.length;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.8),
        new THREE.MeshBasicMaterial({ map: posterTexture(rng, idx), transparent: true, opacity: 0.95 }));
      m.position.set(px, 1.6, pz);
      if (face < 0) m.rotation.y = Math.PI;
      scene.add(m);
      world.posters.push({ m, x: px, z: pz, idx, id: "ps" + posterCount });
      posterCount++;
    }
    // knockable cans by the door
    if (rng() < 0.55) {
      for (let i = 0; i < 2 + ((rng() * 2) | 0); i++) {
        const cm = new THREE.Mesh(CYL, new THREE.MeshStandardMaterial({ color: [0x8a4a3a, 0x3a6a4a, 0x4a4a6a][(rng() * 3) | 0], metalness: 0.7, roughness: 0.4 }));
        cm.scale.set(0.18, 0.24, 0.18);
        const cx = doorX - 1.2 + rng() * 1.4, cz = fz + face * (0.6 + rng() * 0.5);
        cm.position.set(cx, 0.12, cz);
        cm.rotation.z = rng() < 0.4 ? Math.PI / 2 : 0;
        scene.add(cm);
        world.cans.push({ m: cm, x: cx, z: cz, alive: true });
      }
    }
  }

  function facadeDecor(b, tint) {
    if (rng() < 0.6) cylinder(b.x + b.w / 2 + 0.14, 0, b.z + b.d / 2 - 0.5, 0.13, b.h * 0.9, pipeMat);
    // solid balconies (cat ledges)
    const nb = (rng() * 2.4) | 0;
    for (let i = 0; i < nb; i++) {
      const by = 2.6 + rng() * Math.max(1, b.h - 4);
      const side = rng() < 0.5;
      const bx = side ? b.x + b.w / 2 + 0.55 : b.x + (rng() - 0.5) * b.w * 0.5;
      const bz = side ? b.z + (rng() - 0.5) * b.d * 0.5 : b.z + b.d / 2 + 0.55;
      block(bx, by, bz, 1.7, 0.12, 1.1, darkMat);
      block(bx, by + 0.12, bz + (side ? 0 : 0.5), 1.7, 0.4, 0.06, railMat, false);
    }
    if (rng() < 0.85) {
      const names = ["NOODLE ROW", "ホロ・キブル", "SYNTH CAFE", "DRONE BAR", "ネオン市場", "BYTE&BREW", "PAW LAUNDRY", "GHOST TRAIN", "OLD SIGNAL", "電脳猫", "RAMEN 24h", "ナイン号線"];
      const colorHexes = ["#ff2bd6", "#00f0ff", "#aaff00", "#ffb347", "#9f7bff"];
      const vertical = rng() < 0.4;
      const s = textSprite(names[(rng() * names.length) | 0], colorHexes[(rng() * colorHexes.length) | 0], 256, 46, vertical);
      if (rng() < 0.5) {
        s.position.set(b.x, 2.6 + rng() * Math.max(1.5, b.h - 4), b.z + b.d / 2 + 0.25);
      } else {
        s.position.set(b.x + b.w / 2 + 0.25, 2.6 + rng() * Math.max(1.5, b.h - 4), b.z);
        s.rotation.y = Math.PI / 2;
      }
      scene.add(s);
      world.signs.push({ mesh: s, t: rng() * 10, rate: 0.5 + rng() * 4 });
    }
    if (rng() < 0.42 && b.h > 9) {
      const bb = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.75),
        new THREE.MeshBasicMaterial({ map: billboardTexture(rng), transparent: true, opacity: 0.92, side: THREE.DoubleSide }));
      bb.position.set(b.x + (rng() < 0.5 ? 1 : -1) * (b.w / 2 + 0.3), b.h * 0.55 + rng() * b.h * 0.3, b.z);
      bb.rotation.y = Math.PI / 2;
      scene.add(bb);
      world.billboards.push({ m: bb, t: rng() * 9 });
    }
  }

  // ---------- building variants (low, cat-scale) ----------
  function buildingSimple(gx, gz, zone) {
    const tint = zone.color;
    const scaleH = zone.id === "corporate" ? 1.9 : zone.id === "plaza" ? 0.7 : 1;
    const w = 9 + rng() * 8, d = 9 + rng() * 8;
    const h = (4.5 + rng() * 10) * scaleH;
    const x = gx + (rng() - 0.5) * (PITCH - w - 9);
    const z = gz + (rng() - 0.5) * (PITCH - d - 9);
    block(x, 0, z, w, h, d, buildingMats(tint, h));
    const b = { x, z, w, d, h };
    world.buildings.push(b);
    world.roofSpots.push({ x, y: h, z });
    // pagoda-style pyramid roof on some low buildings; otherwise normal roof clutter
    if (h < 10 && rng() < 0.3) {
      block(x, h, z, w + 1, 0.25, d + 1, darkMat, false);
      const ch = 1.6 + rng() * 1.2;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.62, ch, 4), roofConeMats[(rng() * 3) | 0]);
      cone.position.set(x, h + 0.25 + ch / 2, z);
      cone.rotation.y = Math.PI / 4;
      scene.add(cone);
      const tip2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), neonMat(0xffb347, 2));
      tip2.position.set(x, h + 0.3 + ch, z);
      scene.add(tip2);
    } else {
      roofDecor(b, tint);
    }
    facadeDecor(b, tint);
    shopfront(b, tint);
    if (h < 16 && rng() < 0.85) parkourStack(b, rng() < 0.5 ? 1 : -1);
    else if (rng() < 0.5) fireEscape(b);
    return b;
  }

  function buildingTiered(gx, gz, zone) {
    const tint = zone.color;
    const tiers = 2 + ((rng() * 2) | 0);
    let w = 12 + rng() * 6, d = 12 + rng() * 6, y = 0;
    const x = gx + (rng() - 0.5) * (PITCH - w - 9);
    const z = gz + (rng() - 0.5) * (PITCH - d - 9);
    let top = 0;
    for (let i = 0; i < tiers; i++) {
      const h = 3.5 + rng() * 4.5;
      block(x, y, z, w, h, d, buildingMats(tint, h, i === 0));
      y += h; top = y;
      world.roofSpots.push({ x: x + (w / 2) * 0.55, y: top, z });
      w *= 0.66; d *= 0.66;
    }
    const b = { x, z, w: 12 + rng() * 4, d: 12 + rng() * 4, h: top };
    world.buildings.push({ x, z, w: b.w, d: b.d, h: top });
    facadeDecor({ x, z, w: b.w, d: b.d, h: top * 0.6 }, tint);
    shopfront({ x, z, w: b.w, d: b.d, h: top }, tint);
    if (rng() < 0.8) parkourStack({ x, z, w: b.w, d: b.d, h: Math.min(8, top) }, rng() < 0.5 ? 1 : -1);
    return b;
  }

  function buildingRound(gx, gz, zone) {
    const tint = zone.color;
    const r = 5 + rng() * 3.5;
    const h = (12 + rng() * 16) * (zone.id === "corporate" ? 1.2 : 1);
    const x = gx + (rng() - 0.5) * (PITCH - r * 2 - 8);
    const z = gz + (rng() - 0.5) * (PITCH - r * 2 - 8);
    const bm = buildingMats(tint, h, false);
    cylinder(x, 0, z, r, h, [bm[0], bm[2], bm[3]], true);
    world.buildings.push({ x, z, w: r * 2, d: r * 2, h });
    world.roofSpots.push({ x, y: h, z });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r + 0.22, 0.11, 8, 32), neonMat(tint, 2));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, h * 0.85, z);
    scene.add(ring);
    cylinder(x, h, z, 0.09, 4.5, railMat);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), neonMat(0xff3344, 2.5));
    tip.position.set(x, h + 4.5, z);
    scene.add(tip);
    world.blinkers.push({ m: tip, t: rng() * 5 });
    if (rng() < 0.7) fireEscape({ x, z, w: r * 2, d: r * 2, h });
    return { x, z, w: r * 2, d: r * 2, h };
  }

  // ---------- city grid ----------
  const B = CFG.CITY - 17;
  for (let gx = -B + ((-B + 183) % PITCH); gx <= B; gx += PITCH) {
    for (let gz = -B + ((-B + 183) % PITCH); gz <= B; gz += PITCH) {
      if (Math.abs(gx - 21) <= 25 && Math.abs(gz - 21) <= 25) continue;   // open plaza
      const zone = zoneAt(gx);
      const roll = rng();
      if (zone.id === "corporate" && roll < 0.3) buildingRound(gx, gz, zone);
      else if (roll < 0.42) buildingTiered(gx, gz, zone);
      else buildingSimple(gx, gz, zone);
      if (rng() < 0.6) buildingSimple(gx, gz, zone);
      world.streetSpots.push({ x: gx + PITCH / 2 - 3, y: 0, z: gz + (rng() - 0.5) * 20 });
      world.streetSpots.push({ x: gx + (rng() - 0.5) * 20, y: 0, z: gz + PITCH / 2 - 3 });
    }
  }

  // ---------- roof bridges (axis-aligned planks between close roofs) ----------
  {
    let bridges = 0;
    const bs = world.buildings;
    for (let i = 0; i < bs.length && bridges < 30; i++) {
      for (let j = i + 1; j < bs.length && bridges < 30; j++) {
        const a = bs[i], b = bs[j];
        if (Math.abs(a.h - b.h) > 1.4) continue;
        const y = Math.min(a.h, b.h);
        if (Math.abs(a.x - b.x) < 3) {
          const e1 = a.z < b.z ? a.z + a.d / 2 : b.z + b.d / 2;
          const e2 = a.z < b.z ? b.z - b.d / 2 : a.z - a.d / 2;
          const gap = e2 - e1;
          if (gap < 1.5 || gap > 11) continue;
          const x = (a.x + b.x) / 2, zc = (e1 + e2) / 2;
          block(x, y - 0.2, zc, 1.1, 0.2, gap + 1.2, darkMat);
          block(x + 0.45, y, zc, 0.07, 0.05, gap + 1, neonMat(0x00f0ff, 1.2), false);
          world.trailSpots.push([{ x, y: y + 0.6, z: e1 + gap * 0.25 }, { x, y: y + 0.6, z: e1 + gap * 0.75 }]);
          if (rng() < 0.4) world.ringSpots.push({ x, y: y + 1.3, z: zc });
          bridges++;
        } else if (Math.abs(a.z - b.z) < 3) {
          const e1 = a.x < b.x ? a.x + a.w / 2 : b.x + b.w / 2;
          const e2 = a.x < b.x ? b.x - b.w / 2 : a.x - a.w / 2;
          const gap = e2 - e1;
          if (gap < 1.5 || gap > 11) continue;
          const z = (a.z + b.z) / 2, xc = (e1 + e2) / 2;
          block(xc, y - 0.2, z, gap + 1.2, 0.2, 1.1, darkMat);
          block(xc, y, z + 0.45, gap + 1, 0.05, 0.07, neonMat(0x00f0ff, 1.2), false);
          world.trailSpots.push([{ x: e1 + gap * 0.25, y: y + 0.6, z }, { x: e1 + gap * 0.75, y: y + 0.6, z }]);
          if (rng() < 0.4) world.ringSpots.push({ x: xc, y: y + 1.3, z });
          bridges++;
        }
      }
    }
  }

  // ---------- rideable ziplines: high roof → low roof ----------
  world.ziplines = [];
  {
    const zipMat = new THREE.LineBasicMaterial({ color: 0x7befff, transparent: true, opacity: 0.9 });
    const bs = world.buildings;
    for (let i = 0; i < bs.length && world.ziplines.length < 8; i++) {
      for (let j = 0; j < bs.length && world.ziplines.length < 8; j++) {
        const hi = bs[i], lo = bs[j];
        if (hi === lo || hi.h - lo.h < 3.5) continue;
        const dist = Math.hypot(hi.x - lo.x, hi.z - lo.z);
        if (dist < 18 || dist > 46) continue;
        // start post on the high roof edge facing the low roof
        const dir = { x: (lo.x - hi.x) / dist, z: (lo.z - hi.z) / dist };
        const a = new THREE.Vector3(hi.x + dir.x * (hi.w * 0.35), hi.h + 1.5, hi.z + dir.z * (hi.d * 0.35));
        const b = new THREE.Vector3(lo.x - dir.x * (lo.w * 0.25), lo.h + 1.2, lo.z - dir.z * (lo.d * 0.25));
        const c = a.clone().lerp(b, 0.5);
        c.y = Math.min(a.y, b.y) + 0.4;   // gentle sag, still downhill
        // visual: posts + cable + glowing start marker
        cylinder(a.x, hi.h, a.z, 0.07, 1.5, railMat);
        cylinder(b.x, lo.h, b.z, 0.07, 1.2, railMat);
        const pts = [];
        for (let k = 0; k <= 14; k++) {
          const t = k / 14;
          pts.push(new THREE.Vector3(
            (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
            (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
            (1 - t) * (1 - t) * a.z + 2 * (1 - t) * t * c.z + t * t * b.z
          ));
        }
        scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), zipMat));
        const hook = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 14), neonMat(0x00f0ff, 2));
        hook.position.copy(a);
        scene.add(hook);
        world.markers.push({ m: textSprite("Z", "#5ce8ff", 64, 44), baseY: a.y + 1, ph: rng() * 9 });
        world.markers[world.markers.length - 1].m.position.set(a.x, a.y + 1, a.z);
        scene.add(world.markers[world.markers.length - 1].m);
        world.ziplines.push({ a, b, c, len: dist, hook });
        i += 3;   // spread them around the city
        break;
      }
    }
  }

  // ---------- courier boards: take timed delivery jobs ----------
  world.courierBoards = [];
  for (const [bx, bz] of [[-64, 26], [52, 40], [163, 26]]) {
    cylinder(bx, 0, bz, 0.09, 2.2, railMat, true);
    const panel = block(bx, 1.4, bz, 1.5, 1.0, 0.14, neonMat(0xffb347, 0.5), false);
    const sign = textSprite("▣ JOBS", "#ffb347", 160, 40);
    sign.position.set(bx, 2.8, bz);
    scene.add(sign);
    world.signs.push({ mesh: sign, t: 0, rate: 0.6 });
    groundGlow(bx, bz, 0xffb347, 2.6, 2.6, 0.15);
    marker("▣", "#ffb347", bx, 3.6, bz);
    world.courierBoards.push({ x: bx, z: bz, panel });
  }

  // ---------- quest-giver NPCs (named, with floating state markers) ----------
  world.questNpcs = [];
  for (const q of SIDE_QUESTS) {
    const g = makePerson(q.color, rng);
    g.position.set(q.npc.x, 0, q.npc.z);
    g.rotation.y = rng() * Math.PI * 2;
    scene.add(g);
    // soft personal light so they read as "important"
    const light = new THREE.PointLight(q.color, 5, 9, 1.8);
    light.position.set(q.npc.x, 2.2, q.npc.z);
    scene.add(light);
    const nameTag = textSprite(q.giver, "#" + q.color.toString(16).padStart(6, "0"), 128, 40);
    nameTag.position.set(q.npc.x, 2.5, q.npc.z);
    scene.add(nameTag);
    const mk = marker("!", "#" + q.color.toString(16).padStart(6, "0"), q.npc.x, 3.3, q.npc.z);
    world.questNpcs.push({ id: q.id, g, nameTag, marker: mk, x: q.npc.x, z: q.npc.z, color: q.color });
  }

  // ---------- named city neighbors: lightweight lore/conversation NPCs ----------
  world.cityNpcs = [];
  for (const n of CITY_NPCS) {
    const g = n.id === "n_omo" ? makeRobot(n.color, rng) : makePerson(n.color, rng);
    g.position.set(n.x, 0, n.z);
    g.rotation.y = rng() * Math.PI * 2;
    scene.add(g);
    const light = new THREE.PointLight(n.color, 3.8, 7, 1.8);
    light.position.set(n.x, 2, n.z);
    scene.add(light);
    const nameTag = textSprite(n.name, "#" + n.color.toString(16).padStart(6, "0"), 128, 38);
    nameTag.position.set(n.x, 2.35, n.z);
    scene.add(nameTag);
    const mk = marker("...", "#" + n.color.toString(16).padStart(6, "0"), n.x, 3.05, n.z);
    world.cityNpcs.push({ id: n.id, g, nameTag, marker: mk, x: n.x, z: n.z, color: n.color });
  }
  // side-quest errand beam (cyan, points to the active errand)
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.8, 100, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.position.y = 50; beam.visible = false;
    scene.add(beam);
    world.questBeam = beam;
  }

  // ---------- hidden discovery beacons (faint until found) ----------
  world.discoveries = [];
  for (const dsc of DISCOVERIES) {
    const g = new THREE.Group();
    // a subtle violet shard that only glints — you find it by exploring, not by beam
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.4),
      new THREE.MeshStandardMaterial({ color: 0x9f7bff, emissive: 0x9f7bff, emissiveIntensity: 1.2, transparent: true, opacity: 0.7 }));
    shard.position.y = (dsc.minY || 0) + 1.0;
    g.add(shard);
    g.position.set(dsc.x, 0, dsc.z);
    scene.add(g);
    world.discoveries.push({ ...dsc, g, shard, ph: Math.random() * 9 });
  }

  // destination beam (hidden until a job is active)
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.8, 90, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.position.y = 45;
    beam.visible = false;
    scene.add(beam);
    world.deliveryBeam = beam;
  }
  // mission waypoint beam — gold/cyan pillar marking the active mission target
  {
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 2.4, 120, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffe14d, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.position.y = 60;
    beam.visible = false;
    scene.add(beam);
    world.missionBeam = beam;
  }

  // ---------- pigeon flocks (scatter when PawPaw pounces through) ----------
  world.pigeons = [];
  {
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x8a8f9e, roughness: 0.9 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.9 });
    for (let f = 0; f < 5; f++) {
      const s = world.streetSpots[(rng() * world.streetSpots.length) | 0];
      if (!s) break;
      const flock = { x: s.x, z: s.z, birds: [], state: "peck", t: 0 };
      for (let i = 0; i < 4; i++) {
        const bird = new THREE.Group();
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), bodyMat);
        body.scale.set(1, 0.85, 1.3);
        body.position.y = 0.1;
        bird.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 7, 5), headMat);
        head.position.set(0, 0.18, 0.1);
        bird.add(head);
        bird.position.set(s.x + (rng() - 0.5) * 2.4, 0, s.z + (rng() - 0.5) * 2.4);
        bird.rotation.y = rng() * Math.PI * 2;
        scene.add(bird);
        flock.birds.push({ m: bird, ph: rng() * 9, vx: 0, vy: 0, vz: 0 });
      }
      world.pigeons.push(flock);
    }
  }

  // ---------- glowing eye-pairs watching from dark alleys ----------
  world.alleyEyes = [];
  {
    const eyeGeo = new THREE.SphereGeometry(0.045, 6, 5);
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      const m = neonMat([0xaaff00, 0xffb347, 0x00f0ff][(rng() * 3) | 0], 2.2);
      for (const s of [-1, 1]) {
        const eye = new THREE.Mesh(eyeGeo, m);
        eye.position.x = s * 0.07;
        g.add(eye);
      }
      g.position.set(-195 + rng() * 80, 0.25 + rng() * 0.4, (rng() - 0.5) * 2 * (CFG.CITY - 30));
      scene.add(g);
      world.alleyEyes.push({ g, t: rng() * 9 });
    }
  }

  // ---------- hanging cables between rooftops ----------
  {
    const cableMat = new THREE.LineBasicMaterial({ color: 0x252c40, transparent: true, opacity: 0.8 });
    const bs = world.buildings;
    for (let k = 0; k < 26 && bs.length > 4; k++) {
      const a = bs[(rng() * bs.length) | 0], b = bs[(rng() * bs.length) | 0];
      const dist = Math.hypot(a.x - b.x, a.z - b.z);
      if (a === b || dist > 30 || dist < 6) continue;
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        pts.push(new THREE.Vector3(
          a.x + (b.x - a.x) * t,
          a.h + (b.h - a.h) * t - Math.sin(t * Math.PI) * 1.6,
          a.z + (b.z - a.z) * t
        ));
      }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat));
    }
  }

  // ---------- palm trees: the Vice City silhouette, lit from below ----------
  {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a26, roughness: 0.9 });
    const frondMat = new THREE.MeshStandardMaterial({ color: 0x1f6b3a, roughness: 0.7, emissive: 0x0a2a16, emissiveIntensity: 0.4, side: THREE.DoubleSide });
    const frondGeo = new THREE.PlaneGeometry(0.6, 3.4);
    frondGeo.translate(0, -1.4, 0);   // pivot at the base of the leaf (once, shared)
    const palm = (x, z) => {
      const g = new THREE.Group();
      const h = 5 + rng() * 3;
      // curved trunk from stacked tapered segments
      let yy = 0, lean = (rng() - 0.5) * 0.5;
      const segs = 6;
      for (let s = 0; s < segs; s++) {
        const sh = h / segs;
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.16 - s * 0.012, 0.2 - s * 0.012, sh, 6), trunkMat);
        seg.position.set(Math.sin(lean * s / segs) * 0.9, yy + sh / 2, 0);
        seg.rotation.z = -lean * 0.12;
        g.add(seg);
        yy += sh;
      }
      const top = new THREE.Vector3(Math.sin(lean) * 0.9, h, 0);
      // crown of drooping fronds
      for (let f = 0; f < 9; f++) {
        const frond = new THREE.Mesh(frondGeo, frondMat);
        frond.position.copy(top);
        frond.position.y += 0.2;
        frond.rotation.y = (f / 9) * Math.PI * 2;
        frond.rotation.x = -0.5 - rng() * 0.3;
        g.add(frond);
      }
      // coconuts
      for (let cN = 0; cN < 3; cN++) {
        const coco = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), trunkMat);
        coco.position.set(top.x + (rng() - 0.5) * 0.4, top.y - 0.1, top.z + (rng() - 0.5) * 0.4);
        g.add(coco);
      }
      g.position.set(x, 0, z);
      g.rotation.y = rng() * Math.PI * 2;
      scene.add(g);
      // warm uplight pool
      groundGlow(x, z, 0xff9a4d, 2.6, 2.6, 0.1);
      world.palms = world.palms || [];
      world.palms.push({ g, top: top.y, ph: rng() * 9 });
    };
    // line palms along road lanes + a ring around the plaza
    for (let i = 0; i < 34; i++) {
      const lane = (((rng() * 11) | 0) - 5) * PITCH + 17;
      const along = (rng() - 0.5) * 2 * B;
      palm(rng() < 0.5 ? along : lane + 6, rng() < 0.5 ? lane + 6 : along);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      palm(world.shrinePos.x + Math.cos(a) * 16, world.shrinePos.z + Math.sin(a) * 16);
    }
  }

  // street lamps
  for (let i = 0; i < 36; i++) {
    const lane = (((rng() * 11) | 0) - 5) * PITCH + 17;
    const along = (rng() - 0.5) * 2 * B;
    const horiz = rng() < 0.5;
    const x = horiz ? along : lane + 4, z = horiz ? lane + 4 : along;
    cylinder(x, 0, z, 0.08, 3.8, railMat);
    const lampCol = [0xffb347, 0xffb347, 0xff9a5c, 0x00f0ff, 0xff2bd6][(rng() * 5) | 0];
    const head = new THREE.Mesh(BOX, neonMat(lampCol, 2));
    head.scale.set(0.45, 0.11, 0.2);
    head.position.set(x, 3.9, z);
    scene.add(head);
    groundGlow(x, z, lampCol, 3.4, 3.4, 0.13);
    // soft volumetric light cone
    const cone = new THREE.Mesh(lampConeGeo, new THREE.MeshBasicMaterial({
      color: lampCol, transparent: true, opacity: 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    }));
    cone.position.set(x, 2.05, z);
    scene.add(cone);
  }

  // ---------- street haze: big soft drifting glow billboards (fake volumetrics) ----------
  world.haze = [];
  for (let i = 0; i < 30; i++) {
    const s = world.streetSpots[(rng() * world.streetSpots.length) | 0];
    if (!s) break;
    const zone = zoneAt(s.x);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(),
      color: new THREE.Color(zone.color).lerp(new THREE.Color(0xffa860), 0.55),
      transparent: true, opacity: 0.026 + rng() * 0.018,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.setScalar(22 + rng() * 18);
    sp.position.set(s.x, 2.5 + rng() * 3.5, s.z);
    scene.add(sp);
    world.haze.push({ m: sp, ph: rng() * 9, base: sp.material.opacity });
  }

  // ---------- STARTER CLIMB ROUTE (beside spawn, unmissable) ----------
  {
    // pawprints lead from spawn (32,30) to a glowing crate ladder up a kitten-sized tower
    pawTrail(33, 28, 43, 23);
    const steps = [
      [44.5, 0, 23, 1.3], [46.5, 0, 21.5, 2.6], [48.5, 0, 19.5, 3.9],
    ];
    const trail = [];
    for (const [sx, sy, sz, sh] of steps) {
      block(sx, 0, sz, 2.4, sh, 2.4, crateGlowMat);
      trail.push({ x: sx, y: sh + 0.6, z: sz });
    }
    block(49.5, 0, 16.5, 4.5, 5.2, 4.5, towerMat(0x00f0ff));
    world.buildings.push({ x: 49.5, z: 16.5, w: 4.5, d: 4.5, h: 5.2 });
    world.roofSpots.push({ x: 49.5, y: 5.2, z: 16.5 });
    trail.push({ x: 49.5, y: 5.8, z: 16.5 });
    world.trailSpots.unshift(trail);          // first trail = gets kibble first
    world.ringSpots.unshift({ x: 49.5, y: 6.6, z: 16.5 });
    const s = textSprite("CLIMB ME", "#5ce8ff", 200, 40);
    s.position.set(46.5, 5.2, 21.5);
    scene.add(s);
    world.signs.push({ mesh: s, t: 0, rate: 0.8 });
  }

  // ---------- DISTRICT SET PIECES ----------

  // === Neon Market ===
  const stallNames = ["NOODLES", "たこ焼き", "SYNTH-FRUIT", "HOT BUNS", "KIBBLE+"];
  const stallCols = [0xff2bd6, 0xffb347, 0xaaff00, 0xff6a4d, 0x00f0ff];
  for (let i = 0; i < 5; i++) {
    const sx = -98 + i * 13, sz = 4 + (i % 2 ? 2 : -2);
    block(sx, 0, sz, 3.4, 1.05, 1.7, darkMat);
    cylinder(sx - 1.6, 0, sz - 0.7, 0.06, 2.5, railMat);
    cylinder(sx + 1.6, 0, sz - 0.7, 0.06, 2.5, railMat);
    const canopy = block(sx, 2.4, sz - 0.3, 4, 0.12, 2.4, neonMat(stallCols[i], 0.5));   // solid — jumpable awning
    canopy.rotation.x = 0.14;
    const sign = textSprite(stallNames[i], "#" + stallCols[i].toString(16).padStart(6, "0"), 200, 44);
    sign.position.set(sx, 3.1, sz + 0.7);
    scene.add(sign);
    world.signs.push({ mesh: sign, t: rng() * 9, rate: 1 + rng() * 2 });
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), neonMat(0xffb347, 2));
    lan.position.set(sx + 1.3, 2.1, sz);
    scene.add(lan);
    groundGlow(sx, sz + 1.8, stallCols[i], 4.4, 5, 0.16);
    groundGlow(sx, sz, 0xffb070, 3, 2.6, 0.12);
    addEmitter(sx, 1.3, sz, { rate: 0.7, vy: 0.8, life: 1.4, color: [0xffb347, 0xff8a5c], spread: 0.7, drag: 1.5 });
    // chairs & little tables
    for (let cth = 0; cth < 2; cth++) {
      const tx = sx + (rng() - 0.5) * 3, tz = sz + 3 + rng() * 1.5;
      cylinder(tx, 0, tz, 0.45, 0.75, darkMat);
      block(tx + 0.9, 0, tz, 0.4, 0.45, 0.4, crateMat);
    }
    world.ringSpots.push({ x: sx, y: 3.6, z: sz - 0.3 });
  }
  { // lantern strings
    const pts = [], cols = [];
    const lanternCols = [0xffb347, 0xff2bd6, 0xaaff00, 0xff6a4d];
    for (let s = 0; s < 14; s++) {
      const x0 = -105 + rng() * 80, z0 = (rng() - 0.5) * 130;
      const x1 = x0 + 10 + rng() * 14, z1 = z0 + (rng() - 0.5) * 12;
      const y0 = 4.5 + rng() * 5, y1 = 4.5 + rng() * 5;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 1.6, z0 + (z1 - z0) * t);
        const c = new THREE.Color(lanternCols[(rng() * lanternCols.length) | 0]);
        cols.push(c.r, c.g, c.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(cols), 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.5, vertexColors: true, transparent: true, opacity: 0.95,
      map: glowTexture(), alphaTest: 0.01, depthWrite: false, blending: THREE.AdditiveBlending,
    })));
  }
  { // giant holo-cat
    const g = new THREE.Group();
    const hm = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
    const hb = new THREE.Mesh(BOX, hm); hb.scale.set(3, 2.2, 5); g.add(hb);
    const hh = new THREE.Mesh(BOX, hm); hh.scale.set(2.2, 2, 2); hh.position.set(0, 1.6, 2.6); g.add(hh);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.1, 4), hm);
      ear.position.set(s * 0.7, 3.1, 2.6); g.add(ear);
    }
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.12, 3.4, 6), hm);
    tail.position.set(0, 1.8, -2.8); tail.rotation.x = -0.6; g.add(tail);
    g.position.set(-65, 24, -28);
    scene.add(g);
    world.holoCatBig = g;
  }
  { // street performer
    const p = world.performerPos;
    block(p.x, 0, p.z, 2.4, 0.3, 2.4, neonMat(0x7b61ff, 0.35));
    const perf = makePerson(0xaaff00, rng);
    perf.position.set(p.x, 0.3, p.z);
    scene.add(perf);
    world.performer = perf;
    addEmitter(p.x, 2.2, p.z, { rate: 1.6, vy: 1.4, life: 2.2, color: [0xaaff00, 0x00f0ff, 0xff2bd6], spread: 0.7, drag: 0.6 });
    marker("♪", "#aaff00", p.x, 3.4, p.z);
    groundGlow(p.x, p.z, 0x7b61ff, 5, 5, 0.16);
  }

  // === Back Alleys: graffiti, dumpsters, clutter ===
  const graffitiLines = [["WHO IS", "PAWPAW?"], ["LINE 9", "LIVES"], ["THE AI", "LOVED US"], ["LOOK", "UP"], ["猫は見ている", ""], ["RAIN IS", "FREE MONEY"]];
  for (let i = 0; i < 8; i++) {
    const gx = -195 + rng() * 80, gz = (rng() - 0.5) * 2 * B;
    const [l1, l2] = graffitiLines[i % graffitiLines.length];
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(4, 3),
      new THREE.MeshBasicMaterial({ map: graffitiTexture(rng, l1, l2), transparent: true, opacity: 0.95 }));
    gr.position.set(gx, 1.9, gz);
    gr.rotation.y = rng() * Math.PI * 2;
    scene.add(gr);
  }
  for (let i = 0; i < 12; i++) {
    const x = -195 + rng() * 85, z = (rng() - 0.5) * 2 * B;
    block(x, 0, z, 2, 1.2, 1.1, new THREE.MeshStandardMaterial({ color: 0x24411f, roughness: 0.9 }));
    if (rng() < 0.7) block(x + 1.5, 0, z + 0.4, 0.9, 0.9, 0.9, crateMat);
    if (rng() < 0.5) {
      const cm = new THREE.Mesh(CYL, new THREE.MeshStandardMaterial({ color: 0x6a6a72, metalness: 0.7, roughness: 0.4 }));
      cm.scale.set(0.18, 0.24, 0.18);
      cm.position.set(x - 1.3, 0.12, z + 0.5);
      scene.add(cm);
      world.cans.push({ m: cm, x: x - 1.3, z: z + 0.5, alive: true });
    }
  }

  // === Corporate: searchlights ===
  for (let i = 0; i < 3; i++) {
    const bx = 60 + rng() * 65, bz = (rng() - 0.5) * 280;
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(3.2, 50, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x4dd2ff, transparent: true, opacity: 0.022, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beam.position.set(bx, 50, bz);
    beam.rotation.z = 0.4;
    scene.add(beam);
    world.beams.push({ m: beam, t: rng() * 9 });
  }

  // === Docks: antenna farm + holo-fish ===
  for (let i = 0; i < 8; i++) {
    const x = 165 + rng() * 32, z = (rng() - 0.5) * 2 * B;
    const h = 10 + rng() * 16;
    cylinder(x, 0, z, 0.15, h, railMat, true);
    cylinder(x, h * 0.6, z, 0.05, h * 0.25, railMat);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), neonMat(0xffb347, 2.5));
    tip.position.set(x, h, z);
    scene.add(tip);
    world.blinkers.push({ m: tip, t: rng() * 5 });
  }
  {
    const fm = new THREE.MeshBasicMaterial({ color: 0x7befff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 9; i++) {
      const f = new THREE.Group();
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.2, 6), fm);
      body.rotation.z = -Math.PI / 2;
      f.add(body);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), fm);
      tail.position.x = -0.8; tail.rotation.z = Math.PI / 2;
      f.add(tail);
      scene.add(f);
      world.fish.push({ g: f, cx: 168, cz: (rng() - 0.5) * 160, r: 5 + rng() * 10, h: 3.5 + rng() * 8, a: rng() * 7, w: 0.4 + rng() * 0.5 });
    }
  }

  // === Elevated train across the docks edge ===
  {
    const railZ = 172, railY = 10;
    block(0, railY - 0.5, railZ, CFG.CITY * 2, 0.5, 2.6, darkMat, false);
    for (let x = -CFG.CITY; x <= CFG.CITY; x += 36) cylinder(x, 0, railZ, 0.45, railY - 0.5, pipeMat, true);
    const train = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const car = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({
        color: 0x2a3248, roughness: 0.4, metalness: 0.6, emissive: 0x00f0ff, emissiveIntensity: 0.35,
        transparent: true,
      }));
      car.scale.set(6.4, 2.2, 2.2);
      car.position.x = i * 7;
      train.add(car);
    }
    train.position.set(-CFG.CITY, railY + 1.1, railZ);
    scene.add(train);
    world.train = { g: train, x: -CFG.CITY, ghost: false, speed: 24 };
  }

  // ---------- apex spire + skyway ----------
  {
    const sp = world.spirePos;
    block(sp.x, 0, sp.z, 16, 42, 16, towerMat(0x4dd2ff));
    world.buildings.push({ x: sp.x, z: sp.z, w: 16, d: 16, h: 42 });
    world.roofSpots.push({ x: sp.x, y: 42, z: sp.z });
    cylinder(sp.x, 42, sp.z, 0.28, 10, neonMat(0x99eeff, 1));
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 2, 200, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beacon.position.set(sp.x, 120, sp.z);
    scene.add(beacon);
    world.spireBeacon = beacon;
    let px = 70, pz = -70, py = 7;
    const trail = [];
    for (let i = 0; i < 14 && py < 40; i++) {
      block(px, py, pz, 4.5, 0.5, 4.5, neonMat(0x123a4a, 0.9));
      trail.push({ x: px, y: py + 1.2, z: pz });
      px += 2.1 + rng() * 1.4; pz -= 2.1 + rng() * 1.4; py += 2.2;
    }
    world.trailSpots.push(trail);
  }

  // ---------- secret caches ----------
  world.cacheSpots = [
    { id: "forgotten", x: -178, y: 0, z: -78 },
    { id: "den", x: -30, y: 0, z: 72 },
    { id: "mast", x: 172, y: 0, z: -58 },
    { id: "spire", x: 102, y: 42, z: -102 },
  ];
  const hint = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.4),
    new THREE.MeshBasicMaterial({ map: graffitiTexture(rng, "PSST.", "→"), transparent: true }));
  hint.position.set(-172, 1.8, -74);
  hint.rotation.y = 1.2;
  scene.add(hint);

  // ---------- Paw Shrine ----------
  buildShrine(scene, world);
  groundGlow(world.shrinePos.x, world.shrinePos.z + 6.5, 0xffb347, 7, 8, 0.16);
  groundGlow(world.shrinePos.x, world.shrinePos.z, 0xffe14d, 12, 12, 0.08);

  // street litter: scraps of paper & leaves catching the neon
  {
    const litterMats = [0x6b5a40, 0x4a5238, 0x705a48, 0x3f4a52].map(c =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 1, side: THREE.DoubleSide }));
    const litterGeo = new THREE.PlaneGeometry(0.28, 0.36);
    for (let i = 0; i < 80; i++) {
      const m = new THREE.Mesh(litterGeo, litterMats[(rng() * litterMats.length) | 0]);
      const lane = (((rng() * 11) | 0) - 5) * PITCH + 17;
      if (rng() < 0.5) m.position.set((rng() - 0.5) * 2 * (CFG.CITY - 20), 0.025, lane + (rng() - 0.5) * 7);
      else m.position.set(lane + (rng() - 0.5) * 7, 0.025, (rng() - 0.5) * 2 * (CFG.CITY - 20));
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = rng() * Math.PI * 2;
      scene.add(m);
    }
  }

  // ---------- Mei's vendor stall ----------
  {
    const v = world.vendorPos;
    block(v.x, 0, v.z, 4.6, 1.05, 2.2, darkMat);
    const awning = block(v.x, 2.5, v.z, 5.2, 0.22, 3, neonMat(0xff2bd6, 0.5));
    awning.rotation.x = 0.1;
    const sign = textSprite("MEI'S UPGRADES", "#ff2bd6", 340, 40);
    sign.position.set(v.x, 3.5, v.z + 0.4);
    scene.add(sign);
    world.vendorSign = sign;
    const mei = makePerson(0xff2bd6, rng);
    mei.position.set(v.x, 0, v.z - 1.7);
    scene.add(mei);
    world.mei = mei;
    const light = new THREE.PointLight(0xff2bd6, 12, 22, 1.8);
    light.position.set(v.x, 3.2, v.z);
    scene.add(light);
    for (let i = 0; i < 4; i++) {
      const item = new THREE.Mesh(new THREE.OctahedronGeometry(0.15), neonMat([0xffb347, 0x00f0ff, 0xaaff00, 0xff2bd6][i], 1.5));
      item.position.set(v.x - 1.4 + i * 0.9, 1.3, v.z);
      scene.add(item);
    }
    marker("¢", "#ffb347", v.x, 4.4, v.z);
    groundGlow(v.x, v.z + 2.2, 0xff2bd6, 5, 5.5, 0.18);
  }

  // plaza floor rings
  for (const [r, col, op] of [[8, 0x00f0ff, 0.08], [13, 0xffb347, 0.05], [18, 0xff2bd6, 0.035]]) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(r - 0.32, r, 48),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(21, 0.03, 21);
    scene.add(ring);
  }

  // ---------- fountain ----------
  {
    const fx0 = 36, fz0 = 36;
    const basin = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.45, 10, 28), darkMat);
    basin.rotation.x = Math.PI / 2;
    basin.position.set(fx0, 0.45, fz0);
    scene.add(basin);
    collide(fx0, 0, fz0, 6, 0.9, 6);
    const water = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending }));
    water.rotation.x = -Math.PI / 2;
    water.position.set(fx0, 0.5, fz0);
    scene.add(water);
    addEmitter(fx0, 0.7, fz0, { rate: 7, vy: 3.2, life: 1.1, color: [0x7befff, 0x00f0ff], spread: 0.5, grav: 5, drag: 0.3 });
  }

  // neon jump-rings from collected spots (game prunes already-collected)
  {
    const ringGeo = new THREE.TorusGeometry(0.85, 0.07, 8, 26);
    world.ringSpots.slice(0, 16).forEach((s, i) => {
      const m = new THREE.Mesh(ringGeo, neonMat(0x00f0ff, 1.8));
      m.position.set(s.x, s.y, s.z);
      scene.add(m);
      world.rings.push({ m, uid: "r" + i, t: rng() * 9 });
    });
  }

  // ---------- citizens ----------
  const citizenColors = [0x00f0ff, 0xff2bd6, 0xaaff00, 0xffb347, 0x7b61ff];
  for (let i = 0; i < 46; i++) {
    const robot = rng() < 0.3;
    const g = robot ? makeRobot(citizenColors[(rng() * 5) | 0], rng) : makePerson(citizenColors[(rng() * 5) | 0], rng);
    const lane = (((rng() * 11) | 0) - 5) * PITCH + 17;
    const horiz = rng() < 0.5;
    g.position.set(horiz ? -B + rng() * 2 * B : lane, 0, horiz ? lane : -B + rng() * 2 * B);
    scene.add(g);
    const bubble = textSprite(["♪", "...", "meow?", "!", "nice cat", "❤"][(rng() * 6) | 0], "#d8f6ff", 90, 40);
    bubble.position.y = 2.5;
    bubble.visible = false;
    g.add(bubble);
    world.citizens.push({ g, bubble, bubbleT: 0, scritchT: 0, horiz, robot, speed: (0.8 + rng() * 1.4) * (rng() < 0.5 ? 1 : -1), phase: rng() * 9 });
  }

  // standing-around NPCs (clusters near stalls & shrine)
  for (const [sx, sz] of [[-92, 8], [-70, 6], [12, 22], [30, 12], [-170, -60], [-100, 18], [-58, 18], [22, 36], [50, 44], [96, -18], [128, 28], [166, 52]]) {
    const g = makePerson(citizenColors[(rng() * 5) | 0], rng);
    g.position.set(sx + rng() * 2, 0, sz + rng() * 2);
    g.rotation.y = rng() * Math.PI * 2;
    scene.add(g);
    const bubble = textSprite(["♪", "...", "meow?", "❤"][(rng() * 4) | 0], "#d8f6ff", 90, 40);
    bubble.position.y = 2.5;
    bubble.visible = false;
    g.add(bubble);
    world.citizens.push({ g, bubble, bubbleT: 0, scritchT: 0, horiz: true, robot: false, speed: 0, phase: rng() * 9 });
  }

  // cleaning bots
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(CYL, neonMat(0xffb347, 0.25));
    body.scale.set(0.9, 0.4, 0.9);
    body.position.y = 0.2; g.add(body);
    const brush = new THREE.Mesh(CYL, neonMat(0x00f0ff, 1.2));
    brush.scale.set(1, 0.08, 1);
    brush.position.y = 0.04; g.add(brush);
    g.position.set((rng() - 0.5) * 300, 0, (rng() - 0.5) * 300);
    scene.add(g);
    world.bots.push({ g, brush, a: rng() * 7, turnT: 2 + rng() * 4 });
  }

  // holo-cats on rooftops
  {
    const hm = new THREE.MeshBasicMaterial({ color: 0xff9fd8, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let i = 0; i < 7; i++) {
      const spot = world.roofSpots[(rng() * world.roofSpots.length) | 0];
      const cat = new THREE.Group();
      const body = new THREE.Mesh(BOX, hm); body.scale.set(0.5, 0.4, 0.9); body.position.y = 0.25; cat.add(body);
      const head = new THREE.Mesh(BOX, hm); head.scale.set(0.4, 0.35, 0.35); head.position.set(0, 0.6, 0.45); cat.add(head);
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 4), hm);
        ear.position.set(s * 0.12, 0.85, 0.45); cat.add(ear);
      }
      cat.position.set(spot.x, spot.y, spot.z);
      scene.add(cat);
      world.holoCats.push({ g: cat, t: rng() * 9 });
    }
  }

  // hover cars
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: [0x232b46, 0x3a2440, 0x1d3340][(rng() * 3) | 0], metalness: 0.7, roughness: 0.3 }));
    hull.scale.set(1.6, 0.45, 3.2); g.add(hull);
    const canopyM = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0x0b2a33, metalness: 0.9, roughness: 0.15 }));
    canopyM.scale.set(1.1, 0.32, 1.5); canopyM.position.set(0, 0.32, 0.2); g.add(canopyM);
    const head = new THREE.Mesh(BOX, neonMat(0xfff3c0, 2)); head.scale.set(1.2, 0.11, 0.1); head.position.set(0, 0, 1.62); g.add(head);
    const tail = new THREE.Mesh(BOX, neonMat(0xff3344, 2)); tail.scale.set(1.2, 0.11, 0.1); tail.position.set(0, 0, -1.62); g.add(tail);
    const lane = (((rng() * 11) | 0) - 5) * PITCH + 17;
    const horiz = rng() < 0.5;
    const speed = (8 + rng() * 7) * (rng() < 0.5 ? 1 : -1);
    g.position.set(horiz ? (rng() - 0.5) * 2 * B : lane - 2.5, 3 + rng() * 1.6, horiz ? lane - 2.5 : (rng() - 0.5) * 2 * B);
    g.rotation.y = horiz ? (speed > 0 ? Math.PI / 2 : -Math.PI / 2) : (speed > 0 ? 0 : Math.PI);
    scene.add(g);
    world.cars.push({ g, horiz, speed, bob: rng() * 9 });
  }

  // steam vents
  for (let i = 0; i < 10; i++) {
    const x = -195 + rng() * 175, z = (rng() - 0.5) * 2 * B;
    block(x, 0, z, 1.3, 0.1, 1.3, pipeMat, false);
    addEmitter(x, 0.2, z, { rate: 2.2, vy: 1.6, life: 2.4, color: [0x96a8c8, 0x6a7a98], spread: 0.5, drag: 0.8 });
  }

  // rain
  {
    const n = 1100, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rng() - 0.5) * 70;
      pos[i * 3 + 1] = rng() * 40;
      pos[i * 3 + 2] = (rng() - 0.5) * 70;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8fd4ff, size: 0.07, transparent: true, opacity: 0.55 }));
    rain.visible = false;
    scene.add(rain);
    world.rain = rain;
  }

  addDrones(scene, world, rng);

  return world;
}

// ---------- people / robots ----------
function makePerson(accent, rng) {
  const g = new THREE.Group();
  const skin = [0xd9b08c, 0xc9a489, 0x8c6e54, 0xeac3a2][(rng() * 4) | 0];
  const coat = [0x1d2436, 0x2c2440, 0x16323a, 0x3a2430][(rng() * 4) | 0];
  const coatMat = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.9 });
  const tall = 0.9 + rng() * 0.25;
  // torso: coat with shoulders
  const body = new THREE.Mesh(BOX, coatMat);
  body.scale.set(0.52, 0.72 * tall, 0.34);
  body.position.y = 1.06 * tall;
  g.add(body);
  const hips = new THREE.Mesh(BOX, pantsMat);
  hips.scale.set(0.44, 0.22, 0.3);
  hips.position.y = 0.66 * tall;
  g.add(hips);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), new THREE.MeshStandardMaterial({ color: skin }));
  head.position.y = 1.66 * tall;
  g.add(head);
  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), coatMat);
  hood.position.y = 1.68 * tall;
  if (rng() < 0.5) g.add(hood);
  const visor = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.2 }));
  visor.scale.set(0.3, 0.07, 0.1);
  visor.position.set(0, 1.68 * tall, 0.17);
  g.add(visor);
  const trim = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.9 }));
  trim.scale.set(0.54, 0.045, 0.36);
  trim.position.y = 1.35 * tall;
  g.add(trim);
  // articulated limbs: pivots at hip / shoulder, swung in updateWorld
  const limbs = { legs: [], arms: [] };
  const legGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.62 * tall, 7);
  for (const s of [-1, 1]) {
    const hip = new THREE.Group();
    const leg = new THREE.Mesh(legGeo, pantsMat);
    leg.position.y = -0.31 * tall;
    hip.add(leg);
    hip.position.set(s * 0.13, 0.62 * tall, 0);
    g.add(hip);
    limbs.legs.push(hip);
    const shoulder = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.55 * tall, 7), coatMat);
    arm.position.y = -0.27 * tall;
    shoulder.add(arm);
    shoulder.position.set(s * 0.32, 1.38 * tall, 0);
    shoulder.rotation.z = s * 0.1;
    g.add(shoulder);
    limbs.arms.push(shoulder);
  }
  g.userData.limbs = limbs;
  g.userData.tall = tall;
  return g;
}

function makeRobot(accent, rng) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x39455f, metalness: 0.8, roughness: 0.35 });
  const body = new THREE.Mesh(BOX, metal);
  body.scale.set(0.5, 0.8, 0.4);
  body.position.y = 0.75;
  g.add(body);
  const head = new THREE.Mesh(BOX, metal);
  head.scale.set(0.36, 0.3, 0.36);
  head.position.y = 1.35;
  g.add(head);
  const eye = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 2 }));
  eye.scale.set(0.26, 0.06, 0.05);
  eye.position.set(0, 1.38, 0.19);
  g.add(eye);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), metal);
  antenna.position.y = 1.62;
  g.add(antenna);
  return g;
}

// ---------- Paw Shrine ----------
function buildShrine(scene, world) {
  const g = new THREE.Group();
  const warm = new THREE.MeshStandardMaterial({ color: 0x46315e, emissive: 0xff2bd6, emissiveIntensity: 0.12, roughness: 0.5 });
  const base = new THREE.Mesh(BOX, new THREE.MeshStandardMaterial({ color: 0x2a2236, roughness: 0.7 }));
  base.scale.set(9, 0.8, 9); base.position.y = 0.4;
  g.add(base);
  world.colliders.push({ minX: world.shrinePos.x - 4.5, maxX: world.shrinePos.x + 4.5, minZ: world.shrinePos.z - 4.5, maxZ: world.shrinePos.z + 4.5, top: 0.8, bot: 0 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3c2f52, roughness: 0.6 });
  for (const [dx, dz] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 4), pillarMat);
    p.position.set(dx, 2.8, dz); g.add(p);
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.6, 4), warm);
  roof.position.y = 5.9; roof.rotation.y = Math.PI / 4;
  g.add(roof);
  for (const [dx, dz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) {
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), neonMat(0xffb347, 2));
    tip.position.set(dx * 1.05, 5.1, dz * 1.05);
    g.add(tip);
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 16), neonMat(0xffe14d, 1.6));
  orb.position.y = 2.4;
  g.add(orb);
  world.shrineOrb = orb;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.05, 8, 28), neonMat(0xffb347, 2));
  halo.position.y = 2.4;
  g.add(halo);
  world.shrineHalo = halo;
  const light = new THREE.PointLight(0xffb347, 20, 34, 1.8);
  light.position.y = 3;
  g.add(light);
  const sign = textSprite("PAW SHRINE", "#ffb347", 300, 40);
  sign.position.set(0, 7.8, 0);
  g.add(sign);
  world.shrineSign = sign;
  for (let i = 0; i < 3; i++) {
    for (const s of [-1, 1]) {
      const post = new THREE.Mesh(BOX, pillarMat);
      post.scale.set(0.3, 1, 0.3);
      post.position.set(s * 1.6, 0.5, 6 + i * 2.4);
      g.add(post);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), neonMat(0xffb347, 1.8));
      lamp.position.set(s * 1.6, 1.15, 6 + i * 2.4);
      g.add(lamp);
    }
  }
  g.position.copy(world.shrinePos);
  scene.add(g);
  world.shrineGroup = g;
  addEmitter(world.shrinePos.x, 1.5, world.shrinePos.z, { rate: 3, vy: 0.7, life: 3.4, color: [0xffb347, 0xffe14d, 0xff9fd8], spread: 3.4, drag: 0.4 });
}

export function shrineUpgrade(world, level) {
  const g = world.shrineGroup;
  for (let i = world.shrineLanterns.length; i < level; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lan = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), neonMat(0xffe14d, 1.8));
    lan.position.set(Math.cos(a) * 4.8, 1.6 + (i % 2) * 0.7, Math.sin(a) * 4.8);
    g.add(lan);
    world.shrineLanterns.push(lan);
  }
  if (level >= 2 && !world.shrineDecor.gate) {
    world.shrineDecor.gate = true;
    const verm = neonMat(0xff5a3c, 0.5);
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 4.6), verm);
      p.position.set(s * 2.2, 2.3, 11.5);
      g.add(p);
    }
    const beam1 = new THREE.Mesh(BOX, verm); beam1.scale.set(5.6, 0.3, 0.4); beam1.position.set(0, 4.7, 11.5); g.add(beam1);
    const beam2 = new THREE.Mesh(BOX, verm); beam2.scale.set(4.6, 0.25, 0.35); beam2.position.set(0, 3.9, 11.5); g.add(beam2);
  }
  if (level >= 5 && world.shrineDecor.orbs.length === 0) {
    for (let i = 0; i < 5; i++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), neonMat(0xff9fd8, 2));
      g.add(orb);
      world.shrineDecor.orbs.push(orb);
    }
  }
  if (level >= 8 && !world.shrineDecor.beacon) {
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.6, 120, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    beacon.position.y = 60;
    g.add(beacon);
    world.shrineDecor.beacon = beacon;
  }
}

// ---------- per-frame world life ----------
// "day" is moody cyberpunk twilight — the neon never stops working
const dayColor = new THREE.Color(0x3c4a68);
const nightColor = new THREE.Color(0x201812);
const duskColor = new THREE.Color(0x42220f);
const fogBase = new THREE.Color(0x241a10);
const tmpColor = new THREE.Color();

export function updateWorld(world, scene, dt, time, playerPos) {
  const t = time;
  const now = performance.now() / 1000;
  let sky;
  if (t < 0.35) sky = tmpColor.copy(nightColor);
  else if (t < 0.45) sky = tmpColor.copy(nightColor).lerp(duskColor, (t - 0.35) / 0.1);
  else if (t < 0.6) sky = tmpColor.copy(duskColor).lerp(dayColor, (t - 0.45) / 0.15);
  else if (t < 0.8) sky = tmpColor.copy(dayColor);
  else sky = tmpColor.copy(dayColor).lerp(nightColor, (t - 0.8) / 0.2);
  scene.background.copy(sky);
  scene.fog.color.copy(sky).lerp(fogBase, 0.4);
  const daylight = t > 0.5 && t < 0.85 ? 1 : 0.45;
  world.sky.hemi.intensity = (1.3 + daylight * 0.4) * (world.blackout ?? 1);
  world.sky.moon.intensity = daylight > 0.6 ? 0.9 : 0.65;

  for (const s of world.signs) {
    s.t += dt * s.rate;
    s.mesh.material.opacity = 0.75 + 0.25 * Math.sin(s.t * 7) * (Math.sin(s.t * 1.7) > -0.85 ? 1 : 0.2);
  }
  for (const b of world.billboards) {
    b.t += dt;
    b.m.material.opacity = 0.8 + 0.15 * Math.sin(b.t * 2.4);
    if (Math.sin(b.t * 0.5) > 0.96) b.m.material.opacity *= 0.4;
  }
  for (const bl of world.blinkers) {
    bl.t += dt;
    bl.m.material.emissiveIntensity = Math.sin(bl.t * 3) > 0 ? 2.5 : 0.2;
  }
  for (const p of world.puddles) {
    p.t += dt;
    p.m.material.opacity = (world.rainOn ? 0.18 : 0.08) + Math.sin(p.t * 1.4) * 0.03;
  }
  for (const bm of world.beams) {
    bm.t += dt * 0.3;
    bm.m.rotation.y = bm.t;
    bm.m.rotation.z = 0.35 + Math.sin(bm.t * 0.7) * 0.15;
  }
  if (world.spireBeacon) world.spireBeacon.material.opacity = 0.08 + Math.sin(now * 1.2) * 0.04;
  if (world.deliveryBeam && world.deliveryBeam.visible) {
    world.deliveryBeam.material.opacity = 0.13 + Math.sin(now * 2.5) * 0.05;
    world.deliveryBeam.rotation.y = now * 0.6;
  }
  if (world.missionBeam && world.missionBeam.visible) {
    world.missionBeam.material.opacity = 0.16 + Math.sin(now * 2) * 0.07;
    world.missionBeam.rotation.y = -now * 0.5;
  }
  if (world.questBeam && world.questBeam.visible) {
    world.questBeam.material.opacity = 0.14 + Math.sin(now * 2.2) * 0.06;
    world.questBeam.rotation.y = now * 0.5;
  }
  // quest NPC name tags face the player (markers auto-bob via world.markers)
  if (world.questNpcs && playerPos) {
    for (const n of world.questNpcs) n.nameTag.lookAt(playerPos.x, 2.5, playerPos.z);
  }
  if (world.cityNpcs && playerPos) {
    for (const n of world.cityNpcs) n.nameTag.lookAt(playerPos.x, 2.35, playerPos.z);
  }
  // discovery shards spin & glint
  if (world.discoveries) {
    for (const dsc of world.discoveries) {
      if (!dsc.g.visible) continue;
      dsc.shard.rotation.y += dt * 1.5;
      dsc.shard.material.emissiveIntensity = 1 + Math.sin(now * 2 + dsc.ph) * 0.5;
    }
  }
  if (world.skyline) world.skyline.rotation.y += dt * 0.0025;   // slow distant parallax
  if (world.palms) for (const p of world.palms) p.g.rotation.z = Math.sin(now * 0.6 + p.ph) * 0.02;   // breeze
  if (world.haze) {
    for (const hz of world.haze) {
      hz.m.material.opacity = hz.base + Math.sin(now * 0.4 + hz.ph) * 0.015;
      hz.m.position.x += Math.sin(now * 0.07 + hz.ph) * dt * 0.4;
    }
  }

  // pigeons: peck about, scatter into the air when the cat charges in
  if (world.pigeons && playerPos) {
    for (const flock of world.pigeons) {
      const d2 = (flock.x - playerPos.x) ** 2 + (flock.z - playerPos.z) ** 2;
      if (flock.state === "peck") {
        if (d2 < 14) {
          flock.state = "fly";
          flock.t = 0;
          sfx.flap();
          if (world.onActivity) world.onActivity("pigeons");
          if (world.onPounce) world.onPounce(flock);   // bonus if you pounced in mid-air
          for (const b of flock.birds) {
            const ang = Math.atan2(b.m.position.x - playerPos.x, b.m.position.z - playerPos.z) + (Math.random() - 0.5);
            b.vx = Math.sin(ang) * (2.5 + Math.random() * 2);
            b.vz = Math.cos(ang) * (2.5 + Math.random() * 2);
            b.vy = 3 + Math.random() * 2;
          }
        } else {
          for (const b of flock.birds) {
            b.m.position.y = Math.max(0, Math.sin((now + b.ph) * 6)) * 0.04;   // peck bob
            b.m.rotation.y += Math.sin(now * 0.6 + b.ph) * dt * 0.8;
          }
        }
      } else if (flock.state === "fly") {
        flock.t += dt;
        for (const b of flock.birds) {
          b.m.position.x += b.vx * dt;
          b.m.position.y += b.vy * dt;
          b.m.position.z += b.vz * dt;
          b.vy -= dt * 0.6;
          b.m.rotation.z = Math.sin(now * 18 + b.ph) * 0.5;   // frantic wing waggle
        }
        if (flock.t > 6) {
          flock.state = "peck";
          for (const b of flock.birds) {
            b.m.position.set(flock.x + (Math.random() - 0.5) * 2.4, 0, flock.z + (Math.random() - 0.5) * 2.4);
            b.m.rotation.z = 0;
          }
        }
      }
    }
  }

  // alley eyes blink and follow the cat
  if (world.alleyEyes) {
    for (const e of world.alleyEyes) {
      e.t += dt;
      const blink = Math.sin(e.t * 0.7) > 0.97 ? 0.1 : 1;
      e.g.scale.y = blink;
      if (playerPos) e.g.lookAt(playerPos.x, 0.4, playerPos.z);
    }
  }

  // zipline hooks pulse
  if (world.ziplines) {
    for (const z of world.ziplines) {
      z.hook.material.emissiveIntensity = 1.6 + Math.sin(now * 3) * 0.6;
      z.hook.rotation.y = now * 1.5;
    }
  }

  // activity markers bob & face the player
  for (const mk of world.markers) {
    mk.m.position.y = mk.baseY + Math.sin(now * 2 + mk.ph) * 0.18;
    if (playerPos) mk.m.lookAt(playerPos.x, mk.m.position.y, playerPos.z);
  }
  // neon jump-rings spin gently
  for (const r of world.rings) {
    r.t += dt;
    r.m.rotation.y = Math.sin(r.t * 0.8) * 0.4;
    r.m.material.emissiveIntensity = 1.5 + Math.sin(r.t * 3) * 0.5;
  }
  // vending fronts hum
  for (const v of world.vendings) {
    v.front.material.emissiveIntensity = 0.6 + Math.sin(now * 1.7 + v.x) * 0.15;
  }

  if (world.shrineOrb) {
    world.shrineOrb.position.y = 2.4 + Math.sin(now * 1.05) * 0.18;
    world.shrineOrb.rotation.y += dt;
  }
  if (world.shrineHalo) {
    world.shrineHalo.position.y = 2.4 + Math.sin(now * 1.05) * 0.18;
    world.shrineHalo.rotation.x = now * 0.8;
    world.shrineHalo.rotation.y = now * 0.5;
  }
  world.shrineDecor.orbs.forEach((orb, i) => {
    const a = now * 0.6 + (i / 5) * Math.PI * 2;
    orb.position.set(Math.cos(a) * 3.4, 3 + Math.sin(now + i) * 0.5, Math.sin(a) * 3.4);
  });
  if (world.shrineSign && playerPos) world.shrineSign.lookAt(playerPos.x, 7.8, playerPos.z);
  if (world.vendorSign && playerPos) world.vendorSign.lookAt(playerPos.x, 3.5, playerPos.z);

  const B = CFG.CITY - 16;
  for (const c of world.citizens) {
    const p = c.g.position;
    if (c.scritchT > 0) c.scritchT -= dt;
    // just-scritched: a happy spinning hop, walking paused
    if (c.scritchT > 2.6) {
      p.y = Math.abs(Math.sin(now * 16)) * 0.3;
      c.g.rotation.y += dt * 6;
    } else if (c.speed !== 0) {
      if (c.horiz) { p.x += c.speed * dt; if (p.x > B || p.x < -B) c.speed *= -1; }
      else { p.z += c.speed * dt; if (p.z > B || p.z < -B) c.speed *= -1; }
      c.g.rotation.y = c.horiz ? (c.speed > 0 ? Math.PI / 2 : -Math.PI / 2) : (c.speed > 0 ? 0 : Math.PI);
      p.y = Math.abs(Math.sin((now + c.phase) * (c.robot ? 4 : 7))) * (c.robot ? 0.02 : 0.05);
    }
    // walking gait: legs and arms swing in opposition
    const limbs = c.g.userData.limbs;
    if (limbs) {
      const stride = c.speed !== 0 ? Math.abs(c.speed) * 2.6 : 0;
      const sw = Math.sin((now + c.phase) * (3 + stride));
      const amp = c.speed !== 0 ? 0.55 : 0.04;          // idle = tiny shuffle
      limbs.legs[0].rotation.x = sw * amp;
      limbs.legs[1].rotation.x = -sw * amp;
      limbs.arms[0].rotation.x = -sw * amp * 0.8;
      limbs.arms[1].rotation.x = sw * amp * 0.8;
    }
    if (playerPos) {
      const d2 = (p.x - playerPos.x) ** 2 + (p.z - playerPos.z) ** 2;
      if (d2 < 22 && c.bubbleT <= 0) c.bubbleT = 2.4;
    }
    if (c.bubbleT > 0) {
      c.bubbleT -= dt;
      c.bubble.visible = true;
      c.bubble.position.y = 2.45 + Math.sin(now * 3) * 0.08;
      if (playerPos) c.bubble.lookAt(playerPos.x, c.g.position.y + 2.4, playerPos.z);
      if (c.bubbleT <= 0) { c.bubble.visible = false; c.bubbleT = -4 - Math.random() * 6; }
    } else if (c.bubbleT < 0) c.bubbleT += dt;
  }

  if (world.performer) world.performer.rotation.z = Math.sin(now * 2.2) * 0.08;
  if (world.mei && playerPos) {
    const d2 = (world.mei.position.x - playerPos.x) ** 2 + (world.mei.position.z - playerPos.z) ** 2;
    world.mei.rotation.z = d2 < 80 ? Math.sin(now * 6) * 0.1 : 0;
  }

  for (const d of world.drones) {
    d.a += d.w * dt;
    d.g.position.set(d.cx + Math.cos(d.a) * d.r, d.h + Math.sin(d.a * 3) * 1.2, d.cz + Math.sin(d.a) * d.r);
    d.g.rotation.y = -d.a;
  }

  for (const car of world.cars) {
    const p = car.g.position;
    if (car.horiz) { p.x += car.speed * dt; if (p.x > B + 20) p.x = -B - 20; if (p.x < -B - 20) p.x = B + 20; }
    else { p.z += car.speed * dt; if (p.z > B + 20) p.z = -B - 20; if (p.z < -B - 20) p.z = B + 20; }
    p.y = 3 + Math.sin(now * 2 + car.bob) * 0.18;
  }

  if (world.train) {
    const tr = world.train;
    tr.x += tr.speed * dt;
    if (tr.x > CFG.CITY + 40) {
      tr.x = -CFG.CITY - 40;
      tr.ghost = Math.random() < 0.3;
      tr.g.traverse(o => {
        if (o.material) { o.material.opacity = tr.ghost ? 0.35 : 1; o.material.emissiveIntensity = tr.ghost ? 1.2 : 0.35; }
      });
    }
    tr.g.position.x = tr.x;
  }

  for (const b of world.bots) {
    b.turnT -= dt;
    if (b.turnT <= 0) { b.a += (Math.random() - 0.5) * 2; b.turnT = 2 + Math.random() * 4; }
    b.g.position.x += Math.cos(b.a) * dt * 1.2;
    b.g.position.z += Math.sin(b.a) * dt * 1.2;
    b.g.position.x = Math.max(-B, Math.min(B, b.g.position.x));
    b.g.position.z = Math.max(-B, Math.min(B, b.g.position.z));
    b.brush.rotation.y += dt * 9;
  }

  for (const f of world.fish) {
    f.a += f.w * dt;
    f.g.position.set(f.cx + Math.cos(f.a) * f.r, f.h + Math.sin(f.a * 2.3) * 1.4, f.cz + Math.sin(f.a) * f.r);
    f.g.rotation.y = -f.a + Math.PI / 2;
  }

  for (const hc of world.holoCats) {
    hc.t += dt;
    hc.g.rotation.y += dt * 0.4;
    hc.g.children.forEach(ch => { ch.material.opacity = 0.32 + Math.sin(hc.t * 2.6) * 0.12; });
  }
  if (world.holoCatBig) {
    world.holoCatBig.rotation.y += dt * 0.35;
    world.holoCatBig.position.y = 24 + Math.sin(now * 0.7) * 1.2;
  }

  if (world.rain && world.rainOn && playerPos) {
    world.rain.visible = true;
    world.rain.position.set(playerPos.x, 0, playerPos.z);
    const pos = world.rain.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - dt * 32;
      if (y < 0) y = 40;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  } else if (world.rain) {
    world.rain.visible = false;
  }
}

export function addDrones(scene, world, rng) {
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), new THREE.MeshStandardMaterial({ color: 0x202637, metalness: 0.7, roughness: 0.3 }));
    g.add(core);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), neonMat(0xff3344, 2));
    eye.position.set(0, 0, 0.35);
    g.add(eye);
    const scan = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff8899, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
    scan.position.y = -2.6;
    g.add(scan);
    scene.add(g);
    world.drones.push({
      g, cx: (rng() - 0.5) * 2 * (CFG.CITY - 25), cz: (rng() - 0.5) * 2 * (CFG.CITY - 25),
      r: 12 + rng() * 24, h: 7 + rng() * 16, a: rng() * Math.PI * 2, w: 0.15 + rng() * 0.3,
    });
  }
}
