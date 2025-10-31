import { defineStore } from 'pinia'
import { ref } from 'vue'
import { setStorage, getStorage, removeStorage } from '@/composables/useStorage'

export interface RecentTool {
  id: string
  name: string
  path: string
  icon: string
  lastUsed: number
}

export const useUIStore = defineStore('ui', () => {
  // 侧栏状态
  const sidebarCollapsed = ref<boolean>(false)
  
  // 主题密度（compact/default/comfortable）
  const density = ref<'compact' | 'default' | 'comfortable'>('compact')
  
  // 最近使用的工具（最多保存10个）
  const recentTools = ref<RecentTool[]>([])
  
  // 全局搜索是否打开
  const isSearchOpen = ref(false)

  /**
   * 切换侧栏展开/收起状态
   */
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    // 持久化到文件
    setStorage('sidebar-collapsed', sidebarCollapsed.value)
  }

  /**
   * 设置侧栏状态
   */
  function setSidebarCollapsed(collapsed: boolean) {
    sidebarCollapsed.value = collapsed
    setStorage('sidebar-collapsed', collapsed)
  }

  /**
   * 设置主题密度
   */
  function setDensity(newDensity: 'compact' | 'default' | 'comfortable') {
    density.value = newDensity
    setStorage('ui-density', newDensity)
  }

  /**
   * 添加工具到最近使用列表
   */
  function addRecentTool(tool: Omit<RecentTool, 'lastUsed'>) {
    const existingIndex = recentTools.value.findIndex(t => t.id === tool.id)
    
    const toolWithTime: RecentTool = {
      ...tool,
      lastUsed: Date.now()
    }
    
    if (existingIndex !== -1) {
      // 如果已存在，更新时间并移到最前
      recentTools.value.splice(existingIndex, 1)
    }
    
    recentTools.value.unshift(toolWithTime)
    
    // 只保留最新的10个
    if (recentTools.value.length > 10) {
      recentTools.value = recentTools.value.slice(0, 10)
    }
    
    // 持久化到文件
    setStorage('recent-tools', recentTools.value)
  }

  /**
   * 清空最近使用列表
   */
  function clearRecentTools() {
    recentTools.value = []
    removeStorage('recent-tools')
  }

  /**
   * 切换全局搜索
   */
  function toggleSearch() {
    isSearchOpen.value = !isSearchOpen.value
  }

  /**
   * 从文件恢复状态
   */
  async function restoreFromStorage() {
    // 恢复侧栏状态
    const savedCollapsed = await getStorage('sidebar-collapsed', false)
    sidebarCollapsed.value = savedCollapsed as boolean
    
    // 恢复密度
    const savedDensity = await getStorage('ui-density', 'compact')
    if (savedDensity && ['compact', 'default', 'comfortable'].includes(savedDensity as string)) {
      density.value = savedDensity as 'compact' | 'default' | 'comfortable'
    }
    
    // 恢复最近使用
    const savedRecent = await getStorage<RecentTool[]>('recent-tools', [])
    recentTools.value = savedRecent || []
  }

  // 初始化时恢复状态
  restoreFromStorage()

  return {
    // State
    sidebarCollapsed,
    density,
    recentTools,
    isSearchOpen,
    
    // Actions
    toggleSidebar,
    setSidebarCollapsed,
    setDensity,
    addRecentTool,
    clearRecentTools,
    toggleSearch,
    restoreFromStorage,
  }
})

