// JOSM map paint style (https://josm.openstreetmap.de/wiki/Help/Styles/MapCSSImplementation), served at
// /josm/evicons.mapcss, /josm/icons/<name>.svg and, bundled, /josm/evicons.zip. Generated at build time from the
// icon sources: the SVGs and the `osm` tags of their metadata. Server only (node:zlib).
import { crc32, deflateRawSync } from 'node:zlib'

/** What the generator needs of an icon: its SVG source and its OpenStreetMap tags (`osm` in the metadata). */
export interface JosmIconSource {
  svg: string
  osm: string[]
}

export interface JosmStyleInput {
  icons: Record<string, JosmIconSource>
  /** Package version, for the style's `version` (`<version>_<date>`). */
  version: string
  /** Build date, `YYYY-MM-DD`. */
  date: string
}

export interface JosmStyle {
  mapcss: string
  /** The baked icons, by path relative to the style (`icons/<name>.svg`). */
  icons: Record<string, string>
}

/** Pin colours of the station markers: the site's map demo (global.css `--accent`, `--status-*`). */
export const STATION_MARKERS = {
  'marker-ac': '#2563eb',
  'marker-dc': '#2563eb',
  'marker-unknown': '#0891b2',
  'marker-out-of-service': '#71717a',
} as const

/** Line colour of the connector icons on charge points (global.css `--map-cluster`). */
export const CONNECTOR_INK = '#1e293b'

/** Station markers in px; charge point icons in px. */
export const MARKER_SIZE = 32
export const CONNECTOR_SIZE = 24

/**
 * The pin is not offset: JOSM centres an icon on the node and selects a node only within a few px of it, so the
 * pin head (centre (12, 12) of 24, the icon centre) sits on the node, as JOSM's own icons do.
 * Node labels start right of the head: it reaches x = 22.25 of 24 (radius 9.5 plus half the stroke), that is
 * (22.25 - 12) / 24 of the size right of the node. A right-aligned JOSM label starts 5 px right of its offset
 * (the right half of the 5 px node box, 3 px, plus 2 px); the label then starts 2 px clear of the pin.
 */
const LABEL_OFFSET_X = Math.round(((22.25 - 12) * MARKER_SIZE) / 24) + 2 - 5

/** Area labels: centred below the pin, whose corner reaches 9.5 units plus half the stroke below the centre. */
const AREA_LABEL_OFFSET_Y = -(Math.round(((9.5 + 0.75) * MARKER_SIZE) / 24) + 8)

/**
 * A socket value that counts: `yes` or a count of sockets, also the `;`-separated form (`6;3`, OSM wiki
 * Tag:amenity=charging_station), with at least one non-zero digit. `0` and `no` do not count.
 * Written for JOSM's regex token: no backslash escapes (`[0-9]`, not `\d`).
 */
export const SOCKET_COUNT = '^(yes|[0-9;]*[1-9][0-9;]*)$'

/** A `socket:<type>` key, without sub-keys such as `socket:type2:output` (as in the docs' `socketIcons`). */
export const SOCKET_KEY = '^socket:[a-z0-9_]+$'

/**
 * Socket types that make a station DC. Most mapped NACS sockets are Tesla Superchargers, so `nacs` counts as
 * DC (NACS also carries AC, at destination chargers). `chaoji` has no icon yet; `tesla_supercharger` is the
 * discouraged older key for Superchargers, still on many stations, and DC.
 */
export const DC_SOCKETS = [
  'type2_combo',
  'type1_combo',
  'chademo',
  'gb_dc',
  'mcs',
  'nacs',
  'chaoji',
  'tesla_supercharger',
] as const

/** DC socket types that are not (yet) in the icon metadata. */
export const DC_SOCKETS_WITHOUT_ICON = ['chaoji', 'tesla_supercharger'] as const

