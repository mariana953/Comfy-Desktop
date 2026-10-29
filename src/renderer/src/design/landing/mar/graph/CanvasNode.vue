<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  Download,
  LayoutGrid,
  Pause,
  Play,
  Trash2
} from 'lucide-vue-next'
import { NODE_ICONS } from './nodeIcons'
import {
  SOCKETS,
  canvasNodeHeight,
  controlsHeight,
  mediaOf,
  type CanvasGeometry,
  type Control,
  type SNode,
  type SocketType
} from './canvasData'

/**
 * One node of the Canvas mode (the simpler layer over ComfyUI). Its title
 * sits above it, its result fills it, its controls hang below in their
 * own panel, and its typed sockets stick out of the preview's edges.
 * Socket names show where a node takes more than one input, or all of
 * them with the socket labels switch (canvas controls). Its widgets are
 * live: the graph owns the values, the node only reports edits. Selected,
 * its title shows its actions (run up to here, duplicate, delete).
 */
const { node, g, current, labels, selected, wiring, locked, solo } = defineProps<{
  node: SNode
  g: CanvasGeometry
  current: boolean
  labels: boolean
  selected: boolean
  /** A link being drawn: its type, and the side it started from. */
  wiring?: { type: SocketType; side: 'in' | 'out'; node: string }
  /** In a locked group: skipped by runs. */
  locked?: boolean
  /** The only node selected: its title shows its actions. */
  solo?: boolean
}>()
const emit = defineEmits<{
  set: [key: string, value: string | number]
  text: [value: string]
  resume: []
  action: [key: string]
  pick: [index: number]
  view: []
}>()

const ICONS = NODE_ICONS
const media = computed(() => mediaOf(node))
const height = computed(() => canvasNodeHeight(node, g))
const controls = computed(() => controlsHeight(node, g))

const running = computed(() => node.state === 'running')
/** The step count over the preview, for the nodes that take a while. */
const showProgress = computed(() => running.value && (node.steps ?? 0) > 1)
/** Text you write (a prompt, a template) or text a model wrote. */
const editable = computed(() => node.kind === 'prompt' || node.kind === 'promptConstructor')
const shown = computed(() => node.history[node.pick])
const cutout = computed(() => !!node.cutout)

/** A word beside the title for where the node stands. */
const tag = computed(() => {
  if (locked) return 'Skipped'
  if (node.state === 'queued') return 'Queued'
  if (node.state === 'error') return 'Error'
  if (node.state === 'running' && !showProgress.value) return 'Running'
  if (node.stale) return 'Outdated'
  if (node.state === 'done') return 'Done'
  return ''
})

// A combo's or the model's options open under it; a click elsewhere
// (which selects another node, or none) closes them.
const open = ref<number | null>(null)
watch(
  () => selected,
  (on) => !on && (open.value = null)
)
function choose(c: Control, value: string): void {
  emit('set', c.key, value)
  open.value = null
}
const menuTop = (i: number): string => `${6 + (i + 1) * (g.control + g.gap)}px`

// Sliders follow the pointer, in steps of 0.05.
function slide(c: Control, e: PointerEvent): void {
  if (e.type === 'pointermove' && !(e.buttons & 1)) return
  const el = e.currentTarget as HTMLElement
  if (e.type === 'pointerdown') el.setPointerCapture(e.pointerId)
  const r = el.getBoundingClientRect()
  const v = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  emit('set', c.key, Math.round(v * 20) / 20)
}

// Compare: the divider follows the pointer across the pictures.
const split = ref(0.5)
function divide(e: PointerEvent): void {
  if (e.type === 'pointermove' && !(e.buttons & 1)) return
  const el = e.currentTarget as HTMLElement
  if (e.type === 'pointerdown') el.setPointerCapture(e.pointerId)
  const r = el.getBoundingClientRect()
  split.value = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
}

/** The constructor's variables: its inputs, insertable as @name. */
const area = ref<HTMLTextAreaElement>()
function insertVar(name: string): void {
  const el = area.value
  const t = node.text ?? ''
  const at = el?.selectionStart ?? t.length
  emit('text', `${t.slice(0, at)}@${name}${t.slice(at)}`)
}

