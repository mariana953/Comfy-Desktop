import { thumb } from '../../mock'
import bloomLoop from '../assets/banner-bloom.mp4'
import bloomPoster from '../assets/banner-bloom.jpg'
import portraitGarden from '../assets/portrait-garden.jpg'
import portraitSun from '../assets/portrait-sun.jpg'
import lakeFog from '../assets/lake-fog.jpg'

/**
 * The examples a first-time user can run in a click (Start from an
 * example). `kind` and `runs` fill the line under the title, where a
 * Recently used card says when you last opened it: an example has never
 * run, so it says how long one run takes ("Runs in 20 s"), with no
 * "about". Once run, it is your work and shows up in Recently used.
 */
export interface Example {
  label: string
  kind: 'Image' | 'Video'
  runs: string
  src: string
  video?: string
}

export const EXAMPLES: Example[] = [
  { label: 'Remove a background', kind: 'Image', runs: 'Runs in 10 s', src: portraitGarden },
  {
    label: 'Turn a photo into video',
    kind: 'Video',
    runs: 'Runs in 1 min',
    src: bloomPoster,
    video: bloomLoop
  },
  {
    label: 'Reshoot your product',
    kind: 'Image',
    runs: 'Runs in 20 s',
    src: thumb('template_product_placement')
  },
  { label: 'Upscale to 4K', kind: 'Image', runs: 'Runs in 15 s', src: lakeFog },
  { label: 'Relight a portrait', kind: 'Image', runs: 'Runs in 20 s', src: portraitSun }
]
