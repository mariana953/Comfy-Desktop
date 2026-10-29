<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Pause,
  Play,
  Rocket,
  Trash2,
  UserPlus
} from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import SpaceMark from '../../parts/space/SpaceMark.vue'
import MembersTable from '../../parts/space/MembersTable.vue'
import SpaceActivity from '../../pages/spaces/SpaceActivity.vue'
import SpaceCatalog from '../../pages/spaces/SpaceCatalog.vue'
import SpaceHomeBrand from '../../pages/spaces/SpaceHomeBrand.vue'
import SpaceAccess from '../../pages/spaces/SpaceAccess.vue'
import SpaceOverview from '../../pages/spaces/SpaceOverview.vue'
import SpaceSettings from '../../pages/spaces/SpaceSettings.vue'
import SpaceUsage from '../../pages/spaces/SpaceUsage.vue'
import { SPACES, goLive, previewSpace } from '../../spaces'
import { go, toast } from '../../useProto'
import MarPage from './MarPage.vue'
import MarSeg from './MarSeg.vue'
import MarStatus from './MarStatus.vue'
import MarItemMenu from './MarItemMenu.vue'
import { notify } from './undo'
import type { MenuLine } from './menu'

/**
 * One space (Mar's proposal): the client's mark, name, state and
 * address, then Pablo's panels (overview, tools, brand, members, usage,
 * activity, settings) under Mar's tabs, inside the shared page frame so
 * Loading and Error apply here too.
 */
const { id } = defineProps<{ id: string }>()
const space = computed(() => SPACES.find((s) => s.id === id))

type Tab = 'overview' | 'catalog' | 'home' | 'members' | 'usage' | 'activity' | 'settings'
const tab = ref<Tab>('overview')
const members = ref<InstanceType<typeof MembersTable>>()
const TABS = computed(() => [
  { value: 'overview' as Tab, label: 'Overview' },
  { value: 'catalog' as Tab, label: 'Tools', count: space.value?.catalog.length },
  { value: 'home' as Tab, label: 'Home & brand' },
  { value: 'members' as Tab, label: 'Members', count: space.value?.members.length },
  { value: 'usage' as Tab, label: 'Usage' },
  { value: 'activity' as Tab, label: 'Activity' },
  { value: 'settings' as Tab, label: 'Settings' }
])

function invite(): void {
  tab.value = 'members'
  setTimeout(() => members.value?.invite())
}
function setPaused(on: boolean): void {
  const s = space.value
  if (!s) return
  const before = s.status
  s.status = on ? 'paused' : 'live'
  notify(on ? `${s.name} is paused` : `${s.name} is live again`, () => (s.status = before))
}
const lines = computed<MenuLine[]>(() => {
  const s = space.value
  if (!s) return []
  return [
    { label: 'Preview as client', icon: Eye, run: () => previewSpace(s.id) },
    ...(s.status === 'live' ? [{ label: 'Pause', icon: Pause, run: () => setPaused(true) }] : []),
    ...(s.status === 'paused'
      ? [{ label: 'Resume', icon: Play, run: () => setPaused(false) }]
      : []),
    'sep',
    {
      label: 'Delete space',
      icon: Trash2,
      danger: true,
      run: () => {
        const i = SPACES.indexOf(s)
        SPACES.splice(i, 1)
        go('spaces')
        notify(`Deleted “${s.name}”`, () => SPACES.splice(i, 0, s))
      }
    }
  ]
})
</script>

<template>
  <MarPage
    v-if="!space"
    title="Space"
    state="empty"
    :empty="{
      icon: Trash2,
      title: 'This space is gone',
      text: 'It was deleted, or you no longer manage it.',
      action: 'All spaces'
    }"
    @action="go('spaces')"
  />
  <MarPage
    v-else
    :title="space.name"
    skeleton="settings"
    error-title="Can't load this space"
    error-text="It lives in Comfy Cloud, which is out of reach. Its members can't run anything until it's back either."
  >
    <template #lead>
      <button type="button" class="mar-proj-back" aria-label="All spaces" @click="go('spaces')">
        <ArrowLeft :size="16" />
      </button>
      <SpaceMark :brand="space.brand" size="lg" />
    </template>
    <template #meta>
      <MarStatus :status="space.status" />
    </template>

    <template #actions="{ state }">
      <template v-if="state === 'live'">
        <button
          v-if="space.status !== 'draft'"
          type="button"
          class="mar-space-domain"
          @click="toast(`Opening ${space.domain} ↗`)"
        >
          {{ space.domain }}<ExternalLink :size="12" />
        </button>
        <Button variant="ghost" @click="invite"><UserPlus :size="15" />Invite</Button>
        <Button v-if="space.status === 'draft'" variant="primary" @click="goLive(space.id)"
          ><Rocket :size="15" />Go live</Button
        >
        <Button v-else variant="primary" @click="previewSpace(space.id)"
          ><Eye :size="15" />Preview</Button
        >
        <MarItemMenu :lines label="Space actions" />
      </template>
    </template>

    <template #tabs="{ state }">
      <div v-if="state === 'live'" class="mb-2">
        <MarSeg v-model="tab" :options="TABS" label="Space" />
      </div>
    </template>

    <SpaceOverview v-if="tab === 'overview'" :space @tab="(t: Tab) => (tab = t)" />
    <SpaceCatalog v-else-if="tab === 'catalog'" :space-id="space.id" />
    <SpaceHomeBrand v-else-if="tab === 'home'" :space-id="space.id" />
    <div v-else-if="tab === 'members'" class="mt-8 flex flex-col gap-3.5">
      <MembersTable ref="members" :space-id="space.id" />
      <SpaceAccess :space-id="space.id" />
    </div>
    <SpaceUsage v-else-if="tab === 'usage'" :space-id="space.id" />
    <SpaceActivity v-else-if="tab === 'activity'" :space />
    <SpaceSettings v-else :space-id="space.id" />
  </MarPage>
</template>

<style>
:root .proto-ui.proto-ui.proto-ui .mar-space-domain {
  display: inline-flex;
  width: auto;
  height: 28px;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-muted-foreground);
  font-size: 12px;
}
:root .proto-ui.proto-ui.proto-ui .mar-space-domain:hover {
  color: var(--color-base-foreground);
}
</style>
