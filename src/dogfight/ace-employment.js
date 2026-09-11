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
        team: "west",
        startX: w * 0.03,
        endX: w * 0.13,
        surfaceY: mslY - 14,
        runwayHeading: 0.0 // Eastbound landing
      },
      {
        id: "carrier",
        name: "CVN-78 FLIGHT DECK",
        type: "CARRIER",
        team: "west",
        startX: w * 0.20,
        endX: w * 0.25,
        surfaceY: mslY - 4,
        runwayHeading: 0.0
      },
      {
        id: "delta",
        name: "FARP DELTA (AUSTERE STRIP)",
        type: "AUSTERE_STRIP",
        team: "east",
        startX: w * 0.87,
        endX: w * 0.97,
        surfaceY: mslY - 12,
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
      // Team compatibility: must match aircraft team
      if (z.team !== jet.team) continue;
      // Land-based fighters prefer Main Base / Austere strip over small carrier deck
      if (z.type === "CARRIER" && jet.variant !== "F14" && (jet.callsign && jet.callsign.indexOf("TOMCAT") === -1)) {
        continue;
      }

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
    var pool = (team === "east") ? DF.redPool : DF.bluePool;
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
      dfRadio("TAC-NET: ALL " + (team === "east" ? "EAST" : "WEST") + " SORTIES ORDERED -> AGILE COMBAT EMPLOYMENT (ACE) REARM!");
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

    // ------------------------------------------------------------------------
    // PHASE A: GLIDESLOPE APPROACH (Descending towards runway threshold)
    // ------------------------------------------------------------------------
    if (jet.mode === "ACE_APPROACH") {
      var isWest = (jet.team === "west");
      var runwayCenterX = (zone.startX + zone.endX) * 0.5;
      var distToCenter = Math.abs(jet.x - runwayCenterX);

      // Touchdown target box on the runway deck:
      // Aim past the threshold closest to the approaching jet
      var targetX;
      if (jet.x > zone.endX) {
        targetX = zone.endX - 100;
      } else if (jet.x < zone.startX) {
        targetX = zone.startX + 100;
      } else {
        targetX = runwayCenterX;
      }
      var targetY = rwyY - 2;

      // Glide slope angle directly into the runway touchdown zone
      var dx = targetX - jet.x;
      var dy = targetY - jet.y;
      jet.targetAngle = Math.atan2(dy, dx);

      jet.throttleSetting = (distToCenter > 250) ? 1.1 : 0.75;
      jet.afterburner = false;
      if (jet.speed > 3.6) {
        jet.speed *= 0.985;
      }

      // Check for touchdown on runway surface
      var withinRunwayBounds = (jet.x >= zone.startX - 20 && jet.x <= zone.endX + 20);
      var atGroundLevel = (jet.y >= rwyY - 8 && jet.y <= rwyY + 6);

      if (withinRunwayBounds && atGroundLevel) {
        // TOUCHDOWN! Transition to ground roll
        jet.mode = "ACE_TOUCHDOWN";
        jet.aceRollTimer = 65; // ~1.1 seconds ground roll
        jet.y = rwyY - 1;
        var rollHeading = isWest ? Math.PI : 0.0;
        jet.targetAngle = rollHeading;
        jet.angle = rollHeading;

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
      var isWest = (jet.team === "west");
      var isFacingRight = Math.cos(jet.angle) >= 0;
      jet.targetAngle = isFacingRight ? 0.0 : Math.PI;
      jet.speed = 1.0; // Steady hot-pit ground roll taxi speed

      // Continuous tire sparks/smoke during roll
      if (Math.random() < 0.35) {
        spawnAceTireSmoke(jet.x - (isFacingRight ? 8 : -8), rwyY);
      }

      // Hot-pit turnaround: progressively refuels tanks and restores ordnance
      if (typeof jet.fuel === "number") {
        jet.fuel = Math.min(100.0, jet.fuel + 1.8);
      }

      // Service completion: Restores airframe health, fuel, and loads full missile capacity
      if (jet.aceRollTimer <= 0) {
        // Replenish fuel, munitions & repair airframe
        jet.hp = 100.0;
        jet.fuel = 100.0;
        jet.isBingoFuel = false;
        jet.damageState = "NOMINAL";
        jet.missilesRemaining = (typeof jet.missileCapacity === "number") ? jet.missileCapacity : 6;
        jet.isWinchester = false;

        // Transition to immediate tactical scramble liftoff
        jet.mode = "ACE_SCRAMBLE";
        jet.scrambleTimer = 35;
        jet.throttleSetting = 1.5;
        jet.afterburner = true;
        jet.speed = 3.6; // Reheat catapult / runway scramble liftoff speed
        jet.isStalled = false;

        if (typeof window !== "undefined" && window.TacticalAudio && typeof window.TacticalAudio.playMissileLaunch === "function") {
          window.TacticalAudio.playMissileLaunch();
        }
        if (typeof dfRadio === "function") {
          dfRadio("⛽ " + jet.callsign + ": HOT-PIT COMPLETE! 100% FUEL & FULL WEAPONS! SCRAMBLING REHEAT OFF " + zone.name + "!");
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
      var isWest = (jet.team === "west");
      // Blue scrambles Eastbound (heading 0.0, climbing at -0.45), Red scrambles Westbound (heading Math.PI, climbing at -Math.PI + 0.45)
      jet.targetAngle = isWest ? -0.45 : (-Math.PI + 0.45);
      jet.angle = jet.targetAngle;

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
      if (z.type === "AUSTERE_STRIP") {
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
        ctx.fillStyle = (z.team === "east") ? "rgba(248, 113, 113, 0.85)" : "rgba(56, 189, 248, 0.85)";
        ctx.font = "7.5px ui-monospace, monospace";
        ctx.fillText(z.name + " // ACE REARM", startX + 16, gy - 8);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 8. Agile Combat Employment FARP & Airbase Defenses (CIWS, SHORAD, Point Defense)
  // --------------------------------------------------------------------------
  var farpBatteries = [
    {
      id: "alpha_defense",
      zoneId: "alpha",
      name: "BASE ALPHA IADS",
      shortName: "BASE ALPHA CIWS",
      team: "west",
      relX: 0.135,
      surfaceOffsetY: -22,
      ciwsRange: 240,
      samRange: 320,
      exclusionRange: 350,
      ciwsCooldown: 0,
      samCooldown: 0,
      turretAngle: -Math.PI * 0.45,
      radarAngle: 0,
      muzzleFlashTimer: 0,
      targetJet: null,
      type: "IADS"
    },
    {
      id: "carrier_defense",
      zoneId: "carrier",
      name: "CVN-78 PHALANX CIWS",
      shortName: "CVN-78 CIWS",
      team: "west",
      relX: 0.225,
      surfaceOffsetY: -4,
      ciwsRange: 220,
      samRange: 300,
      exclusionRange: 320,
      ciwsCooldown: 0,
      samCooldown: 0,
      turretAngle: -Math.PI * 0.5,
      radarAngle: 0,
      muzzleFlashTimer: 0,
      targetJet: null,
      type: "NAVAL_CIWS"
    },
    {
      id: "delta_defense",
      zoneId: "delta",
      name: "FARP DELTA PANTSIR-S1",
      shortName: "FARP DELTA DEFENSE",
      team: "east",
      relX: 0.865,
      surfaceOffsetY: -12,
      ciwsRange: 240,
      samRange: 320,
      exclusionRange: 350,
      ciwsCooldown: 0,
      samCooldown: 0,
      turretAngle: -Math.PI * 0.55,
      radarAngle: 0,
      muzzleFlashTimer: 0,
      targetJet: null,
      type: "PANTSIR"
    }
  ];

  function getFarpDefenses(worldW, worldH) {
    var w = (typeof worldW === "number" && worldW > 0) ? worldW : 3600;
    var h = (typeof worldH === "number" && worldH > 0) ? worldH : 1200;
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);

    for (var i = 0; i < farpBatteries.length; i++) {
      var bat = farpBatteries[i];
      bat.x = w * bat.relX;
      bat.y = (typeof getSurfaceElevationY === "function") ? getSurfaceElevationY(bat.x, w, h) : (mslY + bat.surfaceOffsetY);
    }
    return farpBatteries;
  }

  function updateFarpDefenses(worldW, worldH) {
    var w = (typeof worldW === "number" && worldW > 0) ? worldW : 3600;
    var h = (typeof worldH === "number" && worldH > 0) ? worldH : 1200;
    var mslY = (typeof getSeaLevelY === "function") ? getSeaLevelY(h) : Math.floor(h * 0.84);

    if (typeof DF === "undefined") return;

    for (var b = 0; b < farpBatteries.length; b++) {
      var bat = farpBatteries[b];
      bat.x = w * bat.relX;
      bat.y = (typeof getSurfaceElevationY === "function") ? getSurfaceElevationY(bat.x, w, h) : (mslY + bat.surfaceOffsetY);

      if (bat.ciwsCooldown > 0) bat.ciwsCooldown--;
      if (bat.samCooldown > 0) bat.samCooldown--;
      if (bat.muzzleFlashTimer > 0) bat.muzzleFlashTimer--;
      bat.radarAngle = (bat.radarAngle + 0.05) % (Math.PI * 2);

      var isWestBattery = (bat.team === "west");
      var hostilePool = isWestBattery ? DF.redPool : DF.bluePool;
      var hostileTeamCode = isWestBattery ? 1 : 0;

      // Check if battery's team is under post-bombing blackout
      // (removed in v3.0; no bombers to cause blackout)
      bat.isBlackout = false;

      // Point Defense SAM fire against incoming hostile Strategic Bomber
      // (removed in v3.0; bombers.js deleted)

      // ----------------------------------------------------------------------
      // POINT DEFENSE: Intercept incoming threat missiles heading for base/airplanes
      // ----------------------------------------------------------------------
      if (DF.missilesPool && DF.missilesPool.activeCount > 0) {
        for (var mi = DF.missilesPool.activeCount - 1; mi >= 0; mi--) {
          var mo = mi * 8;
          var mOwnerRaw = Math.round(DF.missilesPool.buffer[mo + 4]);
          var mOwnerTeam = mOwnerRaw >= 100 ? (mOwnerRaw >= 200 ? 1 : 0) : mOwnerRaw;

          if (mOwnerTeam === hostileTeamCode) {
            var mx = DF.missilesPool.buffer[mo];
            var my = DF.missilesPool.buffer[mo + 1];
            var dMis = Math.hypot(mx - bat.x, my - bat.y);
            if (dMis < 380) {
              bat.turretAngle = Math.atan2(my - bat.y, mx - bat.x);
              bat.muzzleFlashTimer = 6;
              bat.ciwsCooldown = 10;
              DF.missilesPool.buffer[mo + 6] = 0; // Detonate missile immediately

              if (typeof globalVfxParticlePool !== "undefined" && globalVfxParticlePool) {
                for (var sp = 0; sp < 6; sp++) {
                  var spIdx = globalVfxParticlePool.alloc();
                  if (spIdx >= 0) {
                    var spo = spIdx * 8;
                    globalVfxParticlePool.buffer[spo] = mx;
                    globalVfxParticlePool.buffer[spo + 1] = my;
                    globalVfxParticlePool.buffer[spo + 2] = (Math.random() - 0.5) * 4;
                    globalVfxParticlePool.buffer[spo + 3] = (Math.random() - 0.5) * 4;
                    globalVfxParticlePool.buffer[spo + 4] = 12;
                    globalVfxParticlePool.buffer[spo + 5] = 12;
                    globalVfxParticlePool.buffer[spo + 6] = 2.5;
                    globalVfxParticlePool.buffer[spo + 7] = 2; // Shockwave ring
                  }
                }
              }

              if (typeof window !== "undefined" && window.TacticalAudio) {
                if (typeof window.TacticalAudio.playCiwsBurst === "function") {
                  window.TacticalAudio.playCiwsBurst();
                } else if (typeof window.TacticalAudio.playCannonBurst === "function") {
                  window.TacticalAudio.playCannonBurst();
                }
              }

              if (typeof dfRadio === "function" && Math.random() < 0.35) {
                dfRadio(bat.shortName + ": POINT DEFENSE INTERCEPT! HOSTILE MISSILE DESTROYED OVER RUNWAY!");
              }
              break;
            }
          }
        }
      }

      // ----------------------------------------------------------------------
      // TARGET ACQUISITION: Track and engage hostile bandits entering defense zone
      // ----------------------------------------------------------------------
      var bestHostile = null;
      var minHDist = Infinity;
      if (hostilePool) {
        for (var hi = 0; hi < hostilePool.length; hi++) {
          var hJet = hostilePool[hi];
          if (!hJet || !hJet.active || hJet.isDying) continue;
          var dh = Math.hypot(hJet.x - bat.x, hJet.y - bat.y);
          if (dh < bat.samRange && dh < minHDist) {
            minHDist = dh;
            bestHostile = hJet;
          }
        }
      }

      bat.targetJet = bestHostile;

      if (bestHostile) {
        var desiredAngle = Math.atan2(bestHostile.y - bat.y, bestHostile.x - bat.x);
        var dAng = desiredAngle - bat.turretAngle;
        while (dAng < -Math.PI) dAng += Math.PI * 2;
        while (dAng > Math.PI) dAng -= Math.PI * 2;
        bat.turretAngle += Math.min(Math.max(dAng, -0.14), 0.14);

        // 1. CIWS Gatling Autocannon Burst (range < 480px)
        if (minHDist < bat.ciwsRange && bat.ciwsCooldown <= 0) {
          bat.ciwsCooldown = 5;
          bat.muzzleFlashTimer = 4;

          var tFlight = minHDist / 16.0;
          var leadX = bestHostile.x + Math.cos(bestHostile.angle) * bestHostile.speed * tFlight;
          var leadY = bestHostile.y + Math.sin(bestHostile.angle) * bestHostile.speed * tFlight;
          var fireBearing = Math.atan2(leadY - bat.y, leadX - bat.x);

          if (DF.bulletsPool) {
            var bIdx = DF.bulletsPool.alloc();
            if (bIdx >= 0) {
              var bo = bIdx * 6;
              DF.bulletsPool.buffer[bo] = bat.x + Math.cos(fireBearing) * 14;
              DF.bulletsPool.buffer[bo + 1] = bat.y - 4 + Math.sin(fireBearing) * 14;
              DF.bulletsPool.buffer[bo + 2] = Math.cos(fireBearing) * 16.0;
              DF.bulletsPool.buffer[bo + 3] = Math.sin(fireBearing) * 16.0;
              DF.bulletsPool.buffer[bo + 4] = 26;
              DF.bulletsPool.buffer[bo + 5] = (isWestBattery ? 100 : 200) + 99;
            }
          }

          if (typeof window !== "undefined" && window.TacticalAudio && Math.random() < 0.35) {
            if (typeof window.TacticalAudio.playCiwsBurst === "function") {
              window.TacticalAudio.playCiwsBurst();
            } else if (typeof window.TacticalAudio.playCannonBurst === "function") {
              window.TacticalAudio.playCannonBurst();
            }
          }

          if (typeof dfRadio === "function" && Math.random() < 0.04) {
            dfRadio(bat.shortName + ": RAPID CIWS BURST ENGAGING " + bestHostile.callsign + "!");
          }
        }

        // 2. SHORAD Surface-to-Air Missile (range < 720px, > 170px)
        if (minHDist < bat.samRange && minHDist > 170 && bat.samCooldown <= 0) {
          bat.samCooldown = 140;

          if (DF.missilesPool) {
            var mIdx = DF.missilesPool.alloc();
            if (mIdx >= 0) {
              var mo = mIdx * 8;
              var sAngle = bat.turretAngle;
              var smSpeed = 10.8;
              DF.missilesPool.buffer[mo] = bat.x + Math.cos(sAngle) * 16;
              DF.missilesPool.buffer[mo + 1] = bat.y - 6 + Math.sin(sAngle) * 16;
              DF.missilesPool.buffer[mo + 2] = Math.cos(sAngle) * smSpeed;
              DF.missilesPool.buffer[mo + 3] = Math.sin(sAngle) * smSpeed;
              DF.missilesPool.buffer[mo + 4] = isWestBattery ? 0 : 1;
              DF.missilesPool.buffer[mo + 5] = bestHostile.slotIdx || 0;
              DF.missilesPool.buffer[mo + 6] = 220;
              DF.missilesPool.buffer[mo + 7] = 4;
            }
          }

          if (typeof window !== "undefined" && window.TacticalAudio) {
            if (typeof window.TacticalAudio.playSamLaunch === "function") {
              window.TacticalAudio.playSamLaunch();
            } else if (typeof window.TacticalAudio.playMissileLaunch === "function") {
              window.TacticalAudio.playMissileLaunch();
            }
          }

          if (typeof dfRadio === "function") {
            dfRadio(bat.name + ": SAM LAUNCH! INTERCEPTING " + bestHostile.callsign + " IN DEFENSE SECTOR!");
          }
        }
      }
    }
  }

  // 9. Hostile Threat Check: Keeps hostile jets away from landing zones and outside FARP weapon range
  function isThreatenedByHostileFarp(jet, worldW, worldH) {
    if (!jet || !jet.active || jet.isDying) return null;
    if (jet.mode === "ACE_APPROACH" || jet.mode === "ACE_TOUCHDOWN" || jet.mode === "FARP_TAKEOFF") return null;
    var w = (typeof worldW === "number" && worldW > 0) ? worldW : 3600;
    var h = (typeof worldH === "number" && worldH > 0) ? worldH : 1200;

    for (var i = 0; i < farpBatteries.length; i++) {
      var bat = farpBatteries[i];
      if (bat.team === jet.team) continue; // Friendly battery doesn't threaten friendly jets
      var bx = w * bat.relX;
      var by = (typeof getSurfaceElevationY === "function") ? getSurfaceElevationY(bx, w, h) : (h * 0.84);
      var d = Math.hypot(jet.x - bx, jet.y - by);
      var safeStandoff = Math.max(bat.exclusionRange || 350, (bat.samRange || 320) + 20);
      if (d < safeStandoff) {
        return bat;
      }
    }
    return null;
  }

  // 10. Render FARP Air Defense Emplacements & Protective Umbrellas
  function drawFarpDefenses(ctx, width, height, now, colors) {
    if (!ctx) return;
    var bats = getFarpDefenses(width, height);

    for (var i = 0; i < bats.length; i++) {
      var bat = bats[i];
      var bx = bat.x;
      var by = bat.y;
      var isWest = (bat.team === "west");
      var hasHostileNear = Boolean(bat.targetJet);

      ctx.save();

      // Post-strike defense blackout state
      if (bat.isBlackout) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.85)";
        ctx.font = "bold 7px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.fillText("[" + bat.shortName + " // ⚡ OFFLINE // POST-STRIKE BLACKOUT]", bx, by - 24);
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "rgba(239, 68, 68, 0.5)";
        ctx.lineWidth = 1;
        ctx.fillRect(bx - 10, by - 4, 20, 5);
        ctx.strokeRect(bx - 10, by - 4, 20, 5);
        ctx.restore();
        continue;
      }

      // ----------------------------------------------------------------------
      // A. Tactical Air Defense Umbrella Arc (Shield Bubble above Strip)
      // ----------------------------------------------------------------------
      var umbrellaColor = isWest ? "rgba(56, 189, 248, " : "rgba(239, 68, 68, ";
      var umbrellaAlpha = hasHostileNear ? 0.28 : 0.12;
      ctx.strokeStyle = umbrellaColor + umbrellaAlpha + ")";
      ctx.lineWidth = hasHostileNear ? 1.4 : 1.0;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(bx, by, bat.exclusionRange, -Math.PI * 0.94, -Math.PI * 0.06);
      ctx.stroke();
      ctx.setLineDash([]);

      // Tactical Perimeter Label
      ctx.fillStyle = umbrellaColor + (hasHostileNear ? "0.85)" : "0.55)");
      ctx.font = "7px ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText("[" + bat.shortName + " // AIR DEFENSE PERIMETER]", bx, by - bat.exclusionRange + 14);

      // Warning target line if engaging
      if (bat.targetJet) {
        ctx.strokeStyle = umbrellaColor + "0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(bx, by - 6);
        ctx.lineTo(bat.targetJet.x, bat.targetJet.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ----------------------------------------------------------------------
      // B. Emplacement Ground Hardware (CIWS, Turret, Missile Rack, Radar)
      // ----------------------------------------------------------------------
      // 1. Concrete / Sandbag Pedestal
      ctx.fillStyle = isWest ? "#1e293b" : "#292524";
      ctx.strokeStyle = isWest ? "rgba(56, 189, 248, 0.6)" : "rgba(239, 68, 68, 0.6)";
      ctx.lineWidth = 1;
      ctx.fillRect(bx - 10, by - 4, 20, 5);
      ctx.strokeRect(bx - 10, by - 4, 20, 5);

      // 2. SAM Missile Canister Launcher (tilted at 45 deg)
      ctx.fillStyle = "#334155";
      ctx.strokeStyle = isWest ? "#38bdf8" : "#ef4444";
      ctx.lineWidth = 0.8;
      ctx.save();
      ctx.translate(bx + (isWest ? -6 : 6), by - 4);
      var launcherAngle = isWest ? -0.42 : -Math.PI + 0.42;
      ctx.rotate(launcherAngle);
      ctx.fillRect(-2, -10, 8, 12);
      ctx.strokeRect(-2, -10, 8, 12);
      // Missile Tips
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-1, -12, 2, 2);
      ctx.fillRect(3, -12, 2, 2);
      ctx.restore();

      // 3. Phalanx / Pantsir CIWS Gun Mount & Radome
      ctx.save();
      ctx.translate(bx, by - 5);

      // Turret base
      ctx.fillStyle = "#475569";
      ctx.fillRect(-4, -4, 8, 4);

      // White Radome Sphere (Phalanx style)
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Gatling Gun Barrels (aimed at turretAngle)
      var barrelLen = 9;
      var bxEnd = Math.cos(bat.turretAngle) * barrelLen;
      var byEnd = Math.sin(bat.turretAngle) * barrelLen;
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(bxEnd, -4 + byEnd);
      ctx.stroke();

      // Muzzle Flash Starburst
      if (bat.muzzleFlashTimer > 0) {
        var fx = bxEnd;
        var fy = -4 + byEnd;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 4. Rotating Search Radar Antenna
      ctx.save();
      ctx.translate(bx + (isWest ? 6 : -6), by - 6);
      ctx.rotate(bat.radarAngle);
      ctx.strokeStyle = isWest ? "#38bdf8" : "#f87171";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 3, -0.6, 0.6);
      ctx.stroke();
      ctx.restore();

      ctx.restore();
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
  global.getFarpDefenses = getFarpDefenses;
  global.updateFarpDefenses = updateFarpDefenses;
  global.isThreatenedByHostileFarp = isThreatenedByHostileFarp;
  global.drawFarpDefenses = drawFarpDefenses;

})(typeof window !== "undefined" ? window : this);
