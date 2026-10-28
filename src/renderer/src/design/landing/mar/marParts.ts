import { reactive, watch } from 'vue'

/**
 * Mar's changes on top of Pablo's v10, one switch each (Tune the UI ›
 * Mar's changes). Pablo's content stays; each switch picks his part or
 * Mar's version of it, so nothing is deleted and changes can be added
 * one by one. Component and UI changes start on; additions start off.
 */

export type Side = 'pablo' | 'mar'

export interface Parts {
  home: 'v10' | 'draft'
  shell: Side
  actions: Side
  top: Side
  builds: Side
  examples: Side
  recent: Side
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
  { key: 'examples', label: 'Example workflows', options: side('Row', 'Hand of cards') },
  { key: 'recent', label: 'Recently used', options: side('Pablo', 'Photo cards') }
]

const DEFAULTS: Parts = {
  home: 'v10',
  shell: 'mar',
  actions: 'mar',
  top: 'mar',
  builds: 'mar',
  examples: 'mar',
  recent: 'mar'
}

const KEY = 'comfy.design.mar.parts'

function load(): Parts {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export const parts = reactive<Parts>(load())

export function resetParts(): void {
  Object.assign(parts, DEFAULTS)
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
