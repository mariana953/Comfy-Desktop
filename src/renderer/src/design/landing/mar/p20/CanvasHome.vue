<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import PromptBox from '../../parts/PromptBox.vue'
import ScrollRow from '../../ui/ScrollRow.vue'
import SectionHeader from '../../ui/SectionHeader.vue'
import WorkflowCard from '../WorkflowCard.vue'
import { go, hostActions, toast } from '../../useProto'
import { news, orb, recent, spaces } from './P20HomeData'

/**
 * 12 · Canvas hero (Figma 119:2107): the latest output fills the top of
 * the page, edge to edge, with the greeting and a glass prompt over it
 * and a chip saying what it is. Recently used rises under it; What's new
 * and Spaces close the page as two quiet lines.
 */
const latest = computed(() => recent.value[0])
const shown = computed(() => recent.value.slice(0, 8))
const models = news.filter((l) => l.kind === 'model').slice(0, 3)
const feature = news.find((l) => l.kind === 'feature')
const live = spaces.filter((s) => s.status !== 'draft')
</script>

<template>
  <div class="relative w-full">
    <section class="p12-hero relative isolate overflow-hidden">
      <img
        v-if="latest"
        :src="latest.src"
        alt=""
        class="absolute inset-0 -z-10 size-full object-cover object-[center_28%]"
      />
      <span class="p12-veil absolute inset-0 -z-10" aria-hidden="true" />

      <div class="mx-auto w-full max-w-300 px-10 pt-[150px] pb-24">
        <h1 class="mar-greeting mb-6 text-[56px] leading-[1.02] tracking-[-0.035em]">
          Hi Mar. Let's create
        </h1>
        <div class="max-w-170">
          <div class="mar-prompt-slot"><PromptBox target class="mar-prompt" /></div>
        </div>
      </div>

      <!-- What the picture is: the output it came from, where and when. -->
      <button
        v-if="latest"
        type="button"
        class="p12-credit absolute right-6 bottom-12"
        @click="latest.env ? hostActions.launch(latest.env, latest.w.name) : go('workflows')"
      >
        <img :src="latest.src" alt="" class="size-4 rounded-[5px] object-cover" />
        {{ [latest.title, latest.env?.name, latest.w.modified].filter(Boolean).join(' · ') }}
      </button>
    </section>

    <div class="relative mx-auto w-full max-w-300 px-10 pb-16">
      <section v-if="shown.length" class="-mt-4">
        <SectionHeader title="Recently used" link="See all" @link="go('workflows')">
          <template #controls>
            <span class="text-ui text-subtle-foreground">{{ shown.length }}</span>
          </template>
        </SectionHeader>
        <ScrollRow :columns="5">
          <WorkflowCard
            v-for="r in shown"
            :key="r.w.id"
            :src="r.src"
            :title="r.title"
            :meta="r.env?.name ?? ''"
            :right="r.w.modified"
            @open="r.env && hostActions.launch(r.env, r.w.name)"
          />
        </ScrollRow>
      </section>

      <div class="mt-8 flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
        <section class="flex min-w-0 flex-wrap items-center gap-2" aria-label="What's new">
          <h2 class="mr-1.5 text-ui font-semibold">What's new</h2>
          <button
            v-for="m in models"
            :key="m.title"
            type="button"
            class="p12-pill"
            @click="toast(`Try ${m.title}`)"
          >
            {{ m.title }}
          </button>
          <button
            v-if="feature"
            type="button"
            class="p12-link"
            @click="toast(`Try ${feature.title}`)"
          >
            {{ feature.title }} is here<ArrowRight :size="13" aria-hidden="true" />
          </button>
        </section>

        <section class="flex min-w-0 flex-wrap items-center gap-2" aria-label="Spaces">
          <h2 class="mr-1.5 text-ui font-semibold">Spaces</h2>
          <button
            v-for="s in live"
            :key="s.id"
            type="button"
            class="p12-pill"
            @click="go(`space:${s.id}`)"
          >
            <span class="size-3.5 rounded-full" :style="orb(s.brand.color)" />{{ s.name }}
          </button>
          <button type="button" class="p12-link" @click="go('spaces')">
            All<ArrowRight :size="13" aria-hidden="true" />
          </button>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p12-hero {
  min-height: 560px;
}
/* The photo meets the title bar at the top, opens up behind the
   greeting, and melts into the page at the bottom. A wash of the page
   colour on the left keeps the greeting and the prompt readable in light
   and dark alike. */
.p12-veil {
  background:
    linear-gradient(
      to bottom,
      color-mix(in oklch, var(--color-titlebar-background) 55%, transparent) 0,
      transparent 140px
    ),
    linear-gradient(
      to bottom,
      transparent 52%,
      color-mix(in oklch, var(--color-content-background) 70%, transparent) 80%,
      var(--color-content-background) 100%
    ),
    linear-gradient(
      100deg,
      color-mix(in oklch, var(--color-content-background) 50%, transparent) 0%,
      color-mix(in oklch, var(--color-content-background) 18%, transparent) 55%,
      transparent 80%
    );
}
</style>

<style>
/* Pablo's button reset wipes padding and width: these keep their own. */
:root .proto-ui.proto-ui.proto-ui .p12-credit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 9px 0 4px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  color: oklch(1 0 0 / 0.92);
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
}
:root .proto-ui.proto-ui.proto-ui .p12-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  font-size: var(--text-ui);
  font-weight: 500;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  backdrop-filter: blur(16px);
  transition: background-color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p12-pill:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 11%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .p12-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 4px;
  font-size: var(--text-ui);
  color: var(--color-muted-foreground);
  transition: color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p12-link:hover {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui :is(.p12-credit, .p12-pill, .p12-link):focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
</style>
