/**
 * The graph the editor mock draws: a Flux text-to-image workflow, laid out
 * left to right so every link runs forward. Positions are world units; the
 * node heights (and so where each port sits) come from the look's geometry.
 */

/** ComfyUI's link and port colours per data type. */
export const TYPES: Record<string, string> = {
  MODEL: '#b39ddb',
  CLIP: '#ffd500',
  VAE: '#ff6e6e',
  CONDITIONING: '#ffa931',
  LATENT: '#ff9cf9',
  IMAGE: '#64b5f6'
}

export interface Port {
  name: string
  type: string
}

export type Widget =
  | { kind: 'number'; name: string; value: string }
  | { kind: 'combo'; name: string; value: string }
  | { kind: 'slider'; name: string; value: string; fill: number }
  | { kind: 'toggle'; name: string; value: boolean }
  | { kind: 'text'; name: string; value: string; lines: number }

export interface GNode {
  id: string
  title: string
  x: number
  y: number
  w: number
  ins: Port[]
  outs: Port[]
  widgets: Widget[]
  /** Running: how far along, 0 to 1. Done: has its output. */
  state?: 'running' | 'done'
  progress?: number
  steps?: string
  /** An output preview under the widgets, this tall. */
  image?: number
}

export interface Geometry {
  head: number
  row: number
  widget: number
  gap: number
  pad: number
  line: number
}

/** Glass: roomy rows in the Home's rhythm. Current: ComfyUI's own density. */
export const GEOMETRY: Record<'glass' | 'current', Geometry> = {
  glass: { head: 40, row: 24, widget: 30, gap: 6, pad: 10, line: 18 },
  current: { head: 30, row: 22, widget: 22, gap: 4, pad: 8, line: 16 }
}

export const createNodes = (): GNode[] => [
  {
    id: 'ckpt',
    title: 'Load Checkpoint',
    x: 40,
    y: 250,
    w: 260,
    ins: [],
    outs: [
      { name: 'MODEL', type: 'MODEL' },
      { name: 'CLIP', type: 'CLIP' },
      { name: 'VAE', type: 'VAE' }
    ],
    widgets: [{ kind: 'combo', name: 'ckpt_name', value: 'flux1-dev-fp8.safetensors' }]
  },
  {
    id: 'lat',
    title: 'Empty Latent Image',
    x: 380,
    y: 600,
    w: 300,
    ins: [],
    outs: [{ name: 'LATENT', type: 'LATENT' }],
    widgets: [
      { kind: 'number', name: 'width', value: '1024' },
      { kind: 'number', name: 'height', value: '1280' },
      { kind: 'number', name: 'batch_size', value: '1' }
    ]
  },
  {
    id: 'pos',
    title: 'Positive prompt',
    x: 380,
    y: 70,
    w: 300,
    ins: [{ name: 'clip', type: 'CLIP' }],
    outs: [{ name: 'CONDITIONING', type: 'CONDITIONING' }],
    widgets: [
      {
        kind: 'text',
        name: 'text',
        value:
          'Portrait of a woman in late sun, hand on her cheek, soft window light, 85 mm, warm film tones, shallow depth of field',
        lines: 4
      }
    ]
  },
  {
    id: 'neg',
    title: 'Negative prompt',
    x: 380,
    y: 380,
    w: 300,
    ins: [{ name: 'clip', type: 'CLIP' }],
    outs: [{ name: 'CONDITIONING', type: 'CONDITIONING' }],
    widgets: [
      { kind: 'text', name: 'text', value: 'blurry, extra fingers, harsh shadows', lines: 2 }
    ]
  },
  {
    id: 'ks',
    title: 'KSampler',
    x: 760,
    y: 240,
    w: 290,
    ins: [
      { name: 'model', type: 'MODEL' },
      { name: 'positive', type: 'CONDITIONING' },
      { name: 'negative', type: 'CONDITIONING' },
      { name: 'latent_image', type: 'LATENT' }
    ],
    outs: [{ name: 'LATENT', type: 'LATENT' }],
    widgets: [
      { kind: 'number', name: 'seed', value: '1029384756' },
      { kind: 'combo', name: 'control_after_generate', value: 'randomize' },
      { kind: 'number', name: 'steps', value: '28' },
      { kind: 'number', name: 'cfg', value: '3.5' },
      { kind: 'combo', name: 'sampler_name', value: 'euler' },
      { kind: 'combo', name: 'scheduler', value: 'simple' },
      { kind: 'slider', name: 'denoise', value: '0.85', fill: 0.85 }
    ],
    state: 'running',
    progress: 0.5,
    steps: '14 / 28'
  },
  {
    id: 'vae',
    title: 'VAE Decode',
    x: 1130,
    y: 240,
    w: 210,
    ins: [
      { name: 'samples', type: 'LATENT' },
      { name: 'vae', type: 'VAE' }
    ],
    outs: [{ name: 'IMAGE', type: 'IMAGE' }],
    widgets: []
  },
  {
    id: 'save',
    title: 'Save Image',
    x: 1420,
    y: 240,
    w: 300,
    ins: [{ name: 'images', type: 'IMAGE' }],
    outs: [],
    widgets: [
      { kind: 'combo', name: 'filename_prefix', value: 'portrait-sun' },
      { kind: 'toggle', name: 'embed_workflow', value: true }
    ],
    state: 'done',
    image: 375
  }
]

// [from node, output index, to node, input index]
export const LINKS: [string, number, string, number][] = [
  ['ckpt', 0, 'ks', 0],
  ['ckpt', 1, 'pos', 0],
  ['ckpt', 1, 'neg', 0],
  ['ckpt', 2, 'vae', 1],
  ['pos', 0, 'ks', 1],
  ['neg', 0, 'ks', 2],
  ['lat', 0, 'ks', 3],
  ['ks', 0, 'vae', 0],
  ['vae', 0, 'save', 0]
]

/** A ComfyUI group: a titled area behind the nodes it holds. */
export const GROUPS = [{ title: 'Prompt', nodes: ['pos', 'neg'] }]

export const rows = (n: GNode): number => Math.max(n.ins.length, n.outs.length, 1)

export function widgetHeight(w: Widget, g: Geometry): number {
  return w.kind === 'text' ? w.lines * g.line + g.pad * 2 : g.widget
}

/** Top of the widgets, below the slot rows. */
export const widgetsTop = (n: GNode, g: Geometry): number => g.head + 6 + rows(n) * g.row + 6

export function nodeHeight(n: GNode, g: Geometry): number {
  let h = widgetsTop(n, g)
  for (const w of n.widgets) h += widgetHeight(w, g) + g.gap
  if (n.image) h += n.image + g.gap + 22
  return h + g.pad - g.gap
}

export const portY = (n: GNode, i: number, g: Geometry): number =>
  n.y + g.head + 6 + i * g.row + g.row / 2
