import { reactive } from 'vue'

/**
 * The toast with an Undo (Mar's pages): deleting, moving or archiving
 * never asks first; it happens, and the toast offers it back for a few
 * seconds. One at a time; a new one replaces the last.
 */
export const undoToast = reactive<{ message: string; undo: (() => void) | null; key: number }>({
  message: '',
  undo: null,
  key: 0
})

let timer: ReturnType<typeof setTimeout> | undefined

export function notify(message: string, undo?: () => void): void {
  undoToast.message = message
  undoToast.undo = undo ?? null
  undoToast.key++
  clearTimeout(timer)
  timer = setTimeout(dismiss, undo ? 6000 : 2600)
}

export function dismiss(): void {
  clearTimeout(timer)
  undoToast.message = ''
  undoToast.undo = null
}

export function runUndo(): void {
  const fn = undoToast.undo
  dismiss()
  if (fn) {
    fn()
    notify('Undone')
  }
}

/** "1 workflow", "3 workflows". */
export const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`
