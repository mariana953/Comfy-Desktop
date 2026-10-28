<script setup lang="ts">
import MediaCard from '../ui/MediaCard.vue'

/** A workflow with its image, title, and a meta line with a value on the
 *  right (size, where it ran, when). */
defineProps<{ src: string; title: string; meta: string; right?: string }>()
defineEmits<{ open: [] }>()
</script>

<template>
  <MediaCard :src @click="$emit('open')" @keydown.enter="$emit('open')">
    <p class="truncate text-ui font-medium">{{ title }}</p>
    <p class="mt-1 flex items-center gap-2 text-ui text-subtle-foreground">
      <span class="min-w-0 flex-1 truncate">{{ meta }}</span>
      <span v-if="right" class="shrink-0">{{ right }}</span>
    </p>
  </MediaCard>
</template>
