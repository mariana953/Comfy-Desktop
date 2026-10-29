import { mock } from '../assets/mock'

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
  {
    label: 'Remove a background',
    kind: 'Image',
    runs: 'Runs in 10 s',
    src: mock('start-remove-a-background')
  },
  {
    label: 'Turn a photo into video',
    kind: 'Video',
    runs: 'Runs in 1 min',
    // A real ComfyUI output: the What's new banner's loops sit on this page too.
    src: mock('clip-eye'),
    video: './install-showcase-scene/Assets/eye.webm'
  },
  {
    label: 'Reshoot your product',
    kind: 'Image',
    runs: 'Runs in 20 s',
    src: mock('start-reshoot-your-product')
  },
  { label: 'Upscale to 4K', kind: 'Image', runs: 'Runs in 15 s', src: mock('start-upscale-to-4k') },
  {
    label: 'Relight a portrait',
    kind: 'Image',
    runs: 'Runs in 20 s',
    src: mock('start-relight-a-portrait')
  }
]
