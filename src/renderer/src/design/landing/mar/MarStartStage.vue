<script setup lang="ts">
import { Play } from 'lucide-vue-next'
import PromptBox from '../parts/PromptBox.vue'
import { hostActions, instances } from '../useProto'
import { INSTANCES, thumb } from '../mock'
import { can } from '../milestones'
import MarStartWhere from './MarStartWhere.vue'
import cloudLoop from './assets/banner-cloud.mp4'
import cloudPoster from './assets/banner-cloud.jpg'
import bloomLoop from './assets/banner-bloom.mp4'
import bloomPoster from './assets/banner-bloom.jpg'
import portraitGarden from './assets/portrait-garden.jpg'
import lakeFog from './assets/lake-fog.jpg'

/**
 * First run · Stage (UI Playground › First run): a soft pastel loop glows
 * behind the welcome, so the page feels made with Comfy before you make
 * anything. Then one question at a time: what to make (the prompt), an
 * example to run in a click (a short loop plays on hover), and where Comfy
 * runs, Cloud or this computer, each saying what it takes.
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
  { label: 'Upscale to 4K', meta: 'Image · about 15 s', src: lakeFog }
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
  <section class="mar-stage mx-auto flex w-full max-w-240 flex-col items-center">
    <div class="mar-stage-aura" aria-hidden="true">
      <video
        v-if="!reduced"
        :src="cloudLoop"
        :poster="cloudPoster"
        autoplay
        muted
        loop
        playsinline
      />
      <img v-else :src="cloudPoster" alt="" />
    </div>

    <span class="mar-stage-eyebrow mar-rise" style="--i: 0">Welcome to Comfy</span>
    <h1 class="mar-stage-title mar-rise" style="--i: 1">What will you make first?</h1>
    <p class="mar-stage-sub mar-rise" style="--i: 2">
      Images, video and 3D, with every open and partner model. Describe it, or start from an
      example.
    </p>

    <div v-if="can.agent" class="mar-prompt-slot mar-rise w-full max-w-180" style="--i: 3">
      <PromptBox target class="mar-prompt" />
    </div>

    <div class="mar-stage-head mar-rise" style="--i: 4">
      <span class="text-base-foreground">Start from an example</span>
      <span>Runs on Comfy Cloud · nothing to set up</span>
    </div>
    <div class="mar-stage-grid mar-rise" style="--i: 5">
      <button
        v-for="x in EXAMPLES"
        :key="x.label"
        type="button"
        class="mar-stage-card"
        @click="run(x.label)"
        @mouseenter="preview($event, true)"
        @mouseleave="preview($event, false)"
        @focus="preview($event, true)"
        @blur="preview($event, false)"
      >
        <span class="mar-stage-media">
          <img :src="x.src" alt="" loading="lazy" />
          <video v-if="x.video" :src="x.video" muted loop playsinline preload="none" />
          <span class="mar-stage-run"><Play :size="11" fill="currentColor" />Run</span>
        </span>
        <span class="mar-stage-label">{{ x.label }}</span>
        <span class="mar-stage-meta">{{ x.meta }}</span>
      </button>
    </div>

    <div class="mar-stage-head mar-rise" style="--i: 6">
      <span class="text-base-foreground">Where should Comfy run?</span>
      <span>You can add the other one later</span>
    </div>
    <MarStartWhere class="mar-rise" style="--i: 7" />
  </section>
</template>

<style scoped>
.mar-stage {
  position: relative;
  isolation: isolate;
  padding-top: 4vh;
  padding-bottom: 48px;
}
/* The loop, masked to a soft oval behind the title: a glow, not a banner. */
.mar-stage-aura {
  position: absolute;
  z-index: -1;
  top: -120px;
  left: 50%;
  width: min(1100px, 120%);
  height: 460px;
  transform: translateX(-50%);
  opacity: 0.5;
  mask-image: radial-gradient(ellipse 50% 46% at 50% 50%, #000 15%, transparent 72%);
  pointer-events: none;
  animation: mar-aura-in 1600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
:global(:root[data-ds-theme='light']) .mar-stage-aura {
  opacity: 0.7;
}
.mar-stage-aura video,
.mar-stage-aura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(6px) saturate(1.15);
}
@keyframes mar-aura-in {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(1.06);
  }
}
.mar-stage-eyebrow {
  border-radius: 999px;
  padding: 4px 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  backdrop-filter: blur(12px);
  color: var(--color-muted-foreground);
  font-size: 12px;
  font-weight: 500;
}
.mar-stage-sub {
  max-width: 520px;
  margin: 12px 0 28px;
  color: var(--color-muted-foreground);
  font-size: 15px;
  line-height: 1.5;
  text-align: center;
  text-wrap: balance;
}
.mar-stage-head {
  display: flex;
  align-self: stretch;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 40px 4px 12px;
  color: var(--color-subtle-foreground);
  font-size: 13px;
}
.mar-stage-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.mar-stage-media {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: 20px;
  aspect-ratio: 4 / 3;
  background: var(--color-card-background);
}
.mar-stage-media img,
.mar-stage-media video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition:
    transform 900ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 300ms ease;
}
.mar-stage-media video {
  opacity: 0;
}
.mar-stage-card:hover .mar-stage-media img,
.mar-stage-card:hover .mar-stage-media video {
  transform: scale(1.04);
}
.mar-stage-card:hover .mar-stage-media video,
.mar-stage-card:focus-visible .mar-stage-media video {
  opacity: 1;
}
.mar-stage-run {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 1;
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
.mar-stage-label {
  margin: 10px 4px 0;
  color: var(--color-base-foreground);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}
.mar-stage-meta {
  margin: 2px 4px 0;
  color: var(--color-subtle-foreground);
  font-size: 12px;
  text-align: left;
}
/* Entry: each block rises in a beat after the one above. */
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
@media (max-width: 900px) {
  .mar-stage-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (prefers-reduced-motion: reduce) {
  .mar-rise,
  .mar-stage-aura {
    animation: none;
  }
  .mar-stage-media img,
  .mar-stage-media video,
  .mar-stage-run {
    transition: none;
  }
}
</style>

<style>
/* Global: the title, past the Home's larger greeting rule; the cards are
   buttons, past the prototype's button reset. */
:root .mar-home h1.mar-stage-title.mar-stage-title {
  margin: 16px 0 0;
  font-size: 44px;
  font-weight: 600;
  letter-spacing: -0.038em;
  line-height: 1.1;
  text-align: center;
}
:root .proto-ui.proto-ui.proto-ui .mar-stage-card {
  display: flex;
  width: auto;
  height: auto;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  border-radius: 20px;
  background: none;
}
</style>
