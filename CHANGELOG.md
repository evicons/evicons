# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Both packages, `@evicons/react` and `@evicons/svg`, share one version.

## [Unreleased]

## [0.2.1] - 2026-11-02

### Fixed

- The small solid bolt left a pinhole at its widest point, visible from about 48 px. A short stroke between the inner corners of its steps now closes it, in all 12 icons that use it: `app-charging`, `battery-charging`, `car-electric`, `charging-card`, `charging-log`, `charging-tariff`, `driving-range`, `green-power`, `home-charging`, `parking-charging`, `roaming`, `solar-charging`. The outline and the look at 16–24 px are unchanged.

## [0.2.0] - 2026-11-02

### Added

- 29 icons:
  - Connectors and station: `plug-chademo` (CHAdeMO, vehicle inlet face), `plug-schuko` (Schuko socket face), `charging-plug` (plug seen from the side), `charging-cable` (tethered cable), `wallbox`, `home-charging`, `parking-charging`
  - Energy: `solar-charging`, `green-power`, `battery-charging`, `bidirectional-charging`
  - Vehicle and power: `car-electric`, `driving-range` (named `driving-range`, not `range`, because a React export `Range` would shadow the DOM global), `power-kw`, `charging-bolt`
  - Payment: `charging-card`, `app-charging`, `card-terminal`, `roaming`, `charging-tariff`, `charging-log`
  - Map markers: `marker-charging` (named `marker-charging`, not `marker`, so that its React export does not clash with the `Marker` component of map libraries), `marker-ac`, `marker-dc`, `marker-available`, `marker-occupied`, `marker-faulted`, `marker-out-of-service`, `marker-unknown`
- Map markers can be drawn filled: the first `<path>` of every marker is the pin. See "Map markers" in the README for the CSS rule and a MapLibre example.

### Changed

- New categories `energy` and `marker` in the icon metadata (`icons.json`).
- The icon linter checks markers: the first element of a `marker` icon must be the standard pin path, the sign must lie inside the pin head, and an icon is named `marker` or `marker-…` if and only if its category is `marker`.
- New documented exception `solid-sign` for the small lightning bolt used inside other icons (design guide sections 2 and 4).
- The stroke alphabet gains the letters k, W and P, and a lone letter that is the main subject of an icon may use cap height 11 (design guide section 6).

## [0.1.0] - 2026-11-01

First version, not published to npm. The first published release is 0.2.0.

### Added

- `@evicons/react`: React components, one ESM module per icon, with TypeScript types. Props `size`, `strokeWidth`, `absoluteStrokeWidth` and `title`; all other SVG props are passed through. Decorative by default (`aria-hidden="true"`), labelled with `role="img"` when given a `title`, `aria-label` or `aria-labelledby`. Supports React 18 and 19.
- `@evicons/svg`: raw SVG files, an SVG sprite and `icons.json` with names, meanings, tags and aliases.
- 14 icons:
  - `charging-station`: charging station
  - `plug-type-2`: Type 2 connector (IEC 62196-2), vehicle inlet face
  - `plug-ccs2`: CCS Combo 2 connector (IEC 62196-3), vehicle inlet face
  - `current-ac`: alternating current (AC) charging
  - `current-dc`: direct current (DC) charging
  - `fast-charging`: fast charging
  - `car-plugged`: electric car connected to a charging cable
  - `status-available`: available (hand holding a plug)
  - `status-occupied`: occupied (clock)
  - `status-faulted`: faulted (exclamation mark)
  - `status-out-of-service`: out of service (crossed-out plug)
  - `status-reserved`: reserved (letter R)
  - `status-unknown`: unknown (question mark)
  - `status-queue`: queue (two cars, one behind the other)

[Unreleased]: https://github.com/evicons/evicons/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/evicons/evicons/releases/tag/v0.2.1
[0.2.0]: https://github.com/evicons/evicons/releases/tag/v0.2.0
[0.1.0]: https://github.com/evicons/evicons/tree/fe97713