/** An audio clip's waveform, the same every time for the same node. */
const bars = computed(() =>
  Array.from({ length: 44 }, (_, i) => {
    const h = Math.abs(Math.sin(i * 0.9 + node.id.length) * Math.cos(i * 0.37))
    return 0.18 + h * 0.82
  })
)

/** A socket a link being drawn could end on, or one it can't. */
function socketFit(side: 'in' | 'out', type: SocketType): string {
  if (!wiring) return ''
  if (wiring.node === node.id || wiring.side === side) return 'is-off'
  return wiring.type === type ? 'is-fit' : 'is-off'
}
</script>

<template>
  <section
    class="sg-node"
    :class="[
      `is-${node.kind}`,
      selected && 'is-selected',
      running && 'is-running',
      node.state === 'error' && 'is-error',
      locked && 'is-locked',
      open !== null && 'is-menu'
    ]"
    :data-node="node.id"
    :style="{
      left: `${node.x}px`,
      top: `${node.y}px`,
      width: `${node.w}px`,
      height: `${height}px`
    }"
    :aria-label="node.title"
  >
    <header class="sg-head" :data-node-head="node.id" :style="{ height: `${g.head}px` }">
      <component :is="ICONS[node.kind]" v-if="!current" :size="13" class="sg-head-icon" />
      <span v-else class="sg-dot" />
      <span class="sg-head-title">{{ node.title }}</span>
      <span v-if="node.badge && !solo" class="sg-badge">{{ node.badge }}</span>
      <span
        v-if="tag && !solo"
        class="sg-state"
        :class="`is-${locked ? 'locked' : node.state === 'error' ? 'error' : node.stale && !running ? 'stale' : node.state}`"
      >
        <Check v-if="tag === 'Done'" :size="11" />{{ tag }}
      </span>
      <span v-if="solo" class="sg-actions">
        <button
          type="button"
          class="sg-act"
          title="Run up to here"
          aria-label="Run up to here"
          @click="emit('action', 'run')"
        >
          <Play :size="11" fill="currentColor" />
        </button>
        <button
          type="button"
          class="sg-act"
          title="Duplicate"
          aria-label="Duplicate"
          @click="emit('action', 'duplicate')"
        >
          <Copy :size="12" />
        </button>
        <button
          type="button"
          class="sg-act"
          title="Delete"
          aria-label="Delete"
          @click="emit('action', 'delete')"
        >
          <Trash2 :size="12" />
        </button>
      </span>
    </header>

    <!-- The main element: the result, or the text. -->
    <div class="sg-body" :style="{ height: `${node.body}px` }">
      <template v-if="media === 'text'">
        <textarea
          v-if="editable"
          ref="area"
          class="sg-text"
          :class="node.kind === 'promptConstructor' && 'has-foot'"
          :value="node.text"
          :aria-label="node.title"
          spellcheck="false"
          :placeholder="
            node.kind === 'prompt' ? 'Describe the image' : 'Type @ to insert a variable'
          "
          @input="emit('text', ($event.target as HTMLTextAreaElement).value)"
        />
        <p v-else-if="node.text" class="sg-text is-result">{{ node.text }}</p>
        <p v-else class="sg-empty">
          <component :is="ICONS[node.kind]" :size="16" />Writes here when it runs
        </p>
        <span v-if="node.kind === 'prompt'" class="sg-count"
          >{{ node.text?.length ?? 0 }} chars</span
        >
        <span v-if="node.kind === 'promptConstructor'" class="sg-vars">
          <button
            v-for="s in node.ins"
            :key="s.name"
            type="button"
            class="sg-var"
            @click="insertVar(s.name)"
          >
            @{{ s.name }}
          </button>
        </span>
      </template>

      <div v-else-if="media === 'pause'" class="sg-pause">
        <span class="sg-pause-icon"><Pause :size="14" fill="currentColor" /></span>
        <template v-if="node.state === 'paused'">
          <span class="sg-pause-title">Paused</span>
          <span class="sg-pause-note">Refine, then resume</span>
          <button type="button" class="sg-resume" @click="emit('resume')">
            <Play :size="11" fill="currentColor" />Resume
          </button>
        </template>
        <template v-else>
          <span class="sg-pause-title">Pause</span>
          <span class="sg-pause-note">The run waits here for you</span>
        </template>
      </div>

      <div v-else-if="media === 'audio'" class="sg-audio">
        <span class="sg-play"><Play :size="12" fill="currentColor" /></span>
        <span class="sg-wave" :class="running && 'is-working'">
          <i v-for="(b, i) in bars" :key="i" :style="{ height: `${b * 100}%` }" />
        </span>
        <span class="sg-audio-time">{{ node.text ?? node.chip ?? '0:00' }}</span>
      </div>

      <div
        v-else-if="media === 'compare'"
        class="sg-compare"
        @pointerdown="divide"
        @pointermove="divide"
      >
        <template v-if="node.pair">
          <img :src="node.pair[0]" alt="" draggable="false" class="sg-img" />
          <img
            :src="node.pair[1]"
            alt=""
            draggable="false"
            class="sg-img"
            :style="{ clipPath: `inset(0 0 0 ${split * 100}%)` }"
          />
          <span class="sg-divider" :style="{ left: `${split * 100}%` }"><i /></span>
          <span class="sg-chip">Before</span>
          <span class="sg-chip is-right">After</span>
        </template>
        <p v-else class="sg-empty"><Columns2 :size="16" />Connect two images</p>
      </div>

      <div v-else-if="media === 'gallery'" class="sg-gallery">
        <img
          v-for="(r, i) in [...node.history].reverse()"
          :key="i"
          :src="r.src"
          alt=""
          draggable="false"
          @dblclick="(emit('pick', node.history.length - 1 - i), emit('view'))"
        />
        <p v-if="!node.history.length" class="sg-empty">
          <LayoutGrid :size="16" />Every result that reaches it
        </p>
      </div>

      <template v-else>
        <Transition name="sg-swap">
          <video
            v-if="media === 'video' && node.video"
            :key="node.video"
            :src="node.video"
            class="sg-img"
            autoplay
            muted
            loop
            playsinline
            @dblclick="emit('view')"
          />
          <img
            v-else-if="node.image"
            :key="node.image"
            :src="node.image"
            alt=""
            draggable="false"
            class="sg-img"
            :class="[
              showProgress && 'is-working',
              media === 'video' && !showProgress && 'is-motion',
              cutout && 'is-cutout'
            ]"
            @dblclick="emit('view')"
          />
          <p v-else class="sg-empty" :class="showProgress && 'is-working'">
            <component :is="ICONS[node.kind]" :size="16" />{{
              node.ins.length ? 'Shows here when it runs' : 'Drop a file here'
            }}
          </p>
        </Transition>
        <span v-if="node.chip" class="sg-chip">{{ node.chip }}</span>
        <span v-if="media === 'video' && (node.video || node.image)" class="sg-player">
          <Play :size="10" fill="currentColor" /><span class="sg-player-track"><i /></span>0:05
        </span>
        <div v-if="showProgress" class="sg-progress">
          <span class="sg-progress-label"
            >{{ node.verb }} · {{ node.step }} of {{ node.steps }}</span
          >
          <span class="sg-progress-track">
            <span
              class="sg-progress-fill"
              :style="{ width: `${((node.step ?? 0) / (node.steps ?? 1)) * 100}%` }"
            />
          </span>
        </div>
      </template>

      <div v-if="node.state === 'error'" class="sg-progress" role="alert">
        <span class="sg-progress-label">Couldn't run · {{ node.error }}</span>
      </div>

      <!-- Earlier results: 1 of N, tagged by their run. -->
      <span
        v-if="node.history.length > 1 && media !== 'gallery' && !showProgress"
        class="sg-history"
      >
        <button
          type="button"
          aria-label="Earlier result"
          :disabled="node.pick === 0"
          @click="emit('pick', node.pick - 1)"
        >
          <ChevronLeft :size="12" />
        </button>
        <span :title="shown ? `Run ${shown.run}` : undefined"
          >{{ node.pick + 1 }} / {{ node.history.length }}</span
        >
        <button
          type="button"
          aria-label="Later result"
          :disabled="node.pick === node.history.length - 1"
          @click="emit('pick', node.pick + 1)"
        >
          <ChevronRight :size="12" />
        </button>
      </span>
    </div>

    <!-- Controls, under the preview in their own panel. -->
    <div
      v-if="controls"
      class="sg-controls"
      :style="{ height: `${controls}px`, gap: `${g.gap}px`, marginTop: `${g.under}px` }"
    >
      <template v-for="(c, i) in node.controls" :key="i">
        <button
          v-if="c.kind === 'model' || c.kind === 'combo'"
          type="button"
          class="sg-c"
          :class="[`is-${c.kind}`, open === i && 'is-open']"
          :style="{ height: `${g.control}px` }"
          :aria-expanded="open === i"
          @click="open = open === i ? null : i"
        >
          <template v-if="c.kind === 'model'">
            <span class="sg-model-dot" />
            <span class="sg-c-value is-strong">{{ c.value }}</span>
            <span class="sg-c-name">{{
              c.options.find((o) => o.value === c.value)?.provider
            }}</span>
          </template>
          <template v-else>
            <span class="sg-c-name">{{ c.name }}</span>
            <span class="sg-c-value">{{ c.value }}</span>
          </template>
          <ChevronDown :size="12" class="sg-c-arrow" />
        </button>
        <button
          v-else-if="c.kind === 'button'"
          type="button"
          class="sg-c is-button"
          :style="{ height: `${g.control}px` }"
          @click="emit('action', c.key)"
        >
          <span class="sg-c-button"><Download :size="12" />{{ c.label }}</span>
        </button>
        <div
          v-else-if="c.kind === 'seg'"
          class="sg-c is-seg"
          :style="{ height: `${g.control}px` }"
          role="radiogroup"
          :aria-label="c.name"
        >
          <span class="sg-c-name">{{ c.name }}</span>
          <span class="sg-seg">
            <button
              v-for="o in c.options"
              :key="o"
              type="button"
              role="radio"
              :aria-checked="o === c.value"
              :class="o === c.value && 'is-on'"
              @click="emit('set', c.key, o)"
            >
              {{ o }}
            </button>
          </span>
        </div>
        <div
          v-else
          class="sg-c is-slider"
          :style="{ height: `${g.control}px` }"
          role="slider"
          :aria-label="c.name"
          :aria-valuenow="c.value"
          aria-valuemin="0"
          aria-valuemax="1"
          tabindex="0"
          @pointerdown="slide(c, $event)"
          @pointermove="slide(c, $event)"
          @keydown.left.prevent="
            emit('set', c.key, Math.max(0, Math.round((c.value - 0.05) * 20) / 20))
          "
          @keydown.right.prevent="
            emit('set', c.key, Math.min(1, Math.round((c.value + 0.05) * 20) / 20))
          "
        >
          <span class="sg-fill" :style="{ width: `${c.value * 100}%` }" />
          <span class="sg-c-name">{{ c.name }}</span>
          <span class="sg-c-value">{{ c.value.toFixed(2) }}</span>
        </div>
      </template>

      <!-- The open combo's options, under it. -->
      <template v-for="(c, i) in node.controls" :key="`m${i}`">
        <div
          v-if="open === i && (c.kind === 'combo' || c.kind === 'model')"
          class="sg-menu"
          role="listbox"
          :style="{ top: menuTop(i) }"
        >
          <template v-if="c.kind === 'model'">
            <button
              v-for="o in c.options"
              :key="o.value"
              type="button"
              role="option"
              :aria-selected="o.value === c.value"
              class="sg-menu-item"
              @click="choose(c, o.value)"
            >
              <span>{{ o.value }}</span
              ><span class="sg-c-name">{{ o.provider }}</span>
              <Check v-if="o.value === c.value" :size="12" />
            </button>
          </template>
          <template v-else>
            <button
              v-for="o in c.options"
              :key="o"
              type="button"
              role="option"
              :aria-selected="o === c.value"
              class="sg-menu-item"
              @click="choose(c, o)"
            >
              <span>{{ o }}</span
              ><Check v-if="o === c.value" :size="12" />
            </button>
          </template>
        </div>
      </template>
    </div>

    <!-- Sockets: outside the node, on the preview's edge. Drag from one
         to wire it. -->
    <span
      v-for="(s, i) in node.ins"
      :key="`i${i}`"
      class="sg-socket is-in"
      :class="socketFit('in', s.type)"
      data-socket="in"
      :data-socket-node="node.id"
      :data-socket-index="i"
      :style="{ top: `${g.head + 34 + i * 34}px`, '--sg-socket': SOCKETS[s.type] }"
    >
      <span v-if="labels || node.ins.length > 1 || wiring" class="sg-socket-label">{{
        s.name
      }}</span
      ><i />
    </span>
    <span
      v-for="(s, i) in node.outs"
      :key="`o${i}`"
      class="sg-socket is-out"
      :class="socketFit('out', s.type)"
      data-socket="out"
      :data-socket-node="node.id"
      :data-socket-index="i"
      :style="{ top: `${g.head + 34 + i * 34}px`, '--sg-socket': SOCKETS[s.type] }"
    >
      <i /><span v-if="labels" class="sg-socket-label">{{ s.name }}</span>
    </span>
  </section>
