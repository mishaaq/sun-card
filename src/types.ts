import moment from 'moment';
import 'moment/min/locales';

import { HassEntity } from 'home-assistant-js-websocket';

export interface SunCardConfigEntities {
  time: string;
  elevation: string;
  max_elevation?: string;
  sunrise?: string;
  sunset?: string;
  noon?: string;
  moon_phase?: string;
}

export interface SunCardConfig {
  type: string;
  entities: SunCardConfigEntities;
  name?: string;
  meridiem?: boolean;
}

export type Coords = {
  x: number;
  y: number;
}

export interface ITime {
  current_time: moment.Moment;
}

export interface IMoon {
  moon_phase: string;
}

export interface ISun {
  // get current sun's elevation
  elevation: number;

  // get maximum elevation of sun this day
  max_elevation: number;

  // get time of Sun's max elevation
  solar_noon: moment.Moment;

  // get time of sunrise in local time zone
  sunrise: moment.Moment;

  // get time of sunset in local time zone
  sunset: moment.Moment;

  // get duration of daylight (from sunrise to sunset)
  daylight: moment.Duration;

  // get time to sunset
  to_sunset: moment.Duration;
}

export interface IReader<T> {
  read(): T;
}

export function convert<U>(converter: (v: any) => U) {
  return function decorator(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    if (!method || typeof method !== 'function') return;
    descriptor.value = function decorated(...args: any[]) {
      const value: any = method.apply(this, args);
      return converter.call(this, value);
    };
    return descriptor;
  };
}

export class EntityWrapper {
  protected _entity: HassEntity;

  state(): string {
    return this._entity.state;
  }

  attr(name: string): any {
    return this._entity.attributes[name];
  }

  mutator(): EntityMutator {
    return (entity) => { this._entity = entity; };
  }

  constructor(entity: HassEntity) {
    this._entity = entity;
  }
}

export type EntityMutator = (entity: HassEntity) => void;

export interface ValueProvider<R> extends Array<IReader<R>|EntityMutator|undefined>
  {0: IReader<R>, 1: EntityMutator|undefined}
