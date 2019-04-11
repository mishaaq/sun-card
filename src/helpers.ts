import { TimeEntity } from './types';

let _timeZoneDiffInMillis = 0;

export namespace Helpers {

  export function updateTZ(currentTime: TimeEntity, timeInUTC: TimeEntity) {
    _timeZoneDiffInMillis = timeInUTC.time.getTime() - currentTime.time.getTime();
  }

}

declare global {
  interface Date {
    toLocal: () => Date;
  }
}


Date.prototype.toLocal = function toLocal(this: Date) {
  return new Date(this.getTime() + _timeZoneDiffInMillis);
};
