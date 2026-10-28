<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import Button from '../ui/Button.vue'
import { toast } from '../useProto'
import hillsSunset from './assets/hills-sunset.jpg'
import portraitSun from './assets/portrait-sun.jpg'
import forestFog from './assets/forest-fog.jpg'

/**
 * Mar's What's new: one full-width branded banner at a time (direction C in
 * Figma "What's new · directions"). A looping visual, one centred message,
 * a white CTA and a quiet link. Slides advance on their own and pause while
 * the pointer is over the banner. `video` takes a brand-kit loop; until one
 * exists the slide shows its gradient.
 */
interface Slide {
  id: string
  title: string
  cta: string
  gradient: string
  video?: string
  /** A photo from the Magnific series, slowly drifting, until a loop exists. */
  image?: string
}

const SLIDES: Slide[] = [
  {
    id: 'cloud',
    title: 'Comfy Cloud is here.\nRun any workflow without a GPU.',
    cta: 'Try it',
    image: hillsSunset,
    gradient:
      'radial-gradient(60% 90% at 18% 30%, #3b82f6 0%, transparent 60%), radial-gradient(50% 80% at 85% 70%, #60a5fa 0%, transparent 65%), linear-gradient(120deg, #0b1b3f, #1e3a8a 45%, #0f2a5f)'
  },
  {
    id: 'wan',
    title: 'Wan 2.5 is in ComfyUI.\nA still becomes a scene.',
    cta: 'Try it now',
    image: portraitSun,
    gradient:
      'radial-gradient(55% 90% at 20% 70%, #f97316 0%, transparent 60%), radial-gradient(55% 85% at 80% 25%, #db2777 0%, transparent 62%), linear-gradient(120deg, #2a0f1f, #6b1d3a 50%, #3a1208)'
  },
  {
    id: 'apps',
    title: 'Apps are here.\nTurn any workflow into a form.',
    cta: 'See how',
    image: forestFog,
    gradient:
      'radial-gradient(60% 90% at 80% 35%, #10b981 0%, transparent 60%), radial-gradient(50% 80% at 15% 75%, #a3e635 0%, transparent 60%), linear-gradient(120deg, #06231b, #0f4d3a 50%, #0b2a12)'
  }
]

const INTERVAL = 7000
const index = ref(0)
const paused = ref(false)
const slide = computed(() => SLIDES[index.value]!)

// How far the current slide is through its time (0 to 1); it fills the
// active dot below, stops while the pointer is over the banner, and moves
// to the next slide when it is full. Picking a dot starts that slide over.
const progress = ref(0)
let raf = 0
let last = 0
function tick(now: number): void {
  if (last && !paused.value) progress.value += (now - last) / INTERVAL
  last = now
  if (progress.value >= 1) {
    progress.value = 0
    index.value = (index.value + 1) % SLIDES.length
  }
  raf = requestAnimationFrame(tick)
}
function pick(i: number): void {
  index.value = i
  progress.value = 0
}
onMounted(() => {
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <section class="mt-10">
    <!-- No section title: the banner says what's new; only the way to all
         launches stays. -->
    <div class="mb-3.5 flex justify-end">
      <Button variant="link" size="sm" @click="toast('All launches')">
        All launches<ArrowUpRight :size="13" />
      </Button>
    </div>
    <div
      class="relative aspect-[5/1] min-h-52 overflow-hidden rounded-[20px]"
      @mouseenter="paused = true"
      @mouseleave="paused = false"
    >
      <Transition name="banner-fade">
        <div :key="slide.id" class="absolute inset-0">
          <video
            v-if="slide.video"
            :src="slide.video"
            autoplay
            muted
            loop
            playsinline
            class="absolute inset-0 size-full object-cover"
          />
          <template v-else-if="slide.image">
            <img
              :src="slide.image"
              alt=""
              class="banner-drift absolute inset-0 size-full object-cover"
            />
            <span class="banner-veil absolute inset-0" aria-hidden="true" />
          </template>
          <div
            v-else
            class="banner-gradient absolute inset-0"
            :style="{ backgroundImage: slide.gradient }"
          />
          <span class="banner-grain absolute inset-0" aria-hidden="true" />
          <div
            class="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center"
          >
            <h3
              class="text-[30px] leading-[1.15] font-medium tracking-[-0.015em] whitespace-pre-line text-white drop-shadow-sm"
            >
              {{ slide.title }}
            </h3>
            <div class="flex items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                class="bg-white text-black hover:bg-white/90"
                @click="toast(slide.cta)"
                >{{ slide.cta }}</Button
              >
              <Button
                variant="link"
                size="sm"
                class="text-white/85 hover:text-white"
                @click="toast('Learn more')"
                >Learn more</Button
              >
            </div>
          </div>
        </div>
      </Transition>
    </div>
    <div class="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="What's new slides">
      <button
        v-for="(s, i) in SLIDES"
        :key="s.id"
        type="button"
        role="tab"
        :aria-selected="i === index"
        :aria-label="`Slide ${i + 1}`"
        :class="[
          'relative h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-300',
          i === index
            ? 'w-8 bg-muted-foreground/30'
            : 'w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground'
        ]"
        @click="pick(i)"
      >
        <span
          v-if="i === index"
          class="absolute inset-y-0 left-0 rounded-full bg-base-foreground"
          :style="{ width: `${Math.min(progress, 1) * 100}%` }"
        />
      </button>
    </div>
  </section>
</template>

<style scoped>
/* Photo slides drift slowly (Ken Burns) under a veil that keeps the
   centred message readable. */
.banner-drift {
  animation: banner-drift 14s cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
}
.banner-veil {
  background:
    radial-gradient(70% 90% at 50% 50%, rgb(0 0 0 / 0.45), rgb(0 0 0 / 0.2)),
    linear-gradient(to bottom, rgb(0 0 0 / 0.15), rgb(0 0 0 / 0.35));
}
@keyframes banner-drift {
  from {
    transform: scale(1.04) translate3d(-1%, 0, 0);
  }
  to {
    transform: scale(1.12) translate3d(1.5%, -1%, 0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .banner-drift {
    animation: none;
  }
}
.banner-gradient {
  background-size: 140% 140%;
  animation: banner-drift 18s ease-in-out infinite alternate;
}

/* Film grain over the gradient, as in the brand's banners. */
.banner-grain {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>");
  mix-blend-mode: overlay;
  opacity: 0.35;
}

@keyframes banner-drift {
  from {
    background-position: 0% 30%;
  }
  to {
    background-position: 100% 70%;
  }
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition: opacity 600ms ease;
}
.banner-fade-enter-from,
.banner-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .banner-gradient {
    animation: none;
  }
  .banner-fade-enter-active,
  .banner-fade-leave-active {
    transition: none;
  }
}
</style>
