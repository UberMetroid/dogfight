// # Tactics
//
// Logline: Pool vs pool targeting, normal wingman formation station-keeping, and mutual defense.
//

// Tactical Formation Station Coordinates for Wingman relative to Flight Lead
function getWingmanStation(wingman, lead) {
  var gen = (wingman && wingman.gen) ? wingman.gen : 1;
  var isBlue = (wingman && wingman.team === "blue");
  var sideSign = isBlue ? 1 : -1;

  var trailDist, spreadDist, altOffset;
  if (gen <= 2) {
    // Gen 1-2 Korea / Early Jet: Fighting Wing Echelon (35-45 deg off Lead)
    trailDist = 60;
    spreadDist = 52;
    altOffset = isBlue ? -14 : 14;
  } else if (gen <= 4) {
    // Gen 3-4 Vietnam & Desert Storm: Tactical Combat Spread (Fluid Two / Line-Abreast)
    trailDist = 36;
    spreadDist = 110;
    altOffset = isBlue ? -18 : 18;
  } else {
    // Gen 5-7 Stealth Dispersed Sensor Grid / Loyal Wingman
    trailDist = 30;
    spreadDist = 145;
    altOffset = isBlue ? -22 : 22;
  }

  var cosL = Math.cos(lead.angle);
  var sinL = Math.sin(lead.angle);

  var stX = lead.x - cosL * trailDist - sinL * (spreadDist * sideSign);
  var stY = lead.y - sinL * trailDist + cosL * (spreadDist * sideSign) + altOffset;

  return { x: stX, y: stY, trailDist: trailDist, spreadDist: spreadDist };
}

if (typeof global !== "undefined") global.getWingmanStation = getWingmanStation;
if (typeof window !== "undefined") window.getWingmanStation = getWingmanStation;

