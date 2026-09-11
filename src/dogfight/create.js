// # Create jet — West vs East, 6 generations, jets only
//
// Logline: Picks a jet spec from AIRCRAFT_SPECS[gen][team] by slot index.
//          Gen 6 jets (NGAD West, Su-57M East) carry 2 CCA loyal wingman drones.
//
function setupJetCallsignAndVariant(jet, chosenGen, team, slotIdx) {
  var isWest = (team === "west");
  var numSlot = typeof slotIdx === "number" ? slotIdx : 0;
  var isLead = (numSlot % 2 === 0);
  jet.isLead = isLead;

  var teamList = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[chosenGen] && AIRCRAFT_SPECS[chosenGen][team]) ? AIRCRAFT_SPECS[chosenGen][team] : null;
  var jetIdx = teamList ? (numSlot % teamList.length) : 0;
  var spec = teamList ? teamList[jetIdx] : null;

  if (spec) {
    jet.jetId = spec.id;
    jet.jetName = spec.name;
    jet.jetMissile = spec.primaryMissile;
    // Callsign shape: <JET CALLSIGN> <team-slot+1> ; e.g. "VIPER 1", "VIPER 3", "SABRE 1", "FELON 1"
    var slotNum = Math.floor(numSlot / (teamList.length || 1)) + 1;
    jet.callsign = spec.callsign + " " + slotNum;
    jet.variant = (spec.id || "STD").toUpperCase();
  } else {
    jet.jetId = "unknown";
    jet.jetName = "UNKNOWN";
    jet.jetMissile = "NONE";
    jet.callsign = (isWest ? "WEST " : "EAST ") + (numSlot + 1);
    jet.variant = "STD";
  }

  // Variable-geometry wings: F-14 Tomcat (Gen 4 West) and MiG-23 Flogger (Gen 4 East) sweep in combat
  jet.wingSweep = (chosenGen === 4 && spec && (spec.id === "f14" || spec.id === "mig23")) ? 0.25 : 0.0;
}

function pickJetSpec(gen, team, slotIdx) {
  var teamList = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[gen] && AIRCRAFT_SPECS[gen][team]) ? AIRCRAFT_SPECS[gen][team] : null;
  if (!teamList || teamList.length === 0) {
    // Fallback to gen 4 same side
    var fb = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[4] && AIRCRAFT_SPECS[4][team]) ? AIRCRAFT_SPECS[4][team][0] : null;
    return fb || { baseSpeed: 4.8, mass: 1.0, rcsClean: 1.0, rcs: 1.0, missileCapacity: 0, radarBaseline: 400, sensorReach: 400, oodaLatencyFrames: 12, hasFlares: false, hasChaff: false, callsign: (team === "west" ? "WEST" : "EAST"), id: "fallback", name: "FALLBACK", primaryMissile: "NONE" };
  }
  var idx = (typeof slotIdx === "number") ? (slotIdx % teamList.length) : 0;
  return teamList[idx];
}

