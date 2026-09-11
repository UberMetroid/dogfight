// # Weapons gens 5-6 — West vs East, jets only
//
// Logline: Laser CIWS, DEW (Gen 6 NGAD), and high-BVR missile evaluation.
//          Gen 7 swarm weapons and strategic-bomber-targeting are out.
//
function evaluateJetWeapons(jet, targetEnemy, colors) {
  if (!jet.active || jet.isDying || jet.isStalled) return;
  if (!targetEnemy || !targetEnemy.active || targetEnemy.isDying) return;

  var dx = targetEnemy.x - jet.x;
  var dy = targetEnemy.y - jet.y;
  var dist = Math.hypot(dx, dy);
  var bearing = Math.atan2(dy, dx);
  var da = Math.abs(jet.angle - bearing);
  while (da > Math.PI) da = Math.abs(da - Math.PI * 2);

  var shooterTeamCode = (jet.team === "west") ? 0 : 1;

  // Gen 6: NGAD-style DEW laser CIWS, plus CCA wingman forward-firing
  if (jet.gen === 6) {
    // CCA wingman nose-mounted laser (firing forward when on-target)
    if (jet.ccaDeployed && jet.cca1 && jet.cca1.active) {
      var ccaDx = targetEnemy.x - jet.cca1.x;
      var ccaDy = targetEnemy.y - jet.cca1.y;
      var ccaDist = Math.hypot(ccaDx, ccaDy);
      var ccaBearing = Math.atan2(ccaDy, ccaDx);
      var ccaDa = Math.abs(jet.cca1.angle - ccaBearing);
      while (ccaDa > Math.PI) ccaDa = Math.abs(ccaDa - Math.PI * 2);
      if (ccaDa < 0.5 && ccaDist < 200 && (jet.cca1.laserCooldown || 0) <= 0) {
        jet.cca1.laserCooldown = 6;
        applyAirframeDamage(targetEnemy, 8.0, jet, "CCA_LASER");
        DF.ctx.save();
        DF.ctx.strokeStyle = "rgba(56,189,248,0.75)";
        DF.ctx.lineWidth = 1.6;
        DF.ctx.beginPath();
        DF.ctx.moveTo(jet.cca1.x, jet.cca1.y);
        DF.ctx.lineTo(targetEnemy.x, targetEnemy.y);
        DF.ctx.stroke();
        DF.ctx.restore();
      }
    }
    // Gen 6 main laser (NGAD forward-firing DEW)
    if (da < 0.6 && dist < 280 && (jet.laserCooldown || 0) <= 0) {
      jet.laserCooldown = 14;
      DF.ctx.save();
      DF.ctx.strokeStyle = colors.accent || "rgba(56,189,248,0.85)";
      DF.ctx.lineWidth = 2.2;
      DF.ctx.beginPath();
      DF.ctx.moveTo(jet.x, jet.y);
      DF.ctx.lineTo(targetEnemy.x, targetEnemy.y);
      DF.ctx.stroke();
      DF.ctx.strokeStyle = "#ffffff";
      DF.ctx.lineWidth = 1.0;
      DF.ctx.beginPath();
      DF.ctx.moveTo(jet.x, jet.y);
      DF.ctx.lineTo(targetEnemy.x, targetEnemy.y);
      DF.ctx.stroke();
      DF.ctx.restore();
      var lethalG6 = applyAirframeDamage(targetEnemy, 25.0, jet, "DEW_LASER");
      if (lethalG6) {
        dfRadio(jet.callsign + ": DEW LASER SPLASH ON " + targetEnemy.callsign);
      }
    }
  }

  // Lower-tier jet weapons (guns + missiles) for any gen
  evaluateKineticWeapons(jet, targetEnemy, colors);
}
