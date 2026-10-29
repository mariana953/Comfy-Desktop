<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileCode2,
  KeyRound,
  Play,
  RotateCcw,
  Route,
  Trash2,
  X
} from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import SegmentedControl from '../../ui/SegmentedControl.vue'
import { shownCredits } from '../../account'
import { go, toast } from '../../useProto'
import { Astroid, ComfyModel, ComfyWorkflow } from '../icons/comfyIcons'
import MarCode from './MarCode.vue'
import {
  HOST,
  createKey,
  current,
  markCopied,
  masked,
  receive,
  resetStart,
  revokeKey,
  start,
  stepsDone,
  type Path
} from './buildStart'
import { AGENT_INSTALL, AGENT_PROMPT, SAMPLE_FILE, SAMPLE_LANG, sample } from './startSamples'
import './buildStart.css'

/**
 * Build › Get started in Mar's proposal: one card that takes a developer
 * from nothing to a first call on this build, the way they already work
 * (a coding agent, Python, JavaScript or the terminal), then usage and the
 * places they'll go next. Mocked in memory (buildStart.ts), shaped for the
 * real backends: platform.comfy.org keys, the local server, comfy-mcp.
 */

const PATHS: { value: Path; label: string }[] = [
  { value: 'agent', label: 'Coding agent' },
  { value: 'python', label: 'Python' },
  { value: 'js', label: 'JavaScript' },
  { value: 'curl', label: 'cURL' }
]
const isAgent = computed(() => start.path === 'agent')

// Code: the full key goes to the clipboard, the screen shows it masked
// unless it's revealed. No key yet: a placeholder.
const keyCopy = computed(() => start.key?.value ?? 'comfyui-YOUR_KEY')
const keyShown = computed(() =>
  start.key ? (start.revealed ? start.key.value : masked.value) : 'comfyui-YOUR_KEY'
)
const codePath = computed(() => (isAgent.value ? 'python' : start.path) as 'python' | 'js' | 'curl')

const STEP_LABEL = ['Create a key', 'Make the call', 'Watch it arrive', 'Done']
const progressLabel = computed(() =>
  current.value === 3 ? 'All set' : `Step ${current.value + 1} of 3 · ${STEP_LABEL[current.value]}`
)

const keyCopied = ref(false)
async function copyKey(): Promise<void> {
  if (!start.key) return
  try {
    await navigator.clipboard.writeText(start.key.value)
  } catch {
    // No clipboard: the confirmation still shows.
  }
  keyCopied.value = true
  setTimeout(() => (keyCopied.value = false), 1600)
}

const news = ref(true)

// Usage: credits are spent by API nodes and Comfy Cloud; local runs on
// your GPU are free. The balance is the account's (sidebar Credits).
const USAGE = { apiNodes: 620, cloud: 170 }
const used = USAGE.apiNodes + USAGE.cloud
const balance = computed(() => Number(String(shownCredits.value ?? '0').replace(/,/g, '')))
// The bar splits this month's spend by where it went.
const pct = (n: number): string => `${(n / used) * 100}%`

const LINKS = [
  {
    icon: KeyRound,
    title: 'API keys',
    body: 'Create, name and revoke keys',
    run: () => go('keys')
  },
  {
    icon: ComfyModel,
    title: 'Browse models',
    body: 'Open models and API nodes',
    run: () => go('router')
  },
  {
    icon: Route,
    title: 'Server routes',
    body: '/prompt, /history, /view, /ws',
    run: () => toast('Opening docs.comfy.org ↗')
  },
  {
    icon: Astroid,
    title: 'Connect an agent',
    body: 'comfy-mcp for Claude Code, Cursor, Codex',
    run: () => (start.path = 'agent')
  },
  {
    icon: ComfyWorkflow,
    title: 'Deploy a workflow',
    body: 'An autoscaling endpoint on Comfy API',
    run: () => toast('Opening platform.comfy.org ↗')
  },
  {
    icon: FileCode2,
    title: 'Example scripts',
    body: 'REST and WebSocket, in ComfyUI',
    run: () => toast('Opening github.com/comfyanonymous/ComfyUI ↗')
  }
]
</script>

