// ============ PAWPAW WORLD — PROGRESSION (FLOW / ECONOMY / QUESTS / TOYS) ============
"use strict";

// ================= CREDITS =================
G.earn = function (amount, why) {
  if (why && why.toLowerCase().includes("flow") && (G.state.upgrades.econFlow || G.state.skills.econ_flow)) amount = Math.round(amount * 1.25);
  G.state.counts.credits += amount;
  G.state.stats.credEarned += amount;
  G.audio.coin();
  if (why) G.ui.notify("+" + amount + "¢ — " + why, "gold");
};

G.awardMystery = function (id, label, rare) {
  if (id && G.state.hiddenRewards[id]) return false;
  if (id) G.state.hiddenRewards[id] = true;
  if (rare) G.state.counts.badges = (G.state.counts.badges || 0) + 1;
  G.earn(rare ? 90 : 35, label || "mystery reward");
  if (G.gainXP) G.gainXP(rare ? 70 : 30);
  G.ui.notify("◇ MYSTERY REWARD — " + (label || "city cache"), rare ? "ach" : "gold");
  if (G.fx) G.fx.burst(G.player.x, G.player.y - 25, rare ? "#ffffff" : "#ffe14d", rare ? 34 : 20);
  G.audio.fanfare();
  G.saveGame();
  return true;
};

// ================= FLOW COMBO =================
G.flow = {
  combo: 0, pts: 0, t: 0, MAX_T: 4,
  add(type, base) {
    if (G.state.modal || G.races.active) return; // races score themselves
    this.combo++; this.t = this.MAX_T;
    const mult = 1 + Math.floor(this.combo / 5) * 0.5;
    this.pts += Math.round(base * mult);
    if (this.combo > G.state.stats.maxCombo) G.state.stats.maxCombo = this.combo;
    if (this.combo === 4 && !G.state.flags.flowTip) { G.state.flags.flowTip = 1; G.ui.guide(G.GUIDE.flowTip, 8); }
    G.ach.unlockIf("combo10", this.combo >= 10);
    G.ach.unlockIf("combo25", this.combo >= 25);
  },
  feed() { if (this.combo > 0) this.t = Math.min(this.MAX_T, this.t + 1.2); }, // kibble extends
  update(dt) {
    if (this.combo === 0) return;
    // grounded and idle drains fast, airborne/moving drains normal
    const p = G.player;
    const idle = p.onGround && Math.abs(p.vx) < 40 && !p.climbing && !p.zip;
    this.t -= dt * (idle ? 2.2 : 1);
    if (this.t <= 0) this.cash();
  },
  cash() {
    if (this.combo >= 3) {
      const pay = Math.max(1, Math.round(this.pts / 10));
      G.earn(pay, "FLOW x" + this.combo);
    }
    this.combo = 0; this.pts = 0; this.t = 0;
  },
};

// ================= ACHIEVEMENTS =================
G.ach = {
  unlock(id) {
    if (G.state.ach[id]) return;
    const def = G.ACH.find(a => a[0] === id);
    if (!def) return;
    G.state.ach[id] = true;
    G.ui.notifyAch(def[1], def[2]);
    G.audio.fanfare();
    G.saveGame();
  },
  unlockIf(id, cond) { if (cond) this.unlock(id); },
  // periodic counter checks
  scan() {
    const s = G.state, c = s.counts, st = s.stats;
    this.unlockIf("kib1", c.food >= 1); this.unlockIf("kib50", c.food >= 50); this.unlockIf("kib140", c.food >= 140);
    this.unlockIf("chips", c.chip >= 18); this.unlockIf("mems", c.mem >= 10);
    this.unlockIf("arts", c.art >= 5); this.unlockIf("legs", c.leg >= 2);
    this.unlockIf("lands", Object.keys(s.discovered).length >= G.world.landmarks.length);
    this.unlockIf("tps", Object.keys(s.tpUnlocked).length >= G.world.teleports.length);
    this.unlockIf("photos", G.photoTargets.every(t => t.got));
    this.unlockIf("jobs10", st.jobs >= 10);
    this.unlockIf("zip25", st.zips >= 25); this.unlockIf("wall50", st.walljumps >= 50);
    this.unlockIf("dist10", st.dist >= 400000); // 40px ≈ 1m
    this.unlockIf("cred1k", st.credEarned >= 1000);
    this.unlockIf("wisp5", st.wisps >= 5);
    this.unlockIf("kit8", Object.keys(s.kittens).length >= 8);
    const golds = G.races.list.filter(r => r.medal === 3).length;
    this.unlockIf("race1g", golds >= 1); this.unlockIf("race3g", golds >= 3);
    this.unlockIf("quests", G.QUESTS.every(q => s.quests[q.id] === 99));
    const perm = G.SHOP.filter(i => !i.consumable && !i.collar);
    this.unlockIf("chromed", perm.every(i => s.upgrades[i.id]));
    this.unlockIf("nap", G.player.idleT > 22 && G.zoneAt(G.player.x, G.player.y) === "rooftops");
  },
};

