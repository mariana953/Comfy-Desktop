<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import PromptBox from '../../parts/PromptBox.vue'
import MediaChip from '../MediaChip.vue'
import { go, hostActions, instances, toast } from '../../useProto'
import { RECENT_ART, minutesAgo, news, orb, recent, spaceMeta, spaces } from './P20HomeData'

/**
 * 11 · Timeline (Figma 118:2546): today's work as a log. The greeting and
 * the prompt lead the left column; under them every run, edit, share and
 * build update, by day, with the time on the left and the outputs as a
 * strip of thumbnails. What's new and Spaces sit in a column on the right.
 */

/** The prototype's clock stops mid-afternoon, so the log always reads as
 *  a working day (a real clock at 00:30 would leave Today empty). */
const NOW = (() => {
  const d = new Date()
  d.setHours(16, 20, 0, 0)
  return d.getTime()
})()
const clock = (min: number, day: string): string =>
  new Date(NOW - min * 60_000).toLocaleString(
    'en-GB',
    day === 'Earlier' ? { weekday: 'short' } : { hour: '2-digit', minute: '2-digit' }
  )
const dayOf = (min: number): 'Today' | 'Yesterday' | 'Earlier' => {
  const at = NOW - min * 60_000
  const midnight = new Date(NOW).setHours(0, 0, 0, 0)
  if (at >= midnight) return 'Today'
  return at >= midnight - 86_400_000 ? 'Yesterday' : 'Earlier'
}

type Tone = 'done' | 'event'
interface Entry {
  id: string
  min: number
  tone: Tone
  title: string
  meta: string
  strip: string[]
  action: string
  run: () => void
}

const DURATIONS = ['1 min 12 s', '48 s', '2 min 05 s', '36 s']
const entries = computed<Entry[]>(() => {
  const runs: Entry[] = recent.value.slice(0, 5).map((r, i) => {
    const finished = i % 2 === 0
    const count = finished ? 4 - (i % 3) : i === 1 ? 2 : 0
    const strip = Array.from(
      { length: count },
      (_, k) => RECENT_ART[(i * 3 + k) % RECENT_ART.length]!
    )
    return {
      id: r.w.id,
      min: r.w.age,
      tone: finished ? 'done' : 'event',
      title: `${r.title} ${finished ? 'finished' : 'updated'}`,
      meta: finished
        ? [`${count} outputs`, r.env?.name, DURATIONS[i % DURATIONS.length]]
            .filter(Boolean)
            .join(' · ')
        : [r.w.project ?? r.env?.name, `${3 + i} nodes changed`].filter(Boolean).join(' · '),
      strip,
      action: finished ? 'Open' : 'Diff',
      run: () => (r.env ? hostActions.launch(r.env, r.w.name) : go('workflows'))
    }
  })
  // What happened in your spaces, next to your own work.
  const shared: Entry[] = spaces
    .filter((s) => s.status === 'live' && s.activity[0])
    .slice(0, 1)
    .map((s) => {
      const a = s.activity[0]!
      return {
        id: `space-${s.id}`,
        min: minutesAgo(a.when),
        tone: 'event',
        title: `${a.who} ${a.what}`,
        meta: `${s.name} space`,
        strip: [],
        action: 'View',
        run: () => go(`space:${s.id}`)
      }
    })
  // A build waiting on an update.
  const builds: Entry[] = instances.value
    .filter((i) => i.state === 'update')
    .slice(0, 1)
    .map((i) => ({
      id: `build-${i.id}`,
      min: 20 * 60,
      tone: 'event',
      title: `${i.name} has an update`,
      meta: ['Build', i.version ? `ComfyUI ${i.version}` : undefined].filter(Boolean).join(' · '),
      strip: [],
      action: 'Update',
      run: () => go('environments')
    }))
  // Two things never land on the same minute: spread ties a little apart.
  const all = [...runs, ...shared, ...builds].sort((a, b) => a.min - b.min)
  for (let i = 1; i < all.length; i++) {
    if (all[i]!.min - all[i - 1]!.min < 6) all[i]!.min = all[i - 1]!.min + 6 + ((i * 17) % 31)
  }
  return all
})

const days = computed(() => {
  const out: { day: string; rows: Entry[] }[] = []
  for (const e of entries.value) {
    const day = dayOf(e.min)
    const last = out.at(-1)
    if (last?.day === day) last.rows.push(e)
    else out.push({ day, rows: [e] })
  }
  return out
})

const whatsNew = news.slice(0, 2)
</script>

