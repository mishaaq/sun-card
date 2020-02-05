import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
  CSSResult,
  css,
} from 'lit-element';

import { HassEntity } from 'home-assistant-js-websocket';

import {
  HomeAssistant,
  fireEvent,
  LovelaceCardEditor,
} from 'custom-card-helpers';

import moment from 'moment';
import 'moment/min/locales';

import { SunCardConfig } from './types';
import defaultConfig from './config';

@customElement('sun-card-editor')
export class SunCardEditor extends LitElement implements LovelaceCardEditor {
  @property() private _hass?: HomeAssistant;

  @property() private _config?: SunCardConfig;

  private _defaultName?: string;

  private _defaultMeridiem?: boolean;

  public setConfig(config) : void {
    this._config = config;
    this.requestUpdate();
  }

  get config(): SunCardConfig {
    return {
      ...this._config,
      ...{
        ...defaultConfig,
        ...{ name: this._defaultName, meridiem: this._defaultMeridiem },
      },
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) {
      this._defaultMeridiem = moment.localeData(hass.language)
        .longDateFormat('LT').toLowerCase().indexOf('a') > -1;
      const sunEntity: HassEntity = hass.states['sun.sun'];
      this._defaultName = sunEntity
        ? sunEntity.attributes.friendly_name
        : hass.localize('domain.sun');
    }
  }

  protected render(): TemplateResult | void {
    if (!this._hass) {
      return html``;
    }

    return html`
      <div class="card-config">
        <paper-input
          label="Name"
          .value="${this.config.name}"
          .configValue="${'[name]'}"
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
              .configValue="${'[meridiem]'}"
              ?checked="${this.config.meridiem === true}"
              @change="${this._valueChanged}">
              12h
            </ha-switch>
          </div>
        </div>
        <div>
          <div class="side-by-side">
            <paper-dropdown-menu
              label="Time"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[time]'}"
            >
              ${this._entityDropdown('time', ['sensor'])}
            </paper-dropdown-menu>
            <paper-dropdown-menu
              label="Elevation"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[elevation]'}"
            >
              ${this._entityDropdown('elevation', ['sensor', 'sun'])}
            </paper-dropdown-menu>
          </div>
          <div class="side-by-side">
            <paper-dropdown-menu
              label="Sunrise"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[sunrise]'}"
            >
              ${this._entityDropdown('sunrise', ['sensor', 'sun'])}
            </paper-dropdown-menu>
            <paper-dropdown-menu
              label="Sunset"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[sunset]'}"
            >
              ${this._entityDropdown('sunset', ['sensor', 'sun'])}
            </paper-dropdown-menu>
          </div>
          <div class="side-by-side">
            <paper-dropdown-menu
              label="Noon"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[noon]'}"
            >
              ${this._entityDropdown('noon', ['sensor'])}
            </paper-dropdown-menu>
            <paper-dropdown-menu
              label="Moon"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[moon]'}"
            >
              ${this._entityDropdown('moon', ['sensor'])}
            </paper-dropdown-menu>
          </div>
        </div>
      </div>
    `;
  }

  private _entityDropdown(configName: string, entityDomains: string[]) : TemplateResult {
    const entities: string[] = this._getAvailableEntities(entityDomains);
    return html`
      <paper-listbox
        slot='dropdown-content'
        .selected="${entities.indexOf(this.config.entities[configName])}"
      >
        ${this._entityItems(entities)}
      </paper-listbox>
    `;
  }

  private _entityItems(entities: string[]): TemplateResult {
    return html`
      ${entities.map((entityName) => {
        const entity = this._hass!.states[entityName];
        return html`
          <paper-item value=${entity.entity_id}>
            <ha-icon .icon=${entity.attributes.icon}></ha-icon>
            <span>${entity.entity_id}</span>
          </paper-item>
        `;
      })}
    `;
  }

  private _getAvailableEntities(ofType?: string[]): string[] {
    if (!this._hass) {
      return [];
    }
    const { states } = this._hass;

    let entities: string[] = Object.keys(states);
    if (ofType) entities = entities.filter((entityId) => {
      return ofType.includes(entityId.substr(0, entityId.indexOf('.')));
    });
    return entities.sort();
  }

  private _valueChanged(ev) {
    if (!this._config || !this._hass) {
      return;
    }
    const { target } = ev;
    if (target.configValue) {
      const [,
        objName,
        propName,
      ] = target.configValue.match(/^([a-zA-Z][a-zA-Z0-9]+)?(?:\[([a-zA-Z][a-zA-Z0-9]+)\])$/);

      const configObj = objName ? (this.config[objName] || {}) : this.config;
      if (configObj[propName] === (target.checked !== undefined ? target.checked : target.value)) {
        return;
      }
      if (objName)
        this._config = {
          ...this._config,
          [objName]: {
            ...this._config[objName],
            [propName]: target.checked !== undefined ? target.checked : target.value,
          },
        };
      else
        this._config = {
          ...this._config,
          [propName]:
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
        line-height: var(--paper-font-body1_-_line-height);
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
