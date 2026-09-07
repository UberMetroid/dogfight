// # Tactical Web Audio Synthesizer
//
// Logline: Zero-asset procedural sound engine for dogfights, radar, and sub-surface sonar.
//
(function (global) {
  "use strict";

  var ctx = null;
  var enabled = false;

  function initContext() {
    if (ctx) return ctx;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
    }
    return ctx;
  }

  global.TacticalAudio = {
    get enabled() { return enabled; },
    set enabled(val) {
      enabled = Boolean(val);
      if (enabled && !ctx) initContext();
      if (ctx && ctx.state === "suspended" && enabled) ctx.resume();
    },

    toggle: function () {
      this.enabled = !this.enabled;
      if (this.enabled) this.playClick();
      return this.enabled;
    },

    playClick: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.045);
    },

    playCannonBurst: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      // Synthesize 6 rapid gun pulses for 20mm Vulcan burst
      var now = c.currentTime;
      for (var i = 0; i < 5; i++) {
        var t = now + i * 0.018;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.015);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.016);
      }
    },

    playMissileLaunch: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      // White noise rocket motor whoosh
      var bufferSize = c.sampleRate * 0.35;
      var noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
      var output = noiseBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      var whiteNoise = c.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      var filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(400, c.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, c.currentTime + 0.25);
      filter.Q.value = 3.0;

      var gain = c.createGain();
      gain.gain.setValueAtTime(0.15, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.35);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      whiteNoise.start();
    },

    playCiwsBurst: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      // High-cadence 4500 RPM rotary Gatling CIWS buzz
      var now = c.currentTime;
      for (var i = 0; i < 8; i++) {
        var t = now + i * 0.011;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.010);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.010);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.011);
      }
    },

    playSamLaunch: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      // Sharp solid-fuel rocket motor blast and high-G boost hiss
      var bufferSize = c.sampleRate * 0.40;
      var noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
      var output = noiseBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      var whiteNoise = c.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      var filter = c.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, c.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3200, c.currentTime + 0.30);
      filter.Q.value = 4.5;

      var gain = c.createGain();
      gain.gain.setValueAtTime(0.18, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.40);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      whiteNoise.start();
    },

    playRadarLockTone: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(980, c.currentTime);
      osc.frequency.setValueAtTime(1400, c.currentTime + 0.06);
      gain.gain.setValueAtTime(0.06, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.12);
    },

    playSonarPing: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1250, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, c.currentTime + 0.8);
      gain.gain.setValueAtTime(0.14, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.9);
    },

    playExplosion: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, c.currentTime + 0.45);
      gain.gain.setValueAtTime(0.20, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.50);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.50);
    },

    playSplash: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      var bufferSize = c.sampleRate * 0.25;
      var noiseBuffer = c.createBuffer(1, bufferSize, c.sampleRate);
      var output = noiseBuffer.getChannelData(0);
      for (var i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
      var noise = c.createBufferSource();
      noise.buffer = noiseBuffer;
      var filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(600, c.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.25);
      var gain = c.createGain();
      gain.gain.setValueAtTime(0.18, c.currentTime);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      noise.start();
    },

    playTouchdown: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      // High-frequency rubber tire squeal chirp
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(2200, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.08);
      gain.gain.setValueAtTime(0.10, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + 0.085);
    },

    playRearmChime: function () {
      if (!enabled) return;
      var c = initContext();
      if (!c) return;
      var now = c.currentTime;
      [520, 780].forEach(function (freq, i) {
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.12, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.15);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.16);
      });
    }
  };

})(typeof window !== "undefined" ? window : this);
