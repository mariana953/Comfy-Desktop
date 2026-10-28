<script setup lang="ts">
import BuildOverview from '../../pages/modes/BuildOverview.vue'
import MarBuildOverview from './MarBuildOverview.vue'
import { isMariana } from '../proposal'

/** Build's overview for the picked proposal: Mar's, or Pablo's untouched. */
</script>

<template>
  <MarBuildOverview v-if="isMariana" />
  <BuildOverview v-else />
</template>
