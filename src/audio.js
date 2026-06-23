// ============ PawPaw-World-3D-v1 — WEBAUDIO ============

let ctx = null, master = null, space = null;

export function initAudio() {
  if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.26;
  master.connect(ctx.destination);

  // gentle master compression so loud stings sit nicely over the bed
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 24; comp.ratio.value = 3;
  master.disconnect(); master.connect(comp); comp.connect(ctx.destination);

  // ---------- "space" send: ping-pong feedback delay = neon-alley reverb ----------
  space = ctx.createGain(); space.gain.value = 0.32;
  const dL = ctx.createDelay(1.0), dR = ctx.createDelay(1.0);
  dL.delayTime.value = 0.26; dR.delayTime.value = 0.37;
  const fb = ctx.createGain(); fb.gain.value = 0.36;
  const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 2600;
  const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  space.connect(dL); dL.connect(dR); dR.connect(fb); fb.connect(dL);
  dL.connect(tone); dR.connect(tone); tone.connect(master);

  startAmbience();
}

// lo-fi cyberpunk lullaby: an evolving chord bed + soft bell melody
const CHORDS = [        // i – VI – III – VII in A minor, low octave (Hz)
  [55.0, 65.4, 82.4],   // Am
  [43.7, 65.4, 87.3],   // F
  [49.0, 61.7, 98.0],   // C/E-ish
  [49.0, 73.4, 98.0],   // G
];
const MELODY = [880, 0, 988, 1047, 0, 784, 880, 0];   // pentatonic-ish, 0 = rest

function startAmbience() {
  // three-voice pad, frequencies retuned per chord
  const padGain = ctx.createGain(); padGain.gain.value = 0.0;
  const padLP = ctx.createBiquadFilter(); padLP.type = "lowpass"; padLP.frequency.value = 520;
  padGain.connect(padLP); padLP.connect(master);
  padGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 4);   // fade the bed in
  const voices = [];
  for (let i = 0; i < 3; i++) {
    const o = ctx.createOscillator();
    o.type = i === 2 ? "triangle" : "sawtooth";
    o.frequency.value = CHORDS[0][i];
    o.detune.value = (i - 1) * 5;
    o.connect(padGain); o.start();
    voices.push(o);
  }
  // slow filter sweep = the city breathing
  const swp = ctx.createOscillator(), swpG = ctx.createGain();
  swp.frequency.value = 0.05; swpG.gain.value = 240;
  swp.connect(swpG); swpG.connect(padLP.frequency); swp.start();

  let chordIdx = 0, step = 0;
  const beat = 1.9;   // seconds per chord
  (function progress() {
    if (!ctx || ctx.state !== "running") { setTimeout(progress, 500); return; }
    const ch = CHORDS[chordIdx % CHORDS.length];
    const t = ctx.currentTime;
    voices.forEach((o, i) => o.frequency.setTargetAtTime(ch[i], t, 0.4));
    // intensity raises the pad's brightness as the player chains flow/fever
    padLP.frequency.setTargetAtTime(420 + intensity * 900, t, 0.6);
    padGain.gain.setTargetAtTime(0.06 + intensity * 0.04, t, 0.6);
    chordIdx++;
    setTimeout(progress, beat * 1000);
  })();

  // soft bell melody — gets louder, faster, and gains a sparkle octave with intensity
  (function melody() {
    if (!ctx) return;
    if (ctx.state === "running") {
      const n = MELODY[step % MELODY.length];
      if (n) {
        blip(n * (step % 16 < 8 ? 1 : 1.5), 0.9, "sine", 0.05 + intensity * 0.06, null, 0.6);
        if (intensity > 0.5) blip(n * 2, 0.4, "triangle", 0.03 * intensity, null, 0.7);   // sparkle
        if (fever) blip(n / 4, 0.5, "sawtooth", 0.05, null, 0.2);                          // fever bass
      }
      step++;
    }
    // fever doubles the tempo into a driving 16th-note feel
    setTimeout(melody, beat * 1000 / (fever ? 4 : 2));
  })();
}

// ---------- reactive music intensity (0..1) + fever flag, driven by gameplay ----------
let intensity = 0, fever = false;
export function setMusicIntensity(x) { intensity = Math.max(0, Math.min(1, x)); }
export function setFever(on) {
  fever = on;
  if (on && ctx && ctx.state === "running") {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => blip(f, 0.3, "square", 0.12, null, 0.5), i * 70));
  }
}

// ---------- reactive ambient layers: rain, traffic, neon buzz ----------
let layers = null;

function noiseBuffer() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function makeLayers() {
  if (layers || !ctx) return;
  const noise = noiseBuffer();
  const mk = (type, freq, q) => {
    const src = ctx.createBufferSource();
    src.buffer = noise; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
    return g;
  };
  layers = {
    rain: mk("highpass", 1800),          // hiss of rain
    traffic: mk("lowpass", 110),         // distant rumble
    buzz: null,
  };
  // neon buzz: detuned saw pair through a bandpass
  const bg = ctx.createGain(); bg.gain.value = 0;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = 120; bp.Q.value = 8;
  for (const det of [0, 7]) {
    const o = ctx.createOscillator();
    o.type = "sawtooth"; o.frequency.value = 60; o.detune.value = det;
    o.connect(bp); o.start();
  }
  bp.connect(bg); bg.connect(master);
  layers.buzz = bg;
}

