import { bus } from '../../core/EventBus';
import { SOLAR_BODIES } from '../../data/bodies';
import type { Engine } from '../../core/Engine';
import { audioEngine } from '../../audio/AudioEngine';
import { gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

interface CommandAction {
  id: string;
  title: string;
  category: string;
  keywords: string;
  run: () => void;
}

export class CommandPalette {
  private backdrop: HTMLElement;
  private input: HTMLInputElement;
  private listEl: HTMLUListElement;
  private actions: CommandAction[] = [];
  private filtered: CommandAction[] = [];
  private selectedIndex = 0;
  private isOpen = false;

  private orbitsVisible = true;
  private labelsVisible = true;

  constructor(
    parent: HTMLElement,
    private engine: Engine
  ) {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'cmd-palette-backdrop is-hidden';
    this.backdrop.setAttribute('role', 'dialog');
    this.backdrop.setAttribute('aria-modal', 'true');
    this.backdrop.setAttribute('aria-label', 'Mission Command Palette');

    this.backdrop.innerHTML = `
      <div class="cmd-palette-modal">
        <div class="cmd-input-wrap">
          <span style="color:var(--accent-cyan);font-family:var(--font-mono)">⌘K</span>
          <input type="text" class="cmd-input" placeholder="Search celestial bodies, telemetry commands, or mission modes..." aria-label="Command search input" />
        </div>
        <ul class="cmd-results" role="listbox"></ul>
      </div>
    `;

    parent.appendChild(this.backdrop);
    this.input = this.backdrop.querySelector('.cmd-input') as HTMLInputElement;
    this.listEl = this.backdrop.querySelector('.cmd-results') as HTMLUListElement;

    this.buildActions();
    this.bindEvents();
  }

  private buildActions(): void {
    for (const body of SOLAR_BODIES) {
      this.actions.push({
        id: `fly-${body.id}`,
        title: `Fly to ${body.name}`,
        category: body.classification,
        keywords: `fly goto focus planet star moon ${body.name.toLowerCase()}`,
        run: () => {
          void this.engine.stateMachine.transitionTo('EXPLORER');
          bus.emit('body:select', { body });
        }
      });
    }

    this.actions.push(
      {
        id: 'mode-tour',
        title: 'Start Guided Solar System Tour',
        category: 'Mission Mode',
        keywords: 'tour story scroll guide',
        run: () => void this.engine.stateMachine.transitionTo('TOUR')
      },
      {
        id: 'mode-launch',
        title: 'Open Interplanetary Launch Console',
        category: 'Mission Mode',
        keywords: 'launch rocket mission transfer',
        run: () => void this.engine.stateMachine.transitionTo('LAUNCH')
      },
      {
        id: 'mode-photo',
        title: 'Enter Optical Photo Mode',
        category: 'Viewport',
        keywords: 'photo screenshot camera hide ui',
        run: () => void this.engine.stateMachine.transitionTo('PHOTO')
      },
      {
        id: 'toggle-orbits',
        title: 'Toggle Orbital Trajectory Lines',
        category: 'HUD',
        keywords: 'orbits lines paths toggle',
        run: () => {
          this.orbitsVisible = !this.orbitsVisible;
          bus.emit('orbits:toggle', { visible: this.orbitsVisible });
        }
      },
      {
        id: 'toggle-labels',
        title: 'Toggle Celestial Callout Labels',
        category: 'HUD',
        keywords: 'labels names tags toggle',
        run: () => {
          this.labelsVisible = !this.labelsVisible;
          bus.emit('labels:toggle', { visible: this.labelsVisible });
        }
      },
      {
        id: 'scale-toggle',
        title: 'Toggle Visual vs True Relative Scale',
        category: 'Ephemeris',
        keywords: 'scale true visual size distance',
        run: () => {
          const nextMode = this.engine.scaleMode === 'visual' ? 'true' : 'visual';
          bus.emit('scale:change', { mode: nextMode, factor: nextMode === 'true' ? 1 : 0 });
        }
      },
      {
        id: 'speed-1x',
        title: 'Set Time Speed: 1x Realtime',
        category: 'Chronometer',
        keywords: 'time speed 1x normal',
        run: () => bus.emit('time:speed', { targetSpeed: 1, paused: false })
      },
      {
        id: 'speed-100x',
        title: 'Set Time Speed: 100x Warp',
        category: 'Chronometer',
        keywords: 'time speed 100x fast',
        run: () => bus.emit('time:speed', { targetSpeed: 100, paused: false })
      },
      {
        id: 'speed-1000x',
        title: 'Set Time Speed: 1000x Hyperwarp',
        category: 'Chronometer',
        keywords: 'time speed 1000x max',
        run: () => bus.emit('time:speed', { targetSpeed: 1000, paused: false })
      },
      {
        id: 'audio-mute',
        title: 'Toggle Mission Audio Synthesizer Mute',
        category: 'Audio',
        keywords: 'mute sound audio volume',
        run: () => bus.emit('audio:mute', { muted: !audioEngine.isMuted })
      }
    );
  }

  private bindEvents(): void {
    bus.on('palette:toggle', ({ open }) => {
      const next = open !== undefined ? open : !this.isOpen;
      if (next) this.open();
      else this.close();
    });

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    this.input.addEventListener('input', () => {
      this.selectedIndex = 0;
      this.renderList();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % Math.max(1, this.filtered.length);
        this.renderList();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex =
          (this.selectedIndex - 1 + Math.max(1, this.filtered.length)) %
          Math.max(1, this.filtered.length);
        this.renderList();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = this.filtered[this.selectedIndex];
        if (item) {
          item.run();
          this.close();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    });
  }

  public open(): void {
    this.isOpen = true;
    this.backdrop.classList.remove('is-hidden');
    this.input.value = '';
    this.selectedIndex = 0;
    this.renderList();
    gsap.fromTo(
      this.backdrop.firstElementChild,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: motionDuration(0.22), ease: 'power3.out' }
    );
    this.input.focus();
  }

  public close(): void {
    this.isOpen = false;
    this.backdrop.classList.add('is-hidden');
  }

  private renderList(): void {
    const q = this.input.value.trim().toLowerCase();
    this.filtered = this.actions.filter((a) => {
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || a.keywords.includes(q);
    });

    this.listEl.innerHTML = '';
    this.filtered.forEach((action, idx) => {
      const li = document.createElement('li');
      li.className = `cmd-item ${idx === this.selectedIndex ? 'selected' : ''}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(idx === this.selectedIndex));
      li.innerHTML = `
        <span>${action.title}</span>
        <span class="cmd-item-category">${action.category}</span>
      `;
      li.addEventListener('click', () => {
        action.run();
        this.close();
      });
      this.listEl.appendChild(li);
    });
  }
}
