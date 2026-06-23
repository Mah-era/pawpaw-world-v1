// ============ PawPaw-World-3D-v1 — COLLECTIBLES, PROGRESSION, SAVE ============
import * as THREE from "three";
import { CFG, TOTALS, UNLOCKS, SHOP, ACH, CHIP_LORE, MEMORY_LORE, KITTEN_DEFS, CACHES, POSTERS, OBJ_TYPES, COURIER_DESTS, MISSIONS, SIDE_QUESTS, CITY_NPCS, DISCOVERIES, COLLECTION_SETS, GUIDE, state, makeRng, zoneAt } from "./data.js";
import { sfx, setAmbience, setMusicIntensity, setFever } from "./audio.js";
import * as ui from "./ui.js";
import { shrineUpgrade } from "./world.js";
import { setCollarColor } from "./player.js";
import { burst, flash, floatText } from "./fx.js";

const SAVE_KEY = "pawpaw3d.save";

let scene, world, player;
const kibbles = [], chips = [], memories = [], kittens = [], caches = [], shrineKittens = [];
let wisp = null, wispTimer = 8;
let lastZone = null;

const kibGeo = new THREE.OctahedronGeometry(0.22);
const kibMat = new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347, emissiveIntensity: 1.6 });
const chipGeo = new THREE.BoxGeometry(0.34, 0.06, 0.44);
const chipMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.7 });
const memGeo = new THREE.IcosahedronGeometry(0.3);
const memMat = new THREE.MeshStandardMaterial({ color: 0xff2bd6, emissive: 0xff2bd6, emissiveIntensity: 1.7 });
const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 6, 22);

function glowRing(color) {
  const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  r.rotation.x = Math.PI / 2;
  return r;
}

function miniCat(color) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const SPH = new THREE.SphereGeometry(1, 10, 8);
  const body = new THREE.Mesh(SPH, m);
  body.scale.set(0.14, 0.11, 0.2);
  body.position.y = 0.14;
  g.add(body);
  const head = new THREE.Mesh(SPH, m);
  head.scale.set(0.1, 0.09, 0.09);
  head.position.set(0, 0.3, 0.16);
  g.add(head);
  const earGeo = new THREE.ConeGeometry(0.04, 0.08, 4);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, m);
    ear.position.set(s * 0.055, 0.4, 0.15);
    g.add(ear);
  }
  const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xaaff00, emissive: 0xaaff00, emissiveIntensity: 2 }));
  eyes.position.set(0, 0.31, 0.24);
  g.add(eyes);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.22, 6), m);
  tail.position.set(0, 0.24, -0.2);
  tail.rotation.x = -0.7;
  g.add(tail);
  return g;
}

// ---------- placement ----------
export function initGame(sc, w, p) {
  scene = sc; world = w; player = p;
  const rng = makeRng(471102);
  const roofs = [...w.roofSpots].sort((a, b) => a.y - b.y);
  const streets = w.streetSpots;
  const pick = arr => arr[(rng() * arr.length) | 0];

  let kibIdx = 0;
  function placeKibble(x, y, z) {
    const uid = "f" + kibIdx++;
    if (state.collected[uid] || kibIdx > TOTALS.food) return;
    const m = new THREE.Mesh(kibGeo, kibMat);
    m.position.set(x, y, z);
    scene.add(m);
    kibbles.push({ uid, m, baseY: y, ph: rng() * 9 });
  }

  // 1) opening trail: a friendly arc from spawn toward the shrine, then the fountain
  const opening = [
    [30, 0.5, 30], [27, 0.5, 26.5], [24.5, 0.5, 23], [22.5, 0.5, 19.5],
    [27, 0.5, 31], [31.5, 0.5, 34.5], [35, 0.5, 37],
  ];
  for (const [x, y, z] of opening) placeKibble(x, y, z);

  // 2) parkour trails: kibble lines climbing every crate stack & the skyway
  for (const trail of w.trailSpots) {
    for (const s of trail) {
      if (kibIdx >= TOTALS.food * 0.55) break;
      placeKibble(s.x, s.y, s.z);
    }
  }

  // 3) the rest: streets & rooftops
  while (kibIdx < TOTALS.food) {
    if (rng() < 0.6) { const s = pick(streets); placeKibble(s.x + (rng() - 0.5) * 8, 0.5, s.z + (rng() - 0.5) * 8); }
    else { const r = pick(roofs); placeKibble(r.x + (rng() - 0.5) * 4, r.y + 0.5, r.z + (rng() - 0.5) * 4); }
  }

  for (let i = 0; i < TOTALS.chip; i++) {
    const uid = "c" + i;
    const r = roofs[(i * 7 + 11) % roofs.length];
    if (state.collected[uid]) continue;
    const m = new THREE.Mesh(chipGeo, chipMat);
    m.position.set(r.x, r.y + 0.5, r.z);
    const ring = glowRing(0x00f0ff);
    ring.position.set(r.x, r.y + 0.08, r.z);
    scene.add(m); scene.add(ring);
    chips.push({ uid, m, ring, lore: i % CHIP_LORE.length, baseY: r.y + 0.5 });
  }

  const high = roofs.slice(-TOTALS.mem);
  for (let i = 0; i < TOTALS.mem; i++) {
    const uid = "m" + i;
    const r = high[i % high.length];
    if (state.collected[uid]) continue;
    const m = new THREE.Mesh(memGeo, memMat);
    m.position.set(r.x, r.y + 0.6, r.z);
    const ring = glowRing(0xff2bd6);
    ring.position.set(r.x, r.y + 0.08, r.z);
    scene.add(m); scene.add(ring);
    memories.push({ uid, m, ring, lore: i % MEMORY_LORE.length, baseY: r.y + 0.6 });
  }

  KITTEN_DEFS.forEach((k, i) => {
    if (state.kittens[k.id] === "rescued") {
      addShrineKitten(k, i);
      return;
    }
    const spot = i % 2 === 0 ? pick(streets) : roofs[(i * 13 + 5) % roofs.length];
    const mesh = miniCat(k.c);
    mesh.position.set(spot.x, (spot.y || 0), spot.z);
    scene.add(mesh);
    const carried = state.kittens[k.id] === "carried";
    const kitten = { ...k, mesh, carried };
    kittens.push(kitten);
    if (carried && !player.carrying) player.carrying = kitten;
  });

  // hidden caches: pulsing violet holo-cubes
  CACHES.forEach((c, i) => {
    if (state.flags["cache_" + c.id]) return;
    const spot = w.cacheSpots[i];
    const g = new THREE.Group();
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ color: 0x7b61ff, emissive: 0x7b61ff, emissiveIntensity: 1.4, transparent: true, opacity: 0.85 }));
    cube.position.y = 0.8;
    g.add(cube);
    const ring = glowRing(0x7b61ff);
    ring.scale.setScalar(1.6);
    ring.position.y = 0.06;
    g.add(ring);
    g.position.set(spot.x, spot.y, spot.z);
    scene.add(g);
    caches.push({ ...c, g, cube, ring, ph: i * 2 });
  });

  // prune neon jump-rings already collected in the save
  for (let i = world.rings.length - 1; i >= 0; i--) {
    if (state.collected[world.rings[i].uid]) {
      scene.remove(world.rings[i].m);
      world.rings.splice(i, 1);
    }
  }

  // floating "!" over lost kittens, "?" over hidden caches (revealed when close)
  for (const k of kittens) {
    k.icon = makeIcon("!", "#aaff00");
    k.icon.position.set(0, 1.3, 0);
    k.icon.visible = false;
    k.mesh.add(k.icon);
  }
  for (const c of caches) {
    c.icon = makeIcon("?", "#9f7bff");
    c.icon.position.set(0, 2.2, 0);
    c.icon.visible = false;
    c.g.add(c.icon);
  }

  shrineUpgrade(world, Object.values(state.kittens).filter(v => v === "rescued").length);
  world.onActivity = gameEvent;       // pigeon scatters etc. feed the flow combo
  // pounce/hunt: diving into a flock from the air or a dash is a "POUNCE!"
  world.onPounce = (flock) => {
    const pouncing = !player.grounded || player.dashT > 0;
    if (!pouncing) return;
    const bonus = 6 + (flock.birds ? flock.birds.length * 2 : 0);
    earn(bonus, "POUNCE!", true);
    gainXp(8);
    addFlow(2);
    state.stats.pounces = (state.stats.pounces || 0) + 1;
    floatText(new THREE.Vector3(flock.x, 1.6, flock.z), "POUNCE!", "#aaff00");
    burst(new THREE.Vector3(flock.x, 0.6, flock.z), { count: 14, color: 0xaaff00, speed: 3, life: 0.7, up: 2, grav: 4, drag: 1.5 });
    if (state.stats.pounces >= 15) achieve("pounce15");
  };
  ensureObjectives();
  refreshMissionUI();
  // nudge fixed content spots out of any building they landed inside, so
  // ground-level errands & discoveries are always physically reachable
  for (const dsc of world.discoveries) {
    if (dsc.minY) continue;                 // rooftop ones are reached from above
    const open = nudgeOpen(dsc.x, dsc.z);
    dsc.x = open.x; dsc.z = open.z;
    dsc.g.position.set(open.x, 0, open.z);
  }
  for (const q of SIDE_QUESTS) {
    if (q.errand.minY) continue;
    const open = nudgeOpen(q.errand.x, q.errand.z);
    q.errand.x = open.x; q.errand.z = open.z;
    for (const step of q.steps || []) {
      if (step.minY) continue;
      const stepOpen = nudgeOpen(step.x, step.z);
      step.x = stepOpen.x; step.z = stepOpen.z;
    }
  }
  for (const n of world.questNpcs) {
    const open = nudgeOpen(n.x, n.z);
    if (open.x !== n.x || open.z !== n.z) {
      n.x = open.x; n.z = open.z;
      n.g.position.set(open.x, 0, open.z);
      n.nameTag.position.set(open.x, 2.5, open.z);
      n.marker.position.set(open.x, 3.3, open.z);
    }
  }
  for (const n of world.cityNpcs) {
    const open = nudgeOpen(n.x, n.z);
    if (open.x !== n.x || open.z !== n.z) {
      n.x = open.x; n.z = open.z;
      n.g.position.set(open.x, 0, open.z);
      n.nameTag.position.set(open.x, 2.35, open.z);
      n.marker.position.set(open.x, 3.05, open.z);
    }
  }
  // restore discovery state (hide already-found shards)
  for (const dsc of world.discoveries) if (state.discoveries[dsc.id]) dsc.g.visible = false;
  refreshQuestMarkers();
  refreshSideQuestUI();
  if (state.activeJob) restoreJob(state.activeJob);
  ui.refreshStats();
}

