<script setup lang="ts">
import { LogIn } from 'lucide-vue-next'
import { hostActions } from '../../useProto'

/** Signed out, in place of the workspace at the sidebar's foot: Pablo's
 *  SignInCard (From Pablo › Account), restyled. On the rail it's one icon. */
const { open = true } = defineProps<{ open?: boolean }>()
</script>

<template>
  <div v-if="open" class="mar-signin">
    <p class="font-medium text-base-foreground">Log in to Comfy</p>
    <p class="mt-0.5 text-subtle-foreground">Sync your work, use Cloud.</p>
    <button type="button" class="mar-signin-btn" @click="hostActions.signIn()">Log in</button>
  </div>
  <button
    v-else
    type="button"
    class="mar-signin-icon"
    aria-label="Log in"
    title="Log in"
    @click="hostActions.signIn()"
  >
    <LogIn :size="16" />
  </button>
</template>

<style scoped>
.mar-signin {
  padding: 12px;
  border-radius: 14px;
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
  font-size: var(--text-ui);
}
:root .proto-ui.proto-ui.proto-ui .mar-signin-btn {
  display: flex;
  width: 100%;
  height: 32px;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  border-radius: 10px;
  background: var(--color-base-foreground);
  color: var(--color-content-background);
  font-weight: 500;
  transition: opacity 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .mar-signin-btn:hover {
  opacity: 0.9;
}
:root .proto-ui.proto-ui.proto-ui .mar-signin-icon {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: var(--color-muted-foreground);
}
:root .proto-ui.proto-ui.proto-ui .mar-signin-icon:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-base-foreground);
}
</style>
