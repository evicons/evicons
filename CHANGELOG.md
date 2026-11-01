# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). Both packages, `@evicons/react` and `@evicons/svg`, share one version.

## [Unreleased]

## [0.1.0] - 2026-11-01

First release.

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

[Unreleased]: https://github.com/evicons/evicons/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/evicons/evicons/releases/tag/v0.1.0
