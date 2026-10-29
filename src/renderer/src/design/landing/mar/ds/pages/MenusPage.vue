<script setup lang="ts">
import Cells from '../kit/Cells.vue'
import Section from '../kit/Section.vue'
import Stage from '../kit/Stage.vue'
</script>

<template>
  <Section title="Create" note="Top right of Home. Idle, then with a row highlighted.">
    <Cells :min="300">
      <Stage id="create-menu" label="open" />
      <Stage id="create-menu-hover" label="row highlighted" />
    </Cells>
  </Section>
  <Section title="Workspace" note="From the sidebar's foot, upwards.">
    <Cells :min="300">
      <Stage id="workspace-menu" label="open" />
      <Stage id="workspace-menu-hover" label="row highlighted" />
    </Cells>
  </Section>
  <Section
    title="Run on and build switch"
    note="The prompt's build picker and the title bar's switcher."
  >
    <Cells :min="520">
      <Stage id="run-on-menu" label="Run on" />
      <Stage id="build-switch" label="build switch" />
    </Cells>
  </Section>
</template>
