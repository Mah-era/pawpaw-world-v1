// ============ PAWPAW WORLD 3D — BOOT, INPUT & LOOP ============
import * as THREE from "three";
import { CFG, GUIDE, state, keys } from "./data.js";
import { buildWorld, updateWorld, setRendererCaps } from "./world.js";
import { createPlayer, updatePlayer, updateCamera, applyLook, setCollarColor } from "./player.js";
import * as game from "./game.js";
import * as ui from "./ui.js";
import { initAudio, sfx } from "./audio.js";
import { initFx, updateFx, updateFlash, updateFloaters } from "./fx.js";
import { EffectComposer } from "../vendor/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "../vendor/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "../vendor/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "../vendor/jsm/postprocessing/OutputPass.js";

// ---------- renderer / scene / camera ----------
const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.set(46, 4, 46);

// image-based lighting: bake a tiny "neon room" into an env map so every
// PBR material picks up colored reflections (wet ground, metal, windows)
{
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0a0805);
  const panel = (color, intensity, x, y, z, w, h, ry = 0) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity) })
    );
    m.position.set(x, y, z);
    m.rotation.y = ry;
    envScene.add(m);
  };
  panel(0xff2bd6, 3.5, -6, 3, 0, 4, 6, Math.PI / 2);    // magenta wall
  panel(0x00f0ff, 3.0, 6, 3, 0, 4, 6, -Math.PI / 2);    // cyan wall
  panel(0xffb347, 4.0, 0, 2, -7, 7, 3);                 // amber storefront glow
  panel(0x7b61ff, 2.0, 0, 2.5, 7, 6, 3, Math.PI);       // violet back
  panel(0xfff3dd, 1.4, 0, 8, 0, 10, 10);                // pale skylight
  const floorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0x33220f).multiplyScalar(1.5) })
  );
  floorGlow.rotation.x = -Math.PI / 2;
  envScene.add(floorGlow);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.06).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();
}

// post: real bloom — the neon city finally glows
// (MSAA render target: without samples the composer bypasses canvas AA → jaggies)
const composerRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, composerRT);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.26, 0.45, 0.88);
composer.addPass(bloom);
composer.addPass(new OutputPass());

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- world & player ----------
initFx(scene);                  // before buildWorld: the city registers ambient emitters
setRendererCaps(renderer);
const world = buildWorld(scene);
const player = createPlayer(scene);
player.yaw = 0.6;               // opening shot: face the glowing shrine + kibble trail

// collectible placement waits for the START NEW / RESUME choice,
// because it depends on which save (if any) gets loaded
const hadSave = game.hasSave();
document.getElementById("save-note").textContent = hadSave
  ? "◉ SAVE FOUND — your city remembers you"
  : "◉ NEW WANDER — progress saves automatically";
if (hadSave) {
  document.getElementById("btn-resume").classList.remove("hidden");
} else {
  document.getElementById("btn-new").classList.add("solo");   // primary style when it's the only button
}

// ---------- pointer lock (mouse-look) ----------
function lockPointer() {
  if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
}

document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  if (!state.started) return;
  if (locked) {
    state.paused = false;
    document.getElementById("pause-screen").classList.add("hidden");
  } else if (!state.modal) {
    state.paused = true;
    document.getElementById("pause-screen").classList.remove("hidden");
  }
});

document.addEventListener("mousemove", e => {
  if (document.pointerLockElement === canvas && state.started && !state.modal) {
    applyLook(player, e.movementX, e.movementY);
  }
});

canvas.addEventListener("click", () => {
  if (state.started && !state.modal) lockPointer();
});

// zoom: mouse wheel OR two-finger touchpad scroll OR pinch (ctrl+wheel)
window.addEventListener("wheel", e => {
  if (!state.started || state.modal) return;
  e.preventDefault();
  const k = e.ctrlKey ? 0.012 : 0.0016;     // pinch is coarser than scroll
  player.zoom = Math.max(0.45, Math.min(2.6, player.zoom + e.deltaY * k));
}, { passive: false });