function makeIcon(text, color) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.font = "bold 44px 'Courier New', monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = color; g.shadowBlur = 16;
  g.fillStyle = color;
  g.fillText(text, 32, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.setScalar(0.9);
  return s;
}

const SCRITCH_LINES = [
  "the citizen beams: \"awww!\"", "\"best cat in the district!\"", "they snap a photo of you",
  "\"who's a good cyber-cat?\"", "they do a little happy spin", "\"come back any time, PawPaw!\"",
  "the passer-by purrs back", "\"ten outta ten, would pet again\"",
];

let _scritchTex = null;
function scritchBubbleTex() {
  if (_scritchTex) return _scritchTex;
  const c = document.createElement("canvas");
  c.width = c.height = 90;
  const g = c.getContext("2d");
  g.font = "bold 46px 'Courier New', monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = "#ff6ab0"; g.shadowBlur = 14;
  g.fillStyle = "#ff9fd8";
  g.fillText("♥", 45, 48);
  _scritchTex = new THREE.CanvasTexture(c);
  _scritchTex.colorSpace = THREE.SRGBColorSpace;
  return _scritchTex;
}

function addShrineKitten(def, i) {
  const a = (i / 8) * Math.PI * 2 + 0.4;
  const m = miniCat(def.c);
  m.position.set(
    world.shrinePos.x + Math.cos(a) * 3.2,
    0.8,
    world.shrinePos.z + Math.sin(a) * 3.2
  );
  m.rotation.y = a + Math.PI;
  scene.add(m);
  shrineKittens.push({ m, ph: Math.random() * 9, hopT: 2 + Math.random() * 5 });
}

// ---------- economy ----------
export function earn(credits, label, rare = false) {
  if (credits > 0 && feverT > 0) { credits *= 2; rare = true; }   // FEVER doubles all income
  state.counts.credits += credits;
  state.stats.credEarned += credits;
  if (credits > 0) sfx.credit();
  if (credits > 0 && player) {
    floatText(new THREE.Vector3(player.pos.x, player.pos.y + 1.5, player.pos.z), `+${credits}¢`, rare ? "#ff9fd8" : "#ffe14d");
    player.happyT = Math.max(player.happyT, rare ? 1.6 : 0.9);   // PawPaw smiles at a reward
  }
  ui.popup(`+${credits}¢ — ${label}`, rare);
  if (state.stats.credEarned >= 1000) achieve("cred1k");
  ui.refreshStats();
  ui.pulseCredits();
}

export function gainXp(n) {
  state.xp += n;
  let need = state.level * 100;
  while (state.xp >= need) {
    state.xp -= need;
    state.level++;
    need = state.level * 100;
    sfx.levelup();
    ui.popup(`PAW LEVEL ${state.level}!`, true);
    flash("rgba(255,43,214,0.22)", 0.8);
    burst(new THREE.Vector3(player.pos.x, player.pos.y + 0.8, player.pos.z), { count: 40, color: 0xff2bd6, speed: 4, life: 1.1, up: 3, grav: 4, drag: 1 });
    if (state.level >= 5) achieve("lvl5");
  }
  ui.refreshStats();
}

export function achieve(id) {
  if (state.ach[id]) return;
  const a = ACH.find(x => x[0] === id);
  if (!a) return;
  state.ach[id] = true;
  sfx.ach();
  ui.toast(`★ ${a[1]} — ${a[2]}`);
  flash("rgba(170,255,0,0.14)", 0.6);
}

// ---------- FLOW combo + FEVER mode: chain actions, then a credit-doubling rush ----------
let combo = 0, comboT = 0;
let feverT = 0;                       // >0 while FEVER is active
export function feverActive() { return feverT > 0; }

function addFlow(n = 1) {
  combo += n;
  comboT = 4.2;
  if (combo > (state.stats.maxCombo || 0)) state.stats.maxCombo = combo;
  if (combo === 5) guideOnce("flowTip", GUIDE.flowTip);
  if (combo >= 10) achieve("combo10");
  missionComboCheck(combo);
  // hitting ×10 (and every +6 after) ignites / refreshes FEVER
  if (combo >= 10 && feverT <= 0) startFever();
  else if (feverT > 0) feverT = Math.min(12, feverT + 0.6);   // sustaining keeps it alive
  ui.combo(combo);
}

function startFever() {
  feverT = 8;
  setFever(true);
  sfx.levelup();
  flash("rgba(255,140,0,0.28)", 1.1);
  ui.fever(true);
  ui.popup("⚡ FEVER! credits doubled — keep the chain alive!", true);
}

function updateFlow(dt) {
  // FEVER countdown (independent of the chain window, but the chain feeds it)
  if (feverT > 0) {
    feverT -= dt;
    if (player) burst(new THREE.Vector3(player.pos.x, player.pos.y + 0.5, player.pos.z),
      { count: 1, color: 0xffb030, speed: 1.5, life: 0.4, up: 1.2, grav: 2, drag: 2 });
    if (feverT <= 0) { setFever(false); ui.fever(false); }
  }
  // reactive music: intensity tracks the live combo, peaks during fever
  setMusicIntensity(feverT > 0 ? 1 : Math.min(1, combo / 12));

  if (combo === 0) return;
  comboT -= dt;
  if (comboT > 0) return;
  if (combo >= 5) {
    const payout = combo * 2;
    earn(payout, `FLOW ×${combo} chain`, combo >= 12);
    burst(new THREE.Vector3(player.pos.x, player.pos.y + 0.9, player.pos.z),
      { count: 8 + combo, color: 0x00f0ff, speed: 3, life: 0.9, up: 2.4, grav: 3, drag: 1 });
  }
  combo = 0;
  ui.combo(0);
}

// ---------- rotating mini-objectives: always three goals on screen ----------
function ensureObjectives() {
  while (state.objectives.length < 3) {
    const used = state.objectives.map(o => o.type);
    const pool = OBJ_TYPES.filter(t => !used.includes(t.type));
    const t = pool[(Math.random() * pool.length) | 0];
    state.objectives.push({
      type: t.type, label: t.label,
      need: t.need[(Math.random() * t.need.length) | 0],
      have: 0, reward: t.reward,
    });
  }
  ui.renderObjectives(state.objectives);
}

// every micro-action funnels through here: combo + objective progress + mission
export function gameEvent(type) {
  addFlow(1);
  missionEvent(type);
  for (let i = 0; i < state.objectives.length; i++) {
    const o = state.objectives[i];
    if (o.type !== type) continue;
    o.have++;
    if (o.have >= o.need) {
      earn(o.reward, `objective: ${o.label}`, true);
      gainXp(o.reward);
      sfx.ach();
      state.objectives.splice(i, 1);
      ensureObjectives();
      saveGame();
      return;
    }
  }
  ui.renderObjectives(state.objectives);
}

// ---------- mission chain: always one active, always points somewhere ----------
function curMission() {
  let idx = state.missionIdx;
  if (idx >= MISSIONS.length) idx = MISSIONS.length - 1;   // park on the repeatable tail
  return MISSIONS[idx];
}

function cityNpcDef(id) { return CITY_NPCS.find(n => n.id === id); }

