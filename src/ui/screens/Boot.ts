import { bus } from '../../core/EventBus';
import type { StateMachine } from '../../core/StateMachine';
import { timelineManager } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

export class BootScreen {
  public el: HTMLElement;
  private logsEl: HTMLElement;
  private fillEl: HTMLElement;
  private pctEl: HTMLElement;

  constructor(
    parent: HTMLElement,
    private stateMachine: StateMachine
  ) {
    this.el = document.createElement('section');
    this.el.className = 'boot-screen';
    this.el.setAttribute('aria-label', 'System Boot Sequence');

    this.el.innerHTML = `
      <div class="boot-terminal">
        <div class="boot-header">
          <span>HELIOS // OS v4.8.2 KERNEL INIT</span>
          <span id="boot-pct">0%</span>
        </div>
        <div class="boot-logs" id="boot-logs"></div>
        <div class="boot-progress-track">
          <div class="boot-progress-fill" id="boot-fill"></div>
        </div>
      </div>
    `;

    parent.appendChild(this.el);
    this.logsEl = this.el.querySelector('#boot-logs') as HTMLElement;
    this.fillEl = this.el.querySelector('#boot-fill') as HTMLElement;
    this.pctEl = this.el.querySelector('#boot-pct') as HTMLElement;

    this.registerState();
    this.bindEvents();
  }

  private bindEvents(): void {
    bus.on('boot:progress', ({ percent, step }) => {
      this.fillEl.style.width = `${percent}%`;
      this.pctEl.textContent = `${percent}%`;

      const line = document.createElement('div');
      line.className = 'boot-log-line';
      line.innerHTML = `<span class="ok">[OK]</span> ${step}`;
      this.logsEl.appendChild(line);
    });

    bus.on('boot:complete', () => {
      void this.stateMachine.transitionTo('INTRO');
    });
  }

  private registerState(): void {
    this.stateMachine.register('BOOT', {
      onExit: () =>
        new Promise<void>((resolve) => {
          const tl = timelineManager.createChannel('state-transition');
          tl.to(this.el, {
            opacity: 0,
            scale: 1.03,
            duration: motionDuration(0.45),
            ease: 'power2.inOut',
            onComplete: () => {
              this.el.style.display = 'none';
              resolve();
            }
          });
        })
    });
  }
}
