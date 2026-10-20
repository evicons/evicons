import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react'

// Mirrored from tools/ on purpose: this package must stay self-contained.
export type IconNode = Array<
  [tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'ellipse', attrs: Record<string, string>]
>

export interface EvIconProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  /** Width and height. Default 24. */
  size?: number | string
  /** Stroke width. Default 1.75. */
  strokeWidth?: number | string
  /** Keep the stroke at `strokeWidth` screen pixels regardless of icon size. Default false. */
  absoluteStrokeWidth?: boolean
  /** Accessible name, rendered as <title>. */
  title?: string
}

export type EvIconComponent = ForwardRefExoticComponent<EvIconProps & RefAttributes<SVGSVGElement>>
