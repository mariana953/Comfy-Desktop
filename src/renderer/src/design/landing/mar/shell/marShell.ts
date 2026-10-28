import { computed, reactive, watch } from 'vue'
import { proto } from '../../useProto'
import { isMariana } from '../proposal'
import { active } from '../marParts'
import forestFog from '../assets/forest-fog.jpg'
import hillsFog from '../assets/hills-fog.jpg'
import hillsSunset from '../assets/hills-sunset.jpg'
import lakeFog from '../assets/lake-fog.jpg'
import portraitGrass from '../assets/portrait-grass.jpg'
import portraitSeaside from '../assets/portrait-seaside.jpg'
import portraitSun from '../assets/portrait-sun.jpg'
import portraitWindow from '../assets/portrait-window.jpg'

/**
 * Mar's shell (Figma "Exploration 01 · Cinema hero"): the sidebar floats
 * over the page with a blur and can be closed; library pages sit under a
 * blurred photo. Only the look changes; every page keeps Pablo's content.
 *
 * `data-mar-shell` on <html> scopes the shell's stylesheet (marShell.css),
 * so Pablo's proposal is untouched. Tune the UI › Mar's changes › Sidebar
 * and page photos turns it off to compare with Pablo's shell.
 */

const KEY = 'comfy.design.mar.sidebar'

function load(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'closed'
  } catch {
    // Storage blocked: open by default.
    return true
  }
}

/** The sidebar is open by default; the choice is saved per browser. */
export const marShell = reactive({ open: load() })

watch(
  () => marShell.open,
  (open) => {
    try {
      localStorage.setItem(KEY, open ? 'open' : 'closed')
    } catch {
      // Storage blocked: the choice lasts for this window only.
    }
  }
)

/** Mar's floating sidebar (an earlier shell, kept for comparison). */
export const marShellOn = computed(() => isMariana.value && active.value.shell === 'mar')

watch(
  marShellOn,
  (on) => {
    if (on) document.documentElement.dataset.marShell = 'on'
    else delete document.documentElement.dataset.marShell
  },
  { immediate: true }
)

/** Mar's navigation (Proposal and UI › Navigation): Mar's sidebar attached
 *  to the window or floating (MarSidebar.vue), the dock at the bottom
 *  (MarDock.vue), or Classic: Pablo's sidebar and layout as they are.
 *  Same places in all. */
export type MarNav = 'sidebar' | 'floating' | 'dock' | 'classic' | 'tabs'
// v2: the sidebar is the default. The dock is no longer offered (it read
// unclear); a stored pick of it falls back to the sidebar.
const NAV_KEY = 'comfy.design.mar.nav.v2'
function loadNav(): { id: MarNav; collapsed: boolean } {
  try {
    const v = JSON.parse(localStorage.getItem(NAV_KEY) ?? '{}')
    // Classic (Pablo's sidebar) is the default; a stored dock falls back to it.
    const id: MarNav = ['sidebar', 'floating', 'classic', 'tabs'].includes(v.id) ? v.id : 'classic'
    return { id, collapsed: Boolean(v.collapsed) }
  } catch {
    return { id: 'classic', collapsed: false }
  }
}
export const marNav = reactive(loadNav())
watch(
  () => ({ ...marNav }),
  (v) => {
    try {
      localStorage.setItem(NAV_KEY, JSON.stringify(v))
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)

/** Mar's Ambient dock: no sidebar, one dock at the bottom (MarDock.vue). */
export const marDockOn = computed(
  () => isMariana.value && active.value.shell === 'dock' && marNav.id === 'dock'
)

/** Mar's sidebar (MarSidebar.vue), expanded or as a rail. */
export const marSideOn = computed(
  () =>
    isMariana.value &&
    active.value.shell === 'dock' &&
    (marNav.id === 'sidebar' || marNav.id === 'floating')
)
watch(
  () => [marSideOn.value, marNav.collapsed, marNav.id] as const,
  ([on, rail]) => {
    const d = document.documentElement.dataset
    if (on) {
      d.marSide = rail ? 'rail' : 'open'
      // Integrated (attached to the window) or floating (a card).
      d.marSideStyle = marNav.id === 'floating' ? 'floating' : 'integrated'
    } else {
      delete d.marSide
      delete d.marSideStyle
    }
  },
  { immediate: true }
)

watch(
  marDockOn,
  (on) => {
    if (on) document.documentElement.dataset.marDock = 'on'
    else delete document.documentElement.dataset.marDock
  },
  { immediate: true }
)

/** Mar's UI (transparencies, page photos): all of her proposal, Pablo's
 *  v10 included. Scopes the UI rules in marShell.css. */
watch(
  isMariana,
  (on) => {
    if (on) document.documentElement.dataset.marUi = 'on'
    else delete document.documentElement.dataset.marUi
  },
  { immediate: true }
)

// Navigation: Classic keeps Pablo's frame (solid title bar, content in an
// inset panel), so the floating title bar rules skip it.
watch(
  () => [isMariana.value, marNav.id] as const,
  ([m, id]) => {
    // Classic and Tabs (08) each have their own frame.
    if (m && (id === 'classic' || id === 'tabs')) document.documentElement.dataset.marNav = id
    else delete document.documentElement.dataset.marNav
  },
  { immediate: true }
)

export const marSidebarClosed = computed(() => marShellOn.value && !marShell.open)

// Not every page gets a photo: tools (builds, the agent, admin) stay plain.
const HERO: Record<string, string> = {
  overview: lakeFog,
  explore: portraitSun,
  tutorials: hillsFog,
  workflows: hillsSunset,
  apps: portraitGrass,
  assets: forestFog,
  projects: portraitSeaside,
  spaces: portraitWindow
}

/** The photo behind the top of the current page, if it has one. */
export const heroImage = computed<string | undefined>(() => {
  if (!isMariana.value) return undefined
  const page = proto.page
  if (page.startsWith('project:')) return portraitSeaside
  if (page.startsWith('space:')) return portraitWindow
  return HERO[page]
})

/** Home's background (Proposal and UI › Home background): Latent bloom
 *  (default), the photo, or one of the quieter alternatives. */
export type HomeBackground =
  | 'bloom'
  | 'photo'
  | 'mesh'
  | 'spotlight'
  | 'aurora'
  | 'grain'
  | 'output'
const BACKGROUND_IDS: HomeBackground[] = [
  'bloom',
  'photo',
  'mesh',
  'spotlight',
  'aurora',
  'grain',
  'output'
]
const BG_KEY = 'comfy.design.mar.homeBackground'
function loadBackground(): HomeBackground {
  try {
    const v = localStorage.getItem(BG_KEY) as HomeBackground | null
    return v && BACKGROUND_IDS.includes(v) ? v : 'bloom'
  } catch {
    return 'bloom'
  }
}
export const homeBackground = reactive<{ id: HomeBackground }>({ id: loadBackground() })
watch(
  () => homeBackground.id,
  (id) => {
    try {
      localStorage.setItem(BG_KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)

/** Latent bloom is on screen: Home, Mar's proposal, bloom picked. */
export const bloomOn = computed(
  () => isMariana.value && proto.page === 'overview' && homeBackground.id === 'bloom'
)

/** One of the quieter Home backgrounds (CSS only, MarBackdrop.vue). */
export const altBackground = computed(() =>
  isMariana.value && proto.page === 'overview' && !['bloom', 'photo'].includes(homeBackground.id)
    ? homeBackground.id
    : undefined
)
