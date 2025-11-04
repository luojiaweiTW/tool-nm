/**
 * 终端命令历史 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  CommandHistory,
  CommandTag,
  CommandCategory,
  FavoriteCommand,
  CommandHistoryDatabase,
  CommandFilter,
  CommandStats,
} from '@/types/command-history'
import { ElMessage } from 'element-plus'

// 使用相对路径
const INDEX_FILE = 'command-history.json'

/**
 * 默认分类
 */
const DEFAULT_CATEGORIES: CommandCategory[] = [
  { id: 'system', name: '系统管理', icon: 'i-mdi-server', color: 'var(--neon-cyan)' },
  { id: 'file', name: '文件操作', icon: 'i-mdi-folder', color: 'var(--neon-purple)' },
  { id: 'network', name: '网络工具', icon: 'i-mdi-network', color: 'var(--neon-pink)' },
  { id: 'docker', name: 'Docker', icon: 'i-mdi-docker', color: 'var(--neon-blue)' },
  { id: 'git', name: 'Git', icon: 'i-mdi-git', color: 'var(--neon-orange)' },
  { id: 'database', name: '数据库', icon: 'i-mdi-database', color: 'var(--neon-lime)' },
  { id: 'other', name: '其他', icon: 'i-mdi-console', color: 'var(--neon-yellow)' },
]

/**
 * 默认标签
 */
const DEFAULT_TAGS: CommandTag[] = [
  { id: 'important', name: '重要', color: '#ff2aa1' },
  { id: 'frequently-used', name: '常用', color: '#d0ff00' },
  { id: 'dangerous', name: '危险', color: '#ff3b3b' },
  { id: 'backup', name: '备份', color: '#00d4ff' },
]