// ================= SHOP =================
G.buyItem = function (item) {
  const s = G.state;
  if (!item.consumable && !item.collar && s.upgrades[item.id]) return false;
  if (item.collar && s.upgrades[item.id]) { s.style.collar = item.collar; G.ui.notify("Collar equipped", ""); return true; }
  const cost = Math.max(1, Math.round(item.cost * (s.upgrades.discount || s.skills.econ_vendor ? 0.85 : 1)));
  if (s.counts.credits < cost) { G.audio.blip(140); return false; }
  s.counts.credits -= cost;
  G.ach.unlock("shop1");
  if (item.consumable) { s.buffT = 90; G.ui.notify("⚡ SYNTH-TUNA RUSH — 90s of speed", "gold"); }
  else {
    s.upgrades[item.id] = true;
    if (item.collar) s.style.collar = item.collar;
    if (item.id === "trail") s.style.trail = true;
    if (item.styleKey) { s.style[item.styleKey] = item.styleVal; s.cosmetics[item.id] = true; }
    if (item.shrineDecor) s.shrine.decor[item.shrineDecor] = true;
    if (item.id === "glide") { document.getElementById("ab-glide").classList.remove("hidden", "locked"); }
    G.ui.notify("⬢ INSTALLED — " + item.name, "gold");
  }
  G.audio.chime(); G.saveGame();
  return true;
};

// ================= COURIER BOARD =================
G.board = { active: null };

G.acceptBoardJob = function () {
  const spots = G.BOARD_SPOTS, p = G.player;
  let a, b, guard = 0;
  do {
    a = spots[Math.floor(Math.random() * spots.length)];
    b = spots[Math.floor(Math.random() * spots.length)];
  } while ((a === b || Math.hypot(a[1] - b[1], a[2] - b[2]) < 2000) && ++guard < 40);
  const total = Math.hypot(a[1] - p.x, a[2] - p.y) + Math.hypot(b[1] - a[1], b[2] - a[2]);
  const limit = Math.round(total / 300 + 24);
  const rush = G.rushActive && G.rushActive();
  const econ = (G.state.upgrades.econCourier || G.state.skills.econ_courier) ? 1.2 : 1;
  const pay = Math.round((30 + Math.min(8, G.state.boardStreak) * 10) * (rush ? 2 : 1) * econ);
  const distLabel = total > 3900 ? "LONG" : total > 2700 ? "MEDIUM" : "QUICK";
  G.board.active = { pickup: a, drop: b, t: limit, pay, carrying: false, perfect: true, label: distLabel };
  G.ui.objective("PICK UP @ " + a[0]);
  G.ui.notify("📦 " + distLabel + " JOB — " + a[0] + " → " + b[0] + "  (" + pay + "¢" + (rush ? " RUSH×2" : "") + ", streak " + G.state.boardStreak + ")", "");
  G.audio.blip(620);
};

function updateBoard(dt) {
  const j = G.board.active;
  if (!j) return;
  j.t -= dt;
  const p = G.player;
  if (!j.carrying && Math.hypot(j.pickup[1] - p.x, j.pickup[2] - p.y) < 75) {
    j.carrying = true;
    G.ui.objective("DELIVER @ " + j.drop[0]);
    G.audio.blip(740);
  }
  if (j.carrying && Math.hypot(j.drop[1] - p.x, j.drop[2] - p.y) < 75) {
    G.board.active = null;
    G.state.boardStreak++; G.state.stats.jobs++;
    G.state.stats.bestCourierStreak = Math.max(G.state.stats.bestCourierStreak || 0, G.state.boardStreak);
    if (j.t > 8) { G.state.stats.perfectJobs = (G.state.stats.perfectJobs || 0) + 1; G.earn(10, "perfect delivery bonus"); }
    G.earn(j.pay, "courier streak " + G.state.boardStreak);
    G.ui.objective(null);
    G.saveGame();
    return;
  }
  if (j.t <= 0) {
    G.board.active = null;
    if ((G.state.upgrades.econ_streak || G.state.skills.econ_streak) && !G.state.courierShield) {
      G.state.courierShield = true;
      G.ui.notify("STREAK PROTECTED — one soft miss ignored", "gold");
    } else {
      G.state.boardStreak = 0; G.state.courierShield = false;
      G.ui.notify("JOB EXPIRED — no penalty beyond streak reset", "pink");
    }
    G.ui.objective(null);
  }
}

// ================= QUESTS =================
G.questState = id => G.state.quests[id]; // undefined | step | 99

