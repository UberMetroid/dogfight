// # Sync fleet — West vs East, 6 generations
//
// Logline: 12-slot per-side pool. For each active gen, spawn one jet per jet in the gen's list.
//          Old "west"/"east" mask names still accepted as a fallback for older callers.
//
var POOL_SIZE_PER_SIDE = 12;

var globalDogfightJetsState = {
  westPool: [],
  eastPool: [],
  allJets: [],
  // Back-compat aliases (some legacy code still reads .bluePool / .redPool)
  bluePool: [],
  redPool: []
};

// Initialize pool slots with placeholder jets AT THE RUNWAY (gen 4 default).
// Position is the same as syncFleetToActiveGenerations will set, so even if
// initGlobalDogfight / syncFleetToActiveGenerations doesn't run (e.g. due to a
// localStorage all-empty state), the default pool is still visible.
var initialWorldH = DF.worldHeight || 1200;
var initialMslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(initialWorldH) : Math.floor(initialWorldH * 0.84);
var initialWestRwyY = initialMslY - 14;
var initialEastRwyY = initialMslY - 12;
for (var dbi = 0; dbi < POOL_SIZE_PER_SIDE; dbi++) {
  globalDogfightJetsState.westPool.push(createJet(
    (DF.worldWidth || 3600) * 0.04 + ((dbi % 2 === 0) ? 36 : 10),
    initialWestRwyY - 1, 0, 4, dbi, "west"));
  globalDogfightJetsState.eastPool.push(createJet(
    (DF.worldWidth || 3600) * 0.96 - ((dbi % 2 === 0) ? 36 : 10),
    initialEastRwyY - 1, Math.PI, 4, dbi, "east"));
}
for (var dai = 0; dai < POOL_SIZE_PER_SIDE; dai++) globalDogfightJetsState.allJets.push(globalDogfightJetsState.westPool[dai]);
for (var dri = 0; dri < POOL_SIZE_PER_SIDE; dri++) globalDogfightJetsState.allJets.push(globalDogfightJetsState.eastPool[dri]);

// Back-compat aliases
globalDogfightJetsState.bluePool = globalDogfightJetsState.westPool;
globalDogfightJetsState.redPool  = globalDogfightJetsState.eastPool;

if (typeof global !== "undefined") {
  global.globalDogfightJets = globalDogfightJetsState;
}
if (typeof window !== "undefined") {
  window.globalDogfightJets = globalDogfightJetsState;
}

// Build the active-gen spawn list for a given mask and team.
// Returns array of gen numbers; if the resulting list would overflow the pool,
// we cap to POOL_SIZE_PER_SIDE by trimming the highest-gen entries.
function buildActiveGenList(mask, side) {
  var list = [];
  for (var g = 1; g <= 7; g++) {
    if (mask[g]) {
      var teamList = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[g] && AIRCRAFT_SPECS[g][side]) ? AIRCRAFT_SPECS[g][side] : null;
      var n = teamList ? teamList.length : 1;
      // Each gen contributes `n` jets to the pool.
      for (var k = 0; k < n; k++) list.push(g);
    }
  }
  // Cap to pool size: prefer lowest gen (typically more iconic / historically significant).
  if (list.length > POOL_SIZE_PER_SIDE) list = list.slice(0, POOL_SIZE_PER_SIDE);
  return list;
}

