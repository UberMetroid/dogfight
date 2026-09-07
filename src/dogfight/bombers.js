// # Strategic Bomber System & Air Dominance Doctrine
//
// Logline: Air dominance bomber flyovers, generational payloads (Gen 2 Thermonuclear Nuke),
//          interceptor scramble defense, procedural silhouettes, mushroom clouds, and FARP cratering.
//

(function (global) {
  "use strict";

  // 1. Generational Strategic Bomber Specifications
  var STRATEGIC_BOMBER_SPECS = {
    1: {
      blue: { name: "B-47 STRATOJET", speed: 4.2, altFt: 42000, hp: 380, weaponName: "1,000 LB IRON BOMB RIPPLE", bombType: "IRON_BOMBS", bombCount: 8, spread: 32 },
      red: { name: "Tu-16 BADGER", speed: 4.2, altFt: 42000, hp: 380, weaponName: "FAB-500 IRON BOMB RIPPLE", bombType: "IRON_BOMBS", bombCount: 8, spread: 32 }
    },
    2: {
      blue: { name: "B-58 HUSTLER", speed: 6.4, altFt: 50000, hp: 440, weaponName: "☢ THERMONUCLEAR GRAVITY NUKE (B53)", bombType: "NUKE", bombCount: 1, yieldMt: "9 MEGATONS" },
      red: { name: "Tu-95V BEAR", speed: 4.6, altFt: 48000, hp: 460, weaponName: "☢ RDS-37 THERMONUCLEAR NUKE", bombType: "NUKE", bombCount: 1, yieldMt: "15 MEGATONS" }
    },
    3: {
      blue: { name: "F-111 AARDVARK", speed: 5.6, altFt: 44000, hp: 400, weaponName: "CBU-87 CLUSTER DISPENSER", bombType: "CLUSTER", bombCount: 3, subCount: 26 },
      red: { name: "Tu-22M BACKFIRE", speed: 5.5, altFt: 45000, hp: 420, weaponName: "RBK-500 CLUSTER CARPET", bombType: "CLUSTER", bombCount: 3, subCount: 26 }
    },
    4: {
      blue: { name: "B-1B LANCER", speed: 5.4, altFt: 48000, hp: 450, weaponName: "GBU-31 JDAM ROTARY SALVO", bombType: "JDAM", bombCount: 4, spread: 28 },
      red: { name: "Tu-160 BLACKJACK", speed: 5.4, altFt: 48000, hp: 460, weaponName: "KAB-1500 ROTARY SALVO", bombType: "JDAM", bombCount: 4, spread: 28 }
    },
    5: {
      blue: { name: "B-2 SPIRIT", speed: 4.4, altFt: 52000, hp: 460, weaponName: "GBU-57 MOP (30,000 LB BUNKER BUSTER)", bombType: "MOP", bombCount: 1, stealth: true },
      red: { name: "PAK DA", speed: 4.4, altFt: 52000, hp: 460, weaponName: "FAB-9000 HEAVY PENETRATOR", bombType: "MOP", bombCount: 1, stealth: true }
    },
    6: {
      blue: { name: "B-21 RAIDER + CCAs", speed: 4.8, altFt: 55000, hp: 480, weaponName: "HACM HYPERSONIC CRUISE & SWARM", bombType: "HYPERSONIC", bombCount: 2, stealth: true, hasLaserCiws: true },
      red: { name: "H-20 + CCA SWARM", speed: 4.8, altFt: 55000, hp: 480, weaponName: "HYPERSONIC STRIKE & SWARM", bombType: "HYPERSONIC", bombCount: 2, stealth: true, hasLaserCiws: true }
    },
    7: {
      blue: { name: "AURORA SUB-ORBITAL PLATFORM", speed: 8.2, altFt: 88000, hp: 520, weaponName: "RODS FROM GOD (KINETIC TUNGSTEN)", bombType: "KINETIC_ROD", bombCount: 3, nearSpace: true },
      red: { name: "ORBITAL FOBS PLATFORM", speed: 8.2, altFt: 88000, hp: 520, weaponName: "ORBITAL KINETIC PENETRATORS", bombType: "KINETIC_ROD", bombCount: 3, nearSpace: true }
    }
  };

  // 2. Global Strategic Bomber State
  var StrategicBomberSystem = {
    dominanceTeam: null,
    dominanceTimer: 0,
    dominantGen: 4,
    activeBomber: null,
    bombs: [],
    detonations: [],
    craters: [],
    farpBlackout: { blue: 0, red: 0 },
    nukeFlashAlpha: 0.0,
    screenShake: 0.0,
    sirenTimer: 0,

    getSpecs: function (gen, team) {
      var g = (typeof gen === "number" && gen >= 1 && gen <= 7) ? gen : 4;
      var teamKey = (team === "red") ? "red" : "blue";
      var genSpecs = STRATEGIC_BOMBER_SPECS[g] || STRATEGIC_BOMBER_SPECS[4];
      return genSpecs[teamKey] || genSpecs.blue;
    },

    // Air Dominance Trigger Evaluator (Called each frame from loop-sim.js)
    updateDominance: function (blueActiveCount, redActiveCount) {
      var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
      var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

      // Decrement blackout timers
      if (this.farpBlackout.blue > 0) this.farpBlackout.blue--;
      if (this.farpBlackout.red > 0) this.farpBlackout.red--;
      if (this.sirenTimer > 0) this.sirenTimer--;
      if (this.screenShake > 0) this.screenShake *= 0.92;
      if (this.screenShake < 0.1) this.screenShake = 0.0;
      if (this.nukeFlashAlpha > 0) {
        this.nukeFlashAlpha = Math.max(0.0, this.nukeFlashAlpha - 0.009);
      }

      // If a bomber is currently flying, update flight and munitions
      if (this.activeBomber) {
        this.updateBomberFlight(worldW, worldH);
        this.updateBombsAndDetonations(worldW, worldH);
        return;
      }

      // Evaluate Air Dominance
      if (blueActiveCount > 0 && redActiveCount === 0) {
        if (this.dominanceTeam !== "blue") {
          this.dominanceTeam = "blue";
          this.dominanceTimer = 0;
        }
        this.dominanceTimer++;

        // Get active generation for Blue
        var blueGen = 4;
        if (typeof activeGensBlue !== "undefined") {
          for (var bg = 7; bg >= 1; bg--) {
            if (activeGensBlue[bg]) { blueGen = bg; break; }
          }
        }
        this.dominantGen = blueGen;

        // Dispatch bomber after ~2.2 seconds (70 frames) of undisputed dominance
        if (this.dominanceTimer === 70) {
          this.spawnBomber("blue", this.dominantGen, worldW, worldH);
        }
      } else if (redActiveCount > 0 && blueActiveCount === 0) {
        if (this.dominanceTeam !== "red") {
          this.dominanceTeam = "red";
          this.dominanceTimer = 0;
        }
        this.dominanceTimer++;

        var redGen = 4;
        if (typeof activeGensRed !== "undefined") {
          for (var rg = 7; rg >= 1; rg--) {
            if (activeGensRed[rg]) { redGen = rg; break; }
          }
        }
        this.dominantGen = redGen;

        if (this.dominanceTimer === 70) {
          this.spawnBomber("red", this.dominantGen, worldW, worldH);
        }
      } else {
        // Skies contested or mutual wipeout
        this.dominanceTeam = null;
        this.dominanceTimer = 0;
      }

      this.updateBombsAndDetonations(worldW, worldH);
    },

    // Spawn a Strategic Bomber for the Dominant Team
    spawnBomber: function (team, gen, worldW, worldH) {
      var isBlue = (team === "blue");
      var spec = this.getSpecs(gen, team);
      var altY = (typeof getYFromAltitude === "function")
        ? getYFromAltitude(spec.altFt || 50000, worldH)
        : 180;

      var startX = isBlue ? -120 : (worldW + 120);
      var heading = isBlue ? 0.0 : Math.PI;

      // Target FARP
      // Blue targets Red's FARP Delta (x ~ worldW * 0.88)
      // Red targets Blue's Base Alpha (x ~ worldW * 0.25)
      var targetFarpX = isBlue ? (worldW * 0.88) : (worldW * 0.25);
      var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(worldH) : Math.floor(worldH * 0.84);
      var targetFarpY = isBlue ? (mslY - 10) : (mslY - 14);

      this.activeBomber = {
        team: team,
        gen: gen,
        name: spec.name,
        weaponName: spec.weaponName,
        bombType: spec.bombType,
        bombCount: spec.bombCount || 1,
        spread: spec.spread || 20,
        subCount: spec.subCount || 0,
        x: startX,
        y: altY,
        angle: heading,
        speed: spec.speed || 5.0,
        hp: spec.hp || 420,
        maxHp: spec.hp || 420,
        targetFarpX: targetFarpX,
        targetFarpY: targetFarpY,
        state: "APPROACH", // APPROACH -> BOMB_RUN -> RELEASE -> EGRESS -> SPLASHED
        bayOpen: false,
        bayTimer: 0,
        dropTimer: 0,
        bombsDropped: 0,
        smokeTimer: 0,
        laserCooldown: 0,
        flaresRemaining: 8,
        flareCooldown: 0
      };

      // Tactical siren audio & radio announcements
      if (typeof window !== "undefined" && window.TacticalAudio) {
        if (typeof window.TacticalAudio.playAirRaidSiren === "function") {
          window.TacticalAudio.playAirRaidSiren();
        }
      }

      if (typeof dfRadio === "function") {
        var nukeFlag = (gen === 2) ? " ☢ [NUCLEAR THREAT LEVEL DEFCON-1]" : "";
        dfRadio("TACTICAL NET: AIR DOMINANCE SECURED! " + (isBlue ? "BLUE" : "RED") + " " + spec.name + " INGRESSING" + nukeFlag + "!");
        dfRadio("DEFENDING CONTROLLER: AIR RAID ALARM! SCRAMBLE INTERCEPTORS TO PROTECT FARP BEFORE WEAPON RELEASE!");
      }

      // Command defending team's FARP to scramble emergency interceptors
      var defendingTeam = isBlue ? "red" : "blue";
      this.scrambleFarpInterceptors(defendingTeam, worldW, worldH);
    },

    // Defending FARP scrambles fighters in INTERCEPT_BOMBER mode
    scrambleFarpInterceptors: function (team, worldW, worldH) {
      if (typeof scrambleWave === "function") {
        scrambleWave(team);
      }
      var pool = (team === "red") ? (DF ? DF.redPool : []) : (DF ? DF.bluePool : []);
      for (var i = 0; i < pool.length; i++) {
        var jet = pool[i];
        if (jet && jet.active) {
          jet.mode = "INTERCEPT_BOMBER";
          jet.afterburner = true;
          jet.throttleSetting = 1.5;
        }
      }
    },

    // Update Strategic Bomber Flight & Mission Execution
    updateBomberFlight: function (worldW, worldH) {
      var b = this.activeBomber;
      if (!b) return;

      var isBlue = (b.team === "blue");
      var dx = Math.cos(b.angle) * b.speed;
      var dy = Math.sin(b.angle) * b.speed;
      b.x += dx;
      b.y += dy;

      // Engine Contrails & Smoke
      if (Math.random() < 0.60 && globalVfxParticlePool) {
        var spIdx = globalVfxParticlePool.alloc();
        if (spIdx >= 0) {
          var spo = spIdx * 8;
          var wingSpan = (b.gen === 2 && isBlue) ? 18 : 28;
          var pSign = (Math.random() < 0.5) ? -1 : 1;
          globalVfxParticlePool.buffer[spo] = b.x - Math.cos(b.angle) * 35 - Math.sin(b.angle) * (wingSpan * pSign);
          globalVfxParticlePool.buffer[spo + 1] = b.y - Math.sin(b.angle) * 35 + Math.cos(b.angle) * (wingSpan * pSign);
          globalVfxParticlePool.buffer[spo + 2] = -dx * 0.15;
          globalVfxParticlePool.buffer[spo + 3] = -dy * 0.15;
          globalVfxParticlePool.buffer[spo + 4] = 40;
          globalVfxParticlePool.buffer[spo + 5] = 40;
          globalVfxParticlePool.buffer[spo + 6] = 2.4;
          globalVfxParticlePool.buffer[spo + 7] = 0; // Contrail smoke
        }
      }

      // Check distance to target FARP
      var distToFarpX = Math.abs(b.x - b.targetFarpX);

      // PHASE 1: APPROACH
      if (b.state === "APPROACH") {
        if (distToFarpX <= 260) {
          b.state = "BOMB_RUN";
          b.bayOpen = true;
          if (typeof dfRadio === "function") {
            dfRadio(b.name + ": IP REACHED // WEAPONS BAY DOORS OPEN // COMMENCING BOMB RUN ON FARP!");
          }
        }
      }

      // PHASE 2: BOMB RUN & WEAPON RELEASE
      if (b.state === "BOMB_RUN") {
        b.dropTimer++;
        var dropInterval = (b.bombType === "NUKE" || b.bombType === "MOP") ? 1 : 12;

        if (distToFarpX <= 140 && b.bombsDropped < b.bombCount && (b.dropTimer % dropInterval === 0)) {
          this.releaseBombPayload(b);
          b.bombsDropped++;

          if (b.bombsDropped >= b.bombCount) {
            b.state = "EGRESS";
            b.bayOpen = false;
            b.speed *= 1.25; // Supersonic dash egress
            if (typeof dfRadio === "function") {
              dfRadio(b.name + ": PAYLOAD AWAY! ALL ORDNANCE RELEASED! FULL MIL-POWER EGRESS!");
            }
          }
        }
      }

      // PHASE 3: EGRESS (Exiting battlefield airspace)
      if (b.state === "EGRESS") {
        var isOffscreen = isBlue ? (b.x > worldW + 200) : (b.x < -200);
        if (isOffscreen) {
          this.activeBomber = null;
          this.dominanceTeam = null;
          this.dominanceTimer = 0;
          if (typeof dfRadio === "function") {
            dfRadio("TACTICAL BROADCAST: STRATEGIC BOMBER MISSION COMPLETE // AIRSPACE SECURED");
          }
        }
      }

      // Defensive Systems: If locked by hostile missiles, drop flares or fire CIWS
      if (b.flareCooldown > 0) b.flareCooldown--;
      if (b.laserCooldown > 0) b.laserCooldown--;

      // Check threat missiles near bomber
      if (DF && DF.missilesPool && DF.missilesPool.activeCount > 0) {
        var hostileTeam = isBlue ? 1 : 0;
        for (var mi = 0; mi < DF.missilesPool.activeCount; mi++) {
          var mo = mi * 8;
          var mOwnerRaw = Math.round(DF.missilesPool.buffer[mo + 4]);
          var mOwnerTeam = mOwnerRaw >= 100 ? (mOwnerRaw >= 200 ? 1 : 0) : mOwnerRaw;

          if (mOwnerTeam === hostileTeam) {
            var mx = DF.missilesPool.buffer[mo];
            var my = DF.missilesPool.buffer[mo + 1];
            var dMis = Math.hypot(mx - b.x, my - b.y);

            // Gen 6 Laser CIWS vaporize
            if (b.gen === 6 && b.laserCooldown <= 0 && dMis < 260) {
              b.laserCooldown = 30;
              DF.missilesPool.buffer[mo + 6] = 0; // Detonate missile
              if (typeof dfRadio === "function") {
                dfRadio(b.name + ": DIRECTIONAL LASER CIWS INTERCEPTED HOSTILE MISSILE!");
              }
              break;
            }

            // Flares dispenser
            if (b.flareCooldown <= 0 && b.flaresRemaining > 0 && dMis < 320) {
              b.flareCooldown = 40;
              b.flaresRemaining--;
              if (DF.flaresPool) {
                var fIdx = DF.flaresPool.alloc();
                if (fIdx >= 0) {
                  var fo = fIdx * 5;
                  DF.flaresPool.buffer[fo] = b.x - dx * 2;
                  DF.flaresPool.buffer[fo + 1] = b.y + (Math.random() - 0.5) * 10;
                  DF.flaresPool.buffer[fo + 2] = -dx * 0.4;
                  DF.flaresPool.buffer[fo + 3] = 1.8 + Math.random() * 1.5;
                  DF.flaresPool.buffer[fo + 4] = 45;
                }
              }
            }
          }
        }
      }
    },

    // Release Generational Weapon Payload from Bomber
    releaseBombPayload: function (bomber) {
      var isBlue = (bomber.team === "blue");
      var forwardVx = Math.cos(bomber.angle) * (bomber.speed * 0.6);

      var bombObj = {
        team: bomber.team,
        gen: bomber.gen,
        type: bomber.bombType,
        weaponName: bomber.weaponName,
        x: bomber.x,
        y: bomber.y + 12,
        vx: forwardVx,
        vy: 1.2,
        targetX: bomber.targetFarpX,
        targetY: bomber.targetFarpY,
        angle: bomber.angle,
        armed: true,
        age: 0,
        subCount: bomber.subCount || 0
      };

      this.bombs.push(bombObj);

      // Play bomb drop whistle / release sound
      if (typeof window !== "undefined" && window.TacticalAudio) {
        if (typeof window.TacticalAudio.playBombWhistle === "function") {
          window.TacticalAudio.playBombWhistle();
        }
      }
    },

    // Apply Damage to Active Strategic Bomber (From interceptor missiles or guns)
    applyDamage: function (damage, attacker) {
      if (!this.activeBomber) return;
      var b = this.activeBomber;
      b.hp -= damage;

      // Spawn fiery damage sparks
      if (globalVfxParticlePool) {
        for (var i = 0; i < 4; i++) {
          var spIdx = globalVfxParticlePool.alloc();
          if (spIdx >= 0) {
            var spo = spIdx * 8;
            globalVfxParticlePool.buffer[spo] = b.x + (Math.random() - 0.5) * 20;
            globalVfxParticlePool.buffer[spo + 1] = b.y + (Math.random() - 0.5) * 10;
            globalVfxParticlePool.buffer[spo + 2] = (Math.random() - 0.5) * 3;
            globalVfxParticlePool.buffer[spo + 3] = (Math.random() - 0.5) * 3;
            globalVfxParticlePool.buffer[spo + 4] = 18;
            globalVfxParticlePool.buffer[spo + 5] = 18;
            globalVfxParticlePool.buffer[spo + 6] = 1.4;
            globalVfxParticlePool.buffer[spo + 7] = 1; // Sparks
          }
        }
      }

      if (b.hp <= 0 && b.state !== "SPLASHED") {
        this.destroyBomber(attacker);
      }
    },

    // Splashing / Shooting Down the Strategic Bomber
    destroyBomber: function (attacker) {
      var b = this.activeBomber;
      if (!b) return;
      b.state = "SPLASHED";

      // Catastrophic mid-air breakup explosion
      if (DF && DF.explosionsPool) {
        for (var ex = 0; ex < 18; ex++) {
          var eIdx = DF.explosionsPool.alloc();
          if (eIdx >= 0) {
            var eo = eIdx * 6;
            DF.explosionsPool.buffer[eo] = b.x + (Math.random() - 0.5) * 50;
            DF.explosionsPool.buffer[eo + 1] = b.y + (Math.random() - 0.5) * 25;
            DF.explosionsPool.buffer[eo + 2] = (Math.random() - 0.5) * 8;
            DF.explosionsPool.buffer[eo + 3] = (Math.random() - 0.5) * 8;
            DF.explosionsPool.buffer[eo + 4] = 4;
            DF.explosionsPool.buffer[eo + 5] = 2.5;
          }
        }
      }

      if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playExplosion === "function") {
        window.TacticalAudio.playExplosion();
      }

      var splashCall = (attacker && attacker.callsign) ? attacker.callsign : "DEFENDER";
      if (typeof dfRadio === "function") {
        dfRadio("TACTICAL ALERT: ENEMY STRATEGIC BOMBER SPLASHED BY " + splashCall + "! FARP SAVED! AIR DOMINANCE THWARTED!");
      }

      this.activeBomber = null;
      this.dominanceTeam = null;
      this.dominanceTimer = 0;
    },

    // Update Falling Bombs and Trigger Ground Detonations
    updateBombsAndDetonations: function (worldW, worldH) {
      var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(worldH) : Math.floor(worldH * 0.84);

      // 1. Update Falling Bombs
      for (var i = this.bombs.length - 1; i >= 0; i--) {
        var bomb = this.bombs[i];
        bomb.age++;
        bomb.vy = Math.min(14.0, bomb.vy + 0.22); // Gravity acceleration
        bomb.x += bomb.vx;
        bomb.y += bomb.vy;
        bomb.angle = Math.atan2(bomb.vy, bomb.vx);

        // Ground Impact Detection
        var groundElev = (typeof getSurfaceElevationY === "function")
          ? getSurfaceElevationY(bomb.x, worldW, worldH)
          : (mslY - 12);

        if (bomb.y >= groundElev - 4) {
          this.triggerBombDetonation(bomb, bomb.x, groundElev, worldW, worldH);
          this.bombs.splice(i, 1);
        }
      }

      // 2. Update Active Detonations & VFX
      for (var d = this.detonations.length - 1; d >= 0; d--) {
        var det = this.detonations[d];
        det.timer++;

        // Gen 2 Mushroom Cloud Expansion
        if (det.type === "NUKE") {
          det.fireballRadius = Math.min(180, det.fireballRadius + 2.8);
          det.stemHeight = Math.min(420, det.stemHeight + 4.5);
          det.toroidRadius = Math.min(140, det.toroidRadius + 1.8);
          det.shockwaveRadius = Math.min(650, det.shockwaveRadius + 8.5);

          // Intense continuous seismic rumble
          if (det.timer < 75) {
            this.screenShake = Math.max(this.screenShake, 14.0 * (1.0 - det.timer / 75.0));
          }

          if (det.timer > 240) {
            this.detonations.splice(d, 1);
          }
        } else {
          // Standard HE Bomb Detonation
          det.radius = Math.min(det.maxRadius, det.radius + det.expansionRate);
          det.alpha = Math.max(0.0, 1.0 - (det.timer / det.maxLife));
          if (det.timer >= det.maxLife) {
            this.detonations.splice(d, 1);
          }
        }
      }

      // 3. Update Craters Smoke & Fire
      for (var c = this.craters.length - 1; c >= 0; c--) {
        var cr = this.craters[c];
        if (cr.smokeTimer > 0) {
          cr.smokeTimer--;
          if (Math.random() < 0.25 && globalVfxParticlePool) {
            var smIdx = globalVfxParticlePool.alloc();
            if (smIdx >= 0) {
              var smo = smIdx * 8;
              globalVfxParticlePool.buffer[smo] = cr.x + (Math.random() - 0.5) * cr.radius;
              globalVfxParticlePool.buffer[smo + 1] = cr.y - 2;
              globalVfxParticlePool.buffer[smo + 2] = (Math.random() - 0.5) * 1.2;
              globalVfxParticlePool.buffer[smo + 3] = -1.0 - Math.random() * 2.0;
              globalVfxParticlePool.buffer[smo + 4] = 45;
              globalVfxParticlePool.buffer[smo + 5] = 45;
              globalVfxParticlePool.buffer[smo + 6] = 2.5;
              globalVfxParticlePool.buffer[smo + 7] = 0; // Black Smoke
            }
          }
        }
      }
    },

    // Trigger Generational Bomb Detonation
    triggerBombDetonation: function (bomb, x, y, worldW, worldH) {
      var targetTeam = (bomb.team === "blue") ? "red" : "blue";

      // ----------------------------------------------------------------------
      // GEN 2: THERMONUCLEAR GRAVITY NUKE DETONATION
      // ----------------------------------------------------------------------
      if (bomb.type === "NUKE") {
        this.nukeFlashAlpha = 1.0; // Blinding full-screen whiteout
        this.screenShake = 22.0; // Seismic screen shake

        if (typeof window !== "undefined" && window.TacticalAudio) {
          if (typeof window.TacticalAudio.playNukeDetonation === "function") {
            window.TacticalAudio.playNukeDetonation();
          }
        }

        // Add Multi-Stage Nuclear Mushroom Cloud Entity
        this.detonations.push({
          type: "NUKE",
          x: x,
          y: y,
          timer: 0,
          fireballRadius: 20,
          stemHeight: 15,
          toroidRadius: 18,
          shockwaveRadius: 25,
          yieldMt: (bomb.gen === 2 && bomb.team === "blue") ? "9 MT (B53)" : "15 MT (RDS-37)"
        });

        // Add Giant Crater
        this.craters.push({
          x: x,
          y: y,
          radius: 95,
          smokeTimer: 900, // 15 seconds of smoking wreckage
          isNuclear: true,
          team: targetTeam
        });

        // Disable Target FARP Defenses for 20 seconds (1200 frames)
        this.farpBlackout[targetTeam] = 1200;

        if (typeof dfRadio === "function") {
          dfRadio("☢ ☢ ☢ THERMONUCLEAR DETONATION ON HOSTILE FARP! RUNWAY DESTROYED! DEFENSES SILENCED! ☢ ☢ ☢");
        }
      } else if (bomb.type === "CLUSTER") {
        // GEN 3: CBU-87 Cluster Dispensers
        this.screenShake = 6.0;
        if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playExplosion === "function") {
          window.TacticalAudio.playExplosion();
        }

        // Scatter submunition detonations along the runway
        for (var sub = 0; sub < 18; sub++) {
          var subX = x + (Math.random() - 0.5) * 220;
          this.detonations.push({
            type: "HE",
            x: subX,
            y: y,
            timer: -sub * 2, // Sequential ripple
            radius: 5,
            maxRadius: 28,
            expansionRate: 2.2,
            maxLife: 35
          });
        }

        this.craters.push({
          x: x,
          y: y,
          radius: 65,
          smokeTimer: 450,
          team: targetTeam
        });
        this.farpBlackout[targetTeam] = 600; // 10s blackout

        if (typeof dfRadio === "function") {
          dfRadio("AIR RECON: CLUSTER CARPET IMPACTS COMPLETE! RUNWAY PSP LATTICE SEVERELY SHATTERED!");
        }
      } else if (bomb.type === "MOP") {
        // GEN 5: GBU-57 Massive Ordnance Penetrator (30,000 lb bunker buster)
        this.screenShake = 16.0;
        if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playExplosion === "function") {
          window.TacticalAudio.playExplosion();
        }

        this.detonations.push({
          type: "HE",
          x: x,
          y: y,
          timer: 0,
          radius: 15,
          maxRadius: 90,
          expansionRate: 4.5,
          maxLife: 55
        });

        this.craters.push({
          x: x,
          y: y,
          radius: 80,
          smokeTimer: 700,
          team: targetTeam
        });
        this.farpBlackout[targetTeam] = 900; // 15s blackout

        if (typeof dfRadio === "function") {
          dfRadio("AIR RECON: GBU-57 MOP DEEP PENETRATION! UNDERGROUND COMMAND BUNKER COLLAPSED!");
        }
      } else if (bomb.type === "KINETIC_ROD") {
        // GEN 7: "Rods from God" Kinetic Tungsten Impactors
        this.screenShake = 18.0;
        if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playExplosion === "function") {
          window.TacticalAudio.playExplosion();
        }

        this.detonations.push({
          type: "KINETIC_PLASMA",
          x: x,
          y: y,
          timer: 0,
          radius: 20,
          maxRadius: 110,
          expansionRate: 6.0,
          maxLife: 45
        });

        this.craters.push({
          x: x,
          y: y,
          radius: 85,
          smokeTimer: 800,
          team: targetTeam
        });
        this.farpBlackout[targetTeam] = 1000;

        if (typeof dfRadio === "function") {
          dfRadio("SPACE FORCE: KINETIC ORBITAL TUNGSTEN IMPACT CONFIRMED! HYPERVELOCITY CRATER EXCAVATED!");
        }
      } else {
        // GEN 1 / GEN 4: Standard Heavy Iron Bombs / JDAM Salvo
        this.screenShake = 9.0;
        if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playExplosion === "function") {
          window.TacticalAudio.playExplosion();
        }

        this.detonations.push({
          type: "HE",
          x: x,
          y: y,
          timer: 0,
          radius: 12,
          maxRadius: 55,
          expansionRate: 3.2,
          maxLife: 45
        });

        this.craters.push({
          x: x,
          y: y,
          radius: 45,
          smokeTimer: 500,
          team: targetTeam
        });
        this.farpBlackout[targetTeam] = 700;

        if (typeof dfRadio === "function") {
          dfRadio("AIR RECON: DIRECT HIT ON ENEMY FARP! FUEL BLADDERS DETONATED!");
        }
      }
    }
  };

  // --------------------------------------------------------------------------
  // 3. Rendering Strategic Bombers (World Space)
  // --------------------------------------------------------------------------
  function drawStrategicBombers(ctx, now, colors) {
    if (!ctx) return;
    var b = StrategicBomberSystem.activeBomber;
    if (!b || b.state === "SPLASHED") return;

    var bx = Math.floor(b.x);
    var by = Math.floor(b.y);
    var isBlue = (b.team === "blue");
    var factionColor = isBlue ? "#38bdf8" : "#f43f5e";
    var primaryColor = isBlue ? "#0284c7" : "#e11d48";

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(b.angle);

    // Engine Afterburner Plumes for Supersonic Bombers (B-58, Tu-160, B-1B, Aurora)
    var hasAfterburners = (b.gen === 2 && isBlue) || b.gen === 4 || b.gen === 7;
    if (hasAfterburners) {
      ctx.save();
      var fLen = 24 + Math.sin(now * 0.05) * 6;
      ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
      ctx.beginPath();
      ctx.moveTo(-28, -8);
      ctx.lineTo(-28 - fLen, -8);
      ctx.lineTo(-28, -5);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-28, 5);
      ctx.lineTo(-28 - fLen, 5);
      ctx.lineTo(-28, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // DRAW SILHOUETTES BY GENERATION
    if (b.gen === 1) {
      // B-47 Stratojet / Tu-16 Badger (Swept-wing classic SAC / Soviet strategic jet)
      ctx.fillStyle = "#cbd5e1";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.fillRect(-26, -5, 52, 10);
      ctx.fillRect(26, -2, 6, 4);

      ctx.beginPath();
      ctx.moveTo(8, -5);
      ctx.lineTo(-14, -36);
      ctx.lineTo(-22, -36);
      ctx.lineTo(-4, -5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(8, 5);
      ctx.lineTo(-14, 36);
      ctx.lineTo(-22, 36);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#475569";
      ctx.fillRect(-6, -24, 16, 5);
      ctx.fillRect(-6, 19, 16, 5);
      ctx.fillStyle = factionColor;
      ctx.fillRect(0, -3, 6, 6);
    } else if (b.gen === 2) {
      if (isBlue) {
        // B-58 HUSTLER (Mach 2 Delta Wing Supersonic Nuclear Bomber)
        ctx.fillStyle = "#e2e8f0";
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.2;

        // Long Needle Fuselage
        ctx.fillRect(-28, -4, 56, 8);
        ctx.beginPath();
        ctx.moveTo(28, -2);
        ctx.lineTo(42, 0);
        ctx.lineTo(28, 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // 60-degree Sharp Delta Wing
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(-26, -34);
        ctx.lineTo(-26, -4);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12, 4);
        ctx.lineTo(-26, 34);
        ctx.lineTo(-26, 4);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        // 4 Underwing J79 Turbojet Nacelles
        ctx.fillStyle = "#334155";
        ctx.fillRect(-18, -22, 18, 5);
        ctx.fillRect(-12, -12, 20, 5);
        ctx.fillRect(-18, 17, 18, 5);
        ctx.fillRect(-12, 7, 20, 5);

        // Centerline MB-1C Nuclear Pod
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(-12, -2, 30, 4);
        ctx.strokeStyle = "#ffffff";
        ctx.strokeRect(-12, -2, 30, 4);
      } else {
        // Tu-95V BEAR (Massive Swept-Wing Turboprop with Tsar Bomba / RDS-37 Bay)
        ctx.fillStyle = "#94a3b8";
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.2;

        ctx.fillRect(-32, -6, 64, 12);
        ctx.beginPath();
        ctx.moveTo(10, -6);
        ctx.lineTo(-18, -44);
        ctx.lineTo(-26, -44);
        ctx.lineTo(-6, -6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(10, 6);
        ctx.lineTo(-18, 44);
        ctx.lineTo(-26, 44);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-14, -32, 24, 6);
        ctx.fillRect(-10, -18, 26, 6);
        ctx.fillRect(-14, 26, 24, 6);
        ctx.fillRect(-10, 12, 26, 6);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(10, -32, 10, 0, Math.PI * 2);
        ctx.arc(16, -18, 10, 0, Math.PI * 2);
        ctx.arc(10, 26, 10, 0, Math.PI * 2);
        ctx.arc(16, 12, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-14, -3, 32, 6);
      }
    } else if (b.gen === 3) {
      // F-111 Aardvark / Tu-22M Backfire
      ctx.fillStyle = "#64748b";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.fillRect(-24, -5, 48, 10);
      ctx.fillRect(24, -2, 6, 4);

      ctx.beginPath();
      ctx.moveTo(6, -5);
      ctx.lineTo(-16, -30);
      ctx.lineTo(-24, -28);
      ctx.lineTo(-8, -5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(6, 5);
      ctx.lineTo(-16, 30);
      ctx.lineTo(-24, 28);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (b.gen === 4) {
      // B-1B Lancer / Tu-160 Blackjack
      ctx.fillStyle = "#475569";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-30, -5, 60, 10);
      ctx.beginPath();
      ctx.moveTo(30, -3); ctx.lineTo(44, 0); ctx.lineTo(30, 3);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, -5); ctx.lineTo(-18, -34); ctx.lineTo(-26, -32); ctx.lineTo(-8, -5);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 5); ctx.lineTo(-18, 34); ctx.lineTo(-26, 32); ctx.lineTo(-8, 5);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-22, -14, 20, 6);
      ctx.fillRect(-22, 8, 20, 6);
    } else if (b.gen === 5 || b.gen === 6) {
      // B-2 Spirit / B-21 Raider / PAK DA
      ctx.fillStyle = (b.gen === 6) ? "#1e293b" : "#0f172a";
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(24, 0);
      ctx.lineTo(-12, -42);
      ctx.lineTo(-22, -34);
      ctx.lineTo(-14, -18);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-14, 18);
      ctx.lineTo(-22, 34);
      ctx.lineTo(-12, 42);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = factionColor;
      ctx.fillRect(-4, -2, 8, 4);
    } else if (b.gen === 7) {
      // AURORA Sub-Orbital Platform / Orbital FOBS
      ctx.fillStyle = "#090d16";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(36, 0);
      ctx.lineTo(-24, -28);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-24, 28);
      ctx.closePath();
      ctx.fill(); ctx.stroke();

      ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-24, -28); ctx.lineTo(36, 0); ctx.lineTo(-24, 28);
      ctx.stroke();
    }

    // Open Bomb Bay Doors Animation
    if (b.bayOpen) {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(-10, -6, 20, 12);
      ctx.strokeStyle = "#fbbf24";
      ctx.strokeRect(-10, -6, 20, 12);
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 6px monospace";
      ctx.fillText("BAY OPEN", -14, -8);
    }

    ctx.restore();

    // In-World Bomber Telemetry & Health Bar
    ctx.save();
    var barW = 88;
    var barH = 5;
    var barX = bx - Math.floor(barW * 0.5);
    var barY = by - 36;
    var hpPct = Math.max(0.0, Math.min(1.0, b.hp / b.maxHp));

    ctx.fillStyle = "rgba(6, 10, 18, 0.9)";
    ctx.fillRect(barX, barY, barW, barH + 12);
    ctx.strokeStyle = factionColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH + 12);

    ctx.fillStyle = factionColor;
    ctx.fillRect(barX + 2, barY + 11, Math.floor((barW - 4) * hpPct), barH - 2);

    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    var nukeGlyph = (b.gen === 2) ? " ☢" : "";
    ctx.fillText(b.name + nukeGlyph, bx, barY + 8);
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. Rendering Falling Bombs & Detonations (World Space)
  // --------------------------------------------------------------------------
  function drawBombExplosions(ctx, now, colors) {
    if (!ctx) return;

    // 1. Draw Craters on FARPs
    for (var c = 0; c < StrategicBomberSystem.craters.length; c++) {
      var cr = StrategicBomberSystem.craters[c];
      ctx.save();
      ctx.fillStyle = cr.isNuclear ? "rgba(20, 20, 20, 0.95)" : "rgba(30, 41, 59, 0.90)";
      ctx.beginPath();
      ctx.ellipse(cr.x, cr.y, cr.radius, cr.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cr.isNuclear ? "rgba(245, 158, 11, 0.8)" : "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (cr.smokeTimer > 0 && Math.random() < 0.4) {
        ctx.fillStyle = "rgba(251, 146, 60, 0.85)";
        ctx.beginPath();
        var fx = cr.x + (Math.random() - 0.5) * cr.radius * 0.8;
        ctx.arc(fx, cr.y - 4, 3 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Falling Bombs
    for (var b = 0; b < StrategicBomberSystem.bombs.length; b++) {
      var bomb = StrategicBomberSystem.bombs[b];
      ctx.save();
      ctx.translate(Math.floor(bomb.x), Math.floor(bomb.y));
      ctx.rotate(bomb.angle);

      if (bomb.type === "NUKE") {
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(-10, -4, 20, 8);
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(-2, -4, 5, 8);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-14, -6, 4, 12);
        ctx.fillStyle = "#94a3b8";
        ctx.beginPath();
        ctx.arc(10, 0, 4, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-14, -4); ctx.lineTo(-24, -8);
        ctx.moveTo(-14, 4); ctx.lineTo(-24, 8);
        ctx.stroke();
        ctx.fillStyle = "rgba(245, 158, 11, 0.6)";
        ctx.beginPath();
        ctx.arc(-26, 0, 8, -Math.PI * 0.5, Math.PI * 0.5, true);
        ctx.fill();
      } else if (bomb.type === "MOP") {
        ctx.fillStyle = "#334155";
        ctx.fillRect(-14, -4, 28, 8);
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(-18, -6, 4, 12);
      } else if (bomb.type === "KINETIC_ROD") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-16, -2, 32, 4);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-16, -2, 32, 4);
      } else {
        ctx.fillStyle = "#475569";
        ctx.fillRect(-6, -3, 12, 6);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(-1, -3, 3, 6);
      }
      ctx.restore();
    }

    // 3. Draw Active Detonations
    for (var d = 0; d < StrategicBomberSystem.detonations.length; d++) {
      var det = StrategicBomberSystem.detonations[d];

      if (det.type === "NUKE") {
        var nx = Math.floor(det.x);
        var ny = Math.floor(det.y);

        ctx.save();

        ctx.strokeStyle = "rgba(255, 255, 255, " + Math.max(0.0, 0.85 - (det.shockwaveRadius / 650)) + ")";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(nx, ny, det.shockwaveRadius, 0, Math.PI * 2);
        ctx.stroke();

        var stemH = det.stemHeight;
        var stemTopY = ny - stemH;
        var gradStem = ctx.createLinearGradient(nx, ny, nx, stemTopY);
        gradStem.addColorStop(0, "rgba(245, 158, 11, 0.95)");
        gradStem.addColorStop(0.35, "rgba(220, 38, 38, 0.90)");
        gradStem.addColorStop(0.75, "rgba(30, 41, 59, 0.85)");
        gradStem.addColorStop(1, "rgba(15, 23, 42, 0.95)");

        ctx.fillStyle = gradStem;
        ctx.beginPath();
        var stemW = Math.max(22, det.toroidRadius * 0.35);
        ctx.moveTo(nx - stemW * 1.5, ny);
        ctx.quadraticCurveTo(nx - stemW * 0.6, ny - stemH * 0.5, nx - stemW, stemTopY);
        ctx.lineTo(nx + stemW, stemTopY);
        ctx.quadraticCurveTo(nx + stemW * 0.6, ny - stemH * 0.5, nx + stemW * 1.5, ny);
        ctx.closePath();
        ctx.fill();

        var toroidR = det.toroidRadius;
        var capY = stemTopY;
        var gradCap = ctx.createRadialGradient(nx, capY, 10, nx, capY, toroidR);
        gradCap.addColorStop(0, "rgba(254, 240, 138, 0.95)");
        gradCap.addColorStop(0.3, "rgba(245, 158, 11, 0.90)");
        gradCap.addColorStop(0.65, "rgba(185, 28, 28, 0.85)");
        gradCap.addColorStop(0.9, "rgba(30, 41, 59, 0.80)");
        gradCap.addColorStop(1, "rgba(15, 23, 42, 0.0)");

        ctx.fillStyle = gradCap;
        ctx.beginPath();
        ctx.ellipse(nx, capY, toroidR, toroidR * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        if (det.timer < 90) {
          var fbR = det.fireballRadius;
          var gradFb = ctx.createRadialGradient(nx, ny - 10, 5, nx, ny - 10, fbR);
          gradFb.addColorStop(0, "#ffffff");
          gradFb.addColorStop(0.25, "#fef08a");
          gradFb.addColorStop(0.55, "#f97316");
          gradFb.addColorStop(0.85, "#dc2626");
          gradFb.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = gradFb;
          ctx.beginPath();
          ctx.arc(nx, ny - 10, fbR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      } else if (det.type === "KINETIC_PLASMA") {
        ctx.save();
        ctx.fillStyle = "rgba(56, 189, 248, " + det.alpha + ")";
        ctx.beginPath();
        ctx.arc(det.x, det.y, det.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(det.x, 0); ctx.lineTo(det.x, det.y);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        var alpha = det.alpha || 1.0;
        ctx.fillStyle = "rgba(245, 158, 11, " + (alpha * 0.8) + ")";
        ctx.beginPath();
        ctx.arc(det.x, det.y - 8, det.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(239, 68, 68, " + (alpha * 0.6) + ")";
        ctx.beginPath();
        ctx.arc(det.x, det.y - 12, det.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Screen-Space Overlays (Fullscreen Nuke Flash & Strategic Banners)
  // --------------------------------------------------------------------------
  function drawStrategicBomberScreenOverlay(ctx, screenW, screenH, now) {
    if (!ctx) return;

    if (StrategicBomberSystem.nukeFlashAlpha > 0.005) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, " + StrategicBomberSystem.nukeFlashAlpha + ")";
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }

    var domTeam = StrategicBomberSystem.dominanceTeam;
    var timer = StrategicBomberSystem.dominanceTimer;
    var activeB = StrategicBomberSystem.activeBomber;

    if (domTeam && timer > 0 && timer < 70 && !activeB) {
      ctx.save();
      var isBlue = (domTeam === "blue");
      var bannerColor = isBlue ? "#38bdf8" : "#f43f5e";
      var bannerBg = "rgba(6, 10, 18, 0.88)";
      var remainingSec = ((70 - timer) / 30.0).toFixed(1);

      var bw = 480;
      var bh = 24;
      var bx = Math.floor((screenW - bw) * 0.5);
      var by = 58;

      ctx.fillStyle = bannerBg;
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = bannerColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx, by, bw, bh);

      ctx.font = "bold 9.5px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = bannerColor;
      ctx.fillText("⚡ AIR DOMINANCE SECURED // STRATEGIC BOMBER DISPATCH IN " + remainingSec + "s", screenW * 0.5, by + 16);
      ctx.restore();
    } else if (activeB) {
      ctx.save();
      var isBlueB = (activeB.team === "blue");
      var bColor = isBlueB ? "#38bdf8" : "#f43f5e";
      var bw2 = 520;
      var bh2 = 24;
      var bx2 = Math.floor((screenW - bw2) * 0.5);
      var by2 = 58;

      ctx.fillStyle = "rgba(6, 10, 18, 0.88)";
      ctx.fillRect(bx2, by2, bw2, bh2);
      ctx.strokeStyle = bColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(bx2, by2, bw2, bh2);

      var nukeIcon = (activeB.gen === 2) ? " ☢ " : " ";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = bColor;
      ctx.fillText("AIR DOMINANCE // " + (isBlueB ? "BLUE" : "RED") + " " + activeB.name + nukeIcon + "[" + activeB.weaponName + "]", screenW * 0.5, by2 + 16);
      ctx.restore();
    }
  }

  // Export to Global
  global.STRATEGIC_BOMBER_SPECS = STRATEGIC_BOMBER_SPECS;
  global.StrategicBomberSystem = StrategicBomberSystem;
  global.drawStrategicBombers = drawStrategicBombers;
  global.drawBombExplosions = drawBombExplosions;
  global.drawStrategicBomberScreenOverlay = drawStrategicBomberScreenOverlay;

})(typeof window !== "undefined" ? window : this);
