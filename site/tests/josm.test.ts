// The JOSM map paint style (site/src/lib/josm.ts). JOSM itself does not run here: the generated MapCSS is checked
// as text and run through a small interpreter of the constructs it uses, which stops at any other construct.
import { readFileSync } from 'node:fs'
import { crc32, inflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  CONNECTOR_FALLBACK,
  CONNECTOR_INK,
  CONNECTOR_PRIORITY,
  DC_SOCKETS,
  DC_SOCKETS_WITHOUT_ICON,
  STATION_MARKERS,
  bakeConnector,
  bakeMarker,
  buildJosmStyle,
  josmZip,
  type JosmIconSource,
} from '../src/lib/josm'
import { josmStyle } from '../src/lib/josm-source'

const pkg = new URL('../../packages/svg/', import.meta.url)
const meta = JSON.parse(readFileSync(new URL('icons.json', pkg), 'utf8')) as Record<string, { osm?: string[] }>
const icons: Record<string, JosmIconSource> = Object.fromEntries(
  Object.entries(meta).map(([name, m]) => [name, { svg: readFileSync(new URL(`svg/${name}.svg`, pkg), 'utf8'), osm: m.osm ?? [] }]),
)
const style = buildJosmStyle({ icons, version: '0.6.0', date: '2026-11-04' })
const { mapcss } = style

/** The socket keys of the metadata and their icons (`socket:unknown` is the fallback, not a key to match). */
const socketTags = Object.entries(meta).flatMap(([name, m]) =>
  (m.osm ?? []).filter((tag) => tag.startsWith('socket:') && tag !== 'socket:unknown').map((tag) => [tag, name] as const),
)

/** Entries of a ZIP archive, read through its central directory, with CRC and sizes checked. */
function unzip(bytes: Uint8Array): Map<string, Buffer> {
  const buf = Buffer.from(bytes)
  const end = buf.length - 22
  expect(buf.readUInt32LE(end)).toBe(0x06054b50)
  const count = buf.readUInt16LE(end + 10)
  let at = buf.readUInt32LE(end + 16)
  const files = new Map<string, Buffer>()
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(at)).toBe(0x02014b50)
    const method = buf.readUInt16LE(at + 10)
    const crc = buf.readUInt32LE(at + 16)
    const packed = buf.readUInt32LE(at + 20)
    const size = buf.readUInt32LE(at + 24)
    const nameLength = buf.readUInt16LE(at + 28)
    const extra = buf.readUInt16LE(at + 30) + buf.readUInt16LE(at + 32)
    const local = buf.readUInt32LE(at + 42)
    const name = buf.toString('utf8', at + 46, at + 46 + nameLength)
    expect(buf.readUInt32LE(local)).toBe(0x04034b50)
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
    const data = method === 8 ? inflateRawSync(buf.subarray(start, start + packed)) : buf.subarray(start, start + packed)
    expect(data.length, name).toBe(size)
    expect(crc32(data) >>> 0, name).toBe(crc)
    files.set(name, data)
    at += 46 + nameLength + extra
  }
  return files
}

// --- A small MapCSS interpreter: exactly the constructs the generator writes, nothing else. ---

type Tags = Record<string, string>
interface Env {
  tags: Tags
  zoom: number
  settings: Record<string, boolean>
  layers: Map<string, Map<string, string>>
}
type Condition = (env: Env) => boolean
interface Selector {
  type: string
  minZoom: number
  conditions: Condition[]
  layer: string
}

