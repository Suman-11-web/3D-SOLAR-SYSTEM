import * as THREE from 'three';
import { bus, type LaunchTelemetryData } from '../../core/EventBus';
import type { Engine } from '../../core/Engine';
import { SOLAR_BODIES, BODY_MAP } from '../../data/bodies';
import { audioEngine } from '../../audio/AudioEngine';

export class LaunchScreen {
  public el: HTMLElement;
  private targetSelect: HTMLSelectElement;
  private launchBtn: HTMLButtonElement;
  private abortBtn: HTMLButtonElement;
  private altVal: HTMLElement;
  private velVal: HTMLElement;
  private fuelVal: HTMLElement;
  private checklistItems: HTMLElement[] = [];

  private missionActive = false;
  private missionTimer = 0;
  private targetBodyId = 'mars';
  private lastCountdownBeep = 11;

  private originVec = new THREE.Vector3();
  private destVec = new THREE.Vector3();

  constructor(
    parent: HTMLElement,
    private engine: Engine
  ) {
    this.el = document.createElement('aside');
    this.el.className = 'launch-screen is-hidden';
    this.el.setAttribute('aria-label', 'Interplanetary Launch Control');

    const destinations = SOLAR_BODIES.filter((b) => b.id !== 'sun' && b.id !== 'earth');
    const optionsHtml = destinations
      .map(
        (b) =>
          `<option value="${b.id}" ${b.id === 'mars' ? 'selected' : ''}>${b.name.toUpperCase()} (${b.semiMajorAxisAU} AU)</option>`
      )
      .join('');

    this.el.innerHTML = `
      <div class="hud-widget-header">
        <span>MISSION // FLIGHT DIRECTOR</span>
        <span style="color:var(--accent-amber)">PAD-39A</span>
      </div>
      <label style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-secondary)">
        TARGET TRANSFER DESTINATION
        <select id="launch-target" style="width:100%;margin-top:6px;padding:8px;background:var(--bg-surface-solid);color:var(--text-primary);border:1px solid var(--border-active);border-radius:4px;font-family:var(--font-mono)">
          ${optionsHtml}
        </select>
      </label>
      <div class="checklist-grid">
        <div class="checklist-item"><span>GNC GUIDANCE</span><span class="chk-status">STBY</span></div>
        <div class="checklist-item"><span>CRYO LOX/CH4</span><span class="chk-status">STBY</span></div>
        <div class="checklist-item"><span>DSN TELEMETRY</span><span class="chk-status">STBY</span></div>
        <div class="checklist-item"><span>TVC GIMBAL</span><span class="chk-status">STBY</span></div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">ALTITUDE</div>
          <div class="metric-value"><span id="lm-alt">0</span><span class="metric-unit">km</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">VELOCITY</div>
          <div class="metric-value"><span id="lm-vel">0.0</span><span class="metric-unit">km/s</span></div>
        </div>
        <div class="metric-card" style="grid-column: span 2">
          <div class="metric-label">PROPELLANT REMAINING</div>
          <div class="metric-value"><span id="lm-fuel">100.0</span><span class="metric-unit">%</span></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px">
        <button type="button" class="hud-btn accent-amber" id="btn-initiate-launch" style="flex:1;justify-content:center;padding:10px">INITIATE LAUNCH</button>
        <button type="button" class="hud-btn" id="btn-abort-launch" style="padding:10px">ABORT</button>
      </div>
    `;

    parent.appendChild(this.el);

    this.targetSelect = this.el.querySelector('#launch-target') as HTMLSelectElement;
    this.launchBtn = this.el.querySelector('#btn-initiate-launch') as HTMLButtonElement;
    this.abortBtn = this.el.querySelector('#btn-abort-launch') as HTMLButtonElement;
    this.altVal = this.el.querySelector('#lm-alt') as HTMLElement;
    this.velVal = this.el.querySelector('#lm-vel') as HTMLElement;
    this.fuelVal = this.el.querySelector('#lm-fuel') as HTMLElement;
    this.checklistItems = Array.from(this.el.querySelectorAll('.checklist-item'));

    this.targetSelect.addEventListener('change', () => {
      this.targetBodyId = this.targetSelect.value;
    });

    this.launchBtn.addEventListener('click', () => {
      this.startLaunchSequence();
    });

    this.abortBtn.addEventListener('click', () => {
      this.abortLaunch();
    });

    this.registerState();
    this.engine.loop.add((dt) => this.updateMission(dt));
  }

  private startLaunchSequence(): void {
    if (this.missionActive) return;
    this.missionActive = true;
    this.missionTimer = -10.0;
    this.lastCountdownBeep = 11;
    this.targetBodyId = this.targetSelect.value;

    const earthObj = this.engine.getBodyObject3D('earth');
    const earthData = BODY_MAP.get('earth')!;
    if (earthObj) {
      this.engine.cameraRig.focusOnBody(earthObj, this.engine.getBodyCurrentRadius(earthData));
    }

    this.engine.spacecraft.setMissionVisible(true);

    bus.emit('comms:log', {
      sender: 'FLIGHT/DIR',
      message: `Terminal countdown initiated for Hohmann transfer to ${this.targetBodyId.toUpperCase()}.`,
      level: 'warn'
    });
  }

