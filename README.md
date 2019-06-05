# Sun Card

Home Assistant Lovelace card to present `sun.sun` entity. Requires `sensor.time_utc` sensor from `date_time` component as well to work properly.
It provides visual information about current sun elevation throughout the day, time of sunrise/sunset. Available data depends on used Sun component: pre-existing one from Home Assistant (Basic) or extended available [here](https://github.com/pnbruckner/homeassistant-config/blob/master/docs/sun.md) (Extended).

[![GitHub Release][releases-shield]][releases]
[![License MIT][license-shield]](LICENSE.md)
[![Community Forum][forum-shield]](https://community.home-assistant.io/t/lovelace-sun-card/109489)

## Capabilities

Used Sun component | Current sun elevation | Sunrise     | Sunset      | Daylight duration | Time to sunset |
------------------ | --------------------- | ----------- | ----------- | ----------------- | -------------- |
Basic              | :sunny:               | Only future | Only future | :new_moon:        | :sunny:        |
Extended           | :sunny:               | :sunny:     | :sunny:     | :sunny:           | :sunny:        |

> You have to have mentioned `monitored condition` enabled in `Extended Sun` component:
> `elevation`, `max elevation`, `daylight`, `sunrise`, `sunset`

## Options

| Name | Type   | Requirement  | Description
| ---- | ------ | ------------ | -----------
| type | string | **Required** | `custom:sun-card`
| name | string | **Optional** | Card name

## Installation

### Installation and tracking with `custom_updater`

1. Make sure the [custom_updater](https://github.com/custom-components/custom_updater) component is installed and working.
2. Configure Lovelace to load the card.

```yaml
resources:
  - url: /customcards/github/mishaaq/sun-card.js?track=true
    type: module
```

3. Run the service `custom_updater.check_all` or click the "CHECK" button if you use the [`tracker-card`](https://github.com/custom-cards/tracker-card).
4. Refresh the website.

### Manual Installation

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
