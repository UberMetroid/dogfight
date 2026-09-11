// # Frame loop
//
// Logline: Clear, grid, sim, draw, VFX.
//
function dfDrawGrid(colors) {
  var w = DF.worldWidth || DF.width;
  var h = DF.worldHeight || DF.height;
  DF.ctx.save();
  DF.ctx.strokeStyle = getAlphaColor("border", 0.18);
  DF.ctx.lineWidth = 1;
  DF.ctx.beginPath();
  for (var gx = 0; gx < w; gx += 160) {
    DF.ctx.moveTo(gx, 0); DF.ctx.lineTo(gx, h);
  }
  DF.ctx.stroke();

  // Minimalist Tactical Altitude Layers & Markers (0k - 100k ft)
  DF.ctx.strokeStyle = getAlphaColor("fg", 0.22);
  DF.ctx.fillStyle = getAlphaColor("fg", 0.45);
  DF.ctx.font = "9px monospace";
  var altGridLines = [0, 20000, 40000, 60000, 80000, 100000];
  for (var agi = 0; agi < altGridLines.length; agi++) {
    var altVal = altGridLines[agi];
    var gridY = getYFromAltitude(altVal, h);
    DF.ctx.setLineDash(DASH_4_4);
    DF.ctx.beginPath();
    DF.ctx.moveTo(0, gridY); DF.ctx.lineTo(w, gridY);
    DF.ctx.stroke();

    var altLabel = (altVal === 100000) ? "100k FT (NEAR-SPACE)" : (altVal === 0 ? "0 FT (TERRAIN)" : (altVal / 1000) + "k FT");
    DF.ctx.fillText(altLabel, 10, gridY > 12 ? gridY - 4 : 12);
  }
  DF.ctx.setLineDash([]);
  DF.ctx.restore();
}

function updateDogfight(now) {
  if (!dogfightAnimId) return;
  dogfightAnimId = requestAnimationFrame(updateDogfight);
  if (!DF.ctx) return;
  if (now && DF.lastTime && (now - DF.lastTime < 33)) return;
  DF.lastTime = now;
  try {
    DF.ctx.clearRect(0, 0, DF.width, DF.height);
    if (!hasAnyActiveGen()) return;
    var colors = getThemeColors();

    var worldW = DF.worldWidth || 3600;
    var worldH = DF.worldHeight || 1200;

    // 1. Update Dynamic Tactical Camera (auto-zooms and frames weapon systems in flight)
    if (DF.camera && typeof DF.camera.update === "function") {
      DF.camera.update(DF.width, DF.height);
    }

    // 2. Step Simulation with Time Warp / Pause (runs in world coordinates)
    var isPaused = (typeof InteractiveController !== "undefined" && InteractiveController.isPaused);
    var speedMult = (typeof InteractiveController !== "undefined" && InteractiveController.simSpeed) ? InteractiveController.simSpeed : 1.0;

    if (!isPaused) {
      if (speedMult >= 2.0) {
        dfStepSim();
        dfStepSim();
      } else {
        dfStepSim();
      }
    }

    // 3. Begin World Space Transform (Camera pan & zoom)
    DF.ctx.save();
    if (DF.camera) {
      DF.ctx.translate(DF.width * 0.5, DF.height * 0.5);
      DF.ctx.scale(DF.camera.scale, DF.camera.scale);
      DF.ctx.translate(-DF.camera.x, -DF.camera.y);
    }

    // 4. Draw Multi-Domain Landscape (World space: 3600 x 1200)
    if (typeof dfDrawLandscape === "function") {
      dfDrawLandscape(DF.ctx, worldW, worldH, now, colors);
    } else {
      dfDrawGrid(colors);
    }

    // 5. Step & Draw Projectiles in World Space (Missiles, Tracers, Flares, Chaff, Explosions)
    if (!isPaused) {
      dfStepProjectiles(colors);
    }

    // 6. Draw Aircraft, Formations, Contrails (World space)
    dfDrawAircraft(now, colors);

    // 6B. Weather overlay (cloud bands, rain, fog)
    if (typeof drawWeatherOverlay === "function") {
      drawWeatherOverlay(DF.ctx, DF.width, DF.height, worldW, worldH, now);
    }

    // 7. Draw Interactive Reticle on Tracked Aircraft (World space)
    if (typeof InteractiveController !== "undefined" && InteractiveController.drawTrackedReticle) {
      InteractiveController.drawTrackedReticle(DF.ctx);
    }

    // 8. Update and Draw VFX & Wreckage (World space)
    updateAndDrawWreckage(DF.ctx, 1.0, worldH);
    updateAndDrawVfxParticles(DF.ctx, 1.0, worldH, colors);

    // End World Space Transform
    DF.ctx.restore();

    // 8B. Day/night dimming overlay (screen-space)
    if (typeof drawDayNightOverlay === "function") {
      drawDayNightOverlay(DF.ctx, DF.width, DF.height, now);
    }

    // 9. Draw Screen-Space Tactical Camera HUD (Scale Ruler in NM, Zoom Indicator)
    if (DF.camera && typeof DF.camera.drawTacticalHud === "function") {
      DF.camera.drawTacticalHud(DF.ctx, DF.width, DF.height);
    }

    // 10. Update MFD Telemetry Panel
    if (typeof InteractiveController !== "undefined" && InteractiveController.updateMfdDisplay) {
      InteractiveController.updateMfdDisplay();
    }

    // 11. Update Combat Momentum Meter & Line Chart
    if (typeof CombatMeter !== "undefined" && typeof CombatMeter.update === "function") {
      CombatMeter.update(now);
    }

    globalHudFrameCount = (globalHudFrameCount + 1) | 0;
  } catch (err) {
    if (typeof console !== "undefined" && console.error) {
      console.error("dogfight frame", err);
    }
  }
}
