<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Archive,
  ArrowLeft,
  Copy,
  FolderX,
  Pencil,
  Plus,
  Server,
  Trash2,
  UserPlus
} from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import MemberAvatar from '../../parts/MemberAvatar.vue'
import { go, instances, toast, type Page } from '../../useProto'
import MarPage from './MarPage.vue'
import MarSeg from './MarSeg.vue'
import MarItemMenu from './MarItemMenu.vue'
import MarStatus from './MarStatus.vue'
import MarWorkflowsPage from './MarWorkflowsPage.vue'
import MarAssetsPage from './MarAssetsPage.vue'
import { projects } from './projectsStore'
import { workflows } from './workflowsStore'
import { assets } from './assetsStore'
import { notify } from './undo'
import type { MenuLine } from './menu'

/**
 * One project (Mar's proposal): its photo, name, the build it runs on and
 * who's in it, then its Workflows, Assets and People as tabs. The tabs
 * are the library pages narrowed to this project, states included.
 */
const { id } = defineProps<{ id: string }>()
const p = computed(() => projects.items.find((x) => x.id === id))
const build = computed(() => instances.value.find((i) => i.id === p.value?.envId))

type Tab = 'workflows' | 'assets' | 'people'
const tab = ref<Tab>('workflows')
const TABS = computed(() => [
  {
    value: 'workflows' as const,
    label: 'Workflows',
    count: workflows.items.filter((w) => w.project === p.value?.name).length
  },
  {
    value: 'assets' as const,
    label: 'Assets',
    count: assets.items.filter((a) => a.project === p.value?.name).length
  },
  { value: 'people' as const, label: 'People', count: p.value?.members.length ?? 0 }
])

const renaming = ref(false)
const draft = ref('')
function startRename(): void {
  draft.value = p.value?.name ?? ''
  renaming.value = true
}
function commit(): void {
  if (!renaming.value || !p.value) return
  renaming.value = false
  const old = p.value.name
  projects.rename(p.value.id, draft.value)
  // Things inside follow the project's new name.
  for (const w of workflows.items) if (w.project === old) w.project = p.value.name
  for (const a of assets.items) if (a.project === old) a.project = p.value.name
}
function newWorkflow(): void {
  if (!p.value) return
  workflows.items.unshift({
    id: `wf-${Date.now()}`,
    name: 'Untitled workflow',
    source: build.value?.kind === 'cloud' ? 'cloud' : 'local',
    thumbId: '',
    category: 'image',
    project: p.value.name,
    modified: 'Just now',
    age: 0,
    envId: p.value.envId,
    status: 'draft',
    statusLabel: 'Unsaved'
  })
  tab.value = 'workflows'
  notify(`New workflow in ${p.value.name}`)
}
function remove(): void {
  if (!p.value) return
  projects.remove([p.value.id])
}
const role = (m: string, i: number): string =>
  i === 0 ? 'Owner' : m === 'Mariana' ? 'Can edit' : 'Can run'

const lines = computed<MenuLine[]>(() =>
  p.value
    ? [
        { label: 'Rename', icon: Pencil, run: startRename },
        {
          label: 'Runs on',
          icon: Server,
          sub: instances.value.map((i) => ({
            label: i.name,
            checked: i.id === p.value!.envId,
            run: () => {
              const before = p.value!.envId
              p.value!.envId = i.id
              notify(`Now runs on ${i.name}`, () => (p.value!.envId = before))
            }
          }))
        },
        { label: 'Duplicate', icon: Copy, run: () => projects.duplicate(p.value!.id) },
        'sep',
        {
          label: 'Archive',
          icon: Archive,
          run: () => {
            p.value!.archived = true
            notify(`Archived “${p.value!.name}”`, () => (p.value!.archived = false))
            go('projects')
          }
        },
        { label: 'Delete project', icon: Trash2, danger: true, run: remove }
      ]
    : []
)
</script>

