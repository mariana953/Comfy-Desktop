<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import { cn } from '../../ui/cn'
import { go, proto } from '../../useProto'
import { favoriteItems } from '../favoriteItems'
import MarGroupTitle from './MarGroupTitle.vue'

/** Favorites in the sidebar (Mar's proposal), rescued from her usertest-home
 *  prototype: what you starred, one click away, right under the libraries
 *  it comes from. The title opens the whole page; a new star slides in. */
const MAX = 5
const rows = computed(() => favoriteItems.value.slice(0, MAX))
const more = computed(() => favoriteItems.value.length - rows.value.length)
const itemClass = 'h-8 w-full justify-start gap-2.5 px-3 text-ui font-normal'
</script>

<template>
  <div class="mt-5.5 flex shrink-0 flex-col">
    <div class="flex h-6.5 items-center justify-between pr-1 pl-3">
      <MarGroupTitle title="Favorites" :active="proto.page === 'favorites'" @click="go('favorites')" />
    </div>

    <TransitionGroup name="mar-fav">
      <Button
        v-for="f in rows"
        :key="f.key"
        variant="ghost"
        :class="itemClass"
        @click="f.open()"
      >
        <img v-if="f.src" :src="f.src" alt="" class="mar-fav-thumb" />
        <Star v-else :size="15" />
        <span class="sidebar-label text-left">{{ f.title }}</span>
      </Button>
    </TransitionGroup>

    <Button
      v-if="more > 0"
      variant="ghost"
      :class="cn(itemClass, 'text-subtle-foreground')"
      @click="go('favorites')"
    >
      <span class="mar-fav-thumb is-more" aria-hidden="true" />
      <span class="sidebar-label text-left">{{ more }} more</span>
    </Button>

    <!-- Empty: say what lands here instead of hiding the group. -->
    <p v-if="!rows.length" class="flex h-8 items-center gap-2.5 px-3 text-ui text-subtle-foreground">
      <Star :size="15" />Star a card to keep it here
    </p>
  </div>
</template>

<style>
.mar-fav-thumb {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  object-fit: cover;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.08);
}
.mar-fav-thumb.is-more {
  background: var(--color-secondary-background-hover);
}
.mar-fav-enter-active {
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}
.mar-fav-leave-active {
  transition: opacity 150ms ease;
}
.mar-fav-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.mar-fav-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .mar-fav-enter-active {
    transition: opacity 150ms ease;
  }
  .mar-fav-enter-from {
    transform: none;
  }
}
</style>
