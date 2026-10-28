import { reactive, watch } from 'vue'

/** How the Create / Build / Agent switch looks in Mar's proposal
 *  (UI Playground › Mode switch), until one is decided. */
export type ModeStyle = 'pablo' | 'segmented' | 'underline' | 'menu' | 'icons'

export const MODE_STYLES: { value: ModeStyle; label: string }[] = [
  { value: 'pablo', label: 'Pill · picked one named (today)' },
  { value: 'segmented', label: 'Segmented · all named, equal' },
  { value: 'underline', label: 'Underline · text tabs' },
  { value: 'menu', label: 'Menu · one button, pick from a list' },
  { value: 'icons', label: 'Icons · quiet, names on hover' }
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
