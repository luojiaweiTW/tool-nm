/**
 * 统一的存储工具
 * 优先使用文件存储（Electron环境），降级到 localStorage（浏览器环境）
 */

/**
 * 保存数据到文件或 localStorage
 * @param key 存储键名
 * @param value 要存储的值（会自动 JSON 序列化）
 */
export async function setStorage(key: string, value: any): Promise<void> {
  // Electron 环境：使用文件存储
  if (window.electronAPI) {
    try {
      const filename = `storage-${key}.json`
      const content = JSON.stringify(value, null, 2)
      await window.electronAPI.writeFile(filename, content)
      console.log(`✅ Saved to file: ${filename}`)
    } catch (error) {
      console.error('Failed to save to file:', error)
      // 降级到 localStorage
      localStorage.setItem(key, JSON.stringify(value))
    }
  } else {
    // 浏览器环境：使用 localStorage
    localStorage.setItem(key, JSON.stringify(value))
  }
}

/**
 * 从文件或 localStorage 读取数据
 * @param key 存储键名
 * @param defaultValue 默认值（如果不存在）
 * @returns 存储的值（自动 JSON 解析）
 */
export async function getStorage<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
  // Electron 环境：使用文件存储
  if (window.electronAPI) {
    try {
      const filename = `storage-${key}.json`
      const exists = await window.electronAPI.fileExists(filename)
      
      if (exists) {
        const result = await window.electronAPI.readFile(filename)
        if (result.success && result.data) {
          const value = JSON.parse(result.data)
          console.log(`✅ Loaded from file: ${filename}`)
          return value
        }
      }
      
      // 文件不存在，尝试从 localStorage 迁移
      const localValue = localStorage.getItem(key)
      if (localValue) {
        console.log(`📦 Migrating from localStorage: ${key}`)
        const value = JSON.parse(localValue)
        // 保存到文件
        await setStorage(key, value)
        // 清除 localStorage（可选）
        // localStorage.removeItem(key)
        return value
      }
      
      return defaultValue
    } catch (error) {
      console.error('Failed to load from file:', error)
      // 降级到 localStorage
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : defaultValue
    }
  } else {
    // 浏览器环境：使用 localStorage
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  }
}

/**
 * 删除存储的数据
 * @param key 存储键名
 */
export async function removeStorage(key: string): Promise<void> {
  // Electron 环境：删除文件
  if (window.electronAPI) {
    try {
      const filename = `storage-${key}.json`
      await window.electronAPI.deleteFile(filename)
      console.log(`🗑️ Deleted file: ${filename}`)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }
  
  // 同时删除 localStorage（兼容旧数据）
  localStorage.removeItem(key)
}

/**
 * 清空所有存储
 */
export async function clearStorage(): Promise<void> {
  // 注意：这只清除 localStorage，文件需要手动管理
  localStorage.clear()
  console.log('🗑️ Cleared localStorage')
}