</template>

<style>
/* Glass: the title floats above a borderless card; controls are a second
   card a step lighter; sockets are coloured dots on the card's edge with
   their name outside. Nodes drift a pixel or two, each on its own beat. */
.sg-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  animation: sg-float 7s ease-in-out infinite;
  animation-delay: var(--sg-delay, 0s);
}
@keyframes sg-float {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -3px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sg-node {
    animation: none;
  }
}
/* The one being worked on, or with a menu open, sits over its neighbours. */
.sg-node.is-selected {
  z-index: 2;
}
.sg-node.is-menu {
  z-index: 3;
}
.sg-head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 0 4px 6px;
  align-self: stretch;
  align-items: flex-end;
  color: var(--mg-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: grab;
}
.sg-head-icon {
  margin-bottom: 1px;
  color: var(--mg-dim);
}
.sg-head-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--mg-text);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sg-state {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 3px;
  color: var(--mg-dim);
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.sg-state.is-running,
.sg-state.is-queued {
  color: var(--mg-muted);
}
.sg-state.is-stale::before {
  width: 6px;
  height: 6px;
  margin-right: 2px;
  border: 1.5px solid currentColor;
  border-radius: 999px;
  content: '';
}
.sg-state.is-error {
  color: var(--color-status-danger, #e5484d);
}
.sg-state.is-locked {
  color: var(--mg-dim);
}
.sg-actions {
  display: inline-flex;
  flex: none;
  gap: 2px;
  margin-bottom: -3px;
}
:root .proto-ui.proto-ui.proto-ui .sg-act {
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--mg-muted);
}
:root .proto-ui.proto-ui.proto-ui .sg-act:hover {
  background: var(--mg-hover);
  color: var(--mg-text);
}
.sg-node.is-locked {
  opacity: 0.45;
}
.sg-badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--mg-well);
  color: var(--mg-dim);
  font-size: 11px;
}
.sg-body {
  position: relative;
  flex: none;
  overflow: hidden;
  border-radius: var(--mg-radius);
  background: var(--mg-node);
  backdrop-filter: blur(24px) saturate(1.15);
}
.sg-node.is-selected .sg-body {
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--color-base-foreground) 36%, transparent);
}
.sg-node.is-error .sg-body {
  box-shadow: 0 0 0 1.5px color-mix(in oklch, var(--color-status-danger, #e5484d) 70%, transparent);
}
.sg-text {
  display: block;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 14px 16px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--mg-text);
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  resize: none;
  user-select: text;
}
.sg-text.has-foot {
  height: calc(100% - 34px);
}
.sg-text.is-result {
  overflow: auto;
  color: var(--mg-text);
  user-select: text;
}
.sg-count {
  position: absolute;
  right: 12px;
  bottom: 8px;
  color: var(--mg-dim);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.sg-vars {
  position: absolute;
  right: 10px;
  bottom: 8px;
  left: 10px;
  display: flex;
  gap: 4px;
}
:root .proto-ui.proto-ui.proto-ui .sg-var {
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in oklch, #e8c07a 16%, transparent);
  color: color-mix(in oklch, #e8c07a 85%, var(--mg-text));
  font-size: 11px;
  font-weight: 500;
}
.sg-empty {
  display: flex;
  height: 100%;
  margin: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--mg-dim);
  font-size: 12px;
  text-align: center;
}
.sg-empty.is-working {
  animation: sg-breathe 1.6s ease-in-out infinite;
}
@keyframes sg-breathe {
  50% {
    opacity: 0.45;
  }
}
.sg-text::placeholder {
  color: var(--mg-dim);
}
.sg-img {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    filter 0.4s ease,
    transform 0.4s ease;
}
.sg-img.is-motion {
  animation: sg-motion 10s ease-in-out infinite alternate;
}
@keyframes sg-motion {
  to {
    transform: scale(1.12) translate(-3%, -2%);
  }
}
/* A cut-out: the subject over a checkerboard. */
.sg-img.is-cutout {
  background: repeating-conic-gradient(rgb(255 255 255 / 0.1) 0 25%, transparent 0 50%) 0 0 / 16px
    16px;
  mask: radial-gradient(ellipse 46% 58% at 50% 46%, #000 62%, transparent 64%);
}
.sg-body:has(.is-cutout) {
  background:
    repeating-conic-gradient(
        color-mix(in oklch, var(--color-base-foreground) 10%, transparent) 0 25%,
        transparent 0 50%
      )
      0 0 / 16px 16px,
    var(--mg-node);
}
.sg-img.is-working {
  filter: blur(6px) saturate(0.8) brightness(0.8);
  transform: scale(1.06);
}
/* A new result fades in over the last one. */
.sg-swap-enter-active,
.sg-swap-leave-active {
  transition: opacity 0.45s ease;
}
.sg-swap-enter-from,
.sg-swap-leave-to {
  opacity: 0;
}
.sg-progress-fill {
  transition: width 0.15s linear;
}
@media (prefers-reduced-motion: reduce) {
  .sg-img,
  .sg-progress-fill,
  .sg-swap-enter-active,
  .sg-swap-leave-active {
    transition: none;
  }
}
.sg-chip {
  position: absolute;
  top: 10px;
  left: 10px;
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
.sg-chip.is-right {
  right: 10px;
  left: auto;
}
.sg-player {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  display: flex;
  height: 24px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.sg-player-track {
  height: 3px;
  flex: 1;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.25);
}
.sg-player-track i {
  display: block;
  width: 100%;
  height: 100%;
  background: #fff;
  transform-origin: left;
  animation: sg-play 5s linear infinite;
}
@keyframes sg-play {
  from {
    transform: scaleX(0);
  }
}
.sg-history {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  height: 22px;
  align-items: center;
  gap: 2px;
  padding: 0 2px;
  border-radius: 999px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
:root .proto-ui.proto-ui.proto-ui .sg-history button {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  background: transparent;
  color: inherit;
}
:root .proto-ui.proto-ui.proto-ui .sg-history button:disabled {
  opacity: 0.35;
}
.sg-audio {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
}
.sg-play {
  display: inline-flex;
  width: 30px;
  height: 30px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--mg-run);
  color: var(--mg-run-text);
}
.sg-wave {
  display: flex;
  height: 36px;
  flex: 1;
  align-items: center;
  gap: 2px;
}
.sg-wave i {
  width: 2px;
  flex: 1;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 45%, transparent);
}
.sg-wave.is-working i {
  animation: sg-breathe 1.2s ease-in-out infinite;
}
.sg-audio-time {
  color: var(--mg-dim);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.sg-compare {
  position: relative;
  height: 100%;
  cursor: ew-resize;
  touch-action: none;
}
.sg-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: #fff;
  pointer-events: none;
}
.sg-divider i {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.3);
  translate: -50% -50%;
}
.sg-gallery {
  display: grid;
  height: 100%;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 1fr;
  gap: 4px;
  padding: 6px;
  overflow: auto;
}
.sg-gallery img {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}
.sg-gallery .sg-empty {
  grid-column: 1 / -1;
  grid-row: 1 / 3;
}
.sg-progress {
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(16px);
  color: rgb(255 255 255 / 0.92);
  font-size: 12px;
  font-weight: 500;
}
.sg-progress-track {
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.2);
}
.sg-progress-fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #fff;
}
.sg-pause {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 12px;
  text-align: center;
}
.sg-pause-icon {
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  border-radius: 999px;
  background: var(--mg-well);
  color: var(--mg-text);
}
.sg-pause-title {
  color: var(--mg-text);
  font-size: 13px;
  font-weight: 500;
}
.sg-pause-note {
  color: var(--mg-dim);
  font-size: 11.5px;
  line-height: 15px;
}
:root .proto-ui.proto-ui.proto-ui .sg-resume {
  display: inline-flex;
  height: 26px;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 0 11px;
  border-radius: 999px;
  background: var(--mg-hover);
  color: var(--mg-text);
  font-size: 12px;
  font-weight: 500;
}

