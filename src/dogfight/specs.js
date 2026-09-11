// # Aircraft specs — West vs East, 6 generations, jets only
//
// Logline: Per-gen per-side array of historically accurate jet specs.
//          Gen 6 West (NGAD) carries 2 CCA loyal wingman drones; see create.js.
//          Gen 6 East is Su-57M (Russia has no operational 6th-gen).
//          Gen 7 swarm / strategic bombers / orbital weapons are out.
//
var SERVICE_CEILINGS = { 1: 45000, 2: 55000, 3: 58000, 4: 60000, 5: 65000, 6: 75000 };
var CRUISE_ALTITUDES = { 1: 22000, 2: 36000, 3: 42000, 4: 48000, 5: 60000, 6: 70000 };
var RESPAWN_CEILINGS = { 1: 25000, 2: 36000, 3: 42000, 4: 48000, 5: 60000, 6: 70000 };
var V_CORNER = 4.8;

var AIRCRAFT_SPECS = {
  1: {
    west: [
      { id: "f86",        callsign: "SABRE",     name: "F-86 SABRE",        year: 1947, mass: 1.00, baseSpeed: 3.80, maxSpeed: 4.80, thrustDry: 0.038, thrustAB: 0.045, cd0: 0.0020, kInduced: 1.60, maxTurnRate: 0.140, rcs: 1.00, rcsClean: 1.00, rcsBloom: 1.00, radarBaseline: 400,  sensorReach: 400,  oodaLatencyFrames: 24, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" },
      { id: "f86d",       callsign: "SABRE-DOG", name: "F-86D SABRE DOG",   year: 1949, mass: 1.05, baseSpeed: 3.85, maxSpeed: 4.85, thrustDry: 0.038, thrustAB: 0.045, cd0: 0.0020, kInduced: 1.62, maxTurnRate: 0.140, rcs: 1.05, rcsClean: 1.05, rcsBloom: 1.05, radarBaseline: 450,  sensorReach: 450,  oodaLatencyFrames: 24, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" }
    ],
    east: [
      { id: "mig15",      callsign: "FAGOT",     name: "MiG-15 FAGOT",      year: 1949, mass: 1.00, baseSpeed: 3.85, maxSpeed: 4.85, thrustDry: 0.038, thrustAB: 0.045, cd0: 0.0020, kInduced: 1.60, maxTurnRate: 0.140, rcs: 1.00, rcsClean: 1.00, rcsBloom: 1.00, radarBaseline: 350,  sensorReach: 350,  oodaLatencyFrames: 24, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" },
      { id: "mig17",      callsign: "FRESCO",    name: "MiG-17 FRESCO",     year: 1951, mass: 1.05, baseSpeed: 3.95, maxSpeed: 4.95, thrustDry: 0.040, thrustAB: 0.048, cd0: 0.0020, kInduced: 1.58, maxTurnRate: 0.150, rcs: 1.00, rcsClean: 1.00, rcsBloom: 1.00, radarBaseline: 360,  sensorReach: 360,  oodaLatencyFrames: 24, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" }
    ]
  },
  2: {
    west: [
      { id: "f100",       callsign: "SUPER-SABRE", name: "F-100 SUPER SABRE", year: 1954, mass: 1.30, baseSpeed: 5.80, maxSpeed: 7.60, thrustDry: 0.045, thrustAB: 0.135, cd0: 0.0016, kInduced: 1.45, maxTurnRate: 0.155, rcs: 1.10, rcsClean: 1.10, rcsBloom: 1.10, radarBaseline: 600,  sensorReach: 600,  oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" },
      { id: "f104",       callsign: "STARFIGHTER", name: "F-104 STARFIGHTER", year: 1958, mass: 1.20, baseSpeed: 6.20, maxSpeed: 7.80, thrustDry: 0.050, thrustAB: 0.150, cd0: 0.0014, kInduced: 1.40, maxTurnRate: 0.150, rcs: 0.95, rcsClean: 0.95, rcsBloom: 0.95, radarBaseline: 580,  sensorReach: 580,  oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 2, primaryMissile: "AIM-9B SIDEWINDER" },
      { id: "f105",       callsign: "THUNDERCHIEF", name: "F-105 THUNDERCHIEF", year: 1958, mass: 1.50, baseSpeed: 5.60, maxSpeed: 7.40, thrustDry: 0.045, thrustAB: 0.130, cd0: 0.0018, kInduced: 1.50, maxTurnRate: 0.150, rcs: 1.30, rcsClean: 1.30, rcsBloom: 1.30, radarBaseline: 600,  sensorReach: 600,  oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" }
    ],
    east: [
      { id: "mig19",      callsign: "FARMER",    name: "MiG-19 FARMER",     year: 1955, mass: 1.25, baseSpeed: 5.80, maxSpeed: 7.40, thrustDry: 0.045, thrustAB: 0.130, cd0: 0.0016, kInduced: 1.45, maxTurnRate: 0.155, rcs: 1.10, rcsClean: 1.10, rcsBloom: 1.10, radarBaseline: 550,  sensorReach: 550,  oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" },
      { id: "mig21",      callsign: "FISHBED",   name: "MiG-21 FISHBED",    year: 1958, mass: 1.30, baseSpeed: 6.20, maxSpeed: 7.80, thrustDry: 0.050, thrustAB: 0.150, cd0: 0.0014, kInduced: 1.40, maxTurnRate: 0.150, rcs: 0.95, rcsClean: 0.95, rcsBloom: 0.95, radarBaseline: 600,  sensorReach: 600,  oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 2, primaryMissile: "K-13 ATOLL" },
      { id: "su7",        callsign: "FITTER",    name: "Su-7 FITTER",       year: 1959, mass: 1.40, baseSpeed: 5.60, maxSpeed: 7.20, thrustDry: 0.045, thrustAB: 0.130, cd0: 0.0018, kInduced: 1.50, maxTurnRate: 0.150, rcs: 1.20, rcsClean: 1.20, rcsBloom: 1.20, radarBaseline: 480,  sensorReach: 480,  oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 0, primaryMissile: "NONE" }
    ]
  },
  3: {
    west: [
      { id: "f4",         callsign: "PHANTOM",   name: "F-4 PHANTOM II",    year: 1960, mass: 1.80, baseSpeed: 4.80, maxSpeed: 7.20, thrustDry: 0.050, thrustAB: 0.115, cd0: 0.0022, kInduced: 1.25, maxTurnRate: 0.170, rcs: 1.50, rcsClean: 1.50, rcsBloom: 1.50, radarBaseline: 850,  sensorReach: 850,  oodaLatencyFrames: 12, hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "AIM-7E SPARROW (SARH) / AIM-9J" },
      { id: "f111",       callsign: "AARDVARK",  name: "F-111 AARDVARK",    year: 1967, mass: 2.10, baseSpeed: 5.20, maxSpeed: 7.20, thrustDry: 0.055, thrustAB: 0.130, cd0: 0.0020, kInduced: 1.30, maxTurnRate: 0.150, rcs: 1.80, rcsClean: 1.80, rcsBloom: 1.80, radarBaseline: 850,  sensorReach: 850,  oodaLatencyFrames: 12, hasFlares: true,  hasChaff: true,  missileCapacity: 0, primaryMissile: "NONE" },
      { id: "f8",         callsign: "CRUSADER",  name: "F-8 CRUSADER",      year: 1957, mass: 1.40, baseSpeed: 5.20, maxSpeed: 7.20, thrustDry: 0.045, thrustAB: 0.120, cd0: 0.0018, kInduced: 1.35, maxTurnRate: 0.180, rcs: 1.00, rcsClean: 1.00, rcsBloom: 1.00, radarBaseline: 700,  sensorReach: 700,  oodaLatencyFrames: 12, hasFlares: true,  hasChaff: false, missileCapacity: 4, primaryMissile: "AIM-9D SIDEWINDER" }
    ],
    east: [
      { id: "mig21bison", callsign: "FISHBED-J", name: "MiG-21PF FISHBED-J", year: 1962, mass: 1.30, baseSpeed: 5.80, maxSpeed: 7.50, thrustDry: 0.050, thrustAB: 0.140, cd0: 0.0014, kInduced: 1.40, maxTurnRate: 0.160, rcs: 0.95, rcsClean: 0.95, rcsBloom: 0.95, radarBaseline: 700,  sensorReach: 700,  oodaLatencyFrames: 12, hasFlares: true,  hasChaff: true,  missileCapacity: 4, primaryMissile: "R-3S ATOLL" },
      { id: "mig23",      callsign: "FLOGGER",   name: "MiG-23 FLOGGER",    year: 1970, mass: 1.80, baseSpeed: 4.80, maxSpeed: 7.20, thrustDry: 0.050, thrustAB: 0.115, cd0: 0.0022, kInduced: 1.25, maxTurnRate: 0.170, rcs: 1.50, rcsClean: 1.50, rcsBloom: 1.50, radarBaseline: 850,  sensorReach: 850,  oodaLatencyFrames: 12, hasFlares: true,  hasChaff: true,  missileCapacity: 4, primaryMissile: "R-23R APEX (SARH) / R-60" },
      { id: "mig25",      callsign: "FOXBAT",    name: "MiG-25 FOXBAT",     year: 1970, mass: 2.00, baseSpeed: 6.40, maxSpeed: 8.20, thrustDry: 0.060, thrustAB: 0.150, cd0: 0.0020, kInduced: 1.10, maxTurnRate: 0.130, rcs: 1.80, rcsClean: 1.80, rcsBloom: 1.80, radarBaseline: 1100, sensorReach: 1100, oodaLatencyFrames: 12, hasFlares: true,  hasChaff: true,  missileCapacity: 4, primaryMissile: "R-40R TOLSTOY (SARH) / R-60" }
    ]
  },
  4: {
    west: [
      { id: "f14",        callsign: "TOMCAT",    name: "F-14 TOMCAT",       year: 1974, mass: 2.40, baseSpeed: 5.40, maxSpeed: 7.40, thrustDry: 0.045, thrustAB: 0.115, cd0: 0.0018, kInduced: 0.85, maxTurnRate: 0.185, rcs: 1.40, rcsClean: 1.40, rcsBloom: 1.40, radarBaseline: 1300, sensorReach: 1300, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "AIM-54 PHOENIX (BVR) / AIM-9L" },
      { id: "f15",        callsign: "EAGLE",     name: "F-15 EAGLE",        year: 1976, mass: 2.20, baseSpeed: 5.60, maxSpeed: 7.50, thrustDry: 0.050, thrustAB: 0.120, cd0: 0.0018, kInduced: 0.85, maxTurnRate: 0.190, rcs: 1.30, rcsClean: 1.30, rcsBloom: 1.30, radarBaseline: 1200, sensorReach: 1200, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "AIM-120 AMRAAM / AIM-9L" },
      { id: "f16",        callsign: "VIPER",     name: "F-16 VIPER",        year: 1978, mass: 1.60, baseSpeed: 5.40, maxSpeed: 7.30, thrustDry: 0.045, thrustAB: 0.115, cd0: 0.0018, kInduced: 0.85, maxTurnRate: 0.195, rcs: 1.20, rcsClean: 1.20, rcsBloom: 1.20, radarBaseline: 1100, sensorReach: 1100, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "AIM-120 AMRAAM / AIM-9X" },
      { id: "fa18",       callsign: "HORNET",    name: "F/A-18 HORNET",     year: 1983, mass: 1.80, baseSpeed: 5.20, maxSpeed: 7.20, thrustDry: 0.045, thrustAB: 0.110, cd0: 0.0019, kInduced: 0.90, maxTurnRate: 0.190, rcs: 1.30, rcsClean: 1.30, rcsBloom: 1.30, radarBaseline: 1100, sensorReach: 1100, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "AIM-120 AMRAAM / AIM-9X" }
    ],
    east: [
      { id: "su27",       callsign: "FLANKER",   name: "Su-27 FLANKER",     year: 1985, mass: 2.30, baseSpeed: 5.40, maxSpeed: 7.40, thrustDry: 0.050, thrustAB: 0.120, cd0: 0.0018, kInduced: 0.85, maxTurnRate: 0.190, rcs: 1.30, rcsClean: 1.30, rcsBloom: 1.30, radarBaseline: 1200, sensorReach: 1200, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "R-27ER ALAMO (SARH) / R-73 ARCHER" },
      { id: "mig29",      callsign: "FULCRUM",   name: "MiG-29 FULCRUM",    year: 1982, mass: 1.80, baseSpeed: 5.40, maxSpeed: 7.30, thrustDry: 0.048, thrustAB: 0.115, cd0: 0.0018, kInduced: 0.88, maxTurnRate: 0.195, rcs: 1.20, rcsClean: 1.20, rcsBloom: 1.20, radarBaseline: 1100, sensorReach: 1100, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "R-77 ADDER / R-73 ARCHER" },
      { id: "mig31",      callsign: "FOXHOUND",  name: "MiG-31 FOXHOUND",   year: 1980, mass: 2.50, baseSpeed: 6.20, maxSpeed: 8.00, thrustDry: 0.055, thrustAB: 0.140, cd0: 0.0020, kInduced: 0.90, maxTurnRate: 0.150, rcs: 1.60, rcsClean: 1.60, rcsBloom: 1.60, radarBaseline: 1500, sensorReach: 1500, oodaLatencyFrames: 6,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "R-33 AMRAAMSKI (BVR) / R-40" }
    ]
  },
  5: {
    west: [
      { id: "f22",        callsign: "RAPTOR",    name: "F-22 RAPTOR",       year: 2005, mass: 1.90, baseSpeed: 6.20, maxSpeed: 7.80, thrustDry: 0.065, thrustAB: 0.125, cd0: 0.0014, kInduced: 0.65, maxTurnRate: 0.200, rcs: 0.0001, rcsClean: 0.0001, rcsBloom: 1.20, radarBaseline: 1400, sensorReach: 1400, oodaLatencyFrames: 2,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "AIM-120D AMRAAM (INTERNAL) / AIM-9X" },
      { id: "f35",        callsign: "LIGHTNING", name: "F-35 LIGHTNING II", year: 2015, mass: 1.70, baseSpeed: 5.80, maxSpeed: 7.40, thrustDry: 0.055, thrustAB: 0.115, cd0: 0.0015, kInduced: 0.70, maxTurnRate: 0.180, rcs: 0.0010, rcsClean: 0.0010, rcsBloom: 1.30, radarBaseline: 1300, sensorReach: 1300, oodaLatencyFrames: 2,  hasFlares: true,  hasChaff: true,  missileCapacity: 4, primaryMissile: "AIM-120 AMRAAM (INTERNAL) / AIM-9X" }
    ],
    east: [
      { id: "su57",       callsign: "FELON",     name: "Su-57 FELON",       year: 2020, mass: 1.85, baseSpeed: 6.00, maxSpeed: 7.60, thrustDry: 0.060, thrustAB: 0.120, cd0: 0.0015, kInduced: 0.70, maxTurnRate: 0.195, rcs: 0.1000, rcsClean: 0.1000, rcsBloom: 1.40, radarBaseline: 1300, sensorReach: 1300, oodaLatencyFrames: 2,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "R-77-1 ADDER (INTERNAL) / R-74M ARCHER" }
    ]
  },
  6: {
    west: [
      { id: "ngad",       callsign: "NGAD",      name: "NGAD 6TH-GEN",      year: 2030, mass: 1.90, baseSpeed: 6.80, maxSpeed: 8.40, thrustDry: 0.055, thrustAB: 0.140, cd0: 0.0014, kInduced: 0.65, maxTurnRate: 0.215, rcs: 0.00005, rcsClean: 0.00005, rcsBloom: 0.80, radarBaseline: 1600, sensorReach: 1600, oodaLatencyFrames: 1,  hasFlares: true,  hasChaff: true,  missileCapacity: 4, primaryMissile: "AIM-260 JATM (CCA-LINKED)" }
    ],
    east: [
      { id: "su57m",      callsign: "FELON-M",   name: "Su-57M FELON-M",    year: 2030, mass: 1.95, baseSpeed: 6.40, maxSpeed: 8.00, thrustDry: 0.058, thrustAB: 0.135, cd0: 0.0014, kInduced: 0.70, maxTurnRate: 0.205, rcs: 0.05000, rcsClean: 0.05000, rcsBloom: 1.20, radarBaseline: 1500, sensorReach: 1500, oodaLatencyFrames: 1,  hasFlares: true,  hasChaff: true,  missileCapacity: 6, primaryMissile: "R-77M ADDER-M (INTERNAL) / R-74M2" }
    ]
  }
};

// Backwards-compatible derived fields: AIRCRAFT_SPECS[gen].hudName (first jet on each side)
for (var genI = 1; genI <= 6; genI++) {
  var entry = AIRCRAFT_SPECS[genI];
  if (entry && entry.west && entry.west[0]) {
    entry.hudName = entry.west[0].name;
  }
}

// West vs East Doctrinal Ordnance & Guns Specification Table
// Per-gen, per-team, per-jet-index (1:1 with AIRCRAFT_SPECS[gen][team] array).
var WEAPONS_BY_GEN = {
  1: {
    west: [
      { gunName: "6x .50 Cal M3 Browning", caliber: "12.7mm", isHeavy: false, missileName: "NONE" },
      { gunName: "6x .50 Cal M3 Browning", caliber: "12.7mm", isHeavy: false, missileName: "NONE" }
    ],
    east: [
      { gunName: "1x 37mm N-37 & 2x 23mm NR-23", caliber: "37mm Heavy", isHeavy: true, missileName: "NONE" },
      { gunName: "2x 23mm NR-23",                caliber: "23mm",       isHeavy: true, missileName: "NONE" }
    ]
  },
  2: {
    west: [
      { gunName: "4x 20mm M39 (Revolver)",   caliber: "20mm", isHeavy: false, missileName: "NONE" },
      { gunName: "1x 20mm M61 Vulcan (6,000 RPM)", caliber: "20mm", isHeavy: false, missileName: "AIM-9B SIDEWINDER" },
      { gunName: "1x 20mm M61A1 (Internal)",  caliber: "20mm", isHeavy: false, missileName: "NONE" }
    ],
    east: [
      { gunName: "3x 23mm NR-23",            caliber: "23mm", isHeavy: true, missileName: "NONE" },
      { gunName: "1x 23mm GSh-23 Twin",      caliber: "23mm", isHeavy: true, missileName: "K-13 / R-3S ATOLL" },
      { gunName: "2x 30mm NR-30",            caliber: "30mm", isHeavy: true, missileName: "NONE" }
    ]
  },
  3: {
    west: [
      { gunName: "1x 20mm M61A1 Vulcan (Internal)", caliber: "20mm", isHeavy: false, missileName: "AIM-7E SPARROW (SARH) / AIM-9J" },
      { gunName: "1x 20mm M61A1 Vulcan (Internal)", caliber: "20mm", isHeavy: false, missileName: "NONE" },
      { gunName: "4x 20mm Colt Mk 12",             caliber: "20mm", isHeavy: false, missileName: "AIM-9D SIDEWINDER" }
    ],
    east: [
      { gunName: "1x 23mm GSh-23L Twin",     caliber: "23mm", isHeavy: true, missileName: "R-3S ATOLL" },
      { gunName: "1x 23mm GSh-23L Twin",     caliber: "23mm", isHeavy: true, missileName: "R-23R APEX (SARH) / R-60" },
      { gunName: "1x 23mm GSh-23L Twin",     caliber: "23mm", isHeavy: true, missileName: "R-40R TOLSTOY (SARH) / R-60" }
    ]
  },
  4: {
    west: [
      { gunName: "1x 20mm M61A1 Vulcan (Internal)", caliber: "20mm", isHeavy: false, missileName: "AIM-54 PHOENIX (BVR) / AIM-9L" },
      { gunName: "1x 20mm M61A1 Vulcan (Internal)", caliber: "20mm", isHeavy: false, missileName: "AIM-120 AMRAAM / AIM-9L" },
      { gunName: "1x 20mm M61A2 Vulcan",            caliber: "20mm", isHeavy: false, missileName: "AIM-120 AMRAAM / AIM-9X" },
      { gunName: "1x 20mm M61A2 Vulcan",            caliber: "20mm", isHeavy: false, missileName: "AIM-120 AMRAAM / AIM-9X" }
    ],
    east: [
      { gunName: "1x 30mm GSh-30-1",           caliber: "30mm", isHeavy: true, missileName: "R-27ER ALAMO (SARH) / R-73 ARCHER" },
      { gunName: "1x 30mm GSh-30-1",           caliber: "30mm", isHeavy: true, missileName: "R-77 ADDER / R-73 ARCHER" },
      { gunName: "1x 23mm GSh-6-23 (Internal)", caliber: "23mm", isHeavy: true, missileName: "R-33 AMRAAMSKI (BVR) / R-40" }
    ]
  },
  5: {
    west: [
      { gunName: "1x 20mm M61A2 Vulcan (Internal Bay)", caliber: "20mm", isHeavy: false, missileName: "AIM-120D AMRAAM (INTERNAL) / AIM-9X" },
      { gunName: "1x 25mm GAU-22/A (Internal Bay)",     caliber: "25mm", isHeavy: false, missileName: "AIM-120 AMRAAM (INTERNAL) / AIM-9X" }
    ],
    east: [
      { gunName: "1x 30mm GSh-30-1 (Internal Bay)",     caliber: "30mm", isHeavy: true, missileName: "R-77-1 ADDER (INTERNAL) / R-74M ARCHER" }
    ]
  },
  6: {
    west: [
      { gunName: "Airborne Solid-State Laser CIWS",     caliber: "DEW Laser", isHeavy: false, missileName: "AIM-260 JATM (CCA-LINKED)" }
    ],
    east: [
      { gunName: "1x 30mm GSh-30-1 (Internal Bay)",     caliber: "30mm", isHeavy: true, missileName: "R-77M ADDER-M (INTERNAL) / R-74M2" }
    ]
  }
};