function createJet(x, y, angle, gen, slotIdx, team) {
  var actualTeam = (team === "east") ? "east" : "west";
  var mask = (actualTeam === "east")
    ? (typeof activeGensEast !== "undefined" ? activeGensEast : activeGens)
    : (typeof activeGensWest !== "undefined" ? activeGensWest : activeGens);
  var chosenGen = (gen && mask[gen]) ? gen : (typeof getRandomActiveGen === "function" ? getRandomActiveGen(actualTeam, gen) : (mask[4] ? 4 : 1));
  if (!chosenGen) chosenGen = 4;

  var numSlot = typeof slotIdx === "number" ? slotIdx : 0;
  var isLead = (numSlot === 0);
  var isHero = (actualTeam === "west" && isLead);

  var spec = pickJetSpec(chosenGen, actualTeam, numSlot);
  var baseSpeed = spec ? (spec.baseSpeed || 4.8) : 4.8;

  var jet = {
    x: x,
    y: y,
    gen: chosenGen,
    team: actualTeam,
    slotIdx: numSlot,
    isLead: Boolean(isLead),
    isHero: Boolean(isHero),
    variant: "STD",
    jetId: spec && spec.id ? spec.id : "fallback",
    jetName: spec && spec.name ? spec.name : "FALLBACK",
    jetMissile: spec && spec.primaryMissile ? spec.primaryMissile : "NONE",
    callsign: "",
    speed: baseSpeed,
    baseSpeed: baseSpeed,
    prevSpeed: baseSpeed,
    hp: 100.0,
    maxHp: 100.0,
    damageState: "NOMINAL",
    lastDamagedBy: "",
    damageSmokeTimer: 0,
    damageSparksTimer: 0,
    angle: angle,
    targetAngle: angle,
    turnRate: 0,
    gForce: 1.0,
    energy: 100,
    energyHeight: 0,
    ps: 0,
    isStalled: false,
    stallBuffet: 0,
    mode: "PATROL",
    modeTimer: 0,
    isTailChasing: false,
    tailChaseTimer: 0,
    targetJet: null,
    wingmanJet: null,
    afterburner: true,
    flareCooldown: 0,
    chaffCooldown: 0,
    gunCooldown: 0,
    missileCooldown: chosenGen === 1 ? 999999 : (10 + Math.floor(Math.random() * 11)),
    missileCapacity: (spec && typeof spec.missileCapacity === "number") ? spec.missileCapacity : 0,
    missilesRemaining: (spec && typeof spec.missileCapacity === "number") ? spec.missileCapacity : 0,
    isWinchester: (spec && spec.missileCapacity === 0),
    fuelMax: 100.0,
    fuel: 100.0,
    isBingoFuel: false,
    laserCooldown: 0,
    triLaserCooldown: 0,
    superLaserCooldown: 0,
    superLaserPulse: 0,
    singularityBeamActive: false,
    swarmMode: "FORM_UP",
    swarmTimer: 0,
    trapTimer: 0,
    shieldPulse: 0,
    shieldPulse: 0,
    bayDoorTimer: 0,
    rcs: spec ? (spec.rcsClean || spec.rcs || 1.0) : 1.0,
    sensors: {
      radarLocked: false,
      lockQuality: 0,
      inRwrWarning: false,
      detectedThreats: []
    },
    wingSweep: (chosenGen === 4 && spec && (spec.id === "f14" || spec.id === "mig23")) ? 0.25 : 0.0,
    // CCA loyal wingman drones (Gen 6 West NGAD and Gen 6 East Su-57M)
    ccaDeployed: (chosenGen === 6),
    cca1: { x: x + Math.cos(angle) * 55 - Math.sin(angle) * 65, y: y + Math.sin(angle) * 55 + Math.cos(angle) * 65, angle: angle, speed: baseSpeed, active: (chosenGen === 6), laserCooldown: 0 },
    cca2: { x: x + Math.cos(angle) * 55 + Math.sin(angle) * 65, y: y + Math.sin(angle) * 55 - Math.cos(angle) * 65, angle: angle, speed: baseSpeed, active: (chosenGen === 6), laserCooldown: 0 },
    // Gen 7 SWARM: 3-drone autonomous swarm
    swarmMode: "FORM_UP",
    swarmTimer: 0,
    trapTimer: 0,
    shieldPulse: 0,
    singularityBeamActive: false,
    drone1: { x: x + Math.cos(angle) * 16, y: y + Math.sin(angle) * 16, targetX: 16, targetY: 0, angle: angle, speed: baseSpeed },
    drone2: { x: x - Math.cos(angle) * 6 - Math.sin(angle) * 14, y: y - Math.sin(angle) * 6 + Math.cos(angle) * 14, targetX: -6, targetY: -14, angle: angle, speed: baseSpeed },
    drone3: { x: x - Math.cos(angle) * 6 + Math.sin(angle) * 14, y: y - Math.sin(angle) * 6 - Math.cos(angle) * 14, targetX: -6, targetY: 14, angle: angle, speed: baseSpeed },
    isDying: false,
    deathTimer: 0,
    fadeAlpha: 1.0,
    scrambleTimer: 0,
    contrail: typeof ContrailRingBufferF32 !== "undefined" ? new ContrailRingBufferF32(32, 4) : null,
    wingVapor: typeof ContrailRingBufferF32 !== "undefined" ? new ContrailRingBufferF32(32, 4) : null,
    kills: 0,
    isAce: false,
    turnAgilityBonus: 1.0,
    active: true
  };

  setupJetCallsignAndVariant(jet, chosenGen, actualTeam, numSlot);
  return jet;
}