// ---------- keyboard ----------
const keyMap = {
  KeyW: "fwd", ArrowUp: "fwd",
  KeyS: "back", ArrowDown: "back",
  KeyA: "left", ArrowLeft: "left",
  KeyD: "right", ArrowRight: "right",
  ShiftLeft: "sprint", ShiftRight: "sprint",
  Space: "jump",
  KeyX: "dash", KeyK: "dash",
};

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
  const k = keyMap[e.code];
  if (k && !e.repeat) {
    if (k === "jump") keys.jumpP = true;
    if (k === "dash") keys.dashP = true;
  }
  if (k) keys[k] = true;
  if (e.repeat || !state.started) return;

  if (state.modal) {
    if (e.code === "KeyE" || e.code === "Enter" || e.code === "Escape" ||
        (e.code === "KeyJ" && state.modal === "journal") ||
        (e.code === "KeyM" && state.modal === "map")) {
      ui.closeModal();
      lockPointer();
    }
    return;
  }
  if (e.code === "KeyE") game.doInteract();
  if (e.code === "KeyF") game.meow();
  if (e.code === "KeyJ") { ui.openJournal(); document.exitPointerLock(); }
  if (e.code === "KeyM") ui.openMap(game.getMapData());
});

window.addEventListener("keyup", e => {
  const k = keyMap[e.code];
  if (k) keys[k] = false;
});

window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

// shop/lore modals release the mouse so buttons are clickable;
// clicking the dim background closes them again
document.getElementById("modal").addEventListener("click", e => {
  if (e.target.id === "modal") { ui.closeModal(); lockPointer(); }
});

// ---------- start new / resume ----------
function startGame(resumed) {
  initAudio();
  sfx.title();                    // cinematic opening sting on the first user gesture
  document.getElementById("title-screen").style.display = "none";
  document.getElementById("hud").classList.remove("hidden");
  state.started = true;
  state.paused = false;
  player.camIntro = 1;          // glide down from the title orbit shot
  ui.refreshStats();
  lockPointer();
  setTimeout(() => {
    if (!resumed) ui.guide(GUIDE.intro, 12);
    else game.earn(25, "welcome back, PawPaw");
  }, 1000);
}

document.getElementById("btn-new").addEventListener("click", () => {
  game.clearSave();
  game.initGame(scene, world, player);
  startGame(false);
});

document.getElementById("btn-resume").addEventListener("click", () => {
  game.loadGame();
  if (state.savedPos) player.pos.set(state.savedPos.x, state.savedPos.y, state.savedPos.z);
  setCollarColor(player, state.collar);
  game.initGame(scene, world, player);
  startGame(true);
});

document.getElementById("btn-unpause").addEventListener("click", () => {
  document.getElementById("pause-screen").classList.add("hidden");
  lockPointer();
});

// rotating title taglines — gives the opening screen life before you click
{
  const TAGS = [
    "a cyber-cat in a neon city",
    "every rooftop is yours to claim",
    "deliver, dash, scratch, explore",
    "follow the gold beam · chase the wisps",
    "177 things to find · one curious cat",
    "the rain doubles the neon in the puddles",
  ];
  const tagEl = document.getElementById("title-tag");
  let ti = 0;
  setInterval(() => {
    if (state.started || !tagEl) return;
    ti = (ti + 1) % TAGS.length;
    tagEl.style.opacity = "0";
    setTimeout(() => { tagEl.textContent = TAGS[ti]; tagEl.style.opacity = "0.75"; }, 400);
  }, 3600);
}

// ---------- loop ----------
let last = performance.now();
let dayT = 0.12;            // start just before dawn — peak neon hours
let saveT = 0;

function loop(now) {
  requestAnimationFrame(loop);
  step(now);
}

// keep simulating when the tab is hidden (rAF stops firing there)
setInterval(() => { if (document.hidden) step(performance.now()); }, 33);

function step(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt <= 0) return;
  if (dt > 0.05) dt = 0.05;

  dayT = (dayT + dt / CFG.DAY_LENGTH) % 1;

  const playing = state.started && !state.paused && !state.modal;
  if (playing) {
    updatePlayer(player, dt, world, game.onPlayerEvent);
    game.updateGame(dt, dayT);
    saveT += dt;
    if (saveT > 8) { saveT = 0; game.saveGame(); }
  }
  updateWorld(world, scene, dt, dayT, player.pos);
  updateFx(dt);
  updateFloaters(dt);
  updateFlash(dt);
  if (!state.started) {
    // cinematic title orbit around the shrine plaza
    orbitA += dt * 0.07;
    const sp = world.shrinePos;
    camera.position.set(
      sp.x + Math.cos(orbitA) * 34,
      13 + Math.sin(orbitA * 2.3) * 4,
      sp.z + Math.sin(orbitA) * 34
    );
    camera.lookAt(sp.x, 4, sp.z);
  } else {
    updateCamera(player, camera, world, dt);
  }
  composer.render();
}
let orbitA = 0.4;
requestAnimationFrame(loop);

window.addEventListener("beforeunload", () => { if (state.started) game.saveGame(); });

// debug handle for automated smoke tests
window.__PAW = { state, player, world, camera, renderer, scene, composer, game };
