// ============ PAWPAW WORLD — TIME / WEATHER / EVENTS / AUDIO ============
"use strict";

G.time = { t: 0.88, hours: 21, light: 0 }; // start in the evening
G.weather = { cur: "clear", next: null, blend: 1, timer: 50, rainAmt: 0, fog: 0.08, wet: 0.3, flash: 0, windT: 0 };
G.events = { list: [], timer: 14 };

const WEATHER_DEFS = {
  clear:     { rain: 0,    fog: 0.05, label: "CLEAR" },
  lightRain: { rain: 0.35, fog: 0.15, label: "LIGHT RAIN" },
  heavyRain: { rain: 1,    fog: 0.25, label: "HEAVY RAIN" },
  fog:       { rain: 0,    fog: 0.62, label: "FOG" },
  storm:     { rain: 1,    fog: 0.35, label: "STORM" },
};

G.initSystems = function () {};

G.updateSystems = function (dt) {
  // ---------- day/night ----------
  const T = G.time;
  T.t = (T.t + dt / G.CFG.DAY_LENGTH) % 1;
  T.hours = T.t * 24;
  // light: 0 at midnight, 1 at noon (smooth)
  T.light = Math.max(0, Math.min(1, (Math.cos((T.t - 0.5) * Math.PI * 2) + 1) / 2 * 1.25 - 0.1));

  // ---------- weather ----------
  const W = G.weather;
  W.timer -= dt; W.windT += dt;
  if (W.timer <= 0 && !W.next) {
    const pool = ["clear", "clear", "lightRain", "heavyRain", "fog", "storm"];
    let n = pool[Math.floor(Math.random() * pool.length)];
    if (n === W.cur) n = "clear" === n ? "lightRain" : "clear";
    W.next = n; W.blend = 0;
    if ((n === "heavyRain" || n === "storm") && !G.state.flags.rainTip) { G.state.flags.rainTip = 1; G.ui.guide(G.GUIDE.rain); }
  }
  if (W.next) {
    W.blend += dt / 6;
    if (W.blend >= 1) { W.cur = W.next; W.next = null; W.blend = 1; W.timer = 40 + Math.random() * 55; }
  }
  const a = WEATHER_DEFS[W.cur], b = WEATHER_DEFS[W.next || W.cur], bl = W.next ? W.blend : 1;
  W.rainAmt = a.rain + (b.rain - a.rain) * bl;
  W.fog = a.fog + (b.fog - a.fog) * bl;
  W.wet = Math.min(1, Math.max(0.12, W.wet + (W.rainAmt > 0.2 ? dt * 0.2 : -dt * 0.012)));
  W.flash = Math.max(0, W.flash - dt * 2.2);
  if (W.cur === "storm" && Math.random() < dt * 0.18) {
    W.flash = 0.55 + Math.random() * 0.45;
    G.audio.thunder();
  }

  // ---------- dynamic world events ----------
  const E = G.events;
  E.timer -= dt;
  E.list = E.list.filter(e => (e.t += dt) < e.dur);
  if (E.timer <= 0 && G.state.started) {
    E.timer = 26 + Math.random() * 26;
    spawnEvent();
  }

  G.audio.update(dt);
};

function spawnEvent() {
  const types = ["glitch", "outage", "dronefail", "performance", "sweep", "ghosttrain"];
  const type = types[Math.floor(Math.random() * types.length)];
  const e = { type, t: 0, dur: 10 };
  switch (type) {
    case "glitch":
      e.dur = 5;
      G.ui.notify("⚠ HOLOGRAM GRID GLITCHING", "pink");
      break;
    case "outage": {
      const zones = [[2700, 6400, "Market"], [7460, 10560, "Corporate"], [60, 2520, "Alley"], [10700, 12500, "Docks"]];
      const z = zones[Math.floor(Math.random() * zones.length)];
      e.x1 = z[0]; e.x2 = z[1]; e.dur = 9;
      G.ui.notify("⚠ POWER OUTAGE — " + z[2] + " grid down", "pink");
      break;
    }
    case "dronefail": {
      const cands = G.drones.filter(d => d.type === "cargo" && !d.failing && d.dead <= 0);
      if (!cands.length) return;
      const d = cands[Math.floor(Math.random() * cands.length)];
      d.failing = 0.01; e.dur = 6;
      G.ui.notify("⚠ CARGO DRONE MALFUNCTION", "pink");
      break;
    }
    case "performance": {
      e.x = 4080; e.dur = 22;
      for (const n of G.npcs) if (!n.fixed && Math.abs(n.x - e.x) < 1200 && n.y === G.CFG.STREET_Y) n.gatherX = e.x + (Math.random() * 240 - 120);
      setTimeout(() => { for (const n of G.npcs) n.gatherX = null; }, 22000);
      G.ui.notify("♪ STREET PERFORMANCE — Noodle Row", "gold");
      break;
    }
    case "sweep":
      e.dur = 12; e.x = 7460 + Math.random() * 2800;
      G.ui.notify("⚠ SECURITY SWEEP — Corporate Sector", "pink");
      break;
    case "ghosttrain":
      e.dur = 7; e.x = -400;
      G.ui.notify("● LINE 9 — train approaching. Nobody is driving.", "");
      G.audio.rumble();
      break;
  }
  G.events.list.push(e);
}

G.eventActive = t => G.events.list.find(e => e.type === t);