function missionTarget(m) {
  if (!m) return null;
  if (m.type === "goto") return m.target;
  if (m.type === "rescue" || m.type === "shrine") return { x: world.shrinePos.x, z: world.shrinePos.z };
  if (m.type === "deliver") return job ? job.dest : (world.courierBoards[0] || null);
  if (m.type === "npc" && world.cityNpcs?.length) {
    let best = null, bd = 1e9;
    for (const n of world.cityNpcs) {
      if (state.cityNpcs[n.id]) continue;
      const d = Math.hypot(n.x - player.pos.x, n.z - player.pos.z);
      if (d < bd) { bd = d; best = n; }
    }
    return best ? { x: best.x, z: best.z } : { x: world.cityNpcs[0].x, z: world.cityNpcs[0].z };
  }
  if (m.type === "cache" && caches.length) {
    let best = caches[0], bd = 1e9;
    for (const c of caches) { const d = c.g.position.distanceTo(player.pos); if (d < bd) { bd = d; best = c; } }
    return { x: best.g.position.x, z: best.g.position.z };
  }
  if (m.type === "wisp" && wisp) return { x: wisp.m.position.x, z: wisp.m.position.z };
  if (m.type === "discover" && world.discoveries?.length) {
    let best = null, bd = 1e9;
    for (const dsc of world.discoveries) {
      if (state.discoveries[dsc.id]) continue;
      const d = Math.hypot(dsc.x - player.pos.x, dsc.z - player.pos.z);
      if (d < bd) { bd = d; best = dsc; }
    }
    if (best) return { x: best.x, z: best.z };
  }
  return null;   // free-roam types (collect/rings/zip/scan): no fixed waypoint
}

// panel render — only on mission change
function refreshMissionUI() {
  const m = curMission();
  if (!m) { ui.mission(null); return; }
  ui.mission({ title: m.title, desc: m.desc, have: state.missionProg, need: m.need, reward: m.reward, type: m.type });
}

// per-frame: move the world beam + on-screen compass toward the active target
function updateMissionWaypoint(pp) {
  const m = curMission();
  const t = m ? missionTarget(m) : null;
  if (t && world.missionBeam) {
    world.missionBeam.position.set(t.x, 45, t.z);
    world.missionBeam.visible = true;
  } else if (world.missionBeam) {
    world.missionBeam.visible = false;
  }
  ui.compass(t, pp, player.yaw, m ? m.title : null);
}

function completeMission() {
  const m = curMission();
  earn(m.reward, `MISSION: ${m.title}`, true);
  gainXp(m.xp);
  sfx.levelup();
  flash("rgba(255,225,77,0.22)", 1.0);
  burst(new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z),
    { count: 50, color: 0xffe14d, speed: 4, life: 1.4, up: 3.5, grav: 3, drag: 0.9 });
  ui.toast(`✦ MISSION COMPLETE — ${m.title}`);
  state.missionProg = 0;
  if (!m.repeat && state.missionIdx < MISSIONS.length - 1) state.missionIdx++;
  if (state.missionIdx >= MISSIONS.length - 1) achieve("story");
  refreshMissionUI();
  saveGame();
}

function missionEvent(type) {
  const m = curMission();
  if (!m || m.type === "goto") return;
  const map = { collect: "kibble", rings: "ring", deliver: "deliver", cache: "cache", zip: "zipend", wisp: "wisp", scan: "poster", npc: "citynpc", discover: "discover" };
  if (map[m.type] !== type) return;
  state.missionProg++;
  if (state.missionProg >= m.need) completeMission();
  else { refreshMissionUI(); sfx.credit(); }
}

function missionComboCheck(value) {
  const m = curMission();
  if (!m || m.type !== "combo") return;
  state.missionProg = Math.max(state.missionProg, value);
  if (state.missionProg >= m.need) completeMission();
  else refreshMissionUI();
}

// reach-based mission progress (goto / rescue / shrine), checked each frame
function missionReachCheck() {
  const m = curMission();
  if (!m) return;
  if (m.type === "goto") {
    if (Math.hypot(m.target.x - player.pos.x, m.target.z - player.pos.z) < 6) completeMission();
  } else if (m.type === "shrine") {
    state.missionProg = Object.values(state.kittens).filter(v => v === "rescued").length;
    if (state.missionProg >= m.need) completeMission();
  } else if (m.type === "level") {
    state.missionProg = Math.min(m.need, state.level);
    if (state.level >= m.need) completeMission();
    else refreshMissionUI();
  }
}

export function missionRescued() {
  const m = curMission();
  if (m && m.type === "rescue") {
    state.missionProg++;
    if (state.missionProg >= m.need) completeMission();
  }
}

// push a ground point out to open space if it sits inside a building footprint
function nudgeOpen(x, z) {
  for (let pass = 0; pass < 4; pass++) {
    let hit = null;
    for (const c of world.colliders) {
      if ((c.bot || 0) > 0.1) continue;             // only ground-rooted blocks
      if (x > c.minX - 1.2 && x < c.maxX + 1.2 && z > c.minZ - 1.2 && z < c.maxZ + 1.2) { hit = c; break; }
    }
    if (!hit) return { x, z };
    // shove out along the shallowest face + margin
    const pl = x - hit.minX, pr = hit.maxX - x, pn = z - hit.minZ, pf = hit.maxZ - z;
    const m = Math.min(pl, pr, pn, pf);
    if (m === pl) x = hit.minX - 1.6;
    else if (m === pr) x = hit.maxX + 1.6;
    else if (m === pn) z = hit.minZ - 1.6;
    else z = hit.maxZ + 1.6;
  }
  return { x, z };
}

// ---------- NPC side-quests: interconnected character errands ----------
function sqDef(id) { return SIDE_QUESTS.find(q => q.id === id); }
function sqUnlocker(id) { return SIDE_QUESTS.find(q => q.unlocks === id); }
function sqStep(q) {
  const steps = q.steps || [q.errand];
  return steps[Math.min(state.sideQuestSteps[q.id] || 0, steps.length - 1)];
}

// can this NPC currently offer its quest? (gated by story + prior quest done)
function sqOfferable(q) {
  if (state.sideQuests[q.id]) return false;            // already active/found/done
  if (state.missionIdx < q.gate) return false;         // story not far enough
  const prev = sqUnlocker(q.id);
  return prev ? state.sideQuests[prev.id] === "done" : true;
}

function activeSideQuest() {
  for (const q of SIDE_QUESTS) if (state.sideQuests[q.id] === "active") return q;
  return null;
}

// markers: show "!" when offerable, "?" (return) when found, hidden otherwise
function refreshQuestMarkers() {
  for (const n of world.questNpcs) {
    const q = sqDef(n.id);
    const st = state.sideQuests[q.id];
    n.marker.visible = sqOfferable(q) || st === "found";
  }
  for (const n of world.cityNpcs || []) n.marker.visible = !state.cityNpcs[n.id];
}

// talk to a quest NPC (E)
function talkToNpc(n) {
  const q = sqDef(n.id);
  const st = state.sideQuests[q.id];
  if (st === "found") {
    // turn in
    state.sideQuests[q.id] = "done";
    earn(q.reward, `${q.giver}'s thanks`, true);
    gainXp(q.xp);
    sfx.shrine();
    flash("rgba(0,240,255,0.18)", 0.8);
    burst(new THREE.Vector3(n.x, 1.4, n.z), { count: 36, color: q.color, speed: 3.5, life: 1.3, up: 3, grav: 3, drag: 1 });
    ui.showLore(q.giver.toUpperCase(), q.done);
    refreshQuestMarkers();
    const allDone = SIDE_QUESTS.every(x => state.sideQuests[x.id] === "done");
    if (allDone) achieve("friends");
    saveGame();
  } else if (st === "active") {
    ui.showLore(q.giver.toUpperCase(), q.mid);   // reminder
  } else if (sqOfferable(q)) {
    state.sideQuests[q.id] = "active";
    state.sideQuestSteps[q.id] = 0;
    sfx.unlock();
    ui.showLore(q.giver.toUpperCase(), q.offer);
    refreshQuestMarkers();
    refreshSideQuestUI();
    saveGame();
  }
}

// reach the errand spot → state becomes "found", go back to the NPC
function checkSideQuestReach(pp) {
  const q = activeSideQuest();
  if (!q) return;
  const e = sqStep(q);
  const near = (e.x - pp.x) ** 2 + (e.z - pp.z) ** 2 < (e.r * e.r);
  if (near && (!e.minY || pp.y >= e.minY - 1)) {
    const steps = q.steps || [q.errand];
    const idx = state.sideQuestSteps[q.id] || 0;
    if (idx < steps.length - 1) {
      state.sideQuestSteps[q.id] = idx + 1;
      sfx.credit();
      ui.popup(`${q.giver}: next step — ${steps[idx + 1].label}`, true);
      burst(new THREE.Vector3(e.x, pp.y + 0.6, e.z), { count: 18, color: q.color, speed: 2.6, life: 0.9, up: 2, grav: 3, drag: 1.2 });
      refreshSideQuestUI();
      saveGame();
      return;
    }
    state.sideQuests[q.id] = "found";
    sfx.ach();
    ui.popup(`errand chain done — return to ${q.giver}!`, true);
    burst(new THREE.Vector3(e.x, pp.y + 0.6, e.z), { count: 24, color: q.color, speed: 3, life: 1, up: 2.5, grav: 3, drag: 1.2 });
    refreshQuestMarkers();
    refreshSideQuestUI();
    saveGame();
  }
}

