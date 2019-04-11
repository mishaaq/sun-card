
export interface SunCardConfig {
  type: string;
  name?: string;
}

// Simple class to represent duration in hours, minutes and seconds
export class Duration {
  hours: number;

  minutes: number;

  seconds?: number;

  constructor(hours: number, minutes: number, seconds?: number) {
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
  }
}

// Wrapper for HA time entity (from 'time_date' platform)
export class TimeEntity {
  private _entity: any;

  // get Date object from HA time entity
  get time(): Date {
    const stateDate = new Date();
    stateDate.setHours(this._entity.state.split(':')[0]);
    stateDate.setMinutes(this._entity.state.split(':')[1]);
    return stateDate;
  }

  get hour(): number {
    return this._entity.state.split(':')[0];
  }

  get minute(): number {
    return this._entity.state.split(':')[1];
  }

  get duration(): Duration {
    return new Duration(this.hour, this.minute);
  }

  constructor(haEntity: any) {
    this._entity = haEntity;
  }
}

export interface SunEntity {
  // get friendly name as defined on hass configuration
  friendly_name: string;

  // get current sun's elevation
  elevation: number;

  // get maximum elevation of sun this day
  max_elevation: number;

  // get time of sunrise in local time zone
  sunrise: Date;

  // get time of sunset in local time zone
  sunset: Date;

  // get duration of daylight (from sunrise to sunset)
  daylight: Duration;

  // get time to sunset
  to_sunset: Duration;
}

class HASunEntity implements SunEntity {
  static requiredAttributes: string[] = ['elevation'];

  protected _entity: any;

  protected _currentTime: TimeEntity;

  get friendly_name(): string {
    return this._entity.friendly_name;
  }

  get elevation(): number {
    return this._entity.attributes.elevation;
  }

  get max_elevation(): number {
    return 90;
  }

  get daylight(): Duration {
    return new Duration(0, 0, 0);
  }

  get sunrise(): Date {
    return new Date(0);
  }

  get sunset(): Date {
    return new Date(0);
  }

  get to_sunset(): Duration {
    return new Duration(0, 0, 0);
  }

  constructor(haEntity: any, currentTime: TimeEntity) {
    this._entity = haEntity;
    this._currentTime = currentTime;
  }
}

class EnhancedSunEntity extends HASunEntity implements SunEntity {
  static requiredAttributes: string[] = ['elevation', 'max_elevation', 'sunrise', 'sunset', 'daylight'];

  get max_elevation(): number {
    return this._entity.attributes.max_elevation;
  }

  get daylight(): Duration {
    let daylightInSeconds = this._entity.attributes.daylight;
    const hours = Math.floor(daylightInSeconds / 3600);
    daylightInSeconds %= 3600;
    const minutes = Math.floor(daylightInSeconds / 60);
    const seconds = daylightInSeconds % 60;
    return new Duration(hours, minutes, seconds);
  }

  get sunrise(): Date {
    return new Date(this._entity.attributes.sunrise).toLocal();
  }

  get sunset(): Date {
    return new Date(this._entity.attributes.sunset).toLocal();
  }

  get to_sunset(): Duration {
    const diff: Date = new Date(this.sunset.getTime() - this._currentTime.time.getTime());
    return new Duration(diff.getHours(), diff.getMinutes());
  }
}

interface SunEntityConstructor {
  new(sunEntity: any, ...props): SunEntity;
}

function createSunEntityCtor(ctor: SunEntityConstructor, sunEntity: any, ...props): SunEntity {
  return new ctor(sunEntity, props);
}

export function createSunEntity(sunEntity: any, currentTime: TimeEntity) : SunEntity {
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