// ============================ AUDIO ============================
G.audio = {
  ctx: null, master: null, ready: false,
  pad: null, padGain: null, filt: null, rainGain: null, windGain: null, humGain: null,
  noteT: 0, chordT: 0, chordRoot: 110,

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.55; this.master.connect(c.destination);

    // --- pad: two detuned saws -> lowpass ---
    this.filt = c.createBiquadFilter(); this.filt.type = "lowpass"; this.filt.frequency.value = 420; this.filt.Q.value = 1.2;
    this.padGain = c.createGain(); this.padGain.gain.value = 0.05;
    this.filt.connect(this.padGain); this.padGain.connect(this.master);
    this.oscA = c.createOscillator(); this.oscA.type = "sawtooth"; this.oscA.frequency.value = 110;
    this.oscB = c.createOscillator(); this.oscB.type = "sawtooth"; this.oscB.frequency.value = 110.7;
    this.oscC = c.createOscillator(); this.oscC.type = "triangle"; this.oscC.frequency.value = 165;
    [this.oscA, this.oscB, this.oscC].forEach(o => { o.connect(this.filt); o.start(); });

    // --- noise buffer (rain / wind / thunder) ---
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const mkNoise = (type, freq, q) => {
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.8;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.master); src.start();
      return g;
    };
    this.rainGain = mkNoise("bandpass", 1600, 0.5);
    this.windGain = mkNoise("bandpass", 420, 0.6);

    // --- city hum ---
    const hum = c.createOscillator(); hum.type = "sine"; hum.frequency.value = 54;
    this.humGain = c.createGain(); this.humGain.gain.value = 0.014;
    hum.connect(this.humGain); this.humGain.connect(this.master); hum.start();

    this.ready = true;
  },

  // musical scale per zone mood
  scale(mood) {
    const scales = {
      busy:  [220, 261.6, 293.7, 329.6, 392, 440, 523.3],
      calm:  [220, 246.9, 293.7, 329.6, 370, 440],
      dark:  [196, 233.1, 261.6, 311.1, 349.2],
      clean: [261.6, 329.6, 392, 493.9, 523.3],
      deep:  [110, 130.8, 164.8, 196],
    };
    return scales[mood] || scales.busy;
  },

  update(dt) {
    if (!this.ready || !G.state.started) return;
    const zone = G.ZONES[G.zoneAt(G.player.x, G.player.y)];
    const mood = zone.music;
    // pad chord drift
    this.chordT -= dt;
    if (this.chordT <= 0) {
      this.chordT = 7 + Math.random() * 5;
      const roots = { busy: [110, 130.8, 98], calm: [98, 110, 87.3], dark: [82.4, 98, 73.4], clean: [130.8, 146.8, 110], deep: [55, 65.4, 49] };
      const r = roots[mood][Math.floor(Math.random() * 3)];
      const tNow = this.ctx.currentTime;
      this.oscA.frequency.linearRampToValueAtTime(r, tNow + 3);
      this.oscB.frequency.linearRampToValueAtTime(r * 1.007, tNow + 3);
      this.oscC.frequency.linearRampToValueAtTime(r * (Math.random() < 0.5 ? 1.5 : 1.2), tNow + 3);
    }
    // filter mood (fever opens it wide up)
    const fever = G.fever && G.fever();
    const targetF = (mood === "deep" ? 240 : mood === "dark" ? 340 : mood === "calm" ? 520 : 640) + (fever ? 420 : 0);
    this.filt.frequency.value += (targetF + Math.sin(performance.now() / 4000) * 90 - this.filt.frequency.value) * dt;
    // arpeggio plucks (fever doubles the pulse)
    this.noteT -= dt;
    const rate = { busy: 0.32, calm: 0.9, dark: 1.4, clean: 0.5, deep: 2.2 }[mood] * (fever ? 0.45 : 1);
    if (this.noteT <= 0) {
      this.noteT = rate * (0.7 + Math.random() * 0.8);
      if (Math.random() < 0.75) {
        const sc = this.scale(mood);
        this.pluck(sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.25 ? 2 : 1), mood === "deep" ? 0.05 : 0.035);
      }
    }
    // rain / wind / hum levels
    const roof = G.zoneAt(G.player.x, G.player.y) === "rooftops";
    const under = G.player.y > G.CFG.STREET_Y + 90;
    this.rainGain.gain.value += ((under ? 0.008 : G.weather.rainAmt * 0.075) - this.rainGain.gain.value) * dt * 2;
    this.windGain.gain.value += ((roof ? 0.05 : 0.008) - this.windGain.gain.value) * dt * 1.5;
    this.humGain.gain.value = under ? 0.03 : 0.014;
  },

  env(freq, type, dur, vol, slide) {
    if (!this.ready) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  pluck(f, v) { this.env(f, "triangle", 0.5, v || 0.04); },
  blip(f) { this.env(f, "square", 0.09, 0.025, f * 1.4); },
  ping() { this.env(880, "sine", 0.4, 0.06, 1320); },
  chime() { this.env(660, "sine", 0.5, 0.06, 990); setTimeout(() => this.env(990, "sine", 0.6, 0.05, 1480), 90); },
  dash() { this.env(300, "sawtooth", 0.18, 0.05, 900); },
  coin() { this.env(990, "square", 0.07, 0.03); setTimeout(() => this.env(1320, "square", 0.12, 0.03), 60); },
  mew(v) { this.env(620 + Math.random() * 160, "sine", 0.28, (v || 0.35) * 0.12, 880 + Math.random() * 200); },
  zap() { this.env(1400, "sawtooth", 0.2, 0.06, 200); },
  fanfare() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.env(f, "triangle", 0.4, 0.05), i * 110)); },
  land() { this.burstNoise(0.12, 300, 0.08); },
  thud() { this.burstNoise(0.3, 150, 0.12); },
  thunder() { this.burstNoise(1.6, 90, 0.22); },
  rumble() { this.burstNoise(2.4, 60, 0.1); },
  burstNoise(dur, freq, vol) {
    if (!this.ready) return;
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
    const g = c.createGain(); const t = c.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  },
};
