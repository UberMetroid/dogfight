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

      // Click to Select / Track Aircraft
      canvas.addEventListener("pointerdown", function (e) {
        var rect = canvas.getBoundingClientRect();
        var clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
        var clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Find closest active jet within 40px
        var closestJet = null;
        var minDist = 45;

        if (DF && DF.allJets) {
          for (var i = 0; i < DF.allJets.length; i++) {
            var j = DF.allJets[i];
            if (!j.active || j.isDying) continue;
            var dist = Math.hypot(j.x - clickX, j.y - clickY);
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

    // Launch a 1v1 Historical Duel for a specific generation
    spawnHistoricalDuel: function (gen) {
      gen = parseInt(gen, 10) || 4;
      if (gen < 1) gen = 1;
      if (gen > 7) gen = 7;

      // Reset all jets
      for (var i = 0; i < DF.allJets.length; i++) {
        DF.allJets[i].active = false;
        DF.allJets[i].isDying = false;
      }

      // Activate Gen in activeGens mask
      for (var g = 1; g <= 7; g++) activeGens[g] = (g === gen);

      var spec = AIRCRAFT_SPECS[gen] || AIRCRAFT_SPECS[4];
      var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(DF.height) : (DF.height - 120);
      var combatAltFt = (gen === 1) ? 22000 : (gen <= 3 ? 35000 : (gen <= 5 ? 48000 : 65000));
      var startY = (typeof getYFromAltitude === "function") ? getYFromAltitude(combatAltFt, DF.height) : (mslY - 180);

      // Blue Jet
      var bJet = DF.bluePool[0];
      bJet.gen = gen;
      bJet.team = "blue";
      bJet.active = true;
      bJet.isDying = false;
      bJet.hp = 100.0;
      bJet.x = DF.width * 0.22;
      bJet.y = startY;
      bJet.angle = 0.0; // Facing East
      bJet.targetAngle = 0.0;
      bJet.speed = spec.baseSpeed;
      setupJetCallsignAndVariant(bJet, gen, "blue", 0);

      // Red Jet
      var rJet = DF.redPool[0];
      rJet.gen = gen;
      rJet.team = "red";
      rJet.active = true;
      rJet.isDying = false;
      rJet.hp = 100.0;
      rJet.x = DF.width * 0.78;
      rJet.y = startY + 15;
      rJet.angle = Math.PI; // Facing West
      rJet.targetAngle = Math.PI;
      rJet.speed = spec.baseSpeed;
      setupJetCallsignAndVariant(rJet, gen, "red", 0);

      // Pair them up as targets
      bJet.targetJet = rJet;
      rJet.targetJet = bJet;

      this.selectJet(bJet);

      if (typeof dfRadio === "function") {
        var eraInfo = this.ERA_DATA[gen];
        dfRadio("TACTICAL DUEL ENGAGED: " + eraInfo.bluePlane + " vs " + eraInfo.redPlane + " [" + eraInfo.name + "]!");
      }

      if (global.TacticalAudio) global.TacticalAudio.playRadarLockTone();
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

    // Draw reticle on tracked jet in canvas
    drawTrackedReticle: function (ctx) {
      if (!this.trackedJet || !this.trackedJet.active || this.trackedJet.isDying) {
        return;
      }
      var j = this.trackedJet;
      var isBlue = (j.team === "blue");
      var color = isBlue ? "#38bdf8" : "#ef4444";

      ctx.save();
      ctx.translate(Math.floor(j.x), Math.floor(j.y));

      // Rotating Target Reticle Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      var size = 20;

      // 4 Corner Brackets
      var len = 6;
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
      ctx.font = "8px ui-monospace, monospace";
      ctx.fillText(j.callsign || "TARGET", -size, -size - 5);

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
      var altFt = Math.round(typeof getAltitudeFeet === "function" ? getAltitudeFeet(j.y, DF.height) : 35000);
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
