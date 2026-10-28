import { reactive, watch } from 'vue'

/**
 * UI tuner: live knobs on top of the picked UI (Void, A, B, C) to compare
 * looks without writing a new direction each time. Each knob overrides a
 * few design tokens inline on <html>; "Default" leaves the token alone.
 * Saved per browser, so a tuned look survives reloads.
 */

export interface Knob {
  key: keyof Tuning
  label: string
  options: { value: string; label: string }[]
}

export interface Tuning {
  radius: 'sharp' | 'default' | 'soft'
  text: 'small' | 'default' | 'large'
  contrast: 'low' | 'default' | 'high'
  borders: 'none' | 'default' | 'strong'
  shadows: 'off' | 'default'
  chip: 'default' | 'grey-blur'
  focus: 'white' | 'blue' | 'violet'
}

const DEFAULTS: Tuning = {
  radius: 'default',
  text: 'default',
  contrast: 'default',
  borders: 'default',
  shadows: 'default',
  chip: 'default',
  focus: 'white'
}

export const KNOBS: Knob[] = [
  {
    key: 'radius',
    label: 'Corners',
    options: [
      { value: 'sharp', label: 'Sharp' },
      { value: 'default', label: 'Default' },
      { value: 'soft', label: 'Soft' }
    ]
  },
  {
    key: 'text',
    label: 'Text size',
    options: [
      { value: 'small', label: '12' },
      { value: 'default', label: '13' },
      { value: 'large', label: '14' }
    ]
  },
  {
    key: 'contrast',
    label: 'Surfaces',
    options: [
      { value: 'low', label: 'Flat' },
      { value: 'default', label: 'Default' },
      { value: 'high', label: 'Layered' }
    ]
  },
  {
    key: 'borders',
    label: 'Borders',
    options: [
      { value: 'none', label: 'None' },
      { value: 'default', label: 'Subtle' },
      { value: 'strong', label: 'Strong' }
    ]
  },
  {
    key: 'shadows',
    label: 'Shadows',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'default', label: 'On' }
    ]
  },
  {
    key: 'chip',
    label: 'Chips on images',
    options: [
      { value: 'default', label: 'Black' },
      { value: 'grey-blur', label: 'Grey + blur' }
    ]
  },
  {
    key: 'focus',
    label: 'Focus and progress',
    options: [
      { value: 'white', label: 'White' },
      { value: 'blue', label: 'Blue' },
      { value: 'violet', label: 'Violet' }
    ]
  }
]

/** Token overrides per knob value. Missing = keep the UI's own value. */
const TOKENS: { [K in keyof Tuning]: Partial<Record<Tuning[K], Record<string, string>>> } = {
  radius: {
    sharp: {
      '--radius-panel': '10px',
      '--radius-card': '6px',
      '--radius-control': '5px',
      '--radius-min': '3px'
    },
    soft: {
      '--radius-panel': '22px',
      '--radius-card': '18px',
      '--radius-control': '12px',
      '--radius-min': '6px'
    }
  },
  text: {
    small: { '--text-ui': '12px', '--text-ui--line-height': '18px' },
    large: { '--text-ui': '14px', '--text-ui--line-height': '22px' }
  },
  contrast: {
    low: {
      '--color-card-background': 'oklch(0.2 0.006 285)',
      '--color-card-background-hover': 'oklch(0.225 0.007 285)',
      '--color-secondary-background': 'oklch(1 0 0 / 0.04)'
    },
    high: {
      '--color-card-background': 'oklch(0.255 0.008 285)',
      '--color-card-background-hover': 'oklch(0.29 0.009 285)',
      '--color-secondary-background': 'oklch(1 0 0 / 0.09)',
      '--color-content-background': 'oklch(0.125 0.005 285)'
    }
  },
  borders: {
    none: { '--color-border-default': 'transparent', '--color-border-strong': 'transparent' },
    strong: {
      '--color-border-default': 'oklch(1 0 0 / 0.14)',
      '--color-border-strong': 'oklch(1 0 0 / 0.22)'
    }
  },
  shadows: {
    off: {
      '--shadow-elev': 'none',
      '--shadow-elev-hover': 'none',
      '--shadow-highlight': 'none'
    }
  },
  chip: {
    'grey-blur': { '--color-media-overlay': 'oklch(0.22 0.004 285 / 0.6)' }
  },
  focus: {
    blue: { '--color-border-focus': 'oklch(0.68 0.15 250)' },
    violet: { '--color-border-focus': 'oklch(0.66 0.16 295)' }
  }
}

// v2: back to neutral defaults (earlier picks were saved per browser).
const KEY = 'comfy.design.uiTuning.v2'

function load(): Tuning {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

export const tuning = reactive<Tuning>(load())
export const tuner = reactive({ open: false })

export function resetTuning(): void {
  Object.assign(tuning, DEFAULTS)
}

const applied = new Set<string>()
watch(
  () => ({ ...tuning }),
  (t) => {
    const style = document.documentElement.style
    for (const name of applied) style.removeProperty(name)
    applied.clear()
    for (const knob of KNOBS) {
      const values = (TOKENS[knob.key] as Record<string, Record<string, string>>)[t[knob.key]]
      for (const [name, value] of Object.entries(values ?? {})) {
        style.setProperty(name, value)
        applied.add(name)
      }
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(t))
    } catch {
      // Storage blocked: the tuning lasts for this window only.
    }
  },
  { immediate: true }
)
