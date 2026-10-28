<script setup lang="ts">
import { computed, type Component } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import DropdownMenuContent from '../../ui/DropdownMenuContent.vue'
import DropdownMenuItem from '../../ui/DropdownMenuItem.vue'
import { modeStyle } from './modeStyle'

/** The Create / Build / Agent switch in the style picked in the tuner
 *  (everything but Pablo's pill, which stays his ModeSwitch). */
const { options } = defineProps<{
  options: { value: string; label: string; icon: Component }[]
}>()
const model = defineModel<string>({ required: true })
const current = computed(() => options.find((o) => o.value === model.value) ?? options[0]!)
const HINT: Record<string, string> = {
  create: 'Make images, video and 3D',
  build: 'Ship workflows as APIs',
  agent: 'Ask Comfy to do it'
}
</script>

<template>
  <!-- Menu: one button with the current mode; the others in a list. -->
  <DropdownMenuRoot v-if="modeStyle.id === 'menu'" :modal="false">
    <DropdownMenuTrigger as-child>
      <button type="button" class="mms-menu">
        <component :is="current.icon" :size="15" />
        <span class="flex-1 text-left">{{ current.label }}</span>
        <ChevronDown :size="14" class="text-subtle-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="w-56">
      <DropdownMenuItem v-for="o in options" :key="o.value" @select="model = o.value">
        <component :is="o.icon" :size="15" />
        <span class="flex min-w-0 flex-1 flex-col">
          <span>{{ o.label }}</span>
          <span class="text-[12px] text-subtle-foreground">{{ HINT[o.value] }}</span>
        </span>
        <Check v-if="model === o.value" :size="14" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuRoot>

  <div v-else class="mms" :class="`is-${modeStyle.id}`" role="radiogroup" aria-label="Mode">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :aria-checked="model === o.value"
      :aria-label="o.label"
      :title="modeStyle.id === 'icons' ? o.label : undefined"
      class="mms-btn"
      @click="model = o.value"
    >
      <component :is="o.icon" v-if="modeStyle.id !== 'underline'" :size="15" />
      <span v-if="modeStyle.id !== 'icons'">{{ o.label }}</span>
    </button>
  </div>
</template>

<style>
/* Global: buttons, past the prototype's button reset. */
.mms {
  display: flex;
  width: 100%;
}
.mms.is-segmented {
  gap: 2px;
  padding: 3px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mms-btn {
  display: inline-flex;
  width: auto;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  color: var(--color-muted-foreground);
  font-size: 13px;
  transition:
    color 150ms ease,
    background-color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .mms-btn:hover,
:root .proto-ui.proto-ui.proto-ui .mms-btn[aria-checked='true'] {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .is-segmented .mms-btn {
  flex: 1;
  height: 28px;
  border-radius: 9px;
}
:root .proto-ui.proto-ui.proto-ui .is-segmented .mms-btn[aria-checked='true'] {
  background: color-mix(in oklch, var(--color-base-foreground) 11%, transparent);
}
.mms.is-underline {
  gap: 18px;
  padding: 0 4px;
  box-shadow: inset 0 -1px 0 color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .is-underline .mms-btn {
  height: 32px;
  border-radius: 0;
  font-weight: 500;
}
:root .proto-ui.proto-ui.proto-ui .is-underline .mms-btn[aria-checked='true'] {
  box-shadow: inset 0 -2px 0 var(--color-base-foreground);
}
.mms.is-icons {
  gap: 4px;
}
:root .proto-ui.proto-ui.proto-ui .is-icons .mms-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}
:root .proto-ui.proto-ui.proto-ui .is-icons .mms-btn[aria-checked='true'] {
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mms-menu {
  display: flex;
  width: 100%;
  height: 34px;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 12px;
  border-radius: 10px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-base-foreground);
  font-size: 13px;
  font-weight: 500;
}
:root .proto-ui.proto-ui.proto-ui .mms-menu:hover,
:root .proto-ui.proto-ui.proto-ui .mms-menu[data-state='open'] {
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
</style>
