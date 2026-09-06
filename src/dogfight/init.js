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
      jet.x = isBlue ? (-60 - idx * 45) : (DF.width + 60 + idx * 45);
      var baseY = getYFromAltitude(RESPAWN_CEILINGS[gg] || 52000, DF.height);
      jet.y = isBlue ? Math.max(32.0, baseY - (idx === 0 ? 50 : 25)) : Math.min(DF.height - 40.0, baseY + (idx === 0 ? 50 : 75));
      jet.angle = isBlue ? 0.0 : Math.PI;
      jet.targetAngle = jet.angle;
      jet.speed = (specG.baseSpeed || 4.8) * 1.15;
      jet.baseSpeed = specG.baseSpeed || 4.8;
      setupJetCallsignAndVariant(jet, gg, team, idx);
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
  DF.width = canvas.width = window.innerWidth || 1440;
  DF.height = canvas.height = window.innerHeight || 900;
  function onResize() {
    DF.width = canvas.width = window.innerWidth || 1440;
    DF.height = canvas.height = window.innerHeight || 900;
  }
  window.removeEventListener("resize", onResize);
  window.addEventListener("resize", onResize);
  DF.bluePool = globalDogfightJetsState.bluePool;
  DF.redPool = globalDogfightJetsState.redPool;
  DF.allJets = globalDogfightJetsState.allJets;
  syncFleetToActiveGenerations(activeGensBlue, activeGensRed, DF.width, DF.height);
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
