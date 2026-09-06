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

| Gen | Historical Archetype | Speed | Turn Rate | Weaponry | OODA Latency |
|:---|:---|:---|:---|:---|:---|
| **Gen 1** | F-86 Sabre / MiG-15 | Transonic | Low | .50 Cal / 23mm guns | 24 frames |
| **Gen 2** | F-4 Phantom / MiG-21 | Mach 2.0 | Moderate | AIM-7 Sparrow / early IR | 18 frames |
| **Gen 3** | F-14 Tomcat / F-15 Eagle | Mach 2.5 | High | AIM-54 Phoenix / AIM-9L | 12 frames |
| **Gen 4** | F-16 Falcon / Su-27 Flanker | Mach 2.0 | 9G Sustained | AIM-120 AMRAAM / High-Off-Boresight | 6 frames |
| **Gen 5** | F-22 Raptor / Su-57 | Supercruise | Post-Stall TVC | Internal Bay AMRAAM / Stealth | 2 frames |
| **Gen 6** | NGAD / 6th-Gen Concept | Hypersonic | Extreme | Directed Energy / Adaptive Bypass | 1 frame |
| **Gen 7** | Autonomous CCA Swarms | Hyper-maneuver | AI-Coordinated | Swarm Kinetic / Zero-Lag Datashare | 0 frames |

---

## 4. Architecture & Engineering

* **Zero Garbage Collection Allocation**:
  * Utilizes `Float32Array` ring buffers (`StaticEntityPoolF32`, `ContrailRingBufferF32`) for missiles, flares, chaff, and bullet tracers to prevent GC pauses.
* **Physics Modeling**:
  * Proportional navigation guidance algorithm for missile interception trajectories.
  * Barometric altitude trading: Climbs convert kinetic energy to potential energy; dives accelerate via gravity.
* **Self-Contained**:
  * Pure client-side HTML5, CSS3, and vanilla JavaScript.
  * No external npm packages, no bundler required, no CDN dependencies.

---

## 5. Quickstart

Run a local HTTP server from the repository root:

```bash
# Python 3
python3 -m http.server 8080

# Or Node.js
npx serve .
```

Open `http://localhost:8080` in your browser.

---

## 6. Controls

* **`GEN: [1] [2] [3] [4] [5] [6] [7]`**: Click buttons to toggle specific aircraft generations into or out of the airspace.
* **`[ SCRAMBLE BLUE ]`**: Immediately scramble a fresh wave of Blue Force fighters.
* **`[ SCRAMBLE RED ]`**: Immediately scramble a fresh wave of Red Force fighters.

---

## 7. License

MIT License.
