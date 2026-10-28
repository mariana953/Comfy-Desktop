<script setup lang="ts">
import { computed } from 'vue'
import { thumb, type Template } from '../../mock'

/**
 * A template as a Comfy poster: a brand colour field, the slanted strokes
 * of the C mark sweeping across it, the output photo set in at an angle
 * (one stroke passes in front of it, so it sits inside the graphic rather
 * than on top), and the task in big type. Brand colour lives in imagery,
 * never in the UI around it.
 */
const { t } = defineProps<{ t: Template }>()

// Comfy brand: Deep Aubergine, Volt Yellow, Royal Violet, and a warm paper.
const PALETTES = {
  image: { bg: '#2a1838', ink: '#f0ff41', text: '#f6f1e7' },
  video: { bg: '#f0ff41', ink: '#2a1838', text: '#1a1022' },
  '3d': { bg: '#5b3df5', ink: '#f0ff41', text: '#ffffff' },
  audio: { bg: '#f3eee4', ink: '#5b3df5', text: '#1a1022' }
} as const
const pal = computed(() => PALETTES[t.category])

// The task, short: "Image to Video" from "LTX 2.5: Image to Video".
const title = computed(() => {
  const [a, b] = t.title.split(':').map((s) => s.trim())
  return b ?? a!
})
// Vary the angle per template so a grid doesn't look stamped.
const tilt = computed(() => ([...t.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 3) - 1)
</script>

<template>
  <div
    class="bt"
    :style="{
      '--bt-bg': pal.bg,
      '--bt-ink': pal.ink,
      '--bt-text': pal.text,
      '--bt-tilt': `${tilt * 3 - 5}deg`
    }"
  >
    <!-- Strokes behind the photo. -->
    <svg
      class="bt-strokes"
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path d="M205 -20 L140 230" />
      <path d="M330 30 L250 230" />
      <path d="M262 -40 a46 46 0 1 1 0.1 0" class="bt-ring" />
    </svg>
    <img :src="thumb(t.id)" alt="" class="bt-photo" loading="lazy" />
    <!-- One stroke in front, so the photo sits inside the graphic. -->
    <svg
      class="bt-strokes is-front"
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <path d="M232 230 L300 60" />
    </svg>
    <span class="bt-title">{{ title }}</span>
  </div>
</template>

<style scoped>
.bt {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bt-bg);
}
.bt-strokes {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.bt-strokes path {
  fill: none;
  stroke: var(--bt-ink);
  stroke-linecap: round;
  stroke-width: 22;
}
.bt-strokes .bt-ring {
  stroke-width: 18;
}
.bt-strokes.is-front {
  z-index: 2;
}
.bt-photo {
  position: absolute;
  right: 6%;
  bottom: -8%;
  z-index: 1;
  width: 54%;
  height: 92%;
  border-radius: 18px;
  object-fit: cover;
  box-shadow: 0 18px 40px -16px rgb(0 0 0 / 0.55);
  transform: rotate(var(--bt-tilt));
}
.bt-title {
  position: absolute;
  top: 22%;
  left: 7%;
  z-index: 3;
  display: -webkit-box;
  max-width: 36%;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--bt-text);
  font-size: clamp(14px, 1.35vw, 19px);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.02;
}
</style>
