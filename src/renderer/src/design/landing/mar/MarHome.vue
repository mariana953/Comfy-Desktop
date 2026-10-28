<script setup lang="ts">
import { computed } from 'vue'
import Greeting from '../parts/Greeting.vue'
import PromptBox from '../parts/PromptBox.vue'
import StartPaths from '../parts/StartPaths.vue'
import LaunchesRow from '../parts/LaunchesRow.vue'
import SpacesRow from '../parts/space/SpacesRow.vue'
import Button from '../ui/Button.vue'
import ScrollRow from '../ui/ScrollRow.vue'
import SectionHeader from '../ui/SectionHeader.vue'
import BuildTile from './BuildTile.vue'
import CreateMenu from './CreateMenu.vue'
import WorkflowCard from './WorkflowCard.vue'
import { allWorkflows } from '../gallery'
import {
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
import portraitGarden from './assets/portrait-garden.jpg'
import lakeFog from './assets/lake-fog.jpg'
import portraitSun from './assets/portrait-sun.jpg'
import hillsSunset from './assets/hills-sunset.jpg'
import portraitSmile from './assets/portrait-smile.jpg'
import portraitSeaside from './assets/portrait-seaside.jpg'
import forestFog from './assets/forest-fog.jpg'
import portraitGrass from './assets/portrait-grass.jpg'
import hillsFog from './assets/hills-fog.jpg'
import portraitWindow from './assets/portrait-window.jpg'

/**
 * Mar's Home. Pablo's Milestone 10 layout (greeting, the agent's
 * prompt box, examples, recent) with:
 *   - one Create button top right; ComfyUI and Deploy are its menu
 *   - builds as tiles (state on top, name and place below)
 *   - workflow cards with a meta line and a value on the right
 *   - one photo series (Magnific stock) so the page reads as a whole
 */
const EXAMPLE_ART = [portraitGarden, lakeFog, portraitSun, hillsSunset, portraitSmile]
const RECENT_ART = [portraitSeaside, forestFog, portraitGrass, hillsFog, portraitWindow]
const CATEGORY = { image: 'Image', video: 'Video', '3d': '3D', audio: 'Audio' } as const

const noLocal = computed(() => !instances.value.some((i) => i.kind === 'local'))
const builds = computed(() => recentInstances.value.slice(0, 3))

// "Qwen Image Edit 2511: Multiple Angles" → title + what it does.
const examples = computed(() => {
  const list = TEMPLATES.filter((t) => t.kind === 'graph')
  return list.map((t, i) => {
    const [title, what] = t.title.split(':').map((s) => s.trim())
    return {
      id: t.id,
      src: EXAMPLE_ART[i % EXAMPLE_ART.length]!,
      title: title!,
      meta: what ?? CATEGORY[t.category],
      right: t.runs === 'cloud' ? 'Cloud' : t.vram
    }
  })
})
const exampleCount = computed(() => TEMPLATES.length)

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
  <div class="absolute top-3.5 right-4 z-10"><CreateMenu /></div>
  <div :class="['mx-auto w-full max-w-300 px-10', noLocal ? 'h-full overflow-hidden' : 'pb-16']">
    <section :class="['flex flex-col', noLocal ? 'h-full' : 'pt-12 pb-4']">
      <div class="flex flex-1 flex-col justify-center pt-10">
        <StartPaths v-if="noLocal" />
        <template v-else>
          <Greeting />
          <PromptBox v-if="can.agent" target />
          <div class="mx-auto mt-8 w-full max-w-180">
            <div class="mb-2.5 flex items-center justify-between px-1">
              <span class="text-ui text-muted-foreground">Or launch ComfyUI</span>
              <Button variant="link" size="sm" @click="go('environments')">All builds</Button>
            </div>
            <div class="grid grid-cols-3 gap-2.5">
              <BuildTile v-for="i in builds" :key="i.id" :inst="i" />
            </div>
          </div>
        </template>
      </div>
    </section>

    <div v-if="!noLocal">
      <section class="mt-6">
        <SectionHeader
          title="Example workflows"
          :link="can.explore ? 'Explore all' : undefined"
          @link="go('explore')"
        >
          <template #controls>
            <span
              class="inline-flex h-5 items-center rounded-full bg-secondary-background px-2 text-ui text-muted-foreground"
              >{{ exampleCount }}</span
            >
          </template>
        </SectionHeader>
        <ScrollRow :columns="5">
          <WorkflowCard
            v-for="e in examples"
            :key="e.id"
            :src="e.src"
            :title="e.title"
            :meta="e.meta"
            :right="e.right"
            @open="openDetail('template', e.id)"
          />
        </ScrollRow>
      </section>

      <section v-if="recent.length" class="mt-10">
        <SectionHeader title="Recently used">
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
