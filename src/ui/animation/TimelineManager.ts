import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

export class TimelineManager {
  private channels = new Map<string, gsap.core.Timeline>();

  public createChannel(
    name: string,
    vars?: gsap.TimelineVars
  ): gsap.core.Timeline {
    this.killChannel(name);
    const tl = gsap.timeline(vars);
    this.channels.set(name, tl);
    return tl;
  }

  public killChannel(name: string): void {
    const existing = this.channels.get(name);
    if (existing) {
      existing.kill();
      this.channels.delete(name);
    }
  }

  public killAll(): void {
    this.channels.forEach((tl) => tl.kill());
    this.channels.clear();
  }
}

export const timelineManager = new TimelineManager();
export { gsap, ScrollTrigger, Flip };
