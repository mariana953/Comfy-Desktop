<script setup lang="ts">
import MarCloudBar from './MarCloudBar.vue'
import MarDock from './MarDock.vue'
import MarSidebar from './MarSidebar.vue'
import { onCloud } from './surface'
import MarBloom from './MarBloom.vue'
import MarSearch from '../search/MarSearch.vue'
import { bloomOn, heroImage, marDockOn, marSideOn } from './marShell'
import './marShell.css'
import '../motion/motion.css'
import '../motion/tabSlide'

/**
 * The blurred photo behind the top of a page. It scrolls away with the
 * page and fades into the background. Blurred on purpose: the photos are
 * small, and blur keeps them clean on large and low-resolution screens.
 */
</script>

<template>
  <div v-if="bloomOn" class="mar-backdrop is-bloom" aria-hidden="true"><MarBloom /></div>
  <div v-else-if="heroImage" class="mar-backdrop" aria-hidden="true">
    <img :src="heroImage" alt="" />
  </div>
  <MarDock v-if="marDockOn" />
  <MarSidebar v-if="marSideOn" />
  <MarCloudBar v-if="onCloud" />
  <MarSearch />
</template>

<style scoped>
.mar-backdrop {
  position: absolute;
  inset: 0 0 auto;
  z-index: -1;
  height: 440px;
  overflow: hidden;
  pointer-events: none;
}
.mar-backdrop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(14px) saturate(0.85);
  opacity: 0.7;
  transform: scale(1.08);
}
.mar-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--color-content-background) 62%, transparent),
    color-mix(in oklch, var(--color-content-background) 45%, transparent) 45%,
    var(--color-content-background) 100%
  );
}
</style>
