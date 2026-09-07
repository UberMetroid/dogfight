// # Weapons gens 1-5
//
// Logline: Guns and missiles.
function evaluateKineticWeapons(jet, targetEnemy, colors) {
    var shooterTeamCode = (jet.team === "blue") ? 0 : 1;

    // Direct engagement against incoming hostile Strategic Bomber
    if (jet.mode === "INTERCEPT_BOMBER" || !targetEnemy) {
      if (typeof StrategicBomberSystem !== "undefined" && StrategicBomberSystem.activeBomber) {
        var actB = StrategicBomberSystem.activeBomber;
        if (actB.team !== jet.team && actB.state !== "SPLASHED") {
          var sbX = actB.x;
          var sbY = actB.y;
          var sbDist = Math.hypot(sbX - jet.x, sbY - jet.y);
          var sbBearing = Math.atan2(sbY - jet.y, sbX - jet.x);
          var sbDa = Math.abs(jet.angle - sbBearing);
          while (sbDa > Math.PI) sbDa = Math.abs(sbDa - Math.PI * 2);

          // 20mm Cannon on bomber
          if (sbDa < 0.85 && sbDist >= 20 && sbDist <= 280 && jet.gunCooldown <= 0) {
            jet.gunCooldown = 3;
            if (typeof window !== "undefined" && window.TacticalAudio) window.TacticalAudio.playCannonBurst();
            var bIdxB = DF.bulletsPool.alloc();
            if (bIdxB >= 0) {
              var boB = bIdxB * 6;
              DF.bulletsPool.buffer[boB] = jet.x + Math.cos(jet.angle) * 20;
              DF.bulletsPool.buffer[boB + 1] = jet.y + Math.sin(jet.angle) * 20;
              DF.bulletsPool.buffer[boB + 2] = Math.cos(jet.angle) * 14;
              DF.bulletsPool.buffer[boB + 3] = Math.sin(jet.angle) * 14;
              DF.bulletsPool.buffer[boB + 4] = 18;
              DF.bulletsPool.buffer[boB + 5] = (shooterTeamCode === 0 ? 100 : 200) + (jet.slotIdx || 0);
            }
            if (Math.random() < 0.20) dfRadio(jet.callsign + ": GUNS! ENGAGING ENEMY BOMBER!");
          }

          // Missiles on bomber
          var hasMisB = (typeof jet.missilesRemaining === "number") ? (jet.missilesRemaining > 0) : true;
          if (hasMisB && jet.gen >= 2 && sbDa < 1.05 && sbDist <= 1400 && sbDist >= 60 && jet.missileCooldown <= 0) {
            jet.missileCooldown = 60;
            if (typeof jet.missilesRemaining === "number") {
              jet.missilesRemaining--;
              if (jet.missilesRemaining === 0) jet.isWinchester = true;
            }
            if (typeof window !== "undefined" && window.TacticalAudio) window.TacticalAudio.playMissileLaunch();
            var mIdxB = DF.missilesPool.alloc();
            if (mIdxB >= 0) {
              var moB = mIdxB * 8;
              var misSpeedB = jet.speed + 3.8;
              DF.missilesPool.buffer[moB] = jet.x + Math.cos(jet.angle) * 20;
              DF.missilesPool.buffer[moB + 1] = jet.y + Math.sin(jet.angle) * 20;
              DF.missilesPool.buffer[moB + 2] = Math.cos(jet.angle) * misSpeedB;
              DF.missilesPool.buffer[moB + 3] = Math.sin(jet.angle) * misSpeedB;
              DF.missilesPool.buffer[moB + 4] = shooterTeamCode;
              DF.missilesPool.buffer[moB + 5] = 4;
              DF.missilesPool.buffer[moB + 6] = 240;
              DF.missilesPool.buffer[moB + 7] = 0;
            }
            dfRadio(jet.callsign + ": FOX AWAY! ENGAGING STRATEGIC BOMBER!");
          }
          return;
        }
      }
      if (!targetEnemy) return;
    }

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
      jet.gunCooldown = 3;
      if (typeof window !== "undefined" && window.TacticalAudio) window.TacticalAudio.playCannonBurst();
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
        dfRadio(jet.callsign + (jet.isAce ? ": [ACE] " : ": ") + "GUNS! 20MM BURST ON TARGET");
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

      if (jet.gen === 2) {
        var targetBearing = Math.atan2(targetEnemy.y - jet.y, targetEnemy.x - jet.x);
        var aspectDiff = Math.abs(targetEnemy.angle - targetBearing);
        while (aspectDiff > Math.PI) aspectDiff = Math.abs(aspectDiff - Math.PI * 2);
        if (aspectDiff > 1.10 || Math.abs(deltaH) > 35000) {
          allowLaunch = false;
        } else {
          misType = 1;
          dfRadio(jet.callsign + ": FOX-2! AIM-9B HEATSEEKER AWAY");
        }
      } else if (jet.gen === 3) {
        misType = 3;
        misSpeed = jet.speed + 3.5;
        dfRadio(jet.callsign + ": FOX-1! AIM-7 SPARROW AWAY (BVR RADAR LOCK)");
      } else if (jet.gen === 4) {
        misType = 4;
        if (jet.variant === "F16" || (jet.callsign && jet.callsign.indexOf("VIPER") !== -1)) {
          misSpeed = jet.speed + 3.4;
          dfRadio(jet.callsign + ": FOX-2! AIM-9L ALL-ASPECT LOCK AWAY");
        } else if (dist > 240) {
          misSpeed = jet.speed + 4.2;
          dfRadio(jet.callsign + ": FOX-3! AIM-54 PHOENIX AWAY (MACH 5)");
        } else {
          dfRadio(jet.callsign + ": FOX-2! AIM-9L SIDEWINDER AWAY");
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
