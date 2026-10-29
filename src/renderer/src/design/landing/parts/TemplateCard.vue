<script setup lang="ts">
import {} from 'lucide-vue-next'
import { GraphIcon, AppIcon } from '../mar/icons/kindIcons'
import Badge from '../ui/Badge.vue'
import MediaCard from '../ui/MediaCard.vue'
import { openDetail } from '../useProto'
import { thumb, type Template } from '../mock'
import CategoryChip from '../mar/CategoryChip.vue'
import { isMariana } from '../mar/proposal'
import FavoriteStar from '../mar/FavoriteStar.vue'
import BrandedThumb from '../mar/brand/BrandedThumb.vue'
import { templateStyle } from '../mar/brand/templateStyle'

const { t } = defineProps<{ t: Template }>()
</script>

<template>
  <MediaCard
    :src="thumb(t.id)"
    @click="openDetail('template', t.id)"
    @keydown.enter="openDetail('template', t.id)"
  >
    <!-- Mar's proposal: the picture with a small brand touch (mar/brand/). -->
    <template v-if="isMariana && templateStyle.id !== 'photo'" #media
      ><BrandedThumb :t="t" :kind="templateStyle.id"
    /></template>
    <template #top-left>
      <!-- Mar's proposal: the real category, named on hover (mar/). -->
      <CategoryChip v-if="isMariana" :category="t.category" />
      <Badge
        v-else
        variant="overlay"
        size="md"
        :aria-label="t.kind === 'graph' ? 'Node graph' : 'App'"
        class="px-1.5"
      >
        <GraphIcon v-if="t.kind === 'graph'" :size="12" /><AppIcon v-else :size="12" />
      </Badge>
    </template>
    <template v-if="isMariana" #top-right><FavoriteStar :id="t.id" /></template>
    <p class="truncate text-ui font-medium">{{ t.title }}</p>
  </MediaCard>
</template>
