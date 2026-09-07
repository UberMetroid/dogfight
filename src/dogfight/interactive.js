// # Interactive Tactical Controller & Cockpit Telemetry MFD
//
// Logline: Live aircraft tracking, Cockpit MFD, Boyd Ps bar, OODA loop display, and Duel Spawner.
//
(function (global) {
  "use strict";

  global.InteractiveController = {
    trackedJet: null,
    simSpeed: 1.0,
    isPaused: false,

    // Historical Matchups for 7 Generations
    ERA_DATA: {
      1: {
        name: "KOREA & TRANSONIC GUNS",
        period: "1944–1953",
        bluePlane: "F-86 SABRE",
        redPlane: "MiG-15 FAGOT",
        doctrine: "Visual dogfight, high turn radius, manual gyro gunsights, high aerodynamic drag at transonic speeds. Zero missiles.",
        speedMach: "0.92 Mach",
        turnRate: "14.0 deg/s",
        weapons: "6x .50 Cal M3 Browning / 2x 23mm + 1x 37mm Cannon",
        rcs: "1.00 m²",
        oodaLatency: "24 frames (~400ms human cognitive lag)",
        boydNote: "Col. John Boyd flew F-86s in Korea, developing E-M Theory based on the Sabre's hydraulic controls which allowed pilots to transition faster between maneuvers (cycling OODA faster)."
      },
      2: {
        name: "MACH 2 & EARLY MISSILES",
        period: "1953–1965",
        bluePlane: "F-4 PHANTOM II / F-104",
        redPlane: "MiG-21 FISHBED",
        doctrine: "Extreme climb rates, high speed intercept, early semi-active radar & infrared missiles (AIM-7, AIM-9B). High energy bleed in sustained turns.",
        speedMach: "2.10 Mach",
        turnRate: "15.5 deg/s",
        weapons: "AIM-7 Sparrow (SARH) / K-13 Atoll IR / 20mm Vulcan Pod",
        rcs: "1.10 m²",
        oodaLatency: "18 frames",
        boydNote: "Boyd proved that high top speed was useless if the aircraft lost all its energy in the first turn. E-M quantified energy loss ($P_s$)."
      },
      3: {
        name: "BVR RADAR & VARIABLE GEOMETRY",
        period: "1965–1975",
        bluePlane: "F-14 TOMCAT / F-15 EAGLE",
        redPlane: "MiG-23 FLOGGER / Su-27",
        doctrine: "High-power AWG-9 pulse-Doppler radar, beyond-visual-range (BVR) multi-target engagement, variable sweep wings for optimal L/D across regimes.",
        speedMach: "2.35 Mach",
        turnRate: "17.0 deg/s",
        weapons: "AIM-54 Phoenix (Mach 5, 100nm) / AIM-9L / M61A1",
        rcs: "1.50 m²",
        oodaLatency: "12 frames",
        boydNote: "Swing wings mechanically optimized aspect ratio to maximize specific excess power across subsonic and supersonic regimes."
      },
      4: {
        name: "FLY-BY-WIRE & ALL-ASPECT HOBS",
        period: "1975–2000",
        bluePlane: "F-16 VIPER / F-15C",
        redPlane: "Su-27 FLANKER / MiG-29",
        doctrine: "Relaxed static stability, 9G sustained rate fight, high-off-boresight heaters (AIM-9X, R-73), fire-and-forget AMRAAM active radar missiles.",
        speedMach: "2.05 Mach",
        turnRate: "18.5 deg/s (9G Sustained)",
        weapons: "AIM-120 AMRAAM (Fox-3) / AIM-9X / 20mm M61A2",
        rcs: "1.20 m²",
        oodaLatency: "6 frames",
        boydNote: "The Lightweight Fighter Program (F-16) was directly created by Boyd and the Fighter Mafia to embody pure E-M dominance."
      },
      5: {
        name: "VLO STEALTH & 3D TVC SUPERCRUISE",
        period: "2000–2020",
        bluePlane: "F-22 RAPTOR / F-35",
        redPlane: "Su-57 FELON / J-20",
        doctrine: "Very Low Observable (VLO) shaping, internal weapon bays (fleeting RCS bloom upon release), Mach 1.6 supercruise without afterburner, 3D thrust vectoring post-stall flips.",
        speedMach: "2.25 Mach (Mach 1.6 Supercruise)",
        turnRate: "20.0 deg/s (Post-Stall TVC)",
        weapons: "Internal AIM-120D / AIM-9X / Phased AESA Fusion",
        rcs: "0.0001 m² (Marble-sized)",
        oodaLatency: "2 frames",
        boydNote: "Stealth denies the adversary's Observe phase, collapsing their OODA loop before they can Orient."
      },
      6: {
        name: "NGAD & LOYAL WINGMAN (CCA)",
        period: "2020–2035",
        bluePlane: "NGAD 6TH-GEN + CCA DRONES",
        redPlane: "NGAD RED + CCA MESH",
        doctrine: "Tailless broadband stealth, adaptive cycle engines, directed energy lasers, Collaborative Combat Aircraft (CCA) flying in forward sensor sweep formation.",
        speedMach: "2.5+ Mach (Hypersonic Burst)",
        turnRate: "21.5 deg/s",
        weapons: "Directed Energy Laser / Hypersonic AAM / CCA Decoys",
        rcs: "0.00005 m²",
        oodaLatency: "1 frame",
        boydNote: "Distributed sensors compress decision latency to single-digit milliseconds through collaborative machine intelligence."
      },
      7: {
        name: "AUTONOMOUS QUANTUM SWARM MESH",
        period: "AI ERA // FUTURE",
        bluePlane: "CCA SWARM ALPHA/BRAVO",
        redPlane: "CCA SWARM CHARLIE/DELTA",
        doctrine: "Autonomous distributed micro-drone kinetic mesh, 15G+ hyper-turns without human biology limits, omnidirectional kinetic pulses, zero-latency shared hive OODA.",
        speedMach: "3.0+ Mach",
        turnRate: "24.5 deg/s (15G+ AI Dynamic)",
        weapons: "Omnidirectional Kinetic Pulse / Swarm Saturation",
        rcs: "0.00001 m²",
        oodaLatency: "0 frames (Instantaneous Neural Inference)",
        boydNote: "Zero decision latency. The OODA loop converges to an instantaneous continuous feedback field."
      }
    },

    init: function () {
      var canvas = document.getElementById("dogfight-canvas");
      if (!canvas) return;

      var self = this;

      // Click to Select / Track Aircraft (Screen to World Space)
      canvas.addEventListener("pointerdown", function (e) {
        var rect = canvas.getBoundingClientRect();
        var clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
        var clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
        var worldPt = (DF && DF.camera && typeof DF.camera.screenToWorld === "function")
          ? DF.camera.screenToWorld(clickX, clickY)
          : { x: clickX, y: clickY };

        var camScale = (DF && DF.camera && DF.camera.scale) ? DF.camera.scale : 1.0;
        var closestJet = null;
        var minDist = 45 / camScale;

        if (DF && DF.allJets) {
          for (var i = 0; i < DF.allJets.length; i++) {
            var j = DF.allJets[i];
            if (!j.active || j.isDying) continue;
            var dist = Math.hypot(j.x - worldPt.x, j.y - worldPt.y);
            if (dist < minDist) {
              minDist = dist;
              closestJet = j;
            }
          }
        }

        if (closestJet) {
          self.selectJet(closestJet);
          if (global.TacticalAudio) global.TacticalAudio.playRadarLockTone();
        }
      });

      // Mouse Wheel Zoom Override
      canvas.addEventListener("wheel", function (e) {
        if (DF && DF.camera && typeof DF.camera.onWheel === "function") {
          e.preventDefault();
          DF.camera.onWheel(e.deltaY);
        }
      }, { passive: false });

      // Keyboard shortcuts for Agile Combat Employment (ACE) Touch-and-Go
      window.addEventListener("keydown", function (e) {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        if (e.key === "a" || e.key === "A") {
          if (typeof orderFleetAceTouchAndGo === "function") {
            orderFleetAceTouchAndGo("blue");
          }
        } else if (e.key === "r" || e.key === "R") {
          if (typeof orderFleetAceTouchAndGo === "function") {
            orderFleetAceTouchAndGo("red");
          }
        }
      });
    },

    selectJet: function (jet) {
      this.trackedJet = jet;
      var mfd = document.getElementById("mfd-panel");
      if (mfd) mfd.classList.add("active");
    },

    clearTrackedJet: function () {
      this.trackedJet = null;
      var mfd = document.getElementById("mfd-panel");
      if (mfd) mfd.classList.remove("active");
    },

    // Launch a 1v1 Asymmetric Matchup with independent Blue and Red generations
    spawnAsymmetricDuel: function (blueGen, redGen) {
      blueGen = parseInt(blueGen, 10) || 4;
      redGen = parseInt(redGen, 10) || 4;
      if (blueGen < 1) blueGen = 1;
      if (blueGen > 7) blueGen = 7;
      if (redGen < 1) redGen = 1;
      if (redGen > 7) redGen = 7;

      // Reset all jets in pools
      for (var i = 0; i < DF.allJets.length; i++) {
        DF.allJets[i].active = false;
        DF.allJets[i].isDying = false;
      }

      // Activate Gen in respective team masks
      for (var g = 1; g <= 7; g++) {
        activeGensBlue[g] = (g === blueGen);
        activeGensRed[g] = (g === redGen);
      }
      if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
      if (typeof saveActiveGens === "function") saveActiveGens();
      if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();

      var bSpec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[blueGen]) ? AIRCRAFT_SPECS[blueGen] : { baseSpeed: 4.8 };
      var rSpec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[redGen]) ? AIRCRAFT_SPECS[redGen] : { baseSpeed: 4.8 };

      var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
      var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

      var bAltFt = (blueGen === 1) ? 22000 : (blueGen <= 3 ? 35000 : (blueGen <= 5 ? 48000 : 65000));
      var rAltFt = (redGen === 1) ? 22000 : (redGen <= 3 ? 35000 : (redGen <= 5 ? 48000 : 65000));
      var bStartY = (typeof getYFromAltitude === "function") ? getYFromAltitude(bAltFt, worldH) : (worldH * 0.4);
      var rStartY = (typeof getYFromAltitude === "function") ? getYFromAltitude(rAltFt, worldH) : (worldH * 0.42);

      // Blue Jet
      var bJet = DF.bluePool[0];
      bJet.gen = blueGen;
      bJet.team = "blue";
      bJet.active = true;
      bJet.isDying = false;
      bJet.deathTimer = 0;
      bJet.fadeAlpha = 1.0;
      bJet.hp = 100.0;
      bJet.maxHp = 100.0;
      bJet.damageState = "NOMINAL";
      bJet.lastDamagedBy = "";
      bJet.damageSmokeTimer = 0;
      bJet.damageSparksTimer = 0;
      bJet.x = worldW * 0.22;
      bJet.y = bStartY;
      bJet.angle = 0.0; // Facing East
      bJet.targetAngle = 0.0;
      bJet.speed = bSpec.baseSpeed || 4.8;
      bJet.baseSpeed = bSpec.baseSpeed || 4.8;
      bJet.prevSpeed = bJet.speed;
      bJet.ps = 0;
      bJet.turnRate = 0;
      bJet.gForce = 1.0;
      bJet.isStalled = false;
      bJet.mode = "ENGAGED";
      bJet.modeTimer = 60;
      bJet.afterburner = true;
      bJet.isLead = true;
      bJet.isHero = true;
      bJet.rcs = bSpec.rcsClean || bSpec.rcs || 1.0;
      bJet.bayDoorTimer = 0;
      bJet.flareCooldown = 0;
      bJet.chaffCooldown = 0;
      bJet.gunCooldown = 0;
      bJet.missileCooldown = blueGen === 1 ? 999999 : 12;
      bJet.laserCooldown = 0;
      bJet.triLaserCooldown = 0;
      bJet.superLaserCooldown = blueGen === 7 ? 60 : 0;
      bJet.superLaserPulse = 0;
      bJet.shieldPulse = 0;
      bJet.ccaDeployed = false;
      setupJetCallsignAndVariant(bJet, blueGen, "blue", 0);
      if (bJet.contrail) bJet.contrail.clear();
      if (bJet.wingVapor) bJet.wingVapor.clear();

      // Red Jet
      var rJet = DF.redPool[0];
      rJet.gen = redGen;
      rJet.team = "red";
      rJet.active = true;
      rJet.isDying = false;
      rJet.deathTimer = 0;
      rJet.fadeAlpha = 1.0;
      rJet.hp = 100.0;
      rJet.maxHp = 100.0;
      rJet.damageState = "NOMINAL";
      rJet.lastDamagedBy = "";
      rJet.damageSmokeTimer = 0;
      rJet.damageSparksTimer = 0;
      rJet.x = worldW * 0.78;
      rJet.y = rStartY;
      rJet.angle = Math.PI; // Facing West
      rJet.targetAngle = Math.PI;
      rJet.speed = rSpec.baseSpeed || 4.8;
      rJet.baseSpeed = rSpec.baseSpeed || 4.8;
      rJet.prevSpeed = rJet.speed;
      rJet.ps = 0;
      rJet.turnRate = 0;
      rJet.gForce = 1.0;
      rJet.isStalled = false;
      rJet.mode = "ENGAGED";
      rJet.modeTimer = 60;
      rJet.afterburner = true;
      rJet.isLead = true;
      rJet.isHero = false;
      rJet.rcs = rSpec.rcsClean || rSpec.rcs || 1.0;
      rJet.bayDoorTimer = 0;
      rJet.flareCooldown = 0;
      rJet.chaffCooldown = 0;
      rJet.gunCooldown = 0;
      rJet.missileCooldown = redGen === 1 ? 999999 : 12;
      rJet.laserCooldown = 0;
      rJet.triLaserCooldown = 0;
      rJet.superLaserCooldown = redGen === 7 ? 60 : 0;
      rJet.superLaserPulse = 0;
      rJet.shieldPulse = 0;
      rJet.ccaDeployed = false;
      setupJetCallsignAndVariant(rJet, redGen, "red", 0);
      if (rJet.contrail) rJet.contrail.clear();
      if (rJet.wingVapor) rJet.wingVapor.clear();

      // Deactivate unused slots
      for (var rem = 1; rem < 7; rem++) {
        DF.bluePool[rem].active = false;
        DF.bluePool[rem].targetJet = null;
        DF.bluePool[rem].wingmanJet = null;
        DF.redPool[rem].active = false;
        DF.redPool[rem].targetJet = null;
        DF.redPool[rem].wingmanJet = null;
      }

      // Pair them up as mutual targets
      bJet.targetJet = rJet;
      rJet.targetJet = bJet;
      bJet.wingmanJet = bJet;
      rJet.wingmanJet = rJet;

      this.selectJet(bJet);

      var bName = (bSpec.hudName) || ("GEN " + blueGen);
      var rName = (rSpec.hudName) || ("GEN " + redGen);

      if (typeof dfRadio === "function") {
        if (blueGen === redGen) {
          var eraInfo = this.ERA_DATA[blueGen] || {};
          dfRadio("HISTORICAL DUEL ENGAGED: " + (eraInfo.bluePlane || bName) + " vs " + (eraInfo.redPlane || rName) + " [" + (eraInfo.name || ("GEN " + blueGen)) + "]!");
        } else {
          dfRadio("⚡ ASYMMETRIC WARFARE ENGAGED: BLUE " + bName + " (GEN " + blueGen + ") vs RED " + rName + " (GEN " + redGen + ")!");
        }
      }

      if (global.TacticalAudio) global.TacticalAudio.playRadarLockTone();
    },

    // Launch a 1v1 Historical Duel for a specific generation
    spawnHistoricalDuel: function (gen) {
      this.spawnAsymmetricDuel(gen, gen);
    },

    // Set simulation speed multiplier
    setSimSpeed: function (speed) {
      if (speed === 0) {
        this.isPaused = !this.isPaused;
      } else {
        this.simSpeed = speed;
        this.isPaused = false;
      }

      var btns = document.querySelectorAll(".speed-btn");
      btns.forEach(function (b) { b.classList.remove("active"); });
      var targetId = (speed === 0) ? "speed-pause" : ("speed-" + speed.toString().replace(".", ""));
      var targetBtn = document.getElementById(targetId);
      if (targetBtn) targetBtn.classList.add("active");
    },

    // Draw reticle on tracked jet in canvas (adapts to camera scale)
    drawTrackedReticle: function (ctx) {
      if (!this.trackedJet || !this.trackedJet.active || this.trackedJet.isDying) {
        return;
      }
      var j = this.trackedJet;
      var isBlue = (j.team === "blue");
      var color = isBlue ? "#38bdf8" : "#ef4444";
      var camScale = (DF && DF.camera && DF.camera.scale) ? DF.camera.scale : 1.0;

      ctx.save();
      ctx.translate(Math.floor(j.x), Math.floor(j.y));

      // Rotating Target Reticle Box (Normalized to screen appearance)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2 / camScale;
      var size = 20 / camScale;
      var len = 6 / camScale;

      // 4 Corner Brackets
      ctx.beginPath();
      // Top-Left
      ctx.moveTo(-size, -size + len); ctx.lineTo(-size, -size); ctx.lineTo(-size + len, -size);
      // Top-Right
      ctx.moveTo(size - len, -size); ctx.lineTo(size, -size); ctx.lineTo(size, -size + len);
      // Bottom-Right
      ctx.moveTo(size, size - len); ctx.lineTo(size, size); ctx.lineTo(size - len, size);
      // Bottom-Left
      ctx.moveTo(-size + len, size); ctx.lineTo(-size, size); ctx.lineTo(-size, size - len);
      ctx.stroke();

      // Callsign Tag above box
      ctx.fillStyle = color;
      ctx.font = Math.max(7, Math.round(9 / camScale)) + "px ui-monospace, monospace";
      ctx.fillText(j.callsign || "TARGET", -size, -size - (4 / camScale));

      ctx.restore();
    },

    // Update the DOM MFD Telemetry UI
    updateMfdDisplay: function () {
      if (!this.trackedJet || !this.trackedJet.active) {
        // Auto-select first active blue jet if available
        if (DF && DF.bluePool) {
          for (var i = 0; i < DF.bluePool.length; i++) {
            if (DF.bluePool[i].active && !DF.bluePool[i].isDying) {
              this.trackedJet = DF.bluePool[i];
              break;
            }
          }
        }
        if (!this.trackedJet) return;
      }

      var j = this.trackedJet;
      var spec = AIRCRAFT_SPECS[j.gen] || AIRCRAFT_SPECS[4];

      // Update Callsign & Team
      var csEl = document.getElementById("mfd-callsign");
      if (csEl) csEl.textContent = j.callsign || "AIRFRAME";

      var genEl = document.getElementById("mfd-gen");
      if (genEl) genEl.textContent = "GEN " + j.gen + " // " + (spec.hudName || "FIGHTER");

      var teamEl = document.getElementById("mfd-team");
      if (teamEl) {
        teamEl.textContent = (j.team === "blue") ? "BLUE FORCE [ALLIED]" : "RED FORCE [HOSTILE]";
        teamEl.className = "mfd-badge " + (j.team === "blue" ? "badge-blue" : "badge-red");
      }

      // Airspeed & Mach
      var mach = (j.speed / 3.4).toFixed(2);
      var kias = Math.round(j.speed * 110);
      var spdEl = document.getElementById("mfd-speed");
      if (spdEl) spdEl.textContent = kias + " KIAS (M " + mach + ")";

      // Altitude
      var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
      var altFt = Math.round(typeof getAltitudeFeet === "function" ? getAltitudeFeet(j.y, worldH) : 35000);
      var altEl = document.getElementById("mfd-alt");
      if (altEl) altEl.textContent = altFt.toLocaleString() + " FT MSL";

      // G-Force
      var gVal = (typeof j.gForce === "number") ? j.gForce.toFixed(1) : "1.0";
      var gEl = document.getElementById("mfd-gforce");
      if (gEl) gEl.textContent = "+" + gVal + " G";

      // Boyd Specific Excess Power (Ps)
      // Ps = ((T - D) / W) * V
      var psVal = (typeof j.ps === "number") ? Math.round(j.ps) : 45;
      var psEl = document.getElementById("mfd-ps");
      var psBar = document.getElementById("mfd-ps-bar");
      if (psEl) psEl.textContent = (psVal >= 0 ? "+" : "") + psVal + " FT/S";
      if (psBar) {
        var pct = Math.max(0, Math.min(100, (psVal + 150) / 3.0));
        psBar.style.width = pct + "%";
        psBar.className = "ps-bar-fill " + (psVal >= 20 ? "ps-positive" : (psVal >= -20 ? "ps-neutral" : "ps-negative"));
      }

      // OODA Phase Indicator
      // Determine current OODA state
      var phase = "OBSERVE";
      if (j.gunCooldown > 0 || (j.targetJet && Math.hypot(j.targetJet.x - j.x, j.targetJet.y - j.y) < 180)) {
        phase = "ACT";
      } else if (j.targetJet && (j.missileCooldown <= 5 || j.bayDoorTimer > 0)) {
        phase = "DECIDE";
      } else if (j.targetJet) {
        phase = "ORIENT";
      } else {
        phase = "OBSERVE";
      }

      var phases = ["OBSERVE", "ORIENT", "DECIDE", "ACT"];
      for (var p = 0; p < phases.length; p++) {
        var pName = phases[p];
        var pEl = document.getElementById("ooda-" + pName.toLowerCase());
        if (pEl) {
          if (pName === phase) pEl.classList.add("active");
          else pEl.classList.remove("active");
        }
      }

      // Target Lock
      var tgtEl = document.getElementById("mfd-target");
      if (tgtEl) {
        if (j.targetJet && j.targetJet.active) {
          var distNm = (Math.hypot(j.targetJet.x - j.x, j.targetJet.y - j.y) * 0.08).toFixed(1);
          tgtEl.textContent = j.targetJet.callsign + " (" + distNm + " NM)";
          tgtEl.style.color = (j.targetJet.team === "blue") ? "#38bdf8" : "#ef4444";
        } else {
          tgtEl.textContent = "SEARCHING RADAR CONE";
          tgtEl.style.color = "#94a3b8";
        }
      }

      // Weapons State
      var wpnEl = document.getElementById("mfd-weapons");
      if (wpnEl) {
        if (j.gen === 1) wpnEl.textContent = "20mm CANNONS // NO MISSILES";
        else if (j.gen === 5 && j.bayDoorTimer > 0) wpnEl.textContent = "WEAPONS BAY OPEN // RADAR BLOOM!";
        else if (j.gen >= 6) wpnEl.textContent = "DIRECTED ENERGY LASER // CCA LINKED";
        else if (j.missileCooldown <= 0) wpnEl.textContent = "FOX-3 ARMED // IN NO-ESCAPE ZONE";
        else wpnEl.textContent = "RADAR TRACKING // RELOADING";
      }
    }
  };

})(typeof window !== "undefined" ? window : this);
