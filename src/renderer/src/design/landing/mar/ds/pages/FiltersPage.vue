<script setup lang="ts">
import { ref } from 'vue'
import SegmentedControl from '../../../ui/SegmentedControl.vue'
import Cell from '../kit/Cell.vue'
import Cells from '../kit/Cells.vue'
import Section from '../kit/Section.vue'

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'local', label: 'This computer' },
  { value: 'cloud', label: 'Cloud' }
]
const picked = ref('all')
</script>

<template>
  <Section
    title="Scope tabs"
    note="A soft track, no border; the picked tab a step lighter. Squared to match buttons: track 10 around 3, tab 7."
  >
    <Cells :min="300">
      <Cell label="idle"
        ><SegmentedControl v-model="picked" :options="OPTIONS" variant="contained"
      /></Cell>
      <Cell label="tab hover" force="hover" target="button:nth-of-type(2)">
        <SegmentedControl v-model="picked" :options="OPTIONS" variant="contained" />
      </Cell>
      <Cell label="tab focus" force="focus" target="button:nth-of-type(2)">
        <SegmentedControl v-model="picked" :options="OPTIONS" variant="contained" />
      </Cell>
    </Cells>
  </Section>
</template>
