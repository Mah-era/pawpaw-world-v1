// Builds a single self-contained HTML report with all screenshots inlined as base64.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "assets", "report", "images");
const PROJECT_NAME = "PawPaw-World-3D-v1";
const DEPLOY_URL = "https://mah-era.github.io/PawPaw-World-3D-v1/";
const REPORT_URL = "https://mah-era.github.io/PawPaw-World-3D-v1/docs/PAWPAW_WORLD_Report.html";
const REPO_URL = "https://github.com/Mah-era/PawPaw-World-3D-v1";
const cache = {};
function img(name) {
  if (cache[name]) return cache[name];
  const p = path.join(IMG_DIR, name + ".jpg");
  const b64 = fs.readFileSync(p).toString("base64");
  return (cache[name] = `data:image/jpeg;base64,${b64}`);
}
// figure: a captioned screenshot card
function fig(name, title, caption) {
  return `<figure class="shot"><img loading="lazy" src="${img(name)}" alt="${title}">
    <figcaption><b>${title}</b><span>${caption}</span></figcaption></figure>`;
}
function videoSrc(name) {
  const files = {
    opening: "vid_opening.webm",
    gameplay: "gameplay-complete.webm",
    pawpaw: "vid_pawpaw.webm",
  };
  if (!files[name]) throw new Error("Unknown video: " + name);
  return `../assets/report/videos/${files[name]}`;
}
// a captioned clip with a lightweight poster and external media source
function clip(name, title, caption) {
  const posters = { gameplay: "01_market_street", pawpaw: "angle_front" };
  const poster = posters[name] ? ` poster="${img(posters[name])}"` : "";
  return `<figure class="clip"><video data-clip="${name}" src="${videoSrc(name)}"${poster} playsinline controls preload="metadata"></video>
    <figcaption><b>${title}</b><span>${caption}</span></figcaption></figure>`;
}
// small still for the angle/emotion strip
function tile(name, label) {
  return `<figure class="tile"><img loading="lazy" src="${img(name)}" alt="${label}"><figcaption>${label}</figcaption></figure>`;
}