<template>
  <div
    class="mx-auto grid w-full max-w-300 grid-cols-[minmax(0,1fr)_minmax(280px,380px)] gap-x-10 px-10 pt-16 pb-16"
  >
    <!-- Left: greeting, prompt and the day's log. -->
    <div class="min-w-0">
      <h1 class="mar-greeting mb-5 text-[32px] leading-[1.15] tracking-[-0.03em]">
        Hi Mar. Let's create
      </h1>
      <div class="mar-prompt-slot"><PromptBox target class="mar-prompt" /></div>

      <section class="mt-10" aria-label="Your work, by day">
        <div v-for="d in days" :key="d.day" class="p11-day">
          <h2
            class="mb-2.5 text-[11px] font-medium tracking-[0.06em] text-subtle-foreground uppercase"
          >
            {{ d.day }}
          </h2>
          <ol>
            <li
              v-for="e in d.rows"
              :key="e.id"
              class="p11-row grid grid-cols-[44px_16px_minmax(0,1fr)_auto] gap-x-3"
            >
              <time class="text-xs leading-5 text-subtle-foreground tabular-nums">{{
                clock(e.min, d.day)
              }}</time>
              <span class="p11-rail relative flex justify-center" aria-hidden="true">
                <span
                  :class="[
                    'p11-dot mt-1.5 size-2 rounded-full',
                    d.day === 'Today' ? `is-${e.tone}` : 'is-past'
                  ]"
                />
              </span>
              <div class="min-w-0 pb-5">
                <p class="truncate text-sm leading-5 font-medium">{{ e.title }}</p>
                <p class="mt-0.5 truncate text-xs text-subtle-foreground">{{ e.meta }}</p>
                <div v-if="e.strip.length" class="mt-2.5 flex gap-1.5">
                  <img
                    v-for="(src, k) in e.strip"
                    :key="k"
                    :src
                    alt=""
                    class="h-12 w-16 rounded-[8px] object-cover"
                  />
                </div>
              </div>
              <button type="button" class="p11-link" @click="e.run()">
                {{ e.action }}<ArrowRight :size="12" aria-hidden="true" />
              </button>
            </li>
          </ol>
        </div>
      </section>
    </div>

    <!-- Right: what's new and spaces. -->
    <aside class="flex min-w-0 flex-col gap-9 pt-1.5">
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[15px] font-semibold">What's new</h2>
          <button type="button" class="p11-link" @click="toast('All launches')">
            All<ArrowRight :size="12" aria-hidden="true" />
          </button>
        </div>
        <div class="flex flex-col gap-2.5">
          <button
            v-for="l in whatsNew"
            :key="l.title"
            type="button"
            class="p11-news group"
            @click="toast(`Try ${l.title}`)"
          >
            <video
              v-if="l.video"
              :src="l.video"
              autoplay
              muted
              loop
              playsinline
              class="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <span
              class="absolute inset-0 bg-[linear-gradient(90deg,rgb(0_0_0/0.55),rgb(0_0_0/0.08)_75%)]"
            />
            <span class="relative flex h-full flex-col justify-center px-5 text-left text-white">
              <MediaChip class="mb-2 self-start">New</MediaChip>
              <span class="text-lg leading-6 font-bold tracking-[-0.01em]">{{ l.title }}</span>
              <span class="mt-0.5 text-ui text-white/80">{{ l.blurb }}</span>
            </span>
          </button>
        </div>
      </section>

      <section>
        <div class="mb-1.5 flex items-center justify-between">
          <h2 class="text-[15px] font-semibold">
            Spaces<span class="ml-1.5 font-normal text-subtle-foreground">{{ spaces.length }}</span>
          </h2>
          <button type="button" class="p11-link" @click="go('spaces')">
            All<ArrowRight :size="12" aria-hidden="true" />
          </button>
        </div>
        <ul class="-mx-2.5 flex flex-col">
          <li v-for="s in spaces" :key="s.id">
            <button type="button" class="p11-space" @click="go(`space:${s.id}`)">
              <span class="size-8 shrink-0 rounded-full" :style="orb(s.brand.color)" />
              <span class="min-w-0 text-left">
                <span class="block truncate text-ui leading-5 font-medium">{{ s.name }}</span>
                <span class="block truncate text-[11px] leading-4 text-subtle-foreground">{{
                  spaceMeta(s)
                }}</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </aside>
  </div>
</template>

<style scoped>
.p11-day + .p11-day {
  margin-top: 6px;
}
/* The day's line runs from its first dot to its last. */
.p11-rail::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  translate: -0.5px 0;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
.p11-row:first-child .p11-rail::before {
  top: 10px;
}
.p11-row:last-child .p11-rail::before {
  bottom: auto;
  height: 10px;
}
.p11-row:only-child .p11-rail::before {
  display: none;
}
.p11-dot {
  position: relative;
  box-shadow: 0 0 0 4px var(--color-content-background);
}
.p11-dot.is-done {
  background: var(--color-status-running);
}
.p11-dot.is-event {
  background: var(--color-base-foreground);
}
.p11-dot.is-past {
  background: var(--color-subtle-foreground);
}
</style>

<style>
/* Pablo's button reset wipes padding and width: these keep their own. */
:root .proto-ui.proto-ui.proto-ui .p11-link {
  display: inline-flex;
  align-items: center;
  align-self: start;
  gap: 4px;
  height: 20px;
  padding: 0 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-muted-foreground);
  border-radius: 6px;
  transition: color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p11-link:hover {
  color: var(--color-base-foreground);
}
:root .proto-ui.proto-ui.proto-ui :is(.p11-link, .p11-news, .p11-space):focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
:root .proto-ui.proto-ui.proto-ui .p11-news {
  position: relative;
  display: block;
  width: 100%;
  height: 128px;
  padding: 0;
  overflow: hidden;
  border-radius: 14px;
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
:root .proto-ui.proto-ui.proto-ui .p11-space {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 12px;
  transition: background-color 150ms ease;
}
:root .proto-ui.proto-ui.proto-ui .p11-space:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
}
</style>
