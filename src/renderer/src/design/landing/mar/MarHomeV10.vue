<script setup lang="ts">
import { computed } from 'vue'
import { Play, Rocket } from 'lucide-vue-next'
import Greeting from '../parts/Greeting.vue'
import PromptBox from '../parts/PromptBox.vue'
import WhatsNew from './WhatsNew.vue'
import LaunchBanner from './LaunchBanner.vue'
import LaunchesRow from '../parts/LaunchesRow.vue'
import QuickLaunch from '../parts/QuickLaunch.vue'
import RecentWork from '../parts/RecentWork.vue'
import StartPaths from '../parts/StartPaths.vue'
import StarterCards from '../parts/StarterCards.vue'
import TemplatesRow from '../parts/TemplatesRow.vue'
import SpacesRow from '../parts/space/SpacesRow.vue'
import Button from '../ui/Button.vue'
import ScrollRow from '../ui/ScrollRow.vue'
import SectionHeader from '../ui/SectionHeader.vue'
import BuildPill from './BuildPill.vue'
import CreateMenu from './CreateMenu.vue'
import WorkflowCard from './WorkflowCard.vue'
import { active as parts } from './marParts'
import { allWorkflows } from '../gallery'
import {
  activeInstance,
  deployEnv,
  go,
  hostActions,
  instanceById,
  instances,
  openDetail,
  proto,
  recentInstances
} from '../useProto'
import { can } from '../milestones'
import { TEMPLATES } from '../mock'
import portraitSeaside from './assets/portrait-seaside.jpg'
import portraitGarden from './assets/portrait-garden.jpg'
import lakeFog from './assets/lake-fog.jpg'
import portraitSun from './assets/portrait-sun.jpg'
import hillsSunset from './assets/hills-sunset.jpg'
import portraitSmile from './assets/portrait-smile.jpg'
import forestFog from './assets/forest-fog.jpg'
import portraitGrass from './assets/portrait-grass.jpg'
import hillsFog from './assets/hills-fog.jpg'
import portraitWindow from './assets/portrait-window.jpg'

/**
 * Mar's Home on Pablo's v10 content: the sections and order of
 * pages/modes/CreateHome.vue (keep in step with it when his branch
 * changes). Each section shows Pablo's part or Mar's version, picked in
 * Tune the UI › Mar's changes (marParts.ts).
 */
const actions = computed(() => [
  {
    label: 'ComfyUI',
    icon: Play,
    run: () => hostActions.launch(activeInstance.value)
  },
  ...(can.value.builder &&
  proto.signedIn &&
  instances.value.some((i) => !i.deployment && i.kind === 'local')
    ? [
        {
          label: 'Deploy',
          icon: Rocket,
          run: () =>
            deployEnv(
              (activeInstance.value.kind === 'local'
                ? activeInstance.value
                : instances.value.find((i) => i.kind === 'local')!
              ).id
            )
        }
      ]
    : [])
])
const noLocal = computed(() => !instances.value.some((i) => i.kind === 'local'))
const builds = computed(() => recentInstances.value.slice(0, 3))
const tight = computed(() => parts.value.top === 'mar')

// Example workflows as compact rows (Exploration 17): photo, title, what it does.
const EXAMPLE_ART = [portraitGarden, lakeFog, portraitSun, hillsSunset, portraitSmile]
const exampleRows = computed(() =>
  TEMPLATES.filter((t) => t.kind === 'graph')
    .slice(0, 5)
    .map((t, i) => {
      const [title, what] = t.title.split(':').map((x) => x.trim())
      return { id: t.id, title: title!, what: what ?? t.category, src: EXAMPLE_ART[i]! }
    })
)

const RECENT_ART = [
  portraitSeaside,
  forestFog,
  portraitGrass,
  hillsFog,
  portraitWindow,
  portraitGarden,
  lakeFog,
  portraitSun,
  hillsSunset,
  portraitSmile
]
const recent = computed(() =>
  [...allWorkflows.value]
    .sort((a, b) => a.age - b.age)
    .slice(0, 8)
    .map((w, i) => {
      const env = w.envId ? instanceById(w.envId) : undefined
      return {
        w,
        env,
        src: RECENT_ART[i % RECENT_ART.length]!,
        title: w.name.replace(/\.json$/, '')
      }
    })
)
</script>

