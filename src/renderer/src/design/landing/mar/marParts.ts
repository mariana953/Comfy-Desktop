import { computed, reactive, watch } from 'vue'

/**
 * Mar's proposal has two Homes (Tune the UI › Mar's changes › Home):
 *   - Pablo's v10: his content, composition and sidebar, exactly; only the
 *     UI changes (Mar's look and transparencies, mar/shell/marShell.css).
 *   - Mar draft: her content and composition changes, one switch each, so
 *     each can be compared with Pablo's part and added one by one.
 */

export type Side = 'pablo' | 'mar'

export interface Parts {
  home: 'v10' | 'draft'
  shell: Side
  actions: Side
  top: Side
  builds: Side
  examples: Side | 'off'
  recent: Side
  news: Side | 'banner'
}

export interface PartKnob {
  key: keyof Parts
  label: string
  options: { value: string; label: string }[]
}

const side = (pablo: string, mar: string): PartKnob['options'] => [
  { value: 'pablo', label: pablo },
  { value: 'mar', label: mar }
]

export const PART_KNOBS: PartKnob[] = [
  {
    key: 'home',
    label: 'Home',
    options: [
      { value: 'v10', label: "Pablo's v10" },
      { value: 'draft', label: 'Mar draft' }
    ]
  },
  { key: 'shell', label: 'Sidebar and page photos', options: side('Pablo', 'Floating') },
  { key: 'actions', label: 'Top right', options: side('ComfyUI + Deploy', 'Create menu') },
  { key: 'top', label: 'Greeting and prompt', options: side('Pablo', 'Tighter') },
  { key: 'builds', label: 'Builds on Home', options: side('Rows', 'Tiles') },
  {
    key: 'examples',
    label: 'Example workflows on Home',
    options: [...side('Row', 'Hand of cards'), { value: 'off', label: 'Agent only' }]
  },
  { key: 'recent', label: 'Recently used', options: side('Pablo', 'Photo cards') },
  {
    key: 'news',
    label: "What's new",
    options: [...side('Pablo', 'Tabs'), { value: 'banner', label: 'Banner' }]
  }
]

const DEFAULTS: Parts = {
  home: 'v10',
  shell: 'mar',
  actions: 'mar',
  top: 'mar',
  builds: 'mar',
  examples: 'off',
  recent: 'mar',
  news: 'mar'
}

/** Pablo's v10: every part is his. */
const PABLO: Parts = {
  home: 'v10',
  shell: 'pablo',
  actions: 'pablo',
  top: 'pablo',
  builds: 'pablo',
  examples: 'pablo',
  recent: 'pablo',
  news: 'pablo'
}

// v3: Pablo's v10 keeps all his parts; switches apply to Mar draft only.
const KEY = 'comfy.design.mar.parts.v3'

function load(): Parts {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export const parts = reactive<Parts>(load())

/** The parts on screen: all Pablo's on v10, the switches on Mar draft. */
export const active = computed<Parts>(() => (parts.home === 'draft' ? parts : PABLO))

export function resetParts(): void {
  Object.assign(parts, { ...DEFAULTS, home: parts.home })
}

watch(
  () => ({ ...parts }),
  (p) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(p))
    } catch {
      // Storage blocked: the switches last for this window only.
    }
  }
)
