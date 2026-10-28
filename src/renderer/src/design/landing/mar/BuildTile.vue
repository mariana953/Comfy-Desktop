<script setup lang="ts">
import { computed } from 'vue'
import LocationIcon from '../ui/LocationIcon.vue'
import { envKind } from '../parts/env/env'
import { hostActions } from '../useProto'
import type { ProtoInstance } from '../mock'

/** A build to launch, as a tile: where it runs and its state on top, the
 *  name and where it lives below. */
const { inst } = defineProps<{ inst: ProtoInstance }>()

const where = computed(
  () => ({ local: 'This computer', managed: 'Always on', cloud: 'Comfy Cloud' })[envKind(inst)]
)
const state = computed(() => {
  if (inst.state === 'update') return { label: 'Update', live: false }
  if (inst.state === 'running' || envKind(inst) === 'managed')
    return { label: 'Running', live: true }
  return { label: 'Stopped', live: false }
})
</script>

<template>
  <button
    type="button"
    class="group flex min-w-0 flex-col gap-5 rounded-card bg-white/5 p-4 text-left outline-none backdrop-blur-xl transition-colors hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-border-focus"
    @click="hostActions.launch(inst)"
  >
    <span class="flex items-start justify-between">
      <span class="flex size-9 items-center justify-center rounded-control bg-secondary-background">
        <LocationIcon :kind="inst.kind === 'cloud' ? 'cloud' : 'local'" :size="16" />
      </span>
      <span
        :class="[
          'inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-ui font-medium',
          state.live
            ? 'bg-status-running/15 text-status-running'
            : 'bg-secondary-background text-muted-foreground'
        ]"
      >
        <span v-if="state.live" class="size-1.5 rounded-full bg-status-running" />{{ state.label }}
      </span>
    </span>
    <span class="min-w-0">
      <span class="block truncate text-ui font-medium">{{ inst.name }}</span>
      <span class="block truncate text-ui text-subtle-foreground">{{ where }}</span>
    </span>
  </button>
</template>
