<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  AppWindow,
  Boxes,
  ChevronsUpDown,
  Circle,
  Code,
  Coins,
  Compass,
  GraduationCap,
  Home,
  Images,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  MessageSquare,
  Palette,
  Plus,
  Rocket,
  ScrollText,
  Server,
  Workflow
} from 'lucide-vue-next'
import { go, goIn, proto, toast, workspace, type Mode, type Page } from '../../useProto'
import { agent, resetAgent } from '../../agent'
import { flow, resetFlow } from '../../appFlow'
import { can, landingPage } from '../../milestones'
import { INSTANCES, PROJECTS, USER } from '../../mock'
import { SPACES } from '../../spaces'
import { marNav } from './marShell'
import { marTabsOn } from './titleTabs'
import portraitSeaside from '../assets/portrait-seaside.jpg'
import lakeFog from '../assets/lake-fog.jpg'
import portraitWindow from '../assets/portrait-window.jpg'
import portraitGrass from '../assets/portrait-grass.jpg'
import hillsFog from '../assets/hills-fog.jpg'

/**
 * Mar's sidebar (Navigation: Sidebar or Floating): the lens switch and the
 * collapse button on top, the pages, projects with a photo each,
 * spaces, and credits and the workspace at the foot, like Pablo's. Collapses to a rail of icons. Same
 * places as the dock (MarDock.vue); only the shape changes.
 */
interface Item {
  page: Page
  label: string
  icon: Component
  prefix?: string
  count?: number
}

const CREATE: { title?: string; items: Item[] }[] = [
  {
    items: [
      { page: 'overview', label: 'Home', icon: Home },
      { page: 'explore', label: 'Explore', icon: Compass },
      { page: 'tutorials', label: 'Learn', icon: GraduationCap }
    ]
  },
  {
    title: 'Libraries',
    items: [
      { page: 'workflows', label: 'Workflows', icon: Workflow },
      { page: 'apps', label: 'Apps', icon: AppWindow, prefix: 'app:' },
      { page: 'assets', label: 'Assets', icon: Images },
      {
        page: 'environments',
        label: 'Builds',
        icon: Server,
        prefix: 'environment:',
        count: INSTANCES.length
      }
    ]
  }
]
const BUILD: { title?: string; items: Item[] }[] = [
  {
    items: [
      { page: 'build-overview', label: 'Overview', icon: LayoutDashboard },
      { page: 'deployments', label: 'Deployments', icon: Rocket, prefix: 'deployment:' },
      { page: 'environments', label: 'Builds', icon: Server, prefix: 'environment:' }
    ]
  },
  {
    title: 'API',
    items: [
      { page: 'router', label: 'Models', icon: Boxes },
      { page: 'logs', label: 'Logs', icon: ScrollText },
      { page: 'keys', label: 'API keys', icon: KeyRound }
    ]
  }
]
const groups = computed(() =>
  proto.mode === 'build' ? BUILD : proto.mode === 'create' ? CREATE : []
)
const isOn = (i: Item): boolean =>
  proto.activeTab === 'home' &&
  (proto.page === i.page || Boolean(i.prefix && proto.page.startsWith(i.prefix)))

const ART = [portraitSeaside, lakeFog, portraitWindow, portraitGrass, hillsFog]
const projects = computed(() => PROJECTS.map((p, i) => ({ ...p, art: ART[i % ART.length]! })))

const LENSES: { value: Mode; label: string; icon: Component }[] = [
  { value: 'create', label: 'Create', icon: Palette },
  { value: 'build', label: 'Build', icon: Code },
  { value: 'agent', label: 'Agent', icon: MessageCircle }
]
const lenses = computed(() =>
  LENSES.filter((l) => l.value !== 'agent' || (can.value.agent && !marTabsOn.value))
)
function lens(m: Mode): void {
  goIn(m, m === 'build' ? 'build-overview' : m === 'agent' ? 'agent' : landingPage())
}
const open = computed(() => !marNav.collapsed)

// Agent lens: a new chat and the recent ones, as in Pablo's AgentNav.
const currentChat = computed(
  () => (flow.messages.length ? flow.messages : agent.messages).find((m) => m.role === 'user')?.text
)
const RECENT_CHATS = [
  'Seasonal backgrounds for Nike',
  'Coca-Cola shade swatches app',
  'Upscale Porsche renders to 4K'
]
function newChat(): void {
  resetAgent()
  resetFlow()
  go('agent')
}
</script>

