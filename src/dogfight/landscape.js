// # Multi-Domain Landscape Renderer (Air, Space, Land, Sea, Sub-Surface)
//
// Logline: Multi-domain vertical stratification for modern warfighting.
// Domains:
//  - Orbit / Near-Space (100k - 80k ft)
//  - Stratosphere & Troposphere Air Combat Arena (80k - 0 ft MSL)
//  - Land Domain: Coastal mountains, Airbase runway, EW radar, SAM battery (West / Left)
//  - Coastline: Continental drop-off, surf line, beach
//  - Ocean Domain: Dynamic wave swells, Carrier Strike Group, Guided Missile Destroyer (East / Right)
//  - Sub-Surface Domain: Bathymetry (0m down to -1000m), Thermocline layer, Sonar ping corridor
//
(function (global) {
  "use strict";

  // Multi-Domain Registry for future land, surface, and undersea weapons
  global.MultiDomainSystem = {
    seaLevelRatio: 0.84, // Mean Sea Level at 84% canvas height (leaves ~120-150px for ocean depths)
    coastRatio: 0.38,    // Coastline transition at 38% canvas width
    subSurfaceCorridorActive: true,
    sonarPulseRadius: 0,
    sonarPulseMax: 180,
    radarSweepAngle: 0,
    wavePhase: 0,

    // Modular entity registries for user expansion
    landAssets: [
      { id: "airbase-1", name: "FORWARD AIR BASE ALPHA", type: "airfield", xRatio: 0.24, runwayLength: 160 },
      { id: "sam-battery-1", name: "PATRIOT/S-400 SAM SITE", type: "sam", xRatio: 0.35, rangeKm: 40 }
    ],
    surfaceCombatants: [
      { id: "cvn-78", name: "CVN-78 GERALD R. FORD", type: "carrier", xRatio: 0.70, airWingActive: true },
      { id: "ddg-51", name: "DDG-51 ARLEIGH BURKE", type: "destroyer", xRatio: 0.86, aegisRadar: true }
    ],
    subSurfaceCorridors: [
      { id: "sub-trench-1", name: "CONTINENTAL TRENCH PATROL", depthM: -450, type: "ssn_patrol_zone" }
    ],

    // API methods for future weapons injection
    registerLandAsset: function (asset) { this.landAssets.push(asset); },
    registerSurfaceShip: function (ship) { this.surfaceCombatants.push(ship); },
    registerSubSurfaceAsset: function (sub) { this.subSurfaceCorridors.push(sub); }
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

    // ------------------------------------------------------------------------
    // 1. SKY & STRATOSPHERE ALTITUDE LADDER (0 ft MSL to 100k ft)
    // ------------------------------------------------------------------------
    ctx.save();

    // Subtle atmospheric vertical grid lines
    ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var gx = 120; gx < width; gx += 160) {
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
        ctx.moveTo(0, ly);
        ctx.lineTo(width, ly);
        ctx.stroke();

        ctx.fillStyle = (item.alt === 100000) ? "rgba(56, 189, 248, 0.55)" : "rgba(148, 163, 184, 0.40)";
        ctx.fillText(item.label, 12, ly > 14 ? ly - 4 : 14);
      }
    }
    ctx.setLineDash([]);

    // ------------------------------------------------------------------------
    // 2. SUB-SURFACE DOMAIN (Y: mslY to height // Ocean Depths & Trench)
    // ------------------------------------------------------------------------
    // Deep ocean bathymetric background
    var oceanGrad = ctx.createLinearGradient(0, mslY, 0, height);
    oceanGrad.addColorStop(0, "rgba(7, 26, 44, 0.85)");     // Epipelagic surface blue
    oceanGrad.addColorStop(0.35, "rgba(4, 18, 32, 0.92)");  // Mesopelagic thermocline
    oceanGrad.addColorStop(1, "rgba(1, 8, 16, 0.98)");      // Bathypelagic trench
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(coastX, mslY, width - coastX, height - mslY);

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
      ctx.lineTo(width, dy);
      ctx.stroke();

      ctx.fillStyle = "rgba(56, 189, 248, 0.50)";
      ctx.font = "8.5px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("DEPTH: " + dItem.depth + " // " + dItem.label, coastX + 16, dy - 4);
    }
    ctx.setLineDash([]);

    // Continental Slope & Undersea Seabed Polygon
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
    // Seabed ridges along bottom
    for (var bx = trenchBottomX; bx <= width; bx += 40) {
      var ridgeY = height - 12 + Math.sin(bx * 0.05) * 4;
      ctx.lineTo(bx, ridgeY);
    }
    ctx.lineTo(width, height);
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

    // Architectural callout for user's future undersea weapons
    ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
    ctx.font = "8px ui-monospace, monospace";
    ctx.fillText(">> SUB-SURFACE DOMAIN // ANCHOR FOR SUBMARINES, TORPEDOES & UUVs", coastX + 24, height - 8);

    // ------------------------------------------------------------------------
    // 3. OCEAN SURFACE (WAVES & NAVAL CARRIER GROUP)
    // ------------------------------------------------------------------------
    // Animated wave surface line
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(coastX, mslY);
    for (var wx = coastX; wx <= width; wx += 8) {
      var wy = mslY + Math.sin(wx * 0.04 + sys.wavePhase) * 2.5 + Math.cos(wx * 0.08 - sys.wavePhase) * 1.5;
      ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    // Ocean Surface Label
    ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
    ctx.font = "8.5px ui-monospace, monospace";
    ctx.fillText("0 FT MSL // OCEAN DOMAIN (SURFACE OPERATIONS)", coastX + 16, mslY - 8);

    // Render Aircraft Carrier (CVN-78)
    var cvnX = Math.floor(width * 0.70);
    var cvnY = mslY;
    drawAircraftCarrier(ctx, cvnX, cvnY, sys.wavePhase);

    // Render Aegis Destroyer (DDG-51)
    var ddgX = Math.floor(width * 0.87);
    var ddgY = mslY;
    drawAegisDestroyer(ctx, ddgX, ddgY, sys.wavePhase);

    // ------------------------------------------------------------------------
    // 4. LAND DOMAIN (WEST SECTION // MOUNTAINS, RUNWAY, RADAR & SAM)
    // ------------------------------------------------------------------------
    // Mountainous Terrain Polygon
    ctx.fillStyle = "#090e17";
    ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, mslY - 45); // Western mountain peak (elevation ~5k ft)
    ctx.lineTo(width * 0.06, mslY - 55);
    ctx.lineTo(width * 0.12, mslY - 30);
    ctx.lineTo(width * 0.16, mslY - 14); // Valley slope

    // Airbase plateau (elevation ~14px / 1200 ft)
    var runwayStartX = width * 0.18;
    var runwayEndX = width * 0.32;
    ctx.lineTo(runwayStartX, mslY - 14);
    ctx.lineTo(runwayEndX, mslY - 14);

    // Coastal cliff peak
    var samRidgeX = width * 0.35;
    ctx.lineTo(samRidgeX, mslY - 26);
    // Coast drops down to sea level
    ctx.lineTo(coastX, mslY);
    ctx.lineTo(coastX, height);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle topographical contour ridges
    ctx.strokeStyle = "rgba(30, 41, 59, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mslY - 20);
    ctx.lineTo(width * 0.08, mslY - 25);
    ctx.lineTo(width * 0.15, mslY - 6);
    ctx.moveTo(samRidgeX - 15, mslY - 12);
    ctx.lineTo(coastX - 6, mslY - 2);
    ctx.stroke();

    // Render Military Air Base (Runway, Lights, Tower, EW Radar)
    drawAirBase(ctx, runwayStartX, runwayEndX, mslY - 14, now, sys.radarSweepAngle);

    // Render SAM Site (Launcher & Tracking Radar)
    drawSamSite(ctx, samRidgeX, mslY - 26);

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
  // SUB-DRAWERS FOR TACTICAL SURFACE & LAND ENTITIES
  // --------------------------------------------------------------------------

  function drawAirBase(ctx, startX, endX, groundY, now, radarAngle) {
    var len = endX - startX;

    // Runway Tarmac Surface
    ctx.fillStyle = "#0c1420";
    ctx.strokeStyle = "rgba(71, 85, 105, 0.8)";
    ctx.lineWidth = 1;
    ctx.fillRect(startX, groundY - 2, len, 4);
    ctx.strokeRect(startX, groundY - 2, len, 4);

    // Runway Centerline Dashes
    ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(startX + 12, groundY);
    ctx.lineTo(endX - 12, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Green Threshold Approach Lights
    ctx.fillStyle = "#10b981";
    ctx.fillRect(startX + 2, groundY - 3, 3, 2);
    ctx.fillRect(endX - 5, groundY - 3, 3, 2);

    // Control Tower Silhouette
    var towerX = startX + 28;
    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.fillRect(towerX - 2, groundY - 12, 4, 10);
    ctx.fillRect(towerX - 4, groundY - 15, 8, 4);
    // Flashing Red Beacon
    var beaconBlink = (Math.floor(now / 400) % 2 === 0);
    if (beaconBlink) {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(towerX - 1, groundY - 17, 2, 2);
    }

    // Rotating Early Warning Air Surveillance Radar (EW Radar)
    var radarX = endX - 24;
    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.fillRect(radarX - 1, groundY - 8, 2, 6);
    // Dish antenna
    ctx.save();
    ctx.translate(radarX, groundY - 9);
    ctx.rotate(radarAngle);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 4, -0.6, 0.6);
    ctx.stroke();
    ctx.restore();

    // Airbase Label
    ctx.fillStyle = "rgba(52, 211, 153, 0.7)";
    ctx.font = "7.5px ui-monospace, monospace";
    ctx.fillText("BASE ALPHA // RUNWAY 09L", startX + 16, groundY - 6);
  }

  function drawSamSite(ctx, ridgeX, groundY) {
    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.fillRect(ridgeX - 5, groundY - 3, 10, 3);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ridgeX - 2, groundY - 3);
    ctx.lineTo(ridgeX + 4, groundY - 9);
    ctx.stroke();

    ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(ridgeX, groundY - 5, 28, -Math.PI * 0.55, -Math.PI * 0.15);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(239, 68, 68, 0.65)";
    ctx.font = "7px ui-monospace, monospace";
    ctx.fillText("SAM BTY [ACTIVE]", ridgeX - 16, groundY - 14);
  }

  function drawAircraftCarrier(ctx, x, y, wavePhase) {
    var bob = Math.sin(x * 0.04 + wavePhase) * 1.5;
    var cy = y + bob;

    ctx.fillStyle = "#0e1726";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 38, cy + 2);
    ctx.lineTo(x + 42, cy - 2);
    ctx.lineTo(x + 46, cy + 3);
    ctx.lineTo(x - 36, cy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(245, 158, 11, 0.7)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 28, cy - 1);
    ctx.lineTo(x + 36, cy - 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.fillRect(x - 22, cy - 10, 8, 8);
    ctx.strokeStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(x - 18, cy - 10);
    ctx.lineTo(x - 18, cy - 15);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(x - 38, cy + 4);
    ctx.lineTo(x - 58, cy + 5);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(56, 189, 248, 0.8)";
    ctx.font = "7.5px ui-monospace, monospace";
    ctx.fillText("CVN-78 STRIKE GROUP", x - 26, cy - 17);
  }

  function drawAegisDestroyer(ctx, x, y, wavePhase) {
    var bob = Math.sin(x * 0.04 + wavePhase) * 1.5;
    var dy = y + bob;

    ctx.fillStyle = "#0c1524";
    ctx.strokeStyle = "rgba(56, 189, 248, 0.75)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 22, dy + 2);
    ctx.lineTo(x + 24, dy - 2);
    ctx.lineTo(x + 26, dy + 2);
    ctx.lineTo(x - 20, dy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(148, 163, 184, 0.85)";
    ctx.fillRect(x - 6, dy - 8, 10, 6);
    ctx.strokeStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(x - 1, dy - 8);
    ctx.lineTo(x - 1, dy - 13);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(x + 24, dy);
    ctx.lineTo(x + 28, dy + 2);
    ctx.stroke();

    ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
    ctx.font = "7px ui-monospace, monospace";
    ctx.fillText("DDG-51 AEGIS", x - 14, dy - 15);
  }

})(typeof window !== "undefined" ? window : this);
