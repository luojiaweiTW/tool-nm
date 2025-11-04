/**
 * 代码片段 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Snippet,
  SnippetCategory,
  SnippetTag,
  SnippetDatabase,
  SnippetFilter,
  SnippetStats,
  SnippetLanguage,
} from '@/types/snippet'
import { ElMessage } from 'element-plus'

// 使用相对路径（相对于应用根目录）
const INDEX_FILE = 'snippets-index.json'  // 索引文件（元数据+配置）
const SNIPPETS_DIR = 'snippets'          // 代码片段目录

/**
 * 默认分类
 */
const DEFAULT_CATEGORIES: SnippetCategory[] = [
  { id: 'algorithm', name: '算法', icon: 'i-mdi-brain', color: 'var(--neon-cyan)' },
  { id: 'utility', name: '工具函数', icon: 'i-mdi-toolbox', color: 'var(--neon-purple)' },
  { id: 'template', name: '模板', icon: 'i-mdi-file-document-outline', color: 'var(--neon-pink)' },
  { id: 'config', name: '配置', icon: 'i-mdi-cog', color: 'var(--neon-yellow)' },
  { id: 'example', name: '示例', icon: 'i-mdi-code-tags', color: 'var(--neon-lime)' },
]

/**
 * 默认标签
 */
const DEFAULT_TAGS: SnippetTag[] = [
  { id: 'important', name: '重要', color: '#ff2aa1' },
  { id: 'frequently-used', name: '常用', color: '#d0ff00' },
  { id: 'reference', name: '参考', color: '#21e6ff' },
  { id: 'debug', name: '调试', color: '#ff6b00' },
]

