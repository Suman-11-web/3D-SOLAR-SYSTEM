# HELIOS // Deep Space Mission Control & 3D Solar System Explorer

An interactive, fully procedural 3D solar system explorer wrapped in a bespoke sci-fi mission-control interface. Built with **TypeScript**, **Three.js**, **custom GLSL shaders**, **GSAP (Core, ScrollTrigger, Flip)**, and the **Web Audio API**.

## Key Features
- **Zero External Assets**: All planetary surfaces, atmospheres, solar granulation, lens flares, starfields, exhaust plumes, telemetry charts, and ambient/UI audio are synthesized procedurally at runtime.
- **Real Astronomical Ephemeris**: Accurate relative orbital periods, rotation periods, axial tilts, and physical metrics for the Sun, 8 planets, Earth's Moon, and Pluto, plus a 4,000-instance Asteroid Belt.
- **State-Driven Mission Interface**: Seamless state transitions (`BOOT → INTRO → EXPLORER ⇄ TOUR ⇄ LAUNCH ⇄ PHOTO`) managed by a safe timeline queue.
- **Interactive Launch Sequence**: Countdown checklist, multi-stage procedural spacecraft, shader exhaust plume, camera shake, Hohmann transfer arc, and live telemetry.

## Setup & Commands
```bash
npm install
npm run dev
npm run build