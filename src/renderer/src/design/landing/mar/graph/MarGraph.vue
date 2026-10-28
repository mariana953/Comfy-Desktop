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
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Hand,
  History,
  Images,
  Keyboard,
  LayoutTemplate,
  Map as MapIcon,
  Maximize,
  Minus,
  MousePointer2,
  Play,
  Plus,
  Search,
  Settings,
  Square,
  Workflow,
  X
} from 'lucide-vue-next'
import portrait from '../assets/portrait-sun.jpg'
import { graphStyle } from './graphStyle'
import {
  GEOMETRY,
  GROUPS,
  LINKS,
  TYPES,
  createNodes,
  nodeHeight,
  portY,
  rows,
  widgetHeight,
  widgetsTop,
  type GNode
} from './graphData'

/**
 * ComfyUI's graph editor as a mock, in Mar's proposal (a build's tab). Two
 * looks over one graph: Glass, the Home's language (translucent borderless
 * nodes on a calm dot grid, a floating bar with Run), and Current, ComfyUI
 * as it looks today (frontend v1) in the same new structure. The canvas
 * pans (drag the background), zooms (wheel, the zoom pill) and nodes move
 * by their title, so it reads as the real thing.
 */
const { workflow = 'portrait-sun' } = defineProps<{ workflow?: string }>()

const current = computed(() => graphStyle.id === 'current')
const g = computed(() => GEOMETRY[graphStyle.id])
const nodes = reactive(createNodes())
const byId = computed(() => Object.fromEntries(nodes.map((n) => [n.id, n])))
const selected = ref('')

