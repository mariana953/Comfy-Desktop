<script setup lang="ts">
import ExplorePage from '../../pages/ExplorePage.vue'
import MarExplore from './MarExplore.vue'
import MarStateGate from '../pages/MarStateGate.vue'
import { isMariana } from '../proposal'

/** Explore for the picked proposal: Mar's (with its Loading and Error
 *  states), or Pablo's untouched. */
</script>

<template>
  <MarStateGate
    v-if="isMariana"
    title="Explore"
    error-title="Can't load Explore"
    error-text="Templates, models and tutorials come from the internet. Your own workflows are still in Workflows."
  >
    <MarExplore />
  </MarStateGate>
  <ExplorePage v-else />
</template>
