<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { AppWindow, ArrowRight, CornerDownLeft, Play, Workflow } from 'lucide-vue-next'
import Greeting from '../../parts/Greeting.vue'
import PromptBox from '../../parts/PromptBox.vue'
import MediaChip from '../MediaChip.vue'
import { startAgent } from '../../agent'
import { can } from '../../milestones'
import { LAUNCHES, TEMPLATES } from '../../mock'
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
import { NEWS_ART, homeSpaces, orb, recent, type RecentItem } from './P02homeData'

/**
 * 02 · Command home: the Home is a command palette. One field runs a
 * prompt, reruns recent work, opens a template or app, or jumps to a
 * space; the groups below it filter as you type. Arrows pick a row and
 * Enter opens it; with no row picked Enter sends the prompt, and ⌘↵
 * always does. ⌘1–6 opens the recently used strip under the palette.
 */
interface Row {
  id: string
  label: string
  meta: string
  hint: string
  src?: string
  icon?: Component
  orb?: string
  run: () => void
}

const q = ref('')
const needle = computed(() => q.value.trim().toLowerCase())
const has = (...parts: (string | undefined)[]): boolean =>
  !needle.value || parts.some((p) => p?.toLowerCase().includes(needle.value))

function openRecent(r: RecentItem): void {
  if (r.env) hostActions.launch(r.env, r.w.name)
  else openDetail('workflow', r.w.name)
}

const recentRows = computed<Row[]>(() =>
  recent.value
    .filter((r) => has(r.title, r.w.project, r.env?.name))
    .slice(0, needle.value ? 4 : 2)
    .map((r) => ({
      id: `recent-${r.w.id}`,
      label: r.title,
      meta: [r.w.project ?? r.env?.name, r.w.modified].filter(Boolean).join(' · '),
      hint: 'Run again',
      src: r.src,
      run: () => openRecent(r)
    }))
)

const actionRows = computed<Row[]>(() => {
  const launch: Row = {
    id: 'launch',
    label: `Launch ComfyUI on ${activeInstance.value.name}`,
    meta: 'Build',
    hint: 'Launch',
    icon: Play,
    run: () => hostActions.launch(activeInstance.value)
  }
  const graph = TEMPLATES.filter((t) => t.kind === 'graph')
  const apps = TEMPLATES.filter((t) => t.kind === 'app')
  const picked = needle.value
    ? TEMPLATES.filter((t) => has(t.title, t.category)).slice(0, 3)
    : [graph[0], apps[0]].filter((t) => t !== undefined)
  const rows: Row[] = picked.map((t) => ({
    id: `tpl-${t.id}`,
    label: t.kind === 'app' ? `Open ${t.title} app` : t.title,
    meta: t.kind === 'app' ? 'Apps' : 'Workflow template',
    hint: 'Open',
    icon: t.kind === 'app' ? AppWindow : Workflow,
    run: () => openDetail('template', t.id)
  }))
  return [...rows, ...(has(launch.label, 'comfyui') ? [launch] : [])].slice(0, 3)
})

const spaceRows = computed<Row[]>(() =>
  homeSpaces.value
    .filter((s) => has(s.name, s.domain))
    .slice(0, needle.value ? 3 : 1)
    .map((s) => ({
      id: `space-${s.id}`,
      label: s.name,
      meta: s.status === 'draft' ? 'Space · Draft' : `Space · ${s.catalog.length} tools`,
      hint: 'Go to',
      orb: s.brand.color,
      run: () => go(`space:${s.id}` as Page)
    }))
)

const groups = computed(() =>
  [
    { title: 'Recent', rows: recentRows.value },
    { title: 'Actions', rows: actionRows.value },
    { title: 'Spaces', rows: spaceRows.value }
  ].filter((g) => g.rows.length)
)
const flat = computed(() => groups.value.flatMap((g) => g.rows))

// The row the arrows picked; -1 while you're just typing a prompt.
const active = ref(-1)
watch(q, () => (active.value = -1))
const list = ref<HTMLElement>()