  private abortLaunch(): void {
    if (!this.missionActive) return;
    this.missionActive = false;
    this.engine.cameraRig.setShake(0);
    this.engine.spacecraft.setMissionVisible(false);

    this.checklistItems.forEach((item) => {
      item.classList.remove('go');
      const st = item.querySelector('.chk-status');
      if (st) st.textContent = 'STBY';
    });

    bus.emit('launch:telemetry', {
      phase: 'IDLE',
      countdown: 0,
      altitudeKm: 0,
      velocityKms: 0,
      fuelPct: 100,
      progress: 0,
      targetBodyId: this.targetBodyId
    });

    bus.emit('comms:log', {
      sender: 'FLIGHT/DIR',
      message: 'Launch sequence safed and reset.',
      level: 'info'
    });
  }

  private updateMission(dt: number): void {
    if (!this.missionActive) return;

    this.missionTimer += dt * 1.45;
    const t = this.missionTimer;

    this.engine.getBodyWorldPosition('earth', this.originVec);
    this.engine.getBodyWorldPosition(this.targetBodyId, this.destVec);

    let phase: LaunchTelemetryData['phase'] = 'COUNTDOWN';
    let progress = 0;
    let thrust = 0;
    let altitudeKm = 0;
    let velocityKms = 0;
    let fuelPct = 100;

    if (t < 0) {
      phase = 'COUNTDOWN';
      const secRemaining = Math.ceil(-t);
      if (secRemaining < this.lastCountdownBeep) {
        this.lastCountdownBeep = secRemaining;
        audioEngine.playBlip(secRemaining <= 3 ? 960 : 720, 0.08, 'square', 0.14);

        const checkIdx = 4 - Math.min(4, Math.ceil(secRemaining / 2.5));
        this.checklistItems.forEach((el, i) => {
          if (i <= checkIdx) {
            el.classList.add('go');
            const st = el.querySelector('.chk-status');
            if (st) st.textContent = 'GO';
          }
        });
      }
      thrust = t > -1.5 ? (t + 1.5) / 1.5 : 0;
      this.engine.cameraRig.setShake(thrust * 0.18);
    } else if (t < 3.5) {
      phase = 'LIFTOFF';
      progress = t / 18.0;
      thrust = 1.0;
      altitudeKm = t * 185;
      velocityKms = t * 3.4;
      fuelPct = 100 - t * 8;
      this.engine.cameraRig.setShake(0.32);
      this.engine.cameraRig.focusOnBody(this.engine.spacecraft.shipMeshGroup, 0.8);
    } else if (t < 7.0) {
      phase = 'MAX_Q';
      progress = t / 18.0;
      thrust = 1.0;
      altitudeKm = 650 + (t - 3.5) * 4200;
      velocityKms = 11.9 + (t - 3.5) * 4.5;
      fuelPct = 72 - (t - 3.5) * 9;
      this.engine.cameraRig.setShake(0.16);
    } else if (t < 9.5) {
      phase = 'STAGE_SEP';
      progress = t / 18.0;
      thrust = 0.75;
      altitudeKm = 15350 + (t - 7.0) * 85000;
      velocityKms = 27.6 + (t - 7.0) * 3.2;
      fuelPct = 40 - (t - 7.0) * 5;
      this.engine.cameraRig.setShake(0.05);
    } else if (t < 18.0) {
      phase = 'TRANSIT';
      progress = t / 18.0;
      thrust = 0.45;
      altitudeKm = 228000 + (t - 9.5) * 1450000;
      velocityKms = 35.8;
      fuelPct = Math.max(8.4, 27.5 - (t - 9.5) * 2.2);
      this.engine.cameraRig.setShake(0);
    } else {
      phase = 'ARRIVAL';
      progress = 1.0;
      thrust = 0.0;
      altitudeKm = 420;
      velocityKms = 7.8;
      fuelPct = 8.4;
      this.engine.cameraRig.setShake(0);

      const destBody = BODY_MAP.get(this.targetBodyId);
      const destObj = this.engine.getBodyObject3D(this.targetBodyId);
      if (destBody && destObj) {
        this.engine.cameraRig.focusOnBody(destObj, this.engine.getBodyCurrentRadius(destBody));
      }

      this.missionActive = false;
      bus.emit('toast:show', {
        title: 'ORBITAL INSERTION CONFIRMED',
        message: `Spacecraft arrived at ${this.targetBodyId.toUpperCase()} capture orbit.`,
        type: 'success'
      });
      bus.emit('comms:log', {
        sender: 'NAV/ORBIT',
        message: `Orbital capture burn complete at ${this.targetBodyId.toUpperCase()}.`,
        level: 'success'
      });
    }

    this.engine.spacecraft.updateTransferTrajectory(this.originVec, this.destVec, progress, thrust);

    this.altVal.textContent = Math.round(altitudeKm).toLocaleString();
    this.velVal.textContent = velocityKms.toFixed(1);
    this.fuelVal.textContent = fuelPct.toFixed(1);

    bus.emit('launch:telemetry', {
      phase,
      countdown: t,
      altitudeKm,
      velocityKms,
      fuelPct,
      progress,
      targetBodyId: this.targetBodyId
    });
  }

  private registerState(): void {
    this.engine.stateMachine.register('LAUNCH', {
      onEnter: () => {
        this.el.classList.remove('is-hidden');
        const earthObj = this.engine.getBodyObject3D('earth');
        const earthData = BODY_MAP.get('earth');
        if (earthObj && earthData && !this.missionActive) {
          this.engine.cameraRig.focusOnBody(earthObj, this.engine.getBodyCurrentRadius(earthData));
        }
      },
      onExit: () => {
        this.el.classList.add('is-hidden');
        this.engine.cameraRig.setShake(0);
      }
    });
  }
}
