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
} from 'lit-element';

import { HassEntity } from "home-assistant-js-websocket";
import { HomeAssistant } from "./hass";

import moment from 'moment';
import 'moment-timezone';

import {
  SunCardConfig,
  Coords,
  TimeEntity,
  SunEntity,
  createSunEntity,
} from './types';

import './editor';

const SVG_ICONS = {
  sunrise: 'M3,12H7C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12H21C21.55,12 22,12.45 22,13C22,13.55 21.55,' +
    '14 21,14H3C2.45,14 2,13.55 2,13C2,12.45 2.45,12 3,12M15,12C15,10.34 13.66,9 12,9C10.34,9 9,10.34 9,12' +
    'H15M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,' +
    '7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,' +
    '8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M12.71,16.3L15.82,19.41C16.21,19.8 16.21,20.43 15.82,20.82' +
    'C15.43,21.21 14.8,21.21 14.41,20.82L12,18.41L9.59,20.82C9.2,21.21 8.57,21.21 8.18,20.82C7.79,20.43 7.79,' +
    '19.8 8.18,19.41L11.29,16.3C11.5,16.1 11.74,16 12,16C12.26,16 12.5,16.1 12.71,16.3Z',
  sunset: 'M3,12H7C7,9.24 9.24,7 12,7C14.76,7 17,9.24 17,12H21C21.55,12 22,12.45 22,13C22,13.55 21.55,14 21,14' +
    'H3C2.45,14 2,13.55 2,13C2,12.45 2.45,12 3,12M15,12C15,10.34 13.66,9 12,9C10.34,9 9,10.34 9,12H15M12,2L14.39,' +
    '5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5' +
    'C5.5,9.24 5.25,10 5.11,10.79L3.34,7M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,' +
    '7.15 16.5,6.64L20.65,7M12.71,20.71L15.82,17.6C16.21,17.21 16.21,16.57 15.82,16.18C15.43,15.79 14.8,' +
    '15.79 14.41,16.18L12,18.59L9.59,16.18C9.2,15.79 8.57,15.79 8.18,16.18C7.79,16.57 7.79,17.21 8.18,17.6' +
    'L11.29,20.71C11.5,20.9 11.74,21 12,21C12.26,21 12.5,20.9 12.71,20.71Z',
  daylight: 'M12,7C14.76,7 17,9.24 17,12C17,14.76 14.76,17 12,17C9.24,17 7,14.76 7,12C7,9.24 9.24,7 12,7M12,9' +
    'C10.34,9 9,10.34 9,12C9,13.66 10.34,15 12,15C13.66,15 15,13.66 15,12C15,10.34 13.66,9 12,9M12,2L14.39,5.42' +
    'C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,' +
    '9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,' +
    '17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,' +
    '17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56' +
    'C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z',
};

