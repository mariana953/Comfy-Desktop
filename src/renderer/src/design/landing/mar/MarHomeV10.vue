<script setup lang="ts">
import { computed } from 'vue'
import { Play, Rocket } from 'lucide-vue-next'
import Greeting from '../parts/Greeting.vue'
import PromptBox from '../parts/PromptBox.vue'
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
import BuildTile from './BuildTile.vue'
import CreateMenu from './CreateMenu.vue'
import WorkflowCard from './WorkflowCard.vue'
import { parts } from './marParts'
import { allWorkflows } from '../gallery'
import {
  activeInstance,
  deployEnv,
  go,
  hostActions,
  instanceById,
  instances,
  proto,
  recentInstances
} from '../useProto'
import { can } from '../milestones'
import { TEMPLATES } from '../mock'
import portraitSeaside from './assets/portrait-seaside.jpg'
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
const tight = computed(() => parts.top === 'mar')

const RECENT_ART = [portraitSeaside, forestFog, portraitGrass, hillsFog, portraitWindow]
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
  <div class="absolute top-3.5 right-4 z-10 flex items-center gap-2">
    <CreateMenu v-if="parts.actions === 'mar'" />
    <template v-else>
      <Button v-for="a in actions" :key="a.label" @click="a.run()">
        <component :is="a.icon" :size="14" />{{ a.label }}
      </Button>
    </template>
  </div>
  <div :class="['mx-auto w-full max-w-300 px-10', noLocal ? 'h-full overflow-hidden' : 'pb-16']">
    <section :class="['flex flex-col', noLocal ? 'h-full' : tight ? 'pt-14 pb-4' : 'pt-12 pb-4']">
      <div :class="['flex flex-1 flex-col', noLocal || !tight ? 'justify-center pt-10' : '']">
        <StartPaths v-if="noLocal" />
        <template v-else>
          <Greeting :class="tight ? 'mb-4! pt-0!' : ''" />
          <PromptBox v-if="can.agent" target :class="tight ? 'mar-prompt' : ''" />
          <div v-if="parts.builds === 'mar'" class="mx-auto mt-8 w-full max-w-180">
            <div class="mb-2.5 flex items-center justify-between px-1">
              <span class="text-ui text-muted-foreground">Or launch ComfyUI</span>
              <Button variant="link" size="sm" @click="go('environments')">All builds</Button>
            </div>
            <div class="grid grid-cols-3 gap-2.5">
              <BuildTile v-for="i in builds" :key="i.id" :inst="i" />
            </div>
          </div>
          <QuickLaunch v-else />
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
      <TemplatesRow v-else title="Example workflows" class="mt-0!" />

      <section v-if="parts.recent === 'mar' && recent.length" class="mt-10">
        <SectionHeader title="Recently used" />
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

      <LaunchesRow v-if="can.explore" />
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
/* A shorter prompt box (two lines) so the page starts higher. */
.mar-prompt :deep(textarea) {
  height: calc(2lh + 4px);
}
</style>
