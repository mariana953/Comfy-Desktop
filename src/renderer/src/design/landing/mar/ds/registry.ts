import { defineAsyncComponent, type Component } from 'vue'

/**
 * The pages, in nav order. `source` is where the component lives (paths
 * from `src/renderer/src/design/landing/`); `use` is when to reach for it.
 * A page without a component is drawn by the app itself (About).
 */
export interface DsPage {
  id: string
  label: string
  group: string
  title: string
  source?: string
  use?: string
  component?: Component
}

const lazy = (load: () => Promise<{ default: Component }>): Component => defineAsyncComponent(load)

export const PAGES: DsPage[] = [
  { id: 'about', label: 'About', group: 'Docs', title: "Mar's design system" },
  {
    id: 'default-view',
    label: 'Default view',
    group: 'Put together',
    title: 'Default view',
    source: 'LandingPrototypes.vue with Proposal: Mar',
    use: 'To check a component in place, next to everything around it.',
    component: lazy(() => import('./pages/DefaultViewPage.vue'))
  },
  {
    id: 'background',
    label: 'Home spotlight',
    group: 'Put together',
    title: 'Home spotlight',
    source: 'mar/shell/MarBackdrop.vue, .is-spotlight in mar/shell/marShell.css',
    use: 'Behind Home only; other pages stay plain or take their page photo.',
    component: lazy(() => import('./pages/BackgroundPage.vue'))
  },
  {
    id: 'title-bar',
    label: 'Title bar',
    group: 'Shell',
    title: 'Title bar',
    source:
      'parts/DesktopTitleBar.vue, parts/nav/TitleBarBreadcrumb.vue, parts/nav/SwitcherMenu.vue',
    use: 'The browser stand-in for the app bar; the breadcrumb is where you switch builds.',
    component: lazy(() => import('./pages/TitleBarPage.vue'))
  },
  {
    id: 'sidebar',
    label: 'Sidebar',
    group: 'Shell',
    title: 'Sidebar',
    source:
      'mar/modes/MarModeSwitch.vue, parts/env/ModeNav.vue, mar/shell/MarGroupTitle.vue, parts/env/SidebarGroup.vue, parts/space/SpacesGroup.vue, parts/WorkspaceMenu.vue',
    use: 'Navigation between lenses, pages, projects and spaces; credits and the workspace at the foot.',
    component: lazy(() => import('./pages/SidebarPage.vue'))
  },
  {
    id: 'tooltip',
    label: 'Tooltip',
    group: 'Shell',
    title: 'Tooltip',
    source: 'ui/Tooltip.vue (.mar-tip in mar/shell/marShell.css)',
    use: 'Name an icon-only control or explain a state; never for text already on screen.',
    component: lazy(() => import('./pages/TooltipPage.vue'))
  },
  {
    id: 'prompt',
    label: 'Prompt box',
    group: 'Home',
    title: 'Prompt box',
    source: 'parts/PromptBox.vue with .mar-prompt (mar/shell/marShell.css)',
    use: "Home's one place to type: what to make, and on which build.",
    component: lazy(() => import('./pages/PromptPage.vue'))
  },
  {
    id: 'cards',
    label: 'Cards',
    group: 'Home',
    title: 'Cards',
    source:
      'ui/SectionHeader.vue, mar/WorkflowCard.vue (ui/MediaCard.vue), parts/space/SpaceCard.vue, parts/space/DeployedTo.vue',
    use: 'Recently used for workflows, Spaces for spaces; the Draft chip where a workflow is in no space.',
    component: lazy(() => import('./pages/CardsPage.vue'))
  },
  {
    id: 'banner',
    label: "What's new",
    group: 'Home',
    title: "What's new",
    source: 'mar/LaunchBanner.vue',
    use: 'One launch at a time on Home; the dots step through the others.',
    component: lazy(() => import('./pages/BannerPage.vue'))
  },
  {
    id: 'buttons',
    label: 'Buttons',
    group: 'Controls',
    title: 'Buttons',
    source: 'ui/Button.vue, ui/button.variants.ts',
    use: 'Primary once per surface; ghost for rows and icons; link for section links.',
    component: lazy(() => import('./pages/ButtonsPage.vue'))
  },
  {
    id: 'menus',
    label: 'Menus',
    group: 'Controls',
    title: 'Menus',
    source:
      'mar/CreateMenu.vue, mar/MarWorkspaceMenu.vue, parts/PromptBox.vue, parts/nav/SwitcherMenu.vue, ui/DropdownMenu*.vue (menu family in mar/shell/marShell.css, layers in mar/menus/layers.css)',
    use: 'Any list of actions or choices that opens from a trigger.',
    component: lazy(() => import('./pages/MenusPage.vue'))
  },
  {
    id: 'filters',
    label: 'Scope tabs',
    group: 'Controls',
    title: 'Scope tabs',
    source: 'ui/SegmentedControl.vue (filter system in mar/shell/marShell.css)',
    use: 'Narrow a page to one scope (All / This computer / Cloud).',
    component: lazy(() => import('./pages/FiltersPage.vue'))
  }
]
