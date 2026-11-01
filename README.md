# EVicons

Open-source icons for e-mobility and EV charging: charging stations, connector faces, AC/DC, charge point status and vehicles. MIT licensed.

EVicons covers **only** e-mobility. General UI icons (arrows, menu, search, close, ...) are out of scope; keep using a general icon set such as Lucide for those. EVicons contains no brand or manufacturer logos.

- Outline style on a 24 × 24 grid, stroke width 1.5, round caps and joins.
- `currentColor` only: the SVGs contain no colours, colour comes from your CSS.
- Connector icons show the vehicle inlet seen from the front, with the contact layout checked against public drawings of the connector standards (see each icon's `standard.source`).
- Every icon has a documented meaning (see [Icons](#icons)).

| Package | Contents |
|---|---|
| [`@evicons/react`](packages/react) | React components, tree-shakable ESM with TypeScript types |
| [`@evicons/svg`](packages/svg) | Raw SVG files, an SVG sprite and `icons.json` (names, meanings, tags, aliases) |

## Installation

```sh
npm install @evicons/react
```

```sh
npm install @evicons/svg
```

## Usage (React)

```tsx
import { PlugType2 } from '@evicons/react'

export function Connector() {
  return (
    <span>
      <PlugType2 size={20} title="Type 2" /> Type 2 · 22 kW
    </span>
  )
}
```

Every icon is its own module and the package has `sideEffects: false`, so bundlers only include the icons you import. A single icon can also be imported directly, as a named or default export:

```tsx
import PlugType2 from '@evicons/react/icons/plug-type-2'
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `number \| string` | `24` | Width and height of the `<svg>`. Numbers are pixels; strings are passed as is (for example `"1em"`). |
| `strokeWidth` | `number \| string` | `1.5` | Stroke width in icon units (the icon is drawn on a 24 × 24 grid). |
| `absoluteStrokeWidth` | `boolean` | `false` | Keep the stroke at `strokeWidth` screen pixels at every size (see below). |
| `className` | `string` | | Added after the built-in classes `evicon` and `evicon-<name>` (for example `evicon-plug-type-2`). |
| `title` | `string` | | Accessible name, rendered as `<title>` (see [Accessibility](#accessibility)). |
| `ref` | | | Forwarded to the `<svg>` element. |
| ...all other SVG props | | | Passed through to the `<svg>` element (`style`, `onClick`, `data-*`, `aria-*`, `role`, ...). Children are rendered after the icon's shapes. |

The prop type is exported as `EvIconProps`, the component type as `EvIconComponent`.

### Colour

Icons draw with `currentColor`. Set the CSS `color` of the icon or of a parent:

```tsx
<StatusAvailable className="text-green-600" title="Available" />
```

### `absoluteStrokeWidth`

By default the stroke scales with the icon: at `size={12}` a stroke of 1.5 is drawn 0.75 px wide. With `absoluteStrokeWidth`, every shape gets `vector-effect="non-scaling-stroke"`, so the stroke is drawn `strokeWidth` screen pixels wide whatever the rendered size.

Because this is done by the browser and not computed from `size`, it also works when the size comes from CSS (`size="1em"`, `className="size-4"`, non-square sizes). Shapes you pass as children are not changed.

### Accessibility

Icons are decorative by default: the `<svg>` gets `aria-hidden="true"` and no role. Icons complement visible text; when an icon stands alone and carries meaning, give it an accessible name. As soon as it has one, `aria-hidden` is dropped and `role="img"` is set.

If several are given, this order applies:

1. **`aria-labelledby`** (yours): kept as is.
2. **`aria-label`**: used as the name. A `title` is still rendered as `<title>` but not referenced.
3. **`title`**: rendered as the first child `<title>` with an id from React's `useId` (unique and stable in server rendering) and referenced with `aria-labelledby`.
4. None of these: decorative (`aria-hidden="true"`).

An explicit `role` or `aria-hidden` that you pass always wins over the defaults.

```tsx
<StatusFaulted title="Faulted" />                    // role="img", named "Faulted"
<StatusFaulted aria-label="Charge point faulted" />  // role="img", named by aria-label
<StatusFaulted />                                    // aria-hidden="true"
```

### Icons complement text

Do not use an icon as the only carrier of information. At 16 px the contacts of a connector face render as similar dots, so faces that share a part are hard to tell apart: `plug-type-2` and `plug-ccs2` differ only in the DC part below the Type 2 contacts. Always show the connector name next to the icon, for example "Type 2 · 22 kW". The same applies to status icons: show the status as text or at least as an accessible name.

### Status overlay pattern

Status icons are standalone symbols; the shape carries the meaning, so they also work when your app colours all of them the same. To combine a status with another icon (charging station, map pin), place a small status icon absolutely in the bottom-right corner:

```tsx
import { ChargingStation, StatusAvailable } from '@evicons/react'

export function StationWithStatus() {
  return (
    <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <ChargingStation size={24} />
      <StatusAvailable
        size={12}
        absoluteStrokeWidth
        strokeWidth={1.5}
        title="Available"
        style={{ position: 'absolute', right: -4, bottom: -4, color: 'green' }}
      />
    </span>
  )
}
```

Use a badge size of half the base icon and give it a fixed screen stroke (`absoluteStrokeWidth` with `strokeWidth={1.5}`, or `strokeWidth={2}` without it), otherwise the scaled-down stroke looks faint. The badge covers part of the base icon; on a busy background, put it on a circle in your page's background colour. EVicons does not reserve a badge corner in the icons yet.

## Usage (SVG)

The files are in `svg/<name>.svg` of `@evicons/svg` and are exported as `@evicons/svg/<name>.svg`. To colour an icon with CSS, inline the SVG or use the sprite:

```html
<svg width="24" height="24"><use href="/path/to/sprite.svg#evicon-plug-type-2" /></svg>
```

Metadata for all icons:

```js
import icons from '@evicons/svg/icons.json' with { type: 'json' }
```

## Icons

| Name | React component | Meaning |
|---|---|---|
| `charging-station` | `ChargingStation` | Charging station: a public or private charge point for electric vehicles |
| `plug-type-2` | `PlugType2` | Type 2 connector (IEC 62196-2, "Mennekes"), shown as the vehicle inlet face |
| `plug-ccs2` | `PlugCcs2` | CCS Combo 2 connector (IEC 62196-3, Type 2 with two DC contacts), shown as the vehicle inlet face |
| `current-ac` | `CurrentAc` | Alternating current (AC) charging |
| `current-dc` | `CurrentDc` | Direct current (DC) charging |
| `fast-charging` | `FastCharging` | Fast charging: high charging power, typically DC fast or high-power charging |
| `car-plugged` | `CarPlugged` | Electric car connected to a charging cable |

Status icons share a round frame; the sign inside carries the meaning.

| Name | React component | Sign | Meaning |
|---|---|---|---|
| `status-available` | `StatusAvailable` | Hand holding a plug | Available: the charge point is free and ready to charge |
| `status-occupied` | `StatusOccupied` | Clock | Occupied: the charge point is in use by another vehicle |
| `status-faulted` | `StatusFaulted` | Exclamation mark | Faulted: the station reports an error and cannot charge |
| `status-out-of-service` | `StatusOutOfService` | Crossed-out plug | Out of service: taken out of service by the operator (for example maintenance or closure), not an error report |
| `status-reserved` | `StatusReserved` | Letter R | Reserved: the charge point is reserved for a booking |
| `status-unknown` | `StatusUnknown` | Question mark | Unknown: no current status is available for the charge point |
| `status-queue` | `StatusQueue` | Two cars, one behind the other | Queue: cars are queuing at this station; you would have to wait |

"Faulted" (the station reports an error) and "out of service" (taken out of service by the operator) are different states; use the one your data actually reports.

## Compatibility

| | Supported |
|---|---|
| React | 18 and 19 (peer dependency `^18.0.0 \|\| ^19.0.0`) |
| Server rendering | Node.js 20 or later (tested on 20 and 24); works in React Server Components, no `'use client'` needed |
| Module format | ESM only, no CommonJS build; `require()` works on Node.js versions with `require(esm)` (20.19+, 22.12+) |
| TypeScript | Types included |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [design guide](docs/design-guide.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
