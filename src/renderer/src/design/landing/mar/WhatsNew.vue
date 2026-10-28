<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpRight, Box, Sparkles } from 'lucide-vue-next'
import Badge from '../ui/Badge.vue'
import Button from '../ui/Button.vue'
import Card from '../ui/Card.vue'
import ScrollRow from '../ui/ScrollRow.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import MediaChip from './MediaChip.vue'
import { toast } from '../useProto'
import { LAUNCHES } from '../mock'

/** Mar's take on Pablo's What's new (parts/LaunchesRow.vue): the tabs say
 *  what they hold, so there is no section title, and the chip on each card
 *  is the DS · Mar media chip. */
const tab = ref<'model' | 'feature'>('model')
const list = computed(() => (tab.value === 'model' ? LAUNCHES : [...LAUNCHES].reverse()))
</script>

<template>
  <section class="mt-10">
    <div class="mb-3.5 flex items-center gap-3">
      <SegmentedControl
        v-model="tab"
        variant="contained"
        :options="[
          { value: 'model', label: 'Latest models', icon: Box },
          { value: 'feature', label: 'New features', icon: Sparkles }
        ]"
      />
      <Button variant="link" size="sm" class="ml-auto" @click="toast('All launches')">
        All launches<ArrowUpRight :size="13" />
      </Button>
    </div>
    <ScrollRow :columns="2.6" :min="300">
      <Card
        v-for="l in list"
        :key="l.title"
        as="button"
        interactive
        class="group relative aspect-video overflow-hidden text-left"
        @click="toast(`Try ${l.title}`)"
      >
        <video
          v-if="l.video"
          :src="l.video"
          autoplay
          muted
          loop
          playsinline
          class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span
          class="absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.25),transparent_40%,rgb(0_0_0/0.45))]"
        />
        <MediaChip :icon="tab === 'model' ? Box : Sparkles" class="absolute top-3 left-3">
          {{ tab === 'model' ? 'Model' : 'Feature' }}
        </MediaChip>
        <span
          class="absolute top-1/2 left-4 -translate-y-1/2 text-[22px] font-bold drop-shadow-lg"
          >{{ l.title }}</span
        >
        <Badge variant="solid" size="sm" class="absolute bottom-3 left-3 font-semibold"
          >Try it now</Badge
        >
      </Card>
    </ScrollRow>
  </section>
</template>
