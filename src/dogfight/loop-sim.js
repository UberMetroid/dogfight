// # Frame sim — West vs East, 6 generations
//
// Logline: Wipeout, tactics, physics, collisions. Strategic bombers are out.
//
function dfStepSim() {
  // 1. Wipeout Detection, Dying Decay & Wave Ingress Timers
  var westActiveCount = 0;
  var westPool = (DF.westPool || DF.bluePool) || [];
  for (var bi = 0; bi < westPool.length; bi++) {
    var bj = westPool[bi];
    if (bj.isDying) {
      bj.deathTimer--;
      bj.fadeAlpha = Math.max(0.0, bj.deathTimer / 45.0);
      if (bj.deathTimer <= 0) {
        bj.active = false;
        bj.isDying = false;
        bj.fadeAlpha = 0.0;
      }
    } else if (bj.active) {
      westActiveCount++;
    }
  }

  var eastActiveCount = 0;
  var eastPool = (DF.eastPool || DF.redPool) || [];
  for (var ri = 0; ri < eastPool.length; ri++) {
    var rj = eastPool[ri];
    if (rj.isDying) {
      rj.deathTimer--;
      rj.fadeAlpha = Math.max(0.0, rj.deathTimer / 45.0);
      if (rj.deathTimer <= 0) {
        rj.active = false;
        rj.isDying = false;
        rj.fadeAlpha = 0.0;
      }
    } else if (rj.active) {
      eastActiveCount++;
    }
  }

  // 1B. Living Generational Campaign Autonomous Escalation
  if (typeof GenerationalCampaign !== "undefined") {
    GenerationalCampaign.update();
  }

  // Wipeout Patrol Cruise Transition & Reinforcement Scramble Flow
  if (eastActiveCount === 0 && westActiveCount > 0) {
    // West Force Wins Round -> Patrol Cruise
    for (var bpc = 0; bpc < westPool.length; bpc++) {
      var bpJet = westPool[bpc];
      if (bpJet.active && !bpJet.isDying) {
        if (bpJet.mode !== "TAKEOFF") {
          bpJet.mode = "PATROL";
          bpJet.afterburner = false;
        }
        bpJet.targetJet = null;
        if (Math.abs(Math.sin(bpJet.angle)) > 0.15 && bpJet.mode === "PATROL") {
          bpJet.targetAngle = (Math.cos(bpJet.angle) >= 0) ? 0.0 : Math.PI;
        }
      }
    }
    DF.redIngressTimer = (DF.redIngressTimer || 0) + 1;
    if (DF.redIngressTimer >= 120) {
      DF.redIngressTimer = 0;
      scrambleWave("east");
      for (var bsc = 0; bsc < westPool.length; bsc++) {
        var bsJet = westPool[bsc];
        if (bsJet.active && !bsJet.isDying) {
          bsJet.missilesRemaining = bsJet.missileCapacity;
          bsJet.isWinchester = (bsJet.missilesRemaining === 0 && bsJet.gen <= 1);
          bsJet.fuel = 100.0;
          bsJet.isBingoFuel = false;
        }
      }
    }
  } else if (westActiveCount === 0 && eastActiveCount > 0) {
    // East Force Wins Round -> Patrol Cruise
    for (var rpc = 0; rpc < eastPool.length; rpc++) {
      var rpJet = eastPool[rpc];
      if (rpJet.active && !rpJet.isDying) {
        if (rpJet.mode !== "TAKEOFF") {
          rpJet.mode = "PATROL";
          rpJet.afterburner = false;
        }
        rpJet.targetJet = null;
        if (Math.abs(Math.sin(rpJet.angle)) > 0.15 && rpJet.mode === "PATROL") {
          rpJet.targetAngle = (Math.cos(rpJet.angle) >= 0) ? 0.0 : Math.PI;
        }
      }
    }
    DF.blueIngressTimer = (DF.blueIngressTimer || 0) + 1;
    if (DF.blueIngressTimer >= 120) {
      DF.blueIngressTimer = 0;
      scrambleWave("west");
      for (var rsc = 0; rsc < eastPool.length; rsc++) {
        var rsJet = eastPool[rsc];
        if (rsJet.active && !rsJet.isDying) {
          rsJet.missilesRemaining = rsJet.missileCapacity;
          rsJet.isWinchester = (rsJet.missilesRemaining === 0 && rsJet.gen <= 1);
          rsJet.fuel = 100.0;
          rsJet.isBingoFuel = false;
        }
      }
    }
  } else if (westActiveCount === 0 && eastActiveCount === 0) {
    DF.blueIngressTimer = (DF.blueIngressTimer || 0) + 1;
    DF.redIngressTimer = (DF.redIngressTimer || 0) + 1;
    if (DF.blueIngressTimer >= 90) {
      DF.blueIngressTimer = 0;
      scrambleWave("west");
    }
    if (DF.redIngressTimer >= 90) {
      DF.redIngressTimer = 0;
      scrambleWave("east");
    }
  } else {
    DF.blueIngressTimer = 0;
    DF.redIngressTimer = 0;
  }

  // 2. Mutual Cross-Targeting & Tactical Swarm AI
  if (typeof updateTacticalManeuvers === "function") {
    updateTacticalManeuvers(westPool, eastPool);
    updateTacticalManeuvers(eastPool, westPool);
  }

  // 3. Physics & Weapon Simulation for all active aircraft
  var allJets = DF.allJets || [];
  for (var aji = 0; aji < allJets.length; aji++) {
    var airframe = allJets[aji];
    if (!airframe.active || airframe.isDying) continue;

    var isWestAirframe = (airframe.team === "west");
    var hostileTeam = isWestAirframe ? 1 : 0;

    // Check incoming threat missile
    var threatMissile = false;
    var threatMissileIdx = -1;
    var minMDist = 999999;
    var missilesPool = DF.missilesPool;
    if (missilesPool && missilesPool.activeCount > 0) {
      for (var tm = 0; tm < missilesPool.activeCount; tm++) {
        var tmo = tm * 8;
        if (missilesPool.buffer[tmo + 4] === hostileTeam) {
          var tmx = missilesPool.buffer[tmo];
          var tmy = missilesPool.buffer[tmo + 1];
          var mDist = Math.hypot(tmx - airframe.x, tmy - airframe.y);
          if (mDist < minMDist && mDist < 220) {
            minMDist = mDist;
            threatMissile = true;
            threatMissileIdx = tm;
          }
        }
      }
    }

    // Gen 6 NGAD 150 kW DEW Laser CIWS Intercept (per-jet, includes CCAs)
    if (airframe.gen === 6 && threatMissile && threatMissileIdx >= 0 && (typeof airframe.laserCooldown === "undefined" || airframe.laserCooldown <= 0)) {
      airframe.laserCooldown = 35;
      airframe.dewCiwsActive = true;
      var ctmo = threatMissileIdx * 8;
      var ctmx = missilesPool.buffer[ctmo];
      var ctmy = missilesPool.buffer[ctmo + 1];
      DF.ctx.save();
      DF.ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
      DF.ctx.lineWidth = 4.5;
      DF.ctx.beginPath();
      DF.ctx.moveTo(airframe.x, airframe.y);
      DF.ctx.lineTo(ctmx, ctmy);
      DF.ctx.stroke();
      DF.ctx.strokeStyle = "#ffffff";
      DF.ctx.lineWidth = 2.0;
      DF.ctx.beginPath();
      DF.ctx.moveTo(airframe.x, airframe.y);
      DF.ctx.lineTo(ctmx, ctmy);
      DF.ctx.stroke();
      DF.ctx.restore();

      missilesPool.buffer[ctmo + 6] = 0;

      if (typeof globalVfxParticlePool !== "undefined" && globalVfxParticlePool) {
        var spkIdx = globalVfxParticlePool.alloc();
        if (spkIdx >= 0) {
          var spo = spkIdx * 8;
          globalVfxParticlePool.buffer[spo] = ctmx;
          globalVfxParticlePool.buffer[spo + 1] = ctmy;
          globalVfxParticlePool.buffer[spo + 2] = (Math.random() - 0.5) * 4;
          globalVfxParticlePool.buffer[spo + 3] = (Math.random() - 0.5) * 4;
          globalVfxParticlePool.buffer[spo + 4] = 12;
          globalVfxParticlePool.buffer[spo + 5] = 12;
          globalVfxParticlePool.buffer[spo + 6] = 4.0;
          globalVfxParticlePool.buffer[spo + 7] = 2;
        }
      }
      dfRadio(airframe.callsign + " 150 kW DEW CIWS: DIRECTED-ENERGY THERMAL INTERCEPT (MISSILE VAPORIZED)");
    } else {
      airframe.dewCiwsActive = false;
    }

    updateJetPhysics(airframe, airframe.targetJet, threatMissile, isWestAirframe ? eastPool : westPool, missilesPool);
    if (airframe.gen === 7 && typeof updateJetPhysicsSwarm === "function") {
      updateJetPhysicsSwarm(airframe, airframe.targetJet, threatMissile);
    }
    evaluateJetWeapons(airframe, airframe.targetJet, getThemeColors());
  }

  // 4. Pairwise Mid-Air Dynamic Merge & Collision Detection
  for (var c1 = 0; c1 < allJets.length; c1++) {
    var colJet1 = allJets[c1];
    if (!colJet1.active || colJet1.isDying) continue;
    for (var c2 = c1 + 1; c2 < allJets.length; c2++) {
      var colJet2 = allJets[c2];
      if (!colJet2.active || colJet2.isDying) continue;
      var pDist = Math.hypot(colJet1.x - colJet2.x, colJet1.y - colJet2.y);
      var relSpeed = Math.hypot(
        Math.cos(colJet1.angle) * colJet1.speed - Math.cos(colJet2.angle) * colJet2.speed,
        Math.sin(colJet1.angle) * colJet1.speed - Math.sin(colJet2.angle) * colJet2.speed
      );
      if (pDist < 6.0 && relSpeed < 4.0) {
        applyAirframeDamage(colJet1, 100.0, colJet2, "COLLISION");
        applyAirframeDamage(colJet2, 100.0, colJet1, "COLLISION");
        dfRadio("TACTICAL ALERT: MID-AIR COLLISION -> " + colJet1.callsign + " & " + colJet2.callsign + " MUTUAL DESTRUCTION!");
      } else if (pDist < 32.0 && relSpeed > 5.0 && (colJet1.speed > 4.5 || colJet2.speed > 4.5)) {
        if (Math.random() < 0.15) {
          dfRadio("TACTICAL MERGE: " + colJet1.callsign + " & " + colJet2.callsign + " HIGH-SPEED PASS -> TRANSITIONING TO DOGFIGHT!");
        }
      }
    }
  }
}