G.talkTo = function (npcName) {
  const err = G.NPC_ERRANDS.find(e => e.giver === npcName);
  if (err && G.handleErrand(err)) return;
  if (npcName === "Static Quartet") {
    G.ui.startRhythm(() => {
      G.state.miniGames.rhythm = true;
      G.earn(45, "street rhythm set");
      if (G.gainXP) G.gainXP(45);
      G.awardMystery("rhythm-first", "neon music badge", true);
      G.saveGame();
    });
    return;
  }
  const q = G.QUESTS.find(q => q.giver === npcName);
  const s = G.state;
  if (q) {
    const st = s.quests[q.id];
    if (st === undefined) {
      s.quests[q.id] = 0;
      G.ui.dialog(q.name + " — " + q.giver, q.offer + "\n\n▶ " + q.steps[0].text);
      G.ui.notify("◆ QUEST STARTED — " + q.name, "gold");
      G.saveGame();
      return;
    }
    if (st !== 99 && q.steps[st] && q.steps[st].type === "return") {
      s.quests[q.id] = 99;
      G.ui.dialog(q.name + " — COMPLETE", q.done);
      G.earn(q.reward, q.name);
      G.audio.fanfare();
      G.saveGame();
      return;
    }
    if (st === 99) { G.ui.dialog(q.giver, flavor(npcName)); return; }
    G.ui.dialog(q.name + " — IN PROGRESS", "▶ " + q.steps[st].text);
    return;
  }
  G.ui.dialog(npcName, flavor(npcName));
};

G.handleErrand = function (err) {
  const s = G.state, st = s.npcHelp[err.id];
  if (st === 99) {
    G.ui.dialog(err.name + " — " + err.giver, err.done + "\n\nThey remember PawPaw helped.");
    return true;
  }
  if (!st) {
    s.npcHelp[err.id] = 1;
    G.ui.dialog(err.name + " — " + err.giver, err.offer + "\n\nReturn when it is done.");
    G.ui.notify("NPC HELP STARTED — " + err.name, "gold");
    G.saveGame();
    return true;
  }
  if (!errandReady(err)) {
    G.ui.dialog(err.name + " — IN PROGRESS", err.offer);
    return true;
  }
  s.npcHelp[err.id] = 99;
  G.earn(err.reward, err.name);
  if (G.gainXP) G.gainXP(45);
  G.awardMystery("npc-" + err.id, "NPC gift item", false);
  G.ui.dialog(err.name + " — COMPLETE", err.done);
  G.audio.fanfare();
  G.saveGame();
  return true;
};

function errandReady(err) {
  const p = G.player;
  if (err.type === "reach" || err.type === "guide") return Math.hypot(err.x - p.x, err.y - p.y) < err.r;
  if (err.type === "terminal") { const t = G.terminals.find(x => x.id === err.terminal); return t && t.hacked; }
  if (err.type === "food") return G.state.counts.food >= err.n;
  if (err.type === "chip") return G.state.counts.chip >= err.n;
  if (err.type === "photo") return G.photoTargets.filter(t => t.got).length >= err.n;
  return false;
}

function flavor(name) {
  const lines = {
    "Ms. Vance": "Ms. Vance: The view from the 40th floor is billable hours. The view from the rooftops is free. Don't tell my department which one I prefer.",
    "Patch": "Patch: Stay off Corporate cameras, stay on Corporate rooftops. That's the whole philosophy.",
    "Solder": "Solder: I once pinged the ghost train's transponder. It pinged back '…thanks'. I don't open that terminal anymore.",
    "Vega": "Vega: Plants don't care about the Collapse. They just want light and someone to talk to. Same as everyone.",
    "Greasy Jin": "Jin: Anything with wheels, wings, or rotors — I can fix it. Anything with feelings, you're on your own.",
    "Static Quartet": "Static Quartet: We only play for cats and drones now. Best audience in the city. No phones.",
  };
  return lines[name] || "...";
}

function updateQuests(dt) {
  const p = G.player, s = G.state;
  for (const q of G.QUESTS) {
    const st = s.quests[q.id];
    if (st === undefined || st === 99) continue;
    const step = q.steps[st];
    if (!step) continue;
    let done = false;
    if (step.type === "reach" && Math.hypot(step.x - p.x, step.y - p.y) < step.r) done = true;
    if (step.type === "hack") { const t = G.terminals.find(t => t.id === step.id); done = t && t.hacked; }
    if (step.type === "seed" && Math.hypot(step.x - p.x, step.y - p.y) < 70) done = true;
    if (step.type === "witness") {
      const e = G.eventActive("ghosttrain");
      if (e) {
        const trainX = -500 + (e.t / e.dur) * (G.CFG.WORLD_W + 1200);
        if (p.y > G.CFG.STREET_Y + 90 && Math.abs(trainX - p.x) < 600) done = true;
      } else if (p.y > G.CFG.STREET_Y + 90 && Math.random() < dt * 0.06) {
        // the line never keeps a believer waiting long
        G.events.list.push({ type: "ghosttrain", t: 0, dur: 7, x: -400 });
        G.audio.rumble();
      }
    }
    if (step.type === "collect") {
      const it = G.items.find(i => i.type === "art" && i.lore === G.ARTIFACT_LORE[step.loreIdx]);
      done = it && it.taken;
    }
    if (done) {
      s.quests[q.id] = st + 1;
      const next = q.steps[st + 1];
      G.ui.notify("◆ " + q.name + " — step complete", "gold");
      if (next) G.ui.objective(q.name + ": " + next.text);
      G.audio.chime(); G.saveGame();
    }
  }
}

