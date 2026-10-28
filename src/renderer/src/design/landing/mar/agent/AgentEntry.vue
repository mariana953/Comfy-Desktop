<script setup lang="ts">
import AppAgent from '../../parts/apps/AppAgent.vue'
import MarAgent from './MarAgent.vue'
import { isMariana } from '../proposal'

/** The Agent page for the picked proposal: Mar's chat, or Pablo's. */
</script>

<template>
  <MarAgent v-if="isMariana" />
  <AppAgent v-else />
</template>
