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
  SunCardConfigEntities,
} from './types';

import { createCurrentTime } from './providers/time';
import {
  createElevation,
  createMaxElevation,
  createNoon,
  createSunrise,
  createSunset,
} from './providers/sun';
import { createMoonPhase } from './providers/moon';

/* TODO: add validations */
class DataProvider implements ISun, IMoon, ITime {
  private _currentTime: IReader<moment.Moment>;
  private _elevation: IReader<number>;
  private _max_elevation: IReader<number>;
  private _solar_noon: IReader<moment.Moment>;
  private _sunrise: IReader<moment.Moment>;
  private _sunset: IReader<moment.Moment>;
  private _moon_phase: IReader<string>;

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
    let sunrise = this._sunrise.read();
    if (this.current_time.date() !== sunrise.date()) {
      sunrise = moment.invalid();
    }
    return sunrise;
  }

  get sunset(): moment.Moment {
    let sunset = this._sunset.read();
    if (this.current_time.date() !== sunset.date()) {
      sunset = moment.invalid();
    }
    return sunset;
  }

  get daylight(): moment.Duration {
    return moment.duration(this.sunset.diff(this.sunrise));
  }

  get to_sunset(): moment.Duration {
    return moment.duration(this.sunset.diff(this.current_time));
  }

  get moon_phase(): string {
    return this._moon_phase.read();
  }

  constructor(
    currentTime: IReader<moment.Moment>,
    elevation: IReader<number>,
    maxElevation: IReader<number>,
    solarNoon: IReader<moment.Moment>,
    sunrise: IReader<moment.Moment>,
    sunset: IReader<moment.Moment>,
    moonPhase: IReader<string>,
  ) {
    this._currentTime = currentTime;
    this._elevation = elevation;
    this._max_elevation = maxElevation;
    this._solar_noon = solarNoon;
    this._sunrise = sunrise;
    this._sunset = sunset;
    this._moon_phase = moonPhase;
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
    this.validatePresence(config.entities, entities);

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
    ] = createMoonPhase(this.getEntity(entities, config.entities.moon_phase));

    directory.add(config.entities.time, currentTimeUpdater);
    directory.add(config.entities.elevation, elevationUpdater);
    directory.add(config.entities.max_elevation, maxElevationUpdater);
    directory.add(config.entities.noon, noonUpdater);
    directory.add(config.entities.sunrise, sunriseUpdater);
    directory.add(config.entities.sunset, sunsetUpdater);
    directory.add(config.entities.moon_phase, moonPhaseUpdater);

    const provider = new DataProvider(
      currentTime, elevation, maxElevation, noon, sunrise, sunset, moonPhase,
    );

    return [provider, directory.create()];
  }

  private static getEntity(entities: HassEntities, entityName: string | undefined): HassEntity | undefined {
    return entityName ? entities[entityName] : undefined;
  }

  private static validatePresence(config: SunCardConfigEntities, entities: HassEntities) {
    // eslint-disable-next-line array-callback-return
    Object.entries(config).find(([key, name]) => {
      if (!Object.hasOwnProperty.call(entities, name)) {
        throw new Error(`Entity ${name} set for config entry "${key}" not found. Check your configuration.`);
      }
    });
  }
}
