// # Agile Combat Employment (ACE) System
//
// Logline: Dispersed operations doctrine — austere airstrips, forward arming & refueling points (FARPs),
//          carrier touch-and-gos, hot-pit rapid rearming, and immediate combat scramble.
//

(function (global) {
  "use strict";

  // 1. Definition of Dispersed Landing Zones across the Theater
  function getAceLandingZones(worldW, worldH) {
    var w = (typeof worldW === "number" && worldW > 0) ? worldW : 3600;
    var h = (typeof worldH === "number" && worldH > 0) ? worldH : 1200;
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);

    return [
      {
        id: "alpha",
        name: "BASE ALPHA (RWY 09L)",
        type: "MAIN_BASE",
        team: "blue",
        startX: w * 0.18,
        endX: w * 0.32,
        surfaceY: mslY - 14,
        runwayHeading: 0.0 // Eastbound landing
      },
      {
        id: "bravo",
        name: "FARP ISLAND BRAVO",
        type: "AUSTERE_ISLAND",
        team: "neutral", // Both Blue and Red can use forward austere island
        startX: w * 0.48,
        endX: w * 0.58,
        surfaceY: mslY - 10,
        runwayHeading: 0.0
      },
      {
        id: "carrier",
        name: "CVN-78 FLIGHT DECK",
        type: "CARRIER",
        team: "blue",
        startX: w * 0.68,
        endX: w * 0.72,
        surfaceY: mslY - 4,
        runwayHeading: 0.0
      },
      {
        id: "delta",
        name: "FARP DELTA (AUSTERE STRIP)",
        type: "AUSTERE_STRIP",
        team: "red",
        startX: w * 0.82,
        endX: w * 0.94,
        surfaceY: mslY - 10,
        runwayHeading: Math.PI // Westbound landing for Red
      }
    ];
  }

  // 2. Select Closest Suitable ACE Landing Zone for an Aircraft
  function findClosestAceLandingZone(jet, worldW, worldH) {
    if (!jet) return null;
    var zones = getAceLandingZones(worldW, worldH);
    var bestZone = null;
    var bestDist = Infinity;

    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      // Team compatibility: neutral is open to all; otherwise must match team
      if (z.team !== "neutral" && z.team !== jet.team) continue;

      var midX = (z.startX + z.endX) * 0.5;
      var d = Math.abs(jet.x - midX);
      if (d < bestDist) {
        bestDist = d;
        bestZone = z;
      }
    }
    return bestZone || zones[0];
  }

  // 3. Command an Aircraft to Divert for an ACE Touch-and-Go
  function orderAceTouchAndGo(jet, zoneOverride) {
    if (!jet || !jet.active || jet.isDying) return false;
    if (jet.mode === "ACE_TOUCHDOWN" || jet.mode === "ACE_APPROACH") return true;

    var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
    var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
    var zone = zoneOverride || findClosestAceLandingZone(jet, worldW, worldH);
    if (!zone) return false;

    jet.mode = "ACE_APPROACH";
    jet.aceZone = zone;
    jet.aceRollTimer = 0;
    jet.isTailChasing = false;
    jet.targetJet = null;

    if (typeof dfRadio === "function") {
      var call = jet.callsign || ("GEN " + jet.gen);
      dfRadio(call + ": [ACE DOCTRINE] DIVERTING TO " + zone.name + " FOR TOUCH-AND-GO REARM & REFUEL!");
    }
    return true;
  }

  // 4. Command Entire Fleet of a Team to Rearm
  function orderFleetAceTouchAndGo(team) {
    if (typeof DF === "undefined") return;
    var pool = (team === "red") ? DF.redPool : DF.bluePool;
    if (!pool) return;
    var count = 0;
    for (var i = 0; i < pool.length; i++) {
      var j = pool[i];
      if (j && j.active && !j.isDying) {
        orderAceTouchAndGo(j);
        count++;
      }
    }
    if (typeof dfRadio === "function" && count > 0) {
      dfRadio("TAC-NET: ALL " + (team === "red" ? "RED" : "BLUE") + " SORTIES ORDERED -> AGILE COMBAT EMPLOYMENT (ACE) REARM!");
    }
  }

  // 5. Update Precision Flight Physics & Touchdown during ACE Maneuver
  function updateAceEmployment(jet, worldW, worldH) {
    if (!jet || !jet.active || jet.isDying) return false;
    if (jet.mode !== "ACE_APPROACH" && jet.mode !== "ACE_TOUCHDOWN" && jet.mode !== "ACE_SCRAMBLE") {
      return false;
    }

    var zone = jet.aceZone || findClosestAceLandingZone(jet, worldW, worldH);
    if (!zone) {
      jet.mode = "PURSUIT";
      return false;
    }

    var rwyY = zone.surfaceY;
    var headingRight = (zone.runwayHeading === 0.0);

    // ------------------------------------------------------------------------
    // PHASE A: GLIDESLOPE APPROACH (Descending towards runway threshold)
    // ------------------------------------------------------------------------
    if (jet.mode === "ACE_APPROACH") {
      var thresholdX = headingRight ? (zone.startX + 20) : (zone.endX - 20);
      var dx = thresholdX - jet.x;
      var dy = (rwyY - 4) - jet.y;

      // Desired approach heading
      var approachAngle = Math.atan2(dy, dx);
      // Clamp descent glide slope to safe flare angle (-15 deg to +5 deg)
      if (headingRight) {
        jet.targetAngle = Math.max(-0.25, Math.min(0.20, approachAngle));
      } else {
        var basePi = approachAngle < 0 ? -Math.PI : Math.PI;
        jet.targetAngle = basePi + Math.max(-0.20, Math.min(0.25, approachAngle - basePi));
      }

      // Approach speed regulation: throttle back to 0.75 for controlled descent
      jet.throttleSetting = 0.75;
      jet.afterburner = false;
      if (jet.speed > 3.8) {
        jet.speed *= 0.985;
      }

      // Check for touchdown on runway surface
      var withinRunwayBounds = (jet.x >= zone.startX - 15 && jet.x <= zone.endX + 15);
      var atGroundLevel = (jet.y >= rwyY - 6 && jet.y <= rwyY + 4);

      if (withinRunwayBounds && atGroundLevel) {
        // TOUCHDOWN! Transition to ground roll
        jet.mode = "ACE_TOUCHDOWN";
        jet.aceRollTimer = 65; // ~1.1 seconds ground roll
        jet.y = rwyY - 1;
        jet.targetAngle = headingRight ? 0.0 : Math.PI;
        jet.angle = jet.targetAngle;

        // Audio & Radio Callouts
        if (typeof window !== "undefined" && window.TacticalAudio) {
          if (typeof window.TacticalAudio.playTouchdown === "function") window.TacticalAudio.playTouchdown();
          if (typeof window.TacticalAudio.playClick === "function") window.TacticalAudio.playClick();
        }
        if (typeof dfRadio === "function") {
          dfRadio("FARP CONTROLLER: " + jet.callsign + " WHEELS DOWN ON " + zone.name + "! RAPID HOT-PIT SERVICE IN PROGRESS!");
        }

        // Spawn touchdown tire smoke puffs
        spawnAceTireSmoke(jet.x, rwyY);
      }
      return true;
    }

    // ------------------------------------------------------------------------
    // PHASE B: TOUCH-AND-GO GROUND ROLL (Hot-pit refueling and rearming)
    // ------------------------------------------------------------------------
    if (jet.mode === "ACE_TOUCHDOWN") {
      jet.aceRollTimer--;
      jet.y = rwyY - 1;
      jet.targetAngle = headingRight ? 0.0 : Math.PI;
      jet.speed = 3.6; // Steady ground roll speed

      // Continuous tire sparks/smoke during roll
      if (Math.random() < 0.35) {
        spawnAceTireSmoke(jet.x - (headingRight ? 8 : -8), rwyY);
      }

      // Service completion: Restores airframe health and loads full missile capacity
      if (jet.aceRollTimer <= 0) {
        // Replenish munitions & repair airframe
        jet.hp = 100.0;
        jet.damageState = "NOMINAL";
        jet.missilesRemaining = (typeof jet.missileCapacity === "number") ? jet.missileCapacity : 6;
        jet.isWinchester = false;

        // Transition to immediate tactical scramble liftoff
        jet.mode = "ACE_SCRAMBLE";
        jet.scrambleTimer = 35;
        jet.throttleSetting = 1.5;
        jet.afterburner = true;

        if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playMissileLaunch === "function") {
          window.TacticalAudio.playMissileLaunch();
        }
        if (typeof dfRadio === "function") {
          dfRadio(jet.callsign + ": HOT-PIT COMPLETE! FULL MISSILES & FUEL! SCRAMBLING REHEAT OFF " + zone.name + "!");
        }
      }
      return true;
    }

    // ------------------------------------------------------------------------
    // PHASE C: SCRAMBLE CLIMB-OUT (Rocketing back into combat airspace)
    // ------------------------------------------------------------------------
    if (jet.mode === "ACE_SCRAMBLE") {
      jet.scrambleTimer--;
      jet.throttleSetting = 1.5;
      jet.afterburner = true;
      // Steep climb angle (-26 degrees)
      jet.targetAngle = headingRight ? -0.45 : (jet.angle < 0 ? -Math.PI + 0.45 : Math.PI - 0.45);

      if (jet.scrambleTimer <= 0) {
        jet.mode = "PURSUIT";
        jet.aceZone = null;
      }
      return true;
    }

    return false;
  }

  // Helper: Spawn white rubber tire smoke upon touchdown
  function spawnAceTireSmoke(x, y) {
    if (typeof globalVfxParticlePool === "undefined" || !globalVfxParticlePool) return;
    for (var i = 0; i < 4; i++) {
      var spIdx = globalVfxParticlePool.alloc();
      if (spIdx >= 0) {
        var spo = spIdx * 8;
        globalVfxParticlePool.buffer[spo] = x + (Math.random() - 0.5) * 6;
        globalVfxParticlePool.buffer[spo + 1] = y - 1;
        globalVfxParticlePool.buffer[spo + 2] = (Math.random() - 0.5) * 1.5;
        globalVfxParticlePool.buffer[spo + 3] = -0.5 - Math.random() * 1.5;
        globalVfxParticlePool.buffer[spo + 4] = 16 + Math.floor(Math.random() * 12);
        globalVfxParticlePool.buffer[spo + 5] = 24;
        globalVfxParticlePool.buffer[spo + 6] = 1.2;
        globalVfxParticlePool.buffer[spo + 7] = 8; // Water/rubber mist particle
      }
    }
  }

  // 6. Render In-World ACE Hot-Pit Progress Overlay above Touching Jets
  function drawAceInWorldStatus(ctx, jet, colors, frameCount) {
    if (!ctx || !jet || !jet.active || jet.isDying) return;

    var jx = Math.floor(jet.x);
    var jy = Math.floor(jet.y);

    if (jet.mode === "ACE_TOUCHDOWN") {
      ctx.save();
      var rollTotal = 65.0;
      var remaining = typeof jet.aceRollTimer === "number" ? jet.aceRollTimer : 0;
      var progress = Math.max(0.0, Math.min(1.0, 1.0 - (remaining / rollTotal)));

      // Banner Box
      var bw = 96;
      var bh = 14;
      var bx = jx - Math.floor(bw / 2);
      var by = jy - 28;

      ctx.fillStyle = "rgba(6, 10, 18, 0.9)";
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);

      // Progress bar fill
      ctx.fillStyle = "rgba(245, 158, 11, 0.7)";
      ctx.fillRect(bx + 2, by + 9, Math.floor((bw - 4) * progress), 3);

      // Text label
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText("⚡ ACE HOT-PIT // REARMING", jx, by + 7);
      ctx.restore();
    } else if (jet.mode === "ACE_APPROACH") {
      ctx.save();
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 3;
      var zName = (jet.aceZone && jet.aceZone.name) ? jet.aceZone.name : "FARP";
      ctx.fillText("DIVERT: " + zName, jx, jy + 16);
      ctx.restore();
    }
  }

  // 7. Render Tactical Landing Strips (Island Bravo, Delta, Runway markings)
  function drawAceAirstrips(ctx, width, height, now, colors) {
    if (!ctx) return;
    var zones = getAceLandingZones(width, height);
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(height) : Math.floor(height * 0.84);

    for (var i = 0; i < zones.length; i++) {
      var z = zones[i];
      if (z.type === "AUSTERE_ISLAND" || z.type === "AUSTERE_STRIP") {
        var startX = z.startX;
        var endX = z.endX;
        var len = endX - startX;
        var gy = z.surfaceY;

        // Island Sand Dunes / Atoll base beneath strip
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX - 25, mslY);
        ctx.lineTo(startX, gy);
        ctx.lineTo(endX, gy);
        ctx.lineTo(endX + 25, mslY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pierced Steel Planking (PSP) Expeditionary Runway Tarmac
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "rgba(148, 163, 184, 0.7)";
        ctx.lineWidth = 1;
        ctx.fillRect(startX, gy - 2, len, 4);
        ctx.strokeRect(startX, gy - 2, len, 4);

        // Centerline dashed runway line
        ctx.strokeStyle = "rgba(245, 158, 11, 0.75)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(startX + 8, gy);
        ctx.lineTo(endX - 8, gy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Green Approach Threshold Lights
        ctx.fillStyle = "#10b981";
        ctx.fillRect(startX + 2, gy - 3, 3, 2);
        ctx.fillRect(endX - 5, gy - 3, 3, 2);

        // FARP Fuel Bladders (Olive Drab Rubber Bladders)
        var bladderX = startX + 24;
        ctx.fillStyle = "#164e63";
        ctx.beginPath();
        ctx.ellipse(bladderX, gy - 4, 10, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Mobile Ammo Trailer / Missile Loader Rack
        var ammoX = endX - 30;
        ctx.fillStyle = "#334155";
        ctx.fillRect(ammoX - 6, gy - 6, 12, 4);
        ctx.fillStyle = "#f43f5e";
        ctx.fillRect(ammoX - 4, gy - 8, 8, 2);

        // Windsock (Orange Tactical Windsock)
        var sockX = startX + 45;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sockX, gy);
        ctx.lineTo(sockX, gy - 12);
        ctx.stroke();
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(sockX, gy - 12);
        ctx.lineTo(sockX + 8, gy - 10);
        ctx.lineTo(sockX + 8, gy - 8);
        ctx.lineTo(sockX, gy - 10);
        ctx.closePath();
        ctx.fill();

        // Strip Name & ACE Designation
        ctx.fillStyle = (z.team === "red") ? "rgba(248, 113, 113, 0.85)" : "rgba(56, 189, 248, 0.85)";
        ctx.font = "7.5px ui-monospace, monospace";
        ctx.fillText(z.name + " // ACE REARM", startX + 16, gy - 8);
      }
    }
  }

  // Export to Global Context
  global.getAceLandingZones = getAceLandingZones;
  global.findClosestAceLandingZone = findClosestAceLandingZone;
  global.orderAceTouchAndGo = orderAceTouchAndGo;
  global.orderFleetAceTouchAndGo = orderFleetAceTouchAndGo;
  global.updateAceEmployment = updateAceEmployment;
  global.drawAceInWorldStatus = drawAceInWorldStatus;
  global.drawAceAirstrips = drawAceAirstrips;

})(typeof window !== "undefined" ? window : this);
