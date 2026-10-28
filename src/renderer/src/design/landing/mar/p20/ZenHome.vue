<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import PromptBox from '../../parts/PromptBox.vue'
import { go, hostActions, openDetail, toast } from '../../useProto'
import { news, orb, recent, spaces, starters } from './P20HomeData'

/**
 * 20 · Zen (Figma 120:3370): a calm Home. The greeting and the prompt in
 * the middle of the page, four starters under them, and one quiet line
 * with your recent work, what's new and your spaces. Nothing else.
 */
const thumbs = computed(() => recent.value.slice(0, 5))
const headline = news[0]
const live = spaces.filter((s) => s.status !== 'draft')
</script>

<template>
  <div
    class="mx-auto flex w-full max-w-200 flex-col items-center px-10 pt-[clamp(72px,14vh,140px)] pb-20"
  >
    <h1 class="mar-greeting mb-7 text-center text-[44px] leading-[1.08] tracking-[-0.035em]">
      Hi Mar. Let's create
    </h1>
    <div class="w-full">
      <div class="mar-prompt-slot"><PromptBox target class="mar-prompt" /></div>
    </div>

    <ul class="mt-9 grid w-full grid-cols-4 gap-3" aria-label="Start from">
      <li v-for="s in starters" :key="s.id">
        <button type="button" class="p20-starter group" @click="openDetail('template', s.id)">
          <span class="block overflow-hidden rounded-[10px]">
            <img
              :src="s.src"
              alt=""
              class="aspect-[16/11] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          </span>
          <span class="block px-1.5 pt-2.5 pb-1.5 text-left">
            <span class="block truncate text-ui font-semibold">{{ s.title }}</span>
            <span class="block truncate text-xs text-subtle-foreground">{{ s.model }}</span>
          </span>
        </button>
      </li>
    </ul>

    <!-- One line: recent work, the latest news, your spaces. -->
    <div class="mt-12 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-3 text-ui">
      <template v-if="thumbs.length">
        <button type="button" class="p20-quiet" @click="go('workflows')">Recent</button>
        <span class="flex gap-1.5">
          <button
            v-for="r in thumbs"
            :key="r.w.id"
            type="button"
            class="p20-thumb"
            :aria-label="r.title"
            :title="r.title"
            @click="r.env && hostActions.launch(r.env, r.w.name)"
          >
            <img :src="r.src" alt="" class="size-full object-cover" />
          </button>
        </span>
        <span class="text-subtle-foreground" aria-hidden="true">·</span>
      </template>
      <button
        v-if="headline"
        type="button"
        class="p20-quiet is-strong"
        @click="toast(`Try ${headline.title}`)"
      >
        What's new: {{ headline.title }}<ArrowRight :size="13" aria-hidden="true" />
      </button>
      <template v-if="live.length">
        <span class="text-subtle-foreground" aria-hidden="true">·</span>
        <button type="button" class="p20-quiet" @click="go('spaces')">Spaces</button>
        <span class="flex items-center gap-0.5">
          <button
            v-for="s in live"
            :key="s.id"
            type="button"
            class="p20-orb"
            :aria-label="`${s.name} space`"
            :title="s.name"
            @click="go(`space:${s.id}`)"
          >
            <span class="size-4 rounded-full" :style="orb(s.brand.color)" />
          </button>
        </span>
      </template>
    </div>
  </div>
</template>

<style>
/* Pablo's button reset wipes padding and width: these keep their own. */
:root .proto-ui.proto-ui.proto-ui .p20-starter {
  display: block;
  width: 100%;
  padding: 6px;
  border-radius: 16px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(24px) saturate(1.2);
  box-shadow: 0 10px 30px -18px rgb(0 0 0 / 0.35);
  transition: background-color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p20-starter:hover {
  background: color-mix(in oklch, var(--color-card-background-hover) 82%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .p20-thumb {
  width: 36px;
  height: 36px;
  padding: 0;
  overflow: hidden;
  border-radius: 9px;
  transition: opacity 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p20-thumb:hover {
  opacity: 0.85;
}
:root .proto-ui.proto-ui.proto-ui .p20-orb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 999px;
  transition: background-color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p20-orb:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .p20-quiet {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 4px;
  font-size: var(--text-ui);
  color: var(--color-subtle-foreground);
  transition: color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p20-quiet.is-strong {
  font-weight: 500;
  color: var(--color-muted-foreground);
}
:root .proto-ui.proto-ui.proto-ui .p20-quiet:hover {
  color: var(--color-base-foreground);
}
:root
  .proto-ui.proto-ui.proto-ui
  :is(.p20-starter, .p20-thumb, .p20-orb, .p20-quiet):focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
</style>
