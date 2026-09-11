// # Jets Enabled & Independent West / East Generation Management
//
// Logline: Independent generation activation for West and East forces to enable asymmetric warfare.
//          6 generations (1..6). Old "blue"/"red" localStorage keys still read as a fallback
//          so existing users' settings survive the rename.
//
var dogfightAnimId = null;
var jetsEnabled = true;

function isJetsEnabled() {
  try {
    var stored = localStorage.getItem("ooda-jets-active");
    if (stored !== null) return stored === "true";
  } catch (e) {}
  return true;
}

function setJetsEnabled(val) {
  jetsEnabled = Boolean(val);
  try { localStorage.setItem("ooda-jets-active", jetsEnabled ? "true" : "false"); } catch (e) {}
  if (typeof CanvasLifecycleManager !== "undefined") CanvasLifecycleManager.updateAll();
}

// Independent Generation Masks for West and East
var activeGensWest = { 1: false, 2: false, 3: false, 4: true, 5: false, 6: false };
var activeGensEast = { 1: false, 2: false, 3: false, 4: true, 5: false, 6: false };

// Backwards-compat aliases for the few internal reads that still use the old names.
// New code MUST use activeGensWest / activeGensEast.
var activeGensBlue = activeGensWest;
var activeGensRed  = activeGensEast;

// Unified mask for legacy modules
var activeGens = { 1: false, 2: false, 3: false, 4: true, 5: false, 6: false };

function syncMergedActiveGens() {
  for (var g = 1; g <= 6; g++) {
    activeGens[g] = Boolean(activeGensWest[g] || activeGensEast[g]);
  }
}

function loadActiveGens() {
  try {
    if (typeof localStorage !== "undefined") {
      // New keys first
      var sW = localStorage.getItem("ooda-gens-west-v2") || localStorage.getItem("ooda-gens-blue-v2");
      var sE = localStorage.getItem("ooda-gens-east-v2") || localStorage.getItem("ooda-gens-red-v2");
      if (sW) {
        var pW = JSON.parse(sW);
        for (var gw = 1; gw <= 6; gw++) if (typeof pW[gw] !== "undefined") activeGensWest[gw] = Boolean(pW[gw]);
      }
      if (sE) {
        var pE = JSON.parse(sE);
        for (var ge = 1; ge <= 6; ge++) if (typeof pE[ge] !== "undefined") activeGensEast[ge] = Boolean(pE[ge]);
      }
    }
  } catch (e) {}
  syncMergedActiveGens();
}
loadActiveGens();

function hasAnyActiveGen() {
  for (var k = 1; k <= 6; k++) {
    if (activeGensWest[k] || activeGensEast[k]) return true;
  }
  return false;
}

function saveActiveGens() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("ooda-gens-west-v2", JSON.stringify(activeGensWest));
      localStorage.setItem("ooda-gens-east-v2", JSON.stringify(activeGensEast));
    }
  } catch (e) {}
}

function getRandomActiveGen(team, preferred) {
  var mask = (team === "east") ? activeGensEast : activeGensWest;
  var available = [];
  for (var g = 1; g <= 6; g++) {
    if (mask[g]) available.push(g);
  }
  if (available.length === 0) {
    // Fallback to merged
    for (var m = 1; m <= 6; m++) if (activeGens[m]) available.push(m);
  }
  if (available.length === 0) return 4;
  if (preferred && mask[preferred]) return preferred;
  return available[Math.floor(Math.random() * available.length)];
}

function updateGenSelectorUI() {
  var btns = document.querySelectorAll(".gen-btn");
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    var team = btn.getAttribute("data-team") || "west";
    var gAttr = btn.getAttribute("data-gen") || (btn.dataset && btn.dataset.gen);
    var gNum = parseInt(gAttr, 10);
    if (gNum >= 1 && gNum <= 6) {
      var isAct = (team === "east") ? Boolean(activeGensEast[gNum]) : Boolean(activeGensWest[gNum]);
      btn.classList.toggle("active", isAct);
      btn.setAttribute("aria-pressed", isAct ? "true" : "false");
    }
  }
}

function toggleGeneration(team, genNum) {
  if (typeof team === "number" && typeof genNum === "undefined") {
    genNum = team;
    team = "both";
  }
  genNum = parseInt(genNum, 10);
  if (genNum < 1 || genNum > 6) return;

  if (team === "west") {
    activeGensWest[genNum] = !activeGensWest[genNum];
  } else if (team === "east") {
    activeGensEast[genNum] = !activeGensEast[genNum];
  } else {
    var nextVal = !(activeGensWest[genNum] && activeGensEast[genNum]);
    activeGensWest[genNum] = nextVal;
    activeGensEast[genNum] = nextVal;
  }

  syncMergedActiveGens();
  saveActiveGens();
  updateGenSelectorUI();

  var genNames = [
    "",
    "GEN 1 (F-86 / MiG-15)",
    "GEN 2 (F-100/F-104 / MiG-19/MiG-21)",
    "GEN 3 (F-4 / MiG-21/MiG-23)",
    "GEN 4 (F-14/F-15/F-16 / Su-27/MiG-29)",
    "GEN 5 (F-22/F-35 / Su-57)",
    "GEN 6 (NGAD+CCA / Su-57M)"
  ];

  if (typeof dfRadio === "function") {
    var teamLabel = (team === "west") ? "WEST FORCE" : ((team === "east") ? "EAST FORCE" : "ALL FORCES");
    var state = (team === "east" ? activeGensEast[genNum] : activeGensWest[genNum]) ? "[ACTIVE]" : "[OFFLINE]";
    dfRadio("TAC-NET: " + teamLabel + " // " + genNames[genNum] + " " + state);
  }

  if (typeof syncFleetToActiveGenerations === "function") {
    syncFleetToActiveGenerations(activeGensWest, activeGensEast);
  }

  if (typeof GenerationalCampaign !== "undefined") {
    GenerationalCampaign.currentEra = genNum;
    GenerationalCampaign.eraTimer = 0;
    GenerationalCampaign.updateHeaderBadge();
  }
}

function setupGenSelector() {
  updateGenSelectorUI();
}

if (typeof document !== "undefined" && !window._genSelectorDelegated) {
  window._genSelectorDelegated = true;
  document.addEventListener("click", function(e) {
    var target = e.target;
    var btn = target && (target.classList && target.classList.contains("gen-btn") ? target : (target.closest ? target.closest(".gen-btn") : null));
    if (!btn) return;
    var team = btn.getAttribute("data-team") || "west";
    var gAttr = btn.getAttribute("data-gen") || (btn.dataset && btn.dataset.gen);
    var gNum = parseInt(gAttr, 10);
    if (gNum >= 1 && gNum <= 6) {
      e.preventDefault();
      e.stopPropagation();
      toggleGeneration(team, gNum);
      if (typeof window !== "undefined" && window.TacticalAudio) window.TacticalAudio.playClick();
    }
  });
}
