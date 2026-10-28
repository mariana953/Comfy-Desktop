<script setup lang="ts">
import { Star } from 'lucide-vue-next'
import { isFavorite, toggleFavorite } from './favorites'

/** The star in a template card's corner (Mar's proposal): shows on hover,
 *  stays once starred. */
const { id } = defineProps<{ id: string }>()
</script>

<template>
  <button
    type="button"
    class="mar-star"
    :class="isFavorite(id) && 'is-on'"
    :aria-pressed="isFavorite(id)"
    :aria-label="isFavorite(id) ? 'Remove from favorites' : 'Add to favorites'"
    @click.stop="toggleFavorite(id)"
    @keydown.enter.stop
  >
    <Star :size="13" :fill="isFavorite(id) ? 'currentColor' : 'none'" />
  </button>
</template>

<style>
/* Global: the star answers to its card's hover. */
:root .proto-ui.proto-ui.proto-ui .mar-star {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  opacity: 0;
  transition: opacity 160ms ease;
}
:root
  .proto-ui.proto-ui.proto-ui
  :is(.group:hover .mar-star, .mar-star:focus-visible, .mar-star.is-on) {
  opacity: 1;
}
</style>
