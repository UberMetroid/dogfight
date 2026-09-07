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
    minScale: 0.28,  // Zoom out to view entire theater (up to 100k ft near-space and wide BVR arena)
    maxScale: 1.25,  // Zoom in for merged dogfight
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
      var floorY = DF.worldHeight || 1200;

      if (this.userOverrideTimer > 0) {
        this.userOverrideTimer--;
      }

      // Collect all tactical points of interest: active aircraft, missiles, bullets
      var points = [];

      // 1. Active Aircraft
      var activeJetCount = 0;
      if (DF.allJets) {
        for (var i = 0; i < DF.allJets.length; i++) {
          var j = DF.allJets[i];
          if (j.active) {
            if (!j.isDying) {
              activeJetCount++;
              points.push({ x: j.x, y: j.y });
              // Lookahead lead point in flight direction
              var lead = Math.min(180, (j.speed || 4.8) * 14.0);
              points.push({ x: j.x + Math.cos(j.angle) * lead, y: j.y + Math.sin(j.angle) * lead });
              // Include active Gen 6 CCA loyal wingmen in camera framing
              if (j.gen === 6) {
                if (j.cca1 && j.cca1.active) points.push({ x: j.cca1.x, y: j.cca1.y });
                if (j.cca2 && j.cca2.active) points.push({ x: j.cca2.x, y: j.cca2.y });
              }
            } else if ((j.deathTimer || 0) < 25) {
              // Frame dying aircraft briefly during splash/impact explosion
              points.push({ x: j.x, y: j.y });
            }
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
          points.push({ x: mx + mvx * 8.0, y: my + mvy * 8.0 });
        }
      }

      // 3. Active Cannon Tracers
      if (DF.bulletsPool && DF.bulletsPool.activeCount > 0) {
        for (var bi = 0; bi < DF.bulletsPool.activeCount; bi += 3) {
          var bo = bi * 6;
          points.push({ x: DF.bulletsPool.buffer[bo], y: DF.bulletsPool.buffer[bo + 1] });
        }
      }

      // 4. Strategic Bomber & Active Bomb Detonations
      if (typeof StrategicBomberSystem !== "undefined") {
        if (StrategicBomberSystem.activeBomber) {
          var sb = StrategicBomberSystem.activeBomber;
          points.push({ x: sb.x, y: sb.y });
          points.push({ x: sb.x + Math.cos(sb.angle) * 120, y: sb.y });
        }
        for (var bmb = 0; bmb < StrategicBomberSystem.bombs.length; bmb++) {
          points.push({ x: StrategicBomberSystem.bombs[bmb].x, y: StrategicBomberSystem.bombs[bmb].y });
        }
        for (var dtn = 0; dtn < StrategicBomberSystem.detonations.length; dtn++) {
          var dt = StrategicBomberSystem.detonations[dtn];
          points.push({ x: dt.x, y: dt.y });
          if (dt.type === "NUKE") {
            points.push({ x: dt.x, y: dt.y - (dt.stemHeight || 100) });
          }
        }
      }

      if (this.userOverrideTimer > 0 && !this.isAutoZoom) {
        // User manual zoom active: strictly anchor bottom to floorY so ground/sea never drops off screen
        this.scale += (this.targetScale - this.scale) * this.lerpRate;
        this.x += (this.targetX - this.x) * this.lerpRate;
        this.y = floorY - (viewportH * 0.5) / this.scale;
        return;
      }

      if (points.length === 0) {
        this.targetX = (DF.worldWidth || 3600) * 0.5;
        this.targetScale = 0.70;
        this.targetY = floorY - (viewportH * 0.5) / this.targetScale;
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

        // Vertical: Expand UP into sky/space so highest object is safely below the top header
        var topMargin = Math.max(90, viewportH * 0.11);
        var targetMinY = Math.max(10, minY - 60);
        var verticalSpan = Math.max(280, floorY - targetMinY);
        var requiredScaleY = (viewportH - topMargin) / verticalSpan;

        // Horizontal: Expand LEFT and RIGHT to frame all combatants with generous margins
        var spanX = maxX - minX;
        var padX = Math.max(180, spanX * 0.18);
        var boxW = Math.max(920, spanX + padX * 2);
        var requiredScaleX = viewportW / boxW;

        // Scale is constrained by both vertical ceiling and horizontal arena span
        var desiredScale = Math.min(requiredScaleX, requiredScaleY);
        this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, desiredScale));

        // Center camera horizontally on the action
        this.targetX = (minX + maxX) * 0.5;

        // Target Y strictly anchors the ground/sea bottom to viewport bottom (no downward expansion)
        this.targetY = floorY - (viewportH * 0.5) / this.targetScale;

        this.bounds.minX = minX;
        this.bounds.maxX = maxX;
        this.bounds.minY = minY;
        this.bounds.maxY = maxY;
      }

      // Smooth camera interpolation
      this.scale += (this.targetScale - this.scale) * this.lerpRate;
      this.x += (this.targetX - this.x) * this.lerpRate;

      // Absolute invariant: strictly anchor the bottom of the screen to the floor/sea bed at current scale.
      // Ground and sea ALWAYS stay on screen, expanding UP when zooming out, never downwards.
      this.y = floorY - (viewportH * 0.5) / this.scale;
    },

    // Draw Tactical Camera HUD Overlay (clean per user request: only header boxes remain)
    drawTacticalHud: function (ctx, viewportW, viewportH) {
      // Kept clean: only red and blue force boxes in the header
      return;
    }
  };

  global.screenToWorld = function (sx, sy) { return DF.camera.screenToWorld(sx, sy); };
  global.worldToScreen = function (wx, wy) { return DF.camera.worldToScreen(wx, wy); };

})(typeof window !== "undefined" ? window : this);
