// # Dogfight init
//
// Logline: Canvas, pools, rAF register.
//
function scrambleWave(team, gen) {
  if (!hasAnyActiveGen()) return;
  var isBlue = (team === "blue");
  var pool = isBlue ? DF.bluePool : DF.redPool;
  var mask = isBlue ? (typeof activeGensBlue !== "undefined" ? activeGensBlue : activeGens) : (typeof activeGensRed !== "undefined" ? activeGensRed : activeGens);
  var activeList = [];
  for (var g = 1; g <= 7; g++) if (mask[g]) activeList.push(g);
  if (activeList.length === 0) {
    var fallbackGen = (typeof gen === "number" && gen >= 1 && gen <= 7) ? gen : 4;
    mask[fallbackGen] = true;
    if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
    if (typeof saveActiveGens === "function") saveActiveGens();
    if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();
    activeList = [fallbackGen];
  }
  var worldW = DF.worldWidth || 3600;
  var worldH = DF.worldHeight || 1200;
  for (var idx = 0; idx < activeList.length; idx++) {
    var gg = activeList[idx];
    var specG = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[gg]) ? AIRCRAFT_SPECS[gg] : { baseSpeed: 4.8 };
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
      jet.x = isBlue ? (-100 - idx * 50) : (worldW + 100 + idx * 50);
      var baseY = getYFromAltitude(RESPAWN_CEILINGS[gg] || 52000, worldH);
      jet.y = isBlue ? Math.max(40.0, baseY - (idx === 0 ? 50 : 25)) : Math.min(worldH - 60.0, baseY + (idx === 0 ? 50 : 75));
      jet.angle = isBlue ? 0.0 : Math.PI;
      jet.targetAngle = jet.angle;
      jet.speed = (specG.baseSpeed || 4.8) * 1.15;
      jet.baseSpeed = specG.baseSpeed || 4.8;
      jet.missileCapacity = (specG && typeof specG.missileCapacity === "number") ? specG.missileCapacity : (gg === 1 || gg === 7 ? 0 : 6);
      jet.missilesRemaining = jet.missileCapacity;
      jet.isWinchester = (jet.missilesRemaining === 0 && gg < 7);
      jet.missileCooldown = gg === 1 ? 999999 : (10 + Math.floor(Math.random() * 11));
      jet.kills = 0;
      jet.isAce = false;
      jet.turnAgilityBonus = 1.0;
      setupJetCallsignAndVariant(jet, gg, team, idx);
      if (gg === 6) {
        jet.ccaDeployed = true;
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
      }
      if (jet.contrail) jet.contrail.clear();
      if (jet.wingVapor) jet.wingVapor.clear();
    }
  }

  // Cross-target re-link
  var oppPool = isBlue ? DF.redPool : DF.bluePool;
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

  dfRadio("TAC-NET: " + (isBlue ? "BLUE FORCE" : "RED FORCE") + " REINFORCEMENTS SCRAMBLING FROM FLANK!");
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
  DF.bluePool = globalDogfightJetsState.bluePool;
  DF.redPool = globalDogfightJetsState.redPool;
  DF.allJets = globalDogfightJetsState.allJets;
  syncFleetToActiveGenerations(activeGensBlue, activeGensRed, DF.worldWidth, DF.worldHeight);
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
    else syncFleetToActiveGenerations(activeGensBlue, activeGensRed);
  };
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
