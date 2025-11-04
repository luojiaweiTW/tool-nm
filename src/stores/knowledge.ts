/**
 * 知识库 Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  KnowledgeItem,
  KnowledgeCategory,
  KnowledgeTag,
  KnowledgeBase,
  KnowledgeFilter,
  KnowledgeStats,
} from '@/types/knowledge'
import { ElMessage } from 'element-plus'

// 使用相對路徑（相對於應用根目錄）
const INDEX_FILE = 'knowledge-index.json'  // 索引文件（元数据+配置）
const DOCS_DIR = 'knowledge-docs'         // 知识文档目录
const IMAGES_DIR = 'knowledge-images'      // 图片目录

/**
 * 默认分类
 */
const DEFAULT_CATEGORIES: KnowledgeCategory[] = [
  { id: 'dev', name: '开发', icon: 'Document', color: 'var(--neon-cyan)' },
  { id: 'design', name: '设计', icon: 'Brush', color: 'var(--neon-pink)' },
  { id: 'note', name: '笔记', icon: 'Edit', color: 'var(--neon-purple)' },
  { id: 'resource', name: '资源', icon: 'FolderOpened', color: 'var(--neon-yellow)' },
]

/**
 * 默认标签
 */
const DEFAULT_TAGS: KnowledgeTag[] = [
  { id: 'important', name: '重要', color: '#ff2aa1' },
  { id: 'todo', name: '待办', color: '#ffe600' },
  { id: 'reference', name: '参考', color: '#21e6ff' },
  { id: 'tip', name: '技巧', color: '#9b5cff' },
]

