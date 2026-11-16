import type { Engine } from '../../core/Engine';
import { scratchVec3A } from '../../utils/math';

export class RadarWidget {
  public el: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sweepAngle = 0;

  constructor(private engine: Engine) {
    this.el = document.createElement('div');
    this.el.className = 'hud-widget';
    this.el.innerHTML = `
      <div class="hud-widget-header">
        <span>EPHEMERIS // RADAR</span>
        <span style="color:var(--accent-amber)">200 AU</span>
      </div>
      <canvas class="radar-canvas" width="224" height="145"></canvas>
    `;

    this.canvas = this.el.querySelector('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  public update(dt: number): void {
    this.sweepAngle = (this.sweepAngle + dt * 1.6) % (Math.PI * 2);

    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) - 8;

    this.ctx.clearRect(0, 0, w, h);

    this.ctx.strokeStyle = 'rgba(148, 167, 198, 0.16)';
    this.ctx.lineWidth = 1;
    for (const frac of [0.33, 0.66, 1.0]) {
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    const grad = this.ctx.createConicGradient(this.sweepAngle, cx, cy);
    grad.addColorStop(0, 'rgba(44, 230, 255, 0.28)');
    grad.addColorStop(0.18, 'rgba(44, 230, 255, 0.0)');
    grad.addColorStop(1, 'rgba(44, 230, 255, 0.0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#ff9e2c';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    this.ctx.fill();

    const maxSceneOrbit = this.engine.scaleFactor > 0.5 ? 460 : 195;
    for (const planet of this.engine.planets) {
      planet.mesh.getWorldPosition(scratchVec3A);
      const px = cx + (scratchVec3A.x / maxSceneOrbit) * maxR;
      const py = cy + (scratchVec3A.z / maxSceneOrbit) * maxR;

      this.ctx.fillStyle = planet.data.primaryColor;
      this.ctx.beginPath();
      this.ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
