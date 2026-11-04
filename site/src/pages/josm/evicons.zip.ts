// /josm/evicons.zip: the JOSM map paint style with its icons (evicons.mapcss at the root, icons/ next to it).
import type { APIRoute } from 'astro'
import { josmStyle } from '../../lib/josm-source'

export const GET: APIRoute = () =>
  new Response(josmStyle().zip as Uint8Array<ArrayBuffer>, { headers: { 'Content-Type': 'application/zip' } })
