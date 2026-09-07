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
      title: "KOREAN CANYON TRANSONIC GUNFIGHT",
      doctrine: "WEST: 6x .50 CAL BROWNING // EAST: 37MM N-37 & 23MM // B-47 VS Tu-16 IRON BOMBS",
      techInventedName: "Axial Turbojets, Swept Wings (Mach 0.95) & High-Rate Autocannons",
      techInventedImpact: "Replaced piston propellers to break past transonic limits. High closing speeds forced close-in visual dogfights between Western fast-rate .50 caliber Browning tracers and Eastern heavy 37mm/23mm explosive shells.",
      blueAircraft: "F-86 SABRE (USA)",
      redAircraft: "MiG-15 FAGOT (USSR)",
      keyWeapons: "WEST: 6x .50 Cal M3 Browning & B-47 1,000 lb Ripple ⚔️ EAST: 37mm N-37 / 23mm NR-23 & Tu-16 FAB-500",
      flightArena: "Mid-Troposphere (22,000 ft MSL) // Thick Air Dogfighting",
      missilesEnabled: false
    },
    2: {
      eraNum: 2,
      eraLabel: "ERA II // 1960",
      title: "COLD WAR SUPERSONIC INTERCEPT & NUKES",
      doctrine: "WEST: AIM-9B SIDEWINDER // EAST: K-13 ATOLL // ☢ B-58 (9MT) VS Tu-95 (15MT)",
      techInventedName: "Afterburners (Mach 2), Infrared Heatseekers & Megaton Deterrence",
      techInventedImpact: "Afterburning turbojets doubled speeds to Mach 2+. Western AIM-9B Sidewinders and Soviet K-13 Atoll heatseekers locked onto jet exhausts, while Mach 2 B-58 Hustlers and Tu-95 Bears stood nuclear deterrence alert.",
      blueAircraft: "F-104 STARFIGHTER / F-4 (USA)",
      redAircraft: "MiG-21 FISHBED (USSR)",
      keyWeapons: "WEST: AIM-9B Sidewinder & B-58 (B53 9MT Nuke) ⚔️ EAST: K-13 Atoll & Tu-95V Bear (RDS-37 15MT Nuke)",
      flightArena: "High Troposphere (36,000 ft MSL) // Mach 2 Straight-Line Intercepts",
      missilesEnabled: true
    },
    3: {
      eraNum: 3,
      eraLabel: "ERA III // 1972",
      title: "VIETNAM ALL-WEATHER BVR RADAR",
      doctrine: "WEST: AIM-7 SPARROW (SARH) // EAST: R-23 APEX // CHAFF/FLARES // CLUSTER STRIKES",
      techInventedName: "Pulse-Doppler Radar, SARH BVR Missiles & Chaff/Flares",
      techInventedImpact: "Pulse-Doppler radars enabled head-on beyond-visual-range (BVR) missile locks with Western AIM-7 Sparrows and Soviet R-23 Apex missiles. Magnesium flares and metallized chaff were invented to decoy homing seekers.",
      blueAircraft: "F-4 PHANTOM II (USA)",
      redAircraft: "MiG-23 FLOGGER (USSR)",
      keyWeapons: "WEST: AIM-7 Sparrow SARH & F-111 CBU-87 ⚔️ EAST: R-23R Apex SARH & Tu-22M Backfire RBK-500",
      flightArena: "Stratospheric Transition (42,000 ft MSL) // Radar Cone Intercepts",
      missilesEnabled: true
    },
    4: {
      eraNum: 4,
      eraLabel: "ERA IV // 1991",
      title: "DESERT STORM FOURTH-GEN AIR SUPERIORITY",
      doctrine: "WEST: AIM-54 (M5) & AMRAAM // EAST: R-27 ALAMO & R-73 ARCHER // B-1B VS Tu-160",
      techInventedName: "Fly-by-Wire 9G Agility, High-Off-Boresight Helmets & GPS JDAMs",
      techInventedImpact: "Digital FBW stabilized relaxed airframes for 9G turns. The West fielded Mach 5 Phoenix and AMRAAMs; the East fielded helmet-slaved R-73 Archers and long-range R-27 Alamos, alongside B-1B and Tu-160 supersonic bombers.",
      blueAircraft: "F-14 TOMCAT / F-16 VIPER (USA)",
      redAircraft: "Su-27 FLANKER / MiG-29 (USSR)",
      keyWeapons: "WEST: AIM-54 Phoenix & AIM-120 & B-1B JDAM ⚔️ EAST: R-27 Alamo & R-73 Archer & Tu-160 KAB-1500",
      flightArena: "Tactical BVR Arena (48,000 ft MSL) // Boyd E-M 9G Dogfights",
      missilesEnabled: true
    },
    5: {
      eraNum: 5,
      eraLabel: "ERA V // 2010",
      title: "STEALTH SUPERCRUISE SUPREMACY",
      doctrine: "WEST: F-22 RAPTOR (0.0001 RCS) // EAST: Su-57 FELON // B-2 MOP VS PAK DA",
      techInventedName: "VLO Radar Stealth (0.0001 RCS), Internal Weapon Bays & AESA",
      techInventedImpact: "Radar-absorbent shaping rendered airframes invisible to early warning radars. Western F-22 Raptors and Eastern Su-57 Felons supercruise at Mach 1.6+ without afterburners, delivering internal missiles and heavy bunker busters.",
      blueAircraft: "F-22 RAPTOR (USA)",
      redAircraft: "Su-57 FELON (RUSSIA)",
      keyWeapons: "WEST: Internal AIM-120D & B-2 Spirit GBU-57 MOP ⚔️ EAST: Internal R-77-1 Adder & PAK DA FAB-9000",
      flightArena: "Stratospheric Supercruise (60,000 ft MSL) // Mach 1.6+ Without Afterburner",
      missilesEnabled: true
    },
    6: {
      eraNum: 6,
      eraLabel: "ERA VI // 2030",
      title: "AUTONOMOUS DRONE SWARM & HYPERSONICS",
      doctrine: "WEST: NGAD + CCAs // EAST: H-20 + CCA RED // LASER CIWS // HYPERSONIC CRUISE",
      techInventedName: "Collaborative Combat AI Swarms, Laser CIWS & Hypersonic Scramjets",
      techInventedImpact: "Uncrewed autonomous wingmen create a distributed sensor mesh and draw fire. Solid-state lasers intercept incoming missiles at light speed, and Western HACM and Eastern hypersonic glide darts strike defended airbases.",
      blueAircraft: "NGAD + CCAs (USA/NATO)",
      redAircraft: "H-20 + CCA SWARM (PLAAF/VKS)",
      keyWeapons: "WEST: NGAD Loyal Wingmen & B-21 HACM ⚔️ EAST: H-20 CCA Swarm & Hypersonic Glide Darts",
      flightArena: "Extreme High Altitude (70,000 ft MSL) // Unmanned Sensor Grid",
      missilesEnabled: true
    },
    7: {
      eraNum: 7,
      eraLabel: "ERA VII // 2050",
      title: "NEAR-SPACE & ORBITAL SUPREMACY",
      doctrine: "WEST: HELIOS ORBITAL LASER // EAST: PERESVET-O PARTICLE BEAM // QUANTUM SWARMS",
      techInventedName: "Orbital Directed-Energy Lasers, Quantum Radar & Plasma Shields",
      techInventedImpact: "Warfare ascends to near-space (98,000 ft). Quantum radars defeat all stealth, and space-based orbital platforms (Western HELIOS Laser and Eastern PERESVET-O Particle Beam) vaporize ground bases from orbit.",
      blueAircraft: "SWARM ALPHA (USA/ALLIED)",
      redAircraft: "SWARM RED (OPPOSING)",
      keyWeapons: "WEST: HELIOS Orbital Laser Satellite (DEW) ⚔️ EAST: PERESVET-O Orbital Particle Beam Platform",
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

      var toggleBtn = document.getElementById("dock-toggle-btn");
      var dockEl = document.getElementById("hud-campaign-badge") || document.getElementById("hud-campaign-dock");
      if (toggleBtn && dockEl) {
        toggleBtn.addEventListener("click", function () {
          var isCollapsed = dockEl.classList.toggle("dock-collapsed");
          toggleBtn.textContent = isCollapsed ? "EXPAND NOTES [+]" : "COLLAPSE NOTES [-]";
        });
      }
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

        var bWm = (DF.bluePool && DF.bluePool[1] && DF.bluePool[1].active) ? DF.bluePool[1] : null;
        var rWm = (DF.redPool && DF.redPool[1] && DF.redPool[1].active) ? DF.redPool[1] : null;

        // Mutual defensive cover on wingman's six
        if ((bJet && bJet.mode === "COVER") || (bWm && bWm.mode === "COVER") ||
            (rJet && rJet.mode === "COVER") || (rWm && rWm.mode === "COVER")) {
          var covJet = (bJet && bJet.mode === "COVER") ? bJet : (bWm && bWm.mode === "COVER" ? bWm : (rJet && rJet.mode === "COVER" ? rJet : rWm));
          return "🛡️ MUTUAL DEFENSIVE COVER: " + covJet.callsign + " breaking into threat on element's six!";
        }

        // Bracket Pincer dual-axis flanking attack
        if ((bJet && bJet.mode === "PINCER") || (bWm && bWm.mode === "PINCER") ||
            (rJet && rJet.mode === "PINCER") || (rWm && rWm.mode === "PINCER")) {
          var pJet = (bJet && bJet.mode === "PINCER") ? bJet : (bWm && bWm.mode === "PINCER" ? bWm : (rJet && rJet.mode === "PINCER" ? rJet : rWm));
          return "⚔️ TACTICAL BRACKET: " + pJet.callsign + " executing dual-axis pincer flank on adversary!";
        }

        // Active tactical formation flight
        if ((bWm && bWm.mode === "FORMATION") || (rWm && rWm.mode === "FORMATION")) {
          var formJet = (bWm && bWm.mode === "FORMATION") ? bWm : rWm;
          var leadJet = formJet.wingmanJet;
          var leadCall = leadJet ? leadJet.callsign : "LEAD";
          return "✈️ TACTICAL SPREAD: " + formJet.callsign + " holding formation stepped on " + leadCall + "'s wing.";
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
      var countdownDockEl = document.getElementById("campaign-timer-countdown-dock");
      if (countdownEl || countdownDockEl) {
        var remainSec = Math.max(0, Math.ceil((this.maxEraFrames - this.eraTimer) / 60));
        if (countdownEl) countdownEl.textContent = remainSec + "s";
        if (countdownDockEl) countdownDockEl.textContent = remainSec + "s";
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
      var tagDockEl = document.getElementById("campaign-era-tag-dock");
      var titleEl = document.getElementById("campaign-era-title");
      var titleDockEl = document.getElementById("campaign-era-title-dock");
      var docEl = document.getElementById("campaign-era-doctrine");
      var techNameEl = document.getElementById("campaign-tech-name");
      var techImpactEl = document.getElementById("campaign-tech-impact");
      var liveTickerEl = document.getElementById("campaign-live-ticker");

      if (tagEl && tagEl.textContent !== data.eraLabel) tagEl.textContent = data.eraLabel;
      if (tagDockEl && tagDockEl.textContent !== data.eraLabel) tagDockEl.textContent = data.eraLabel;
      if (titleEl && titleEl.textContent !== data.title) titleEl.textContent = data.title;
      if (titleDockEl && titleDockEl.textContent !== data.title) titleDockEl.textContent = data.title;
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