// targets in 0..1, smoothed — call every frame or so
export function setAmbience({ rain = 0, traffic = 0, buzz = 0 }) {
  if (!ctx || ctx.state !== "running") return;
  makeLayers();
  const t = ctx.currentTime;
  layers.rain.gain.setTargetAtTime(rain * 0.16, t, 0.6);
  layers.traffic.gain.setTargetAtTime(traffic * 0.5, t, 0.8);
  layers.buzz.gain.setTargetAtTime(buzz * 0.04, t, 0.3);
}

function blip(freq, dur, type = "sine", vol = 1, slideTo = null, reverb = 0.18) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master);
  if (reverb && space) { const s = ctx.createGain(); s.gain.value = reverb; g.connect(s); s.connect(space); }
  o.start(t); o.stop(t + dur + 0.02);
}

// short filtered-noise burst — footsteps, soft taps
function noiseBurst(dur, freq, vol, type = "bandpass") {
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 0.8;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.02);
}

export const sfx = {
  kibble:  () => { blip(880, 0.09, "sine", 0.7); blip(1320, 0.12, "sine", 0.4); },
  chip:    () => { blip(520, 0.15, "square", 0.35, 980); blip(1560, 0.2, "sine", 0.3); },
  memory:  () => { blip(392, 0.5, "sine", 0.5, 784); blip(587, 0.6, "sine", 0.3, 1175); },
  jump:    () => blip(300, 0.12, "triangle", 0.4, 520),
  djump:   () => blip(420, 0.14, "triangle", 0.45, 760),
  dash:    () => blip(180, 0.2, "sawtooth", 0.3, 900),
  land:    () => blip(140, 0.08, "triangle", 0.3),
  credit:  () => { blip(988, 0.07, "square", 0.25); setTimeout(() => blip(1319, 0.1, "square", 0.25), 70); },
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.25, "sine", 0.5), i * 90)),
  ach:     () => { blip(660, 0.15, "sine", 0.5); setTimeout(() => blip(990, 0.3, "sine", 0.45), 130); },
  kitten:  () => { blip(1200, 0.12, "sine", 0.5, 1800); setTimeout(() => blip(1400, 0.15, "sine", 0.4, 2000), 140); },
  shrine:  () => [392, 494, 587, 784, 988].forEach((f, i) => setTimeout(() => blip(f, 0.4, "sine", 0.4), i * 110)),
  wisp:    () => blip(1500, 0.25, "sine", 0.4, 600),
  buy:     () => { blip(700, 0.08, "square", 0.3); setTimeout(() => blip(1050, 0.12, "square", 0.3), 80); },
  deny:    () => blip(160, 0.18, "square", 0.3, 110),
  unlock:  () => [440, 554, 659, 880].forEach((f, i) => setTimeout(() => blip(f, 0.3, "triangle", 0.45), i * 100)),
  meow:    () => { blip(620, 0.28, "sawtooth", 0.12, 880); setTimeout(() => blip(840, 0.22, "sawtooth", 0.1, 560), 120); },
  can:     () => { blip(220, 0.08, "square", 0.25, 140); blip(1800, 0.05, "triangle", 0.15); },
  ring:    () => { blip(880, 0.12, "sine", 0.4, 1320); setTimeout(() => blip(1760, 0.18, "sine", 0.25), 90); },
  vend:    () => { blip(330, 0.07, "square", 0.25); setTimeout(() => blip(494, 0.07, "square", 0.25), 90); setTimeout(() => blip(659, 0.14, "square", 0.3), 180); },
  scan:    () => blip(1200, 0.16, "sine", 0.3, 2000),
  spark:   () => { for (let i = 0; i < 4; i++) setTimeout(() => blip(2400 + Math.random() * 2400, 0.04, "square", 0.16), i * 45); },
  whoosh:  () => blip(140, 0.7, "sawtooth", 0.14, 60),
  zipline: () => blip(700, 0.5, "sawtooth", 0.12, 1400),
  zipend:  () => blip(900, 0.2, "triangle", 0.3, 400),
  purr:    () => { for (let i = 0; i < 6; i++) setTimeout(() => blip(52, 0.12, "sawtooth", 0.1, 48), i * 130); },
  flap:    () => { for (let i = 0; i < 3; i++) setTimeout(() => noiseBurst(0.06, 900, 0.12), i * 80); },
  stretch: () => blip(440, 0.4, "sine", 0.12, 660),
  foot:    () => noiseBurst(0.05, 380 + Math.random() * 120, 0.06, "lowpass"),
  boop:    () => { blip(1400, 0.06, "sine", 0.4, 2000); blip(700, 0.05, "triangle", 0.2); },
  // cinematic opening sting: rising arpeggio that blooms into the title chord
  title:   () => {
    [261, 329, 392, 523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, 0.5, "sine", 0.32, null, 0.5), i * 95));
    setTimeout(() => { [523, 659, 784, 1047].forEach(f => blip(f, 1.8, "triangle", 0.16, null, 0.7)); blip(130, 2.2, "sawtooth", 0.12, null, 0.3); }, 640);
  },
};
