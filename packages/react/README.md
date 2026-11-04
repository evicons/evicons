<p><a href="https://evicons.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo-on-dark.png"><img src="https://raw.githubusercontent.com/evicons/evicons/main/brand/logo.svg" width="320" alt="EVicons"></picture></a></p>

# @evicons/react

Website: [evicons.dev](https://evicons.dev)

React components for [EVicons](https://github.com/evicons/evicons), MIT-licensed outline icons for e-mobility and EV charging: charging stations, connector faces, AC/DC and power, energy, vehicles, payment, charge point status and map markers.

EVicons covers only e-mobility; keep using a general icon set such as Lucide for general UI icons. Icons use `currentColor` and contain no colours. Raw SVG files, a sprite and metadata are in [`@evicons/svg`](https://www.npmjs.com/package/@evicons/svg).

## Installation

```sh
npm install @evicons/react
```

## Usage

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

## Props

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

## Colour

Icons draw with `currentColor`. Set the CSS `color` of the icon or of a parent:

```tsx
<StatusAvailable className="text-green-600" title="Available" />
```

## `absoluteStrokeWidth`

By default the stroke scales with the icon: at `size={12}` a stroke of 1.5 is drawn 0.75 px wide. With `absoluteStrokeWidth`, every shape gets `vector-effect="non-scaling-stroke"`, so the stroke is drawn `strokeWidth` screen pixels wide whatever the rendered size.

Because this is done by the browser and not computed from `size`, it also works when the size comes from CSS (`size="1em"`, `className="size-4"`, non-square sizes). Shapes you pass as children are not changed.

## Small sizes

At 16 px the default stroke is drawn 1 px wide. Keep it at full weight with `absoluteStrokeWidth` and `strokeWidth={1.5}`, or with `strokeWidth={2}` when you do not use `absoluteStrokeWidth`. Next to Lucide icons (stroke 2), set `strokeWidth={2}` so both sets look equally heavy. This thickens the stroke relative to the drawing, so tight gaps such as the cut-out around the small bolt may close; check the icon at that size.

Not every icon is readable at 16 px. Use these from 20 px: the connector faces (category `connector`: `plug-type-1`, `plug-type-2`, `plug-ccs1`, `plug-ccs2`, `plug-chademo`, `plug-nacs`, `plug-gbt-dc`, `plug-mcs`, `plug-schuko`, `plug-cee-blue`, `plug-cee-red`), the letter icons (`current-ac`, `current-dc`, `power-kw`, `parking-charging`), `bike-electric`, `motorcycle-electric` and `charging-availability`. Use the map markers (`marker-*`) from 24 px.

## Accessibility

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

## Icons complement text

Do not use an icon as the only carrier of information. At 16 px the contacts of a connector face render as similar dots, so faces that share a part are hard to tell apart: `plug-type-2` and `plug-ccs2` differ only in the DC part below the Type 2 contacts, `plug-type-1` and `plug-ccs1` only in the DC pair below the Type 1 contacts. `plug-gbt-dc` differs from `plug-type-2` mainly by the two large DC rings and the higher flat edge. Likewise `plug-type-1`, `plug-chademo` and `plug-schuko` look alike at 16 px (round faces), and `plug-cee-blue` resembles `plug-type-1` (two contacts above a larger one; the CEE face has the key at the bottom). Always show the connector name next to the icon, for example "Type 2 · 22 kW". The same applies to status icons: show the status as text or at least as an accessible name.

## Status overlay pattern

To combine a status with another icon, place a small status icon (half the base size, with `absoluteStrokeWidth`) absolutely in the bottom-right corner. See the [example in the repository README](https://github.com/evicons/evicons#status-overlay-pattern).

## Icons

### Connectors

| Name | React component | Meaning |
|---|---|---|
| `plug-type-2` | `PlugType2` | Type 2 connector (IEC 62196-2, "Mennekes"), shown as the vehicle inlet face; the GB/T 20234.2 AC inlet (China) has the same face |
| `plug-ccs2` | `PlugCcs2` | CCS Combo 2 connector (IEC 62196-3, Type 2 with two DC contacts), shown as the vehicle inlet face |
| `plug-chademo` | `PlugChademo` | CHAdeMO DC connector (IEC 62196-3 configuration AA, JEVS G105), shown as the vehicle inlet face |
| `plug-schuko` | `PlugSchuko` | Schuko socket (CEE 7/3, DIN 49440, household AC), shown as the socket face seen from the front |
| `plug-type-1` | `PlugType1` | Type 1 AC connector (SAE J1772, IEC 62196-2 Type 1; North America, Japan), shown as the vehicle inlet face |
| `plug-ccs1` | `PlugCcs1` | CCS Combo 1 connector (IEC 62196-3 configuration EE, SAE J1772 Type 1 with two DC contacts; North America), shown as the vehicle inlet face |
| `plug-nacs` | `PlugNacs` | NACS connector (SAE J3400, North American Charging Standard; AC and DC through the same two power contacts), shown as the vehicle inlet face |
| `plug-gbt-dc` | `PlugGbtDc` | GB/T DC connector (GB/T 20234.3, China; DC fast charging with the contacts DC+, DC−, PE, S+, S−, CC1, CC2, A+, A−), shown as the vehicle inlet face |
| `plug-mcs` | `PlugMcs` | MCS connector (Megawatt Charging System, SAE J3271 / IEC 63379; DC charging for trucks and buses with the contacts DC+, DC−, PE and four communication and detection contacts), shown as the vehicle inlet face |
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
| `register-verified` | `RegisterVerified` | Listed in an official charging point register, e.g. the national register kept by the regulator (data from the authority, not from users) |
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
| `charging-power-level` | `ChargingPowerLevel` | Charging power level: the charging power shown on a scale (kW display, power filter) |
| `charging-session` | `ChargingSession` | Charging session in progress: the vehicle is charging right now (live session) |
| `power-outage` | `PowerOutage` | Power outage: no grid power at the site, the charging point has no electricity |
| `charging-time` | `ChargingTime` | Charging time: how long a charging session takes, or a time-based tariff |

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
| `marker-queue` | `MarkerQueue` | Hourglass | Map marker: drivers are queuing for the charging point, expect a wait |
| `marker-reserved` | `MarkerReserved` | Letter R | Map marker: the charging point is reserved for a booking |
| `marker-cluster` | `MarkerCluster` | Empty head | Map marker for a cluster of charging points; the app draws the count in the head |

## Map markers

The first `<path>` of every `marker-*` icon is the pin, so markers can be drawn filled with CSS: the pin in your colour, the sign in white.

```css
.marker svg > path:first-of-type { fill: currentColor; }
.marker svg > :not(path:first-of-type) { stroke: #fff; }
.marker svg > [fill] { fill: #fff; }
```

Use `path:first-of-type`, not `:first-child`: with `title`, the component renders a `<title>` as the first child. The third rule turns the solid bolt of `marker-charging` white: since 0.7.0 every lightning bolt is solid and carries `fill="currentColor"`. For map libraries that draw images (MapLibre `addImage`), see the [recipe in the repository README](https://github.com/evicons/evicons#map-markers).

For a cluster, use `marker-cluster`, the empty pin, and draw the count in its head; for the selected station, draw its own marker larger (40 px instead of 32) and with a white ring, not only in another colour. The repository README shows both, for MapLibre, Leaflet and React, under [Clusters and selection](https://github.com/evicons/evicons#clusters-and-selection).

## Compatibility

| | Supported |
|---|---|
| React | 18 and 19 (peer dependency `^18.0.0 \|\| ^19.0.0`) |
| Server rendering | Node.js 20 or later (tested on 20 and 24); works in React Server Components, no `'use client'` needed |
| Module format | ESM only, no CommonJS build; `require()` works on Node.js versions with `require(esm)` (20.19+, 22.12+) |
| TypeScript | Types included |

## License

MIT
