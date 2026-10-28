<script setup lang="ts">
import { LayoutGrid, List, Minus, Plus, Square, SlidersHorizontal } from 'lucide-vue-next'
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { assetView, type AssetLayout, type AssetSize } from './assetView'

/** The View menu (Assets, Mar's proposal): layout, size and whether the
 *  name and details show under each picture. */
const LAYOUTS: { value: AssetLayout; label: string; icon: unknown }[] = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid },
  { value: 'square', label: 'Square', icon: Square },
  { value: 'list', label: 'List', icon: List }
]
const SIZES: AssetSize[] = ['s', 'm', 'l']
function step(d: number): void {
  const i = SIZES.indexOf(assetView.size) + d
  if (i >= 0 && i < SIZES.length) assetView.size = SIZES[i]!
}
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <button type="button" class="mar-view-trigger" aria-label="View options">
        <SlidersHorizontal :size="14" />View
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent align="end" :side-offset="8" class="proto-ui mar-view" role="dialog">
        <p class="mar-view-label">Layout</p>
        <div class="mar-view-layouts">
          <button
            v-for="l in LAYOUTS"
            :key="l.value"
            type="button"
            :aria-pressed="assetView.layout === l.value"
            class="mar-view-layout"
            @click="assetView.layout = l.value"
          >
            <component :is="l.icon" :size="16" />{{ l.label }}
          </button>
        </div>

        <div class="mar-view-row" :class="assetView.layout === 'list' && 'is-off'">
          <span class="mar-view-label">Size</span>
          <span class="flex items-center gap-2">
            <button type="button" class="mar-view-step" aria-label="Smaller" @click="step(-1)">
              <Minus :size="13" />
            </button>
            <span class="mar-view-track">
              <i
                v-for="s in SIZES"
                :key="s"
                :class="SIZES.indexOf(s) <= SIZES.indexOf(assetView.size) && 'is-on'"
              />
            </span>
            <button type="button" class="mar-view-step" aria-label="Bigger" @click="step(1)">
              <Plus :size="13" />
            </button>
          </span>
        </div>

        <label class="mar-view-row">
          <span class="mar-view-label">Name and details</span>
          <input v-model="assetView.details" type="checkbox" class="mar-view-switch" />
        </label>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
/* Global: portalled, and buttons go past the prototype's button reset. */
:root .proto-ui.proto-ui.proto-ui .mar-view-trigger {
  display: inline-flex;
  width: auto;
  height: 34px;
  align-items: center;
  gap: 7px;
  padding: 0 14px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-base-foreground);
  font-size: 13px;
}
:root .proto-ui.proto-ui.proto-ui .mar-view-trigger:hover,
:root .proto-ui.proto-ui.proto-ui .mar-view-trigger[data-state='open'] {
  background: color-mix(in oklch, var(--color-base-foreground) 11%, transparent);
}
.mar-view {
  z-index: 60;
  display: flex;
  width: 280px;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: color-mix(
    in oklch,
    color-mix(in oklch, var(--color-base-foreground) 6%, var(--color-card-background)) 92%,
    transparent
  );
  backdrop-filter: blur(28px) saturate(1.3);
  box-shadow: 0 20px 60px -20px rgb(0 0 0 / 0.6);
  color: var(--color-base-foreground);
}
.mar-view-label {
  color: var(--color-muted-foreground);
  font-size: 13px;
}
.mar-view-layouts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  margin-top: -6px;
  padding: 3px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mar-view-layout {
  display: flex;
  width: auto;
  height: 56px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  border-radius: 9px;
  color: var(--color-muted-foreground);
  font-size: 12px;
}
:root .proto-ui.proto-ui.proto-ui .mar-view-layout[aria-pressed='true'] {
  background: color-mix(in oklch, var(--color-base-foreground) 11%, transparent);
  color: var(--color-base-foreground);
}
.mar-view-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mar-view-row.is-off {
  opacity: 0.4;
  pointer-events: none;
}
:root .proto-ui.proto-ui.proto-ui .mar-view-step {
  display: inline-flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  color: var(--color-muted-foreground);
}
.mar-view-track {
  display: flex;
  gap: 3px;
}
.mar-view-track i {
  width: 22px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 12%, transparent);
}
.mar-view-track i.is-on {
  background: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui .mar-view-switch {
  position: relative;
  display: block;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
  border: 0;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 14%, transparent);
  appearance: none;
  cursor: pointer;
  transition: background-color 150ms ease;
}
.mar-view-switch::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--color-base-foreground);
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
:root .proto-ui.proto-ui.proto-ui .mar-view-switch:checked {
  background: var(--color-base-foreground);
}
.mar-view-switch:checked::after {
  background: var(--color-content-background);
  transform: translateX(14px);
}
</style>
