<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, Play, Plus, Rocket } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger } from 'reka-ui'
import Button from '../ui/Button.vue'
import DropdownMenuContent from '../ui/DropdownMenuContent.vue'
import DropdownMenuItem from '../ui/DropdownMenuItem.vue'
import { activeInstance, deployEnv, hostActions, instances, proto } from '../useProto'
import { can } from '../milestones'

/** One Create button, top right; what used to be separate buttons (open
 *  ComfyUI, deploy) are its menu. Deploy shows once the Builder exists and
 *  there is a local build to deploy. */
const deployable = computed(
  () =>
    can.value.builder &&
    proto.signedIn &&
    instances.value.find((i) => !i.deployment && i.kind === 'local')
)

function deploy(): void {
  const target = activeInstance.value.kind === 'local' ? activeInstance.value : deployable.value
  if (target) deployEnv(target.id)
}
</script>

<template>
  <DropdownMenuRoot :modal="false">
    <DropdownMenuTrigger as-child>
      <Button variant="primary" class="group gap-1.5 pr-2">
        <Plus :size="14" />Create
        <ChevronDown
          :size="14"
          class="text-inverted-foreground/60 transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-60">
      <DropdownMenuItem @select="hostActions.launch(activeInstance)">
        <Play :size="14" />
        <span class="flex-1">Open ComfyUI</span>
        <span class="text-subtle-foreground">{{ activeInstance.name }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem v-if="deployable" @select="deploy">
        <Rocket :size="14" />Deploy as an API
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenuRoot>
</template>
