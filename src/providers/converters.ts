import moment from 'moment';
import 'moment/min/locales';

export const utcToLocal: (val: any) => moment.Moment = (time) => {
  return moment.utc(time).local();
};

export const inferred: (val: any) => moment.Moment = (time) => {
  const result = moment(time);
  if (result.isValid()) return result;
  // otherwise must lack a date
  return moment(`${moment().format('YYYY-MM-DD')}T${time}`);
};
