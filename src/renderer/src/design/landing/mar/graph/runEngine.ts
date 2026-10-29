import grass from '../assets/portrait-grass.jpg'
import seaside from '../assets/portrait-seaside.jpg'
import smile from '../assets/portrait-smile.jpg'
import sun from '../assets/portrait-sun.jpg'
import windowLight from '../assets/portrait-window.jpg'

/**
 * What the graph editor runs on. The UI only talks to `RunEngine`: it hands
 * over a snapshot of the graph, then listens. `createMockEngine` drives the
 * same events with timers so the mock feels real; a backend engine (a
 * ComfyUI prompt queue over its websocket) can replace it without touching
 * the UI.
 */

export type NodeRunState = 'idle' | 'queued' | 'running' | 'paused' | 'done' | 'error'

export interface RunNode {
  id: string
  kind: 'prompt' | 'image' | 'generate' | 'pause' | 'workflow' | 'output'
  title: string
  /** The node's widget values when the run was queued. */
  params: Record<string, string>
}

export interface RunGraph {
  /** Shown in the queue, e.g. the workflow's name. */
  title: string
  nodes: RunNode[]
  /** [from node, to node] */
  links: [string, string][]
}

export type JobStatus = 'queued' | 'running' | 'paused' | 'done' | 'error' | 'cancelled'

export interface RunJob {
  id: string
  title: string
  status: JobStatus
  /** The whole run, 0 to 1. */
  progress: number
  /** The node being run, while running or paused. */
  nodeId?: string
}

export type RunEvent =
  | { type: 'job'; job: RunJob }
  | {
      type: 'node'
      jobId: string
      nodeId: string
      state: NodeRunState
      step?: number
      steps?: number
      error?: string
    }
  | { type: 'output'; jobId: string; nodeId: string; image: string }
  | { type: 'removed'; jobId: string }

export interface RunEngine {
  /** Queues `count` runs of the graph; returns their ids. */
  queue(graph: RunGraph, count?: number): string[]
  /** Stops a run, running or waiting. */
  cancel(jobId: string): void
  /** Drops the runs still waiting; the running one goes on. */
  clearQueue(): void
  cancelAll(): void
  /** Holds a running job where it is (a Pause node also holds it). */
  pause(jobId: string): void
  resume(jobId: string): void
  on(listener: (e: RunEvent) => void): () => void
  dispose(): void
}

/** Runs the nodes in link order: every node after the ones feeding it. */
export function runOrder(graph: RunGraph): RunNode[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]))
  const done = new Set<string>()
  const out: RunNode[] = []
  const visit = (id: string): void => {
    if (done.has(id)) return
    done.add(id)
    for (const [a, b] of graph.links) if (b === id) visit(a)
    out.push(byId.get(id)!)
  }
  for (const n of graph.nodes) visit(n.id)
  return out
}

// ── The mock. ──

/** Steps and time per step, by kind. Inputs and outputs pass in a beat. */
const PACE: Record<RunNode['kind'], { steps: number; ms: number }> = {
  prompt: { steps: 1, ms: 220 },
  image: { steps: 1, ms: 220 },
  generate: { steps: 20, ms: 150 },
  pause: { steps: 1, ms: 0 },
  workflow: { steps: 20, ms: 170 },
  output: { steps: 1, ms: 320 }
}

/** Pictures the mock "makes", taken in turn so each run looks new. */
const GENERATED = [sun, smile, seaside, grass]
const RELIT = [windowLight, grass, smile, seaside]

interface MockJob extends RunJob {
  graph: RunGraph
  order: RunNode[]
  index: number
  step: number
  /** The image flowing along the graph. */
  image?: string
  /** Held by a Pause node, as opposed to by pause(). */
  atPause: boolean
}

