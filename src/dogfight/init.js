// # Dogfight init — West vs East, 6 generations
//
// Logline: Canvas, pools, rAF register.
//
function scrambleWave(team, gen) {
  if (!hasAnyActiveGen()) return;
  var isWest = (team === "west");
  var pool = isWest ? DF.westPool : DF.eastPool;
  var mask = isWest ? (typeof activeGensWest !== "undefined" ? activeGensWest : activeGens) : (typeof activeGensEast !== "undefined" ? activeGensEast : activeGens);
  var gens = [];
  for (var g = 1; g <= 7; g++) if (mask[g]) gens.push(g);
  if (gens.length === 0) {
    var fallbackGen = (typeof gen === "number" && gen >= 1 && gen <= 6) ? gen : 4;
    mask[fallbackGen] = true;
    if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
    if (typeof saveActiveGens === "function") saveActiveGens();
    if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();
    gens = [fallbackGen];
  }

  // Build active list: each gen contributes (team jet-list length) jets.
  // Cap to pool size; if overflow, drop highest gens.
  var activeList = [];
  for (var gi = 0; gi < gens.length; gi++) {
    var teamJets = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[gens[gi]] && AIRCRAFT_SPECS[gens[gi]][team]) ? AIRCRAFT_SPECS[gens[gi]][team] : null;
    var n = teamJets ? teamJets.length : 1;
    for (var s = 0; s < n; s++) {
      if (activeList.length < pool.length) activeList.push(gens[gi]);
    }
  }

  var worldW = DF.worldWidth || 3600;
  var worldH = DF.worldHeight || 1200;
  for (var idx = 0; idx < activeList.length; idx++) {
    var gg = activeList[idx];
    var specG = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[gg] && AIRCRAFT_SPECS[gg][team]) ? pickJetSpec(gg, team, idx) : { baseSpeed: 4.8 };
    var jet = pool[idx];
    if (!jet.active || jet.isDying || jet.hp <= 0) {
      jet.gen = gg;
      jet.active = true;
      jet.isDying = false;
      jet.deathTimer = 0;
      jet.fadeAlpha = 1.0;
      jet.hp = 100.0;
      jet.maxHp = 100.0;
      jet.damageState = "NOMINAL";
      jet.lastDamagedBy = "";
      jet.damageSmokeTimer = 0;
      jet.damageSparksTimer = 0;
      var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(worldH) : Math.floor(worldH * 0.84);
      var rwyY = isWest ? (mslY - 14) : (mslY - 12);
      jet.x = isWest ? (worldW * 0.04 + ((idx % 2 === 0) ? 36 : 10)) : (worldW * 0.96 - ((idx % 2 === 0) ? 36 : 10));
      jet.y = rwyY - 1;
      jet.angle = isWest ? 0.0 : Math.PI;
      jet.targetAngle = jet.angle;
      jet.speed = 1.8;
      jet.baseSpeed = specG.baseSpeed || 4.8;
      jet.mode = "TAKEOFF";
      jet.takeoffRoll = -(idx % 2) * 12;
      jet.afterburner = true;
      jet.throttleSetting = 1.5;
      jet.missileCapacity = (specG && typeof specG.missileCapacity === "number") ? specG.missileCapacity : (gg === 1 ? 0 : 6);
      jet.missilesRemaining = jet.missileCapacity;
      jet.isWinchester = (jet.missilesRemaining === 0);
      jet.missileCooldown = gg === 1 ? 999999 : (10 + Math.floor(Math.random() * 11));
      jet.kills = 0;
      jet.isAce = false;
      jet.turnAgilityBonus = 1.0;
      jet.team = team;
      setupJetCallsignAndVariant(jet, gg, team, idx);
      // CCA loyal wingman drones for Gen 6 (NGAD West, Su-57M East)
      jet.ccaDeployed = (gg === 6);
      if (gg === 6) {
        if (!jet.cca1) jet.cca1 = { x: jet.x, y: jet.y, angle: jet.angle, speed: jet.speed, active: true, laserCooldown: 0 };
        if (!jet.cca2) jet.cca2 = { x: jet.x, y: jet.y, angle: jet.angle, speed: jet.speed, active: true, laserCooldown: 0 };
        jet.cca1.active = true;
        jet.cca2.active = true;
        jet.cca1.x = jet.x + Math.cos(jet.angle) * 55 - Math.sin(jet.angle) * 65;
        jet.cca1.y = jet.y + Math.sin(jet.angle) * 55 + Math.cos(jet.angle) * 65;
        jet.cca1.angle = jet.angle;
        jet.cca1.speed = jet.speed;
        jet.cca2.x = jet.x + Math.cos(jet.angle) * 55 + Math.sin(jet.angle) * 65;
        jet.cca2.y = jet.y + Math.sin(jet.angle) * 55 - Math.cos(jet.angle) * 65;
        jet.cca2.angle = jet.angle;
        jet.cca2.speed = jet.speed;
      } else {
        if (jet.cca1) jet.cca1.active = false;
        if (jet.cca2) jet.cca2.active = false;
      }
      if (jet.contrail) jet.contrail.clear();
      if (jet.wingVapor) jet.wingVapor.clear();
    }
  }

  // Cross-link wingmen in 2-ship elements
  for (var wi = 0; wi < activeList.length; wi++) {
    var partner = (wi % 2 === 0) ? (wi + 1 < activeList.length ? wi + 1 : wi) : (wi - 1);
    pool[wi].wingmanJet = pool[partner];
    pool[wi].isLead = (wi % 2 === 0);
  }

  // Cross-target re-link
  var oppPool = isWest ? DF.eastPool : DF.westPool;
  for (var p = 0; p < pool.length; p++) {
    if (pool[p].active && (!pool[p].targetJet || !pool[p].targetJet.active || pool[p].targetJet.isDying)) {
      for (var op = 0; op < oppPool.length; op++) {
        if (oppPool[op].active && !oppPool[op].isDying) {
          pool[p].targetJet = oppPool[op];
          break;
        }
      }
    }
  }

  if (typeof dfRadio === "function") {
    dfRadio("TAC-NET: " + (isWest ? "WEST FORCE" : "EAST FORCE") + " REINFORCEMENTS SCRAMBLING FROM FLANK!");
  }
}

