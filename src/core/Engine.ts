import * as THREE from 'three';
import { Loop } from './Loop';
import { QualityManager } from './QualityManager';
import { StateMachine } from './StateMachine';
import { Input } from './Input';
import { bus, type ScaleMode } from './EventBus';
import { SOLAR_BODIES, BODY_MAP, type BodyData } from '../data/bodies';
import { Starfield } from '../scene/Starfield';
import { Sun } from '../scene/Sun';
import { Planet } from '../scene/Planet';
import { Moon } from '../scene/Moon';
import { AsteroidBelt } from '../scene/AsteroidBelt';
import { Spacecraft } from '../scene/Spacecraft';
import { CameraRig } from '../scene/CameraRig';
import { damp, scratchVec3A } from '../utils/math';

export class Engine {
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public loop = new Loop();
  public quality = new QualityManager();
  public stateMachine = new StateMachine();
  public cameraRig!: CameraRig;
  public input!: Input;

  public starfield!: Starfield;
  public sun!: Sun;
  public planets: Planet[] = [];
  public planetMap = new Map<string, Planet>();
  public moon!: Moon;
  public asteroidBelt!: AsteroidBelt;
  public spacecraft!: Spacecraft;

  // Time & Ephemeris Simulation State
  public simDays = 0;
  public currentSpeed = 1; // Days per real second at 1x = 0.25 days/s
  public targetSpeed = 1;
  public isPaused = false;
  private epochTimeMs = Date.UTC(2026, 10, 16, 12, 0, 0);

  // Scale State (0 = Visual Scale, 1 = True Relative Scale)
  public scaleMode: ScaleMode = 'visual';
  public scaleFactor = 0;
  public targetScaleFactor = 0;

  private focusedBodyId: string | null = null;
  private hoveredBodyId: string | null = null;

  constructor(private canvas: HTMLCanvasElement) {}