export const useKnowledgeStore = defineStore('knowledge', () => {
  // State
  const items = ref<KnowledgeItem[]>([])
  const categories = ref<KnowledgeCategory[]>([...DEFAULT_CATEGORIES])
  const tags = ref<KnowledgeTag[]>([...DEFAULT_TAGS])
  const isLoading = ref(false)
  const filter = ref<KnowledgeFilter>({})
  const appPath = ref('')

  // ⚡ 缓存上次的过滤结果和参数，避免不必要的重新计算
  let cachedFilterKey = ''
  let cachedFilterResult: KnowledgeItem[] = []

  // ⚡ 生成过滤器缓存键
  const getFilterKey = () => {
    return JSON.stringify({
      search: filter.value.searchText,
      cat: filter.value.categoryId,
      tags: filter.value.tagIds?.sort(),
      type: filter.value.type,
      pin: filter.value.isPinned,
      fav: filter.value.isFavorite,
      count: items.value.length,
    })
  }

  // Computed
  const filteredItems = computed(() => {
    // ⚡ 检查缓存
    const filterKey = getFilterKey()
    if (filterKey === cachedFilterKey) {
      return cachedFilterResult
    }

    let result = [...items.value]

    // 搜索文本
    if (filter.value.searchText) {
      const search = filter.value.searchText.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(search) ||
          item.content.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search)
      )
    }

    // 分類篩選
    if (filter.value.categoryId) {
      result = result.filter((item) => item.categoryId === filter.value.categoryId)
    }

    // 標籤篩選（OR 邏輯）
    if (filter.value.tagIds && filter.value.tagIds.length > 0) {
      result = result.filter((item) =>
        item.tags.some((tag) => filter.value.tagIds!.includes(tag))
      )
    }

    // 類型篩選
    if (filter.value.type) {
      result = result.filter((item) => item.type === filter.value.type)
    }

    // 釘選篩選
    if (filter.value.isPinned !== undefined) {
      result = result.filter((item) => item.isPinned === filter.value.isPinned)
    }

    // 收藏篩選
    if (filter.value.isFavorite !== undefined) {
      result = result.filter((item) => item.isFavorite === filter.value.isFavorite)
    }

    // 排序：釘選 > 收藏 > 更新時間
    result.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    // ⚡ 更新缓存
    cachedFilterKey = filterKey
    cachedFilterResult = result

    return result
  })

  const stats = computed<KnowledgeStats>(() => {
    const byCategory: Record<string, number> = {}
    const byTag: Record<string, number> = {}
    const byType: Record<string, number> = { text: 0, image: 0 }

    items.value.forEach((item) => {
      // 統計分類
      byCategory[item.categoryId] = (byCategory[item.categoryId] || 0) + 1

      // 統計標籤
      item.tags.forEach((tagId) => {
        byTag[tagId] = (byTag[tagId] || 0) + 1
      })

      // 統計類型
      byType[item.type]++
    })

    return {
      totalItems: items.value.length,
      byCategory,
      byTag,
      byType: byType as Record<'text' | 'image', number>,
    }
  })

  // Actions
  
  /**
   * 初始化（讀取數據文件）
   */
  async function initialize() {
    if (!window.electronAPI) {
      console.warn('Not in Electron environment')
      return
    }

    isLoading.value = true
    try {
      // 獲取應用路徑（僅用於顯示）
      appPath.value = await window.electronAPI.getAppPath()
      
      console.log('📚 Knowledge Base - Initialize')
      console.log('  App Path:', appPath.value)
      console.log('  Index File:', INDEX_FILE)

      // 检查索引文件是否存在
      const exists = await window.electronAPI.fileExists(INDEX_FILE)
      console.log('  Index Exists:', exists)
      
      if (exists) {
        // 读取索引文件
        const result = await window.electronAPI.readFile(INDEX_FILE)
        if (result.success && result.data) {
          const data: KnowledgeBase = JSON.parse(result.data)
          
          // 加载元数据
          const itemsMetadata = data.items || []
          categories.value = data.categories || [...DEFAULT_CATEGORIES]
          tags.value = data.tags || [...DEFAULT_TAGS]
          
          // 加载每个知识条目的内容（从独立MD文件）
          items.value = await loadItemsContent(itemsMetadata)
          
          console.log('  ✅ Loaded:', items.value.length, 'items')
        } else {
          console.error('  ❌ Read failed:', result.error)
        }
      } else {
        console.log('  📝 Creating default index...')
        // 创建默认索引文件
        await saveIndex()
      }
      
      // 迁移旧数据（如果存在 knowledge-base.json）
      await migrateOldData()
    } catch (error) {
      console.error('❌ Failed to initialize knowledge base:', error)
      ElMessage.error('載入知識庫失敗')
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 从独立MD文件加载知识内容
   */
  async function loadItemsContent(itemsMetadata: KnowledgeItem[]): Promise<KnowledgeItem[]> {
    const loadedItems: KnowledgeItem[] = []
    
    for (const metadata of itemsMetadata) {
      try {
        // 图片和URL类型直接使用元数据
        if (metadata.type === 'image' || metadata.type === 'url') {
          loadedItems.push(metadata)
          continue
        }
        
        // 文本类型从MD文件读取内容
        if (metadata.mdFilePath) {
          const result = await window.electronAPI.knowledge_readMdFile(metadata.mdFilePath)
          if (result.success) {
            loadedItems.push({
              ...metadata,
              content: result.data
            })
          } else {
            console.warn(`Failed to load content for ${metadata.id}:`, result.error)
            loadedItems.push(metadata) // 使用元数据中的content作为备用
          }
        } else {
          // 没有关联MD文件，直接使用元数据
          loadedItems.push(metadata)
        }
      } catch (error) {
        console.error(`Error loading item ${metadata.id}:`, error)
        loadedItems.push(metadata)
      }
    }
    
    return loadedItems
  }

  /**
   * 保存索引文件（只保存元数据，不保存content）
   */
  async function saveIndex() {
    if (!window.electronAPI) {
      console.warn('Cannot save: electronAPI not available')
      return
    }

    try {
      // 准备元数据（移除content字段，只保留路径引用）
      const itemsMetadata = items.value.map(item => {
        const metadata: any = { ...item }
        
        // 文本类型：移除content，只保留mdFilePath
        if (item.type === 'text' && item.mdFilePath) {
          delete metadata.content
        }
        
        return metadata
      })

      const indexData: KnowledgeBase = {
        items: itemsMetadata,
        categories: categories.value,
        tags: tags.value,
        version: '2.0.0',  // 新版本格式
      }

      console.log('💾 Saving knowledge index...')
      console.log('  Index File:', INDEX_FILE)
      console.log('  Items:', items.value.length)
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
      console.error('❌ Failed to save knowledge index:', error)
      ElMessage.error('保存知識索引失敗')
    }
  }

  /**
   * 保存单个知识条目（索引+MD文件）
   */
  async function saveItem(item: KnowledgeItem) {
    if (!window.electronAPI) return
    
    try {
      // 如果是文本类型，保存内容到MD文件
      if (item.type === 'text' && item.content) {
        const fileName = item.mdFilePath ? item.mdFilePath.split('/').pop() : undefined
        const result = await window.electronAPI.knowledge_saveMdFile(
          item.content,
          fileName || `${item.id}.md`,
          item.mdFilePath
        )
        
        if (result.success) {
          item.mdFilePath = result.relativePath
          console.log('✓ Content saved to:', result.relativePath)
        }
      }
      
      // 保存索引
      await saveIndex()
    } catch (error) {
      console.error('Failed to save item:', error)
      throw error
    }
  }

  /**
   * 迁移旧数据格式（knowledge-base.json → knowledge-index.json + MD文件）
   */
  async function migrateOldData() {
    if (!window.electronAPI) return
    
    try {
      const oldFile = 'knowledge-base.json'
      const exists = await window.electronAPI.fileExists(oldFile)
      
      if (!exists) return
      
      console.log('🔄 Migrating from old format...')
      
      const result = await window.electronAPI.readFile(oldFile)
      if (result.success && result.data) {
        const oldData: KnowledgeBase = JSON.parse(result.data)
        
        // 迁移知识条目
        for (const item of oldData.items || []) {
          // 文本类型：保存内容到MD文件
          if (item.type === 'text' && item.content) {
            const mdResult = await window.electronAPI.knowledge_saveMdFile(
              item.content,
              `${item.id}.md`,
              undefined
            )
            if (mdResult.success) {
              item.mdFilePath = mdResult.relativePath
            }
          }
          items.value.push(item)
        }
        
        // 迁移分类和标签
        if (oldData.categories) {
          categories.value = oldData.categories
        }
        if (oldData.tags) {
          tags.value = oldData.tags
        }
        
        // 保存新格式
        await saveIndex()
        
        // 删除旧文件
        await window.electronAPI.deleteFile(oldFile)
        
        console.log('✅ Migration completed:', items.value.length, 'items')
        ElMessage.success('数据格式已升级')
      }
    } catch (error) {
      console.error('Migration failed:', error)
    }
  }

  /**
   * 添加知識條目
   */
  async function addItem(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const newItem: KnowledgeItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    }

    items.value.unshift(newItem)
    await saveItem(newItem)
    ElMessage.success('知識條目已添加')
    return newItem
  }

  /**
   * 更新知識條目
   */
  async function updateItem(id: string, updates: Partial<KnowledgeItem>) {
    const index = items.value.findIndex((item) => item.id === id)
    if (index === -1) return

    items.value[index] = {
      ...items.value[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await saveItem(items.value[index])
    ElMessage.success('知識條目已更新')
  }

  /**
   * 刪除知識條目
   */
  async function deleteItem(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    // 删除关联的文件
    if (window.electronAPI) {
      // 删除图片文件
      if (item.type === 'image' && item.content) {
        await window.electronAPI.deleteFile(item.content)
      }
      // 删除MD文件
      if (item.type === 'text' && item.mdFilePath) {
        await window.electronAPI.deleteFile(item.mdFilePath)
      }
    }

    items.value = items.value.filter((i) => i.id !== id)
    await saveIndex()
    ElMessage.success('知識條目已刪除')
  }

  /**
   * 切換釘選
   */
  async function togglePin(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    item.isPinned = !item.isPinned
    item.updatedAt = new Date().toISOString()
    await saveIndex()
  }

  /**
   * 切換收藏
   */
  async function toggleFavorite(id: string) {
    const item = items.value.find((i) => i.id === id)
    if (!item) return

    item.isFavorite = !item.isFavorite
    item.updatedAt = new Date().toISOString()
    await saveIndex()
  }

  /**
   * 添加分類
   */
  async function addCategory(category: Omit<KnowledgeCategory, 'id'>) {
    const newCategory: KnowledgeCategory = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    categories.value.push(newCategory)
    await saveIndex()
    return newCategory
  }

  /**
   * 更新分類
   */
  async function updateCategory(id: string, updates: Partial<KnowledgeCategory>) {
    const index = categories.value.findIndex((cat) => cat.id === id)
    if (index === -1) return

    categories.value[index] = {
      ...categories.value[index],
      ...updates,
    }
    await saveIndex()
  }

  /**
   * 刪除分類
   */
  async function deleteCategory(id: string) {
    // 檢查是否有關聯的知識條目
    const hasItems = items.value.some((item) => item.categoryId === id)
    if (hasItems) {
      ElMessage.warning('該分類下還有知識條目，無法刪除')
      return
    }

    categories.value = categories.value.filter((cat) => cat.id !== id)
    await saveIndex()
  }

  /**
   * 添加標籤
   */
  async function addTag(tag: Omit<KnowledgeTag, 'id'>) {
    const newTag: KnowledgeTag = {
      ...tag,
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    tags.value.push(newTag)
    await saveIndex()
    return newTag
  }

  /**
   * 更新標籤
   */
  async function updateTag(id: string, updates: Partial<KnowledgeTag>) {
    const index = tags.value.findIndex((tag) => tag.id === id)
    if (index === -1) return

    tags.value[index] = {
      ...tags.value[index],
      ...updates,
    }
    await saveIndex()
  }

  /**
   * 刪除標籤
   */
  async function deleteTag(id: string) {
    tags.value = tags.value.filter((tag) => tag.id !== id)
    
    // 從所有知識條目中移除該標籤
    items.value.forEach((item) => {
      item.tags = item.tags.filter((tagId) => tagId !== id)
    })

    await saveIndex()
  }

  /**
   * 上傳圖片
   */
  async function uploadImage(file: File): Promise<string> {
    if (!window.electronAPI) {
      throw new Error('Not in Electron environment')
    }

    try {
      // 生成唯一文件名
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`
      const relativePath = `${IMAGES_DIR}/${fileName}` // 相對路徑

      // 讀取文件為 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      
      // 轉換為 Uint8Array 然後轉為 base64
      const uint8Array = new Uint8Array(arrayBuffer)
      let binary = ''
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i])
      }
      const base64Data = btoa(binary)
      
      console.log('📤 Uploading image:', relativePath)
      
      // 使用相對路徑寫入文件
      const result = await window.electronAPI.writeFile(
        relativePath,
        base64Data,
        true // isBase64
      )

      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('✅ Image uploaded')
      return relativePath
    } catch (error) {
      console.error('Failed to upload image:', error)
      ElMessage.error('圖片上傳失敗')
      throw error
    }
  }

  /**
   * 設置篩選條件
   */
  function setFilter(newFilter: Partial<KnowledgeFilter>) {
    filter.value = {
      ...filter.value,
      ...newFilter,
    }
  }

  /**
   * 清空篩選
   */
  function clearFilter() {
    filter.value = {}
  }

  /**
   * 導出數據
   */
  async function exportData() {
    const data: KnowledgeBase = {
      items: items.value,
      categories: categories.value,
      tags: tags.value,
      version: '1.0.0',
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `knowledge-base-export-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    ElMessage.success('數據導出成功')
  }

  /**
   * 導入數據
   */
  async function importData(data: KnowledgeBase) {
    try {
      // 合併數據（避免 ID 衝突）
      const newItems = data.items.map((item) => ({
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }))

      // 保存导入的知识内容到MD文件
      for (const item of newItems) {
        if (item.type === 'text' && item.content) {
          await saveItem(item)
        }
      }
      
      items.value = [...items.value, ...newItems]
      
      // 合併分類和標籤（去重）
      const existingCatIds = new Set(categories.value.map((c) => c.name))
      const newCategories = data.categories.filter((c) => !existingCatIds.has(c.name))
      categories.value = [...categories.value, ...newCategories]

      const existingTagIds = new Set(tags.value.map((t) => t.name))
      const newTags = data.tags.filter((t) => !existingTagIds.has(t.name))
      tags.value = [...tags.value, ...newTags]

      await saveIndex()
      ElMessage.success(`成功導入 ${newItems.length} 個知識條目`)
    } catch (error) {
      console.error('Failed to import data:', error)
      ElMessage.error('數據導入失敗')
    }
  }

  /**
   * 獲取圖片完整路徑（用於顯示）
   */
  function getImagePath(relativePath: string): string {
    if (!appPath.value) return relativePath
    // 在 Electron 中使用絕對路徑顯示圖片
    return `${appPath.value}/${relativePath}`
  }

  /**
   * 根據 ID 獲取分類
   */
  function getCategoryById(id: string) {
    return categories.value.find((cat) => cat.id === id)
  }

  /**
   * 根據 ID 獲取標籤
   */
  function getTagById(id: string) {
    return tags.value.find((tag) => tag.id === id)
  }

  return {
    // State
    items,
    categories,
    tags,
    isLoading,
    filter,
    appPath,

    // Computed
    filteredItems,
    stats,

    // Actions
    initialize,
    saveIndex,
    saveItem,
    addItem,
    updateItem,
    deleteItem,
    togglePin,
    toggleFavorite,
    addCategory,
    updateCategory,
    deleteCategory,
    addTag,
    updateTag,
    deleteTag,
    uploadImage,
    setFilter,
    clearFilter,
    exportData,
    importData,
    getImagePath,
    getCategoryById,
    getTagById,
  }
})