export const useSnippetStore = defineStore('snippet', () => {
  // State
  const snippets = ref<Snippet[]>([])
  const categories = ref<SnippetCategory[]>([...DEFAULT_CATEGORIES])
  const tags = ref<SnippetTag[]>([...DEFAULT_TAGS])
  const isLoading = ref(false)
  const filter = ref<SnippetFilter>({})
  const appPath = ref('')

  // ⚡ 缓存上次的过滤结果和参数，避免不必要的重新计算
  let cachedFilterKey = ''
  let cachedFilterResult: Snippet[] = []

  // ⚡ 生成过滤器缓存键
  const getFilterKey = () => {
    return JSON.stringify({
      search: filter.value.searchText,
      lang: filter.value.language,
      cat: filter.value.categoryId,
      tags: filter.value.tagIds?.sort(),
      pin: filter.value.isPinned,
      fav: filter.value.isFavorite,
      count: snippets.value.length,
    })
  }

  // Computed
  const filteredSnippets = computed(() => {
    // ⚡ 检查缓存
    const filterKey = getFilterKey()
    if (filterKey === cachedFilterKey) {
      return cachedFilterResult
    }

    let result = [...snippets.value]

    // 搜索文本
    if (filter.value.searchText) {
      const search = filter.value.searchText.toLowerCase()
      result = result.filter(
        (snippet) =>
          snippet.title.toLowerCase().includes(search) ||
          snippet.description.toLowerCase().includes(search) ||
          snippet.code.toLowerCase().includes(search)
      )
    }

    // 语言筛选
    if (filter.value.language) {
      result = result.filter((snippet) => snippet.language === filter.value.language)
    }

    // 分类筛选
    if (filter.value.categoryId) {
      result = result.filter((snippet) => snippet.categoryId === filter.value.categoryId)
    }

    // 标签筛选（OR 逻辑）
    if (filter.value.tagIds && filter.value.tagIds.length > 0) {
      result = result.filter((snippet) =>
        snippet.tags.some((tag) => filter.value.tagIds!.includes(tag))
      )
    }

    // 置顶筛选
    if (filter.value.isPinned !== undefined) {
      result = result.filter((snippet) => snippet.isPinned === filter.value.isPinned)
    }

    // 收藏筛选
    if (filter.value.isFavorite !== undefined) {
      result = result.filter((snippet) => snippet.isFavorite === filter.value.isFavorite)
    }

    // 排序：置顶 > 收藏 > 使用次数 > 更新时间
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    // ⚡ 更新缓存
    cachedFilterKey = filterKey
    cachedFilterResult = result

    return result
  })

  const stats = computed<SnippetStats>(() => {
    const byLanguage: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    const byTag: Record<string, number> = {}

    snippets.value.forEach((snippet) => {
      // 统计语言
      byLanguage[snippet.language] = (byLanguage[snippet.language] || 0) + 1

      // 统计分类
      byCategory[snippet.categoryId] = (byCategory[snippet.categoryId] || 0) + 1

      // 统计标签
      snippet.tags.forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] || 0) + 1
      })
    })

    // 最常使用
    const mostUsed = [...snippets.value]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)

    // 最近使用
    const recentlyUsed = [...snippets.value]
      .filter((s) => s.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, 10)

    return {
      totalSnippets: snippets.value.length,
      byLanguage: byLanguage as Record<SnippetLanguage, number>,
      byCategory,
      byTag,
      mostUsed,
      recentlyUsed,
    }
  })

  // Actions

  /**
   * 初始化（读取数据文件）
   */
  async function initialize() {
    if (!window.electronAPI) {
      console.warn('Not in Electron environment')
      return
    }

    isLoading.value = true
    try {
      // 获取应用路径（仅用于显示）
      appPath.value = await window.electronAPI.getAppPath()

      console.log('🧩 Code Snippets - Initialize')
      console.log('  App Path:', appPath.value)
      console.log('  Index File:', INDEX_FILE)

      // 检查索引文件是否存在
      const exists = await window.electronAPI.fileExists(INDEX_FILE)
      console.log('  Index Exists:', exists)

      if (exists) {
        // 读取索引文件
        const result = await window.electronAPI.readFile(INDEX_FILE)
        if (result.success && result.data) {
          const data: SnippetDatabase = JSON.parse(result.data)

          // 加载元数据
          const snippetsMetadata = data.snippets || []
          categories.value = data.categories || [...DEFAULT_CATEGORIES]
          tags.value = data.tags || [...DEFAULT_TAGS]

          // 加载每个代码片段的内容（从独立文件）
          snippets.value = await loadSnippetsContent(snippetsMetadata)

          console.log('  ✅ Loaded:', snippets.value.length, 'snippets')
        } else {
          console.error('  ❌ Read failed:', result.error)
        }
      } else {
        console.log('  📝 Creating default index...')
        // 创建默认索引文件
        await saveIndex()
      }
    } catch (error) {
      console.error('❌ Failed to initialize code snippets:', error)
      ElMessage.error('载入代码片段失败')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 从独立文件加载代码片段内容
   */
  async function loadSnippetsContent(snippetsMetadata: Snippet[]): Promise<Snippet[]> {
    const loadedSnippets: Snippet[] = []

    for (const metadata of snippetsMetadata) {
      try {
        // 从文件读取代码内容
        if (metadata.mdFilePath) {
          const result = await window.electronAPI.readFile(metadata.mdFilePath)
          if (result.success) {
            loadedSnippets.push({
              ...metadata,
              code: result.data
            })
          } else {
            console.warn(`Failed to load content for ${metadata.id}:`, result.error)
            loadedSnippets.push(metadata) // 使用元数据中的code作为备用
          }
        } else {
          // 没有关联文件，直接使用元数据
          loadedSnippets.push(metadata)
        }
      } catch (error) {
        console.error(`Error loading snippet ${metadata.id}:`, error)
        loadedSnippets.push(metadata)
      }
    }

    return loadedSnippets
  }

  /**
   * 保存索引文件（只保存元数据，不保存code）
   */
  async function saveIndex() {
    if (!window.electronAPI) {
      console.warn('Cannot save: electronAPI not available')
      return
    }

    try {
      // 准备元数据（移除code字段，只保留路径引用）
      const snippetsMetadata = snippets.value.map(snippet => {
        const metadata: any = { ...snippet }

        // 移除code，只保留mdFilePath
        if (snippet.mdFilePath) {
          delete metadata.code
        }

        return metadata
      })

      const indexData: SnippetDatabase = {
        snippets: snippetsMetadata,
        categories: categories.value,
        tags: tags.value,
        version: '1.0.0',
      }

      console.log('💾 Saving snippets index...')
      console.log('  Index File:', INDEX_FILE)
      console.log('  Snippets:', snippets.value.length)
      console.log('  Categories:', categories.value.length)
      console.log('  Tags:', tags.value.length)

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
      console.error('❌ Failed to save snippets index:', error)
      ElMessage.error('保存代码片段索引失败')
    }
  }

  /**
   * 保存单个代码片段（索引+代码文件）
   */
  async function saveSnippet(snippet: Snippet) {
    if (!window.electronAPI) return

    try {
      // 保存代码内容到独立文件
      if (snippet.code) {
        const fileName = snippet.mdFilePath
          ? snippet.mdFilePath.split('/').pop()
          : `${snippet.id}.${getFileExtension(snippet.language)}`

        const relativePath = `${SNIPPETS_DIR}/${fileName}`

        const result = await window.electronAPI.writeFile(
          relativePath,
          snippet.code,
          false
        )

        if (result.success) {
          snippet.mdFilePath = relativePath
          console.log('✓ Code saved to:', relativePath)
        }
      }

      // 保存索引
      await saveIndex()
    } catch (error) {
      console.error('Failed to save snippet:', error)
      throw error
    }
  }

  /**
   * 获取文件扩展名
   */
  function getFileExtension(language: SnippetLanguage): string {
    const extensions: Record<SnippetLanguage, string> = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      go: 'go',
      rust: 'rs',
      cpp: 'cpp',
      c: 'c',
      csharp: 'cs',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      kotlin: 'kt',
      sql: 'sql',
      bash: 'sh',
      powershell: 'ps1',
      html: 'html',
      css: 'css',
      scss: 'scss',
      less: 'less',
      json: 'json',
      yaml: 'yaml',
      markdown: 'md',
      xml: 'xml',
      dockerfile: 'dockerfile',
      other: 'txt',
    }
    return extensions[language] || 'txt'
  }

  /**
   * 添加代码片段
   */
  async function addSnippet(snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) {
    const now = new Date().toISOString()
    const newSnippet: Snippet = {
      ...snippet,
      id: `snippet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    }

    snippets.value.unshift(newSnippet)
    await saveSnippet(newSnippet)
    ElMessage.success('代码片段已添加')
    return newSnippet
  }

  /**
   * 更新代码片段
   */
  async function updateSnippet(id: string, updates: Partial<Snippet>) {
    const index = snippets.value.findIndex((snippet) => snippet.id === id)
    if (index === -1) return

    snippets.value[index] = {
      ...snippets.value[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await saveSnippet(snippets.value[index])
    ElMessage.success('代码片段已更新')
  }

  /**
   * 删除代码片段
   */
  async function deleteSnippet(id: string) {
    const snippet = snippets.value.find((s) => s.id === id)
    if (!snippet) return

    // 删除关联的代码文件
    if (window.electronAPI && snippet.mdFilePath) {
      await window.electronAPI.deleteFile(snippet.mdFilePath)
    }

    snippets.value = snippets.value.filter((s) => s.id !== id)
    await saveIndex()
    ElMessage.success('代码片段已删除')
  }

  /**
   * 使用代码片段（复制到剪贴板）
   */
  async function useSnippet(id: string) {
    const snippet = snippets.value.find((s) => s.id === id)
    if (!snippet) return

    try {
      await navigator.clipboard.writeText(snippet.code)

      // 更新使用统计
      snippet.usageCount++
      snippet.lastUsedAt = new Date().toISOString()
      await saveIndex()

      ElMessage.success('已复制到剪贴板')
    } catch (error) {
      ElMessage.error('复制失败')
    }
  }

  /**
   * 切换置顶
   */
  async function togglePin(id: string) {
    const snippet = snippets.value.find((s) => s.id === id)
    if (!snippet) return

    snippet.isPinned = !snippet.isPinned
    snippet.updatedAt = new Date().toISOString()
    await saveIndex()
  }

  /**
   * 切换收藏
   */
  async function toggleFavorite(id: string) {
    const snippet = snippets.value.find((s) => s.id === id)
    if (!snippet) return

    snippet.isFavorite = !snippet.isFavorite
    snippet.updatedAt = new Date().toISOString()
    await saveIndex()
  }

  /**
   * 添加分类
   */
  async function addCategory(category: Omit<SnippetCategory, 'id'>) {
    const newCategory: SnippetCategory = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    categories.value.push(newCategory)
    await saveIndex()
    return newCategory
  }

  /**
   * 添加标签
   */
  async function addTag(tag: Omit<SnippetTag, 'id'>) {
    const newTag: SnippetTag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    tags.value.push(newTag)
    await saveIndex()
    return newTag
  }

  /**
   * 设置筛选条件
   */
  function setFilter(newFilter: Partial<SnippetFilter>) {
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
   * 根据 ID 获取分类
   */
  function getCategoryById(id: string) {
    return categories.value.find((cat) => cat.id === id)
  }

  /**
   * 根据 ID 获取标签
   */
  function getTagById(id: string) {
    return tags.value.find((tag) => tag.id === id)
  }

  return {
    // State
    snippets,
    categories,
    tags,
    isLoading,
    filter,
    appPath,

    // Computed
    filteredSnippets,
    stats,

    // Actions
    initialize,
    saveIndex,
    saveSnippet,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    useSnippet,
    togglePin,
    toggleFavorite,
    addCategory,
    addTag,
    setFilter,
    clearFilter,
    getCategoryById,
    getTagById,
  }
})