export const useCommandHistoryStore = defineStore('commandHistory', () => {
  // State
  const history = ref<CommandHistory[]>([])
  const favorites = ref<FavoriteCommand[]>([])
  const categories = ref<CommandCategory[]>([...DEFAULT_CATEGORIES])
  const tags = ref<CommandTag[]>([...DEFAULT_TAGS])
  const isLoading = ref(false)
  const filter = ref<CommandFilter>({})

  // ⚡ 缓存上次的过滤结果和参数，避免不必要的重新计算
  let cachedFilterKey = ''
  let cachedFilterResult: CommandHistory[] = []

  // ⚡ 生成过滤器缓存键
  const getFilterKey = () => {
    return JSON.stringify({
      search: filter.value.searchText,
      server: filter.value.serverHost,
      cat: filter.value.category,
      tags: filter.value.tagIds?.sort(),
      fav: filter.value.isFavorite,
      date: filter.value.dateRange,
      count: history.value.length,
    })
  }

  // Computed
  const filteredHistory = computed(() => {
    // ⚡ 检查缓存
    const filterKey = getFilterKey()
    if (filterKey === cachedFilterKey) {
      return cachedFilterResult
    }

    let result = [...history.value]

    // 搜索文本
    if (filter.value.searchText) {
      const search = filter.value.searchText.toLowerCase()
      result = result.filter(
        (cmd) =>
          cmd.command.toLowerCase().includes(search) ||
          (cmd.description && cmd.description.toLowerCase().includes(search)) ||
          (cmd.serverHost && cmd.serverHost.toLowerCase().includes(search))
      )
    }

    // 服务器筛选
    if (filter.value.serverHost) {
      result = result.filter((cmd) => cmd.serverHost === filter.value.serverHost)
    }

    // 分类筛选
    if (filter.value.category) {
      result = result.filter((cmd) => cmd.category === filter.value.category)
    }

    // 标签筛选
    if (filter.value.tagIds && filter.value.tagIds.length > 0) {
      result = result.filter((cmd) =>
        cmd.tags.some((tag) => filter.value.tagIds!.includes(tag))
      )
    }

    // 收藏筛选
    if (filter.value.isFavorite !== undefined) {
      result = result.filter((cmd) => cmd.isFavorite === filter.value.isFavorite)
    }

    // 日期范围筛选
    if (filter.value.dateRange) {
      const start = new Date(filter.value.dateRange.start).getTime()
      const end = new Date(filter.value.dateRange.end).getTime()
      result = result.filter((cmd) => {
        const cmdTime = new Date(cmd.executedAt).getTime()
        return cmdTime >= start && cmdTime <= end
      })
    }

    // 排序：收藏 > 时间倒序
    result.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    })

    // ⚡ 更新缓存
    cachedFilterKey = filterKey
    cachedFilterResult = result

    return result
  })

  const stats = computed<CommandStats>(() => {
    const byServer: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const byTag: Record<string, number> = {}

    history.value.forEach((cmd) => {
      // 统计服务器
      if (cmd.serverHost) {
        byServer[cmd.serverHost] = (byServer[cmd.serverHost] || 0) + 1
      }

      // 统计分类
      if (cmd.category) {
        byCategory[cmd.category] = (byCategory[cmd.category] || 0) + 1
      }

      // 统计标签
      cmd.tags.forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] || 0) + 1
      })
    })

    // Top服务器
    const topServers = Object.entries(byServer)
      .map(([host, count]) => ({ host, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // 最近使用
    const recentlyUsed = [...history.value]
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
      .slice(0, 10)

    // 最常用（根据命令出现次数）
    const commandCounts = new Map<string, { cmd: CommandHistory; count: number }>()
    history.value.forEach((cmd) => {
      const existing = commandCounts.get(cmd.command)
      if (existing) {
        existing.count++
      } else {
        commandCounts.set(cmd.command, { cmd, count: 1 })
      }
    })
    const mostUsed = Array.from(commandCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => item.cmd)

    return {
      totalCommands: history.value.length,
      favoriteCommands: history.value.filter((cmd) => cmd.isFavorite).length,
      byServer,
      byCategory,
      byTag,
      mostUsed,
      recentlyUsed,
      topServers,
    }
  })

  // Actions

  /**
   * 初始化（读取数据）
   */
  async function initialize() {
    if (!window.electronAPI) {
      console.warn('Not in Electron environment')
      return
    }

    isLoading.value = true
    try {
      console.log('💻 Command History - Initialize')
      console.log('  Index File:', INDEX_FILE)

      // 检查文件是否存在
      const exists = await window.electronAPI.fileExists(INDEX_FILE)
      console.log('  Index Exists:', exists)

      if (exists) {
        // 读取索引文件
        const result = await window.electronAPI.readFile(INDEX_FILE)
        if (result.success && result.data) {
          const data: CommandHistoryDatabase = JSON.parse(result.data)
          history.value = data.history || []
          favorites.value = data.favorites || []
          categories.value = data.categories || [...DEFAULT_CATEGORIES]
          tags.value = data.tags || [...DEFAULT_TAGS]

          console.log('  ✅ Loaded:', history.value.length, 'commands')
        }
      } else {
        console.log('  📝 Creating default index...')
        await saveIndex()
      }
    } catch (error) {
      console.error('❌ Failed to initialize command history:', error)
      ElMessage.error('载入命令历史失败')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 保存索引文件
   */
  async function saveIndex() {
    if (!window.electronAPI) return

    try {
      const indexData: CommandHistoryDatabase = {
        history: history.value,
        favorites: favorites.value,
        categories: categories.value,
        tags: tags.value,
        version: '1.0.0',
      }

      console.log('💾 Saving command history index...')

      const result = await window.electronAPI.writeFile(
        INDEX_FILE,
        JSON.stringify(indexData, null, 2),
        false
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('  ✅ Index saved successfully')
    } catch (error) {
      console.error('❌ Failed to save command history:', error)
      ElMessage.error('保存命令历史失败')
    }
  }

  /**
   * 添加命令历史
   */
  async function addCommand(command: Omit<CommandHistory, 'id' | 'isFavorite' | 'tags'>) {
    const now = new Date().toISOString()
    const newCommand: CommandHistory = {
      ...command,
      id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isFavorite: false,
      tags: [],
    }

    history.value.unshift(newCommand)
    await saveIndex()
    return newCommand
  }

  /**
   * 更新命令历史
   */
  async function updateCommand(id: string, updates: Partial<CommandHistory>) {
    const index = history.value.findIndex((cmd) => cmd.id === id)
    if (index === -1) return

    history.value[index] = {
      ...history.value[index],
      ...updates,
    }

    await saveIndex()
  }

  /**
   * 删除命令历史
   */
  async function deleteCommand(id: string) {
    history.value = history.value.filter((cmd) => cmd.id !== id)
    await saveIndex()
    ElMessage.success('已删除')
  }

  /**
   * 批量删除
   */
  async function deleteCommands(ids: string[]) {
    history.value = history.value.filter((cmd) => !ids.includes(cmd.id))
    await saveIndex()
    ElMessage.success(`已删除 ${ids.length} 条记录`)
  }

  /**
   * 清空历史
   */
  async function clearHistory() {
    history.value = []
    await saveIndex()
    ElMessage.success('已清空历史记录')
  }

  /**
   * 切换收藏
   */
  async function toggleFavorite(id: string) {
    const cmd = history.value.find((c) => c.id === id)
    if (!cmd) return

    cmd.isFavorite = !cmd.isFavorite
    await saveIndex()
  }

  /**
   * 复制命令到剪贴板
   */
  async function copyCommand(command: string) {
    try {
      await navigator.clipboard.writeText(command)
      ElMessage.success('已复制到剪贴板')
    } catch {
      ElMessage.error('复制失败')
    }
  }

  /**
   * 添加到收藏夹（快捷命令）
   */
  async function addToFavorites(command: Omit<FavoriteCommand, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    const now = new Date().toISOString()
    const newFavorite: FavoriteCommand = {
      ...command,
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }

    favorites.value.push(newFavorite)
    await saveIndex()
    ElMessage.success('已添加到收藏夹')
    return newFavorite
  }

  /**
   * 使用收藏命令
   */
  async function useFavorite(id: string) {
    const fav = favorites.value.find((f) => f.id === id)
    if (!fav) return

    fav.usageCount++
    fav.lastUsedAt = new Date().toISOString()
    await saveIndex()
    return fav.command
  }

  /**
   * 设置筛选条件
   */
  function setFilter(newFilter: Partial<CommandFilter>) {
    filter.value = {
      ...filter.value,
      ...newFilter,
    }
  }

  /**
   * 清空筛选
   */
  function clearFilter() {
    filter.value = {}
  }

  /**
   * 添加标签
   */
  async function addTag(tag: Omit<CommandTag, 'id'>) {
    const newTag: CommandTag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    tags.value.push(newTag)
    await saveIndex()
    return newTag
  }

  /**
   * 添加分类
   */
  async function addCategory(category: Omit<CommandCategory, 'id'>) {
    const newCategory: CommandCategory = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    categories.value.push(newCategory)
    await saveIndex()
    return newCategory
  }

  /**
   * 获取分类
   */
  function getCategoryById(id: string) {
    return categories.value.find((cat) => cat.id === id)
  }

  /**
   * 获取标签
   */
  function getTagById(id: string) {
    return tags.value.find((tag) => tag.id === id)
  }

  return {
    // State
    history,
    favorites,
    categories,
    tags,
    isLoading,
    filter,

    // Computed
    filteredHistory,
    stats,

    // Actions
    initialize,
    saveIndex,
    addCommand,
    updateCommand,
    deleteCommand,
    deleteCommands,
    clearHistory,
    toggleFavorite,
    copyCommand,
    addToFavorites,
    useFavorite,
    setFilter,
    clearFilter,
    addTag,
    addCategory,
    getCategoryById,
    getTagById,
  }
})
