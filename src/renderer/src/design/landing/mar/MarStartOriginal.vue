<script setup lang="ts">
import { ArrowRight, Cloud, Laptop, Play } from 'lucide-vue-next'
import { go, hostActions, instances, proto } from '../useProto'
import { INSTANCES, thumb } from '../mock'
import { can } from '../milestones'
import SectionHeader from '../ui/SectionHeader.vue'

/**
 * First run · Original (UI Playground › First run): the same Home a
 * returning user gets, only emptier: under the same greeting and prompt
 * (MarHomeV10.vue), run an example as a row of pictures named by what they
 * do, or, for those who already know ComfyUI, open the node editor on
 * Cloud or on this computer.
 */
const STARTERS = [
  { label: 'Remove a background', thumbId: 'api_google_nano_banana2_image_edit', kind: 'Image' },
  { label: 'Turn a photo into video', thumbId: 'video_ltx2_5_i2v', kind: 'Video' },
  { label: 'Reshoot your product', thumbId: 'template_product_placement', kind: 'Image' },
  { label: 'Upscale to 4K', thumbId: 'utility_seedvr2_image_upscale', kind: 'Image' }
]
function run(label: string): void {
  const cloud = instances.value.find((i) => i.kind === 'cloud') ?? INSTANCES[0]!
  hostActions.launch(cloud, label)
}
function openCloud(): void {
  if (proto.signedIn) hostActions.launch(INSTANCES[0]!)
  else hostActions.signIn()
}
</script>

<template>
  <section class="mt-10">
    <SectionHeader
      title="Run an example on Comfy Cloud"
      :link="can.explore ? 'See all' : undefined"
      @link="go('explore')"
    >
      <template #controls>
        <span
          class="inline-flex h-5 items-center rounded-full bg-secondary-background px-2 text-ui text-muted-foreground"
          >{{ STARTERS.length }}</span
        >
      </template>
    </SectionHeader>
    <div class="mar-start-grid">
      <button
        v-for="s in STARTERS"
        :key="s.label"
        type="button"
        class="mar-start-card group"
        @click="run(s.label)"
      >
        <img :src="thumb(s.thumbId)" alt="" loading="lazy" />
        <span class="mar-start-chip">{{ s.kind }}</span>
        <span class="mar-start-label">{{ s.label }}</span>
        <span class="mar-start-run"><Play :size="12" fill="currentColor" />Run</span>
      </button>
    </div>
  </section>

  <section class="mt-10">
    <SectionHeader title="Know ComfyUI? Open the node editor" />
    <div class="mar-start-ways">
      <button type="button" class="mar-start-way" @click="openCloud">
        <span class="mar-start-icon"><Cloud :size="17" /></span>
        <span class="flex min-w-0 flex-1 flex-col text-left">
          <span class="text-ui font-medium text-base-foreground">Comfy Cloud</span>
          <span class="text-ui text-subtle-foreground">Fast GPUs, every model ready</span>
        </span>
        <ArrowRight :size="15" class="mar-start-go" />
      </button>
      <button type="button" class="mar-start-way" @click="hostActions.newInstance()">
        <span class="mar-start-icon"><Laptop :size="17" /></span>
        <span class="flex min-w-0 flex-1 flex-col text-left">
          <span class="text-ui font-medium text-base-foreground">This computer</span>
          <span class="text-ui text-subtle-foreground">Runs on your GPU, works offline</span>
        </span>
        <ArrowRight :size="15" class="mar-start-go" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.mar-start-grid {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.mar-start-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-start-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 0.72), transparent 55%);
}
.mar-start-chip {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1;
  border-radius: 999px;
  padding: 3px 8px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  font-size: 11px;
}
.mar-start-label {
  position: absolute;
  right: 14px;
  bottom: 14px;
  left: 14px;
  z-index: 1;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-start-run {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  padding: 5px 10px;
  background: #fff;
  color: #111;
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity 200ms ease,
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-start-card:hover .mar-start-run,
.mar-start-card:focus-visible .mar-start-run {
  opacity: 1;
  transform: none;
}
.mar-start-card:hover .mar-start-label {
  transform: translateY(-30px);
}
.mar-start-ways {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.mar-start-icon {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-muted-foreground);
}
.mar-start-go {
  color: var(--color-subtle-foreground);
  transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-start-way:hover .mar-start-go {
  color: var(--color-base-foreground);
  transform: translateX(3px);
}
@media (prefers-reduced-motion: reduce) {
  .mar-start-card img,
  .mar-start-label,
  .mar-start-run,
  .mar-start-go {
    transition: none;
  }
}
</style>

<style>
/* Global: these are buttons, past the prototype's button reset. */
:root .proto-ui.proto-ui.proto-ui .mar-start-card {
  position: relative;
  width: auto;
  overflow: hidden;
  padding: 0;
  border-radius: 18px;
  aspect-ratio: 1;
}
:root .proto-ui.proto-ui.proto-ui .mar-start-way {
  display: flex;
  width: auto;
  height: 72px;
  align-items: center;
  gap: 14px;
  padding: 0 18px 0 16px;
  border-radius: 18px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(20px);
  transition: background-color 160ms ease;
}
:root .proto-ui.proto-ui.proto-ui .mar-start-way:hover {
  background: color-mix(in oklch, var(--color-card-background-hover) 80%, transparent);
}
</style>
