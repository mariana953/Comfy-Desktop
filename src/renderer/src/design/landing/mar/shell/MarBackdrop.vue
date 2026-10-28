<script setup lang="ts">
import { heroImage } from './marShell'
import './marShell.css'

/**
 * The blurred photo behind the top of a page. It scrolls away with the
 * page and fades into the background. Blurred on purpose: the photos are
 * small, and blur keeps them clean on large and low-resolution screens.
 */
</script>

<template>
  <div v-if="heroImage" class="mar-backdrop" aria-hidden="true">
    <img :src="heroImage" alt="" />
  </div>
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
  filter: blur(14px);
  transform: scale(1.08);
}
.mar-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    color-mix(in oklch, var(--color-content-background) 45%, transparent),
    color-mix(in oklch, var(--color-content-background) 20%, transparent) 35%,
    var(--color-content-background) 100%
  );
}
</style>
