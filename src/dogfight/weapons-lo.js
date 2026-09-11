// # Weapons gens 1-5
//
// Logline: Guns and missiles.
function evaluateKineticWeapons(jet, targetEnemy, colors) {
    var shooterTeamCode = (jet.team === "west") ? 0 : 1;

    // Direct engagement against incoming hostile Strategic Bomber (removed in v3.0)
    // (bombers.js deleted; INTERCEPT_BOMBER mode is no longer set)
    if (!targetEnemy) return;

    var dx = targetEnemy.x - jet.x;
    var dy = targetEnemy.y - jet.y;
    var dist = Math.hypot(dx, dy);
    var bearing = Math.atan2(dy, dx);
    var da = Math.abs(jet.angle - bearing);
    while (da > Math.PI) da = Math.abs(da - Math.PI * 2);
    var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
    var hShooter = getAltitudeFeet(jet.y, worldH);
    var hTarget = getAltitudeFeet(targetEnemy.y, worldH);
    var deltaH = hTarget - hShooter;
    var isKineticReachValid = (Math.abs(deltaH) <= 35000);

    // 20mm Cannon (point-blank dogfight: 20-220 px, exactly 16 ticks life)
    var leadTimeGuns = Math.min(dist / 14.0, 15.0);
    var leadGunX = targetEnemy.x + Math.cos(targetEnemy.angle) * targetEnemy.speed * leadTimeGuns;
    var leadGunY = targetEnemy.y + Math.sin(targetEnemy.angle) * targetEnemy.speed * leadTimeGuns;
    var leadBearingGuns = Math.atan2(leadGunY - jet.y, leadGunX - jet.x);
    var daLeadGuns = Math.abs(jet.angle - leadBearingGuns);
    while (daLeadGuns > Math.PI) daLeadGuns = Math.abs(daLeadGuns - Math.PI * 2);

    var gunTolerance = jet.isAce ? 1.05 : 0.85;
    var maxGunDist = jet.isAce ? 250 : 220;

    if ((da < 0.785 || daLeadGuns < gunTolerance) && dist >= 20 && dist <= maxGunDist && jet.gunCooldown <= 0 && isKineticReachValid) {
      var isEast = (jet.team === "east");
      var gGen = jet.gen || 1;
      jet.gunCooldown = (isEast && gGen === 1) ? 5 : 3; // 37mm has heavier, slower cycle rate
      if (typeof window !== "undefined" && window.TacticalAudio) {
        if (isEast && (gGen === 1 || gGen === 4 || gGen === 5)) {
          if (typeof window.TacticalAudio.playHeavyCannonBurst === "function") {
            window.TacticalAudio.playHeavyCannonBurst();
          } else {
            window.TacticalAudio.playCannonBurst();
          }
        } else {
          window.TacticalAudio.playCannonBurst();
        }
      }
      var bIdx = DF.bulletsPool.alloc();
      if (bIdx >= 0) {
        var bo = bIdx * 6;
        DF.bulletsPool.buffer[bo] = jet.x + Math.cos(jet.angle) * 20;
        DF.bulletsPool.buffer[bo + 1] = jet.y + Math.sin(jet.angle) * 20;
        DF.bulletsPool.buffer[bo + 2] = Math.cos(jet.angle) * 14;
        DF.bulletsPool.buffer[bo + 3] = Math.sin(jet.angle) * 14;
        DF.bulletsPool.buffer[bo + 4] = 16;
        DF.bulletsPool.buffer[bo + 5] = (shooterTeamCode === 0 ? 100 : 200) + (jet.slotIdx || 0);
      }
      if ((jet.gen === 1 || jet.isWinchester) && Math.random() < 0.20) {
        var gunRadioMsg = "";
        if (!isEast) {
          gunRadioMsg = (gGen === 1) ? "GUNS! 6x .50 CAL BROWNING TRACERS ON TARGET" : "GUNS! 20MM M61 VULCAN BURST";
        } else {
          gunRadioMsg = (gGen === 1) ? "GUNS! 37MM N-37 & 23MM HEAVY EXPLOSIVE SHELLS" : (gGen <= 3 ? "GUNS! 23MM GSh-23L BURST" : "GUNS! 30MM GSh-30-1 HEAVY AUTOCANNON");
        }
        dfRadio(jet.callsign + (jet.isAce ? ": [ACE] " : ": ") + gunRadioMsg);
      }
    }

    // Missiles (Gen 2-6: extended envelopes up to 1400-2200 px, 240 ticks lifespan)
    var targetAspectDeg = calculateAspectAngle({ x: jet.x, y: jet.y }, targetEnemy.angle, { x: targetEnemy.x, y: targetEnemy.y });
    var isBayOpen = (targetEnemy.bayDoorTimer > 0);
    var specT = AIRCRAFT_SPECS[targetEnemy.gen] || AIRCRAFT_SPECS[4];
    var targetRcsEffective = isBayOpen ? (specT.rcsBloom || 1.2) : (targetEnemy.rcs || specT.rcsClean || specT.rcs || 1.0);
    var hasActiveCca = (jet.gen === 6 && ((jet.cca1 && jet.cca1.active) || (jet.cca2 && jet.cca2.active)));
    var maxRadarRange = calculateRadarDetectionRange(jet.gen, targetRcsEffective, 1.0, targetAspectDeg, isBayOpen, hasActiveCca);

    var canAcquireLock = canAcquireTargetLock(jet, targetEnemy, dist, deltaH);
    if (jet.sensors) {
      jet.sensors.radarLocked = canAcquireLock;
      jet.sensors.lockQuality = canAcquireLock ? Math.max(0.0, 1.0 - (dist / Math.max(maxRadarRange, 1.0))) : 0.0;
    }
    if (targetEnemy.sensors) {
      targetEnemy.sensors.inRwrWarning = canAcquireLock && (jet.gen >= 3);
    }

    var leadTimeMis = Math.min(dist / 14.0, 20.0);
    var leadMisX = targetEnemy.x + Math.cos(targetEnemy.angle) * targetEnemy.speed * leadTimeMis;
    var leadMisY = targetEnemy.y + Math.sin(targetEnemy.angle) * targetEnemy.speed * leadTimeMis;
    var leadBearingMis = Math.atan2(leadMisY - jet.y, leadMisX - jet.x);
    var daLeadMis = Math.abs(jet.angle - leadBearingMis);
    while (daLeadMis > Math.PI) daLeadMis = Math.abs(daLeadMis - Math.PI * 2);

    var maxLaunchDist = (jet.gen === 6 && hasActiveCca) ? 2200 : 1400;
    var hasMissiles = (typeof jet.missilesRemaining === "number") ? (jet.missilesRemaining > 0) : true;
    if (jet.gen >= 2 && hasMissiles && (da < 1.10 || daLeadMis < 1.10) && dist <= maxLaunchDist && dist >= 50 && jet.missileCooldown <= 0 && jet.speed > DF.V_CORNER * 0.6 && canAcquireLock) {
      var allowLaunch = true;
      var misSpeed = jet.speed + 3.0;
      var misType = 0;

      if (jet.team === "west") {
        // Western (USA / NATO) Missile Arsenal
        if (jet.gen === 2) {
          var targetBearing = Math.atan2(targetEnemy.y - jet.y, targetEnemy.x - jet.x);
          var aspectDiff = Math.abs(targetEnemy.angle - targetBearing);
          while (aspectDiff > Math.PI) aspectDiff = Math.abs(aspectDiff - Math.PI * 2);
          if (aspectDiff > 1.10 || Math.abs(deltaH) > 35000) {
            allowLaunch = false;
          } else {
            misType = 1;
            dfRadio(jet.callsign + ": FOX-2! AIM-9B SIDEWINDER AWAY");
          }
        } else if (jet.gen === 3) {
          misType = 3;
          misSpeed = jet.speed + 3.5;
          dfRadio(jet.callsign + ": FOX-1! AIM-7 SPARROW AWAY (BVR RADAR LOCK)");
        } else if (jet.gen === 4) {
          misType = 4;
          if (jet.variant === "F16" || (jet.callsign && jet.callsign.indexOf("VIPER") !== -1)) {
            misSpeed = jet.speed + 3.6;
            dfRadio(jet.callsign + ": FOX-3! AIM-120 AMRAAM AWAY");
          } else if (dist > 240) {
            misSpeed = jet.speed + 4.2;
            dfRadio(jet.callsign + ": FOX-3! AIM-54 PHOENIX AWAY (MACH 5)");
          } else {
            misSpeed = jet.speed + 3.4;
            dfRadio(jet.callsign + ": FOX-2! AIM-9L SIDEWINDER ALL-ASPECT LOCK");
          }
        } else if (jet.gen === 5) {
          misType = 5;
          misSpeed = jet.speed + 3.8;
          dfRadio(jet.callsign + ": FOX-3! AIM-120D AMRAAM AWAY (STEALTH INTERNAL RELEASE)");
        } else if (jet.gen === 6) {
          misType = 6;
          misSpeed = jet.speed + 4.6;
          dfRadio(jet.callsign + ": FOX-3! AIM-260 JATM AWAY (CCA EXTENDED RADAR LOCK, " + Math.round(dist * 0.08) + " NM)");
        }
      } else {
        // Eastern (USSR / Russia / China) Missile Arsenal
        if (jet.gen === 2) {
          var targetBearingR = Math.atan2(targetEnemy.y - jet.y, targetEnemy.x - jet.x);
          var aspectDiffR = Math.abs(targetEnemy.angle - targetBearingR);
          while (aspectDiffR > Math.PI) aspectDiffR = Math.abs(aspectDiffR - Math.PI * 2);
          if (aspectDiffR > 1.10 || Math.abs(deltaH) > 35000) {
            allowLaunch = false;
          } else {
            misType = 1;
            dfRadio(jet.callsign + ": FOX-2! K-13 / R-3S ATOLL AWAY (IR HEATSEEKER)");
          }
        } else if (jet.gen === 3) {
          misType = 3;
          misSpeed = jet.speed + 3.5;
          dfRadio(jet.callsign + ": FOX-1! R-23R APEX AWAY (BVR RADAR LOCK)");
        } else if (jet.gen === 4) {
          misType = 4;
          if (dist > 260) {
            misSpeed = jet.speed + 4.0;
            dfRadio(jet.callsign + ": FOX-1! R-27ER ALAMO AWAY (EXTENDED RANGE SARH)");
          } else if (dist < 180) {
            misSpeed = jet.speed + 3.6;
            dfRadio(jet.callsign + ": FOX-2! R-73 ARCHER AWAY (HIGH OFF-BORESIGHT HMS)");
          } else {
            misSpeed = jet.speed + 3.7;
            dfRadio(jet.callsign + ": FOX-3! R-77 ADDER AWAY (ACTIVE RADAR)");
          }
        } else if (jet.gen === 5) {
          misType = 5;
          misSpeed = jet.speed + 4.0;
          dfRadio(jet.callsign + ": FOX-3! R-77-1 ADDER AWAY (STEALTH INTERNAL RELEASE)");
        } else if (jet.gen === 6) {
          misType = 6;
          misSpeed = jet.speed + 4.6;
          dfRadio(jet.callsign + ": FOX-3! PL-15 / R-37M AWAY (CCA COLLABORATIVE RADAR MESH)");
        }
      }

      if (allowLaunch) {
        if (typeof jet.missilesRemaining === "number") {
          jet.missilesRemaining--;
          if (jet.missilesRemaining <= 0) {
            jet.missilesRemaining = 0;
            jet.isWinchester = true;
            dfRadio(jet.callsign + ": WINCHESTER! ALL MISSILES EXPENDED! MERGING FOR GUNS!");
          }
        }
        if (typeof window !== "undefined" && window.TacticalAudio) window.TacticalAudio.playMissileLaunch();
        if (jet.gen === 5 || jet.gen === 6) {
          jet.bayDoorTimer = 36; // 1.2s internal weapons bay bloom
          var specSelf = AIRCRAFT_SPECS[jet.gen] || AIRCRAFT_SPECS[5];
          jet.rcs = specSelf.rcsBloom || 1.2;
        }
        jet.missileCooldown = 20 + Math.floor(Math.random() * 16);
        var misIdx = DF.missilesPool.alloc();
        if (misIdx >= 0) {
          var mso = misIdx * 8;
          DF.missilesPool.buffer[mso] = jet.x;
          DF.missilesPool.buffer[mso + 1] = jet.y;
          DF.missilesPool.buffer[mso + 2] = Math.cos(jet.angle) * misSpeed;
          DF.missilesPool.buffer[mso + 3] = Math.sin(jet.angle) * misSpeed;
          DF.missilesPool.buffer[mso + 4] = (shooterTeamCode === 0 ? 100 : 200) + (jet.slotIdx || 0);
          DF.missilesPool.buffer[mso + 5] = targetEnemy.slotIdx;
          DF.missilesPool.buffer[mso + 6] = 240;
          DF.missilesPool.buffer[mso + 7] = misType;
          DF.missileSmokes[misIdx].clear();
        }
      }
    }
  }
