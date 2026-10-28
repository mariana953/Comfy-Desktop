import { computed, reactive, watch } from 'vue'
import { MessageCircle, Sparkles } from 'lucide-vue-next'

/**
 * Which proposal the prototype shows (Prototype menu): Pablo's, as it is on
 * his branch, or Mariana's, which lives in this folder only. Everything that
 * differs is in mar/; Pablo's files only gain the switch that picks between
 * the two, so his daily changes merge in cleanly.
 */

export const PROPOSALS = [
  { value: 'pablo', label: 'Pablo' },
  { value: 'mariana', label: 'Mariana v1' }
] as const

export type Proposal = (typeof PROPOSALS)[number]['value']

const KEY = 'comfy.design.proposal'

function isProposal(v: unknown): v is Proposal {
  return PROPOSALS.some((p) => p.value === v)
}

/** URL overrides storage (`?proposal=mariana`), for screenshots and links. */
function load(): Proposal {
  const fromUrl = new URLSearchParams(location.search).get('proposal')
  if (isProposal(fromUrl)) return fromUrl
  try {
    const stored = localStorage.getItem(KEY)
    if (isProposal(stored)) return stored
  } catch {
    // Storage blocked: fall back to Pablo's.
  }
  return 'pablo'
}

export const proposal = reactive<{ id: Proposal }>({ id: load() })

watch(
  () => proposal.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)

window.addEventListener('storage', (e) => {
  if (e.key === KEY) proposal.id = load()
})

export const isMariana = computed(() => proposal.id === 'mariana')

/** The Agent lens icon: a chat bubble in Mariana's proposal. */
export const agentIcon = computed(() => (isMariana.value ? MessageCircle : Sparkles))
