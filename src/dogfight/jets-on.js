// # Jets Enabled & Independent Blue / Red Generation Management
//
// Logline: Independent generation activation for Blue and Red forces to enable asymmetric warfare.
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

// Independent Generation Masks for Blue and Red
var activeGensBlue = { 1: false, 2: false, 3: false, 4: true, 5: false, 6: false, 7: false };
var activeGensRed  = { 1: false, 2: false, 3: false, 4: true, 5: false, 6: false, 7: false };

// Unified mask for legacy modules
var activeGens = { 1: false, 2: false, 3: false, 4: true, 5: false, 6: false, 7: false };

function syncMergedActiveGens() {
  for (var g = 1; g <= 7; g++) {
    activeGens[g] = Boolean(activeGensBlue[g] || activeGensRed[g]);
  }
}

function loadActiveGens() {
  try {
    if (typeof localStorage !== "undefined") {
      var sB = localStorage.getItem("ooda-gens-blue-v2");
      var sR = localStorage.getItem("ooda-gens-red-v2");
      if (sB) {
        var pB = JSON.parse(sB);
        for (var gb = 1; gb <= 7; gb++) if (typeof pB[gb] !== "undefined") activeGensBlue[gb] = Boolean(pB[gb]);
      }
      if (sR) {
        var pR = JSON.parse(sR);
        for (var gr = 1; gr <= 7; gr++) if (typeof pR[gr] !== "undefined") activeGensRed[gr] = Boolean(pR[gr]);
      }
    }
  } catch (e) {}
  syncMergedActiveGens();
}
loadActiveGens();

function hasAnyActiveGen() {
  for (var k = 1; k <= 7; k++) {
    if (activeGensBlue[k] || activeGensRed[k]) return true;
  }
  return false;
}

function saveActiveGens() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("ooda-gens-blue-v2", JSON.stringify(activeGensBlue));
      localStorage.setItem("ooda-gens-red-v2", JSON.stringify(activeGensRed));
    }
  } catch (e) {}
}

function getRandomActiveGen(team, preferred) {
  var mask = (team === "red") ? activeGensRed : activeGensBlue;
  var available = [];
  for (var g = 1; g <= 7; g++) {
    if (mask[g]) available.push(g);
  }
  if (available.length === 0) {
    // Fallback to merged
    for (var m = 1; m <= 7; m++) if (activeGens[m]) available.push(m);
  }
  if (available.length === 0) return 4;
  if (preferred && mask[preferred]) return preferred;
  return available[Math.floor(Math.random() * available.length)];
}

function updateGenSelectorUI() {
  var btns = document.querySelectorAll(".gen-btn");
  for (var i = 0; i < btns.length; i++) {
    var btn = btns[i];
    var team = btn.getAttribute("data-team") || "blue";
    var gAttr = btn.getAttribute("data-gen") || (btn.dataset && btn.dataset.gen);
    var gNum = parseInt(gAttr, 10);
    if (gNum >= 1 && gNum <= 7) {
      var isAct = (team === "red") ? Boolean(activeGensRed[gNum]) : Boolean(activeGensBlue[gNum]);
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
  if (genNum < 1 || genNum > 7) return;

  if (team === "blue") {
    activeGensBlue[genNum] = !activeGensBlue[genNum];
  } else if (team === "red") {
    activeGensRed[genNum] = !activeGensRed[genNum];
  } else {
    var nextVal = !(activeGensBlue[genNum] && activeGensRed[genNum]);
    activeGensBlue[genNum] = nextVal;
    activeGensRed[genNum] = nextVal;
  }

  syncMergedActiveGens();
  saveActiveGens();
  updateGenSelectorUI();

  var genNames = [
    "",
    "GEN 1 (F-86 / MiG-15)",
    "GEN 2 (F-4 / MiG-21)",
    "GEN 3 (F-14 / MiG-23)",
    "GEN 4 (F-16 / Su-27)",
    "GEN 5 (F-22 / Su-57)",
    "GEN 6 (NGAD / CCA)",
    "GEN 7 (Quantum Swarm)"
  ];

  if (typeof dfRadio === "function") {
    var teamLabel = (team === "blue") ? "BLUE FORCE" : ((team === "red") ? "RED FORCE" : "ALL FORCES");
    var state = (team === "red" ? activeGensRed[genNum] : activeGensBlue[genNum]) ? "[ACTIVE]" : "[OFFLINE]";
    dfRadio("TAC-NET: " + teamLabel + " // " + genNames[genNum] + " " + state);
  }

  if (typeof syncFleetToActiveGenerations === "function") {
    syncFleetToActiveGenerations(activeGensBlue, activeGensRed);
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
    var team = btn.getAttribute("data-team") || "blue";
    var gAttr = btn.getAttribute("data-gen") || (btn.dataset && btn.dataset.gen);
    var gNum = parseInt(gAttr, 10);
    if (gNum >= 1 && gNum <= 7) {
      e.preventDefault();
      e.stopPropagation();
      toggleGeneration(team, gNum);
      if (typeof window !== "undefined" && window.TacticalAudio) window.TacticalAudio.playClick();
    }
  });
}