export function createMockEngine(): RunEngine {
  const listeners = new Set<(e: RunEvent) => void>()
  const jobs: MockJob[] = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let seq = 0
  let made = 0

  const emit = (e: RunEvent): void => listeners.forEach((l) => l(e))
  const publish = (j: MockJob): void =>
    emit({
      type: 'job',
      job: { id: j.id, title: j.title, status: j.status, progress: j.progress, nodeId: j.nodeId }
    })
  const node = (j: MockJob, state: NodeRunState, extra: Partial<RunEvent> = {}): void =>
    emit({ type: 'node', jobId: j.id, nodeId: j.order[j.index]!.id, state, ...extra } as RunEvent)

  function totalSteps(j: MockJob): number {
    return j.order.reduce((s, n) => s + PACE[n.kind].steps, 0)
  }
  function stepsBefore(j: MockJob): number {
    return j.order.slice(0, j.index).reduce((s, n) => s + PACE[n.kind].steps, 0)
  }

  function finish(j: MockJob, status: JobStatus): void {
    clearTimeout(timer)
    timer = undefined
    j.status = status
    j.nodeId = undefined
    if (status === 'done') j.progress = 1
    publish(j)
    jobs.splice(jobs.indexOf(j), 1)
    emit({ type: 'removed', jobId: j.id })
    next()
  }

  /** Starts the next waiting job if nothing is running. */
  function next(): void {
    if (jobs.some((j) => j.status === 'running' || j.status === 'paused')) return
    const j = jobs.find((x) => x.status === 'queued')
    if (!j) return
    j.status = 'running'
    for (const n of j.order) emit({ type: 'node', jobId: j.id, nodeId: n.id, state: 'queued' })
    enter(j)
  }

  function enter(j: MockJob): void {
    const n = j.order[j.index]
    if (!n) return finish(j, 'done')
    j.step = 0
    j.nodeId = n.id
    const feeds = j.graph.links.filter(([, to]) => to === n.id).map(([from]) => from)
    const empty = j.order.some(
      (u) => feeds.includes(u.id) && u.kind === 'prompt' && !u.params.text?.trim()
    )
    if (n.kind === 'generate' && empty) {
      node(j, 'error', { error: 'The prompt is empty' })
      for (const d of j.order.slice(j.index + 1))
        emit({ type: 'node', jobId: j.id, nodeId: d.id, state: 'idle' })
      return finish(j, 'error')
    }
    if (n.kind === 'pause') {
      j.status = 'paused'
      j.atPause = true
      publish(j)
      node(j, 'paused')
      return
    }
    node(j, 'running', { step: 0, steps: PACE[n.kind].steps })
    publish(j)
    tick(j)
  }

  function tick(j: MockJob): void {
    const n = j.order[j.index]!
    const pace = PACE[n.kind]
    timer = setTimeout(() => {
      j.step++
      j.progress = (stepsBefore(j) + j.step) / totalSteps(j)
      if (j.step < pace.steps) {
        node(j, 'running', { step: j.step, steps: pace.steps })
        publish(j)
        return tick(j)
      }
      leave(j)
    }, pace.ms)
  }

  function leave(j: MockJob): void {
    const n = j.order[j.index]!
    if (n.kind === 'image') j.image = n.params.image
    if (n.kind === 'generate') j.image = GENERATED[made++ % GENERATED.length]
    if (n.kind === 'workflow') j.image = RELIT[made % RELIT.length]
    if (j.image && n.kind !== 'prompt' && n.kind !== 'image' && n.kind !== 'pause')
      emit({ type: 'output', jobId: j.id, nodeId: n.id, image: j.image })
    node(j, 'done')
    j.index++
    enter(j)
  }

  return {
    queue(graph, count = 1) {
      const ids: string[] = []
      for (let i = 0; i < count; i++) {
        const j: MockJob = {
          id: `job-${++seq}`,
          title: graph.title,
          status: 'queued',
          progress: 0,
          graph,
          order: runOrder(graph),
          index: 0,
          step: 0,
          atPause: false
        }
        jobs.push(j)
        ids.push(j.id)
        publish(j)
      }
      next()
      return ids
    },
    cancel(jobId) {
      const j = jobs.find((x) => x.id === jobId)
      if (!j) return
      if (j.status === 'running' || j.status === 'paused') {
        // What it had not reached yet goes back to how it was.
        for (const n of j.order.slice(j.index))
          emit({ type: 'node', jobId, nodeId: n.id, state: 'idle' })
        finish(j, 'cancelled')
      } else {
        jobs.splice(jobs.indexOf(j), 1)
        emit({ type: 'removed', jobId })
      }
    },
    clearQueue() {
      for (const j of jobs.filter((x) => x.status === 'queued')) this.cancel(j.id)
    },
    cancelAll() {
      this.clearQueue()
      for (const j of [...jobs]) this.cancel(j.id)
    },
    pause(jobId) {
      const j = jobs.find((x) => x.id === jobId)
      if (!j || j.status !== 'running') return
      clearTimeout(timer)
      timer = undefined
      j.status = 'paused'
      publish(j)
    },
    resume(jobId) {
      const j = jobs.find((x) => x.id === jobId)
      if (!j || j.status !== 'paused') return
      j.status = 'running'
      if (j.atPause) {
        j.atPause = false
        j.progress = (stepsBefore(j) + 1) / totalSteps(j)
        return leave(j)
      }
      publish(j)
      tick(j)
    },
    on(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispose() {
      clearTimeout(timer)
      jobs.length = 0
      listeners.clear()
    }
  }
}
