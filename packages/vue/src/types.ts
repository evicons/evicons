import type { DefineComponent, SVGAttributes } from 'vue'

// Mirrored from tools/ on purpose: this package must stay self-contained.
export type IconNode = Array<
  [tag: 'path' | 'circle' | 'rect' | 'line' | 'polyline' | 'ellipse', attrs: Record<string, string>]
>

export interface EvIconProps {
  /** Width and height. Default 24. */
  size?: number | string
  /** Stroke width. Default 1.5. */
  strokeWidth?: number | string
  /** Keep the stroke at `strokeWidth` screen pixels regardless of icon size. Default false. */
  absoluteStrokeWidth?: boolean
  /** Accessible name, rendered as <title>. */
  title?: string
}

/** An EVicons component. Other attributes (`class`, `style`, `aria-*`, `data-*`, listeners) fall through to the `<svg>`. */
export type EvIconComponent = DefineComponent<EvIconProps & /* @vue-ignore */ SVGAttributes>