// ================= KITTENS =================
G.carryKitten = null;

function updateKittens(dt) {
  const p = G.player, s = G.state;
  if (G.carryKitten) {
    // deliver at the Paw Shrine
    if (Math.hypot(3320 - p.x, 1480 - p.y) < 80) {
      s.kittens[G.carryKitten.id] = true;
      s.counts.shrine = (s.counts.shrine || 0) + 1;
      G.earn(60, G.carryKitten.name + " safe at the shrine");
      if (G.gainXP) G.gainXP(55);
      G.ui.notify("♡ " + G.carryKitten.name + " rescued — " + G.carryKitten.trait, "ach");
      if (G.fx) G.fx.burst(p.x, p.y - 20, "#ffb347", 14);
      G.audio.mew(); G.audio.fanfare();
      G.carryKitten = null;
      G.ui.objective(null);
      G.saveGame();
    } else if (Math.random() < dt * 0.25) G.audio.mew(0.4);
  }
  // ambient mews near undiscovered kittens
  for (const k of G.KITTENS) {
    if (s.kittens[k.id] || (G.carryKitten && G.carryKitten.id === k.id)) continue;
    const d = Math.hypot(k.x - p.x, k.y - p.y);
    if (d < 320 && Math.random() < dt * 0.5) G.audio.mew(0.25 * (1 - d / 320));
    if (d < 180 && !s.flags.kitten) { s.flags.kitten = 1; G.ui.guide(G.GUIDE.kittenTip, 9); }
  }
}

// ================= DATA WISPS =================
G.wisps = [];
let wispTimer = 35;

G.spawnWisp = function (quiet) {
  const p = G.player, ang = Math.random() * 7;
  G.wisps.push({
    x: Math.max(200, Math.min(G.CFG.WORLD_W - 200, p.x + Math.cos(ang) * 400)),
    y: Math.max(700, Math.min(G.CFG.UNDER_Y - 60, p.y - 80 + Math.sin(ang) * 200)),
    vx: 0, vy: 0, life: 26, ph: Math.random() * 7,
  });
  if (!quiet) G.ui.notify("⚡ DATA WISP detected nearby", "pink");
  if (!G.state.flags.wisp) { G.state.flags.wisp = 1; G.ui.guide(G.GUIDE.wispTip, 9); }
};

function updateWisp(dt) {
  const p = G.player;
  if (!G.wisps.length) {
    wispTimer -= dt;
    if (wispTimer <= 0) { G.spawnWisp(); wispTimer = 55 + Math.random() * 40; }
    return;
  }
  for (let i = G.wisps.length - 1; i >= 0; i--) {
    const w = G.wisps[i];
    w.life -= dt; w.ph += dt;
    const dx = w.x - p.x, dy = w.y - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < 420) { // flee
      w.vx += (dx / d) * 700 * dt; w.vy += (dy / d) * 500 * dt;
    }
    w.vx += Math.sin(w.ph * 3.1) * 160 * dt; w.vy += Math.cos(w.ph * 2.3) * 140 * dt;
    const sp = Math.hypot(w.vx, w.vy), max = 430; // slightly slower than sprint
    if (sp > max) { w.vx = w.vx / sp * max; w.vy = w.vy / sp * max; }
    w.x += w.vx * dt; w.y += w.vy * dt;
    if (w.x < 150) { w.x = 150; w.vx = Math.abs(w.vx); } if (w.x > G.CFG.WORLD_W - 150) { w.x = G.CFG.WORLD_W - 150; w.vx = -Math.abs(w.vx); }
    if (w.y < 600) { w.y = 600; w.vy = Math.abs(w.vy); } if (w.y > G.CFG.UNDER_Y - 50) { w.y = G.CFG.UNDER_Y - 50; w.vy = -Math.abs(w.vy); }
    if (d < 34) { // caught!
      G.state.stats.wisps++;
      G.earn(30, "wisp caught");
      if (G.gainXP) G.gainXP(20);
      G.flow.add("wisp", 25);
      if (G.fx) G.fx.burst(w.x, w.y, "#00f0ff", 22);
      G.audio.zap();
      G.wisps.splice(i, 1);
    } else if (w.life <= 0) {
      if (G.fx) G.fx.burst(w.x, w.y, "#7b61ff", 8);
      G.wisps.splice(i, 1);
    }
  }
}

// ================= GOLDEN KIBBLE =================
G.gold = null;
let goldTimer = 25;

