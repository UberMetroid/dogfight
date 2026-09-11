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

    // Historical Matchups for 6 Generations — West vs East
    ERA_DATA: {
      1: {
        name: "KOREA & TRANSONIC GUNS",
        period: "1944–1953",
        westPlane: "F-86 SABRE / F-86D SABRE DOG",
        eastPlane: "MiG-15 FAGOT / MiG-17 FRESCO",
        doctrine: "Visual dogfight, high turn radius, manual gyro gunsights, high aerodynamic drag at transonic speeds. Zero missiles.",
        speedMach: "0.92 Mach",
        turnRate: "14.0 deg/s",
        weapons: "WEST: 6x .50 Cal M3 Browning // EAST: 1x 37mm N-37 & 2x 23mm NR-23",
        rcs: "1.00 m²",
        oodaLatency: "24 frames (~400ms human cognitive lag)",
        boydNote: "Col. John Boyd flew F-86s in Korea, developing E-M Theory based on the Sabre's hydraulic controls which allowed pilots to transition faster between maneuvers (cycling OODA faster)."
      },
      2: {
        name: "MACH 2 & EARLY MISSILES",
        period: "1953–1965",
        westPlane: "F-100 SUPER SABRE / F-104 STARFIGHTER / F-105 THUNDERCHIEF",
        eastPlane: "MiG-19 FARMER / MiG-21 FISHBED / Su-7 FITTER",
        doctrine: "Extreme climb rates, high speed intercept, early semi-active radar & infrared missiles (AIM-9B, K-13 Atoll). High energy bleed in sustained turns.",
        speedMach: "2.10 Mach",
        turnRate: "15.5 deg/s",
        weapons: "WEST: AIM-9B Sidewinder / 20mm Vulcan // EAST: K-13 Atoll / 23mm GSh-23",
        rcs: "1.10 m²",
        oodaLatency: "18 frames",
        boydNote: "Boyd proved that high top speed was useless if the aircraft lost all its energy in the first turn. E-M quantified energy loss ($P_s$)."
      },
      3: {
        name: "BVR RADAR & VARIABLE GEOMETRY",
        period: "1965–1975",
        westPlane: "F-4 PHANTOM II / F-111 AARDVARK / F-8 CRUSADER",
        eastPlane: "MiG-21PF FISHBED-J / MiG-23 FLOGGER / MiG-25 FOXBAT",
        doctrine: "High-power pulse-Doppler radar, beyond-visual-range (BVR) multi-target engagement, variable sweep wings for optimal L/D across regimes.",
        speedMach: "2.35 Mach",
        turnRate: "17.0 deg/s",
        weapons: "WEST: AIM-7E Sparrow (SARH) / AIM-9J / 20mm M61A1 // EAST: R-23R Apex (SARH) / R-60 / R-40R Tolstoy",
        rcs: "1.50 m²",
        oodaLatency: "12 frames",
        boydNote: "Swing wings mechanically optimized aspect ratio to maximize specific excess power across subsonic and supersonic regimes."
      },
      4: {
        name: "FLY-BY-WIRE & ALL-ASPECT HOBS",
        period: "1975–2000",
        westPlane: "F-14 TOMCAT / F-15 EAGLE / F-16 VIPER / F/A-18 HORNET",
        eastPlane: "Su-27 FLANKER / MiG-29 FULCRUM / MiG-31 FOXHOUND",
        doctrine: "Relaxed static stability, 9G sustained rate fight, high-off-boresight heaters (AIM-9X, R-73), fire-and-forget AMRAAM active radar missiles.",
        speedMach: "2.05 Mach",
        turnRate: "18.5 deg/s (9G Sustained)",
        weapons: "WEST: AIM-120 AMRAAM / AIM-9X / 20mm M61A2 // EAST: R-77 Adder / R-73 Archer / R-33 AMRAAMSKI",
        rcs: "1.20 m²",
        oodaLatency: "6 frames",
        boydNote: "The Lightweight Fighter Program (F-16) was directly created by Boyd and the Fighter Mafia to embody pure E-M dominance."
      },
      5: {
        name: "VLO STEALTH & 3D TVC SUPERCRUISE",
        period: "2000–2020",
        westPlane: "F-22 RAPTOR / F-35 LIGHTNING II",
        eastPlane: "Su-57 FELON",
        doctrine: "Very Low Observable (VLO) shaping, internal weapon bays (fleeting RCS bloom upon release), Mach 1.6 supercruise without afterburner, 3D thrust vectoring post-stall flips.",
        speedMach: "2.25 Mach (Mach 1.6 Supercruise)",
        turnRate: "20.0 deg/s (Post-Stall TVC)",
        weapons: "WEST: Internal AIM-120D / AIM-9X // EAST: Internal R-77-1 Adder / R-74M Archer",
        rcs: "0.0001 m² (Marble-sized)",
        oodaLatency: "2 frames",
        boydNote: "Stealth denies the adversary's Observe phase, collapsing their OODA loop before they can Orient."
      },
      6: {
        name: "NGAD & LOYAL WINGMAN (CCA)",
        period: "2020–2035",
        westPlane: "NGAD 6TH-GEN + 2x CCA DRONES",
        eastPlane: "Su-57M FELON-M",
        doctrine: "Tailless broadband stealth, adaptive cycle engines, Collaborative Combat Aircraft (CCA) flying in forward sensor sweep formation. NGAD leads 2 autonomous wingman drones that extend radar reach and intercept incoming missiles with DEW.",
        speedMach: "2.5+ Mach",
        turnRate: "21.5 deg/s",
        weapons: "WEST: AIM-260 JATM (CCA-Linked) + 20mm DEW Laser CIWS // EAST: Internal R-77M Adder-M / R-74M2 / 30mm GSh-30-1",
        rcs: "0.00005 m²",
        oodaLatency: "1 frame",
        boydNote: "Distributed sensors compress decision latency to single-digit milliseconds through collaborative machine intelligence."
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
            orderFleetAceTouchAndGo("west");
          }
        } else if (e.key === "r" || e.key === "R") {
          if (typeof orderFleetAceTouchAndGo === "function") {
            orderFleetAceTouchAndGo("east");
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

    // Launch a 1v1 Asymmetric Matchup with independent West and East generations
    spawnAsymmetricDuel: function (westGen, eastGen) {
      westGen = parseInt(westGen, 10) || 4;
      eastGen = parseInt(eastGen, 10) || 4;
      if (westGen < 1) westGen = 1;
      if (westGen > 6) westGen = 6;
      if (eastGen < 1) eastGen = 1;
      if (eastGen > 6) eastGen = 6;

      // Reset all jets in pools
      for (var i = 0; i < DF.allJets.length; i++) {
        DF.allJets[i].active = false;
        DF.allJets[i].isDying = false;
      }

      // Activate Gen in respective team masks
      for (var g = 1; g <= 6; g++) {
        activeGensWest[g] = (g === westGen);
        activeGensEast[g] = (g === eastGen);
      }
      if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
      if (typeof saveActiveGens === "function") saveActiveGens();
      if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();

      var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
      var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

      // Synchronize fleet to active generations
      if (typeof syncFleetToActiveGenerations === "function") {
        syncFleetToActiveGenerations(activeGensWest, activeGensEast, worldW, worldH);
      }

      var wJet = (DF && (DF.westPool || DF.bluePool)) ? (DF.westPool || DF.bluePool)[0] : null;
      var eJet = (DF && (DF.eastPool || DF.redPool)) ? (DF.eastPool || DF.redPool)[0] : null;
      var wSpec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[westGen] && AIRCRAFT_SPECS[westGen].west && AIRCRAFT_SPECS[westGen].west[0]) ? AIRCRAFT_SPECS[westGen].west[0] : { name: ("GEN " + westGen) };
      var eSpec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[eastGen] && AIRCRAFT_SPECS[eastGen].east && AIRCRAFT_SPECS[eastGen].east[0]) ? AIRCRAFT_SPECS[eastGen].east[0] : { name: ("GEN " + eastGen) };

      if (wJet) this.selectJet(wJet);

      var wName = wSpec.name || ("GEN " + westGen);
      var eName = eSpec.name || ("GEN " + eastGen);

      if (typeof dfRadio === "function") {
        if (westGen === eastGen) {
          var eraInfo = this.ERA_DATA[westGen] || {};
          dfRadio("HISTORICAL DUEL ENGAGED: " + (eraInfo.westPlane || wName) + " vs " + (eraInfo.eastPlane || eName) + " [" + (eraInfo.name || ("GEN " + westGen)) + "]!");
        } else {
          dfRadio("⚡ ASYMMETRIC WARFARE ENGAGED: WEST " + wName + " (GEN " + westGen + ") vs EAST " + eName + " (GEN " + eastGen + ")!");
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
      var isWest = (j.team === "west");
      var color = isWest ? "#38bdf8" : "#ef4444";
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
        // Auto-select first active west jet if available
        var westPool = (DF && (DF.westPool || DF.bluePool)) ? (DF.westPool || DF.bluePool) : null;
        if (westPool) {
          for (var i = 0; i < westPool.length; i++) {
            if (westPool[i].active && !westPool[i].isDying) {
              this.trackedJet = westPool[i];
              break;
            }
          }
        }
        if (!this.trackedJet) return;
      }

      var j = this.trackedJet;
      var specEntry = AIRCRAFT_SPECS[j.gen] || AIRCRAFT_SPECS[4];
      var spec = (specEntry && specEntry.west && specEntry.west[0]) ? specEntry.west[0] : { name: "FIGHTER" };

      // Update Callsign & Team
      var csEl = document.getElementById("mfd-callsign");
      if (csEl) csEl.textContent = j.callsign || "AIRFRAME";

      var genEl = document.getElementById("mfd-gen");
      if (genEl) genEl.textContent = "GEN " + j.gen + " // " + (j.jetName || spec.name || "FIGHTER");

      var teamEl = document.getElementById("mfd-team");
      if (teamEl) {
        teamEl.textContent = (j.team === "west") ? "WEST FORCE [ALLIED]" : "EAST FORCE [HOSTILE]";
        teamEl.className = "mfd-badge " + (j.team === "west" ? "badge-west" : "badge-east");
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
          tgtEl.style.color = (j.targetJet.team === "west") ? "#38bdf8" : "#ef4444";
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
        else if (j.gen === 6) wpnEl.textContent = "CCA LINKED // AIM-260 JATM ARMED";
        else if (j.missileCooldown <= 0) wpnEl.textContent = "FOX-3 ARMED // IN NO-ESCAPE ZONE";
        else wpnEl.textContent = "RADAR TRACKING // RELOADING";
      }
    }
  };

})(typeof window !== "undefined" ? window : this);
