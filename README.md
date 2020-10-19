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
>
> - for `Extended sun` component: `elevation`, `max_elevation`, `sunrise`, `sunset`
> - for `Sun2` component: `sunrise`, `sunset`, `solar_noon`, `max_elevation`

The card depicts current moon phase if you have defined `moon_phase` entry in card configuration.

> From version 4.x, the card accepts entities from "sensor" domain for given capabilities. See "Options" for detailed instructions.

## Options

Card options:

| Name      | Type    | Requirement  | Default value     | Description                                             |
| --------- | ------- | ------------ | ----------------- | ------------------------------------------------------- |
| type      | string  | **Required** | `custom:sun-card` | Type of card, non-modifiable                            |
| name      | string  | **Optional** | Language specific | Card name visible in header, no header when empty value |
| meridiem  | boolean | **Optional** | Language specific | Clock format: 12h or 24h                                |
| animation | boolean | **Optional** | true              | Turn on/off sunbeam animation                           |
| entities  | Object  | **Optional** | -                 | Allows defining entities providing required data        |

Entities options:

| Name          | Default entity  | Entity state type      | Description of entity state value                     |
| ------------- | --------------- | ---------------------- | ----------------------------------------------------- |
| time          | sensor.utc_time | string in format hh:mm | current UTC time                                      |
| elevation     | sun.sun         | number                 | current sun elevation                                 |
| max_elevation | -               | number                 | maximum elevation today                               |
| sunrise       | -               | time with timezone     | today's sunrise time                                  |
| sunset        | -               | time with timezone     | today's sunset time                                   |
| noon          | -               | time with timezone     | today's noon time                                     |
| moon_phase    | -               | string                 | moon phase (refer to moon sensor for possible values) |

## Themes

You can simply change default style of the card specifying CSS variables in your theme:

| Variable                 | CSS Attribute | Purpose                                                                                                          |
| ------------------------ | ------------- | ---------------------------------------------------------------------------------------------------------------- |
| --sc-background          | background    | Background of the viewport                                                                                       |
| --sc-background-auxilary | background    | Additional background of the viewport; with regular background let you define backgrounds for day and night      |
| --sc-background-filter   | filter        | Allows adjustment of the backgrounds                                                                             |
| --sc-sun-color           | stroke        | Sun fulfillment color                                                                                            |
| --sc-sunbeam-color       | stroke        | Sunbeam stroke color                                                                                             |
| --sc-sun-night-color     | stroke        | Sun stroke color when being below horizon                                                                        |
| --sc-sun-size            | stroke-width  | Sun size in pixels, default to 60px                                                                              |
| --sc-event-line-color    | stroke        | Sunrise, noon and sunset timestamp markers color                                                                 |
| --sc-horizon-color       | stroke        | Horizon line color                                                                                               |
| --sc-moon-color          | fill          | Moon fill color                                                                                                  |
| --sc-elevation           | none          | CSS variable of number in range -1..1 that equals how high the Sun is currently related to it's maximum position |

> Tip: define different backgrounds for day and night period:
>
> You may define `--sc-background` for day period and `--sc-background-auxilary` for night period. To display them exclusively you may leverage `alpha` compound and calculate its value using current `--sc-elevation` value, ie. in theme file:
>
> `--sc-background: rgba(255, 0, 0, calc(10000 * var(--sc-elevation)))` (alpha compound capped to 1 for elevation > 0)
>
> `--sc-background-auxilary: rgba(0, 0, 255, calc(-10000 * var(--sc-elevation)))` (alpha compound capped to 1 for elevation < 0)

## Installation

### HACS (recommended)

1. Make sure the [HACS](https://github.com/custom-components/hacs) component is installed and working.
2. Add this github repository https://github.com/mishaaq/sun-card as custom plugin repository in HACS settings.
3. Install the plugin `Sun card` and update lovelace configuration accordingly.

### Installation and tracking with `custom_updater` (deprecated)

1. Make sure the [custom_updater](https://github.com/custom-components/custom_updater) component is installed and working.
2. Configure Lovelace to load the card.

```yaml
resources:
  - url: /customcards/github/mishaaq/sun-card.js?track=true
    type: module
```

3. Run the service `custom_updater.check_all` or click the "CHECK" button if you use the [`tracker-card`](https://github.com/custom-cards/tracker-card).
4. Refresh the website.

### Manual Installation (not recommended)

1. Download the [sun-card](https://github.com/mishaaq/sun-card/releases/download/v5.0/sun-card.js)
2. Place the file in your `config/www` folder
3. Include the card code in your `ui-lovelace-card.yaml`

```yaml
title: Home
resources:
  - url: /local/sun-card.js
    type: module
```

4. Write configuration for the card in your `ui-lovelace.yaml`

### Examples

```yaml
type: 'custom:sun-card'
name: Sun
meridiem: false
entities:
  max_elevation: sun.sun
  sunrise: sensor.sunrise
  sunset: sensor.sunset
  noon: sensor.solar_noon
  moon_phase: sensor.moon
```

<img src="https://raw.githubusercontent.com/mishaaq/sun-card/master/images/showcase.png" width="450px"/>

[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=for-the-badge
[forum]: https://community.home-assistant.io/t/lovelace-sun-card/109489
[license-shield]: https://img.shields.io/github/license/mishaaq/sun-card.svg?style=for-the-badge
[releases-shield]: https://img.shields.io/github/release/mishaaq/sun-card.svg?style=for-the-badge
[releases]: https://github.com/mishaaq/sun-card/releases
