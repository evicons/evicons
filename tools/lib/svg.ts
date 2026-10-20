import { parseSync, type INode } from 'svgson'

export const ALLOWED_TAGS = ['path', 'circle', 'rect', 'line', 'polyline', 'ellipse'] as const

export type AllowedTag = (typeof ALLOWED_TAGS)[number]

export type IconNode = Array<[tag: AllowedTag, attrs: Record<string, string>]>

export function isAllowedTag(tag: string): tag is AllowedTag {
  return (ALLOWED_TAGS as readonly string[]).includes(tag)
}

/** Parses SVG source into an svgson tree. Throws only on malformed XML. */
export function parseSvg(svgSource: string): INode {
  return parseSync(svgSource)
}

/**
 * Converts SVG source into an icon node: the allowed direct children of the
 * root with their attributes. Disallowed content is skipped silently; the
 * linter is responsible for reporting it. Throws only on malformed XML.
 */
export function parseIcon(svgSource: string): IconNode {
  const root = parseSvg(svgSource)
  const node: IconNode = []
  for (const child of root.children) {
    if (child.type === 'element' && isAllowedTag(child.name)) {
      node.push([child.name, { ...child.attributes }])
    }
  }
  return node
}
