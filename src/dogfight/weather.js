// # Weather System — West vs East, 6 generations
//
// Logline: Cyclical weather states (clear → partly → overcast → rain → storm → fog → back)
//          driving visibility, gun accuracy, and visual overlays. 12 sim-minute full cycle.
//
(function (global) {
  "use strict";

  var WEATHER_STATES = ["clear", "partly", "overcast", "rain", "storm", "fog"];
  var WEATHER_LABELS = {
    clear:    "CLEAR",
    partly:   "PARTLY CLOUDY",
    overcast: "OVERCAST",
    rain:     "RAIN",
    storm:    "THUNDERSTORM",
    fog:      "FOG"
  };
  var WEATHER_GLYPHS = {
    clear:    "☀",
    partly:   "⛅",
    overcast: "☁",
    rain:     "☂",
    storm:    "⚡",
    fog:      "≋"
  };
  // Per-state intensity envelope (0..1). Multiplied by sim effects.
  var WEATHER_INTENSITY = {
    clear: 0.0,
    partly: 0.2,
    overcast: 0.4,
    rain: 0.6,
    storm: 0.85,
    fog: 0.75
  };

  // Cycle period (in frames at 60 fps ≈ 1 sim minute = 3600 frames; 12 minutes = 43200 frames).
  // We use a 12-minute full cycle as the plan default.
  var CYCLE_PERIOD_FRAMES = 43200;
  // Per-state dwell (12 min / 6 states = 2 min each).
  var DWELL_FRAMES = 7200;

  // Init
  function initWeather() {
    DF.weather = {
      state: "clear",
      intensity: 0.0,
      index: 0,
      frame: 0,
      cyclePeriod: CYCLE_PERIOD_FRAMES,
      dwell: DWELL_FRAMES,
      manualOverride: false,
      rainDrops: [],
      lightning: 0,
      stormDamagePulse: 0,
      // Effect multipliers (consumed by other modules)
      visibility: 1.0,         // multiplies radarBaseline + sensorReach
      gunAccuracy: 1.0,        // multiplies gun accuracy / spread
      irEffectiveness: 1.0,    // IR missile effectiveness (1.0 = nominal)
      visualMissileAcc: 1.0    // SARH / visual missile accuracy
    };
    // Pre-spawn rain drops
    for (var i = 0; i < 220; i++) {
      DF.weather.rainDrops.push({
        x: Math.random() * 3600,
        y: Math.random() * 1200,
        vy: 8 + Math.random() * 8,
        vx: -2 - Math.random() * 4
      });
    }
    setupWeatherButton();
  }

  function tickWeather() {
    if (!DF.weather) initWeather();
    var w = DF.weather;
    w.frame++;

    // Advance state every DWELL_FRAMES frames (auto-cycle)
    if (w.frame >= w.dwell) {
      w.frame = 0;
      if (!w.manualOverride) {
        w.index = (w.index + 1) % WEATHER_STATES.length;
        w.state = WEATHER_STATES[w.index];
        if (typeof dfRadio === "function") {
          dfRadio("WEATHER ALERT: " + WEATHER_LABELS[w.state].toUpperCase() + " conditions // visibility " + Math.round(100 - w.intensity * 70) + "%");
        }
      }
    }

    // Set per-state intensity envelope (smooth ramp in/out: first/last 600 frames interpolate)
    var targetIntensity = WEATHER_INTENSITY[w.state] || 0.0;
    var ramp = 600;
    if (w.frame < ramp) {
      var prevIdx = (w.index - 1 + WEATHER_STATES.length) % WEATHER_STATES.length;
      w.intensity = (WEATHER_INTENSITY[WEATHER_STATES[prevIdx]] || 0) + (targetIntensity - (WEATHER_INTENSITY[WEATHER_STATES[prevIdx]] || 0)) * (w.frame / ramp);
    } else if (w.frame > w.dwell - ramp) {
      var nextIdx = (w.index + 1) % WEATHER_STATES.length;
      var nextTarget = WEATHER_INTENSITY[WEATHER_STATES[nextIdx]] || 0;
      w.intensity = targetIntensity + (nextTarget - targetIntensity) * ((w.frame - (w.dwell - ramp)) / ramp);
    } else {
      w.intensity = targetIntensity;
    }

    // Compute effect multipliers
    w.visibility = 1.0 - 0.7 * w.intensity;
    w.gunAccuracy = 1.0 - 0.5 * w.intensity;
    // IR missiles slightly better in clear, much better in fog/rain (clouds scatter IR less)
    w.irEffectiveness = 1.0 + 0.4 * w.intensity;
    // Visual/SARH missiles worse in fog/rain
    w.visualMissileAcc = 1.0 - 0.5 * w.intensity;

    // Lightning pulse in storm
    if (w.state === "storm" && Math.random() < 0.005) {
      w.lightning = 1.0;
    } else {
      w.lightning = Math.max(0, w.lightning - 0.1);
    }

    // Rain drops move
    if (w.state === "rain" || w.state === "storm") {
      for (var di = 0; di < w.rainDrops.length; di++) {
        var d = w.rainDrops[di];
        d.x += d.vx;
        d.y += d.vy;
        if (d.y > 1200) { d.y = -10; d.x = Math.random() * 3600; }
        if (d.x < -10) { d.x = 3600; d.y = Math.random() * 1200; }
      }
    }
  }

  function advanceWeatherManual() {
    if (!DF.weather) initWeather();
    var w = DF.weather;
    w.manualOverride = true;
    w.index = (w.index + 1) % WEATHER_STATES.length;
    w.state = WEATHER_STATES[w.index];
    w.frame = 0;
    w.intensity = WEATHER_INTENSITY[w.state] || 0.0;
    if (typeof dfRadio === "function") {
      dfRadio("WX-OPS: MANUAL OVERRIDE -> " + WEATHER_LABELS[w.state].toUpperCase());
    }
    updateWeatherButton();
  }

  function setupWeatherButton() {
    if (typeof document === "undefined") return;
    var existing = document.getElementById("weather-btn");
    if (existing) existing.addEventListener("click", function () { advanceWeatherManual(); });
    updateWeatherButton();
  }

  function updateWeatherButton() {
    if (typeof document === "undefined") return;
    var btn = document.getElementById("weather-btn");
    if (!btn) return;
    var w = DF.weather;
    var label = (WEATHER_GLYPHS[w.state] || "") + " " + (WEATHER_LABELS[w.state] || "WX");
    btn.textContent = label;
    var readout = document.getElementById("weather-readout");
    if (readout) {
      var remain = Math.max(0, Math.ceil((w.dwell - w.frame) / 60));
      readout.textContent = label + " // NEXT: " + remain + "s";
    }
  }

  // Draw weather overlay (call from loop-draw after landscape, before jets)
  function drawWeatherOverlay(ctx, screenW, screenH, worldW, worldH, now) {
    if (!DF.weather) return;
    var w = DF.weather;
    if (w.intensity <= 0.01 && w.state !== "fog") return;

    // Cloud bands (across the top half of the world, screen-space)
    if (w.state === "partly" || w.state === "overcast" || w.state === "rain" || w.state === "storm") {
      var cloudCount = (w.state === "overcast" || w.state === "rain" || w.state === "storm") ? 18 : 8;
      var cloudAlpha = 0.18 + 0.42 * w.intensity;
      for (var ci = 0; ci < cloudCount; ci++) {
        var cx = ((ci * 200) + (now * 0.005 * (ci + 1))) % worldW;
        var cy = 60 + (ci % 6) * 50 + (ci % 3) * 25;
        var cw = 180 + (ci % 4) * 80;
        var ch = 40 + (ci % 5) * 14;
        ctx.save();
        ctx.fillStyle = "rgba(200,210,220," + cloudAlpha.toFixed(3) + ")";
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Rain
    if (w.state === "rain" || w.state === "storm") {
      var cam = (DF && DF.camera) ? DF.camera : null;
      var camX = (cam && cam.x) ? cam.x : 0;
      var camY = (cam && cam.y) ? cam.y : 0;
      var camScale = (cam && cam.scale) ? cam.scale : 1.0;
      ctx.save();
      ctx.strokeStyle = (w.state === "storm")
        ? "rgba(180,200,255," + (0.5 * w.intensity).toFixed(3) + ")"
        : "rgba(170,200,220," + (0.6 * w.intensity).toFixed(3) + ")";
      ctx.lineWidth = (w.state === "storm") ? 1.2 : 0.8;
      for (var ri = 0; ri < w.rainDrops.length; ri++) {
        var drop = w.rainDrops[ri];
        var sx = (drop.x - camX) * camScale + screenW * 0.5;
        var sy = (drop.y - camY) * camScale + screenH * 0.5;
        if (sx < -20 || sx > screenW + 20 || sy < -20 || sy > screenH + 20) continue;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 6, sy + 12);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Lightning flash (storm)
    if (w.lightning > 0) {
      ctx.save();
      ctx.fillStyle = "rgba(220,230,255," + (w.lightning * 0.35).toFixed(3) + ")";
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }

    // Fog overlay (full-screen gradient, screen-space)
    if (w.state === "fog" || w.intensity > 0.3) {
      var fogAlpha = 0.18 + 0.55 * w.intensity;
      ctx.save();
      var grd = ctx.createLinearGradient(0, 0, 0, screenH);
      grd.addColorStop(0.0, "rgba(200,210,220,0)");
      grd.addColorStop(0.4, "rgba(200,210,220," + (fogAlpha * 0.5).toFixed(3) + ")");
      grd.addColorStop(1.0, "rgba(200,210,220," + fogAlpha.toFixed(3) + ")");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, screenW, screenH);
      ctx.restore();
    }
  }

  global.initWeather = initWeather;
  global.tickWeather = tickWeather;
  global.drawWeatherOverlay = drawWeatherOverlay;
  global.advanceWeatherManual = advanceWeatherManual;
  global.updateWeatherButton = updateWeatherButton;
  global.WEATHER_STATES = WEATHER_STATES;
  global.WEATHER_LABELS = WEATHER_LABELS;
  global.WEATHER_GLYPHS = WEATHER_GLYPHS;
  global.WEATHER_INTENSITY = WEATHER_INTENSITY;
})(typeof window !== "undefined" ? window : this);
