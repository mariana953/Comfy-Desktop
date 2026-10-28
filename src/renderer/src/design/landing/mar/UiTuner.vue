<script setup lang="ts">
import { X } from 'lucide-vue-next'
import Button from '../ui/Button.vue'
import { DIRECTIONS, look } from '../look'
import { KNOBS, resetTuning, tuner, tuning, type Tuning } from './uiTuner'

/** The UI tuner panel (Prototype menu › UI › Tune…): the UI to start from,
 *  then the knobs, applied live. */
function set(key: keyof Tuning, value: string): void {
  ;(tuning as Record<string, string>)[key] = value
}
</script>

<template>
  <aside
    v-if="tuner.open"
    aria-label="UI tuner"
    class="fixed top-14 right-4 z-50 flex w-72 flex-col gap-4 rounded-panel border border-border-default bg-card-background p-4 shadow-popover [-webkit-app-region:no-drag]"
  >
    <header class="flex items-center justify-between">
      <h2 class="text-ui font-semibold">Tune the UI</h2>
      <Button variant="ghost" size="icon-sm" aria-label="Close" @click="tuner.open = false">
        <X :size="14" />
      </Button>
    </header>

    <div class="flex flex-col gap-1.5">
      <span class="text-ui text-subtle-foreground">UI</span>
      <div class="flex flex-wrap gap-1">
        <button
          v-for="d in DIRECTIONS"
          :key="d.value"
          type="button"
          :aria-pressed="look.direction === d.value"
          :class="[
            'h-7 rounded-control px-2.5 text-ui outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            look.direction === d.value
              ? 'bg-secondary-background-hover font-medium text-base-foreground'
              : 'text-muted-foreground hover:bg-secondary-background hover:text-base-foreground'
          ]"
          @click="look.direction = d.value"
        >
          {{ d.label }}
        </button>
      </div>
    </div>

    <div v-for="k in KNOBS" :key="k.key" class="flex flex-col gap-1.5">
      <span class="text-ui text-subtle-foreground">{{ k.label }}</span>
      <div class="flex gap-1 rounded-control bg-secondary-background p-0.5">
        <button
          v-for="o in k.options"
          :key="o.value"
          type="button"
          :aria-pressed="tuning[k.key] === o.value"
          :class="[
            'h-7 flex-1 rounded-[7px] px-2 text-ui outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
            tuning[k.key] === o.value
              ? 'bg-secondary-background-hover font-medium text-base-foreground'
              : 'text-muted-foreground hover:text-base-foreground'
          ]"
          @click="set(k.key, o.value)"
        >
          {{ o.label }}
        </button>
      </div>
    </div>

    <Button variant="ghost" size="sm" class="self-start" @click="resetTuning">Reset</Button>
  </aside>
</template>
