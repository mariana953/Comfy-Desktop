<script setup lang="ts">
import CreateHome from '../pages/modes/CreateHome.vue'
import MarHome from './MarHome.vue'
import { isMariana } from './proposal'

/** Home for the picked proposal: Mariana's, or Pablo's untouched. */
</script>

<template>
  <MarHome v-if="isMariana" />
  <CreateHome v-else />
</template>
