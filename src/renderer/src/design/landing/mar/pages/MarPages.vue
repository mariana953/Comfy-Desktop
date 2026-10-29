<script setup lang="ts">
import { computed } from 'vue'
import { proto } from '../../useProto'
import MarWorkflowsPage from './MarWorkflowsPage.vue'

/**
 * Mar's library pages (Workflows, Apps, Assets, Builds, Projects, Spaces,
 * Settings), each with its states. ModePages hands these pages here in
 * Mar's proposal; Pablo's stay as they are in his.
 */
const page = computed(() => proto.page)
</script>

<template>
  <MarWorkflowsPage v-if="page === 'workflows'" />
</template>