function initGlobalDogfight() {
  var canvas = document.getElementById("dogfight-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;
  DF.canvas = canvas;
  DF.ctx = ctx;
  DF.worldWidth = 3600;
  DF.worldHeight = 1200;
  DF.width = canvas.width = window.innerWidth || 1440;
  DF.height = canvas.height = window.innerHeight || 900;
  function onResize() {
    DF.width = canvas.width = window.innerWidth || 1440;
    DF.height = canvas.height = window.innerHeight || 900;
    if (DF.camera && typeof DF.camera.update === "function") DF.camera.update(DF.width, DF.height);
  }
  window.removeEventListener("resize", onResize);
  window.addEventListener("resize", onResize);
  DF.westPool = globalDogfightJetsState.westPool;
  DF.eastPool = globalDogfightJetsState.eastPool;
  DF.allJets = globalDogfightJetsState.allJets;
  // Back-compat aliases (some legacy code still reads .bluePool / .redPool)
  DF.bluePool = DF.westPool;
  DF.redPool  = DF.eastPool;
  syncFleetToActiveGenerations(activeGensWest, activeGensEast, DF.worldWidth, DF.worldHeight);
  DF.missilesPool = new StaticEntityPoolF32(48, 8);
  DF.missileSmokes = [];
  for (var ms = 0; ms < 48; ms++) DF.missileSmokes.push(new ContrailRingBufferF32(20, 4));
  DF.flaresPool = new StaticEntityPoolF32(64, 5);
  DF.chaffPool = new StaticEntityPoolF32(64, 5);
  DF.bulletsPool = new StaticEntityPoolF32(64, 6);
  DF.explosionsPool = new StaticEntityPoolF32(128, 6);
  DF.MAX_RADIO = 5;
  DF.radioBuffer = [
    { text: "", alpha: 0 }, { text: "", alpha: 0 }, { text: "", alpha: 0 },
    { text: "", alpha: 0 }, { text: "", alpha: 0 }
  ];
  DF.radioHead = 0;
  DF.radioCount = 0;
  globalRadioAdd = dfRadio;
  globalSetAllOffline = function () {
    for (var i = 0; i < DF.allJets.length; i++) DF.allJets[i].active = false;
  };
  globalReassignHero = function () {
    if (!hasAnyActiveGen()) globalSetAllOffline();
    else syncFleetToActiveGenerations(activeGensWest, activeGensEast);
  };
  // Day/night + weather systems
  if (typeof initDayNight === "function") initDayNight();
  if (typeof initWeather === "function") initWeather();
  function start() {
    if (!jetsEnabled) return;
    if (!dogfightAnimId) dogfightAnimId = requestAnimationFrame(updateDogfight);
  }
  function stop() {
    if (dogfightAnimId) { cancelAnimationFrame(dogfightAnimId); dogfightAnimId = null; }
  }
  CanvasLifecycleManager.register("global-dogfight", {
    canvas: canvas, start: start, stop: stop, respectReducedMotion: true
  });
}
