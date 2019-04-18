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

@customElement('sun-card')
class SunCard extends LitElement {
  public static async getConfigElement(): Promise<HTMLElement> {
    return document.createElement('sun-card-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  @property() public hass?: any;

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

    const sunStateObj: object = this.hass.states['sun.sun'];
    const timeStateObj: object = this.hass.states['sensor.time_utc'];

    if (!sunStateObj || !timeStateObj) {
      return html`
        <ha-card>
          <div class="warning">Required entities: 'sun.sun', 'sensor.time_utc' not found.</div>
        </ha-card>
      `;
    }

    const currentTimeEntity: TimeEntity = new TimeEntity(timeStateObj);
    const sunEntity: SunEntity = createSunEntity(sunStateObj, currentTimeEntity);

    const renderSun = (): SVGTemplateResult => {
      const sunPos: Coords = this.metric(currentTimeEntity.time, sunEntity.elevation);
      return svg`<circle fill="yellow" cx="${sunPos.x}" cy="${sunPos.y}" r="30" />`;
    };

    const sunrise: [string, moment.Moment] = ['Sunrise', sunEntity.sunrise];
    const sunset: [string, moment.Moment] = ['Sunset', sunEntity.sunset];
    const [renderSunrise, renderSunset] = [sunrise, sunset].map(([name, event]): Function => {
      return () => {
        if (!event.isValid()) {
          return svg``;
        }
        const eventPos: Coords = this.metric(event, 50);
        return svg`
          <line x1="${eventPos.x}" y1="0" x2="${eventPos.x}" y2="${eventPos.y}" stroke-width="4" />
          <text x="${eventPos.x - 40}" y="${eventPos.y - 70}" style="font-size: 35px">${name}</text>
          <text x="${eventPos.x - 40}" y="${eventPos.y - 30}" style="font-size: 40px">
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
        <text x="50%" y="100" style="font-size: 38px" text-anchor="middle">
          Sunset: ${sunEntity.to_sunset.humanize(true)}
        </text>
      `;
    };

    const renderDaylight = (): SVGTemplateResult => {
      if (!sunEntity.daylight.isValid()) {
        return svg``;
      }
      return svg`
        <text x="50%" y="150" style="font-size: 38px" text-anchor="middle">
          Daylight: ${sunEntity.daylight.humanize(false)}
        </text>
      `;
    };

    return html`
      <ha-card .header=${this._config.name || sunEntity.friendly_name}>
        <svg width="100%" x="0px" y="0px" height="150px" viewBox="0 -${this.svgViewBoxH / 2} ${this.svgViewBoxW} ${this.svgViewBoxH}" xmlns="http://www.w3.org/2000/svg" version="1.1">
          ${renderSun()}
          <g stroke="gray">
            ${renderSunrise()}
            ${renderSunset()}
            ${renderTimeToSunset()}
            ${renderDaylight()}
          </g>
        </svg>
      </ha-card>
    `;
  }

  private metric(time: moment.Moment, elevation: number): Coords {
    if (!time.isValid()) {
      return { x: -1000, y: -1000 };
    }
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
      svg {
        background: linear-gradient(rgba(242, 249, 254,  0%),
                                     rgb(214, 240, 253) 46%,
                                     rgb(182, 224,  38) 54%,
                                    rgba(171, 220,  40,  0%));
      }
    `;
  }
}
