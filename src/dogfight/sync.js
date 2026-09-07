// # Sync fleet
//
// Logline: Map active gens onto blue/red pools.
//
var globalDogfightJetsState = {
  bluePool: [],
  redPool: [],
  allJets: []
};

for (var dbi = 0; dbi < 7; dbi++) {
  var dbGen = dbi + 1;
  globalDogfightJetsState.bluePool.push(createJet(800, getYFromAltitude(RESPAWN_CEILINGS[dbGen] || 52000, 1200), 0, dbGen, dbi, "blue"));
  globalDogfightJetsState.redPool.push(createJet(2800, getYFromAltitude(RESPAWN_CEILINGS[dbGen] || 52000, 1200), Math.PI, dbGen, dbi, "red"));
}
for (var dai = 0; dai < 7; dai++) globalDogfightJetsState.allJets.push(globalDogfightJetsState.bluePool[dai]);
for (var dri = 0; dri < 7; dri++) globalDogfightJetsState.allJets.push(globalDogfightJetsState.redPool[dri]);

if (typeof global !== "undefined") {
  global.globalDogfightJets = globalDogfightJetsState;
}
if (typeof window !== "undefined") {
  window.globalDogfightJets = globalDogfightJetsState;
}

function syncFleetToActiveGenerations(blueMask, redMask, canvasW, canvasH) {
  var bMask, rMask, w, h;

  var defaultW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
  var defaultH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

  // Handle call signatures: (blueMask, redMask, w, h) vs (mask, w, h)
  if (typeof redMask === "object" && redMask !== null) {
    bMask = blueMask || (typeof activeGensBlue !== "undefined" ? activeGensBlue : {});
    rMask = redMask || (typeof activeGensRed !== "undefined" ? activeGensRed : {});
    w = (typeof canvasW === "number" && canvasW > 0) ? canvasW : defaultW;
    h = (typeof canvasH === "number" && canvasH > 0) ? canvasH : defaultH;
  } else {
    bMask = blueMask || (typeof activeGensBlue !== "undefined" ? activeGensBlue : {});
    rMask = blueMask || (typeof activeGensRed !== "undefined" ? activeGensRed : {});
    w = (typeof redMask === "number" && redMask > 0) ? redMask : defaultW;
    h = (typeof canvasW === "number" && canvasW > 0) ? canvasW : defaultH;
  }

  // Update global masks if defined
  if (typeof activeGensBlue !== "undefined" && typeof activeGensRed !== "undefined") {
    for (var ag = 1; ag <= 7; ag++) {
      if (typeof bMask[ag] !== "undefined") activeGensBlue[ag] = Boolean(bMask[ag]);
      if (typeof rMask[ag] !== "undefined") activeGensRed[ag] = Boolean(rMask[ag]);
    }
    if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
    if (typeof saveActiveGens === "function") saveActiveGens();
    if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();
  }

  var bPool = globalDogfightJetsState.bluePool;
  var rPool = globalDogfightJetsState.redPool;
  var aJets = globalDogfightJetsState.allJets;

  var bGens = [];
  var rGens = [];
  for (var g = 1; g <= 7; g++) {
    if (bMask[g]) bGens.push(g);
    if (rMask[g]) rGens.push(g);
  }

  var blueActiveList = [];
  var redActiveList = [];
  // Deploy 2-ship tactical element (Lead + Wingman) per active generation
  var bShipsPerGen = (bGens.length <= 3) ? 2 : 1;
  var rShipsPerGen = (rGens.length <= 3) ? 2 : 1;

  for (var bgi = 0; bgi < bGens.length; bgi++) {
    for (var s = 0; s < bShipsPerGen && blueActiveList.length < bPool.length; s++) {
      blueActiveList.push(bGens[bgi]);
    }
  }
  for (var rgi = 0; rgi < rGens.length; rgi++) {
    for (var s2 = 0; s2 < rShipsPerGen && redActiveList.length < rPool.length; s2++) {
      redActiveList.push(rGens[rgi]);
    }
  }

  var nBlue = blueActiveList.length;
  var nRed = redActiveList.length;

  if (nBlue === 0 && nRed === 0) {
    for (var i = 0; i < aJets.length; i++) {
      aJets[i].active = false;
      aJets[i].targetJet = null;
      aJets[i].wingmanJet = null;
    }
    return;
  }

  // Sync Blue Pool
  for (var bIdx = 0; bIdx < nBlue; bIdx++) {
    var bg = blueActiveList[bIdx];
    var specB = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[bg]) ? AIRCRAFT_SPECS[bg] : { baseSpeed: 4.8 };
    var bAltY = getYFromAltitude(RESPAWN_CEILINGS[bg] || 52000, h);

    var bJet = bPool[bIdx];
    bJet.gen = bg;
    bJet.team = "blue";
    bJet.active = true;
    bJet.isDying = false;
    bJet.deathTimer = 0;
    bJet.fadeAlpha = 1.0;
    bJet.hp = 100.0;
    bJet.maxHp = 100.0;
    bJet.damageState = "NOMINAL";
    bJet.lastDamagedBy = "";
    bJet.damageSmokeTimer = 0;
    bJet.damageSparksTimer = 0;
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);
    var rwyY = mslY - 14;
    // Staggered tactical runway positions for Lead & Wingman
    bJet.x = w * 0.04 + ((bIdx % 2 === 0) ? 36 : 10);
    bJet.y = rwyY - 1;
    bJet.angle = 0.0;
    bJet.targetAngle = 0.0;
    bJet.speed = 1.8;
    bJet.baseSpeed = specB.baseSpeed || 4.8;
    bJet.prevSpeed = bJet.speed;
    bJet.ps = 0;
    bJet.turnRate = 0;
    bJet.gForce = 1.0;
    bJet.isStalled = false;
    bJet.mode = "TAKEOFF";
    bJet.takeoffRoll = -(bIdx % 2) * 12;
    bJet.modeTimer = 30;
    bJet.afterburner = true;
    bJet.throttleSetting = 1.5;
    bJet.targetJet = null;
    bJet.isLead = (bIdx % 2 === 0);
    bJet.isHero = (bIdx === 0);
    bJet.rcs = specB.rcsClean || specB.rcs || 1.0;
    bJet.bayDoorTimer = 0;
    bJet.flareCooldown = 0;
    bJet.chaffCooldown = 0;
    bJet.gunCooldown = 0;
    bJet.missileCooldown = bg === 1 ? 999999 : (10 + Math.floor(Math.random() * 11));
    bJet.missileCapacity = (specB && typeof specB.missileCapacity === "number") ? specB.missileCapacity : (bg === 1 || bg === 7 ? 0 : 6);
    bJet.missilesRemaining = bJet.missileCapacity;
    bJet.isWinchester = (bJet.missilesRemaining === 0 && bg < 7);
    bJet.fuelMax = 100.0;
    bJet.fuel = 100.0;
    bJet.isBingoFuel = false;
    bJet.kills = 0;
    bJet.isAce = false;
    bJet.turnAgilityBonus = 1.0;
    bJet.laserCooldown = 0;
    bJet.triLaserCooldown = 0;
    bJet.superLaserCooldown = bg === 7 ? (60 + Math.floor(Math.random() * 60)) : 0;
    bJet.superLaserPulse = 0;
    bJet.ccaDeployed = (bg === 6);
    if (bg === 6) {
      if (!bJet.cca1) bJet.cca1 = { x: bJet.x, y: bJet.y, angle: bJet.angle, speed: bJet.speed, active: true, laserCooldown: 0 };
      if (!bJet.cca2) bJet.cca2 = { x: bJet.x, y: bJet.y, angle: bJet.angle, speed: bJet.speed, active: true, laserCooldown: 0 };
      bJet.cca1.active = true;
      bJet.cca2.active = true;
      bJet.cca1.x = bJet.x + Math.cos(bJet.angle) * 55 - Math.sin(bJet.angle) * 65;
      bJet.cca1.y = bJet.y + Math.sin(bJet.angle) * 55 + Math.cos(bJet.angle) * 65;
      bJet.cca1.angle = bJet.angle;
      bJet.cca1.speed = bJet.speed;
      bJet.cca2.x = bJet.x + Math.cos(bJet.angle) * 55 + Math.sin(bJet.angle) * 65;
      bJet.cca2.y = bJet.y + Math.sin(bJet.angle) * 55 - Math.cos(bJet.angle) * 65;
      bJet.cca2.angle = bJet.angle;
      bJet.cca2.speed = bJet.speed;
    } else {
      if (bJet.cca1) bJet.cca1.active = false;
      if (bJet.cca2) bJet.cca2.active = false;
    }
    setupJetCallsignAndVariant(bJet, bg, "blue", bIdx);
    if (bJet.contrail) bJet.contrail.clear();
    if (bJet.wingVapor) bJet.wingVapor.clear();
  }
  for (var bRem = nBlue; bRem < 7; bRem++) {
    bPool[bRem].active = false;
    bPool[bRem].targetJet = null;
    bPool[bRem].wingmanJet = null;
  }

  // Sync Red Pool
  for (var rIdx = 0; rIdx < nRed; rIdx++) {
    var rg = redActiveList[rIdx];
    var specR = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[rg]) ? AIRCRAFT_SPECS[rg] : { baseSpeed: 4.8 };
    var rAltY = getYFromAltitude(RESPAWN_CEILINGS[rg] || 52000, h);

    var rJet = rPool[rIdx];
    rJet.gen = rg;
    rJet.team = "red";
    rJet.active = true;
    rJet.isDying = false;
    rJet.deathTimer = 0;
    rJet.fadeAlpha = 1.0;
    rJet.hp = 100.0;
    rJet.maxHp = 100.0;
    rJet.damageState = "NOMINAL";
    rJet.lastDamagedBy = "";
    rJet.damageSmokeTimer = 0;
    rJet.damageSparksTimer = 0;
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);
    var rwyY = mslY - 12;
    // Staggered tactical runway positions for Red Lead & Wingman
    rJet.x = w * 0.96 - ((rIdx % 2 === 0) ? 36 : 10);
    rJet.y = rwyY - 1;
    rJet.angle = Math.PI;
    rJet.targetAngle = Math.PI;
    rJet.speed = 1.8;
    rJet.baseSpeed = specR.baseSpeed || 4.8;
    rJet.prevSpeed = rJet.speed;
    rJet.ps = 0;
    rJet.turnRate = 0;
    rJet.gForce = 1.0;
    rJet.isStalled = false;
    rJet.mode = "TAKEOFF";
    rJet.takeoffRoll = -(rIdx % 2) * 12;
    rJet.modeTimer = 30;
    rJet.afterburner = true;
    rJet.throttleSetting = 1.5;
    rJet.targetJet = null;
    rJet.isLead = (rIdx % 2 === 0);
    rJet.isHero = false;
    rJet.rcs = specR.rcsClean || specR.rcs || 1.0;
    rJet.bayDoorTimer = 0;
    rJet.flareCooldown = 0;
    rJet.chaffCooldown = 0;
    rJet.gunCooldown = 0;
    rJet.missileCooldown = rg === 1 ? 999999 : (10 + Math.floor(Math.random() * 11));
    rJet.missileCapacity = (specR && typeof specR.missileCapacity === "number") ? specR.missileCapacity : (rg === 1 || rg === 7 ? 0 : 6);
    rJet.missilesRemaining = rJet.missileCapacity;
    rJet.isWinchester = (rJet.missilesRemaining === 0 && rg < 7);
    rJet.fuelMax = 100.0;
    rJet.fuel = 100.0;
    rJet.isBingoFuel = false;
    rJet.kills = 0;
    rJet.isAce = false;
    rJet.turnAgilityBonus = 1.0;
    rJet.laserCooldown = 0;
    rJet.triLaserCooldown = 0;
    rJet.superLaserCooldown = rg === 7 ? (60 + Math.floor(Math.random() * 60)) : 0;
    rJet.superLaserPulse = 0;
    rJet.ccaDeployed = (rg === 6);
    if (rg === 6) {
      if (!rJet.cca1) rJet.cca1 = { x: rJet.x, y: rJet.y, angle: rJet.angle, speed: rJet.speed, active: true, laserCooldown: 0 };
      if (!rJet.cca2) rJet.cca2 = { x: rJet.x, y: rJet.y, angle: rJet.angle, speed: rJet.speed, active: true, laserCooldown: 0 };
      rJet.cca1.active = true;
      rJet.cca2.active = true;
      rJet.cca1.x = rJet.x + Math.cos(rJet.angle) * 55 - Math.sin(rJet.angle) * 65;
      rJet.cca1.y = rJet.y + Math.sin(rJet.angle) * 55 + Math.cos(rJet.angle) * 65;
      rJet.cca1.angle = rJet.angle;
      rJet.cca1.speed = rJet.speed;
      rJet.cca2.x = rJet.x + Math.cos(rJet.angle) * 55 + Math.sin(rJet.angle) * 65;
      rJet.cca2.y = rJet.y + Math.sin(rJet.angle) * 55 - Math.cos(rJet.angle) * 65;
      rJet.cca2.angle = rJet.angle;
      rJet.cca2.speed = rJet.speed;
    } else {
      if (rJet.cca1) rJet.cca1.active = false;
      if (rJet.cca2) rJet.cca2.active = false;
    }
    setupJetCallsignAndVariant(rJet, rg, "red", rIdx);
    if (rJet.contrail) rJet.contrail.clear();
    if (rJet.wingVapor) rJet.wingVapor.clear();
  }
  for (var rRem = nRed; rRem < 7; rRem++) {
    rPool[rRem].active = false;
    rPool[rRem].targetJet = null;
    rPool[rRem].wingmanJet = null;
  }

  // Cross-team target pairing
  if (nBlue > 0 && nRed > 0) {
    for (var bi = 0; bi < nBlue; bi++) {
      bPool[bi].targetJet = rPool[bi % nRed];
    }
    for (var ri = 0; ri < nRed; ri++) {
      rPool[ri].targetJet = bPool[ri % nBlue];
    }
  }

  // Assign wingman links
  for (var bwi = 0; bwi < nBlue; bwi++) {
    var bPartner = (nBlue > 1) ? ((bwi % 2 === 0) ? (bwi + 1 < nBlue ? bwi + 1 : bwi) : bwi - 1) : bwi;
    bPool[bwi].wingmanJet = bPool[bPartner];
  }
  for (var rwi = 0; rwi < nRed; rwi++) {
    var rPartner = (nRed > 1) ? ((rwi % 2 === 0) ? (rwi + 1 < nRed ? rwi + 1 : rwi) : rwi - 1) : rwi;
    rPool[rwi].wingmanJet = rPool[rPartner];
  }
}
