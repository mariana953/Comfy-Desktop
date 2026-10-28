import { computed } from 'vue'

/**
 * What Mar's proposal shows on Home, decided per part. Pablo's proposal
 * (Proposal: Pablo) is his branch as it is; Mar's (Proposal: Mar) is her
 * draft: floating sidebar and page photos, the Create menu, Pablo's
 * greeting with a compact prompt, builds as pills, no examples on Home
 * (they live in Agent), recent work as photo cards, and What's new as tabs.
 * The parts stay named so a part can go back to Pablo's in one line.
 */

export type Side = 'pablo' | 'mar'

export interface Parts {
  shell: Side
  actions: Side
  top: Side
  builds: Side
  examples: Side | 'off'
  recent: Side
  news: Side | 'banner'
}

const MAR: Parts = {
  shell: 'mar',
  actions: 'mar',
  top: 'pablo',
  builds: 'mar',
  examples: 'off',
  recent: 'mar',
  news: 'mar'
}

/** The parts on screen in Mar's proposal. */
export const active = computed<Parts>(() => MAR)
