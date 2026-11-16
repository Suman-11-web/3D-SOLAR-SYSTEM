import { bus } from '../core/EventBus';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneGain: GainNode | null = null;

  private rumbleSource: AudioBufferSourceNode | null = null;
  private rumbleGain: GainNode | null = null;

  public isMuted = false;
  private initialized = false;

  constructor() {
    this.bindGestureUnlock();
    this.bindBusEvents();
  }

  private bindGestureUnlock(): void {
    const unlock = () => {
      if (!this.initialized) {
        this.initContext();
      } else if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  private initContext(): void {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 0.45;
    this.masterGain.connect(this.ctx.destination);

    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 240;
    this.droneFilter.Q.value = 3.2;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.16;

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.value = 65.41;

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.value = 65.41 * 1.498;

    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 130;

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.value = 0;

    this.rumbleSource = this.ctx.createBufferSource();
    this.rumbleSource.buffer = noiseBuffer;
    this.rumbleSource.loop = true;
    this.rumbleSource.connect(rumbleFilter);
    rumbleFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.masterGain);
    this.rumbleSource.start();

    this.initialized = true;
  }

  private bindBusEvents(): void {
    bus.on('audio:mute', ({ muted }) => {
      this.isMuted = muted;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.45, this.ctx.currentTime, 0.08);
      }
    });

    bus.on('body:select', ({ body }) => {
      this.playBlip(body ? 620 : 380, 0.09, 'sine');
      if (body && this.ctx && this.droneOsc1 && this.droneOsc2 && this.droneFilter) {
        const now = this.ctx.currentTime;
        const base = body.droneBaseFreq;
        this.droneOsc1.frequency.setTargetAtTime(base, now, 0.4);
        this.droneOsc2.frequency.setTargetAtTime(base * 1.498, now, 0.4);
        this.droneFilter.frequency.setTargetAtTime(base * 3.6, now, 0.5);
      }
    });

    bus.on('body:hover', ({ body }) => {
      if (body) {
        this.playBlip(880, 0.03, 'triangle', 0.05);
      }
    });

    bus.on('state:change', () => {
      this.playBlip(520, 0.11, 'sine', 0.12);
    });

    bus.on('launch:telemetry', ({ phase }) => {
      if (!this.ctx || !this.rumbleGain) return;
      const now = this.ctx.currentTime;
      if (phase === 'LIFTOFF' || phase === 'MAX_Q') {
        this.rumbleGain.gain.setTargetAtTime(0.55, now, 0.2);
      } else if (phase === 'STAGE_SEP' || phase === 'TRANSIT') {
        this.rumbleGain.gain.setTargetAtTime(0.18, now, 0.3);
      } else {
        this.rumbleGain.gain.setTargetAtTime(0.0, now, 0.25);
      }
    });
  }

  public playBlip(
    freq = 660,
    duration = 0.06,
    type: OscillatorType = 'sine',
    volume = 0.12
  ): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }
}

export const audioEngine = new AudioEngine();
