<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import PromptBox from '../parts/PromptBox.vue'
import { proto } from '../useProto'
import { can } from '../milestones'
import MarStartWhere from './MarStartWhere.vue'
import cloudLoop from './assets/banner-cloud.mp4'
import cloudPoster from './assets/banner-cloud.jpg'
import bloomLoop from './assets/banner-bloom.mp4'
import bloomPoster from './assets/banner-bloom.jpg'
import ribbonLoop from './assets/banner-ribbon.mp4'
import ribbonPoster from './assets/banner-ribbon.jpg'
import portraitSun from './assets/portrait-sun.jpg'

/**
 * First run · Reel (UI Playground › First run): a split hero. On the left,
 * the welcome, the prompt and a few ideas to try; picking one writes it
 * into the prompt, so the first result is one click away. On the right, a
 * tall card plays what Comfy makes, one piece after another; pointing at
 * an idea shows its piece. Where Comfy runs sits below, full width.
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

const INTERVAL = 6000
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const index = ref(0)
const held = ref(false)
const piece = computed(() => PIECES[index.value]!)
let timer = 0
onMounted(() => {
  if (reduced) return
  timer = window.setInterval(() => {
    if (!held.value) index.value = (index.value + 1) % PIECES.length
  }, INTERVAL)
})
onBeforeUnmount(() => window.clearInterval(timer))

function show(i: number): void {
  index.value = i
  held.value = true
}
function release(): void {
  held.value = false
}
function tryIdea(p: Piece): void {
  proto.draft = { text: p.prompt, intent: 'output' }
}
</script>

<template>
  <section class="mar-reel mx-auto flex w-full max-w-260 flex-col">
    <div class="mar-reel-hero">
      <div class="flex min-w-0 flex-col items-start">
        <span class="mar-reel-eyebrow mar-rise" style="--i: 0">
          <span class="mar-reel-dot" />Welcome to Comfy
        </span>
        <h1 class="mar-reel-title mar-rise" style="--i: 1">Start with a sentence.</h1>
        <p class="mar-reel-sub mar-rise" style="--i: 2">
          Images, video and 3D, with every open and partner model. Say what you want and Comfy
          builds it.
        </p>
        <div v-if="can.agent" class="mar-prompt-slot mar-rise w-full" style="--i: 3">
          <PromptBox target class="mar-prompt" />
        </div>
        <div class="mar-reel-ideas mar-rise" style="--i: 4">
          <span class="mar-reel-ideas-label">Try one</span>
          <button
            v-for="(p, i) in PIECES"
            :key="p.idea"
            type="button"
            class="mar-reel-idea"
            :aria-pressed="index === i"
            @mouseenter="show(i)"
            @mouseleave="release"
            @focus="show(i)"
            @blur="release"
            @click="tryIdea(p)"
          >
            {{ p.idea }}<ArrowUpRight :size="13" />
          </button>
        </div>
      </div>

      <div
        class="mar-reel-card mar-rise"
        style="--i: 2"
        @mouseenter="held = true"
        @mouseleave="held = false"
      >
        <Transition name="mar-reel-fade">
          <div :key="piece.title" class="absolute inset-0">
            <video
              v-if="piece.video && !reduced"
              :src="piece.video"
              :poster="piece.src"
              autoplay
              muted
              loop
              playsinline
            />
            <img v-else :src="piece.src" alt="" />
          </div>
        </Transition>
        <span class="mar-reel-veil" aria-hidden="true" />
        <div class="mar-reel-caption">
          <span class="mar-reel-kind">{{ piece.kind }} · made with Comfy</span>
          <span class="mar-reel-name">{{ piece.title }}</span>
        </div>
        <div class="mar-reel-dots" aria-hidden="true">
          <span v-for="(p, i) in PIECES" :key="p.title" :class="{ 'is-on': index === i }" />
        </div>
      </div>
    </div>

    <div class="mar-reel-head mar-rise" style="--i: 5">
      <span class="text-base-foreground">Where should Comfy run?</span>
      <span>You can add the other one later</span>
    </div>
    <MarStartWhere class="mar-rise" style="--i: 6" />
  </section>
</template>

<style scoped>
.mar-reel {
  padding-top: 2vh;
  padding-bottom: 48px;
}
.mar-reel-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  align-items: center;
  gap: 56px;
}
.mar-reel-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted-foreground);
  font-size: 13px;
  font-weight: 500;
}
.mar-reel-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f9b8d4, #b9b2fb 50%, #9fe6cb);
}
.mar-reel-sub {
  max-width: 460px;
  margin: 14px 0 26px;
  color: var(--color-muted-foreground);
  font-size: 15px;
  line-height: 1.5;
}
.mar-reel-ideas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
}
.mar-reel-ideas-label {
  margin-right: 4px;
  color: var(--color-subtle-foreground);
  font-size: 13px;
}
.mar-reel-card {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  aspect-ratio: 4 / 5;
  max-height: 520px;
  justify-self: end;
  width: 100%;
  background: var(--color-card-background);
  box-shadow: 0 30px 80px -30px rgb(0 0 0 / 0.45);
}
.mar-reel-card video,
.mar-reel-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mar-reel-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 0.45), transparent 40%);
  pointer-events: none;
}
.mar-reel-caption {
  position: absolute;
  right: 20px;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #fff;
}
.mar-reel-kind {
  color: rgb(255 255 255 / 0.75);
  font-size: 12px;
}
.mar-reel-name {
  font-size: 16px;
  font-weight: 500;
}
.mar-reel-dots {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 5px;
}
.mar-reel-dots span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.45);
  transition:
    width 400ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 200ms ease;
}
.mar-reel-dots span.is-on {
  width: 16px;
  background: #fff;
}
.mar-reel-fade-enter-active,
.mar-reel-fade-leave-active {
  transition: opacity 900ms ease;
}
.mar-reel-fade-enter-from,
.mar-reel-fade-leave-to {
  opacity: 0;
}
.mar-reel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 48px 4px 12px;
  color: var(--color-subtle-foreground);
  font-size: 13px;
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
@media (max-width: 900px) {
  .mar-reel-hero {
    grid-template-columns: 1fr;
  }
  .mar-reel-card {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mar-rise {
    animation: none;
  }
  .mar-reel-dots span,
  .mar-reel-fade-enter-active,
  .mar-reel-fade-leave-active {
    transition: none;
  }
}
</style>

<style>
/* Global: the title, past the Home's larger greeting rule; the ideas are
   buttons, past the prototype's button reset. */
:root .mar-home h1.mar-reel-title.mar-reel-title {
  margin: 14px 0 0;
  font-size: 48px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.05;
  text-align: left;
}
:root .proto-ui.proto-ui.proto-ui .mar-reel-idea {
  display: inline-flex;
  width: auto;
  height: 32px;
  align-items: center;
  gap: 6px;
  padding: 0 12px 0 14px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-muted-foreground);
  font-size: 13px;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}
:root .proto-ui.proto-ui.proto-ui .mar-reel-idea:hover,
:root .proto-ui.proto-ui.proto-ui .mar-reel-idea[aria-pressed='true'] {
  background: color-mix(in oklch, var(--color-base-foreground) 11%, transparent);
  color: var(--color-base-foreground);
}
</style>