<template>
  <aside class="mar-side" :class="!open && 'is-rail'" aria-label="Navigation">
    <!-- Lens switch and collapse, on one line (stacked on the rail). -->
    <div class="mar-side-head" :class="!open && 'is-rail'">
      <div
        v-if="can.builder"
        class="mar-seg mar-side-lens"
        :class="!open && 'is-rail'"
        role="radiogroup"
        aria-label="Mode"
      >
        <button
          v-for="l in lenses"
          :key="l.value"
          type="button"
          role="radio"
          :aria-checked="proto.mode === l.value"
          :aria-pressed="proto.mode === l.value"
          :aria-label="l.label"
          :title="l.label"
          class="mar-side-lens-btn"
          @click="lens(l.value)"
        >
          <component :is="l.icon" :size="15" /><span v-if="open && proto.mode === l.value">{{
            l.label
          }}</span>
        </button>
      </div>
      <button
        type="button"
        class="mar-side-icon mar-side-well"
        :aria-label="open ? 'Collapse sidebar' : 'Expand sidebar'"
        :title="open ? 'Collapse' : 'Expand'"
        @click="marNav.collapsed = !marNav.collapsed"
      >
        <PanelLeftClose v-if="open" :size="16" /><PanelLeftOpen v-else :size="16" />
      </button>
    </div>

    <nav class="mar-side-scroll">
      <template v-for="(g, gi) in groups" :key="gi">
        <div v-if="g.title" class="mar-side-label">
          <span v-if="open">{{ g.title }}</span
          ><span v-else class="mar-side-sep" />
        </div>
        <button
          v-for="i in g.items"
          :key="i.label"
          type="button"
          class="mar-side-row"
          :class="isOn(i) && 'is-on'"
          :aria-current="isOn(i) ? 'page' : undefined"
          :title="open ? undefined : i.label"
          @click="go(i.page)"
        >
          <component :is="i.icon" :size="16" />
          <template v-if="open"
            ><span class="flex-1 truncate">{{ i.label }}</span
            ><span v-if="i.count" class="text-subtle-foreground">{{ i.count }}</span></template
          >
        </button>
      </template>

      <template v-if="proto.mode === 'agent'">
        <button
          type="button"
          class="mar-side-row"
          :title="open ? undefined : 'New chat'"
          @click="newChat"
        >
          <Plus :size="16" /><span v-if="open" class="flex-1 truncate">New chat</span>
        </button>
        <div class="mar-side-label">
          <span v-if="open">Recent</span><span v-else class="mar-side-sep" />
        </div>
        <button
          v-if="currentChat"
          type="button"
          class="mar-side-row is-on"
          :title="open ? undefined : currentChat"
          @click="go('agent')"
        >
          <MessageSquare :size="16" /><span v-if="open" class="flex-1 truncate">{{
            currentChat
          }}</span>
        </button>
        <button
          v-for="r in RECENT_CHATS"
          :key="r"
          type="button"
          class="mar-side-row"
          :title="open ? undefined : r"
          @click="toast(`Open “${r}”`)"
        >
          <MessageSquare :size="16" /><span v-if="open" class="flex-1 truncate">{{ r }}</span>
        </button>
      </template>

      <template v-if="proto.mode === 'create' && can.projects">
        <div class="mar-side-label">
          <template v-if="open"
            ><span class="flex-1">Projects</span
            ><Plus :size="14" class="text-subtle-foreground" /></template
          ><span v-else class="mar-side-sep" />
        </div>
        <button v-if="open" type="button" class="mar-side-row" @click="go('projects')">
          <LayoutGrid :size="16" /><span class="flex-1">All projects</span
          ><span class="text-subtle-foreground">{{ PROJECTS.length }}</span>
        </button>
        <button
          v-for="p in projects.slice(0, 4)"
          :key="p.id"
          type="button"
          class="mar-side-row"
          :class="proto.page === `project:${p.id}` && 'is-on'"
          :title="open ? undefined : p.name"
          @click="go(`project:${p.id}` as Page)"
        >
          <img :src="p.art" alt="" class="mar-side-thumb" /><span v-if="open" class="truncate">{{
            p.name
          }}</span>
        </button>
      </template>

      <template v-if="proto.mode === 'create' && can.spaces">
        <div class="mar-side-label">
          <template v-if="open"
            ><span class="flex-1">Spaces</span><Plus :size="14" class="text-subtle-foreground"
          /></template>
          <span v-else class="mar-side-sep" />
        </div>
        <button v-if="open" type="button" class="mar-side-row" @click="go('spaces')">
          <LayoutGrid :size="16" /><span class="flex-1">All spaces</span
          ><span class="text-subtle-foreground">{{ SPACES.length }}</span>
        </button>
        <button
          v-for="s in SPACES"
          :key="s.id"
          type="button"
          class="mar-side-row"
          :class="proto.page === `space:${s.id}` && 'is-on'"
          :title="open ? undefined : s.name"
          @click="go(`space:${s.id}` as Page)"
        >
          <Circle :size="16" /><template v-if="open"
            ><span class="flex-1 truncate">{{ s.name }}</span
            ><span v-if="s.status === 'draft'" class="text-subtle-foreground">Draft</span></template
          >
        </button>
      </template>
    </nav>

    <button
      type="button"
      class="mar-side-credits"
      :title="open ? undefined : 'Credits'"
      @click="go('billing')"
    >
      <Coins :size="16" /><template v-if="open"
        ><span class="flex-1 text-left">Credits</span><span>{{ USER.credits }}</span></template
      >
    </button>

    <!-- Workspace, at the foot like Pablo's sidebar. -->
    <button
      type="button"
      class="mar-side-ws"
      :title="open ? undefined : workspace.name"
      @click="toast('Switch workspace')"
    >
      <span class="mar-side-avatar">{{ workspace.name.charAt(0) }}</span>
      <template v-if="open">
        <span class="flex min-w-0 flex-1 flex-col text-left leading-tight">
          <span class="truncate">{{ workspace.name }}</span>
          <span v-if="workspace.plan" class="truncate font-normal text-subtle-foreground">{{
            workspace.plan
          }}</span>
        </span>
        <ChevronsUpDown :size="14" class="text-subtle-foreground" />
      </template>
    </button>
  </aside>
