<script setup lang="ts">
import CreateHome from '../pages/modes/CreateHome.vue'
import MarHomeV10 from './MarHomeV10.vue'
import { isMariana } from './proposal'

/** Home for the picked proposal: Mar's draft (marParts.ts), or Pablo's
 *  untouched. */
</script>

<template>
  <MarHomeV10 v-if="isMariana" />
  <CreateHome v-else />
</template>
