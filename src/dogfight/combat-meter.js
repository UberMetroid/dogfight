// # Combat Momentum Meter & Air Superiority Line Chart
//
// Logline: Real-time air combat advantage calculation, balance-of-power scale bar,
//          rolling momentum line chart, and Left (Blue) / Right (Red) telemetry aggregation.
//
(function (global) {
  "use strict";

  var DF = global.DF || (global.DF = {});

  var GEN_NAMES = {
    1: "F-86 SABRE",
    2: "F-4 PHANTOM",
    3: "F-14 TOMCAT",
    4: "F-16 VIPER",
    5: "F-22 RAPTOR",
    6: "NGAD + CCA",
    7: "QUANTUM SWARM"
  };

  var RED_GEN_NAMES = {
    1: "MiG-15 FAGOT",
    2: "MiG-21 FISHBED",
    3: "MiG-23 FLOGGER",
    4: "Su-27 FLANKER",
    5: "Su-57 FELON",
    6: "HOSTILE CCA",
    7: "HOSTILE SWARM"
  };

  var CombatMeter = {
    historyLength: 48,
    history: [],
    sampleTimer: 0,
    domUpdateCounter: 0,

    bluePct: 50.0,
    redPct: 50.0,
    targetBluePct: 50.0,
    momentumIndex: 0.0, // -100 (All Red) to +100 (All Blue)

    // Telemetry caches
    blueAirframes: 0,
    redAirframes: 0,
    blueMissiles: 0,
    redMissiles: 0,
    blueAvgPs: 140,
    redAvgPs: 130,
    blueLead: "F-16 VIPER",
    redLead: "Su-27 FLANKER",
    blueStance: "OFFENSIVE CAP",
    redStance: "HIGH THREAT",

    init: function () {
      this.history = [];
      for (var i = 0; i < this.historyLength; i++) {
        this.history.push(0.0);
      }
    },

    update: function (now) {
      if (!this.history || this.history.length === 0) {
        this.init();
      }

      // 1. Gather live telemetry
      var blueJets = [];
      var redJets = [];
      var blueTotalGenWeight = 0;
      var redTotalGenWeight = 0;
      var blueTotalPs = 0;
      var redTotalPs = 0;

      if (DF.allJets) {
        for (var i = 0; i < DF.allJets.length; i++) {
          var j = DF.allJets[i];
          if (!j.active || j.isDying) continue;
          var hpRatio = Math.max(0.1, (j.hp || 100) / 100.0);
          var genWeight = (1.0 + (j.gen || 4) * 0.75) * hpRatio;
          var psVal = (typeof j.ps === "number") ? j.ps : 120.0;

          if (j.team === "blue") {
            blueJets.push(j);
            blueTotalGenWeight += genWeight;
            blueTotalPs += psVal;
          } else {
            redJets.push(j);
            redTotalGenWeight += genWeight;
            redTotalPs += psVal;
          }
        }
      }

      this.blueAirframes = blueJets.length;
      this.redAirframes = redJets.length;
      this.blueAvgPs = blueJets.length > 0 ? (blueTotalPs / blueJets.length) : 0;
      this.redAvgPs = redJets.length > 0 ? (redTotalPs / redJets.length) : 0;

      // Lead airframe
      if (blueJets.length > 0) {
        var topBlue = blueJets[0];
        this.blueLead = topBlue.callsign || GEN_NAMES[topBlue.gen] || "BLUE JET";
      } else {
        this.blueLead = "NO SORTIES";
      }

      if (redJets.length > 0) {
        var topRed = redJets[0];
        this.redLead = topRed.callsign || RED_GEN_NAMES[topRed.gen] || "RED JET";
      } else {
        this.redLead = "NO BANDITS";
      }

      // 2. Count active missiles in flight
      var bMissiles = 0;
      var rMissiles = 0;
      if (DF.missilesPool && DF.missilesPool.activeCount > 0) {
        for (var m = 0; m < DF.missilesPool.activeCount; m++) {
          var mo = m * 8;
          var mLife = DF.missilesPool.buffer[mo + 6];
          if (mLife > 0) {
            var mTeam = DF.missilesPool.buffer[mo + 4];
            if (mTeam === 0) bMissiles++;
            else rMissiles++;
          }
        }
      }
      this.blueMissiles = bMissiles;
      this.redMissiles = rMissiles;

      // 3. Stance heuristics
      if (this.blueAirframes === 0) {
        this.blueStance = "AIRSPACE DEPLETED";
      } else if (bMissiles > 0) {
        this.blueStance = "FOX-3 ENGAGEMENT";
      } else if (this.blueAirframes > this.redAirframes) {
        this.blueStance = "AIR SUPERIORITY";
      } else if (this.blueAirframes < this.redAirframes) {
        this.blueStance = "DEFENSIVE ESCAPE";
      } else {
        this.blueStance = "OFFENSIVE SWEEP";
      }

      if (this.redAirframes === 0) {
        this.redStance = "NO BANDITS DETECTED";
      } else if (rMissiles > 0) {
        this.redStance = "INBOUND MISSILE LOCK";
      } else if (this.redAirframes > this.blueAirframes) {
        this.redStance = "BANDIT SATURATION";
      } else {
        this.redStance = "CONTESTED THREAT";
      }

      // 4. Calculate Combat Advantage Power
      var blueKills = DF.blueKills || 0;
      var redKills = DF.redKills || 0;

      var blueCombatPower = (blueTotalGenWeight * 3.5) + (blueKills * 12.0) + (bMissiles * 4.0) + Math.max(0, this.blueAvgPs * 0.02);
      var redCombatPower = (redTotalGenWeight * 3.5) + (redKills * 12.0) + (rMissiles * 4.0) + Math.max(0, this.redAvgPs * 0.02);

      var totalPower = blueCombatPower + redCombatPower;
      if (totalPower < 0.001) {
        this.targetBluePct = 50.0;
      } else {
        var rawPct = (blueCombatPower / totalPower) * 100.0;
        this.targetBluePct = Math.max(8.0, Math.min(92.0, rawPct));
      }

      // Smooth interpolation
      this.bluePct += (this.targetBluePct - this.bluePct) * 0.06;
      this.redPct = 100.0 - this.bluePct;

      var currentMomentum = (this.bluePct - 50.0) * 2.0; // -100 to +100
      this.momentumIndex += (currentMomentum - this.momentumIndex) * 0.06;

      // 5. Sample into rolling history buffer (~every 20 frames / 350ms)
      this.sampleTimer++;
      if (this.sampleTimer >= 18) {
        this.sampleTimer = 0;
        this.history.shift();
        this.history.push(this.momentumIndex);
      }

      // 6. Draw Rad Line Chart
      this.drawChart(now);

      // 7. Update DOM elements (throttled every 3 frames for 60fps smoothness)
      this.domUpdateCounter++;
      if (this.domUpdateCounter % 3 === 0) {
        this.updateDom();
      }
    },

    // Draw the Rad Neon Combat Momentum Chart on Canvas
    drawChart: function (now) {
      var canvas = document.getElementById("momentum-chart-canvas");
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      if (!ctx) return;

      var w = canvas.width;
      var h = canvas.height;
      var midY = h * 0.5;

      ctx.clearRect(0, 0, w, h);

      // Subtle background grid
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
      ctx.lineWidth = 1;

      // Top guide line (+50)
      ctx.beginPath();
      ctx.setLineDash([2, 4]);
      ctx.moveTo(0, h * 0.20); ctx.lineTo(w, h * 0.20);
      // Bottom guide line (-50)
      ctx.moveTo(0, h * 0.80); ctx.lineTo(w, h * 0.80);
      ctx.stroke();

      // Parity Center Baseline (0)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY); ctx.lineTo(w, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      var ptsCount = this.history.length;
      if (ptsCount < 2) {
        ctx.restore();
        return;
      }

      var stepX = w / (ptsCount - 1);
      var coords = [];
      for (var i = 0; i < ptsCount; i++) {
        var val = this.history[i]; // -100 to +100
        // Map +100 to y=2, -100 to y=h-2
        var py = midY - (val / 100.0) * (midY - 4);
        coords.push({ x: i * stepX, y: py, val: val });
      }

      // Fill Area (Cyan above baseline for Blue advantage, Red below baseline for Red advantage)
      // 1. Blue fill above midY
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w, midY);
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(coords[0].x, midY);
      for (var b = 0; b < coords.length; b++) {
        ctx.lineTo(coords[b].x, coords[b].y);
      }
      ctx.lineTo(coords[coords.length - 1].x, midY);
      ctx.closePath();

      var gradBlue = ctx.createLinearGradient(0, 0, 0, midY);
      gradBlue.addColorStop(0, "rgba(56, 189, 248, 0.45)");
      gradBlue.addColorStop(1, "rgba(56, 189, 248, 0.03)");
      ctx.fillStyle = gradBlue;
      ctx.fill();
      ctx.restore();

      // 2. Red fill below midY
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, midY, w, h - midY);
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(coords[0].x, midY);
      for (var r = 0; r < coords.length; r++) {
        ctx.lineTo(coords[r].x, coords[r].y);
      }
      ctx.lineTo(coords[coords.length - 1].x, midY);
      ctx.closePath();

      var gradRed = ctx.createLinearGradient(0, midY, 0, h);
      gradRed.addColorStop(0, "rgba(239, 68, 68, 0.03)");
      gradRed.addColorStop(1, "rgba(239, 68, 68, 0.45)");
      ctx.fillStyle = gradRed;
      ctx.fill();
      ctx.restore();

      // Draw Glowing Curve Line
      ctx.save();
      ctx.lineWidth = 2.0;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // Draw segment by segment with appropriate neon tint
      for (var s = 0; s < coords.length - 1; s++) {
        var p1 = coords[s];
        var p2 = coords[s + 1];
        var avgVal = (p1.val + p2.val) * 0.5;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (avgVal >= 5.0) {
          ctx.strokeStyle = "#38bdf8";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 6;
        } else if (avgVal <= -5.0) {
          ctx.strokeStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = "#fbbf24"; // Amber transition at parity
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 4;
        }
        ctx.stroke();
      }
      ctx.restore();

      // Pulsing head reticle at current position
      var head = coords[coords.length - 1];
      var timeVal = (typeof now === "number" && now > 0) ? now : Date.now();
      var pulseSize = 3.5 + Math.sin(timeVal * 0.008) * 1.5;
      var headColor = (head.val >= 0) ? "#38bdf8" : "#ef4444";

      ctx.save();
      ctx.fillStyle = headColor;
      ctx.shadowColor = headColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(head.x, head.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(head.x, head.y, pulseSize + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
    },

    // Update DOM text, scale bars, and left/right flank telemetry readouts
    updateDom: function () {
      var bPct = Math.round(this.bluePct);
      var rPct = 100 - bPct;

      // 1. Top Center Scale & Badge
      var elBluePct = document.getElementById("dom-blue-pct");
      if (elBluePct) elBluePct.textContent = "BLUE " + bPct + "%";

      var elRedPct = document.getElementById("dom-red-pct");
      if (elRedPct) elRedPct.textContent = rPct + "% RED";

      var elScaleBlue = document.getElementById("dom-scale-blue");
      if (elScaleBlue) elScaleBlue.style.width = this.bluePct.toFixed(1) + "%";

      var elScaleRed = document.getElementById("dom-scale-red");
      if (elScaleRed) elScaleRed.style.width = this.redPct.toFixed(1) + "%";

      var elScaleNeedle = document.getElementById("dom-scale-needle");
      if (elScaleNeedle) elScaleNeedle.style.left = this.bluePct.toFixed(1) + "%";

      var elStatusBadge = document.getElementById("dom-status-badge");
      if (elStatusBadge) {
        var diff = bPct - 50;
        elStatusBadge.className = "dom-status-badge";
        if (diff >= 25) {
          elStatusBadge.textContent = "⚡ BLUE AIR DOMINANCE (+" + diff + "%)";
          elStatusBadge.classList.add("badge-dom-blue-high");
        } else if (diff >= 7) {
          elStatusBadge.textContent = "⚡ BLUE AIR SUPERIORITY (+" + diff + "%)";
          elStatusBadge.classList.add("badge-dom-blue");
        } else if (diff <= -25) {
          elStatusBadge.textContent = "⚠ RED AIR DOMINANCE (+" + Math.abs(diff) + "%)";
          elStatusBadge.classList.add("badge-dom-red-high");
        } else if (diff <= -7) {
          elStatusBadge.textContent = "⚠ RED AIR ADVANTAGE (+" + Math.abs(diff) + "%)";
          elStatusBadge.classList.add("badge-dom-red");
        } else {
          elStatusBadge.textContent = "⚔ CONTESTED AIRSPACE // PARITY";
          elStatusBadge.classList.add("badge-dom-parity");
        }
      }

      var elMomVal = document.getElementById("dom-momentum-val");
      if (elMomVal) {
        var mStr = (this.momentumIndex >= 0 ? "+" : "") + this.momentumIndex.toFixed(1) + " INDEX";
        elMomVal.textContent = mStr;
      }

      // 2. Left Flank (Blue Options & Stats)
      var sBlueSorties = document.getElementById("stat-blue-sorties");
      if (sBlueSorties) sBlueSorties.textContent = this.blueAirframes + (this.blueAirframes === 1 ? " SORTIE" : " SORTIES");

      var sBlueKills = document.getElementById("stat-blue-kills");
      if (sBlueKills) sBlueKills.textContent = (DF.blueKills || 0) + ((DF.blueKills === 1) ? " SPLASH" : " SPLASHES");

      var sBlueMissiles = document.getElementById("stat-blue-missiles");
      if (sBlueMissiles) sBlueMissiles.textContent = this.blueMissiles + (this.blueMissiles === 1 ? " IN FLIGHT" : " IN FLIGHT");

      var sBluePs = document.getElementById("stat-blue-ps");
      if (sBluePs) sBluePs.textContent = (this.blueAvgPs >= 0 ? "+" : "") + Math.round(this.blueAvgPs) + " FT/S";

      var sBlueLead = document.getElementById("stat-blue-lead");
      if (sBlueLead) sBlueLead.textContent = this.blueLead;

      var sBlueStance = document.getElementById("stat-blue-stance");
      if (sBlueStance) sBlueStance.textContent = this.blueStance;

      // 3. Right Flank (Red Options & Stats)
      var sRedSorties = document.getElementById("stat-red-sorties");
      if (sRedSorties) sRedSorties.textContent = this.redAirframes + (this.redAirframes === 1 ? " BANDIT" : " BANDITS");

      var sRedKills = document.getElementById("stat-red-kills");
      if (sRedKills) sRedKills.textContent = (DF.redKills || 0) + ((DF.redKills === 1) ? " SPLASH" : " SPLASHES");

      var sRedMissiles = document.getElementById("stat-red-missiles");
      if (sRedMissiles) sRedMissiles.textContent = this.redMissiles + (this.redMissiles === 1 ? " IN FLIGHT" : " IN FLIGHT");

      var sRedPs = document.getElementById("stat-red-ps");
      if (sRedPs) sRedPs.textContent = (this.redAvgPs >= 0 ? "+" : "") + Math.round(this.redAvgPs) + " FT/S";

      var sRedLead = document.getElementById("stat-red-lead");
      if (sRedLead) sRedLead.textContent = this.redLead;

      var sRedStance = document.getElementById("stat-red-stance");
      if (sRedStance) sRedStance.textContent = this.redStance;
    }
  };

  global.CombatMeter = CombatMeter;

})(typeof window !== "undefined" ? window : this);
