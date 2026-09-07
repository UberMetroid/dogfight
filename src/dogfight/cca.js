// # CCA Loyal Wingman Autonomous Drones (Gen 6 Collaborative Combat Aircraft)
//
// Logline: Gen 6 loyal wingmen drones always flying in formation, extending radar range and sensor mesh.
//
function updateAndDrawCcaDrones(jet, isLead, colors) {
  if (!jet || jet.gen !== 6 || !jet.active) {
    if (jet) {
      jet.ccaDeployed = false;
      if (jet.cca1) jet.cca1.active = false;
      if (jet.cca2) jet.cca2.active = false;
    }
    return;
  }

  if (jet.isDying) {
    if (jet.cca1) jet.cca1.active = false;
    if (jet.cca2) jet.cca2.active = false;
    jet.ccaDeployed = false;
    return;
  }

  var oppPool = (jet.team === "blue") ? DF.redPool : DF.bluePool;
  var cosA = Math.cos(jet.angle);
  var sinA = Math.sin(jet.angle);

  // Drones ALWAYS fly with Gen 6 mothership (not launched only when needed)
  if (!jet.cca1) {
    jet.cca1 = {
      x: jet.x + cosA * 55 - sinA * 65,
      y: jet.y + sinA * 55 + cosA * 65,
      angle: jet.angle,
      speed: jet.speed,
      active: true,
      laserCooldown: 0
    };
  }
  if (!jet.cca2) {
    jet.cca2 = {
      x: jet.x + cosA * 55 + sinA * 65,
      y: jet.y + sinA * 55 - cosA * 65,
      angle: jet.angle,
      speed: jet.speed,
      active: true,
      laserCooldown: 0
    };
  }

  jet.ccaDeployed = true;
  jet.cca1.active = true;
  jet.cca2.active = true;

  // Snap to immediate escort positions if separated (e.g. initial spawn or flank scramble)
  if (Math.hypot(jet.cca1.x - jet.x, jet.cca1.y - jet.y) > 500) {
    jet.cca1.x = jet.x + cosA * 55 - sinA * 65;
    jet.cca1.y = jet.y + sinA * 55 + cosA * 65;
    jet.cca1.angle = jet.angle;
    jet.cca1.speed = jet.speed;
  }
  if (Math.hypot(jet.cca2.x - jet.x, jet.cca2.y - jet.y) > 500) {
    jet.cca2.x = jet.x + cosA * 55 + sinA * 65;
    jet.cca2.y = jet.y + sinA * 55 - cosA * 65;
    jet.cca2.angle = jet.angle;
    jet.cca2.speed = jet.speed;
  }

  jet.swarmTimer = (jet.swarmTimer || 0) + 1;

  // ------------------------------------------------------------------------
  // 1. EXTENDED RADAR SENSOR MESH (Tactical MADL Data-Link & Forward Radar Arcs)
  // ------------------------------------------------------------------------
  var isBlue = (jet.team === "blue");
  var linkColor = isBlue ? "rgba(56, 189, 248, 0.40)" : "rgba(244, 63, 94, 0.40)";
  var scanArcColor = isBlue ? "rgba(56, 189, 248, 0.25)" : "rgba(244, 63, 94, 0.25)";
  var sweepBeamColor = isBlue ? "rgba(56, 189, 248, 0.55)" : "rgba(244, 63, 94, 0.55)";

  DF.ctx.save();

  // High-Bandwidth Tactical Data Link Lines (Triangle Mesh forming Distributed Radar Aperture)
  DF.ctx.strokeStyle = linkColor;
  DF.ctx.lineWidth = 1;
  DF.ctx.setLineDash([3, 5]);
  DF.ctx.beginPath();
  DF.ctx.moveTo(jet.x, jet.y);
  DF.ctx.lineTo(jet.cca1.x, jet.cca1.y);
  DF.ctx.moveTo(jet.x, jet.y);
  DF.ctx.lineTo(jet.cca2.x, jet.cca2.y);
  DF.ctx.moveTo(jet.cca1.x, jet.cca1.y);
  DF.ctx.lineTo(jet.cca2.x, jet.cca2.y);
  DF.ctx.stroke();
  DF.ctx.setLineDash([]);

  // Central Data-Link Aperture Node & Annotation
  var midX = (jet.cca1.x + jet.cca2.x) * 0.5;
  var midY = (jet.cca1.y + jet.cca2.y) * 0.5;
  DF.ctx.fillStyle = colors.fg;
  DF.ctx.fillRect(midX - 1.5, midY - 1.5, 3, 3);

  DF.ctx.font = "7.5px ui-monospace, SFMono-Regular, monospace";
  DF.ctx.fillStyle = isBlue ? "rgba(56, 189, 248, 0.75)" : "rgba(244, 63, 94, 0.75)";
  DF.ctx.fillText("CCA RADAR MESH // RANGE EXTENDED", midX - 44, midY - 10);

  DF.ctx.restore();

  // ------------------------------------------------------------------------
  // 2. CCA INDIVIDUAL DRONE AI, SENSOR CONE & WEAPONS
  // ------------------------------------------------------------------------
  var drones = [jet.cca1, jet.cca2];
  var worldW = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
  var worldH = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;

  for (var d = 0; d < 2; d++) {
    var cca = drones[d];
    if (!cca || !cca.active) continue;

    if (cca.laserCooldown > 0) cca.laserCooldown--;

    // Render forward radar scan cone extending from CCA nose
    DF.ctx.save();
    DF.ctx.strokeStyle = scanArcColor;
    DF.ctx.lineWidth = 1;
    DF.ctx.setLineDash([2, 4]);
    DF.ctx.beginPath();
    DF.ctx.arc(cca.x, cca.y, 175, cca.angle - 0.52, cca.angle + 0.52);
    DF.ctx.stroke();

    // Sweeping radar scan line showing active electronic beamforming
    var sweepAngle = cca.angle + Math.sin(jet.swarmTimer * 0.08 + d * 1.5) * 0.48;
    DF.ctx.strokeStyle = sweepBeamColor;
    DF.ctx.lineWidth = 1;
    DF.ctx.setLineDash([]);
    DF.ctx.beginPath();
    DF.ctx.moveTo(cca.x, cca.y);
    DF.ctx.lineTo(cca.x + Math.cos(sweepAngle) * 175, cca.y + Math.sin(sweepAngle) * 175);
    DF.ctx.stroke();
    DF.ctx.restore();

    // Target selection
    var target = null;
    var minDist = 999999;
    for (var ei = 0; ei < oppPool.length; ei++) {
      var en = oppPool[ei];
      if (!en.active || en.isDying) continue;
      var ed = Math.hypot(en.x - cca.x, en.y - cca.y);
      if (ed < minDist) {
        minDist = ed;
        target = en;
      }
    }

    // Steering & Tactics
    if (target && minDist < 550) {
      // Direct Combat Engagement Mode: Coordinated dual-axis pincer strikes
      var tgtAngle = Math.atan2(target.y - cca.y, target.x - cca.x);
      var flankOffset = (d === 0 ? 0.873 : -0.873);
      var pincerFactor = Math.min(Math.max((minDist - 140) / 180, 0.0), 1.0);
      var targetAngle = tgtAngle + flankOffset * pincerFactor;

      var diffA = targetAngle - cca.angle;
      while (diffA > Math.PI) diffA -= Math.PI * 2;
      while (diffA < -Math.PI) diffA += Math.PI * 2;
      cca.angle += Math.max(-0.14, Math.min(0.14, diffA));
      cca.speed = Math.min(7.5, cca.speed + 0.08);

      // Offensive Directed-Energy Weapon (DEW) Pulse Strike
      var directDiff = tgtAngle - cca.angle;
      while (directDiff > Math.PI) directDiff -= Math.PI * 2;
      while (directDiff < -Math.PI) directDiff += Math.PI * 2;

      if (Math.abs(directDiff) < 0.38 && minDist < 280 && cca.laserCooldown <= 0) {
        cca.laserCooldown = 24;
        DF.ctx.save();
        DF.ctx.strokeStyle = colors.fg;
        DF.ctx.lineWidth = 1.8;
        DF.ctx.beginPath();
        DF.ctx.moveTo(cca.x, cca.y);
        DF.ctx.lineTo(target.x, target.y);
        DF.ctx.stroke();
        DF.ctx.strokeStyle = "#ffffff";
        DF.ctx.lineWidth = 1.0;
        DF.ctx.beginPath();
        DF.ctx.moveTo(cca.x, cca.y);
        DF.ctx.lineTo(target.x, target.y);
        DF.ctx.stroke();
        DF.ctx.restore();

        var spIdx = DF.explosionsPool.alloc();
        if (spIdx >= 0) {
          var spo = spIdx * 6;
          DF.explosionsPool.buffer[spo] = target.x + (Math.random() - 0.5) * 6;
          DF.explosionsPool.buffer[spo + 1] = target.y + (Math.random() - 0.5) * 6;
          DF.explosionsPool.buffer[spo + 2] = (Math.random() - 0.5) * 4;
          DF.explosionsPool.buffer[spo + 3] = (Math.random() - 0.5) * 4;
          DF.explosionsPool.buffer[spo + 4] = 2;
          DF.explosionsPool.buffer[spo + 5] = 0.9;
        }

        if (target.gen === 7) {
          target.shieldPulse = 1.0;
        } else {
          var ccaDmg = 40.0 + Math.random() * 15.0;
          var ccaLethal = applyAirframeDamage(target, ccaDmg, jet, "CCA_STRIKE");
          if (ccaLethal) {
            dfRadio("CCA WINGMAN: DIRECTED-ENERGY SPLASH (" + jet.callsign + ")");
          } else if (Math.random() < 0.35) {
            dfRadio("CCA WINGMAN " + (d + 1) + ": FLANKING PINCER STRIKE -> DEW BURST (HP: " + Math.round(target.hp) + "%)");
          }
        }
      }
    } else {
      // Disciplined Formation Escort & Radar Picket Mode (Always flying forward with Gen 6)
      var fwdOffset = 65;
      var latOffset = (d === 0 ? -75 : 75);
      var tSway = (jet.swarmTimer * 0.04) + (d * Math.PI);
      var patrolTargetX = jet.x + cosA * fwdOffset - sinA * latOffset + Math.cos(tSway) * 12;
      var patrolTargetY = jet.y + sinA * fwdOffset + cosA * latOffset + Math.sin(tSway * 2) * 8;

      var patrolBearing = Math.atan2(patrolTargetY - cca.y, patrolTargetX - cca.x);
      var diffEsc = patrolBearing - cca.angle;
      while (diffEsc > Math.PI) diffEsc -= Math.PI * 2;
      while (diffEsc < -Math.PI) diffEsc += Math.PI * 2;
      cca.angle += Math.max(-0.16, Math.min(0.16, diffEsc));
      cca.speed = Math.min(7.5, Math.max(4.8, jet.speed * 1.06));
    }

    // Leash tethering to maintain 45px <= distance <= 380px from mothership
    var dxM = cca.x - jet.x;
    var dyM = cca.y - jet.y;
    var curDist = Math.hypot(dxM, dyM);

    if (curDist > 250) {
      var backAngle = Math.atan2(-dyM, -dxM);
      var tetherWeight = Math.min(Math.max((curDist - 250) / 120, 0.0), 1.0);
      var daTether = backAngle - cca.angle;
      while (daTether > Math.PI) daTether -= Math.PI * 2;
      while (daTether < -Math.PI) daTether += Math.PI * 2;
      cca.angle += daTether * tetherWeight * 0.16;
      cca.speed = Math.min(7.6, jet.speed * 1.18);
    } else if (curDist < 50) {
      var pushAngle = Math.atan2(dyM, dxM);
      var pushWeight = Math.min(Math.max((50 - curDist) / 20, 0.0), 1.0);
      var daPush = pushAngle - cca.angle;
      while (daPush > Math.PI) daPush -= Math.PI * 2;
      while (daPush < -Math.PI) daPush += Math.PI * 2;
      cca.angle += daPush * pushWeight * 0.14;
      cca.speed = Math.max(4.5, jet.speed * 0.94);
    }

    // Defensive CIWS Interception of Threat Missiles
    var hostileType = isBlue ? 1 : 0;
    for (var mi = 0; mi < DF.missilesPool.activeCount; mi++) {
      var mio = mi * 8;
      if (DF.missilesPool.buffer[mio + 4] === hostileType) {
        var misX = DF.missilesPool.buffer[mio];
        var misY = DF.missilesPool.buffer[mio + 1];
        if (Math.hypot(misX - cca.x, misY - cca.y) < 170 || Math.hypot(misX - jet.x, misY - jet.y) < 170) {
          if (cca.laserCooldown <= 0) {
            cca.laserCooldown = 35;
            DF.ctx.save();
            DF.ctx.strokeStyle = colors.fg;
            DF.ctx.lineWidth = 2;
            DF.ctx.beginPath();
            DF.ctx.moveTo(cca.x, cca.y);
            DF.ctx.lineTo(misX, misY);
            DF.ctx.stroke();
            DF.ctx.restore();
            DF.missilesPool.buffer[mio + 6] = 0;
            dfRadio("CCA LASER CIWS: THREAT MISSILE INTERCEPTED!");
            break;
          }
        }
      }
    }

    // Physics Move
    cca.x += Math.cos(cca.angle) * cca.speed;
    cca.y += Math.sin(cca.angle) * cca.speed;

    // World boundary clamping & dynamic surface collision
    if (cca.x < 70) cca.x = 70;
    if (cca.x > worldW - 70) cca.x = worldW - 70;
    if (cca.y < 32) cca.y = 32;
    var ccaGroundY = (typeof getSurfaceElevationY === "function") ? getSurfaceElevationY(cca.x, worldW, worldH) : (worldH - 32);
    if (cca.y > ccaGroundY - 8) {
      cca.y = ccaGroundY - 8;
      if (Math.sin(cca.angle) > 0) cca.angle = -0.15;
    }

    // Hard clamp bounds [45px, 380px]
    var endDx = cca.x - jet.x;
    var endDy = cca.y - jet.y;
    var endDist = Math.hypot(endDx, endDy);
    if (endDist > 380) {
      var factor380 = 380 / endDist;
      cca.x = jet.x + endDx * factor380;
      cca.y = jet.y + endDy * factor380;
    } else if (endDist < 45) {
      var factor45 = 45 / (endDist || 1);
      cca.x = jet.x + endDx * factor45;
      cca.y = jet.y + endDy * factor45;
    }

    // ----------------------------------------------------------------------
    // 3. DRAW CCA LOYAL WINGMAN DRONE
    // ----------------------------------------------------------------------
    DF.ctx.save();
    DF.ctx.translate(Math.floor(cca.x), Math.floor(cca.y));
    DF.ctx.rotate(cca.angle);

    // Dedicated exhaust plume
    var cFlame = 5 + Math.floor(Math.random() * (cca.speed * 1.6));
    DF.ctx.fillStyle = colors.fg;
    DF.ctx.fillRect(-6 - cFlame, -1, cFlame, 2);
    DF.ctx.fillStyle = "#ffffff";
    DF.ctx.fillRect(-6 - Math.floor(cFlame * 0.4), 0, Math.floor(cFlame * 0.4), 1);

    // Sleek stealth delta silhouette
    DF.ctx.fillStyle = colors.fg;
    DF.ctx.beginPath();
    DF.ctx.moveTo(8, 0);
    DF.ctx.lineTo(-6, -6);
    DF.ctx.lineTo(-2, 0);
    DF.ctx.lineTo(-6, 6);
    DF.ctx.closePath();
    DF.ctx.fill();

    // Wingtip sensor beacons
    DF.ctx.fillStyle = isBlue ? "#38bdf8" : "#f43f5e";
    DF.ctx.fillRect(-5, -6, 2, 1);
    DF.ctx.fillRect(-5, 5, 2, 1);

    // White-hot sensor core
    DF.ctx.fillStyle = "#ffffff";
    DF.ctx.fillRect(2, -1, 3, 2);
    DF.ctx.restore();
  }
}
