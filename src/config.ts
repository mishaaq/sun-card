import { SunCardConfig } from './types';

export default {
  type: 'custom:sun-card',
  name: undefined,
  meridiem: undefined,
  entities: {
    time: 'sensor.time_utc',
    elevation: 'sun.sun',
    max_elevation: 'sun.sun',
    sunrise: 'sun.sun',
    sunset: 'sun.sun',
    noon: 'sensor.solar_noon',
    moon_phase: 'sensor.moon',
  },
} as SunCardConfig;
