import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  css,
} from 'lit-element';

import {
  HomeAssistant,
  fireEvent,
  LovelaceCardEditor,
} from 'custom-card-helpers';

import moment from 'moment';
import 'moment/min/locales';

import { SunCardConfig } from './types';

@customElement('sun-card-editor')
export class SunCardEditor extends LitElement implements LovelaceCardEditor {
  @property() private _hass?: HomeAssistant;

  @property() private _config?: SunCardConfig;

  private _defaultMeridiem?: boolean;

  public setConfig(config) : void {
    this._config = config;
    this.requestUpdate();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) {
      this._defaultMeridiem = moment.localeData(hass.language)
        .longDateFormat('LT').toLowerCase().indexOf('a') > -1;
    }
  }

  get _name(): string {
    return this._config!.name !== undefined
      ? this._config!.name
      : this._hass!.states['sun.sun'].attributes.friendly_name
        || this._hass!.localize('domain.sun');
  }

  get _meridiem(): boolean | undefined {
    return this._config!.meridiem !== undefined ? this._config!.meridiem : this._defaultMeridiem;
  }

  protected render(): TemplateResult | void {
    if (!this.hass) {
      return html``;
    }

    return html`
      <div class="card-config">
        <paper-input
          label="Name"
          .value="${this._name}"
          .configValue="${'name'}"
          @value-changed="${this._valueChanged}">
        </paper-input>
        <div class="side-by-side">
          <div class="label">
            <div class="heading">Clock format</div>
            <div class="description">Default set to language specific</div>
          </div>
          <div class="input">
            <label>24h</label>
            <ha-switch
              class="${this._config!.meridiem === undefined ? 'default' : ''} slotted"
              id="meridiem"
              .configValue="${'meridiem'}"
              ?checked="${this._meridiem === true}"
              @change="${this._valueChanged}">
              12h
            </ha-switch>
          </div>
        </div>
      </div>
    `;
  }

  private _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const { target } = ev;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      this._config = {
        ...this._config,
        [target.configValue]:
          target.checked !== undefined ? target.checked : target.value,
      };
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResult {
    return css`
      .side-by-side {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        line-height: var(--paper-font-body1_-_line-height);;
      }
      .label .heading {
        font-size: var(--paper-input-container-shared-input-style_-_font-size)
      }
      .label .description {
        color: var(--disabled-text-color);
        font-size: var(--paper-font-body1_-_font-size);
      }
      .input {
        display: flex;
        flex-flow: row nowrap;
      }
      .input label {
        margin: auto 0;
        padding-right: 24px;
      }
      #meridiem.default {
        --switch-checked-track-color:  var(--disabled-text-color);
        --switch-checked-button-color:  var(--disabled-text-color);
        --switch-unchecked-track-color:  var(--disabled-text-color);
        --switch-unchecked-button-color:  var(--disabled-text-color);
      }
    `;
  }
}
