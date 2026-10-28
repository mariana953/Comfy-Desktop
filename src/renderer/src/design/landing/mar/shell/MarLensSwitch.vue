<script setup lang="ts">
/**
 * Create / Build with the tabs title bar (titleTabs.ts): both named, equal
 * width, no icons - two words read faster than a label and an icon. The
 * agent is a button in the title bar, not a lens here.
 */
const { options } = defineProps<{ options: readonly { value: string; label: string }[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Mode"
    class="grid h-8.5 w-full auto-cols-fr grid-flow-col items-center gap-0.5 rounded-control border border-border-default bg-secondary-background p-0.5"
  >
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :class="[
        'h-full rounded-[7px] px-2 text-ui transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        model === o.value
          ? 'bg-secondary-background-hover text-base-foreground'
          : 'text-muted-foreground hover:text-base-foreground'
      ]"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>
