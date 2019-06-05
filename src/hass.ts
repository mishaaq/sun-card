import {
  HassConfig,
  HassEntities,
} from 'home-assistant-js-websocket';

export const fireEvent = (
  node: HTMLElement,
  type,
  detail?,
  options?: {
    bubbles?: boolean,
    cancelable?: boolean,
    composed?: boolean,
  },
) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  }) as any;
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

export interface HomeAssistant {
  states: HassEntities;
  config: HassConfig;
  language: string;
  localize: (key: string, ...args: any[]) => string;
}
