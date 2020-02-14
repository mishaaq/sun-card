# Sun Card

Home Assistant Lovelace card to present current sun elevation. Requires sensors providing UTC time and sun elevation at least to work properly.
It provides visual information about current sun elevation throughout the day, time of sunrise/sunset/noon, daylight duration and time to sunset. Available data depends on used Sun component: pre-existing one from Home Assistant (Basic), extended available [here](https://github.com/pnbruckner/homeassistant-config/blob/master/docs/sun.md) (Extended) or leverage Sun2 extension available [here](https://github.com/pnbruckner/ha-sun2). Additionally it can depict current moon phase using `sensor.moon` from `moon` platform.

[![GitHub Release][releases-shield]][releases]
[![License MIT][license-shield]](LICENSE.md)
[![Community Forum][forum-shield]](https://community.home-assistant.io/t/lovelace-sun-card/109489)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://github.com/custom-components/hacs)

## Capabilities

| Used Sun component | Current sun elevation | Sunrise     | Sunset      | Noon       | Daylight duration | Time to sunset |
| ------------------ | --------------------- | ----------- | ----------- | ---------- | ----------------- | -------------- |
| Basic              | :sunny:               | Only future | Only future | :new_moon: | :new_moon:        | :sunny:        |
| Extended           | :sunny:               | :sunny:     | :sunny:     | :new_moon: | :sunny:           | :sunny:        |
| Sun2               | :sunny:               | :sunny:     | :sunny:     | :sunny:    | :sunny:           | :sunny:        |

> You have to have mentioned `monitored_conditions` enabled in component:
> * for `Extended sun` component: `elevation`, `max_elevation`, `sunrise`, `sunset`
> * for `Sun2` component: `sunrise`, `sunset`, `solar_noon`, `max_elevation`

The card depicts current moon phase if you have defined `moon_phase` entry in card configuration.

> From version 4.x, the card accepts entities from "sensor" domain for given capabilities. See "Options" for detailed instructions.

## Options

Card options:

| Name     | Type    | Requirement  | Default value     | Description                                              |
| -------- | ------- | ------------ | ----------------- | -------------------------------------------------------- |
| type     | string  | **Required** | `custom:sun-card` | Type of card, non-modifiable                             |
| name     | string  | **Optional** | Language specific | Card name visible in header, no header when empty value  |
| meridiem | boolean | **Optional** | Language specific | Clock format: 12h or 24h                                 |
| entities | Object  | **Optional** | -                 | Allows defining entities providing required data         |

Entities options:

| Name          | Default entity  | Entity state type      | Description of entity state value                     |
| ------------- | --------------- | ---------------------- | ----------------------------------------------------- |
| time          | sensor.utc_time | string in format hh:mm | current UTC time                                      |
| elevation     | sun.sun         | number                 | current sun elevation                                 |
| max_elevation | -               | number                 | maximum elevation today                               |
| sunrise       | -               | time with timezone     | today's sunrise time                                  |
| sunset        | -               | time with timezone     | today's sunset time                                   |
| noon          | -               | time with timezone     | today's noon time                                     |
| moon          | -               | string                 | moon phase (refer to moon sensor for possible values) |

## Example

<img src="https://raw.githubusercontent.com/mishaaq/sun-card/master/images/showcase.png" width="450px"/>

## Additional info

Check out the README file in repository for templating possibilities.