const GALLERY = [
  ["01_market_street", "Neon Market", "Warm food-stall district — lantern strings, a floating music note, wet magenta reflections."],
  ["02_plaza_shrine", "Transit Plaza", "The calm heart of the city: the Paw Shrine, fountain, and concentric floor rings."],
  ["03_back_alley", "Back Alleys", "Narrow, secretive lanes packed with clutter, crates, and steam."],
  ["04_corporate", "Corporate Sector", "Tall glass towers, ring-lit roofs, and sweeping searchlights."],
  ["05_docks", "Old Signal Docks", "A lonely antenna farm at the city's windswept edge."],
  ["07_apex_spire", "The Apex Spire", "A beaconed spire anchors the skyline, reached by a rising neon skyway."],
  ["08_zipline", "Rooftop Zipline", "Rideable cables carry PawPaw from high roofs to low ones."],
  ["24_rooftops", "Rooftop Traversal", "Climb routes and roof-to-roof bridges open up a whole upper city."],
  ["06_skyline_up", "City Skyline", "Looking up through the towers — bloom-lit windows and distant neon."],
  ["12_vendor", "Mei's Stall", "Spend credits on movement upgrades, snacks, and collar colors."],
  ["18_quest_npc", "Quest NPCs", "Named characters give interconnected side-errands with dialogue."],
  ["19_courier_board", "Courier District Route", "A wide delivery corridor through the building grid near a courier hub."],
  ["13_kitten", "Alley Objective Route", "A street-level approach through crates, service doors, and reflective lanes."],
  ["14_cache", "Secret-Hunting Route", "A quiet road segment leading toward the city's hidden discovery spaces."],
  ["16_blackout", "City Blackout", "A live world-event: the grid browns out to neon-only, then surges back."],
  ["20_wide_city", "Density", "A dense, handcrafted-feeling city that's always alive with motion."],
  ["21_market_alley2", "Market Lanes", "Glowing storefronts and overhead signage line the market."],
  ["22_plaza_wide", "Plaza Approach", "The mission compass and gold beam always point somewhere worth going."],
  ["25_corner_neon", "Street Corner", "Reflective wet asphalt mirrors the neon — image-based lighting at work."],
  ["17_restore", "Power Restored", "Back to full neon after a blackout event near a courier hub."],
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${PROJECT_NAME} — Project Report</title>
<style>
  :root{
    --bg:#0a0712; --bg2:#100a1d; --panel:rgba(22,14,38,.72); --border:rgba(255,255,255,.09);
    --magenta:#ff2bd6; --cyan:#00f0ff; --amber:#ffb347; --lime:#aaff00; --violet:#9f7bff;
    --ink:#e9e2f5; --muted:#a99fc4;
    --mono:"Courier New",ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--mono);line-height:1.65;}
  /* fixed neon wash that always covers the viewport (no background-attachment quirks) */
  .bgfx{position:fixed;inset:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(255,43,214,.12), transparent 60%),
      radial-gradient(900px 500px at 90% 20%, rgba(0,240,255,.08), transparent 60%),
      radial-gradient(900px 500px at 10% 70%, rgba(159,123,255,.07), transparent 60%),
      linear-gradient(var(--bg),var(--bg2));}
  .scan{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.22;
    background:repeating-linear-gradient(transparent 0 3px, rgba(0,0,0,.5) 3px 4px);}
  .wrap{position:relative;z-index:2;width:min(100% - 44px,1180px);margin-inline:auto;padding:0}
  a{color:var(--cyan);text-decoration:none}

  /* nav */
  nav{position:sticky;top:0;z-index:10;backdrop-filter:blur(10px);
    background:rgba(8,5,16,.7);border-bottom:1px solid var(--border)}
  nav .wrap{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap;padding-block:10px}
  nav b{color:var(--magenta);letter-spacing:3px;margin-right:auto;font-size:14px;
    text-shadow:0 0 14px rgba(255,43,214,.6)}
  nav a{font-size:11px;letter-spacing:1.5px;color:var(--muted);padding:5px 10px;border-radius:7px}
  nav a:hover{color:var(--ink);background:rgba(255,255,255,.06)}

  /* hero */
  header.hero{position:relative;text-align:center;padding:70px 0 50px;overflow:hidden}
  .kicker{font-size:12px;letter-spacing:6px;color:var(--cyan);opacity:.85;
    text-shadow:0 0 12px rgba(0,240,255,.6)}
  h1{font-size:clamp(44px,8vw,92px);line-height:.98;letter-spacing:6px;margin:14px 0 6px;
    background:linear-gradient(100deg,#ff2bd6 8%,#ff9fd8 28%,#00f0ff 56%,#aaff00 92%);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
    filter:drop-shadow(0 0 22px rgba(255,43,214,.45)) drop-shadow(0 0 40px rgba(0,240,255,.28))}
  .sub{color:var(--muted);letter-spacing:3px;font-size:14px;margin-bottom:30px}
  .hero-media{position:relative;max-width:860px;margin-inline:auto;border-radius:16px;overflow:hidden;border:1px solid var(--border);
    box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 60px rgba(255,43,214,.12)}
  .hero-media video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#05060d}
  .hero-media .frame{position:absolute;inset:0;pointer-events:none;
    box-shadow:inset 0 0 120px rgba(8,5,16,.55)}
  .hero-cap{display:grid;grid-template-columns:max-content 1fr;gap:16px;align-items:center;padding:10px 14px;
    color:var(--muted);font-size:11px;background:rgba(7,5,14,.92);text-align:left}
  .hero-cap b{color:var(--cyan);letter-spacing:1px}

  .chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:28px 0 0}
  .chip{font-size:12px;letter-spacing:1px;border:1px solid var(--border);border-radius:999px;
    padding:7px 14px;background:var(--panel);color:var(--muted)}
  .chip b{color:var(--amber)}

  /* sections */
  section{padding:54px 0;border-top:1px solid var(--border)}
  .eyebrow{color:var(--lime);letter-spacing:4px;font-size:12px;text-shadow:0 0 10px rgba(170,255,0,.4)}
  h2{font-size:clamp(26px,4vw,40px);letter-spacing:2px;margin:8px 0 6px}
  h2 .accent{color:var(--magenta)}
  .lead{color:var(--muted);max-width:780px;margin:0 0 26px}

  /* stat band */
  .stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:10px 0 6px}
  .stat{min-width:0;background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:16px 18px;
    border-left:3px solid var(--cyan)}
  .stat .n{font-size:30px;font-weight:bold;color:var(--cyan);text-shadow:0 0 18px rgba(0,240,255,.5)}
  .stat .l{font-size:11px;letter-spacing:1px;color:var(--muted);text-transform:uppercase}
  .stat:nth-child(2n){border-left-color:var(--magenta)}
  .stat:nth-child(2n) .n{color:var(--magenta);text-shadow:0 0 18px rgba(255,43,214,.5)}
  .stat:nth-child(3n){border-left-color:var(--amber)}
  .stat:nth-child(3n) .n{color:var(--amber);text-shadow:0 0 18px rgba(255,179,71,.5)}

  /* feature cards */
  .cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
  .card{min-width:0;height:100%;background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px 22px;
    transition:transform .2s,border-color .2s}
  .card:hover{transform:translateY(-3px);border-color:rgba(0,240,255,.35)}
  .card h3{margin:0 0 6px;font-size:17px;letter-spacing:1px}
  .card .tag{font-size:10px;letter-spacing:2px;color:var(--violet);text-transform:uppercase}
  .card p{margin:8px 0 0;color:var(--muted);font-size:14px}
  .ic{font-size:22px;filter:drop-shadow(0 0 8px currentColor)}

  /* video clips */
  .clips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
  .clip{width:100%;margin:0;background:#000;border-radius:14px;overflow:hidden;border:1px solid var(--border);
    box-shadow:0 16px 40px rgba(0,0,0,.55),0 0 40px rgba(255,43,214,.08)}
  .clip video{display:block;width:100%;aspect-ratio:16/10;object-fit:contain;background:#05060d}
  .clip figcaption{padding:12px 15px;background:linear-gradient(rgba(20,12,36,.4),rgba(10,7,18,.92))}
  .clip figcaption b{display:block;font-size:14px;letter-spacing:.5px}
  .clip figcaption span{font-size:12px;color:var(--muted)}
  .vid-hero{max-width:900px;margin-inline:auto}.vid-hero .clip video{aspect-ratio:16/9}

  /* pawpaw angle/emotion strip */
  .tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:stretch}
  .tile{min-width:0;margin:0;background:#000;border-radius:11px;overflow:hidden;border:1px solid var(--border)}
  .tile img{display:block;width:100%;aspect-ratio:16/10;object-fit:contain;background:#05060d}
  .tile figcaption{padding:8px 10px;font-size:11px;letter-spacing:1px;text-align:center;
    color:var(--muted);text-transform:uppercase;background:rgba(10,7,18,.8)}

  /* gallery */
  .gallery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
  .shot{min-width:0;margin:0;background:#000;border-radius:12px;overflow:hidden;
    border:1px solid var(--border);box-shadow:0 12px 30px rgba(0,0,0,.5)}
  .shot img{display:block;width:100%;aspect-ratio:16/10;object-fit:contain;background:#05060d}
  .shot figcaption{padding:10px 13px;background:linear-gradient(rgba(20,12,36,.5),rgba(10,7,18,.9))}
  .shot figcaption b{display:block;font-size:13px;letter-spacing:.5px;color:var(--ink)}
  .shot figcaption span{font-size:11.5px;color:var(--muted)}

  /* architecture */
  .arch{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;align-items:stretch}
  .mod{min-width:0;background:var(--panel);border:1px solid var(--border);border-radius:11px;padding:14px 16px}
  .mod .f{color:var(--cyan);font-size:13px;letter-spacing:1px}
  .mod p{margin:6px 0 0;font-size:12.5px;color:var(--muted)}
  .pipe{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:18px 0 0;font-size:12px;color:var(--muted)}
  .pipe .step{background:rgba(0,240,255,.08);border:1px solid rgba(0,240,255,.25);color:var(--ink);
    padding:6px 12px;border-radius:8px;letter-spacing:1px}
  .pipe .arw{color:var(--cyan)}

  /* tables */
  table{display:table;width:100%;border-collapse:collapse;font-size:13.5px;background:var(--panel);
    border:1px solid var(--border);border-radius:12px;overflow:hidden}
  th,td{text-align:left;padding:11px 16px;border-bottom:1px solid var(--border)}
  th{color:var(--amber);letter-spacing:1px;font-size:11px;text-transform:uppercase}
  td b{color:var(--cyan)}
  tr:last-child td{border-bottom:none}

  .two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px;align-items:stretch}
  .two>*{min-width:0;height:100%}
  @media(max-width:760px){.two{grid-template-columns:1fr}}
  .panel{background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:20px 22px}
  .panel h3{margin-top:0;letter-spacing:1px}
  ul.clean{list-style:none;padding:0;margin:0}
  ul.clean li{padding:6px 0 6px 22px;position:relative;color:var(--muted);font-size:14px}
  ul.clean li::before{content:"▸";position:absolute;left:0;color:var(--magenta)}

  .controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}
  .control{min-width:0;display:grid;grid-template-columns:86px 1fr;gap:12px;align-items:center;background:var(--panel);
    border:1px solid var(--border);border-radius:10px;padding:12px 14px}
  .control kbd{display:inline-block;text-align:center;padding:6px 8px;border:1px solid rgba(0,240,255,.35);
    border-bottom-width:3px;border-radius:6px;color:var(--cyan);background:#090611;font:700 11px var(--mono)}
  .control span{font-size:12px;color:var(--muted)}
  .progress-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:stretch}
  .progress-card{min-width:0;height:100%;background:var(--panel);border:1px solid var(--border);border-radius:11px;padding:16px}
  .progress-card h3{font-size:14px;margin:0 0 8px;color:var(--cyan)}
  .progress-card p{font-size:12.5px;color:var(--muted);margin:0}
  .weather-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:20px;align-items:stretch}
  .weather-card{min-width:0;height:100%;background:var(--panel);border:1px solid var(--border);border-top:3px solid var(--violet);
    border-radius:11px;padding:16px}
  .weather-card h3{margin:0 0 6px;font-size:15px}.weather-card p{margin:0;color:var(--muted);font-size:12.5px}
  .activity-table td:first-child{white-space:nowrap;color:var(--cyan);font-weight:bold}
  .subhead{font-size:13px;letter-spacing:3px;color:var(--amber);margin:24px 0 12px}

  @media(max-width:980px){
    .stats,.arch{grid-template-columns:repeat(2,minmax(0,1fr))}
    .cards,.controls,.progress-grid,.weather-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
    .tiles{grid-template-columns:repeat(3,minmax(0,1fr))}
    .gallery{grid-template-columns:repeat(2,minmax(0,1fr))}
  }
  @media(max-width:640px){
    .wrap{width:min(100% - 28px,1180px)}
    nav .wrap{justify-content:center}nav b{width:100%;margin:0;text-align:center}
    header.hero{padding:48px 0 38px}.kicker{letter-spacing:3px}h1{letter-spacing:2px}
    .hero-cap{grid-template-columns:1fr;gap:4px;text-align:center}.hero-cap span{text-align:center}
    .stats,.cards,.clips,.tiles,.gallery,.arch,.controls,.progress-grid,.weather-grid,.two{grid-template-columns:1fr}
    .control{grid-template-columns:76px 1fr}
    table{display:block;overflow-x:auto;white-space:normal}
    th,td{min-width:130px;padding:10px 12px}
    .activity-table td:first-child{white-space:normal}
  }

  footer{padding:40px 0 60px;text-align:center;color:var(--muted);font-size:12px;border-top:1px solid var(--border)}
  .glow{color:var(--cyan)}
