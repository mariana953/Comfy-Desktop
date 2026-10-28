<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Component } from 'vue'
import { Circle, FolderOpen, Search, Workflow, X } from 'lucide-vue-next'
import { PROJECTS, TEMPLATES, WORKFLOWS, thumb } from '../../mock'
import { SPACES } from '../../spaces'
import { go, openDetail, type Page } from '../../useProto'
import { search } from './search'
import { favorites } from '../favorites'

/**
 * Global search (⌘K) in Mar's proposal, kept from the comfy-home-v1 audit:
 * popular templates as pictures on top, then a list; typing searches
 * templates, workflows, projects and spaces at once. Arrows move, Enter
 * opens, Esc closes.
 */
interface Hit {
  key: string
  group: string
  label: string
  meta?: string
  image?: string
  icon?: Component
  open: () => void
}

const RUNS = ['7.9k', '7.5k', '6.5k', '4.5k', '3.4k', '3.4k', '3.3k', '2.9k', '2.1k']
const query = ref('')
const input = ref<HTMLInputElement>()
const active = ref(0)

const templates = TEMPLATES.map((t, i) => ({
  key: `t:${t.id}`,
  group: 'Templates',
  label: t.title,
  meta: `${RUNS[i % RUNS.length]} runs`,
  image: thumb(t.id),
  open: () => openDetail('template', t.id)
}))
const popular = computed(() => templates.slice(0, 3))

const hits = computed<Hit[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q)
    return [
      ...favorites.ids
        .map((id) => templates.find((t) => t.key === `t:${id}`))
        .filter((t) => t !== undefined)
        .map((t) => ({ ...t, key: `f:${t.key}`, group: 'Favorites' })),
      ...templates.slice(3, 10)
    ]
  const has = (s: string): boolean => s.toLowerCase().includes(q)
  return [
    ...templates.filter((t) => has(t.label)),
    ...WORKFLOWS.filter((w) => has(w.name)).map((w) => ({
      key: `w:${w.name}`,
      group: 'Workflows',
      label: w.name.replace(/\.json$/, ''),
      meta: w.modified,
      image: thumb(w.thumbId),
      open: () => openDetail('workflow', w.name)
    })),
    ...PROJECTS.filter((p) => has(p.name)).map((p) => ({
      key: `p:${p.id}`,
      group: 'Projects',
      label: p.name,
      icon: FolderOpen,
      open: () => go(`project:${p.id}` as Page)
    })),
    ...SPACES.filter((s) => has(s.name)).map((s) => ({
      key: `s:${s.id}`,
      group: 'Spaces',
      label: s.name,
      icon: Circle,
      open: () => go(`space:${s.id}` as Page)
    }))
  ]
})
const groups = computed(() => {
  const out: { name: string; items: (Hit & { index: number })[] }[] = []
  hits.value.forEach((h, index) => {
    let g = out.find((x) => x.name === h.group)
    if (!g) out.push((g = { name: h.group, items: [] }))
    g.items.push({ ...h, index })
  })
  return out
})

function close(): void {
  search.open = false
}
function choose(h: Hit): void {
  close()
  h.open()
}
function onKey(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    active.value = Math.min(active.value + 1, hits.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    active.value = Math.max(active.value - 1, 0)
  } else if (e.key === 'Enter' && hits.value[active.value]) {
    e.preventDefault()
    choose(hits.value[active.value]!)
  } else if (e.key === 'Escape') close()
}
watch(query, () => (active.value = 0))
watch(
  () => search.open,
  (open) => {
    if (!open) return
    query.value = ''
    active.value = 0
    nextTick(() => input.value?.focus())
  }
)