function refreshSideQuestUI() {
  const q = activeSideQuest();
  if (q) {
    const e = sqStep(q);
    ui.sideQuest(`<b>${q.giver}</b> — ${e.label || (e.minY ? "climb to the marked roof" : "reach the marked spot")}`);
  }
  else {
    const ret = SIDE_QUESTS.find(x => state.sideQuests[x.id] === "found");
    ui.sideQuest(ret ? `<b>${ret.giver}</b> — return for your reward` : null);
  }
}

// ---------- collection sets: live progress + one-time completion bonus ----------
export function setProgress(set) {
  if (set.stat === "kit") return Object.values(state.kittens).filter(v => v === "rescued").length;
  if (set.stat === "cache") return CACHES.filter(c => state.flags["cache_" + c.id]).length;
  return state.counts[set.stat] || 0;
}
function checkSets() {
  for (const set of COLLECTION_SETS) {
    if (state.flags["set_" + set.id]) continue;
    if (setProgress(set) >= set.need) {
      state.flags["set_" + set.id] = true;
      earn(set.reward, `SET COMPLETE: ${set.name}`, true);
      gainXp(set.reward);
      sfx.levelup();
      flash("rgba(255,225,77,0.22)", 1.1);
      burst(new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z), { count: 50, color: 0xffe14d, speed: 4, life: 1.5, up: 3.5, grav: 3, drag: 0.9 });
      ui.toast(`★ COLLECTION SET — ${set.name} complete!`);
      if (COLLECTION_SETS.every(s => state.flags["set_" + s.id])) achieve("collector");
      saveGame();
    }
  }
}

// ---------- hidden discoveries: reward exploration & climbing ----------
function checkDiscoveries(pp) {
  for (const dsc of world.discoveries) {
    if (state.discoveries[dsc.id]) continue;
    const near = (dsc.x - pp.x) ** 2 + (dsc.z - pp.z) ** 2 < (dsc.r * dsc.r);
    if (near && (!dsc.minY || pp.y >= dsc.minY - 1)) {
      state.discoveries[dsc.id] = true;
      dsc.g.visible = false;
      sfx.unlock();
      earn(dsc.reward, `discovered: ${dsc.name}`, true);
      gainXp(dsc.reward);
      gameEvent("discover");
      flash("rgba(159,123,255,0.2)", 0.9);
      burst(new THREE.Vector3(dsc.x, pp.y + 0.8, dsc.z), { count: 40, color: 0x9f7bff, speed: 3.4, life: 1.3, up: 3, grav: 3, drag: 1 });
      const found = Object.keys(state.discoveries).length;
      ui.showLore("✦ DISCOVERY — " + dsc.name, dsc.lore + `<br><br><em>${found}/${DISCOVERIES.length} hidden places found.</em>`);
      if (found >= DISCOVERIES.length) achieve("explore");
      saveGame();
    }
  }
}

export function onPlayerEvent(type) {
  if (type === "zipend") gameEvent("zipend");
  else if (type === "dash") gameEvent("dash");
}

// ---------- universal meow (F): a playful shout the whole street reacts to ----------
let meowCD = 0;
export function meow() {
  if (meowCD > 0) return;
  meowCD = 0.5;
  sfx.meow();
  const pp = player.pos;
  // little sound-ring puff
  burst(new THREE.Vector3(pp.x, pp.y + 0.7, pp.z), { count: 8, color: 0x9fd8ff, speed: 2.2, life: 0.5, up: 0.6, grav: 0, drag: 3 });
  if (player.squash) player.meowT = 0.3;     // head-tilt cue handled in player anim
  // scatter any pigeon flock within earshot
  if (world.pigeons) {
    for (const flock of world.pigeons) {
      if (flock.state === "peck" && (flock.x - pp.x) ** 2 + (flock.z - pp.z) ** 2 < 400) {
        flock.state = "fly"; flock.t = 0; sfx.flap();
        for (const b of flock.birds) {
          const ang = Math.atan2(b.m.position.x - pp.x, b.m.position.z - pp.z) + (Math.random() - 0.5);
          b.vx = Math.sin(ang) * 3; b.vz = Math.cos(ang) * 3; b.vy = 3.5;
        }
        gameEvent("pigeons");
      }
    }
  }
  // nearby NPCs turn and react with a bubble
  if (world.citizens) {
    for (const c of world.citizens) {
      if ((c.g.position.x - pp.x) ** 2 + (c.g.position.z - pp.z) ** 2 < 120 && c.bubbleT <= 0) c.bubbleT = 1.8;
    }
  }
}

// ---------- courier jobs: timed deliveries with a streak ----------
let job = null, pkgMesh = null;

function ensurePackageMesh() {
  if (pkgMesh) return;
  pkgMesh = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x8a5c30, roughness: 0.9 }));
  pkgMesh.add(box);
  const strap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.46),
    new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347, emissiveIntensity: 0.8 }));
  pkgMesh.add(strap);
  scene.add(pkgMesh);
}

function setDeliveryTarget(dest) {
  world.deliveryBeam.position.x = dest.x;
  world.deliveryBeam.position.z = dest.z;
  world.deliveryBeam.visible = true;
}

function restoreJob(saved) {
  if (!saved?.dest) return;
  job = { dest: saved.dest, dist: saved.dist || 50, timeLeft: saved.timeLeft || 40 };
  ensurePackageMesh();
  pkgMesh.visible = true;
  setDeliveryTarget(job.dest);
}

function takeJob(board) {
  const pp = player.pos;
  const options = COURIER_DESTS.filter(d => Math.hypot(d.x - board.x, d.z - board.z) > 45);
  const dest = options[(Math.random() * options.length) | 0];
  const dist = Math.hypot(dest.x - pp.x, dest.z - pp.z);
  job = { dest, dist, timeLeft: dist / 5 + 16 };
  ensurePackageMesh();
  pkgMesh.visible = true;
  state.activeJob = { dest, dist, timeLeft: job.timeLeft };
  setDeliveryTarget(dest);
  sfx.buy();
  ui.popup(`deliver to ${dest.name}!`, true);
  guideOnce("boardTip", GUIDE.boardTip);
}

function updateJob(dt) {
  if (!job) { ui.jobChip(null); return; }
  const pp = player.pos;
  pkgMesh.position.set(pp.x, pp.y + 0.85 * (player.squash ? player.squash.scale.y : 1), pp.z);
  pkgMesh.rotation.y = player.facing;
  job.timeLeft -= dt;
  state.activeJob = { dest: job.dest, dist: job.dist, timeLeft: job.timeLeft };
  const d = Math.hypot(job.dest.x - pp.x, job.dest.z - pp.z);
  if (d < 4.5) {
    const bonus = 1 + state.courierStreak * 0.2;
    const pay = Math.round((16 + job.dist * 0.5) * bonus);
    state.courierStreak++;
    state.stats.jobs++;
    earn(pay, `delivered! streak ×${state.courierStreak}`, state.courierStreak >= 3);
    gainXp(30);
    sfx.shrine();
    burst(new THREE.Vector3(pp.x, pp.y + 1, pp.z), { count: 30, color: 0xffb347, speed: 3.5, life: 1.1, up: 3, grav: 3, drag: 1 });
    flash("rgba(255,179,71,0.18)", 0.7);
    gameEvent("deliver");
    if (state.stats.jobs >= 10) achieve("jobs10");
    endJob();
  } else if (job.timeLeft <= 0) {
    ui.popup("delivery expired — streak lost");
    sfx.deny();
    state.courierStreak = 0;
    endJob();
  } else {
    const secs = Math.ceil(job.timeLeft);
    ui.jobChip(`📦 ${job.dest.name} — ${Math.round(d)} m ${bearingArrow(job.dest, pp)} — <b>${secs}s</b>${state.courierStreak ? ` · streak ×${state.courierStreak}` : ""}`);
  }
}

function endJob() {
  job = null;
  state.activeJob = null;
  if (pkgMesh) pkgMesh.visible = false;
  world.deliveryBeam.visible = false;
  ui.jobChip(null);
  saveGame();
}

function guideOnce(flag, text) {
  if (state.flags[flag]) return;
  state.flags[flag] = true;
  ui.guide(text);
}

// ---------- per-frame ----------
const tmp = new THREE.Vector3();

