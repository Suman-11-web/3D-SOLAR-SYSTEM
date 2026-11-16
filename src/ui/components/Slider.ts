export interface SliderOptions {
  min: number;
  max: number;
  step: number;
  value: number;
  ariaLabel: string;
  onChange: (val: number) => void;
}

export class Slider {
  public el: HTMLElement;
  public input: HTMLInputElement;

  constructor(options: SliderOptions) {
    this.el = document.createElement('div');
    this.el.className = 'ui-slider-container interactive';

    this.input = document.createElement('input');
    this.input.type = 'range';
    this.input.className = 'ui-slider';
    this.input.min = String(options.min);
    this.input.max = String(options.max);
    this.input.step = String(options.step);
    this.input.value = String(options.value);
    this.input.setAttribute('aria-label', options.ariaLabel);

    this.input.addEventListener('input', () => {
      options.onChange(parseFloat(this.input.value));
    });

    this.el.appendChild(this.input);
  }

  public setValue(val: number): void {
    this.input.value = String(val);
  }
}
