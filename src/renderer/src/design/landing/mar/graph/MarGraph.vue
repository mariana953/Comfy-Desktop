<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import {
  Boxes,
  ChevronDown,
  FolderOpen,
  History,
  Images,
  LayoutTemplate,
  Minus,
  Play,
  Plus,
  Search,
  Workflow,
  X
} from 'lucide-vue-next'
import portrait from '../assets/portrait-sun.jpg'
import { graphStyle } from './graphStyle'

/**
 * ComfyUI's graph editor as a mock, in Mar's proposal (a build's tab). Two
 * looks over one graph: Glass, the Home's language (translucent borderless
 * nodes over the bloom, a floating bar with Run), and Current, ComfyUI as
 * it looks today, laid out in the same new structure: the app's title bar
 * holds where you are, ComfyUI keeps its rail, its tabs and its Run.
 */
const { workflow = 'product-relight' } = defineProps<{ workflow?: string }>()

const TYPES: Record<string, string> = {
  MODEL: '#b39ddb',
  CLIP: '#f5d547',
  VAE: '#ff7a7a',
  CONDITIONING: '#ffa94d',
  LATENT: '#ff9cf0',
  IMAGE: '#64b5f6'
}

interface Port {
  name: string
  type: string
}
interface GNode {
  id: string
  title: string
  x: number
  y: number
  w: number
  ins: Port[]
  outs: Port[]
  widgets?: [string, string][]
  text?: string
  progress?: string
  image?: boolean
}

const NODES: GNode[] = [
  {
    id: 'ckpt',
    title: 'Load Checkpoint',
    x: 40,
    y: 170,
    w: 270,
    ins: [],
    outs: [
      { name: 'MODEL', type: 'MODEL' },
      { name: 'CLIP', type: 'CLIP' },
      { name: 'VAE', type: 'VAE' }
    ],
    widgets: [['ckpt_name', 'flux1-dev.safetensors']]
  },
  {
    id: 'pos',
    title: 'CLIP Text Encode · Positive',
    x: 400,
    y: 70,
    w: 300,
    ins: [{ name: 'clip', type: 'CLIP' }],
    outs: [{ name: 'CONDITIONING', type: 'CONDITIONING' }],
    text: 'a model holding the product, soft window light, 85 mm, warm film tones'
  },
  {
    id: 'neg',
    title: 'CLIP Text Encode · Negative',
    x: 400,
    y: 330,
    w: 300,
    ins: [{ name: 'clip', type: 'CLIP' }],
    outs: [{ name: 'CONDITIONING', type: 'CONDITIONING' }],
    text: 'blurry, extra fingers, harsh shadows'
  },
  {
    id: 'lat',
    title: 'Empty Latent Image',
    x: 400,
    y: 545,
    w: 300,
    ins: [],
    outs: [{ name: 'LATENT', type: 'LATENT' }],
    widgets: [
      ['width', '1024'],
      ['height', '1024'],
      ['batch_size', '1']
    ]
  },
  {
    id: 'ks',
    title: 'KSampler',
    x: 790,
    y: 150,
    w: 300,
    ins: [
      { name: 'model', type: 'MODEL' },
      { name: 'positive', type: 'CONDITIONING' },
      { name: 'negative', type: 'CONDITIONING' },
      { name: 'latent_image', type: 'LATENT' }
    ],
    outs: [{ name: 'LATENT', type: 'LATENT' }],
    widgets: [
      ['seed', '1029384756'],
      ['control_after_generate', 'randomize'],
      ['steps', '28'],
      ['cfg', '3.5'],
      ['sampler_name', 'euler'],
      ['scheduler', 'simple'],
      ['denoise', '1.00']
    ],
    progress: '14 / 28'
  },
  {
    id: 'vae',
    title: 'VAE Decode',
    x: 1180,
    y: 70,
    w: 270,
    ins: [
      { name: 'samples', type: 'LATENT' },
      { name: 'vae', type: 'VAE' }
    ],
    outs: [{ name: 'IMAGE', type: 'IMAGE' }]
  },
  {
    id: 'save',
    title: 'Save Image',
    x: 1180,
    y: 270,
    w: 270,
    ins: [{ name: 'images', type: 'IMAGE' }],
    outs: [],
    widgets: [['filename_prefix', 'product-relight']],
    image: true
  }
]

