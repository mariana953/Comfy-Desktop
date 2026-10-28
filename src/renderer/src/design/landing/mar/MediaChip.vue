<script setup lang="ts">
import type { Component } from 'vue'

/** Chip on imagery (DS · Mar): fully rounded over a background blur,
 *  11px Medium in sentence case, no border. Its fill follows Tune the UI ›
 *  Chips on images (black, or dark grey at 60%). */
defineProps<{ icon?: Component }>()
</script>

<template>
  <span
    class="inline-flex h-5 items-center gap-1 rounded-full bg-(--mar-chip-bg,oklch(0_0_0/0.55)) px-2 text-[11px] leading-none font-medium text-white/92 backdrop-blur-md"
  >
    <component :is="icon" v-if="icon" :size="10" aria-hidden="true" />
    <slot />
  </span>
</template>
