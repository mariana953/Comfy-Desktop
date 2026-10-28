<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ArrowRight, Check, Plus, X } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import PromptBox from '../../parts/PromptBox.vue'
import DropdownMenuContent from '../../ui/DropdownMenuContent.vue'
import DropdownMenuItem from '../../ui/DropdownMenuItem.vue'
import MediaChip from '../MediaChip.vue'
import { can } from '../../milestones'
import { LAUNCHES } from '../../mock'
import {
  activeInstance,
  go,
  hostActions,
  openDetail,
  proto,
  requireLogin,
  toast,
  type Page
} from '../../useProto'
import { NEWS_ART, RECENT_ART, homeSpaces, orb, recent, type RecentItem } from './P02homeData'

/**
 * 05 · Composer: the Home leads with a composer. The prompt, the images it
 * works from and a few parameters as chips (label over value) sit on the
 * left; the batch it makes fills in on the right as each image is ready.
 * Model and aspect ratio stay out of the Home prompt (Mar's rule), so the
 * chips are images, steps, LoRA and seed. Enter generates.
 */
const prompt = ref('')

// References: the images the prompt works from.
const refs = ref<{ src: string; name: string; own?: boolean }[]>([
  { src: RECENT_ART[7]!, name: 'Reference 1' },
  { src: RECENT_ART[0]!, name: 'Reference 2' }
])
const fileInput = ref<HTMLInputElement>()
function addRefs(files: FileList | null | undefined): void {
  for (const f of Array.from(files ?? []).filter((x) => x.type.startsWith('image/')))
    refs.value.push({ src: URL.createObjectURL(f), name: f.name, own: true })
}
function removeRef(i: number): void {
  const [r] = refs.value.splice(i, 1)
  if (r?.own) URL.revokeObjectURL(r.src)
}

// Parameter chips: label over value, each a small menu.
type Param = 'images' | 'steps' | 'lora' | 'seed'
const PARAMS: { key: Param; label: string; options: string[] }[] = [
  { key: 'images', label: 'Images', options: ['1', '2', '4'] },
  { key: 'steps', label: 'Steps', options: ['20', '28', '40'] },
  { key: 'lora', label: 'LoRA', options: ['None', 'product-light · 0.8', 'film-grain · 0.6'] },
  { key: 'seed', label: 'Seed', options: ['Random', 'Fixed · 11902'] }
]
const params = reactive<Record<Param, string>>({
  images: '4',
  steps: '28',
  lora: 'product-light · 0.8',
  seed: 'Random'
})
const count = computed(() => Number(params.images))

// Results: the latest batch. Each image is ready, running or queued.
interface Result {
  src: string
  seed: number
  progress: number
}
const results = ref<Result[]>([
  { src: RECENT_ART[7]!, seed: 11902, progress: 100 },
  { src: RECENT_ART[0]!, seed: 48213, progress: 100 },
  { src: RECENT_ART[4]!, seed: 73120, progress: 62 },
  { src: RECENT_ART[2]!, seed: 90544, progress: 0 }
])
const ready = computed(() => results.value.filter((r) => r.progress >= 100).length)
const runningIndex = computed(() => results.value.findIndex((r) => r.progress < 100))

let timer: ReturnType<typeof setInterval> | undefined
function tick(): void {
  const r = results.value[runningIndex.value]
  if (!r) return clearInterval(timer)
  r.progress = Math.min(100, r.progress + 1.2)
}
function run(): void {
  clearInterval(timer)
  timer = setInterval(tick, 90)
}
onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) run()
})
onBeforeUnmount(() => clearInterval(timer))

function generate(): void {
  if (!prompt.value.trim()) {
    toast('Describe what to make first')
    return
  }
  if (activeInstance.value.kind === 'cloud' && !proto.signedIn) {
    requireLogin('Log in to run this on Comfy Cloud')
    return
  }
  const fixed = params.seed.startsWith('Fixed') ? 11902 : undefined
  results.value = Array.from({ length: count.value }, (_, i) => ({
    src: refs.value[i % Math.max(1, refs.value.length)]?.src ?? RECENT_ART[i]!,
    seed: fixed !== undefined ? fixed + i : Math.floor(10000 + Math.random() * 89999),
    progress: 0
  }))
  toast(`Generating ${count.value} on ${activeInstance.value.name}`)
  run()
}

