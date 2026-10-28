<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import PromptBox from '../../parts/PromptBox.vue'
import LocationIcon from '../../ui/LocationIcon.vue'
import MediaChip from '../MediaChip.vue'
import { envKind } from '../../parts/env/env'
import { can } from '../../milestones'
import { LAUNCHES, USER, type ProtoInstance } from '../../mock'
import { go, hostActions, openDetail, recentInstances, toast } from '../../useProto'
import { NEWS_ART, homeSpaces, orb, recent, type RecentItem } from './P02homeData'

/**
 * 03 · Bento: the Home as a grid of tiles. The greeting and the prompt
 * take the big tile; What's new, recently used, builds, credits and
 * spaces each get one, and the rest of your recent work runs along the
 * bottom. Tiles are translucent, borderless and don't lift on hover.
 */
function openRecent(r: RecentItem): void {
  if (r.env) hostActions.launch(r.env, r.w.name)
  else openDetail('workflow', r.w.name)
}
const top = computed(() => recent.value.slice(0, 4))
const more = computed(() => recent.value.slice(4, 10))

// What's new: one launch at a time, advancing on its own unless you'd
// rather it didn't move.
const slide = ref(0)
const launch = computed(() => LAUNCHES[slide.value]!)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => (slide.value = (slide.value + 1) % LAUNCHES.length), 7000)
})
onBeforeUnmount(() => clearInterval(timer))
function pick(i: number): void {
  slide.value = i
  clearInterval(timer)
}

const builds = computed(() => recentInstances.value.slice(0, 3))
function state(inst: ProtoInstance): { label: string; live: boolean } {
  if (inst.state === 'update') return { label: 'Update', live: false }
  if (inst.state === 'running' || envKind(inst) === 'managed')
    return { label: 'Running', live: true }
  return { label: 'Stopped', live: false }
}

const spaces = computed(() => homeSpaces.value.slice(0, 4))
const spaceNames = computed(() => homeSpaces.value.map((s) => s.name).join(', '))
</script>

