// # Day/Night Cycle — West vs East, 6 generations
//
// Logline: 8 sim-minute full 24h cycle. Drives sky color, lighting, sun/moon position,
//          and star alpha. Effects: IR missiles better at night, gun accuracy lower at night.
//
(function (global) {
  "use strict";

  // Phase boundaries on a 0..1 timeOfDay clock
  // night [0, 0.20), dawn [0.20, 0.30), day [0.30, 0.70), dusk [0.70, 0.80), night [0.80, 1.0]
  var CYCLE_PERIOD_FRAMES = 28800; // 8 sim-minutes (60fps * 60s * 8)
  var HOUR_24 = function (timeOfDay) {
    return Math.floor(timeOfDay * 24) % 24;
  };
  var MIN_24 = function (timeOfDay) {
    return Math.floor((timeOfDay * 24 * 60) % 60);
  };

  function initDayNight() {
    DF.daynight = {
      timeOfDay: 0.45, // start mid-morning so the sim begins in daylight
      cyclePeriod: CYCLE_PERIOD_FRAMES,
      phase: "day",
      lightLevel: 1.0,
      // Effect multipliers
      irEffectiveness: 0.85,    // 0.4..1.0 (better at night)
      visualMissileAcc: 0.85,   // 0.4..1.0 (better in day)
      gunAccuracy: 1.0,         // 0.5..1.0 (tracers hard to see at night)
      radarEffectiveness: 1.0,  // (radar is largely unaffected by sunlight)
      // Sun/moon screen position (interpolated each tick)
      sunX: 0, sunY: 0, sunAlpha: 0,
      moonX: 0, moonY: 0, moonAlpha: 0,
      starAlpha: 0
    };
    if (typeof document !== "undefined") setupDayNightUI();
  }

  function tickDayNight() {
    if (!DF.daynight) initDayNight();
    var d = DF.daynight;
    d.timeOfDay = (d.timeOfDay + 1.0 / d.cyclePeriod) % 1.0;
    if (d.timeOfDay < 0) d.timeOfDay += 1.0;

    // Phase detection
    if (d.timeOfDay < 0.20 || d.timeOfDay >= 0.80) d.phase = "night";
    else if (d.timeOfDay < 0.30) d.phase = "dawn";
    else if (d.timeOfDay < 0.70) d.phase = "day";
    else d.phase = "dusk";

    // Light level (0.15 at midnight, 1.0 at noon). sin(pi * x) goes 0→1→0.
    d.lightLevel = 0.15 + 0.85 * Math.sin(Math.PI * d.timeOfDay);

    // Effect multipliers
    d.irEffectiveness = 0.4 + 0.6 * (1.0 - d.lightLevel);          // 0.4 at noon, 1.0 at midnight
    d.visualMissileAcc = 0.4 + 0.6 * d.lightLevel;                  // 0.4 at midnight, 1.0 at noon
    d.gunAccuracy = 0.5 + 0.5 * d.lightLevel;                      // 0.5 at midnight, 1.0 at noon
    d.radarEffectiveness = 0.92 + 0.08 * d.lightLevel;             // nearly constant

    // Sun position (above horizon day; below at night)
    // Sun arc: rises at dawn (0.20), peaks at noon (0.50), sets at dusk (0.80)
    var sunArc = (d.timeOfDay - 0.20) / 0.6; // 0 at dawn, 1 at dusk
    d.sunAlpha = (sunArc > 0 && sunArc < 1) ? Math.sin(Math.PI * sunArc) : 0;
    d.sunX = -screenW() * 0.45 + (sunArc * screenW() * 1.9);
    d.sunY = -100 + Math.sin(Math.PI * sunArc) * 280;

    // Moon (opposite side, visible at night)
    var moonArc = (d.timeOfDay - 0.70) / 0.6; // 0 at dusk, 1 at dawn next cycle
    d.moonAlpha = (moonArc > 0 && moonArc < 1) ? Math.sin(Math.PI * moonArc) : 0;
    d.moonX = -screenW() * 0.45 + (moonArc * screenW() * 1.9);
    d.moonY = -100 + Math.sin(Math.PI * moonArc) * 280;

    // Star alpha = inverse of light level
    d.starAlpha = Math.max(0, Math.min(1, 1.0 - d.lightLevel));

    // Slow UI readout update (every 30 frames)
    if (typeof d._uiTick === "undefined") d._uiTick = 0;
    d._uiTick++;
    if (d._uiTick % 30 === 0) updateDayNightUI();
  }

  function screenW() { return (typeof DF !== "undefined" && DF.width) ? DF.width : 1440; }
  function screenH() { return (typeof DF !== "undefined" && DF.height) ? DF.height : 900; }

  function skyColor() {
    var d = DF.daynight;
    if (!d) return "#87ceeb";
    // Interpolate from night (deep blue) through dawn (orange) to day (sky blue) through dusk (orange) back to night
    var t = d.timeOfDay;
    var r, g, b;
    if (t < 0.20) {
      // night
      r = 8; g = 12; b = 32;
    } else if (t < 0.30) {
      // dawn
      var a = (t - 0.20) / 0.10;
      r = 8 + (240 - 8) * a;
      g = 12 + (160 - 12) * a;
      b = 32 + (100 - 32) * a;
    } else if (t < 0.70) {
      // day
      r = 80 + 30 * Math.sin(Math.PI * (t - 0.30) / 0.40);
      g = 150 + 50 * Math.sin(Math.PI * (t - 0.30) / 0.40);
      b = 200;
    } else if (t < 0.80) {
      // dusk
      var a2 = (t - 0.70) / 0.10;
      r = 110 + (240 - 110) * a2;
      g = 200 + (130 - 200) * a2;
      b = 200 + (60 - 200) * a2;
    } else {
      // back to night
      var a3 = (t - 0.80) / 0.20;
      r = 240 - (240 - 8) * a3;
      g = 130 - (130 - 12) * a3;
      b = 60 - (60 - 32) * a3;
    }
    return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
  }

  function drawDayNightOverlay(ctx, screenW2, screenH2, now) {
    if (!DF.daynight) return;
    var d = DF.daynight;
    if (!ctx) return;

    // Star alpha (overlay on the existing starfield if attached)
    if (typeof globalStarAlpha !== "undefined") globalStarAlpha = d.starAlpha;

    // Sun (bright disc)
    if (d.sunAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = d.sunAlpha * 0.95;
      ctx.fillStyle = "rgba(255, 240, 180, 1.0)";
      ctx.beginPath();
      ctx.arc(d.sunX, d.sunY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = d.sunAlpha * 0.35;
      ctx.fillStyle = "rgba(255, 230, 160, 1.0)";
      ctx.beginPath();
      ctx.arc(d.sunX, d.sunY, 64, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Moon
    if (d.moonAlpha > 0.05) {
      ctx.save();
      ctx.globalAlpha = d.moonAlpha * 0.9;
      ctx.fillStyle = "rgba(240, 240, 230, 1.0)";
      ctx.beginPath();
      ctx.arc(d.moonX, d.moonY, 22, 0, Math.PI * 2);
      ctx.fill();
      // crescent shadow
      ctx.globalAlpha = d.moonAlpha * 0.6;
      ctx.fillStyle = skyColor();
      ctx.beginPath();
      ctx.arc(d.moonX + 6, d.moonY - 4, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Night dimming overlay (multiplicative). At day: alpha 0; at night: alpha 0.45.
    if (d.lightLevel < 0.95) {
      var nightAlpha = (1.0 - d.lightLevel) * 0.50;
      ctx.save();
      ctx.fillStyle = "rgba(8, 12, 32," + nightAlpha.toFixed(3) + ")";
      ctx.fillRect(0, 0, screenW2, screenH2);
      ctx.restore();
    }
  }

  function setupDayNightUI() {
    var existing = document.getElementById("daynight-btn");
    if (existing) existing.addEventListener("click", function () { advanceDayNightManual(); });
    updateDayNightUI();
  }

  function advanceDayNightManual() {
    if (!DF.daynight) initDayNight();
    var d = DF.daynight;
    // Jump forward 1 sim hour (1/24 of the cycle)
    d.timeOfDay = (d.timeOfDay + 1.0 / 24.0) % 1.0;
    if (typeof dfRadio === "function") {
      var phase = d.phase.toUpperCase();
      dfRadio("WX-OPS: TIME JUMP -> " + phase + " // " + Math.floor(d.timeOfDay * 24) + ":00");
    }
  }

  function updateDayNightUI() {
    if (typeof document === "undefined") return;
    var btn = document.getElementById("daynight-btn");
    if (btn && DF.daynight) {
      var hr = Math.floor(DF.daynight.timeOfDay * 24);
      var mn = Math.floor((DF.daynight.timeOfDay * 24 * 60) % 60);
      var hrStr = (hr < 10 ? "0" + hr : "" + hr);
      var mnStr = (mn < 10 ? "0" + mn : "" + mn);
      btn.textContent = hrStr + ":" + mnStr + " " + (DF.daynight.phase || "DAY").toUpperCase();
    }
    var readout = document.getElementById("daynight-readout");
    if (readout && DF.daynight) {
      var remain = Math.max(0, Math.ceil((CYCLE_PERIOD_FRAMES - (DF.daynight.timeOfDay * CYCLE_PERIOD_FRAMES)) / 60));
      readout.textContent = "TIME " + btn.textContent + " // CYCLE: " + remain + "s REMAIN";
    }
  }

  global.initDayNight = initDayNight;
  global.tickDayNight = tickDayNight;
  global.drawDayNightOverlay = drawDayNightOverlay;
  global.advanceDayNightManual = advanceDayNightManual;
  global.updateDayNightUI = updateDayNightUI;
  global.skyColor = skyColor;
  global.globalStarAlpha = 0;
})(typeof window !== "undefined" ? window : this);