// [from node, output index, to node, input index]
const LINKS: [string, number, string, number][] = [
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

// The node's title bar and slot rows set where each port sits.
const TITLE = 40
const ROW = 28
const byId = Object.fromEntries(NODES.map((n) => [n.id, n]))
const portY = (n: GNode, i: number): number => n.y + TITLE + i * ROW + ROW / 2
const rows = (n: GNode): number => Math.max(n.ins.length, n.outs.length)

const links = computed(() =>
  LINKS.map(([a, ai, b, bi]) => {
    const from = byId[a]!
    const to = byId[b]!
    const x1 = from.x + from.w
    const y1 = portY(from, ai)
    const x2 = to.x
    const y2 = portY(to, bi)
    const dx = Math.max(60, Math.abs(x2 - x1) * 0.5)
    return {
      d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`,
      color: TYPES[from.outs[ai]!.type]!
    }
  })
)

// The graph is drawn at 1500 × 820 and scaled to fit the tab.
const WORLD = { w: 1500, h: 820 }
const host = ref<HTMLElement>()
const scale = ref(0.86)
let ro: ResizeObserver | undefined
onMounted(() => {
  ro = new ResizeObserver(([e]) => {
    const r = e!.contentRect
    scale.value = Math.min((r.width - 120) / WORLD.w, (r.height - 140) / WORLD.h, 1)
  })
  ro.observe(host.value!)
})
onBeforeUnmount(() => ro?.disconnect())

const RAIL: { icon: Component; label: string }[] = [
  { icon: History, label: 'Queue' },
  { icon: Boxes, label: 'Node library' },
  { icon: Images, label: 'Model library' },
  { icon: Workflow, label: 'Workflows' },
  { icon: LayoutTemplate, label: 'Templates' },
  { icon: FolderOpen, label: 'Assets' }
]
</script>

<template>
  <div ref="host" class="mg" :class="`is-${graphStyle.id}`">
    <!-- Current: ComfyUI's own workflow tabs along the top. -->
    <div v-if="graphStyle.id === 'current'" class="mg-tabs">
      <span class="mg-tab is-on">{{ workflow }}<X :size="12" /></span>
      <span class="mg-tab">Untitled<X :size="12" /></span>
      <Plus :size="14" class="mg-tabs-add" />
    </div>

    <!-- ComfyUI's rail: its own panels, not the app's navigation. -->
    <nav class="mg-rail" aria-label="ComfyUI panels">
      <button
        v-for="(r, i) in RAIL"
        :key="r.label"
        type="button"
        class="mg-rail-btn"
        :class="i === 1 && 'is-on'"
        :title="r.label"
        :aria-label="r.label"
      >
        <component :is="r.icon" :size="17" />
      </button>
    </nav>

    <!-- The canvas. -->
    <div class="mg-canvas">
      <div
        class="mg-world"
        :style="{ width: `${WORLD.w}px`, height: `${WORLD.h}px`, transform: `scale(${scale})` }"
      >
        <svg class="mg-links" :viewBox="`0 0 ${WORLD.w} ${WORLD.h}`" aria-hidden="true">
          <path
            v-for="(l, i) in links"
            :key="i"
            :d="l.d"
            :stroke="l.color"
            fill="none"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <section
          v-for="n in NODES"
          :key="n.id"
          class="mg-node"
          :style="{ left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px` }"
          :aria-label="n.title"
        >
          <header class="mg-title">
            <span v-if="graphStyle.id === 'current'" class="mg-title-dot" />
            <span class="flex-1 truncate">{{ n.title }}</span>
            <span v-if="n.progress" class="mg-progress">{{ n.progress }}</span>
          </header>
          <div v-for="r in rows(n)" :key="r" class="mg-slot">
            <span v-if="n.ins[r - 1]" class="mg-in">
              <i class="mg-port" :style="{ background: TYPES[n.ins[r - 1]!.type] }" />{{
                n.ins[r - 1]!.name
              }}
            </span>
            <span v-else />
            <span v-if="n.outs[r - 1]" class="mg-out">
              {{ n.outs[r - 1]!.name
              }}<i class="mg-port" :style="{ background: TYPES[n.outs[r - 1]!.type] }" />
            </span>
          </div>
          <div v-if="n.text" class="mg-text"><span class="mg-label">text</span>{{ n.text }}</div>
          <div v-for="[k, v] in n.widgets ?? []" :key="k" class="mg-widget">
            <span class="mg-label">{{ k }}</span
            ><span class="truncate">{{ v }}</span>
          </div>
          <div v-if="n.image" class="mg-image">
            <img :src="portrait" alt="" />
            <span class="mg-image-size">1024 × 1024</span>
          </div>
        </section>
      </div>
    </div>

    <!-- Run: floating in Glass, ComfyUI's own bar in Current. -->
    <div class="mg-bar">
      <span class="mg-bar-name">{{ workflow }}<ChevronDown :size="13" /></span>
      <span class="mg-bar-sep" />
      <span class="mg-bar-queue"><i class="mg-dot" />1 running · 3 queued</span>
      <button type="button" class="mg-run"><Play :size="12" fill="currentColor" />Run</button>
    </div>
    <button
      v-if="graphStyle.id === 'current'"
      type="button"
      class="mg-search"
      aria-label="Search nodes"
    >
      <Search :size="14" />
    </button>

    <!-- Zoom and minimap. -->
    <div class="mg-zoom">
      <Minus :size="13" /><span>{{ Math.round(scale * 100) }}%</span><Plus :size="13" />
    </div>
    <div class="mg-map" aria-hidden="true">
      <svg viewBox="0 0 1500 820">
        <rect
          v-for="n in NODES"
          :key="n.id"
          :x="n.x"
          :y="n.y"
          :width="n.w"
          :height="TITLE + rows(n) * ROW + (n.widgets?.length ?? 0) * 34 + (n.image ? 240 : 0)"
          rx="16"
        />
        <rect x="10" y="10" width="1480" height="800" rx="24" class="mg-map-view" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.mg {
  --mg-node: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  --mg-well: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  --mg-text: var(--color-base-foreground);
  --mg-dim: var(--color-subtle-foreground);
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background:
    radial-gradient(
        circle at 1px 1px,
        color-mix(in oklch, var(--color-base-foreground) 9%, transparent) 1px,
        transparent 0
      )
      0 0 / 24px 24px,
    radial-gradient(
      ellipse at 30% 20%,
      color-mix(in oklch, #76608c 22%, transparent),
      transparent 60%
    ),
    radial-gradient(
      ellipse at 80% 70%,
      color-mix(in oklch, #aa886c 14%, transparent),
      transparent 60%
    ),
    var(--color-content-background);
  color: var(--mg-text);
  font-size: 13px;
}

/* Rail. */
.mg-rail {
  position: absolute;
  top: calc(var(--mar-chrome, 0px) + 16px);
  left: 16px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border-radius: 16px;
  background: color-mix(in oklch, var(--color-card-background) 70%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
}
:root .proto-ui.proto-ui.proto-ui .mg-rail-btn {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 10px;
  color: var(--color-muted-foreground);
}
.mg-rail-btn:hover,
.mg-rail-btn.is-on {
  background: color-mix(in oklch, var(--color-base-foreground) 9%, transparent);
  color: var(--color-base-foreground);
}

/* Canvas and nodes. */
.mg-canvas {
  padding-top: var(--mar-chrome, 0px);
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: center;
}
.mg-world {
  position: relative;
  flex-shrink: 0;
  transform-origin: center;
}
.mg-links {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.mg-links path {
  opacity: 0.85;
}
.mg-node {
  position: absolute;
  overflow: hidden;
  padding-bottom: 8px;
  border-radius: 18px;
  background: var(--mg-node);
  backdrop-filter: blur(20px) saturate(1.2);
  box-shadow: 0 18px 40px -18px rgb(0 0 0 / 0.6);
}
.mg-title {
  display: flex;
  height: 40px;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}
.mg-progress {
  border-radius: 999px;
  padding: 2px 8px;
  background: color-mix(in oklch, var(--color-status-running, #4ade80) 18%, transparent);
  color: var(--color-status-running, #4ade80);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.mg-slot {
  display: flex;
  height: 28px;
  align-items: center;
  justify-content: space-between;
  color: var(--color-muted-foreground);
}
.mg-in,
.mg-out {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.mg-in .mg-port {
  margin-left: -5px;
}
.mg-out .mg-port {
  margin-right: -5px;
}
.mg-port {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  box-shadow: 0 0 0 2px var(--color-content-background);
}
.mg-text,
.mg-widget {
  margin: 6px 10px 0;
  border-radius: 10px;
  background: var(--mg-well);
}
.mg-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  line-height: 1.45;
}
.mg-widget {
  display: flex;
  height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 12px;
  font-variant-numeric: tabular-nums;
}
.mg-label {
  flex-shrink: 0;
  color: var(--mg-dim);
  font-size: 12px;
}
.mg-image {
  position: relative;
  margin: 8px 10px 0;
  overflow: hidden;
  border-radius: 12px;
}
.mg-image img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}
.mg-image-size {
  position: absolute;
  top: 8px;
  left: 8px;
  border-radius: 999px;
  padding: 2px 8px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: #fff;
  font-size: 11px;
}

/* Run bar. */
.mg-bar {
  position: absolute;
  top: calc(var(--mar-chrome, 0px) + 16px);
  left: 50%;
  z-index: 3;
  display: flex;
  height: 44px;
  align-items: center;
  gap: 12px;
  padding: 0 6px 0 16px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
  transform: translateX(-50%);
}
.mg-bar-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}
.mg-bar-sep {
  width: 1px;
  height: 18px;
  background: color-mix(in oklch, var(--color-base-foreground) 12%, transparent);
}
.mg-bar-queue {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-muted-foreground);
  font-size: 12px;
}
.mg-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-status-running, #4ade80);
}
:root .proto-ui.proto-ui.proto-ui .mg-run {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border-radius: 999px;
  background: var(--color-base-foreground);
  color: var(--color-content-background);
  font-weight: 600;
}

/* Zoom and minimap. */
.mg-zoom {
  position: absolute;
  right: 236px;
  bottom: 20px;
  z-index: 3;
  display: flex;
  height: 32px;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(20px);
  color: var(--color-muted-foreground);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.mg-map {
  position: absolute;
  right: 20px;
  bottom: 20px;
  z-index: 3;
  width: 200px;
  padding: 10px;
  border-radius: 16px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(20px);
}
.mg-map svg {
  display: block;
  width: 100%;
}
.mg-map rect {
  fill: color-mix(in oklch, var(--color-base-foreground) 16%, transparent);
}
.mg-map .mg-map-view {
  fill: none;
  stroke: color-mix(in oklch, var(--color-base-foreground) 40%, transparent);
  stroke-width: 8;
}

/* Current: ComfyUI as it looks today, in the same places. Flat grey nodes
   with a title bar and a line, a lined grid, square-ish controls and the
   blue Run, plus its own workflow tabs. */
.mg.is-current {
  --mg-node: #353535;
  --mg-well: #222;
  background:
    linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px) 0 0 / 20px 20px,
    linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px) 0 0 / 20px 20px,
    #202020;
  padding-top: calc(var(--mar-chrome, 0px) + 36px);
  font-size: 12px;
}
.is-current .mg-tabs {
  position: absolute;
  top: var(--mar-chrome, 0px);
  right: 0;
  left: 49px;
  z-index: 4;
  display: flex;
  height: 36px;
  align-items: flex-end;
  gap: 2px;
  padding: 0 8px;
  background: #171718;
  border-bottom: 1px solid #000;
}
.mg-tab {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 6px 6px 0 0;
  color: #a1a1a1;
}
.mg-tab.is-on {
  background: #2b2b2b;
  color: #f1f1f1;
}
.mg-tabs-add {
  margin: 0 0 8px 6px;
  color: #a1a1a1;
}
.is-current .mg-rail {
  top: var(--mar-chrome, 0px);
  bottom: 0;
  left: 0;
  gap: 2px;
  padding: 8px 6px;
  border-radius: 0;
  background: #171718;
  border-right: 1px solid #000;
  backdrop-filter: none;
}
:root .proto-ui.proto-ui.proto-ui .is-current .mg-rail-btn {
  border-radius: 6px;
}
.is-current .mg-node {
  padding-bottom: 6px;
  border-radius: 8px;
  outline: 1px solid #000;
  backdrop-filter: none;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.5);
}
.is-current .mg-title {
  height: 40px;
  padding: 0 12px;
  background: #222;
  font-size: 13px;
  font-weight: 400;
}
.mg-title-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #777;
}
.is-current .mg-text,
.is-current .mg-widget {
  margin: 4px 8px 0;
  border-radius: 6px;
}
.is-current .mg-widget {
  height: 26px;
  margin-top: 8px;
}
.is-current .mg-image {
  border-radius: 4px;
}
.is-current .mg-port {
  box-shadow: none;
}
.is-current .mg-bar {
  top: calc(var(--mar-chrome, 0px) + 48px);
  height: 38px;
  border-radius: 8px;
  background: #2b2b2b;
  backdrop-filter: none;
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.5);
}
:root .proto-ui.proto-ui.proto-ui .is-current .mg-run {
  height: 28px;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
}
.mg-search {
  position: absolute;
  top: calc(var(--mar-chrome, 0px) + 48px);
  left: 68px;
  z-index: 3;
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #2b2b2b;
  color: #a1a1a1;
}
.is-current :is(.mg-zoom, .mg-map) {
  border-radius: 8px;
  background: #2b2b2b;
  backdrop-filter: none;
}
</style>