function syncFleetToActiveGenerations(maskA, maskB, canvasW, canvasH) {
  // Handle call signatures: (west, east, w, h) OR (mask, w, h) OR (west, east)
  var wMask, eMask, w, h;
  var defaultW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
  var defaultH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

  // Back-compat: allow "west"/"east" mask names
  var aNorm = maskA;
  var bNorm = maskB;
  if (aNorm && aNorm[1] !== undefined && aNorm[6] !== undefined && (aNorm[7] !== undefined)) {
    // old shape (1..7) -> drop the 7
    aNorm = {}; for (var k = 1; k <= 6; k++) aNorm[k] = maskA[k];
  }
  if (bNorm && bNorm[1] !== undefined && bNorm[6] !== undefined && (bNorm[7] !== undefined)) {
    bNorm = {}; for (var k2 = 1; k2 <= 6; k2++) bNorm[k2] = maskB[k2];
  }

  if (typeof maskB === "object" && maskB !== null) {
    wMask = aNorm || (typeof activeGensWest !== "undefined" ? activeGensWest : {});
    eMask = bNorm || (typeof activeGensEast !== "undefined" ? activeGensEast : {});
    w = (typeof canvasW === "number" && canvasW > 0) ? canvasW : defaultW;
    h = (typeof canvasH === "number" && canvasH > 0) ? canvasH : defaultH;
  } else {
    wMask = aNorm || (typeof activeGensWest !== "undefined" ? activeGensWest : {});
    eMask = aNorm || (typeof activeGensEast !== "undefined" ? activeGensEast : {});
    w = (typeof maskB === "number" && maskB > 0) ? maskB : defaultW;
    h = (typeof canvasW === "number" && canvasW > 0) ? canvasW : defaultH;
  }

  // Update global masks
  if (typeof activeGensWest !== "undefined" && typeof activeGensEast !== "undefined") {
    for (var ag = 1; ag <= 7; ag++) {
      if (typeof wMask[ag] !== "undefined") activeGensWest[ag] = Boolean(wMask[ag]);
      if (typeof eMask[ag] !== "undefined") activeGensEast[ag] = Boolean(eMask[ag]);
    }
    if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
    if (typeof saveActiveGens === "function") saveActiveGens();
    if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();
  }

  var wPool = globalDogfightJetsState.westPool;
  var ePool = globalDogfightJetsState.eastPool;
  var aJets = globalDogfightJetsState.allJets;

  var westActiveList = buildActiveGenList(wMask, "west");
  var eastActiveList = buildActiveGenList(eMask, "east");
  var nWest = westActiveList.length;
  var nEast = eastActiveList.length;

  if (nWest === 0 && nEast === 0) {
    for (var i = 0; i < aJets.length; i++) {
      aJets[i].active = false;
      aJets[i].targetJet = null;
      aJets[i].wingmanJet = null;
    }
    return;
  }

  // Reset all jets first (so unused slots are clean).
  for (var rj = 0; rj < aJets.length; rj++) {
    aJets[rj].active = false;
    aJets[rj].targetJet = null;
    aJets[rj].wingmanJet = null;
    aJets[rj].isDying = false;
  }

  // Sync West Pool
  for (var wIdx = 0; wIdx < nWest; wIdx++) {
    var wg = westActiveList[wIdx];
    var specW = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[wg] && AIRCRAFT_SPECS[wg].west) ? pickJetSpec(wg, "west", wIdx) : { baseSpeed: 4.8 };
    var wAltY = getYFromAltitude(RESPAWN_CEILINGS[wg] || 52000, h);
    var wJet = wPool[wIdx];

    wJet.gen = wg;
    wJet.team = "west";
    wJet.active = true;
    wJet.isDying = false;
    wJet.deathTimer = 0;
    wJet.fadeAlpha = 1.0;
    wJet.hp = 100.0;
    wJet.maxHp = 100.0;
    wJet.damageState = "NOMINAL";
    wJet.lastDamagedBy = "";
    wJet.damageSmokeTimer = 0;
    wJet.damageSparksTimer = 0;
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);
    var rwyY = mslY - 14;
    wJet.x = w * 0.04 + ((wIdx % 2 === 0) ? 36 : 10);
    wJet.y = rwyY - 1;
    wJet.angle = 0.0;
    wJet.targetAngle = 0.0;
    wJet.speed = 1.8;
    wJet.baseSpeed = specW.baseSpeed || 4.8;
    wJet.prevSpeed = wJet.speed;
    wJet.ps = 0;
    wJet.turnRate = 0;
    wJet.gForce = 1.0;
    wJet.isStalled = false;
    wJet.mode = "TAKEOFF";
    wJet.takeoffRoll = -(wIdx % 2) * 12;
    wJet.modeTimer = 30;
    wJet.afterburner = true;
    wJet.throttleSetting = 1.5;
    wJet.targetJet = null;
    wJet.isLead = (wIdx % 2 === 0);
    wJet.isHero = (wIdx === 0);
    wJet.rcs = specW.rcsClean || specW.rcs || 1.0;
    wJet.bayDoorTimer = 0;
    wJet.flareCooldown = 0;
    wJet.chaffCooldown = 0;
    wJet.gunCooldown = 0;
    wJet.missileCooldown = wg === 1 ? 999999 : (10 + Math.floor(Math.random() * 11));
    wJet.missileCapacity = (specW && typeof specW.missileCapacity === "number") ? specW.missileCapacity : 0;
    wJet.missilesRemaining = wJet.missileCapacity;
    wJet.isWinchester = (wJet.missilesRemaining === 0);
    wJet.fuelMax = 100.0;
    wJet.fuel = 100.0;
    wJet.isBingoFuel = false;
    wJet.kills = 0;
    wJet.isAce = false;
    wJet.turnAgilityBonus = 1.0;
    wJet.laserCooldown = 0;
    wJet.triLaserCooldown = 0;
    wJet.superLaserCooldown = 0;
    wJet.superLaserPulse = 0;
    // CCA loyal wingman drones (Gen 6 West = NGAD)
    wJet.ccaDeployed = (wg === 6);
    if (wg === 6) {
      if (!wJet.cca1) wJet.cca1 = { x: wJet.x, y: wJet.y, angle: wJet.angle, speed: wJet.speed, active: true, laserCooldown: 0 };
      if (!wJet.cca2) wJet.cca2 = { x: wJet.x, y: wJet.y, angle: wJet.angle, speed: wJet.speed, active: true, laserCooldown: 0 };
      wJet.cca1.active = true;
      wJet.cca2.active = true;
      wJet.cca1.x = wJet.x + Math.cos(wJet.angle) * 55 - Math.sin(wJet.angle) * 65;
      wJet.cca1.y = wJet.y + Math.sin(wJet.angle) * 55 + Math.cos(wJet.angle) * 65;
      wJet.cca1.angle = wJet.angle;
      wJet.cca1.speed = wJet.speed;
      wJet.cca2.x = wJet.x + Math.cos(wJet.angle) * 55 + Math.sin(wJet.angle) * 65;
      wJet.cca2.y = wJet.y + Math.sin(wJet.angle) * 55 - Math.cos(wJet.angle) * 65;
      wJet.cca2.angle = wJet.angle;
      wJet.cca2.speed = wJet.speed;
    } else {
      if (wJet.cca1) wJet.cca1.active = false;
      if (wJet.cca2) wJet.cca2.active = false;
    }
    setupJetCallsignAndVariant(wJet, wg, "west", wIdx);
    if (wJet.contrail) wJet.contrail.clear();
    if (wJet.wingVapor) wJet.wingVapor.clear();
  }

  // Sync East Pool
  for (var eIdx = 0; eIdx < nEast; eIdx++) {
    var eg = eastActiveList[eIdx];
    var specE = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[eg] && AIRCRAFT_SPECS[eg].east) ? pickJetSpec(eg, "east", eIdx) : { baseSpeed: 4.8 };
    var eAltY = getYFromAltitude(RESPAWN_CEILINGS[eg] || 52000, h);
    var eJet = ePool[eIdx];

    eJet.gen = eg;
    eJet.team = "east";
    eJet.active = true;
    eJet.isDying = false;
    eJet.deathTimer = 0;
    eJet.fadeAlpha = 1.0;
    eJet.hp = 100.0;
    eJet.maxHp = 100.0;
    eJet.damageState = "NOMINAL";
    eJet.lastDamagedBy = "";
    eJet.damageSmokeTimer = 0;
    eJet.damageSparksTimer = 0;
    var emslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);
    var erwyY = emslY - 12;
    eJet.x = w * 0.96 - ((eIdx % 2 === 0) ? 36 : 10);
    eJet.y = erwyY - 1;
    eJet.angle = Math.PI;
    eJet.targetAngle = Math.PI;
    eJet.speed = 1.8;
    eJet.baseSpeed = specE.baseSpeed || 4.8;
    eJet.prevSpeed = eJet.speed;
    eJet.ps = 0;
    eJet.turnRate = 0;
    eJet.gForce = 1.0;
    eJet.isStalled = false;
    eJet.mode = "TAKEOFF";
    eJet.takeoffRoll = -(eIdx % 2) * 12;
    eJet.modeTimer = 30;
    eJet.afterburner = true;
    eJet.throttleSetting = 1.5;
    eJet.targetJet = null;
    eJet.isLead = (eIdx % 2 === 0);
    eJet.isHero = false;
    eJet.rcs = specE.rcsClean || specE.rcs || 1.0;
    eJet.bayDoorTimer = 0;
    eJet.flareCooldown = 0;
    eJet.chaffCooldown = 0;
    eJet.gunCooldown = 0;
    eJet.missileCooldown = eg === 1 ? 999999 : (10 + Math.floor(Math.random() * 11));
    eJet.missileCapacity = (specE && typeof specE.missileCapacity === "number") ? specE.missileCapacity : 0;
    eJet.missilesRemaining = eJet.missileCapacity;
    eJet.isWinchester = (eJet.missilesRemaining === 0);
    eJet.fuelMax = 100.0;
    eJet.fuel = 100.0;
    eJet.isBingoFuel = false;
    eJet.kills = 0;
    eJet.isAce = false;
    eJet.turnAgilityBonus = 1.0;
    eJet.laserCooldown = 0;
    eJet.triLaserCooldown = 0;
    eJet.superLaserCooldown = 0;
    eJet.superLaserPulse = 0;
    // CCA loyal wingman drones (Gen 6 East = Su-57M)
    eJet.ccaDeployed = (eg === 6);
    if (eg === 6) {
      if (!eJet.cca1) eJet.cca1 = { x: eJet.x, y: eJet.y, angle: eJet.angle, speed: eJet.speed, active: true, laserCooldown: 0 };
      if (!eJet.cca2) eJet.cca2 = { x: eJet.x, y: eJet.y, angle: eJet.angle, speed: eJet.speed, active: true, laserCooldown: 0 };
      eJet.cca1.active = true;
      eJet.cca2.active = true;
      eJet.cca1.x = eJet.x + Math.cos(eJet.angle) * 55 - Math.sin(eJet.angle) * 65;
      eJet.cca1.y = eJet.y + Math.sin(eJet.angle) * 55 + Math.cos(eJet.angle) * 65;
      eJet.cca1.angle = eJet.angle;
      eJet.cca1.speed = eJet.speed;
      eJet.cca2.x = eJet.x + Math.cos(eJet.angle) * 55 + Math.sin(eJet.angle) * 65;
      eJet.cca2.y = eJet.y + Math.sin(eJet.angle) * 55 - Math.cos(eJet.angle) * 65;
      eJet.cca2.angle = eJet.angle;
      eJet.cca2.speed = eJet.speed;
    } else {
      if (eJet.cca1) eJet.cca1.active = false;
      if (eJet.cca2) eJet.cca2.active = false;
    }
    setupJetCallsignAndVariant(eJet, eg, "east", eIdx);
    if (eJet.contrail) eJet.contrail.clear();
    if (eJet.wingVapor) eJet.wingVapor.clear();
  }

  // Cross-team target pairing
  if (nWest > 0 && nEast > 0) {
    for (var wi = 0; wi < nWest; wi++) {
      wPool[wi].targetJet = ePool[wi % nEast];
    }
    for (var ei = 0; ei < nEast; ei++) {
      ePool[ei].targetJet = wPool[ei % nWest];
    }
  }

  // Assign wingman links (pairs: 0<->1, 2<->3, ...)
  for (var wwi = 0; wwi < nWest; wwi++) {
    var wPartner = (nWest > 1) ? ((wwi % 2 === 0) ? (wwi + 1 < nWest ? wwi + 1 : wwi) : wwi - 1) : wwi;
    wPool[wwi].wingmanJet = wPool[wPartner];
  }
  for (var ewi = 0; ewi < nEast; ewi++) {
    var ePartner = (nEast > 1) ? ((ewi % 2 === 0) ? (ewi + 1 < nEast ? ewi + 1 : ewi) : ewi - 1) : ewi;
    ePool[ewi].wingmanJet = ePool[ePartner];
  }
}
