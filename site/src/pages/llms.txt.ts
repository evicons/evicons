// /llms.txt (llmstxt.org): a short, plain-text guide to the library for AI assistants and crawlers.
import type { APIRoute } from 'astro'
import { categoryLabels, iconTitles } from '../data/icon-titles'
import { categoryOrder, loadIconDetails, loadIcons } from '../lib/icons'

const site = 'https://evicons.dev'

export const GET: APIRoute = () => {
  const icons = loadIcons()
  const details = loadIconDetails()
  const byCategory = categoryOrder
    .map((category) => {
      const rows = icons
        .filter((icon) => icon.category === category)
        .map((icon) => {
          const title = iconTitles[icon.name]?.en ?? icon.name
          const { meaning, osm } = details[icon.name]!
          const tags = osm.length > 0 ? ` (OpenStreetMap: ${osm.map((tag) => `\`${tag}\``).join(', ')})` : ''
          return `- [${title} (\`${icon.name}\`, React \`${icon.pascal}\`)](${site}/icons/${icon.name}): ${meaning.en}${tags}`
        })
      return `### ${categoryLabels[category].en}\n\n${rows.join('\n')}`
    })
    .join('\n\n')

  const text = `# EVicons

> Open-source (MIT) outline icons for EV charging: connectors, charging stations, charging status, payment and map markers. ${icons.length} icons, 24 × 24, stroke 1.5, \`currentColor\`, no fills. Published by Landolsi Digital.

Use the icons alongside text, not instead of it. General UI icons (arrows, menus, settings) are out of scope; the set covers only electric-vehicle charging. Connector icons show the vehicle inlet seen from the front (the Schuko and CEE sockets show the socket face), drawn from public reference drawings (the standards themselves were not consulted). Status icons carry their meaning in the shape; colour is up to the app.

## Install

- npm: \`@evicons/react\` (React components, tree-shakable, named exports in PascalCase, e.g. \`ChargingStation\`) and \`@evicons/svg\` (plain SVG files, \`sprite.svg\` and \`icons.json\` with metadata).
- Every icon as a file: \`${site}/svg/<name>.svg\`.
- Machine-readable index of all icons with metadata, SVG markup and URLs: ${site}/icons.json

## Docs

- [Usage, props, colour, accessibility](${site}/docs)
- [OpenStreetMap: pick icons from \`amenity=charging_station\` and \`socket:*\` tags](${site}/docs#openstreetmap); tag → icon index: \`@evicons/svg/osm.json\`
- [Gallery with search and copy](${site}/icons)
- [Changelog](${site}/changelog)
- [Brand assets](${site}/brand)
- [Source on GitHub](https://github.com/evicons/evicons)
- German version of the site: ${site}/de (icon pages under ${site}/de/icons/<name>)

## Icons

${byCategory}

## Optional

- [Map markers with MapLibre GL](${site}/map)
- [Imprint](${site}/imprint) and [privacy](${site}/privacy)
`
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