</style>
</head>
<body>
<div class="bgfx"></div><div class="scan"></div>
<nav><div class="wrap">
  <b>◣ ${PROJECT_NAME}</b>
  <a href="#overview">OVERVIEW</a>
  <a href="#motion">VIDEO</a>
  <a href="#play">GAMEPLAY</a>
  <a href="#missions">MISSIONS</a>
  <a href="#progress">PROGRESS</a>
  <a href="#situations">SITUATIONS</a>
  <a href="#pawpaw">PAWPAW</a>
  <a href="#activities">ACTIVITIES</a>
  <a href="#gallery">GALLERY</a>
  <a href="#tech">TECH</a>
  <a href="#design">DESIGN</a>
</div></nav>

<header class="hero"><div class="wrap">
  <div class="kicker">▟ NEON CITY · CYBER-CAT ODYSSEY ▙</div>
  <h1>${PROJECT_NAME}</h1>
  <div class="sub">a fully 3D, non-combat cyberpunk cat exploration game — built in the browser</div>
  <p class="sub"><a href="${DEPLOY_URL}">Live deployment</a> · <a href="${REPORT_URL}">Project report</a> · <a href="${REPO_URL}">Public repository</a></p>
  <div class="hero-media">
    <video data-clip="opening" src="${videoSrc("opening")}" poster="${img("angle_title")}" autoplay loop muted playsinline controls preload="metadata" aria-label="Actual PawPaw-World-3D-v1 title-screen opening orbit"></video>
    <div class="frame"></div>
    <div class="hero-cap"><b>ACTUAL OPENING SCENE</b><span>Live title-screen camera orbit over Transit Plaza, the Paw Shrine, and the procedural skyline.</span></div>
  </div>
  <div class="chips">
    <span class="chip"><b>Three.js</b> · WebGL</span>
    <span class="chip"><b>Vanilla JS</b> · no build step</span>
    <span class="chip"><b>~60</b> fps</span>
    <span class="chip"><b>5</b> districts</span>
    <span class="chip"><b>Bloom + PBR</b> lighting</span>
    <span class="chip"><b>Procedural</b> city</span>
    <span class="chip">No paid systems · no gambling</span>
  </div>
</div></header>

