<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpRight, Check, Copy, Plus, Rocket } from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import EmptyState from '../../ui/EmptyState.vue'
import Sparkline from '../../ui/Sparkline.vue'
import CloudSignInCta from '../../parts/CloudSignInCta.vue'
import { deployments, envById, fmt, fmtCompact } from '../../parts/env/env'
import { deployEnv, go, instances, proto, toast } from '../../useProto'

/**
 * Build's overview in Mar's proposal. It answers, in order: is my API
 * healthy (the four numbers, big), does anything need me (failures, only
 * when there are some), what's running (deployments as cards, busiest
 * first) and how do I call it (code, in the language you use).
 */
const total = computed(() => deployments.value.reduce((n, d) => n + d.requests7d, 0))
const spend = computed(() => deployments.value.reduce((n, d) => n + d.spend7d, 0))
const errorRate = computed(() =>
  total.value
    ? deployments.value.reduce((n, d) => n + d.errorRate * d.requests7d, 0) / total.value
    : 0
)
const trend = computed(() =>
  [0, 1, 2, 3, 4, 5, 6].map((i) => deployments.value.reduce((n, d) => n + (d.trend[i] ?? 0), 0))
)
const BUDGET = 80000
const busiest = computed(() =>
  [...deployments.value].sort((a, b) => b.requests7d - a.requests7d).slice(0, 6)
)
const running = computed(() => deployments.value.filter((d) => d.status === 'running').length)
const firstLocal = computed(() => instances.value.find((i) => i.kind === 'local'))

const FAILURES = [
  {
    when: '4 min ago',
    deployment: 'product-shots-staging',
    error: 'CUDA out of memory · KSampler',
    code: 500
  },
  {
    when: '1 h ago',
    deployment: 'product-shots',
    error: 'Input image missing: product_ref.jpg',
    code: 422
  },
  {
    when: '3 h ago',
    deployment: 'hero-shot-api',
    error: 'Timed out after 120 s (cold start)',
    code: 504
  }
]

const LANGS = ['cURL', 'Python', 'JavaScript'] as const
const lang = ref<(typeof LANGS)[number]>('cURL')
const endpoint = computed(() => deployments.value[0]?.endpoint ?? 'https://api.comfy.org/run')
const code = computed(() => {
  if (lang.value === 'Python')
    return `import comfy\n\nclient = comfy.Client()  # reads COMFY_API_KEY\nresult = client.run(\n    "${endpoint.value}",\n    inputs={"prompt": "..."},\n)`
  if (lang.value === 'JavaScript')
    return `import { Comfy } from '@comfyorg/sdk'\n\nconst comfy = new Comfy() // reads COMFY_API_KEY\nconst result = await comfy.run('${endpoint.value}', {\n  inputs: { prompt: '...' }\n})`
  return `curl -X POST ${endpoint.value} \\\n  -H "Authorization: Bearer $COMFY_API_KEY" \\\n  -d '{"inputs": {"prompt": "..."}}'`
})
const copied = ref(false)
function copy(): void {
  copied.value = true
  toast('Copied')
  setTimeout(() => (copied.value = false), 1400)
}
</script>

