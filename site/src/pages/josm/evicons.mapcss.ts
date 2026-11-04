// /josm/evicons.mapcss: the JOSM map paint style as a plain file; its icons are at /josm/icons/<name>.svg.
import type { APIRoute } from 'astro'
import { josmStyle } from '../../lib/josm-source'

export const GET: APIRoute = () =>
  new Response(josmStyle().style.mapcss, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
