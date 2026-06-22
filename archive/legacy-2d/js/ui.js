// ============ PAWPAW WORLD — UI / HUD / MINIGAMES ============
"use strict";

G.ui = {
  els: {}, guideTimer: null, hudT: 0,

  init() {
    const ids = ["hud-zone", "hud-time", "hud-weather", "hud-disc", "hud-disc-bar",
      "c-food", "c-chip", "c-mem", "c-art", "c-leg",
      "hud-objective", "obj-text", "obj-timer", "guide", "guide-text",
      "notify-stack", "discovery-banner", "disc-name", "interact-prompt", "interact-text",
      "dialog", "dialog-title", "dialog-body", "hack", "hack-grid", "hack-status",
      "teleport", "tp-list", "photo-overlay", "photo-target",
      "ab-dash", "ab-djump", "ab-wall", "ab-glide", "hud-top-left", "hud-collect", "hud-abilities", "minimap",
      "c-cred", "combo", "combo-x", "combo-pts", "combo-bar", "buff", "buff-t",
      "journal", "journal-body", "shop", "shop-list", "shop-cred",
      "hud-lv", "hud-xp-bar", "hud-paw-title", "challenges", "ch-list", "ch-tier",
      "bonus-banner", "bonus-name", "bonus-t"];
    ids.forEach(id => this.els[id] = document.getElementById(id));
    this.mctx = this.els["minimap"].getContext("2d");
    this.els["dialog"].addEventListener("click", () => this.closeDialog());
    this.jtab = "quests";
    document.querySelectorAll(".jtab").forEach(t => t.addEventListener("click", () => {
      this.jtab = t.dataset.tab;
      document.querySelectorAll(".jtab").forEach(x => x.classList.toggle("active", x === t));
      this.renderJournal();
    }));
    this.refreshAbilities();
  },

  // ---------- per-frame ----------
  update(dt) {
    this.hudT -= dt;
    if (this.hudT <= 0) { this.hudT = 0.25; this.refreshHud(); }
    // interact prompt
    const ip = this.els["interact-prompt"];
    if (G.interact && !G.state.modal && !G.state.photoMode) {
      ip.classList.remove("hidden");
      this.els["interact-text"].textContent = G.interact.label;
    } else ip.classList.add("hidden");
    // race timer
    if (G.races.active) {
      this.els["obj-timer"].classList.remove("hidden");
      this.els["obj-timer"].textContent = Math.max(0, G.races.active.t).toFixed(1) + "s";
    } else if (G.board.active) {
      this.els["obj-timer"].classList.remove("hidden");
      this.els["obj-timer"].textContent = Math.max(0, G.board.active.t).toFixed(0) + "s";
    } else this.els["obj-timer"].classList.add("hidden");
    // flow combo meter
    const f = G.flow, cEl = this.els["combo"];
    if (f && f.combo >= 2) {
      cEl.classList.remove("hidden");
      cEl.classList.toggle("hot", f.combo >= 10);
      this.els["combo-x"].textContent = "x" + f.combo;
      this.els["combo-pts"].textContent = f.pts;
      this.els["combo-bar"].style.width = (f.t / f.MAX_T * 100) + "%";
    } else cEl.classList.add("hidden");
    // buff timer
    if (G.state.buffT > 0) {
      this.els["buff"].classList.remove("hidden");
      this.els["buff-t"].textContent = "SNACK RUSH " + Math.ceil(G.state.buffT) + "s";
    } else this.els["buff"].classList.add("hidden");
    // city bonus event countdown
    if (G.bonus && G.bonus.type) {
      this.els["bonus-banner"].classList.remove("hidden");
      this.els["bonus-name"].textContent = G.bonus.type === "rush" ? "🚦 RUSH HOUR ×2 PAY" : "▣ KIBBLE RAIN";
      this.els["bonus-t"].textContent = Math.max(0, Math.ceil(G.bonus.t)) + "s";
    } else this.els["bonus-banner"].classList.add("hidden");
    this.drawMinimap();
  },

  refreshHud() {
    const s = G.state, z = G.ZONES[G.zoneAt(G.player.x, G.player.y)];
    this.els["hud-zone"].textContent = z.name;
    this.els["hud-zone"].style.color = z.color;
    this.els["hud-zone"].style.textShadow = "0 0 8px " + z.color;
    const h = Math.floor(G.time.hours), m = Math.floor((G.time.hours % 1) * 60);
    this.els["hud-time"].textContent = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    const wl = { clear: "CLEAR", lightRain: "LIGHT RAIN", heavyRain: "HEAVY RAIN", fog: "FOG", storm: "STORM" };
    this.els["hud-weather"].textContent = wl[G.weather.next || G.weather.cur];
    const pct = G.discoveryPct();
    this.els["hud-disc"].textContent = pct + "%";
    this.els["hud-disc-bar"].style.width = pct + "%";
    this.els["c-cred"].textContent = s.counts.credits + "¢";
    this.els["c-food"].textContent = s.counts.food;
    // paw level
    this.els["hud-lv"].textContent = s.level;
    this.els["hud-xp-bar"].style.width = (s.xp / G.xpNeed(s.level) * 100) + "%";
    this.els["hud-paw-title"].textContent = G.pawTitle();
    // challenges
    if (G.challenges) {
      this.els["ch-tier"].textContent = G.challenges.tier ? "T" + G.challenges.tier : "";
      this.els["ch-list"].innerHTML = G.challenges.active.map(c =>
        `<div class="ch"><div class="ch-txt"><span>${c.label}</span><span class="ch-n">${c.prog || 0}/${c.n}</span></div>` +
        `<div class="ch-bar"><div style="width:${(c.prog || 0) / c.n * 100}%"></div></div></div>`).join("");
    }
    this.els["c-chip"].textContent = s.counts.chip + "/18";
    this.els["c-mem"].textContent = s.counts.mem + "/10";
    this.els["c-art"].textContent = s.counts.art + "/5";
    this.els["c-leg"].textContent = s.counts.leg + "/2";
  },

  refreshAbilities() {
    const a = G.state.abilities;
    this.els["ab-dash"].classList.toggle("locked", !a.dash);
    this.els["ab-djump"].classList.toggle("locked", !a.djump);
    this.els["ab-wall"].classList.toggle("locked", !a.wallrun);
  },

  notifyAch(name, desc) {
    const el = document.createElement("div");
    el.className = "notify ach";
    el.innerHTML = "🏆 <b>" + name + "</b> — " + desc;
    this.els["notify-stack"].appendChild(el);
    setTimeout(() => el.classList.add("fade"), 6000);
    setTimeout(() => el.remove(), 7000);
  },

  // ---------- notifications ----------
  notify(text, cls) {
    const el = document.createElement("div");
    el.className = "notify" + (cls ? " " + cls : "");
    el.textContent = text;
    this.els["notify-stack"].appendChild(el);
    setTimeout(() => el.classList.add("fade"), 4200);
    setTimeout(() => el.remove(), 5200);
  },

  banner(name) {
    const b = this.els["discovery-banner"];
    this.els["disc-name"].textContent = name;
    b.classList.remove("hidden");
    clearTimeout(this._bt);
    this._bt = setTimeout(() => b.classList.add("hidden"), 3400);
  },

  guide(html, dur) {
    const g = this.els["guide"];
    this.els["guide-text"].innerHTML = html;
    g.classList.remove("hidden");
    clearTimeout(this.guideTimer);
    this.guideTimer = setTimeout(() => g.classList.add("hidden"), (dur || 7) * 1000);
  },

  objective(text) {
    const o = this.els["hud-objective"];
    if (!text) { o.classList.add("hidden"); return; }
    o.classList.remove("hidden");
    this.els["obj-text"].textContent = text;
  },

  // ---------- dialog ----------
  dialog(title, body) {
    G.state.modal = "dialog";
    this.els["dialog-title"].textContent = title;
    this.els["dialog-body"].textContent = body;
    this.els["dialog"].classList.remove("hidden");
  },
  closeDialog() {
    if (G.state.modal !== "dialog") return;
    G.state.modal = null;
    this.els["dialog"].classList.add("hidden");
  },

  // ---------- teleport menu ----------
  openTeleport() {
    G.state.modal = "teleport";
    document.getElementById("tp-title").textContent = "TRANSIT NODE // FAST TRAVEL";
    const list = this.els["tp-list"];
    list.innerHTML = "";
    const cur = G.interact && G.interact.obj;
    for (const tp of G.world.teleports) {
      if (!G.state.tpUnlocked[tp.id]) continue;
      const el = document.createElement("div");
      el.className = "tp-item" + (cur && cur.id === tp.id ? " current" : "");
      el.innerHTML = `<span>⬡ ${tp.name}</span><span class="tp-zone">${G.ZONES[G.zoneAt(tp.x, tp.y - 10)].name}</span>`;
      el.addEventListener("click", () => { this.closeModal(); G.teleportTo(tp); });
      list.appendChild(el);
    }
    this.els["teleport"].classList.remove("hidden");
  },

  toggleCityMap() {
    if (G.state.modal === "map") { this.closeModal(); return; }
    if (G.state.modal) return;
    G.state.modal = "map";
    document.getElementById("tp-title").textContent = "CITY MAP // DISTRICT ROUTES";
    const list = this.els["tp-list"];
    const s = G.state;
    list.innerHTML = "";
    const zones = Object.entries(G.ZONES).map(([id, z]) => {
      const landmarks = G.world.landmarks.filter(l => G.zoneAt(l.x, l.y) === id);
      const found = landmarks.filter(l => s.discovered[l.id]).length;
      return `<div class="tp-item current"><span style="color:${z.color}">◆ ${z.name}</span><span class="tp-zone">${found}/${landmarks.length} landmarks</span></div>`;
    }).join("");
    const transit = G.world.teleports.filter(tp => s.tpUnlocked[tp.id]).map(tp => {
      const zone = G.ZONES[G.zoneAt(tp.x, tp.y - 10)].name;
      return `<button class="tp-item map-jump" data-tp="${tp.id}"><span>⬡ ${tp.name}</span><span class="tp-zone">${zone}</span></button>`;
    }).join("");
    list.innerHTML = `<div class="j-sec">DISTRICTS</div>${zones}<div class="j-sec">UNLOCKED TRANSIT</div>${transit || "<div class='j-row'><span>No transit nodes unlocked yet</span><span>explore to reveal them</span></div>"}`;
    list.querySelectorAll(".map-jump").forEach(btn => btn.addEventListener("click", () => {
      const tp = G.world.teleports.find(t => t.id === btn.dataset.tp);
      if (tp) { this.closeModal(); G.teleportTo(tp); }
    }));
    this.els["teleport"].classList.remove("hidden");
  },

  closeModal() {
    G.state.modal = null;
    this.els["teleport"].classList.add("hidden");
    this.els["dialog"].classList.add("hidden");
    this.els["hack"].classList.add("hidden");
    this.els["journal"].classList.add("hidden");
    this.els["shop"].classList.add("hidden");
    document.getElementById("hack-title").textContent = "SIGNAL TRACE // BREACH PROTOCOL";
    document.getElementById("tp-title").textContent = "TRANSIT NODE // FAST TRAVEL";
    if (this._hackKill) { this._hackKill(); this._hackKill = null; }
  },

  // ---------- journal ----------
  toggleJournal() {
    if (G.state.modal === "journal") { this.closeModal(); return; }
    if (G.state.modal) return;
    G.state.modal = "journal";
    this.els["journal"].classList.remove("hidden");
    this.renderJournal();
  },

  renderJournal() {
    const b = this.els["journal-body"], s = G.state;
    const row = (a, v, max) => `<div class="j-row"><span>${a}</span><span>${max == null ? v : Math.round(v) + " / " + max}</span></div>`;
    if (this.jtab === "quests") {
      let h = "";
      for (const q of G.QUESTS) {
        const st = s.quests[q.id];
        const cls = st === 99 ? "j-quest done" : "j-quest";
        let body;
        if (st === undefined) body = "Find <b>" + q.giver + "</b> — they're marked with a gold ❢ somewhere in the city.";
        else if (st === 99) body = "Complete. (+" + q.reward + "¢)";
        else body = "▶ " + q.steps[st].text;
        h += `<div class="${cls}"><div class="jq-name">${st === 99 ? "✓ " : ""}${q.name}</div><div class="jq-step">${body}</div></div>`;
      }
      h += `<div class="j-sec">PARKOUR RACES</div>`;
      for (const r of G.races.list) {
        h += `<div class="j-row"><span>${r.name}</span><span>${r.medal ? G.MEDAL_NAMES[r.medal] + " · best " + r.best.toFixed(1) + "s" : "not finished"}</span></div>`;
      }
      h += `<div class="j-sec">COURIER BOARD</div><div class="j-row"><span>Current streak</span><span>${s.boardStreak} (pay ${30 + Math.min(8, s.boardStreak) * 10}¢)</span></div>`;
      h += `<div class="j-sec">NPC HELP</div>`;
      for (const e of G.NPC_ERRANDS) {
        const st = s.npcHelp[e.id];
        h += `<div class="j-row"><span>${st === 99 ? "✓ " : ""}${e.name}</span><span>${st === 99 ? "helped" : st ? "in progress" : "talk to " + e.giver}</span></div>`;
      }
      b.innerHTML = h;
    } else if (this.jtab === "completion") {
      const pct = G.completionPct();
      let h = `<div class="completion-head"><div>DISTRICT COMPLETION</div><strong>${pct}%</strong><div class="bigbar"><div style="width:${pct}%"></div></div></div>`;
      for (const r of G.completionRows()) h += row(r[0], r[1], r[2]);
      b.innerHTML = h;
    } else if (this.jtab === "ach") {
      const got = G.ACH.filter(a => s.ach[a[0]]).length;
      let h = `<div class="j-sec">${got} / ${G.ACH.length} UNLOCKED</div>`;
      for (const [id, name, desc] of G.ACH) {
        h += `<div class="j-ach${s.ach[id] ? " got" : ""}"><span class="ja-ico">${s.ach[id] ? "🏆" : "○"}</span><span class="ja-name">${name}</span><span class="ja-desc">${desc}</span></div>`;
      }
      b.innerHTML = h;
    } else if (this.jtab === "collection") {
      const c = s.counts;
      let h = `<div class="j-sec">COLLECTIBLES</div>`;
      h += `<div class="j-row"><span>▣ Holo-kibble</span><span>${c.food} / 140+</span></div>`;
      h += `<div class="j-row"><span>◧ Data chips</span><span>${c.chip} / 18</span></div>`;
      h += `<div class="j-row"><span>◈ Lost memories</span><span>${c.mem} / 10</span></div>`;
      h += `<div class="j-row"><span>✦ Artifacts</span><span>${c.art} / 5</span></div>`;
      h += `<div class="j-row"><span>★ Legendaries</span><span>${c.leg} / 2</span></div>`;
      h += `<div class="j-row"><span>⚿ Special keys</span><span>${c.key || 0} / 2</span></div>`;
      h += `<div class="j-row"><span>📷 Photo targets</span><span>${G.photoTargets.filter(t => t.got).length} / ${G.photoTargets.length}</span></div>`;
      h += `<div class="j-row"><span>🐱 Kittens rescued</span><span>${Object.keys(s.kittens).length} / 8</span></div>`;
      h += `<div class="j-sec">LANDMARKS — ${Object.keys(s.discovered).length} / ${G.world.landmarks.length}</div>`;
      for (const lm of G.world.landmarks) {
        const known = s.discovered[lm.id];
        const zone = G.ZONES[G.zoneAt(lm.x, lm.y)].name;
        h += `<span class="j-land${known ? "" : " unk"}">${known ? "◆ " + lm.name : "◇ ??? — " + zone.toLowerCase()}</span>`;
      }
      b.innerHTML = h;
    } else if (this.jtab === "skills") {
      let h = `<div class="j-sec">UPGRADE POINTS: ${s.skillPoints || 0}</div>`;
      for (const branch of ["Movement", "Exploration", "Economy", "Style"]) {
        h += `<div class="j-sec">${branch.toUpperCase()}</div>`;
        for (const sk of G.SKILLS.filter(x => x.branch === branch)) {
          const owned = s.skills[sk.id];
          h += `<button class="skill ${owned ? "owned" : ""}" data-skill="${sk.id}"><span>${owned ? "✓ " : ""}${sk.name}</span><small>${sk.desc}</small><b>${owned ? "OWNED" : sk.cost + " pt"}</b></button>`;
        }
      }
      b.innerHTML = h;
      b.querySelectorAll("[data-skill]").forEach(el => el.addEventListener("click", () => {
        if (G.buySkill(G.SKILLS.find(sk => sk.id === el.dataset.skill))) this.renderJournal();
      }));
    } else if (this.jtab === "cosmetics") {
      const rows = [
        ["Collar color", s.style.collar],
        ["Trail", s.style.trail ? (s.style.trailColor || "#00f0ff") : "locked"],
        ["Pawstep particles", s.style.pawsteps ? "unlocked" : "locked"],
        ["Jump sparkle", s.style.sparkle ? "unlocked" : "locked"],
        ["Dash afterimage", s.style.afterimage ? "unlocked" : "locked"],
        ["Skin variant", s.style.skin || "calico"],
        ["Photo filter", s.style.filter || "none"],
        ["Cosmetics unlocked", Object.keys(s.cosmetics).length + G.SHOP.filter(i => i.collar && s.upgrades[i.id]).length],
      ];
      b.innerHTML = `<div class="j-sec">STYLE LOADOUT</div>` + rows.map(r => row(r[0], r[1])).join("");
    } else if (this.jtab === "shrine") {
      const cost = G.shrineCost(), lv = s.shrine.level || 0;
      let h = `<div class="j-sec">PAW SHRINE LEVEL ${lv} / ${G.TOTALS.shrine}</div>`;
      h += row("Available shrine pieces", s.counts.shrine || 0);
      h += row("Kittens living at shrine", Object.keys(s.kittens).length, G.KITTENS.length);
      h += row("Next rebuild cost", lv >= G.TOTALS.shrine ? "complete" : cost.pieces + " pieces + " + cost.credits + "¢ · " + cost.kittens + " kittens" + (cost.rare ? " · " + cost.rare + " rare finds" : "") + (cost.story ? " · story progress" : ""));
      h += `<button class="skill shrine-up" data-shrine="1">${lv >= G.TOTALS.shrine ? "Shrine Complete" : "Rebuild Shrine"}</button>`;
      h += `<div class="j-sec">RESCUED KITTENS</div>`;
      for (const k of G.KITTENS) h += `<div class="j-row"><span>${s.kittens[k.id] ? "✓ " : "◇ "}${k.name}</span><span>${s.kittens[k.id] ? k.trait : "missing"}</span></div>`;
      b.innerHTML = h;
      const btn = b.querySelector("[data-shrine]");
      if (btn) btn.addEventListener("click", () => { if (G.upgradeShrine()) this.renderJournal(); });
    } else if (this.jtab === "races") {
      let h = `<div class="j-sec">GHOST REPLAY RECORDS</div>`;
      for (const r of G.races.list) {
        h += row(r.name, r.medal ? G.MEDAL_NAMES[r.medal] + " · best " + r.best.toFixed(1) + "s · ghost saved" : "not finished");
        h += row("Targets", "Gold " + (r.limit * 0.55).toFixed(1) + "s · Silver " + (r.limit * 0.72).toFixed(1) + "s · Bronze finish");
      }
      b.innerHTML = h;
    } else if (this.jtab === "photos") {
      let h = `<div class="j-sec">PHOTO CHALLENGES</div>`;
      for (const t of G.photoTargets) h += row((t.got ? "✓ " : "◇ ") + t.name, t.got ? "archived" : "find the landmark");
      h += row("Set progress", G.photoTargets.filter(t => t.got).length, G.photoTargets.length);
      b.innerHTML = h;
    } else { // stats
      const st = s.stats;
      const rows = [
        ["Paw level", s.level + " — " + G.pawTitle()],
        ["XP to next level", (G.xpNeed(s.level) - s.xp) + " XP"],
        ["Challenge tier", G.challenges.tier],
        ["Distance travelled", (st.dist / 40000).toFixed(2) + " km"],
        ["Jumps", st.jumps], ["Wall jumps", st.walljumps], ["Dashes", st.dashes],
        ["Ziplines ridden", st.zips], ["Best flow combo", "x" + st.maxCombo],
        ["Courier jobs", st.jobs], ["Best courier streak", st.bestCourierStreak || s.boardStreak], ["Wisps caught", st.wisps],
        ["Kittens rescued", Object.keys(s.kittens).length], ["Secret rooms found", Object.keys(s.secrets).length],
        ["Races completed", st.raceRuns || 0], ["Gold medals earned", st.golds || 0],
        ["Lifetime credits", st.credEarned + "¢"], ["Photos taken", s.counts.photos],
        ["Discovery", G.discoveryPct() + "%"], ["Total completion", G.completionPct() + "%"],
      ];
      b.innerHTML = rows.map(r => `<div class="j-row"><span>${r[0]}</span><span>${r[1]}</span></div>`).join("");
    }
  },

  openShrine() {
    G.state.modal = "journal";
    this.jtab = "shrine";
    document.querySelectorAll(".jtab").forEach(x => x.classList.toggle("active", x.dataset.tab === "shrine"));
    this.els["journal"].classList.remove("hidden");
    this.renderJournal();
  },

  // ---------- shop ----------
  openShop() {
    G.state.modal = "shop";
    this.els["shop"].classList.remove("hidden");
    this.renderShop();
  },

  renderShop() {
    const s = G.state, list = this.els["shop-list"];
    this.els["shop-cred"].textContent = s.counts.credits + "¢";
    list.innerHTML = "";
    for (const item of G.SHOP) {
      const owned = !item.consumable && s.upgrades[item.id];
      const equipped = item.collar && s.style.collar === item.collar;
      const cost = Math.max(1, Math.round(item.cost * (s.upgrades.discount || s.skills.econ_vendor ? 0.85 : 1)));
      const broke = !owned && s.counts.credits < cost;
      const el = document.createElement("div");
      el.className = "shop-item" + (owned && !item.collar ? " owned" : "") + (broke ? " broke" : "");
      el.innerHTML = `<span class="si-name">${item.name}</span><span class="si-desc">${item.desc}</span>` +
        `<span class="si-cost">${owned ? (item.collar ? (equipped ? "WORN" : "EQUIP") : "OWNED") : cost + "¢"}</span>`;
      el.addEventListener("click", () => { if (G.buyItem(item)) this.renderShop(); });
      list.appendChild(el);
    }
  },

  startRhythm(onWin) {
    G.state.modal = "hack";
    const grid = this.els["hack-grid"], status = this.els["hack-status"], hackEl = this.els["hack"];
    document.getElementById("hack-title").textContent = "STREET RHYTHM // STATIC QUARTET";
    hackEl.classList.remove("hidden");
    grid.innerHTML = "";
    const notes = ["←", "↑", "→", "SPACE"];
    let score = 0, step = 0, dead = false, timers = [];
    const T = (fn, ms) => timers.push(setTimeout(fn, ms));
    this._hackKill = () => { dead = true; timers.forEach(clearTimeout); document.getElementById("hack-title").textContent = "SIGNAL TRACE // BREACH PROTOCOL"; };
    notes.forEach((n, i) => {
      const el = document.createElement("div");
      el.className = "hack-node"; el.textContent = n; el.dataset.note = i;
      el.addEventListener("click", () => hit(i, el));
      grid.appendChild(el);
    });
    const nodes = [...grid.children];
    const pattern = Array.from({ length: 8 }, () => Math.floor(Math.random() * notes.length));
    const keyHit = e => {
      const m = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, Space: 3 }[e.code];
      if (m != null) { e.preventDefault(); hit(m, nodes[m]); }
    };
    window.addEventListener("keydown", keyHit);
    const oldKill = this._hackKill;
    this._hackKill = () => { oldKill(); window.removeEventListener("keydown", keyHit); };
    const cue = () => {
      if (dead || step >= pattern.length) return;
      const i = pattern[step];
      status.textContent = "Hit the glowing beat — " + (step + 1) + "/" + pattern.length;
      nodes[i].classList.add("lit");
      T(() => { if (!dead) nodes[i].classList.remove("lit"); }, 900);
      T(() => { if (!dead && step < pattern.length && !nodes[i].classList.contains("good")) { step++; cue(); } }, 950);
    };
    const hit = (i, el) => {
      if (dead || step >= pattern.length) return;
      const want = pattern[step];
      nodes.forEach(n => n.classList.remove("good", "bad"));
      if (i === want) { score++; el.classList.add("good"); G.audio.blip(520 + i * 120); }
      else { el.classList.add("bad"); G.audio.blip(160); }
      nodes[want].classList.remove("lit");
      step++;
      if (step >= pattern.length) {
        status.textContent = score >= 5 ? "ENCORE APPROVED" : "SOFT RESTART — still counts for practice";
        T(() => { window.removeEventListener("keydown", keyHit); this.closeModal(); document.getElementById("hack-title").textContent = "SIGNAL TRACE // BREACH PROTOCOL"; if (score >= 5) onWin(); else G.gainXP(12); }, 800);
      } else T(cue, 220);
    };
    T(cue, 450);
  },

  // ---------- hacking minigame (signal trace) ----------
  startHack(onWin) {
    G.state.modal = "hack";
    const grid = this.els["hack-grid"], status = this.els["hack-status"];
    const hackEl = this.els["hack"];
    hackEl.classList.remove("hidden");
    grid.innerHTML = "";
    const nodes = [];
    for (let i = 0; i < 6; i++) {
      const n = document.createElement("div");
      n.className = "hack-node";
      n.textContent = ["◈", "◉", "⬡", "✦", "◧", "⌁"][i];
      grid.appendChild(n); nodes.push(n);
    }
    let seq = [], input = 0, round = 0, dead = false, timers = [];
    const T = (fn, ms) => timers.push(setTimeout(fn, ms));
    this._hackKill = () => { dead = true; timers.forEach(clearTimeout); };

    const flash = (i, cls, ms) => { nodes[i].classList.add(cls || "lit"); T(() => nodes[i].classList.remove(cls || "lit"), ms || 320); };
    const roundNames = ["symbol match", "reaction timing", "circuit connection", "pattern decode"];
    const playSeq = () => {
      status.textContent = "ROUND " + (round + 1) + "/4 — " + roundNames[round] + "…";
      seq.push(Math.floor(Math.random() * 6));
      if (round === 0) seq.push(Math.floor(Math.random() * 6)); // start at 3
      if (round === 2) seq.push((seq[seq.length - 1] + 3) % 6); // circuit endpoint pair
      seq.forEach((s, i) => T(() => { flash(s); G.audio.blip(300 + s * 90); }, 500 + i * 460));
      T(() => { status.textContent = round === 1 ? "React before the signal fades." : round === 2 ? "Connect the circuit nodes." : "Trace it back."; input = 0; }, 500 + seq.length * 460);
    };
    nodes.forEach((n, i) => n.addEventListener("click", () => {
      if (dead || G.state.modal !== "hack") return;
      if (input >= seq.length) return;
      if (i === seq[input]) {
        flash(i, "good", 200); G.audio.blip(420 + i * 90);
        input++;
        if (input === seq.length) {
          round++;
          if (round >= 4) {
            status.textContent = "ACCESS GRANTED";
            nodes.forEach((nn, j) => T(() => flash(j, "good", 500), j * 70));
            T(() => { this.closeModal(); onWin(); }, 900);
          } else T(playSeq, 700);
        }
      } else {
        flash(i, "bad", 400); G.audio.blip(140);
        status.textContent = "SIGNAL LOST — retrying…";
        seq = []; round = 0;
        T(playSeq, 1000);
      }
    }));
    seq = []; round = 0;
    T(playSeq, 400);
  },

  // ---------- photo mode ----------
  setPhotoMode(on) {
    G.state.photoMode = on;
    this.els["photo-overlay"].classList.toggle("hidden", !on);
    ["hud-top-left", "hud-collect", "hud-abilities", "minimap", "challenges"].forEach(id =>
      this.els[id].classList.toggle("hidden", on));
    if (!on) this.els["photo-target"].classList.add("hidden");
  },
  updatePhotoTarget() {
    if (!G.state.photoMode) return;
    let found = null;
    for (const t of G.photoTargets) {
      if (t.got || Math.hypot(t.x - G.cam.x, t.y - G.cam.y) >= t.r) continue;
      const ok = t.kind === "ghost" ? !!G.eventActive("ghosttrain")
        : t.kind === "kitten" ? Object.keys(G.state.kittens).length > 0
        : t.kind === "jump" ? G.player.airT > 0.35 && G.zoneAt(G.player.x, G.player.y) === "rooftops"
        : t.kind === "rain" ? G.weather.rainAmt > 0.2
        : true;
      if (ok) { found = t; break; }
    }
    const el = this.els["photo-target"];
    if (found) { el.textContent = "◎ TARGET IN FRAME: " + found.name; el.classList.remove("hidden"); }
    else el.classList.add("hidden");
  },

  // ---------- minimap ----------
  drawMinimap() {
    const c = this.mctx, W = 220, H = 120;
    c.clearRect(0, 0, W, H);
    const kx = W / G.CFG.WORLD_W, ky = H / G.CFG.WORLD_H;
    // zones tint
    c.globalAlpha = 0.35;
    const zx = [[0, 2600, "#7b61ff"], [2600, 6200, "#ff2bd6"], [6200, 7400, "#00f0ff"], [7400, 10600, "#4dd2ff"], [10600, 12800, "#ffb347"]];
    for (const [a, b2, col] of zx) { c.fillStyle = col; c.fillRect(a * kx, G.CFG.STREET_Y * ky, (b2 - a) * kx, 3); }
    c.globalAlpha = 1;
    // buildings
    c.fillStyle = "rgba(120,160,210,0.35)";
    for (const b of G.world.buildings) c.fillRect(b.x * kx, b.y * ky, Math.max(1.6, b.w * kx), b.h * ky);
    // underground line
    c.fillStyle = "rgba(255,106,0,0.4)";
    c.fillRect(0, G.CFG.UNDER_Y * ky, W, 1.4);
    // teleports
    for (const tp of G.world.teleports) {
      c.fillStyle = G.state.tpUnlocked[tp.id] ? "#00f0ff" : "rgba(90,120,140,0.6)";
      c.fillRect(tp.x * kx - 1.4, tp.y * ky - 1.4, 3, 3);
    }
    // active objective
    let obj = null;
    if (G.races.active) { const ch = G.races.active.race.checks[G.races.active.idx]; if (ch) obj = ch; }
    else { const d = G.deliveries.find(d => d.state === 1); if (d) obj = [d.drop.x, d.drop.y]; }
    if (obj) {
      c.strokeStyle = "#aaff00"; c.lineWidth = 1;
      c.beginPath(); c.arc(obj[0] * kx, obj[1] * ky, 3.4 + Math.sin(performance.now() / 200) * 1.2, 0, 7); c.stroke();
    }
    // player
    c.fillStyle = "#fff";
    c.shadowColor = "#ff2bd6"; c.shadowBlur = 5;
    c.fillRect(G.player.x * kx - 1.6, G.player.y * ky - 1.6, 3.4, 3.4);
    c.shadowBlur = 0;
  },
};
