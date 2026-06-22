// ============ PAWPAW WORLD — INPUT & GAME LOOP ============
"use strict";

(function () {
  // ---------- input ----------
  const map = {
    ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
    KeyW: "up",
    ArrowDown: "down", KeyS: "down",
    Space: "sprint", ShiftLeft: "sprint", ShiftRight: "sprint",
    ArrowUp: "jump", KeyW: "up",
    KeyX: "dash", KeyK: "dash",
  };

  window.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
    const k = map[e.code];
    if (k && !e.repeat) {
      if (k === "jump") G.keys.jumpP = true;
      if (k === "dash") G.keys.dashP = true;
      if ((k === "up") && !G.keys.up) G.keys.jumpP = G.player && G.player.climbing ? G.keys.jumpP : G.keys.jumpP; // up is climb, not jump
    }
    if (k) G.keys[k] = true;
    if (e.repeat || !G.state.started) return;

    if (e.code === "Escape") { if (G.state.modal) G.ui.closeModal(); else if (G.state.photoMode) G.ui.setPhotoMode(false); }
    if (G.state.modal === "dialog" && (e.code === "KeyE" || e.code === "Enter")) { G.ui.closeDialog(); return; }
    if (e.code === "KeyM" && (G.state.modal === "map" || !G.state.modal)) { G.ui.toggleCityMap(); return; }
    if (e.code === "KeyJ" && (G.state.modal === "journal" || !G.state.modal)) { G.ui.toggleJournal(); return; }
    if (G.state.modal) return;

    if (e.code === "KeyE") G.doInteract();
    if (e.code === "KeyP") G.ui.setPhotoMode(!G.state.photoMode);
    if (e.code === "Enter" && G.state.photoMode) G.takePhoto();
  });
  window.addEventListener("keyup", e => { const k = map[e.code]; if (k) G.keys[k] = false; });
  window.addEventListener("blur", () => { for (const k in G.keys) G.keys[k] = false; });

  // ---------- boot ----------
  function boot() {
    G.buildWorld();
    G.initPlayer();
    G.initCitizens();
    G.initSystems();
    G.initActivities();
    G.initRender();
    G.ui.init();

    const had = G.loadGame();
    const note = document.getElementById("save-note");
    note.textContent = had ? "◉ SAVE FOUND — your city remembers you" : "◉ NEW WANDER — progress saves automatically";
    if (had) G.ui.refreshAbilities();

    document.getElementById("btn-start").addEventListener("click", () => {
      G.audio.init();
      if (G.audio.ctx && G.audio.ctx.state === "suspended") G.audio.ctx.resume();
      document.getElementById("title-screen").style.display = "none";
      G.state.started = true;
      setTimeout(() => {
        if (!had) G.ui.guide(G.GUIDE.intro, 10);
        else G.earn(25, "welcome back, PawPaw");
      }, 1200);
    });

    requestAnimationFrame(loop);
  }

  // ---------- loop ----------
  let last = performance.now(), saveT = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05; // clamp tab-switch spikes

    if (G.state.started) {
      G.updateSystems(dt);
      G.updateCitizens(dt);
      G.updatePlayer(dt);
      if (!G.state.modal) { G.updateActivities(dt); G.updateProgression(dt); G.updateMeta(dt); }
      G.ui.update(dt);
      G.ui.updatePhotoTarget();
      saveT += dt;
      if (saveT > 8) { saveT = 0; G.saveGame(); }
    } else {
      // idle world simulation behind the title screen
      G.updateSystems(dt);
      G.updateCitizens(dt);
    }
    G.render(dt);
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