function updateGold(dt) {
  const p = G.player;
  if (!G.gold) {
    goldTimer -= dt;
    if (goldTimer <= 0) {
      G.gold = {
        x: Math.max(200, Math.min(G.CFG.WORLD_W - 200, p.x + (Math.random() - 0.5) * 1300)),
        y: Math.max(500, p.y - 60 - Math.random() * 260),
        life: 30, ph: 0,
      };
      G.audio.blip(880);
      goldTimer = 40 + Math.random() * 30;
    }
    return;
  }
  G.gold.life -= dt; G.gold.ph += dt;
  if (Math.hypot(G.gold.x - p.x, G.gold.y - p.y) < 34) {
    G.state.counts.food += 5;
    G.earn(12, "golden kibble");
    G.flow.add("gold", 15);
    if (G.fx) G.fx.burst(G.gold.x, G.gold.y, "#ffe14d", 20);
    G.audio.chime();
    G.gold = null;
  } else if (G.gold.life <= 0) G.gold = null;
}

// ================= LORE SNIFFER =================
let sniffT = 0;
function updateSniffer(dt) {
  if (!G.state.upgrades.sniffer && !G.state.upgrades.hintPulse && !G.state.skills.explore_ping) return;
  sniffT -= dt;
  if (sniffT > 0) return;
  const p = G.player;
  let best = 380, found = null;
  for (const it of G.items) {
    if (it.taken || it.type === "food") continue;
    const d = Math.hypot(it.x - p.x, it.y - p.y);
    if (d < best) { best = d; found = it; }
  }
  if (found) {
    G.audio.blip(360 + (1 - best / 380) * 480);
    sniffT = 0.35 + (best / 380) * 1.1; // faster pings when closer
  } else sniffT = 1.0;
}

function updateSecrets() {
  const p = G.player, s = G.state;
  for (const room of G.SECRET_ROOMS) {
    if (s.secrets[room.id]) continue;
    if (Math.hypot(room.x - p.x, room.y - p.y) < room.r) {
      if (room.key && (s.counts.key || 0) <= 0) {
        G.ui.notify("SPECIAL KEY NEEDED — follow the graffiti clues", "pink");
        continue;
      }
      if (room.terminal) {
        const t = G.terminals.find(x => x.id === room.terminal);
        if (t && !t.hacked) { G.ui.notify("HIDDEN TERMINAL LOCKED — breach nearby access first", "pink"); continue; }
      }
      s.secrets[room.id] = true;
      if (room.reward === "shrine piece") s.counts.shrine = (s.counts.shrine || 0) + 1;
      if (room.cosmetic === "secretViolet") { s.style.collar = "#b16cff"; s.cosmetics.secretViolet = true; }
      if (room.cosmetic === "livingLantern") { s.shrine.decor.garden = true; s.cosmetics.livingLantern = true; }
      if (room.mini) s.miniGames["secret-" + room.id] = true;
      G.ui.notify("▣ SECRET ROOM — " + room.name + "  (" + room.reward + ")", "ach");
      G.ui.dialog("SECRET // " + room.name, room.lore);
      G.awardMystery("secret-" + room.id, room.reward, room.reward !== "lost token");
      if (G.gainXP) G.gainXP(80);
      if (G.fx) G.fx.burst(room.x, room.y - 20, "#ffffff", 28);
      G.cam.shake = Math.max(G.cam.shake, 5);
      G.saveGame();
      break;
    }
  }
  for (const m of G.MYSTERIES) {
    if (!s.mysteries[m.id] && m.need()) {
      s.mysteries[m.id] = true;
      G.ui.notify("◇ CITY MYSTERY SOLVED — " + m.name, "ach");
      if (G.gainXP) G.gainXP(75);
      G.saveGame();
    }
  }
}

G.shrineCost = function () {
  const lv = G.state.shrine.level || 0;
  return { credits: 80 + lv * 70, pieces: Math.max(1, lv + 1), rare: lv >= 2 ? lv - 1 : 0, kittens: Math.min(G.KITTENS.length, lv + 1), story: lv >= 3 };
};

