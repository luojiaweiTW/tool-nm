import { onMounted, onUnmounted } from 'vue'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
}

/**
 * 全局快捷键组合器
 */
export function useKeyboard() {
  const shortcuts = new Map<string, KeyboardShortcut>()

  const getShortcutKey = (shortcut: Omit<KeyboardShortcut, 'handler' | 'description'>) => {
    return `${shortcut.ctrl ? 'ctrl+' : ''}${shortcut.shift ? 'shift+' : ''}${shortcut.alt ? 'alt+' : ''}${shortcut.key.toLowerCase()}`
  }

  const register = (shortcut: KeyboardShortcut) => {
    const key = getShortcutKey(shortcut)
    shortcuts.set(key, shortcut)
  }

  const unregister = (shortcut: Omit<KeyboardShortcut, 'handler' | 'description'>) => {
    const key = getShortcutKey(shortcut)
    shortcuts.delete(key)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const key = `${event.ctrlKey ? 'ctrl+' : ''}${event.shiftKey ? 'shift+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`
    
    const shortcut = shortcuts.get(key)
    if (shortcut) {
      event.preventDefault()
      shortcut.handler(event)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    shortcuts.clear()
  })

  return {
    register,
    unregister,
  }
}

/**
 * 注册全局快捷键（在 App.vue 或 main layout 中使用）
 */
export function useGlobalShortcuts() {
  const { register } = useKeyboard()

  // Ctrl+K: 全局搜索
  register({
    key: 'k',
    ctrl: true,
    description: '打开全局搜索',
    handler: () => {
      const searchInput = document.querySelector('.neon-sidebar__search-input') as HTMLInputElement
      if (searchInput) {
        searchInput.focus()
        searchInput.select()
      }
    }
  })

  // Ctrl+F: 聚焦当前页面主输入框
  register({
    key: 'f',
    ctrl: true,
    description: '聚焦当前工具输入框',
    handler: () => {
      // 查找页面中第一个 textarea 或 NeonTextarea
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        textarea.focus()
        textarea.select()
      }
    }
  })

  // Ctrl+Shift+C: 复制结果
  register({
    key: 'c',
    ctrl: true,
    shift: true,
    description: '复制结果到剪贴板',
    handler: () => {
      // 触发页面中的复制按钮
      const copyButton = document.querySelector('[data-action="copy"]') as HTMLButtonElement
      if (copyButton) {
        copyButton.click()
      }
    }
  })

  // Esc: 关闭弹窗/清除焦点
  register({
    key: 'escape',
    description: '关闭弹窗或清除焦点',
    handler: () => {
      const activeElement = document.activeElement as HTMLElement
      if (activeElement && activeElement.blur) {
        activeElement.blur()
      }
    }
  })
}

