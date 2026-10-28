<script setup lang="ts">
import { computed } from 'vue'
import {
  Aperture,
  ChevronDown,
  Download,
  Image,
  Pause,
  Play,
  Type,
  Workflow
} from 'lucide-vue-next'
import {
  SOCKETS,
  canvasNodeHeight,
  controlsHeight,
  type CanvasGeometry,
  type SNode
} from './canvasData'

/**
 * One node of the Canvas mode (the simpler layer over ComfyUI). Its title
 * sits above it, its result fills it, its controls hang below in their
 * own panel, and its typed sockets stick out of the preview's edges.
 * Socket names show where a node takes more than one input, or all of
 * them with the socket labels switch (canvas controls).
 */
const { node, g, current, labels, selected } = defineProps<{
  node: SNode
  g: CanvasGeometry
  current: boolean
  labels: boolean
  selected: boolean
}>()

const ICONS = {
  prompt: Type,
  image: Image,
  generate: Aperture,
  pause: Pause,
  workflow: Workflow,
  output: Download
}
const height = computed(() => canvasNodeHeight(node, g))
const controls = computed(() => controlsHeight(node, g))
</script>

<template>
  <section
    class="sg-node"
    :class="[
      `is-${node.kind}`,
      selected && 'is-selected',
      node.progress !== undefined && 'is-running'
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
      <span v-else class="mg-head-dot" />
      <span class="sg-head-title">{{ node.title }}</span>
      <span v-if="node.badge" class="sg-badge">{{ node.badge }}</span>
    </header>

    <!-- The main element: the result, or the prompt's text. -->
    <div class="sg-body" :style="{ height: `${node.body}px` }">
      <p v-if="node.kind === 'prompt'" class="sg-text">{{ node.text }}</p>
      <div v-else-if="node.kind === 'pause'" class="sg-pause">
        <span class="sg-pause-icon"><Pause :size="14" fill="currentColor" /></span>
        <span class="sg-pause-title">Paused</span>
        <span class="sg-pause-note">Refine, then resume</span>
        <button type="button" class="sg-resume">
          <Play :size="11" fill="currentColor" />Resume
        </button>
      </div>
      <template v-else>
        <img
          :src="node.image"
          alt=""
          draggable="false"
          class="sg-img"
          :class="node.progress !== undefined && 'is-working'"
        />
        <span v-if="node.chip" class="sg-chip">{{ node.chip }}</span>
        <div v-if="node.progress !== undefined" class="sg-progress">
          <span class="sg-progress-label">{{ node.status }}</span>
          <span class="sg-progress-track">
            <span class="sg-progress-fill" :style="{ width: `${node.progress * 100}%` }" />
          </span>
        </div>
      </template>
    </div>

    <!-- Controls, under the preview in their own panel. -->
    <div
      v-if="controls"
      class="sg-controls"
      :style="{ height: `${controls}px`, gap: `${g.gap}px`, marginTop: `${g.under}px` }"
    >
      <div
        v-for="(c, i) in node.controls"
        :key="i"
        class="sg-c"
        :class="`is-${c.kind}`"
        :style="{ height: `${g.control}px` }"
      >
        <template v-if="c.kind === 'model'">
          <span class="sg-model-dot" />
          <span class="sg-c-value is-strong">{{ c.value }}</span>
          <span class="sg-c-name">{{ c.provider }}</span>
          <ChevronDown :size="12" class="sg-c-arrow" />
        </template>
        <template v-else-if="c.kind === 'seg'">
          <span class="sg-c-name">{{ c.name }}</span>
          <span class="sg-seg">
            <span v-for="o in c.options" :key="o" :class="o === c.value && 'is-on'">{{ o }}</span>
          </span>
        </template>
        <template v-else-if="c.kind === 'button'">
          <span class="sg-c-button"><Download :size="12" />{{ c.label }}</span>
        </template>
        <template v-else>
          <span
            v-if="c.kind === 'slider'"
            class="mg-w-fill"
            :style="{ width: `${c.fill * 100}%` }"
          />
          <span class="sg-c-name">{{ c.name }}</span>
          <span class="sg-c-value">{{ c.value }}</span>
          <ChevronDown v-if="c.kind === 'combo'" :size="12" class="sg-c-arrow" />
        </template>
      </div>
    </div>

    <!-- Sockets: outside the node, on the preview's edge. -->
    <span
      v-for="(s, i) in node.ins"
      :key="`i${i}`"
      class="sg-socket is-in"
      :style="{ top: `${g.head + 34 + i * 34}px`, '--sg-socket': SOCKETS[s.type] }"
    >
      <span v-if="labels || node.ins.length > 1" class="sg-socket-label">{{ s.name }}</span
      ><i />
    </span>
    <span
      v-for="(s, i) in node.outs"
      :key="`o${i}`"
      class="sg-socket is-out"
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
.sg-text {
  margin: 0;
  padding: 14px 16px;
  color: var(--mg-text);
  font-size: 13px;
  line-height: 20px;
  user-select: text;
}
.sg-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sg-img.is-working {
  filter: blur(6px) saturate(0.8) brightness(0.8);
  transform: scale(1.06);
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
  display: flex;
  flex: none;
  flex-direction: column;
  padding: 6px;
  border-radius: 14px;
  background: var(--mg-node);
  backdrop-filter: blur(24px) saturate(1.15);
}
.sg-c {
  position: relative;
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  overflow: hidden;
  border-radius: var(--mg-radius-in);
  background: var(--mg-well);
  font-size: 12px;
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
.sg-seg span {
  padding: 2px 7px;
  border-radius: 6px;
  color: var(--mg-dim);
  font-variant-numeric: tabular-nums;
}
.sg-seg span.is-on {
  background: var(--mg-hover);
  color: var(--mg-text);
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
  color: #fff;
}
.is-current .sg-controls {
  padding: 6px 8px;
  border-radius: 0;
  background: transparent;
  backdrop-filter: none;
}
.is-current .sg-c {
  padding: 0 8px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--mg-well-line);
  font-size: 11.5px;
}
.is-current .sg-c-arrow {
  color: var(--mg-text);
}
.is-current .sg-seg span {
  padding: 0 6px;
  border-radius: 999px;
}
.is-current .sg-c.is-button {
  background: var(--mg-head-bg);
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