<section id="overview"><div class="wrap">
  <div class="eyebrow">01 — OVERVIEW</div>
  <h2>A neon city that's <span class="accent">always alive</span></h2>
  <p class="lead">PawPaw is a green-eyed calico with one cybernetic eye, roaming a dense, rain-slicked
    cyberpunk city in full 3D from a third-person, mouse-look camera. There is no combat and no hard
    failure — the reward is exploration, small surprises, and a city packed with interconnected things
    to do. It began as a 2D Canvas game and was rebuilt into a real-time 3D experience with cinematic
    rendering, a reactive soundscape, a guided mission chain, NPC side-quests, and a deep web of
    activities and progression.</p>
  <div class="stats">
    <div class="stat"><div class="n">177+</div><div class="l">collectibles</div></div>
    <div class="stat"><div class="n">21</div><div class="l">main missions</div></div>
    <div class="stat"><div class="n">4</div><div class="l">NPC side-quests</div></div>
    <div class="stat"><div class="n">8</div><div class="l">named neighbors</div></div>
    <div class="stat"><div class="n">8</div><div class="l">hidden discoveries</div></div>
    <div class="stat"><div class="n">8</div><div class="l">lost kittens</div></div>
    <div class="stat"><div class="n">5</div><div class="l">collection sets</div></div>
    <div class="stat"><div class="n">10</div><div class="l">rotating tasks</div></div>
    <div class="stat"><div class="n">∞</div><div class="l">courier jobs</div></div>
  </div>
</div></section>

<section id="motion"><div class="wrap">
  <div class="eyebrow">02 — IN MOTION</div>
  <h2>Actual gameplay, <span class="accent">recorded live</span></h2>
  <p class="lead">Captured from the running game rather than staged renders. The main reel shows
    third-person keyboard movement and mouse-look navigation with the live HUD, mission compass,
    street population, wet lighting, and traversal. The opening orbit is placed directly below the
    game name; PawPaw's complete turn-and-expression study has its own dedicated section.</p>
  <div class="vid-hero" style="margin-bottom:18px">
    ${clip("gameplay","gameplay-complete — Keyboard + Mouse","Gameplay video added from local-media/gameplay-complete.mov as the deployment-ready assets/report/videos/gameplay-complete.webm. Use the timeline to inspect missions, rescue, NPC interaction, weather, traversal, map, journal, and progression systems.")}
  </div>
  <div class="progress-grid">
    <div class="progress-card"><h3>Mission + Rescue</h3><p>Active mission HUD, compass/beam guidance, lost-kitten pickup, carrying, shrine return, reward, and shrine progression.</p></div>
    <div class="progress-card"><h3>NPC Interaction</h3><p>Quest markers, E-key conversation, dialogue modal, multi-step errand tracking, named neighbors, and citizen scritches.</p></div>
    <div class="progress-card"><h3>Rain + Atmosphere</h3><p>Rain-state ambience, wet-road reflections, fog/haze depth, dynamic lighting, blackout, and power restoration.</p></div>
    <div class="progress-card"><h3>Traversal</h3><p>Keyboard movement plus mouse-look, sprint, jump, double-jump, dash, glide, rooftop routes, rings, and ziplines.</p></div>
    <div class="progress-card"><h3>Work + Rewards</h3><p>Courier board, timed job, delivery streak, rotating tasks, FLOW/FEVER, credits, XP, level-up, and shop upgrades.</p></div>
    <div class="progress-card"><h3>Navigation + Records</h3><p>Routed city map, nearby activity hint, district markers, journal, collections, discoveries, achievements, and save state.</p></div>
  </div>
</div></section>

<section id="play"><div class="wrap">
  <div class="eyebrow">03 — GAMEPLAY &amp; SYSTEMS</div>
  <h2>Layered loops that <span class="accent">reinforce each other</span></h2>
  <p class="lead">Every quick action funnels through one event hook, so a single kibble grab can tick a
    rotating task, extend a combo, and happen mid-delivery. There is always something nearby to chase,
    collect, climb, or complete.</p>
  <div class="subhead">KEYBOARD + MOUSE NAVIGATION</div>
  <div class="controls">
    <div class="control"><kbd>Mouse</kbd><span>Look around with smoothed third-person camera control and automatic wall avoidance.</span></div>
    <div class="control"><kbd>W A S D</kbd><span>Move relative to the camera; combine keys for diagonal navigation.</span></div>
    <div class="control"><kbd>Shift</kbd><span>Sprint through streets and build momentum between activities.</span></div>
    <div class="control"><kbd>Space</kbd><span>Jump, double-jump after unlock, or hold while falling to glide after upgrade.</span></div>
    <div class="control"><kbd>X</kbd><span>Teleport-dash toward the camera heading after collecting 10 kibble.</span></div>
    <div class="control"><kbd>E</kbd><span>Interact: NPC dialogue, kittens, shrine, posters, vending, courier boards, ziplines, caches, and shop.</span></div>
    <div class="control"><kbd>F</kbd><span>Meow to animate PawPaw, alert citizens, and scatter nearby pigeons.</span></div>
    <div class="control"><kbd>M / J</kbd><span>Open the routed city map or the full progress journal.</span></div>
  </div>
  <div class="subhead">CORE GAMEPLAY LOOPS</div>
  <div class="cards">
    <div class="card"><div class="tag">guided story</div><h3><span class="ic" style="color:#ffe14d">★</span> Main Mission Chain</h3>
      <p>Twenty authored missions plus a repeatable courier tail. One is always active, marked by a gold beam, compass, HUD tracker, and street-following map route.</p></div>
    <div class="card"><div class="tag">characters</div><h3><span class="ic" style="color:#00f0ff">☻</span> NPC Side-Quests</h3>
      <p>Solder → Vega → Patch → Jin: four multi-step quest chains with dialogue and staged destinations. Eight additional named neighbors provide conversations, rewards, and mission progress.</p></div>
    <div class="card"><div class="tag">rush</div><h3><span class="ic" style="color:#ff8c1a">⚡</span> FLOW Combo &amp; FEVER</h3>
      <p>Chain quick actions to build a FLOW combo. Hit ×10 and ignite <b>FEVER</b> — a credit-doubling rush with a molten screen vignette and the music driving into double-time.</p></div>
    <div class="card"><div class="tag">work</div><h3><span class="ic" style="color:#ffd24d">▣</span> Courier Jobs</h3>
      <p>Timed deliveries from courier boards, with a destination beam, distance, and countdown. Back-to-back runs build a streak multiplier; miss one and it resets.</p></div>
    <div class="card"><div class="tag">play</div><h3><span class="ic" style="color:#aaff00">🐾</span> Pounce &amp; Hunt</h3>
      <p>Dive into a pigeon flock from the air or a dash for a <b>POUNCE!</b> bonus — credits, XP, and combo — turning the city's wildlife into a playful mechanic.</p></div>
    <div class="card"><div class="tag">discovery</div><h3><span class="ic" style="color:#9f7bff">◆</span> Hidden Areas</h3>
      <p>Eight secret spots tucked in alley dead-ends and on rooftops you must climb to reach — each reveals a piece of city lore plus credits and XP.</p></div>
    <div class="card"><div class="tag">collection</div><h3><span class="ic" style="color:#ffb347">▦</span> Collection Sets</h3>
      <p>Five themed sets (Full Belly, Neon Archive, Memory Lane, Den Family, Vault Breaker) with big one-time completion bonuses tracked in the journal.</p></div>
    <div class="card"><div class="tag">living world</div><h3><span class="ic" style="color:#ff2bd6">🎉</span> Street Events</h3>
      <p>The city surprises you: neon-sign shorts, courier-drone drops, data-wisp swarms, pop-up street festivals, and full city blackouts that brown out the grid to neon-only.</p></div>
    <div class="card"><div class="tag">economy</div><h3><span class="ic" style="color:#ffb347">¢</span> Upgrades &amp; XP</h3>
      <p>Credits and XP pour in from everything. Spend at Mei's stall on sprint/jump/dash, gliding, and a kibble magnet; level up and chase achievements.</p></div>
  </div>
  <div class="two" style="margin-top:26px">
    ${fig("16_blackout","Live event: City Blackout","A real captured frame — the grid dims to neon-only, then surges back.")}
    ${fig("18_quest_npc","Interconnected NPCs","Each quest-giver glows with a marker and links to the next character's story.")}
  </div>