/**
 * Charge points show the connector of their first socket in this order (highest power and most specific first);
 * anything else, or no socket tag, gets `charging-plug`. Every icon with `socket:*` tags must be listed here:
 * the keys come from its metadata.
 */
export const CONNECTOR_PRIORITY = [
  'plug-mcs',
  'plug-ccs2',
  'plug-ccs1',
  'plug-chademo',
  'plug-gbt-dc',
  'plug-nacs',
  'plug-type-2',
  'plug-type-1',
  'plug-cee-red',
  'plug-cee-blue',
  'plug-schuko',
] as const

export const CONNECTOR_FALLBACK = 'charging-plug'

/** Zoom levels (JOSM's scale, about the slippy-map zoom): stations from 14, labels from 16, charge points from 17. */
export const ZOOM = { stations: 14, labels: 16, chargePoints: 17 } as const

const LINE = 'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"'
/** The standard pin, the first `<path>` of every marker (design guide section 9). */
const PIN = 'M2.5 21.5V12a9.5 9.5 0 1 1 9.5 9.5Z'

/** The shape elements of an icon: every child of the root `<svg>`, each a self-closing element. */
function shapes(name: string, svg: string): { tag: string; attrs: string }[] {
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const found = [...inner.matchAll(/<([a-z]+)\s([^>]*?)\s*\/>/g)].map((m) => ({ tag: m[1]!, attrs: m[2]! }))
  const rest = inner.replace(/<([a-z]+)\s([^>]*?)\s*\/>/g, '').trim()
  if (found.length === 0 || rest !== '') throw new Error(`${name}: expected only self-closing shape elements`)
  for (const { attrs } of found) {
    if (/\b(fill|stroke|style|class|transform)=/.test(attrs)) throw new Error(`${name}: shape with its own paint or transform`)
  }
  return found
}

/**
 * Every shape carries its paint as attributes: JOSM renders SVG with its own renderer, so nothing relies on
 * `currentColor`, CSS or inheritance from the root.
 */
const shape = ({ tag, attrs }: { tag: string; attrs: string }, paint: string) => `  <${tag} ${attrs} ${paint}/>`

/** A station marker filled like the site's map demo: the pin in `colour`, the sign in white. */
export function bakeMarker(name: string, svg: string, colour: string): string {
  const [pin, ...sign] = shapes(name, svg)
  if (!pin || pin.tag !== 'path' || pin.attrs !== `d="${PIN}"`) throw new Error(`${name}: the first shape is not the pin`)
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}" viewBox="0 0 24 24">`,
    shape(pin, `fill="${colour}" stroke="${colour}" ${LINE}`),
    ...sign.map((s) => shape(s, `fill="none" stroke="#fff" ${LINE}`)),
    '</svg>',
    '',
  ].join('\n')
}

/**
 * Scale of the connector inside its disc: at 0.75 the dense faces (CCS2, Type 2) smear at 24 px; 0.85 keeps their
 * contacts apart and still clears the ring.
 */
const CONNECTOR_SCALE = 0.85
const CONNECTOR_SHIFT = Math.round((12 - 12 * CONNECTOR_SCALE) * 1000) / 1000

/**
 * A connector icon for a charge point: the line icon in dark ink, at CONNECTOR_SCALE on a white disc with a thin
 * ink ring, so it reads on light map tiles and on aerial imagery alike.
 */
export function bakeConnector(name: string, svg: string): string {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CONNECTOR_SIZE}" height="${CONNECTOR_SIZE}" viewBox="0 0 24 24">`,
    `  <circle cx="12" cy="12" r="11.5" fill="#fff" stroke="${CONNECTOR_INK}" stroke-width="0.75"/>`,
    `  <g transform="matrix(${CONNECTOR_SCALE} 0 0 ${CONNECTOR_SCALE} ${CONNECTOR_SHIFT} ${CONNECTOR_SHIFT})">`,
    ...shapes(name, svg).map((s) => `  ${shape(s, `fill="none" stroke="${CONNECTOR_INK}" ${LINE}`)}`),
    '  </g>',
    '</svg>',
    '',
  ].join('\n')
}

