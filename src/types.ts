import moment from 'moment';
import { HassEntity } from "home-assistant-js-websocket";

export interface SunCardConfig {
  type: string;
  name?: string;
}

export type Coords = {
  x: number;
  y: number;
}

// Wrapper for HA time_utc entity (from 'time_date' platform)
export class TimeEntity {
  private _entity: HassEntity;

  // get local time from HA time_utc entity
  get time(): moment.Moment {
    return moment.utc(this._entity.state, 'h:mm A').local();
  }

  get hour(): number {
    return this.time.hour();
  }

  get minute(): number {
    return this.time.minute();
  }

  constructor(haEntity: HassEntity) {
    this._entity = haEntity;
  }
}

export interface SunEntity {
  // get friendly name as defined on hass configuration
  friendly_name?: string;

  // get current sun's elevation
  elevation: number;

  // get maximum elevation of sun this day
  max_elevation: number;

  // get time of sunrise in local time zone
  sunrise: moment.Moment;

  // get time of sunset in local time zone
  sunset: moment.Moment;

  // get duration of daylight (from sunrise to sunset)
  daylight: moment.Duration;

  // get time to sunset
  to_sunset: moment.Duration;
}

interface SunEntityConstructor {
  new(sunEntity: any, currentTimeEntity: TimeEntity): SunEntity;
}

class HASunEntity implements SunEntity {
  static requiredAttributes: string[] = ['elevation', 'next_rising', 'next_setting'];

  protected _entity: HassEntity;

  protected _timeEntity: TimeEntity;

  get friendly_name(): string | undefined {
    return this._entity.attributes.friendly_name;
  }

  get elevation(): number {
    return this._entity.attributes.elevation;
  }

  get max_elevation(): number {
    return 90;
  }

  get sunrise(): moment.Moment {
    let nextSunrise = moment.utc(this._entity.attributes.next_rising).local();
    if (this._timeEntity.time.day() !== nextSunrise.day()) {
      nextSunrise = moment.invalid();
    }
    return nextSunrise;
  }

  get sunset(): moment.Moment {
    let nextSunset = moment.utc(this._entity.attributes.next_setting).local();
    if (this._timeEntity.time.day() !== nextSunset.day()) {
      nextSunset = moment.invalid();
    }
    return nextSunset;
  }

  get daylight(): moment.Duration {
    return moment.duration(NaN);
  }

  get to_sunset(): moment.Duration {
    // returns invalid Duration in case of invalid sunset time
    return moment.duration(this.sunset.diff(this._timeEntity.time));
  }

  constructor(haEntity: HassEntity, currentTimeEntity: TimeEntity) {
    this._entity = haEntity;
    this._timeEntity = currentTimeEntity;
  }
}

class EnhancedSunEntity extends HASunEntity implements SunEntity {
  static requiredAttributes: string[] = ['elevation', 'max_elevation', 'sunrise', 'sunset', 'daylight'];

  get max_elevation(): number {
    return this._entity.attributes.max_elevation;
  }

  get daylight(): moment.Duration {
    return moment.duration(this._entity.attributes.daylight, 'seconds');
  }

  get sunrise(): moment.Moment {
    return moment.utc(this._entity.attributes.sunrise).local();
  }

  get sunset(): moment.Moment {
    return moment.utc(this._entity.attributes.sunset).local();
  }

  get to_sunset(): moment.Duration {
    return moment.duration(this.sunset.diff(this._timeEntity.time));
  }
}

function createSunEntityCtor(ctor: SunEntityConstructor, sunEntity: HassEntity, currentTimeEntity: TimeEntity): SunEntity {
  return new ctor(sunEntity, currentTimeEntity);
}

export function createSunEntity(sunEntity: HassEntity, currentTime: TimeEntity) : SunEntity {
  const chain = [EnhancedSunEntity, HASunEntity];
  const ctor = chain.find((cls): boolean => {
    return cls.requiredAttributes.every((attribute): boolean => {
      return Object.hasOwnProperty.call(sunEntity.attributes, attribute);
    });
  });
  if (!ctor) {
    throw new Error(`Couldn't find corresponding class to entity with attributes:
      ${Object.keys(sunEntity.attributes).toString()}`);
  }
  return createSunEntityCtor(ctor, sunEntity, currentTime);
}
