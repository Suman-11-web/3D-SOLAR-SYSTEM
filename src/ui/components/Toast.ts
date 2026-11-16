import { bus } from '../../core/EventBus';
import { gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';

export class ToastManager {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'toast-stack';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    parent.appendChild(this.container);

    bus.on('toast:show', ({ title, message, type = 'info' }) => {
      this.show(title, message, type);
    });
  }

  public show(title: string, message: string, type: 'info' | 'success' | 'warn' = 'info'): void {
    const item = document.createElement('div');
    item.className = `toast-item ${type}`;
    item.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    `;
    this.container.appendChild(item);

    gsap.fromTo(
      item,
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: motionDuration(0.3), ease: 'power3.out' }
    );

    gsap.to(item, {
      opacity: 0,
      y: -10,
      delay: 3.4,
      duration: motionDuration(0.28),
      onComplete: () => item.remove()
    });
  }
}
