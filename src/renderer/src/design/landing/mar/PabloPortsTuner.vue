<script setup lang="ts">
import Switch from '../ui/Switch.vue'
import { PORTS, ports } from './pabloPorts'

/** UI Playground › From Pablo: one switch per feature of Pablo's that
 *  Mar's proposal now has a version of. All Off by default. */
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-ui text-subtle-foreground">From Pablo</span>
    <Switch v-for="p in PORTS" :key="p.key" v-model="ports[p.key]" :label="p.label" />
  </div>
</template>
