import { bus } from '../../core/EventBus';

export class CommsLogWidget {
  public el: HTMLElement;
  private entriesEl: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'hud-widget comms-log';
    this.el.innerHTML = `
      <div class="hud-widget-header">
        <span>DSN // COMMS LOG</span>
        <span>CH-01</span>
      </div>
      <div class="comms-entries" role="log" aria-live="polite"></div>
    `;

    this.entriesEl = this.el.querySelector('.comms-entries') as HTMLElement;

    bus.on('comms:log', ({ sender, message, level = 'info' }) => {
      this.appendMessage(sender, message, level);
    });

    bus.on('body:select', ({ body }) => {
      if (body) {
        this.appendMessage(
          'NAV/LOCK',
          `Optical tracking locked onto ${body.name.toUpperCase()} (${body.semiMajorAxisAU} AU).`,
          'accent'
        );
      }
    });
  }

  public appendMessage(
    sender: string,
    message: string,
    level: 'info' | 'warn' | 'success' | 'accent' = 'info'
  ): void {
    const entry = document.createElement('div');
    entry.className = `comms-entry ${level}`;
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    entry.innerHTML = `<span class="comms-time">[${timeStr}]</span><strong>${sender}:</strong> `;

    const textSpan = document.createElement('span');
    entry.appendChild(textSpan);
    this.entriesEl.appendChild(entry);
    this.entriesEl.scrollTop = this.entriesEl.scrollHeight;

    let idx = 0;
    const step = () => {
      idx += 3;
      textSpan.textContent = message.slice(0, idx);
      this.entriesEl.scrollTop = this.entriesEl.scrollHeight;
      if (idx < message.length) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);

    while (this.entriesEl.children.length > 24) {
      this.entriesEl.firstElementChild?.remove();
    }
  }
}
