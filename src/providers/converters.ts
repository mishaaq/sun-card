import { HassEntity } from 'home-assistant-js-websocket';
import moment from 'moment';
import 'moment/min/locales';

export type Converter = (v: any) => moment.Moment;

export const utcToLocal: Converter = (time) => {
  return moment.utc(time).local();
};

export const inferred: (entity: HassEntity) => Converter = (entity) => {
  const result = moment(entity.state);
  if (result.isValid()) return (input: string | number) => moment(input);
  // otherwise it's time only
  return (input: string | number) => moment(input, 'h:m a');
};
