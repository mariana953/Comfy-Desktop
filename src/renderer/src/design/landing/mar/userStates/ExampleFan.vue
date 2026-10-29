<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Play } from 'lucide-vue-next'
import { hostActions, instances } from '../../useProto'
import { INSTANCES } from '../../mock'
import { EXAMPLES, type Example } from './examples'

/**
 * Start from an example, as a hand of cards: Pablo's fan
 * (parts/StarterCards.vue) at Mar's size, so a first-time Home never
 * reads like Recently used. The hand is dealt open on arrival; hovering a
 * card straightens and lifts it, plays its loop and shows Run. Picking
 * one runs it on Comfy Cloud: nothing to set up first.
 */
const hovered = ref<number | null>(null)
const dealt = ref(false)
const mid = (EXAMPLES.length - 1) / 2
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

onMounted(() => {
  // Start stacked, then open the hand on the next frame.
  if (reduced) dealt.value = true
  else requestAnimationFrame(() => requestAnimationFrame(() => (dealt.value = true)))
})

/** Fanned like a hand of cards. Hover lifts an inner layer only (CSS),
 *  so the hit area never slips out from under the cursor. */
function pose(i: number): Record<string, string> {
  const d = i - mid
  const open = dealt.value
  return {
    transform: open
      ? `translate(${d * 172}px, ${Math.abs(d) * 14}px) rotate(${hovered.value === i ? 0 : d * 5}deg)`
      : `translate(0, 24px) rotate(${d * 1.5}deg)`,
    zIndex: String(hovered.value === i ? 20 : 10 - Math.abs(Math.round(d))),
    transitionDelay: open && hovered.value === null ? `${Math.abs(d) * 40}ms` : '0ms'
  }
}
const cards = computed(() => EXAMPLES.map((x, i) => ({ x, i })))

function run(x: Example): void {
  const cloud = instances.value.find((i) => i.kind === 'cloud') ?? INSTANCES[0]!
  hostActions.launch(cloud, x.label)
}
function loop(e: Event, on: boolean): void {
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
  <div
    class="mar-fan relative mx-auto h-78 w-full"
    role="list"
    aria-label="Examples"
    @mouseleave="hovered = null"
  >
    <button
      v-for="{ x, i } in cards"
      :key="x.label"
      type="button"
      role="listitem"
      class="mar-fan-card group absolute top-2 left-1/2 -ml-22 h-62 w-44 rounded-card text-left outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      :class="dealt && 'is-dealt'"
      :style="pose(i)"
      @mouseenter="((hovered = i), loop($event, true))"
      @mouseleave="loop($event, false)"
      @focus="((hovered = i), loop($event, true))"
      @blur="loop($event, false)"
      @click="run(x)"
    >
      <span class="mar-fan-lift relative block size-full overflow-hidden rounded-card">
        <img :src="x.src" alt="" class="absolute inset-0 size-full object-cover" />
        <video
          v-if="x.video"
          :src="x.video"
          muted
          loop
          playsinline
          preload="none"
          class="mar-fan-loop"
        />
        <span class="mar-fan-shade" />
        <span class="mar-fan-shimmer" />
        <span class="mar-fan-run"><Play :size="11" fill="currentColor" />Run</span>
        <span class="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-1">
          <span class="text-ui leading-snug font-medium text-white">{{ x.label }}</span>
          <span class="flex items-center gap-1.5 text-[12px] text-white/70">
            <span>{{ x.kind }}</span
            ><span aria-hidden="true">·</span><span>{{ x.runs }}</span>
          </span>
        </span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.mar-fan {
  --mar-fan-ease: cubic-bezier(0.19, 1, 0.22, 1);
}
.mar-fan-card {
  opacity: 0;
  transition:
    transform 700ms var(--mar-fan-ease),
    opacity 400ms ease;
}
.mar-fan-card.is-dealt {
  opacity: 1;
}
.mar-fan-lift {
  border: 1px solid rgb(255 255 255 / 0.1);
  background: var(--color-card-background);
  box-shadow: 0 22px 44px -20px rgb(0 0 0 / 0.8);
  transition:
    transform 300ms var(--mar-fan-ease),
    box-shadow 300ms ease;
}
:global(:root[data-ds-theme='light'] .mar-fan-lift) {
  border-color: rgb(0 0 0 / 0.06);
  box-shadow: 0 22px 40px -22px rgb(0 0 0 / 0.45);
}
.mar-fan-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 45%, rgb(0 0 0 / 0.78));
}
.mar-fan-loop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 300ms ease;
}
.mar-fan-run {
  position: absolute;
  top: 10px;
  right: 10px;
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
  transform: translateY(-4px);
  transition:
    opacity 200ms ease,
    transform 300ms var(--mar-fan-ease);
}
/* Hover (mouse only) or keyboard focus: the card lifts, its loop plays
   and Run shows. */
@media (hover: hover) and (pointer: fine) {
  .mar-fan-card:hover .mar-fan-lift {
    transform: translateY(-10px) scale(1.03);
    box-shadow: 0 30px 50px -20px rgb(0 0 0 / 0.85);
  }
  .mar-fan-card:hover .mar-fan-loop,
  .mar-fan-card:hover .mar-fan-run {
    opacity: 1;
    transform: none;
  }
}
.mar-fan-card:focus-visible .mar-fan-lift {
  transform: translateY(-10px) scale(1.03);
}
.mar-fan-card:focus-visible .mar-fan-loop,
.mar-fan-card:focus-visible .mar-fan-run {
  opacity: 1;
  transform: none;
}
/* Pablo's shimmer: a faint band passes every few seconds, card by card. */
.mar-fan-shimmer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(
    105deg,
    transparent 40%,
    rgb(255 255 255 / 0.08) 50%,
    transparent 60%
  );
  background-size: 250% 100%;
  background-position: 150% 0;
  animation: mar-fan-sweep 9s cubic-bezier(0.645, 0.045, 0.355, 1) infinite;
  animation-delay: calc(var(--mar-fan-i, 0) * 0.6s);
}
.mar-fan-card:nth-child(2) .mar-fan-shimmer {
  --mar-fan-i: 1;
}
.mar-fan-card:nth-child(3) .mar-fan-shimmer {
  --mar-fan-i: 2;
}
.mar-fan-card:nth-child(4) .mar-fan-shimmer {
  --mar-fan-i: 3;
}
.mar-fan-card:nth-child(5) .mar-fan-shimmer {
  --mar-fan-i: 4;
}
@keyframes mar-fan-sweep {
  0% {
    background-position: 150% 0;
  }
  25%,
  100% {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mar-fan-shimmer {
    animation: none;
  }
  .mar-fan-card,
  .mar-fan-lift,
  .mar-fan-loop,
  .mar-fan-run {
    transition: none;
  }
}
</style>
