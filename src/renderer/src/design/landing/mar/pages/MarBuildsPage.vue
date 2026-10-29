<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowUpCircle,
  Copy,
  ExternalLink,
  FolderOpen,
  Pencil,
  Play,
  Plus,
  RotateCw,
  ScrollText,
  Settings2,
  Square,
  Trash2
} from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import Select from '../../ui/Select.vue'
import LocationIcon from '../../ui/LocationIcon.vue'
import { hostActions, instances, proto, toast, type Page } from '../../useProto'
import type { ProtoInstance } from '../../mock'
import { go } from '../../useProto'
import { surface } from '../shell/surface'
import MarPage from './MarPage.vue'
import MarItem from './MarItem.vue'
import MarSeg from './MarSeg.vue'
import MarSearchField from './MarSearchField.vue'
import MarViewToggle from './MarViewToggle.vue'
import MarSelectBar from './MarSelectBar.vue'
import { collection } from './collection'
import { useLibrary } from './library'
import { shownState } from './pageState'
import { notify } from './undo'
import type { MenuLine } from './menu'
import type { ItemStatus } from './MarStatus.vue'

/**
 * Builds (Mar's proposal): where your work runs, each with its own
 * ComfyUI version, custom nodes and models. A card says if it's running,
 * starting, out of date or failed to start, and its button does the one
 * thing that state needs (Open, Start, Update, Try again).
 */
type Build = ProtoInstance & { project?: string; fav?: boolean; error?: string }

const builds = collection<Build>(
  instances.value.map((i) =>
    i.id === 'local-flux'
      ? { ...i, state: 'error' as const, error: 'A custom node didn’t load. See the logs.' }
      : { ...i }
  ),
  'build'
)

type Where = 'all' | 'local' | 'cloud'
const where = ref<Where>('all')
const sort = ref('used')
const query = ref('')
const view = ref<'grid' | 'list'>('grid')

const WHERE = computed(() => [
  { value: 'all' as const, label: 'All', count: builds.items.length },
  {
    value: 'local' as const,
    label: 'This computer',
    count: builds.items.filter((b) => b.kind === 'local').length
  },
  {
    value: 'cloud' as const,
    label: 'Cloud',
    count: builds.items.filter((b) => b.kind === 'cloud').length
  }
])
const SORTS = [
  { value: 'used', label: 'Last used' },
  { value: 'name', label: 'Name' }
]
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = builds.items.filter(
    (b) =>
      (where.value === 'all' || b.kind === where.value) &&
      (!q || `${b.name} ${b.channel} ${b.gpu}`.toLowerCase().includes(q))
  )
  return sort.value === 'name'
    ? [...list].sort((a, b) => a.name.localeCompare(b.name))
    : [...list].sort(
        (a, b) =>
          (a.state === 'running' ? -1 : 0) - (b.state === 'running' ? -1 : 0) ||
          a.lastUsedRank - b.lastUsedRank
      )
})
const filtered = computed(() => where.value !== 'all' || !!query.value)
function clear(): void {
  where.value = 'all'
  query.value = ''
}
const lib = useLibrary(builds, shown)

const STATUS: Record<ProtoInstance['state'], ItemStatus | undefined> = {
  running: 'running',
  stopped: undefined,
  launching: 'launching',
  update: 'update',
  error: 'failed'
}
const statusLabel = (b: Build): string | undefined =>
  b.state === 'update' ? 'Update available' : b.state === 'error' ? 'Failed to start' : undefined
const specs = (b: Build): string =>
  [
    b.gpu,
    b.models !== undefined && `${b.models} models`,
    b.nodes !== undefined && `${b.nodes} node packs`,
    b.diskSize
  ]
    .filter(Boolean)
    .join(' · ')
const sub = (b: Build): string =>
  [
    b.deployment ? 'Cloud build' : b.channel,
    b.version,
    b.state === 'running' ? 'Running now' : b.lastUsed
  ]
    .filter(Boolean)
    .join(' · ')

