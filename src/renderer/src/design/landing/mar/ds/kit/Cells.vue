<script setup lang="ts">
/** A row of equal cells, one per state, wrapping when narrow. */
const { min = 160 } = defineProps<{ min?: number }>()
</script>

<template>
  <div class="ds-cells" :style="{ '--cell-min': `${min}px` }"><slot /></div>
</template>
