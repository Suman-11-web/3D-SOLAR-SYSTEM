import { SOLAR_BODIES } from '../../data/bodies';
import type { Engine } from '../../core/Engine';
import { ScrollTrigger, gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';
import { bus } from '../../core/EventBus';

export class TourScreen {
  public el: HTMLElement;
  private scrollContent: HTMLElement;
  private railEl: HTMLElement;
  private railDots: HTMLButtonElement[] = [];
  private triggers: ScrollTrigger[] = [];

  constructor(
    parent: HTMLElement,
    private engine: Engine
  ) {
    this.el = document.createElement('section');
    this.el.className = 'tour-screen is-hidden';
    this.el.setAttribute('aria-label', 'Guided Solar System Tour');

    this.scrollContent = document.createElement('div');
    this.scrollContent.className = 'tour-scroll-content';
    this.el.appendChild(this.scrollContent);

    this.railEl = document.createElement('div');
    this.railEl.className = 'tour-rail';
    this.el.appendChild(this.railEl);

    this.buildChapters();
    parent.appendChild(this.el);

    this.registerState();
  }

  private buildChapters(): void {
    SOLAR_BODIES.forEach((body, index) => {
      const section = document.createElement('div');
      section.className = 'tour-step-section';
      section.innerHTML = `
        <article class="tour-card">
          <div class="tour-card-step">CHAPTER 0${index + 1} // ${body.classification}</div>
          <h2>${body.name.toUpperCase()}</h2>
          <p>${body.tourCaption}</p>
          <div style="margin-top:16px;display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:0.74rem;color:var(--accent-cyan)">
            <span>ORBIT: ${body.semiMajorAxisAU} AU</span>
            <span>TEMP: ${body.meanTempC} °C</span>
          </div>
        </article>
      `;
      this.scrollContent.appendChild(section);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `tour-rail-dot ${index === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Jump to ${body.name}`);
      dot.addEventListener('click', () => {
        section.scrollIntoView({ behavior: 'smooth' });
      });
      this.railDots.push(dot);
      this.railEl.appendChild(dot);
    });
  }

  private initScrollTriggers(): void {
    this.killScrollTriggers();
    const sections = Array.from(this.scrollContent.querySelectorAll('.tour-step-section'));

    sections.forEach((sec, idx) => {
      const card = sec.querySelector('.tour-card') as HTMLElement;
      const body = SOLAR_BODIES[idx];

      const st = ScrollTrigger.create({
        trigger: sec,
        scroller: this.el,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => this.activateChapter(idx, body.id, card),
        onEnterBack: () => this.activateChapter(idx, body.id, card)
      });
      this.triggers.push(st);
    });
  }

  private activateChapter(idx: number, bodyId: string, card: HTMLElement): void {
    this.railDots.forEach((d, i) => d.classList.toggle('active', i === idx));

    const body = SOLAR_BODIES[idx];
    const obj = this.engine.getBodyObject3D(bodyId);
    if (obj) {
      const r = this.engine.getBodyCurrentRadius(body);
      this.engine.cameraRig.focusOnBody(obj, r, bodyId === 'sun');
    }

    gsap.fromTo(
      card,
      { opacity: 0.3, y: 24 },
      { opacity: 1, y: 0, duration: motionDuration(0.45), ease: 'power3.out' }
    );

    bus.emit('tour:step', {
      index: idx,
      bodyId,
      progress: (idx + 1) / SOLAR_BODIES.length
    });
  }

  private killScrollTriggers(): void {
    this.triggers.forEach((t) => t.kill());
    this.triggers = [];
  }

  private registerState(): void {
    this.engine.stateMachine.register('TOUR', {
      onEnter: () => {
        this.el.classList.remove('is-hidden');
        this.el.scrollTop = 0;
        this.initScrollTriggers();
        const firstCard = this.scrollContent.querySelector('.tour-card') as HTMLElement;
        if (firstCard) {
          this.activateChapter(0, SOLAR_BODIES[0].id, firstCard);
        }
        bus.emit('toast:show', {
          title: 'GUIDED TOUR ENGAGED',
          message: 'Scroll down to journey from the Sun to the Kuiper Belt.',
          type: 'info'
        });
      },
      onExit: () => {
        this.killScrollTriggers();
        this.el.classList.add('is-hidden');
      }
    });
  }
}
