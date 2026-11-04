// /josm/icons/<name>.svg: the icons of the JOSM style, with their colours baked in (JOSM does not apply CSS).
import type { APIRoute, GetStaticPaths } from 'astro'
import { josmStyle } from '../../../lib/josm-source'

export const getStaticPaths: GetStaticPaths = () =>
  Object.keys(josmStyle().style.icons).map((path) => ({ params: { name: path.slice('icons/'.length, -'.svg'.length) } }))

export const GET: APIRoute = ({ params }) => {
  const svg = josmStyle().style.icons[`icons/${params.name}.svg`]
  if (!svg) return new Response(null, { status: 404 })
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } })
}
