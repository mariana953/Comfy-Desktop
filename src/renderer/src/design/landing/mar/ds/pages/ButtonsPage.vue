<script setup lang="ts">
import { ArrowUp, Bell, Mic, Plus } from 'lucide-vue-next'
import Button from '../../../ui/Button.vue'
import Cell from '../kit/Cell.vue'
import Cells from '../kit/Cells.vue'
import Section from '../kit/Section.vue'

const VARIANTS = [
  { v: 'primary', label: 'Create', note: 'The one white CTA per surface (Create, Try it).' },
  { v: 'secondary', label: 'Invite', note: 'A lifted surface (Invite, Connect, Docs).' },
  { v: 'ghost', label: 'Credits', note: 'Rows and icon buttons: no fill until hovered.' },
  { v: 'subtle', label: 'Filter', note: 'A soft fill.' },
  { v: 'link', label: 'See all', note: 'Section links.' }
] as const
const STATES = [
  { label: 'idle', force: '' },
  { label: 'hover', force: 'hover' },
  { label: 'focus', force: 'focus' },
  { label: 'pressed', force: 'hover active' }
]
</script>

<template>
  <Section
    v-for="b in VARIANTS"
    :key="b.v"
    :title="b.v[0]!.toUpperCase() + b.v.slice(1)"
    :note="b.note"
  >
    <Cells :min="120">
      <Cell v-for="s in STATES" :key="s.label" :label="s.label" :force="s.force" target="button">
        <Button :variant="b.v">{{ b.label }}</Button>
      </Cell>
      <Cell label="disabled"
        ><Button :variant="b.v" disabled>{{ b.label }}</Button></Cell
      >
    </Cells>
  </Section>
  <Section title="Sizes and icons" note="md 32, lg 36; icon buttons are square.">
    <Cells :min="140">
      <Cell label="md · with icon"
        ><Button variant="primary"><Plus :size="14" />Create</Button></Cell
      >
      <Cell label="lg"><Button variant="primary" size="lg">Try it</Button></Cell>
      <Cell label="icon-sm · ghost"
        ><Button variant="ghost" size="icon-sm" aria-label="Dictate"><Mic :size="15" /></Button
      ></Cell>
      <Cell label="icon-sm · ghost hover" force="hover" target="button">
        <Button variant="ghost" size="icon-sm" aria-label="Notifications"
          ><Bell :size="15"
        /></Button>
      </Cell>
      <Cell label="icon · send">
        <Button variant="primary" size="icon" aria-label="Send" class="rounded-full!"
          ><ArrowUp :size="15"
        /></Button>
      </Cell>
    </Cells>
  </Section>
</template>
