<script setup lang="ts">
/** A titled block of a page: one axis of a component (states, menus…). */
defineProps<{ title: string; note?: string }>()
</script>

<template>
  <section class="ds-section">
    <header>
      <h2 class="ds-section-title">{{ title }}</h2>
      <p v-if="note" class="ds-section-note">{{ note }}</p>
    </header>
    <slot />
  </section>
</template>
