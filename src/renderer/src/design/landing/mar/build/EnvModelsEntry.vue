<script setup lang="ts">
import EnvModels from '../../pages/env/EnvModels.vue'
import { envKind } from '../../parts/env/env'
import type { ProtoInstance } from '../../mock'
import MarEnvModels from './MarEnvModels.vue'
import { MODEL_BUILDS } from './models'
import { isMariana } from '../proposal'

/** A build's contents tab. In Mar's proposal a build on this computer lists
 *  its models from the shared models library; everything else is Pablo's. */
const { env } = defineProps<{ env: ProtoInstance }>()
</script>

<template>
  <MarEnvModels v-if="isMariana && envKind(env) === 'local' && MODEL_BUILDS[env.id]" :env />
  <EnvModels v-else :env />
</template>
