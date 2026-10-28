import { reactive, watch } from 'vue'

/** Starred templates (Mar's proposal). Starred from a template card; they
 *  sit in the sidebar under Favorites and lead the ⌘K search. */
const KEY = 'comfy.design.mar.favorites'
const START = ['image_z_image_turbo', 'video_ltx2_5_i2v', 'image_qwen_image_edit_2511']

function load(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    return Array.isArray(v) ? v : START
  } catch {
    return START
  }
}

export const favorites = reactive<{ ids: string[] }>({ ids: load() })

export function isFavorite(id: string): boolean {
  return favorites.ids.includes(id)
}
export function toggleFavorite(id: string): void {
  favorites.ids = isFavorite(id) ? favorites.ids.filter((x) => x !== id) : [...favorites.ids, id]
}

watch(
  () => [...favorites.ids],
  (ids) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ids))
    } catch {
      // Storage blocked: the stars last for this window only.
    }
  }
)
