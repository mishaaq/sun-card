import { SunCardConfig } from './types';

export default {
  type: 'custom:sun-card',
  name: undefined,
  meridiem: undefined,
  entities: {
    time: 'sensor.time_utc',
    elevation: 'sun.sun',
    max_elevation: 'sensor.max_elevation',
    sunrise: 'sensor.sunrise',
    sunset: 'sensor.sunset',
    noon: 'sensor.solar_noon',
    moon: 'sensor.moon',
  },
} as SunCardConfig;
