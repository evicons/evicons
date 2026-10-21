import { createElement, forwardRef, useId } from 'react'
import type { EvIconComponent, EvIconProps, IconNode } from './types.js'

export function createEvIcon(displayName: string, fileName: string, node: IconNode): EvIconComponent {
  const Icon = forwardRef<SVGSVGElement, EvIconProps>(function EvIcon(props, ref) {
    const {
      size,
      strokeWidth,
      absoluteStrokeWidth = false,
      title,
      className,
      children,
      'aria-labelledby': labelledBy,
      ...rest
    } = props
    const titleId = useId()
    const px = size ?? 24

    const label = rest['aria-label']
    const hasName = labelledBy != null || label != null || title != null
    const computedLabelledBy =
      labelledBy ?? (label == null && title != null ? titleId : undefined)

    const classes = ['evicon', `evicon-${fileName}`, className].filter(Boolean).join(' ')

    return createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: px,
        height: px,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: strokeWidth ?? 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ref,
        'aria-hidden': hasName ? undefined : 'true',
        role: hasName ? 'img' : undefined,
        'aria-labelledby': computedLabelledBy,
        ...rest,
        className: classes,
      },
      title != null ? createElement('title', { id: titleId }, title) : null,
      ...node.map(([tag, attrs], i) =>
        createElement(tag, absoluteStrokeWidth ? { key: i, ...attrs, vectorEffect: 'non-scaling-stroke' } : { key: i, ...attrs }),
      ),
      children,
    )
  })
  Icon.displayName = displayName
  return Icon
}
