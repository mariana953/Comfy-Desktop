import { reactive, watch } from 'vue'

/** Where credits show in Mar's sidebar (Proposal and UI › Credits). */
export type CreditsStyle = 'row' | 'meter' | 'chip'

export const CREDITS_STYLES: { value: CreditsStyle; label: string }[] = [
  { value: 'row', label: 'Row · above the workspace' },
  { value: 'meter', label: 'Meter · inside the workspace' },
  { value: 'chip', label: 'Chip · next to the tabs' }
]

const KEY = 'comfy.design.mar.credits'

export const creditsStyle = reactive<{ id: CreditsStyle }>({
  id: (() => {
    try {
      const v = localStorage.getItem(KEY)
      return v === 'meter' || v === 'chip' ? v : 'row'
    } catch {
      return 'row'
    }
  })()
})

watch(
  () => creditsStyle.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