<template>
  <!-- Deleted while open (or a stale link): say so, offer the way back. -->
  <MarPage
    v-if="!p"
    title="Project"
    state="empty"
    :empty="{
      icon: FolderX,
      title: 'This project is gone',
      text: 'It was deleted or you no longer have access. Undo brings it back if you just deleted it.',
      action: 'All projects'
    }"
    @action="go('projects')"
  />
  <MarPage
    v-else
    :title="p.name"
    skeleton="grid"
    error-title="Can't open this project"
    error-text="It lives in Comfy Cloud, which is out of reach. Workflows on this computer still open from Workflows."
  >
    <template #lead>
      <button
        type="button"
        class="mar-proj-back"
        aria-label="All projects"
        @click="go('projects' as Page)"
      >
        <ArrowLeft :size="16" />
      </button>
      <img :src="p.art" alt="" class="mar-proj-art" />
    </template>
    <template v-if="renaming" #meta>
      <input
        v-model="draft"
        class="mar-proj-rename"
        aria-label="Project name"
        autofocus
        @keydown.enter.prevent="commit"
        @keydown.esc.prevent="renaming = false"
        @blur="commit"
      />
    </template>
    <template v-else #meta>
      <button type="button" class="mar-proj-edit" aria-label="Rename project" @click="startRename">
        <Pencil :size="13" />
      </button>
      <MarStatus v-if="p.archived" status="paused" label="Archived" />
    </template>

    <template #actions="{ state }">
      <template v-if="state === 'live'">
        <span class="mar-proj-runs"><Server :size="13" />Runs on {{ build?.name ?? '—' }}</span>
        <span class="mar-proj-faces">
          <MemberAvatar v-for="m in p.members.slice(0, 4)" :key="m" :name="m" size="sm" />
        </span>
        <Button variant="ghost" @click="toast(`Invite to ${p.name}`)"
          ><UserPlus :size="15" />Invite</Button
        >
        <Button variant="primary" @click="newWorkflow"><Plus :size="15" />Workflow</Button>
        <MarItemMenu :lines label="Project actions" />
      </template>
    </template>

    <template #tabs="{ state }">
      <div v-if="state === 'live'" class="mb-5">
        <MarSeg v-model="tab" :options="TABS" label="In this project" />
      </div>
    </template>

    <MarWorkflowsPage v-if="tab === 'workflows'" :key="`w-${p.name}`" :project="p.name" />
    <MarAssetsPage v-else-if="tab === 'assets'" :key="`a-${p.name}`" :project="p.name" />
    <div v-else class="mar-people">
      <div v-for="(m, i) in p.members" :key="m" class="mar-person">
        <MemberAvatar :name="m" />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-ui font-medium text-base-foreground"
            >{{ m }}{{ i === 0 ? ' (you)' : '' }}</span
          >
          <span class="text-ui text-subtle-foreground">{{ m.toLowerCase() }}@example.com</span>
        </span>
        <span class="text-ui text-muted-foreground">{{ role(m, i) }}</span>
      </div>
      <button type="button" class="mar-person is-add" @click="toast(`Invite to ${p.name}`)">
        <span class="mar-person-plus"><UserPlus :size="15" /></span>
        <span class="text-ui text-muted-foreground"
          >Invite people. They see this project’s workflows and assets, nothing else.</span
        >
      </button>
    </div>
  </MarPage>
</template>

<style>
.mar-proj-art {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  object-fit: cover;
}
:root .proto-ui.proto-ui.proto-ui :is(.mar-proj-back, .mar-proj-edit) {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  color: var(--color-muted-foreground);
}
:root .proto-ui.proto-ui.proto-ui :is(.mar-proj-back, .mar-proj-edit):hover {
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .mar-proj-edit {
  opacity: 0;
}
:root .proto-ui.proto-ui.proto-ui .mar-page-head:hover .mar-proj-edit,
:root .proto-ui.proto-ui.proto-ui .mar-proj-edit:focus-visible {
  opacity: 1;
}
:root .proto-ui.proto-ui.proto-ui .mar-proj-rename {
  width: 320px;
  height: 36px;
  padding: 0 8px;
  border: 0;
  border-radius: 9px;
  background: var(--color-content-background);
  box-shadow: inset 0 0 0 1px var(--color-border-focus);
  color: var(--color-base-foreground);
  font-size: 20px;
  font-weight: 600;
  outline: none;
}
.mar-proj-runs {
  display: inline-flex;
  height: 28px;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-muted-foreground);
  font-size: 12px;
}
.mar-proj-faces {
  display: flex;
  padding: 0 4px 0 10px;
}
.mar-proj-faces > * {
  margin-left: -6px;
  box-shadow: 0 0 0 2px var(--color-content-background);
}
.mar-people {
  display: flex;
  max-width: 640px;
  flex-direction: column;
  gap: 2px;
}
.mar-person {
  display: flex;
  height: 60px;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  border-radius: 12px;
}
:root .proto-ui.proto-ui.proto-ui .mar-person.is-add {
  width: 100%;
  text-align: left;
}
.mar-person:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
}
.mar-person-plus {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  box-shadow: inset 0 0 0 1px var(--color-border-strong);
  color: var(--color-muted-foreground);
}
</style>
