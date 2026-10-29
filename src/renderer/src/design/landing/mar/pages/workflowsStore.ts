import { allWorkflows } from '../../gallery'
import { collection } from './collection'
import type { ItemStatus } from './MarStatus.vue'

/** Workflows in Mar's proposal: the gallery's, with the states the
 *  product shows on a workflow (running, queued, failed last run,
 *  unsaved changes, shared). */
export interface MarWorkflow {
  id: string
  name: string
  source: 'local' | 'cloud'
  thumbId: string
  category: 'image' | 'video'
  project?: string
  modified: string
  age: number
  envId?: string
  fav?: boolean
  status?: ItemStatus
  statusLabel?: string
}

const STATES: [ItemStatus, string?][] = [
  ['running', 'Running · 62%'],
  ['queued', 'Queued · 2nd'],
  ['failed'],
  ['draft', 'Unsaved']
]

export const workflows = collection<MarWorkflow>(
  allWorkflows.value.map((w, i) => {
    const s = STATES[i]
    return {
      id: w.id,
      name: w.name,
      source: w.source,
      thumbId: w.thumbId,
      category: w.category,
      project: w.project,
      modified: w.modified,
      age: w.age,
      envId: w.envId,
      fav: i === 1,
      status: s?.[0] ?? (w.source === 'cloud' && i % 2 ? 'shared' : undefined),
      statusLabel: s?.[1]
    }
  }),
  'workflow'
)