function original(b: Build): ProtoInstance {
  return instances.value.find((i) => i.id === b.id) ?? b
}
function start(b: Build): void {
  b.state = 'launching'
  setTimeout(() => {
    b.state = 'running'
    hostActions.launch(original(b))
  }, 1400)
}
function stop(b: Build): void {
  b.state = 'stopped'
  notify(`Stopped ${b.name}`, () => (b.state = 'running'))
}
function update(b: Build): void {
  b.state = 'launching'
  setTimeout(() => {
    b.state = 'stopped'
    notify(`${b.name} is up to date`)
  }, 1600)
}
function retry(b: Build): void {
  b.error = undefined
  start(b)
}
function primary(b: Build): { label: string; icon: unknown; run: () => void } {
  if (b.state === 'running')
    return { label: 'Open', icon: ExternalLink, run: () => hostActions.launch(original(b)) }
  if (b.state === 'update') return { label: 'Update', icon: ArrowUpCircle, run: () => update(b) }
  if (b.state === 'error') return { label: 'Try again', icon: RotateCw, run: () => retry(b) }
  return { label: 'Start', icon: Play, run: () => start(b) }
}
function open(b: Build): void {
  if (b.state === 'running') hostActions.launch(original(b))
  else go(`environment:${b.id}` as Page)
}

function lines(b: Build): MenuLine[] {
  return [
    b.state === 'running'
      ? { label: 'Open', icon: ExternalLink, run: () => hostActions.launch(original(b)) }
      : { label: 'Start', icon: Play, disabled: b.state === 'launching', run: () => start(b) },
    ...(b.state === 'running' ? [{ label: 'Stop', icon: Square, run: () => stop(b) }] : []),
    ...(b.state === 'update'
      ? [{ label: 'Update', icon: ArrowUpCircle, run: () => update(b) }]
      : []),
    { label: 'Details', icon: Settings2, run: () => go(`environment:${b.id}` as Page) },
    'sep',
    { label: 'Rename', icon: Pencil, run: () => (lib.renaming.value = b.id) },
    ...(b.kind === 'local'
      ? [
          { label: 'Duplicate', icon: Copy, run: () => builds.duplicate(b.id) },
          { label: 'Show in Finder', icon: FolderOpen, run: () => toast(`Revealed ${b.name}`) }
        ]
      : []),
    { label: 'Logs', icon: ScrollText, run: () => go('logs') },
    ...(b.id === 'cloud'
      ? []
      : [
          'sep' as const,
          {
            label: b.kind === 'local' ? 'Remove from this computer' : 'Delete build',
            icon: Trash2,
            danger: true,
            disabled: b.state === 'running',
            run: () => builds.remove([b.id])
          }
        ])
  ]
}

const newLabel = computed(() =>
  surface.id === 'desktop' ? 'Install on this computer' : 'Set up a cloud build'
)
</script>

