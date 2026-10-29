<script setup lang="ts">
import { computed } from 'vue'
import { Plus, ReceiptText } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import DropdownMenuContent from '../ui/DropdownMenuContent.vue'
import DropdownMenuItem from '../ui/DropdownMenuItem.vue'
import { go, toast } from '../useProto'
import { shownCredits, shownWorkspace as workspace } from '../account'

/**
 * What opens from the Credits row in Mar's proposal: Alex Tov's credits
 * flyout (Figma "Credits flyout — states", FRONT-3644), Active state. The
 * plan pool with its bar and refill date on top, the top-up pool below,
 * then the actions. The row keeps the total; Add credits is owners only.
 * Numbers follow the prototype's Billing page: 9,800 of 20,000 used,
 * renews Nov 1, so the rest of the balance is top-up.
 */
const { side = 'right', align = 'end' } = defineProps<{
  side?: 'top' | 'right' | 'bottom'
  align?: 'start' | 'end'
}>()

const PLAN_TOTAL = 20000
const PLAN_LEFT = 10200
const fmt = (n: number): string => n.toLocaleString('en-US')

const topUp = computed(() =>
  Math.max(0, Number(String(shownCredits.value ?? '0').replace(/,/g, '')) - PLAN_LEFT)
)
// What is left of the plan pool, in 25% steps.
const planBar = computed(() => `${Math.round((PLAN_LEFT / PLAN_TOTAL) * 4) * 25}%`)
const canTopUp = computed(() => workspace.value.role?.toUpperCase() !== 'MEMBER')
</script>

<template>
  <DropdownMenuRoot :modal="false">
    <DropdownMenuTrigger as-child><slot /></DropdownMenuTrigger>
    <DropdownMenuContent :side :align :side-offset="8" class="mar-cf w-64">
      <!-- Both pools are the flyout's raised panel (mar/menus/layers.css). -->
      <div class="mar-menu-panel">
        <div class="mar-cf-pool">
          <span class="mar-cf-line">
            <span>Plan credits</span>
            <span class="tabular-nums"
              ><span class="font-medium text-base-foreground">{{ fmt(PLAN_LEFT) }}</span> of
              {{ fmt(PLAN_TOTAL) }}</span
            >
          </span>
          <span class="mar-cf-bar"><span :style="{ width: planBar }" /></span>
          <span class="mar-cf-note">Refills November 1</span>
        </div>
        <div class="mar-cf-pool">
          <span class="mar-cf-line">
            <span>Top-up credits</span>
            <span class="font-medium text-base-foreground tabular-nums">{{ fmt(topUp) }}</span>
          </span>
        </div>
      </div>
      <DropdownMenuItem v-if="canTopUp" @select="toast('Add credits')">
        <Plus :size="15" class="text-subtle-foreground" />Add credits
      </DropdownMenuItem>
      <DropdownMenuItem @select="go('billing')">
        <ReceiptText :size="15" class="text-subtle-foreground" />Billing settings
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>

<style>
/* Global: the flyout is portalled to <body>. */
.mar-cf .mar-cf-pool {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}
.mar-cf .mar-cf-pool + .mar-cf-pool {
  border-top: 1px solid color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
}
.mar-cf .mar-cf-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: var(--color-subtle-foreground);
  font-size: var(--text-ui);
}
.mar-cf .mar-cf-bar {
  display: block;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
.mar-cf .mar-cf-bar > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-base-foreground);
}
.mar-cf .mar-cf-note {
  color: var(--color-subtle-foreground);
  font-size: 12px;
}
</style>