<template>
  <div class="p03 mx-auto w-full max-w-310 px-8 pt-14 pb-12">
    <div class="grid grid-cols-12 gap-3">
      <!-- The big tile: greeting and prompt. -->
      <section class="p03-tile col-span-8 flex min-h-62 flex-col gap-6 p-7">
        <h1 class="mar-greeting text-[34px] leading-tight font-bold tracking-[-0.025em]">
          Hi Mar. Let's create
        </h1>
        <div class="mar-prompt-slot">
          <PromptBox target class="mar-prompt max-w-none!" />
        </div>
      </section>

      <!-- What's new -->
      <section
        v-if="can.explore"
        class="p03-tile p03-news group col-span-4 min-h-62"
        :aria-label="`What's new: ${launch.title}`"
      >
        <Transition name="p03-fade" mode="out-in">
          <video
            v-if="launch.video"
            :key="launch.title"
            :src="launch.video"
            :poster="NEWS_ART[slide % NEWS_ART.length]"
            autoplay
            muted
            loop
            playsinline
            class="absolute inset-0 size-full object-cover"
          />
          <img
            v-else
            :key="`img-${launch.title}`"
            :src="launch.image ?? NEWS_ART[slide % NEWS_ART.length]"
            alt=""
            class="absolute inset-0 size-full object-cover"
          />
        </Transition>
        <span
          class="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.1),transparent_35%,rgb(0_0_0/0.6))]"
        />
        <button type="button" class="p03-news-hit" @click="toast(`Try ${launch.title}`)">
          <MediaChip>New {{ launch.kind }}</MediaChip>
          <span class="mt-2 text-[26px] leading-tight font-bold text-white drop-shadow">{{
            launch.title
          }}</span>
          <span class="mt-1 flex items-center gap-1 text-ui text-white/80"
            >Try it now<ArrowRight :size="13"
          /></span>
        </button>
        <div class="absolute right-5 bottom-6 flex gap-1.5">
          <button
            v-for="(l, i) in LAUNCHES"
            :key="l.title"
            type="button"
            :aria-label="l.title"
            :class="['p03-dot', i === slide && 'is-on']"
            @click="pick(i)"
          />
        </div>
      </section>

      <!-- Recently used -->
      <section class="p03-tile col-span-4 flex flex-col p-5">
        <header class="mb-3.5 flex items-center justify-between">
          <h2 class="text-ui font-semibold">Recently used</h2>
          <button type="button" class="p03-link" @click="go('workflows')">
            See all<ArrowRight :size="13" />
          </button>
        </header>
        <div class="grid flex-1 grid-cols-2 gap-2.5">
          <button
            v-for="r in top"
            :key="r.w.id"
            type="button"
            class="p03-thumb group"
            :title="r.title"
            @click="openRecent(r)"
          >
            <img :src="r.src" :alt="r.title" class="size-full object-cover" />
            <span class="p03-thumb-label">{{ r.title }}</span>
          </button>
        </div>
      </section>

      <!-- Builds -->
      <section class="p03-tile col-span-4 flex flex-col p-5">
        <header class="mb-3.5 flex items-center justify-between">
          <h2 class="text-ui font-semibold">Builds</h2>
          <button type="button" class="p03-link" @click="go('environments')">
            All builds<ArrowRight :size="13" />
          </button>
        </header>
        <div class="flex flex-col gap-2">
          <button
            v-for="b in builds"
            :key="b.id"
            type="button"
            class="p03-build"
            @click="hostActions.launch(b)"
          >
            <LocationIcon :kind="b.kind === 'cloud' ? 'cloud' : 'local'" :size="15" />
            <span class="min-w-0 flex-1 truncate text-ui font-medium">{{ b.name }}</span>
            <span
              :class="[
                'inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-full px-2 text-[11px] font-medium',
                state(b).live ? 'bg-status-running/15 text-status-running' : 'p03-pill'
              ]"
            >
              <span v-if="state(b).live" class="size-1.5 rounded-full bg-status-running" />{{
                state(b).label
              }}
            </span>
          </button>
        </div>
      </section>

      <!-- Credits and spaces -->
      <div class="col-span-4 flex flex-col gap-3">
        <button type="button" class="p03-tile p03-credits" @click="go('billing')">
          <span class="text-ui text-muted-foreground">Credits</span>
          <span class="text-[34px] leading-tight font-semibold tracking-[-0.02em] tabular-nums">{{
            USER.credits
          }}</span>
          <span class="p03-bar mt-auto"><span :style="{ width: '62%' }" /></span>
        </button>
        <button
          v-if="spaces.length"
          type="button"
          class="p03-tile p03-spaces flex-1"
          @click="go('spaces')"
        >
          <span class="text-ui font-semibold">Spaces</span>
          <span class="mt-auto flex items-center gap-4">
            <span class="flex shrink-0 -space-x-2.5">
              <span
                v-for="s in spaces"
                :key="s.id"
                :title="s.name"
                class="p03-orb size-10 rounded-full"
                :style="orb(s.brand.color)"
              />
            </span>
            <span class="min-w-0">
              <span class="block text-[15px] font-semibold"
                >{{ homeSpaces.length }} {{ homeSpaces.length === 1 ? 'space' : 'spaces' }}</span
              >
              <span class="block truncate text-ui text-subtle-foreground">{{ spaceNames }}</span>
            </span>
          </span>
        </button>
      </div>

      <!-- The rest of your recent work -->
      <section v-if="more.length" class="p03-tile col-span-12 p-5">
        <header class="mb-3.5 flex items-center justify-between">
          <h2 class="text-ui font-semibold">Pick up where you left off</h2>
          <button type="button" class="p03-link" @click="go('workflows')">
            {{ recent.length }} workflows<ArrowRight :size="13" />
          </button>
        </header>
        <div class="grid grid-cols-6 gap-2.5">
          <button
            v-for="r in more"
            :key="r.w.id"
            type="button"
            class="p03-thumb group aspect-[4/3]"
            :title="r.title"
            @click="openRecent(r)"
          >
            <img :src="r.src" :alt="r.title" class="size-full object-cover" />
            <span class="p03-thumb-label">{{ r.title }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style>
/* Unscoped on purpose: the proto UI's button reset wins over scoped styles. */
:root .proto-ui.proto-ui.proto-ui .p03-tile {
  position: relative;
  border-radius: 22px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 18px 40px -22px rgb(0 0 0 / 0.2);
  text-align: left;
  outline: none;
}
:root[data-mar-shadows='off'] .proto-ui.proto-ui.proto-ui .p03-tile {
  box-shadow: none;
}
:root .proto-ui.proto-ui.proto-ui .p03-tile:focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
:root .proto-ui.proto-ui.proto-ui .p03-news {
  overflow: hidden;
  background: var(--color-card-background);
}
:root .proto-ui.proto-ui.proto-ui .p03-news-hit {
  position: absolute;
  inset: 0;
  display: flex;
  width: 100%;
  padding: 0 22px 22px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  text-align: left;
  outline: none;
}
.p03-news-hit:focus-visible {
  box-shadow: inset 0 0 0 2px var(--color-border-focus);
  border-radius: inherit;
}
.p03-news video,
.p03-news img {
  transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
.p03-news:hover :is(video, img) {
  transform: scale(1.03);
}
:root .proto-ui.proto-ui.proto-ui .p03-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.35);
  transition:
    width 240ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 240ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p03-dot.is-on {
  width: 18px;
  background: rgb(255 255 255 / 0.9);
}
.p03-fade-enter-active,
.p03-fade-leave-active {
  transition: opacity 400ms ease;
}
.p03-fade-enter-from,
.p03-fade-leave-to {
  opacity: 0;
}
:root .proto-ui.proto-ui.proto-ui .p03-link {
  display: inline-flex;
  width: auto;
  padding: 0;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-muted-foreground);
}
.p03-link:hover {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p03-thumb {
  position: relative;
  display: block;
  width: 100%;
  min-height: 96px;
  padding: 0;
  overflow: hidden;
  border-radius: 14px;
  outline: none;
}
.p03-thumb:focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
.p03-thumb img {
  position: absolute;
  inset: 0;
  transition: filter 160ms ease;
}
.p03-thumb:hover img {
  filter: brightness(1.08);
}
.p03-thumb-label {
  position: absolute;
  inset: auto 0 0;
  padding: 18px 10px 8px;
  overflow: hidden;
  background: linear-gradient(to top, rgb(0 0 0 / 0.55), transparent);
  color: rgb(255 255 255 / 0.95);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 160ms ease;
}
.p03-thumb:is(:hover, :focus-visible) .p03-thumb-label {
  opacity: 1;
}
:root .proto-ui.proto-ui.proto-ui .p03-build {
  display: flex;
  width: 100%;
  height: 52px;
  padding: 0 12px 0 14px;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  text-align: left;
  outline: none;
  transition: background-color 120ms ease;
}
.p03-build:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
}
.p03-build:focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
.p03-pill {
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  color: var(--color-muted-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p03-credits {
  display: flex;
  width: 100%;
  min-height: 150px;
  padding: 20px 22px 24px;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
}
.p03-bar {
  display: block;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
.p03-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p03-spaces {
  display: flex;
  width: 100%;
  min-height: 140px;
  padding: 20px 22px 22px;
  flex-direction: column;
  align-items: stretch;
}
.p03-orb {
  box-shadow: 0 0 0 3px var(--color-content-background);
}
</style>
