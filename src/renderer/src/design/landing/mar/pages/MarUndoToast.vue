<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { dismiss, runUndo, undoToast } from './undo'

/** The toast at the foot of Mar's pages: what just happened, and Undo. */
</script>

<template>
  <Transition name="mar-undo">
    <div v-if="undoToast.message" :key="undoToast.key" class="mar-undo" role="status">
      <span class="truncate">{{ undoToast.message }}</span>
      <button v-if="undoToast.undo" type="button" class="mar-undo-btn" @click="runUndo">
        Undo
      </button>
      <button type="button" class="mar-undo-x" aria-label="Dismiss" @click="dismiss">
        <X :size="13" />
      </button>
    </div>
  </Transition>
</template>

<style>
:root .proto-ui.proto-ui.proto-ui .mar-undo {
  position: fixed;
  bottom: 24px;
  left: 50%;
  z-index: 60;
  display: flex;
  max-width: min(520px, calc(100vw - 48px));
  height: 40px;
  align-items: center;
  gap: 12px;
  padding: 0 6px 0 16px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-inverted-background) 94%, transparent);
  color: var(--color-inverted-foreground);
  font-size: 13px;
  box-shadow: 0 16px 40px -12px rgb(0 0 0 / 0.5);
  transform: translateX(-50%);
}
:root .proto-ui.proto-ui.proto-ui .mar-undo-btn {
  width: auto;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  color: var(--color-inverted-foreground);
  font-weight: 600;
}
:root .proto-ui.proto-ui.proto-ui .mar-undo-btn:hover,
:root .proto-ui.proto-ui.proto-ui .mar-undo-x:hover {
  background: color-mix(in oklch, var(--color-inverted-foreground) 9%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mar-undo-x {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 8px;
  color: color-mix(in oklch, var(--color-inverted-foreground) 60%, transparent);
}
.mar-undo-enter-active,
.mar-undo-leave-active {
  transition:
    opacity 200ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-undo-enter-from,
.mar-undo-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px);
}
</style>