function onGlobalKey(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    search.open = !search.open
  }
}
onMounted(() => window.addEventListener('keydown', onGlobalKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <Teleport to="body">
    <div v-if="search.open" class="proto-ui mar-search-scrim" @click.self="close">
      <div class="mar-search" role="dialog" aria-label="Search" @keydown="onKey">
        <label class="mar-search-field">
          <Search :size="17" class="text-subtle-foreground" />
          <input
            ref="input"
            v-model="query"
            type="search"
            placeholder="Search templates, workflows, projects…"
            aria-label="Search"
          />
          <button type="button" class="mar-search-x" aria-label="Close" @click="close">
            <X :size="15" />
          </button>
        </label>

        <div class="mar-search-body">
          <template v-if="!query.trim()">
            <div class="mar-search-head">
              <span>Popular templates</span>
              <button type="button" @click="(close(), go('explore'))">See all</button>
            </div>
            <div class="mar-search-pop">
              <button
                v-for="p in popular"
                :key="p.key"
                type="button"
                class="mar-search-tile"
                @click="choose(p)"
              >
                <img :src="p.image" alt="" />
                <span>{{ p.label }}</span>
              </button>
            </div>
          </template>

          <section v-for="g in groups" :key="g.name">
            <div class="mar-search-head">
              <span>{{ g.name }}</span>
              <button v-if="g.name === 'Templates'" type="button" @click="(close(), go('explore'))">
                See all
              </button>
            </div>
            <button
              v-for="h in g.items"
              :key="h.key"
              type="button"
              class="mar-search-row"
              :class="active === h.index && 'is-on'"
              @mouseenter="active = h.index"
              @click="choose(h)"
            >
              <img v-if="h.image" :src="h.image" alt="" class="mar-search-thumb" />
              <span v-else class="mar-search-thumb is-icon"
                ><component :is="h.icon ?? Workflow" :size="15"
              /></span>
              <span class="flex min-w-0 flex-col text-left">
                <span class="truncate">{{ h.label }}</span>
                <span v-if="h.meta" class="mar-search-meta">{{ h.meta }}</span>
              </span>
            </button>
          </section>
          <p v-if="query.trim() && !hits.length" class="mar-search-empty">
            Nothing matches “{{ query }}”.
          </p>
        </div>

        <footer class="mar-search-foot">
          <span><kbd>↑↓</kbd>navigate</span><span><kbd>↵</kbd>open</span
          ><span><kbd>esc</kbd>close</span>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.mar-search-scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  background: color-mix(in oklch, var(--color-content-background) 55%, transparent);
  backdrop-filter: blur(6px);
}
.mar-search {
  display: flex;
  width: min(640px, calc(100vw - 32px));
  max-height: 72vh;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  background: color-mix(
    in oklch,
    color-mix(in oklch, var(--color-base-foreground) 6%, var(--color-card-background)) 90%,
    transparent
  );
  backdrop-filter: blur(28px) saturate(1.3);
  box-shadow: 0 30px 80px -20px rgb(0 0 0 / 0.7);
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .mar-search-field {
  display: flex;
  height: 56px;
  flex-shrink: 0;
  align-items: center;
  gap: 12px;
  padding: 0 14px 0 20px;
  box-shadow: inset 0 -1px 0 color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mar-search-field input {
  min-width: 0;
  height: 100%;
  padding: 0;
  border: 0;
  box-shadow: none;
  flex: 1;
  background: transparent;
  font-size: 15px;
  outline: none;
}
.mar-search-field input::placeholder {
  color: var(--color-subtle-foreground);
}
.mar-search-field input::-webkit-search-cancel-button {
  display: none;
}
:root .proto-ui.proto-ui.proto-ui .mar-search-x {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  color: var(--color-subtle-foreground);
}
.mar-search-x:hover {
  color: var(--color-base-foreground);
}
.mar-search-body {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px 10px;
  scrollbar-width: none;
}
.mar-search-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 8px 8px;
  color: var(--color-subtle-foreground);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.mar-search-head button {
  color: var(--color-muted-foreground);
  font-size: 13px;
  letter-spacing: 0;
  text-transform: none;
}
.mar-search-head button:hover {
  color: var(--color-base-foreground);
}
.mar-search-pop {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0 8px;
}
:root .proto-ui.proto-ui.proto-ui .mar-search-tile {
  position: relative;
  overflow: hidden;
  padding: 0;
  border-radius: 12px;
  aspect-ratio: 16 / 9;
}
.mar-search-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 400ms ease;
}
.mar-search-tile span {
  position: absolute;
  inset: auto 0 0;
  padding: 24px 10px 8px;
  background: linear-gradient(to top, rgb(0 0 0 / 0.7), transparent);
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
}
:root .proto-ui.proto-ui.proto-ui .mar-search-row {
  display: flex;
  width: 100%;
  height: 52px;
  align-items: center;
  gap: 12px;
  padding: 0 8px;
  border-radius: 12px;
  font-size: 14px;
}
:root .proto-ui.proto-ui.proto-ui .mar-search-row.is-on {
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
}
.mar-search-thumb {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 9px;
  object-fit: cover;
}
.mar-search-thumb.is-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-muted-foreground);
}
.mar-search-meta {
  color: var(--color-subtle-foreground);
  font-size: 12px;
}
.mar-search-empty {
  padding: 24px 8px;
  color: var(--color-subtle-foreground);
  font-size: 13px;
  text-align: center;
}
.mar-search-foot {
  display: flex;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  gap: 18px;
  padding: 0 20px;
  box-shadow: inset 0 1px 0 color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-subtle-foreground);
  font-size: 12px;
}
.mar-search-foot span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.mar-search-foot kbd {
  border-radius: 5px;
  padding: 1px 5px;
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  font-family: inherit;
  font-size: 11px;
}
:root .proto-ui.proto-ui.proto-ui .mar-search-field input:focus,
:root .proto-ui.proto-ui.proto-ui .mar-search-field input:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
