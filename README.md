# Sun Card
Home Assistant Lovelace card to present `sun.sun` entity.

[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE.md)

![Project Maintenance][maintenance-shield]
[![GitHub Activity][commits-shield]][commits]

[![Discord][discord-shield]][discord]
[![Community Forum][forum-shield]][forum]

## Options

| Name | Type | Requirement | Description
| ---- | ---- | ------- | -----------
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

1. Download the [sun-card](https://raw.githubusercontent.com/mishaaq/sun-card/master/sun-card.js)
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
