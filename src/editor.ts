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

@customElement('sun-card-editor')
export class SunCardEditor extends LitElement implements LovelaceCardEditor {
  @property() private _hass?: HomeAssistant;

  @property() private _config?: SunCardConfig;

  public setConfig(config: SunCardConfig) : void {
    this._config = config;
    this.requestUpdate();
  }

  get config(): SunCardConfig {
    const entitiesConfig = {
      ...{ time: 'sensor.time_utc', elevation: 'sun.sun' },
      ...this._config?.entities,
    };
    return {
      ...{
        name: this._hass?.states['sun.sun']?.attributes.friendly_name || this._hass?.localize('domain.sun'),
        meridiem: moment.localeData(this._hass?.language)
          .longDateFormat('LT').toLowerCase().indexOf('a') > -1,
        animation: true,
      } as SunCardConfig,
      ...this._config,
      ...{ entities: entitiesConfig },
    };
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  protected render(): TemplateResult {
    if (!this._hass) {
      return html``;
    }

    return html`
      <div class="card-config">
        <paper-input
          label="Name"
          id="name"
          class="${this.classesForItem(this._config!.name, true)}"
          .value="${this.config.name}"
          .configValue="${'[name]'}"
          @value-changed="${this._valueChanged}">
        </paper-input>
        <div class="side-by-side control">
          <div class="label">
            <div class="heading">Clock format</div>
            <div class="description">Default set to language specific</div>
          </div>
          <div class="input">
            <label>24h</label>
            <ha-switch
              class="${this.classesForItem(this._config!.meridiem, true)} slotted"
              id="meridiem"
              .configValue="${'[meridiem]'}"
              ?checked="${this.config.meridiem === true}"
              @change="${this._valueChanged}">
              12h
            </ha-switch>
          </div>
        </div>
        <div class="side-by-side control">
          <div class="label">
            <div class="heading">Animation</div>
            <div class="description">Turn on/off animation of sunbeam</div>
          </div>
          <div class="input">
            <label>off</label>
            <ha-switch
              class="${this.classesForItem(this._config!.animation, true)} slotted"
              id="animation"
              .configValue="${'[animation]'}"
              ?checked="${this.config.animation === true}"
              @change="${this._valueChanged}">
              on
            </ha-switch>
          </div>
        </div>
        <h4>Entities:</h4>
        <div>
          <div class="side-by-side">
            <paper-dropdown-menu
              label="Time *"
              id="time"
              class="${this.classesForItem(this._config!.entities?.time, true, true)}"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[time]'}"
            >
              ${this._entityDropdown('time', ['sensor'])}
            </paper-dropdown-menu>
          </div>
          <div class="side-by-side">
            <paper-dropdown-menu
              label="Elevation *"
              id="elevation"
              class="${this.classesForItem(this._config!.entities?.elevation, true, true)}"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[elevation]'}"
            >
              ${this._entityDropdown('elevation', ['sensor', 'sun'])}
            </paper-dropdown-menu>
            <paper-dropdown-menu
              label="Max elevation"
              @value-changed=${this._valueChanged}
              .configValue="${'entities[max_elevation]'}"
            >
              ${this._entityDropdown('max_elevation', ['sensor', 'sun'])}
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
              .configValue="${'entities[moon_phase]'}"
            >
              ${this._entityDropdown('moon_phase', ['sensor'])}
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
        ${entities.map((entityName) => { return this._entityItem(this._hass!.states[entityName]); })}
      </paper-listbox>
    `;
  }

  private _entityItem(entity: HassEntity): TemplateResult {
    return html`
      <paper-item value=${entity.entity_id}>
        <ha-icon .icon=${entity.attributes.icon}></ha-icon>
        <span>${entity.entity_id}</span>
      </paper-item>
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

  private _valueChanged(ev: Event) {
    if (!this._config || !this._hass) {
      return;
    }
    const { target }: any = ev;
    if (target.configValue) {
      const [,
        objName,
        propName,
      ] = target.configValue.match(/^([_a-zA-Z][_a-zA-Z0-9]+)?(?:\[([_a-zA-Z][_a-zA-Z0-9]+)\])$/);

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

  private classesForItem(configValue: any, hasDefault?: boolean, required?: boolean): string {
    const isDefault = hasDefault && configValue === undefined;
    const classes = [
      isDefault ? 'default' : '',
      required && (hasDefault && !isDefault) || configValue === '' ? 'error' : '',
    ];
    return classes.join(' ').trim();
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
      .control {
        padding: 8px 0;
      }
      .input {
        display: flex;
        flex-flow: row nowrap;
      }
      .input label {
        margin: auto 0;
        padding-right: 24px;
      }
      ha-switch {
        min-width: 80px;
      }
      #name.default, #time.default, #elevation.default {
        --paper-input-container-input-color: var(--disabled-text-color);
      }
      #meridiem.default, #animation.default {
        --switch-checked-track-color: var(--disabled-text-color);
        --switch-checked-button-color: var(--disabled-text-color);
        --switch-unchecked-track-color: var(--disabled-text-color);
        --switch-unchecked-button-color: var(--disabled-text-color);
      }
    `;
  }
}
