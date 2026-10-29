<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { TooltipProvider } from 'reka-ui'
import { PAGES } from '../registry'

/** One component page in one theme, inside the page's theme frame. It
 *  tells the page its height so the frame never scrolls on its own. */
const id = new URLSearchParams(location.search).get('page')
const page = PAGES.find((p) => p.id === id)

const root = ref<HTMLElement>()
onMounted(() => {
  const post = (): void =>
    parent.postMessage({ type: 'mar-ds:height', h: Math.ceil(root.value!.offsetHeight) }, '*')
  new ResizeObserver(post).observe(root.value!)
})
</script>

<template>
  <TooltipProvider :delay-duration="300">
    <div ref="root" class="proto-ui ds-frame-page">
      <component :is="page.component" v-if="page?.component" />
    </div>
  </TooltipProvider>
</template>
