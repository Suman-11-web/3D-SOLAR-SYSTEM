import { bus } from '../../core/EventBus';
import type { Engine } from '../../core/Engine';
import type { QualityPreset } from '../../core/QualityManager';
import { Toggle } from '../components/Toggle';
import { Tabs } from '../components/Tabs';
import { audioEngine } from '../../audio/AudioEngine';

export class SettingsPanel {
  public el: HTMLElement;
  private isOpen = false;
  private presetTabs: Tabs;
  private autoToggle: Toggle;
  private orbitsToggle: Toggle;
  private labelsToggle: Toggle;
  private muteToggle: Toggle;

  constructor(
    parent: HTMLElement,
    private engine: Engine
  ) {
    this.el = document.createElement('div');
    this.el.className = 'settings-panel is-hidden';
    this.el.setAttribute('role', 'dialog');
    this.el.setAttribute('aria-label', 'Graphics and Mission Settings');

    const header = document.createElement('div');
    header.className = 'hud-widget-header';
    header.innerHTML = `<span>GRAPHICS & HUD CONFIG</span>`;
    this.el.appendChild(header);

    this.presetTabs = new Tabs(
      [
        { id: 'low', label: 'Low' },
        { id: 'medium', label: 'Med' },
        { id: 'high', label: 'High' },
        { id: 'ultra', label: 'Ultra' }
      ],
      this.engine.quality.preset,
      (id) => {
        this.engine.quality.setPreset(id as QualityPreset, false);
      }
    );
    this.el.appendChild(this.presetTabs.el);

    this.autoToggle = new Toggle({
      label: 'Adaptive 60FPS Governor',
      checked: this.engine.quality.isAuto,
      onChange: (checked) => this.engine.quality.setAuto(checked)
    });

    this.orbitsToggle = new Toggle({
      label: 'Show Orbital Trajectories',
      checked: true,
      onChange: (visible) => bus.emit('orbits:toggle', { visible })
    });

    this.labelsToggle = new Toggle({
      label: 'Show 3D Callout Labels',
      checked: true,
      onChange: (visible) => bus.emit('labels:toggle', { visible })
    });

    this.muteToggle = new Toggle({
      label: 'Mute Web Audio Synth',
      checked: audioEngine.isMuted,
      onChange: (muted) => bus.emit('audio:mute', { muted })
    });

    for (const t of [this.autoToggle, this.orbitsToggle, this.labelsToggle, this.muteToggle]) {
      const row = document.createElement('div');
      row.className = 'settings-row';
      row.appendChild(t.el);
      this.el.appendChild(row);
    }

    parent.appendChild(this.el);

    bus.on('settings:toggle', ({ open }) => {
      this.isOpen = open !== undefined ? open : !this.isOpen;
      this.el.classList.toggle('is-hidden', !this.isOpen);
    });

    bus.on('quality:change', ({ preset, auto }) => {
      this.presetTabs.setActive(preset);
      this.autoToggle.setChecked(auto, false);
    });

    bus.on('audio:mute', ({ muted }) => {
      this.muteToggle.setChecked(muted, false);
    });
  }
}