.sg-controls {
  position: relative;
  display: flex;
  flex: none;
  flex-direction: column;
  padding: 6px;
  border-radius: 14px;
  background: var(--mg-node);
  backdrop-filter: blur(24px) saturate(1.15);
}
/* Widgets are buttons where they open or act: the triple root beats the
   app's button reset. */
:root .proto-ui.proto-ui.proto-ui .sg-c {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  overflow: hidden;
  border-radius: var(--mg-radius-in);
  background: var(--mg-well);
  color: var(--mg-text);
  font-size: 12px;
  font-weight: 400;
  text-align: left;
}
:root .proto-ui.proto-ui.proto-ui :is(button.sg-c:hover, .sg-c.is-open) {
  background: var(--mg-hover);
}
.sg-c.is-slider {
  cursor: ew-resize;
  touch-action: none;
}
.sg-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
}
.sg-c-name {
  position: relative;
  flex: none;
  color: var(--mg-dim);
}
.sg-c-value {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--mg-text);
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sg-c-value.is-strong {
  font-weight: 500;
  text-align: left;
}
.sg-c-arrow {
  position: relative;
  flex: none;
  color: var(--mg-dim);
}
.sg-model-dot {
  width: 16px;
  height: 16px;
  flex: none;
  border-radius: 5px;
  background: conic-gradient(from 200deg, #4f8df5, #a46cf0, #f0b44f, #4f8df5);
}
.sg-seg {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  gap: 2px;
}
:root .proto-ui.proto-ui.proto-ui .sg-seg button {
  height: auto;
  padding: 2px 7px;
  border-radius: 6px;
  background: transparent;
  color: var(--mg-dim);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
:root .proto-ui.proto-ui.proto-ui .sg-seg button:hover {
  color: var(--mg-text);
}
:root .proto-ui.proto-ui.proto-ui .sg-seg button.is-on {
  background: var(--mg-hover);
  color: var(--mg-text);
}
.sg-menu {
  position: absolute;
  right: 6px;
  left: 6px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-content-background) 82%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.28);
  animation: sg-menu 0.14s ease-out;
}
@keyframes sg-menu {
  from {
    opacity: 0;
    translate: 0 -4px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .sg-menu {
    animation: none;
  }
}
:root .proto-ui.proto-ui.proto-ui .sg-menu-item {
  display: flex;
  height: 28px;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border-radius: 8px;
  background: transparent;
  color: var(--mg-text);
  font-size: 12px;
  text-align: left;
}
.sg-menu-item > span:first-child {
  flex: 1;
}
:root .proto-ui.proto-ui.proto-ui .sg-menu-item:hover {
  background: var(--mg-hover);
}
.sg-c.is-button {
  justify-content: center;
}
.sg-c-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--mg-text);
  font-weight: 500;
}

