// /josm/evicons.mapcss: the JOSM map paint style as a plain file. JOSM resolves relative icon paths only
// inside a zip, so this copy points at the icons by absolute URL (/josm/icons/<name>.svg); the zip keeps them relative.
import type { APIRoute } from 'astro'
import { josmStyle } from '../../lib/josm-source'

const ICON_BASE = 'https://evicons.dev/josm/'

export const GET: APIRoute = () =>
  new Response(josmStyle().style.mapcss.replaceAll('"icons/', `"${ICON_BASE}icons/`), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