<template>
  <div class="mar-build mx-auto w-full max-w-300 px-10 pb-16">
    <header class="flex items-end justify-between gap-6 pt-12 pb-8">
      <div>
        <h1 class="mar-build-title">Your API</h1>
        <p class="mt-2 text-ui text-muted-foreground">
          {{ deployments.length }} deployments · {{ running }} running · last 7 days
        </p>
      </div>
      <div class="flex gap-2">
        <Button size="lg" @click="toast('Opening docs.comfy.org ↗')"
          >Docs<ArrowUpRight :size="14"
        /></Button>
        <Button
          v-if="firstLocal && proto.signedIn"
          variant="primary"
          size="lg"
          @click="deployEnv(firstLocal.id)"
          ><Plus :size="15" />New deployment</Button
        >
      </div>
    </header>

    <CloudSignInCta
      v-if="!proto.signedIn"
      title="Deploy ComfyUI as an API"
      body="Log in to deploy a build behind an endpoint that scales with traffic."
    />
    <EmptyState
      v-else-if="!deployments.length"
      :icon="Rocket"
      title="No deployments yet"
      description="Pick a build, freeze a version and get an endpoint."
    >
      <Button v-if="firstLocal" variant="primary" @click="deployEnv(firstLocal.id)"
        >Deploy {{ firstLocal.name }}</Button
      >
    </EmptyState>
    <template v-else>
      <!-- Health: four numbers, big, each on its own surface. -->
      <section class="grid grid-cols-4 gap-3">
        <div class="mar-build-stat mar-surface">
          <span class="mar-build-label">Requests</span>
          <span class="mar-build-value">{{ fmtCompact(total) }}</span>
          <Sparkline :values="trend" :width="220" :height="34" class="mar-build-spark" />
        </div>
        <div class="mar-build-stat mar-surface">
          <span class="mar-build-label">Error rate</span>
          <span class="mar-build-value">{{ errorRate.toFixed(1) }}<small>%</small></span>
          <span class="mar-build-hint"
            ><i class="mar-build-dot" :class="errorRate < 1 ? 'is-ok' : 'is-bad'" />{{
              errorRate < 1 ? 'Healthy' : 'Above 1%'
            }}</span
          >
        </div>
        <div class="mar-build-stat mar-surface">
          <span class="mar-build-label">p95 latency</span>
          <span class="mar-build-value">9.1<small>s</small></span>
          <span class="mar-build-hint">Including cold starts</span>
        </div>
        <div class="mar-build-stat mar-surface">
          <span class="mar-build-label">Spend</span>
          <span class="mar-build-value">{{ fmtCompact(spend) }}<small>credits</small></span>
          <span class="mar-build-meter"
            ><span :style="{ width: `${Math.min(100, (spend / BUDGET) * 100)}%` }"
          /></span>
          <span class="mar-build-hint"
            >{{ Math.round((spend / BUDGET) * 100) }}% of the monthly budget</span
          >
        </div>
      </section>

      <!-- Needs you: only what failed, right under the health numbers. -->
      <section v-if="FAILURES.length" class="mt-8">
        <div class="mar-build-head">
          <h2>
            Needs attention <span class="mar-build-count">{{ FAILURES.length }}</span>
          </h2>
          <button type="button" @click="go('logs')">Open logs</button>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="f in FAILURES"
            :key="f.when"
            type="button"
            class="mar-build-fail mar-surface"
            @click="go('logs')"
          >
            <span class="flex items-center justify-between">
              <span class="mar-build-code">{{ f.code }}</span>
              <span class="text-ui text-subtle-foreground">{{ f.when }}</span>
            </span>
            <span class="line-clamp-2 text-left text-ui text-base-foreground">{{ f.error }}</span>
            <span class="truncate font-mono text-[12px] text-subtle-foreground">{{
              f.deployment
            }}</span>
          </button>
        </div>
      </section>

      <!-- What's running: the busiest deployments as cards. -->
      <section class="mt-10">
        <div class="mar-build-head">
          <h2>
            Deployments <span class="mar-build-count">{{ deployments.length }}</span>
          </h2>
          <button type="button" @click="go('deployments')">All deployments</button>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="d in busiest"
            :key="d.id"
            type="button"
            class="mar-build-dep mar-surface"
            @click="go(`deployment:${d.id}`)"
          >
            <span class="flex items-center justify-between gap-3">
              <span class="truncate font-mono text-ui text-base-foreground">{{ d.name }}</span>
              <span class="mar-build-status" :class="d.status === 'running' && 'is-on'"
                ><i />{{ d.status === 'running' ? 'Running' : 'Idle' }}</span
              >
            </span>
            <span class="truncate text-ui text-subtle-foreground"
              >{{ envById(d.envId)?.name }} · {{ d.version }} · {{ d.stage }}</span
            >
            <span class="mt-3 flex items-end justify-between gap-3">
              <span class="flex flex-col text-left">
                <span class="mar-build-num">{{ fmtCompact(d.requests7d) }}</span>
                <span class="text-[12px] text-subtle-foreground"
                  >requests · {{ fmt(d.spend7d) }} credits</span
                >
              </span>
              <Sparkline :values="d.trend" :width="110" :height="32" />
            </span>
          </button>
        </div>
      </section>

      <!-- How to call it, in your language. -->
      <section class="mt-10">
        <div class="mar-build-head">
          <h2>Call your API</h2>
          <button type="button" @click="go('keys')">Get an API key</button>
        </div>
        <div class="mar-build-code-card mar-surface">
          <div class="flex items-center justify-between">
            <div class="mar-seg flex gap-1 rounded-control p-0.5" role="tablist">
              <button
                v-for="l in LANGS"
                :key="l"
                type="button"
                role="tab"
                :aria-selected="lang === l"
                :aria-pressed="lang === l"
                class="mar-build-tab"
                @click="lang = l"
              >
                {{ l }}
              </button>
            </div>
            <Button size="sm" @click="copy"
              ><component :is="copied ? Check : Copy" :size="13" />{{
                copied ? 'Copied' : 'Copy'
              }}</Button
            >
          </div>
          <pre class="mar-build-pre">{{ code }}</pre>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.mar-build-title {
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.mar-build-stat {
  display: flex;
  min-height: 150px;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border-radius: 18px;
}
.mar-build-label {
  color: var(--color-muted-foreground);
  font-size: 13px;
}
.mar-build-value {
  font-size: 34px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.mar-build-value small {
  margin-left: 4px;
  color: var(--color-subtle-foreground);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0;
}
.mar-build-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  color: var(--color-subtle-foreground);
  font-size: 12px;
}
.mar-build-spark {
  width: 100%;
  margin-top: auto;
}
.mar-build-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
}
.mar-build-dot.is-ok {
  background: var(--color-status-running, #4ade80);
}
.mar-build-dot.is-bad {
  background: var(--color-status-danger, #f87171);
}
.mar-build-meter {
  display: block;
  height: 4px;
  margin-top: auto;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
.mar-build-meter > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-base-foreground);
}
.mar-build-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.mar-build-head h2 {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}
.mar-build-head button {
  color: var(--color-muted-foreground);
  font-size: 13px;
}
.mar-build-head button:hover {
  color: var(--color-base-foreground);
}
.mar-build-count {
  border-radius: 999px;
  padding: 1px 8px;
  background: color-mix(in oklch, var(--color-base-foreground) 8%, transparent);
  color: var(--color-muted-foreground);
  font-size: 12px;
  font-weight: 500;
}
.mar-build-fail,
.mar-build-dep {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 18px;
  text-align: left;
}
.mar-build-fail {
  box-shadow: inset 2px 0 0
    color-mix(in oklch, var(--color-status-danger, #f87171) 70%, transparent);
}
.mar-build-code {
  border-radius: 6px;
  padding: 1px 6px;
  background: color-mix(in oklch, var(--color-status-danger, #f87171) 16%, transparent);
  color: var(--color-status-danger, #f87171);
  font-family: ui-monospace, monospace;
  font-size: 12px;
}
.mar-build-status {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  color: var(--color-subtle-foreground);
  font-size: 12px;
}
.mar-build-status i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--color-subtle-foreground);
}
.mar-build-status.is-on {
  color: var(--color-base-foreground);
}
.mar-build-status.is-on i {
  background: var(--color-status-running, #4ade80);
}
.mar-build-num {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.mar-build-code-card {
  padding: 14px;
  border-radius: 18px;
}
.mar-build-tab {
  height: 28px;
  padding: 0 12px;
  border-radius: 7px;
  color: var(--color-muted-foreground);
  font-size: 13px;
}
.mar-build-tab[aria-selected='true'] {
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
  color: var(--color-base-foreground);
}
.mar-build-pre {
  margin-top: 12px;
  overflow-x: auto;
  padding: 16px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-content-background) 70%, transparent);
  color: var(--color-muted-foreground);
  font-family: ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.7;
}
</style>

<style>
/* Global: cards and tabs here are buttons, so they go past the
   prototype's button reset (scoped styles can't reach that far). */
:root .proto-ui.proto-ui.proto-ui :is(.mar-build-fail, .mar-build-dep) {
  width: auto;
  padding: 16px 18px;
  border-radius: 18px;
  background: color-mix(in oklch, var(--color-card-background) 72%, transparent);
  backdrop-filter: blur(20px);
  transition: background-color 160ms ease;
}
:root .proto-ui.proto-ui.proto-ui :is(.mar-build-fail, .mar-build-dep):hover {
  background: color-mix(in oklch, var(--color-card-background-hover) 80%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .mar-build-dep {
  min-height: 150px;
}
:root .proto-ui.proto-ui.proto-ui .mar-build-tab {
  width: auto;
  height: 28px;
  padding: 0 12px;
  font-size: 13px;
}
:root .proto-ui.proto-ui.proto-ui .mar-build-head button {
  width: auto;
  padding: 0;
  font-size: 13px;
}
</style>
