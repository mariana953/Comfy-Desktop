import { computed, reactive, watch } from 'vue'
import { MessageCircle, Sparkles } from 'lucide-vue-next'

/**
 * Which proposal the prototype shows (Prototype menu): Pablo's, as it is on
 * his branch, or one of Mariana's versions, which live in this folder only.
 * Everything that differs is in mar/; Pablo's files only gain the switch
 * that picks between them, so his daily changes merge in cleanly.
 *
 * Versions are frozen once a newer one exists, so they can be compared and
 * the decisions behind each one stay visible (DECISIONS.md). The last one
 * is the version being worked on.
 */

export const PROPOSALS = [
  { value: 'pablo', label: 'Pablo' },
  { value: 'mariana-v1', label: 'Mariana v1' },
  { value: 'mariana-v2', label: 'Mariana v2 (in progress)' }
] as const

export type Proposal = (typeof PROPOSALS)[number]['value']

const KEY = 'comfy.design.proposal'

function isProposal(v: unknown): v is Proposal {
  return PROPOSALS.some((p) => p.value === v)
}

// `mariana` alone means her latest version (links shared before versions).
const LATEST: Proposal = PROPOSALS.at(-1)!.value

/** URL overrides storage (`?proposal=mariana-v1`), for screenshots and links. */
function load(): Proposal {
  const fromUrl = new URLSearchParams(location.search).get('proposal')
  if (fromUrl === 'mariana') return LATEST
  if (isProposal(fromUrl)) return fromUrl
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'mariana') return LATEST
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

export const isMariana = computed(() => proposal.id.startsWith('mariana'))

/** Mariana's version number (1, 2, …), or 0 on Pablo's proposal. */
export const marVersion = computed(() =>
  isMariana.value ? Number(proposal.id.replace('mariana-v', '')) : 0
)

/** The Agent lens icon: a chat bubble in Mariana's proposal. */
export const agentIcon = computed(() => (isMariana.value ? MessageCircle : Sparkles))