/** The `socket:*` keys of each connector icon in CONNECTOR_PRIORITY, from its metadata. */
export function connectorSockets(icons: Record<string, JosmIconSource>): [string, string[]][] {
  const withSockets = Object.entries(icons)
    .filter(([name]) => name !== CONNECTOR_FALLBACK)
    .filter(([, icon]) => icon.osm.some((tag) => tag.startsWith('socket:')))
    .map(([name]) => name)
  const unlisted = withSockets.filter((name) => !(CONNECTOR_PRIORITY as readonly string[]).includes(name))
  if (unlisted.length > 0) throw new Error(`Add ${unlisted.join(', ')} to CONNECTOR_PRIORITY (JOSM style)`)
  return CONNECTOR_PRIORITY.map((name) => {
    const icon = icons[name]
    if (!icon) throw new Error(`CONNECTOR_PRIORITY lists ${name}, which is not an icon`)
    const keys = icon.osm.filter((tag) => /^socket:[a-z0-9_]+$/.test(tag))
    if (keys.length === 0) throw new Error(`${name} has no socket:* tag in its metadata`)
    return [name, keys]
  })
}

const sel = (types: string[], zoom: number, conditions: string, layer = '') =>
  types.map((type) => `${type}|z${zoom}-${conditions}${layer}`)
const rule = (selectors: string[], body: string[]) =>
  `${selectors.join(',\n')} {\n${body.map((line) => `    ${line}`).join('\n')}\n}`
const STATION = '[amenity=charging_station]'
const DISUSED = '["disused:amenity"=charging_station]'
const BOTH = ['node', 'area']
const LABEL = '::evicons_label'

