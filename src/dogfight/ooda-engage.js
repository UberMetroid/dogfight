// # OODA decide engage
//
// Logline: Pursuit, merge, and patrol when not in a named mode.
//
function oodaDecideEngage(jet, obs, ori, targetEnemy, altFt, sCeiling, flaresPool, chaffPool) {
  if (!jet) return;
  // If jet is in EVADE_FARP mode, preserve standoff heading away from hostile defenses
  if (jet.mode === "EVADE_FARP" && typeof jet.modeTimer === "number" && jet.modeTimer > 0) {
    return;
  }

  // If intercepting hostile bomber to save base, vector directly toward bomber
  if (jet.mode === "INTERCEPT_BOMBER") {
    var strB = (typeof StrategicBomberSystem !== "undefined") ? StrategicBomberSystem.activeBomber : null;
    if (strB && strB.state !== "SPLASHED" && strB.team !== jet.team) {
      var dbx = strB.x - jet.x;
      var dby = strB.y - jet.y;
      jet.targetAngle = Math.atan2(dby, dbx);
      jet.throttleSetting = 1.6;
      jet.afterburner = true;
      return;
    }
  }
  var isNearCeil = (altFt >= 95000 || (typeof jet.y === "number" && jet.y <= 36.0));
  if (targetEnemy && targetEnemy.active && !targetEnemy.isDying) {
    var dx = targetEnemy.x - jet.x;
    var dy = targetEnemy.y - jet.y;
    var dist = Math.hypot(dx, dy);
    var hdgDiff = Math.abs(jet.angle - targetEnemy.angle);
    while (hdgDiff > Math.PI) hdgDiff = Math.abs(hdgDiff - Math.PI * 2);

    var closureRate = (obs && typeof obs.banditClosure === "number") ? obs.banditClosure : 0;
    var isClosingTooFast = (closureRate > 4.0) || (dist < 280 && jet.speed > V_CORNER);
    var hasEnergySurplus = (jet.energyHeight > 48000) || (targetEnemy && (jet.energyHeight || 0) > (targetEnemy.energyHeight || 0) + 6000);

    var bearingToTarget = Math.atan2(dy, dx);
    var aotTargetTail = Math.abs(bearingToTarget - targetEnemy.angle);
    while (aotTargetTail > Math.PI) aotTargetTail = Math.abs(aotTargetTail - Math.PI * 2);

    if (dist > 480) {
      // High-Speed AWACS Intercept Closure
      jet.mode = "PURSUIT";
      jet.isTailChasing = false;
      var leadT = Math.min(dist / 14.0, 24.0);
      var lx = targetEnemy.x + Math.cos(targetEnemy.angle) * targetEnemy.speed * leadT;
      var ly = targetEnemy.y + Math.sin(targetEnemy.angle) * targetEnemy.speed * leadT;
      jet.targetAngle = Math.atan2(ly - jet.y, lx - jet.x);
      jet.throttleSetting = 1.5;
      jet.afterburner = true;
    } else if ((dist < 400 && hdgDiff > 1.4) || (dist < 320 && closureRate < -1.0)) {
      // Explosive Head-on Merge & 9G Post-Merge Pitchback
      jet.mode = "MERGE_PITCHBACK";
      jet.isTailChasing = false;
      jet.modeTimer = 28;
      jet.pitchbackTimer = 28;
      var leadTime = Math.min(dist / 14.0, 16.0);
      var leadX = targetEnemy.x + Math.cos(targetEnemy.angle) * targetEnemy.speed * leadTime;
      var leadY = targetEnemy.y + Math.sin(targetEnemy.angle) * targetEnemy.speed * leadTime;
      jet.targetAngle = Math.atan2(leadY - jet.y, leadX - jet.x);
      jet.throttleSetting = 1.6;
      jet.afterburner = true;
    } else if (ori && ori.recommendedPursuit === "LAG") {
      jet.mode = "PURSUIT";
      jet.isTailChasing = (aotTargetTail < 1.05 && dist <= 450);
      var directBearing = Math.atan2(dy, dx);
      var lagOffset = (Math.sin(targetEnemy.angle - directBearing) >= 0 ? -0.25 : 0.25);
      jet.targetAngle = directBearing + lagOffset;
      jet.throttleSetting = 1.0;
      jet.afterburner = (jet.speed < 5.0);
    } else if (!isNearCeil && (isClosingTooFast || jet.energyHeight > 65000) && (hasEnergySurplus || jet.energyHeight > 65000) && dist < 280 && altFt < sCeiling - 3000 && (typeof jet.ps === "undefined" || jet.ps >= -50)) {
      // Boyd E-M High Yo-Yo: steep vertical climb trading kinetic speed for altitude
      jet.mode = "YOYO_HIGH";
      jet.isTailChasing = false;
      var isFacingRightHighYo = Math.cos(jet.angle) >= 0;
      jet.targetAngle = isFacingRightHighYo ? -1.25 : (jet.angle < 0 ? -Math.PI + 1.25 : Math.PI - 1.25);
      jet.throttleSetting = 1.5;
      jet.afterburner = true;
    } else if (dist > 250 && (jet.speed < targetEnemy.speed || (jet.energyHeight || 0) < (targetEnemy.energyHeight || 0) - 4000) && altFt > 14000) {
      // Boyd E-M Low Yo-Yo: steep energy dive converting potential energy to speed
      jet.mode = "YOYO_LOW";
      jet.isTailChasing = false;
      var isFacingRightLowYo = Math.cos(jet.angle) >= 0;
      jet.targetAngle = isFacingRightLowYo ? 0.85 : (jet.angle < 0 ? -Math.PI - 0.85 : Math.PI + 0.85);
      jet.throttleSetting = 1.5;
      jet.afterburner = true;
    } else {
      jet.mode = "PURSUIT";
      var isBehindBandit = (aotTargetTail < 1.05); // AOT < 60 deg (1.047 rad)

      if (isBehindBandit && dist <= 500) {
        // Relentless Tail-Chase Latch: Match turns, track 150-400 px envelope
        jet.isTailChasing = true;
        jet.tailChaseTimer = 30;
        var leadTime = Math.min(dist / 14.0, 12.0);
        var leadX = targetEnemy.x + Math.cos(targetEnemy.angle) * targetEnemy.speed * leadTime;
        var leadY = targetEnemy.y + Math.sin(targetEnemy.angle) * targetEnemy.speed * leadTime;
        var leadAngle = Math.atan2(leadY - jet.y, leadX - jet.x);

        // Blend lead pursuit with matching bandit turn heading when close (150-300 px)
        if (dist >= 150 && dist <= 300) {
          var blend = (dist - 150.0) / 150.0;
          jet.targetAngle = leadAngle * blend + targetEnemy.angle * (1.0 - blend);
        } else {
          jet.targetAngle = leadAngle;
        }

        // Throttle modulation in tail chase: maintain position in 150-400px kill zone
        if (dist < 150 && jet.speed > targetEnemy.speed) {
          jet.throttleSetting = 0.8;
          jet.afterburner = false;
        } else if (dist > 280 || jet.speed < targetEnemy.speed) {
          jet.throttleSetting = 1.5;
          jet.afterburner = true;
        } else {
          jet.throttleSetting = 1.5;
          jet.afterburner = (jet.speed < 5.4);
        }
      } else {
        // Continuous 2-Circle Rate Fight Flow / 3D Vertical Merge
        jet.isTailChasing = false;
        var leadTime = Math.min(dist / 14.0, 20.0);
        var leadX = targetEnemy.x + Math.cos(targetEnemy.angle) * targetEnemy.speed * leadTime;
        var leadY = targetEnemy.y + Math.sin(targetEnemy.angle) * targetEnemy.speed * leadTime;
        var baseLeadAngle = Math.atan2(leadY - jet.y, leadX - jet.x);

        if (hdgDiff > 0.6 && hdgDiff <= 2.2 && dist >= 80 && dist <= 450) {
          // Continuous 2-Circle rate fight orbital flow: continuous turning circle at corner velocity
          jet.targetAngle = baseLeadAngle;
          if (jet.speed > 5.4) {
            jet.throttleSetting = 0.85;
            jet.afterburner = false;
          } else if (jet.speed < 4.6) {
            jet.throttleSetting = 1.5;
            jet.afterburner = true;
          } else {
            jet.throttleSetting = 1.2;
            jet.afterburner = true;
          }
        } else {
          jet.targetAngle = baseLeadAngle;
          jet.throttleSetting = 1.5;
          jet.afterburner = true;
        }
      }
    }
  } else {
    // Zero Passive Cruising Mandate: Continuous Generational Altitude Cruise & Radar S-Turns
    jet.mode = "TACTICAL_SWEEP";
    jet.isTailChasing = false;
    jet.patrolSweepAngle = (jet.patrolSweepAngle || 0) + 0.035;
    var sweepWeave = Math.sin(jet.patrolSweepAngle) * 0.25;

    // Boundary-aware Combat Air Patrol: fighters patrol central ocean and stay outside hostile FARP weapon range
    var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
    var baseHeading;
    if (jet.team === "blue") {
      // Blue sweeps East up to 65% of world width, then turns back West to stay clear of Red FARP Delta
      if (jet.x > worldW * 0.65) {
        baseHeading = Math.PI;
      } else if (jet.x < worldW * 0.28) {
        baseHeading = 0.0;
      } else {
        baseHeading = (Math.cos(jet.angle) >= 0) ? 0.0 : Math.PI;
      }
    } else {
      // Red sweeps West down to 35% of world width, then turns back East to stay clear of Blue Base/Carrier
      if (jet.x < worldW * 0.35) {
        baseHeading = 0.0;
      } else if (jet.x > worldW * 0.72) {
        baseHeading = Math.PI;
      } else {
        baseHeading = (Math.cos(jet.angle) >= 0) ? 0.0 : Math.PI;
      }
    }

    // Generational Altitude Seeking
    var targetAltFt = (typeof CRUISE_ALTITUDES !== "undefined" && CRUISE_ALTITUDES[jet.gen]) ? CRUISE_ALTITUDES[jet.gen] : 45000;
    var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
    var targetAltY = (typeof getYFromAltitude === "function") ? getYFromAltitude(targetAltFt, worldH) : 250;
    var altDiffY = targetAltY - jet.y; // < 0: climb, > 0: descend
    var pitchCorr = Math.max(-0.35, Math.min(0.35, altDiffY * 0.005));

    jet.targetAngle = baseHeading + sweepWeave + (baseHeading === 0.0 ? pitchCorr : -pitchCorr);
    jet.throttleSetting = 1.2;
    jet.afterburner = true;
  }

  // Strict Service Ceiling Aerodynamic Clamp: Prevent lower-gen fighters from pitching up beyond their flight envelope
  if (altFt >= sCeiling - 1200 && Math.sin(jet.targetAngle) < 0) {
    var isRightHeading = Math.cos(jet.angle) >= 0;
    jet.targetAngle = isRightHeading ? 0.05 : (jet.angle < 0 ? -Math.PI - 0.05 : Math.PI + 0.05);
  }
}