</template>

<style scoped>
.mar-side {
  position: fixed;
  top: 52px;
  bottom: 8px;
  left: 8px;
  z-index: 40;
  display: flex;
  width: 260px;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 20px;
  background: color-mix(
    in oklch,
    color-mix(in oklch, var(--color-base-foreground) 4%, var(--color-content-background)) 82%,
    transparent
  );
  backdrop-filter: blur(40px) saturate(1.3);
  box-shadow:
    0 24px 64px -24px rgb(0 0 0 / 0.7),
    inset 0 0 0 1px color-mix(in oklch, var(--color-base-foreground) 5%, transparent),
    inset 0 1px 0 color-mix(in oklch, var(--color-base-foreground) 7%, transparent);
  transition: width 320ms cubic-bezier(0.645, 0.045, 0.355, 1);
  -webkit-app-region: no-drag;
}
.mar-side.is-rail {
  width: 64px;
  align-items: center;
  padding: 10px 8px;
}
.mar-side-head {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.mar-side-head.is-rail {
  flex-direction: column-reverse;
  gap: 8px;
}
.mar-side-ws {
  display: flex;
  width: 100%;
  min-width: 0;
  flex: none;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  padding: 4px;
  font-size: 14px;
  font-weight: 500;
}
.mar-side-ws:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
.mar-side-avatar {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
  color: var(--color-base-foreground);
  font-size: 12px;
  font-weight: 600;
}
.mar-side-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--color-muted-foreground);
}
.mar-side-well {
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
}
.mar-side-icon:hover {
  color: var(--color-base-foreground);
}
.mar-side-lens {
  display: flex;
  width: 100%;
  gap: 2px;
  padding: 3px;
  border-radius: 12px;
  background: color-mix(in oklch, var(--color-base-foreground) 5%, transparent);
}
.mar-side-lens.is-rail {
  flex-direction: column;
}
.mar-side-lens-btn {
  display: inline-flex;
  flex: 1;
  height: 30px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 9px;
  color: var(--color-muted-foreground);
  font-size: var(--text-ui);
  transition: color 160ms ease;
}
.mar-side-lens-btn[aria-pressed='true'],
.mar-side-lens-btn:hover {
  color: var(--color-base-foreground);
}
.mar-side-scroll {
  display: flex;
  min-height: 0;
  width: 100%;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  scrollbar-width: none;
}
.is-rail .mar-side-scroll {
  align-items: center;
}
.mar-side-label {
  display: flex;
  align-items: center;
  padding: 14px 10px 6px;
  color: var(--color-subtle-foreground);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.is-rail .mar-side-label {
  padding: 8px 0 4px;
}
.mar-side-sep {
  display: block;
  width: 28px;
  height: 1px;
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
}
.mar-side-row {
  display: flex;
  width: 100%;
  height: 34px;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border-radius: 10px;
  color: var(--color-muted-foreground);
  font-size: var(--text-ui);
  text-align: left;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}
.is-rail .mar-side-row {
  width: 40px;
  justify-content: center;
  padding: 0;
}
.mar-side-row:hover {
  background: color-mix(in oklch, var(--color-base-foreground) 6%, transparent);
  color: var(--color-base-foreground);
}
.mar-side-row.is-on {
  background: color-mix(in oklch, var(--color-base-foreground) 10%, transparent);
  color: var(--color-base-foreground);
}
.mar-side-thumb {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: cover;
}
.mar-side-credits {
  display: flex;
  width: 100%;
  height: 38px;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 12px;
  color: var(--color-base-foreground);
  font-size: var(--text-ui);
  font-weight: 500;
}
.is-rail .mar-side-credits {
  width: 40px;
  justify-content: center;
  padding: 0;
}
@media (prefers-reduced-motion: reduce) {
  .mar-side {
    transition: none;
  }
}
</style>