const conditionForms: [RegExp, (m: RegExpMatchArray) => Condition][] = [
  [/^\[\/([^ ]+)\/ =~ \/([^ ]+)\/\]/, ([, k, v]) => ({ tags }) => Object.entries(tags).some(([key, value]) => new RegExp(k!).test(key) && new RegExp(v!).test(value))],
  [/^\["([^"]+)"=~\/([^ ]+?)\/\]/, ([, k, v]) => ({ tags }) => tags[k!] !== undefined && new RegExp(v!).test(tags[k!]!)],
  [/^\[(?:"([^"]+)"|([a-z_]+))=([a-z_0-9]+)\]/, ([, q, k, v]) => ({ tags }) => tags[(q ?? k)!] === v],
  [/^\[(?:"([^"]+)"|([a-z_]+))\]/, ([, q, k]) => ({ tags }) => tags[(q ?? k)!] !== undefined],
  [/^\[setting\("([a-z_]+)"\)\]/, ([, name]) => ({ settings }) => settings[name!] === true],
  [/^\[prop\("([a-z_]+)", "([a-z_]+)"\) == "([a-z_]+)"\]/, ([, prop, layer, value]) => ({ layers }) => layers.get(layer!)?.get(prop!) === JSON.stringify(value)],
]

function parseSelector(text: string): Selector {
  const head = /^(node|area)\|z(\d+)-/.exec(text)
  if (!head) throw new Error(`Unsupported selector: ${text}`)
  let rest = text.slice(head[0].length)
  const conditions: Condition[] = []
  let layer = 'default'
  while (rest) {
    const sub = /^::([a-z_]+)$/.exec(rest)
    if (sub) {
      layer = sub[1]!
      break
    }
    const form = conditionForms.map(([re, make]) => [re.exec(rest), make] as const).find(([m]) => m)
    if (!form) throw new Error(`Unsupported condition in: ${text}`)
    conditions.push(form[1](form[0]!))
    rest = rest.slice(form[0]![0].length)
  }
  return { type: head[1]!, minZoom: Number(head[2]), conditions, layer }
}

/** Evaluates the expressions of `text`: string literals, numbers and eval, concat, tag, get, split, any. */
function evaluate(expr: string, tags: Tags): unknown {
  let at = 0
  const ws = () => {
    while (expr[at] === ' ') at++
  }
  const parse = (): unknown => {
    ws()
    if (expr[at] === '"') {
      const end = expr.indexOf('"', at + 1)
      if (end < 0) throw new Error(`Unterminated string in: ${expr}`)
      const value = expr.slice(at + 1, end)
      at = end + 1
      return value
    }
    const num = /^\d+/.exec(expr.slice(at))
    if (num) {
      at += num[0].length
      return Number(num[0])
    }
    const fn = /^([a-z_]+)\(/.exec(expr.slice(at))
    if (!fn) throw new Error(`Unsupported expression: ${expr}`)
    at += fn[0].length
    const args: unknown[] = []
    ws()
    while (expr[at] !== ')') {
      if (at >= expr.length) throw new Error(`Unclosed call in: ${expr}`)
      args.push(parse())
      ws()
      if (expr[at] === ',') at++
    }
    at++
    switch (fn[1]) {
      case 'eval':
        return args[0]
      case 'concat':
        return args.join('')
      case 'tag':
        return tags[args[0] as string] ?? null
      case 'split':
        return (args[1] as string).split(args[0] as string)
      case 'get':
        return (args[0] as string[])[args[1] as number]
      case 'any':
        return args.find((a) => a !== null) ?? null
      default:
        throw new Error(`Unsupported function ${fn[1]}`)
    }
  }
  const value = parse()
  if (at !== expr.length) throw new Error(`Trailing input in: ${expr}`)
  return value
}

const rules = mapcss
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split(/\n(?=\S)/)
  .join('\n')
  .match(/[^{}]+\{[^{}]*\}/g)!
  .map((block) => {
    const [selectorText, body] = block.split('{') as [string, string]
    const declarations = body
      .replace(/\}$/, '')
      .split('\n')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        // One declaration per line: `key: value;` (a `;` inside a string, as in split(";", ...), stays).
        if (!d.endsWith(';')) throw new Error(`Declaration without a closing semicolon: ${d}`)
        return [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1, -1).trim()] as const
      })
    return { selectors: selectorText.trim().split(/,\s*\n/), declarations }
  })
  .filter(({ selectors }) => !/^(meta|setting::)/.test(selectors[0]!))
  .map(({ selectors, declarations }) => ({ selectors: selectors.map(parseSelector), declarations }))

