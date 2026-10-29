import type { Component } from 'vue'

/** One line of an item's menu (Mar's pages). A `sub` opens a second
 *  panel (Move to project); `danger` is the red one, always last. */
export interface MenuAction {
  label: string
  icon?: Component
  run?: () => void
  danger?: boolean
  hint?: string
  checked?: boolean
  disabled?: boolean
  sub?: MenuAction[]
}
export type MenuLine = MenuAction | 'sep'
