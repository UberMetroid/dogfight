// # Tactics
//
// Logline: Pool vs pool targeting, normal wingman formation station-keeping, and mutual defense.
//

// Tactical Formation Station Coordinates for Wingman relative to Flight Lead (2D Side-View)
function getWingmanStation(wingman, lead) {
  var gen = (wingman && wingman.gen) ? wingman.gen : 1;
  var isWest = (wingman && wingman.team === "west");

  // Trail distance behind lead along flight path
  var trailDist, stepUp;
  if (gen <= 2) {
    // Gen 1-2 Korea / Early Jet: Fighting Wing (48px trail, stepped up 10px / ~1000 ft clear of jet wash)
    trailDist = 48;
    stepUp = -10;
  } else if (gen <= 4) {
    // Gen 3-4 Tactical Combat Spread: 65px trail, stepped up 14px (~1400 ft)
    trailDist = 65;
    stepUp = -14;
  } else {
    // Gen 5-7 Dispersed Sensor Grid: 80px trail, stepped up 18px (~1800 ft)
    trailDist = 80;
    stepUp = -18;
  }

  var cosL = Math.cos(lead.angle);
  var sinL = Math.sin(lead.angle);

  // Position strictly trailing behind lead along flight path with altitude step-up
  var stX = lead.x - cosL * trailDist;
  var stY = lead.y - sinL * trailDist + stepUp;

  // Ground and terrain clearance safety: never command wingman below terrain or sea
  var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
  var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(worldH) : Math.floor(worldH * 0.84);
  if (stY > mslY - 25) stY = mslY - 25;
  if (lead.y > mslY - 120 && stY > lead.y - 8) {
    stY = lead.y - 8;
  }

  return { x: stX, y: stY, trailDist: trailDist, stepUp: stepUp };
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
    var mySpec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[jet.gen]) ? AIRCRAFT_SPECS[jet.gen] : {};
    var myRadarBase = mySpec.radarBaseline || 600;
    var myCeiling = (typeof SERVICE_CEILINGS !== "undefined" && SERVICE_CEILINGS[jet.gen]) ? SERVICE_CEILINGS[jet.gen] : 60000;
    var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
    var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
    var myAltFt = (typeof getAltitudeFeet === "function") ? getAltitudeFeet(jet.y, worldH) : 30000;

    var wingman = jet.wingmanJet;
    var isWingmanShip = (!jet.isLead && wingman && wingman.active && !wingman.isDying);

    // Multi-bandit target evaluation: primary (closest) and secondary (cooperative sorting)
    var primaryTarget = null;
    var secondaryTarget = null;
    var primaryDist = 999999;
    var secondaryDist = 999999;

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
      if (d < primaryDist) {
        primaryDist = d;
        primaryTarget = opp;
        jet.hasOnboardLock = hasLocalLock;
      }

      // Check for secondary bandit (different from lead's target) to avoid target saturation
      if (isWingmanShip && wingman.targetJet && opp !== wingman.targetJet) {
        if (d < secondaryDist) {
          secondaryDist = d;
          secondaryTarget = opp;
        }
      }
    }

    var minDist = primaryDist;
    // Wingman selects secondary bandit if available, else primary
    if (isWingmanShip && secondaryTarget) {
      jet.targetJet = secondaryTarget;
      minDist = Math.hypot(secondaryTarget.x - jet.x, secondaryTarget.y - jet.y);
    } else {
      jet.targetJet = primaryTarget;
    }

    // 4. Cooperative Mutual Defensive Cover (Check-Six)
    // If an enemy pursuer gets onto friendly wingman/lead's tail, break in immediately to eliminate the threat!
    var checkedSix = false;
    if (wingman && wingman.active && !wingman.isDying && jet.mode !== "BREAK" && jet.mode !== "GPWS_PULLUP") {
      for (var oj2 = 0; oj2 < opposingPool.length; oj2++) {
        var enemyPursuer = opposingPool[oj2];
        if (!enemyPursuer.active || enemyPursuer.isDying) continue;
        if (enemyPursuer.targetJet === wingman) {
          var distToWm = Math.hypot(wingman.x - enemyPursuer.x, wingman.y - enemyPursuer.y);
          // Threat is pursuing partner within 550px
          if (distToWm < 550) {
            jet.targetJet = enemyPursuer;
            jet.mode = "COVER";
            jet.modeTimer = 45;
            jet.throttleSetting = 1.5;
            jet.afterburner = true;
            var cdx = enemyPursuer.x - jet.x;
            var cdy = enemyPursuer.y - jet.y;
            jet.targetAngle = Math.atan2(cdy, cdx);
            checkedSix = true;
            if (Math.random() < 0.03 && typeof dfRadio === "function") {
              dfRadio(jet.callsign + ": DEFENSIVE COVER! BREAKING INTO THREAT ON " + wingman.callsign + "'S SIX!");
            }
            break;
          }
        }
      }
    }

    if (checkedSix || jet.mode === "COVER") {
      if (jet.targetJet) {
        var cdx2 = jet.targetJet.x - jet.x;
        var cdy2 = jet.targetJet.y - jet.y;
        jet.targetAngle = Math.atan2(cdy2, cdx2);
      }
      continue;
    }

    // 5. Normal Wingman Formation Flight vs Active Combat (Fluid Two / Pincer / Secondary Sort)
    if (isWingmanShip) {
      var isAirportOp = (jet.mode === "TAKEOFF" || jet.mode === "ACE_APPROACH" || jet.mode === "ACE_TOUCHDOWN" || jet.mode === "ACE_SCRAMBLE");
      
      var isLeadInCombat = Boolean(wingman && (wingman.mode === "PURSUIT" || wingman.mode === "ENGAGED" || wingman.mode === "MERGE_PITCHBACK" || wingman.mode === "BREAK_9G" || wingman.mode === "INTERCEPT_BOMBER" || wingman.mode === "ESCORT_BOMBER" || wingman.hasOnboardLock));
      var isHostileInCombatReach = (minDist <= 850);
      var isAlreadyEngaged = (jet.mode === "PURSUIT" || jet.mode === "PINCER" || jet.mode === "COVER" || jet.mode === "MERGE_PITCHBACK");

      // Wingman holds formation ONLY during departure / cruise when no hostiles in combat reach and lead is not engaged
      var shouldHoldFormation = !isAirportOp && !isHostileInCombatReach && !isLeadInCombat && (!isAlreadyEngaged || minDist > 1100);

      if (shouldHoldFormation) {
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

      // ACTIVE COMBAT ASSISTANCE: Wingman fights aggressively alongside Flight Lead!
      if (!isAirportOp && jet.targetJet) {
        if (secondaryTarget && secondaryTarget === jet.targetJet) {
          // Engaging sorted secondary bandit: direct high-G lead pursuit
          jet.mode = "PURSUIT";
          jet.throttleSetting = 1.5;
          jet.afterburner = true;
          var leadTimeSec = Math.min(minDist / 14.0, 16.0);
          var lx = secondaryTarget.x + Math.cos(secondaryTarget.angle) * secondaryTarget.speed * leadTimeSec;
          var ly = secondaryTarget.y + Math.sin(secondaryTarget.angle) * secondaryTarget.speed * leadTimeSec;
          jet.targetAngle = Math.atan2(ly - jet.y, lx - jet.x);
          if (Math.random() < 0.02 && typeof dfRadio === "function") {
            dfRadio(jet.callsign + ": TWO COMMITTED ON SORTED BANDIT (" + secondaryTarget.callsign + ")!");
          }
          continue;
        } else {
          // Single bandit remaining: execute bracket pincer maneuver
          jet.mode = "PINCER";
          jet.modeTimer = 35;
          var pSign = (jet.y > wingman.y) ? 0.65 : -0.65;
          var directBearing = Math.atan2(jet.targetJet.y - jet.y, jet.targetJet.x - jet.x);
          jet.targetAngle = directBearing + pSign;
          jet.throttleSetting = 1.45;
          jet.afterburner = true;
          if (Math.random() < 0.02 && typeof dfRadio === "function") {
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
