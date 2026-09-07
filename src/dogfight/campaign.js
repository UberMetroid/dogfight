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
      techInventedName: "Axial Turbojets & Swept Wings (Mach 0.95)",
      techInventedImpact: "Replaced piston propellers to break past transonic limits. High closing speeds forced close-in visual dogfights (.50 cal / 37mm cannons) and B-47 iron bomb carpet strikes.",
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
      techInventedName: "Afterburners (Mach 2) & Infrared Sidewinders",
      techInventedImpact: "Afterburning turbojets doubled speeds to Mach 2+. Infrared seekers locking onto exhaust plumes replaced cannons, shifting warfare to supersonic slashing attacks and B-58 nuclear deterrence.",
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
      techInventedName: "Pulse-Doppler Radar, SARH BVR Missiles & Chaff/Flares",
      techInventedImpact: "Pulse-Doppler radars enabled head-on beyond-visual-range (BVR) missile locks. In response, burning magnesium flares and radar-reflecting chaff were invented to decoy homing seekers.",
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
      techInventedName: "Fly-by-Wire 9G Agility, Active Radar (Mach 5) & GPS JDAMs",
      techInventedImpact: "Computers stabilize relaxed airframes for instantaneous 9G nose pointing. Active-radar Mach 5 Phoenix missiles guide themselves, while GPS satellites turn dumb gravity bombs into surgical JDAM strikes.",
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
      techInventedName: "VLO Radar Stealth (0.0001 RCS), Internal Weapon Bays & AESA",
      techInventedImpact: "Faceted radar-absorbent geometry renders airframes invisible to early warning radar. Fighters supercruise at Mach 1.6+ without afterburners, and B-2 spirits deliver 30,000 lb bunker busters undetected.",
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
      techInventedName: "Collaborative Combat AI Swarms, Laser CIWS & Hypersonic Scramjets",
      techInventedImpact: "Uncrewed autonomous wingmen create a distributed sensor mesh and draw fire. Solid-state lasers intercept incoming missiles at light speed, and Mach 5+ HACM cruise missiles strike fortified positions.",
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
      techInventedName: "Orbital Directed-Energy Lasers, Quantum Radar & Plasma Shields",
      techInventedImpact: "Warfare ascends to near-space (98,000 ft) where aerodynamics yield to reaction thrusters. Quantum radars defeat all stealth, and space-based satellites fire coherent optical beams to vaporize bases from orbit.",
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
    pendingReason: null,
    escalationCount: 0,
    lastNarrativeText: "",

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
        dfRadio("INVENTED: " + data.techInventedName);
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
        dfRadio("⚡ ADVANCING TO " + nextData.eraLabel + " // " + nextData.title);
        dfRadio("══════════════════════════════════════════════════════════");
      }

      this.setEra(nextEra);
    },

    // Synthesize real-time live battlefield narrative for the documentary ticker
    getLiveNarrative: function () {
      var data = this.getEraData(this.currentEra);

      // 0. Imminent generational transition
      if (this.transitionTimer > 0 && this.pendingReason) {
        return "⚡ DECISIVE KNOCKOUT: " + this.pendingReason + " — Technological escalation imminent!";
      }

      // 1. Check Strategic Bomber / Nuclear / Orbital Laser state
      if (typeof StrategicBomberSystem !== "undefined") {
        var sb = StrategicBomberSystem;
        if (sb.nukeFlashAlpha > 0.05) {
          return "☢ 9-MEGATON THERMONUCLEAR DETONATION: Screen EMP blinding flash and rising radioactive mushroom cloud over target FARP!";
        }
        if (sb.activeBomber) {
          var ab = sb.activeBomber;
          if (ab.state === "SPLASHED" || ab.isDying) {
            return "💥 BOMBER SPLASHED: Interceptors destroyed hostile strategic bomber mid-air! Home base secured!";
          }
          var bTeam = (ab.team === "blue") ? "Blue Allied" : "Red Opposing";
          if (ab.bombType === "ORBITAL_DEW_LASER") {
            return "🛰️ ORBITAL DIRECTED ENERGY: " + bTeam + " Helios Satellite channeling multi-gigawatt continuous laser beam from 98,000 ft!";
          }
          if (ab.bombType === "NUKE_THERMONUCLEAR") {
            return "☢ STRATEGIC DETERRENCE: " + bTeam + " B-58 Hustler at Mach 2 ingressing with B53 Thermonuclear Gravity Bomb!";
          }
          if (ab.bombType === "BUNKER_BUSTER") {
            return "💥 DEEP PENETRATION: " + bTeam + " B-2 Spirit delivering 30,000 lb GBU-57 MOP Bunker Buster on hardened base!";
          }
          if (ab.bombType === "HYPERSONIC_CRUISE") {
            return "⚡ HYPERSONIC INGRESS: " + bTeam + " B-21 Raider launching Mach 5+ HACM scramjet cruise missiles!";
          }
          if (ab.bombType === "JDAM_ROTARY") {
            return "🎯 GPS ROTARY SALVO: " + bTeam + " B-1B Lancer ripple-firing precision GBU-31 JDAM bombs on runway infrastructure!";
          }
          if (ab.bombType === "CLUSTER_CBU") {
            return "💣 CLUSTER DISPENSERS: " + bTeam + " F-111 Aardvark dispensing CBU-87 submunitions across airfield perimeter!";
          }
          return "💣 STRATEGIC BOMB RUN: " + bTeam + " " + ab.name + " dropping strategic bomb salvo on enemy FARP!";
        }
        if (sb.dominanceTeam && sb.dominanceTimer > 10) {
          var domName = (sb.dominanceTeam === "blue") ? "Blue Allied Forces" : "Red Opposing Forces";
          return "🏆 AIR DOMINANCE SECURED: " + domName + " control the skies! Scrambling strategic bomber for decisive base strike...";
        }
      }

      // 2. Check active dogfights and missile engagements
      if (typeof DF !== "undefined") {
        // Active missiles in flight
        if (DF.missilesPool && DF.missilesPool.activeCount > 0) {
          if (this.currentEra === 2) {
            return "🚀 HEATSEEKER INTERCEPT: AIM-9B Sidewinder tracking bandit engine infrared thermal signature!";
          } else if (this.currentEra === 3) {
            return "📡 BVR RADAR LOCK: AIM-7 Sparrow riding semi-active pulse-doppler radar cone across 40k ft ceiling!";
          } else if (this.currentEra === 4) {
            return "⚡ MACH 5 HYPERSONIC DART: AIM-54 Phoenix tracking target autonomously with active onboard radar!";
          } else if (this.currentEra === 5) {
            return "👻 INTERNAL BAY LAUNCH: Stealth AIM-120D AMRAAM guiding via low-probability-of-intercept datalink!";
          } else if (this.currentEra === 6) {
            return "🛸 AUTONOMOUS SWARM: Distributed loyal wingmen launching multi-axis coordinated missile salvo!";
          } else if (this.currentEra === 7) {
            return "⚡ QUANTUM LASER LOCK: Coherent directed-energy tracking vector in near-space exosphere!";
          }
          return "🚀 AIR-TO-AIR MISSILE IN FLIGHT: Active guidance tracking adversary aircraft!";
        }

        var bJet = (DF.bluePool && DF.bluePool[0] && DF.bluePool[0].active) ? DF.bluePool[0] : null;
        var rJet = (DF.redPool && DF.redPool[0] && DF.redPool[0].active) ? DF.redPool[0] : null;

        // Bomber intercept missions
        if (bJet && bJet.mode === "INTERCEPT_BOMBER") {
          return "🚨 EMERGENCY INTERCEPT: " + bJet.callsign + " vectoring supersonic to splash incoming Strategic Bomber before base strike!";
        }
        if (rJet && rJet.mode === "INTERCEPT_BOMBER") {
          return "🚨 EMERGENCY INTERCEPT: " + rJet.callsign + " climbing on afterburner to intercept incoming Strategic Bomber!";
        }

        // Bomber escort doctrine
        if (bJet && bJet.mode === "ESCORT_BOMBER") {
          return "🛡️ BOMBER ESCORT: " + bJet.callsign + " engaging interceptors to shield friendly strategic bomb run!";
        }
        if (rJet && rJet.mode === "ESCORT_BOMBER") {
          return "🛡️ BOMBER ESCORT: " + rJet.callsign + " shielding friendly strategic bomber against incoming interceptors!";
        }

        // Bingo fuel RTB divert
        if (bJet && bJet.isBingoFuel) {
          return "⛽ BINGO FUEL: " + bJet.callsign + " fuel critical (" + Math.round(bJet.fuel) + "%)! Disengaging dogfight -> RTB for hot-pit refuel!";
        }
        if (rJet && rJet.isBingoFuel) {
          return "⛽ BINGO FUEL: " + rJet.callsign + " fuel critical (" + Math.round(rJet.fuel) + "%)! Disengaging dogfight -> RTB for hot-pit refuel!";
        }

        // Countermeasure deployments
        if ((bJet && bJet.flareCooldown > 20) || (rJet && rJet.flareCooldown > 20)) {
          return "✨ DEFENSIVE COUNTERMEASURES: Pilot deployed burning magnesium flares & aluminum chaff to decoy missile!";
        }

        // FARP touch-and-go rearm
        if ((bJet && (bJet.mode === "ACE_APPROACH" || bJet.mode === "ACE_TOUCHDOWN")) ||
            (rJet && (rJet.mode === "ACE_APPROACH" || rJet.mode === "ACE_TOUCHDOWN"))) {
          var rearmingJet = (bJet && (bJet.mode === "ACE_APPROACH" || bJet.mode === "ACE_TOUCHDOWN")) ? bJet : rJet;
          return "🛬 AUSTERE TOUCH-AND-GO: " + rearmingJet.callsign + " hot-pit turnaround on runway — rapid refueling and missile rearm!";
        }

        // Takeoff rollout
        if ((bJet && bJet.mode === "FARP_TAKEOFF") || (rJet && rJet.mode === "FARP_TAKEOFF")) {
          var launchingJet = (bJet && bJet.mode === "FARP_TAKEOFF") ? bJet : rJet;
          return "🛫 COMBAT SCRAMBLE: " + launchingJet.callsign + " rolling on afterburner for tactical high-altitude climb!";
        }

        // Merge or pitchback
        if ((bJet && (bJet.mode === "MERGE_PITCHBACK" || bJet.mode === "BREAK_9G")) ||
            (rJet && (rJet.mode === "MERGE_PITCHBACK" || rJet.mode === "BREAK_9G"))) {
          return "🔄 9G RATE FIGHT: Fighters crossing head-on at Mach 1+, pulling maximum-G pitchbacks to capture adversary's 6 o'clock!";
        }

        // Close gun / cannon engagement
        if (DF.bulletsPool && DF.bulletsPool.activeCount > 0) {
          if (this.currentEra === 1) {
            return "💥 TRANSONIC GUNFIGHT: F-86 Sabre and MiG-15 trading .50 Cal M3 Browning and 37mm cannon bursts at 22,000 ft!";
          }
          return "💥 CANNON DOGFIGHT: High-rate autocannon tracers blazing at close visual merge!";
        }

        // Active GCI Intercept Closure
        if ((bJet && bJet.mode === "PURSUIT" && bJet.targetJet) || (rJet && rJet.mode === "PURSUIT" && rJet.targetJet)) {
          return "⚡ GCI THEATER INTERCEPT: Fighters vectoring at supersonic closing speed across ocean sector for combat merge!";
        }

        // Standoff evasion
        if ((bJet && bJet.mode === "EVADE_FARP") || (rJet && rJet.mode === "EVADE_FARP")) {
          return "⚠️ DEFENSE STANDOFF: Fighter reached enemy FARP air defense perimeter — turning back to ocean combat arena.";
        }
      }

      // Default contextual sweep description for the active era
      return "✈️ " + data.eraLabel + ": " + data.blueAircraft + " vs. " + data.redAircraft + " patrolling " + data.flightArena + ".";
    },

    // Step the campaign simulation (called from loop-sim.js each frame)
    update: function () {
      this.eraTimer++;

      // Handle pending decisive transition
      if (this.transitionTimer > 0) {
        this.transitionTimer--;
        if (this.transitionTimer === 0 && this.pendingReason) {
          var r = this.pendingReason;
          this.pendingReason = null;
          this.advanceEra(r);
        }
      } else if (this.eraTimer >= this.maxEraFrames) {
        // Trigger automatic technological escalation if an era has reached stalemate
        this.advanceEra("STALEMATE TIMEOUT // 60s ARMS RACE ESCALATION");
      }

      // Update timeline progress bar every frame for smooth animation
      var progressEl = document.getElementById("campaign-progress-fill");
      if (progressEl) {
        var pct = Math.min(100, Math.floor((this.eraTimer / this.maxEraFrames) * 100));
        progressEl.style.width = pct + "%";
      }

      // Update arms race countdown timer
      var countdownEl = document.getElementById("campaign-timer-countdown");
      if (countdownEl) {
        var remainSec = Math.max(0, Math.ceil((this.maxEraFrames - this.eraTimer) / 60));
        countdownEl.textContent = remainSec + "s";
      }

      // Keep live narrative and badges in sync
      if (this.eraTimer % 8 === 0) {
        this.updateHeaderBadge();
      }
    },

    // Handle strategic bomb detonation knockout event
    onStrategicStrikeLanded: function (gen, targetTeam) {
      if (this.transitionTimer > 0) return; // Debounce multi-bomb salvos
      if (this.eraTimer < 180) return; // Allow minimum visual development
      var teamName = (targetTeam === "blue") ? "BLUE BASE" : "RED FARP";
      this.pendingReason = teamName + " DESTROYED BY STRATEGIC BOMB RUN";
      this.transitionTimer = 90; // ~1.5s delay to let explosion, mushroom cloud, and shockwaves render
    },

    // Render / update DOM Header Badge and Documentary Chronicle Notes
    updateHeaderBadge: function () {
      var data = this.getEraData(this.currentEra);

      var tagEl = document.getElementById("campaign-era-tag");
      var titleEl = document.getElementById("campaign-era-title");
      var docEl = document.getElementById("campaign-era-doctrine");
      var techNameEl = document.getElementById("campaign-tech-name");
      var techImpactEl = document.getElementById("campaign-tech-impact");
      var liveTickerEl = document.getElementById("campaign-live-ticker");

      if (tagEl && tagEl.textContent !== data.eraLabel) tagEl.textContent = data.eraLabel;
      if (titleEl && titleEl.textContent !== data.title) titleEl.textContent = data.title;
      if (docEl && docEl.textContent !== data.doctrine) docEl.textContent = data.doctrine;
      if (techNameEl && techNameEl.textContent !== data.techInventedName) techNameEl.textContent = data.techInventedName;
      if (techImpactEl && techImpactEl.textContent !== data.techInventedImpact) techImpactEl.textContent = data.techInventedImpact;

      if (liveTickerEl) {
        var newNarrative = this.getLiveNarrative();
        if (newNarrative !== this.lastNarrativeText) {
          this.lastNarrativeText = newNarrative;
          liveTickerEl.textContent = newNarrative;
        }
      }
    }
  };

  global.GenerationalCampaign = GenerationalCampaign;

})(typeof window !== "undefined" ? window : this);
