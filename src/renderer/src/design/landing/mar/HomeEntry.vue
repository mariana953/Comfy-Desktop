<script setup lang="ts">
import CreateHome from '../pages/modes/CreateHome.vue'
import MarHome from './MarHome.vue'
import { isMariana, marVersion } from './proposal'

/** Home for the picked proposal: a version of Mariana's, or Pablo's untouched. */
</script>

<template>
  <MarHome v-if="isMariana" :version="marVersion" />
  <CreateHome v-else />
</template>
