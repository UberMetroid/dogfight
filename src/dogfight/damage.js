// # Damage
//
// Logline: HP, death, fireball, radio.
//
var globalHudFrameCount = 0;
var globalRadioAdd = null;

function triggerTacticalRadio(text) {
  if (typeof globalRadioAdd === "function") globalRadioAdd(text);
}

function applyAirframeDamage(targetJet, damageAmount, attacker, weaponName) {
  if (!targetJet || !targetJet.active || targetJet.isDying) return false;
  var dmg = typeof damageAmount === "number" ? Math.max(0, damageAmount) : 0;
  var curHp = typeof targetJet.hp === "number" ? targetJet.hp : 100.0;
  var oldHp = curHp;
  targetJet.hp = Math.max(0.0, curHp - dmg);
  if (attacker) targetJet.lastDamagedBy = attacker.callsign || ("GEN " + attacker.gen);
  if (targetJet.hp <= 0.0) {
    targetJet.hp = 0.0;
    targetJet.damageState = "DESTROYED";
    targetJet.isDying = true;
    targetJet.deathTimer = 45;
    targetJet.fadeAlpha = 1.0;
    if (attacker && attacker !== targetJet) attacker.kills = (attacker.kills || 0) + 1;
    if (typeof DF !== "undefined") {
      if (targetJet.team === "red") {
        DF.blueKills = (DF.blueKills || 0) + 1;
      } else if (targetJet.team === "blue") {
        DF.redKills = (DF.redKills || 0) + 1;
      }
    }
    var tCallsign = targetJet.callsign || ("GEN " + (targetJet.gen || 4));
    var isOceanCrash = (weaponName === "WATER_IMPACT");
    var isTerrainCrash = (weaponName === "TERRAIN_IMPACT");

    var pvx = Math.cos(targetJet.angle || 0) * (targetJet.speed || 0);
    var pvy = Math.sin(targetJet.angle || 0) * (targetJet.speed || 0);

    if (isOceanCrash) {
      triggerTacticalRadio("MAYDAY! " + tCallsign + " DITCHED IN OCEAN! SPLASHDOWN AT SEA LEVEL!");
      if (typeof spawnWaterSplash === "function") {
        spawnWaterSplash(targetJet.x, targetJet.y, Math.hypot(pvx, pvy), targetJet.gen || 4);
      }
      if (typeof window !== "undefined" && window.TacticalAudio && window.TacticalAudio.playSplash) {
        window.TacticalAudio.playSplash();
      }
    } else if (isTerrainCrash) {
      triggerTacticalRadio("CFIT ALERT! " + tCallsign + " IMPACTED TERRAIN! COMPLETE AIRFRAME LOSS!");
      if (typeof spawnStage1Fireball === "function") {
        spawnStage1Fireball(targetJet.x, targetJet.y, pvx * 0.4, -1.0, 48, targetJet.gen || 4);
      }
      if (typeof triggerStage3GroundImpact === "function") {
        triggerStage3GroundImpact(targetJet.x, targetJet.y, pvx, targetJet.gen || 4);
      }
      if (typeof window !== "undefined" && window.TacticalAudio && window.TacticalAudio.playExplosion) {
        window.TacticalAudio.playExplosion();
      }
    } else {
      triggerTacticalRadio("SPLASH ONE! " + tCallsign + " DOWNED!");
      if (typeof spawnStage1Fireball === "function") {
        spawnStage1Fireball(targetJet.x, targetJet.y, pvx, pvy, 48, targetJet.gen || 4);
      }
    }
    if (typeof spawnStage2Wreckage === "function") spawnStage2Wreckage(targetJet);
    return true;
  } else if (targetJet.hp < 20.0) {
    targetJet.damageState = "CRITICAL";
    if (oldHp >= 20.0) {
      triggerTacticalRadio("MAYDAY! " + (targetJet.callsign || ("GEN " + targetJet.gen)) + " COMPRESSOR STALL! AIRFRAME CRITICAL!");
    }
    return false;
  } else if (targetJet.hp < 45.0) {
    targetJet.damageState = "MODERATE";
    return false;
  } else if (targetJet.hp < 70.0) {
    targetJet.damageState = "LIGHT";
    return false;
  }
  targetJet.damageState = "NOMINAL";
  return false;
}
