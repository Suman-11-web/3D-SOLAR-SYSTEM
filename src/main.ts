import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/hud.css';
import '../styles/panels.css';

import { Engine } from './core/Engine';
import { bus } from './core/EventBus';
import { BootScreen } from './ui/screens/Boot';
import { IntroScreen } from './ui/screens/Intro';
import { ExplorerScreen } from './ui/screens/Explorer';
import { TourScreen } from './ui/screens/Tour';
import { LaunchScreen } from './ui/screens/Launch';
import { CommandPalette } from './ui/components/CommandPalette';
import { ToastManager } from './ui/components/Toast';
import { TooltipManager } from './ui/components/Tooltip';

async function bootstrap(): Promise<void> {
  const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement | null;
  const uiLayer = document.getElementById('ui-layer') as HTMLElement | null;
  const labelsLayer = document.getElementById('labels-layer') as HTMLElement | null;

  if (!canvas || !uiLayer || !labelsLayer) {
    throw new Error('HELIOS: Required DOM mount nodes missing.');
  }

  const engine = new Engine(canvas);

  new BootScreen(uiLayer, engine.stateMachine);
  new IntroScreen(uiLayer, engine);
  new ExplorerScreen(uiLayer, labelsLayer, engine);
  new TourScreen(uiLayer, engine);
  new LaunchScreen(uiLayer, engine);
  new CommandPalette(uiLayer, engine);
  new ToastManager(uiLayer);
  new TooltipManager(uiLayer);

  const webglOk = await engine.initWithProgress();
  if (!webglOk) {
    renderWebGLFallback(uiLayer);
    return;
  }

  bus.emit('boot:complete');
}

function renderWebGLFallback(container: HTMLElement): void {
  const fallback = document.createElement('div');
  fallback.className = 'webgl-fallback';
  fallback.innerHTML = `
    <h1>WEBGL2 TELEMETRY GRAPHICS UNAVAILABLE</h1>
    <p>HELIOS requires hardware-accelerated WebGL to synthesize procedural planetary shaders and 3D ephemeris.</p>
  `;
  container.appendChild(fallback);
}

void bootstrap();