import { bus } from '../../core/EventBus';
import { gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

export class Crosshair {
  public el: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'hud-crosshair';
    this.el.innerHTML = `
      <svg viewBox="0 0 64 64" fill="none" stroke="var(--accent-cyan)" stroke-width="1.5">
        <path d="M16 4 H4 V16" />
        <path d="M48 4 H60 V16" />
        <path d="M16 60 H4 V48" />
        <path d="M48 60 H60 V48" />
        <circle cx="32" cy="32" r="18" stroke-dasharray="4 4" stroke="var(--accent-amber)" />
      </svg>
    `;
    parent.appendChild(this.el);

    bus.on('body:hover', ({ body, screenPos }) => {
      if (body && screenPos) {
        this.el.style.transform = `translate3d(${Math.round(screenPos.x)}px, ${Math.round(screenPos.y)}px, 0)`;
        gsap.to(this.el, { opacity: 1, scale: 1, duration: motionDuration(0.18) });
      } else {
        gsap.to(this.el, { opacity: 0, scale: 1.25, duration: motionDuration(0.18) });
      }
    });
  }
}
