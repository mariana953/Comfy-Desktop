import { reactive, watch } from 'vue'

/** How the Create / Build / Agent switch looks in Mar's proposal
 *  (UI Playground › Mode switch), until one is decided. */
export type ModeStyle = 'pablo' | 'stack' | 'title' | 'split' | 'foot'

export const MODE_STYLES: { value: ModeStyle; label: string }[] = [
  { value: 'pablo', label: 'Pill · picked one named (today)' },
  { value: 'stack', label: 'Stack · three rows that say what each does' },
  { value: 'title', label: 'Title · the mode is the heading' },
  { value: 'split', label: 'Split · Create or Build, Agent apart' },
  { value: 'foot', label: 'Foot · switch at the bottom, by the workspace' }
]

const KEY = 'comfy.design.mar.modeStyle'

export const modeStyle = reactive<{ id: ModeStyle }>({
  id: (() => {
    try {
      const v = localStorage.getItem(KEY) as ModeStyle | null
      return v && MODE_STYLES.some((m) => m.value === v) ? v : 'pablo'
    } catch {
      return 'pablo'
    }
  })()
})

watch(
  () => modeStyle.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
