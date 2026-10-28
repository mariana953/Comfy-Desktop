import { computed } from 'vue'

/**
 * What Mar's proposal shows on Home, decided per part. Pablo's proposal
 * (Proposal: Pablo) is his branch as it is; Mar's (Proposal: Mar) is her
 * draft, Figma "Exploration 17 · Ambient dock": a tall page photo with a
 * large greeting, the Create menu, a compact prompt, recent work as photo
 * cards, What's new as tabs (example workflows live in Agent), and the
 * builds in the dock instead of on Home.
 * Shell: the Ambient dock (Figma "Exploration 17") instead of a sidebar.
 * The parts stay named so a part can go back to Pablo's in one line.
 */

export type Side = 'pablo' | 'mar'

/** Shell: Pablo's sidebar, the floating sidebar, or the Ambient dock. */
export type Shell = Side | 'dock'

export interface Parts {
  shell: Shell
  actions: Side
  top: Side
  builds: Side | 'off'
  examples: Side | 'off' | 'rows'
  recent: Side
  news: Side | 'banner'
}

const MAR: Parts = {
  shell: 'dock',
  actions: 'mar',
  top: 'pablo',
  builds: 'off',
  examples: 'off',
  recent: 'mar',
  news: 'mar'
}

/** The parts on screen in Mar's proposal. */
export const active = computed<Parts>(() => MAR)