const links = computed(() =>
  LINKS.map(([a, ai, b, bi]) => {
    const from = byId.value[a]!
    const to = byId.value[b]!
    const x1 = from.x + from.w
    const y1 = portY(from, ai, g.value)
    const x2 = to.x
    const y2 = portY(to, bi, g.value)
    const dx = Math.max(50, Math.abs(x2 - x1) * 0.45)
    return {
      d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`,
      color: TYPES[from.outs[ai]!.type]!,
      live: a === 'ks' || b === 'ks'
    }
  })
)

const groups = computed(() =>
  GROUPS.map((gr) => {
    const ns = gr.nodes.map((id) => byId.value[id]!)
    const x = Math.min(...ns.map((n) => n.x)) - 20
    const y = Math.min(...ns.map((n) => n.y)) - 48
    const r = Math.max(...ns.map((n) => n.x + n.w)) + 20
    const b = Math.max(...ns.map((n) => n.y + nodeHeight(n, g.value))) + 20
    return { title: gr.title, x, y, w: r - x, h: b - y }
  })
)

// The world: big enough for every node, with a margin.
const world = computed(() => ({
  w: Math.max(...nodes.map((n) => n.x + n.w)) + 40,
  h: Math.max(...nodes.map((n) => n.y + nodeHeight(n, g.value))) + 40
}))

// The view: pan (x, y) and zoom (k), in the canvas's CSS pixels.
const view = reactive({ x: 0, y: 0, k: 0.9 })
const host = ref<HTMLElement>()
const canvas = ref<HTMLElement>()
const size = reactive({ w: 0, h: 0 })
/** How much of the tab sits under the title bar, so nothing hides there. */
const top = ref(0)
/** The screen simulator scales the whole app; pointer maths undoes it. */
let screenScale = 1

function measure(): void {
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return
  const r = el.getBoundingClientRect()
  screenScale = r.height / (el.offsetHeight || 1) || 1
  const bar = document.querySelector('.proto-ui > .glass-titlebar')
  const under = bar ? (bar.getBoundingClientRect().bottom - r.top) / screenScale : 0
  top.value = Math.max(0, Math.round(under))
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
    const n = byId.value[drag.id!]!
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
onMounted(() => {
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

// Switching look changes the geometry and the layout: frame it again.
watch(
  () => graphStyle.id,
  () => nextTick(fit)
)

const RAIL: { icon: Component; label: string }[] = [
  { icon: History, label: 'Queue' },
  { icon: Boxes, label: 'Nodes' },
  { icon: Images, label: 'Models' },
  { icon: Workflow, label: 'Workflows' },
  { icon: LayoutTemplate, label: 'Templates' },
  { icon: FolderOpen, label: 'Assets' }
]

const ext = (n: GNode): number => nodeHeight(n, g.value)
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
        :title="r.label"
        :aria-label="r.label"
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
        <div
          v-for="gr in groups"
          :key="gr.title"
          class="mg-group"
          :style="{ left: `${gr.x}px`, top: `${gr.y}px`, width: `${gr.w}px`, height: `${gr.h}px` }"
        >
          <span class="mg-group-title">{{ gr.title }}</span>
        </div>

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

        <section
          v-for="n in nodes"
          :key="n.id"
          class="mg-node"
          :class="[n.state && `is-${n.state}`, selected === n.id && 'is-selected']"
          :data-node="n.id"
          :style="{ left: `${n.x}px`, top: `${n.y}px`, width: `${n.w}px`, height: `${ext(n)}px` }"
          :aria-label="n.title"
        >
          <header class="mg-head" :data-node-head="n.id" :style="{ height: `${g.head}px` }">
            <span v-if="current" class="mg-head-dot" />
            <span class="mg-head-title">{{ n.title }}</span>
            <span v-if="n.state === 'running' && !current" class="mg-head-status">
              <i class="mg-pulse" />{{ n.steps }}
            </span>
            <span
              v-if="n.state === 'running'"
              class="mg-head-progress"
              :style="{ width: `${(n.progress ?? 0) * 100}%` }"
            />
          </header>

          <!-- Slots: inputs on the left edge, outputs on the right. -->
          <div
            v-for="r in rows(n)"
            :key="r"
            class="mg-slot"
            :style="{ top: `${g.head + 6 + (r - 1) * g.row}px`, height: `${g.row}px` }"
          >
            <span v-if="n.ins[r - 1]" class="mg-in">
              <i class="mg-port" :style="{ '--mg-port': TYPES[n.ins[r - 1]!.type] }" />{{
                n.ins[r - 1]!.name
              }}
            </span>
            <span v-else />
            <span v-if="n.outs[r - 1]" class="mg-out">
              {{ n.outs[r - 1]!.name
              }}<i class="mg-port" :style="{ '--mg-port': TYPES[n.outs[r - 1]!.type] }" />
            </span>
          </div>

          <!-- Widgets. -->
          <div class="mg-widgets" :style="{ top: `${widgetsTop(n, g)}px`, gap: `${g.gap}px` }">
            <div
              v-for="w in n.widgets"
              :key="w.name"
              class="mg-w"
              :class="`is-${w.kind}`"
              :style="{ height: `${widgetHeight(w, g)}px` }"
            >
              <p v-if="w.kind === 'text'" class="mg-w-text">{{ w.value }}</p>
              <template v-else>
                <span
                  v-if="w.kind === 'slider'"
                  class="mg-w-fill"
                  :style="{ width: `${w.fill * 100}%` }"
                />
                <ChevronLeft v-if="w.kind === 'number'" :size="12" class="mg-w-arrow" />
                <span class="mg-w-name">{{ w.name }}</span>
                <span v-if="w.kind === 'toggle'" class="mg-w-value">
                  <template v-if="current">{{ w.value }}</template>
                  <i class="mg-switch" :class="w.value && 'is-on'" />
                </span>
                <span v-else class="mg-w-value">{{ w.value }}</span>
                <ChevronRight v-if="w.kind === 'number'" :size="12" class="mg-w-arrow" />
                <ChevronDown v-if="w.kind === 'combo'" :size="12" class="mg-w-arrow" />
              </template>
            </div>
            <figure v-if="n.image" class="mg-preview" :style="{ height: `${n.image}px` }">
              <img :src="portrait" alt="Latest output" draggable="false" />
              <span v-if="!current" class="mg-chip">1024 × 1280</span>
            </figure>
            <p v-if="n.image" class="mg-preview-caption">
              {{ current ? '1024 × 1280' : 'portrait-sun_00042.png' }}
            </p>
          </div>
        </section>
      </div>
    </div>

    <!-- Run: a floating bar in Glass, ComfyUI's action bar in Current. -->
    <div v-if="!current" class="mg-bar">
      <button type="button" class="mg-bar-name">{{ workflow }}<ChevronDown :size="14" /></button>
      <span class="mg-bar-sep" />
      <span class="mg-bar-queue">
        <svg class="mg-ring" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" />
          <circle cx="8" cy="8" r="6.5" pathLength="100" stroke-dasharray="50 100" />
        </svg>
        <span><b>Running</b> · 14 of 28</span>
        <span class="mg-bar-dim">3 queued</span>
      </span>
      <span class="mg-run-group">
        <button type="button" class="mg-run"><Play :size="12" fill="currentColor" />Run</button>
        <button type="button" class="mg-run-more" aria-label="Run options">
          <ChevronDown :size="14" />
        </button>
      </span>
    </div>
    <div v-else class="mg-actionbar">
      <span class="mg-grip" aria-hidden="true" />
      <button type="button" class="mg-run"><Play :size="13" fill="currentColor" />Run</button>
      <button type="button" class="mg-run-more" aria-label="Run options">
        <ChevronDown :size="14" />
      </button>
      <span class="mg-actionbar-count">1</span>
      <button type="button" class="mg-stop" aria-label="Stop"><Square :size="11" /></button>
      <button type="button" class="mg-stop" aria-label="Queue"><History :size="14" /></button>
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
            v-for="n in nodes"
            :key="n.id"
            :x="n.x"
            :y="n.y"
            :width="n.w"
            :height="ext(n)"
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
  position: relative;
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background:
    radial-gradient(ellipse 70% 60% at 22% 8%, oklch(0.42 0.06 305 / 0.2), transparent 70%),
    radial-gradient(ellipse 60% 50% at 88% 92%, oklch(0.5 0.05 60 / 0.12), transparent 70%),
    var(--mg-canvas);
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
:root[data-ds-theme='light'] .mg.is-glass {
  background:
    radial-gradient(ellipse 70% 60% at 22% 8%, oklch(0.85 0.05 305 / 0.35), transparent 70%),
    radial-gradient(ellipse 60% 50% at 88% 92%, oklch(0.88 0.05 60 / 0.3), transparent 70%),
    var(--mg-canvas);
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

/* Groups: a faint tinted area with its title, no outline. */
.mg-group {
  position: absolute;
  border-radius: 26px;
  background: color-mix(in oklch, var(--color-base-foreground) 3%, transparent);
}
.mg-group-title {
  position: absolute;
  top: 15px;
  left: 20px;
  color: var(--mg-dim);
  font-size: 12px;
  font-weight: 500;
}

/* ── Nodes (Glass): translucent, borderless, no lift. ── */
.mg-node {
  position: absolute;
  border-radius: var(--mg-radius);
  background: var(--mg-node);
  backdrop-filter: blur(24px) saturate(1.15);
}
.mg-node.is-selected {
  background: var(--mg-node-on);
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--color-base-foreground) 36%, transparent);
}
.mg-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px 0 16px;
  overflow: hidden;
  border-radius: var(--mg-radius) var(--mg-radius) 0 0;
  cursor: grab;
}
.mg-head-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mg-head-status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--mg-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.mg-pulse {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-status-running, #4ade80);
}
.mg-head-progress {
  position: absolute;
  bottom: 0;
  left: 16px;
  max-width: calc(100% - 32px);
  height: 2px;
  border-radius: 2px;
  background: var(--color-base-foreground);
  opacity: 0.55;
}

.mg-slot {
  position: absolute;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--mg-muted);
  font-size: 12px;
}
.mg-in,
.mg-out {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.mg-port {
  width: 9px;
  height: 9px;
  flex: none;
  border-radius: 999px;
  background: var(--mg-port);
  box-shadow: 0 0 0 2.5px var(--mg-ring);
}
.mg-in .mg-port {
  margin-left: -4.5px;
}
.mg-out .mg-port {
  margin-right: -4.5px;
}

/* Widgets: one quiet well per value, name left, value right. */
.mg-widgets {
  position: absolute;
  right: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
}
.mg-w {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 12px;
  overflow: hidden;
  border-radius: var(--mg-radius-in);
  background: var(--mg-well);
  font-size: 12px;
}
.mg-w-name {
  position: relative;
  flex: none;
  max-width: 55%;
  overflow: hidden;
  color: var(--mg-dim);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mg-w-value {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--mg-text);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.mg-w.is-toggle .mg-w-value {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.mg-w-arrow {
  position: relative;
  flex: none;
  color: var(--mg-dim);
  opacity: 0.55;
}
.mg-w.is-number .mg-w-arrow:first-child {
  margin-left: -4px;
}
.mg-w-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
}
.mg-w.is-text {
  align-items: flex-start;
  padding: 10px 12px;
}
.mg-w-text {
  margin: 0;
  color: var(--mg-text);
  font-size: 12.5px;
  line-height: 18px;
  user-select: text;
}
.mg-switch {
  position: relative;
  width: 26px;
  height: 16px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 16%, transparent);
}
.mg-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--color-content-background);
  transition: transform 160ms ease;
}
.mg-switch.is-on {
  background: var(--color-inverted-background);
}
.mg-switch.is-on::after {
  background: var(--color-inverted-foreground);
  transform: translateX(10px);
}

/* Output preview: the image, a grey chip on it, the file under it. */
.mg-preview {
  position: relative;
  flex: none;
  margin: 0;
  overflow: hidden;
  border-radius: 12px;
}
.mg-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mg-chip {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  height: 20px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  font-size: 11px;
  font-weight: 500;
}
.mg-preview-caption {
  height: 16px;
  margin: -2px 0 0;
  color: var(--mg-dim);
  font-size: 11.5px;
  text-align: center;
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
:root .proto-ui.proto-ui.proto-ui .mg-rail-btn:hover {
  background: var(--mg-hover);
  color: var(--mg-text);
}

.mg-bar {
  position: absolute;
  top: calc(var(--mg-top) + 16px);
  left: 50%;
  z-index: 3;
  display: flex;
  height: 44px;
  align-items: center;
  gap: 12px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--mg-float);
  backdrop-filter: blur(24px) saturate(1.2);
  transform: translateX(-50%);
  white-space: nowrap;
}
:root .proto-ui.proto-ui.proto-ui .mg-bar-name {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 6px;
  padding: 0 10px 0 12px;
  border-radius: 999px;
  background: transparent;
  color: var(--mg-text);
  font-size: 13px;
  font-weight: 500;
}
:root .proto-ui.proto-ui.proto-ui .mg-bar-name:hover {
  background: var(--mg-hover);
}
.mg-bar-name svg {
  color: var(--mg-dim);
}
.mg-bar-sep,
.mg-tools-sep {
  width: 1px;
  height: 16px;
  flex: none;
  background: color-mix(in oklch, var(--color-base-foreground) 12%, transparent);
}
.mg-bar-queue {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--mg-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.mg-bar-queue b {
  color: var(--mg-text);
  font-weight: 500;
}
.mg-bar-dim {
  padding-left: 4px;
  color: var(--mg-dim);
}
.mg-ring {
  width: 14px;
  height: 14px;
  transform: rotate(-90deg);
}
.mg-ring circle {
  fill: none;
  stroke: color-mix(in oklch, var(--color-base-foreground) 16%, transparent);
  stroke-width: 2.5;
}
.mg-ring circle + circle {
  stroke: var(--color-base-foreground);
  stroke-linecap: round;
}
.mg-run-group {
  display: inline-flex;
  gap: 1px;
}
:root .proto-ui.proto-ui.proto-ui .mg-bar .mg-run,
:root .proto-ui.proto-ui.proto-ui .mg-bar .mg-run-more {
  display: inline-flex;
  height: 32px;
  align-items: center;
  gap: 6px;
  padding: 0 14px 0 12px;
  border-radius: 999px 4px 4px 999px;
  background: var(--color-inverted-background);
  color: var(--color-inverted-foreground);
  font-size: 13px;
  font-weight: 600;
}
:root .proto-ui.proto-ui.proto-ui .mg-bar .mg-run-more {
  padding: 0 9px 0 7px;
  border-radius: 4px 999px 999px 4px;
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
  --mg-run: #2563eb;
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
.is-current .mg-group {
  border-radius: 4px;
  background: rgb(51 85 136 / 0.22);
  box-shadow: inset 0 0 0 1px rgb(80 120 180 / 0.5);
}
.is-current .mg-group-title {
  top: 6px;
  left: 10px;
  color: var(--mg-text);
  font-size: 18px;
  font-weight: 400;
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
.is-current .mg-node {
  backdrop-filter: none;
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.55),
    3px 4px 10px rgb(0 0 0 / 0.35);
}
:root[data-ds-theme='light'] .is-current .mg-node {
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.18),
    2px 3px 8px rgb(0 0 0 / 0.12);
}
.is-current .mg-node.is-selected {
  box-shadow:
    0 0 0 1.5px #fff,
    3px 4px 10px rgb(0 0 0 / 0.35);
}
:root[data-ds-theme='light'] .is-current .mg-node.is-selected {
  box-shadow: 0 0 0 1.5px #333;
}
.is-current .mg-node.is-running {
  box-shadow:
    0 0 0 2px #00d26a,
    3px 4px 10px rgb(0 0 0 / 0.35);
}
.is-current .mg-head {
  padding: 0 10px;
  background: var(--mg-head-bg);
}
.is-current .mg-head-title {
  color: var(--mg-title);
  font-weight: 400;
}
.mg-head-dot {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 999px;
  background: #777;
}
.is-current .mg-head-progress {
  top: 0;
  bottom: auto;
  left: 0;
  max-width: none;
  height: 3px;
  border-radius: 0;
  background: #00d26a;
  opacity: 1;
}
.is-current .mg-slot {
  font-size: 11.5px;
}
.is-current .mg-in,
.is-current .mg-out {
  gap: 8px;
}
.is-current .mg-in {
  padding-left: 10px;
}
.is-current .mg-out {
  padding-right: 10px;
}
.is-current .mg-port {
  box-shadow: none;
}
.is-current .mg-in .mg-port,
.is-current .mg-out .mg-port {
  margin: 0;
}
.is-current .mg-widgets {
  right: 12px;
  left: 12px;
}
.is-current .mg-w {
  gap: 6px;
  padding: 0 8px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--mg-well-line);
  font-size: 11.5px;
}
.is-current .mg-w-arrow {
  color: var(--mg-text);
  opacity: 0.8;
}
.is-current .mg-w.is-number .mg-w-arrow:first-child {
  margin-left: 0;
}
.is-current .mg-w-fill {
  background: #4a4a4a;
}
:root[data-ds-theme='light'] .is-current .mg-w-fill {
  background: #d4d4d4;
}
.is-current .mg-w.is-text {
  padding: 6px 8px;
  border-radius: 4px;
  box-shadow: none;
}
.is-current .mg-w-text {
  font-size: 12px;
  line-height: 16px;
}
.is-current .mg-switch {
  width: 10px;
  height: 10px;
  background: #888;
}
.is-current .mg-switch::after {
  display: none;
}
.is-current .mg-switch.is-on {
  background: #89b;
}
.is-current .mg-preview {
  border-radius: 0;
}
.is-current .mg-preview-caption {
  color: var(--mg-text);
}

.mg-actionbar {
  position: absolute;
  top: calc(var(--mg-top) + 38px + 12px);
  right: 16px;
  z-index: 4;
  display: flex;
  height: 40px;
  align-items: center;
  gap: 4px;
  padding: 0 6px 0 4px;
  border-radius: 8px;
  background: var(--mg-chrome-2);
  box-shadow:
    0 0 0 1px var(--mg-chrome-line),
    0 6px 16px rgb(0 0 0 / 0.35);
  color: var(--mg-muted);
}
.mg-grip {
  width: 8px;
  height: 18px;
  margin: 0 4px;
  background: radial-gradient(circle, currentColor 1px, transparent 1.4px) 0 0 / 4px 4px;
  opacity: 0.6;
}
:root .proto-ui.proto-ui.proto-ui .mg-actionbar .mg-run,
:root .proto-ui.proto-ui.proto-ui .mg-actionbar .mg-run-more {
  display: inline-flex;
  height: 30px;
  align-items: center;
  gap: 6px;
  padding: 0 14px 0 12px;
  border-radius: 6px 0 0 6px;
  background: var(--mg-run);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}
:root .proto-ui.proto-ui.proto-ui .mg-actionbar .mg-run-more {
  margin-left: -4px;
  padding: 0 6px;
  border-radius: 0 6px 6px 0;
  box-shadow: inset 1px 0 0 rgb(255 255 255 / 0.25);
}
.mg-actionbar-count {
  display: inline-flex;
  height: 30px;
  min-width: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--mg-well);
  color: var(--mg-text);
  font-variant-numeric: tabular-nums;
}
:root .proto-ui.proto-ui.proto-ui .mg-stop,
:root .proto-ui.proto-ui.proto-ui .mg-search {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--mg-muted);
}
:root .proto-ui.proto-ui.proto-ui .mg-search {
  position: absolute;
  top: calc(var(--mg-top) + 38px + 12px);
  left: 64px;
  z-index: 4;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--mg-chrome-2);
  box-shadow: 0 0 0 1px var(--mg-chrome-line);
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
