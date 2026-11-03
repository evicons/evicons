<p><a href="https://evicons.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo-on-dark.png"><img src="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo.svg" width="320" alt="EVicons"></picture></a></p>

# EVicons

Website: [evicons.dev](https://evicons.dev)

Open-source icons for e-mobility and EV charging: charging stations, connector faces, AC/DC and power, energy, vehicles, payment, charge point status and map markers. MIT licensed.

EVicons covers **only** e-mobility. General UI icons (arrows, menu, search, close, ...) are out of scope; keep using a general icon set such as Lucide for those. EVicons contains no brand or manufacturer logos.

- Outline style on a 24 × 24 grid, stroke width 1.5, round caps and joins.
- `currentColor` only: the SVGs contain no colours, colour comes from your CSS.
- Connector icons show the vehicle inlet face, except `plug-schuko` which shows the socket face (there is no Schuko vehicle inlet), with the contact layout checked against public drawings of the connector standards (see each icon's `standard.source`).
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

### Small sizes

At 16 px the default stroke is drawn 1 px wide. Keep it at full weight with `absoluteStrokeWidth` and `strokeWidth={1.5}`, or with `strokeWidth={2}` when you do not use `absoluteStrokeWidth`. Next to Lucide icons (stroke 2), set `strokeWidth={2}` so both sets look equally heavy. This thickens the stroke relative to the drawing, so tight gaps such as the cut-out around the small bolt may close; check the icon at that size.

Not every icon is readable at 16 px. Use these from 20 px: the connector faces (category `connector`: `plug-type-1`, `plug-type-2`, `plug-ccs1`, `plug-ccs2`, `plug-chademo`, `plug-nacs`, `plug-schuko`), the letter icons (`current-ac`, `current-dc`, `power-kw`, `parking-charging`) and `bike-electric`. Use the map markers (`marker-*`) from 24 px.

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

Do not use an icon as the only carrier of information. At 16 px the contacts of a connector face render as similar dots, so faces that share a part are hard to tell apart: `plug-type-2` and `plug-ccs2` differ only in the DC part below the Type 2 contacts, `plug-type-1` and `plug-ccs1` only in the DC pair below the Type 1 contacts. Likewise `plug-type-1`, `plug-chademo` and `plug-schuko` look alike at 16 px (round faces). Always show the connector name next to the icon, for example "Type 2 · 22 kW". The same applies to status icons: show the status as text or at least as an accessible name.

### Right-to-left layouts

EVicons are not mirrored automatically. In a right-to-left layout, mirror the icons that show a direction: `route-to-charger`, `charging-plug`, `plug-and-charge`, `charging-cable`, `car-plugged`, `bidirectional-charging` and all vehicles (`car-electric`, `truck-electric`, `bus-electric`, `bike-electric`). Never mirror the letter icons, the connector faces (category `connector`: `plug-type-1`, `plug-type-2`, `plug-ccs1`, `plug-ccs2`, `plug-chademo`, `plug-nacs`, `plug-schuko`), `status-out-of-service` or the map markers.

```css
[dir="rtl"] .evicon-mirror { transform: scaleX(-1); }
```

Then add the class to the icons that should flip: `<CarElectric className="evicon-mirror" />`.

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

The same index with SVG markup and URLs, without installing anything: [evicons.dev/icons.json](https://evicons.dev/icons.json). A plain-text guide for AI assistants: [evicons.dev/llms.txt](https://evicons.dev/llms.txt).

## Icons

### Connectors

| Name | React component | Meaning |
|---|---|---|
| `plug-type-2` | `PlugType2` | Type 2 connector (IEC 62196-2, "Mennekes"), shown as the vehicle inlet face; the GB/T 20234.2 AC inlet (China) has the same face |
| `plug-type-1` | `PlugType1` | Type 1 AC connector (SAE J1772, IEC 62196-2 Type 1; North America, Japan), shown as the vehicle inlet face |
| `plug-ccs2` | `PlugCcs2` | CCS Combo 2 connector (IEC 62196-3, Type 2 with two DC contacts), shown as the vehicle inlet face |
| `plug-ccs1` | `PlugCcs1` | CCS Combo 1 connector (IEC 62196-3 configuration EE, SAE J1772 Type 1 with two DC contacts; North America), shown as the vehicle inlet face |
| `plug-nacs` | `PlugNacs` | NACS connector (SAE J3400, North American Charging Standard; AC and DC through the same two power contacts), shown as the vehicle inlet face |
| `plug-chademo` | `PlugChademo` | CHAdeMO DC connector (IEC 62196-3 configuration AA, JEVS G105), shown as the vehicle inlet face |
| `plug-schuko` | `PlugSchuko` | Schuko socket (CEE 7/3, DIN 49440, household AC), shown as the socket face seen from the front |

### Stations and sites

| Name | React component | Meaning |
|---|---|---|
| `charging-station` | `ChargingStation` | Charging station: a public or private charge point for electric vehicles |
| `charging-plug` | `ChargingPlug` | Charging plug in general, seen from the side with its cable (no specific connector type) |
| `charging-cable` | `ChargingCable` | Charging cable attached to the charge point (tethered cable with plug, no own cable needed) |
| `wallbox` | `Wallbox` | Wallbox: a wall-mounted home charger for electric vehicles |
| `home-charging` | `HomeCharging` | Home charging: charging the vehicle at home |
| `parking-charging` | `ParkingCharging` | Charging parking: a parking space where electric vehicles can charge |
| `charging-operator` | `ChargingOperator` | Charge point operator (CPO): the company that runs a charging point |
| `destination-charging` | `DestinationCharging` | Destination charging: charging while staying at a hotel, shop or restaurant |
| `report-fault` | `ReportFault` | Report a fault: tell the operator that a charging point has an electrical or technical problem |
| `fuel-station-charging` | `FuelStationCharging` | Fuel station charging: a charging point at a fuel or service station (under the canopy) |
| `dealer-charging` | `DealerCharging` | Car dealer charging: a charging point at a car dealership, showroom or garage |
| `shop-charging` | `ShopCharging` | Charging while shopping: a charging point at a supermarket, shopping centre or retail car park |
| `streetlight-charging` | `StreetlightCharging` | Street light charging: a charging point built into a street light (kerbside charging) |
| `charging-hub` | `ChargingHub` | Charging hub: a site with several charging points in one place (HPC hub, charging park) |
| `highway-charging` | `HighwayCharging` | Motorway charging: charging on or next to a motorway (service area, rest stop) |
| `accessible-charging` | `AccessibleCharging` | Accessible charging bay: a charging point usable from a wheelchair (step-free, wider bay, reachable controls) |

### Power and energy

| Name | React component | Meaning |
|---|---|---|
| `current-ac` | `CurrentAc` | Alternating current (AC) charging |
| `current-dc` | `CurrentDc` | Direct current (DC) charging |
| `fast-charging` | `FastCharging` | Fast charging: high charging power, typically DC fast or high-power charging |
| `charging-bolt` | `ChargingBolt` | Charging or electricity in general (plain lightning bolt) |
| `power-kw` | `PowerKw` | Power in kilowatts (kW), for example the charging power of a charge point |
| `solar-charging` | `SolarCharging` | Solar charging: charging with power from photovoltaics (PV surplus) |
| `green-power` | `GreenPower` | Green power: electricity from renewable sources |
| `battery-charging` | `BatteryCharging` | Battery charging: the vehicle battery is being charged |
| `bidirectional-charging` | `BidirectionalCharging` | Bidirectional charging: energy flows into and out of the vehicle (V2G, V2H) |
| `charging-time` | `ChargingTime` | Charging time: how long a charging session takes, or a time-based tariff |
| `charging-power-level` | `ChargingPowerLevel` | Charging power level: the charging power shown on a scale (kW display, power filter) |
| `charging-session` | `ChargingSession` | Charging session in progress: the vehicle is charging right now (live session) |

### Vehicles

| Name | React component | Meaning |
|---|---|---|
| `car-plugged` | `CarPlugged` | Electric car connected to a charging cable |
| `car-electric` | `CarElectric` | Electric car (battery electric vehicle) |
| `driving-range` | `DrivingRange` | Range: distance the vehicle can drive on its battery charge |
| `route-to-charger` | `RouteToCharger` | Route to the charger: navigation to a charging point |
| `truck-electric` | `TruckElectric` | Electric truck: a battery electric goods vehicle (vehicle class N) |
| `bus-electric` | `BusElectric` | Electric bus: a battery electric bus or coach (vehicle class M2/M3) |
| `bike-electric` | `BikeElectric` | Electric bike: e-bike, pedelec or electric cargo bike (light electric vehicle) |
| `plug-in-hybrid` | `PlugInHybrid` | Plug-in hybrid (PHEV): a vehicle that charges from the grid and also runs on fuel |

### Payment

| Name | React component | Meaning |
|---|---|---|
| `charging-card` | `ChargingCard` | Charging card: an RFID card that starts a charging session |
| `app-charging` | `AppCharging` | Charging by app: start and pay a charging session with a smartphone app |
| `card-terminal` | `CardTerminal` | Card terminal: ad hoc payment by debit or credit card, contactless |
| `roaming` | `Roaming` | Roaming: charging with a contract from another provider |
| `charging-tariff` | `ChargingTariff` | Charging tariff: the price of charging, for example per kWh |
| `charging-log` | `ChargingLog` | Charging log: a record of charging sessions, for example a log book or receipt |
| `calibrated-meter` | `CalibratedMeter` | Calibrated meter: the charging point bills energy with a meter that complies with calibration law (Eichrecht) |
| `free-charging` | `FreeCharging` | Free charging: charging at no cost to the driver |
| `idle-fee` | `IdleFee` | Idle fee: a fee for occupying the charging point after charging has finished |
| `qr-charging` | `QrCharging` | QR code charging: start or pay for a charging session ad hoc by scanning the QR code at the charging point |
| `plug-and-charge` | `PlugAndCharge` | Plug & Charge: the vehicle authorises the charging session automatically when it is plugged in (ISO 15118) |

### Status

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

### Markers

Map pins with a sign in the head, for 24 to 40 px; see [Map markers](#map-markers) for filled mode.

The charging marker is named `marker-charging` (`MarkerCharging`), not `marker`, so that it does not clash with the `Marker` component of map libraries (MapLibre, Mapbox, Leaflet, Google Maps).

| Name | React component | Sign | Meaning |
|---|---|---|---|
| `marker-charging` | `MarkerCharging` | Lightning bolt | Map marker for a charging point |
| `marker-ac` | `MarkerAc` | Letters AC | Map marker for an AC charging point |
| `marker-dc` | `MarkerDc` | Letters DC | Map marker for a DC charging point |
| `marker-available` | `MarkerAvailable` | Check mark | Map marker: the charging point is available |
| `marker-occupied` | `MarkerOccupied` | Clock | Map marker: the charging point is occupied |
| `marker-faulted` | `MarkerFaulted` | Exclamation mark | Map marker: the charging point reports an error and cannot charge |
| `marker-out-of-service` | `MarkerOutOfService` | Cross | Map marker: the charging point is out of service |
| `marker-unknown` | `MarkerUnknown` | Question mark | Map marker: the status of the charging point is unknown |
| `marker-reserved` | `MarkerReserved` | Letter R | Map marker: the charging point is reserved for a booking |
| `marker-queue` | `MarkerQueue` | Hourglass | Map marker: drivers are queuing for the charging point, expect a wait |

## Map markers

The `marker-*` icons are map pins with a sign in the head (listed under [Markers](#markers)); `marker-charging` is the plain charging point, the others add AC/DC or a status. Use them at 24, 32 or 40 px; they are not drawn for 16 px. Like all icons they are outlines in `currentColor`, and they can also be drawn filled: the pin in your colour, the sign in white. The SVG files never contain a colour; filling is done by your CSS or your code.

**Element order is a contract:** in every marker the first `<path>` is the pin, a single closed shape that encloses the sign. Everything after it is the sign. This order never changes in a released marker.

### Filled with CSS (inline SVG and React)

```css
.marker { color: #1f9d55; }
.marker svg > path:first-of-type { fill: currentColor; }
.marker svg > :not(path:first-of-type) { stroke: #fff; }
```

```tsx
import { MarkerAvailable } from '@evicons/react'

export function AvailablePin() {
  return (
    <span className="marker">
      <MarkerAvailable size={32} title="Available" />
    </span>
  )
}
```

Select the pin with `path:first-of-type`, not `:first-child`: with `title`, the React component renders a `<title>` as the first child of the `<svg>`. The rule works for inline SVG and the React components. It does not work with the sprite: the shapes of a `<symbol>` shown with `<use>` are not children of your `<svg>`, so page CSS cannot select them. The pin keeps its stroke, so a filled pin is 0.75 units larger than its outline; that is intended.

### MapLibre GL

Map libraries draw markers as images, where page CSS does not apply. Fill the SVG string before you turn it into an image: set the root `stroke="currentColor"` to white (the sign inherits it) and give the first `<path>`, the pin, the fill and stroke colour. Then load it from a data URL and add it with `pixelRatio: 2`, so it stays sharp on high-density screens:

```ts
import type { Map } from 'maplibre-gl'

// `svg` is the text of a file from @evicons/svg, for example `@evicons/svg/marker-charging.svg`
// (with Vite: `import svg from '@evicons/svg/marker-charging.svg?raw'`). `size` is the size on the map in px.
export async function addMarkerImage(map: Map, name: string, svg: string, colour: string, size = 32) {
  const filled = svg
    .replace('width="24" height="24"', `width="${size * 2}" height="${size * 2}"`)
    .replace('stroke="currentColor"', 'stroke="#fff"')
    .replace('<path ', `<path fill="${colour}" stroke="${colour}" `)
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(filled)}`
  await img.decode()
  map.addImage(name, img, { pixelRatio: 2 })
}
```

```ts
await addMarkerImage(map, 'ev-marker-charging', svg, '#2563eb')

map.addLayer({
  id: 'charge-points',
  type: 'symbol',
  source: 'charge-points',
  layout: { 'icon-image': 'ev-marker-charging', 'icon-anchor': 'bottom', 'icon-offset': [0, 32 / 12] },
})
```

The pin's tip is at y 22 of 24, so with `'icon-anchor': 'bottom'` an offset of `size / 12` px moves the tip onto the point. Use one image per marker and colour. For an outline marker, only set the size and replace the root `stroke="currentColor"` with the colour.

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