G.upgradeShrine = function () {
  const s = G.state, lv = s.shrine.level || 0;
  if (lv >= G.TOTALS.shrine) { G.ui.notify("Paw Shrine fully rebuilt.", "gold"); return false; }
  const cost = G.shrineCost();
  const storyOk = !cost.story || G.QUESTS.some(q => s.quests[q.id] === 99);
  if (s.counts.credits < cost.credits || (s.counts.shrine || 0) < cost.pieces || (s.counts.art + s.counts.leg) < cost.rare || Object.keys(s.kittens).length < cost.kittens || !storyOk) {
    G.ui.notify("Shrine needs pieces, credits, kittens, rare finds, and story progress.", "pink");
    return false;
  }
  s.counts.credits -= cost.credits;
  s.counts.shrine -= cost.pieces;
  s.shrine.level = lv + 1;
  if (s.shrine.level >= 2) { s.style.trail = true; s.style.trailColor = "#ffe14d"; s.cosmetics.shrineTrail = true; }
  if (s.shrine.level >= 3) s.skills.explore_ping = true;
  if (s.shrine.level >= 4) s.mysteries.shrine = true;
  if (s.shrine.level >= 5) s.style.filter = "shrine-glow";
  G.earn(25 + s.shrine.level * 10, "shrine blessing");
  if (G.gainXP) G.gainXP(80);
  G.ui.notify("PAW SHRINE REBUILT — level " + s.shrine.level + "/" + G.TOTALS.shrine, "ach");
  if (G.fx) G.fx.burst(3320, 1460, "#ffe14d", 42);
  G.audio.fanfare(); G.saveGame();
  return true;
};

G.buySkill = function (skill) {
  const s = G.state;
  if (!skill || s.skills[skill.id]) return false;
  if (s.skillPoints < skill.cost) { G.ui.notify("Need " + skill.cost + " upgrade point" + (skill.cost > 1 ? "s" : "") + ".", "pink"); G.audio.blip(140); return false; }
  s.skillPoints -= skill.cost;
  s.skills[skill.id] = true;
  if (skill.styleKey) { s.style[skill.styleKey] = skill.styleVal; s.cosmetics[skill.id] = true; }
  G.ui.notify("SKILL UNLOCKED — " + skill.name, "ach");
  G.audio.fanfare(); G.saveGame();
  return true;
};

G.completionRows = function () {
  const s = G.state;
  const cap = (n, max) => Math.min(max, Math.max(0, Number.isFinite(n) ? n : 0));
  const medalValue = m => typeof m === "number" ? m : ({ bronze: 1, silver: 2, gold: 3 }[m] || 0);
  const raceMedals = G.races.list.reduce((a, r) => a + cap(medalValue(r.medal) / 3, 1), 0);
  const inferredCosmetics = new Set(Object.keys(s.cosmetics));
  G.SHOP.forEach(i => {
    if (!s.upgrades[i.id]) return;
    if (i.collar || i.styleKey || i.id === "trail") inferredCosmetics.add(i.id);
  });
  G.SKILLS.forEach(i => {
    if (s.skills[i.id] && i.styleKey) inferredCosmetics.add(i.id);
  });
  if (s.secrets.forgotten) inferredCosmetics.add("secretViolet");
  if (s.secrets.garden) inferredCosmetics.add("livingLantern");
  if ((s.shrine.level || 0) >= 2) inferredCosmetics.add("shrineTrail");
  if ((s.shrine.level || 0) >= 5) inferredCosmetics.add("shrineGlowFilter");
  const cosmeticCount = cap(inferredCosmetics.size, 14);
  const upgradeTotal = G.SHOP.filter(i => !i.consumable).length;
  return [
    ["Collectibles found", cap(s.counts.food + s.counts.chip + s.counts.mem + s.counts.art + s.counts.leg + (s.counts.key || 0), G.TOTALS.food + G.TOTALS.chip + G.TOTALS.mem + G.TOTALS.art + G.TOTALS.leg + G.TOTALS.key), G.TOTALS.food + G.TOTALS.chip + G.TOTALS.mem + G.TOTALS.art + G.TOTALS.leg + G.TOTALS.key],
    ["Secret rooms discovered", cap(Object.keys(s.secrets).length, G.TOTALS.secrets), G.TOTALS.secrets],
    ["Lost kittens rescued", cap(Object.keys(s.kittens).length, G.TOTALS.kittens), G.TOTALS.kittens],
    ["Paw Shrine progress", cap(s.shrine.level || 0, G.TOTALS.shrine), G.TOTALS.shrine],
    ["NPC help quests completed", cap(G.QUESTS.filter(q => s.quests[q.id] === 99).length + Object.values(s.npcHelp).filter(v => v === 99).length, G.TOTALS.quests + G.TOTALS.npcHelp), G.TOTALS.quests + G.TOTALS.npcHelp],
    ["City mysteries solved", cap(Object.keys(s.mysteries).length, G.TOTALS.mysteries), G.TOTALS.mysteries],
    ["Upgrades purchased", cap(Object.keys(s.upgrades).filter(id => G.SHOP.some(i => i.id === id && !i.consumable)).length, upgradeTotal), upgradeTotal],
    ["Cosmetics unlocked", cosmeticCount, 14],
    ["Mini-games completed", cap(Object.keys(s.miniGames).length + (s.stats.jobs || 0), G.TOTALS.miniGames), G.TOTALS.miniGames],
    ["Achievements unlocked", cap(Object.keys(s.ach).length, G.ACH.length), G.ACH.length],
    ["Photo challenges completed", cap(G.photoTargets.filter(t => t.got).length, G.photoTargets.length), G.photoTargets.length],
    ["Courier streak record", cap(s.stats.bestCourierStreak || s.boardStreak || 0, 10), 10],
    ["Race medal results", raceMedals, G.races.list.length],
    ["Hidden rewards discovered", cap(Object.keys(s.hiddenRewards).length, G.TOTALS.hiddenRewards), G.TOTALS.hiddenRewards],
  ];
};

