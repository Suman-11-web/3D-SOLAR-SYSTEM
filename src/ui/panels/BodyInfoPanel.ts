import { bus } from '../../core/EventBus';
import type { BodyData } from '../../data/bodies';
import { Flip, gsap } from '../animation/TimelineManager';
import { motionDuration } from '../animation/easings';
import { formatNumber } from '../../utils/math';
import { Tabs } from '../components/Tabs';

export class BodyInfoPanel {
  public el: HTMLElement;
  private classEl: HTMLElement;
  private titleEl: HTMLElement;
  private metricsSection: HTMLElement;
  private overviewSection: HTMLElement;
  private descEl: HTMLElement;
  private factsEl: HTMLUListElement;

  private valDiameter: HTMLElement;
  private valMass: HTMLElement;
  private valGravity: HTMLElement;
  private valDay: HTMLElement;
  private valYear: HTMLElement;
  private valTemp: HTMLElement;
  private valMoons: HTMLElement;
  private valDist: HTMLElement;

  private countTween: gsap.core.Tween | null = null;

  constructor(parent: HTMLElement) {
    this.el = document.createElement('aside');
    this.el.className = 'body-info-panel is-hidden';
    this.el.setAttribute('aria-label', 'Celestial Body Telemetry Inspector');

    this.el.innerHTML = `
      <div class="body-info-header">
        <div>
          <div class="body-classification" id="bi-class">TERRESTRIAL PLANET</div>
          <h2 class="body-title" id="bi-title">EARTH</h2>
        </div>
        <button type="button" class="panel-close-btn" aria-label="Close inspector">✕</button>
      </div>
      <div class="body-info-body">
        <div id="bi-tabs-mount"></div>
        <div id="bi-metrics-view">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">DIAMETER</div>
              <div class="metric-value"><span id="bi-diam">0</span><span class="metric-unit">km</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">MASS</div>
              <div class="metric-value"><span id="bi-mass">0</span><span class="metric-unit">M⊕</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">SURFACE GRAVITY</div>
              <div class="metric-value"><span id="bi-grav">0</span><span class="metric-unit">m/s²</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">SOLAR DISTANCE</div>
              <div class="metric-value"><span id="bi-dist">0</span><span class="metric-unit">AU</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">ROTATION PERIOD</div>
              <div class="metric-value"><span id="bi-day">0</span><span class="metric-unit">hrs</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">ORBITAL PERIOD</div>
              <div class="metric-value"><span id="bi-year">0</span><span class="metric-unit">days</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">MEAN TEMP</div>
              <div class="metric-value"><span id="bi-temp">0</span><span class="metric-unit">°C</span></div>
            </div>
            <div class="metric-card">
              <div class="metric-label">KNOWN MOONS</div>
              <div class="metric-value"><span id="bi-moons">0</span></div>
            </div>
          </div>
        </div>
        <div id="bi-overview-view">
          <p class="body-description" id="bi-desc"></p>
          <ul class="body-facts-list" id="bi-facts" style="margin-top:12px"></ul>
        </div>
      </div>
    `;

    parent.appendChild(this.el);

    this.classEl = this.el.querySelector('#bi-class') as HTMLElement;
    this.titleEl = this.el.querySelector('#bi-title') as HTMLElement;
    this.metricsSection = this.el.querySelector('#bi-metrics-view') as HTMLElement;
    this.overviewSection = this.el.querySelector('#bi-overview-view') as HTMLElement;
    this.descEl = this.el.querySelector('#bi-desc') as HTMLElement;
    this.factsEl = this.el.querySelector('#bi-facts') as HTMLUListElement;

    this.valDiameter = this.el.querySelector('#bi-diam') as HTMLElement;
    this.valMass = this.el.querySelector('#bi-mass') as HTMLElement;
    this.valGravity = this.el.querySelector('#bi-grav') as HTMLElement;
    this.valDist = this.el.querySelector('#bi-dist') as HTMLElement;
    this.valDay = this.el.querySelector('#bi-day') as HTMLElement;
    this.valYear = this.el.querySelector('#bi-year') as HTMLElement;
    this.valTemp = this.el.querySelector('#bi-temp') as HTMLElement;
    this.valMoons = this.el.querySelector('#bi-moons') as HTMLElement;

    const tabs = new Tabs(
      [
        { id: 'all', label: 'All Telemetry' },
        { id: 'dossier', label: 'Science Dossier' }
      ],
      'all',
      (tabId) => {
        this.metricsSection.style.display = tabId === 'all' ? 'block' : 'none';
        this.overviewSection.style.display = 'block';
      }
    );
    (this.el.querySelector('#bi-tabs-mount') as HTMLElement).appendChild(tabs.el);

    this.el.querySelector('.panel-close-btn')?.addEventListener('click', () => {
      bus.emit('body:select', { body: null });
    });

    bus.on('body:select', ({ body, sourceElement }) => {
      if (body) {
        this.showBody(body, sourceElement);
      } else {
        this.hide();
      }
    });

    bus.on('state:change', ({ to }) => {
      if (to !== 'EXPLORER') {
        this.hide();
      }
    });
  }

  public showBody(body: BodyData, sourceElement?: HTMLElement): void {
    const wasHidden = this.el.classList.contains('is-hidden');
    const flipState = sourceElement ? Flip.getState([sourceElement, this.el]) : null;

    this.el.classList.remove('is-hidden');
    this.classEl.textContent = body.classification;
    this.titleEl.textContent = body.name;
    this.descEl.textContent = body.description;

    this.factsEl.innerHTML = body.facts.map((f) => `<li>${f}</li>`).join('');

    const sr = document.getElementById('sr-announcer');
    if (sr) {
      sr.textContent = `Selected ${body.name}, ${body.classification}. Diameter ${body.diameterKm} kilometers.`;
    }

    if (flipState && wasHidden) {
      Flip.from(flipState, {
        duration: motionDuration(0.42),
        ease: 'power3.out',
        scale: true
      });
    } else if (wasHidden) {
      gsap.fromTo(
        this.el,
        { opacity: 0, x: 28 },
        { opacity: 1, x: 0, duration: motionDuration(0.35), ease: 'power3.out' }
      );
    }

    if (this.countTween) this.countTween.kill();
    const proxy = { t: 0 };
    this.countTween = gsap.to(proxy, {
      t: 1,
      duration: motionDuration(0.75),
      ease: 'power2.out',
      onUpdate: () => {
        const p = proxy.t;
        this.valDiameter.textContent = formatNumber(body.diameterKm * p, 0);
        this.valMass.textContent =
          body.massEarths >= 10
            ? formatNumber(body.massEarths * p, 1)
            : formatNumber(body.massEarths * p, 3);
        this.valGravity.textContent = formatNumber(body.gravityMs2 * p, 2);
        this.valDist.textContent = formatNumber(body.semiMajorAxisAU * p, 2);
        this.valDay.textContent = formatNumber(body.rotationPeriodHours * p, 1);
        this.valYear.textContent = formatNumber(body.orbitalPeriodDays * p, 1);
        this.valTemp.textContent = formatNumber(body.meanTempC * p, 0);
        this.valMoons.textContent = String(Math.round(body.moonsCount * p));
      }
    });
  }

  public hide(): void {
    this.el.classList.add('is-hidden');
  }
}
