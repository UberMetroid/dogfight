# Fighter Jet Dogfight Simulation // John Boyd OODA Loop

A standalone, high-performance HTML5 Canvas simulation of aerial combat across 7 generations of fighter aircraft, based on **Col. John Boyd's Energy-Maneuverability (E-M) Theory** and the **OODA (Observe, Orient, Decide, Act) loop**.

Originally developed as the ambient background visual substrate for openOODA, preserved here as an independent, zero-dependency web simulation.

---

## 1. John Boyd's Energy-Maneuverability (E-M) Theory

Col. John Boyd quantified aerial combat capability through specific excess power ($P_s$):

$$\text{E-M} = \frac{T - D}{W} \times V$$

Where:
* **$T$**: Engine Thrust
* **$D$**: Aerodynamic Drag (parasitic and induced)
* **$W$**: Aircraft Weight
* **$V$**: Velocity

A fighter with a superior E-M ratio can gain or conserve energy while maneuvering, forcing the adversary into an energy deficit.

---

## 2. The OODA Loop in Code

The tactical decision cycle runs in real-time across four discrete phases:

1. **Observe (`src/dogfight/ooda-obs.js`)**:
   * Scans radar/IRST coverage cones.
   * Computes closing velocities and closure rates ($V_c$).
   * Measures line-of-sight (LOS) rates and target aspect angles.

2. **Orient (`src/dogfight/ooda-engage.js`)**:
   * Assesses tactical advantage (offensive, neutral, defensive).
   * Determines whether to engage in one-circle (nose-to-nose / radius fight) or two-circle (nose-to-tail / rate fight).

3. **Decide (`src/dogfight/ooda-decide.js`)**:
   * Decision latency scales inversely with fighter generation (Gen 1: 24 frames -> Gen 5: 2 frames -> Gen 7: 0 frames).
   * Gates missile release criteria: Within maximum aerodynamic range ($R_{\max}$) and no-escape zone ($R_{\text{ne}}$).
   * Countermeasure triggering: Deploys flares against heat-seeking missiles and chaff against radar-guided threats.

4. **Act (`src/dogfight/loop-sim.js`, `weapons-hi.js`, `weapons-lo.js`)**:
   * Emits lead-computed 20mm/30mm cannon tracer bursts.
   * Launches proportional navigation homing missiles with particle contrails.
   * Executes high-G defensive break turns and barrel rolls.

---

## 3. The 7 Fighter Generations

| Gen | Historical Era | Allied (Blue) | Opposing (Red) | Speed | Weaponry | OODA Latency |
|:---|:---|:---|:---|:---|:---|:---|
| **Gen 1** | 1944–1953 (Korea) | F-86 Sabre | MiG-15 Fagot | Transonic (M 0.9) | .50 Cal / 23mm guns | 24 frames |
| **Gen 2** | 1953–1965 (Vietnam) | F-4 Phantom / F-104 | MiG-21 Fishbed | Mach 2.0 | AIM-7 / K-13 IR | 18 frames |
| **Gen 3** | 1965–1975 (Cold War) | F-14 Tomcat / F-15 | Su-27 / MiG-23 | Mach 2.5 | AIM-54 Phoenix (BVR) | 12 frames |
| **Gen 4** | 1975–2000 (Air Superiority) | F-16 Viper / F-15C | Su-27 / MiG-29 | Mach 2.0 (9G) | AIM-120 AMRAAM / HOBS | 6 frames |
| **Gen 5** | 2000–2020 (VLO Stealth) | F-22 Raptor / F-35 | Su-57 Felon / J-20 | Supercruise | Internal Bays / 3D TVC | 2 frames |
| **Gen 6** | 2020–2035 (Air Dominance) | NGAD + CCA Drones | NGAD Red + CCA | Hypersonic | Directed Energy / Decoys | 1 frame |
| **Gen 7** | AI Era (Swarm Mesh) | Autonomous Swarm | Autonomous Swarm | Hyper-kinetic | Omnidirectional Kinetic | 0 frames |

---

## 4. Multi-Domain Battlespace Architecture

