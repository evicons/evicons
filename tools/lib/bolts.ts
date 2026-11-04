/**
 * The solid lightning bolts (design guide section 2, "Lightning bolt"). Every bolt in EVicons is
 * one of these shapes, moved but never scaled, drawn as a closed path with `fill="currentColor"`.
 *
 * Each shape is listed by its vertices, starting at the top tip, in the order the path visits them,
 * relative to the top-left corner of the shape's box. All bolts share one vertex layout: top tip
 * right of centre (A), down-left to the step (B), right along the step (C), down-left to the lower
 * tip (D), up-right to the other end of the step (E), left along the step (F) and back to A. The
 * shape is point-symmetric about the centre of its box.
 */
export const BOLTS = {
  /** Secondary cue inside another icon, 3 × 6.5. */
  small: [[2.25, 0], [0, 3.5], [1.25, 3.5], [0.75, 6.5], [3, 3], [1.75, 3]],
  /** Main sign of a marker head (approved by the owner on 2026-11-04) and of `charging-session`, `plug-in-hybrid`; 5.5 × 11.5. */
  sign: [[4, 0], [0, 6.25], [2.5, 6.25], [1.5, 11.5], [5.5, 5.25], [3, 5.25]],
  /** Full-size bolt of `charging-bolt` and `fast-charging`, 9 × 18.5. */
  full: [[6.5, 0], [0, 10], [4, 10], [2.5, 18.5], [9, 8.5], [5, 8.5]],
  /** Torn bolt of `power-outage`, upper piece (top tip, crack's left end, crack's right end), 6 × 9.25. */
  'torn-upper': [[6, 0], [0, 9.25], [4.75, 7.5]],
  /** Torn bolt of `power-outage`, lower piece (lower tip, crack's right end, crack's left end), 6 × 9.25. */
  'torn-lower': [[0, 9.25], [6, 0], [1.25, 1.75]],
} as const satisfies Record<string, ReadonlyArray<readonly [number, number]>>

export type BoltName = keyof typeof BOLTS

/** Coordinates are written with three decimals (SVGO floatPrecision 3), so a moved copy may differ by rounding. */
const TOLERANCE = 0.0015

const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/y

/**
 * Vertices of a path that consists of exactly one closed subpath of straight segments
 * (M, L, H, V, Z, absolute or relative). Returns null for anything else.
 */
export function polygonVertices(d: string): Array<[number, number]> | null {
  const points: Array<[number, number]> = []
  let x = 0
  let y = 0
  let i = 0
  let command = ''
  let closed = false
  const skip = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i++
  }
  const number = (): number | null => {
    skip()
    NUMBER.lastIndex = i
    const m = NUMBER.exec(d)
    if (!m) return null
    i += m[0].length
    return Number(m[0])
  }
  for (skip(); i < d.length; skip()) {
    if (closed) return null // anything after Z
    if (/[a-zA-Z]/.test(d[i])) {
      command = d[i++]
      if (command === 'Z' || command === 'z') {
        closed = true
        continue
      }
      if (!/[MmLlHhVv]/.test(command)) return null
      if (/[Mm]/.test(command) && points.length > 0) return null // a second subpath
    } else if (command === '' || /[Zz]/.test(command)) {
      return null
    }
    const rel = command === command.toLowerCase()
    if (/[MmLl]/.test(command)) {
      const nx = number()
      const ny = number()
      if (nx === null || ny === null) return null
      // x and y start at 0, so a relative first moveto is absolute as well
      x = rel ? x + nx : nx
      y = rel ? y + ny : ny
      points.push([x, y])
      // implicit commands after a moveto are linetos
      if (command === 'M') command = 'L'
      if (command === 'm') command = 'l'
    } else {
      const n = number()
      if (n === null) return null
      if (command === 'H') x = n
      else if (command === 'h') x += n
      else if (command === 'V') y = n
      else y += n
      points.push([x, y])
    }
  }
  if (!closed || points.length < 3) return null
  const [first, last] = [points[0], points[points.length - 1]]
  if (Math.abs(first[0] - last[0]) < TOLERANCE && Math.abs(first[1] - last[1]) < TOLERANCE) points.pop()
  return points
}

/** The name of the canonical bolt that `d` draws (moved, not scaled or reordered), or null. */
export function boltName(d: string): BoltName | null {
  const points = polygonVertices(d)
  if (points === null) return null
  for (const [name, shape] of Object.entries(BOLTS) as Array<[BoltName, ReadonlyArray<readonly [number, number]>]>) {
    if (shape.length !== points.length) continue
    const dx = points[0][0] - shape[0][0]
    const dy = points[0][1] - shape[0][1]
    if (shape.every(([sx, sy], k) => Math.abs(points[k][0] - sx - dx) < TOLERANCE && Math.abs(points[k][1] - sy - dy) < TOLERANCE)) {
      return name
    }
  }
  return null
}
