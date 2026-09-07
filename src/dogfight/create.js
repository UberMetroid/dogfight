// # Create jet
//
// Logline: Callsign, variant, pool object.
//
function setupJetCallsignAndVariant(jet, chosenGen, team, slotIdx) {
  var isBlue = (team === "blue");
  var numSlot = typeof slotIdx === "number" ? slotIdx : 0;
  var isLead = (numSlot % 2 === 0);
  jet.isLead = isLead;
  var isF16 = false;
  var callsign = "";

  if (isBlue) {
    if (chosenGen === 1) callsign = isLead ? "SABRE 1-1" : "SABRE 1-2";
    else if (chosenGen === 2) callsign = isLead ? "STARFIGHTER 1-1" : "STARFIGHTER 1-2";
    else if (chosenGen === 3) callsign = isLead ? "PHANTOM 1-1" : "PHANTOM 1-2";
    else if (chosenGen === 4) {
      if (isLead) {
        isF16 = false;
        callsign = "TOMCAT 1-1";
      } else {
        isF16 = true;
        callsign = "VIPER 1-2";
      }
    } else if (chosenGen === 5) callsign = isLead ? "RAPTOR 1-1" : "LIGHTNING 1-2";
    else if (chosenGen === 6) callsign = isLead ? "NGAD 1-1" : "CCA 1-2";
    else if (chosenGen === 7) callsign = isLead ? "SWARM ALPHA" : "SWARM BRAVO";
  } else {
    if (chosenGen === 1) callsign = isLead ? "MiG-15 1-1" : "MiG-15 1-2";
    else if (chosenGen === 2) callsign = isLead ? "MiG-21 1-1" : "MiG-21 1-2";
    else if (chosenGen === 3) callsign = isLead ? "MiG-23 1-1" : "MiG-23 1-2";
    else if (chosenGen === 4) {
      isF16 = false;
      callsign = isLead ? "FLANKER 1-1" : "FULCRUM 1-2";
    } else if (chosenGen === 5) callsign = isLead ? "FELON 1-1" : "CHECKMATE 1-2";
    else if (chosenGen === 6) callsign = isLead ? "H-20 1-1" : "CCA RED 1-2";
    else if (chosenGen === 7) callsign = isLead ? "SWARM CHARLIE" : "SWARM DELTA";
  }

  jet.callsign = callsign || ((isBlue ? "BLUE " : "RED ") + (numSlot + 1));
  jet.variant = isF16 ? "F16" : (chosenGen === 4 && isLead ? "F14" : "STD");
  jet.wingSweep = (chosenGen === 4 && !isF16 ? 0.25 : 0.0);
}

function createJet(x, y, angle, gen, slotIdx, team) {
  var actualTeam = (team === "red") ? "red" : "blue";
  var mask = (actualTeam === "red") ? (typeof activeGensRed !== "undefined" ? activeGensRed : activeGens) : (typeof activeGensBlue !== "undefined" ? activeGensBlue : activeGens);
  var chosenGen = (gen && mask[gen]) ? gen : (typeof getRandomActiveGen === "function" ? getRandomActiveGen(actualTeam, gen) : (mask[4] ? 4 : 1));
  if (!chosenGen) chosenGen = 4;
  var spec = (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS[chosenGen]) ? AIRCRAFT_SPECS[chosenGen] : (typeof AIRCRAFT_SPECS !== "undefined" && AIRCRAFT_SPECS ? AIRCRAFT_SPECS[4] : { baseSpeed: 4.8 });
  var baseSpeed = spec ? (spec.baseSpeed || 4.8) : 4.8;

  var numSlot = typeof slotIdx === "number" ? slotIdx : 0;
  var isLead = (numSlot === 0);
  var isHero = (actualTeam === "blue" && isLead);

  var jet = {
    x: x,
    y: y,
    gen: chosenGen,
    team: actualTeam,
    slotIdx: numSlot,
    isLead: Boolean(isLead),
    isHero: Boolean(isHero),
    variant: "STD",
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
    missileCapacity: (spec && typeof spec.missileCapacity === "number") ? spec.missileCapacity : (chosenGen === 1 || chosenGen === 7 ? 0 : 6),
    missilesRemaining: (spec && typeof spec.missileCapacity === "number") ? spec.missileCapacity : (chosenGen === 1 || chosenGen === 7 ? 0 : 6),
    isWinchester: (chosenGen === 1),
    fuelMax: 100.0,
    fuel: 100.0,
    isBingoFuel: false,
    laserCooldown: 0,
    triLaserCooldown: 0,
    superLaserCooldown: chosenGen === 7 ? (isHero ? 60 : (60 + Math.floor(Math.random() * 60))) : 0,
    superLaserPulse: 0,
    shieldPulse: 0,
    bayDoorTimer: 0,
    rcs: spec ? (spec.rcsClean || spec.rcs || 1.0) : 1.0,
    sensors: {
      radarLocked: false,
      lockQuality: 0,
      inRwrWarning: false,
      detectedThreats: []
    },
    wingSweep: (chosenGen === 4 ? 0.25 : 0.0),
    ccaDeployed: (chosenGen === 6),
    cca1: { x: x + Math.cos(angle) * 55 - Math.sin(angle) * 65, y: y + Math.sin(angle) * 55 + Math.cos(angle) * 65, angle: angle, speed: 6.0, active: (chosenGen === 6), laserCooldown: 0 },
    cca2: { x: x + Math.cos(angle) * 55 + Math.sin(angle) * 65, y: y + Math.sin(angle) * 55 - Math.cos(angle) * 65, angle: angle, speed: 6.0, active: (chosenGen === 6), laserCooldown: 0 },
    drone1: { x: 16, y: 0, targetX: 16, targetY: 0, worldX: x + Math.cos(angle) * 16, worldY: y + Math.sin(angle) * 16 },
    drone2: { x: -6, y: -14, targetX: -6, targetY: -14, worldX: x + Math.cos(angle) * -6 - Math.sin(angle) * -14, worldY: y + Math.sin(angle) * -6 + Math.cos(angle) * -14 },
    drone3: { x: -6, y: 14, targetX: -6, targetY: 14, worldX: x + Math.cos(angle) * -6 - Math.sin(angle) * 14, worldY: y + Math.sin(angle) * -6 + Math.cos(angle) * 14 },
    swarmMode: "FLANK",
    swarmTimer: Math.floor(Math.random() * 1000),
    trapTimer: 0,
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
