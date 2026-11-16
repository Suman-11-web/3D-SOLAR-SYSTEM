import { bus } from '../../core/EventBus';
import { Slider } from '../components/Slider';
import { formatMissionDate } from '../../utils/math';

const SPEED_PRESETS = [
  { label: '-100x', speed: -100, paused: false },
  { label: 'PAUSE', speed: 0, paused: true },
  { label: '1x', speed: 1, paused: false },
  { label: '10x', speed: 10, paused: false },
  { label: '100x', speed: 100, paused: false },
  { label: '1000x', speed: 1000, paused: false }
];

export class TimeController {
  public el: HTMLElement;
  private dateEl: HTMLElement;
  private presetBtns: HTMLButtonElement[] = [];
  private slider: Slider;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'time-controller';

    this.dateEl = document.createElement('div');
    this.dateEl.className = 'time-date-readout';
    this.dateEl.textContent = '2026.11.16 12:00 UTC';
    this.el.appendChild(this.dateEl);

    const presetsWrap = document.createElement('div');
    presetsWrap.className = 'time-presets';

    SPEED_PRESETS.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `time-preset-btn ${p.speed === 1 ? 'active' : ''}`;
      btn.textContent = p.label;
      btn.addEventListener('click', () => {
        bus.emit('time:speed', { targetSpeed: p.speed, paused: p.paused });
      });
      this.presetBtns.push(btn);
      presetsWrap.appendChild(btn);
    });
    this.el.appendChild(presetsWrap);

    const scrubWrap = document.createElement('div');
    scrubWrap.className = 'time-scrubber-wrap';
    this.slider = new Slider({
      min: -200,
      max: 1000,
      step: 1,
      value: 1,
      ariaLabel: 'Continuous simulation speed scrubber',
      onChange: (val) => {
        bus.emit('time:speed', { targetSpeed: val, paused: Math.abs(val) < 0.5 });
      }
    });
    scrubWrap.appendChild(this.slider.el);
    this.el.appendChild(scrubWrap);

    bus.on('time:update', ({ date }) => {
      this.dateEl.textContent = formatMissionDate(date);
    });

    bus.on('time:speed', ({ targetSpeed, paused }) => {
      this.slider.setValue(paused ? 0 : targetSpeed);
      this.presetBtns.forEach((btn, idx) => {
        const preset = SPEED_PRESETS[idx];
        const match = paused ? preset.paused : !preset.paused && preset.speed === targetSpeed;
        btn.classList.toggle('active', match);
      });
    });
  }
}