</div></section>

<section id="missions"><div class="wrap">
  <div class="eyebrow">04 — MISSIONS &amp; TASKS</div>
  <h2>From first steps to <span class="accent">city legend</span></h2>
  <p class="lead">The main chain deliberately tours every major system instead of repeating one
    objective type. Alongside it, three rotating city tasks are always active and replace themselves
    immediately when completed.</p>
  <table>
    <tr><th>Chapter</th><th>Missions</th><th>What they teach</th></tr>
    <tr><td><b>Orientation</b></td><td>First Steps · Hungry Paws · Meet Mei · Light Footed</td><td>Shrine, collecting, shop, jumping and rings</td></tr>
    <tr><td><b>City Work</b></td><td>Found Family · On the Clock · Top of the World · City Secrets</td><td>Kitten rescue, courier jobs, climbing, caches</td></tr>
    <tr><td><b>Street Skills</b></td><td>Wire Walker · Street Stories · Signal's Edge · Den Mother</td><td>Ziplines, posters, docks, shrine progression</td></tr>
    <tr><td><b>Neighborhood</b></td><td>Neighbor Network · Backstreet Truths · Flow Training · Street Reputation</td><td>Named NPCs, discoveries, combo, leveling</td></tr>
    <tr><td><b>Final Run</b></td><td>Poster Run · Catch the Static · Trusted Paws · All Kittens Home</td><td>Lore, wisps, delivery mastery, full rescue</td></tr>
    <tr><td><b>Endless Tail</b></td><td>City Courier</td><td>Repeatable three-delivery city loop</td></tr>
  </table>
  <div class="two" style="margin-top:22px">
    <div class="panel"><h3>Rotating city tasks: 3 active at once</h3>
      <ul class="clean">
        <li>Collect holo-kibble</li><li>Jump through neon rings</li><li>Knock over cans</li>
        <li>Ride ziplines</li><li>Catch data wisps</li><li>Scatter pigeon flocks</li>
        <li>Tap vending machines</li><li>Complete courier jobs</li><li>Teleport-dash</li><li>Scan posters</li>
      </ul></div>
    <div class="panel"><h3>NPC quest structure</h3>
      <p style="color:var(--muted);font-size:13px">Four gated, multi-step character chains use offer → active steps → return → complete states. A cyan beam and side tracker point to the current step, while completion unlocks the next character.</p>
      <p style="color:var(--muted);font-size:13px">Eight named neighbors add shorter conversations and first-meeting rewards, making each district feel inhabited outside the formal quest chain.</p></div>
  </div>
</div></section>

<section id="pawpaw"><div class="wrap">
  <div class="eyebrow">05 — MEET PAWPAW</div>
  <h2>One cat, <span class="accent">every angle &amp; mood</span></h2>
  <p class="lead">PawPaw is a soft, round calico — white fur with black &amp; ginger patches, green eyes,
    cheek fluff, a pink nose, and a red bell collar — built from smooth high-poly primitives and
    animated with squash-and-stretch, a walk gait, blinking, and emotive squints.</p>
  <div class="vid-hero" style="margin-bottom:22px">
    ${clip("pawpaw","PawPaw — Complete 360° Character Study","A continuous in-engine turn around the modeled cat, followed by live expression states: reward squint, meow pose, blink, ear movement, tail motion, and the seated idle.")}
  </div>
  <div class="subhead">360° MODEL VIEWS</div>
  <div class="tiles">
    ${tile("angle_front","Front")}
    ${tile("angle_threeq","Three-quarter")}
    ${tile("angle_side","Side")}
    ${tile("angle_back","Rear")}
    ${tile("angle_low","Low hero")}
  </div>
  <div class="subhead">LIVE EMOTION STATES</div>
  <div class="tiles">
    ${tile("emo_happy","Happy")}
    ${tile("emo_meow","Meow")}
    ${tile("emo_sit","Sleepy sit")}
  </div>
  <div class="two" style="margin-top:22px">
    ${fig("emo_happy","Emotive reactions","Eyes squint and ears perk on a reward or a meow; lids droop when idle.")}
    ${fig("angle_low","Built for personality","Cheek fluff, banded tail, and a glowing collar tag read clearly even up close.")}
  </div>
</div></section>

