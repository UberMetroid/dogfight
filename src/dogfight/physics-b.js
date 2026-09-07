// # Jet physics B
//
// Logline: Afterburner sparks and gen-7 drones.
//
function updateJetPhysicsLate(jet, targetEnemy, incomingThreat, opposingPool, missilesPoolRef) {
  var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
  var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

  var altFt = getAltitudeFeet(jet.y, worldH);
  var spec = AIRCRAFT_SPECS[jet.gen] || AIRCRAFT_SPECS[4] || {};

  // Thermal ionization sparks when afterburner is active
  if (jet.afterburner && jet.gen !== 7 && Math.random() < 0.35 && globalVfxParticlePool) {
    var spIdx = globalVfxParticlePool.alloc();
    if (spIdx >= 0) {
      var spo = spIdx * 8;
      var spAngle = jet.angle + Math.PI + (Math.random() - 0.5) * 0.3;
      var spSpeed = 2.5 + Math.random() * 3.5;
      var spLife = 10 + Math.floor(Math.random() * 8);
      globalVfxParticlePool.buffer[spo] = jet.x - Math.cos(jet.angle) * 16 + (Math.random() - 0.5) * 4;
      globalVfxParticlePool.buffer[spo + 1] = jet.y - Math.sin(jet.angle) * 16 + (Math.random() - 0.5) * 4;
      globalVfxParticlePool.buffer[spo + 2] = Math.cos(spAngle) * spSpeed;
      globalVfxParticlePool.buffer[spo + 3] = Math.sin(spAngle) * spSpeed;
      globalVfxParticlePool.buffer[spo + 4] = spLife;
      globalVfxParticlePool.buffer[spo + 5] = spLife;
      globalVfxParticlePool.buffer[spo + 6] = 1.2;
      globalVfxParticlePool.buffer[spo + 7] = 1; // Type 1: Sparks
    }
  }

  var vx = Math.cos(jet.angle) * jet.speed;
  var vy = Math.sin(jet.angle) * jet.speed;

  if (jet.damageState === "CRITICAL" || (typeof jet.hp === "number" && jet.hp < 20.0)) {
    vy += (Math.random() - 0.5) * 1.8 + 0.45; // Gravity pulling damaged airframe down
    vx += (Math.random() - 0.5) * 1.8;
    jet.stallBuffet = Math.max(jet.stallBuffet || 0, 0.8);
    jet.angle += 0.015; // Uncontrollable pitch down towards surface
  } else if (jet.isStalled) {
    vy += (Math.random() - 0.5) * 1.5 + 0.30;
    vx += (Math.random() - 0.5) * 1.5;
  }
  if (jet.isDying) {
    vy += 0.50; // Accelerated ballistic plunge for destroyed airframes
  }

  jet.x += vx;
  jet.y += vy;

  // Boundary Containment (Zero Bouncing: smooth aerodynamic turnback without angle snapping)
  var isGen7 = (jet.gen === 7);
  var minArenaX = isGen7 ? 85.0 : 75.0;
  var maxArenaX = isGen7 ? (worldW - 85.0) : (worldW - 75.0);
  if (jet.x < minArenaX) {
    jet.x = minArenaX;
    jet.targetAngle = 0.0; // Smoothly steer East towards combat zone
    jet.mode = "BOUNDARY_SLICE";
    jet.afterburner = true;
  } else if (jet.x > maxArenaX) {
    jet.x = maxArenaX;
    jet.targetAngle = Math.PI; // Smoothly steer West towards combat zone
    jet.mode = "BOUNDARY_SLICE";
    jet.afterburner = true;
  }

  // Near-space ceiling (100k ft) header clamp (min visible ceiling y >= 32.0 px)
  var minCeilingY = isGen7 ? 65.0 : 32.0;
  if (jet.y < minCeilingY) {
    jet.y = minCeilingY;
    if (Math.sin(jet.angle) < 0) {
      jet.targetAngle = (Math.cos(jet.angle) >= 0) ? 0.05 : (Math.PI - 0.05);
    }
  }

  // Dynamic Terrain & Ocean Surface Collision (Water and Land Impact Crash)
  var surfaceY = (typeof getSurfaceElevationY === "function")
    ? getSurfaceElevationY(jet.x, worldW, worldH)
    : (worldH - 150);

  if (jet.y >= surfaceY) {
    jet.y = surfaceY;
    var impactSpeed = Math.hypot(vx, vy);
    var coastRatio = (typeof MultiDomainSystem !== "undefined" && MultiDomainSystem.coastRatio) ? MultiDomainSystem.coastRatio : 0.38;
    var isOcean = jet.x >= (worldW * coastRatio);
    var crashType = isOcean ? "WATER_IMPACT" : "TERRAIN_IMPACT";

    if (jet.active && !jet.isDying) {
      // High-energy catastrophic crash: zero velocity and inflict fatal impact damage
      jet.speed = 0.0;
      applyAirframeDamage(jet, 999.0, null, crashType);
    } else if (jet.isDying) {
      // Wreckage / dying airframe slamming into the surface
      jet.speed = 0.0;
      jet.deathTimer = Math.min(jet.deathTimer || 0, 8);
      if (isOcean && typeof spawnWaterSplash === "function") {
        spawnWaterSplash(jet.x, surfaceY, impactSpeed, jet.gen || 4);
        if (typeof window !== "undefined" && window.TacticalAudio && window.TacticalAudio.playSplash) {
          window.TacticalAudio.playSplash();
        }
      } else if (!isOcean && typeof triggerStage3GroundImpact === "function") {
        triggerStage3GroundImpact(jet.x, surfaceY, vx, jet.gen || 4);
        if (typeof window !== "undefined" && window.TacticalAudio && window.TacticalAudio.playExplosion) {
          window.TacticalAudio.playExplosion();
        }
      }
    }
  }

  // Visual Damage Particle Emissions (<70%, <45%, <20% HP)
  if (!jet.isDying && jet.active && typeof jet.hp === "number") {
    if (jet.hp < 20.0) {
      // Critical Damage (<20% HP): Heavy billowing black smoke and fire trails
      jet.damageSmokeTimer = (jet.damageSmokeTimer || 0) + 1;
      var crIdx = DF.explosionsPool.alloc();
      if (crIdx >= 0) {
        var cro = crIdx * 6;
        DF.explosionsPool.buffer[cro] = jet.x - Math.cos(jet.angle) * 14 + (Math.random() - 0.5) * 6;
        DF.explosionsPool.buffer[cro + 1] = jet.y - Math.sin(jet.angle) * 14 + (Math.random() - 0.5) * 6;
        DF.explosionsPool.buffer[cro + 2] = -Math.cos(jet.angle) * 2.0 + (Math.random() - 0.5) * 3;
        DF.explosionsPool.buffer[cro + 3] = -Math.sin(jet.angle) * 2.0 + (Math.random() - 0.5) * 3;
        DF.explosionsPool.buffer[cro + 4] = 4 + Math.floor(Math.random() * 3);
        DF.explosionsPool.buffer[cro + 5] = 0.95;
      }
    } else if (jet.hp < 45.0) {
      // Moderate Damage (<45% HP): Steady dark smoke plume and occasional sparks
      jet.damageSmokeTimer = (jet.damageSmokeTimer || 0) + 1;
      if (jet.damageSmokeTimer % 2 === 0) {
        var moIdx = DF.explosionsPool.alloc();
        if (moIdx >= 0) {
          var moo = moIdx * 6;
          DF.explosionsPool.buffer[moo] = jet.x - Math.cos(jet.angle) * 12;
          DF.explosionsPool.buffer[moo + 1] = jet.y - Math.sin(jet.angle) * 12;
          DF.explosionsPool.buffer[moo + 2] = -Math.cos(jet.angle) * 1.5 + (Math.random() - 0.5) * 2;
          DF.explosionsPool.buffer[moo + 3] = -Math.sin(jet.angle) * 1.5 + (Math.random() - 0.5) * 2;
          DF.explosionsPool.buffer[moo + 4] = 3;
          DF.explosionsPool.buffer[moo + 5] = 0.7;
        }
      }
      jet.damageSparksTimer = (jet.damageSparksTimer || 0) + 1;
      if (jet.damageSparksTimer % 10 === 0) {
        var spDmgIdx = DF.explosionsPool.alloc();
        if (spDmgIdx >= 0) {
          var spDo = spDmgIdx * 6;
          DF.explosionsPool.buffer[spDo] = jet.x + (Math.random() - 0.5) * 8;
          DF.explosionsPool.buffer[spDo + 1] = jet.y + (Math.random() - 0.5) * 8;
          DF.explosionsPool.buffer[spDo + 2] = (Math.random() - 0.5) * 5;
          DF.explosionsPool.buffer[spDo + 3] = (Math.random() - 0.5) * 5;
          DF.explosionsPool.buffer[spDo + 4] = 2;
          DF.explosionsPool.buffer[spDo + 5] = 0.6;
        }
      }
    } else if (jet.hp < 70.0) {
      // Light Damage (<70% HP): Light smoke / vapor wisps
      jet.damageSmokeTimer = (jet.damageSmokeTimer || 0) + 1;
      if (jet.damageSmokeTimer % 3 === 0) {
        var vxVapDmg = jet.x - Math.cos(jet.angle) * 10 + Math.sin(jet.angle) * (Math.random() > 0.5 ? 6 : -6);
        var vyVapDmg = jet.y - Math.sin(jet.angle) * 10 - Math.cos(jet.angle) * (Math.random() > 0.5 ? 6 : -6);
        if (jet.wingVapor) jet.wingVapor.push(vxVapDmg, vyVapDmg, 0.65, 0);
      }
    }
  }

  if (jet.contrail) {
    jet.contrail.push(
      jet.x - Math.cos(jet.angle) * 16,
      jet.y - Math.sin(jet.angle) * 16,
      jet.afterburner ? 0.75 : 0.35,
      jet.gForce
    );
  }

  if (jet.flareCooldown > 0) jet.flareCooldown--;
  if (jet.gunCooldown > 0) jet.gunCooldown--;
  if (jet.missileCooldown > 0) jet.missileCooldown--;
  if (jet.laserCooldown > 0) jet.laserCooldown--;
  if (jet.triLaserCooldown > 0) jet.triLaserCooldown--;
  if (jet.superLaserCooldown > 0) jet.superLaserCooldown--;
  if (jet.superLaserPulse > 0) jet.superLaserPulse *= 0.85;

  updateJetPhysicsSwarm(jet, targetEnemy, incomingThreat);
}
