import moment from 'moment';
import 'moment/min/locales';
import { HassEntity } from 'home-assistant-js-websocket';
import { LovelaceCardConfig } from 'custom-card-helpers';

export interface SunCardConfigEntities {
  time: string;
  elevation: string;
  max_elevation?: string;
  sunrise?: string;
  sunset?: string;
  noon?: string;
  moon_phase?: string;
}

export interface SunCardConfig extends LovelaceCardConfig {
  entities: SunCardConfigEntities;
  name?: string;
  meridiem?: boolean;
  animation?: boolean;
}

export type Coords = {
  x: number;
  y: number;
};

export interface ITime {
  currentTime: moment.Moment;
}

export interface IMoon {
  moonPhase: string | undefined;
}

export interface ISun {
  // get current sun's elevation
  elevation: number;

  // get maximum elevation of sun this day
  maxElevation: number;

  // get time of Sun's max elevation
  solarNoon: moment.Moment | undefined;

  // get time of sunrise in local time zone
  sunrise: moment.Moment | undefined;

  // get time of sunset in local time zone
  sunset: moment.Moment | undefined;

  // get duration of daylight (from sunrise to sunset)
  daylight: moment.Duration | undefined;

  // get time to sunset
  toSunset: moment.Duration | undefined;
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
    return entity => {
      this._entity = entity;
    };
  }

  constructor(entity: HassEntity) {
    this._entity = entity;
  }
}

export type EntityMutator = (entity: HassEntity) => void;

export interface ValueProvider<R> extends Array<IReader<R> | EntityMutator> {
  0: IReader<R>;
  1: EntityMutator;
}
