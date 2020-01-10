# Sun Card

Home Assistant Lovelace card to present `sun.sun` entity. Requires `sensor.time_utc` sensor from `date_time` component as well to work properly.
It provides visual information about current sun elevation throughout the day, time of sunrise/sunset. Available data depends on used Sun component: pre-existing one from Home Assistant (Basic), extended available [here](https://github.com/pnbruckner/homeassistant-config/blob/master/docs/sun.md) (Extended) or leverage Sun2 extension available [here](https://github.com/pnbruckner/ha-sun2). Additionally it can depict current moon phase.

## Capabilities

| Used Sun component | Current sun elevation | Sunrise     | Sunset      | Noon | Daylight duration | Time to sunset |
| ------------------ | --------------------- | ----------- | ----------- | ---- | ----------------- | -------------- |
| Basic              | yes                   | Only future | Only future | no   | no                | yes            |
| Extended           | yes                   | yes         | yes         | no   | yes               | yes            |
| Sun2               | yes                   | yes         | yes         | yes  | yes               | yes            |

> You have to have mentioned `monitored_conditions` enabled in component:
> * for `Extended sun` component: `elevation`, `max_elevation`, `daylight`, `sunrise`, `sunset`
> * for `Sun2` component: `sunrise`, `sunset`, `solar_noon`, `max_elevation`, `daylight`

The card depicts current moon phase if you have `sensor.moon` available in your _configuration.yaml_.

## Options

| Name     | Type    | Requirement  | Default value     | Description                                              |
| -------- | ------- | ------------ | ----------------- | -------------------------------------------------------- |
| type     | string  | **Required** | `custom:sun-card` | Type of card, non-modifiable                             |
| name     | string  | **Optional** | Language specific | Card name visible in header, no header when empty value  |
| meridiem | boolean | **Optional** | Language specific | Clock format: 12h or 24h                                 |

## Example

<img src="https://raw.githubusercontent.com/mishaaq/sun-card/master/images/showcase.png" width="450px"/>

## Additional info

Check out the README file in repository for templating possibilities.