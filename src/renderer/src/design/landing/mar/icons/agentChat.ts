import { defineComponent, h } from 'vue'

/**
 * The Agent entry in Mar's proposal: a chat bubble with a small sparkle.
 * Production has no agent icon, so it is drawn in lucide's system (24 grid,
 * stroke 2, round caps and joins): lucide's message-square with a
 * four-point sparkle in its middle.
 */
const BUBBLE =
  'M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z'
const SPARKLE = 'M12 7q.6 3.4 4 4q-3.4.6-4 4q-.6-3.4-4-4q3.4-.6 4-4z'

export const AgentChat = defineComponent({
  name: 'AgentChat',
  props: {
    size: { type: [Number, String], default: 24 },
    strokeWidth: { type: [Number, String], default: 2 }
  },
  setup(props) {
    return () =>
      h(
        'svg',
        {
          xmlns: 'http://www.w3.org/2000/svg',
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': props.strokeWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true'
        },
        [h('path', { d: BUBBLE }), h('path', { d: SPARKLE })]
      )
  }
})
