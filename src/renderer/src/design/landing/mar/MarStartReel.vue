<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import { go, proto } from '../useProto'
import { can } from '../milestones'
import MediaCard from '../ui/MediaCard.vue'
import ScrollRow from '../ui/ScrollRow.vue'
import SectionHeader from '../ui/SectionHeader.vue'
import MarStartWhere from './MarStartWhere.vue'
import cloudLoop from './assets/banner-cloud.mp4'
import cloudPoster from './assets/banner-cloud.jpg'
import bloomLoop from './assets/banner-bloom.mp4'
import bloomPoster from './assets/banner-bloom.jpg'
import ribbonLoop from './assets/banner-ribbon.mp4'
import ribbonPoster from './assets/banner-ribbon.jpg'
import portraitSun from './assets/portrait-sun.jpg'

/**
 * First run · Reel (UI Playground › First run): the sections of the
 * returning Home, under the same greeting and prompt (MarHomeV10.vue).
 * Where Recently used goes, a reel of what Comfy makes, playing; picking a
 * piece writes its prompt into the prompt box, so the first result is one
 * click away. Where Builds go, where Comfy runs.
 */
interface Piece {
  idea: string
  prompt: string
  title: string
  kind: string
  src: string
  video?: string
}
const PIECES: Piece[] = [
  {
    idea: 'Pastel clouds',
    prompt: 'A slow drift through pastel clouds at sunrise',
    title: 'Pastel clouds at sunrise',
    kind: 'Video',
    src: cloudPoster,
    video: cloudLoop
  },
  {
    idea: 'Slow-motion flower',
    prompt: 'A peony opening in slow motion, soft light',
    title: 'A peony opening',
    kind: 'Video',
    src: bloomPoster,
    video: bloomLoop
  },
  {
    idea: 'Portrait',
    prompt: 'A portrait at golden hour, warm light, shallow depth',
    title: 'Golden hour portrait',
    kind: 'Image',
    src: portraitSun
  },
  {
    idea: 'Silk ribbons',
    prompt: 'Pastel silk ribbons moving in the wind',
    title: 'Silk in the wind',
    kind: 'Video',
    src: ribbonPoster,
    video: ribbonLoop
  }
]

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function tryIdea(p: Piece): void {
  proto.draft = { text: p.prompt, intent: 'output' }
}
</script>

<template>
  <section class="mar-rise mt-10" style="--i: 0">
    <SectionHeader
      title="Made with Comfy"
      :link="can.explore ? 'See all' : undefined"
      @link="go('explore')"
    >
      <template #controls>
        <span
          class="inline-flex h-5 items-center rounded-full bg-secondary-background px-2 text-ui text-muted-foreground"
          >{{ PIECES.length }}</span
        >
      </template>
    </SectionHeader>
    <ScrollRow :columns="4">
      <MediaCard
        v-for="p in PIECES"
        :key="p.title"
        ratio="4/3"
        class="mar-reel-card"
        @click="tryIdea(p)"
        @keydown.enter="tryIdea(p)"
      >
        <template #media>
          <video
            v-if="p.video && !reduced"
            :src="p.video"
            :poster="p.src"
            autoplay
            muted
            loop
            playsinline
            class="size-full object-cover"
          />
          <img v-else :src="p.src" alt="" loading="lazy" class="size-full object-cover" />
        </template>
        <template #top-left>
          <span class="mar-reel-kind">{{ p.kind }}</span>
        </template>
        <template #bottom-right>
          <span class="mar-reel-try">Try it<ArrowUpRight :size="13" /></span>
        </template>
        <p class="truncate text-ui font-medium">{{ p.title }}</p>
        <p class="mt-1 truncate text-ui text-subtle-foreground">{{ p.prompt }}</p>
      </MediaCard>
    </ScrollRow>
  </section>

  <section class="mar-rise mt-10" style="--i: 1">
    <SectionHeader title="Where should Comfy run?" />
    <MarStartWhere />
  </section>
</template>

<style scoped>
.mar-reel-kind {
  border-radius: 999px;
  padding: 3px 8px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  font-size: 11px;
}
/* Picking a piece writes its prompt into the box above. */
.mar-reel-try {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 5px 9px 5px 11px;
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
.mar-reel-card:hover .mar-reel-try,
.mar-reel-card:focus-visible .mar-reel-try {
  opacity: 1;
  transform: none;
}
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
  .mar-reel-try {
    transition: none;
  }
}
</style>
