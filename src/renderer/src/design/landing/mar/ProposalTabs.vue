<script setup lang="ts">
import { PROPOSALS, proposal } from './proposal'

/** Pablo | Mar, pinned top centre, so it is always clear whose prototype
 *  is on screen. */
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Proposal"
    class="inline-flex h-8 items-center gap-0.5 rounded-control border border-border-default bg-secondary-background p-0.5 shadow-popover [-webkit-app-region:no-drag]"
  >
    <button
      v-for="p in PROPOSALS"
      :key="p.value"
      type="button"
      role="radio"
      :aria-checked="proposal.id === p.value"
      :class="[
        'h-full rounded-[7px] px-3 text-ui transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        proposal.id === p.value
          ? 'bg-secondary-background-hover font-medium text-base-foreground'
          : 'text-muted-foreground hover:text-base-foreground'
      ]"
      @click="proposal.id = p.value"
    >
      {{ p.label }}
    </button>
  </div>
</template>
