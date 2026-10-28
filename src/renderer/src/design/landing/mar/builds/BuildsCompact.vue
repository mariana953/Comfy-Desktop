<script setup lang="ts">
import type { ProtoInstance } from '../../mock'
import StatusDot from '../../ui/StatusDot.vue'
import InstanceGlyph from '../../parts/InstanceGlyph.vue'
import EnvLaunchButton from '../../parts/env/EnvLaunchButton.vue'
import { envKind, envStatus } from '../../parts/env/env'
import { go } from '../../useProto'

/** Builds, summarised (Mar's proposal): one line each with what you need
 *  to decide: is it on, where it runs, what's in it, and Open. */
defineProps<{ list: ProtoInstance[] }>()
</script>

<template>
  <div class="mar-bc">
    <div
      v-for="e in list"
      :key="e.id"
      role="button"
      tabindex="0"
      class="mar-bc-row"
      @click="go(`environment:${e.id}`)"
      @keydown.enter="go(`environment:${e.id}`)"
    >
      <InstanceGlyph :inst="e" size="sm" />
      <span class="min-w-0 flex-1 truncate text-ui font-medium text-base-foreground">{{
        e.name
      }}</span>
      <span class="mar-bc-status">
        <StatusDot :status="envStatus(e).live ? 'running' : 'idle'" />{{ envStatus(e).label }}
      </span>
      <span class="mar-bc-meta">{{ e.kind === 'cloud' ? 'Comfy Cloud' : 'This computer' }}</span>
      <span class="mar-bc-meta">{{
        envKind(e) === 'managed' ? 'Every model' : `${e.models ?? 0} models · ${e.nodes ?? 0} nodes`
      }}</span>
      <EnvLaunchButton :env="e" size="sm" @click.stop />
    </div>
  </div>
</template>

<style scoped>
.mar-bc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mar-bc-row {
  display: flex;
  height: 48px;
  align-items: center;
  gap: 14px;
  padding: 0 8px 0 12px;
  border-radius: 12px;
  cursor: pointer;
  outline: none;
  transition: background-color 150ms ease;
}
.mar-bc-row:hover,
.mar-bc-row:focus-visible {
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
.mar-bc-status {
  display: inline-flex;
  width: 120px;
  align-items: center;
  gap: 6px;
  color: var(--color-muted-foreground);
  font-size: 13px;
}
.mar-bc-meta {
  width: 150px;
  overflow: hidden;
  color: var(--color-subtle-foreground);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
