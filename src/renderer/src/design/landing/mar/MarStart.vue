<script setup lang="ts">
import { computed } from 'vue'
import { firstRun } from './firstRun'
import MarStartOriginal from './MarStartOriginal.vue'
import MarStartReel from './MarStartReel.vue'
import MarStartStage from './MarStartStage.vue'

/** First run in Mar's proposal: the Home a brand-new user gets, before any
 *  local install. The version comes from UI Playground › First run. */
const VIEWS = { stage: MarStartStage, reel: MarStartReel, original: MarStartOriginal }
const view = computed(() => VIEWS[firstRun.id])
</script>

<template>
  <component :is="view" />
</template>
