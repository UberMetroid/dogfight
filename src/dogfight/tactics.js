// # Tactics
//
// Logline: Pool vs pool targeting.
//
function updateTacticalManeuvers(friendlyPool, opposingPool) {
  for (var i = 0; i < friendlyPool.length; i++) {
    var jet = friendlyPool[i];
    if (!jet.active || jet.isDying) {
      jet.targetJet = null;
      continue;
    }

    // Preserve EVADE_FARP standoff maneuver while active to prevent target re-acquisition into defense zone
    if (jet.mode === "EVADE_FARP" && typeof jet.modeTimer === "number" && jet.modeTimer > 0) {
      jet.targetJet = null;
      continue;
    }

    // 1. Dynamic Target Acquisition with Radar Equation, Stealth RCS, and Service Ceiling Filters
    var bestTarget = null;
    var minDist = 999999;
    var mySpec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[jet.gen]) ? AIRCRAFT_SPECS[jet.gen] : {};
    var myRadarBase = mySpec.radarBaseline || 600;
    var myCeiling = (typeof SERVICE_CEILINGS !== "undefined" && SERVICE_CEILINGS[jet.gen]) ? SERVICE_CEILINGS[jet.gen] : 60000;
    var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
    var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
    var myAltFt = (typeof getAltitudeFeet === "function") ? getAltitudeFeet(jet.y, worldH) : 30000;

    for (var j = 0; j < opposingPool.length; j++) {
      var opp = opposingPool[j];
      if (!opp || !opp.active || opp.isDying) continue;

      var d = Math.hypot(opp.x - jet.x, opp.y - jet.y);
      var oppAltFt = (typeof getAltitudeFeet === "function") ? getAltitudeFeet(opp.y, worldH) : 30000;

      // Service ceiling limit: lower generation jets cannot reach or lock targets high above their ceiling
      if (oppAltFt > myCeiling + 3000) {
        continue;
      }

      // Radar Range & Stealth Cross Section (RCS) Equation: R_detect = R_baseline * (RCS ^ 0.25)
      var oppRcs = (typeof opp.rcs === "number") ? opp.rcs : 1.0;
      var effectiveRadarReach = myRadarBase * Math.pow(Math.max(0.000001, oppRcs), 0.25);
      // Visual spotting envelope: ~240px visual identification range for pilots
      var maxDetectionRange = Math.max(240, effectiveRadarReach);

      if (d > maxDetectionRange) {
        continue; // Bandit is stealth / undetectable outside sensor envelope
      }

      // Do NOT pursue bandits that have retreated inside their home FARP defense umbrella
      if (jet.team === "blue" && opp.x > worldW * 0.70) {
        continue; // Blue fighters stay outside Red FARP Delta defense envelope
      }
      if (jet.team === "red" && opp.x < worldW * 0.30) {
        continue; // Red fighters stay outside Blue Base Alpha / Carrier defense envelope
      }

      // Do NOT target aircraft taking off or landing at their home base
      if (opp.mode === "ACE_APPROACH" || opp.mode === "ACE_TOUCHDOWN" || opp.mode === "FARP_TAKEOFF") {
        continue;
      }
      if (d < minDist) {
        minDist = d;
        bestTarget = opp;
      }
    }
    jet.targetJet = bestTarget;

    var wingman = jet.wingmanJet;

    // 2. Cooperative Mutual Defensive Cover
    if (wingman && wingman.active && !wingman.isDying && jet.mode !== "BREAK" && jet.mode !== "GPWS_PULLUP") {
      for (var oj = 0; oj < opposingPool.length; oj++) {
        var enemyPursuer = opposingPool[oj];
        if (!enemyPursuer.active || enemyPursuer.isDying) continue;
        if (enemyPursuer.targetJet === wingman) {
          var distToWm = Math.hypot(wingman.x - enemyPursuer.x, wingman.y - enemyPursuer.y);
          var tailAngle = wingman.angle + Math.PI;
          var bearingToE = Math.atan2(enemyPursuer.y - wingman.y, enemyPursuer.x - wingman.x);
          var angleOffTail = Math.abs(bearingToE - tailAngle);
          while (angleOffTail > Math.PI) angleOffTail = Math.abs(angleOffTail - Math.PI * 2);
          if (distToWm < 260 && angleOffTail < 0.8) {
            jet.targetJet = enemyPursuer;
            jet.mode = "COVER";
            jet.modeTimer = 45;
            jet.throttleSetting = 1.5;
            jet.afterburner = true;
            if (Math.random() < 0.02) {
              dfRadio(jet.callsign + ": DEFENSIVE COVER! BREAKING INTO THREAT ON " + wingman.callsign + "'S SIX!");
            }
            break;
          }
        }
      }
    }

    // 3. Head-On Merge Maneuver Detection & Post-Merge Pitchback Latch
    if (jet.targetJet && jet.mode !== "COVER" && jet.mode !== "BREAK" && jet.mode !== "GPWS_PULLUP") {
      var tgt = jet.targetJet;
      var dMerge = Math.hypot(tgt.x - jet.x, tgt.y - jet.y);
      var hdgDiff = Math.abs(jet.angle - tgt.angle);
      while (hdgDiff > Math.PI) hdgDiff = Math.abs(hdgDiff - Math.PI * 2);

      if (hdgDiff > 1.8 && dMerge < 250) {
        jet.mode = "MERGE_PITCHBACK";
        jet.modeTimer = 24;
        jet.pitchbackTimer = 24;
        var leadTime = Math.min(dMerge / 14.0, 15.0);
        var leadX = tgt.x + Math.cos(tgt.angle) * tgt.speed * leadTime;
        var leadY = tgt.y + Math.sin(tgt.angle) * tgt.speed * leadTime;
        jet.targetAngle = Math.atan2(leadY - jet.y, leadX - jet.x);
        jet.afterburner = true;
        jet.throttleSetting = 1.5;
        if (Math.random() < 0.03) {
          dfRadio(jet.callsign + ": HEAD-ON MERGE! 9G POST-MERGE PITCHBACK!");
        }
      } else if (hdgDiff > 1.8 && dMerge >= 250 && dMerge < 450) {
        var leadTime = Math.min(dMerge / 14.0, 18.0);
        var leadX = tgt.x + Math.cos(tgt.angle) * tgt.speed * leadTime;
        var leadY = tgt.y + Math.sin(tgt.angle) * tgt.speed * leadTime;
        jet.targetAngle = Math.atan2(leadY - jet.y, leadX - jet.x);
        jet.afterburner = true;
        jet.throttleSetting = 1.5;
      }
    }

    // 4. Bracket Pincer Maneuver Detection
    if (!jet.isLead && wingman && wingman.active && !wingman.isDying && jet.targetJet && wingman.targetJet === jet.targetJet) {
      var dPincer = Math.hypot(jet.targetJet.x - jet.x, jet.targetJet.y - jet.y);
      if (dPincer < 400 && jet.mode !== "COVER" && jet.mode !== "MERGE" && jet.mode !== "MERGE_PITCHBACK" && jet.mode !== "BREAK" && jet.mode !== "GPWS_PULLUP") {
        jet.mode = "PINCER";
        jet.modeTimer = 40;
        var pincerSign = (jet.y > wingman.y) ? 0.785 : -0.785;
        var directBearing = Math.atan2(jet.targetJet.y - jet.y, jet.targetJet.x - jet.x);
        jet.targetAngle = directBearing + pincerSign;
        jet.throttleSetting = 1.5;
        jet.afterburner = true;
        if (Math.random() < 0.02) {
          dfRadio(jet.callsign + ": BRACKET PINCER! DUAL-AXIS FLANKING RUN ON " + jet.targetJet.callsign + "!");
        }
      }
    }
  }
}
