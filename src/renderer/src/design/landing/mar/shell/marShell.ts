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

/** Mar's Ambient dock: no sidebar, one dock at the bottom (MarDock.vue). */
export const marDockOn = computed(() => isMariana.value && active.value.shell === 'dock')

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