interface Rendered {
  icon?: string
  label?: string
  default: Map<string, string>
}

/** The style for one object (`node` or `area`), applying the rules in order as JOSM does. */
function render(type: 'node' | 'area', tags: Tags, zoom = 18, settings = { evicons_output_label: true, evicons_socket_hint: true }): Rendered {
  const env: Env = { tags, zoom, settings, layers: new Map() }
  for (const { selectors, declarations } of rules) {
    const match = selectors.find((s) => s.type === type && zoom >= s.minZoom && s.conditions.every((c) => c(env)))
    if (!match) continue
    const layer = env.layers.get(match.layer) ?? new Map<string, string>()
    env.layers.set(match.layer, layer)
    for (const [key, value] of declarations) layer.set(key, value)
  }
  const def = env.layers.get('default') ?? new Map<string, string>()
  const text = env.layers.get('evicons_label')?.get('text')
  return {
    icon: def.get('icon-image')?.replace(/^"icons\/(.+)\.svg"$/, '$1'),
    label: text === undefined ? undefined : String(evaluate(text, tags)),
    default: def,
  }
}

const station = (tags: Tags = {}) => ({ amenity: 'charging_station', ...tags })
const chargePoint = (tags: Tags = {}) => ({ man_made: 'charge_point', ...tags })

