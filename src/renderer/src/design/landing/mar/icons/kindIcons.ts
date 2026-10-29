import { defineComponent, h } from 'vue'
import { LayoutGrid, PanelsTopLeft, Waypoints } from 'lucide-vue-next'
import { isMariana } from '../proposal'
import { ComfyWorkflow } from './comfyIcons'

/**
 * The two kinds of thing you can run, drawn as production draws them in
 * Mar's proposal: a node graph is comfy--workflow, an app is
 * lucide--panels-top-left (ComfyUI_frontend's "Enter app mode" and Apps
 * tab). Pablo's default keeps Waypoints and LayoutGrid. Drop-in for those
 * two lucide icons: same `size` / `strokeWidth` props.
 */
function swap(name: string, mar: unknown, pablo: unknown) {
  return defineComponent({
    name,
    inheritAttrs: true,
    props: {
      size: { type: [Number, String], default: 24 },
      strokeWidth: { type: [Number, String], default: undefined }
    },
    setup(props) {
      return () =>
        h((isMariana.value ? mar : pablo) as never, {
          size: props.size,
          strokeWidth: props.strokeWidth
        })
    }
  })
}

export const GraphIcon = swap('GraphIcon', ComfyWorkflow, Waypoints)
export const AppIcon = swap('AppIcon', PanelsTopLeft, LayoutGrid)
