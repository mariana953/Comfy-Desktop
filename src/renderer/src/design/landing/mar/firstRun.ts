import { reactive, watch } from 'vue'

/** Which first-run Home Mar's proposal shows when there is no local install
 *  (UI Playground › First run): Stage, a soft loop behind the welcome and a
 *  clear choice of where to run; Reel, a split hero with a looping showcase
 *  and prompt ideas; or Original, the first version, kept as it was. */
export type FirstRun = 'stage' | 'reel' | 'original'

export const FIRST_RUNS: { value: FirstRun; label: string }[] = [
  { value: 'stage', label: 'Stage · a soft loop and a clear choice' },
  { value: 'reel', label: 'Reel · a showcase beside the prompt' },
  { value: 'original', label: 'Original · the first version' }
]

const KEY = 'comfy.design.mar.firstRun'

export const firstRun = reactive<{ id: FirstRun }>({
  id: (() => {
    try {
      const v = localStorage.getItem(KEY)
      return FIRST_RUNS.some((f) => f.value === v) ? (v as FirstRun) : 'stage'
    } catch {
      return 'stage'
    }
  })()
})

watch(
  () => firstRun.id,
  (id) => {
    try {
      localStorage.setItem(KEY, id)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)
