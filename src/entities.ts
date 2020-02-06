import moment from 'moment';
import 'moment/min/locales';

import { HassEntities, HassEntity } from 'home-assistant-js-websocket';

import {
  ITime,
  IMoon,
  ISun,
  IReader,
  SunCardConfig,
} from './types';

import { prepareCurrentTimeReader } from './providers/time';
import {
  prepareElevationReader,
  prepareMaxElevationReader,
  prepareNoonReader,
  prepareSunriseReader,
  prepareSunsetReader,
} from './providers/sun';
import { prepareMoonPhaseReader, prepareMoonIconReader } from './providers/moon';

/* TODO: add validations */
class DataProvider implements ISun, IMoon, ITime {
  private _currentTime: IReader<moment.Moment>;
  private _elevation: IReader<number>;
  private _max_elevation: IReader<number>;
  private _solar_noon: IReader<moment.Moment>;
  private _sunrise: IReader<moment.Moment>;
  private _sunset: IReader<moment.Moment>;
  private _moonPhase: IReader<string>;
  private _moonIcon: IReader<string>;

  get current_time(): moment.Moment {
    return this._currentTime.read();
  }

  get elevation(): number {
    return this._elevation.read();
  }

  get max_elevation(): number {
    return this._max_elevation.read();
  }

  get solar_noon(): moment.Moment {
    return this._solar_noon.read();
  }

  get sunrise(): moment.Moment {
    return this._sunrise.read();
  }

  get sunset(): moment.Moment {
    return this._sunset.read();
  }

  get daylight(): moment.Duration {
    return moment.duration(this.sunset.diff(this.sunrise));
  }

  get to_sunset(): moment.Duration {
    return moment.duration(this.sunset.diff(this.current_time));
  }

  get moon_phase(): string {
    return this._moonPhase.read();
  }

  get moon_icon(): string {
    return this._moonIcon.read();
  }

  constructor(
    currentTime: IReader<moment.Moment>,
    elevation: IReader<number>,
    maxElevation: IReader<number>,
    solarNoon: IReader<moment.Moment>,
    sunrise: IReader<moment.Moment>,
    sunset: IReader<moment.Moment>,
    moonPhase: IReader<string>,
    moonIcon: IReader<string>,
  ) {
    this._currentTime = currentTime;
    this._elevation = elevation;
    this._max_elevation = maxElevation;
    this._solar_noon = solarNoon;
    this._sunrise = sunrise;
    this._sunset = sunset;
    this._moonPhase = moonPhase;
    this._moonIcon = moonIcon;
  }
}

export class Factory {
  static create(entities: HassEntities, config: SunCardConfig): DataProvider {
    return new DataProvider(
      prepareCurrentTimeReader(entities[config.entities.time]),
      prepareElevationReader(entities[config.entities.elevation]),
      prepareMaxElevationReader(
        this.getEntity(entities, config.entities.max_elevation),
      ),
      prepareNoonReader(
        this.getEntity(entities, config.entities.noon),
      ),
      prepareSunriseReader(
        this.getEntity(entities, config.entities.sunrise),
      ),
      prepareSunsetReader(
        this.getEntity(entities, config.entities.sunset),
      ),
      prepareMoonPhaseReader(
        this.getEntity(entities, config.entities.moon),
      ),
      prepareMoonIconReader(
        this.getEntity(entities, config.entities.moon),
      ),
    );
  }

  private static getEntity(entities: HassEntities, entityName: string | undefined): HassEntity | undefined {
    return entityName ? entities[entityName] : undefined;
  }
}
