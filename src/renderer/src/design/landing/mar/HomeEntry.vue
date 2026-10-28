<script setup lang="ts">
import CreateHome from '../pages/modes/CreateHome.vue'
import MarHome from './MarHome.vue'
import MarHomeV10 from './MarHomeV10.vue'
import { parts } from './marParts'
import { isMariana } from './proposal'

/** Home for the picked proposal: Mar's (on Pablo's v10 content, or her
 *  earlier draft), or Pablo's untouched. */
</script>

<template>
  <template v-if="isMariana">
    <MarHome v-if="parts.home === 'draft'" />
    <MarHomeV10 v-else />
  </template>
  <CreateHome v-else />
</template>
