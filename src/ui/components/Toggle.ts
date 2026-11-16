export interface ToggleOptions {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export class Toggle {
  public el: HTMLButtonElement;
  private isChecked: boolean;

  constructor(private options: ToggleOptions) {
    this.isChecked = options.checked;
    this.el = document.createElement('button');
    this.el.type = 'button';
    this.el.className = 'ui-toggle interactive';
    this.el.setAttribute('role', 'switch');
    this.el.setAttribute('aria-checked', String(this.isChecked));

    this.el.innerHTML = `
      <span>${options.label}</span>
      <span class="ui-toggle-track"><span class="ui-toggle-thumb"></span></span>
    `;

    this.el.addEventListener('click', () => {
      this.setChecked(!this.isChecked, true);
    });
  }

  public setChecked(checked: boolean, emit = false): void {
    this.isChecked = checked;
    this.el.setAttribute('aria-checked', String(checked));
    if (emit) {
      this.options.onChange(checked);
    }
  }
}
