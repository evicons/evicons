/**
 * Style exceptions an icon may declare in its metadata. They do not relax any
 * lint rule; they document a deliberate deviation for reviewers and the preview.
 * - letters: uses the EVicons stroke alphabet (AC, DC, kW, ...)
 * - dense-connector: connector face needs more detail than the style usually allows
 * - sharp-corner: a corner is intentionally drawn sharp despite round joins
 * - solid-sign: small sign (e.g. the small bolt) whose inner gaps are below the spacing minimum
 *   on purpose; it reads as a solid shape
 */
export const KNOWN_EXCEPTIONS = ['letters', 'dense-connector', 'sharp-corner', 'solid-sign'] as const

export type KnownException = (typeof KNOWN_EXCEPTIONS)[number]

export function isKnownException(id: unknown): id is KnownException {
  return typeof id === 'string' && (KNOWN_EXCEPTIONS as readonly string[]).includes(id)
}
