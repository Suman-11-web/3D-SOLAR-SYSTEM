import type { Engine } from '../../core/Engine';

export class TelemetryWidget {
  public el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fpsReadout: HTMLElement;
  private windReadout: HTMLElement;
  private fpsHistory = new Array<number>(50).fill(60);
  private fluxHistory = new Array<number>(50).fill(0.5);
  private timer = 0;

  constructor(private engine: Engine) {
    this.el = document.createElement('div');
    this.el.className = 'hud-widget';
    this.el.innerHTML = `
      <div class="hud-widget-header">
        <span>SYS // TELEMETRY</span>
        <span class="status-dot"></span>
      </div>
      <canvas class="telemetry-canvas" width="224" height="68"></canvas>
      <div class="telemetry-stats-row">
        <span>FRAME: <strong id="tel-fps">60 FPS</strong></span>
        <span>FLUX: <strong id="tel-flux">412 km/s</strong></span>
      </div>
    `;

    this.canvas = this.el.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.fpsReadout = this.el.querySelector('#tel-fps') as HTMLElement;
    this.windReadout = this.el.querySelector('#tel-flux') as HTMLElement;
  }

  public update(dt: number, elapsed: number): void {
    this.timer += dt;
    if (this.timer < 0.08) return;
    this.timer = 0;

    const fps = Math.min(60, Math.round(this.engine.loop.currentFps));
    const flux = 0.5 + 0.35 * Math.sin(elapsed * 1.9) + 0.15 * Math.cos(elapsed * 4.3);

    this.fpsHistory.push(fps);
    this.fpsHistory.shift();
    this.fluxHistory.push(flux);
    this.fluxHistory.shift();

    this.fpsReadout.textContent = `${fps} FPS`;
    this.windReadout.textContent = `${Math.round(380 + flux * 95)} km/s`;

    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.clearRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(148, 167, 198, 0.1)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h * 0.5);
    this.ctx.lineTo(w, h * 0.5);
    this.ctx.stroke();

    this.ctx.strokeStyle = '#2ce6ff';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    for (let i = 0; i < this.fpsHistory.length; i++) {
      const x = (i / (this.fpsHistory.length - 1)) * w;
      const y = h - (this.fpsHistory[i] / 65) * (h - 10) - 4;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();

    this.ctx.strokeStyle = '#ff9e2c';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    for (let i = 0; i < this.fluxHistory.length; i++) {
      const x = (i / (this.fluxHistory.length - 1)) * w;
      const y = h - this.fluxHistory[i] * (h - 14) - 6;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }
}
