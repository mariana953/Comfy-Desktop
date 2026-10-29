<script setup lang="ts">
import BuildStart from '../../pages/modes/BuildStart.vue'
import MarBuildStart from './MarBuildStart.vue'
import { isMariana } from '../proposal'

/** Build's Get started for the picked proposal: Mar's, or Pablo's untouched. */
</script>

<template>
  <MarBuildStart v-if="isMariana" />
  <BuildStart v-else />
</template>
