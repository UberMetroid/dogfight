// # Tactical Battlespace Dynamic Camera & Weapon-System Framing
//
// Logline: Dynamic auto-zoom and pan that scales wider and larger based on weapon systems in flight.
//
(function (global) {
  "use strict";

  var DF = global.DF || (global.DF = {});

  // Tactical World Dimensions (Expansive theater of operations)
  DF.worldWidth = 3600;
  DF.worldHeight = 1200;

  DF.camera = {
    x: 1800,
    y: 550,
    scale: 0.75,
    targetX: 1800,
    targetY: 550,
    targetScale: 0.75,
    minScale: 0.35,  // Zoom out to view entire theater (3600x1200)
    maxScale: 1.35,  // Zoom in for merged dogfight
    lerpRate: 0.055, // Smooth camera tracking rate
    isAutoZoom: true,
    userOverrideTimer: 0,

    bounds: { minX: 0, maxX: 3600, minY: 0, maxY: 1200 },

    screenToWorld: function (sx, sy) {
      var w = DF.width || 1440;
      var h = DF.height || 900;
      return {
        x: (sx - w * 0.5) / this.scale + this.x,
        y: (sy - h * 0.5) / this.scale + this.y
      };
    },

    worldToScreen: function (wx, wy) {
      var w = DF.width || 1440;
      var h = DF.height || 900;
      return {
        x: (wx - this.x) * this.scale + w * 0.5,
        y: (wy - this.y) * this.scale + h * 0.5
      };
    },

    onWheel: function (deltaY) {
      this.userOverrideTimer = 240; // 4 seconds before auto-zoom resumes
      var factor = deltaY > 0 ? 0.90 : 1.10;
      this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, this.targetScale * factor));
    },

    update: function (viewportW, viewportH) {
      if (!viewportW) viewportW = DF.width || 1440;
      if (!viewportH) viewportH = DF.height || 900;

      if (this.userOverrideTimer > 0) {
        this.userOverrideTimer--;
      }

      // Collect all tactical points of interest: active aircraft, missiles, bullets, tracked targets
      var points = [];

      // 1. Active Aircraft
      var activeJetCount = 0;
      if (DF.allJets) {
        for (var i = 0; i < DF.allJets.length; i++) {
          var j = DF.allJets[i];
          if (j.active && !j.isDying) {
            activeJetCount++;
            points.push({ x: j.x, y: j.y });
            // Lookahead lead point in flight direction
            var lead = Math.min(180, (j.speed || 4.8) * 14.0);
            points.push({ x: j.x + Math.cos(j.angle) * lead, y: j.y + Math.sin(j.angle) * lead });
          }
        }
      }

      // 2. Active Missiles in flight (Fox-1, Fox-2, Fox-3, SAMs)
      if (DF.missilesPool && DF.missilesPool.activeCount > 0) {
        for (var mi = 0; mi < DF.missilesPool.activeCount; mi++) {
          var mo = mi * 8;
          var mx = DF.missilesPool.buffer[mo];
          var my = DF.missilesPool.buffer[mo + 1];
          var mvx = DF.missilesPool.buffer[mo + 2];
          var mvy = DF.missilesPool.buffer[mo + 3];
          points.push({ x: mx, y: my });
          // Velocity projection for missile trajectory
          points.push({ x: mx + mvx * 12.0, y: my + mvy * 12.0 });
        }
      }

      // 3. Active Cannon Tracers
      if (DF.bulletsPool && DF.bulletsPool.activeCount > 0) {
        for (var bi = 0; bi < DF.bulletsPool.activeCount; bi += 3) {
          var bo = bi * 6;
          points.push({ x: DF.bulletsPool.buffer[bo], y: DF.bulletsPool.buffer[bo + 1] });
        }
      }

      if (this.userOverrideTimer > 0 && !this.isAutoZoom) {
        // User manual zoom active
        this.scale += (this.targetScale - this.scale) * this.lerpRate;
        this.x += (this.targetX - this.x) * this.lerpRate;
        this.y += (this.targetY - this.y) * this.lerpRate;
        return;
      }

      if (points.length === 0) {
        this.targetX = DF.worldWidth * 0.5;
        this.targetY = DF.worldHeight * 0.48;
        this.targetScale = 0.70;
      } else {
        var minX = Infinity, maxX = -Infinity;
        var minY = Infinity, maxY = -Infinity;

        for (var p = 0; p < points.length; p++) {
          var pt = points[p];
          if (pt.x < minX) minX = pt.x;
          if (pt.x > maxX) maxX = pt.x;
          if (pt.y < minY) minY = pt.y;
          if (pt.y > maxY) maxY = pt.y;
        }

        // Add generous tactical padding so weapons and aircraft have room
        var spanX = maxX - minX;
        var spanY = maxY - minY;
        var padX = Math.max(180, spanX * 0.20);
        var padY = Math.max(140, spanY * 0.20);

        minX -= padX;
        maxX += padX;
        minY -= padY;
        maxY += padY;

        // Minimum bounding box dimension to avoid excessive zoom on single aircraft
        var minBoxW = 920;
        var minBoxH = 580;
        if ((maxX - minX) < minBoxW) {
          var midX = (minX + maxX) * 0.5;
          minX = midX - minBoxW * 0.5;
          maxX = midX + minBoxW * 0.5;
        }
        if ((maxY - minY) < minBoxH) {
          var midY = (minY + maxY) * 0.5;
          minY = midY - minBoxH * 0.5;
          maxY = midY + minBoxH * 0.5;
        }

        this.bounds.minX = minX;
        this.bounds.maxX = maxX;
        this.bounds.minY = minY;
        this.bounds.maxY = maxY;

        var boxW = maxX - minX;
        var boxH = maxY - minY;

        var desiredScale = Math.min(viewportW / boxW, viewportH / boxH);
        this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, desiredScale));

        this.targetX = (minX + maxX) * 0.5;
        this.targetY = (minY + maxY) * 0.5;

        // Ensure camera center stays within reasonable world bounds
        var halfVisW = (viewportW * 0.5) / this.targetScale;
        var halfVisH = (viewportH * 0.5) / this.targetScale;
        var marginX = Math.min(halfVisW, 300);
        var marginY = Math.min(halfVisH, 200);
        this.targetX = Math.max(marginX, Math.min(DF.worldWidth - marginX, this.targetX));
        this.targetY = Math.max(marginY, Math.min(DF.worldHeight - marginY, this.targetY));
      }

      // Smooth interpolation (lerp)
      this.scale += (this.targetScale - this.scale) * this.lerpRate;
      this.x += (this.targetX - this.x) * this.lerpRate;
      this.y += (this.targetY - this.y) * this.lerpRate;
    },

    // Draw Tactical Camera HUD Overlay (Scale Ruler & Zoom Status)
    drawTacticalHud: function (ctx, viewportW, viewportH) {
      if (!ctx) return;
      ctx.save();

      // Tactical Zoom Badge (Bottom-Right, above domain box)
      var zoomStr = "SCALE: " + this.scale.toFixed(2) + "x";
      var zoomMode = (this.scale < 0.60) ? "THEATER WIDE (BVR)" : ((this.scale > 1.05) ? "MERGED DOGFIGHT" : "TACTICAL PATROL");
      
      // Calculate 10 Nautical Miles length in screen pixels (~12.5 world px = 1 NM)
      var nm10Px = Math.round(125 * this.scale);

      ctx.fillStyle = "rgba(10, 16, 28, 0.78)";
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1;
      
      var boxW = Math.max(nm10Px + 36, 175);
      var boxH = 46;
      var boxX = viewportW - boxW - 16;
      var boxY = viewportH - 128;

      ctx.fillRect(boxX, boxY, boxW, boxH);
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Label
      ctx.fillStyle = "#38bdf8";
      ctx.font = "8px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("DYNAMIC TACTICAL CAMERA", boxX + 8, boxY + 12);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(zoomStr + " // " + zoomMode, boxX + 8, boxY + 23);

      // Nautical Miles Scale Bar
      var barX = boxX + 8;
      var barY = boxY + 36;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Tick left
      ctx.moveTo(barX, barY - 4); ctx.lineTo(barX, barY);
      // Line
      ctx.lineTo(barX + nm10Px, barY);
      // Tick right
      ctx.lineTo(barX + nm10Px, barY - 4);
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "7px ui-monospace, monospace";
      ctx.fillText("10 NM", barX + (nm10Px / 2) - 10, barY - 3);

      ctx.restore();
    }
  };

  global.screenToWorld = function (sx, sy) { return DF.camera.screenToWorld(sx, sy); };
  global.worldToScreen = function (wx, wy) { return DF.camera.worldToScreen(wx, wy); };

})(typeof window !== "undefined" ? window : this);
