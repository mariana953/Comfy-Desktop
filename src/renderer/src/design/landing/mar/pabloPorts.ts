import { reactive, watch } from 'vue'

/**
 * Pablo's features brought into Mar's proposal, restyled (UI Playground ›
 * From Pablo). Each adds structure Mar's draft didn't have, so each has
 * its own switch and starts Off: the proposal looks as it did until one is
 * turned on. Audit: design-shots/pablo-gaps.md.
 */
export type Port = 'buildDetails' | 'navAccount' | 'navDocs'

export const PORTS: { key: Port; label: string }[] = [
  { key: 'buildDetails', label: 'Compact builds · GPU, disk and actions' },
  { key: 'navAccount', label: 'Account · Log in card, workspace in Tabs' },
  { key: 'navDocs', label: 'Build nav · Docs link' }
]

const KEY = 'comfy.design.mar.pabloPorts'

export const ports = reactive<Record<Port, boolean>>(
  (() => {
    const off = Object.fromEntries(PORTS.map((p) => [p.key, false])) as Record<Port, boolean>
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
      for (const p of PORTS) off[p.key] = saved[p.key] === true
    } catch {
      // Storage blocked: everything starts Off.
    }
    return off
  })()
)

watch(
  () => ({ ...ports }),
  (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(v))
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
