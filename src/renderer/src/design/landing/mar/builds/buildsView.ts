import { reactive, watch } from 'vue'

/** Builds page in Mar's proposal: the cards, or a compact summary with one
 *  line per build. Remembered per person. */
const KEY = 'comfy.design.mar.buildsView'

export const buildsView = reactive<{ id: 'cards' | 'compact' }>({
  id: (() => {
    try {
      return localStorage.getItem(KEY) === 'compact' ? 'compact' : 'cards'
    } catch {
      return 'cards'
    }
  })()
})

watch(
  () => buildsView.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