export function updateGame(dt, time) {
  const pp = player.pos;
  const t = performance.now() / 1000;

  const z = zoneAt(pp.x);
  if (z !== lastZone) { lastZone = z; ui.zoneBanner(z.name); }

  // kibble: spin, pulse, magnet, pickup
  const magnetR = state.upgrades.magnet ? 5 : 0;
  for (let i = kibbles.length - 1; i >= 0; i--) {
    const k = kibbles[i];
    k.m.rotation.y += dt * 2.4;
    k.m.position.y = k.baseY + Math.sin(t * 2 + k.ph) * 0.12;
    const pulse = 1 + Math.sin(t * 3.2 + k.ph) * 0.15;
    k.m.scale.setScalar(pulse);
    const d = k.m.position.distanceTo(pp);
    if (magnetR && d < magnetR && d > CFG.PICKUP_R * 0.5) {
      tmp.copy(pp).setY(pp.y + 0.5).sub(k.m.position).normalize();
      k.m.position.addScaledVector(tmp, dt * 7);
      k.baseY = k.m.position.y;
    }
    if (d < CFG.PICKUP_R) {
      burst(k.m.position, { count: 8, color: 0xffb347, speed: 1.6, life: 0.45, up: 1.4, grav: 4, drag: 2 });
      scene.remove(k.m);
      kibbles.splice(i, 1);
      state.collected[k.uid] = true;
      state.counts.food++;
      sfx.kibble();
      gainXp(5);
      earn(1, "holo-kibble");
      gameEvent("kibble");
      guideOnce("firstFood", GUIDE.firstFood);
      if (state.counts.food === 5) guideOnce("trailTip", GUIDE.trailTip);
      if (state.counts.food >= 1) achieve("kib1");
      if (state.counts.food >= 50) achieve("kib50");
      if (state.counts.food >= TOTALS.food) achieve("kib140");
      if (!state.abilities.dash && state.counts.food >= UNLOCKS.dash) {
        state.abilities.dash = true;
        sfx.unlock();
        ui.guide(GUIDE.dashUnlock);
        ui.popup("TELEPORT DASH UNLOCKED (X)", true);
        flash("rgba(0,240,255,0.2)", 0.8);
      }
      if (!state.abilities.djump && state.counts.food >= UNLOCKS.djump) {
        state.abilities.djump = true;
        sfx.unlock();
        ui.guide(GUIDE.djumpUnlock);
        ui.popup("DOUBLE JUMP UNLOCKED", true);
        flash("rgba(0,240,255,0.2)", 0.8);
      }
    }
  }

  // chips & memories
  for (let i = chips.length - 1; i >= 0; i--) {
    const c = chips[i];
    c.m.rotation.y += dt * 1.6;
    c.m.position.y = c.baseY + Math.sin(t * 1.5 + i) * 0.1;
    c.ring.scale.setScalar(1 + Math.sin(t * 2.2 + i) * 0.18);
    if (c.m.position.distanceTo(pp) < CFG.PICKUP_R) {
      burst(c.m.position, { count: 20, color: 0x00f0ff, speed: 2.6, life: 0.8, up: 2, grav: 3, drag: 1.5 });
      flash("rgba(0,240,255,0.16)", 0.6);
      scene.remove(c.m); scene.remove(c.ring);
      chips.splice(i, 1);
      state.collected[c.uid] = true;
      state.counts.chip++;
      sfx.chip();
      gainXp(25);
      earn(15, "data chip", true);
      guideOnce("firstChip", GUIDE.firstChip);
      ui.showLore(...CHIP_LORE[c.lore]);
      if (state.counts.chip >= TOTALS.chip) achieve("chips");
    }
  }
  for (let i = memories.length - 1; i >= 0; i--) {
    const c = memories[i];
    c.m.rotation.y += dt * 1.2;
    c.m.rotation.x += dt * 0.7;
    c.m.position.y = c.baseY + Math.sin(t * 1.2 + i) * 0.15;
    c.ring.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.2);
    if (c.m.position.distanceTo(pp) < CFG.PICKUP_R) {
      burst(c.m.position, { count: 30, color: 0xff2bd6, speed: 3, life: 1, up: 2.4, grav: 2.5, drag: 1.2 });
      flash("rgba(255,43,214,0.18)", 0.8);
      scene.remove(c.m); scene.remove(c.ring);
      memories.splice(i, 1);
      state.collected[c.uid] = true;
      state.counts.mem++;
      sfx.memory();
      gainXp(40);
      earn(25, "lost memory", true);
      ui.showLore(...MEMORY_LORE[c.lore]);
      if (state.counts.mem >= TOTALS.mem) achieve("mems");
    }
  }

  // kittens idle
  for (const k of kittens) {
    if (k.carried) continue;
    k.mesh.rotation.y = Math.sin(t * 0.8 + k.mesh.position.x) * 0.6;
    k.mesh.position.y = (k.mesh.userData.baseY ?? k.mesh.position.y);
    if (k.mesh.position.distanceTo(pp) < 14) guideOnce("kittenTip", GUIDE.kittenTip);
  }
  // rescued kittens play around the shrine
  for (const sk of shrineKittens) {
    sk.hopT -= dt;
    if (sk.hopT <= 0) {
      sk.hopT = 2 + Math.random() * 5;
      sk.hopV = 2.2;
    }
    if (sk.hopV) {
      sk.m.position.y += sk.hopV * dt;
      sk.hopV -= 9 * dt;
      if (sk.m.position.y <= 0.8) { sk.m.position.y = 0.8; sk.hopV = 0; }
    }
    sk.m.rotation.y += Math.sin(t * 0.5 + sk.ph) * dt * 0.8;
  }

  // caches pulse
  for (const c of caches) {
    c.cube.rotation.y += dt * 1.4;
    c.cube.rotation.x += dt * 0.6;
    c.cube.position.y = 0.8 + Math.sin(t * 1.8 + c.ph) * 0.15;
    c.cube.material.emissiveIntensity = 1.2 + Math.sin(t * 2.6 + c.ph) * 0.6;
    c.ring.scale.setScalar(1.6 + Math.sin(t * 2.6 + c.ph) * 0.3);
    if (c.g.position.distanceTo(pp) < 16) guideOnce("cacheTip", GUIDE.cacheTip);
  }

  // wisp
  wispTimer -= dt;
  if (!wisp && wispTimer <= 0) spawnWisp();
  if (wisp) {
    wisp.life -= dt;
    tmp.copy(wisp.m.position).sub(pp);
    tmp.y = 0;
    const d = tmp.length();
    if (d < 12 && d > 0.01) {
      tmp.normalize();
      wisp.m.position.addScaledVector(tmp, dt * 3.2);
    }
    wisp.m.position.y = 1 + Math.sin(t * 4) * 0.4;
    wisp.m.material.opacity = Math.min(1, wisp.life / 4);
    burst(wisp.m.position, { count: 1, color: 0xaaff00, speed: 0.3, life: 0.5, up: 0.2, grav: 0, drag: 2 });
    if (wisp.m.position.distanceTo(pp) < CFG.PICKUP_R + 0.4) {
      sfx.wisp();
      state.stats.wisps++;
      gameEvent("wisp");
      burst(wisp.m.position, { count: 24, color: 0xaaff00, speed: 3, life: 0.8, up: 2, grav: 3, drag: 1.5 });
      earn(8 + ((Math.random() * 12) | 0), "data wisp caught", true);
      gainXp(15);
      if (state.stats.wisps >= 5) achieve("wisp5");
      despawnWisp();
    } else if (wisp.life <= 0) despawnWisp();
  }

  if (state.buffT > 0) state.buffT -= dt;

  if (player.grounded && pp.y > 40) achieve("roof");
  if (player.grounded && pp.y > 12) guideOnce("rooftop", GUIDE.rooftop);
  if (pp.distanceTo(world.vendorPos) < 12) guideOnce("shopTip", GUIDE.shopTip);

  // spire hint once the player has warmed up
  if (state.counts.food >= 8) guideOnce("spireTip", GUIDE.spireTip);

  // weather
  const rainPhase = Math.sin(time * Math.PI * 2 * 3 + 1.3);
  const wasRain = world.rainOn;
  world.rainOn = rainPhase > 0.55;
  if (world.rainOn && !wasRain) guideOnce("rainTip", GUIDE.rain);

  // ---- micro-activities ----
  // neon jump-rings: fly through to collect
  for (let i = world.rings.length - 1; i >= 0; i--) {
    const r = world.rings[i];
    const d = r.m.position.distanceTo(pp);
    if (d < 9) guideOnce("ringTip", GUIDE.ringTip);
    if (d < 1.05) {
      burst(r.m.position, { count: 16, color: 0x00f0ff, speed: 2.4, life: 0.7, up: 1.6, grav: 2, drag: 1.5 });
      sfx.ring();
      gameEvent("ring");
      scene.remove(r.m);
      world.rings.splice(i, 1);
      state.collected[r.uid] = true;
      earn(3, "neon ring");
      gainXp(6);
    }
  }
  // knockable cans
  for (const can of world.cans) {
    if (!can.alive) continue;
    const dx = can.x - pp.x, dz = can.z - pp.z;
    if (dx * dx + dz * dz < 0.45 && pp.y < 1) {
      can.alive = false;
      sfx.can();
      gameEvent("can");
      burst(can.m.position, { count: 6, color: 0x9aa6b8, speed: 2.2, life: 0.5, up: 1.8, grav: 7, drag: 1.5 });
      scene.remove(can.m);
      if (Math.random() < 0.3) earn(1, "lucky can");
    }
  }
  // proximity tips for vending machines & posters
  for (const v of world.vendings) {
    if (!state.flags["vm_" + v.id] && (v.x - pp.x) ** 2 + (v.z - pp.z) ** 2 < 36) { guideOnce("vendTip", GUIDE.vendTip); break; }
  }
  for (const ps of world.posters) {
    if (!state.flags["ps_" + ps.id] && (ps.x - pp.x) ** 2 + (ps.z - pp.z) ** 2 < 25) { guideOnce("posterTip", GUIDE.posterTip); break; }
  }
  // climb language & map tips early on
  if (state.counts.food >= 3) guideOnce("climbTip", GUIDE.climbTip);
  if (state.counts.food >= 12) guideOnce("mapTip", GUIDE.mapTip);

  // kitten / cache icons reveal when nearby
  for (const k of kittens) {
    if (k.carried || !k.icon) continue;
    const d = k.mesh.position.distanceTo(pp);
    k.icon.visible = d < 30;
    if (k.icon.visible) k.icon.position.y = 1.3 + Math.sin(t * 2.4) * 0.12;
  }
  for (const c of caches) {
    if (!c.icon) continue;
    const d = c.g.position.distanceTo(pp);
    c.icon.visible = d < 45;
    if (c.icon.visible) c.icon.position.y = 2.2 + Math.sin(t * 2) * 0.15;
  }

  // flow combo decay, courier job, mission waypoint
  if (meowCD > 0) meowCD -= dt;
  updateFlow(dt);
  missionReachCheck();
  updateMissionWaypoint(pp);

  // side-quest errands & hidden discoveries
  checkSideQuestReach(pp);
  checkDiscoveries(pp);
  const aq = activeSideQuest();
  if (world.questBeam) {
    if (aq) {
      const e = sqStep(aq);
      world.questBeam.position.set(e.x, 50, e.z);
      world.questBeam.visible = true;
    }
    else world.questBeam.visible = false;
  }
  updateJob(dt);

  // nearby-activity hint (bottom-left)
  hintT -= dt;
  if (hintT <= 0) {
    hintT = 0.7;
    updateNearbyHint(pp);
    updateAmbience(pp);
    checkSets();
  }

  // hover-car whoosh when one slides past close by
  whooshCD -= dt;
  if (whooshCD <= 0) {
    for (const car of world.cars) {
      const d2 = (car.g.position.x - pp.x) ** 2 + (car.g.position.z - pp.z) ** 2;
      if (d2 < 110) { sfx.whoosh(); whooshCD = 5; break; }
    }
  }

  // street mini-events: sparking signs & courier sky-drops
  eventT -= dt;
  if (eventT <= 0) {
    eventT = 15 + Math.random() * 12;
    runMiniEvent(pp);
  }
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.life -= dt;
    d.m.rotation.y += dt * 3;
    if (d.m.position.y > 0.5) d.m.position.y -= dt * 2.4;     // parachute down
    if (d.m.position.distanceTo(pp) < CFG.PICKUP_R) {
      if (d.wisp) { sfx.wisp(); earn(8, "wisp swarm", true); gainXp(8); state.stats.wisps++; gameEvent("wisp"); burst(d.m.position, { count: 12, color: 0xaaff00, speed: 2.4, life: 0.6, up: 1.8, grav: 3, drag: 1.5 }); }
      else { sfx.kibble(); earn(4, "sky-drop credit"); gainXp(4); burst(d.m.position, { count: 10, color: 0xffe14d, speed: 2, life: 0.5, up: 1.5, grav: 4, drag: 2 }); }
      d.life = 0;
    }
    if (d.life <= 0) { scene.remove(d.m); drops.splice(i, 1); }
  }

  // city blackout: dim the grid via a multiplier the day-cycle respects, then surge back
  if (blackoutT > 0) {
    blackoutT -= dt;
    world.blackout = blackoutT > 0.4 ? 0.22 : 1;
    if (blackoutT <= 0) world.blackout = 1;
  }

  updateInteractTip();
}

