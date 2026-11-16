import { bus } from '../../core/EventBus';
import { gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

export class CountdownOverlay {
  public el: HTMLElement;
  private clockEl: HTMLElement;
  private phaseEl: HTMLElement;
  private visible = false;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'hud-countdown';
    this.el.innerHTML = `
      <div class="countdown-phase" id="cd-phase">TERMINAL COUNTDOWN</div>
      <div class="countdown-clock" id="cd-clock">T-00:10.0</div>
    `;
    parent.appendChild(this.el);

    this.clockEl = this.el.querySelector('#cd-clock') as HTMLElement;
    this.phaseEl = this.el.querySelector('#cd-phase') as HTMLElement;

    bus.on('launch:telemetry', (data) => {
      if (data.phase === 'IDLE') {
        this.hide();
        return;
      }
      this.show();
      this.phaseEl.textContent = `MISSION PHASE // ${data.phase}`;
      const sign = data.countdown >= 0 ? 'T-' : 'T+';
      const abs = Math.abs(data.countdown).toFixed(1).padStart(5, '0');
      this.clockEl.textContent = `${sign}00:${abs}`;
    });

    bus.on('state:change', ({ to }) => {
      if (to !== 'LAUNCH') this.hide();
    });
  }

  private show(): void {
    if (this.visible) return;
    this.visible = true;
    gsap.to(this.el, { opacity: 1, duration: motionDuration(0.25) });
  }

  private hide(): void {
    if (!this.visible) return;
    this.visible = false;
    gsap.to(this.el, { opacity: 0, duration: motionDuration(0.2) });
  }
}
