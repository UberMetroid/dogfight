// # Aircraft specs
//
// Logline: Live fields only. Unused aero tables deleted.
//
var SERVICE_CEILINGS = { 1: 45000, 2: 55000, 3: 58000, 4: 60000, 5: 65000, 6: 75000, 7: 100000 };
var CRUISE_ALTITUDES = { 1: 22000, 2: 36000, 3: 42000, 4: 48000, 5: 60000, 6: 70000, 7: 92000 };
var RESPAWN_CEILINGS = { 1: 25000, 2: 36000, 3: 42000, 4: 48000, 5: 60000, 6: 70000, 7: 92000 };
var V_CORNER = 4.8;
var AIRCRAFT_SPECS = {
  1: { hudName: "GEN 1 SABRE", callsign: "SABRE 1", blueName: "SABRE", redName: "MiG-15", mass: 1.0, baseSpeed: 3.8, maxSpeed: 4.8, thrustDry: 0.038, thrustAB: 0.045, cd0: 0.0020, kInduced: 1.60, maxTurnRate: 0.140, rcs: 1.0, rcsClean: 1.0, rcsBloom: 1.0, radarBaseline: 400, sensorReach: 400, oodaLatencyFrames: 24, hasFlares: false, hasChaff: false, missileCapacity: 0 },
  2: { hudName: "GEN 2 STARFIGHTER", callsign: "STARFIGHTER 1", blueName: "STARFIGHTER", redName: "MiG-21", mass: 1.3, baseSpeed: 5.8, maxSpeed: 7.6, thrustDry: 0.045, thrustAB: 0.135, cd0: 0.0016, kInduced: 1.45, maxTurnRate: 0.155, rcs: 1.1, rcsClean: 1.1, rcsBloom: 1.1, radarBaseline: 600, sensorReach: 600, oodaLatencyFrames: 18, hasFlares: false, hasChaff: false, missileCapacity: 2 },
  3: { hudName: "GEN 3 PHANTOM", callsign: "PHANTOM 1", blueName: "PHANTOM", redName: "MiG-23", mass: 1.8, baseSpeed: 4.8, maxSpeed: 7.2, thrustDry: 0.050, thrustAB: 0.115, cd0: 0.0022, kInduced: 1.25, maxTurnRate: 0.170, rcs: 1.5, rcsClean: 1.5, rcsBloom: 1.5, radarBaseline: 850, sensorReach: 850, oodaLatencyFrames: 12, hasFlares: true, hasChaff: true, missileCapacity: 6 },
  4: { hudName: "GEN 4 VIPER / TOMCAT", callsign: "VIPER 1", blueName: "VIPER", redName: "FLANKER", mass: 2.2, baseSpeed: 5.4, maxSpeed: 7.4, thrustDry: 0.045, thrustAB: 0.115, cd0: 0.0018, kInduced: 0.85, maxTurnRate: 0.185, rcs: 1.2, rcsClean: 1.2, rcsBloom: 1.2, radarBaseline: 1100, sensorReach: 1100, oodaLatencyFrames: 6, hasFlares: true, hasChaff: true, missileCapacity: 6 },
  5: { hudName: "GEN 5 RAPTOR", callsign: "RAPTOR 1", blueName: "RAPTOR", redName: "FELON", mass: 1.5, baseSpeed: 6.2, maxSpeed: 7.8, thrustDry: 0.065, thrustAB: 0.125, cd0: 0.0014, kInduced: 0.65, maxTurnRate: 0.200, rcs: 0.0001, rcsClean: 0.0001, rcsBloom: 1.2, radarBaseline: 1400, sensorReach: 1400, oodaLatencyFrames: 2, hasFlares: true, hasChaff: true, missileCapacity: 6 },
  6: { hudName: "GEN 6 NGAD SWARM", callsign: "NGAD 1", blueName: "NGAD", redName: "CCA RED", mass: 1.9, baseSpeed: 6.8, maxSpeed: 8.4, thrustDry: 0.055, thrustAB: 0.140, cd0: 0.0014, kInduced: 0.65, maxTurnRate: 0.215, rcs: 0.00005, rcsClean: 0.00005, rcsBloom: 0.8, radarBaseline: 1600, sensorReach: 1600, oodaLatencyFrames: 1, hasFlares: true, hasChaff: true, missileCapacity: 4 },
  7: { hudName: "GEN 7 QUANTUM GLOBES", callsign: "SWARM ALPHA", blueName: "SWARM ALPHA", redName: "SWARM RED", mass: 0.8, baseSpeed: 7.6, maxSpeed: 9.4, thrustDry: 0.060, thrustAB: 0.145, cd0: 0.0012, kInduced: 0.65, maxTurnRate: 0.245, rcs: 0.00001, rcsClean: 0.00001, rcsBloom: 0.00001, radarBaseline: 1900, sensorReach: 1900, oodaLatencyFrames: 0, hasFlares: true, hasChaff: true, missileCapacity: 0 }
};