@customElement('sun-card')
class SunCard extends LitElement {
  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('sun-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  @property() public hass?: HomeAssistant;

  @property() private _config?: SunCardConfig;

  readonly svgViewBoxW: number = 24 * 60; // 24h * 60 minutes - viewBox width in local points

  readonly svgViewBoxH: number = 432; // viewBox height in local points

  // half of svg viewBox height / (-zenith + zenith elevation angle)
  readonly yScale: number = this.svgViewBoxH / 180;

  public setConfig(config: SunCardConfig): void {
    if (!config || !config.type) {
      throw new Error('Invalid configuration');
    }

    this._config = config;
  }

  public getCardSize(): number {
    return 4;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }
    moment.locale(this.hass.language);
    moment.tz.setDefault(this.hass.config.time_zone);
    const { localize } = this.hass;

    const sunStateObj: HassEntity = this.hass.states['sun.sun'];
    const timeStateObj: HassEntity = this.hass.states['sensor.time_utc'];

    if (!sunStateObj || !timeStateObj) {
      return html`
        <hui-warning
          >${localize('ui.panel.lovelace.warning.entity_not_found', 'entity', 'sun.sun, sensor.time_utc')}
        </hui-warning>
      `;
    }

    const currentTimeEntity: TimeEntity = new TimeEntity(timeStateObj);
    const sunEntity: SunEntity = createSunEntity(sunStateObj, currentTimeEntity);

    const renderSun = (): SVGTemplateResult => {
      const sunPos: Coords = this.metric(currentTimeEntity.time, sunEntity.elevation);
      return svg`<circle class="sun" cx="${sunPos.x}" cy="${sunPos.y}" r="30" />`;
    };
    const renderSunbeam = (): SVGTemplateResult => {
      const sunPos: Coords = this.metric(currentTimeEntity.time, sunEntity.elevation);
      return svg`
        <circle class="sunbeam" cx="${sunPos.x}" cy="${sunPos.y}" r="50">
          <animate attributeName="opacity" from="1" to="0" dur="3s" repeatCount="indefinite" />
          <animate attributeName="r" attributeType="XML" from="29" to="50" dur="3s" fill="remove"
            begin="0s" repeatCount="indefinite" />
        </circle>
      `;
    };

    const sunrise: [string, moment.Moment] = [SVG_ICONS.sunrise, sunEntity.sunrise];
    const sunset: [string, moment.Moment] = [SVG_ICONS.sunset, sunEntity.sunset];
    const [renderSunrise, renderSunset] = [sunrise, sunset].map(([svgData, event]): Function => {
      return () => {
        if (!event.isValid()) {
          return svg``;
        }
        const eventPos: Coords = this.metric(event, 50);
        return svg`
          <line class="event-line" x1="${eventPos.x}" y1="0" x2="${eventPos.x}" y2="${eventPos.y}"/>
          <g transform="translate(${eventPos.x - 100},${eventPos.y - 70})">
            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" width="50" height="50">
              <path d="${svgData}"></path>
            </svg>
          </g>
          <text class="event-time" x="${eventPos.x - 40}" y="${eventPos.y - 30}">
            ${event.format('LT')}
          </text>
        `;
      };
    });

    const renderTimeToSunset = (): SVGTemplateResult => {
      if (!sunEntity.to_sunset.isValid()) {
        return svg``;
      }
      return svg`
        <g transform="translate(640,60)">
          <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" width="54" height="54">
            <path d="${SVG_ICONS.sunset}"></path>
          </svg>
        </g>
        <text class="time-to-sunset" x="700" y="100">
          : ${sunEntity.to_sunset.humanize(true)}
        </text>
      `;
    };

    const renderDaylight = (): SVGTemplateResult => {
      if (!sunEntity.daylight.isValid()) {
        return svg``;
      }
      return svg`
        <g transform="translate(640,120)">
            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" width="54" height="54">
              <path d="${SVG_ICONS.daylight}"></path>
            </svg>
          </g>
        <text class="daylight" x="700" y="160">
          : ${sunEntity.daylight.humanize(false)}
        </text>
      `;
    };

    return html`
      <ha-card .header=${this._config.name || sunEntity.friendly_name || localize('domain.sun')}>
        <div class="content">
          <svg class="top" preserveAspectRatio="xMinYMin slice" viewBox="0 -${this.svgViewBoxH / 2} ${this.svgViewBoxW} ${this.svgViewBoxH / 2}" xmlns="http://www.w3.org/2000/svg" version="1.1">
            ${renderSunrise()}
            ${renderSunset()}
            ${renderSunbeam()}
            ${renderSun()}
          </svg>
          <svg class="bottom" preserveAspectRatio="xMinYMax slice" viewBox="0 0 ${this.svgViewBoxW} ${this.svgViewBoxH / 2}" xmlns="http://www.w3.org/2000/svg" version="1.1">
            ${renderTimeToSunset()}
            ${renderDaylight()}
            ${renderSun()}
          </svg>
        </div>
      </ha-card>
    `;
  }

  private metric(time: moment.Moment, elevation: number): Coords {
    return {
      x: time.hour() * 60 + time.minute(),
      y: -elevation * this.yScale,
    };
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
        background: linear-gradient(rgba(242, 249, 254,  0%),
                                     rgb(214, 240, 253) 46%,
                                     rgb(182, 224,  38) 54%,
                                    rgba(171, 220,  40,  0%));
        display: flex;
        flex-flow: column nowrap;
      }
      svg {
        width: 100%;
        position: relative;
        font-size: 38px;
        stroke-width: 4;
        fill: var(--primary-text-color)
      }
      svg .event-name {
        font-size: 35px;
        font-weight: bold;
      }
      svg .event-time {
        font-size: 40px;
      }
      svg .event-line {
        stroke: var(--light-primary-color);
      }
      svg .time-to-sunset,
      svg .daylight {
        text-anchor: start;
      }
      svg .sun {
        fill: #ffe160;
      }
      svg .sunbeam {
        fill: #ffe160;
        stroke: #fbec5d;
        stroke-width: 3;
        stroke-linecap: round;
      }
      svg.bottom .sun {
        fill-opacity: 0.1;
        stroke-width: 4;
        stroke: var(--light-primary-color);
        stroke-dasharray: 5,5
      }
    `;
  }
}
