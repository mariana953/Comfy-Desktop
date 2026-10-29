<script setup lang="ts">
import RouterPage from '../../pages/modes/RouterPage.vue'
import MarModelsPage from './MarModelsPage.vue'
import { isMariana } from '../proposal'

/** Build > Models for the picked proposal: Mar's library, or Pablo's Router list. */
</script>

<template>
  <MarModelsPage v-if="isMariana" />
  <RouterPage v-else />
</template>
