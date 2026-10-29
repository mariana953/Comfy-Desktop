import { reactive, watch } from 'vue'

/** Builds on Mar's Home (UI Playground › Build on Home): Off, as today, or
 *  On, a compact Builds row with Pablo's Home content (your recent builds,
 *  their state, click to launch). Mar's proposal only. */
export type HomeBuilds = 'off' | 'on'

export const HOME_BUILDS: { value: HomeBuilds; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'On' }
]

const KEY = 'comfy.design.mar.homeBuilds'

export const homeBuilds = reactive<{ id: HomeBuilds }>({
  id: (() => {
    try {
      return localStorage.getItem(KEY) === 'on' ? 'on' : 'off'
    } catch {
      return 'off'
    }
  })()
})

watch(
  () => homeBuilds.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