// Enter generates; Shift+Enter stays a new line in the prompt.
function onKey(e: KeyboardEvent): void {
  if (e.key !== 'Enter' || e.shiftKey || !(e.target instanceof HTMLTextAreaElement)) return
  e.preventDefault()
  e.stopPropagation()
  generate()
}

function openRecent(r: RecentItem): void {
  if (r.env) hostActions.launch(r.env, r.w.name)
  else openDetail('workflow', r.w.name)
}
const strip = computed(() => recent.value.slice(0, 5))
const news = computed(() => LAUNCHES.slice(0, 3))
const spaces = computed(() => homeSpaces.value.slice(0, 4))
</script>

<template>
  <div class="p05 mx-auto w-full max-w-310 px-8 pt-14 pb-12">
    <div class="grid grid-cols-[minmax(0,31rem)_minmax(0,1fr)] gap-8">
      <!-- Left: the composer, then the Home's lists. -->
      <div class="min-w-0">
        <p class="text-ui text-muted-foreground">New generation</p>
        <h1 class="mar-greeting mt-1 mb-5 text-[34px] leading-tight font-bold tracking-[-0.025em]">
          Hi Mar. Let's create
        </h1>

        <section class="p05-composer rounded-[24px] p-2" @keydown.capture="onKey">
          <div class="mar-prompt-slot">
            <PromptBox v-model="prompt" target class="mar-prompt max-w-none!" />
          </div>

          <div class="px-2 pt-3">
            <div class="flex items-center gap-2">
              <span v-for="(r, i) in refs" :key="r.src + i" class="group relative">
                <img :src="r.src" :alt="r.name" class="size-13 rounded-[12px] object-cover" />
                <button
                  type="button"
                  :aria-label="`Remove ${r.name}`"
                  class="p05-ref-x"
                  @click="removeRef(i)"
                >
                  <X :size="11" />
                </button>
              </span>
              <button
                type="button"
                class="p05-ref-add"
                aria-label="Add a reference image"
                @click="fileInput?.click()"
              >
                <Plus :size="16" />
              </button>
              <span class="ml-1 text-ui text-subtle-foreground">
                {{
                  refs.length
                    ? `${refs.length} ${refs.length === 1 ? 'reference' : 'references'}`
                    : 'Add images to work from'
                }}
              </span>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="(e) => addRefs((e.target as HTMLInputElement).files)"
              />
            </div>

            <div class="mt-3.5 grid grid-cols-[1fr_1fr_1.7fr_1.2fr] gap-2">
              <DropdownMenuRoot v-for="p in PARAMS" :key="p.key" :modal="false">
                <DropdownMenuTrigger as-child>
                  <button type="button" class="p05-chip">
                    <span class="text-[11px] text-subtle-foreground">{{ p.label }}</span>
                    <span class="truncate text-ui text-base-foreground">{{ params[p.key] }}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" class="min-w-44">
                  <DropdownMenuItem v-for="o in p.options" :key="o" @select="params[p.key] = o">
                    <span class="flex-1">{{ o }}</span>
                    <Check v-if="params[p.key] === o" :size="14" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuRoot>
            </div>

            <div class="mt-3.5 flex items-center justify-end gap-3 pb-1.5">
              <span class="text-[11px] text-subtle-foreground"
                ><kbd class="p05-kbd">↵</kbd> to generate</span
              >
              <button type="button" class="p05-generate" @click="generate">
                Generate<span class="p05-cost"
                  >{{ count }} {{ count === 1 ? 'credit' : 'credits' }}</span
                >
              </button>
            </div>
          </div>
        </section>

        <section v-if="strip.length" class="mt-8">
          <header class="mb-3 flex items-center justify-between">
            <h2 class="text-[15px] font-semibold">Recently used</h2>
            <button type="button" class="p05-link" @click="go('workflows')">
              See all<ArrowRight :size="13" />
            </button>
          </header>
          <div class="grid grid-cols-5 gap-2">
            <button
              v-for="r in strip"
              :key="r.w.id"
              type="button"
              class="p05-thumb"
              :title="r.title"
              @click="openRecent(r)"
            >
              <img :src="r.src" :alt="r.title" class="size-full object-cover" />
            </button>
          </div>
        </section>

        <section v-if="can.explore" class="mt-8">
          <header class="mb-3 flex items-center justify-between">
            <h2 class="text-[15px] font-semibold">What's new</h2>
            <button type="button" class="p05-link" @click="toast('All launches')">
              All launches<ArrowRight :size="13" />
            </button>
          </header>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(l, i) in news"
              :key="l.title"
              type="button"
              class="p05-news"
              @click="toast(`Try ${l.title}`)"
            >
              <video
                v-if="l.video"
                :src="l.video"
                :poster="NEWS_ART[i]"
                autoplay
                muted
                loop
                playsinline
                class="absolute inset-0 size-full object-cover"
              />
              <img
                v-else
                :src="l.image ?? NEWS_ART[i]"
                alt=""
                class="absolute inset-0 size-full object-cover"
              />
              <span
                class="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.55),rgb(0_0_0/0.1)_75%)]"
              />
              <span class="relative flex flex-col items-start gap-1">
                <MediaChip>New</MediaChip>
                <span class="text-ui font-semibold text-white drop-shadow">{{ l.title }}</span>
              </span>
            </button>
          </div>
        </section>

        <section v-if="spaces.length" class="mt-8">
          <header class="mb-3 flex items-center justify-between">
            <h2 class="text-[15px] font-semibold">Spaces</h2>
            <button type="button" class="p05-link" @click="go('spaces')">
              All spaces<ArrowRight :size="13" />
            </button>
          </header>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in spaces"
              :key="s.id"
              type="button"
              class="p05-space"
              @click="go(`space:${s.id}` as Page)"
            >
              <span class="size-4.5 rounded-full" :style="orb(s.brand.color)" />{{ s.name
              }}<span v-if="s.status === 'draft'" class="text-subtle-foreground">Draft</span>
            </button>
          </div>
        </section>
      </div>

      <!-- Right: the batch. -->
      <section class="min-w-0" aria-label="Results">
        <header class="mb-3 flex h-7 items-center gap-2.5">
          <h2 class="text-[15px] font-semibold">Results</h2>
          <span
            class="inline-flex h-5.5 items-center gap-1.5 rounded-full bg-status-running/15 px-2 text-[11px] font-medium text-status-running tabular-nums"
            ><span class="size-1.5 rounded-full bg-status-running" />{{ ready }} of
            {{ results.length }} ready</span
          >
          <button
            type="button"
            class="p05-link ml-auto"
            @click="hostActions.launch(activeInstance)"
          >
            Open in ComfyUI<ArrowRight :size="13" />
          </button>
        </header>
        <div :class="['grid gap-3', results.length > 1 ? 'grid-cols-2' : 'grid-cols-1']">
          <figure
            v-for="(r, i) in results"
            :key="i"
            :class="['p05-result', results.length === 1 && 'max-w-120']"
          >
            <img
              :src="r.src"
              :alt="r.progress >= 100 ? `Seed ${r.seed}` : ''"
              :class="[
                'absolute inset-0 size-full object-cover transition-[filter,transform] duration-700',
                r.progress < 100 && 'scale-110 blur-2xl brightness-75 saturate-50'
              ]"
            />
            <MediaChip v-if="r.progress >= 100" class="absolute top-3 left-3"
              >Seed {{ r.seed }}</MediaChip
            >
            <figcaption
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
            >
              <span class="text-[15px] font-semibold text-white tabular-nums drop-shadow">{{
                i === runningIndex && r.progress > 0 ? `${Math.round(r.progress)}%` : 'Queued'
              }}</span>
              <span class="p05-progress"><span :style="{ width: `${r.progress}%` }" /></span>
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
/* Unscoped on purpose: the proto UI's button reset wins over scoped styles. */
.p05-composer {
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 18px 40px -22px rgb(0 0 0 / 0.2);
}
:root[data-mar-shadows='off'] .p05-composer {
  box-shadow: none;
}
/* Generate is the composer's send: the prompt's own arrow steps aside. */
.p05-composer .mar-prompt :is([aria-label='Send'], .h-4.w-px) {
  display: none;
}
:root .proto-ui.proto-ui.proto-ui .p05-ref-x {
  position: absolute;
  top: -5px;
  right: -5px;
  display: inline-flex;
  width: 20px;
  height: 20px;
  padding: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--color-media-overlay);
  color: rgb(255 255 255 / 0.92);
  backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity 120ms ease;
}
.group:hover > .p05-ref-x,
.p05-ref-x:focus-visible {
  opacity: 1;
}
:root .proto-ui.proto-ui.proto-ui .p05-ref-add {
  display: inline-flex;
  width: 52px;
  height: 52px;
  padding: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  color: var(--color-muted-foreground);
  outline: none;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}