<template>
  <MarPage
    title="Builds"
    :description="
      proto.mode === 'build'
        ? 'A ComfyUI version, custom nodes and models. Save versions, then deploy them.'
        : 'Where your work runs. Each has its own ComfyUI version, custom nodes and models.'
    "
    :skeleton="view === 'grid' ? 'cards' : 'list'"
    :no-results="shown.length === 0 && filtered"
    :state="shownState === 'live' && builds.items.length === 0 ? 'empty' : undefined"
    :empty="{
      icon: Plus,
      title: 'Set up where your work runs',
      text: 'A build is ComfyUI with its own version, custom nodes and models. Install one on this computer, or run on Comfy Cloud with nothing to install.',
      action: newLabel,
      second: surface.id === 'desktop' ? 'Use Comfy Cloud' : undefined
    }"
    error-text="Cloud builds are out of reach right now. The ones on this computer start as usual."
    @action="hostActions.newInstance()"
    @second="toast('Signing in to Comfy Cloud')"
    @clear="clear"
  >
    <template #actions="{ state }">
      <Button
        v-if="state === 'live' || state === 'loading'"
        variant="primary"
        @click="hostActions.newInstance()"
        ><Plus :size="15" />Build</Button
      >
    </template>

    <template #toolbar>
      <MarSeg v-model="where" :options="WHERE" label="Where" />
      <div class="ml-auto flex items-center gap-2">
        <Select v-model="sort" :options="SORTS" label="Sort" class="w-38" />
        <MarSearchField v-model="query" placeholder="Search builds" />
        <MarViewToggle v-model="view" />
      </div>
    </template>

    <div v-if="view === 'grid'" class="mar-grid is-wide">
      <MarItem
        v-for="b in shown"
        :key="b.id"
        :name="b.name"
        :meta="sub(b)"
        :status="STATUS[b.state]"
        :status-label="statusLabel(b)"
        :fav="b.fav"
        :lines="lines(b)"
        :selected="lib.sel.has(b.id)"
        :selecting="lib.sel.ids.value.size > 0"
        :renaming="lib.renaming.value === b.id"
        ratio="16 / 7"
        class="mar-build"
        @open="open(b)"
        @select="lib.pick(b.id, $event)"
        @start-rename="lib.renaming.value = b.id"
        @rename="lib.rename(b.id, $event)"
        @cancel-rename="lib.renaming.value = ''"
        @star="builds.star(b.id)"
      >
        <template #media>
          <span class="mar-build-face" :style="{ '--hue': b.hue }">
            <LocationIcon :kind="b.kind === 'cloud' ? 'cloud' : 'local'" :size="30" />
            <span class="mar-build-specs">{{ b.error ?? specs(b) }}</span>
          </span>
        </template>
        <template #overlay>
          <button
            type="button"
            class="mar-build-go"
            :disabled="b.state === 'launching'"
            @click.stop="primary(b).run()"
          >
            <component :is="primary(b).icon" :size="13" />{{
              b.state === 'launching' ? 'Starting…' : primary(b).label
            }}
          </button>
        </template>
      </MarItem>
    </div>
    <div v-else class="mar-list">
      <div class="mar-list-head">
        <span class="flex-1">Build</span><span class="w-56">Runs on</span
        ><span class="w-28">Last used</span><span class="w-[150px] text-right">State</span
        ><span class="w-16" />
      </div>
      <MarItem
        v-for="b in shown"
        :key="b.id"
        layout="list"
        :name="b.name"
        :meta="
          b.error ??
          [b.deployment ? 'Cloud build' : b.channel, b.version].filter(Boolean).join(' · ')
        "
        :status="STATUS[b.state]"
        :status-label="statusLabel(b)"
        :fav="b.fav"
        :lines="lines(b)"
        :selected="lib.sel.has(b.id)"
        :selecting="lib.sel.ids.value.size > 0"
        :renaming="lib.renaming.value === b.id"
        @open="open(b)"
        @select="lib.pick(b.id, $event)"
        @start-rename="lib.renaming.value = b.id"
        @rename="lib.rename(b.id, $event)"
        @cancel-rename="lib.renaming.value = ''"
        @star="builds.star(b.id)"
      >
        <template #media>
          <span class="mar-build-glyph"
            ><LocationIcon :kind="b.kind === 'cloud' ? 'cloud' : 'local'" :size="20"
          /></span>
        </template>
        <template #cols>
          <span class="mar-item-col w-56">{{ b.gpu }}</span>
          <span class="mar-item-col w-28">{{ b.state === 'running' ? 'Now' : b.lastUsed }}</span>
        </template>
      </MarItem>
    </div>

    <MarSelectBar
      :n="lib.sel.ids.value.size"
      noun="build"
      :actions="[
        {
          label: 'Stop',
          icon: Square,
          run: () => (
            builds.items
              .filter((b) => lib.sel.has(b.id) && b.state === 'running')
              .forEach((b) => (b.state = 'stopped')),
            lib.sel.clear()
          )
        },
        { label: 'Remove', icon: Trash2, danger: true, run: lib.removeSelected }
      ]"
      @clear="lib.sel.clear()"
      @all="lib.sel.all(lib.order.value)"
    />
  </MarPage>
</template>

<style>
.mar-build-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
  background:
    radial-gradient(120% 140% at 0% 0%, oklch(0.5 0.08 var(--hue) / 0.35), transparent 60%),
    color-mix(in oklch, var(--color-base-foreground) 4%, transparent);
  color: var(--color-base-foreground);
}
.mar-build-specs {
  padding-right: 96px;
  overflow: hidden;
  color: var(--color-muted-foreground);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mar-build .mar-item-status {
  top: 12px;
  right: 76px;
  bottom: auto;
  left: auto;
}
.mar-build-glyph {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}
:root .proto-ui.proto-ui.proto-ui .mar-build-go {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  width: auto;
  height: 28px;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 9px;
  background: var(--color-inverted-background);
  color: var(--color-inverted-foreground);
  font-size: 12px;
  font-weight: 500;
}
:root .proto-ui.proto-ui.proto-ui .mar-build-go:hover {
  background: var(--color-inverted-background-hover);
}
:root .proto-ui.proto-ui.proto-ui .mar-build-go:disabled {
  opacity: 0.6;
}
</style>
