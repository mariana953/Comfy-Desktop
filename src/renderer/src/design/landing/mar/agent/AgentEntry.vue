<script setup lang="ts">
import AppAgent from '../../parts/apps/AppAgent.vue'
import MarAgent from './MarAgent.vue'
import { parts } from '../marParts'
import { isMariana } from '../proposal'

/** The Agent page for the picked proposal: Mar's chat on Mar draft,
 *  Pablo's everywhere else (his v10 included). */
</script>

<template>
  <MarAgent v-if="isMariana && parts.home === 'draft'" />
  <AppAgent v-else />
</template>
