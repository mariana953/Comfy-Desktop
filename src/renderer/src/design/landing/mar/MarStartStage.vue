<script setup lang="ts">
import { Play } from 'lucide-vue-next'
import { go, hostActions, instances } from '../useProto'
import { INSTANCES, thumb } from '../mock'
import { can } from '../milestones'
import MediaCard from '../ui/MediaCard.vue'
import ScrollRow from '../ui/ScrollRow.vue'
import SectionHeader from '../ui/SectionHeader.vue'
import MarStartWhere from './MarStartWhere.vue'
import bloomLoop from './assets/banner-bloom.mp4'
import bloomPoster from './assets/banner-bloom.jpg'
import portraitGarden from './assets/portrait-garden.jpg'
import portraitSun from './assets/portrait-sun.jpg'
import lakeFog from './assets/lake-fog.jpg'

/**
 * First run · Stage (UI Playground › First run): the sections of the
 * returning Home, under the same greeting and prompt (MarHomeV10.vue).
 * Where Recently used goes, an example to run in a click (a short loop
 * plays on hover); where Builds go, where Comfy runs, Cloud or this
 * computer, each saying what it takes.
 */
interface Example {
  label: string
  meta: string
  src: string
  video?: string
}
const EXAMPLES: Example[] = [
  { label: 'Remove a background', meta: 'Image · about 10 s', src: portraitGarden },
  {
    label: 'Turn a photo into video',
    meta: 'Video · about a minute',
    src: bloomPoster,
    video: bloomLoop
  },
  {
    label: 'Reshoot your product',
    meta: 'Image · about 20 s',
    src: thumb('template_product_placement')
  },
  { label: 'Upscale to 4K', meta: 'Image · about 15 s', src: lakeFog },
  { label: 'Relight a portrait', meta: 'Image · about 20 s', src: portraitSun }
]

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function run(label: string): void {
  const cloud = instances.value.find((i) => i.kind === 'cloud') ?? INSTANCES[0]!
  hostActions.launch(cloud, label)
}
function preview(e: Event, on: boolean): void {
  const video = (e.currentTarget as HTMLElement).querySelector('video')
  if (!video || reduced) return
  if (on) void video.play().catch(() => {})
  else {
    video.pause()
    video.currentTime = 0
  }
}
</script>

<template>
  <section class="mar-rise mt-10" style="--i: 0">
    <SectionHeader
      title="Start from an example"
      :link="can.explore ? 'See all' : undefined"
      @link="go('explore')"
    >
      <template #controls>
        <span
          class="inline-flex h-5 items-center rounded-full bg-secondary-background px-2 text-ui text-muted-foreground"
          >{{ EXAMPLES.length }}</span
        >
      </template>
    </SectionHeader>
    <ScrollRow :columns="5">
      <MediaCard
        v-for="x in EXAMPLES"
        :key="x.label"
        class="mar-stage-card"
        @click="run(x.label)"
        @keydown.enter="run(x.label)"
        @mouseenter="preview($event, true)"
        @mouseleave="preview($event, false)"
        @focus="preview($event, true)"
        @blur="preview($event, false)"
      >
        <template #media>
          <img :src="x.src" alt="" loading="lazy" class="size-full object-cover" />
          <video
            v-if="x.video"
            :src="x.video"
            muted
            loop
            playsinline
            preload="none"
            class="mar-stage-loop"
          />
        </template>
        <template #bottom-right>
          <span class="mar-stage-run"><Play :size="11" fill="currentColor" />Run</span>
        </template>
        <p class="truncate text-ui font-medium">{{ x.label }}</p>
        <p class="mt-1 flex items-center gap-2 text-ui text-subtle-foreground">
          <span class="min-w-0 flex-1 truncate">{{ x.meta.split(' · ')[0] }}</span>
          <span class="shrink-0">{{ x.meta.split(' · ')[1] }}</span>
        </p>
      </MediaCard>
    </ScrollRow>
  </section>

  <section class="mar-rise mt-10" style="--i: 1">
    <SectionHeader title="Where should Comfy run?" />
    <MarStartWhere />
  </section>
</template>

<style scoped>
/* The example's loop sits over its still and fades in on hover; the card
   itself stays put, like Recently used. */
.mar-stage-loop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 300ms ease;
}
.mar-stage-card:hover .mar-stage-loop,
.mar-stage-card:focus-visible .mar-stage-loop {
  opacity: 1;
}
.mar-stage-run {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 5px 11px;
  background: #fff;
  color: #111;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.18);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 200ms ease,
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-stage-card:hover .mar-stage-run,
.mar-stage-card:focus-visible .mar-stage-run {
  opacity: 1;
  transform: none;
}
/* Entry: each section rises in a beat after the one above. */
.mar-rise {
  animation: mar-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i, 0) * 60ms + 80ms);
}
@keyframes mar-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mar-rise {
    animation: none;
  }
  .mar-stage-loop,
  .mar-stage-run {
    transition: none;
  }
}
</style>