The simulation environment is organized into five vertically stratified operational domains:

```text
 100k FT  ===========================================================  ORBIT / NEAR-SPACE (SATELLITES)
  80k FT  -----------------------------------------------------------  STRATOSPHERE (U-2 / HYPERSONIC GLIDE)
  60k FT  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  SUPERCRUISE CORRIDOR (GEN 5/6)
  40k FT  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  BVR MISSILE INTERCEPT ARENA
  20k FT  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  TROPOSPHERE (DOGFIGHT ARENA)
   0 FT   =======================[ COASTLINE ]~~~~~~~~~~~~~~~~~~~~~~~  0 FT MSL // OCEAN SURFACE
          [ AIRBASE ALPHA // SAM BTY ]        | ~ ~ ~ CVN-78 STRIKE GROUP ~ ~ ~
                                              | -200m: CONTINENTAL SHELF
                                              | -600m: THERMOCLINE BARRIER
 -1000m   ____________________________________| -1000m: SUB-SURFACE WEAPONS CORRIDOR
```

* **Land Domain (West)**: Mountainous elevation profile, Airbase Alpha with active runway lighting, rotating EW radar, and coastal SAM battery.
* **Coastline Transition**: Cliffs and breaking surf lines separating land from sea.
* **Ocean Surface Domain (East)**: Wave dynamics, CVN-78 Aircraft Carrier strike group, and DDG-51 Aegis destroyer.
* **Sub-Surface Domain (Undersea)**: Delineated from 0m down to -1000m depth, including Continental Shelf drop-off, thermocline acoustic refraction barrier, and active acoustic sonar ping corridor.
* **Extensibility API**: `MultiDomainSystem.registerLandAsset()`, `registerSurfaceShip()`, and `registerSubSurfaceAsset()` allow modular addition of future land, naval, and sub-surface weapon systems.

---

## 5. Interactive Features & Controls

* **Interactive Plane Tracking**: Click any aircraft in the airspace to lock camera tracking and display live cockpit telemetry.
* **Cockpit Telemetry MFD**: Displays live Airspeed (Mach & KIAS), Altitude (MSL), G-Load, Col. John Boyd's Specific Excess Power ($P_s$) energy bar, and dynamic 4-step OODA Loop indicator (`[OBSERVE]` → `[ORIENT]` → `[DECIDE]` → `[ACT]`).
* **Warfare Generations Dossier**: Click `[ ⚔ WARFARE DOSSIER ]` to browse historical combat doctrines and launch authentic 1v1 historical duels.
* **Time Warp Controls**: `[ 0.5x ]` (Slow-mo), `[ 1x ]` (Realtime), `[ 2x ]` (Hyper-speed), `[ || ]` (Pause).
* **Tactical Audio Synthesizer**: Click `[ 🔊 SOUND ]` to toggle procedural Web Audio sound FX (Vulcan cannon bursts, rocket launches, radar lock chirps, and sonar pings).
* **Quick Scenarios**: One-click battle scenarios (`[ MIG ALLEY ]`, `[ FLEET DEFENSE ]`, `[ STEALTH CLASH ]`, `[ AI SWARM ]`, `[ ALL-OUT AIR WAR ]`).

---

## 6. Architecture & Engineering

* **Zero Garbage Collection Allocation**:
  * Utilizes `Float32Array` ring buffers (`StaticEntityPoolF32`, `ContrailRingBufferF32`) for missiles, flares, chaff, and bullet tracers to eliminate GC pauses.
* **Col. John Boyd E-M Modeling**:
  * Calculates barometric air density $\rho(h) = \rho_0 e^{-h/25000}$, dynamic pressure $q = \frac{1}{2}\rho V^2$, and specific excess power $P_s = \frac{T - D}{W} \times V$.
* **Zero External Dependencies**:
  * Pure client-side HTML5, CSS3, Web Audio API, and vanilla JavaScript.
  * Hosted directly on GitHub Pages: [https://ubermetroid.github.io/dogfight/](https://ubermetroid.github.io/dogfight/)

---

## 7. License

MIT License.
