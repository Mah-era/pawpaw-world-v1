// ============ PAWPAW WORLD — CITY GENERATION ============
"use strict";

G.world = {
  solids: [], oneways: [], ladders: [], ziplines: [], wires: [],
  buildings: [], props: [], signs: [], holos: [],
  teleports: [], landmarks: [], doors: [], beams: [],
};

// Building specs: [x, w, h(above street), style]
G.BUILDINGS = [
  // --- back alleys ---
  [60, 340, 900, "alley"], [500, 280, 1250, "alley"], [880, 380, 750, "alley"],
  [1360, 300, 1500, "alley"], [1760, 360, 1000, "alley"], [2220, 300, 1350, "alley"],
  // --- neon market ---
  [2700, 420, 950, "market"], [3270, 360, 1300, "market"], [3780, 460, 800, "market"],
  [4390, 380, 1450, "market"], [4920, 420, 1050, "market"], [5490, 380, 1600, "market"],
  [6020, 440, 900, "market"],
  // --- transit plaza ---
  [6600, 700, 500, "plaza"],
  // --- corporate ---
  [7460, 500, 2000, "corp"], [8120, 480, 2350, "corp"], [8760, 520, 1800, "corp"],
  [9460, 460, 2100, "corp"], [10080, 480, 1700, "corp"],
  // --- old docks ---
  [10700, 600, 600, "dock"], [11380, 500, 750, "dock"], [11950, 550, 500, "dock"],
];

// Underground street holes: [x, width]
G.UG_HOLES = [[1280, 100], [4800, 100], [6900, 100], [9330, 100], [11305, 80]];

G.SIGN_TEXTS = ["RAMEN", "ネオン", "BYTE BAR", "电子城", "HOTEL∞", "SUSHI-9", "DATA SPA",
  "猫CAFE", "VR ROOM", "PAW★MART", "GRID TAXI", "SYNTH BAR", "ARCADE", "NOODLE+",
  "CYBERDOC", "万事屋", "GHOST GIN", "OPTIC LAB", "TUNA仙", "MEOW.EXE"];
G.SIGN_COLORS = ["#ff2bd6", "#00f0ff", "#aaff00", "#ffb347", "#ff5e5e", "#7b61ff", "#4dffc4"];

G.rectsOverlap = (a, b) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

G.solidsNear = function (x, y, r) {
  const out = [];
  for (const s of G.world.solids)
    if (Math.abs(s.x + s.w / 2 - x) < r + s.w / 2 && Math.abs(s.y + s.h / 2 - y) < r + s.h / 2) out.push(s);
  for (const d of G.world.doors) if (!d.open) {
    if (Math.abs(d.x + d.w / 2 - x) < r + d.w / 2 && Math.abs(d.y + d.h / 2 - y) < r + d.h / 2) out.push(d);
  }
  return out;
};

