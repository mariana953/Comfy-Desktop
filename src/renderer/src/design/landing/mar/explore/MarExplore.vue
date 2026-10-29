<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Clock, Play, Search, X } from 'lucide-vue-next'
import PageHeader from '../../ui/PageHeader.vue'
import Select from '../../ui/Select.vue'
import TemplateCard from '../../parts/TemplateCard.vue'
import { APPS, ROUTER_MODELS, TEMPLATES, TUTORIALS, thumb } from '../../mock'
import { go, toast } from '../../useProto'
import FavoriteStar from '../FavoriteStar.vue'

/**
 * Explore in Mar's proposal. One line holds everything that narrows the
 * page: what you're looking at (Templates, Models, Apps, Tutorials), its
 * type, and a search, so there is one kind of tab, not two. Each tab
 * shows its own things.
 */
type Tab = 'templates' | 'models' | 'apps' | 'tutorials'
const tab = ref<Tab>('templates')
const type = ref('all')
const query = ref('')

const TABS: { value: Tab; label: string; count: number }[] = [
  { value: 'templates', label: 'Templates', count: TEMPLATES.length },
  { value: 'models', label: 'Models', count: ROUTER_MODELS.length },
  { value: 'apps', label: 'Apps', count: APPS.length },
  { value: 'tutorials', label: 'Tutorials', count: TUTORIALS.length }
]
const TYPES: Record<Tab, { value: string; label: string }[]> = {
  templates: [
    { value: 'all', label: 'All types' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: '3d', label: '3D' }
  ],
  models: [
    { value: 'all', label: 'All types' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' }
  ],
  apps: [
    { value: 'all', label: 'All apps' },
    { value: 'mine', label: 'Made by you' },
    { value: 'team', label: 'Shared with you' }
  ],
  tutorials: [
    { value: 'all', label: 'All topics' },
    { value: 'Basics', label: 'Basics' },
    { value: 'VFX', label: 'VFX' },
    { value: 'Animations', label: 'Animations' },
    { value: 'Ads', label: 'Ads' }
  ]
}
watch(tab, () => {
  type.value = 'all'
  query.value = ''
})
const PLACEHOLDER: Record<Tab, string> = {
  templates: 'Search templates',
  models: 'Search models or providers',
  apps: 'Search apps',
  tutorials: 'Search tutorials'
}

const has = (s: string): boolean => s.toLowerCase().includes(query.value.trim().toLowerCase())
const templates = computed(() =>
  TEMPLATES.filter((t) => type.value === 'all' || t.category === type.value).filter((t) =>
    has(t.title)
  )
)
const models = computed(() =>
  ROUTER_MODELS.filter(
    (m) => type.value === 'all' || m.kind.toLowerCase().includes(type.value)
  ).filter((m) => has(`${m.model} ${m.provider}`))
)
const apps = computed(() =>
  APPS.filter((a) => type.value === 'all' || (type.value === 'mine' ? a.you : !a.you)).filter((a) =>
    has(a.name)
  )
)
const tutorials = computed(() =>
  TUTORIALS.filter((t) => type.value === 'all' || t.category === type.value).filter((t) =>
    has(`${t.title} ${t.blurb}`)
  )
)
const empty = computed(
  () =>
    ({
      templates: templates.value,
      models: models.value,
      apps: apps.value,
      tutorials: tutorials.value
    })[tab.value].length === 0
)
</script>

<template>
  <div class="mar-explore mx-auto w-full max-w-300 px-10 pb-16">
    <PageHeader title="Explore" />

    <!-- One line: what, which kind, search. -->
    <div class="mar-ex-bar">
      <div class="mar-seg mar-ex-tabs" role="tablist" aria-label="Explore">
        <button
          v-for="t in TABS"
          :key="t.value"
          type="button"
          role="tab"
          :aria-selected="tab === t.value"
          :aria-pressed="tab === t.value"
          class="mar-ex-tab"
          @click="tab = t.value"
        >
          {{ t.label }}<span class="mar-ex-count">{{ t.count }}</span>
        </button>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <Select v-model="type" :options="TYPES[tab]" class="w-36" />
        <label class="mar-ex-search">
          <Search :size="14" />
          <input v-model="query" type="search" :placeholder="PLACEHOLDER[tab]" />
          <button
            v-if="query"
            type="button"
            class="mar-ex-clear"
            aria-label="Clear search"
            @click="query = ''"
          >
            <X :size="13" />
          </button>
        </label>
      </div>
    </div>

    <!-- Templates -->
    <div v-if="tab === 'templates'" class="mar-ex-grid">
      <TemplateCard v-for="t in templates" :key="t.id" :t />
    </div>

    <!-- Models: what each costs, from whom. -->
    <div v-else-if="tab === 'models'" class="mar-ex-grid is-models">
      <button
        v-for="m in models"
        :key="m.model"
        type="button"
        class="mar-ex-model"
        @click="go('router')"
      >
        <span class="mar-ex-mark">{{ m.provider.charAt(0) }}</span>
        <span class="flex min-w-0 flex-1 flex-col text-left">
          <span class="truncate text-ui font-medium text-base-foreground">{{ m.model }}</span>
          <span class="truncate text-ui text-subtle-foreground">{{ m.provider }}</span>
        </span>
        <span class="flex flex-col items-end gap-1">
          <span class="mar-ex-chip">{{ m.kind }}</span>
          <span class="text-[12px] text-subtle-foreground tabular-nums">{{ m.price }}</span>
        </span>
      </button>
    </div>

    <!-- Apps -->
    <div v-else-if="tab === 'apps'" class="mar-ex-grid">
      <button
        v-for="a in apps"
        :key="a.id"
        type="button"
        class="mar-ex-card group"
        @click="go(`app:${a.id}` as never)"
      >
        <span class="mar-ex-media"
          ><img :src="thumb(a.thumbId)" alt="" loading="lazy" /><span class="mar-ex-star"
            ><FavoriteStar :id="a.id" kind="app" /></span
        ></span>
        <span class="flex flex-col gap-0.5 px-2 pt-2.5 pb-2 text-left">
          <span class="truncate text-ui font-medium text-base-foreground">{{ a.name }}</span>
          <span class="truncate text-ui text-subtle-foreground"
            >{{ a.owner }} · {{ a.runs.toLocaleString('en-US') }} runs</span
          >
        </span>
      </button>
    </div>

    <!-- Tutorials -->
    <div v-else class="mar-ex-grid">
      <button
        v-for="t in tutorials"
        :key="t.title"
        type="button"
        class="mar-ex-card group"
        @click="toast(`Opening “${t.title}”`)"
      >
        <span class="mar-ex-media"
          ><img :src="thumb(t.thumbId)" alt="" loading="lazy" /><span class="mar-ex-play"
            ><Play :size="13" fill="currentColor"
          /></span>
          <span class="mar-ex-time"><Clock :size="11" />{{ t.minutes }} min</span></span
        >
        <span class="flex flex-col gap-0.5 px-2 pt-2.5 pb-2 text-left">
          <span class="truncate text-ui font-medium text-base-foreground">{{ t.title }}</span>
          <span class="line-clamp-2 text-ui text-subtle-foreground">{{ t.blurb }}</span>
        </span>
      </button>
    </div>

    <p v-if="empty" class="py-16 text-center text-ui text-subtle-foreground">
      Nothing matches. Try another word or type.
    </p>
  </div>
</template>

<style scoped>
.mar-ex-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0 20px;
}
.mar-ex-tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--mar-tab-radius, 10px);
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
.mar-ex-count {
  margin-left: 6px;
  color: var(--color-subtle-foreground);
  font-variant-numeric: tabular-nums;
}
.mar-ex-search {
  display: flex;
  width: 240px;
  height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: var(--mar-tab-radius, 10px);
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  color: var(--color-subtle-foreground);
}
.mar-ex-search input {
  min-width: 0;
  flex: 1;
  background: transparent;
  color: var(--color-base-foreground);
  font-size: 13px;
  outline: none;
}
.mar-ex-search input::-webkit-search-cancel-button {
  display: none;
}
.mar-ex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.mar-ex-grid.is-models {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 10px;
}
.mar-ex-mark {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  font-size: 15px;
  font-weight: 600;
}
.mar-ex-chip {
  border-radius: 999px;
  padding: 2px 8px;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-muted-foreground);
  font-size: 11px;
}
.mar-ex-media {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--radius-control);
  aspect-ratio: 16 / 10;
}
.mar-ex-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 500ms ease;
}
.mar-ex-star {
  position: absolute;
  top: 8px;
  right: 8px;
}
.mar-ex-play,
.mar-ex-time {
  position: absolute;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
  color: rgb(255 255 255 / 0.92);
  font-size: 11px;
}
.mar-ex-play {
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  justify-content: center;
}
.mar-ex-time {
  right: 8px;
  bottom: 8px;
  padding: 3px 8px;
}
</style>