export function buildJosmStyle({ icons, version, date }: JosmStyleInput): JosmStyle {
  const svgOf = (name: string) => {
    const icon = icons[name]
    if (!icon) throw new Error(`JOSM style: no icon ${name}`)
    return icon.svg
  }
  const sockets = connectorSockets(icons)
  const baked: Record<string, string> = {}
  for (const [name, colour] of Object.entries(STATION_MARKERS)) baked[`icons/${name}.svg`] = bakeMarker(name, svgOf(name), colour)
  for (const name of [...CONNECTOR_PRIORITY, CONNECTOR_FALLBACK]) baked[`icons/${name}.svg`] = bakeConnector(name, svgOf(name))

  const dcKeys = `/^socket:(${DC_SOCKETS.join('|')})$/`
  const count = `/${SOCKET_COUNT}/`
  const pin = (name: keyof typeof STATION_MARKERS) => [
    `icon-image: "icons/${name}.svg";`,
    `icon-width: ${MARKER_SIZE};`,
    `icon-height: ${MARKER_SIZE};`,
  ]
  const outputLabel = `[setting("evicons_output_label")]`
  const firstValue = (key: string) => `text: eval(get(split(";", tag("${key}")), 0));`
  // Output labels from the lowest to the highest priority: a later rule overrides the text of an earlier one.
  // Only a socket type that counts gives its output (socket:chademo=0 with socket:chademo:output=50 kW does not).
  const socketOutputs = [...sockets]
    .flatMap(([, keys]) => keys)
    .reverse()
    .map((key) =>
      rule(sel(BOTH, ZOOM.labels, `${STATION}["${key}"=~${count}]["${key}:output"]${outputLabel}`, LABEL), [firstValue(`${key}:output`)]),
    )

  const mapcss = `/*
 * EVicons: EV charging, a JOSM map paint style.
 * EV charging stations and charge points drawn with EVicons (https://evicons.dev), MIT licence, Landolsi Digital.
 * An add-on style: it draws only charging stations and charge points, on top of your base style.
 * Generated from the EVicons sources (icons and their OpenStreetMap tags); do not edit by hand.
 */

meta {
    title: "EVicons: EV charging";
    description: "EV charging stations and charge points drawn with EVicons: AC/DC markers, stations without socket data highlighted, connector icons on charge points.";
    author: "Landolsi Digital";
    version: "${version}_${date}";
    link: "https://evicons.dev/docs#josm-map-style";
    /* r11730: icons on areas (icon-position); also used: regex key and value conditions (r8874),
       style settings (r7450). */
    min-josm-version: 11730;
    icon: "icons/marker-dc.svg";
}

setting::evicons_output_label {
    type: boolean;
    label: tr("EVicons: label stations with their output (or capacity)");
    default: true;
}

setting::evicons_socket_hint {
    type: boolean;
    label: tr("EVicons: mark stations without socket data (socket?)");
    default: true;
}

/*
 * Charging stations: the EVicons map pin, ${MARKER_SIZE} px, its head on the node as JOSM's own icons are (JOSM
 * selects a node only within a few px of it). Areas get the pin at their centre once it fits on screen.
 * Rules further down override the pin: no socket data,
 * then AC, then DC (DC wins), then disused. evicons_kind tells the label layer which pin was chosen.
 */
${rule(sel(BOTH, ZOOM.stations, STATION), [...pin('marker-unknown'), 'evicons_kind: "unknown";'])}

${rule(sel(['area'], ZOOM.stations, STATION), ['icon-position: center;'])}

/* AC: any socket:<type> key (not socket:<type>:output) whose value is a count above 0 or yes; 0 and no do not count. */
${rule(sel(BOTH, ZOOM.stations, `${STATION}[/${SOCKET_KEY}/ =~ ${count}]`), ['icon-image: "icons/marker-ac.svg";', 'evicons_kind: "ac";'])}

/* DC wins over AC: a DC socket type, or frequency=0. NACS counts as DC: most mapped NACS sockets are
   Tesla Superchargers. tesla_supercharger is the discouraged older key for them. */
${rule(
  [...sel(BOTH, ZOOM.stations, `${STATION}[${dcKeys} =~ ${count}]`), ...sel(BOTH, ZOOM.stations, `${STATION}[frequency=0]`)],
  ['icon-image: "icons/marker-dc.svg";', 'evicons_kind: "dc";'],
)}

/* Disused stations (lifecycle prefix). operational_status=closed is not handled; the wiki recommends the disused: prefix. */
${rule(sel(BOTH, ZOOM.stations, DISUSED), [...pin('marker-out-of-service'), 'evicons_kind: "out_of_service";'])}

${rule(sel(['area'], ZOOM.stations, DISUSED), ['icon-position: center;'])}

/*
 * Labels, in their own layer so the base style's name label stays (JOSM puts that one below and right of the pin).
 * Nodes: right of the pin head, from zoom ${ZOOM.labels} (JOSM starts a right-aligned label 5 px right of the offset).
 * Areas: centred below the pin. The text is the station output (charging_station:output), else the output of its
 * highest-priority socket type that counts (first value), else the capacity; stations without socket data say
 * "socket?" instead.
 */
${rule(sel(BOTH, ZOOM.labels, STATION, LABEL), [
  'font-size: 10;',
  `text-color: ${CONNECTOR_INK};`,
  'text-halo-radius: 1.5;',
  'text-halo-color: #ffffff;',
])}

${rule(sel(['node'], ZOOM.labels, STATION, LABEL), [
  'text-anchor-horizontal: right;',
  'text-anchor-vertical: center;',
  `text-offset-x: ${LABEL_OFFSET_X};`,
  'text-offset-y: 0;',
])}

${rule(sel(['area'], ZOOM.labels, STATION, LABEL), [
  'text-position: center;',
  'text-offset-x: 0;',
  `text-offset-y: ${AREA_LABEL_OFFSET_Y};`,
])}

${rule(sel(BOTH, ZOOM.labels, `${STATION}[capacity]${outputLabel}`, LABEL), ['text: eval(concat("×", tag("capacity")));'])}

${socketOutputs.join('\n\n')}

${rule(sel(BOTH, ZOOM.labels, `${STATION}["charging_station:output"]${outputLabel}`, LABEL), [firstValue('charging_station:output')])}

${rule(sel(BOTH, ZOOM.labels, `${STATION}[setting("evicons_socket_hint")][prop("evicons_kind", "default") == "unknown"]`, LABEL), [
  'text: eval("socket?");',
  `text-color: ${STATION_MARKERS['marker-unknown']};`,
  'font-weight: bold;',
])}

/*
 * Charge points (man_made=charge_point): the connector of the first socket in this order, else charging-plug.
 * Rules go from the lowest to the highest priority: a later rule overrides an earlier one.
 */
${rule(sel(['node'], ZOOM.chargePoints, '[man_made=charge_point]'), [
  `icon-image: "icons/${CONNECTOR_FALLBACK}.svg";`,
  `icon-width: ${CONNECTOR_SIZE};`,
  `icon-height: ${CONNECTOR_SIZE};`,
])}

${[...sockets]
  .reverse()
  .map(([name, keys]) =>
    rule(
      keys.flatMap((key) => sel(['node'], ZOOM.chargePoints, `[man_made=charge_point]["${key}"=~${count}]`)),
      [`icon-image: "icons/${name}.svg";`],
    ),
  )
  .join('\n\n')}
`
  return { mapcss, icons: baked }
}

