import moment from 'moment';
import 'moment/min/locales';

import { HassEntity } from 'home-assistant-js-websocket';

import { EntityWrapper, IReader, ValueProvider } from '../types';

class TimeUTCReader extends EntityWrapper implements IReader<moment.Moment> {
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
    return moment(new Date());
  }
}

export const createCurrentTime = (entity: HassEntity): ValueProvider<moment.Moment> => {
  if (!TimeUTCReader.accepts(entity)) {
    return [new BrowserTimeReader(), () => {}];
  }
  const entityReader = new TimeUTCReader(entity);
  return [entityReader, entityReader.mutator()];
};
