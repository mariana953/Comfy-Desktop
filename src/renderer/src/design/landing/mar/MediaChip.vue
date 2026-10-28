<script setup lang="ts">
import type { Component } from 'vue'

/** Chip on imagery (DS · Mar): fully rounded, dark grey at 60% over a
 *  background blur, 11px Medium in sentence case. No border, so it reads
 *  on light and dark images alike. */
defineProps<{ icon?: Component }>()
</script>

<template>
  <span
    class="inline-flex h-5 items-center gap-1 rounded-full bg-[oklch(0.22_0.004_285/0.6)] px-2 text-[11px] leading-none font-medium text-white/92 backdrop-blur-md"
  >
    <component :is="icon" v-if="icon" :size="10" aria-hidden="true" />
    <slot />
  </span>
</template>
