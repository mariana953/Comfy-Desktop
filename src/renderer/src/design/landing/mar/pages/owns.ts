import { isMariana } from '../proposal'
import { go, proto, type Page } from '../../useProto'

/** The pages Mar's proposal draws itself (MarPages.vue). A trailing ':'
 *  takes every page under it (project:…, space:…). Builds only in Create:
 *  Build's lens (versions, deployments) stays Pablo's. */
export const MAR_PAGES = [
  'workflows',
  'apps',
  'assets',
  'environments',
  'instances',
  'projects',
  'project:'
]

export const marOwns = (page: string): boolean =>
  isMariana.value &&
  !(proto.mode === 'build' && (page === 'environments' || page === 'instances')) &&
  (MAR_PAGES.includes(page) || MAR_PAGES.some((p) => p.endsWith(':') && page.startsWith(p)))

// Screenshots and the console reach any page, sidebar or not.
;(window as unknown as { __marGo?: (p: string) => void }).__marGo = (p) => go(p as Page)
