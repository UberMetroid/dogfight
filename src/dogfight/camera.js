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
    x: 180,          // west airbase x (where jets spawn)
    y: 700,          // mid-screen at the new scale, runway visible in lower third
    scale: 0.95,     // close enough that jets are 15-20px on screen
    targetX: 180,
    targetY: 700,
    targetScale: 0.95,
    minScale: 0.32,  // bumped from 0.28; never zoom out past 0.32
    maxScale: 1.25,  // Zoom in for merged dogfight
    lerpRate: 0.055, // Smooth camera tracking rate
    isAutoZoom: true,
    userOverrideTimer: 0,
    // Warmup: hold the initial framing for the first 90 frames (~1.5s at 60fps)
    // so the user can see jets taking off before the camera decides to follow them.
    warmupFrames: 90,
    // Hard cap on the framing box width so the camera never zooms out to fit the
    // entire 3600-wide world. If jets span more than this, the camera frames the
    // closer cluster and ignores the far one (jets fly back into frame on their own).
    maxFrameWidth: 1800,

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

      // Decrement warmup counter (one-shot; never re-fires after it hits 0)
      if (this.warmupFrames && this.warmupFrames > 0) this.warmupFrames--;

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
              // Gen 7 SWARM: include 3 drones per swarm in camera framing
              if (j.gen === 7) {
                if (j.drone1) points.push({ x: j.drone1.x, y: j.drone1.y });
                if (j.drone2) points.push({ x: j.drone2.x, y: j.drone2.y });
                if (j.drone3) points.push({ x: j.drone3.x, y: j.drone3.y });
              }
            } else if ((j.deathTimer || 0) < 25) {
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

      if (this.userOverrideTimer > 0 && !this.isAutoZoom) {
        this.scale += (this.targetScale - this.scale) * this.lerpRate;
        this.x += (this.targetX - this.x) * this.lerpRate;
        this.y = floorY - (viewportH * 0.5) / this.scale;
        return;
      }

      // WARMUP: during the first ~1.5s, hold the camera at its initial scale
      // so the user sees the west airbase clearly. Skip auto-zoom entirely.
      if ((this.warmupFrames || 0) > 0 && points.length === 0) {
        this.targetX = 180;
        this.targetY = 700;
        this.targetScale = 0.95;
        this.scale += (this.targetScale - this.scale) * this.lerpRate;
        this.x += (this.targetX - this.x) * this.lerpRate;
        this.y = floorY - (viewportH * 0.5) / this.scale;
        return;
      }

      if (points.length === 0) {
        // No active jets — slowly return to initial framing on the west airbase.
        this.targetX = 180;
        this.targetY = 700;
        this.targetScale = 0.95;
      } else {
        // Densest-cluster centroid camera targeting.
        // Buckets jet/missile/bullet X positions into 600-unit-wide buckets,
        // picks the bucket with the most points, and centers the camera on
        // that bucket's centroid. With jets at both world edges, this avoids
        // the broken midpoint-of-extremes which lands on empty ocean.
        var BUCKET_W = 600;
        var worldMaxX = 3600;
        var bucketCount = Math.ceil(worldMaxX / BUCKET_W) + 1;  // 7 buckets
        var bucketCounts = new Array(bucketCount).fill(0);
        var bucketSumX = new Array(bucketCount).fill(0);
        for (var bi = 0; bi < points.length; bi++) {
          var px = points[bi].x;
          if (px < 0) px = 0;
          if (px > worldMaxX) px = worldMaxX;
          var b = Math.floor(px / BUCKET_W);
          if (b < 0) b = 0;
          if (b >= bucketCount) b = bucketCount - 1;
          bucketCounts[b]++;
          bucketSumX[b] += px;
        }
        // Find densest bucket (tie-break: prefer bucket closer to current camera x)
        var bestBucket = 0;
        var bestCount = -1;
        for (var bc = 0; bc < bucketCount; bc++) {
          if (bucketCounts[bc] > bestCount) {
            bestCount = bucketCounts[bc];
            bestBucket = bc;
          } else if (bucketCounts[bc] === bestCount && bestCount > 0) {
            var centroidB = bucketSumX[bc] / bucketCounts[bc];
            var centroidCur = bucketSumX[bestBucket] / bucketCounts[bestBucket];
            if (Math.abs(centroidB - this.x) < Math.abs(centroidCur - this.x)) {
              bestBucket = bc;
            }
          }
        }
        var minY = Infinity, maxY = -Infinity;
        for (var py = 0; py < points.length; py++) {
          if (points[py].y < minY) minY = points[py].y;
          if (points[py].y > maxY) maxY = points[py].y;
        }
        // Span for scale: use the densest bucket's own extent (so the camera
        // frames that cluster, not the whole world)
        var spanX;
        if (bestCount > 0) {
          var bMinX = bestBucket * BUCKET_W;
          var bMaxX = bMinX + BUCKET_W;
          // Extend the span to include all points in the densest bucket's column
          for (var spi = 0; spi < points.length; spi++) {
            var spx = points[spi].x;
            if (spx >= bMinX && spx <= bMaxX) {
              if (spx < bMinX) bMinX = spx;  // (won't happen given the >=)
              if (spx > bMaxX) bMaxX = spx;  // (won't happen given the <=)
            }
          }
          spanX = bMaxX - bMinX;
        } else {
          spanX = 0;
        }

        // Vertical: keep ground at bottom, but allow sky to occupy more screen
        var topMargin = Math.max(80, viewportH * 0.10);
        var targetMinY = Math.max(10, minY - 60);
        var verticalSpan = Math.max(280, floorY - targetMinY);
        var requiredScaleY = (viewportH - topMargin) / verticalSpan;

        // Horizontal: scale based on the densest-cluster span, capped at 1800
        var padX = Math.max(140, spanX * 0.20);
        var rawBoxW = spanX + padX * 2;
        var maxFW = this.maxFrameWidth || 1800;
        var boxW = Math.max(800, Math.min(maxFW, rawBoxW));
        var requiredScaleX = viewportW / boxW;

        var desiredScale = Math.min(requiredScaleX, requiredScaleY);
        this.targetScale = Math.max(this.minScale, Math.min(this.maxScale, desiredScale));

        // Center on the densest-cluster centroid
        if (bestCount > 0) {
          this.targetX = bucketSumX[bestBucket] / bucketCounts[bestBucket];
        } else {
          this.targetX = 180;  // empty fallback
        }

        // Y anchor: bottom-anchored so the ground is always visible
        this.targetY = floorY - (viewportH * 0.5) / this.targetScale;

        this.bounds.minX = minX;
        this.bounds.maxX = maxX;
        this.bounds.minY = minY;
        this.bounds.maxY = maxY;
      }

      // Smooth camera interpolation
      this.scale += (this.targetScale - this.scale) * this.lerpRate;
      this.x += (this.targetX - this.x) * this.lerpRate;

      // Absolute invariant: strictly anchor the bottom of the screen to the floor/sea bed.
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
