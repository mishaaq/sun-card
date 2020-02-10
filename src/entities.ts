import moment from 'moment';
import 'moment/min/locales';

import { HassEntities, HassEntity } from 'home-assistant-js-websocket';

import {
  ITime,
  IMoon,
  ISun,
  IReader,
  SunCardConfig,
  EntityMutator,
} from './types';

import { createCurrentTime } from './providers/time';
import {
  createElevation,
  createMaxElevation,
  createNoon,
  createSunrise,
  createSunset,
} from './providers/sun';
import { createMoonPhase, createMoonIcon } from './providers/moon';

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

class EntitiesDirectory {
  private _directory: {[entity: string]: EntityMutator[]} = {};

  add(name: string|undefined, mutator: EntityMutator|undefined): EntitiesDirectory {
    if (!name || !mutator) return this;
    if (!this._directory[name]) {
      this._directory[name] = [];
    }
    this._directory[name].push(mutator);
    return this;
  }

  create(): EntityMutator {
    return (entity: HassEntity) => {
      const mutators: EntityMutator[] = this._directory[entity.entity_id];
      mutators.forEach(update => update(entity));
    };
  }
}

export class Factory {
  static create(entities: HassEntities, config: SunCardConfig): [DataProvider, EntityMutator] {
    const directory: EntitiesDirectory = new EntitiesDirectory();

    const [
      currentTime,
      currentTimeUpdater,
    ] = createCurrentTime(entities[config.entities.time]);

    const [
      elevation,
      elevationUpdater,
    ] = createElevation(entities[config.entities.elevation]);

    const [
      maxElevation,
      maxElevationUpdater,
    ] = createMaxElevation(
      this.getEntity(entities, config.entities.max_elevation),
    );

    const [
      noon,
      noonUpdater,
    ] = createNoon(this.getEntity(entities, config.entities.noon));

    const [
      sunrise,
      sunriseUpdater,
    ] = createSunrise(this.getEntity(entities, config.entities.sunrise));

    const [
      sunset,
      sunsetUpdater,
    ] = createSunset(this.getEntity(entities, config.entities.sunset));

    const [
      moonPhase,
      moonPhaseUpdater,
    ] = createMoonPhase(this.getEntity(entities, config.entities.moon));

    const [
      moonIcon,
      moonIconUpdater,
    ] = createMoonIcon(this.getEntity(entities, config.entities.moon));

    directory.add(config.entities.time, currentTimeUpdater);
    directory.add(config.entities.elevation, elevationUpdater);
    directory.add(config.entities.max_elevation, maxElevationUpdater);
    directory.add(config.entities.noon, noonUpdater);
    directory.add(config.entities.sunrise, sunriseUpdater);
    directory.add(config.entities.sunset, sunsetUpdater);
    directory.add(config.entities.moon, moonPhaseUpdater);
    directory.add(config.entities.moon, moonIconUpdater);

    const provider = new DataProvider(
      currentTime, elevation, maxElevation, noon, sunrise, sunset, moonPhase, moonIcon,
    );

    return [provider, directory.create()];
  }

  private static getEntity(entities: HassEntities, entityName: string | undefined): HassEntity | undefined {
    /* Add error handling for unavailable entities */
    return entityName ? entities[entityName] : undefined;
  }
}
