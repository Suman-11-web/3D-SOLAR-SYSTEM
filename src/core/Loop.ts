export type TickCallback = (dt: number, elapsed: number) => void;

export class Loop {
  private callbacks = new Set<TickCallback>();
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private running = false;
  public currentFps = 60;

  public add(cb: TickCallback): () => void {
    this.callbacks.add(cb);
    return () => this.callbacks.delete(cb);
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  public stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const rawDt = (now - this.lastTime) * 0.001;
    this.lastTime = now;

    // Clamp delta time to prevent orbital jumps on tab switch
    const dt = Math.min(rawDt, 0.1);
    this.elapsed += dt;

    if (rawDt > 0.0001) {
      const instFps = 1 / rawDt;
      this.currentFps = this.currentFps * 0.92 + instFps * 0.08;
    }

    this.callbacks.forEach((cb) => cb(dt, this.elapsed));
    this.rafId = requestAnimationFrame(this.tick);
  };
}