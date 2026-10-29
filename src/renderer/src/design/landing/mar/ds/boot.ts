import '../../../../assets/main.css'
import './kit/ds.css'
import { createApp, type Component } from 'vue'

/**
 * Three kinds of document share this entry, picked by `?frame=`:
 *   (none)  the page itself: nav, About, and the theme frames
 *   page    one component page in one theme (an iframe per theme)
 *   stage   one component opened (a menu, a tooltip), inside a page
 *
 * Mar's styles hang off <html> (`data-ds-theme`, `data-mar-ui`…), so a
 * theme can't be scoped to a pane: each theme renders in its own frame.
 */
const url = new URLSearchParams(location.search)
const frame = url.get('frame')

async function boot(): Promise<void> {
  let root: Component
  if (frame === 'page' || frame === 'stage') {
    const theme = url.get('theme') === 'light' ? 'light' : 'dark'
    const html = document.documentElement
    html.dataset.dsDirection = 'original'
    html.dataset.dsTheme = theme
    html.classList.add('ds-frame')
    // The same modules the prototype loads for Mar's proposal, so every
    // knob sets its <html> attribute and stylesheet at its default.
    await import('./defaults')
    const { installForcedStates } = await import('./kit/force')
    installForcedStates()
    root =
      frame === 'page'
        ? (await import('./kit/PageFrame.vue')).default
        : (await import('./kit/StageFrame.vue')).default
  } else {
    root = (await import('./DsApp.vue')).default
  }
  createApp(root).mount('#app')
}

void boot()
