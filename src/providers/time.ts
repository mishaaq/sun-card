import moment from 'moment';
import 'moment/min/locales';

import { HassEntity } from 'home-assistant-js-websocket';

import { EntityReader, IReader } from '../types';

class TimeUTCReader extends EntityReader implements IReader<moment.Moment> {
  // get local time from HA time_utc entity
  read(): moment.Moment {
    return moment.utc(this.state(), 'h:mm A').local();
  }

  static accepts(entity: HassEntity): boolean {
    return entity && moment.utc(entity.state, 'h:mm A').isValid();
  }
}

class BrowserTimeReader implements IReader<moment.Moment> {
  read(): moment.Moment {
    return moment();
  }
}

export const prepareCurrentTimeReader = (entity: HassEntity): IReader<moment.Moment> => {
  return TimeUTCReader.accepts(entity)
    ? new TimeUTCReader(entity)
    : new BrowserTimeReader();
};