let whooshCD = 3, eventT = 12;
const drops = [];
const dropGeo = new THREE.OctahedronGeometry(0.3);
const dropMat = new THREE.MeshStandardMaterial({ color: 0xffe14d, emissive: 0xffe14d, emissiveIntensity: 1.6 });
const swarmMat = new THREE.MeshStandardMaterial({ color: 0xaaff00, emissive: 0xaaff00, emissiveIntensity: 2 });

let blackoutT = 0;
function runMiniEvent(pp) {
  const roll = Math.random();
  if (roll < 0.34 && world.signs.length) {
    // a nearby neon sign shorts out in a shower of sparks
    let best = null, bd = 1e9;
    for (const s of world.signs) {
      const d = s.mesh.position.distanceTo(pp);
      if (d < bd) { bd = d; best = s; }
    }
    if (best && bd < 50) {
      sfx.spark();
      burst(best.mesh.position, { count: 26, color: 0xffd98a, speed: 2.6, life: 0.9, up: -0.5, grav: 7, drag: 1 });
      burst(best.mesh.position, { count: 10, color: 0x00f0ff, speed: 1.8, life: 0.7, up: -0.5, grav: 6, drag: 1 });
      best.t += 40;   // makes the flicker stutter for a moment
    }
  } else if (roll < 0.55) {
    // a courier drone fumbles a delivery: credits drift down nearby
    const a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 6;
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      m.position.set(pp.x + Math.cos(a) * r + (Math.random() - 0.5) * 3, 9 + i, pp.z + Math.sin(a) * r + (Math.random() - 0.5) * 3);
      scene.add(m);
      drops.push({ m, life: 26 });
    }
    ui.popup("a courier drone fumbled its cargo!");
  } else if (roll < 0.74) {
    // CITY BLACKOUT: the grid browns out for a few seconds, then surges back
    blackoutT = 4;
    sfx.whoosh();
    ui.popup("⚡ city blackout — the grid is browning out…");
    flash("rgba(0,0,20,0.4)", 0.6);
  } else if (roll < 0.9) {
    // WISP SWARM: a cluster of data wisps surges up nearby — grab them fast
    ui.popup("✦ a data-wisp swarm surfaced nearby!", true);
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2, r = 6 + Math.random() * 10;
      const m = new THREE.Mesh(dropGeo, swarmMat);
      m.position.set(pp.x + Math.cos(a) * r, 1 + Math.random() * 1.5, pp.z + Math.sin(a) * r);
      scene.add(m);
      drops.push({ m, life: 20, wisp: true });
    }
  } else {
    // STREET FESTIVAL: nearby NPCs cheer and a shower of confetti-credits
    if (world.citizens) for (const c of world.citizens) {
      if ((c.g.position.x - pp.x) ** 2 + (c.g.position.z - pp.z) ** 2 < 900) c.bubbleT = 2.4;
    }
    burst(new THREE.Vector3(pp.x, 4, pp.z), { count: 50, color: 0xff2bd6, speed: 4, life: 1.8, up: 1, grav: 4, drag: 0.8, spread: 3 });
    burst(new THREE.Vector3(pp.x, 4, pp.z), { count: 40, color: 0xffe14d, speed: 3.5, life: 1.6, up: 1, grav: 4, drag: 0.8, spread: 3 });
    sfx.shrine();
    earn(15, "street festival!", true);
    ui.popup("🎉 a pop-up street festival breaks out!", true);
  }
}

function updateAmbience(pp) {
  let traffic = 0;
  for (const car of world.cars) {
    const d2 = (car.g.position.x - pp.x) ** 2 + (car.g.position.z - pp.z) ** 2;
    if (d2 < 1600) traffic += 1 - Math.sqrt(d2) / 40;
  }
  let buzz = 0;
  for (const s of world.signs) {
    const d2 = (s.mesh.position.x - pp.x) ** 2 + (s.mesh.position.z - pp.z) ** 2;
    if (d2 < 64) { buzz = 1 - Math.sqrt(d2) / 8; break; }
  }
  setAmbience({ rain: world.rainOn ? 1 : 0, traffic: Math.min(1, traffic / 2), buzz });
}

