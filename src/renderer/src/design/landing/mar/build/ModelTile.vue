<script setup lang="ts">
import type { Component } from 'vue'
import { Box, Layers, Maximize2, Spline, Atom, TextCursorInput, Waypoints } from 'lucide-vue-next'
import type { Model, ModelType } from './models'

/** Models have no pictures: a tinted square with the type's glyph stands in
 *  for the frontend's preview_url until one exists. */
const { model, size = 36 } = defineProps<{ model: Model; size?: number }>()
const ICON: Record<ModelType, Component> = {
  checkpoint: Box,
  diffusion: Atom,
  lora: Layers,
  vae: Waypoints,
  'text-encoder': TextCursorInput,
  upscaler: Maximize2,
  controlnet: Spline
}
</script>

<template>
  <span
    class="mm-tile"
    :style="{ '--h': model.hue, width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <component :is="ICON[model.type]" :size="Math.round(size * 0.42)" :stroke-width="1.6" />
  </span>
</template>

<style scoped>
.mm-tile {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 28%;
  background:
    radial-gradient(120% 90% at 20% 10%, oklch(0.62 0.13 var(--h) / 0.55), transparent 70%),
    oklch(0.32 0.05 var(--h));
  color: oklch(0.95 0.03 var(--h));
}
:root[data-ds-theme='light'] .mm-tile {
  background:
    radial-gradient(120% 90% at 20% 10%, oklch(0.86 0.09 var(--h) / 0.9), transparent 70%),
    oklch(0.93 0.035 var(--h));
  color: oklch(0.38 0.1 var(--h));
}
</style>
