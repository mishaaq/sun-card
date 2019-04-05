import {
  LitElement,
  html,
  customElement,
  property,
  CSSResult,
  TemplateResult,
  css,
} from 'lit-element';

import { SunCardConfig, TimeEntity } from './types';
import { SunTracker, SunTrackerFactory } from './tracker';
import './editor'


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

    this._config = {
      name: 'Sun',
      ...config,
    };
  }

  public getCardSize(): number {
    return 4;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    const sunStateObj = this.hass.states['sun.sun'];
    const timeStateObj = this.hass.states['sensor.time'];
    const timeUTCStateObj = this.hass.states['sensor.time_utc'];

    if (!sunStateObj || !timeStateObj || !timeUTCStateObj) {
      return html`
        <ha-card>
          <div class="warning">Required entities: 'sun.sun', 'sensor.time', 'sensor.time_utc' not found.</div>
        </ha-card>
      `;
    }

    const currentTimeEntity: TimeEntity = new TimeEntity(timeStateObj);
    const utcTimeEntity: TimeEntity = new TimeEntity(timeUTCStateObj);

    const st: SunTracker = SunTrackerFactory.get(currentTimeEntity.time, utcTimeEntity.time);

    st.update(sunStateObj);

    const sunXPos = this.xCoord(currentTimeEntity.time);
    const sunYPos = -this.yCoord(st.elevation());

    return html`
      <ha-card .header=${this._config.name}>
        <svg width="100%" x="0px" y="0px" height="150px" viewBox="0 -${this.svgViewBoxH / 2} ${this.svgViewBoxW} ${this.svgViewBoxH}" xmlns="http://www.w3.org/2000/svg" version="1.1">
          <circle fill="yellow" cx="${sunXPos}" cy="${sunYPos}" r="30" />
        </svg>
      </ha-card>
    `;
  }

  private xCoord(time: Date) : number {
    return time.getHours() * 60 + time.getMinutes();
  }

  private yCoord(angle: number) : number {
    return angle * this.yScale;
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
