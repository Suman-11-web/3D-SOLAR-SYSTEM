import { bus } from '../../core/EventBus';
import type { Engine } from '../../core/Engine';
import { SOLAR_BODIES, type BodyData } from '../../data/bodies';
import { TelemetryWidget } from '../hud/Telemetry';
import { RadarWidget } from '../hud/Radar';
import { CommsLogWidget } from '../hud/CommsLog';
import { CountdownOverlay } from '../hud/Countdown';
import { Crosshair } from '../hud/Crosshair';
import { BodyInfoPanel } from '../panels/BodyInfoPanel';
import { TimeController } from '../panels/TimeController';
import { ScalePanel } from '../panels/ScalePanel';
import { SettingsPanel } from '../panels/SettingsPanel';
import { scratchVec3A } from '../../utils/math';
import { gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

interface LabelItem {
  body: BodyData;
  el: HTMLElement;
}

export class ExplorerScreen {
  private topbar: HTMLElement;
  private leftStack: HTMLElement;
  private bottomBar: HTMLElement;
  private planetDock: HTMLElement;
  private photoOverlay: HTMLElement;

  private telemetry: TelemetryWidget;
  private radar: RadarWidget;
  private comms: CommsLogWidget;
  private dockButtons = new Map<string, HTMLButtonElement>();
  private labelItems: LabelItem[] = [];
  private labelsVisible = true;

  constructor(
    private uiLayer: HTMLElement,
    private labelsLayer: HTMLElement,
    private engine: Engine
  ) {
    this.topbar = document.createElement('header');
    this.topbar.className = 'hud-topbar';
    this.topbar.innerHTML = `
      <div class="hud-brand">
        <div class="hud-brand-mark"></div>
        <span class="hud-brand-title">HELIOS</span>
        <span class="hud-brand-sub">DSN // EPHEMERIS</span>
      </div>
      <nav class="hud-nav-modes" aria-label="Mission Modes">
        <button type="button" class="hud-btn active" id="nav-explorer">EXPLORER</button>
        <button type="button" class="hud-btn" id="nav-tour">GUIDED TOUR</button>
        <button type="button" class="hud-btn accent-amber" id="nav-launch">LAUNCH MISSION</button>
        <button type="button" class="hud-btn" id="nav-photo">PHOTO MODE</button>
      </nav>
      <div class="hud-actions">
        <button type="button" class="hud-btn" id="btn-palette" data-tooltip="Open Command Palette (Ctrl/Cmd+K)">
          <span>COMMAND</span>
          <span class="kbd-hint">⌘K</span>
        </button>
        <button type="button" class="hud-btn" id="btn-settings" data-tooltip="Graphics & HUD Settings">⚙</button>
      </div>
    `;
    this.uiLayer.appendChild(this.topbar);

    this.leftStack = document.createElement('div');
    this.leftStack.className = 'hud-left-stack';
    this.telemetry = new TelemetryWidget(this.engine);
    this.radar = new RadarWidget(this.engine);
    this.comms = new CommsLogWidget();
    this.leftStack.appendChild(this.telemetry.el);
    this.leftStack.appendChild(this.radar.el);
    this.leftStack.appendChild(this.comms.el);
    this.uiLayer.appendChild(this.leftStack);

    this.planetDock = document.createElement('nav');
    this.planetDock.className = 'planet-dock';
    this.planetDock.setAttribute('aria-label', 'Celestial Bodies Quick Select');
    for (const body of SOLAR_BODIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dock-item';
      btn.innerHTML = `
        <span class="dock-item-swatch" style="background:${body.primaryColor}"></span>
        <span>${body.name.split(' ')[0]}</span>
      `;
      btn.addEventListener('click', () => {
        if (this.engine.stateMachine.state !== 'EXPLORER') {
          void this.engine.stateMachine.transitionTo('EXPLORER');
        }
        bus.emit('body:select', { body, sourceElement: btn });
      });
      this.dockButtons.set(body.id, btn);
      this.planetDock.appendChild(btn);
    }
    this.uiLayer.appendChild(this.planetDock);

    this.bottomBar = document.createElement('footer');
    this.bottomBar.className = 'bottom-control-bar';
    const timeCtrl = new TimeController();
    const scalePanel = new ScalePanel();
    this.bottomBar.appendChild(timeCtrl.el);
    this.bottomBar.appendChild(scalePanel.el);
    this.uiLayer.appendChild(this.bottomBar);

    new BodyInfoPanel(this.uiLayer);
    new SettingsPanel(this.uiLayer, this.engine);
    new CountdownOverlay(this.uiLayer);
    new Crosshair(this.uiLayer);

    this.photoOverlay = document.createElement('div');
    this.photoOverlay.className = 'photo-overlay is-hidden';
    this.photoOverlay.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-cyan)">
        <span>OPTICAL TELEMETRY VIEWFINDER // RAW</span>
        <span>[SPACE] CAPTURE // [ESC] EXIT</span>
      </div>
      <div class="photo-controls">
        <button type="button" class="hud-btn accent-amber" id="btn-shutter">CAPTURE PNG (SPACE)</button>
        <button type="button" class="hud-btn" id="btn-exit-photo">EXIT PHOTO MODE</button>
      </div>
    `;
    this.uiLayer.appendChild(this.photoOverlay);

    this.create3DLabels();
    this.bindNavigation();
    this.registerStates();

    this.setChromeVisibility(false, true);

    this.engine.loop.add((dt, elapsed) => {
      if (this.engine.stateMachine.state === 'BOOT' || this.engine.stateMachine.state === 'INTRO') {
        return;
      }
      this.telemetry.update(dt, elapsed);
      this.radar.update(dt);
      this.update3DLabels();
    });
  }

  private create3DLabels(): void {
    for (const body of SOLAR_BODIES) {
      const el = document.createElement('div');
      el.className = 'body-label';
      el.innerHTML = `
        <span class="body-label-dot" style="background:${body.primaryColor}"></span>
        <span class="body-label-line"></span>
        <span class="body-label-tag">${body.name.split(' ')[0]}</span>
      `;
      el.addEventListener('click', () => {
        if (this.engine.stateMachine.state === 'EXPLORER') {
          bus.emit('body:select', { body, sourceElement: el });
        }
      });
      this.labelsLayer.appendChild(el);
      this.labelItems.push({ body, el });
    }

    bus.on('labels:toggle', ({ visible }) => {
      this.labelsVisible = visible;
      this.labelsLayer.style.display = visible ? 'block' : 'none';
    });
  }

  private update3DLabels(): void {
    if (!this.labelsVisible || this.engine.stateMachine.state === 'PHOTO') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const camPos = this.engine.camera.position;

    for (const item of this.labelItems) {
      const obj = this.engine.getBodyObject3D(item.body.id);
      if (!obj) continue;

      obj.getWorldPosition(scratchVec3A);
      const distToCam = camPos.distanceTo(scratchVec3A);

      if (item.body.id === 'moon' && distToCam > 42) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
        continue;
      }

      scratchVec3A.project(this.engine.camera);

      if (scratchVec3A.z > 1.0 || scratchVec3A.z < -1.0) {
        item.el.style.opacity = '0';
        item.el.style.pointerEvents = 'none';
        continue;
      }

      const x = (scratchVec3A.x * 0.5 + 0.5) * width;
      const y = (-scratchVec3A.y * 0.5 + 0.5) * height;

      item.el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      item.el.style.opacity = '0.88';
      item.el.style.pointerEvents = 'auto';
    }
  }

  private bindNavigation(): void {
    this.topbar.querySelector('#nav-explorer')?.addEventListener('click', () => {
      void this.engine.stateMachine.transitionTo('EXPLORER');
    });
    this.topbar.querySelector('#nav-tour')?.addEventListener('click', () => {
      void this.engine.stateMachine.transitionTo('TOUR');
    });
    this.topbar.querySelector('#nav-launch')?.addEventListener('click', () => {
      void this.engine.stateMachine.transitionTo('LAUNCH');
    });
    this.topbar.querySelector('#nav-photo')?.addEventListener('click', () => {
      void this.engine.stateMachine.transitionTo('PHOTO');
    });
    this.topbar.querySelector('#btn-palette')?.addEventListener('click', () => {
      bus.emit('palette:toggle', {});
    });
    this.topbar.querySelector('#btn-settings')?.addEventListener('click', () => {
      bus.emit('settings:toggle', {});
    });

    this.photoOverlay.querySelector('#btn-shutter')?.addEventListener('click', () => {
      bus.emit('photo:capture');
    });
    this.photoOverlay.querySelector('#btn-exit-photo')?.addEventListener('click', () => {
      void this.engine.stateMachine.transitionTo('EXPLORER');
    });

    bus.on('body:select', ({ body }) => {
      this.dockButtons.forEach((btn, id) => {
        btn.classList.toggle('active', body?.id === id);
      });
    });

    bus.on('state:change', ({ to }) => {
      this.topbar.querySelector('#nav-explorer')?.classList.toggle('active', to === 'EXPLORER');
      this.topbar.querySelector('#nav-tour')?.classList.toggle('active', to === 'TOUR');
      this.topbar.querySelector('#nav-launch')?.classList.toggle('active', to === 'LAUNCH');
      this.topbar.querySelector('#nav-photo')?.classList.toggle('active', to === 'PHOTO');
    });
  }

  private setChromeVisibility(visible: boolean, immediate = false): void {
    const targets = [this.topbar, this.leftStack, this.bottomBar, this.planetDock];
    const dur = immediate ? 0 : motionDuration(0.35);

    gsap.to(targets, {
      opacity: visible ? 1 : 0,
      duration: dur,
      onStart: () => {
        if (visible) {
          targets.forEach((t) => (t.style.pointerEvents = ''));
          this.labelsLayer.style.opacity = '1';
        }
      },
      onComplete: () => {
        if (!visible) {
          targets.forEach((t) => (t.style.pointerEvents = 'none'));
        }
      }
    });
  }

  private registerStates(): void {
    this.engine.stateMachine.register('EXPLORER', {
      onEnter: () => {
        this.setChromeVisibility(true);
      }
    });

    this.engine.stateMachine.register('PHOTO', {
      onEnter: () => {
        this.setChromeVisibility(false);
        this.labelsLayer.style.opacity = '0';
        this.photoOverlay.classList.remove('is-hidden');
        gsap.fromTo(
          this.photoOverlay,
          { opacity: 0 },
          { opacity: 1, duration: motionDuration(0.3) }
        );
      },
      onExit: () => {
        this.photoOverlay.classList.add('is-hidden');
        this.labelsLayer.style.opacity = '1';
      }
    });
  }
}
