import { ref, customRef, watch, type Ref } from 'vue'

/**
 * ⚡ 防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay = 300): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }) as T
}

/**
 * ⚡ 防抖 Ref
 * 创建一个自动防抖的响应式变量
 * @param value 初始值
 * @param delay 防抖延迟（毫秒）
 * @returns 防抖后的 ref
 */
export function useDebouncedRef<T>(value: T, delay = 300): Ref<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined

  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        if (timeout) clearTimeout(timeout)

        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      },
    }
  })
}

/**
 * ⚡ 监听并防抖
 * 监听一个 ref 的变化，防抖后执行回调
 * @param source 要监听的 ref
 * @param callback 回调函数
 * @param delay 防抖延迟（毫秒）
 */
export function watchDebounced<T>(
  source: Ref<T>,
  callback: (value: T) => void,
  delay = 300
) {
  let timeout: ReturnType<typeof setTimeout> | undefined

  watch(source, (newValue) => {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      callback(newValue)
      timeout = undefined
    }, delay)
  })
}

/**
 * ⚡ 节流函数
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(fn: T, delay = 300): T {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastTime >= delay) {
      fn(...args)
      lastTime = now
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        fn(...args)
        lastTime = Date.now()
      }, delay - (now - lastTime))
    }
  }) as T
}

