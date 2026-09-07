// # VFX particles
//
// Logline: Particle types draw.
//
function updateAndDrawVfxParticles(ctx, dt, height, colors) {
  var pool = (typeof globalVfxParticlePool !== "undefined" && globalVfxParticlePool) ? globalVfxParticlePool : null;
  if (!pool || pool.activeCount === 0) return;

  var h = typeof height === "number" ? height : (ctx && ctx.canvas ? ctx.canvas.height : 150);

  for (var i = pool.activeCount - 1; i >= 0; i--) {
    var off = i * 8;
    var pType = pool.buffer[off + 7];

    if (pType === 0) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 2] *= 0.92;
      pool.buffer[off + 3] *= 0.92;
      pool.buffer[off + 6] += 0.15;
    } else if (pType === 1) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 3] += 0.05;
      pool.buffer[off + 2] *= 0.97;
      pool.buffer[off + 3] *= 0.97;
    } else if (pType === 2) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 6] += 2.8;
    } else if (pType === 3) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 3] -= 0.02;
      pool.buffer[off + 2] *= 0.96;
      pool.buffer[off + 6] += 0.12;
    } else if (pType === 4) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 3] += 0.06;
      pool.buffer[off + 2] *= 0.96;
    } else if (pType === 5) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 3] += 0.22;
      pool.buffer[off + 2] *= 0.96;
    } else if (pType === 6) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 6] += 2.5;
    } else if (pType === 7) {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 3] -= 0.03;
      pool.buffer[off + 2] *= 0.95;
      pool.buffer[off + 6] += 0.15;
    } else if (pType === 8) {
      // Type 8: Water spray droplet (gravity arc)
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 3] += 0.20;
      pool.buffer[off + 2] *= 0.98;
      pool.buffer[off + 6] = Math.max(1.0, pool.buffer[off + 6] * 0.97);
    } else if (pType === 9) {
      // Type 9: Water surface ripple wave
      pool.buffer[off + 6] += 2.2;
    } else if (pType === 10) {
      // Type 10: Sub-surface cavitation bubble
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 2] *= 0.96;
      pool.buffer[off + 3] *= 0.98;
    } else {
      pool.buffer[off] += pool.buffer[off + 2];
      pool.buffer[off + 1] += pool.buffer[off + 3];
      pool.buffer[off + 2] *= 0.94;
      pool.buffer[off + 3] *= 0.94;
    }

    pool.buffer[off + 4]--;
    var life = pool.buffer[off + 4];
    var maxLife = pool.buffer[off + 5];
    var px = pool.buffer[off];
    var py = pool.buffer[off + 1];
    var pSize = pool.buffer[off + 6];

    var maxArenaX = (typeof DF !== "undefined" && DF.worldWidth) ? (DF.worldWidth + 300) : 3900;
    if (life <= 0 || px < -300 || px > maxArenaX || py > h + 80) {
      pool.free(i);
      continue;
    }

    if (ctx) {
      var t = Math.max(0, Math.min(1.0, life / (maxLife || 1.0)));

      if (pType === 0) {
        if (t > 0.65) {
          ctx.fillStyle = "#ffffff";
        } else if (t > 0.35) {
          ctx.fillStyle = "#ffb703";
        } else {
          ctx.fillStyle = "#ef233c";
        }
        ctx.fillRect(Math.floor(px - pSize * 0.5), Math.floor(py - pSize * 0.5), Math.ceil(pSize), Math.ceil(pSize));
      } else if (pType === 1) {
        ctx.fillStyle = (t > 0.5) ? "#ffffff" : "#ffd166";
        ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      } else if (pType === 2) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, " + (t * 0.85).toFixed(2) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (pType === 3) {
        ctx.fillStyle = typeof getAlphaColor === "function" ? getAlphaColor("panel", t * 0.45) : "rgba(40,40,40,0.45)";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (pType === 4) {
        ctx.fillStyle = t > 0.5 ? "#ffaa00" : "#ef233c";
        ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      } else if (pType === 5) {
        ctx.fillStyle = typeof getAlphaColor === "function" ? getAlphaColor("fg", t * 0.9) : "#ffffff";
        ctx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
      } else if (pType === 6) {
        ctx.save();
        ctx.strokeStyle = typeof getAlphaColor === "function" ? getAlphaColor("fg", t * 0.55) : "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, h - 2, pSize, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (pType === 7) {
        ctx.fillStyle = typeof getAlphaColor === "function" ? getAlphaColor("panel", t * 0.55) : "rgba(40,40,40,0.55)";
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (pType === 8) {
        var wColor = (t > 0.6) ? "#ffffff" : ((t > 0.3) ? "#bae6fd" : "#38bdf8");
        ctx.fillStyle = wColor;
        ctx.fillRect(Math.floor(px), Math.floor(py), Math.ceil(pSize), Math.ceil(pSize));
      } else if (pType === 9) {
        ctx.save();
        ctx.strokeStyle = "rgba(56, 189, 248, " + (t * 0.75).toFixed(2) + ")";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        if (typeof ctx.ellipse === "function") {
          ctx.ellipse(px, py, pSize, pSize * 0.28, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      } else if (pType === 10) {
        ctx.save();
        ctx.strokeStyle = "rgba(224, 242, 254, " + (t * 0.65).toFixed(2) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, pSize * 0.7), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.fillStyle = typeof getAlphaColor === "function" ? getAlphaColor("fg", t * 0.85) : "#ffffff";
        ctx.fillRect(Math.floor(px - pSize * 0.5), Math.floor(py - pSize * 0.5), pSize, pSize);
      }
    }
  }
}
