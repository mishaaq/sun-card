import {
  LitElement,
  html,
  customElement,
  property,
  TemplateResult,
} from 'lit-element';

import { SunCardConfig } from './types';

class ConfigEvent extends Event {
  detail?: object;
}

const fireEvent = (node: HTMLElement, type, detail, options?) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new ConfigEvent(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

@customElement('sun-card-editor')
export class SunCardEditor extends LitElement {
  @property() public hass?: any;

  @property() private _config?: SunCardConfig;

  public setConfig(config) : void {
    this._config = config;
    this.requestUpdate();
  }

  get _name(): string {
    return this._config!.name || '';
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
      if (target.value === '') {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }
}
