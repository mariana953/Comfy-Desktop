<script setup lang="ts">
import { STAGES, type StageId } from '../stages'

/**
 * A component opened (a menu, a tooltip), in its own frame: an open menu
 * closes the others in its document, so each one gets a document of its
 * own. Same theme as the page it is on.
 */
const { id, label } = defineProps<{ id: StageId; label?: string }>()
const theme = new URLSearchParams(location.search).get('theme') ?? 'dark'
const src = `?frame=stage&stage=${id}&theme=${theme}&proposal=mariana`
</script>

<template>
  <figure class="ds-cell">
    <iframe
      :src
      :title="label ?? id"
      class="ds-stage"
      :style="{ height: `${STAGES[id].height}px` }"
      loading="lazy"
    />
    <figcaption v-if="label" class="ds-cell-label">{{ label }}</figcaption>
  </figure>
</template>
