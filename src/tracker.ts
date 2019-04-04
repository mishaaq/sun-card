
export interface SunTracker {
  sunrise(): Date; // today's sunrise in local time
  sunset(): Date; // today's sunset in local time

  elevation(): number; // current sun's elevation angle
  maxElevation(): number; // maximum angle of sun's elevation for today

  timeToSunset(): Date; // the amount of time to today's sunset
  daylight(): Date; // The amount of time from today's sunrise to today's sunset.

  update(...args: any) : void;
}

class BasicTracker implements SunTracker {
  protected _timeDiff: number;

  protected _sunrise: Date = new Date(0);
  sunrise(): Date {
    return this._sunrise;
  }

  protected _sunset: Date = new Date(0);
  sunset(): Date {
    return this._sunset;
  }

  protected _elevation: number = 0;
  elevation(): number {
    return this._elevation;
  }

  protected _maxElevation: number = 90; // max elevation of sun in any place on any time is 90 degrees
  maxElevation(): number {
    return this._maxElevation;
  }

  protected _timeToSunset: Date = new Date(0);
  timeToSunset(): Date {
    return this._timeToSunset;
  }

  protected _daylight: Date = new Date(0);
  daylight(): Date {
    return this._daylight;
  }

  update(sunEntity: any, currentTime?: Date) {
    this._elevation = sunEntity.attributes.elevation;
    if (currentTime) {
      const nextSunsetUTC: Date = new Date(sunEntity.attributes.next_setting);
      this._timeToSunset = new Date(this.convertToLocalTime(nextSunsetUTC).getTime() - currentTime.getTime());
    }
  }

  protected convertToLocalTime(timeUTC: Date) : Date {
    return new Date(timeUTC.getTime() + this._timeDiff);
  }

  constructor(timeDiff: number) {
    this._timeDiff = timeDiff;
  }
}

export class SunTrackerFactory {
  protected static _instance: SunTracker;

  public static get(currentTime : Date, timeInUTC: Date) : SunTracker {
    if (!this._instance) {
      this._instance = new BasicTracker(timeInUTC.getTime() - currentTime.getTime())
    }
    return this._instance;
  }
}