// East vs. West Doctrinal Ordnance & Guns Specification Table
var EAST_WEST_WEAPONS = {
  blue: {
    1: { gunName: "6x .50 Cal M3 Browning", caliber: "12.7mm", isHeavy: false, missileName: "NONE", bomber: "B-47 Stratojet" },
    2: { gunName: "20mm M61 Vulcan (6,000 RPM)", caliber: "20mm", isHeavy: false, missileName: "AIM-9B Sidewinder", bomber: "B-58 Hustler (9MT Nuke)" },
    3: { gunName: "20mm M61A1 Vulcan", caliber: "20mm", isHeavy: false, missileName: "AIM-7 Sparrow (SARH)", bomber: "F-111 Aardvark (CBU-87)" },
    4: { gunName: "20mm M61A2 Vulcan", caliber: "20mm", isHeavy: false, missileName: "AIM-54 Phoenix / AIM-120 / AIM-9L", bomber: "B-1B Lancer (JDAM Salvo)" },
    5: { gunName: "Internal 20mm M61A2", caliber: "20mm", isHeavy: false, missileName: "Internal AIM-120D AMRAAM", bomber: "B-2 Spirit (GBU-57 MOP)" },
    6: { gunName: "Airborne Solid-State Laser CIWS", caliber: "DEW Laser", isHeavy: false, missileName: "AIM-260 JATM (CCA Mesh)", bomber: "B-21 Raider (HACM Hypersonic)" },
    7: { gunName: "Coherent Tri-Laser & Kinetic Mesh", caliber: "DEW Pulse", isHeavy: false, missileName: "Autonomous Micro-Drone Swarm", bomber: "HELIOS Orbital Laser (DEW)" }
  },
  red: {
    1: { gunName: "1x 37mm N-37 & 2x 23mm NR-23", caliber: "37mm Heavy Explosive", isHeavy: true, missileName: "NONE", bomber: "Tu-16 Badger (FAB-500)" },
    2: { gunName: "23mm GSh-23 Twin Cannon", caliber: "23mm", isHeavy: true, missileName: "K-13 / R-3S Atoll", bomber: "Tu-95V Bear (15MT Nuke)" },
    3: { gunName: "23mm GSh-23L Twin Cannon", caliber: "23mm", isHeavy: true, missileName: "R-23R Apex (SARH) & R-60", bomber: "Tu-22M Backfire (RBK-500)" },
    4: { gunName: "30mm GSh-30-1 Heavy Autocannon", caliber: "30mm Heavy", isHeavy: true, missileName: "R-27ER Alamo & R-73 Archer & R-77", bomber: "Tu-160 Blackjack (KAB-1500)" },
    5: { gunName: "30mm GSh-30-1 Heavy Autocannon", caliber: "30mm Heavy", isHeavy: true, missileName: "Internal R-77-1 Adder & R-37M", bomber: "PAK DA (FAB-9000 Penetrator)" },
    6: { gunName: "Airborne Solid-State Laser CIWS", caliber: "DEW Laser", isHeavy: false, missileName: "PL-15 / PL-21 Hypersonic AAM", bomber: "H-20 (Hypersonic Glide Darts)" },
    7: { gunName: "Peresvet Particle Beam & Kinetic Mesh", caliber: "Particle Pulse", isHeavy: false, missileName: "Hostile Drone Swarm Mesh", bomber: "PERESVET-O Orbital Platform" }
  }
};

