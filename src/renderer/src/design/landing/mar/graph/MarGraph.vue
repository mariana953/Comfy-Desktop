<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
  type Component
} from 'vue'
import {
  ChevronDown,
  ChevronUp,
  Hand,
  History,
  Images,
  Keyboard,
  Map as MapIcon,
  Maximize,
  Minus,
  PanelRight,
  MousePointer2,
  Play,
  Plus,
  Search,
  Settings,
  Tag,
  X
} from 'lucide-vue-next'
import {
  ComfyAssets,
  ComfyModel,
  ComfyNode,
  ComfyTemplate,
  ComfyWorkflow
} from '../icons/comfyIcons'
import { onCloud } from '../shell/surface'
import { graphStyle } from './graphStyle'
import CanvasNode from './CanvasNode.vue'
import AssetsPanel from './AssetsPanel.vue'
import {
  CANVAS_GEOMETRY,
  CANVAS_LINKS,
  SOCKETS,
  canvasNodeHeight,
  createCanvas,
  socketY
} from './canvasData'

/**
 * ComfyUI's graph editor as a mock, in Mar's proposal (a build's tab): a
 * simpler layer over ComfyUI (Node Banana's approach: few nodes, results on
 * the nodes, workflows as nodes). Two looks: Glass, the Home's language
 * (translucent borderless nodes on a calm dot grid), and Current, ComfyUI
 * as it looks today (frontend v1) in the same new structure. The canvas
 * pans (drag the background), zooms (wheel, the zoom pill) and nodes move
 * by their title, so it reads as the real thing.
 */
const { workflow = 'portrait-sun' } = defineProps<{ workflow?: string }>()

const current = computed(() => graphStyle.id === 'current')
const cg = computed(() => CANVAS_GEOMETRY[graphStyle.id])
const sNodes = reactive(createCanvas())
const sById = computed(() => Object.fromEntries(sNodes.map((n) => [n.id, n])))
const selected = ref('')
const labels = ref(false)

/** Every node's box: the world and the minimap. */
const boxes = computed(() => sNodes.map((n) => ({ node: n, h: canvasNodeHeight(n, cg.value) })))

