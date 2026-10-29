<script setup lang="ts">
import { computed } from 'vue'
import MarPage from './MarPage.vue'
import { pageState } from './pageState'

/**
 * For Mar's pages that draw their own frame (Explore, Favorites): Loading
 * and Error come from the shared page frame; Live and Empty are the
 * page itself (Explore's catalogue is never empty; Favorites has its own
 * empty, driven by the stars).
 */
const {
  title,
  skeleton = 'grid',
  errorTitle,
  errorText
} = defineProps<{
  title: string
  skeleton?: 'grid' | 'list' | 'cards' | 'settings'
  errorTitle?: string
  errorText?: string
}>()
const gated = computed(() => pageState.id === 'loading' || pageState.id === 'error')
</script>

<template>
  <MarPage v-if="gated" :title :skeleton :state="pageState.id" :error-title :error-text />
  <slot v-else />
</template>
