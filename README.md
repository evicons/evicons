<p><a href="https://evicons.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo-on-dark.png"><img src="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo.svg" width="320" alt="EVicons"></picture></a></p>

# EVicons

Website: [evicons.dev](https://evicons.dev)

Open-source icons for e-mobility and EV charging: charging stations, connector faces, AC/DC and power, energy, vehicles, payment, charge point status and map markers. MIT licensed.

EVicons covers **only** e-mobility. General UI icons (arrows, menu, search, close, ...) are out of scope; keep using a general icon set such as Lucide for those. EVicons contains no brand or manufacturer logos.

- Outline style on a 24 × 24 grid, stroke width 1.5, round caps and joins; lightning bolts are solid.
- `currentColor` only: the SVGs contain no colours, colour comes from your CSS.
- Connector icons show the vehicle inlet face, except `plug-schuko`, `plug-cee-blue` and `plug-cee-red`, which show the socket face (these sockets have no vehicle inlet in EV charging), with the contact layout checked against public drawings of the connector standards (see each icon's `standard.source`).
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

Not every icon is readable at 16 px. Use these from 20 px: the connector faces (category `connector`: `plug-type-1`, `plug-type-2`, `plug-ccs1`, `plug-ccs2`, `plug-chademo`, `plug-nacs`, `plug-gbt-dc`, `plug-mcs`, `plug-schuko`, `plug-cee-blue`, `plug-cee-red`), the letter icons (`current-ac`, `current-dc`, `power-kw`, `parking-charging`), `bike-electric`, `motorcycle-electric` and `charging-availability`. Use the map markers (`marker-*`) from 24 px.

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

Do not use an icon as the only carrier of information. At 16 px the contacts of a connector face render as similar dots, so faces that share a part are hard to tell apart: `plug-type-2` and `plug-ccs2` differ only in the DC part below the Type 2 contacts, `plug-type-1` and `plug-ccs1` only in the DC pair below the Type 1 contacts. `plug-gbt-dc` differs from `plug-type-2` mainly by the two large DC rings and the higher flat edge. Likewise `plug-type-1`, `plug-chademo` and `plug-schuko` look alike at 16 px (round faces), and `plug-cee-blue` resembles `plug-type-1` (two contacts above a larger one; the CEE face has the key at the bottom). Always show the connector name next to the icon, for example "Type 2 · 22 kW". The same applies to status icons: show the status as text or at least as an accessible name.

### Right-to-left layouts

EVicons are not mirrored automatically. In a right-to-left layout, mirror the icons that show a direction: `route-to-charger`, `charging-plug`, `plug-and-charge`, `charging-cable`, `car-plugged`, `bidirectional-charging` and all vehicles (`car-electric`, `truck-electric`, `bus-electric`, `bike-electric`, `motorcycle-electric`). Never mirror the letter icons, the connector faces (category `connector`: `plug-type-1`, `plug-type-2`, `plug-ccs1`, `plug-ccs2`, `plug-chademo`, `plug-nacs`, `plug-gbt-dc`, `plug-mcs`, `plug-schuko`, `plug-cee-blue`, `plug-cee-red`), `status-out-of-service` or the map markers.

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
| `plug-gbt-dc` | `PlugGbtDc` | GB/T DC connector (GB/T 20234.3, China; DC fast charging with the contacts DC+, DC−, PE, S+, S−, CC1, CC2, A+, A−), shown as the vehicle inlet face |
| `plug-mcs` | `PlugMcs` | MCS connector (Megawatt Charging System, SAE J3271 / IEC 63379; DC charging for trucks and buses with the contacts DC+, DC−, PE and four communication and detection contacts), shown as the vehicle inlet face |
| `plug-chademo` | `PlugChademo` | CHAdeMO DC connector (IEC 62196-3 configuration AA, JEVS G105), shown as the vehicle inlet face |
| `plug-schuko` | `PlugSchuko` | Schuko socket (CEE 7/3, DIN 49440, household AC), shown as the socket face seen from the front |
| `plug-cee-blue` | `PlugCeeBlue` | CEE blue socket (IEC 60309-2, 2P+E, 230 V, 16/32 A, earth at 6 h; campsite or caravan socket), shown as the socket face seen from the front |
| `plug-cee-red` | `PlugCeeRed` | CEE red socket (IEC 60309-2, 3P+N+E, 400 V three-phase, 16 to 125 A, earth at 6 h), shown as the socket face seen from the front |

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
| `charging-availability` | `ChargingAvailability` | Charging availability: how many charging points at a site are free or occupied |
| `station-uptime` | `StationUptime` | Station uptime: the operating status of a charging point over time, its reliability (for example availability over the last 30 days) |
| `restricted-access` | `RestrictedAccess` | Restricted access: the charging point is not open to everyone (private, customers only, company vehicles only, behind a barrier) |
| `community-verified` | `CommunityVerified` | Community verified: information reported or confirmed by drivers (for example a price, a free charger or a tip) |
| `charging-socket` | `ChargingSocket` | Charging socket: the charging point has a socket outlet, bring your own cable (no tethered cable) |

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
| `power-outage` | `PowerOutage` | Power outage: no grid power at the site, the charging point has no electricity |

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
| `motorcycle-electric` | `MotorcycleElectric` | Electric motorcycle or electric scooter (vehicle class L, for example L1e and L3e) |
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

Map pins with a sign in the head (the cluster pin leaves it empty for a count), for 24 to 40 px; see [Map markers](#map-markers) for filled mode.

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
| `marker-cluster` | `MarkerCluster` | Empty head | Map marker for a cluster of charging points; the app draws the count in the head |

## Map markers

The `marker-*` icons are map pins with a sign in the head (listed under [Markers](#markers)); `marker-charging` is the plain charging point, the others add AC/DC or a status, and `marker-cluster` leaves the head empty for a count ([Clusters and selection](#clusters-and-selection)). Use them at 24, 32 or 40 px; they are not drawn for 16 px. Like all icons they are outlines in `currentColor` (the lightning bolt of `marker-charging` is solid), and they can also be drawn filled: the pin in your colour, the sign in white. The SVG files never contain a colour; filling is done by your CSS or your code.

**Element order is a contract:** in every marker the first `<path>` is the pin, a single closed shape that encloses the sign. Everything after it is the sign. This order never changes in a released marker.

### Filled with CSS (inline SVG and React)

```css
.marker { color: #1f9d55; }
.marker svg > path:first-of-type { fill: currentColor; }
.marker svg > :not(path:first-of-type) { stroke: #fff; }
.marker svg > [fill] { fill: #fff; }
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

Select the pin with `path:first-of-type`, not `:first-child`: with `title`, the React component renders a `<title>` as the first child of the `<svg>`. The rule works for inline SVG and the React components. It does not work with the sprite: the shapes of a `<symbol>` shown with `<use>` are not children of your `<svg>`, so page CSS cannot select them. The pin keeps its stroke, so a filled pin is 0.75 units larger than its outline; that is intended. The third rule is for the solid bolt of `marker-charging`: it is the only shape with its own `fill="currentColor"` (since 0.7.0), so without the rule it takes the pin colour and only its white edge shows. For a hollow pin (white head, coloured outline and sign) fill the pin white instead (`.marker svg > path:first-of-type { fill: #fff; }`) and leave out the other two rules; the bolt then stays solid in your colour.

### MapLibre GL

Map libraries draw markers as images, where page CSS does not apply. Fill the SVG string before you turn it into an image: set the root `stroke="currentColor"` to white (the sign inherits it), the solid bolt's `fill="currentColor"` to white as well, and give the first `<path>`, the pin, the fill and stroke colour. Then load it from a data URL and add it with `pixelRatio: 2`, so it stays sharp on high-density screens:

```ts
import type { Map } from 'maplibre-gl'

// `svg` is the text of a file from @evicons/svg, for example `@evicons/svg/marker-charging.svg`
// (with Vite: `import svg from '@evicons/svg/marker-charging.svg?raw'`). `size` is the size on the map in px.
export async function addMarkerImage(map: Map, name: string, svg: string, colour: string, size = 32) {
  const filled = svg
    .replace('width="24" height="24"', `width="${size * 2}" height="${size * 2}"`)
    .replace('stroke="currentColor"', 'stroke="#fff"')
    .replaceAll('fill="currentColor"', 'fill="#fff"')
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
  layout: { 'icon-image': 'ev-marker-charging', 'icon-anchor': 'bottom', 'icon-offset': [(32 * 9.5) / 24, (32 * 2.5) / 24] },
})
```

The pin's corner, which marks the point, is at (2.5, 21.5) of 24, so with `'icon-anchor': 'bottom'` an offset of `[size × 9.5 / 24, size × 2.5 / 24]` px moves the corner onto the point. Use one image per marker and colour. For an outline marker, only set the size and replace the root `stroke="currentColor"` with the colour.

### Clusters and selection

Map libraries group nearby points into clusters, and most apps highlight the station the user has selected. Neither needs its own sign: a cluster is the empty `marker-cluster` pin with the count drawn in its head, and the selected station keeps its own marker, drawn larger and with a ring.

**Clusters.** Fill `marker-cluster` in your cluster colour and draw the count in white, centred in the head. The head centre is at (12, 12) of 24, the centre of the icon box: in a box of `size` px it sits at (size × 12 / 24, size × 12 / 24) from the top-left corner. With the corner anchored on the point, the count is `size × 9.5 / 24` px right of and above the point. Size the pin for the count: at 13 px bold, the head of a 32 px pin holds two digits, and the head of a 40 px pin holds `999` and `1.2k`, so switch to 40 px from 100 points. The text stays 13 px at both sizes. Pick a cluster colour with at least 4.5:1 contrast to white (EV blue `#2563eb` has 5.2:1); the count then needs no halo.

In MapLibre, set `cluster: true` on the GeoJSON source. Every cluster gets the properties `point_count` and `point_count_abbreviated` (`999`, `1.2k`, `15k`); a symbol layer draws the pin, 32 or 40 px by `point_count`, and puts the count on the head centre. `text-offset` is in ems of `text-size`:

```ts
import type { ExpressionSpecification, GeoJSONSource } from 'maplibre-gl'

const textSize = 13 // about 32 × 0.42; also at 40 px, where it leaves room for `1.2k`
/** The value for 32 px pins (up to 99 points) or 40 px pins (100 and more). */
const bySize = (at32: unknown, at40: unknown) => ['step', ['get', 'point_count'], at32, 100, at40] as ExpressionSpecification
const head = (size: number) => (size * 9.5) / 24 // from the point to the head centre, right and up, in px
const iconOffset = (size: number) => ['literal', [head(size), (size * 2.5) / 24]]
const textOffset = (size: number) => ['literal', [head(size) / textSize, -head(size) / textSize]]

map.addSource('charge-points', { type: 'geojson', data: chargePoints, cluster: true, clusterRadius: 48 })
// `clusterSvg` is the text of @evicons/svg/marker-cluster.svg
await addMarkerImage(map, 'ev-marker-cluster', clusterSvg, '#2563eb', 32)
await addMarkerImage(map, 'ev-marker-cluster-40', clusterSvg, '#2563eb', 40)

map.addLayer({
  id: 'clusters',
  type: 'symbol',
  source: 'charge-points',
  filter: ['has', 'point_count'],
  layout: {
    'icon-image': bySize('ev-marker-cluster', 'ev-marker-cluster-40'),
    'icon-anchor': 'bottom',
    'icon-offset': bySize(iconOffset(32), iconOffset(40)),
    'icon-allow-overlap': true,
    'text-field': ['get', 'point_count_abbreviated'],
    'text-font': ['Noto Sans Bold'], // a bold face that your style's glyphs provide
    'text-size': textSize,
    'text-anchor': 'center',
    'text-offset': bySize(textOffset(32), textOffset(40)),
    'text-allow-overlap': true,
  },
  paint: { 'text-color': '#fff' },
})

// A click on a cluster zooms in until it splits.
map.on('click', 'clusters', async (event) => {
  const cluster = event.features![0]!
  const source = map.getSource<GeoJSONSource>('charge-points')!
  const zoom = await source.getClusterExpansionZoom(cluster.properties.cluster_id)
  map.easeTo({ center: (cluster.geometry as GeoJSON.Point).coordinates as [number, number], zoom })
})
```

Give the layer of single charge points `filter: ['!', ['has', 'point_count']]`, so that it skips the clusters. The count is text, so the style needs `glyphs` that serve the `text-font`; with a style without glyphs, leave the text properties out and show the pin alone.

For HTML markers (Leaflet's `L.divIcon`, a MapLibre `Marker` with an element, or a React component), put the count in a `<span>` over the head. The head centre is the centre of the box, so `left: 50%` and `top: 50%` place it:

```css
.ev-cluster { position: relative; display: block; width: 32px; height: 32px; color: #2563eb; }
.ev-cluster.is-large { width: 40px; height: 40px; }
.ev-cluster svg { display: block; width: 100%; height: 100%; }
.ev-cluster svg > path:first-of-type { fill: currentColor; }
.ev-cluster .count { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font: 700 13px/1 system-ui, sans-serif; color: #fff; }
```

```ts
import L from 'leaflet'
import svg from '@evicons/svg/marker-cluster.svg?raw'

// The same abbreviation as MapLibre's `point_count_abbreviated`: 999, 1.2k, 15k.
const abbreviate = (n: number) => (n >= 10_000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${Math.round(n / 100) / 10}k` : `${n}`)

export function clusterIcon(count: number) {
  const size = count >= 100 ? 40 : 32
  return L.divIcon({
    html: `<span class="ev-cluster${size === 40 ? ' is-large' : ''}">${svg}<span class="count">${abbreviate(count)}</span></span>`,
    className: '', // no Leaflet box; the wrapper inside carries the class
    iconSize: [size, size],
    iconAnchor: [(size * 2.5) / 24, (size * 21.5) / 24],
  })
}
```

With Leaflet.markercluster, return it from `iconCreateFunction: (cluster) => clusterIcon(cluster.getChildCount())`. The class is `ev-cluster`, not `marker-cluster`, because Leaflet.markercluster styles `.marker-cluster` itself. In React (abbreviate and size large counts the same way):

```tsx
import { MarkerCluster } from '@evicons/react'

export function ClusterPin({ count }: { count: number }) {
  return (
    <span className="ev-cluster">
      <MarkerCluster size={32} aria-label={`${count} charging points`} />
      <span className="count" aria-hidden="true">
        {count}
      </span>
    </span>
  )
}
```

**Selection.** There is no "selected" marker: draw the selected station's own marker, so that its status stays visible, and set it apart in ways that do not depend on colour.

- **Larger:** 40 px instead of the 32 px of the other markers. On a map, register a separate 40 px image rather than scaling with `icon-size`, so that it stays sharp, and compute its offsets for 40 px.
- **A white ring:** it lifts the pin off the map and off its neighbours. In CSS, give the pin a wide white stroke painted under its fill: `stroke-width: 4` puts 2 units of white outside the path (3.3 px at 40 px), in place of the pin's own stroke, so the pin grows by 1.25 units overall. A map image cannot be styled, and MapLibre's `icon-halo-*` only applies to SDF icons, so draw the ring into the image: a white copy of the pin, 4 wide, underneath the filled one, which keeps its coloured stroke and leaves 1.25 units of white (2 px at 40 px).
- **On top:** draw it above the other markers: `symbol-sort-key` in MapLibre (a higher key is drawn later), `zIndexOffset` in Leaflet, `z-index` for HTML markers.

```css
.marker.is-selected svg > path:first-of-type { stroke: #fff; stroke-width: 4; paint-order: stroke; }
```

```ts
// `filled` is the SVG string after the four replacements in addMarkerImage. The root stroke is
// white by then, so the extra path is the white ring.
export function withRing(filled: string) {
  return filled.replace('<path ', '<path d="M2.5 21.5V12a9.5 9.5 0 1 1 9.5 9.5Z" stroke-width="4"/><path ')
}
```

Colour alone does not mark a selection: people who cannot tell the colours apart must still see it ([WCAG 1.4.1, Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)), and on a status map the colour already means the status. A stronger shade of the marker colour may add to size, ring and order, but not replace them. The [map demo](https://evicons.dev/map) clusters its stations when you zoom out and draws the selected station this way.

## OpenStreetMap

OpenStreetMap (OSM) maps charging stations as `amenity=charging_station`. Each socket type is a key `socket:<type>` whose value is a count (or `yes`) of the sockets of that type (`socket:type2=2`), and `socket:<type>:output` is its maximum power (`socket:type2_combo:output=150 kW`). Further tags say which vehicles can charge (`motorcar=yes`, `bicycle=yes`), whether it costs (`fee=no`), who may use it (`access=customers`), whether it is usable from a wheelchair (`wheelchair=yes`), what it is mounted on (`support=street_lamp`) and who runs it (`operator=*`). Every icon lists the tags it stands for in the `osm` field of its metadata, so an app can pick the icon from the tags alone. Tag names follow the OSM wiki pages [Key:socket](https://wiki.openstreetmap.org/wiki/Key:socket), [Tag:amenity=charging_station](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dcharging_station), [Key:access](https://wiki.openstreetmap.org/wiki/Key:access), [Key:frequency](https://wiki.openstreetmap.org/wiki/Key:frequency) [Key:parking_space](https://wiki.openstreetmap.org/wiki/Key:parking_space) (retrieved 2026-11-03), [Key:wheelchair](https://wiki.openstreetmap.org/wiki/Key:wheelchair) and [Key:support](https://wiki.openstreetmap.org/wiki/Key:support) (retrieved 2026-11-04).

A bare key (`socket:type2`, `operator`, `charging_station:output`) stands for any value of that key; `key=value` for that value only. Each tag belongs to one icon at most:

| OSM tag | Icon | React component |
|---|---|---|
| `access=customers` | `restricted-access` | `RestrictedAccess` |
| `access=private` | `restricted-access` | `RestrictedAccess` |
| `amenity=charging_station` | `charging-station` | `ChargingStation` |
| `bicycle=yes` | `bike-electric` | `BikeElectric` |
| `bus=yes` | `bus-electric` | `BusElectric` |
| `charging_station:output` | `power-kw` | `PowerKw` |
| `fee=no` | `free-charging` | `FreeCharging` |
| `fee=yes` | `charging-tariff` | `ChargingTariff` |
| `frequency=0` | `current-dc` | `CurrentDc` |
| `frequency=50` | `current-ac` | `CurrentAc` |
| `frequency=60` | `current-ac` | `CurrentAc` |
| `hgv=yes` | `truck-electric` | `TruckElectric` |
| `motorcar=yes` | `car-electric` | `CarElectric` |
| `motorcycle=yes` | `motorcycle-electric` | `MotorcycleElectric` |
| `operator` | `charging-operator` | `ChargingOperator` |
| `parking_space=charging` | `parking-charging` | `ParkingCharging` |
| `socket:cee_blue` | `plug-cee-blue` | `PlugCeeBlue` |
| `socket:cee_red_125a` | `plug-cee-red` | `PlugCeeRed` |
| `socket:cee_red_16a` | `plug-cee-red` | `PlugCeeRed` |
| `socket:cee_red_32a` | `plug-cee-red` | `PlugCeeRed` |
| `socket:cee_red_63a` | `plug-cee-red` | `PlugCeeRed` |
| `socket:chademo` | `plug-chademo` | `PlugChademo` |
| `socket:gb_ac` | `plug-type-2` | `PlugType2` |
| `socket:gb_dc` | `plug-gbt-dc` | `PlugGbtDc` |
| `socket:mcs` | `plug-mcs` | `PlugMcs` |
| `socket:nacs` | `plug-nacs` | `PlugNacs` |
| `socket:schuko` | `plug-schuko` | `PlugSchuko` |
| `socket:type1` | `plug-type-1` | `PlugType1` |
| `socket:type1_combo` | `plug-ccs1` | `PlugCcs1` |
| `socket:type2` | `plug-type-2` | `PlugType2` |
| `socket:type2_cable` | `plug-type-2` | `PlugType2` |
| `socket:type2_combo` | `plug-ccs2` | `PlugCcs2` |
| `socket:unknown` | `charging-plug` | `ChargingPlug` |
| `support=street_lamp` | `streetlight-charging` | `StreetlightCharging` |
| `wheelchair=yes` | `accessible-charging` | `AccessibleCharging` |

- `socket:tesla_supercharger` is discouraged on the wiki; use `socket:nacs`, `socket:type2_cable`/`socket:type2_combo` or `socket:gb_ac`/`socket:gb_dc` by region. It is not mapped; like any other socket without an icon, it falls back to `charging-plug` (`socket:unknown`).
- `socket:gb_ac` maps to `plug-type-2`: the GB/T 20234.2 AC inlet has the same face as Type 2.
- `wheelchair=yes` maps to `accessible-charging`: on the wiki it means full, unrestricted wheelchair access (step-free); `wheelchair=limited` and `wheelchair=no` are not mapped. `support=street_lamp` (the feature is supported by a street lamp) maps to `streetlight-charging`, the charging point built into a street light.
- `plug-schuko`, `plug-cee-blue` and `plug-cee-red` show the socket face seen from the front, not a vehicle inlet: in OSM these are sockets at the station, used with a portable charging cable.

### Tags to icons

`@evicons/svg/osm.json` maps every tag in the table to its icon name; `icons.json` carries the same tags per icon in `osm` (also on the site: [evicons.dev/icons.json](https://evicons.dev/icons.json)). To show the sockets of a station, collect the `socket:*` keys whose value is a count (or `yes`), look them up and fall back to `charging-plug` for sockets without an icon:

```ts
import osm from '@evicons/svg/osm.json' with { type: 'json' }

const iconFor: Record<string, string> = osm

/** A socket value is a count of sockets or `yes` (OSM wiki Key:socket). */
const isSocketCount = (value: string) => value === 'yes' || /^[1-9]\d*$/.test(value)

/** Icon names for the sockets of one `amenity=charging_station` element, without duplicates. */
export function socketIcons(tags: Record<string, string>): string[] {
  const icons = new Set<string>()
  for (const [key, value] of Object.entries(tags)) {
    if (!/^socket:[a-z0-9_]+$/.test(key)) continue // skips socket:<type>:output and other sub-keys
    if (!isSocketCount(value)) continue
    icons.add(iconFor[key] ?? 'charging-plug')
  }
  return [...icons]
}

socketIcons({ amenity: 'charging_station', 'socket:type2': '2', 'socket:type2_combo': '1', 'socket:type2_combo:output': '150 kW', 'socket:schuko': 'yes' })
// ['plug-type-2', 'plug-ccs2', 'plug-schuko']
```

In React, map the tags to components with an explicit import list. Do not look components up by name in `import * as icons`: a lookup by a computed name keeps every icon in the bundle.

```tsx
import {
  ChargingPlug,
  PlugCcs1,
  PlugCcs2,
  PlugCeeBlue,
  PlugCeeRed,
  PlugChademo,
  PlugGbtDc,
  PlugMcs,
  PlugNacs,
  PlugSchuko,
  PlugType1,
  PlugType2,
  type EvIconComponent,
} from '@evicons/react'

const socketComponents: Record<string, EvIconComponent> = {
  'socket:cee_blue': PlugCeeBlue,
  'socket:cee_red_125a': PlugCeeRed,
  'socket:cee_red_16a': PlugCeeRed,
  'socket:cee_red_32a': PlugCeeRed,
  'socket:cee_red_63a': PlugCeeRed,
  'socket:chademo': PlugChademo,
  'socket:gb_ac': PlugType2,
  'socket:gb_dc': PlugGbtDc,
  'socket:mcs': PlugMcs,
  'socket:nacs': PlugNacs,
  'socket:schuko': PlugSchuko,
  'socket:type1': PlugType1,
  'socket:type1_combo': PlugCcs1,
  'socket:type2': PlugType2,
  'socket:type2_cable': PlugType2,
  'socket:type2_combo': PlugCcs2,
}

/** A socket value is a count of sockets or `yes` (OSM wiki Key:socket). */
const isSocketCount = (value: string) => value === 'yes' || /^[1-9]\d*$/.test(value)

export function StationSockets({ tags }: { tags: Record<string, string> }) {
  const sockets = Object.entries(tags).filter(([key, value]) => /^socket:[a-z0-9_]+$/.test(key) && isSocketCount(value))
  return (
    <ul>
      {sockets.map(([key, count]) => {
        const Icon = socketComponents[key] ?? ChargingPlug
        return (
          <li key={key}>
            <Icon size={20} /> {key.slice('socket:'.length)}
            {count === 'yes' ? '' : ` × ${count}`}
          </li>
        )
      })}
    </ul>
  )
}
```

The list shows the OSM socket type next to each icon; replace it with your own connector names (for example "Type 2", "CCS"), since the icon complements the text.

### Querying with Overpass

The [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) returns the charging stations in a bounding box (south, west, north, east). `out center;` gives ways and relations a centre point, so every result can be drawn as a marker:

```text
[out:json][timeout:25];
nwr["amenity"="charging_station"](47.80,12.05,47.90,12.20);
out center;
```

Each element has its tags in `tags`, ready for `socketIcons` above. OSM data is licensed under the [ODbL](https://www.openstreetmap.org/copyright): show "© OpenStreetMap contributors" wherever you display it. Public Overpass instances are shared and rate-limited: query a bounding box, not the whole map; cache the result instead of querying on every map move; and for regular or large imports run your own instance or use an OSM extract.

### JOSM map style

[JOSM](https://josm.openstreetmap.de), the desktop OpenStreetMap editor, can draw charging stations with EVicons while you map. The style is an add-on: it draws only charging stations and charge points, on top of your base map style, which keeps drawing everything else. To add it, open Preferences → Map Paint Styles in JOSM, click the "+" button on the right and enter this URL:

```text
https://evicons.dev/josm/evicons.zip
```

The style is also served as a plain file, `https://evicons.dev/josm/evicons.mapcss`, which loads its icons from `https://evicons.dev/josm/icons/` by absolute URL (prefer the zip: it works offline once JOSM has cached it). Stations appear from zoom 14, charge points from zoom 17:

- **DC** (`marker-dc`, blue pin): the station has a DC socket (`socket:type2_combo`, `socket:type1_combo`, `socket:chademo`, `socket:gb_dc`, `socket:mcs`, `socket:nacs`, `socket:chaoji` or the older `socket:tesla_supercharger`) or `frequency=0`. DC wins over AC. NACS counts as DC because most mapped NACS sockets are Tesla Superchargers.
- **AC** (`marker-ac`, blue pin): any other `socket:<type>`.
- **No socket data** (`marker-unknown`, cyan pin with a question mark): no socket counts. A socket counts with a count above 0 or `yes`; `0` and `no` do not. These stations are the ones to complete; from zoom 16 they are labelled "socket?".
- **Disused** (`marker-out-of-service`, grey pin with a cross): `disused:amenity=charging_station`.
- **Charge points** (`man_made=charge_point`): the connector of their first socket in this order: MCS, CCS2, CCS1, CHAdeMO, GB/T DC, NACS, Type 2 (also `socket:type2_cable` and `socket:gb_ac`), Type 1, CEE red, CEE blue, Schuko; any other socket, or none, shows `charging-plug`. The connector is drawn in dark lines on a white disc.

The pin head sits on the station's node, as JOSM's own icons do, so a click on the pin selects the station. An area gets its pin at its centre once the area is large enough on screen for the pin to fit (JOSM draws area icons only then); the same goes for its label. From zoom 16 a label next to the pin shows the output: `charging_station:output`, else the output of the station's highest-priority socket type that counts (first value, in the charge point order above), else the capacity (`×4`). Two style settings turn the output labels and the "socket?" labels off: right-click the style in the Map Styles panel and open Style settings. The style is generated from the icons and their OpenStreetMap tags with each release of the site, and it is MIT-licensed like the icons.

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