let hintT = 0;
function updateNearbyHint(pp) {
  const options = [];
  for (const k of kittens) if (!k.carried) options.push({ d: k.mesh.position.distanceTo(pp), label: "lost kitten", icon: "!", x: k.mesh.position.x, z: k.mesh.position.z });
  for (const c of caches) options.push({ d: c.g.position.distanceTo(pp), label: "hidden cache", icon: "?", x: c.g.position.x, z: c.g.position.z });
  for (const r of world.rings) options.push({ d: r.m.position.distanceTo(pp), label: "neon ring", icon: "◎", x: r.m.position.x, z: r.m.position.z });
  for (const v of world.vendings) if (!state.flags["vm_" + v.id]) options.push({ d: Math.hypot(v.x - pp.x, v.z - pp.z), label: "vending machine", icon: "▤", x: v.x, z: v.z });
  for (const ps of world.posters) if (!state.flags["ps_" + ps.id]) options.push({ d: Math.hypot(ps.x - pp.x, ps.z - pp.z), label: "lore poster", icon: "▢", x: ps.x, z: ps.z });
  if (wisp) options.push({ d: wisp.m.position.distanceTo(pp), label: "data wisp", icon: "✦", x: wisp.m.position.x, z: wisp.m.position.z });
  options.push({ d: pp.distanceTo(world.vendorPos), label: "Mei's upgrades", icon: "¢", x: world.vendorPos.x, z: world.vendorPos.z });
  for (const n of world.cityNpcs || []) {
    const def = cityNpcDef(n.id);
    if (!def) continue;
    options.push({ d: Math.hypot(n.x - pp.x, n.z - pp.z), label: state.cityNpcs[n.id] ? def.name : `${def.name}: ${def.topic}`, icon: "●", x: n.x, z: n.z });
  }
  if (player.carrying) options.push({ d: pp.distanceTo(world.shrinePos), label: "Paw Shrine — bring the kitten!", icon: "♥", x: world.shrinePos.x, z: world.shrinePos.z });
  for (const z of world.ziplines) options.push({ d: Math.hypot(z.a.x - pp.x, z.a.z - pp.z), label: "zipline", icon: "Z", x: z.a.x, z: z.a.z });
  // active side-quest errand / return-to-NPC takes priority as guidance
  const aq = activeSideQuest();
  if (aq) {
    const e = sqStep(aq);
    options.push({ d: Math.hypot(e.x - pp.x, e.z - pp.z), label: `${aq.giver}: ${e.label || "errand"}`, icon: "✦", x: e.x, z: e.z, prio: true });
  }
  for (const n of world.questNpcs) if (state.sideQuests[n.id] === "found") {
    const q = sqDef(n.id);
    options.push({ d: Math.hypot(n.x - pp.x, n.z - pp.z), label: `return to ${q.giver}`, icon: "✦", x: n.x, z: n.z, prio: true });
  }
  options.sort((a, b) => (b.prio ? 1 : 0) - (a.prio ? 1 : 0) || a.d - b.d);
  const best = options[0];
  if (best && (best.prio || best.d < 65)) {
    ui.nearbyHint(`<b>${best.icon}</b> ${best.label} — ${Math.round(best.d)} m ${bearingArrow(best, pp)}`);
  } else ui.nearbyHint(null);
}

// which way to look: arrow relative to the camera yaw
function bearingArrow(opt, pp) {
  let tx = opt.x, tz = opt.z;
  if (tx === undefined) return "";
  const bearing = Math.atan2(tx - pp.x, tz - pp.z);
  let rel = bearing - player.yaw + Math.PI;     // camera looks along -yaw axis
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  const idx = Math.round(-rel / (Math.PI / 4)) & 7;
  return ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"][idx];
}

// ---------- city map (M) ----------
function snapLane(v) {
  return Math.round((v - 17) / 34) * 34 + 17;
}

function routeTo(from, to) {
  const laneZ = snapLane(from.z);
  const laneX = snapLane(to.x);
  return [
    { x: from.x, z: from.z },
    { x: from.x, z: laneZ },
    { x: laneX, z: laneZ },
    { x: laneX, z: to.z },
    { x: to.x, z: to.z },
  ];
}

export function getMapData() {
  const m = curMission();
  const mt = m ? missionTarget(m) : null;
  return {
    city: CFG.CITY,
    player: { x: player.pos.x, z: player.pos.z, yaw: player.yaw },
    kittens: kittens.filter(k => !k.carried).map(k => ({ x: k.mesh.position.x, z: k.mesh.position.z })),
    caches: caches.map(c => ({ x: c.g.position.x, z: c.g.position.z })),
    rings: world.rings.map(r => ({ x: r.m.position.x, z: r.m.position.z })),
    boards: world.courierBoards.map(b => ({ x: b.x, z: b.z })),
    ziplines: world.ziplines.map(z => ({ x: z.a.x, z: z.a.z })),
    vendings: world.vendings.filter(v => !state.flags["vm_" + v.id]).map(v => ({ x: v.x, z: v.z })),
    posters: world.posters.filter(p => !state.flags["ps_" + p.id]).map(p => ({ x: p.x, z: p.z })),
    shrine: { x: world.shrinePos.x, z: world.shrinePos.z },
    vendor: { x: world.vendorPos.x, z: world.vendorPos.z },
    performer: { x: world.performerPos.x, z: world.performerPos.z },
    spire: { x: world.spirePos.x, z: world.spirePos.z },
    wisp: wisp ? { x: wisp.m.position.x, z: wisp.m.position.z } : null,
    job: job ? { x: job.dest.x, z: job.dest.z, name: job.dest.name } : null,
    mission: m ? { title: m.title, desc: m.desc, have: state.missionProg, need: m.need, target: mt } : null,
    route: mt ? routeTo({ x: player.pos.x, z: player.pos.z }, mt) : null,
    npcs: world.questNpcs.filter(n => { const q = sqDef(n.id); return sqOfferable(q) || ["active", "found"].includes(state.sideQuests[q.id]); })
      .map(n => ({ x: n.x, z: n.z })),
    cityNpcs: (world.cityNpcs || []).map(n => {
      const def = cityNpcDef(n.id);
      return { x: n.x, z: n.z, met: !!state.cityNpcs[n.id], name: def?.name || "neighbor" };
    }),
    errand: activeSideQuest() ? { x: sqStep(activeSideQuest()).x, z: sqStep(activeSideQuest()).z } : null,
    discoveries: world.discoveries.filter(dsc => !state.discoveries[dsc.id]).map(dsc => ({ x: dsc.x, z: dsc.z })),
  };
}

function spawnWisp() {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xaaff00, emissive: 0xaaff00, emissiveIntensity: 2.2, transparent: true })
  );
  const a = Math.random() * Math.PI * 2;
  m.position.set(player.pos.x + Math.cos(a) * 18, 1, player.pos.z + Math.sin(a) * 18);
  scene.add(m);
  wisp = { m, life: 18 };
  guideOnce("wispTip", GUIDE.wispTip);
}

function despawnWisp() {
  scene.remove(wisp.m);
  wisp = null;
  wispTimer = 12 + Math.random() * 16;
}

// ---------- interactions ----------
function nearestInteractable() {
  const pp = player.pos;
  if (player.carrying && pp.distanceTo(world.shrinePos) < 5.5) return { type: "shrine" };
  if (pp.distanceTo(world.vendorPos) < 3.5) return { type: "vendor" };
  for (const k of kittens) {
    if (!k.carried && k.mesh.position.distanceTo(pp) < 2.4) return { type: "kitten", k };
  }
  for (const c of caches) {
    if (c.g.position.distanceTo(pp) < 2.6) return { type: "cache", c };
  }
  for (const z of world.ziplines) {
    if (Math.hypot(z.a.x - pp.x, z.a.z - pp.z) < 2.6 && Math.abs(z.a.y - 1.5 - pp.y) < 2) return { type: "zip", z };
  }
  if (!job) {
    for (const b of world.courierBoards) {
      if ((b.x - pp.x) ** 2 + (b.z - pp.z) ** 2 < 7 && pp.y < 2.5) return { type: "board", b };
    }
  }
  for (const n of world.questNpcs) {
    if ((n.x - pp.x) ** 2 + (n.z - pp.z) ** 2 < 6) {
      const q = sqDef(n.id);
      if (sqOfferable(q) || state.sideQuests[q.id] === "active" || state.sideQuests[q.id] === "found") return { type: "questnpc", n };
    }
  }
  for (const n of world.cityNpcs || []) {
    if ((n.x - pp.x) ** 2 + (n.z - pp.z) ** 2 < 8 && pp.y < 2.5) return { type: "citynpc", n };
  }
  if (pp.y < 2.5) {
    for (const v of world.vendings) {
      if (!state.flags["vm_" + v.id] && (v.x - pp.x) ** 2 + (v.z - pp.z) ** 2 < 5.3) return { type: "vending", v };
    }
    for (const ps of world.posters) {
      if (!state.flags["ps_" + ps.id] && (ps.x - pp.x) ** 2 + (ps.z - pp.z) ** 2 < 6.3) return { type: "poster", ps };
    }
    // a passer-by you can scritch for a giggle
    for (const c of world.citizens) {
      if (c.scritchT > 0) continue;
      if ((c.g.position.x - pp.x) ** 2 + (c.g.position.z - pp.z) ** 2 < 4) return { type: "npc", c };
    }
  }
  return null;
}

function updateInteractTip() {
  ui.carryTip(player.carrying ? `carrying ${player.carrying.name} — bring them to the Paw Shrine` : null);
  const n = nearestInteractable();
  if (!n) return ui.interactTip(null);
  if (n.type === "shrine") ui.interactTip("<b>E</b> — deliver kitten to the Paw Shrine");
  else if (n.type === "vendor") ui.interactTip("<b>E</b> — browse Mei's upgrades");
  else if (n.type === "cache") ui.interactTip("<b>E</b> — open the hidden cache");
  else if (n.type === "vending") ui.interactTip("<b>E</b> — tap the vending machine");
  else if (n.type === "poster") ui.interactTip("<b>E</b> — scan the poster");
  else if (n.type === "zip") ui.interactTip("<b>E</b> — ride the zipline (Space to bail)");
  else if (n.type === "board") ui.interactTip("<b>E</b> — take a courier job");
  else if (n.type === "questnpc") {
    const q = sqDef(n.n.id);
    const st = state.sideQuests[q.id];
    ui.interactTip(st === "found" ? `<b>E</b> — turn in ${q.giver}'s errand` : st === "active" ? `<b>E</b> — talk to ${q.giver}` : `<b>E</b> — talk to ${q.giver} (quest!)`);
  }
  else if (n.type === "citynpc") {
    const def = cityNpcDef(n.n.id);
    ui.interactTip(`<b>E</b> — ${state.cityNpcs[n.n.id] ? "chat with" : "talk to"} ${def?.name || "neighbor"}`);
  }
  else if (n.type === "npc") ui.interactTip("<b>E</b> — give them a friendly scritch");
  else ui.interactTip(`<b>E</b> — rescue ${n.k.name} (${n.k.trait})`);
}

