// # Living Generational Campaign System — West vs East, 6 Generations
//
// Logline: Autonomous escalation across 6 generations of military aviation.
//          From Korea (1950 guns-only) to Cold War Nukes (Gen 2) to Vietnam Radar (Gen 3),
//          Desert Storm BVR (Gen 4), Stealth Supercruise (Gen 5), NGAD+CCA (Gen 6).
//          Strategic bombers / orbital weapons are out.
//
(function (global) {
  "use strict";

  var CAMPAIGN_ERAS = {
    1: {
      eraNum: 1,
      eraLabel: "ERA I // 1950",
      title: "KOREAN CANYON TRANSONIC GUNFIGHT",
      doctrine: "WEST: 6x .50 CAL BROWNING // EAST: 37MM N-37 & 23MM // F-86 VS MiG-15 // ZERO MISSILES",
      techInventedName: "Axial Turbojets, Swept Wings (Mach 0.95) & High-Rate Autocannons",
      techInventedImpact: "Replaced piston propellers to break past transonic limits. High closing speeds forced close-in visual dogfights between Western fast-rate .50 caliber Browning tracers and Eastern heavy 37mm/23mm explosive shells.",
      westAircraft: "F-86 SABRE / F-86D SABRE DOG (USA)",
      eastAircraft: "MiG-15 FAGOT / MiG-17 FRESCO (USSR)",
      keyWeapons: "WEST: 6x .50 Cal M3 Browning ⚔️ EAST: 1x 37mm N-37 & 2x 23mm NR-23",
      flightArena: "Mid-Troposphere (22,000 ft MSL) // Thick Air Dogfighting",
      missilesEnabled: false
    },
    2: {
      eraNum: 2,
      eraLabel: "ERA II // 1960",
      title: "COLD WAR SUPERSONIC INTERCEPT",
      doctrine: "WEST: AIM-9B SIDEWINDER // EAST: K-13 ATOLL // F-100/F-104 VS MiG-19/MiG-21",
      techInventedName: "Afterburners (Mach 2), Infrared Heatseekers & BVR Doctrine",
      techInventedImpact: "Afterburning turbojets doubled speeds to Mach 2+. Western AIM-9B Sidewinders and Soviet K-13 Atoll heatseekers locked onto jet exhausts. No strategic bombers in this era — only interceptors and tactical fighters.",
      westAircraft: "F-100 SUPER SABRE / F-104 STARFIGHTER / F-105 THUNDERCHIEF",
      eastAircraft: "MiG-19 FARMER / MiG-21 FISHBED / Su-7 FITTER",
      keyWeapons: "WEST: AIM-9B Sidewinder & 20mm Vulcan ⚔️ EAST: K-13 Atoll & 23mm GSh-23",
      flightArena: "High Troposphere (36,000 ft MSL) // Mach 2 Straight-Line Intercepts",
      missilesEnabled: true
    },
    3: {
      eraNum: 3,
      eraLabel: "ERA III // 1972",
      title: "VIETNAM ALL-WEATHER BVR RADAR",
      doctrine: "WEST: AIM-7 SPARROW (SARH) // EAST: R-23 APEX // CHAFF/FLARES // F-4 VS MiG-21/23",
      techInventedName: "Pulse-Doppler Radar, SARH BVR Missiles & Chaff/Flares",
      techInventedImpact: "Pulse-Doppler radars enabled head-on beyond-visual-range (BVR) missile locks with Western AIM-7 Sparrows and Soviet R-23 Apex missiles. Magnesium flares and metallized chaff were invented to decoy homing seekers.",
      westAircraft: "F-4 PHANTOM II / F-111 AARDVARK / F-8 CRUSADER",
      eastAircraft: "MiG-21PF FISHBED-J / MiG-23 FLOGGER / MiG-25 FOXBAT",
      keyWeapons: "WEST: AIM-7E Sparrow SARH & 20mm M61A1 ⚔️ EAST: R-23R Apex SARH & R-60",
      flightArena: "Stratospheric Transition (42,000 ft MSL) // Radar Cone Intercepts",
      missilesEnabled: true
    },
    4: {
      eraNum: 4,
      eraLabel: "ERA IV // 1991",
      title: "DESERT STORM FOURTH-GEN AIR SUPERIORITY",
      doctrine: "WEST: AIM-120 AMRAAM & AIM-9X // EAST: R-77 ADDER & R-73 ARCHER // F-14/F-15/F-16 VS Su-27/MiG-29",
      techInventedName: "Fly-by-Wire 9G Agility, High-Off-Boresight Helmets & AMRAAM",
      techInventedImpact: "Digital FBW stabilized relaxed airframes for 9G turns. The West fielded AMRAAMs and AIM-9X; the East fielded helmet-slaved R-73 Archers and R-77 Adder active radar missiles.",
      westAircraft: "F-14 TOMCAT / F-15 EAGLE / F-16 VIPER / F/A-18 HORNET",
      eastAircraft: "Su-27 FLANKER / MiG-29 FULCRUM / MiG-31 FOXHOUND",
      keyWeapons: "WEST: AIM-120 AMRAAM & AIM-9X & 20mm M61A2 ⚔️ EAST: R-77 Adder & R-73 Archer & R-33 AMRAAMSKI",
      flightArena: "Tactical BVR Arena (48,000 ft MSL) // Boyd E-M 9G Dogfights",
      missilesEnabled: true
    },
    5: {
      eraNum: 5,
      eraLabel: "ERA V // 2010",
      title: "STEALTH SUPERCRUISE SUPREMACY",
      doctrine: "WEST: F-22 RAPTOR (0.0001 RCS) // EAST: Su-57 FELON // F-22/F-35 VS Su-57",
      techInventedName: "VLO Radar Stealth (0.0001 RCS), Internal Weapon Bays & AESA",
      techInventedImpact: "Radar-absorbent shaping rendered airframes invisible to early warning radars. Western F-22 Raptors and Eastern Su-57 Felons supercruise at Mach 1.6+ without afterburners, delivering internal missiles.",
      westAircraft: "F-22 RAPTOR / F-35 LIGHTNING II",
      eastAircraft: "Su-57 FELON",
      keyWeapons: "WEST: Internal AIM-120D AMRAAM & AIM-9X ⚔️ EAST: Internal R-77-1 Adder & R-74M Archer",
      flightArena: "Stratospheric Supercruise (60,000 ft MSL) // Mach 1.6+ Without Afterburner",
      missilesEnabled: true
    },
    6: {
      eraNum: 6,
      eraLabel: "ERA VI // 2030",
      title: "NGAD 6TH-GEN & LOYAL WINGMAN (CCA)",
      doctrine: "WEST: NGAD + 2x CCA WINGMEN // EAST: Su-57M FELON-M // AIM-260 JATM (CCA-LINKED)",
      techInventedName: "Collaborative Combat Aircraft (CCA), Adaptive Cycle Engines & DEW CIWS",
      techInventedImpact: "NGAD leads 2 autonomous loyal wingman drones that extend radar range, perform distributed sensing, and intercept incoming missiles with directed-energy laser CIWS. The Su-57M is Russia's 5.5/6th-gen derivative with internal bays and improved stealth.",
      westAircraft: "NGAD 6TH-GEN + 2x CCA DRONES (USA)",
      eastAircraft: "Su-57M FELON-M (RUSSIA)",
      keyWeapons: "WEST: AIM-260 JATM (CCA-Linked) + 20mm DEW Laser CIWS ⚔️ EAST: Internal R-77M Adder-M & R-74M2",
      flightArena: "Extreme High Altitude (70,000 ft MSL) // Distributed Sensor Grid",
      missilesEnabled: true
    },
    7: {
      eraNum: 7,
      eraLabel: "ERA VII // 2040",
      title: "AUTONOMOUS QUANTUM SWARM MESH",
      doctrine: "WEST: CCA SWARM ALPHA // EAST: CCA SWARM CHARLIE // OMNIDIRECTIONAL KINETIC PULSE",
      techInventedName: "Autonomous Distributed Micro-Drone Mesh & Quantum-Phase-Shift Seekers",
      techInventedImpact: "Each 'airframe' is a 3-drone autonomous swarm (drone1/drone2/drone3) flying in adaptive formation. Quad-axis kinematic pulses can engage from any bearing, with 0ms shared OODA. Quantum-phase-shift seekers phase through 85% of inbound missile lock envelopes, projected outward to mid-2020s estimates.",
      westAircraft: "CCA SWARM ALPHA (USA)",
      eastAircraft: "CCA SWARM CHARLIE (RUSSIA)",
      keyWeapons: "OMNIDIRECTIONAL KINETIC PULSE CANNON / SWARM SATURATION / SINGULARITY BEAM",
      flightArena: "Near-Space Ceiling (90,000 ft MSL) // 15G+ Hyper-Turn Mesh",
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
      if (typeof activeGensWest !== "undefined" && typeof activeGensEast !== "undefined") {
        for (var g = 1; g <= 7; g++) {
          activeGensWest[g] = (g === this.currentEra);
          activeGensEast[g] = (g === this.currentEra);
        }
        if (typeof syncMergedActiveGens === "function") syncMergedActiveGens();
        if (typeof saveActiveGens === "function") saveActiveGens();
        if (typeof updateGenSelectorUI === "function") updateGenSelectorUI();
      }

      // 2. Synchronize active fleet
      if (typeof syncFleetToActiveGenerations === "function") {
        var w = (typeof DF !== "undefined" && DF.worldWidth) ? DF.worldWidth : 3600;
        var h = (typeof DF !== "undefined" && DF.worldHeight) ? DF.worldHeight : 1200;
        syncFleetToActiveGenerations(activeGensWest, activeGensEast, w, h);
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
        var cause = reason || "STALEMATE TIMEOUT // ARMS RACE ESCALATION";
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

      // 1. Check active dogfights and missile engagements
      if (typeof DF !== "undefined") {
        // Active missiles in flight
        if (DF.missilesPool && DF.missilesPool.activeCount > 0) {
          if (this.currentEra === 2) {
            return "🚀 HEATSEEKER INTERCEPT: AIM-9B Sidewinder tracking bandit engine infrared thermal signature!";
          } else if (this.currentEra === 3) {
            return "📡 BVR RADAR LOCK: AIM-7 Sparrow riding semi-active pulse-doppler radar cone across 40k ft ceiling!";
          } else if (this.currentEra === 4) {
            return "⚡ MACH 5 HYPERSONIC DART: AIM-54 Phoenix / R-33 tracking target autonomously with active onboard radar!";
          } else if (this.currentEra === 5) {
            return "👻 INTERNAL BAY LAUNCH: Stealth AIM-120D AMRAAM guiding via low-probability-of-intercept datalink!";
          } else if (this.currentEra === 6) {
            return "🛸 CCA SWARM: NGAD loyal wingman drones launching multi-axis coordinated AIM-260 JATM salvo!";
          }
          return "🚀 AIR-TO-AIR MISSILE IN FLIGHT: Active guidance tracking adversary aircraft!";
        }

        var wPool = (DF && (DF.westPool || DF.bluePool)) ? (DF.westPool || DF.bluePool) : [];
        var ePool = (DF && (DF.eastPool || DF.redPool)) ? (DF.eastPool || DF.redPool) : [];
        var wJet = (wPool && wPool[0] && wPool[0].active) ? wPool[0] : null;
        var eJet = (ePool && ePool[0] && ePool[0].active) ? ePool[0] : null;

        // Bingo fuel RTB divert
        if (wJet && wJet.isBingoFuel) {
          return "⛽ BINGO FUEL: " + wJet.callsign + " fuel critical (" + Math.round(wJet.fuel) + "%)! Disengaging dogfight -> RTB for hot-pit refuel!";
        }
        if (eJet && eJet.isBingoFuel) {
          return "⛽ BINGO FUEL: " + eJet.callsign + " fuel critical (" + Math.round(eJet.fuel) + "%)! Disengaging dogfight -> RTB for hot-pit refuel!";
        }

        // Countermeasure deployments
        if ((wJet && wJet.flareCooldown > 20) || (eJet && eJet.flareCooldown > 20)) {
          return "✨ DEFENSIVE COUNTERMEASURES: Pilot deployed burning magnesium flares & aluminum chaff to decoy missile!";
        }

        // FARP touch-and-go rearm
        if ((wJet && (wJet.mode === "ACE_APPROACH" || wJet.mode === "ACE_TOUCHDOWN")) ||
            (eJet && (eJet.mode === "ACE_APPROACH" || eJet.mode === "ACE_TOUCHDOWN"))) {
          var rearmingJet = (wJet && (wJet.mode === "ACE_APPROACH" || wJet.mode === "ACE_TOUCHDOWN")) ? wJet : eJet;
          return "🛬 AUSTERE TOUCH-AND-GO: " + rearmingJet.callsign + " hot-pit turnaround on runway — rapid refueling and missile rearm!";
        }

        // Takeoff rollout
        if ((wJet && wJet.mode === "FARP_TAKEOFF") || (eJet && eJet.mode === "FARP_TAKEOFF")) {
          var launchingJet = (wJet && wJet.mode === "FARP_TAKEOFF") ? wJet : eJet;
          return "🛫 COMBAT SCRAMBLE: " + launchingJet.callsign + " rolling on afterburner for tactical high-altitude climb!";
        }

        // Merge or pitchback
        if ((wJet && (wJet.mode === "MERGE_PITCHBACK" || wJet.mode === "BREAK_9G")) ||
            (eJet && (eJet.mode === "MERGE_PITCHBACK" || eJet.mode === "BREAK_9G"))) {
          return "🔄 9G RATE FIGHT: Fighters crossing head-on at Mach 1+, pulling maximum-G pitchbacks to capture adversary's 6 o'clock!";
        }

        // Close gun / cannon engagement
        if (DF.bulletsPool && DF.bulletsPool.activeCount > 0) {
          if (this.currentEra === 1) {
            return "💥 TRANSONIC GUNFIGHT: F-86 Sabre and MiG-15 trading .50 Cal M3 Browning and 37mm cannon bursts at 22,000 ft!";
          }
          return "💥 CANNON DOGFIGHT: High-rate autocannon tracers blazing at close visual merge!";
        }

        var wWm = (wPool && wPool[1] && wPool[1].active) ? wPool[1] : null;
        var eWm = (ePool && ePool[1] && ePool[1].active) ? ePool[1] : null;

        // Mutual defensive cover on wingman's six
        if ((wJet && wJet.mode === "COVER") || (wWm && wWm.mode === "COVER") ||
            (eJet && eJet.mode === "COVER") || (eWm && eWm.mode === "COVER")) {
          var covJet = (wJet && wJet.mode === "COVER") ? wJet : (wWm && wWm.mode === "COVER" ? wWm : (eJet && eJet.mode === "COVER" ? eJet : eWm));
          return "🛡️ MUTUAL DEFENSIVE COVER: " + covJet.callsign + " breaking into threat on element's six!";
        }

        // Bracket Pincer dual-axis flanking attack
        if ((wJet && wJet.mode === "PINCER") || (wWm && wWm.mode === "PINCER") ||
            (eJet && eJet.mode === "PINCER") || (eWm && eWm.mode === "PINCER")) {
          var pJet = (wJet && wJet.mode === "PINCER") ? wJet : (wWm && wWm.mode === "PINCER" ? wWm : (eJet && eJet.mode === "PINCER" ? eJet : eWm));
          return "⚔️ TACTICAL BRACKET: " + pJet.callsign + " executing dual-axis pincer flank on adversary!";
        }

        // Active tactical formation flight
        if ((wWm && wWm.mode === "FORMATION") || (eWm && eWm.mode === "FORMATION")) {
          var formJet = (wWm && wWm.mode === "FORMATION") ? wWm : eWm;
          var leadJet = formJet.wingmanJet;
          var leadCall = leadJet ? leadJet.callsign : "LEAD";
          return "✈️ TACTICAL SPREAD: " + formJet.callsign + " holding formation stepped on " + leadCall + "'s wing.";
        }

        // Active GCI Intercept Closure
        if ((wJet && wJet.mode === "PURSUIT" && wJet.targetJet) || (eJet && eJet.mode === "PURSUIT" && eJet.targetJet)) {
          return "⚡ GCI THEATER INTERCEPT: Fighters vectoring at supersonic closing speed across ocean sector for combat merge!";
        }

        // Standoff evasion
        if ((wJet && wJet.mode === "EVADE_FARP") || (eJet && eJet.mode === "EVADE_FARP")) {
          return "⚠️ DEFENSE STANDOFF: Fighter reached enemy FARP air defense perimeter — turning back to ocean combat arena.";
        }
      }

      // Default contextual sweep description for the active era
      return "✈️ " + data.eraLabel + ": " + data.westAircraft + " vs. " + data.eastAircraft + " patrolling " + data.flightArena + ".";
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