/** Fixed entry date and time (1980-01-01 00:00, the earliest DOS date), so the same input gives the same bytes. */
const DOS_DATE = (0 << 9) | (1 << 5) | 1
const DOS_TIME = 0

/** A minimal ZIP archive (deflate, no extra fields), entries in the given order. */
export function zip(entries: [string, string | Uint8Array][]): Uint8Array {
  const locals: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  for (const [name, content] of entries) {
    const data = typeof content === 'string' ? Buffer.from(content, 'utf8') : Buffer.from(content)
    const packed = deflateRawSync(data, { level: 9 })
    const nameBytes = Buffer.from(name, 'utf8')
    const crc = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4) // version needed: 2.0 (deflate)
    local.writeUInt16LE(0x0800, 6) // names are UTF-8
    local.writeUInt16LE(8, 8) // deflate
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(packed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    local.writeUInt16LE(0, 28)
    locals.push(local, nameBytes, packed)

    const entry = Buffer.alloc(46)
    entry.writeUInt32LE(0x02014b50, 0)
    entry.writeUInt16LE(20, 4) // made by: MS-DOS, 2.0 (no Unix permissions)
    entry.writeUInt16LE(20, 6)
    entry.writeUInt16LE(0x0800, 8)
    entry.writeUInt16LE(8, 10)
    entry.writeUInt16LE(DOS_TIME, 12)
    entry.writeUInt16LE(DOS_DATE, 14)
    entry.writeUInt32LE(crc, 16)
    entry.writeUInt32LE(packed.length, 20)
    entry.writeUInt32LE(data.length, 24)
    entry.writeUInt16LE(nameBytes.length, 28)
    // extra length, comment length, disk number, internal and external attributes: 0
    entry.writeUInt32LE(offset, 42)
    central.push(entry, nameBytes)
    offset += local.length + nameBytes.length + packed.length
  }
  const size = central.reduce((sum, b) => sum + b.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(size, 12)
  end.writeUInt32LE(offset, 16)
  return new Uint8Array(Buffer.concat([...locals, ...central, end]))
}

/** The archive JOSM loads: the style at the root, the icons under `icons/`. */
export function josmZip(style: JosmStyle): Uint8Array {
  return zip([['evicons.mapcss', style.mapcss], ...Object.entries(style.icons).sort(([a], [b]) => a.localeCompare(b, 'en'))])
}