<section id="activities"><div class="wrap">
  <div class="eyebrow">06 — ACTIVITIES &amp; MICRO-INTERACTIONS</div>
  <h2>The city is <span class="accent">dense with things to do</span></h2>
  <p class="lead">Beyond the headline systems, the world is layered with small, repeatable interactions —
    there is always something within reach to collect, tap, scan, climb, scatter, or scritch.</p>
  <div class="cards" style="margin-bottom:22px">
    <div class="card"><div class="tag">collect</div><h3><span class="ic" style="color:#aaff00">✦</span> Data Wisps</h3>
      <p>Fleeing fragments of the scattered city AI drift through the streets — chase them down before they dissipate for a quick payout.</p></div>
    <div class="card"><div class="tag">collect</div><h3><span class="ic" style="color:#ffb347">●</span> Kibble · Chips · Memories</h3>
      <p>140 holo-kibble (10 unlocks the dash, 25 the double-jump), 18 data chips, and 10 lost memories — each chip &amp; memory adds a lore entry.</p></div>
    <div class="card"><div class="tag">tap</div><h3><span class="ic" style="color:#ff8a5c">▤</span> Vending &amp; Posters</h3>
      <p>Tap vending machines for loose credits and scan glowing lore posters to piece together the city's story.</p></div>
    <div class="card"><div class="tag">leap</div><h3><span class="ic" style="color:#00f0ff">◎</span> Neon Rings &amp; Cans</h3>
      <p>Jump through neon rings and knock over cans for combo fuel — small inputs that keep a FLOW chain alive.</p></div>
    <div class="card"><div class="tag">climb</div><h3><span class="ic" style="color:#ffd24d">⌃</span> Parkour &amp; Climbing</h3>
      <p>Pawprints and glowing crates mark a route up almost every building — fire escapes, awnings, balconies, roof-bridges, and ziplines.</p></div>
    <div class="card"><div class="tag">play</div><h3><span class="ic" style="color:#ff9fd8">🐾</span> Scritch &amp; Meow</h3>
      <p>Walk up to a passer-by and give them a friendly scritch, or meow (F) to scatter pigeons and make the whole street react.</p></div>
    <div class="card"><div class="tag">ambient</div><h3><span class="ic" style="color:#9fd8ff">⛆</span> Weather &amp; Day/Night</h3>
      <p>A day/night cycle and drifting rain shift the mood, with wet streets that double the neon in their reflections.</p></div>
    <div class="card"><div class="tag">life</div><h3><span class="ic" style="color:#ff2bd6">☻</span> A Living City</h3>
      <p>Walking citizens and robots, hover-car traffic, patrol drones, pigeon flocks, an elevated train, and a sometimes-ghost train.</p></div>
    <div class="card"><div class="tag">navigate</div><h3><span class="ic" style="color:#ffe14d">M</span> Map &amp; Journal</h3>
      <p>An information-rich city map with a route, distance rings, and markers, plus a journal tracking collection, quests, discoveries, and achievements.</p></div>
  </div>
  <div class="gallery">
    ${fig("12_vendor","Mei's Upgrade Stall","A permanent shop for movement upgrades, consumable snacks, and collar colors.")}
    ${fig("18_quest_npc","Quest NPC Encounter","Named quest-givers anchor multi-step errands across the districts.")}
    ${fig("19_courier_board","Courier District Route","A clear street corridor used by timed deliveries between city landmarks.")}
    ${fig("08_zipline","Rooftop Zipline","Rideable rooftop cables create fast traversal lines across the city.")}
    ${fig("13_kitten","Alley Objective Route","Street-level objectives use open approaches, service doors, and crate landmarks.")}
    ${fig("14_cache","Secret-Hunting Route","Hidden discoveries and caches reward leaving the main illuminated roads.")}
    ${fig("act_climb","Vertical Routes","The CLIMB-ME tower teaches the city's climb language right away.")}
    ${fig("act_shrine","The Paw Shrine","Carry rescued kittens here — it grows with every one brought home.")}
    ${fig("act_citylife","Ambient Life","Citizens, traffic, and an elevated train keep the streets busy.")}
    ${fig("act_rain","Wet Neon Streets","Image-based lighting mirrors the signage in the rain-slicked roads.")}
    ${fig("angle_title","The Plaza From Above","The opening orbit's vantage over Transit Plaza and the skyline.")}
  </div>
  <div class="subhead">COMPLETE ACTIVITY INDEX</div>
  <table class="activity-table">
    <tr><th>Category</th><th>Everything available in play</th></tr>
    <tr><td>Move</td><td>Walk · sprint · mouse-look · jump · coyote time · jump buffer · double-jump · teleport-dash · glide · camera zoom</td></tr>
    <tr><td>Traverse</td><td>Street routes · rooftop climbs · pawprint trails · awnings · crates · balconies · roof bridges · ziplines · Apex Spire skyway</td></tr>
    <tr><td>Collect</td><td>140 holo-kibble · 18 data chips · 10 lost memories · neon rings · moving data wisps · hidden caches · posters</td></tr>
    <tr><td>Rescue</td><td>Find 8 kittens · carry one on PawPaw's back · return it to the shrine · unlock permanent shrine evolution stages</td></tr>
    <tr><td>Interact</td><td>4 quest NPC chains · 8 named neighbors · passer-by scritches · meow reactions · vending machines · Mei's shop · courier boards</td></tr>
    <tr><td>Work</td><td>20 story missions · repeatable courier mission · timed delivery jobs · streak multiplier · 3 rotating city tasks</td></tr>
    <tr><td>Chain</td><td>Unified FLOW action chaining · decay timer · combo payout · x10 FEVER · doubled credit income while FEVER is active</td></tr>
    <tr><td>Explore</td><td>5 districts · 8 hidden discoveries · landmarks · alleys · rooftops · gardens · docks · train line · environmental lore</td></tr>
    <tr><td>Progress</td><td>Credits · XP · levels · movement upgrades · snacks · collar cosmetics · collection sets · achievements · local save</td></tr>
    <tr><td>Navigate</td><td>Mission compass · gold world beam · routed city map · activity markers · nearby hint · journal · dialogue and shop modals</td></tr>
  </table>
</div></section>

