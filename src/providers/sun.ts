import { HassEntity } from 'home-assistant-js-websocket';
import moment from 'moment';
import 'moment/min/locales';

import {
  IReader, EntityWrapper, convert, ValueProvider,
} from '../types';

import { Converter, utcToLocal, inferred } from './converters';

class InvalidMomentReader implements IReader<moment.Moment> {
  read(): moment.Moment {
    return moment.invalid();
  }
}

function prepareReader<U>(converter: (v: any) => U, attr?: string) {
  class Reader extends EntityWrapper implements IReader<U> {
    @convert<U>(converter)
    read(): U {
      return attr ? this.attr(attr) : this.state();
    }
  }
  return Reader;
}

export const createElevation = (entity: HassEntity): ValueProvider<number> => {
  const ReaderClass = prepareReader(parseFloat, entity.entity_id === 'sun.sun' ? 'elevation' : undefined);
  const entityReader = new ReaderClass(entity);
  return [entityReader, entityReader.mutator()];
};

export const createMaxElevation = (entity?: HassEntity): ValueProvider<number> => {
  if (!entity || entity.entity_id === 'sun.sun' &&
    !Object.prototype.hasOwnProperty.call(entity.attributes, 'max_elevation')) {
    // standard Sun entity reader
    return [new class implements IReader<number> {
      read(): number {
        return 90;
      }
    }(), () => {}];
  }
  const ReaderClass = prepareReader(parseFloat, entity.entity_id === 'sun.sun' ? 'max_elevation' : undefined);
  const entityReader = new ReaderClass(entity);
  return [entityReader, entityReader.mutator()];
};

export const createSunrise = (entity?: HassEntity): ValueProvider<moment.Moment> => {
  if (!entity) {
    return [new InvalidMomentReader(), () => {}];
  }

  let converter: Converter = utcToLocal;
  let attribute: string | undefined;
  if (entity.entity_id === 'sun.sun') {
    attribute = 'sunrise';
    if (!Object.prototype.hasOwnProperty.call(entity.attributes, 'sunrise')) {
      attribute = 'next_rising';
    }
  } else
    converter = inferred(entity);
  const ReaderClass = prepareReader(converter, attribute);
  const entityReader = new ReaderClass(entity);
  return [entityReader, entityReader.mutator()];
};

export const createSunset = (entity?: HassEntity): ValueProvider<moment.Moment> => {
  if (!entity) {
    return [new InvalidMomentReader(), () => {}];
  }

  let converter = utcToLocal;
  let attribute: string | undefined;
  if (entity.entity_id === 'sun.sun') {
    attribute = 'sunset';
    if (!Object.prototype.hasOwnProperty.call(entity.attributes, 'sunset')) {
      attribute = 'next_setting';
    }
  } else
    converter = inferred(entity);
  const ReaderClass = prepareReader(converter, attribute);
  const entityReader = new ReaderClass(entity);
  return [entityReader, entityReader.mutator()];
};

export const createNoon = (entity?: HassEntity): ValueProvider<moment.Moment> => {
  if (!entity) {
    return [new InvalidMomentReader(), () => {}];
  }

  const ReaderClass = prepareReader(inferred(entity));
  const entityReader = new ReaderClass(entity);
  return [entityReader, entityReader.mutator()];
};
