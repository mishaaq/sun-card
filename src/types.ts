import moment from 'moment';
import { HassEntities, HassEntity } from 'home-assistant-js-websocket';

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

interface SunEntityConstructor {
  new(haEntity: HassEntity, currentTimeEntity: TimeEntity, entities: HassEntities): SunEntity;
}

class HASunEntity implements SunEntity {
  static accepts(entities: HassEntities): boolean {
    return Object.hasOwnProperty.call(entities, 'sun.sun');
  }

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

  get solar_noon(): moment.Moment {
    return moment.invalid();
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
  static accepts(entities: HassEntities): boolean {
    return HASunEntity.accepts(entities) &&
      ['elevation', 'max_elevation', 'sunrise', 'sunset', 'daylight'].every((attribute: string): boolean => {
        return Object.hasOwnProperty.call(entities['sun.sun'].attributes, attribute);
      });
  }

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

class Sun2CombinedEntity extends HASunEntity implements SunEntity {
  static accepts(entities: HassEntities): boolean {
    return HASunEntity.accepts(entities) &&
      ['sensor.max_elevation',
       'sensor.sunrise',
       'sensor.sunset',
       'sensor.daylight',
       'sensor.solar_noon'].every((entityName: string): boolean => {
        return Object.hasOwnProperty.call(entities, entityName);
      });
  }

  protected _max_elevation: HassEntity;

  protected _sunrise: HassEntity;

  protected _sunset: HassEntity;

  protected _daylight: HassEntity;

  protected _solar_noon: HassEntity;

  get max_elevation(): number {
    return parseFloat(this._max_elevation.state);
  }

  get daylight(): moment.Duration {
    return moment.duration(this._daylight.attributes.today_hms);
  }

  get sunrise(): moment.Moment {
    return moment.parseZone(this._sunrise.state);
  }

  get sunset(): moment.Moment {
    return moment.parseZone(this._sunset.state);
  }

  get solar_noon(): moment.Moment {
    return moment.parseZone(this._solar_noon.state);
  }

  constructor(haEntity: HassEntity, currentTimeEntity: TimeEntity, additionalEntities: HassEntities) {
    super(haEntity, currentTimeEntity);
    this._max_elevation = additionalEntities['sensor.max_elevation'];
    this._sunrise = additionalEntities['sensor.sunrise'];
    this._sunset = additionalEntities['sensor.sunset'];
    this._daylight = additionalEntities['sensor.daylight'];
    this._solar_noon = additionalEntities['sensor.solar_noon'];
  }
}

function createSunEntityCtor(ctor: SunEntityConstructor,
                             entities: HassEntities,
                             currentTimeEntity: TimeEntity): SunEntity {
  const sunEntity: HassEntity = entities['sun.sun'];
  return new ctor(sunEntity, currentTimeEntity, entities);
}

export function createSunEntity(entities: HassEntities, currentTime: TimeEntity) : SunEntity {
  const chain = [Sun2CombinedEntity, EnhancedSunEntity, HASunEntity];
  const ctor = chain.find((cls): boolean => {
    return cls.accepts(entities);
  });
  if (!ctor) {
    throw new Error('Couldn\'t find corresponding class');
  }
  return createSunEntityCtor(ctor, entities, currentTime);
}