  public async initWithProgress(): Promise<boolean> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    bus.emit('boot:progress', { percent: 12, step: 'INITIALIZING WEBGL2 CONTEXT & FRAMEBUFFERS...' });
    await sleep(110);

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    } catch {
      return false;
    }

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(this.quality.settings.pixelRatio);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      4000
    );
    this.cameraRig = new CameraRig(this.camera);

    bus.emit('boot:progress', { percent: 32, step: 'SYNTHESIZING GPU PARALLAX STARFIELD...' });
    await sleep(130);
    this.starfield = new Starfield(this.quality.settings.starCount);
    this.scene.add(this.starfield.points);

    bus.emit('boot:progress', { percent: 52, step: 'IGNITING SOLAR PHOTOSPHERE & CORONA SHADERS...' });
    await sleep(140);
    const sunData = BODY_MAP.get('sun')!;
    this.sun = new Sun(sunData, this.quality.settings.sphereSegments);
    this.scene.add(this.sun.group);

    bus.emit('boot:progress', { percent: 74, step: 'GENERATING PLANETARY EPHEMERIS & GLSL SURFACES...' });
    await sleep(150);

    for (const data of SOLAR_BODIES) {
      if (data.id === 'sun' || data.id === 'moon') continue;
      const planet = new Planet(data, this.quality.settings.sphereSegments);
      this.planets.push(planet);
      this.planetMap.set(data.id, planet);
      this.scene.add(planet.rootGroup);
      this.scene.add(planet.orbitLine);
    }

    const earth = this.planetMap.get('earth')!;
    const moonData = BODY_MAP.get('moon')!;
    this.moon = new Moon(moonData, earth.bodyGroup);

    bus.emit('boot:progress', { percent: 88, step: 'INSTANCING MAIN ASTEROID BELT & SPACECRAFT...' });
    await sleep(130);
    this.asteroidBelt = new AsteroidBelt(4000);
    this.asteroidBelt.setVisibleCount(this.quality.settings.asteroidCount);
    this.scene.add(this.asteroidBelt.mesh);

    this.spacecraft = new Spacecraft();
    this.scene.add(this.spacecraft.group);

    bus.emit('boot:progress', { percent: 100, step: 'TELEMETRY ONLINE. READY FOR COMMAND.' });
    await sleep(160);

    this.input = new Input(this.canvas, this.camera, this.cameraRig, this.stateMachine);
    this.input.setPickables(this.sun, this.planets, this.moon);

    this.bindBusEvents();
    window.addEventListener('resize', this.onResize);

    this.loop.add(this.update);
    this.loop.start();

    return true;
  }

  private bindBusEvents(): void {
    bus.on('quality:change', ({ settings }) => {
      this.renderer.setPixelRatio(settings.pixelRatio);
      this.asteroidBelt.setVisibleCount(settings.asteroidCount);
      this.starfield.setActiveRatio(settings.starCount / 14000);
    });

    bus.on('time:speed', ({ targetSpeed, paused }) => {
      this.targetSpeed = targetSpeed;
      this.isPaused = paused;
    });

    bus.on('scale:change', ({ mode, factor }) => {
      this.scaleMode = mode;
      this.targetScaleFactor = factor;
    });

    bus.on('orbits:toggle', ({ visible }) => {
      this.planets.forEach((p) => p.setOrbitVisible(visible));
      this.moon.setOrbitVisible(visible);
    });

    bus.on('body:hover', ({ body }) => {
      this.hoveredBodyId = body ? body.id : null;
      this.updateOrbitHighlights();
    });

    bus.on('body:select', ({ body }) => {
      this.focusedBodyId = body ? body.id : null;
      this.updateOrbitHighlights();
      if (body) {
        const targetObj = this.getBodyObject3D(body.id);
        const radius = this.getBodyCurrentRadius(body);
        if (targetObj) {
          this.cameraRig.focusOnBody(targetObj, radius, body.id === 'sun');
        }
      } else {
        this.cameraRig.focusOverview();
      }
    });

    bus.on('photo:capture', () => {
      this.captureScreenshot();
    });
  }

  private updateOrbitHighlights(): void {
    for (const planet of this.planets) {
      const id = planet.data.id;
      const isFocused = id === this.focusedBodyId;
      const isHovered = id === this.hoveredBodyId;
      planet.setOrbitHighlight(isFocused, isHovered);
    }
  }

  public getBodyObject3D(id: string): THREE.Object3D | null {
    if (id === 'sun') return this.sun.mesh;
    if (id === 'moon') return this.moon.mesh;
    const p = this.planetMap.get(id);
    return p ? p.mesh : null;
  }

  public getBodyWorldPosition(id: string, target: THREE.Vector3): THREE.Vector3 {
    const obj = this.getBodyObject3D(id);
    if (obj) {
      obj.getWorldPosition(target);
    } else {
      target.set(0, 0, 0);
    }
    return target;
  }

  public getBodyCurrentRadius(data: BodyData): number {
    return THREE.MathUtils.lerp(data.visualRadius, data.trueScaleRadius, this.scaleFactor);
  }

  private update = (dt: number, elapsed: number): void => {
    this.quality.update(dt, this.loop.currentFps);

    // Smooth speed interpolation
    const effectiveTargetSpeed = this.isPaused ? 0 : this.targetSpeed;
    this.currentSpeed = damp(this.currentSpeed, effectiveTargetSpeed, 6.5, dt);

    // Advance simulation days (1x = 0.5 Earth days per second for visible orbital motion)
    const deltaDays = dt * this.currentSpeed * 0.5;
    this.simDays += deltaDays;

    // Smooth scale factor interpolation
    this.scaleFactor = damp(this.scaleFactor, this.targetScaleFactor, 4.0, dt);

    // Update entities
    this.starfield.update(elapsed, this.camera.position);
    this.sun.update(elapsed, this.simDays, this.scaleFactor, this.camera);

    const sunWorldPos = scratchVec3A.set(0, 0, 0);
    for (const planet of this.planets) {
      planet.update(elapsed, this.simDays, this.scaleFactor, sunWorldPos);
    }
    this.moon.update(elapsed, this.simDays, this.scaleFactor, sunWorldPos);
    this.asteroidBelt.update(elapsed, this.simDays, this.scaleFactor);
    this.spacecraft.update(dt, elapsed);

    this.cameraRig.update(dt);

    // Emit periodic time update
    const currentDate = new Date(this.epochTimeMs + this.simDays * 86400 * 1000);
    bus.emit('time:update', {
      simDays: this.simDays,
      currentSpeed: this.currentSpeed,
      date: currentDate,
      paused: this.isPaused
    });

    this.renderer.render(this.scene, this.camera);
  };

  private captureScreenshot(): void {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `HELIOS-telemetry-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    bus.emit('toast:show', {
      title: 'OPTICAL CAPTURE COMPLETE',
      message: 'High-resolution PNG telemetry frame saved to disk.',
      type: 'success'
    });
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public dispose(): void {
    this.loop.stop();
    window.removeEventListener('resize', this.onResize);
    this.input.dispose();
    this.starfield.dispose();
    this.sun.dispose();
    this.planets.forEach((p) => p.dispose());
    this.moon.dispose();
    this.asteroidBelt.dispose();
    this.spacecraft.dispose();
    this.renderer.dispose();
  }
}