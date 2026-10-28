import { reactive, watch } from 'vue'

/** How template pictures look in Mar's proposal (Proposal and UI ›
 *  Templates): the plain output photo, or a branded poster (Comfy's
 *  colours and slanted strokes around the photo, the name in big type),
 *  so the catalogue reads as Comfy's own. */
export type TemplateStyle = 'photo' | 'branded'

export const TEMPLATE_STYLES: { value: TemplateStyle; label: string }[] = [
  { value: 'photo', label: 'Photo · the output' },
  { value: 'branded', label: 'Branded · Comfy poster' }
]

const KEY = 'comfy.design.mar.templateStyle'

export const templateStyle = reactive<{ id: TemplateStyle }>({
  id: (() => {
    try {
      return localStorage.getItem(KEY) === 'branded' ? 'branded' : 'photo'
    } catch {
      return 'photo'
    }
  })()
})

watch(
  () => templateStyle.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
