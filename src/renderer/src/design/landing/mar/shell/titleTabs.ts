import { computed, reactive, watch } from 'vue'
import { isMariana } from '../proposal'

/**
 * Mar's title bar tweak (Prototype menu › Title bar), to compare with
 * Pablo's breadcrumb. Tabs: the bar holds only tabs, like Figma - Home as
 * an icon, one tab per open workflow and app - plus where things run and
 * the agent on the right. The lens switch keeps Create and Build, both
 * named; the agent leaves it.
 */

export type TitleBarStyle = 'breadcrumb' | 'tabs'

const KEY = 'comfy.design.mar.titleBar'

function load(): TitleBarStyle {
  try {
    return localStorage.getItem(KEY) === 'tabs' ? 'tabs' : 'breadcrumb'
  } catch {
    // Storage blocked: Pablo's breadcrumb.
    return 'breadcrumb'
  }
}

export const titleTabs = reactive<{ style: TitleBarStyle }>({ style: load() })

watch(
  () => titleTabs.style,
  (style) => {
    try {
      localStorage.setItem(KEY, style)
    } catch {
      // Storage blocked: the pick lasts for this window only.
    }
  }
)

/** The tabs title bar is on: Mar's proposal with the tweak picked. */
export const marTabsOn = computed(() => isMariana.value && titleTabs.style === 'tabs')
