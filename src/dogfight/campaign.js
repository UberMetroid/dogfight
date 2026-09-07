// # Living Generational Campaign System
//
// Logline: Autonomous escalation across 7 generations of military aviation and weapons doctrine.
//          From Korea (1950 guns-only) to Cold War Nukes (Gen 2) to Vietnam Radar (Gen 3),
//          Desert Storm BVR (Gen 4), Stealth Supercruise (Gen 5), Autonomous Drone Grids (Gen 6),
//          and Orbital Satellite Lasers (Gen 7).

(function (global) {
  "use strict";

  var CAMPAIGN_ERAS = {
    1: {
      eraNum: 1,
      eraLabel: "ERA I // 1950",
      title: "KOREAN CANYON DOGFIGHT",
      doctrine: "TRANSONIC GUNFIGHTERS // B-47 IRON BOMB RIPPLE",
      blueAircraft: "F-86 SABRE",
      redAircraft: "MiG-15 FAGOT",
      keyWeapons: "6x .50 Cal M3 Browning / 37mm Nudelman Cannon / B-47 1,000 lb Bombs",
      flightArena: "Mid-Troposphere (22,000 ft MSL) // Thick Air Dogfighting",
      missilesEnabled: false
    },
    2: {
      eraNum: 2,
      eraLabel: "ERA II // 1960",
      title: "COLD WAR SUPERSONIC DASH",
      doctrine: "AIM-9B HEATSEEKERS // ☢ THERMONUCLEAR NUKE DETERRENCE",
      blueAircraft: "F-104 STARFIGHTER",
      redAircraft: "MiG-21 FISHBED",
      keyWeapons: "AIM-9B Rear-Aspect Sidewinder / ☢ B-58 Hustler 9MT Thermonuclear Nuke",
      flightArena: "High Troposphere (36,000 ft MSL) // Mach 2 Straight-Line Intercepts",
      missilesEnabled: true
    },
    3: {
      eraNum: 3,
      eraLabel: "ERA III // 1972",
      title: "VIETNAM ALL-WEATHER RADAR",
      doctrine: "AIM-7 SPARROW BVR // CHAFF & FLARES // CLUSTER DISPENSERS",
      blueAircraft: "F-4 PHANTOM II",
      redAircraft: "MiG-23 FLOGGER",
      keyWeapons: "AIM-7 Sparrow (SARH) / CBU-87 Cluster Dispensers / Chaff & Flare Dispensers",
      flightArena: "Stratospheric Transition (42,000 ft MSL) // Radar Cone Intercepts",
      missilesEnabled: true
    },
    4: {
      eraNum: 4,
      eraLabel: "ERA IV // 1991",
      title: "DESERT STORM AIR SUPERIORITY",
      doctrine: "AIM-54 PHOENIX (MACH 5) // 9G RATE FIGHT // B-1B JDAM ROTARY",
      blueAircraft: "F-16 VIPER / F-14 TOMCAT",
      redAircraft: "Su-27 FLANKER",
      keyWeapons: "AIM-54 Phoenix / AIM-9L All-Aspect / CADC Swing Wings / B-1B JDAM Salvo",
      flightArena: "Tactical BVR Arena (48,000 ft MSL) // Boyd E-M 9G Dogfights",
      missilesEnabled: true
    },
    5: {
      eraNum: 5,
      eraLabel: "ERA V // 2010",
      title: "STEALTH SUPERCRUISE SUPREMACY",
      doctrine: "0.0001 RCS INVISIBILITY // AESA SENSORS // B-2 BUNKER BUSTERS",
      blueAircraft: "F-22 RAPTOR",
      redAircraft: "Su-57 FELON",
      keyWeapons: "Internal Bay AIM-120D AMRAAMs / GBU-57 MOP (30,000 lb Bunker Buster)",
      flightArena: "Stratospheric Supercruise (60,000 ft MSL) // Mach 1.6+ Without Afterburner",
      missilesEnabled: true
    },
    6: {
      eraNum: 6,
      eraLabel: "ERA VI // 2030",
      title: "AUTONOMOUS DRONE SWARM & MESH",
      doctrine: "LOYAL WINGMEN CCAs // LASER CIWS // HYPERSONIC CRUISE",
      blueAircraft: "NGAD + CCAs",
      redAircraft: "H-20 + CCA SWARM",
      keyWeapons: "Distributed CCA Radar Mesh / Laser CIWS Defense / HACM Hypersonic Glide Darts",
      flightArena: "Extreme High Altitude (70,000 ft MSL) // Unmanned Sensor Grid",
      missilesEnabled: true
    },
    7: {
      eraNum: 7,
      eraLabel: "ERA VII // 2050",
      title: "NEAR-SPACE & ORBITAL SUPREMACY",
      doctrine: "QUANTUM SWARMS // 🛰️ ORBITAL SATELLITE LASER BEAM (DEW)",
      blueAircraft: "SWARM ALPHA",
      redAircraft: "SWARM RED",
      keyWeapons: "Coherent Tri-Lasers / Quantum Phase Shift / HELIOS Orbital Laser Cannon",
      flightArena: "Near-Space Exosphere (92,000 - 98,000 ft MSL) // Sub-Orbital Arena",
      missilesEnabled: true
    }
  };

  var GenerationalCampaign = {
    currentEra: 1,
    eraTimer: 0,
    minEraFrames: 1200, // ~20s minimum combat before strike escalation
    maxEraFrames: 3600, // ~60s maximum combat before automatic technological escalation
    isTransitioning: false,
    transitionTimer: 0,
    escalationCount: 0,

    init: function () {
      this.currentEra = 1;
      this.eraTimer = 0;
      this.isTransitioning = false;
      this.setEra(1, true);
    },

    getEraData: function (eraNum) {
      var e = eraNum || this.currentEra;
      return CAMPAIGN_ERAS[e] || CAMPAIGN_ERAS[1];
    },

    // Set active era and synchronize fleet
    setEra: function (eraNum, forceReset) {
      if (eraNum < 1 || eraNum > 7) eraNum = 1;
      this.currentEra = eraNum;
      this.eraTimer = 0;
      var data = this.getEraData(this.currentEra);

      // 1. Update active generation masks
      if (typeof activeGensBlue !== "undefined" && typeof activeGensRed !== "undefined") {
        for (var g = 1; g <= 7; g++) {
          activeGensBlue[g] = (g === this.currentEra);
          activeGensRed[g] = (g === this.currentEra);
        }
        if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
        if (typeof saveActiveGens === "function") saveActiveGens();
        if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();
      }

      // 2. Synchronize active fleet
      if (typeof syncFleetToActiveGenerations === "function") {
        var w = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
        var h = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
        syncFleetToActiveGenerations(activeGensBlue, activeGensRed, w, h);
      }

      // 3. Update DOM Campaign Header Badge
      this.updateHeaderBadge();

      // 4. Radio net broadcast
      if (typeof dfRadio === "function") {
        dfRadio("★ [CAMPAIGN ERA] " + data.eraLabel + " // " + data.title);
        dfRadio("DOCTRINE: " + data.doctrine);
      }

      // 5. Tactical audio cue
      if (typeof window !== "undefined" && window.TacticalAudio) {
        if (typeof window.TacticalAudio.playClick === "function") window.TacticalAudio.playClick();
      }
    },

    // Advance to next generational era
    advanceEra: function (reason) {
      var nextEra = (this.currentEra % 7) + 1;
      var nextData = this.getEraData(nextEra);
      this.escalationCount++;

      if (typeof dfRadio === "function") {
        var cause = reason || "STRATEGIC BASE DESTROYED // ARMS RACE ESCALATION";
        dfRadio("══════════════════════════════════════════════════════════");
        dfRadio("⚡ [THEATER ESCALATION] " + cause);
        dfRadio("⚡ COMMENCING " + nextData.eraLabel + " // " + nextData.title);
        dfRadio("══════════════════════════════════════════════════════════");
      }

      this.setEra(nextEra);
    },

    // Step the campaign simulation (called from loop-sim.js each frame)
    update: function () {
      this.eraTimer++;

      // Trigger automatic technological escalation if an era has raged without decisive knockout
      if (this.eraTimer >= this.maxEraFrames) {
        this.advanceEra("STALEMATE EVOLUTION // GENERATIONAL UPGRADE");
      }

      // Keep header badge in sync
      if (this.eraTimer % 45 === 0) {
        this.updateHeaderBadge();
      }
    },

    // Handle strategic bomb detonation knockout event
    onStrategicStrikeLanded: function (gen, targetTeam) {
      // Advance era when strategic bombing hits target FARP
      if (this.eraTimer >= this.minEraFrames) {
        var teamName = (targetTeam === "blue") ? "BLUE BASE" : "RED FARP";
        this.advanceEra(teamName + " CRIPPLED BY STRATEGIC STRIKE");
      }
    },

    // Render / update DOM Header Badge
    updateHeaderBadge: function () {
      var data = this.getEraData(this.currentEra);

      var tagEl = document.getElementById("campaign-era-tag");
      var titleEl = document.getElementById("campaign-era-title");
      var docEl = document.getElementById("campaign-era-doctrine");

      if (tagEl) tagEl.textContent = data.eraLabel;
      if (titleEl) titleEl.textContent = data.title;
      if (docEl) docEl.textContent = data.doctrine;
    }
  };

  global.GenerationalCampaign = GenerationalCampaign;

})(typeof window !== "undefined" ? window : this);