const links = computed(() =>
  CANVAS_LINKS.map(([a, ai, b, bi]) => {
    const from = sById.value[a]!
    const to = sById.value[b]!
    const x1 = from.x + from.w + 5
    const y1 = socketY(from, ai, cg.value)
    const x2 = to.x - 5
    const y2 = socketY(to, bi, cg.value)
    const dx = Math.max(50, Math.abs(x2 - x1) * 0.45)
    return {
      d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`,
      color: SOCKETS[from.outs[ai]!.type]!,
      live: b === 'relight'
    }
  })
)

// The world: big enough for every node, with a margin.
const world = computed(() => ({
  w: Math.max(...boxes.value.map((b) => b.node.x + b.node.w)) + 40,
  h: Math.max(...boxes.value.map((b) => b.node.y + b.h)) + 40
}))

// The view: pan (x, y) and zoom (k), in the canvas's CSS pixels.
const view = reactive({ x: 0, y: 0, k: 0.9 })
const host = ref<HTMLElement>()
const canvas = ref<HTMLElement>()
const size = reactive({ w: 0, h: 0 })
/** How much of the tab sits under what is drawn above it (the title bar,
 *  or the browser's bar on Comfy Cloud), so nothing hides there. */
const top = ref(0)
/** The screen simulator scales the whole app; pointer maths undoes it. */
let screenScale = 1

function measure(): void {
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return
  const r = el.getBoundingClientRect()
  screenScale = r.height / (el.offsetHeight || 1) || 1
  let under = 0
  for (const bar of document.querySelectorAll('.proto-ui > .glass-titlebar, .mar-cloud-bar')) {
    const b = bar.getBoundingClientRect()
    if (b.height) under = Math.max(under, (b.bottom - r.top) / screenScale)
  }
  top.value = Math.round(under)
  size.w = cv.offsetWidth
  size.h = cv.offsetHeight
}

/** Frames the graph: as large as fits, never tiny; if it can't fit, the
 *  start of the graph (its inputs) stays in view. */
function fit(): void {
  measure()
  const pad = current.value
    ? { l: 24, t: 64, r: 24, b: 64 }
    : { l: 84, t: top.value + 80, r: 32, b: 72 }
  // Leave room under the run block while its job rows are open.
  if (jobsOpen.value) pad.t += current.value ? 200 : 220
  const aw = size.w - pad.l - pad.r
  const ah = size.h - pad.t - pad.b
  const k = Math.min(1, Math.max(0.72, Math.min(aw / world.value.w, ah / world.value.h)))
  view.k = k
  view.x = pad.l + Math.max(0, (aw - world.value.w * k) / 2)
  view.y = pad.t + Math.max(0, (ah - world.value.h * k) / 2)
}

function zoomAt(k: number, cx = size.w / 2, cy = size.h / 2): void {
  const nk = Math.min(2, Math.max(0.3, k))
  view.x = cx - ((cx - view.x) * nk) / view.k
  view.y = cy - ((cy - view.y) * nk) / view.k
  view.k = nk
}

function local(e: PointerEvent | WheelEvent): { x: number; y: number } {
  const r = canvas.value!.getBoundingClientRect()
  return { x: (e.clientX - r.left) / screenScale, y: (e.clientY - r.top) / screenScale }
}

function onWheel(e: WheelEvent): void {
  e.preventDefault()
  const p = local(e)
  zoomAt(view.k * Math.exp(-e.deltaY * 0.0015), p.x, p.y)
}

// Dragging: the background (or anything, with the hand) pans; a node's
// title moves the node.
const tool = ref<'select' | 'hand'>('select')
let drag: { kind: 'pan' | 'node'; id?: string; x: number; y: number } | undefined
function onDown(e: PointerEvent): void {
  if (e.button !== 0) return
  const t = e.target as HTMLElement
  const node = tool.value === 'select' ? t.closest<HTMLElement>('[data-node]') : null
  const head = node && t.closest<HTMLElement>('[data-node-head]')
  selected.value = node?.dataset.node ?? ''
  if (node && !head) return
  const p = local(e)
  drag = head ? { kind: 'node', id: head.dataset.nodeHead, ...p } : { kind: 'pan', ...p }
  canvas.value!.setPointerCapture(e.pointerId)
}
function onMove(e: PointerEvent): void {
  if (!drag) return
  const p = local(e)
  const dx = p.x - drag.x
  const dy = p.y - drag.y
  drag.x = p.x
  drag.y = p.y
  if (drag.kind === 'pan') {
    view.x += dx
    view.y += dy
  } else {
    const n = sById.value[drag.id!]!
    n.x += dx / view.k
    n.y += dy / view.k
  }
}
function onUp(): void {
  drag = undefined
}

// Minimap: the whole graph, with the part in view framed. A click there
// centres the view on that spot.
const MAP_W = 196
const showMap = ref(true)
const mapView = computed(() => ({
  x: -view.x / view.k,
  y: -view.y / view.k,
  w: size.w / view.k,
  h: size.h / view.k
}))
function onMap(e: MouseEvent): void {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const wx = ((e.clientX - r.left) / r.width) * world.value.w
  const wy = ((e.clientY - r.top) / r.height) * world.value.h
  view.x = size.w / 2 - wx * view.k
  view.y = size.h / 2 - wy * view.k
}

let ro: ResizeObserver | undefined
onMounted(async () => {
  // The browser's bar on Cloud mounts beside the graph: measure after it.
  await nextTick()
  fit()
  // On a narrow window the minimap would sit over the graph: start closed.
  showMap.value = size.w >= 1200
  ro = new ResizeObserver(() => {
    const was = size.w
    measure()
    if (Math.abs(was - size.w) > 40) fit()
  })
  ro.observe(host.value!)
})
onBeforeUnmount(() => ro?.disconnect())

// Switching look changes the geometry and the layout; switching surface
// adds or drops the browser's bar: frame it again.
watch(
  () => [graphStyle.id, onCloud.value],
  () => nextTick(fit)
)
const assets = ref(false)

// The queue as the run block shows it (ComfyUI_frontend#17679): one run
// going, the rest waiting their turn.
const JOBS: { title: string; sub: string; progress?: number }[] = [
  { title: 'Portrait in late sun', sub: '7:42 PM · 45%', progress: 45 },
  { title: 'Background swap', sub: 'Queued · next up' },
  { title: 'Add reflections', sub: 'Queued · #2' }
]

/** The graph opens with the job rows folded; the pill opens them. */
const jobsOpen = ref(false)

const RAIL: { icon: Component; label: string }[] = [
  { icon: History, label: 'Queue' },
  { icon: ComfyNode, label: 'Nodes' },
  { icon: ComfyModel, label: 'Models' },
  { icon: ComfyWorkflow, label: 'Workflows' },
  { icon: ComfyTemplate, label: 'Templates' },
  { icon: ComfyAssets, label: 'Assets' }
]
</script>

<template>
  <div ref="host" class="mg" :class="`is-${graphStyle.id}`" :style="{ '--mg-top': `${top}px` }">
    <!-- Current: ComfyUI's top bar, its menu and its workflow tabs. -->
    <div v-if="current" class="mg-topbar">
      <span class="mg-logo" aria-hidden="true">C</span>
      <span class="mg-tab is-on">{{ workflow }}<X :size="12" /></span>
      <span class="mg-tab">Untitled<X :size="12" /></span>
      <Plus :size="14" class="mg-tab-add" />
    </div>

    <!-- ComfyUI's rail: its own panels, not the app's navigation. -->
    <nav class="mg-rail" aria-label="ComfyUI panels">
      <button
        v-for="r in RAIL"
        :key="r.label"
        type="button"
        class="mg-rail-btn"
        :class="r.label === 'Assets' && assets && 'is-on'"
        :title="r.label"
        :aria-label="r.label"
        @click="r.label === 'Assets' && (assets = !assets)"
      >
        <component :is="r.icon" :size="current ? 18 : 17" :stroke-width="1.75" />
        <span v-if="current" class="mg-rail-label">{{ r.label }}</span>
      </button>
      <span class="mg-rail-gap" />
      <button type="button" class="mg-rail-btn" title="Shortcuts" aria-label="Shortcuts">
        <Keyboard :size="17" :stroke-width="1.75" />
      </button>
      <button type="button" class="mg-rail-btn" title="Settings" aria-label="Settings">
        <Settings :size="17" :stroke-width="1.75" />
      </button>
    </nav>

    <!-- The canvas: its grid moves with the view. -->
    <div
      ref="canvas"
      class="mg-canvas"
      :class="tool === 'hand' && 'is-hand'"
      :style="{
        '--mg-gx': `${view.x}px`,
        '--mg-gy': `${view.y}px`,
        '--mg-gs': `${(current ? 20 : 24) * view.k}px`
      }"
      @wheel="onWheel"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
      @pointercancel="onUp"
    >
      <div
        class="mg-world"
        :style="{
          width: `${world.w}px`,
          height: `${world.h}px`,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`
        }"
      >
        <svg class="mg-links" :viewBox="`0 0 ${world.w} ${world.h}`" aria-hidden="true">
          <template v-if="current">
            <path v-for="(l, i) in links" :key="`s${i}`" :d="l.d" class="mg-link-shade" />
          </template>
          <path
            v-for="(l, i) in links"
            :key="i"
            :d="l.d"
            :stroke="l.color"
            class="mg-link"
            :class="l.live && 'is-live'"
          />
        </svg>

        <CanvasNode
          v-for="(n, i) in sNodes"
          :key="n.id"
          :node="n"
          :g="cg"
          :current="current"
          :labels="labels"
          :selected="selected === n.id"
          :style="{ '--sg-delay': `${-i * 1.3}s` }"
        />
      </div>
    </div>

    <AssetsPanel v-if="assets" @close="assets = false" />

    <!-- Run and what is running, as designed in ComfyUI_frontend#17679:
         the action bar (batch count, the inverted split Run, the panel
         toggle) and under it the status pill with its job rows. -->
    <div class="mg-runblock">
      <div class="mg-actionbar">
        <span class="mg-grip" aria-hidden="true" />
        <span class="mg-batch">
          <span class="mg-batch-n">1</span>
          <span class="mg-batch-step" aria-hidden="true">
            <ChevronUp :size="12" /><ChevronDown :size="12" />
          </span>
        </span>
        <span class="mg-run-group">
          <button type="button" class="mg-run"><Play :size="15" />Run</button>
          <button type="button" class="mg-run-more" aria-label="Run options">
            <ChevronDown :size="15" />
          </button>
        </span>
        <button type="button" class="mg-panel-btn" aria-label="Toggle the right panel">
          <PanelRight :size="17" />
        </button>
      </div>
      <div class="mg-status">
        <button
          type="button"
          class="mg-pill"
          :aria-expanded="jobsOpen"
          @click="jobsOpen = !jobsOpen"
        >
          <i class="mg-spin" aria-hidden="true" />
          <span>Running</span>
          <span class="mg-badge">Queued {{ JOBS.length - 1 }}</span>
          <span class="mg-hairline" :style="{ width: `${JOBS[0]!.progress}%` }" />
        </button>
        <template v-if="jobsOpen">
          <div v-for="job in JOBS" :key="job.title" class="mg-job">
            <i v-if="job.progress !== undefined" class="mg-spin is-small" aria-hidden="true" />
            <i v-else class="mg-job-dot" aria-hidden="true" />
            <span class="mg-job-text">
              <span class="mg-job-title">{{ job.title }}</span>
              <span class="mg-job-sub">{{ job.sub }}</span>
            </span>
            <button type="button" class="mg-job-stop" :aria-label="`Stop this run ${job.title}`">
              <i />
            </button>
            <span
              v-if="job.progress !== undefined"
              class="mg-hairline"
              :style="{ width: `${job.progress}%` }"
            />
          </div>
          <div class="mg-job-foot">
            <button type="button" class="mg-foot-btn">
              <Images :size="12" />Results (4)<ChevronDown :size="12" />
            </button>
            <span class="mg-foot-group">
              <button type="button" class="mg-foot-btn">Clear queue</button>
              <span class="mg-foot-sep" />
              <button type="button" class="mg-foot-btn">
                <i class="mg-foot-square" />Cancel all
              </button>
            </span>
          </div>
        </template>
      </div>
    </div>
    <button v-if="current" type="button" class="mg-search" aria-label="Search nodes">
      <Search :size="14" />
    </button>

    <!-- Canvas controls and minimap. -->
    <div class="mg-corner">
      <div
        v-if="showMap"
        class="mg-map"
        :style="{ width: `${MAP_W}px`, height: `${(world.h / world.w) * MAP_W}px` }"
        aria-hidden="true"
        @click="onMap"
      >
        <svg :viewBox="`0 0 ${world.w} ${world.h}`" preserveAspectRatio="none">
          <rect
            v-for="b in boxes"
            :key="b.node.id"
            :x="b.node.x"
            :y="b.node.y"
            :width="b.node.w"
            :height="b.h"
            :rx="current ? 6 : 14"
          />
          <rect
            class="mg-map-view"
            :x="mapView.x"
            :y="mapView.y"
            :width="mapView.w"
            :height="mapView.h"
            :rx="current ? 4 : 18"
          />
        </svg>
      </div>
      <div class="mg-tools">
        <button
          type="button"
          class="mg-tool"
          :class="tool === 'select' && 'is-on'"
          aria-label="Select"
          @click="tool = 'select'"
        >
          <MousePointer2 :size="14" />
        </button>
        <button
          type="button"
          class="mg-tool"
          :class="tool === 'hand' && 'is-on'"
          aria-label="Pan"
          @click="tool = 'hand'"
        >
          <Hand :size="14" />
        </button>
        <button
          type="button"
          class="mg-tool"
          :class="labels && 'is-on'"
          aria-label="Socket labels"
          title="Socket labels"
          @click="labels = !labels"
        >
          <Tag :size="14" />
        </button>
        <span class="mg-tools-sep" />
        <button type="button" class="mg-tool" aria-label="Zoom out" @click="zoomAt(view.k / 1.2)">
          <Minus :size="14" />
        </button>
        <span class="mg-zoom">{{ Math.round(view.k * 100) }}%</span>
        <button type="button" class="mg-tool" aria-label="Zoom in" @click="zoomAt(view.k * 1.2)">
          <Plus :size="14" />
        </button>
        <span class="mg-tools-sep" />
        <button type="button" class="mg-tool" aria-label="Fit view" @click="fit">
          <Maximize :size="14" />
        </button>
        <button
          type="button"
          class="mg-tool"
          :class="showMap && 'is-on'"
          aria-label="Minimap"
          @click="showMap = !showMap"
        >
          <MapIcon :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<!-- Unscoped: Pablo's button reset beats scoped rules, so buttons here go
     through `:root .proto-ui.proto-ui.proto-ui`. Every class is `mg-`. -->
<style>
/* ── Tokens. Glass reads the Void palette; Current uses ComfyUI's own. ── */
.mg {
  --mg-canvas: var(--color-content-background);
  --mg-dot: color-mix(in oklch, var(--color-base-foreground) 11%, transparent);
  --mg-node: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  --mg-node-on: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
  --mg-well: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  --mg-float: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  --mg-hover: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  --mg-text: var(--color-base-foreground);
  --mg-muted: var(--color-muted-foreground);
  --mg-dim: var(--color-subtle-foreground);
  --mg-ring: var(--color-content-background);
  --mg-radius: 18px;
  --mg-radius-in: 10px;
  --mg-run: var(--color-inverted-background);
  --mg-run-text: var(--color-inverted-foreground);
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: var(--mg-canvas);
  color: var(--mg-text);
  font-family: Inter, var(--font-sans, system-ui), sans-serif;
  font-size: 13px;
  user-select: none;
}
:root[data-ds-theme='light'] .mg {
  --mg-canvas: oklch(0.955 0.003 285);
  --mg-dot: oklch(0 0 0 / 0.13);
  --mg-node: oklch(1 0 0 / 0.72);
  --mg-node-on: oklch(1 0 0 / 0.92);
  --mg-well: oklch(0 0 0 / 0.04);
  --mg-float: oklch(1 0 0 / 0.72);
  --mg-hover: oklch(0 0 0 / 0.05);
  --mg-ring: oklch(0.955 0.003 285);
}

/* ── Canvas. ── */
.mg-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  background: radial-gradient(circle at 1px 1px, var(--mg-dot) 1px, transparent 1.4px) var(--mg-gx)
    var(--mg-gy) / var(--mg-gs) var(--mg-gs);
}
.mg-canvas.is-hand {
  cursor: grab;
}
.mg-world {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}
.mg-links {
  position: absolute;
  inset: 0;
  overflow: visible;
  pointer-events: none;
}
.mg-link {
  fill: none;
  stroke-width: 1.75;
  stroke-linecap: round;
  opacity: 0.7;
}
.mg-link.is-live {
  opacity: 0.95;
}

/* ── Floating chrome (Glass): rail, Run bar, controls. ── */
.mg-rail {
  position: absolute;
  top: calc(var(--mg-top) + 16px);
  left: 16px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  border-radius: 16px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
}
.mg-rail-gap {
  height: 1px;
  margin: 6px 8px;
  background: color-mix(in oklch, var(--color-base-foreground) 9%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mg-rail-btn {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--mg-muted);
}
:root .proto-ui.proto-ui.proto-ui .mg-rail-btn.is-on,
:root .proto-ui.proto-ui.proto-ui .mg-rail-btn:hover {
  background: var(--mg-hover);
  color: var(--mg-text);
}
.mg-tools-sep {
  width: 1px;
  height: 16px;
  flex: none;
  background: color-mix(in oklch, var(--color-base-foreground) 12%, transparent);
}

/* ── Run block (ComfyUI_frontend#17679), in the Home's language: the
   action bar, then the status pill and its job rows, all borderless
   translucent surfaces. ── */
.mg-runblock {
  position: absolute;
  top: calc(var(--mg-top) + 16px);
  right: 16px;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.mg-actionbar {
  display: flex;
  height: 44px;
  align-items: center;
  gap: 6px;
  padding: 0 6px 0 4px;
  border-radius: 16px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
  color: var(--mg-muted);
}
.mg-grip {
  width: 8px;
  height: 16px;
  margin: 0 2px 0 4px;
  background: radial-gradient(circle, currentColor 1px, transparent 1.4px) 0 0 / 4px 4px;
  opacity: 0.6;
}
.mg-batch {
  display: inline-flex;
  height: 32px;
  align-items: stretch;
  overflow: hidden;
  border-radius: 10px;
  background: var(--mg-well);
  color: var(--mg-text);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.mg-batch-n {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
}
.mg-batch-step {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 6px;
  box-shadow: inset 1px 0 0 color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
  color: var(--mg-dim);
}
.mg-batch-step svg + svg {
  margin-top: -2px;
}
.mg-run-group {
  display: inline-flex;
  height: 32px;
  overflow: hidden;
  border-radius: 10px;
  background: var(--mg-run);
}
:root .proto-ui.proto-ui.proto-ui .mg-run,
:root .proto-ui.proto-ui.proto-ui .mg-run-more {
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  border-radius: 0;
  background: transparent;
  color: var(--mg-run-text);
  font-size: 14px;
  font-weight: 600;
}
:root .proto-ui.proto-ui.proto-ui .mg-run {
  min-width: 88px;
}
:root .proto-ui.proto-ui.proto-ui .mg-run-more {
  width: 28px;
  padding: 0;
  box-shadow: inset 1px 0 0 color-mix(in oklch, var(--mg-run-text) 25%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mg-panel-btn {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--mg-muted);
}
:root .proto-ui.proto-ui.proto-ui .mg-panel-btn:hover {
  background: var(--mg-hover);
  color: var(--mg-text);
}

.mg-status {
  display: flex;
  width: 320px;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
:root .proto-ui.proto-ui.proto-ui .mg-pill {
  position: relative;
  display: inline-flex;
  height: 36px;
  min-width: 176px;
  align-items: center;
  gap: 8px;
  padding: 0 8px 0 10px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
  color: var(--mg-text);
  font-size: 14px;
}
.mg-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  color: var(--mg-muted);
  font-size: 12px;
  font-weight: 500;
}
.mg-hairline {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: color-mix(in oklch, var(--color-base-foreground) 70%, transparent);
}
.mg-spin {
  width: 15px;
  height: 15px;
  flex: none;
  border: 2px solid color-mix(in oklch, var(--color-base-foreground) 20%, transparent);
  border-top-color: color-mix(in oklch, var(--color-base-foreground) 80%, transparent);
  border-radius: 999px;
  animation: mg-spin 0.9s linear infinite;
}
.mg-spin.is-small {
  width: 13px;
  height: 13px;
  margin: 0 1.5px;
}
@keyframes mg-spin {
  to {
    transform: rotate(360deg);
  }
}
.mg-job {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px 12px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
}
.mg-job-dot {
  width: 6px;
  height: 6px;
  flex: none;
  margin: 0 5px;
  border-radius: 999px;
  background: var(--mg-muted);
}
.mg-job-text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.mg-job-title {
  overflow: hidden;
  color: var(--mg-text);
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mg-job-sub {
  color: var(--mg-muted);
  font-size: 12px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}
:root .proto-ui.proto-ui.proto-ui .mg-job-stop {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--mg-muted);
}
:root .proto-ui.proto-ui.proto-ui .mg-job-stop:hover {
  background: var(--mg-hover);
  color: var(--mg-text);
}
.mg-job-stop i,
.mg-foot-square {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: currentColor;
}
.mg-foot-square {
  width: 10px;
  height: 10px;
}
.mg-job-foot {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 4px;
  border-radius: 12px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
}
.mg-foot-group {
  display: flex;
  align-items: center;
  gap: 2px;
}
.mg-foot-sep {
  width: 1px;
  height: 16px;
  margin: 0 2px;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mg-foot-btn {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border-radius: 8px;
  background: transparent;
  color: var(--mg-muted);
  font-size: 12px;
}
:root .proto-ui.proto-ui.proto-ui .mg-foot-btn:hover {
  background: var(--mg-hover);
  color: var(--mg-text);
}
.mg-corner {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.mg-map {
  overflow: hidden;
  border-radius: 14px;
  background: var(--mg-float);
  backdrop-filter: blur(24px);
  cursor: pointer;
}
.mg-map svg {
  display: block;
  width: 100%;
  height: 100%;
}
.mg-map rect {
  fill: color-mix(in oklch, var(--color-base-foreground) 18%, transparent);
}
.mg-map .mg-map-view {
  fill: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  stroke: color-mix(in oklch, var(--color-base-foreground) 45%, transparent);
  stroke-width: 1.25;
  vector-effect: non-scaling-stroke;
}
.mg-tools {
  display: flex;
  height: 36px;
  align-items: center;
  gap: 2px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
}
:root .proto-ui.proto-ui.proto-ui .mg-tool {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--mg-muted);
}
:root .proto-ui.proto-ui.proto-ui .mg-tool:hover,
:root .proto-ui.proto-ui.proto-ui .mg-tool.is-on {
  background: var(--mg-hover);
  color: var(--mg-text);
}
.mg-tools-sep {
  margin: 0 4px;
}
.mg-zoom {
  min-width: 38px;
  color: var(--mg-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}

/* ── Current: ComfyUI as it looks today (frontend v1), in the same
   structure. Flat grey nodes with a darker title, pill widgets with
   arrows, thick outlined links on a lined grid, the blue Run. ── */
.mg.is-current {
  --mg-canvas: #202020;
  --mg-dot: rgb(255 255 255 / 0.045);
  --mg-node: #353535;
  --mg-node-on: #353535;
  --mg-head-bg: #2b2b2b;
  --mg-well: #222;
  --mg-well-line: #666;
  --mg-text: #ddd;
  --mg-muted: #aaa;
  --mg-dim: #999;
  --mg-title: #c4c4c4;
  --mg-ring: transparent;
  --mg-hover: rgb(255 255 255 / 0.08);
  --mg-chrome: #171718;
  --mg-chrome-2: #262729;
  --mg-chrome-line: #0a0a0a;
  --mg-radius: 8px;
  --mg-radius-in: 10px;
  --mg-run: #f2f2f2;
  --mg-run-text: #111;
  display: grid;
  grid-template-rows: 38px 1fr;
  grid-template-columns: 52px 1fr;
  padding-top: var(--mg-top);
  background: var(--mg-canvas);
  font-family: Inter, Arial, sans-serif;
  font-size: 12px;
}
:root[data-ds-theme='light'] .mg.is-current {
  --mg-canvas: #e4e4e4;
  --mg-dot: rgb(0 0 0 / 0.06);
  --mg-node: #f2f2f2;
  --mg-node-on: #f2f2f2;
  --mg-head-bg: #e2e2e2;
  --mg-well: #fff;
  --mg-well-line: #bbb;
  --mg-text: #222;
  --mg-muted: #444;
  --mg-dim: #777;
  --mg-title: #222;
  --mg-chrome: #f4f4f5;
  --mg-chrome-2: #e7e7e9;
  --mg-chrome-line: #d4d4d8;
  --mg-hover: rgb(0 0 0 / 0.06);
  --mg-run: #222;
  --mg-run-text: #fff;
}
.is-current .mg-canvas {
  position: relative;
  inset: auto;
  grid-row: 2;
  grid-column: 2;
  background:
    linear-gradient(var(--mg-dot) 1px, transparent 1px) var(--mg-gx) var(--mg-gy) / var(--mg-gs)
      var(--mg-gs),
    linear-gradient(90deg, var(--mg-dot) 1px, transparent 1px) var(--mg-gx) var(--mg-gy) /
      var(--mg-gs) var(--mg-gs);
}
.mg-topbar {
  z-index: 4;
  display: flex;
  grid-row: 1;
  grid-column: 1 / -1;
  align-items: flex-end;
  gap: 2px;
  padding-right: 8px;
  background: var(--mg-chrome);
  box-shadow: inset 0 -1px 0 var(--mg-chrome-line);
  color: var(--mg-muted);
}
.mg-logo {
  display: inline-flex;
  width: 52px;
  height: 38px;
  align-items: center;
  justify-content: center;
  color: #f0ff41;
  font-size: 17px;
  font-weight: 800;
  font-style: italic;
}
:root[data-ds-theme='light'] .mg-logo {
  color: #1a1a1a;
}
.mg-tab {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 12px;
  border-radius: 6px 6px 0 0;
  font-size: 12px;
}
.mg-tab svg {
  opacity: 0.6;
}
.mg-tab.is-on {
  background: var(--mg-chrome-2);
  color: var(--mg-text);
}
.mg-tab-add {
  margin: 0 0 9px 6px;
}
.is-current .mg-rail {
  position: relative;
  top: auto;
  left: auto;
  grid-row: 2;
  grid-column: 1;
  gap: 4px;
  padding: 8px 4px;
  border-radius: 0;
  background: var(--mg-chrome);
  box-shadow: inset -1px 0 0 var(--mg-chrome-line);
  backdrop-filter: none;
}
:root .proto-ui.proto-ui.proto-ui .is-current .mg-rail-btn {
  width: 44px;
  height: 46px;
  border-radius: 6px;
}
.mg-rail-label {
  font-size: 9.5px;
  line-height: 1;
}
.is-current .mg-rail-gap {
  flex: 1;
  background: none;
}
.mg-link-shade {
  fill: none;
  stroke: rgb(0 0 0 / 0.5);
  stroke-width: 5.5;
}
:root[data-ds-theme='light'] .mg-link-shade {
  stroke: rgb(0 0 0 / 0.22);
}
.is-current .mg-link {
  stroke-width: 3;
  opacity: 1;
}

/* Current: the same run block on ComfyUI's chrome, with its hairline
   borders, under the top bar. */
.is-current .mg-runblock {
  top: calc(var(--mg-top) + 38px + 12px);
}
.is-current :is(.mg-actionbar, .mg-job, .mg-job-foot) {
  border-radius: 8px;
  background: var(--mg-chrome-2);
  box-shadow: 0 0 0 1px var(--mg-chrome-line);
  backdrop-filter: none;
}
:root .proto-ui.proto-ui.proto-ui .is-current .mg-pill {
  border-radius: 8px;
  background: var(--mg-chrome-2);
  box-shadow: 0 0 0 1px var(--mg-chrome-line);
  backdrop-filter: none;
}
.is-current :is(.mg-batch, .mg-run-group) {
  border-radius: 8px;
}
:root .proto-ui.proto-ui.proto-ui .is-current .mg-panel-btn {
  border-radius: 6px;
}
:root .proto-ui.proto-ui.proto-ui .mg-search {
  position: absolute;
  top: calc(var(--mg-top) + 38px + 12px);
  left: 64px;
  z-index: 4;
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  background: var(--mg-chrome-2);
  box-shadow: 0 0 0 1px var(--mg-chrome-line);
  color: var(--mg-muted);
}
.is-current .mg-corner {
  gap: 6px;
}
.is-current :is(.mg-map, .mg-tools) {
  border-radius: 6px;
  background: var(--mg-chrome-2);
  box-shadow: 0 0 0 1px var(--mg-chrome-line);
  backdrop-filter: none;
}
.is-current .mg-tools {
  height: 34px;
}
.is-current .mg-map rect:not(.mg-map-view) {
  fill: #5a5a5a;
}
:root[data-ds-theme='light'] .is-current .mg-map rect:not(.mg-map-view) {
  fill: #bdbdbd;
}
:root .proto-ui.proto-ui.proto-ui .is-current .mg-tool {
  border-radius: 4px;
}
</style>
