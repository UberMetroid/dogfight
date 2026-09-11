// # Landscape Renderer (minimal: ocean + mountains, no defenses)
//
// Logline: Just enough terrain for the jets to fly in.
//  - Stratosphere & Troposphere Air Combat Arena (80k - 0 ft MSL)
//  - Land Domain: Coastal mountains only (West / Left)
//  - Ocean Domain: Dynamic wave swells (East / Right)
//
(function (global) {
  "use strict";

  // Multi-Domain Registry for future land, surface, and undersea weapons
  global.MultiDomainSystem = {
    seaLevelRatio: 0.84, // Mean Sea Level at 84% canvas height (leaves ~120-150px for ocean depths)
    coastRatio: 0.15,    // Coastline transition at 15% canvas width (vast central ocean)
    subSurfaceCorridorActive: true,
    sonarPulseRadius: 0,
    sonarPulseMax: 180,
    radarSweepAngle: 0,
    wavePhase: 0
  };

  // Helper: Get Mean Sea Level Y coordinate in canvas pixels
  global.getSeaLevelY = function (canvasH) {
    var h = (typeof canvasH === "number" && canvasH > 0) ? canvasH : 900;
    return Math.floor(h * global.MultiDomainSystem.seaLevelRatio);
  };

  // Main Draw Routine called each frame
  global.dfDrawLandscape = function (ctx, width, height, now, colors) {
    if (!ctx) return;

    var mslY = global.getSeaLevelY(height);
    var coastX = Math.floor(width * global.MultiDomainSystem.coastRatio);
    var sys = global.MultiDomainSystem;

    // Update dynamic animations
    sys.wavePhase += 0.035;
    sys.radarSweepAngle = (sys.radarSweepAngle + 0.04) % (Math.PI * 2);
    sys.sonarPulseRadius = (sys.sonarPulseRadius + 0.85);
    if (sys.sonarPulseRadius > sys.sonarPulseMax) sys.sonarPulseRadius = 0;

    // Calculate world space bounds visible through camera viewport
    var viewLeft = -2000;
    var viewRight = width + 2000;
    if (global.DF && global.DF.camera && typeof global.DF.camera.screenToWorld === "function") {
      var p0 = global.DF.camera.screenToWorld(0, 0);
      var p1 = global.DF.camera.screenToWorld(global.DF.width || 1440, 0);
      if (p0 && p1) {
        viewLeft = Math.min(p0.x, p1.x);
        viewRight = Math.max(p0.x, p1.x);
      }
    }

    // Dynamic horizontal theater bounds:
    // Mountains extend far to the West, and Ocean extends continuously far to the East
    var landStartX = Math.min(-12000, Math.floor(viewLeft - 3000));
    var oceanEndX = Math.max(width + 25000, Math.ceil(viewRight + 6000));

    // ------------------------------------------------------------------------
    // 1. SKY & STRATOSPHERE ALTITUDE LADDER (0 ft MSL to 100k ft)
    // ------------------------------------------------------------------------
    ctx.save();

    // Subtle atmospheric vertical grid lines across theater
    ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    var gridStart = Math.floor(landStartX / 160) * 160;
    for (var gx = gridStart; gx <= oceanEndX; gx += 160) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, mslY);
    }
    ctx.stroke();

    // Altitude Tier Dashed Lines & Monospace Annotations
    var altLayers = [
      { alt: 100000, label: "100k FT // EXOSPHERE (ORBITAL INSERTION / SATELLITES)" },
      { alt: 80000,  label: "80k FT // STRATOSPHERE (U-2 / SR-71 / HYPERSONIC GLIDE)" },
      { alt: 60000,  label: "60k FT // SUPERCRUISE FLIGHT CORRIDOR (GEN 5/6)" },
      { alt: 40000,  label: "40k FT // BVR MISSILE INTERCEPT ARENA" },
      { alt: 20000,  label: "20k FT // TROPOSPHERE (TACTICAL DOGFIGHT ARENA)" },
      { alt: 5000,   label: "5k FT // LOW-ALTITUDE GPWS TERRAIN WARNING LINE" }
    ];

    ctx.font = "9px ui-monospace, SFMono-Regular, monospace";
    for (var i = 0; i < altLayers.length; i++) {
      var item = altLayers[i];
      var ly = global.getYFromAltitude(item.alt, height);
      if (ly < mslY) {
        ctx.strokeStyle = (item.alt === 100000) ? "rgba(56, 189, 248, 0.25)" : "rgba(148, 163, 184, 0.15)";
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(landStartX, ly);
        ctx.lineTo(oceanEndX, ly);
        ctx.stroke();

        var labelX = Math.max(16, viewLeft + 24);
        ctx.fillStyle = (item.alt === 100000) ? "rgba(56, 189, 248, 0.55)" : "rgba(148, 163, 184, 0.40)";
        ctx.fillText(item.label, labelX, ly > 14 ? ly - 4 : 14);
      }
    }
    ctx.setLineDash([]);

    // ------------------------------------------------------------------------
    // 2. SUB-SURFACE DOMAIN (Y: mslY to height // Continuous Ocean Depths & Trench)
    // ------------------------------------------------------------------------
    // Deep ocean bathymetric background (extends continuously eastward)
    var oceanGrad = ctx.createLinearGradient(0, mslY, 0, height);
    oceanGrad.addColorStop(0, "rgba(7, 26, 44, 0.85)");     // Epipelagic surface blue
    oceanGrad.addColorStop(0.35, "rgba(4, 18, 32, 0.92)");  // Mesopelagic thermocline
    oceanGrad.addColorStop(1, "rgba(1, 8, 16, 0.98)");      // Bathypelagic trench
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(coastX, mslY, oceanEndX - coastX, height - mslY);

    // Bathymetric Depth Lines & Labels
    var depthLayers = [
      { ratio: 0.30, depth: "-200m", label: "CONTINENTAL SHELF & LITTORAL ACOUSTIC ZONE" },
      { ratio: 0.65, depth: "-600m", label: "THERMOCLINE BARRIER // SONAR SHADOW REFRACTION" },
      { ratio: 0.92, depth: "-1000m", label: "ABYSSAL SUB-SURFACE PATROL // TORPEDO & UUV CORRIDOR" }
    ];

    for (var d = 0; d < depthLayers.length; d++) {
      var dItem = depthLayers[d];
      var dy = mslY + (height - mslY) * dItem.ratio;
      ctx.strokeStyle = "rgba(14, 165, 233, 0.20)";
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(coastX, dy);
      ctx.lineTo(oceanEndX, dy);
      ctx.stroke();

      var depthLabelX = Math.max(coastX + 16, viewLeft + 24);
      ctx.fillStyle = "rgba(56, 189, 248, 0.50)";
      ctx.font = "8.5px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("DEPTH: " + dItem.depth + " // " + dItem.label, depthLabelX, dy - 4);
    }
    ctx.setLineDash([]);

    // Continental Slope & Undersea Seabed Polygon extending continuously eastward
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.strokeStyle = "rgba(30, 41, 59, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(coastX, mslY);
    // Shelf drops down from coast to seabed trench
    var shelfBreakX = coastX + Math.floor(width * 0.14);
    var shelfBreakY = mslY + Math.floor((height - mslY) * 0.40);
    ctx.lineTo(shelfBreakX, shelfBreakY);
    var trenchBottomX = coastX + Math.floor(width * 0.28);
    ctx.lineTo(trenchBottomX, height - 12);
    // Seabed ridges continue along bottom all the way to oceanEndX without stopping
    for (var bx = trenchBottomX; bx <= oceanEndX; bx += 40) {
      var ridgeY = height - 12 + Math.sin(bx * 0.05) * 4;
      ctx.lineTo(bx, ridgeY);
    }
    ctx.lineTo(oceanEndX, height);
    ctx.lineTo(coastX, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Active Acoustic Sonar Ping Rings in Sub-surface Corridor
    var sonarCenter = { x: trenchBottomX + 90, y: mslY + Math.floor((height - mslY) * 0.65) };
    var sonarAlpha = (1.0 - sys.sonarPulseRadius / sys.sonarPulseMax) * 0.6;
    ctx.strokeStyle = "rgba(52, 211, 153, " + sonarAlpha + ")";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(sonarCenter.x, sonarCenter.y, sys.sonarPulseRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sonarCenter.x, sonarCenter.y, Math.max(0, sys.sonarPulseRadius * 0.5), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(52, 211, 153, " + (sonarAlpha * 0.8) + ")";
    ctx.font = "8px ui-monospace, monospace";
    ctx.fillText("SONAR PING (3.5 kHz) [SUB-SURFACE ACTIVE]", sonarCenter.x + 14, sonarCenter.y - 6);

    // Architectural callout for continuous sub-surface domain
    var subLabelX = Math.max(coastX + 24, viewLeft + 30);
    ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    ctx.font = "8px ui-monospace, monospace";
    ctx.fillText(">> SUB-SURFACE DOMAIN // CONTINUOUS SEABED CORRIDOR // ANCHOR FOR SUBMARINES, TORPEDOES & UUVs", subLabelX, height - 8);

    // ------------------------------------------------------------------------
    // 3. OCEAN SURFACE (WAVES & CONTINUOUS NAVAL THEATER)
    // ------------------------------------------------------------------------
    // Animated wave surface line extending continuously eastward without stopping
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coastX, mslY);
    for (var wx = coastX; wx <= oceanEndX; wx += 10) {
      var wy = mslY + Math.sin(wx * 0.04 + sys.wavePhase) * 2.5 + Math.cos(wx * 0.08 - sys.wavePhase) * 1.5;
      ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    // Ocean Surface Label
    var oceanLabelX = Math.max(coastX + 16, viewLeft + 24);
    ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
    ctx.font = "8.5px ui-monospace, monospace";
    ctx.fillText("0 FT MSL // OCEAN DOMAIN", oceanLabelX, mslY - 8);

    // ------------------------------------------------------------------------
    // 4. LAND DOMAIN (WEST SECTION // MOUNTAINS ONLY)
    // ------------------------------------------------------------------------
    // Mountainous Terrain Polygon extending continuously westward
    ctx.fillStyle = "#090e17";
    ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(landStartX, height);
    ctx.lineTo(landStartX, mslY - 45);
    // Western mountain ridges from landStartX to 0
    for (var mx = landStartX + 160; mx < 0; mx += 160) {
      var mAlt = mslY - 45 - Math.sin(mx * 0.006) * 28 - Math.cos(mx * 0.012) * 12;
      ctx.lineTo(mx, mAlt);
    }
    ctx.lineTo(0, mslY - 45); // Western mountain peak (elevation ~5k ft)
    ctx.lineTo(width * 0.015, mslY - 50);
    ctx.lineTo(width * 0.025, mslY - 24);

    // Coast drops down to sea level at coastX = 0.15 * width
    ctx.lineTo(coastX, mslY);
    ctx.lineTo(coastX, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Coastline Surf Breakers
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(coastX - 4, mslY - 2);
    ctx.lineTo(coastX + 6, mslY + 2);
    ctx.stroke();

    ctx.restore();
  };

  // --------------------------------------------------------------------------
  // (defensive/naval drawers removed in the "just jets" cleanup)

})(typeof window !== "undefined" ? window : this);
