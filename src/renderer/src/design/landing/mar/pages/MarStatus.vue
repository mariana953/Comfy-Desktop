<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, ArrowUpCircle, Clock, Loader2, Users } from 'lucide-vue-next'

/**
 * One item's state, as a small pill (Mar's pages). Running and Live
 * breathe; Failed is the only red; Draft and Paused stay quiet.
 */
export type ItemStatus =
  | 'running'
  | 'queued'
  | 'failed'
  | 'draft'
  | 'shared'
  | 'live'
  | 'paused'
  | 'stopped'
  | 'launching'
  | 'update'
  | 'changes'

const { status, label, onMedia } = defineProps<{
  status: ItemStatus
  /** Overrides the default word, e.g. "Queued · 2nd". */
  label?: string
  /** Sits on a picture: dark glass instead of a tint. */
  onMedia?: boolean
}>()

const WORDS: Record<ItemStatus, string> = {
  running: 'Running',
  queued: 'Queued',
  failed: 'Failed',
  draft: 'Draft',
  shared: 'Shared',
  live: 'Live',
  paused: 'Paused',
  stopped: 'Stopped',
  launching: 'Starting',
  update: 'Update',
  changes: 'Unpublished changes'
}
const tone = computed(() =>
  status === 'running' || status === 'live'
    ? 'is-go'
    : status === 'failed'
      ? 'is-bad'
      : status === 'update' || status === 'changes'
        ? 'is-warn'
        : 'is-quiet'
)
</script>

<template>
  <span class="mar-status" :class="[tone, onMedia && 'on-media']">
    <Loader2 v-if="status === 'launching'" :size="11" class="animate-spin" />
    <Clock v-else-if="status === 'queued'" :size="11" />
    <AlertTriangle v-else-if="status === 'failed'" :size="11" />
    <Users v-else-if="status === 'shared'" :size="11" />
    <ArrowUpCircle v-else-if="status === 'update'" :size="11" />
    <i v-else-if="status !== 'draft'" class="mar-status-dot" />
    {{ label ?? WORDS[status] }}
  </span>
</template>

<style scoped>
.mar-status {
  display: inline-flex;
  height: 20px;
  flex-shrink: 0;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-muted-foreground);
}
.mar-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}
.is-go {
  background: color-mix(in oklch, var(--color-status-running) 14%, transparent);
  color: var(--color-status-running);
}
.is-go .mar-status-dot {
  animation: mar-breathe 1.6s ease-in-out infinite;
}
.is-bad {
  background: color-mix(in oklch, var(--color-status-danger) 16%, transparent);
  color: var(--color-status-danger);
}
.is-warn {
  background: color-mix(in oklch, oklch(0.8 0.14 75) 15%, transparent);
  color: oklch(0.8 0.14 75);
}
.on-media {
  background: var(--color-media-overlay);
  backdrop-filter: blur(12px);
}
.on-media.is-quiet {
  color: rgb(255 255 255 / 0.88);
}
@keyframes mar-breathe {
  50% {
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .is-go .mar-status-dot {
    animation: none;
  }
}
</style>
