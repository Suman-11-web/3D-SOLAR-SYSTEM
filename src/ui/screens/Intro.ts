import type { Engine } from '../../core/Engine';
import { timelineManager } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';
import { bus } from '../../core/EventBus';

export class IntroScreen {
  public el: HTMLElement;
  private skipBtn: HTMLButtonElement;
  private chars: HTMLElement[] = [];
  private subtitleEl: HTMLElement;

  constructor(
    parent: HTMLElement,
    private engine: Engine
  ) {
    this.el = document.createElement('section');
    this.el.className = 'intro-screen';
    this.el.style.display = 'none';

    const titleText = 'HELIOS';
    const charMasks = titleText
      .split('')
      .map((ch) => `<span class="intro-char-mask"><span class="intro-char">${ch}</span></span>`)
      .join('');

    this.el.innerHTML = `
      <h1 class="intro-title">${charMasks}</h1>
      <div class="intro-subtitle">SOLAR EPHEMERIS & DEEP SPACE TELEMETRY</div>
      <button type="button" class="intro-skip-btn">SKIP INTRO ▸</button>
    `;

    parent.appendChild(this.el);

    this.chars = Array.from(this.el.querySelectorAll('.intro-char'));
    this.subtitleEl = this.el.querySelector('.intro-subtitle') as HTMLElement;
    this.skipBtn = this.el.querySelector('.intro-skip-btn') as HTMLButtonElement;

    this.skipBtn.addEventListener('click', () => {
      void this.engine.stateMachine.transitionTo('EXPLORER');
    });

    this.registerState();
  }

  private registerState(): void {
    this.engine.stateMachine.register('INTRO', {
      onEnter: () => {
        this.el.style.display = 'flex';
        this.el.style.opacity = '1';

        const tl = timelineManager.createChannel('intro-sequence');

        this.engine.cameraRig.playIntroFlight(() => {
          if (this.engine.stateMachine.state === 'INTRO') {
            void this.engine.stateMachine.transitionTo('EXPLORER');
          }
        });

        tl.fromTo(
          this.chars,
          { yPercent: 110, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            stagger: 0.08,
            duration: motionDuration(0.9),
            ease: 'expo.out'
          },
          0.3
        )
          .fromTo(
            this.subtitleEl,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: motionDuration(0.7), ease: 'power3.out' },
            0.9
          )
          .to(
            [this.chars, this.subtitleEl],
            {
              opacity: 0,
              y: -15,
              duration: motionDuration(0.75),
              ease: 'power2.in'
            },
            3.1
          );
      },
      onExit: () =>
        new Promise<void>((resolve) => {
          timelineManager.killChannel('intro-sequence');
          const tl = timelineManager.createChannel('state-transition');
          tl.to(this.el, {
            opacity: 0,
            duration: motionDuration(0.35),
            onComplete: () => {
              this.el.style.display = 'none';
              bus.emit('comms:log', {
                sender: 'HELIOS/CORE',
                message: 'Orbital command console active. Select any world or press Cmd/Ctrl+K.',
                level: 'success'
              });
              resolve();
            }
          });
        })
    });
  }
}
