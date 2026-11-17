import { defineComponent, h, useId, type PropType } from 'vue'
import type { EvIconComponent, IconNode } from './types.js'

export function createEvIcon(displayName: string, fileName: string, node: IconNode): EvIconComponent {
  const Icon = defineComponent({
    name: displayName,
    inheritAttrs: false,
    props: {
      size: { type: [Number, String] as PropType<number | string>, default: undefined },
      strokeWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
      absoluteStrokeWidth: { type: Boolean, default: false },
      title: { type: String, default: undefined },
    },
    setup(props, { attrs, slots }) {
      const titleId = useId()
      return () => {
        const { class: className, 'aria-labelledby': labelledBy, ...rest } = attrs as Record<string, unknown>
        const px = props.size ?? 24
        const label = rest['aria-label']
        const hasName = labelledBy != null || label != null || props.title != null
        const computedLabelledBy = labelledBy ?? (label == null && props.title != null ? titleId : undefined)

        return h(
          'svg',
          {
            xmlns: 'http://www.w3.org/2000/svg',
            width: px,
            height: px,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': props.strokeWidth ?? 1.5,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            'aria-hidden': hasName ? undefined : 'true',
            role: hasName ? 'img' : undefined,
            'aria-labelledby': computedLabelledBy,
            ...rest,
            class: ['evicon', `evicon-${fileName}`, className],
          },
          [
            props.title != null ? h('title', { id: titleId }, props.title) : null,
            ...node.map(([tag, a]) => h(tag, props.absoluteStrokeWidth ? { ...a, 'vector-effect': 'non-scaling-stroke' } : a)),
            slots.default?.(),
          ],
        )
      }
    },
  })
  return Icon as unknown as EvIconComponent
}
