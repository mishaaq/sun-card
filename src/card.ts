import {
  LitElement,
  html,
  svg,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  SVGTemplateResult,
  css,
  PropertyValues
} from 'lit-element';
import moment from 'moment';
import 'moment/min/locales';
import 'moment-timezone/builds/moment-timezone-with-data';
import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';
import { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';

import { CARD_VERSION, SVG_ICONS } from './const';
import { SunCardConfig, Coords, ISun, IMoon, ITime, EntityMutator } from './types';
import './editor';
import Factory from './entities';

/* eslint no-console: 0 */
console.info(
  `%c SUN-CARD %c ${CARD_VERSION} `,
  'color: white; background: coral; font-weight: 700;',
  'color: coral; background: white; font-weight: 700;'
);

let updateFunc: EntityMutator | undefined;

@customElement('sun-card')
export default class SunCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('sun-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): object {
    return {};
  }

  @property() private _hass?: HomeAssistant;

  @property() private _config?: SunCardConfig;

  private _provider?: ISun & IMoon & ITime;

  private _error?: Error;

  readonly svgViewBoxW: number = 24 * 60; // 24h * 60 minutes - viewBox width in local points

  readonly svgViewBoxH: number = 432; // viewBox height in local points

  // half of svg viewBox height / (| -zenith | + zenith elevation angle)
  readonly yScale: number = this.svgViewBoxH / 180;

  readonly humanizer: HumanizeDuration = new HumanizeDuration(new HumanizeDurationLanguage());

  readonly themeOverrides: { [key: string]: string } = {};

  public setConfig(newConfig: SunCardConfig): void {
    const entities = {
      ...{ time: 'sensor.time_utc', elevation: 'sun.sun' },
      ...newConfig.entities
    };
    if (!newConfig?.type || entities.time === '' || entities.elevation === '') {
      throw new Error('Invalid configuration: missing entities for "time" or "elevation"!');
    }
    this._config = { ...newConfig, entities };
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) {
      moment.locale(hass.language);
      moment.tz.setDefault(hass.config.time_zone);
      this.humanizer.setOptions({
        language: hass.language.split('-')[0],
        delimiter: ' ',
        units: ['h', 'm'],
        round: true
      });
    }
  }

  constructor() {
    super();
    const { style } = document.documentElement;
    for (let i = 0; i < style.length; i += 1) {
      if (style[i].startsWith('--sc-')) {
        this.themeOverrides[style[i]] = style.getPropertyValue(style[i]);
      }
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) {
      return true;
    }

    const oldHass = changedProps.get('_hass') as HomeAssistant | undefined;
    return oldHass
      ? Object.values(this._config!.entities).some(entityName => {
          return oldHass.states[entityName] !== this.hass!.states[entityName];
        })
      : false;
  }

  protected update(changedProps: PropertyValues) {
    try {
      if (changedProps.has('_config') && this.hass?.states) {
        this._error = undefined;
        [this._provider, updateFunc] = Factory.create(this.hass.states, this._config!);
      }

      const oldHass = changedProps.get('_hass') as HomeAssistant | undefined;
      if (oldHass && this._provider) {
        Object.values(this._config!.entities).forEach(entityName => {
          if (oldHass.states[entityName] !== this.hass!.states[entityName])
            updateFunc!(this.hass!.states[entityName]);
        });
      }
    } catch (e) {
      this._error = e;
      console.error(e);
    }
    return super.update(changedProps);
  }

  public getCardSize(): number {
    return 6;
  }

  protected render(): TemplateResult | void {
    if (this._error) {
      return html`
        <hui-warning>
          ${this._error.message}
        </hui-warning>
      `;
    }

    if (!this._config || !this.hass || !this._provider) {
      return html``;
    }

    const sun = this.renderSun(this._provider.currentTime, this._provider.elevation);
    const sunBeam =
      this._config!.animation || this._config!.animation === undefined
        ? this.renderSunbeam(this._provider.currentTime, this._provider.elevation)
        : null;

    const sunrise = this._provider.sunrise ? this.renderSunrise(this._provider.sunrise) : null;
    const sunset = this._provider.sunset ? this.renderSunset(this._provider.sunset) : null;
    const noon = this._provider.solarNoon ? this.renderNoon(this._provider.solarNoon) : null;
    const horizon = this.renderHorizon();

    const moonPhase = this._provider.moonPhase ? this.renderMoon(this._provider.moonPhase) : null;

    const timeToSunset = this._provider.toSunset
      ? this.renderTimeToSunset(this._provider.toSunset)
      : null;
    const daylight = this._provider.daylight ? this.renderDaylight(this._provider.daylight) : null;

    let header = this._config.name;
    if (header === undefined)
      header =
        this.hass.states['sun.sun']?.attributes.friendly_name || this.hass.localize('domain.sun');
    return html`
      <ha-card
        .header=${header}
        style=${this.computeRootStyle(this._provider.elevation / this._provider.maxElevation)}
      >
        <div class="content">
          <div class="bg-primary">
            <div class="bg-secondary">
              <svg
                class="top"
                preserveAspectRatio="xMinYMin slice"
                viewBox="0 -${this.svgViewBoxH / 2} ${this.svgViewBoxW} ${this.svgViewBoxH / 2}"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
              >
                ${sunrise} ${sunset} ${sunBeam} ${sun}
              </svg>
              <svg
                class="bottom"
                preserveAspectRatio="xMinYMax slice"
                viewBox="0 0 ${this.svgViewBoxW} ${this.svgViewBoxH / 2}"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
              >
                ${horizon} ${noon} ${sun}
              </svg>
            </div>
          </div>
          <div class="moon-icon">
            ${moonPhase}
          </div>
        </div>
        <div class="info">
          ${timeToSunset} ${daylight}
        </div>
      </ha-card>
    `;
  }

  private renderHorizon(): SVGTemplateResult {
    return svg`
      <line class="horizon" x1="0" y1="0" x2="${this.svgViewBoxW}" y2="0" />
    `;
  }

  private renderSun(currentTime: moment.Moment, elevation: number): SVGTemplateResult {
    const sunPos: Coords = this.metric(currentTime, elevation);
    return svg`
      <line class="sun" x1="${sunPos.x}" x2="${sunPos.x}" y1="${sunPos.y}" y2="${sunPos.y}" />
    `;
  }

  private renderSunbeam(currentTime: moment.Moment, elevation: number): SVGTemplateResult {
    const sunPos: Coords = this.metric(currentTime, elevation);
    return svg`
      <line class="sunbeam" x1="${sunPos.x}" x2="${sunPos.x}" y1="${sunPos.y}" y2="${sunPos.y}" />
    `;
  }

  private renderSunrise(sunrise: moment.Moment): SVGTemplateResult {
    if (!sunrise.isValid()) {
      return svg``;
    }
    const timeFormat =
      (this._config!.meridiem === undefined && 'LT') ||
      (this._config!.meridiem === true && 'h:mm A') ||
      'H:mm';
    const eventPos: Coords = this.metric(sunrise, 100);
    return svg`
      <line class="event-line" x1="${eventPos.x}" y1="0" x2="${eventPos.x}" y2="-100"/>
      <g transform="translate(${eventPos.x - 100},-150)">
        <svg viewBox="0 0 150 25" preserveAspectRatio="xMinYMin slice" width="300" height="50">
          <path d="${SVG_ICONS.sunrise}"></path>
          <text class="event-time" dominant-baseline="middle" x="25" y="12.5">
            ${sunrise.format(timeFormat)}
          </text>
        </svg>
      </g>
    `;
  }

  private renderNoon(noon: moment.Moment): SVGTemplateResult {
    if (!noon.isValid()) {
      return svg``;
    }
    const timeFormat =
      (this._config!.meridiem === undefined && 'LT') ||
      (this._config!.meridiem === true && 'h:mm A') ||
      'H:mm';
    const eventPos: Coords = this.metric(noon, 0);
    return svg`
      <line class="event-line" x1="${eventPos.x}" y1="0" x2="${eventPos.x}" y2="100"/>
      <g transform="translate(${eventPos.x - 100},100)">
        <svg viewBox="0 0 150 25" preserveAspectRatio="xMinYMin slice" width="300" height="50">
          <path d="${SVG_ICONS.noon}"></path>
          <text class="event-time" dominant-baseline="middle" x="25" y="12.5">
            ${noon.format(timeFormat)}
          </text>
        </svg>
      </g>
    `;
  }

  private renderSunset(sunset: moment.Moment): SVGTemplateResult {
    if (!sunset.isValid()) {
      return svg``;
    }
    const timeFormat =
      (this._config!.meridiem === undefined && 'LT') ||
      (this._config!.meridiem === true && 'h:mm A') ||
      'H:mm';
    const eventPos: Coords = this.metric(sunset, 100);
    return svg`
      <line class="event-line" x1="${eventPos.x}" y1="0" x2="${eventPos.x}" y2="-100"/>
      <g transform="translate(${eventPos.x - 100},-150)">
        <svg viewBox="0 0 150 25" preserveAspectRatio="xMinYMin slice" width="300" height="50">
          <path d="${SVG_ICONS.sunset}"></path>
          <text class="event-time" dominant-baseline="middle" x="25" y="12.5">
            ${sunset.format(timeFormat)}
          </text>
        </svg>
      </g>
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  private renderTimeToSunset(toSunset: moment.Duration): TemplateResult {
    if (!toSunset.isValid()) {
      return html``;
    }
    return html`
      <div>
        <ha-icon slot="item-icon" icon="mdi:weather-sunset-down"></ha-icon>
        <span class="item-text">: ${toSunset.humanize(true)}</span>
      </div>
    `;
  }

  private renderDaylight(daylight: moment.Duration): TemplateResult {
    if (!daylight.isValid()) {
      return html``;
    }
    return html`
      <div>
        <ha-icon slot="item-icon" icon="mdi:weather-sunny"></ha-icon>
        <span class="item-text">: ${this.humanizer.humanize(daylight.asMilliseconds())}</span>
      </div>
    `;
  }

  // eslint-disable-next-line class-methods-use-this
  private renderMoon(moonPhaseIcon: string | undefined): TemplateResult {
    if (!moonPhaseIcon) {
      return html``;
    }
    return html`<ha-icon icon=${moonPhaseIcon}></ha-icon>`;
  }

  // eslint-disable-next-line class-methods-use-this
  private computeRootStyle(elevation: number): string {
    return `--sc-elevation: ${elevation};`.concat(
      ...Object.entries(this.themeOverrides).map(entry => `${entry.join(': ')};`)
    );
  }

  private metric(time: moment.Moment, elevation: number): Coords {
    return {
      x: time.hour() * 60 + time.minute(),
      y: -elevation * this.yScale
    };
  }

  static get styles(): CSSResult {
    return css`
      .warning {
        display: block;
        color: var(--primary-text-color);
        background-color: #fce588;
        padding: 8px;
      }
      .content {
        filter: var(--sc-background-filter, brightness(calc((2 + var(--sc-elevation)) / 3)));
        display: flex;
        flex-flow: column nowrap;
        position: relative;
      }
      .bg-primary {
        background: var(
          --sc-background,
          linear-gradient(
            hsla(205, 86%, 100%, 0%) 0%,
            hsla(200, 91%, 90%) 46%,
            hsla(74, 75%, 50%) 54%,
            hsla(76, 72%, 50%, 0%) 100%
          )
        );
      }
      .bg-secondary {
        background: var(--sc-background-auxilary, transparent);
      }
      .moon-icon {
        position: absolute;
        top: 5px;
        right: 5px;
        opacity: 0.5;
        fill: var(--sc-moon-color, currentcolor);
      }
      svg {
        width: 100%;
        position: relative;
        stroke-width: 4;
        fill: var(--primary-text-color);
        vector-effect: non-scaling-stroke;
      }
      svg .horizon {
        stroke: var(--sc-horizon-color, transparent);
      }
      svg .event-time {
        font-size: 22px;
      }
      svg .event-line {
        stroke: var(--sc-event-line-color, var(--primary-color));
      }
      svg .sun {
        stroke: var(--sc-sun-color, #ffe160);
        stroke-width: var(--sc-sun-size, 60px);
        stroke-linecap: round;
      }
      @keyframes beam {
        from {
          opacity: 1;
          stroke-width: var(--sc-sun-size, 60px);
        }
        to {
          opacity: 0;
          stroke-width: calc(2 * var(--sc-sun-size, 60px));
        }
      }
      svg .sunbeam {
        stroke: var(--sc-sunbeam-color, #fbec5d);
        stroke-width: var(--sc-sun-size, 60px);
        stroke-linecap: round;
        opacity: 1;
        will-change: opacity, stroke-width;
        animation: beam 3s linear infinite;
      }
      svg.bottom .sun {
        stroke-width: var(--sc-sun-size, 60px);
        stroke: var(--sc-sun-night-color, #b3e5fc);
      }
      .info {
        display: flex;
        flex-flow: row nowrap;
        padding: 16px;
      }
      .info > div:not(:last-child) {
        margin-right: 30px;
      }
      .info span {
        vertical-align: middle;
      }
    `;
  }
}