function updateTacticalManeuvers(friendlyPool, opposingPool) {
  var actBomber = (typeof StrategicBomberSystem !== "undefined") ? StrategicBomberSystem.activeBomber : null;

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

    // 1. Defending fighters prioritize intercepting incoming hostile Strategic Bomber
    var hostileBomber = (actBomber && actBomber.state !== "SPLASHED" && actBomber.team !== jet.team) ? actBomber : null;
    var friendlyBomber = (actBomber && actBomber.state !== "SPLASHED" && actBomber.team === jet.team) ? actBomber : null;

    if (hostileBomber) {
      // FIGHTERS GO AFTER BOMBERS: Defend home base by vectoring to intercept incoming bomber
      jet.targetJet = hostileBomber;
      jet.mode = "INTERCEPT_BOMBER";
      jet.throttleSetting = 1.6;
      jet.afterburner = true;
      var dbx = hostileBomber.x - jet.x;
      var dby = hostileBomber.y - jet.y;
      jet.targetAngle = Math.atan2(dby, dbx);
      continue;
    }

    // 2. Escort fighters protect friendly bomber from hostile interceptors
    if (friendlyBomber) {
      var threatToBomber = null;
      var minThreatDist = 800;
      for (var oj = 0; oj < opposingPool.length; oj++) {
        var oppInt = opposingPool[oj];
        if (!oppInt || !oppInt.active || oppInt.isDying) continue;
        var distToB = Math.hypot(oppInt.x - friendlyBomber.x, oppInt.y - friendlyBomber.y);
        if (distToB < minThreatDist) {
          minThreatDist = distToB;
          threatToBomber = oppInt;
        }
      }
      if (threatToBomber) {
        jet.targetJet = threatToBomber;
        jet.mode = "ESCORT_BOMBER";
        jet.throttleSetting = 1.5;
        jet.afterburner = true;
        jet.targetAngle = Math.atan2(threatToBomber.y - jet.y, threatToBomber.x - jet.x);
        continue;
      }
    }

    // 3. Dynamic Target Acquisition: Fighters go after fighters
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
      // Grounded aircraft during touch-and-go roll are sheltered by FARP CIWS
      if (opp.mode === "ACE_TOUCHDOWN") continue;

      var d = Math.hypot(opp.x - jet.x, opp.y - jet.y);
      var oppAltFt = (typeof getAltitudeFeet === "function") ? getAltitudeFeet(opp.y, worldH) : 30000;

      // Radar Range & Stealth Cross Section (RCS) Equation: R_detect = R_baseline * (RCS ^ 0.25)
      var oppRcs = (typeof opp.rcs === "number") ? opp.rcs : 1.0;
      var effectiveRadarReach = myRadarBase * Math.pow(Math.max(0.000001, oppRcs), 0.25);
      var maxDetectionRange = Math.max(260, effectiveRadarReach);

      // AWACS / GCI Theater Vectoring: Fighters maintain situational awareness of airborne bandits
      var hasLocalLock = (d <= maxDetectionRange && oppAltFt <= myCeiling + 3000);
      if (d < minDist) {
        minDist = d;
        bestTarget = opp;
        jet.hasOnboardLock = hasLocalLock;
      }
    }
    jet.targetJet = bestTarget;

    var wingman = jet.wingmanJet;
    var isWingmanShip = (!jet.isLead && wingman && wingman.active && !wingman.isDying);

    // 4. Cooperative Mutual Defensive Cover (Check-Six)
    // If an enemy pursuer gets onto friendly wingman/lead's tail, break in to kill the threat!
    if (wingman && wingman.active && !wingman.isDying && jet.mode !== "BREAK" && jet.mode !== "GPWS_PULLUP") {
      for (var oj2 = 0; oj2 < opposingPool.length; oj2++) {
        var enemyPursuer = opposingPool[oj2];
        if (!enemyPursuer.active || enemyPursuer.isDying) continue;
        if (enemyPursuer.targetJet === wingman) {
          var distToWm = Math.hypot(wingman.x - enemyPursuer.x, wingman.y - enemyPursuer.y);
          var tailAngle = wingman.angle + Math.PI;
          var bearingToE = Math.atan2(enemyPursuer.y - wingman.y, enemyPursuer.x - wingman.x);
          var angleOffTail = Math.abs(bearingToE - tailAngle);
          while (angleOffTail > Math.PI) angleOffTail = Math.abs(angleOffTail - Math.PI * 2);
          if (distToWm < 320 && angleOffTail < 0.9) {
            jet.targetJet = enemyPursuer;
            jet.mode = "COVER";
            jet.modeTimer = 45;
            jet.throttleSetting = 1.5;
            jet.afterburner = true;
            if (Math.random() < 0.03) {
              dfRadio(jet.callsign + ": DEFENSIVE COVER! BREAKING INTO THREAT ON " + wingman.callsign + "'S SIX!");
            }
            break;
          }
        }
      }
    }

    if (jet.mode === "COVER") {
      if (jet.targetJet) {
        var cdx = jet.targetJet.x - jet.x;
        var cdy = jet.targetJet.y - jet.y;
        jet.targetAngle = Math.atan2(cdy, cdx);
      }
      continue;
    }

    // 5. Normal Wingman Formation Flight vs Tactical Split / Bracket
    if (isWingmanShip) {
      var isAirportOp = (jet.mode === "TAKEOFF" || jet.mode === "ACE_APPROACH" || jet.mode === "ACE_TOUCHDOWN" || jet.mode === "ACE_SCRAMBLE");
      
      // When far from hostiles, Wingman holds normal station in tactical formation on Lead
      if (minDist > 420 && !isAirportOp) {
        jet.mode = "FORMATION";
        var st = getWingmanStation(jet, wingman);
        var sdx = st.x - jet.x;
        var sdy = st.y - jet.y;
        var dStation = Math.hypot(sdx, sdy);

        if (dStation > 160) {
          // Rejoining formation station
          jet.targetAngle = Math.atan2(sdy, sdx);
          jet.throttleSetting = 1.45;
          jet.afterburner = true;
        } else if (dStation > 30) {
          // Smooth convergence onto station
          var stBearing = Math.atan2(sdy, sdx);
          jet.targetAngle = stBearing * 0.45 + wingman.targetAngle * 0.55;
          jet.speed = wingman.speed + Math.min(1.2, dStation / 70.0);
          jet.throttleSetting = wingman.throttleSetting;
          jet.afterburner = wingman.afterburner;
        } else {
          // Locked in formation echelon/spread
          jet.targetAngle = wingman.targetAngle;
          jet.speed = wingman.speed;
          jet.throttleSetting = wingman.throttleSetting;
          jet.afterburner = wingman.afterburner;
        }
        continue;
      }

      // Close-in combat: Fluid Two / Shooter-Cover / Bracket
      if (minDist <= 420 && !isAirportOp) {
        // Find secondary target so element does not fixate on single bandit if multiple exist
        var secTarget = null;
        var secDist = 999999;
        for (var tk = 0; tk < opposingPool.length; tk++) {
          var cand = opposingPool[tk];
          if (!cand || !cand.active || cand.isDying || cand.mode === "ACE_TOUCHDOWN") continue;
          if (wingman.targetJet === cand) continue; // Leave Lead's target to Lead
          var candD = Math.hypot(cand.x - jet.x, cand.y - jet.y);
          if (candD < secDist) {
            secDist = candD;
            secTarget = cand;
          }
        }

        if (secTarget) {
          jet.targetJet = secTarget;
          jet.mode = "PURSUIT";
          jet.throttleSetting = 1.5;
          jet.afterburner = true;
          var tdx = secTarget.x - jet.x;
          var tdy = secTarget.y - jet.y;
          jet.targetAngle = Math.atan2(tdy, tdx);
          if (Math.random() < 0.02) {
            dfRadio(jet.callsign + ": TWO SORTED SECONDARY BANDIT (" + secTarget.callsign + ")! COMMITTING!");
          }
          continue;
        } else if (jet.targetJet) {
          // Single hostile: execute bracket pincer maneuver
          jet.mode = "PINCER";
          jet.modeTimer = 35;
          var pSign = (jet.y > wingman.y) ? 0.65 : -0.65;
          var directBearing = Math.atan2(jet.targetJet.y - jet.y, jet.targetJet.x - jet.x);
          jet.targetAngle = directBearing + pSign;
          jet.throttleSetting = 1.45;
          jet.afterburner = true;
          if (Math.random() < 0.02) {
            dfRadio(jet.callsign + ": BRACKET PINCER! DUAL-AXIS FLANKING RUN ON " + jet.targetJet.callsign + "!");
          }
          continue;
        }
      }
    }

    // 6. Head-On Merge Maneuver Detection & Post-Merge Pitchback Latch (for Lead & Free Fighters)
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
        var leadTime2 = Math.min(dMerge / 14.0, 18.0);
        var leadX2 = tgt.x + Math.cos(tgt.angle) * tgt.speed * leadTime2;
        var leadY2 = tgt.y + Math.sin(tgt.angle) * tgt.speed * leadTime2;
        jet.targetAngle = Math.atan2(leadY2 - jet.y, leadX2 - jet.x);
        jet.afterburner = true;
        jet.throttleSetting = 1.5;
      }
    }
  }
}
