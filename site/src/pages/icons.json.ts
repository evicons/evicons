// /icons.json: a machine-readable index of every icon (metadata, SVG markup and URLs) for tools and AI assistants.
// Same source as the gallery and the icon pages: the @evicons/svg package.
import type { APIRoute } from 'astro'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { loadIconDetails, loadIcons } from '../lib/icons'

const site = 'https://evicons.dev'

export const GET: APIRoute = () => {
  const pkg = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@evicons/svg/package.json'), 'utf8')) as {
    version: string
  }
  const details = loadIconDetails()
  const icons = loadIcons().map((icon) => {
    const d = details[icon.name]!
    return {
      name: icon.name,
      pascal: icon.pascal,
      category: icon.category,
      meaning: d.meaning,
      tags: icon.tags,
      since: d.since,
      aliases: d.aliases,
      ...(icon.standard ? { standard: icon.standard } : {}),
      svg: icon.svg,
      url: {
        svg: `${site}/svg/${icon.name}.svg`,
        page: { en: `${site}/icons/${icon.name}`, de: `${site}/de/icons/${icon.name}` },
      },
    }
  })
  const body = {
    name: 'EVicons',
    description: 'Open-source outline icons for EV charging: connectors, stations, charging status, payment and map markers.',
    license: 'MIT',
    version: pkg.version,
    homepage: site,
    repository: 'https://github.com/evicons/evicons',
    packages: { react: '@evicons/react', svg: '@evicons/svg' },
    viewBox: '0 0 24 24',
    strokeWidth: 1.5,
    count: icons.length,
    icons,
  }
  return new Response(JSON.stringify(body, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
