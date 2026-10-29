import garden from '../assets/portrait-garden.jpg'
import sun from '../assets/portrait-sun.jpg'
import windowLight from '../assets/portrait-window.jpg'
import type { NodeRunState } from './runEngine'

/**
 * The Canvas mode's graph: a simpler layer over ComfyUI (Node Banana's
 * approach). Few node types, each showing its result on the node, its
 * controls hanging below, its sockets outside on the preview. One Generate
 * node covers every model; a ComfyUI workflow collapses into one node; a
 * Pause node holds the pipeline so you can refine before it goes on.
 */

export const SOCKETS: Record<string, string> = {
  TEXT: '#e8c07a',
  IMAGE: '#64b5f6'
}

export interface Socket {
  name: string
  type: string
}

/** A widget. `key` names its value in what a run is given. */
export type Control =
  | { kind: 'model'; key: string; value: string; options: { value: string; provider: string }[] }
  | { kind: 'combo'; key: string; name: string; value: string; options: string[] }
  | { kind: 'seg'; key: string; name: string; options: string[]; value: string }
  | { kind: 'slider'; key: string; name: string; value: number }
  | { kind: 'button'; key: string; label: string }

export interface SNode {
  id: string
  kind: 'prompt' | 'image' | 'generate' | 'pause' | 'workflow' | 'output'
  title: string
  /** A small tag beside the title, e.g. where a workflow comes from. */
  badge?: string
  x: number
  y: number
  w: number
  /** Height of the node's main element: its preview or its text. */
  body: number
  text?: string
  image?: string
  chip?: string
  /** What its progress says while it runs, e.g. "Relighting". */
  verb?: string
  /** Where the last run left it. */
  state?: NodeRunState
  step?: number
  steps?: number
  error?: string
  /** Its result no longer matches its inputs: they changed since. */
  stale?: boolean
  ins: Socket[]
  outs: Socket[]
  controls: Control[]
}

export interface CanvasGeometry {
  head: number
  control: number
  gap: number
  /** Space between the preview and the controls under it. */
  under: number
}

export const CANVAS_GEOMETRY: Record<'glass' | 'current', CanvasGeometry> = {
  glass: { head: 30, control: 30, gap: 4, under: 8 },
  current: { head: 30, control: 22, gap: 4, under: 0 }
}

export const createCanvas = (): SNode[] => [
  {
    id: 'prompt',
    kind: 'prompt',
    title: 'Prompt',
    x: 40,
    y: 60,
    w: 250,
    body: 150,
    text: 'Portrait of a woman in late sun, hand on her cheek, soft window light, 85 mm, warm film tones',
    ins: [],
    outs: [{ name: 'text', type: 'TEXT' }],
    controls: []
  },
  {
    id: 'ref',
    kind: 'image',
    title: 'Reference',
    x: 40,
    y: 270,
    w: 250,
    body: 250,
    image: garden,
    chip: 'garden.jpg',
    ins: [],
    outs: [{ name: 'image', type: 'IMAGE' }],
    controls: []
  },
  {
    id: 'gen',
    kind: 'generate',
    title: 'Generate',
    x: 420,
    y: 60,
    w: 290,
    body: 362,
    image: sun,
    chip: '4:5 · 1K',
    verb: 'Generating',
    ins: [
      { name: 'prompt', type: 'TEXT' },
      { name: 'image', type: 'IMAGE' }
    ],
    outs: [{ name: 'image', type: 'IMAGE' }],
    controls: [
      {
        kind: 'model',
        key: 'model',
        value: 'Nano Banana Pro',
        options: [
          { value: 'Nano Banana Pro', provider: 'Gemini' },
          { value: 'Seedream 4', provider: 'ByteDance' },
          { value: 'Flux 1.1 Pro', provider: 'Black Forest Labs' }
        ]
      },
      { kind: 'seg', key: 'aspect', name: 'Aspect', options: ['1:1', '4:5', '16:9'], value: '4:5' },
      {
        kind: 'combo',
        key: 'resolution',
        name: 'Resolution',
        value: '1K',
        options: ['1K', '2K', '4K']
      },
      { kind: 'combo', key: 'seed', name: 'Seed', value: 'Random', options: ['Random', 'Fixed'] }
    ]
  },
  {
    id: 'pause',
    kind: 'pause',
    title: 'Pause',
    x: 830,
    y: 60,
    w: 170,
    body: 132,
    ins: [{ name: 'image', type: 'IMAGE' }],
    outs: [{ name: 'image', type: 'IMAGE' }],
    controls: []
  },
  {
    id: 'relight',
    kind: 'workflow',
    title: 'Relight',
    badge: 'Workflow',
    x: 1120,
    y: 60,
    w: 290,
    body: 362,
    image: sun,
    verb: 'Relighting',
    ins: [{ name: 'image', type: 'IMAGE' }],
    outs: [{ name: 'image', type: 'IMAGE' }],
    controls: [
      {
        kind: 'combo',
        key: 'runsOn',
        name: 'Runs on',
        value: 'Comfy Cloud',
        options: ['Comfy Cloud', 'This computer']
      },
      {
        kind: 'combo',
        key: 'light',
        name: 'Light',
        value: 'Window, left',
        options: ['Window, left', 'Window, right', 'Golden hour', 'Studio softbox']
      },
      { kind: 'slider', key: 'intensity', name: 'Intensity', value: 0.6 }
    ]
  },
  {
    id: 'out',
    kind: 'output',
    title: 'Output',
    x: 1540,
    y: 60,
    w: 270,
    body: 338,
    image: windowLight,
    chip: 'Last run',
    ins: [{ name: 'image', type: 'IMAGE' }],
    outs: [],
    controls: [
      {
        kind: 'combo',
        key: 'format',
        name: 'Format',
        value: 'PNG',
        options: ['PNG', 'JPEG', 'WebP']
      },
      { kind: 'button', key: 'save', label: 'Save to Assets' }
    ]
  }
]

// [from node, output index, to node, input index]
export const CANVAS_LINKS: [string, number, string, number][] = [
  ['prompt', 0, 'gen', 0],
  ['ref', 0, 'gen', 1],
  ['gen', 0, 'pause', 0],
  ['pause', 0, 'relight', 0],
  ['relight', 0, 'out', 0]
]

export function controlsHeight(n: SNode, g: CanvasGeometry): number {
  const c = n.controls.length
  return c ? c * g.control + (c - 1) * g.gap + 12 : 0
}

export function canvasNodeHeight(n: SNode, g: CanvasGeometry): number {
  const c = controlsHeight(n, g)
  return g.head + n.body + (c ? g.under + c : 0)
}

/** Sockets sit on the preview's edge, outside the node. */
export const socketY = (n: SNode, i: number, g: CanvasGeometry): number =>
  n.y + g.head + 34 + i * 34
