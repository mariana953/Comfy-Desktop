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
  radius: 'default' | 'soft'
  contrast: 'low' | 'default' | 'high'
  borders: 'none' | 'hairline' | 'glass'
  shadows: 'off' | 'default'
}

const DEFAULTS: Tuning = {
  radius: 'soft',
  contrast: 'default',
  borders: 'none',
  shadows: 'default'
}

export const KNOBS: Knob[] = [
  {
    key: 'radius',
    label: 'Corners',
    options: [
      { value: 'default', label: 'Default' },
      { value: 'soft', label: 'Soft' }
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
      { value: 'hairline', label: 'Hairline' },
      { value: 'glass', label: 'Glass' }
    ]
  },
  {
    key: 'shadows',
    label: 'Shadows',
    options: [
      { value: 'off', label: 'Off' },
      { value: 'default', label: 'On' }
    ]
  }
]

/** Token overrides per knob value. Missing = keep the UI's own value. */
const TOKENS: { [K in keyof Tuning]: Partial<Record<Tuning[K], Record<string, string>>> } = {
  radius: {
    soft: {
      '--radius-panel': '22px',
      '--radius-card': '18px',
      '--radius-control': '12px',
      '--radius-min': '6px'
    }
  },
  contrast: {
    low: {
      '--mar-surface-a': '0.03',
      '--mar-surface-hover-a': '0.05',
      '--color-card-background': 'oklch(0.2 0.006 285)',
      '--color-card-background-hover': 'oklch(0.225 0.007 285)',
      '--color-secondary-background': 'oklch(1 0 0 / 0.04)'
    },
    high: {
      '--mar-surface-a': '0.09',
      '--mar-surface-hover-a': '0.13',
      '--color-card-background': 'oklch(0.255 0.008 285)',
      '--color-card-background-hover': 'oklch(0.29 0.009 285)',
      '--color-secondary-background': 'oklch(1 0 0 / 0.09)',
      '--color-content-background': 'oklch(0.125 0.005 285)'
    }
  },
  // None: no borders at all. Hairline: a uniform, faint line all round.
  // Glass edge: only a soft highlight along the top, like Pablo's cards.
  borders: {
    none: { '--color-border-default': 'transparent', '--color-border-strong': 'transparent' },
    hairline: {
      '--color-border-default': 'color-mix(in oklch, var(--color-base-foreground) 9%, transparent)',
      '--color-border-strong': 'color-mix(in oklch, var(--color-base-foreground) 14%, transparent)'
    },
    glass: { '--color-border-default': 'transparent', '--color-border-strong': 'transparent' }
  },
  shadows: {
    off: {
      '--shadow-elev': 'none',
      '--shadow-elev-hover': 'none',
      '--shadow-highlight': 'none'
    }
  }
}

// v4: corners default to soft (no sharp); borders default to none.
const KEY = 'comfy.design.uiTuning.v4'

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
    document.documentElement.dataset.marBorders = t.borders
    document.documentElement.dataset.marShadows = t.shadows
    try {
      localStorage.setItem(KEY, JSON.stringify(t))
    } catch {
      // Storage blocked: the tuning lasts for this window only.
    }
  },
  { immediate: true }
)
