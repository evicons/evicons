# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Both packages, `@evicons/react` and `@evicons/svg`, share one version.

## [Unreleased]

## [0.4.0] - 2026-11-03

### Added

- 17 icons:
  - Connectors: `plug-ccs1` (CCS Combo 1, IEC 62196-3 configuration EE / SAE J1772 DC, vehicle inlet face), `plug-nacs` (NACS, SAE J3400, vehicle inlet face)
  - Station and site: `fuel-station-charging` (fuel or service station), `dealer-charging` (car dealership), `shop-charging` (while shopping), `streetlight-charging` (street light), `charging-hub` (several charging points in one place), `highway-charging` (motorway), `accessible-charging` (wheelchair-accessible bay)
  - Payment: `free-charging` (no cost to the driver), `idle-fee` (fee for occupying the point after charging), `qr-charging` (ad hoc charging by QR code), `plug-and-charge` (automatic authorisation, ISO 15118)
  - Vehicle: `truck-electric` (electric goods vehicle), `bus-electric` (electric bus or coach), `bike-electric` (e-bike, pedelec, electric cargo bike), `plug-in-hybrid` (PHEV)

### Changed

- **Map markers have a new pin.** The ten `marker-*` icons are now a circle with one square corner at the lower left (`M2.5 21.5V12a9.5 9.5 0 1 1 9.5 9.5Z`, head centre (12, 12), radius 9.5) instead of a drop with its tip at the bottom centre. The corner marks the point on the map, so anchor it at `(size × 2.5 / 24, size × 21.5 / 24)` instead of the bottom centre (README, "Map markers"). The signs are unchanged and moved down by 2 with the head centre; the element order contract (first `<path>` is the pin) still holds.
- The idle-fee tags ("idle fee", "blocking fee", "Blockiergebühr", "frais d'occupation" and similar) moved from `charging-time` to the new `idle-fee`; the meaning of `charging-time` is narrowed to the duration of charging and time-based tariffs.
- Documentation: new sections "Small sizes" and "Right-to-left layouts".

## [0.3.0] - 2026-11-02

### Added

- 11 icons:
  - Connector: `plug-type-1` (Type 1, SAE J1772 / IEC 62196-2 Type 1, vehicle inlet face)
  - Station and site: `charging-operator` (charge point operator), `destination-charging`, `report-fault` (report a fault at a charging point)
  - Power and energy: `charging-time` (duration, time-based tariff or blocking fee), `charging-power-level` (power on a scale), `charging-session` (session in progress)
  - Vehicle: `route-to-charger` (navigation to a charging point)
  - Payment: `calibrated-meter` (meter compliant with calibration law, Eichrecht)
  - Map markers: `marker-reserved` (letter R), `marker-queue` (hourglass)

### Changed

- `plug-type-2` now also stands for the GB/T 20234.2 AC inlet, which has the same face: GB/T tags and a meaning note added.

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

[Unreleased]: https://github.com/evicons/evicons/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/evicons/evicons/releases/tag/v0.4.0
[0.3.0]: https://github.com/evicons/evicons/releases/tag/v0.3.0
[0.2.1]: https://github.com/evicons/evicons/releases/tag/v0.2.1
[0.2.0]: https://github.com/evicons/evicons/releases/tag/v0.2.0
[0.1.0]: https://github.com/evicons/evicons/tree/fe97713
