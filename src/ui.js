// ============ PawPaw-World-3D-v1 — HUD & MODALS ============
import { TOTALS, ACH, CHIP_LORE, MEMORY_LORE, MISSIONS, SIDE_QUESTS, CITY_NPCS, DISCOVERIES, COLLECTION_SETS, state } from "./data.js";
import { setProgress } from "./game.js";

const $ = id => document.getElementById(id);

let zoneTimer = null;
let guideTimer = null;

export function popup(text, rare = false) {
  const el = document.createElement("div");
  el.className = "popup" + (rare ? " rare" : "");
  el.textContent = text;
  $("popups").appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

export function toast(text) {
  const el = document.createElement("div");
  el.className = "popup ach";
  el.textContent = text;
  $("popups").appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

export function guide(html, secs = 9) {
  $("guide-text").innerHTML = html;
  $("guide-box").classList.remove("hidden");
  clearTimeout(guideTimer);
  guideTimer = setTimeout(() => $("guide-box").classList.add("hidden"), secs * 1000);
}

export function zoneBanner(name) {
  const el = $("zone-banner");
  el.textContent = name;
  el.classList.add("show");
  clearTimeout(zoneTimer);
  zoneTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

export function interactTip(html) {
  const el = $("interact-tip");
  if (!html) return el.classList.add("hidden");
  el.innerHTML = html;
  el.classList.remove("hidden");
}

export function carryTip(text) {
  const el = $("carry-tip");
  if (!text) return el.classList.add("hidden");
  el.textContent = text;
  el.classList.remove("hidden");
}

export function pulseCredits() {
  const el = $("st-cred").parentElement;
  el.classList.remove("pulse");
  void el.offsetWidth;   // restart the animation
  el.classList.add("pulse");
}

// ---------- flow combo meter ----------
export function combo(n) {
  const el = $("combo-meter");
  if (n < 2) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML = `${el.classList.contains("fever") ? "FEVER" : "FLOW"} <span>×${n}</span>`;
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

// FEVER: a screen-edge glow + the combo meter goes hot
export function fever(on) {
  document.body.classList.toggle("fever-on", on);
  $("combo-meter").classList.toggle("fever", on);
}

// ---------- mission tracker (top-left, under stats) ----------
let lastMissionKey = "", lastMissionTitle = "";
export function mission(m) {
  const el = $("mission-tracker");
  if (!m) { el.classList.add("hidden"); lastMissionKey = lastMissionTitle = ""; return; }
  el.classList.remove("hidden");
  const key = m.title + m.have + "/" + m.need;
  if (key === lastMissionKey) return;        // skip DOM churn when unchanged
  lastMissionKey = key;
  $("mt-title").textContent = m.title;
  $("mt-desc").innerHTML = m.desc + `  <b>${m.have}/${m.need}</b> · ${m.reward}¢`;
  $("mt-fill").style.width = Math.min(100, (m.have / m.need) * 100) + "%";
  if (m.title !== lastMissionTitle) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); lastMissionTitle = m.title; }
}

// ---------- on-screen compass arrow to the active waypoint ----------
const ARROWS = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
export function compass(target, pp, yaw, label) {
  const el = $("compass");
  if (!target) { el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  const bearing = Math.atan2(target.x - pp.x, target.z - pp.z);
  let rel = bearing - yaw + Math.PI;
  while (rel > Math.PI) rel -= Math.PI * 2;
  while (rel < -Math.PI) rel += Math.PI * 2;
  const idx = Math.round(-rel / (Math.PI / 4)) & 7;
  $("compass-arrow").textContent = ARROWS[idx];
  $("compass-label").textContent = label || "objective";
  $("compass-dist").textContent = Math.round(Math.hypot(target.x - pp.x, target.z - pp.z)) + " m";
}

// ---------- side-quest tracker (under the mission tracker) ----------
export function sideQuest(html) {
  const el = $("sidequest-tracker");
  if (!html) return el.classList.add("hidden");
  el.innerHTML = `<span class="sq-tag">SIDE</span>${html}`;
  el.classList.remove("hidden");
}

// ---------- courier job chip ----------
export function jobChip(html) {
  const el = $("job-chip");
  if (!html) return el.classList.add("hidden");
  el.innerHTML = html;
  el.classList.remove("hidden");
}

// ---------- rotating objectives panel ----------
export function renderObjectives(list) {
  const el = $("objectives");
  if (!list || !list.length) return el.classList.add("hidden");
  el.classList.remove("hidden");
  el.innerHTML = "<h5>CITY TASKS</h5>" + list.map(o =>
    `<div class="obj-row"><i style="width:${Math.min(100, (o.have / o.need) * 100)}%"></i><span>${o.label} <b>${o.have}/${o.need}</b> · ${o.reward}¢</span></div>`
  ).join("");
}

export function refreshStats() {
  $("st-food").textContent = state.counts.food;
  $("st-chip").textContent = state.counts.chip;
  $("st-mem").textContent = state.counts.mem;
  $("st-kit").textContent = Object.values(state.kittens).filter(v => v === "rescued").length;
  $("st-cred").textContent = state.counts.credits;
  $("lvl-badge").textContent = "LV " + state.level;
  $("xp-fill").style.width = Math.min(100, (state.xp / (state.level * 100)) * 100) + "%";
}

// ---------- modal ----------
export function showLore(title, body) {
  state.modal = "lore";
  document.exitPointerLock();
  $("modal-title").textContent = title;
  $("modal-body").innerHTML = `<p>${body}</p>`;
  $("modal").classList.remove("hidden");
}

export function openJournal() {
  state.modal = "journal";
  $("modal-title").textContent = "PAWPAW'S JOURNAL";
  let h = `<div class="j-section"><h4>COLLECTION</h4>
    <div class="j-line">holo-kibble ${state.counts.food}/${TOTALS.food}</div>
    <div class="j-line">data chips ${state.counts.chip}/${TOTALS.chip}</div>
    <div class="j-line">lost memories ${state.counts.mem}/${TOTALS.mem}</div>
    <div class="j-line">kittens rescued ${Object.values(state.kittens).filter(v => v === "rescued").length}/8</div>
    <div class="j-line">shrine level ${state.shrineLevel} · wisps caught ${state.stats.wisps} · ${(state.stats.dist / 1000).toFixed(1)} km on foot</div>
    <div class="j-line">courier jobs ${state.stats.jobs || 0} · best flow ×${state.stats.maxCombo || 0}</div>
  </div>`;
  // main mission progress
  const mi = Math.min(state.missionIdx, MISSIONS.length - 1);
  h += `<div class="j-section"><h4>MAIN STORY — mission ${mi + 1}/${MISSIONS.length}</h4>
    <div class="j-line done">▸ now: ${MISSIONS[mi].title} — ${MISSIONS[mi].desc}</div></div>`;
  // NPC side-quests
  h += `<div class="j-section"><h4>NPC QUESTS</h4>`;
  for (const q of SIDE_QUESTS) {
    const st = state.sideQuests[q.id];
    const label = st === "done" ? "✓ helped" : st === "found" ? "↩ return for reward" : st === "active" ? "… in progress" : "· not yet met";
    h += `<div class="j-line ${st === "done" ? "done" : ""}">${q.giver} — ${label}</div>`;
  }
  h += `</div>`;
  // named neighbors
  const metNeighbors = Object.keys(state.cityNpcs || {}).length;
  h += `<div class="j-section"><h4>NAMED NEIGHBORS ${metNeighbors}/${CITY_NPCS.length}</h4>`;
  for (const n of CITY_NPCS) {
    const met = state.cityNpcs[n.id];
    h += `<div class="j-line ${met ? "done" : ""}">${met ? "● " + n.name : "○ " + n.name} — ${n.topic}</div>`;
  }
  h += `</div>`;
  // discoveries
  const found = Object.keys(state.discoveries).length;
  h += `<div class="j-section"><h4>HIDDEN DISCOVERIES ${found}/${DISCOVERIES.length}</h4>`;
  for (const dc of DISCOVERIES) {
    const got = state.discoveries[dc.id];
    h += `<div class="j-line ${got ? "done" : ""}">${got ? "✦ " + dc.name : "◇ ??? — keep exploring"}</div>`;
  }
  h += `</div>`;
  // collection sets with progress bars
  const setsDone = COLLECTION_SETS.filter(s => state.flags["set_" + s.id]).length;
  h += `<div class="j-section"><h4>COLLECTION SETS ${setsDone}/${COLLECTION_SETS.length}</h4>`;
  for (const s of COLLECTION_SETS) {
    const done = state.flags["set_" + s.id];
    const have = Math.min(setProgress(s), s.need);
    h += `<div class="j-line ${done ? "done" : ""}">${done ? "★" : "☆"} ${s.name} — ${s.blurb} <b>${have}/${s.need}</b> · ${s.reward}¢</div>`;
  }
  h += `</div>`;
  h += `<div class="j-section"><h4>ACHIEVEMENTS</h4>`;
  for (const [id, name, desc] of ACH) {
    h += `<div class="j-line ${state.ach[id] ? "done" : ""}">${state.ach[id] ? "★" : "☆"} ${name} — ${desc}</div>`;
  }
  h += `</div><div class="j-section"><h4>DATA CHIP ARCHIVE</h4>`;
  let any = false;
  for (let i = 0; i < TOTALS.chip; i++) {
    if (!state.collected["c" + i]) continue;
    any = true;
    h += `<div class="j-line"><em>${CHIP_LORE[i % CHIP_LORE.length][0]}</em> — ${CHIP_LORE[i % CHIP_LORE.length][1]}</div>`;
  }
  if (!any) h += `<div class="j-line">no chips recovered yet — look on the rooftops</div>`;
  h += `</div><div class="j-section"><h4>MEMORY ARCHIVE</h4>`;
  any = false;
  for (let i = 0; i < TOTALS.mem; i++) {
    if (!state.collected["m" + i]) continue;
    any = true;
    h += `<div class="j-line"><em>${MEMORY_LORE[i % MEMORY_LORE.length][0]}</em> — ${MEMORY_LORE[i % MEMORY_LORE.length][1]}</div>`;
  }
  if (!any) h += `<div class="j-line">memories rest in the highest places of the city</div>`;
  h += `</div>`;
  $("modal-body").innerHTML = h;
  $("modal").classList.remove("hidden");
}

export function openShop(items, onBuy) {
  state.modal = "shop";
  document.exitPointerLock();
  $("modal-title").textContent = `MEI'S UPGRADES — ${state.counts.credits}¢`;
  const body = $("modal-body");
  body.innerHTML = "";
  for (const item of items) {
    const owned = !item.consumable && state.upgrades[item.id];
    const row = document.createElement("div");
    row.className = "shop-item" + (owned ? " owned" : "");
    row.innerHTML = `<div><div class="si-name">${item.name}</div><div class="si-desc">${item.desc}</div></div>`;
    const btn = document.createElement("button");
    btn.textContent = owned ? "OWNED" : item.cost + "¢";
    btn.disabled = owned || state.counts.credits < item.cost;
    btn.addEventListener("click", () => {
      if (onBuy(item)) openShop(items, onBuy);   // re-render with new balance
    });
    row.appendChild(btn);
    body.appendChild(row);
  }
  $("modal").classList.remove("hidden");
}

export function closeModal() {
  state.modal = null;
  $("modal").classList.add("hidden");
  $("modal-card").classList.remove("modal-wide");
}

export function nearbyHint(html) {
  const el = $("nearby-hint");
  if (!html) return el.classList.add("hidden");
  el.innerHTML = html;
  el.classList.remove("hidden");
}

// ---------- city map (M) ----------
import { ZONES } from "./data.js";

export function openMap(d) {
  state.modal = "map";
  document.exitPointerLock();
  $("modal-card").classList.add("modal-wide");
  $("modal-title").textContent = "CITY MAP";
  const body = $("modal-body");
  const mh = d.mission
    ? `<div class="map-mission">★ <b>${d.mission.title}</b> — ${d.mission.desc} <span>${d.mission.have}/${d.mission.need}</span></div>`
    : "";
  body.innerHTML = `${mh}
    <div class="map-wrap">
      <canvas id="map-canvas" width="600" height="600"></canvas>
      <div class="map-side">
        <div class="map-legend-title">DESTINATIONS</div>
        <div class="map-legend">
          <span><b style="color:#ffe14d">◆</b> mission goal</span>
          <span><b style="color:#ffb347">⌂</b> Paw Shrine</span>
          <span><b style="color:#ff2bd6">¢</b> Mei's shop</span>
          <span><b style="color:#aaff00">!</b> lost kitten</span>
          <span><b style="color:#9f7bff">?</b> hidden cache</span>
          <span><b style="color:#ffd24d">▣</b> courier board</span>
          <span><b style="color:#7befff">☻</b> quest NPC</span>
          <span><b style="color:#ff9fd8">●</b> named neighbor</span>
          <span><b style="color:#00f0ff">✦</b> active errand</span>
          <span><b style="color:#9f7bff">◇</b> undiscovered</span>
          <span><b style="color:#00f0ff">⌃</b> apex spire</span>
        </div>
        <div class="map-legend-title">ACTIVITIES</div>
        <div class="map-legend">
          <span><b style="color:#5ce8ff">z</b> zipline</span>
          <span><b style="color:#00f0ff">○</b> neon ring</span>
          <span><b style="color:#ff8a5c">▤</b> vending</span>
          <span><b style="color:#c8a8ff">▢</b> poster</span>
          <span><b style="color:#d6ff7b">✦</b> data wisp</span>
        </div>
        <div class="map-howto">
          <div class="map-legend-title">HOW TO PLAY</div>
          <p>Follow the <b style="color:#ffe14d">gold beam &amp; dashed route</b> to your mission.</p>
          <p>The <b>compass</b> at the top of the screen always points to it.</p>
          <p><b style="color:#ffb347">¢ credits</b> &amp; <b style="color:#ff2bd6">XP</b> come from collecting, delivering, scritching NPCs (E) and chaining a <b>FLOW combo</b>.</p>
          <p><b style="color:#00f0ff">F</b> meow · <b style="color:#00f0ff">E</b> interact · <b style="color:#00f0ff">X</b> dash · <b style="color:#00f0ff">Space</b> jump</p>
        </div>
      </div>
    </div>`;
  const cv = document.getElementById("map-canvas");
  const g = cv.getContext("2d");
  const W = 600, baseS = W / (d.city * 2);
  let zoom = 1;

  function render() {
    const S = baseS * zoom;
    // zoomed-out shows the whole city (centered on origin); zoomed-in follows you
    const cx = zoom > 1.05 ? d.player.x : 0;
    const cz = zoom > 1.05 ? d.player.z : 0;
    const px = x => W / 2 + (x - cx) * S;
    const pz = z => W / 2 + (z - cz) * S;

    g.fillStyle = "#05070e"; g.fillRect(0, 0, W, W);
    const vg = g.createRadialGradient(W / 2, W / 2, W * 0.2, W / 2, W / 2, W * 0.72);
    vg.addColorStop(0, "rgba(20,30,55,0.5)"); vg.addColorStop(1, "rgba(4,6,12,0)");
    g.fillStyle = vg; g.fillRect(0, 0, W, W);

    // district bands + labels
    for (const z of ZONES) {
      const col = "#" + z.color.toString(16).padStart(6, "0");
      g.fillStyle = col; g.globalAlpha = 0.11;
      g.fillRect(px(z.x0), 0, (z.x1 - z.x0) * S, W);
      g.globalAlpha = 0.5; g.strokeStyle = col; g.lineWidth = 1;
      g.strokeRect(px(z.x0), 1, (z.x1 - z.x0) * S, W - 2);
      g.globalAlpha = 0.8; g.fillStyle = col;
      g.font = "bold 9px 'Courier New', monospace"; g.textAlign = "center";
      g.fillText(z.name, px((z.x0 + z.x1) / 2), 14);
    }
    // street grid
    g.globalAlpha = 0.1; g.strokeStyle = "#4a5a7a"; g.lineWidth = 1;
    for (let v = -d.city + 17; v < d.city; v += 34) {
      g.beginPath(); g.moveTo(px(v), 0); g.lineTo(px(v), W); g.stroke();
      g.beginPath(); g.moveTo(0, pz(v)); g.lineTo(W, pz(v)); g.stroke();
    }
    g.globalAlpha = 1;

    // distance rings around YOU (50 / 100 / 150 m) — makes distances legible
    const pxX = px(d.player.x), pxZ = pz(d.player.z);
    g.strokeStyle = "rgba(120,170,220,0.22)"; g.lineWidth = 1;
    g.font = "9px 'Courier New', monospace"; g.textAlign = "left"; g.textBaseline = "middle";
    for (const m of [50, 100, 150]) {
      const rr = m * S;
      if (rr < 14 || rr > W) continue;
      g.beginPath(); g.arc(pxX, pxZ, rr, 0, 7); g.stroke();
      g.fillStyle = "rgba(150,190,230,0.5)";
      g.fillText(m + "m", pxX + 3, pxZ - rr + 7);
    }

    const dot = (x, z, color, r = 3) => { g.fillStyle = color; g.beginPath(); g.arc(px(x), pz(z), r, 0, 7); g.fill(); };
    const glyph = (x, z, ch, color, size = 15) => {
      g.font = `bold ${size}px 'Courier New', monospace`;
      g.textAlign = "center"; g.textBaseline = "middle";
      g.shadowColor = color; g.shadowBlur = 10; g.fillStyle = color;
      g.fillText(ch, px(x), pz(z)); g.shadowBlur = 0;
    };

    for (const r of d.rings || []) dot(r.x, r.z, "#00f0ff", 2);
    for (const v of d.vendings || []) dot(v.x, v.z, "#ff8a5c", 2);
    for (const p of d.posters || []) dot(p.x, p.z, "#c8a8ff", 2);
    for (const zl of d.ziplines || []) glyph(zl.x, zl.z, "z", "#5ce8ff", 12);
    if (d.wisp) glyph(d.wisp.x, d.wisp.z, "✦", "#d6ff7b", 13);

    for (const b of d.boards || []) glyph(b.x, b.z, "▣", "#ffd24d", 13);
    glyph(d.spire.x, d.spire.z, "⌃", "#00f0ff", 18);
    glyph(d.performer.x, d.performer.z, "♪", "#aaff00", 12);
    glyph(d.vendor.x, d.vendor.z, "¢", "#ff2bd6", 17);
    glyph(d.shrine.x, d.shrine.z, "⌂", "#ffb347", 18);
    for (const k of d.kittens) glyph(k.x, k.z, "!", "#aaff00", 16);
    for (const c of d.caches) glyph(c.x, c.z, "?", "#9f7bff", 15);
    for (const dc of d.discoveries || []) glyph(dc.x, dc.z, "◇", "#9f7bff", 11);
    for (const np of d.npcs || []) glyph(np.x, np.z, "☻", "#7befff", 15);
    for (const np of d.cityNpcs || []) glyph(np.x, np.z, np.met ? "○" : "●", np.met ? "#7f8fa8" : "#ff9fd8", 13);
    if (d.errand) glyph(d.errand.x, d.errand.z, "✦", "#00f0ff", 17);
    if (d.job) glyph(d.job.x, d.job.z, "▣", "#ffe14d", 16);

    // mission waypoint + dashed route + numeric distance
    if (d.mission && d.mission.target) {
      const t = d.mission.target;
      const dist = Math.round(Math.hypot(t.x - d.player.x, t.z - d.player.z));
      g.setLineDash([7, 7]); g.lineDashOffset = -(Date.now() / 60) % 14;
      g.strokeStyle = "rgba(255,225,77,0.7)"; g.lineWidth = 2.5;
      const route = d.route && d.route.length ? d.route : [d.player, t];
      g.beginPath();
      route.forEach((p, i) => {
        if (i === 0) g.moveTo(px(p.x), pz(p.z));
        else g.lineTo(px(p.x), pz(p.z));
      });
      g.stroke();
      g.setLineDash([]);
      const tx = px(t.x), tz = pz(t.z);
      g.shadowColor = "#ffe14d"; g.shadowBlur = 16; g.fillStyle = "#ffe14d";
      g.beginPath();
      g.moveTo(tx, tz - 9); g.lineTo(tx + 9, tz); g.lineTo(tx, tz + 9); g.lineTo(tx - 9, tz); g.closePath(); g.fill();
      g.strokeStyle = "#ffe14d"; g.lineWidth = 2;
      g.beginPath(); g.arc(tx, tz, 15, 0, 7); g.stroke();
      g.shadowBlur = 0;
      g.font = "bold 10px 'Courier New', monospace"; g.fillStyle = "#fff4d0"; g.textAlign = "center";
      g.fillText("GOAL " + dist + "m", tx, tz - 20);
    }

    // player arrow + YOU
    g.save();
    g.translate(pxX, pxZ);
    g.rotate(-d.player.yaw + Math.PI);
    g.shadowColor = "#ffffff"; g.shadowBlur = 12; g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(0, -10); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill();
    g.restore();
    g.shadowBlur = 0; g.fillStyle = "#cfe8ff"; g.font = "bold 9px 'Courier New', monospace"; g.textAlign = "center";
    g.fillText("YOU", pxX, pxZ + 20);

    // compass rose + zoom hint
    g.fillStyle = "rgba(0,0,0,0.4)"; g.beginPath(); g.arc(W - 30, 30, 18, 0, 7); g.fill();
    g.strokeStyle = "#5ce8ff"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(W - 30, 16); g.lineTo(W - 30, 44); g.stroke();
    g.fillStyle = "#5ce8ff"; g.font = "bold 11px 'Courier New', monospace"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("N", W - 30, 11);
    g.fillStyle = "rgba(150,190,230,0.6)"; g.font = "9px 'Courier New', monospace"; g.textAlign = "left";
    g.fillText("scroll / pinch to zoom · " + zoom.toFixed(1) + "×", 8, W - 10);
  }
  render();

  // scroll / two-finger / pinch to zoom the map
  cv.addEventListener("wheel", e => {
    e.preventDefault();
    const k = e.ctrlKey ? 0.014 : 0.0022;
    zoom = Math.max(1, Math.min(4, zoom - e.deltaY * k));
    render();
  }, { passive: false });

  $("modal").classList.remove("hidden");
}
