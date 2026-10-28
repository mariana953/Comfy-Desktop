import { computed } from 'vue'
import { allWorkflows } from '../../gallery'
import { instanceById, proto } from '../../useProto'
import { can } from '../../milestones'
import { SPACES } from '../../spaces'
import portraitSeaside from '../assets/portrait-seaside.jpg'
import portraitGarden from '../assets/portrait-garden.jpg'
import lakeFog from '../assets/lake-fog.jpg'
import portraitSun from '../assets/portrait-sun.jpg'
import hillsSunset from '../assets/hills-sunset.jpg'
import portraitSmile from '../assets/portrait-smile.jpg'
import forestFog from '../assets/forest-fog.jpg'
import portraitGrass from '../assets/portrait-grass.jpg'
import hillsFog from '../assets/hills-fog.jpg'
import portraitWindow from '../assets/portrait-window.jpg'

/**
 * Data the three p20 Home layouts share (02 Command home, 03 Bento,
 * 05 Composer): the recently used list with Mar's photos, as in
 * MarHomeV10.vue, the spaces Home may show, and a space's orb.
 */
export const RECENT_ART = [
  portraitSeaside,
  forestFog,
  portraitGrass,
  hillsFog,
  portraitWindow,
  portraitGarden,
  lakeFog,
  portraitSun,
  hillsSunset,
  portraitSmile
]

/** Photos for What's new tiles while a launch has no loop of its own. */
export const NEWS_ART = [forestFog, portraitGrass, hillsFog, portraitSun, lakeFog]

export const recent = computed(() =>
  [...allWorkflows.value]
    .sort((a, b) => a.age - b.age)
    .slice(0, 12)
    .map((w, i) => {
      const env = w.envId ? instanceById(w.envId) : undefined
      return {
        w,
        env,
        src: RECENT_ART[i % RECENT_ART.length]!,
        title: w.name.replace(/\.json$/, '')
      }
    })
)
export type RecentItem = (typeof recent.value)[number]

/** Spaces show on Home only when signed in, live ones first. */
export const homeSpaces = computed(() =>
  can.value.spaces && proto.signedIn
    ? [...SPACES].sort((a, b) => Number(a.status === 'draft') - Number(b.status === 'draft'))
    : []
)

/** The space's orb: its brand colour as a lit sphere, the mark it has in the sidebar. */
export function orb(color: string): Record<string, string> {
  return {
    background: `radial-gradient(circle at 32% 28%, color-mix(in oklch, ${color} 45%, white) 0%, ${color} 48%, color-mix(in oklch, ${color} 65%, black) 100%)`
  }
}
