<script setup lang="ts">
import { computed } from 'vue'
import { Bell, ChevronLeft, ChevronRight, Lock, Plus, RotateCw, X } from 'lucide-vue-next'
import ComfyCLogo from '../../../../components/icons/ComfyCLogo.vue'
import { proto, workspace } from '../../useProto'

/**
 * Comfy Cloud in a browser (Surface: Comfy Cloud): the browser's tab and
 * address bar on top, then the app's own bar one level below, where the
 * desktop app has its title bar. A stand-in for the preview only.
 */
const TITLES: Record<string, string> = {
  overview: 'Home',
  explore: 'Explore',
  tutorials: 'Learn',
  workflows: 'Workflows',
  apps: 'Apps',
  assets: 'Assets',
  agent: 'Agent',
  'build-overview': 'Build'
}
const title = computed(() => TITLES[proto.page] ?? 'Comfy Cloud')
const path = computed(() => (proto.page === 'overview' ? 'home' : proto.page.replace(':', '/')))
</script>

<template>
  <div class="mar-cloud-bar" aria-label="Browser (preview)">
    <!-- Browser tabs. -->
    <div class="flex h-10 items-end gap-2 px-3">
      <span class="mb-3 flex gap-2" aria-hidden="true">
        <span class="size-3 rounded-full bg-[#ff5f57]" /><span
          class="size-3 rounded-full bg-[#febc2e]"
        /><span class="size-3 rounded-full bg-[#28c840]" />
      </span>
      <span class="mar-cloud-tab">
        <ComfyCLogo class="size-3.5" />
        <span class="truncate">{{ title }} · Comfy Cloud</span>
        <X :size="12" class="ml-auto text-subtle-foreground" />
      </span>
      <Plus :size="14" class="mb-2.5 text-subtle-foreground" />
    </div>
    <!-- Address bar. -->
    <div class="mar-cloud-url">
      <ChevronLeft :size="15" /><ChevronRight :size="15" class="opacity-50" /><RotateCw
        :size="13"
      />
      <span class="mar-cloud-field"
        ><Lock :size="11" />cloud.comfy.org/<span class="text-base-foreground">{{
          path
        }}</span></span
      >
    </div>
    <!-- The app's bar, one level below the browser's. -->
    <div class="mar-cloud-app">
      <ComfyCLogo class="size-5" />
      <span class="text-ui font-medium">Comfy Cloud</span>
      <span class="text-ui text-subtle-foreground">/ {{ title }}</span>
      <span class="ml-auto flex items-center gap-3 text-muted-foreground">
        <span class="text-ui">13,853 credits</span>
        <Bell :size="15" />
        <span class="mar-cloud-avatar">{{ workspace.name.charAt(0) }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.mar-cloud-bar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 45;
  background: var(--color-titlebar-background);
  -webkit-app-region: no-drag;
}
.mar-cloud-tab {
  display: flex;
  width: 240px;
  height: 32px;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 10px 10px 0 0;
  background: color-mix(
    in oklch,
    var(--color-base-foreground) 7%,
    var(--color-titlebar-background)
  );
  color: var(--color-base-foreground);
  font-size: 12px;
}
.mar-cloud-url {
  display: flex;
  height: 38px;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: color-mix(
    in oklch,
    var(--color-base-foreground) 7%,
    var(--color-titlebar-background)
  );
  color: var(--color-muted-foreground);
}
.mar-cloud-field {
  display: flex;
  flex: 1;
  height: 26px;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-subtle-foreground);
  font-size: 12px;
}
.mar-cloud-app {
  display: flex;
  height: 44px;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
.mar-cloud-avatar {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 14%, transparent);
  color: var(--color-base-foreground);
  font-size: 12px;
  font-weight: 600;
}
</style>