.p05-ref-add:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 9%, transparent);
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p05-chip {
  display: flex;
  width: 100%;
  min-width: 0;
  height: 48px;
  padding: 0 12px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  text-align: left;
  outline: none;
  transition: background-color 120ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p05-chip:is(:hover, [data-state='open']) {
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
.p05-chip > span {
  max-width: 100%;
}
.p05-kbd {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  margin-right: 4px;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  color: var(--color-muted-foreground);
  font-family: inherit;
  font-size: 11px;
}
:root .proto-ui.proto-ui.proto-ui .p05-generate {
  display: inline-flex;
  width: auto;
  height: 40px;
  padding: 0 16px;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  background: var(--color-inverted-background);
  color: var(--color-inverted-foreground);
  font-size: 14px;
  font-weight: 600;
  outline: none;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}
.p05-generate:hover {
  background: var(--color-inverted-background-hover);
}
.p05-generate:active {
  transform: scale(0.98);
}
.p05-generate:focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
.p05-cost {
  font-size: 12px;
  font-weight: 500;
  opacity: 0.55;
}
:root .proto-ui.proto-ui.proto-ui .p05-link {
  display: inline-flex;
  width: auto;
  padding: 0;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-muted-foreground);
}
.p05-link:hover {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p05-thumb {
  display: block;
  width: 100%;
  padding: 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 12px;
  outline: none;
}
.p05-thumb img {
  transition: filter 160ms ease;
}
.p05-thumb:hover img {
  filter: brightness(1.08);
}
:root .proto-ui.proto-ui.proto-ui :is(.p05-thumb, .p05-news, .p05-space):focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
:root .proto-ui.proto-ui.proto-ui .p05-news {
  position: relative;
  display: flex;
  width: 100%;
  height: 72px;
  padding: 0 12px;
  align-items: center;
  overflow: hidden;
  border-radius: 12px;
  text-align: left;
  outline: none;
}
.p05-news :is(video, img) {
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
.p05-news:hover :is(video, img) {
  transform: scale(1.04);
}
:root .proto-ui.proto-ui.proto-ui .p05-space {
  display: inline-flex;
  width: auto;
  height: 36px;
  padding: 0 14px 0 9px;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  backdrop-filter: blur(24px);
  font-size: 13px;
  outline: none;
  transition: background-color 120ms ease;
}
.p05-space:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 9%, transparent);
}
.p05-result {
  position: relative;
  margin: 0;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border-radius: 18px;
  background: var(--color-card-background);
}
.p05-progress {
  display: block;
  width: 120px;
  height: 3px;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.25);
}
.p05-progress > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: rgb(255 255 255 / 0.95);
  transition: width 90ms linear;
}
</style>
