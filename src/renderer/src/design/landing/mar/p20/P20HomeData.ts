import { computed } from 'vue'
import { allWorkflows } from '../../gallery'
import { LAUNCHES, TEMPLATES } from '../../mock'
import { SPACES, type Space } from '../../spaces'
import { instanceById } from '../../useProto'
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
 * What the Proposals · 20 Home layouts (11 Timeline, 12 Canvas hero,
 * 20 Zen) share: the same recent work, news and spaces as Home v10
 * (MarHomeV10.vue), each layout showing them in its own form.
 */

/** The photos stand in for outputs, in the same order as Home v10. */
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

export const recent = computed(() =>
  [...allWorkflows.value]
    .sort((a, b) => a.age - b.age)
    .slice(0, 8)
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

/** What's new: the launches, with a line on what each one does. */
const BLURB: Record<string, string> = {
  'Seedance 2.5': 'Text and image to video',
  'LTX 2.5': 'Image to video with sound',
  'Wan Animate 2': 'Bring a character to life',
  'MiniMax H3': 'Cinematic text to video',
  'Flower Studio': 'A new way to build apps'
}
export const news = LAUNCHES.map((l) => ({
  ...l,
  blurb: BLURB[l.title] ?? (l.kind === 'model' ? 'New model' : 'New feature')
}))

/** Prompt starters: the examples whose title says what they do. */
const STARTER_ART = [portraitSun, lakeFog, hillsSunset, portraitGarden]
export const starters = TEMPLATES.filter((t) => t.title.includes(':'))
  .slice(0, 4)
  .map((t, i) => {
    const [model, task] = t.title.split(':').map((x) => x.trim())
    return { id: t.id, title: task!, model: model!, src: STARTER_ART[i]! }
  })

export const spaces = SPACES

/** A space's line: live and when it last moved, or draft. */
export const spaceMeta = (s: Space): string =>
  s.status === 'draft'
    ? 'Draft'
    : `${s.status === 'live' ? 'Live' : 'Paused'} · ${(s.activity[0]?.when ?? 'today').toLowerCase()}`

/** The space's orb: its brand colour, lit from the top left. */
export const orb = (color: string): Record<string, string> => ({
  background: `radial-gradient(circle at 34% 30%, color-mix(in oklch, ${color} 55%, white) 0%, ${color} 48%, color-mix(in oklch, ${color} 65%, black) 100%)`
})

/** Minutes ago from a relative label ("12 min ago", "1 h ago",
 *  "Yesterday"); unknown labels read as earlier today. */
export function minutesAgo(when: string): number {
  const n = Number(/\d+/.exec(when)?.[0] ?? 1)
  if (/min/i.test(when)) return n
  if (/\bh\b|hour/i.test(when)) return n * 60
  if (/yesterday/i.test(when)) return 26 * 60
  if (/day/i.test(when)) return n * 24 * 60
  if (/week/i.test(when)) return n * 7 * 24 * 60
  return 3 * 60
}