G.buildWorld = function () {
  const W = G.world, C = G.CFG, SY = C.STREET_Y, rng = G.makeRng(1337);
  const S = (x, y, w, h, type) => { const r = { x, y, w, h, type }; W.solids.push(r); return r; };
  const O = (x, y, w, type) => { const r = { x, y, w, h: 10, type }; W.oneways.push(r); return r; };
  const L = (x, y, h, type) => { const r = { x, y, w: 26, h, type }; W.ladders.push(r); return r; };

  // ----- world borders & bedrock -----
  S(-80, -400, 80, C.WORLD_H + 400, "border");
  S(C.WORLD_W, -400, 80, C.WORLD_H + 400, "border");
  S(-80, C.UNDER_Y, C.WORLD_W + 160, 240, "bedrock"); // underground floor

  // ----- street slab with underground holes -----
  let sx = 0;
  for (const [hx, hw] of G.UG_HOLES) {
    S(sx, SY, hx - sx, 120, "street");
    L(hx + hw / 2 - 13, SY, C.UNDER_Y - SY, "ugladder");
    sx = hx + hw;
  }
  S(sx, SY, C.WORLD_W - sx, 120, "street");

  // ----- buildings -----
  G.BUILDINGS.forEach((spec, i) => {
    const [bx, bw, bh, style] = spec;
    const roofY = SY - bh;
    const b = { i, x: bx, y: roofY, w: bw, h: bh, style, seed: 1000 + i * 77, ac: [], deco: [] };
    W.buildings.push(b);

    if (i === 2) {
      // Forgotten Room: pocket carved at ground floor (880..1260)
      S(bx, roofY, bw, bh - 160, "bldg");                 // upper body
      S(bx, SY - 160, 60, 160, "bldg");                   // left pillar
      S(bx + bw - 60, SY - 160, 60, 160, "bldg");         // right pillar
      W.doors.push({ id: "room", x: bx + 60, y: SY - 160, w: 20, h: 160, open: false });
    } else if (i === 13) {
      // Transit station: roof slab + columns, open hall
      S(bx, roofY, bw, 40, "bldg");
      S(bx + 20, roofY + 40, 40, bh - 40, "bldg");
      S(bx + bw - 60, roofY + 40, 40, bh - 40, "bldg");
      b.station = true;
    } else {
      S(bx, roofY, bw, bh, "bldg");
    }

    // rooftop AC units (solid, jumpable)
    const nAc = 1 + Math.floor(rng() * 3);
    for (let a = 0; a < nAc; a++) {
      const aw = 50 + rng() * 50, ax = bx + 20 + rng() * (bw - aw - 40), ah = 34 + rng() * 22;
      if (i === 13) continue;
      b.ac.push(S(ax, roofY - ah, aw, ah, "ac"));
    }
    // water tower on tall roofs
    if (bh > 1100 && rng() < 0.55 && i !== 15) {
      const tx = bx + bw * 0.62;
      b.tower = { x: tx, y: roofY };
      O(tx - 8, roofY - 150, 96, "platform"); // tower top walkable
    }
    if (bh > 800 && rng() < 0.6) b.antennaSmall = bx + bw * 0.25;
  });

  // ----- fire escapes in alley gaps (zig-zag oneway ledges) -----
  const esc = (wallX, side, yFrom, yTo) => {
    for (let y = yFrom; y > yTo; y -= 170) O(side < 0 ? wallX - 64 : wallX, y, 64, "escape");
  };
  for (let i = 0; i < 5; i++) { // gaps between alley buildings 0..5
    const a = G.BUILDINGS[i], b = G.BUILDINGS[i + 1];
    const topY = Math.min(SY - a[2], SY - b[2]) + 150;
    let level = SY - 200, side = i % 2 === 0 ? -1 : 1;
    while (level > topY) {
      if (side < 0) O(a[0] + a[1] - 64 + 64, level, 64, "escape"); // on right wall of a, inside gap
      else O(b[0] - 64, level, 64, "escape");                       // on left wall of b
      side *= -1; level -= 170;
    }
  }
  // market gap ledges (sparser, wider gaps)
  for (let i = 6; i < 12; i++) {
    const a = G.BUILDINGS[i], b = G.BUILDINGS[i + 1];
    const topY = Math.min(SY - a[2], SY - b[2]) + 170;
    let level = SY - 240, side = -1;
    while (level > topY) {
      if (side < 0) O(a[0] + a[1], level, 70, "escape");
      else O(b[0] - 70, level, 70, "escape");
      side *= -1; level -= 165;
    }
  }
  // corporate ascent: window-washer platforms on C0 left wall (idx 14)
  for (let y = SY - 280; y > 810; y -= 160) O(7460 - 90, y, 90, "washer");
  // C4 right wall descent (idx 18, ends 10560)
  for (let y = 1180; y < SY - 200; y += 160) O(10560, y, 90, "washer");
  // Apex left-wall balconies: C0 roof (800) -> Apex roof (450)
  O(8120 - 70, 700, 70, "balcony"); O(8120 - 70, 560, 70, "balcony");
  // ledge to step off wire2 onto M3 wall
  O(4390 - 70, 1500, 70, "balcony");

  // ----- pipes (climbable) on some walls -----
  L(8600, 470, 1230, "pipe");                 // Apex right wall: the spire climb
  L(880 - 26, 2050 + 60, 690 - 60, "pipe");   // alley bldg 2 left wall
  L(2220 + 300, 1450 + 80, 1270 - 80, "pipe");// A5 right wall
  L(3780 - 26, 2000 + 80, 720 - 80, "pipe");  // M2 left wall
  L(6020 + 440, 1900 + 80, 820 - 80, "pipe"); // M6 right wall
  L(10700 - 26, 2200 + 60, 540 - 60, "pipe"); // D0 left wall
  L(9460 - 26, 700, 390, "ladder");           // skybridge -> C3 roof
  L(9254, 1000, 90, "ladder"); // C2 right edge stub (bridge->roof)

  // ----- skybridge between C2 and C3 -----
  S(9270, 1080, 200, 14, "bridge");

  // ----- balance wires (flat, walkable) -----
  W.wires.push({ x1: 2120, x2: 2700, y: 1852 }); // A4 roof -> M0 roof
  W.wires.push({ x1: 3630, x2: 4390, y: 1500 }); // M1 roof -> M3 balcony
  W.wires.push({ x1: 2520, x2: 3270, y: 1500 }); // A5 roof -> M1 roof
  for (const w of W.wires) O(w.x1, w.y, w.x2 - w.x1, "wire");

  // ----- ziplines (ride downhill, jump to detach) -----
  const Z = (x1, y1, x2, y2) => W.ziplines.push({ x1, y1, x2, y2 });
  Z(1655, 1310, 1790, 1810);   // A3 -> A4
  Z(505, 1560, 160, 1910);     // A1 -> A0
  Z(3625, 1510, 3950, 2010);   // M1 -> M2
  Z(4765, 1360, 5100, 1760);   // M3 -> M4
  Z(5865, 1210, 6240, 1910);   // garden -> M6
  Z(6455, 1910, 6850, 2310);   // M6 -> station roof
  Z(8595, 470, 8790, 1010);    // Apex -> C2
  Z(9915, 710, 10110, 1110);   // C3 -> C4
  Z(7465, 810, 7090, 2290);    // C0 -> station roof (the long one)
  Z(12315, 1260, 12150, 2310); // mast -> D2 roof

  // ----- Apex antenna + Heartbeat Mast (legendary climbs) -----
  S(8330, 230, 70, 12, "antplat");            // apex antenna platform
  L(8355, 242, 208, "ladder");                // 242..450 antenna ladder
  S(12305, 1200, 50, 14, "antplat");          // mast top platform
  S(12320, 1214, 20, SY - 1214, "mast");      // mast column
  L(12340, 1214, SY - 1214, "ladder");        // mast ladder full height
  G.world.mast = { x: 12330, top: 1200 };

  // ----- hacker den (underground pocket behind door) -----
  S(5170, 2920, 30, 380, "ugwall");           // wall above door
  W.doors.push({ id: "den", x: 5170, y: 3300, w: 30, h: 160, open: false });
  S(5560, 2920, 30, 540, "ugwall");           // den far wall

  // ----- underground platforms & pipes -----
  for (let x = 7600; x < 9200; x += 420) { O(x, 3320, 130, "ugplat"); O(x + 210, 3170, 130, "ugplat"); }
  O(2050, 3330, 160, "ugplat"); O(2350, 3210, 140, "ugplat");
  O(3300, 3300, 150, "ugplat"); O(10200, 3300, 160, "ugplat"); O(10550, 3180, 140, "ugplat");

  // ----- beam lift (activated by corp terminal) -----
  W.beams.push({ id: "corp", x: 9930, y: 700, w: 50, h: SY - 700, on: false });

  // ----- street props -----
  const P = (type, x, extra) => W.props.push(Object.assign({ type, x, y: SY }, extra));
  // market stalls in gaps (awning walkable)
  const stallX = [3160, 3680, 4280, 4810, 5390, 5915];
  stallX.forEach((x, i) => {
    P("stall", x, { color: G.SIGN_COLORS[i % 7], name: ["NOODLE-9", "TUNA仙", "SYNTH FRUIT", "HOT BUNS", "GRID TEA", "MOCHI+"][i] });
    O(x - 55, SY - 130, 110, "awning");
  });
  // dumpsters & crates in alleys (jump starters)
  [[420, "dumpster"], [820, "crate2"], [1300, "dumpster"], [1690, "crate2"], [2140, "dumpster"], [2560, "crate2"]]
    .forEach(([x, t]) => {
      if (t === "dumpster") S(x, SY - 70, 90, 70, "dumpster");
      else { S(x, SY - 60, 60, 60, "crate"); S(x + 12, SY - 110, 44, 50, "crate"); }
    });
  [[2740, 1], [4440, 1], [7390, 1], [10620, 1], [11890, 1]].forEach(([x]) => S(x, SY - 110, 56, 110, "vending"));
  // decor-only props
  [3050, 4180, 5230, 6180, 7050, 8420, 9210, 10310, 11210, 12060].forEach(x => P("lamp", x));
  [1180, 2630, 6520, 9700, 11750].forEach(x => P("bench", x));
  [650, 1520, 2410].forEach(x => P("graffiti", x, { v: Math.floor(rng() * 3) }));
  P("shrine", 3320, { y: 1500 }); // paw shrine nook on M1 roof
  P("garden", 5680, { y: 1200 }); // rooftop garden decor cluster
  P("arcade", 2200, { y: C.UNDER_Y });
  P("line9", 6950, { y: C.UNDER_Y });
  P("denprops", 5380, { y: C.UNDER_Y });
  [10850, 11500, 12100].forEach(x => P("antfarm", x, { y: SY - (x === 11500 ? 750 : x === 10850 ? 600 : 500) }));

  // ----- neon signs -----
  let si = 0;
  W.buildings.forEach(b => {
    if (b.style === "market" || b.style === "alley") {
      W.signs.push({ x: b.x + 14, y: b.y + 120, text: G.SIGN_TEXTS[si % 20], color: G.SIGN_COLORS[si % 7], vertical: true, fl: rng() });
      si++;
      if (b.style === "market") {
        W.signs.push({ x: b.x + b.w * 0.5, y: SY - 180, text: G.SIGN_TEXTS[si % 20], color: G.SIGN_COLORS[(si + 3) % 7], vertical: false, fl: rng() });
        si++;
      }
    }
    if (b.style === "corp") {
      W.signs.push({ x: b.x + b.w * 0.5, y: b.y + 90, text: ["AXIOM", "HALCYON", "NEXIM", "VANTA", "KIRIN✦"][si % 5], color: "#4dd2ff", vertical: false, fl: 0, corp: true });
      si++;
    }
  });
  // mega billboard (lights up when hacked)
  W.megaSign = { x: 4390, y: 1100, w: 380, h: 130, on: false };

  // ----- holographic ads -----
  [[3470, 2350, "cat"], [4600, 2200, "ring"], [5680, 2300, "diamond"], [6950, 2150, "ring"],
   [8360, 1900, "diamond"], [9690, 2050, "cat"], [11650, 2350, "ring"]]
    .forEach(([x, y, t]) => W.holos.push({ x, y, type: t, ph: rng() * 6 }));

  // ----- teleport nodes -----
  const T = (id, name, x, y) => W.teleports.push({ id, name, x, y });
  T("market", "Market Plaza", 4600, SY);
  T("court", "Old Court", 1310, SY);
  T("plaza", "Transit Plaza", 6950, SY);
  T("corp", "Corporate Atrium", 9000, SY);
  T("docks", "Docks Gate", 11650, SY);
  T("garden", "Rooftop Garden", 5760, 1200);
  T("under", "Underground Junction", 4950, C.UNDER_Y);
  T("apex", "Apex Spire", 8300, 450);

  // ----- landmarks (discoveries) -----
  const LM = (id, name, x, y, r) => W.landmarks.push({ id, name, x, y, r });
  LM("noodle", "NOODLE ROW", 4200, 2740, 170);
  LM("apex", "THE APEX SPIRE", 8360, 500, 170);
  LM("garden", "ROOFTOP GARDEN", 5680, 1180, 150);
  LM("line9", "LINE 9 PLATFORM", 6950, 3400, 190);
  LM("den", "HACKER DEN", 5380, 3380, 150);
  LM("antfarm", "ANTENNA FARM", 11630, 2030, 170);
  LM("court", "THE OLD COURT", 1310, 2740, 150);
  LM("plaza", "TRANSIT PLAZA", 6950, 2730, 180);
  LM("deck", "OBSERVATION DECK", 9690, 680, 150);
  LM("room", "THE FORGOTTEN ROOM", 1000, 2740, 95);
  LM("arcade", "DROWNED ARCADE", 2200, 3400, 160);
  LM("bridge", "THE SKYBRIDGE", 9370, 1070, 120);
  LM("mast", "THE HEARTBEAT MAST", 12330, 1180, 130);
  LM("shrine", "PAW SHRINE", 3320, 1470, 90);
};
