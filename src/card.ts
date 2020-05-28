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
  PropertyValues,
} from 'lit-element';

import {
  HomeAssistant,
  LovelaceCardEditor,
} from 'custom-card-helpers';

import moment from 'moment';
import 'moment/min/locales';
import 'moment-timezone/builds/moment-timezone-with-data';

import { HumanizeDurationLanguage, HumanizeDuration } from 'humanize-duration-ts';

import { CARD_VERSION, SVG_ICONS } from './const';

import {
  SunCardConfig,
  Coords,
  ISun,
  IMoon,
  ITime,
  EntityMutator,
} from './types';

import './editor';
import { Factory } from './entities';

/* eslint no-console: 0 */
console.info(`%c SUN-CARD %c ${CARD_VERSION} `,
  'color: white; background: coral; font-weight: 700;',
  'color: coral; background: white; font-weight: 700;');

let updateFunc: EntityMutator|undefined;

@customElement('sun-card')
class SunCard extends LitElement {
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

  public setConfig(newConfig: SunCardConfig): void {
    const entities = {
      ...{ time: 'sensor.time_utc', elevation: 'sun.sun' },
      ...newConfig.entities,
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
        language: hass.language,
        delimiter: ' ',
        units: ['h', 'm'],
        round: true,
      });
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) {
      return true;
    }

    const oldHass = changedProps.get('_hass') as HomeAssistant | undefined;
    return oldHass
      ? Object.values(this._config!.entities).some((entityName) => {
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
        Object.values(this._config!.entities).forEach((entityName) => {
          if (oldHass.states[entityName] !== this.hass!.states[entityName]) updateFunc!(this.hass!.states[entityName]);
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

    const sun = this.renderSun(this._provider.current_time, this._provider.elevation);
    const sunBeam = this._config!.animation || this._config!.animation === undefined
      ? this.renderSunbeam(this._provider.current_time, this._provider.elevation) : null;

    const sunrise = this._provider.sunrise ? this.renderSunrise(this._provider.sunrise) : null;
    const sunset = this._provider.sunset ? this.renderSunset(this._provider.sunset) : null;
    const noon = this._provider.solar_noon ? this.renderNoon(this._provider.solar_noon) : null;

    const moonPhase = this._provider.moon_phase ? this.renderMoon(this._provider.moon_phase) : null;

    const timeToSunset = this._provider.to_sunset ? this.renderTimeToSunset(this._provider.to_sunset) : null;
    const daylight = this._provider.daylight ? this.renderDaylight(this._provider.daylight) : null;

    let header = this._config.name;
    if (header === undefined)
      header = this.hass.states['sun.sun']?.attributes.friendly_name
        || this.hass.localize('domain.sun');
    return html`
      <ha-card .header=${header}>
        <div class="content">
          <svg class="top" preserveAspectRatio="xMinYMin slice" viewBox="0 -${this.svgViewBoxH / 2} ${this.svgViewBoxW} ${this.svgViewBoxH / 2}" xmlns="http://www.w3.org/2000/svg" version="1.1">
            ${sunrise}
            ${sunset}
            ${sunBeam}
            ${sun}
          </svg>
          <svg class="bottom" preserveAspectRatio="xMinYMax slice" viewBox="0 0 ${this.svgViewBoxW} ${this.svgViewBoxH / 2}" xmlns="http://www.w3.org/2000/svg" version="1.1">
            <line x1="0" y1="0" x2="${this.svgViewBoxW}" y2="0" class="horizon" />
            ${noon}
            ${sun}
          </svg>
          <div class="moon-icon">
            ${moonPhase}
          </div>
        </div>
        <div class="info">
          ${timeToSunset}
          ${daylight}
        </div>
      </ha-card>
    `;
  }

  private renderSun(current_time: moment.Moment, elevation: number): SVGTemplateResult {
    const sunPos: Coords = this.metric(current_time, elevation);
    return svg`
      <line class="sun" x1="${sunPos.x}" x2="${sunPos.x}" y1="${sunPos.y}" y2="${sunPos.y}" />
    `;
  }

  renderSunbeam(current_time: moment.Moment, elevation: number): SVGTemplateResult {
    const sunPos: Coords = this.metric(current_time, elevation);
    return svg`
      <line class="sunbeam" x1="${sunPos.x}" x2="${sunPos.x}" y1="${sunPos.y}" y2="${sunPos.y}" />
    `;
  }

  renderSunrise(sunrise: moment.Moment): SVGTemplateResult {
    if (!sunrise.isValid()) {
      return svg``;
    }
    const timeFormat =
      this._config!.meridiem === undefined && 'LT' ||
      this._config!.meridiem === true && 'h:mm A' ||
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

  renderNoon(noon: moment.Moment): SVGTemplateResult {
    if (!noon.isValid()) {
      return svg``;
    }
    const timeFormat =
      this._config!.meridiem === undefined && 'LT' ||
      this._config!.meridiem === true && 'h:mm A' ||
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

  renderSunset(sunset: moment.Moment): SVGTemplateResult {
    if (!sunset.isValid()) {
      return svg``;
    }
    const timeFormat =
      this._config!.meridiem === undefined && 'LT' ||
      this._config!.meridiem === true && 'h:mm A' ||
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

  renderTimeToSunset(to_sunset: moment.Duration): TemplateResult {
    if (!to_sunset.isValid()) {
      return html``;
    }
    return html`
      <div>
        <ha-icon slot="item-icon" icon="mdi:weather-sunset-down"></ha-icon>
        <span class="item-text">: ${to_sunset.humanize(true)}</span>
      </div>
    `;
  }

  renderDaylight(daylight: moment.Duration): TemplateResult {
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

  renderMoon(moon_phase: string | undefined): TemplateResult {
    if (!moon_phase) {
      return html``;
    }
    return html`
      <ha-icon icon=${this.moonIcon(moon_phase)}></ha-icon>
    `;
  }

  private metric(time: moment.Moment, elevation: number): Coords {
    return {
      x: time.hour() * 60 + time.minute(),
      y: -elevation * this.yScale,
    };
  }

  private moonIcon(phase: string): string {
    const icon: string = {
      new_moon: 'new',
      waxing_crescent: 'waxing-crescent',
      first_quarter: 'first-quarter',
      waxing_gibbous: 'waxing-gibbous',
      full_moon: 'full',
      waning_gibbous: 'waning-gibbous',
      last_quarter: 'last-quarter',
      waning_crescent: 'waning-crescent',
    }[phase];
    if (!icon) console.error(`Sun Card: Unexpected state value '${phase}' for moon sensor.`);
    return `mdi:moon-${icon}`;
  }

  static get styles(): CSSResult {
    return css`
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }
      .content {
        background: var(--sc-background, linear-gradient(hsla(205, 86%, 100%, 0%)   0%,
                                                         hsla(200, 91%,  90%)      46%,
                                                         hsla( 74, 75%,  50%)      54%,
                                                         hsla( 76, 72%,  50%, 0%) 100%));
        display: flex;
        flex-flow: column nowrap;
        position: relative;
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
        stroke: var(--sc-event-line-color, #212121);
      }
      svg .sun {
        stroke: var(--sc-sun-color, #ffe160);
        stroke-width: var(--sc-sun-size, 60px);
        stroke-linecap: round;
      }
      @keyframes beam {
        from { opacity: 1; stroke-width: var(--sc-sun-size, 60px); }
        to   { opacity: 0; stroke-width: calc(2 * var(--sc-sun-size, 60px)); }
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
