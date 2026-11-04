/**
 * Style exceptions an icon may declare in its metadata. They do not relax any
 * lint rule; they document a deliberate deviation for reviewers and the preview.
 * - letters: uses the EVicons stroke alphabet (AC, DC, kW, ...)
 * - dense-connector: connector face needs more detail than the style usually allows
 * - sharp-corner: a corner is intentionally drawn sharp despite round joins
 * - solid-sign: the icon contains a solid lightning bolt, one of the canonical bolt paths with
 *   fill="currentColor" (the only fill in EVicons, design guide section 2)
 */
export const KNOWN_EXCEPTIONS = ['letters', 'dense-connector', 'sharp-corner', 'solid-sign'] as const

export type KnownException = (typeof KNOWN_EXCEPTIONS)[number]

export function isKnownException(id: unknown): id is KnownException {
  return typeof id === 'string' && (KNOWN_EXCEPTIONS as readonly string[]).includes(id)
}
