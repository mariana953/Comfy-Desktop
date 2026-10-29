<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Check,
  ChevronRight,
  Cloud,
  Copy,
  FolderOpen,
  HardDrive,
  History,
  Laptop,
  TriangleAlert,
  X
} from 'lucide-vue-next'
import Button from '../../ui/Button.vue'
import Checkbox from '../../ui/Checkbox.vue'
import { PORTAL_TO } from '../../ui/portal'
import { hostActions, toast } from '../../useProto'
import {
  DETECTED,
  STARTERS,
  cancelInstall,
  closeSetup,
  fits,
  flow,
  localSetup,
  lowSpace,
  minutesLeft,
  phaseIndex,
  phases,
  retryInstall,
  setupOn,
  startInstall,
  toBackground,
  toForeground,
  unsupported,
  type Starter
} from './setupFlow'
import './setup.css'

/**
 * Mar's proposed local setup (UI Playground › Local setup › Proposal).
 * One screen with everything already checked, then the install, with the
 * workflow pick in the wait. Copy is the product's, in English.
 */
const imgUrl = (f: string): string => new URL(`../assets/${f}`, import.meta.url).href

const where = computed(() =>
  flow.movedDisk ? `/Volumes/${DETECTED.otherDisk.name}/ComfyUI` : DETECTED.path
)
const free = computed(() =>
  flow.movedDisk ? DETECTED.otherDisk.freeGb : lowSpace.value ? DETECTED.lowFreeGb : DETECTED.freeGb
)
const freeLabel = (gb: number): string => (gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb} GB`)

// Consent as shipped today: terms off until ticked, usage data and beta on.
const terms = ref(false)
const usage = ref(true)
const beta = ref(true)
const canInstall = computed(() => terms.value && !lowSpace.value && !unsupported.value)

const tabs = [
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: '3d', label: '3D' },
  { id: 'audio', label: 'Audio' }
] as const

function pick(s: Starter): void {
  if (!fits(s)) return
  flow.picked = flow.picked?.id === s.id ? null : s
}
const sizeOf = (s: Starter): string =>
  s.credits ? 'No download · uses credits' : `${s.gb} GB of models`
const freeAfter = computed(() =>
  Math.round(free.value - DETECTED.downloadGb - (flow.picked?.gb ?? 0))
)

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && flow.open) closeSetup()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport :to="PORTAL_TO">
    <!-- Background install: a quiet pill, the install keeps going. -->
    <button
      v-if="setupOn && flow.background && flow.running"
      type="button"
      class="proto-ui mss-pill"
      @click="toForeground"
    >
      <span class="mss-pill-ring" :style="{ '--p': flow.percent }"></span>
      <span class="flex flex-col text-left">
        <span class="text-ui font-medium text-base-foreground"
          >Installing ComfyUI · {{ flow.percent }}%</span
        >
        <span class="text-ui text-subtle-foreground">About {{ minutesLeft }} min left</span>
      </span>
    </button>

    <div
      v-if="setupOn && flow.open"
      class="proto-ui mss"
      role="dialog"
      aria-modal="true"
      aria-label="Set up Comfy"
    >
      <button type="button" class="mss-close" aria-label="Close" @click="closeSetup">
        <X :size="16" />
      </button>

      <!-- New Instance, when ComfyUI already runs here: every way in. -->
      <div v-if="flow.step === 'chooser'" class="mss-col">
        <header class="mss-title">
          <h2>New Instance</h2>
          <p>Add another place to run ComfyUI.</p>
        </header>
        <div class="mss-opts">
          <button type="button" class="mss-opt" @click="flow.step = 'setup'">
            <span class="mss-gl"><ArrowDownToLine :size="16" /></span>
            <span
              ><b>Install ComfyUI</b
              ><small
                >Set up for your {{ DETECTED.chip }}. {{ DETECTED.downloadGb }} GB.</small
              ></span
            >
            <ChevronRight :size="16" class="mss-arr" />
          </button>
          <button
            type="button"
            class="mss-opt"
            @click="toast('Add a folder: pick an existing ComfyUI folder')"
          >
            <span class="mss-gl"><FolderOpen :size="16" /></span>
            <span
              ><b>Add a folder you already have</b
              ><small>Use an existing ComfyUI install without reinstalling it.</small></span
            >
            <ChevronRight :size="16" class="mss-arr" />
          </button>
          <button type="button" class="mss-opt" @click="toast('Restore: drop a snapshot .json')">
            <span class="mss-gl"><History :size="16" /></span>
            <span
              ><b>Restore from a snapshot</b
              ><small>Rebuild an instance from a saved .json snapshot.</small></span
            >
            <ChevronRight :size="16" class="mss-arr" />
          </button>
          <button type="button" class="mss-opt" @click="toast('Connect: enter the server address')">
            <span class="mss-gl"><ArrowLeftRight :size="16" /></span>
            <span
              ><b>Connect to a server</b
              ><small>ComfyUI running on another computer or on your network.</small></span
            >
            <ChevronRight :size="16" class="mss-arr" />
          </button>
        </div>
      </div>

      <!-- 1 · Set up: checks already ran, one Install. -->
      <div v-else-if="flow.step === 'setup'" class="mss-col">
        <header class="mss-title">
          <h2>How do you want to run Comfy?</h2>
          <p>You can add the other one later.</p>
        </header>

        <div class="mss-choices">
          <button
            type="button"
            class="mss-choice"
            :class="unsupported ? 'is-off' : 'is-on'"
            :aria-disabled="unsupported"
          >
            <Laptop :size="16" />
            <b>On this computer</b>
            <span v-if="!unsupported">Full control. Uses your GPU.</span>
            <span v-else
              >ComfyUI needs a Mac with Apple Silicon (M1 or later). This Mac has an Intel
              processor.</span
            >
          </button>
          <button
            type="button"
            class="mss-choice"
            :class="unsupported && 'is-on'"
            @click="hostActions.signIn()"
          >
            <span v-if="unsupported" class="mss-tag">For this Mac</span>
            <Cloud :size="16" />
            <b>Comfy Cloud</b>
            <span>Nothing to install. Runs on our GPUs.</span>
          </button>
        </div>

        <template v-if="!unsupported">
          <div v-if="localSetup.machine === 'legacy'" class="mss-note">
            <span class="mss-dot">i</span>
            <div>
              <b>We found ComfyUI Desktop on this computer</b>
              <label class="mss-check mt-2"
                ><Checkbox v-model="flow.bringOver" /> Bring over its workflows, models, inputs and
                outputs</label
              >
              <p>They stay where they are. Nothing is copied or deleted.</p>
            </div>
          </div>

          <div class="mss-sum">
            <div class="mss-sum-h">
              <span>{{
                lowSpace ? 'One thing to fix before installing' : 'Ready to install'
              }}</span>
              <button type="button" class="mss-link" @click="flow.step = 'change'">Change</button>
            </div>
            <div class="mss-row">
              <span class="k">Hardware</span>
              <span class="v"
                >{{ DETECTED.chip }} · {{ DETECTED.memGb }} GB<small
                  >Detected. Uses the {{ DETECTED.build }} build.</small
                ></span
              >
              <span class="mss-ok"><Check :size="10" :stroke-width="3" /></span>
            </div>
            <div class="mss-row" :class="lowSpace && 'is-bad'">
              <span class="k">Location</span>
              <span class="v"
                >{{ where }}
                <small v-if="!lowSpace"
                  >{{ freeLabel(free) }} free{{
                    flow.movedDisk ? ` on ${DETECTED.otherDisk.name}` : ''
                  }}</small
                >
                <small v-else
                  >Only {{ DETECTED.lowFreeGb }} GB free. The install needs
                  {{ DETECTED.downloadGb }} GB, plus room for models.</small
                >
              </span>
              <span class="mss-ok"
                ><Check v-if="!lowSpace" :size="10" :stroke-width="3" /><template v-else
                  >!</template
                ></span
              >
            </div>
            <div v-if="lowSpace" class="mss-fix">
              <Button size="sm" variant="secondary" @click="flow.movedDisk = true"
                ><HardDrive :size="13" />Install on {{ DETECTED.otherDisk.name }} ·
                {{ freeLabel(DETECTED.otherDisk.freeGb) }} free</Button
              >
              <Button size="sm" variant="ghost" @click="flow.step = 'change'"
                >Choose a folder…</Button
              >
            </div>
            <div class="mss-row">
              <span class="k">Version</span>
              <span class="v"
                >ComfyUI {{ DETECTED.version }} · Stable<small
                  >{{ DETECTED.downloadGb }} GB download</small
                ></span
              >
              <span class="mss-ok"><Check :size="10" :stroke-width="3" /></span>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="mss-note">
            <span class="mss-dot">i</span>
            <div>
              <b>Already run ComfyUI on another machine?</b>
              <p>Connect to it from here and use this Mac as the screen.</p>
              <Button size="sm" class="mt-2" @click="flow.step = 'chooser'"
                >Connect to a server…</Button
              >
            </div>
          </div>
        </template>

        <div class="grid gap-2">
          <label class="mss-check"
            ><Checkbox v-model="terms" /> I agree to the <u>EULA</u> and
            <u>Terms of Service</u>.</label
          >
          <label class="mss-check"
            ><Checkbox v-model="usage" /> Help improve Comfy by sharing anonymous usage data.</label
          >
          <label v-if="usage" class="mss-check"
            ><Checkbox v-model="beta" /> Opt in to beta features.</label
          >
        </div>
        <Button
          v-if="!unsupported"
          variant="primary"
          size="lg"
          block
          :disabled="!canInstall"
          @click="startInstall"
          >Install</Button
        >
        <Button
          v-else
          variant="primary"
          size="lg"
          block
          :disabled="!terms"
          @click="hostActions.signIn()"
          >Continue with Cloud</Button
        >
      </div>

      <!-- Change: every field filled in with what fits this computer. -->
      <div v-else-if="flow.step === 'change'" class="mss-col">
        <header class="mss-title">
          <h2>Change setup</h2>
          <p>Everything here is already set to what fits this computer.</p>
        </header>
        <div class="mss-field">
          <span>Name</span>
          <div class="mss-input">ComfyUI</div>
        </div>
        <div class="mss-field">
          <span>Location</span>
          <div class="mss-input">
            <span class="grow truncate">{{ where }}</span
            ><small>{{ freeLabel(free) }} free</small>
            <Button size="sm" variant="secondary" @click="flow.movedDisk = true">Browse…</Button>
          </div>
        </div>
        <div class="mss-field">
          <span>Version</span>
          <div class="flex gap-2">
            <div class="mss-seg">
              <button class="on" type="button">Stable</button
              ><button type="button">Latest on GitHub</button>
            </div>
            <div class="mss-input grow">{{ DETECTED.version }}</div>
          </div>
        </div>
        <div class="mss-field">
          <span>Hardware</span>
          <div class="mss-hw is-on">
            <span>{{ DETECTED.build }}</span
            ><small>Matches your {{ DETECTED.chip }}</small
            ><em>Detected</em>
          </div>
          <div class="mss-hw"><span>CPU only</span><small>Slow. For testing.</small></div>
        </div>
        <div class="flex items-center justify-between">
          <button type="button" class="mss-link" @click="flow.step = 'chooser'">
            Connect to a server instead
          </button>
          <Button variant="primary" @click="flow.step = 'setup'">Done</Button>
        </div>
      </div>

      <!-- 2 · Installing, with the workflow pick in the wait. -->
      <div v-else-if="flow.step === 'installing'" class="mss-wide">
        <div class="mss-prog">
          <div class="mss-prog-top">
            <b>Installing ComfyUI</b>
            <span>{{ flow.percent }}% · about {{ minutesLeft }} min left</span>
          </div>
          <div class="mss-bar"><i :style="{ width: flow.percent + '%' }"></i></div>
          <div class="mss-phases">
            <span
              v-for="(p, i) in phases"
              :key="p.label"
              :class="i < phaseIndex ? 'done' : i === phaseIndex ? 'now' : ''"
              >{{ p.label }}{{ i === 0 ? ` · ${DETECTED.downloadGb} GB` : '' }}</span
            >
          </div>
        </div>

        <div class="mss-pick">
          <div class="mss-pick-h">
            <div>
              <b>While it installs, pick something to make first</b>
              <p>
                ComfyUI opens as soon as it is ready. Models keep downloading in the background.
              </p>
            </div>
            <div class="mss-tabs">
              <button
                v-for="t in tabs"
                :key="t.id"
                type="button"
                :class="flow.tab === t.id && 'on'"
                @click="flow.tab = t.id"
              >
                {{ t.label }}
              </button>
            </div>
          </div>
          <div class="mss-cards">
            <button
              v-for="s in STARTERS[flow.tab]"
              :key="s.id"
              type="button"
              class="mss-card"
              :class="[flow.picked?.id === s.id && 'is-on', !fits(s) && 'is-nofit']"
              :aria-pressed="flow.picked?.id === s.id"
              @click="pick(s)"
            >
              <span class="mss-thumb" :style="{ backgroundImage: `url(${imgUrl(s.img)})` }">
                <span v-if="s.tag || s.credits" class="mss-chip">{{
                  s.credits ? 'Uses credits' : s.tag
                }}</span>
              </span>
              <span class="mss-card-b"
                ><b>{{ s.title }}</b
                ><small>{{
                  fits(s) ? sizeOf(s) : `Needs ${s.gb} GB, not enough space`
                }}</small></span
              >
            </button>
          </div>
          <p class="mss-picked">
            <template v-if="flow.picked"
              >Opens with <b>{{ flow.picked.title }}</b> · {{ sizeOf(flow.picked)
              }}<template v-if="!flow.picked.credits"
                >, {{ freeAfter }} GB free after</template
              ></template
            >
            <template v-else
              >Opens with a blank canvas. Pick a workflow above, or keep going.</template
            >
          </p>
        </div>

        <div class="mss-foot">
          <template v-if="!flow.confirmCancel">
            <Button size="sm" variant="ghost" @click="flow.step = 'error'">View logs</Button>
            <div class="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                class="text-status-danger hover:text-status-danger"
                @click="flow.confirmCancel = true"
                >Cancel install</Button
              >
              <Button size="sm" variant="secondary" @click="toBackground"
                >Continue in background</Button
              >
            </div>
          </template>
          <template v-else>
            <span class="text-ui text-muted-foreground"
              >Cancel the install and remove what was downloaded?</span
            >
            <div class="flex gap-2">
              <Button size="sm" variant="ghost" @click="flow.confirmCancel = false"
                >Keep installing</Button
              >
              <Button size="sm" variant="destructive" @click="cancelInstall">Cancel install</Button>
            </div>
          </template>
        </div>
      </div>

      <!-- Error: what happened, what to do, Retry. -->
      <div v-else-if="flow.step === 'error'" class="mss-wide">
        <div class="mss-prog">
          <div class="mss-prog-top">
            <b>{{ flow.running ? 'Install log' : 'The install stopped' }}</b
            ><span>Set up Python environment</span>
          </div>
          <div class="mss-bar" :class="!flow.running && 'is-err'">
            <i :style="{ width: flow.percent + '%' }"></i>
          </div>
          <div class="mss-phases">
            <span class="done">Download · {{ DETECTED.downloadGb }} GB</span>
            <span :class="flow.running ? 'now' : 'fail'">Set up Python environment</span>
            <span>Start ComfyUI</span>
          </div>
        </div>
        <div v-if="!flow.running" class="mss-note is-err">
          <span class="mss-dot"><TriangleAlert :size="10" /></span>
          <div>
            <b>The network connection dropped while downloading packages.</b>
            <p>Check that you are online, then retry. Files already downloaded are kept.</p>
            <div class="mt-3 flex gap-2">
              <Button size="sm" variant="primary" @click="retryInstall">Retry install</Button>
              <Button size="sm" variant="secondary" @click="toast('Error details copied')"
                ><Copy :size="13" />Copy error details</Button
              >
              <Button size="sm" variant="ghost">Get help</Button>
            </div>
          </div>
        </div>
        <pre class="mss-logs">[setup] Installing torch==2.7.1 …
[setup] Downloading torch-2.7.1-cp313-macosx_arm64.whl (74 MB)<template v-if="!flow.running">
<span class="e">ERROR: ConnectionResetError(54, 'Connection reset by peer')</span>
<span class="e">pip exited with code 2</span></template></pre>
        <div class="mss-foot">
          <Button v-if="flow.running" size="sm" variant="ghost" @click="flow.step = 'installing'"
            >Hide logs</Button
          >
          <span v-else></span>
          <Button
            v-if="!flow.running"
            size="sm"
            variant="ghost"
            class="text-status-danger hover:text-status-danger"
            @click="cancelInstall"
            >Remove this install</Button
          >
        </div>
      </div>
    </div>
  </Teleport>
</template>
