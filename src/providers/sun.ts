import { HassEntity } from 'home-assistant-js-websocket';
import moment from 'moment';
import 'moment/min/locales';

import { IReader, EntityReader, convert } from '../types';

class InvalidMomentReader implements IReader<moment.Moment> {
  read(): moment.Moment {
    return moment.invalid();
  }
}

function prepareReader<U>(converter: (v: any) => U, attr?: string) {
  class Reader extends EntityReader implements IReader<U> {
    @convert<U>(converter)
    read(): U {
      return attr ? this.attr(attr) : this.state();
    }
  }
  return Reader;
}

export const prepareElevationReader = (entity: HassEntity): IReader<number> => {
  const ReaderClass = prepareReader(parseFloat, entity.entity_id === 'sun.sun' ? 'elevation' : undefined);
  return new ReaderClass(entity);
};

export const prepareMaxElevationReader = (entity?: HassEntity): IReader<number> => {
  if (!entity || entity.entity_id === 'sun.sun' &&
    !Object.prototype.hasOwnProperty.call(entity.attributes, 'max_elevation')) {
    // standard Sun entity reader
    return new class implements IReader<number> {
      read(): number {
        return 90;
      }
    }();
  }
  const ReaderClass = prepareReader(parseFloat, entity.entity_id === 'sun.sun' ? 'max_elevation' : undefined);
  return new ReaderClass(entity);
};

export const prepareSunriseReader = (entity?: HassEntity): IReader<moment.Moment> => {
  if (!entity) {
    return new InvalidMomentReader();
  }

  let converter: (val: any) => moment.Moment = (time: any) => {
    return moment.utc(time).local();
  };
  let attribute: string | undefined;
  if (entity.entity_id === 'sun.sun') {
    attribute = 'sunrise';
    if (!Object.prototype.hasOwnProperty.call(entity.attributes, 'sunrise')) {
      attribute = 'next_rising';
    }
  } else
    converter = moment.parseZone;
  const ReaderClass = prepareReader(converter, attribute);
  return new ReaderClass(entity);
};

export const prepareSunsetReader = (entity?: HassEntity): IReader<moment.Moment> => {
  if (!entity) {
    return new InvalidMomentReader();
  }

  let converter: (val: any) => moment.Moment = (time: any) => {
    return moment.utc(time).local();
  };
  let attribute: string | undefined;
  if (entity.entity_id === 'sun.sun') {
    attribute = 'sunset';
    if (!Object.prototype.hasOwnProperty.call(entity.attributes, 'sunset')) {
      attribute = 'next_setting';
    }
  } else
    converter = moment.parseZone;
  const ReaderClass = prepareReader(converter, attribute);
  return new ReaderClass(entity);
};

export const prepareNoonReader = (entity?: HassEntity): IReader<moment.Moment> => {
  if (!entity) {
    return new InvalidMomentReader();
  }

  return new (prepareReader(moment.parseZone))(entity);
};