<section id="progress"><div class="wrap">
  <div class="eyebrow">07 — GAME PROGRESS TRACKING</div>
  <h2>Every system leaves a <span class="accent">visible trail</span></h2>
  <p class="lead">Progress is readable during play, reviewable in the journal, and restored on the next
    session. The HUD remains compact while the map and journal expose the full state.</p>
  <div class="progress-grid">
    <div class="progress-card"><h3>Live HUD</h3><p>Kibble, chips, memories, rescued kittens, credits, paw level, and the XP bar update immediately.</p></div>
    <div class="progress-card"><h3>Mission Tracker</h3><p>Active title, objective, numeric progress, reward, compass direction, distance, world beam, and map route.</p></div>
    <div class="progress-card"><h3>Side-Quest Tracker</h3><p>Current giver and exact multi-step errand destination, followed by a clear return-for-reward state.</p></div>
    <div class="progress-card"><h3>Courier Status</h3><p>Destination, remaining distance, bearing arrow, countdown, and live delivery streak multiplier.</p></div>
    <div class="progress-card"><h3>FLOW + FEVER</h3><p>On-screen combo count, decay window, best-chain statistic, FEVER state, and doubled-credit feedback.</p></div>
    <div class="progress-card"><h3>Three City Tasks</h3><p>Three simultaneous task bars show current/required counts and replace themselves after completion.</p></div>
    <div class="progress-card"><h3>City Map</h3><p>Player heading, district bands, distance rings, street-following route, quests, neighbors, activities, landmarks, and secrets.</p></div>
    <div class="progress-card"><h3>Journal</h3><p>Main story, NPC quests, named neighbors, discoveries, collection sets, achievements, totals, and lifetime statistics.</p></div>
    <div class="progress-card"><h3>Persistent Save</h3><p>XP, level, purchases, collectibles, kittens, quests, quest steps, neighbors, discoveries, missions, position, and active courier job persist.</p></div>
  </div>
  <div class="two" style="margin-top:22px">
    ${fig("22_plaza_wide","Mission guidance in play","The HUD compass and gold world beam keep the current objective legible without pausing.")}
    ${fig("19_courier_board","Delivery route visibility","Wide roads and landmark lighting keep courier destinations readable at speed.")}
  </div>
</div></section>

<section id="situations"><div class="wrap">
  <div class="eyebrow">08 — WEATHER, ATMOSPHERE &amp; LIVE SITUATIONS</div>
  <h2>The city changes <span class="accent">while you play</span></h2>
  <p class="lead">Atmosphere is systemic rather than a static backdrop. Lighting, fog, rain, sound,
    traffic, and timed street events combine into recognizable situations with their own visual and
    gameplay feedback.</p>
  <div class="weather-grid">
    <div class="weather-card"><h3>Rain</h3><p>Rain phases activate falling particles and reactive rain ambience while puddle glow and wet-road reflections intensify.</p></div>
    <div class="weather-card"><h3>Rain Reflection Bonus</h3><p>The “bonus” is visual and atmospheric: neon doubles across the wet ground and the audio mix gains a stronger rain layer. Credit multipliers come from FEVER, not weather.</p></div>
    <div class="weather-card"><h3>Fog + Haze</h3><p>Exponential distance fog, district-colored drifting haze, lamp cones, and skyline depth keep long streets layered and readable.</p></div>
    <div class="weather-card"><h3>Day / Night Shift</h3><p>A shortened dynamic cycle blends night, dusk, and daylight colors while changing hemisphere and directional-light intensity.</p></div>
    <div class="weather-card"><h3>City Blackout</h3><p>The power grid browns out for several seconds, suppressing city lighting to near-neon-only before a sharp restoration.</p></div>
    <div class="weather-card"><h3>Power Restored</h3><p>The blackout multiplier returns to full strength and the streets recover their ambient, lamp, facade, and landmark lighting.</p></div>
    <div class="weather-card"><h3>Neon Sign Short</h3><p>A nearby sign can spark, flicker, and shower particles, producing a local sound-and-light incident.</p></div>
    <div class="weather-card"><h3>Courier Sky-Drop</h3><p>A drone can fumble glowing cargo nearby; the dropped credits descend into the street for PawPaw to collect.</p></div>
    <div class="weather-card"><h3>Data-Wisp Swarm</h3><p>Several moving wisps surface around the player at once, creating a short chase-and-collect window.</p></div>
    <div class="weather-card"><h3>Street Festival</h3><p>Nearby citizens react, confetti particles fill the block, music feedback rises, and PawPaw receives a festival reward.</p></div>
    <div class="weather-card"><h3>Traffic + Train Passes</h3><p>Hover cars produce proximity whooshes; the elevated train crosses the docks and can briefly enter its ghost-train state.</p></div>
    <div class="weather-card"><h3>FEVER Rush</h3><p>A x10 FLOW chain triggers an eight-second reward situation with intensified music, particles, screen-edge color, and double credits.</p></div>
  </div>
  <div class="gallery" style="margin-top:22px">
    ${fig("act_rain","Rain-Slick City","Wet surfaces and puddles intensify the reflected neon during rain.")}
    ${fig("03_back_alley","Fog and Atmospheric Depth","Haze, steam, alley lighting, and distance fog layer the narrow districts.")}
    ${fig("16_blackout","Blackout","The city grid drops to neon-only during the timed blackout event.")}
    ${fig("17_restore","Power Restored","Full lighting returns around a courier hub after the blackout.")}
  </div>
</div></section>

<section id="gallery"><div class="wrap">
  <div class="eyebrow">09 — SCREENSHOT GALLERY</div>
  <h2>Real in-game frames, <span class="accent">every district &amp; system</span></h2>
  <p class="lead">Every image below is a real frame captured live from the running game (1280×800),
    spanning all five districts, the cat's expressions, traversal, NPCs, collectibles, and world events.</p>
  <div class="gallery">
    ${GALLERY.map(([n,t,c]) => fig(n,t,c)).join("\n    ")}
  </div>
</div></section>

