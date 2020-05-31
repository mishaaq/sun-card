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
  SunCardConfigEntities
} from './types';
import createCurrentTime from './providers/time';
import {
  createElevation,
  createMaxElevation,
  createNoon,
  createSunrise,
  createSunset
} from './providers/sun';
import createMoonPhase from './providers/moon';

/* TODO: add validations */
class DataProvider implements ISun, IMoon, ITime {
  private _currentTime: IReader<moment.Moment>;

  private _elevation: IReader<number>;

  private _max_elevation: IReader<number>;

  private _solar_noon?: IReader<moment.Moment>;

  private _sunrise?: IReader<moment.Moment>;

  private _sunset?: IReader<moment.Moment>;

  private _moon_phase?: IReader<string>;

  get currentTime(): moment.Moment {
    return this._currentTime.read();
  }

  get elevation(): number {
    return this._elevation.read();
  }

  get maxElevation(): number {
    return this._max_elevation.read();
  }

  get solarNoon(): moment.Moment | undefined {
    return this._solar_noon?.read();
  }

  get sunrise(): moment.Moment | undefined {
    if (!this._sunrise) return undefined;

    let sunrise = this._sunrise.read();
    if (this.currentTime.date() !== sunrise.date()) {
      sunrise = moment.invalid();
    }
    return sunrise;
  }

  get sunset(): moment.Moment | undefined {
    if (!this._sunset) return undefined;

    let sunset = this._sunset.read();
    if (this.currentTime.date() !== sunset.date()) {
      sunset = moment.invalid();
    }
    return sunset;
  }

  get daylight(): moment.Duration | undefined {
    if (this.sunrise && this.sunset) return moment.duration(this.sunset.diff(this.sunrise));
    return undefined;
  }

  get toSunset(): moment.Duration | undefined {
    if (this.sunset) return moment.duration(this.sunset.diff(this.currentTime));
    return undefined;
  }

  get moonPhase(): string | undefined {
    return this._moon_phase?.read();
  }

  constructor(
    currentTime: IReader<moment.Moment>,
    elevation: IReader<number>,
    maxElevation: IReader<number>,
    solarNoon?: IReader<moment.Moment>,
    sunrise?: IReader<moment.Moment>,
    sunset?: IReader<moment.Moment>,
    moonPhase?: IReader<string>
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
  private _directory: { [entity: string]: EntityMutator[] } = {};

  add(name: string | undefined, mutator: EntityMutator): EntitiesDirectory {
    if (!name) return this;

    this._directory[name] = this._directory[name] || [];
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

export default class Factory {
  static create(entities: HassEntities, config: SunCardConfig): [DataProvider, EntityMutator] {
    this.validatePresence(config.entities, entities);

    const directory: EntitiesDirectory = new EntitiesDirectory();

    const [currentTime, currentTimeUpdater] = createCurrentTime(entities[config.entities.time]);
    directory.add(config.entities.time, currentTimeUpdater);

    const [elevation, elevationUpdater] = createElevation(entities[config.entities.elevation]);
    directory.add(config.entities.elevation, elevationUpdater);

    const [maxElevation, maxElevationUpdater] = createMaxElevation(
      config.entities.max_elevation ? entities[config.entities.max_elevation] : undefined
    );
    directory.add(config.entities.max_elevation, maxElevationUpdater);

    let noon: IReader<moment.Moment> | undefined;
    let noonUpdater: EntityMutator;
    if (config.entities.noon) {
      [noon, noonUpdater] = createNoon(entities[config.entities.noon]);
      directory.add(config.entities.noon, noonUpdater);
    }

    let sunrise: IReader<moment.Moment> | undefined;
    let sunriseUpdater: EntityMutator;
    if (config.entities.sunrise) {
      [sunrise, sunriseUpdater] = createSunrise(entities[config.entities.sunrise]);
      directory.add(config.entities.sunrise, sunriseUpdater);
    }

    let sunset: IReader<moment.Moment> | undefined;
    let sunsetUpdater: EntityMutator;
    if (config.entities.sunset) {
      [sunset, sunsetUpdater] = createSunset(entities[config.entities.sunset]);
      directory.add(config.entities.sunset, sunsetUpdater);
    }

    let moonPhase: IReader<string> | undefined;
    let moonPhaseUpdater: EntityMutator;
    if (config.entities.moon_phase) {
      [moonPhase, moonPhaseUpdater] = createMoonPhase(entities[config.entities.moon_phase]);
      directory.add(config.entities.moon_phase, moonPhaseUpdater);
    }

    const provider = new DataProvider(
      currentTime,
      elevation,
      maxElevation,
      noon,
      sunrise,
      sunset,
      moonPhase
    );

    return [provider, directory.create()];
  }

  private static getEntity(
    entities: HassEntities,
    entityName: string | undefined
  ): HassEntity | undefined {
    return entityName ? entities[entityName] : undefined;
  }

  private static validatePresence(config: SunCardConfigEntities, entities: HassEntities) {
    Object.entries(config).forEach(([entry, name]) => {
      if (!Object.hasOwnProperty.call(entities, name)) {
        throw new Error(
          `Entity ${name} set for config entry "${entry}" not found. Check your configuration.`
        );
      }
    });
  }
}