G.completionPct = function () {
  let got = 0, total = 0;
  G.completionRows().forEach(r => { got += Math.min(Number(r[1]) || 0, r[2]); total += r[2]; });
  return Math.min(100, Math.round(got / total * 100));
};

// ================= MAIN UPDATE =================
let achScanT = 0;
G.updateProgression = function (dt) {
  G.flow.update(dt);
  updateBoard(dt);
  updateQuests(dt);
  updateKittens(dt);
  updateWisp(dt);
  updateGold(dt);
  updateSniffer(dt);
  updateSecrets();
  if (G.state.buffT > 0) G.state.buffT -= dt;
  achScanT -= dt;
  if (achScanT <= 0) { achScanT = 2; G.ach.scan(); }
  if (!G.state.flags.questTip && (G.state.playT || 0) > 150) { G.state.flags.questTip = 1; G.ui.guide(G.GUIDE.questTip, 9); }
};

// ================= INTERACTABLES (hooked from activities.js) =================
G.progressionInteracts = function (consider) {
  const s = G.state;
  // courier boards
  for (const bx of [4650, 6980, 11620]) {
    consider(bx, G.CFG.STREET_Y, "board", null, G.board.active ? "Job in progress…" : "Courier board: take a job");
  }
  // kittens
  if (!G.carryKitten) {
    for (const k of G.KITTENS) {
      if (s.kittens[k.id]) continue;
      consider(k.x, k.y, "kitten", k, "Rescue the kitten");
    }
  }
  // quest givers & talkable NPCs
  for (const n of G.npcs) {
    if (!n.fixed || !n.name || n.type === "vendor" || !G.npcVisible(n)) continue;
    const q = G.QUESTS.find(q => q.giver === n.name);
    let label = "Talk to " + n.name;
    if (q) {
      const st = s.quests[q.id];
      if (st === undefined) label = "❢ " + n.name + " has a job for you";
      else if (st !== 99 && q.steps[st] && q.steps[st].type === "return") label = "❢ Report back to " + n.name;
    }
    consider(n.x, n.y, "talk", n, label);
  }
  // vendors
  for (const n of G.npcs) {
    if (n.fixed && n.type === "vendor") consider(n.x, n.y, "shop", n, "Browse vendor wares");
  }
  consider(3320, 1480, "shrine", null, "Rebuild / visit Paw Shrine");
};

