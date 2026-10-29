<script setup lang="ts">
import LaunchBanner from '../../LaunchBanner.vue'
import Cell from '../kit/Cell.vue'
import Cells from '../kit/Cells.vue'
import Section from '../kit/Section.vue'
</script>

<template>
  <Section
    title="What's new"
    note="Video loops with the dots inside the banner. Live: it advances on its own; hover pauses it, a dot jumps."
  >
    <Cells :min="560">
      <Cell label="playing" fill><LaunchBanner /></Cell>
      <Cell
        label="hover · paused"
        fill
        force="hover"
        target="section, [class*='rounded']:first-child"
      >
        <LaunchBanner />
      </Cell>
      <Cell label="Try it hover" fill force="hover" target="button">
        <LaunchBanner />
      </Cell>
    </Cells>
  </Section>
</template>
