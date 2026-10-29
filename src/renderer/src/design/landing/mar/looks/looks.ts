import { computed, reactive, watch } from 'vue'
import { isMariana } from '../proposal'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './looks.css'

/**
 * Looks (UI Playground › Look): five bold visual languages over the same
 * layout and the Void greys. Each is one stylesheet scoped to
 * `:root[data-mar-look='<id>']` (this folder) plus, for some, effects that
 * MarLookFx.vue mounts only while that look is on. Current changes nothing.
 */
export type MarLook = 'current' | 'liquid' | 'beam' | 'grain' | 'paper' | 'swiss'

export const LOOKS: { value: MarLook; label: string }[] = [
  { value: 'current', label: 'Current · Void as it is' },
  { value: 'liquid', label: 'Liquid · glass that bends light' },
  { value: 'beam', label: 'Beam · light follows the cursor' },
  { value: 'grain', label: 'Grain · a living shader gradient' },
  { value: 'paper', label: 'Paper · stacked layers, real depth' },
  { value: 'swiss', label: 'Swiss · hairlines and kinetic type' }
]

const KEY = 'comfy.design.mar.look'

export const marLook = reactive<{ id: MarLook }>({
  id: (() => {
    try {
      const v = localStorage.getItem(KEY) as MarLook | null
      return v && LOOKS.some((l) => l.value === v) ? v : 'current'
    } catch {
      return 'current'
    }
  })()
})

/** The look on screen, or undefined for Current (and Pablo's proposal). */
export const lookOn = computed<Exclude<MarLook, 'current'> | undefined>(() =>
  isMariana.value && marLook.id !== 'current' ? marLook.id : undefined
)

watch(
  () => marLook.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)

watch(
  lookOn,
  (id) => {
    if (id) document.documentElement.dataset.marLook = id
    else delete document.documentElement.dataset.marLook
  },
  { immediate: true }
)