.sg-socket {
  position: absolute;
  z-index: 1;
  display: inline-flex;
  height: 18px;
  align-items: center;
  gap: 6px;
  translate: 0 -50%;
}
.sg-socket.is-in {
  right: calc(100% - 5px);
}
.sg-socket.is-out {
  left: calc(100% - 5px);
}
.sg-socket i {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 999px;
  background: var(--sg-socket);
  box-shadow: 0 0 0 2.5px var(--mg-ring);
  cursor: crosshair;
  transition:
    scale 0.15s ease,
    opacity 0.15s ease;
}
/* A larger target than the dot, so it is easy to grab. */
.sg-socket i::after {
  position: absolute;
  inset: -6px;
  content: '';
}
.sg-socket i {
  position: relative;
}
.sg-socket:hover i,
.sg-socket.is-fit i {
  scale: 1.35;
}
.sg-socket.is-off {
  opacity: 0.25;
}
@media (prefers-reduced-motion: reduce) {
  .sg-img.is-motion,
  .sg-player-track i,
  .sg-empty.is-working,
  .sg-wave.is-working i {
    animation: none;
  }
}
.sg-socket-label {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--mg-float);
  backdrop-filter: blur(12px);
  color: var(--mg-muted);
  font-size: 11px;
  white-space: nowrap;
}

