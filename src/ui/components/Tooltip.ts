import { gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

export class TooltipManager {
  private el: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'ui-tooltip';
    this.el.setAttribute('role', 'tooltip');
    parent.appendChild(this.el);

    window.addEventListener('mouseover', (e) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-tooltip]') as HTMLElement | null;
      if (target) {
        const text = target.getAttribute('data-tooltip');
        if (text) this.show(text, target);
      }
    });

    window.addEventListener('mouseout', (e) => {
      const target = (e.target as HTMLElement | null)?.closest('[data-tooltip]');
      if (target) this.hide();
    });
  }

  private show(text: string, anchor: HTMLElement): void {
    this.el.textContent = text;
    const rect = anchor.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 180, Math.max(8, rect.left + rect.width / 2 - 50));
    const y = rect.top > 48 ? rect.top - 32 : rect.bottom + 8;

    this.el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    gsap.to(this.el, { opacity: 1, duration: motionDuration(0.16) });
  }

  private hide(): void {
    gsap.to(this.el, { opacity: 0, duration: motionDuration(0.12) });
  }
}
