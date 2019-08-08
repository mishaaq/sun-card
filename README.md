# Sun Card

Home Assistant Lovelace card to present `sun.sun` entity. Requires `sensor.time_utc` sensor from `date_time` component as well to work properly.
It provides visual information about current sun elevation throughout the day, time of sunrise/sunset. Available data depends on used Sun component: pre-existing one from Home Assistant (Basic), extended available [here](https://github.com/pnbruckner/homeassistant-config/blob/master/docs/sun.md) (Extended) or leverage Sun2 extension available [here](https://github.com/pnbruckner/ha-sun2).

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
> * for `Extended sun` component: `elevation`, `max_elevation`, `daylight`, `sunrise`, `sunset`
> * for `Sun2` component: `sunrise`, `sunset`, `solar_noon`, `max_elevation`, `daylight`

## Options

| Name | Type   | Requirement  | Description       |
| ---- | ------ | ------------ | ----------------- |
| type | string | **Required** | `custom:sun-card` |
| name | string | **Optional** | Card name         |

## Themes

You can simply change default style of the card specifying CSS variables in your theme:

| Variable              | CSS Attribute | Purpose                                          |
| --------------------- | ------------- | ------------------------------------------------ |
| --sc-background       | background    | background of the viewport                       |
| --sc-sun-color        | fill          | Sun fulfillment color                            |
| --sc-sunbeam-color    | stroke        | Sunbeam stroke color                             |
| --sc-event-line-color | stroke        | Sunrise, noon and sunset timestamp markers color |
| --sc-sun-night-color  | stroke        | Sun stroke color when being below horizon        |
| --sc-horizon-color    | stroke        | Horizon line color                               |

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

1. Download the [sun-card](https://github.com/mishaaq/sun-card/releases/download/v2.1/sun-card.js)
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
- type: "custom:sun-card"
  name: Sun
```

<img src="https://raw.githubusercontent.com/mishaaq/sun-card/master/images/showcase.png" width="450px"/>

[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg?style=for-the-badge
[forum]: https://community.home-assistant.io/c/projects/frontend
[license-shield]: https://img.shields.io/github/license/mishaaq/sun-card.svg?style=for-the-badge
[releases-shield]: https://img.shields.io/github/release/mishaaq/sun-card.svg?style=for-the-badge
[releases]: https://github.com/mishaaq/sun-card/releases