/* Current: ComfyUI's grey node around the same parts. */
.is-current .sg-node {
  border-radius: var(--mg-radius);
  background: var(--mg-node);
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.55),
    3px 4px 10px rgb(0 0 0 / 0.35);
}
:root[data-ds-theme='light'] .is-current .sg-node {
  box-shadow:
    0 0 0 1px rgb(0 0 0 / 0.18),
    2px 3px 8px rgb(0 0 0 / 0.12);
}
.is-current .sg-node.is-selected {
  box-shadow:
    0 0 0 1.5px #fff,
    3px 4px 10px rgb(0 0 0 / 0.35);
}
.is-current .sg-node.is-error {
  box-shadow:
    0 0 0 2px #e5484d,
    3px 4px 10px rgb(0 0 0 / 0.35);
}
.is-current .sg-node.is-error .sg-body {
  box-shadow: none;
}
.is-current .sg-node.is-running {
  box-shadow:
    0 0 0 2px #00d26a,
    3px 4px 10px rgb(0 0 0 / 0.35);
}
:root[data-ds-theme='light'] .is-current .sg-node.is-running {
  box-shadow: 0 0 0 2px #00b85c;
}
.is-current .sg-head {
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: var(--mg-radius) var(--mg-radius) 0 0;
  background: var(--mg-head-bg);
}
.sg-dot {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 999px;
  background: #777;
}
.is-current .sg-fill {
  background: #4a4a4a;
}
:root[data-ds-theme='light'] .is-current .sg-fill {
  background: #d4d4d4;
}
.is-current .sg-head-title {
  color: var(--mg-title);
  font-size: 13px;
  font-weight: 400;
}
.is-current .sg-badge {
  border-radius: 4px;
  background: #445;
  color: #ccd;
}
:root[data-ds-theme='light'] .is-current .sg-badge {
  background: #d6d9e6;
  color: #334;
}
.is-current .sg-body {
  margin: 0 8px;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
}
.is-current .sg-node:not(:has(.sg-controls)) .sg-body {
  padding: 6px 0 8px;
}
.is-current :is(.sg-text, .sg-pause) {
  height: 100%;
  border-radius: 4px;
  background: var(--mg-well);
}
.is-current .sg-text {
  padding: 8px 10px;
  font-size: 12px;
  line-height: 17px;
}
.is-current .sg-chip,
.is-current .sg-history,
.is-current .sg-player,
.is-current .sg-progress {
  border-radius: 4px;
  background: rgb(0 0 0 / 0.65);
  backdrop-filter: none;
}
.is-current .sg-progress-fill {
  background: #00d26a;
}
:root .proto-ui.proto-ui.proto-ui .is-current .sg-resume {
  border-radius: 6px;
  background: var(--mg-run);
  color: var(--mg-run-text);
}
.is-current .sg-controls {
  padding: 6px 8px;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
}
:root .proto-ui.proto-ui.proto-ui .is-current .sg-c {
  padding: 0 8px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--mg-well-line);
  font-size: 11.5px;
}
.is-current .sg-menu {
  border-radius: 6px;
  background: var(--mg-chrome-2);
  box-shadow:
    0 0 0 1px var(--mg-chrome-line),
    0 8px 20px rgb(0 0 0 / 0.3);
  backdrop-filter: none;
}
:root .proto-ui.proto-ui.proto-ui .is-current .sg-menu-item {
  border-radius: 4px;
}
.is-current .sg-c-arrow {
  color: var(--mg-text);
}
:root .proto-ui.proto-ui.proto-ui .is-current .sg-seg button {
  padding: 0 6px;
  border-radius: 999px;
}
:root .proto-ui.proto-ui.proto-ui .is-current .sg-c.is-button {
  background: var(--mg-head-bg);
}
:root .proto-ui.proto-ui.proto-ui .is-current .sg-c.is-button:hover {
  background: var(--mg-hover);
}
.is-current .sg-socket i {
  box-shadow: none;
}
.is-current .sg-socket-label {
  border-radius: 3px;
  background: var(--mg-head-bg);
  backdrop-filter: none;
  color: var(--mg-text);
}
</style>