describe('JOSM style', () => {
  it('starts with the meta block', () => {
    expect(mapcss).toContain(`meta {
    title: "EVicons: EV charging";
    description: "EV charging stations and charge points drawn with EVicons: AC/DC markers, stations without socket data highlighted, connector icons on charge points.";
    author: "Landolsi Digital";
    version: "0.6.0_2026-11-04";
    link: "https://evicons.dev/docs#josm-map-style";`)
    expect(mapcss).toMatch(/\n {4}min-josm-version: \d+;\n {4}icon: "icons\/marker-dc\.svg";\n\}/)
    expect(mapcss.indexOf('meta {')).toBeLessThan(mapcss.indexOf('setting::'))
    expect(mapcss).not.toMatch(/\bcanvas\b/) // an add-on: the base style keeps the canvas
  })

  it('declares both settings, on by default', () => {
    for (const name of ['evicons_output_label', 'evicons_socket_hint']) {
      expect(mapcss).toMatch(new RegExp(`setting::${name} \\{\\n {4}type: boolean;\\n {4}label: tr\\("[^"]+"\\);\\n {4}default: true;\\n\\}`))
    }
  })

  it('bundles every icon it references, and only those', () => {
    const files = unzip(josmZip(style))
    expect([...files.keys()][0]).toBe('evicons.mapcss')
    expect(files.get('evicons.mapcss')!.toString('utf8')).toBe(mapcss)
    const referenced = new Set([...mapcss.matchAll(/(?:icon-image|icon): "(icons\/[a-z0-9-]+\.svg)"/g)].map((m) => m[1]!))
    expect([...referenced].sort()).toEqual(Object.keys(style.icons).sort())
    for (const path of referenced) expect(files.get(path)?.toString('utf8'), path).toBe(style.icons[path])
    expect(files.size).toBe(referenced.size + 1)
  })

  it('builds the same zip bytes twice', () => {
    const again = buildJosmStyle({ icons, version: '0.6.0', date: '2026-11-04' })
    expect(Buffer.from(josmZip(again)).equals(Buffer.from(josmZip(style)))).toBe(true)
  })

  it('maps every socket key of the metadata in the charge point rules', () => {
    expect(socketTags.length).toBeGreaterThan(10)
    for (const [tag, name] of socketTags) {
      expect(mapcss, tag).toContain(`node|z17-[man_made=charge_point]["${tag}"=~`)
      expect(render('node', chargePoint({ [tag]: '1' })).icon, tag).toBe(name)
    }
    // Every connector icon with socket tags has a place in the priority list.
    expect(new Set(socketTags.map(([, name]) => name))).toEqual(new Set(CONNECTOR_PRIORITY))
  })

  it('picks the connector of the first socket in priority order', () => {
    expect(render('node', chargePoint({ 'socket:mcs': '1', 'socket:type2_combo': '1' })).icon).toBe('plug-mcs')
    expect(render('node', chargePoint({ 'socket:type2': '1', 'socket:type2_combo': '2' })).icon).toBe('plug-ccs2')
    expect(render('node', chargePoint({ 'socket:schuko': 'yes', 'socket:cee_blue': '1' })).icon).toBe('plug-cee-blue')
    expect(render('node', chargePoint({ 'socket:type2': '0', 'socket:type1': '1' })).icon).toBe('plug-type-1')
    expect(render('node', chargePoint({ 'socket:type3c': '1' })).icon).toBe(CONNECTOR_FALLBACK)
    expect(render('node', chargePoint()).icon).toBe(CONNECTOR_FALLBACK)
    expect(render('node', chargePoint({ 'socket:type2_combo': '1' }), 16).icon).toBeUndefined()
    expect(render('area', chargePoint({ 'socket:type2_combo': '1' })).icon).toBeUndefined()
  })

  it('lists the DC socket types, and AC is any other socket type', () => {
    expect([...DC_SOCKETS]).toEqual(['type2_combo', 'type1_combo', 'chademo', 'gb_dc', 'mcs', 'nacs', 'chaoji', 'tesla_supercharger'])
    expect(mapcss).toContain('[/^socket:(type2_combo|type1_combo|chademo|gb_dc|mcs|nacs|chaoji|tesla_supercharger)$/ =~ ')
    expect(mapcss).toContain('[/^socket:[a-z0-9_]+$/ =~ ')
    // The DC types with an icon are keys of the metadata (a renamed key would fail here).
    const keys = new Set(socketTags.map(([tag]) => tag))
    for (const type of DC_SOCKETS.filter((t) => !(DC_SOCKETS_WITHOUT_ICON as readonly string[]).includes(t))) {
      expect(keys.has(`socket:${type}`), type).toBe(true)
    }
    for (const type of DC_SOCKETS) expect(render('node', station({ [`socket:${type}`]: '2' })).icon, type).toBe('marker-dc')
    const ac = [...keys].filter((key) => !(DC_SOCKETS as readonly string[]).includes(key.slice('socket:'.length)))
    expect(ac).toContain('socket:type2')
    for (const key of [...ac, 'socket:type3a', 'socket:type3c', 'socket:typee']) {
      expect(render('node', station({ [key]: '1' })).icon, key).toBe('marker-ac')
    }
  })

  it('classifies stations: DC wins, 0 and no do not count, no socket data is unknown', () => {
    const cases: [Tags, string][] = [
      [{ 'socket:type2_combo': '4', 'socket:type2_combo:output': '300 kW' }, 'marker-dc'],
      [{ 'socket:type2': '2' }, 'marker-ac'],
      [{ 'socket:type2': '2', 'socket:chademo': '1' }, 'marker-dc'],
      [{ 'socket:type2': 'yes' }, 'marker-ac'],
      [{ 'socket:type2_combo': '6;3' }, 'marker-dc'],
      [{}, 'marker-unknown'],
      [{ 'socket:type2': '0' }, 'marker-unknown'],
      [{ 'socket:type2': 'no', 'socket:chademo': '0' }, 'marker-unknown'],
      [{ 'socket:type2:output': '22 kW' }, 'marker-unknown'],
      [{ frequency: '0' }, 'marker-dc'],
      [{ frequency: '50' }, 'marker-unknown'],
      [{ 'socket:type2': '1', frequency: '0' }, 'marker-dc'],
    ]
    for (const [tags, icon] of cases) {
      expect(render('node', station(tags)).icon, JSON.stringify(tags)).toBe(icon)
      expect(render('area', station(tags)).icon, JSON.stringify(tags)).toBe(icon)
    }
    expect(render('node', { 'disused:amenity': 'charging_station', 'socket:type2': '2' }).icon).toBe('marker-out-of-service')
    expect(render('node', station({ 'socket:type2': '1' }), 13).icon).toBeUndefined()
    expect(render('node', { amenity: 'fuel', 'socket:type2': '1' }).icon).toBeUndefined()
  })

  it('puts the pin head on the node (no offset) and centres area icons', () => {
    // JOSM selects a node only within a few px of it: the head centre (12, 12) is the icon centre, on the node.
    const pin = render('node', station({ 'socket:type2': '1' })).default
    expect(pin.get('icon-width')).toBe('32')
    expect(pin.get('icon-height')).toBe('32')
    expect(mapcss).not.toContain('icon-offset')
    expect(render('area', station()).default.get('icon-position')).toBe('center')
    expect(render('node', { 'disused:amenity': 'charging_station' }).default.get('icon-width')).toBe('32')
  })

  it('labels the output, else the capacity, and marks stations without socket data', () => {
    expect(render('node', station({ 'socket:type2_combo': '2', 'socket:type2_combo:output': '150 kW', 'charging_station:output': '300 kW' })).label).toBe('300 kW')
    expect(render('node', station({ 'socket:type2': '2', 'socket:type2:output': '22 kW', 'socket:type2_combo': '1', 'socket:type2_combo:output': '50 kW;150 kW' })).label).toBe('50 kW')
    expect(render('node', station({ 'socket:cee_red_32a': '1', 'socket:cee_red_32a:output': '22 kW' })).label).toBe('22 kW')
    expect(render('node', station({ 'socket:type2': '2', capacity: '4' })).label).toBe('×4')
    // Only a socket type that counts gives its output.
    expect(render('node', station({ 'socket:type2': '2', 'socket:chademo': '0', 'socket:chademo:output': '50 kW' })).label).toBeUndefined()
    expect(render('node', station({ 'socket:type2': '2', 'socket:type2:output': '22 kW', 'socket:chademo': '0', 'socket:chademo:output': '50 kW' })).label).toBe('22 kW')
    expect(render('node', station({ 'socket:type2': '0', 'socket:type2:output': '22 kW', 'socket:type2_cable': '1', 'socket:type2_cable:output': '11 kW' })).label).toBe('11 kW')
    expect(render('node', station({ 'socket:type2': '2' })).label).toBeUndefined()
    expect(render('node', station({ capacity: '2' })).label).toBe('socket?')
    expect(render('node', station({ 'socket:type2': '0' })).label).toBe('socket?')
    expect(render('node', station({ 'socket:type2': '2', capacity: '4' }), 15).label).toBeUndefined()
    const off = { evicons_output_label: false, evicons_socket_hint: false }
    expect(render('node', station({ 'socket:type2': '2', 'charging_station:output': '22 kW' }), 18, off).label).toBeUndefined()
    expect(render('node', station(), 18, off).label).toBeUndefined()
  })

  it('writes regular expressions JOSM can lex (no backslashes, no leading *)', () => {
    // JOSM's REGEX token: characters 0x20-0x29, 0x2B-0x2E, 0x30-0x5B, 0x5D-0x7E, and * after the first one.
    const regexes = [...mapcss.matchAll(/(?:\[|=~ ?)\/([^/]+)\//g)].map((m) => m[1]!)
    expect(regexes.length).toBeGreaterThan(5)
    for (const re of regexes) expect(re, re).toMatch(/^[ -)+-.0-[\]-~][ -)+-.0-[\]-~*]*$/)
    expect(mapcss).not.toMatch(/\/\*[^\n]*\*\/[^\n]*\/\*/) // no stray comment openers on one line
  })

  it('bakes the colours into the icons', () => {
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8')
    const cssVar = (name: string) => new RegExp(`--${name}: (#[0-9a-f]{6});`).exec(css)![1]
    expect(STATION_MARKERS).toEqual({
      'marker-ac': cssVar('accent'),
      'marker-dc': cssVar('accent'),
      'marker-unknown': cssVar('status-unknown'),
      'marker-out-of-service': cssVar('status-out-of-service'),
    })
    for (const [path, svg] of Object.entries(style.icons)) {
      expect(svg, path).not.toContain('currentColor')
      const shapesIn = [...svg.matchAll(/<(path|circle|rect|line|polyline|ellipse)\s[^>]*\/>/g)].map((m) => m[0])
      expect(shapesIn.length, path).toBeGreaterThan(1)
      for (const s of shapesIn) expect(s, path).toMatch(/ fill="[^"]+" stroke="#[0-9a-f]+"/)
    }
    const [pin, sign] = [...style.icons['icons/marker-unknown.svg']!.matchAll(/<path [^>]*\/>/g)].map((m) => m[0])
    expect(pin).toContain('fill="#0891b2" stroke="#0891b2"')
    expect(sign).toContain('fill="none" stroke="#fff"')
    expect(style.icons['icons/marker-dc.svg']).toMatch(/^<svg [^>]*width="32" height="32"/)
    expect(style.icons['icons/plug-ccs2.svg']).toMatch(/^<svg [^>]*width="24" height="24"/)
  })

  it('bakes a solid bolt filled in the sign colour, and refuses any other fill', () => {
    const charging = bakeMarker('marker-charging', icons['marker-charging']!.svg, '#2563eb')
    expect(charging).not.toContain('currentColor')
    const [pin, bolt, ...rest] = [...charging.matchAll(/<path [^>]*\/>/g)].map((m) => m[0])
    expect(rest).toEqual([])
    expect(pin).toContain('fill="#2563eb" stroke="#2563eb"')
    expect(bolt).toBe(
      '<path d="m13.25 6.25-4 6.25h2.5l-1 5.25 4-6.25h-2.5Z" fill="#fff" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    )
    // The same bolt on a connector disc is filled in ink; the line icons stay unfilled.
    const fast = bakeConnector('fast-charging', icons['fast-charging']!.svg)
    expect(fast).toContain(`fill="${CONNECTOR_INK}" stroke="${CONNECTOR_INK}"`)
    expect(fast.match(/fill="none"/g)).toHaveLength(2)
    // fill="currentColor" on a shape that is not a canonical bolt, or another fill, is refused.
    const notBolt = icons['marker-charging']!.svg.replace('<path d="M2.5 21.5', '<path fill="currentColor" d="M2.5 21.5')
    expect(() => bakeMarker('marker-x', notBolt, '#000')).toThrow(/not a solid bolt/)
    const red = icons['marker-charging']!.svg.replace('fill="currentColor"', 'fill="red"')
    expect(() => bakeMarker('marker-x', red, '#000')).toThrow(/own paint/)
  })

  it('refuses a socket icon that has no place in the priority list', () => {
    const extra = { ...icons, 'plug-new': { svg: icons['plug-ccs2']!.svg, osm: ['socket:new'] } }
    expect(() => buildJosmStyle({ icons: extra, version: '0', date: '2026-01-01' })).toThrow(/CONNECTOR_PRIORITY/)
  })

  it('builds from the @evicons/svg package with its version', () => {
    const built = josmStyle()
    const version = (JSON.parse(readFileSync(new URL('package.json', pkg), 'utf8')) as { version: string }).version
    expect(built.style.mapcss).toMatch(new RegExp(`version: "${version.replaceAll('.', '\\.')}_\\d{4}-\\d{2}-\\d{2}";`))
    expect(Buffer.from(built.zip.subarray(0, 2)).toString()).toBe('PK')
  })
})
