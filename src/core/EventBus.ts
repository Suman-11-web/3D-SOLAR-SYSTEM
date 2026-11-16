import type { AppState } from './StateMachine';
import type { QualityPreset, QualitySettings } from './QualityManager';
import type { BodyData } from '../data/bodies';

export type ScaleMode = 'visual' | 'true';

export interface LaunchTelemetryData {
  phase: 'IDLE' | 'COUNTDOWN' | 'LIFTOFF' | 'MAX_Q' | 'STAGE_SEP' | 'TRANSIT' | 'ARRIVAL';
  countdown: number;
  altitudeKm: number;
  velocityKms: number;
  fuelPct: number;
  progress: number;
  targetBodyId: string;
}

export interface HeliosEvents {
  'boot:progress': { percent: number; step: string };
  'boot:complete': void;
  'state:change': { from: AppState; to: AppState };
  'body:hover': { body: BodyData | null; screenPos?: { x: number; y: number } };
  'body:select': { body: BodyData | null; sourceElement?: HTMLElement };
  'time:speed': { targetSpeed: number; paused: boolean };
  'time:update': { simDays: number; currentSpeed: number; date: Date; paused: boolean };
  'scale:change': { mode: ScaleMode; factor: number };
  'quality:change': { preset: QualityPreset; settings: QualitySettings; auto: boolean };
  'orbits:toggle': { visible: boolean };
  'labels:toggle': { visible: boolean };
  'audio:mute': { muted: boolean };
  'photo:capture': void;
  'comms:log': { sender: string; message: string; level?: 'info' | 'warn' | 'success' | 'accent' };
  'toast:show': { title: string; message: string; type?: 'info' | 'success' | 'warn' };
  'palette:toggle': { open?: boolean };
  'launch:initiate': { targetId: string };
  'launch:abort': void;
  'launch:telemetry': LaunchTelemetryData;
  'tour:step': { index: number; bodyId: string; progress: number };
  'settings:toggle': { open?: boolean };
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private listeners = new Map<keyof HeliosEvents, Set<Handler<never>>>();

  public on<K extends keyof HeliosEvents>(
    event: K,
    handler: Handler<HeliosEvents[K]>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  public off<K extends keyof HeliosEvents>(
    event: K,
    handler: Handler<HeliosEvents[K]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(handler as Handler<never>);
    }
  }

  public emit<K extends keyof HeliosEvents>(
    event: K,
    ...args: HeliosEvents[K] extends void ? [] : [HeliosEvents[K]]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    const payload = args[0] as never;
    set.forEach((fn) => fn(payload));
  }
}

export const bus = new EventBus();