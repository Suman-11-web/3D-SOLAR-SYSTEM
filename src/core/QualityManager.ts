import { bus } from './EventBus';

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface QualitySettings {
  pixelRatio: number;
  asteroidCount: number;
  starCount: number;
  shaderOctaves: number;
  sphereSegments: number;
}

const PRESETS: Record<QualityPreset, QualitySettings> = {
  low: {
    pixelRatio: 1.0,
    asteroidCount: 700,
    starCount: 3000,
    shaderOctaves: 3,
    sphereSegments: 32
  },
  medium: {
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.35),
    asteroidCount: 1600,
    starCount: 6000,
    shaderOctaves: 4,
    sphereSegments: 48
  },
  high: {
    pixelRatio: Math.min(window.devicePixelRatio || 1, 1.75),
    asteroidCount: 2800,
    starCount: 10000,
    shaderOctaves: 5,
    sphereSegments: 64
  },
  ultra: {
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2.0),
    asteroidCount: 4000,
    starCount: 14000,
    shaderOctaves: 6,
    sphereSegments: 64
  }
};

const ORDER: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];

export class QualityManager {
  private currentPreset: QualityPreset = 'high';
  private autoAdaptive = true;
  private sampleTimer = 0;
  private lowFpsStrikes = 0;
  private highFpsStrikes = 0;

  constructor() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      this.currentPreset = 'medium';
    }
  }

  public get preset(): QualityPreset {
    return this.currentPreset;
  }

  public get isAuto(): boolean {
    return this.autoAdaptive;
  }

  public get settings(): QualitySettings {
    return PRESETS[this.currentPreset];
  }

  public setAuto(enabled: boolean): void {
    this.autoAdaptive = enabled;
    bus.emit('quality:change', {
      preset: this.currentPreset,
      settings: this.settings,
      auto: this.autoAdaptive
    });
  }

  public setPreset(preset: QualityPreset, fromAuto = false): void {
    if (!fromAuto) {
      this.autoAdaptive = false;
    }
    if (this.currentPreset === preset && fromAuto) return;
    this.currentPreset = preset;
    bus.emit('quality:change', {
      preset: this.currentPreset,
      settings: this.settings,
      auto: this.autoAdaptive
    });
  }

  public update(dt: number, currentFps: number): void {
    if (!this.autoAdaptive) return;
    this.sampleTimer += dt;
    if (this.sampleTimer < 2.0) return;
    this.sampleTimer = 0;

    const idx = ORDER.indexOf(this.currentPreset);
    if (currentFps < 46 && idx > 0) {
      this.lowFpsStrikes++;
      this.highFpsStrikes = 0;
      if (this.lowFpsStrikes >= 2) {
        this.lowFpsStrikes = 0;
        const nextPreset = ORDER[idx - 1];
        this.setPreset(nextPreset, true);
        bus.emit('comms:log', {
          sender: 'SYS/QOS',
          message: `Adaptive quality scaled to ${nextPreset.toUpperCase()} (${Math.round(currentFps)} FPS)`,
          level: 'warn'
        });
      }
    } else if (currentFps > 58 && idx < ORDER.length - 1) {
      this.highFpsStrikes++;
      this.lowFpsStrikes = 0;
      if (this.highFpsStrikes >= 4) {
        this.highFpsStrikes = 0;
        const nextPreset = ORDER[idx + 1];
        this.setPreset(nextPreset, true);
      }
    } else {
      this.lowFpsStrikes = 0;
    }
  }
}