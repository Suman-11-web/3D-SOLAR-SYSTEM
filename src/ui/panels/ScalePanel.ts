import { bus } from '../../core/EventBus';
import { Toggle } from '../components/Toggle';

export class ScalePanel {
  public el: HTMLElement;
  private toggle: Toggle;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'scale-panel';

    this.toggle = new Toggle({
      label: 'TRUE RELATIVE SCALE',
      checked: false,
      onChange: (checked) => {
        const mode = checked ? 'true' : 'visual';
        bus.emit('scale:change', { mode, factor: checked ? 1 : 0 });
        bus.emit('toast:show', {
          title: checked ? 'TRUE RELATIVE SCALE ACTIVE' : 'VISUAL EPHEMERIS SCALE ACTIVE',
          message: checked
            ? 'Planetary radii and AU orbital distances set to true proportional scale.'
            : 'Planetary radii amplified for visual inspection.',
          type: 'info'
        });
      }
    });
    this.toggle.el.setAttribute(
      'data-tooltip',
      'Interpolate between readable visual scale and true proportional AU scale'
    );

    this.el.appendChild(this.toggle.el);

    bus.on('scale:change', ({ mode }) => {
      this.toggle.setChecked(mode === 'true', false);
    });
  }
}