<template>
  <div class="mar-top-actions absolute top-3.5 right-4 z-10 flex items-center gap-2">
    <CreateMenu v-if="parts.actions === 'mar'" />
    <template v-else>
      <Button v-for="a in actions" :key="a.label" @click="a.run()">
        <component :is="a.icon" :size="14" />{{ a.label }}
      </Button>
    </template>
  </div>
  <div
    :class="[
      'mar-home mx-auto w-full max-w-300 px-10',
      noLocal ? 'h-full overflow-hidden' : 'pb-16'
    ]"
  >
    <section :class="['flex flex-col', noLocal ? 'h-full' : tight ? 'pt-14 pb-4' : 'pt-12 pb-4']">
      <div :class="['flex flex-1 flex-col', noLocal || !tight ? 'justify-center pt-10' : '']">
        <StartPaths v-if="noLocal" />
        <template v-else>
          <Greeting
            text="Hi Mar. Let's create"
            :class="['mar-greeting', tight ? 'mb-4! pt-0!' : '']"
          />
          <!-- One line tall; while you type it grows over what's below. -->
          <div v-if="can.agent" class="mar-prompt-slot">
            <PromptBox target class="mar-prompt" />
          </div>
          <div v-if="parts.builds === 'mar'" class="mx-auto mt-8 w-full max-w-210">
            <div class="mb-2.5 flex items-center justify-between px-1">
              <span class="text-ui text-muted-foreground">Or launch ComfyUI</span>
              <Button variant="link" size="sm" @click="go('environments')">All builds</Button>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <BuildPill v-for="i in builds" :key="i.id" :inst="i" />
            </div>
          </div>
          <QuickLaunch v-else-if="parts.builds === 'pablo'" />
        </template>
      </div>
    </section>

    <div v-if="!noLocal">
      <section v-if="parts.examples === 'mar'" class="mx-auto mt-8 w-full max-w-180">
        <SectionHeader
          title="Example workflows"
          :link="can.explore ? 'Explore all' : undefined"
          @link="go('explore')"
        >
          <template #controls>
            <span
              class="inline-flex h-5 items-center rounded-full bg-secondary-background px-2 text-ui text-muted-foreground"
              >{{ TEMPLATES.length }}</span
            >
          </template>
        </SectionHeader>
        <StarterCards />
      </section>
      <TemplatesRow
        v-else-if="parts.examples === 'pablo'"
        title="Example workflows"
        class="mt-0!"
      />

      <section v-if="parts.recent === 'mar' && recent.length" class="mt-10">
        <SectionHeader title="Recently used" link="See all" @link="go('workflows')">
          <template #controls>
            <span
              class="inline-flex h-5 items-center rounded-full bg-secondary-background px-2 text-ui text-muted-foreground"
              >{{ recent.length }}</span
            >
          </template>
        </SectionHeader>
        <ScrollRow :columns="5">
          <WorkflowCard
            v-for="r in recent"
            :key="r.w.id"
            :src="r.src"
            :title="r.title"
            :meta="r.env?.name ?? ''"
            :right="r.w.modified"
            @open="r.env && hostActions.launch(r.env, r.w.name)"
          />
        </ScrollRow>
      </section>
      <RecentWork v-else-if="parts.recent === 'pablo'" />

      <section v-if="parts.examples === 'rows'" class="mt-10">
        <SectionHeader
          title="Example workflows"
          :link="can.explore ? 'Explore all' : undefined"
          @link="go('explore')"
        >
          <template #controls>
            <span class="text-ui text-subtle-foreground">{{ TEMPLATES.length }}</span>
          </template>
        </SectionHeader>
        <div class="grid grid-cols-5 gap-3">
          <button
            v-for="e in exampleRows"
            :key="e.id"
            type="button"
            class="mar-surface flex min-w-0 items-center gap-3 rounded-card p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            @click="openDetail('template', e.id)"
          >
            <img :src="e.src" alt="" class="size-12 shrink-0 rounded-control object-cover" />
            <span class="min-w-0">
              <span class="block truncate text-ui font-medium">{{ e.title }}</span>
              <span class="block truncate text-ui text-subtle-foreground">{{ e.what }}</span>
            </span>
          </button>
        </div>
      </section>

      <template v-if="can.explore">
        <WhatsNew v-if="parts.news === 'mar'" />
        <LaunchBanner v-else-if="parts.news === 'banner'" />
        <LaunchesRow v-else />
      </template>
      <SpacesRow v-if="can.spaces && proto.signedIn" />
    </div>
  </div>
  <div
    v-if="!noLocal"
    aria-hidden="true"
    class="pointer-events-none sticky bottom-0 -mt-32 h-32 bg-[linear-gradient(to_top,var(--color-content-background)_15%,transparent)]"
  />
</template>

<style scoped>
/* The prompt box: one line, the build picker, the mic and send on the
   same line. Focused, it opens to three lines (up to six as you type) over
   the content below, which never moves. */
.mar-prompt-slot {
  position: relative;
  z-index: 5;
  height: 66px;
}
.mar-prompt-slot > .mar-prompt {
  position: absolute;
  inset: 0 0 auto;
}
.mar-prompt {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  column-gap: 10px;
  padding: 14px 12px 14px 22px;
  border-radius: 28px;
}
.mar-prompt > :deep(:first-child:not(.relative)) {
  grid-column: 1 / -1;
}
.mar-prompt > :deep(.relative) {
  align-self: center;
  padding-top: 0;
}
.mar-prompt :deep(.relative > div[aria-hidden]) {
  padding-top: 0;
  white-space: nowrap;
  overflow: hidden;
}
.mar-prompt :deep(textarea) {
  height: 1lh;
  min-height: 1lh;
  field-sizing: content;
  max-height: 6lh;
  transition: min-height 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-prompt :deep(textarea:focus) {
  min-height: 3lh;
}
.mar-prompt > :deep(.mt-1\.5) {
  margin-top: 0;
  gap: 6px;
}
/* The build picker: the build itself, no "Run on" label. */
.mar-prompt :deep(.mt-1\.5 button > .text-subtle-foreground:not(:last-child)) {
  display: none;
}
@media (prefers-reduced-motion: reduce) {
  .mar-prompt :deep(textarea) {
    transition: none;
  }
}
</style>