<style>
/* Global: tabs and cards are buttons, past the prototype's button reset. */
:root .proto-ui.proto-ui.proto-ui .mar-ex-tab {
  width: auto;
  height: 28px;
  padding: 0 12px;
  border-radius: var(--mar-tab-item-radius, 7px);
  color: var(--color-muted-foreground);
  font-size: 13px;
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-tab[aria-selected='true'] {
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-card,
:root .proto-ui.proto-ui.proto-ui .mar-ex-model {
  width: auto;
  border-radius: var(--radius-card);
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(20px);
  transition: background-color 160ms ease;
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-card {
  display: flex;
  flex-direction: column;
  padding: 4px;
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-model {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}
:root .proto-ui.proto-ui.proto-ui :is(.mar-ex-card, .mar-ex-model):hover {
  background: color-mix(in oklch, var(--color-card-background-hover) 80%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-clear {
  display: inline-flex;
  width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--color-subtle-foreground);
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-search {
  display: flex;
  width: 240px;
  height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: var(--mar-tab-radius, 10px);
  background-color: color-mix(
    in oklch,
    color-mix(in oklch, var(--color-base-foreground) 9%, var(--color-card-background)) 82%,
    transparent
  );
  box-shadow: inset 0 0 0 1px color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mar-ex-search input {
  height: 100%;
  padding: 0;
  border: 0;
  box-shadow: none;
}
</style>