export function doInteract() {
  const n = nearestInteractable();
  if (!n) return;
  if (n.type === "zip") {
    player.zip = { zl: n.z, t: 0 };
    player.carryingZip = true;
    sfx.zipline();
    ui.popup("ziiiip!");
    return;
  }
  if (n.type === "board") {
    takeJob(n.b);
    return;
  }
  if (n.type === "questnpc") {
    talkToNpc(n.n);
    return;
  }
  if (n.type === "citynpc") {
    const def = cityNpcDef(n.n.id);
    const firstTalk = !state.cityNpcs[n.n.id];
    state.cityNpcs[n.n.id] = true;
    n.n.marker.visible = false;
    sfx.purr();
    addFlow(1);
    if (firstTalk) {
      earn(12, `${def.name}'s tip`, true);
      gainXp(12);
      gameEvent("citynpc");
      guideOnce("npcTip", GUIDE.npcTip);
    } else {
      ui.popup(`${def.name} waves at PawPaw.`);
    }
    ui.showLore(`${def.name.toUpperCase()} // ${def.topic}`, def.line);
    saveGame();
    return;
  }
  if (n.type === "npc") {
    const c = n.c;
    c.scritchT = 4;
    c.bubbleT = 2.2;
    c.bubble.material.map = scritchBubbleTex();
    c.bubble.material.needsUpdate = true;
    sfx.purr();
    addFlow(1);
    const heart = new THREE.Vector3(c.g.position.x, 2.4, c.g.position.z);
    burst(heart, { count: 10, color: 0xff6ab0, speed: 1.4, life: 0.8, up: 1.4, grav: -1, drag: 2 });
    if (Math.random() < 0.35) { earn(3, "happy citizen tip"); }
    else { gainXp(4); ui.popup(SCRITCH_LINES[(Math.random() * SCRITCH_LINES.length) | 0]); }
    return;
  }
  if (n.type === "kitten" && !player.carrying) {
    n.k.carried = true;
    player.carrying = n.k;
    state.kittens[n.k.id] = "carried";
    sfx.kitten();
    burst(n.k.mesh.position, { count: 12, color: 0xaaff00, speed: 1.6, life: 0.6, up: 1.6, grav: 3, drag: 2 });
    ui.popup(`scooped up ${n.k.name}!`);
  } else if (n.type === "shrine") {
    const k = player.carrying;
    player.carrying = null;
    state.kittens[k.id] = "rescued";
    scene.remove(k.mesh);
    const idx = KITTEN_DEFS.findIndex(d => d.id === k.id);
    addShrineKitten(k, idx);
    const rescued = Object.values(state.kittens).filter(v => v === "rescued").length;
    state.shrineLevel = rescued;
    shrineUpgrade(world, rescued);
    sfx.shrine();
    // shrine celebration: golden fountain of sparks
    const sp = world.shrinePos;
    burst(new THREE.Vector3(sp.x, 2.4, sp.z), { count: 60, color: 0xffe14d, speed: 4, life: 1.6, up: 4, grav: 3, drag: 0.8 });
    burst(new THREE.Vector3(sp.x, 1, sp.z), { count: 30, color: 0xff9fd8, speed: 3, life: 1.4, up: 2.5, grav: 2, drag: 0.8 });
    flash("rgba(255,179,71,0.25)", 1.1);
    earn(40, `${k.name} is home (${rescued}/8)`, true);
    gainXp(60);
    if (rescued >= 8) achieve("kit8");
    missionRescued();
    ui.refreshStats();
  } else if (n.type === "cache") {
    const c = n.c;
    state.flags["cache_" + c.id] = true;
    scene.remove(c.g);
    caches.splice(caches.indexOf(c), 1);
    sfx.unlock();
    burst(c.g.position.clone().add(new THREE.Vector3(0, 1, 0)), { count: 44, color: 0x7b61ff, speed: 3.6, life: 1.3, up: 3, grav: 3, drag: 1 });
    flash("rgba(123,97,255,0.24)", 1);
    earn(75, c.name, true);
    gainXp(80);
    ui.showLore(c.name.toUpperCase(), c.lore);
    achieve("cache1");
    gameEvent("cache");
    const opened = CACHES.filter(x => state.flags["cache_" + x.id]).length;
    if (opened >= CACHES.length) achieve("caches");
  } else if (n.type === "vending") {
    const v = n.v;
    state.flags["vm_" + v.id] = true;
    sfx.vend();
    gameEvent("vending");
    v.front.material.emissiveIntensity = 0.15;
    burst(new THREE.Vector3(v.x, 1, v.z), { count: 10, color: 0xffb347, speed: 1.8, life: 0.6, up: 1.4, grav: 4, drag: 2 });
    if (Math.random() < 0.3) {
      state.buffT = Math.max(state.buffT, 15);
      ui.popup("a snack rolls out! +25% speed for 15s", true);
    } else {
      earn(3 + ((Math.random() * 6) | 0), "loose credits");
    }
    gainXp(4);
  } else if (n.type === "poster") {
    const ps = n.ps;
    state.flags["ps_" + ps.id] = true;
    sfx.scan();
    gameEvent("poster");
    ps.m.material.opacity = 0.55;
    gainXp(10);
    ui.popup("poster scanned (+10 xp)");
    ui.guide(`<b>POSTER //</b> ${POSTERS[ps.idx]}`, 9);
  } else if (n.type === "vendor") {
    ui.openShop(SHOP, buyItem);
  }
}

export function buyItem(item) {
  if (!item.consumable && state.upgrades[item.id]) return false;
  if (state.counts.credits < item.cost) { sfx.deny(); ui.popup("not enough credits"); return false; }
  state.counts.credits -= item.cost;
  sfx.buy();
  achieve("shop1");
  burst(new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z), { count: 14, color: 0xffb347, speed: 2, life: 0.7, up: 1.6, grav: 3, drag: 1.5 });
  if (item.consumable) {
    state.buffT = 90;
    ui.popup("synth-tuna! +25% speed for 90s");
  } else if (item.collar) {
    state.upgrades[item.id] = true;
    state.collar = item.collar;
    setCollarColor(player, item.collar);
    ui.popup(`${item.name} equipped`);
  } else {
    state.upgrades[item.id] = true;
    ui.popup(`${item.name} installed`, true);
  }
  ui.refreshStats();
  saveGame();
  return true;
}

// ---------- save / load ----------
export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
}

export function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      counts: state.counts, abilities: state.abilities, upgrades: state.upgrades,
      collar: state.collar, collected: state.collected, kittens: state.kittens,
      shrineLevel: state.shrineLevel, ach: state.ach, flags: state.flags,
      stats: state.stats, xp: state.xp, level: state.level,
      courierStreak: state.courierStreak, objectives: state.objectives,
      activeJob: state.activeJob,
      missionIdx: state.missionIdx, missionProg: state.missionProg,
      sideQuests: state.sideQuests, sideQuestSteps: state.sideQuestSteps,
      cityNpcs: state.cityNpcs, discoveries: state.discoveries,
      pos: player ? { x: player.pos.x, y: player.pos.y, z: player.pos.z } : null,
    }));
  } catch (e) { /* private mode etc. */ }
}

export function loadGame() {
  let raw = null;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    Object.assign(state.counts, d.counts || {});
    Object.assign(state.abilities, d.abilities || {});
    Object.assign(state.upgrades, d.upgrades || {});
    Object.assign(state.ach, d.ach || {});
    Object.assign(state.flags, d.flags || {});
    Object.assign(state.stats, d.stats || {});
    state.collar = d.collar || state.collar;
    state.collected = d.collected || {};
    state.kittens = d.kittens || {};
    state.shrineLevel = d.shrineLevel || 0;
    state.xp = d.xp || 0;
    state.level = d.level || 1;
    state.courierStreak = d.courierStreak || 0;
    state.activeJob = d.activeJob || null;
    state.objectives = Array.isArray(d.objectives) ? d.objectives : [];
    state.missionIdx = d.missionIdx || 0;
    state.missionProg = d.missionProg || 0;
    state.sideQuests = d.sideQuests || {};
    state.sideQuestSteps = d.sideQuestSteps || {};
    state.cityNpcs = d.cityNpcs || {};
    state.discoveries = d.discoveries || {};
    state.savedPos = d.pos || null;
    return true;
  } catch (e) { return false; }
}
