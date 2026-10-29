import { isMariana } from '../proposal'
import { go, type Page } from '../../useProto'

/** The pages Mar's proposal draws itself (MarPages.vue). A trailing ':'
 *  takes every page under it (project:…, space:…). */
export const MAR_PAGES = ['workflows']

export const marOwns = (page: string): boolean =>
  isMariana.value &&
  (MAR_PAGES.includes(page) || MAR_PAGES.some((p) => p.endsWith(':') && page.startsWith(p)))

// Screenshots and the console reach any page, sidebar or not.
;(window as unknown as { __marGo?: (p: string) => void }).__marGo = (p) => go(p as Page)