function move(step: number): void {
  const n = flat.value.length
  if (!n) return
  active.value = active.value < 0 ? (step > 0 ? 0 : n - 1) : (active.value + step + n) % n
  nextTick(() =>
    list.value
      ?.querySelector(`[data-row="${flat.value[active.value]!.id}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  )
}

function send(): void {
  if (!q.value.trim()) return
  if (activeInstance.value.kind === 'cloud' && !proto.signedIn) {
    requireLogin('Log in to run this on Comfy Cloud')
    return
  }
  startAgent(q.value)
  q.value = ''
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    move(e.key === 'ArrowDown' ? 1 : -1)
  } else if (e.key === 'Escape') {
    if (active.value >= 0) active.value = -1
    else q.value = ''
  } else if (e.key === 'Enter' && !e.shiftKey) {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      send()
    } else if (active.value >= 0) {
      // Enter opens the picked row instead of sending the prompt.
      e.preventDefault()
      e.stopPropagation()
      flat.value[active.value]?.run()
    }
  }
}

// ⌘1–6: the recently used strip.
const strip = computed(() => recent.value.slice(0, 6))
function onGlobalKey(e: KeyboardEvent): void {
  if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
  const n = Number(e.key)
  if (n >= 1 && n <= strip.value.length) {
    e.preventDefault()
    openRecent(strip.value[n - 1]!)
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))

const news = computed(() => LAUNCHES.slice(0, 3))
</script>

<template>
  <div class="p02 mx-auto w-full max-w-200 px-10 pb-16">
    <Greeting text="Hi Mar. Let's create" class="mar-greeting pt-12!" />

    <section class="p02-palette mx-auto max-w-184 rounded-[28px] p-2" @keydown.capture="onKey">
      <div class="mar-prompt-slot">
        <PromptBox v-model="q" target class="mar-prompt" />
      </div>

      <div
        ref="list"
        role="listbox"
        aria-label="Commands"
        class="p02-list max-h-90 overflow-y-auto px-1 pt-3 pb-1"
      >
        <div v-for="g in groups" :key="g.title" class="pb-1">
          <div
            role="presentation"
            class="px-2.5 pt-1.5 pb-1 text-[11px] font-medium text-subtle-foreground"
          >
            {{ g.title }}
          </div>
          <button
            v-for="r in g.rows"
            :key="r.id"
            type="button"
            role="option"
            :data-row="r.id"
            :aria-selected="flat[active]?.id === r.id"
            :class="['p02-row group', flat[active]?.id === r.id && 'is-active']"
            @click="r.run()"
          >
            <img
              v-if="r.src"
              :src="r.src"
              alt=""
              class="size-6 shrink-0 rounded-[7px] object-cover"
            />
            <span v-else-if="r.orb" class="size-5 shrink-0 rounded-full" :style="orb(r.orb)" />
            <span
              v-else
              class="p02-glyph flex size-6 shrink-0 items-center justify-center rounded-[7px]"
            >
              <component :is="r.icon" :size="13" />
            </span>
            <span class="min-w-0 truncate text-ui text-base-foreground">{{ r.label }}</span>
            <span class="min-w-0 flex-1 truncate text-ui text-subtle-foreground">{{ r.meta }}</span>
            <span class="p02-hint flex shrink-0 items-center gap-1 text-ui text-muted-foreground">
              {{ r.hint }}<CornerDownLeft :size="12" />
            </span>
          </button>
        </div>
        <div v-if="!groups.length" class="px-2.5 py-3 text-ui text-subtle-foreground">
          Nothing here matches. Press <kbd class="p02-kbd">↵</kbd> to ask Comfy instead.
        </div>
      </div>

      <footer class="flex items-center gap-4 px-3.5 pt-1.5 pb-2 text-[11px] text-subtle-foreground">
        <span class="flex items-center gap-1.5"
          ><kbd class="p02-kbd">↑</kbd><kbd class="p02-kbd">↓</kbd>Navigate</span
        >
        <span class="flex items-center gap-1.5"><kbd class="p02-kbd">↵</kbd>Open</span>
        <span class="flex items-center gap-1.5"
          ><kbd class="p02-kbd">⌘</kbd><kbd class="p02-kbd">↵</kbd>Ask Comfy</span
        >
        <span class="ml-auto flex items-center gap-1.5"><kbd class="p02-kbd">esc</kbd>Clear</span>
      </footer>
    </section>

    <section v-if="strip.length" class="mx-auto mt-10 max-w-184">
      <div class="grid grid-cols-6 gap-2.5">
        <button
          v-for="(r, i) in strip"
          :key="r.w.id"
          type="button"
          :title="`${r.title} · ⌘${i + 1}`"
          class="p02-tile group"
          @click="openRecent(r)"
        >
          <img :src="r.src" :alt="r.title" class="size-full object-cover" />
          <MediaChip
            class="absolute top-1.5 left-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >⌘{{ i + 1 }}</MediaChip
          >
        </button>
      </div>
      <button type="button" class="p02-caption" @click="go('workflows')">
        Recently used<span class="text-subtle-foreground">· ⌘1–6</span>
      </button>
    </section>

    <section v-if="can.explore" class="mx-auto mt-12 max-w-184">
      <div class="mb-3 flex items-center justify-between px-0.5">
        <h2 class="text-[15px] font-semibold">What's new</h2>
        <button type="button" class="p02-link" @click="toast('All launches')">
          All launches<ArrowRight :size="13" />
        </button>
      </div>
      <div class="grid grid-cols-3 gap-2.5">
        <button
          v-for="(l, i) in news"
          :key="l.title"
          type="button"
          class="p02-news group"
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
            class="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.55),rgb(0_0_0/0.1)_70%)]"
          />
          <span class="relative flex flex-col items-start gap-1.5">
            <MediaChip>New</MediaChip>
            <span class="text-ui font-semibold text-white drop-shadow">{{ l.title }}</span>
          </span>
        </button>
      </div>
    </section>
  </div>
</template>

<style>
/* Unscoped on purpose: the proto UI's button reset wins over scoped styles. */
/* The list is part of the palette, not a floating menu (marShell styles every listbox as one). */
:root:root .p02-palette .p02-list[role='listbox'] {
  padding: 12px 4px 4px;
  border-radius: 0;
  background: none;
  backdrop-filter: none;
  box-shadow: none;
  transition: padding-top 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
/* Typing opens the prompt to two lines; the list makes room instead of
   hiding under it. */
:root:root .p02-palette:has(.mar-prompt:focus-within) .p02-list[role='listbox'] {
  padding-top: 40px;
}
.p02-palette {
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 18px 40px -22px rgb(0 0 0 / 0.2);
}
:root[data-mar-shadows='off'] .p02-palette {
  box-shadow: none;
}
:root .proto-ui.proto-ui.proto-ui .p02-row {
  display: flex;
  width: 100%;
  height: 40px;
  align-items: center;
  gap: 12px;
  padding: 0 10px;
  border-radius: 12px;
  text-align: left;
  outline: none;
  transition: background-color 120ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p02-row:is(:hover, .is-active, :focus-visible) {
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
}
.p02-row .p02-hint {
  opacity: 0;
  transition: opacity 120ms ease;
}
.p02-row:is(:hover, .is-active, :focus-visible) .p02-hint {
  opacity: 1;
}
.p02-glyph {
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-muted-foreground);
}
.p02-kbd {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 5px;
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  color: var(--color-muted-foreground);
  font-family: inherit;
  font-size: 11px;
  line-height: 1;
}
:root .proto-ui.proto-ui.proto-ui .p02-tile {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: 12px;
  outline: none;
}
.p02-tile img {
  transition: filter 160ms ease;
}
.p02-tile:hover img {
  filter: brightness(1.08);
}
.p02-tile:focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
:root .proto-ui.proto-ui.proto-ui .p02-caption {
  display: flex;
  width: auto;
  margin: 12px auto 0;
  padding: 0;
  gap: 4px;
  font-size: 12px;
  color: var(--color-muted-foreground);
}
.p02-caption:hover {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p02-link {
  display: inline-flex;
  width: auto;
  padding: 0;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-muted-foreground);
}
.p02-link:hover {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p02-news {
  position: relative;
  display: flex;
  width: 100%;
  height: 80px;
  padding: 0 16px;
  align-items: center;
  overflow: hidden;
  border-radius: 14px;
  text-align: left;
  outline: none;
}
.p02-news:focus-visible {
  box-shadow: 0 0 0 2px var(--color-border-focus);
}
.p02-news video,
.p02-news img {
  transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
}
.p02-news:hover :is(video, img) {
  transform: scale(1.03);
}
</style>