<section id="tech"><div class="wrap">
  <div class="eyebrow">10 — TECHNICAL ARCHITECTURE</div>
  <h2>Static, dependency-light, <span class="accent">cinematic</span></h2>
  <p class="lead">Vanilla JavaScript ES modules, a single vendored copy of Three.js (r160), WebAudio, and
    localStorage. No bundler, no framework, no internet requirement at runtime, and no paid or gambling
    systems. It runs from any static server.</p>
  <div class="arch">
    <div class="mod"><div class="f">main.js</div><p>Boot, input, the render loop, post-processing pipeline, and camera zoom.</p></div>
    <div class="mod"><div class="f">world.js</div><p>Procedural city from a fixed seed: PBR facades, lighting, shrine, NPCs, traffic, ziplines, rain, day/night.</p></div>
    <div class="mod"><div class="f">player.js</div><p>The articulated cat, movement physics, collision, zipline riding, and the wall-aware mouse-look camera.</p></div>
    <div class="mod"><div class="f">game.js</div><p>Missions, side-quests, discoveries, courier jobs, FLOW/FEVER, tasks, economy, XP, save/load.</p></div>
    <div class="mod"><div class="f">ui.js</div><p>HUD, trackers, compass, the city map, and the journal / shop / dialogue modals.</p></div>
    <div class="mod"><div class="f">fx.js</div><p>A one-draw-call particle pool, ambient emitters, reward floaters, and screen flashes.</p></div>
    <div class="mod"><div class="f">audio.js</div><p>A reverb-bussed music bed, reactive ambience layers, and the full sound-effect set.</p></div>
    <div class="mod"><div class="f">data.js</div><p>Constants, districts, lore, shop, missions, quests, discoveries, sets, and the shared state.</p></div>
  </div>
  <div class="pipe">
    <span class="step">Scene + Camera</span><span class="arw">→</span>
    <span class="step">RenderPass</span><span class="arw">→</span>
    <span class="step">UnrealBloom</span><span class="arw">→</span>
    <span class="step">OutputPass (ACES)</span><span class="arw">→</span>
    <span class="step">MSAA Canvas</span>
  </div>
  <div class="two" style="margin-top:26px">
    <div class="panel"><h3>Rendering</h3>
      <ul class="clean">
        <li>Real <b>bloom</b> post-processing so neon genuinely glows</li>
        <li><b>ACES filmic</b> tone mapping for rich, filmic color</li>
        <li><b>MSAA</b> render target + max <b>anisotropic</b> filtering — crisp, never pixelated</li>
        <li><b>Image-based lighting</b>: a baked neon-room env map so wet roads &amp; metal reflect color</li>
        <li>Procedural <b>PBR facades</b> — windows, grime, storefronts — and a wet, puddled ground</li>
        <li>Drifting haze, volumetric lamp cones, and a glowing parallax skyline</li>
      </ul></div>
    <div class="panel"><h3>Systems</h3>
      <ul class="clean">
        <li>Seeded RNG → the city is identical every visit</li>
        <li>Capsule-vs-AABB collision, coyote time, double-jump, dash, glide</li>
        <li>WebAudio: chord-progression bed + reactive rain/traffic/buzz layers</li>
        <li>Full state serialized to <b>localStorage</b> every few seconds</li>
        <li>Steady <b>~60 fps</b> with the full post-processing stack</li>
        <li>Out-of-building "nudge" pass guarantees every fixed objective is reachable</li>
      </ul></div>
  </div>
</div></section>

<section id="design"><div class="wrap">
  <div class="eyebrow">11 — DESIGN &amp; CONTENT</div>
  <h2>Cozy, curious, <span class="accent">handcrafted-feeling</span></h2>
  <p class="lead">The mood is warm and inviting rather than tense — neon on wet streets, rooftop
    gardens, loyal empty trains, and a scattered city AI that "stayed because it loved" the city.
    Guidance keeps players oriented while leaving the order of activities entirely open.</p>
  <div class="two">
    <div>
      <table>
        <tr><th>District</th><th>Character</th></tr>
        <tr><td><b>Back Alley Network</b></td><td>Graffiti, steam, clutter, glowing eyes in the dark</td></tr>
        <tr><td><b>Neon Market</b></td><td>Food stalls, lanterns, a giant rotating holo-cat</td></tr>
        <tr><td><b>Transit Plaza</b></td><td>The Paw Shrine, fountain, calm heart of the city</td></tr>
        <tr><td><b>Corporate Sector</b></td><td>Glass towers, ring lights, sweeping searchlights</td></tr>
        <tr><td><b>Old Signal Docks</b></td><td>Antenna farm, holo-fish, a sometimes-ghost train</td></tr>
      </table>
      <table style="margin-top:16px">
        <tr><th>Content</th><th>Count</th></tr>
        <tr><td>Holo-kibble · data chips · lost memories</td><td><b>140 · 18 · 10</b></td></tr>
        <tr><td>Lost kittens · hidden caches</td><td><b>8 · 4</b></td></tr>
        <tr><td>Story missions · repeatable mission</td><td><b>20 · 1</b></td></tr>
        <tr><td>NPC side-quest chains · named neighbors</td><td><b>4 · 8</b></td></tr>
        <tr><td>Hidden discoveries · collection sets</td><td><b>8 · 5</b></td></tr>
        <tr><td>Rotating task types · courier boards</td><td><b>10 · 3</b></td></tr>
      </table>
    </div>
    <div class="panel">
      <h3>Visual direction</h3>
      <p style="color:var(--muted);font-size:14px;margin-top:0">PawPaw is a soft, round calico — white
        fur with black &amp; ginger patches, green eyes, cheek fluff, and a red bell collar — built from
        smooth high-poly primitives and animated with squash-and-stretch, a walk gait, blinking, and
        emotive squints. The world pairs a warm amber night palette with saturated neon and mirror-wet
        streets for a cozy-cyberpunk identity.</p>
      <div style="margin-top:14px">${fig("emo_happy","Emotive cat","A wider in-engine view of the reward squint, ear perk, and relaxed face state.")}</div>
    </div>
  </div>
</div></section>

<footer><div class="wrap">
  <div class="glow">${PROJECT_NAME}</div>
  <div>Built with Three.js · vanilla JavaScript · WebAudio · localStorage — no build step, no dependencies beyond a vendored renderer.</div>
  <div style="margin-top:8px;opacity:.6">Report generated from ${GALLERY.length} real in-game captures.</div>
</div></footer>
<script>
  document.querySelectorAll('video[data-clip="opening"]').forEach(v => { v.playbackRate = 1.35; });
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, "docs", "PAWPAW_WORLD_Report.html"), html);
const kb = (Buffer.byteLength(html) / 1024 / 1024).toFixed(2);
console.log("wrote docs/PAWPAW_WORLD_Report.html (" + kb + " MB, " + GALLERY.length + " gallery shots)");