// ================= DRAWING (hooked from render.js) =================
G.drawProgression = function (ctx, view, now) {
  const s = G.state;
  // courier boards
  for (const bx of [4650, 6980, 11620]) {
    if (bx < view.x - 60 || bx > view.x + view.w + 60) continue;
    const y = G.CFG.STREET_Y;
    ctx.fillStyle = "#1a1722"; ctx.fillRect(bx - 4, y - 92, 8, 92);
    ctx.fillStyle = "#141826"; ctx.fillRect(bx - 30, y - 130, 60, 42);
    ctx.fillStyle = `rgba(255,225,77,${0.6 + 0.3 * Math.sin(now * 3)})`;
    ctx.font = "bold 13px monospace"; ctx.fillText("JOBS", bx - 17, y - 103);
  }
  // active job markers
  const j = G.board.active;
  if (j) {
    const m = j.carrying ? j.drop : j.pickup;
    if (m[1] > view.x - 80 && m[1] < view.x + view.w + 80) {
      const my = m[2] - 90 + Math.sin(now * 3) * 7;
      ctx.fillStyle = j.carrying ? "#aaff00" : "#ffe14d";
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(m[1], my + 16); ctx.lineTo(m[1] - 10, my); ctx.lineTo(m[1] + 10, my); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  // kittens
  for (const k of G.KITTENS) {
    if (s.kittens[k.id] || (G.carryKitten && G.carryKitten.id === k.id)) continue;
    if (k.x < view.x - 50 || k.x > view.x + view.w + 50) continue;
    drawKitten(ctx, k.x, k.y, k.c, now, true);
  }
  // seed crate (quest green, step 1)
  if (s.quests.green === 1) {
    const sx = 12000, sy = G.CFG.STREET_Y - 26;
    if (sx > view.x - 60 && sx < view.x + view.w + 60) {
      ctx.fillStyle = "#2a3a1c"; ctx.fillRect(sx - 14, sy - 10, 28, 22);
      ctx.strokeStyle = "#aaff00"; ctx.lineWidth = 1.6; ctx.strokeRect(sx - 14, sy - 10, 28, 22);
      ctx.fillStyle = "#aaff00"; ctx.font = "14px monospace"; ctx.fillText("✿", sx - 6, sy + 6);
    }
  }
  // quest markers above givers
  for (const q of G.QUESTS) {
    const st = s.quests[q.id];
    let glyph = null;
    if (st === undefined) glyph = "!";
    else if (st !== 99 && q.steps[st] && q.steps[st].type === "return") glyph = "◆";
    if (!glyph) continue;
    const [qx, qy] = q.at;
    if (qx < view.x - 60 || qx > view.x + view.w + 60 || qy < view.y - 80 || qy > view.y + view.h + 80) continue;
    const my = qy - 74 + Math.sin(now * 2.6) * 5;
    ctx.fillStyle = "#ffe14d"; ctx.shadowColor = "#ffe14d"; ctx.shadowBlur = 12;
    ctx.font = "bold 22px monospace";
    ctx.fillText(glyph, qx - 6, my);
    ctx.shadowBlur = 0;
  }
  // wisps
  for (const w of G.wisps) {
    if (w.x > view.x - 60 && w.x < view.x + view.w + 60) {
      ctx.save(); ctx.translate(w.x, w.y);
      for (let i = 0; i < 3; i++) {
        const jx = (Math.random() - 0.5) * 6, jy = (Math.random() - 0.5) * 6;
        ctx.fillStyle = ["rgba(0,240,255,0.7)", "rgba(255,43,214,0.5)", "rgba(255,255,255,0.8)"][i];
        ctx.fillRect(jx - 5 + i, jy - 5 + i, 10 - i * 2, 10 - i * 2);
      }
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, 0, 14 + Math.sin(w.ph * 8) * 3, 0, 7); ctx.stroke();
      ctx.restore();
    }
  }
  // golden kibble
  if (G.gold) {
    const g = G.gold;
    if (g.x > view.x - 60 && g.x < view.x + view.w + 60) {
      ctx.save(); ctx.translate(g.x, g.y + Math.sin(g.ph * 2) * 6);
      const pl = 1 + Math.sin(g.ph * 5) * 0.2;
      ctx.scale(pl, pl); ctx.rotate(g.ph);
      ctx.fillStyle = "#ffe14d"; ctx.shadowColor = "#ffe14d"; ctx.shadowBlur = 18;
      ctx.fillRect(-7, -7, 14, 14);
      ctx.shadowBlur = 0; ctx.fillStyle = "#fff"; ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      // fading despawn warning ring
      if (g.life < 8) {
        ctx.strokeStyle = `rgba(255,225,77,${g.life / 8 * 0.5})`;
        ctx.beginPath(); ctx.arc(g.x, g.y, 20 + (8 - g.life) * 3, 0, 7); ctx.stroke();
      }
    }
  }
  // race ghost replay
  const R = G.races.active;
  if (R && R.race.ghost && R.race.ghost.length > 1) {
    const elapsed = R.race.limit - R.t;
    const idx = Math.min(R.race.ghost.length - 1, elapsed / 0.1);
    const i0 = Math.floor(idx), f = idx - i0;
    const a = R.race.ghost[i0], b = R.race.ghost[Math.min(i0 + 1, R.race.ghost.length - 1)];
    const gx = a[0] + (b[0] - a[0]) * f, gy = a[1] + (b[1] - a[1]) * f;
    ctx.save(); ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#9adfff";
    ctx.beginPath(); ctx.ellipse(gx, gy, 18, 11, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(gx + 14, gy - 8, 7, 0, 7); ctx.fill();
    ctx.font = "9px monospace"; ctx.fillText("BEST", gx - 10, gy - 18);
    ctx.restore();
  }
};

G.drawKitten = drawKitten;
function drawKitten(ctx, x, y, c, now, withHeart) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.ellipse(0, -5, 8, 6, 0, 0, 7); ctx.fill();          // body
  ctx.beginPath(); ctx.arc(5, -11, 5, 0, 7); ctx.fill();                    // head
  ctx.beginPath(); ctx.moveTo(2, -14); ctx.lineTo(3, -19); ctx.lineTo(6, -15); ctx.fill();
  ctx.beginPath(); ctx.moveTo(7, -15); ctx.lineTo(9, -19); ctx.lineTo(10, -14); ctx.fill();
  ctx.strokeStyle = c; ctx.lineWidth = 2.6; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(-7, -4);
  ctx.quadraticCurveTo(-12, -8 + Math.sin(now * 4) * 2.4, -11, -13); ctx.stroke(); // tail
  ctx.fillStyle = "#fff";
  ctx.fillRect(3.4, -12.4, 1.6, 1.8); ctx.fillRect(6.6, -12.4, 1.6, 1.8);   // eyes
  if (withHeart && Math.sin(now * 2.2) > 0.55) {
    ctx.fillStyle = "rgba(255,120,180,0.9)"; ctx.font = "10px monospace";
    ctx.fillText("♥", 0, -24);
  }
  ctx.restore();
}