<template>
  <div class="mar-bs mx-auto w-full max-w-280 px-10 pb-20">
    <!-- Header: where you are, and the two places a developer reaches for. -->
    <header class="flex items-end justify-between gap-6 pt-12 pb-7">
      <div>
        <p class="mar-bs-eyebrow">Build</p>
        <h1 class="mar-bs-title mt-1">Get started</h1>
        <p class="mt-2 text-ui text-muted-foreground">
          Run ComfyUI from your code or your coding agent.
        </p>
      </div>
      <div class="flex items-center gap-1">
        <button type="button" class="mar-bs-link" @click="go('billing')">Credits & pricing</button>
        <Button size="lg" @click="toast('Opening docs.comfy.org ↗')"
          >Docs<ArrowUpRight :size="14"
        /></Button>
      </div>
    </header>

    <!-- What's new for developers: dismissible, one line. -->
    <div v-if="news" class="mar-bs-news mar-surface mb-5">
      <span class="mar-bs-news-art"><Astroid :size="20" /></span>
      <div class="min-w-0 flex-1">
        <p class="text-ui font-medium">Comfy has an MCP</p>
        <p class="truncate text-[12px] text-muted-foreground">
          Point Claude Code, Cursor or Codex at this ComfyUI and let it build and run workflows.
        </p>
      </div>
      <button type="button" class="mar-bs-link" @click="toast('Playing the launch film')">
        <Play :size="13" />Watch
      </button>
      <button type="button" class="mar-bs-link" @click="toast('Opening docs.comfy.org ↗')">
        Read the docs<ArrowUpRight :size="13" />
      </button>
      <button type="button" class="mar-bs-icon" aria-label="Dismiss" @click="news = false">
        <X :size="14" />
      </button>
    </div>

    <!-- The card: path, three steps, and the live listener at its foot. -->
    <section class="mar-bs-card mar-surface" aria-labelledby="bs-first-call">
      <div class="mar-bs-card-head">
        <div>
          <h2 id="bs-first-call" class="mar-bs-h2">Make your first call</h2>
          <p class="mt-1 text-ui text-muted-foreground">
            Pick how you work. Every path ends in a run on this build.
          </p>
        </div>
        <div class="mar-bs-progress" aria-live="polite">
          <span class="text-[12px] text-muted-foreground">{{ progressLabel }}</span>
          <span class="mar-bs-progress-bars" aria-hidden="true">
            <span v-for="(d, i) in stepsDone" :key="i" :class="d && 'is-done'"><i /></span>
          </span>
        </div>
      </div>

      <div class="px-7 pt-5">
        <SegmentedControl v-model="start.path" variant="contained" :options="PATHS" />
      </div>

      <ol class="mar-bs-steps">
        <!-- 1 · Key -->
        <li class="mar-bs-step" :class="[stepsDone[0] && 'is-done', current === 0 && 'is-current']">
          <span class="mar-bs-dot"
            ><Check v-if="stepsDone[0]" :size="13" /><template v-else>1</template></span
          >
          <div class="min-w-0">
            <p class="mar-bs-step-title">Create an API key</p>
            <p class="mar-bs-step-body">
              Your key unlocks API nodes (partner models) and Comfy Cloud. Open models on your GPU
              run without one.
            </p>
            <div v-if="start.key" class="mar-bs-key">
              <span class="mar-bs-key-name">{{ start.key.name }}</span>
              <code class="mar-bs-key-value">{{ start.revealed ? start.key.value : masked }}</code>
              <button
                type="button"
                class="mar-bs-icon"
                :aria-label="start.revealed ? 'Hide key' : 'Reveal key'"
                @click="start.revealed = !start.revealed"
              >
                <component :is="start.revealed ? EyeOff : Eye" :size="15" />
              </button>
              <button
                type="button"
                class="mar-bs-icon"
                :class="keyCopied && 'is-done'"
                :aria-label="keyCopied ? 'Copied' : 'Copy key'"
                @click="copyKey"
              >
                <component :is="keyCopied ? Check : Copy" :size="15" />
              </button>
              <button type="button" class="mar-bs-icon" aria-label="Revoke key" @click="revokeKey">
                <Trash2 :size="15" />
              </button>
            </div>
            <p v-if="start.key" class="mar-bs-note">
              Anyone with this key can spend your credits. It's already in the code below.
            </p>
            <div v-else class="mt-3 flex items-center gap-2">
              <Button
                :variant="start.skippedKey ? 'secondary' : 'primary'"
                :disabled="start.creatingKey"
                @click="createKey"
                ><KeyRound :size="14" />{{ start.creatingKey ? 'Creating…' : 'Create key' }}</Button
              >
              <button
                v-if="!start.skippedKey"
                type="button"
                class="mar-bs-link"
                @click="start.skippedKey = true"
              >
                Skip, I'll use open models
              </button>
              <span v-else class="mar-bs-note is-inline">Skipped · open models only</span>
            </div>
          </div>
        </li>

        <!-- 2 · The call, in the picked path -->
        <li class="mar-bs-step" :class="[stepsDone[1] && 'is-done', current === 1 && 'is-current']">
          <span class="mar-bs-dot"
            ><Check v-if="stepsDone[1]" :size="13" /><template v-else>2</template></span
          >
          <div class="min-w-0">
            <template v-if="isAgent">
              <p class="mar-bs-step-title">Add Comfy to your agent</p>
              <p class="mar-bs-step-body">
                comfy-mcp gives your agent this ComfyUI. Run it once in a terminal, or paste the
                config into your client.
              </p>
              <MarCode
                v-model:picked="start.agentClient"
                :options="[
                  { value: 'claude', label: 'Claude Code' },
                  { value: 'json', label: 'Cursor · Claude Desktop' }
                ]"
                :copy="AGENT_INSTALL[start.agentClient]"
                :lang="start.agentClient === 'claude' ? 'bash' : 'json'"
                @copied="markCopied"
              />
              <p class="mar-bs-step-body is-gap">Then ask it for something:</p>
              <MarCode
                :copy="AGENT_PROMPT"
                lang="text"
                label="Prompt"
                prose
                copy-label="Copy prompt"
                @copied="markCopied"
              />
            </template>
            <template v-else>
              <p class="mar-bs-step-title">Queue a workflow on this build</p>
              <p class="mar-bs-step-body">
                Export any workflow with Workflow › Export (API), then send it to
                <code class="font-mono text-[12px]">{{ HOST }}</code
                >.
              </p>
              <MarCode
                :key="codePath"
                :copy="sample(codePath, keyCopy)"
                :shown="sample(codePath, keyShown)"
                :lang="SAMPLE_LANG[codePath]"
                :label="SAMPLE_FILE[codePath]"
                @copied="markCopied"
              />
            </template>
          </div>
        </li>

        <!-- 3 · Arrival -->
        <li class="mar-bs-step" :class="[stepsDone[2] && 'is-done', current === 2 && 'is-current']">
          <span class="mar-bs-dot"
            ><Check v-if="stepsDone[2]" :size="13" /><template v-else>3</template></span
          >
          <div class="min-w-0">
            <p class="mar-bs-step-title">{{ isAgent ? 'Watch it connect' : 'Watch it arrive' }}</p>
            <p class="mar-bs-step-body">
              {{
                isAgent
                  ? 'The first time your agent starts comfy-mcp, it shows up here.'
                  : 'Every run lands in the Request log, with its prompt id and timing.'
              }}
            </p>
          </div>
        </li>
      </ol>

      <!-- Listener: live until the first call, then the call itself. -->
      <div
        class="mar-bs-listen"
        :class="start.first ? 'is-got' : 'is-on'"
        role="status"
        aria-live="polite"
      >
        <template v-if="!start.first">
          <span class="mar-bs-pulse" />
          <span class="min-w-0 flex-1 truncate">
            {{ isAgent ? 'Waiting for your agent to connect' : 'Listening for your first request' }}
            <span class="text-subtle-foreground">
              · {{ isAgent ? 'comfy-mcp' : HOST.replace('http://', '') }}</span
            >
          </span>
          <button type="button" class="mar-bs-link" @click="receive">Check now</button>
        </template>
        <template v-else>
          <span class="mar-bs-got"><Check :size="12" :stroke-width="3" /></span>
          <span class="shrink-0 font-medium">{{
            isAgent ? 'Agent connected' : 'First request received'
          }}</span>
          <span class="mar-bs-req">
            <span class="mar-bs-method">{{ start.first.method }}</span>
            <span class="text-base-foreground">{{ start.first.path }}</span>
            <span class="truncate text-subtle-foreground">{{ start.first.detail }}</span>
            <span class="mar-bs-200">{{ start.first.status }}</span>
            <span class="text-subtle-foreground">{{ start.first.ms }} ms</span>
          </span>
          <button type="button" class="mar-bs-icon" aria-label="Start over" @click="resetStart">
            <RotateCcw :size="14" />
          </button>
          <button type="button" class="mar-bs-link" @click="go('logs')">
            Request log<ArrowRight :size="13" />
          </button>
        </template>
      </div>
    </section>

    <!-- Usage and where to go next. -->
    <div class="mt-10 grid grid-cols-[minmax(0,5fr)_minmax(0,8fr)] gap-6">
      <section aria-labelledby="bs-usage">
        <h3 id="bs-usage" class="mar-bs-h3">Usage</h3>
        <div class="mar-bs-usage mar-surface">
          <div class="flex items-end justify-between gap-3">
            <div>
              <p class="text-[12px] text-muted-foreground">Credits left</p>
              <p class="mar-bs-big mt-1.5">{{ balance.toLocaleString('en-US') }}</p>
            </div>
            <p class="text-right text-[12px] text-subtle-foreground">{{ used }} used this month</p>
          </div>
          <div class="mar-bs-meter" role="img" aria-label="This month's credits by product">
            <span :style="{ width: pct(USAGE.apiNodes) }" /><span
              :style="{ width: pct(USAGE.cloud) }"
            />
          </div>
          <div class="mar-bs-legend">
            <span><i />API nodes {{ USAGE.apiNodes }}</span>
            <span><i />Comfy Cloud {{ USAGE.cloud }}</span>
          </div>
          <p class="text-[12px] text-subtle-foreground">Runs on your GPU don't use credits.</p>
          <div class="mt-auto flex gap-2">
            <Button variant="primary" @click="go('billing')">Add credits</Button>
            <Button @click="go('usage')">See usage</Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="bs-links">
        <h3 id="bs-links" class="mar-bs-h3">Quick links</h3>
        <div class="grid grid-cols-2 gap-2.5">
          <button v-for="l in LINKS" :key="l.title" type="button" class="mar-bs-ql" @click="l.run">
            <span class="mar-bs-ql-icon"><component :is="l.icon" :size="16" /></span>
            <span class="min-w-0">
              <span class="block text-ui font-medium text-base-foreground">{{ l.title }}</span>
              <span class="block truncate text-[12px] text-muted-foreground">{{ l.body }}</span>
            </span>
            <ArrowRight :size="14" class="mar-bs-ql-arrow" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
