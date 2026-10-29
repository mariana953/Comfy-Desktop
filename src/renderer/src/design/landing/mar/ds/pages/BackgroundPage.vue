<script setup lang="ts">
import MarBackdrop from '../../shell/MarBackdrop.vue'
import Section from '../kit/Section.vue'
import Window from '../kit/Window.vue'
</script>

<template>
  <Section
    title="Home spotlight"
    note="One soft light from above, carried down the page and fading; a faint lavender light in light mode. Painted on the page, so it has no edges."
  >
    <Window :height="640">
      <div class="proto-main relative m-0! size-full overflow-hidden">
        <MarBackdrop />
        <div class="h-[900px]" />
      </div>
    </Window>
  </Section>
</template>
