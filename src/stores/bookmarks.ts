import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  icon?: string // 网站 favicon URL
  category: string
  tags: string[]
  isPinned: boolean
  isFavorite: boolean
  visitCount: number
  createdAt: number
  updatedAt: number
  lastVisitAt?: number
}

export interface BookmarkCategory {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

export interface BookmarkTag {
  id: string
  name: string
  color: string
  count: number
}

const STORAGE_KEY = 'neon-tools-bookmarks'
const CATEGORIES_KEY = 'neon-tools-bookmark-categories'
const TAGS_KEY = 'neon-tools-bookmark-tags'

export const useBookmarksStore = defineStore('bookmarks', () => {
  // ========== 状态 ==========
  const bookmarks = ref<Bookmark[]>([])
  const categories = ref<BookmarkCategory[]>([
    { id: 'dev', name: '开发工具', icon: 'i-mdi-code-tags', color: '#21E6FF', count: 0 },
    { id: 'doc', name: '技术文档', icon: 'i-mdi-book-open-variant', color: '#9B5CFF', count: 0 },
    { id: 'design', name: '设计资源', icon: 'i-mdi-palette', color: '#FF2AA1', count: 0 },
    { id: 'learn', name: '学习教程', icon: 'i-mdi-school', color: '#FDFF21', count: 0 },
    { id: 'tool', name: '在线工具', icon: 'i-mdi-tools', color: '#B0FF21', count: 0 },
    { id: 'other', name: '其他', icon: 'i-mdi-folder', color: '#888888', count: 0 },
  ])
  const tags = ref<BookmarkTag[]>([])
  
  const isLoading = ref(false)
  const searchText = ref('')
  const selectedCategory = ref<string>('')
  const selectedTags = ref<string[]>([])
  const showPinned = ref(false)
  const showFavorite = ref(false)
  const sortBy = ref<'createdAt' | 'updatedAt' | 'title' | 'visitCount'>('createdAt')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  // ========== 计算属性 ==========
  const filteredBookmarks = computed(() => {
    let result = [...bookmarks.value]

    // 搜索过滤
    if (searchText.value) {
      const query = searchText.value.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.url.toLowerCase().includes(query) ||
          b.description?.toLowerCase().includes(query) ||
          b.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // 分类过滤
    if (selectedCategory.value) {
      result = result.filter((b) => b.category === selectedCategory.value)
    }

    // 标签过滤
    if (selectedTags.value.length > 0) {
      result = result.filter((b) =>
        selectedTags.value.every((tag) => b.tags.includes(tag))
      )
    }

    // 置顶过滤
    if (showPinned.value) {
      result = result.filter((b) => b.isPinned)
    }

    // 收藏过滤
    if (showFavorite.value) {
      result = result.filter((b) => b.isFavorite)
    }

    // 排序
    result.sort((a, b) => {
      let aValue: any = a[sortBy.value]
      let bValue: any = b[sortBy.value]

      if (sortBy.value === 'title') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder.value === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // 置顶的排在前面
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })

    return result
  })

  const stats = computed(() => {
    return {
      total: bookmarks.value.length,
      pinned: bookmarks.value.filter((b) => b.isPinned).length,
      favorite: bookmarks.value.filter((b) => b.isFavorite).length,
      byCategory: categories.value.reduce((acc, cat) => {
        acc[cat.id] = bookmarks.value.filter((b) => b.category === cat.id).length
        return acc
      }, {} as Record<string, number>),
      byTag: {} as Record<string, number>,
    }
  })

  // ========== 操作方法 ==========
  
  // 添加书签
  function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt' | 'visitCount'>) {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      visitCount: 0,
    }
    bookmarks.value.unshift(newBookmark)
    saveToStorage()
    updateCategoryCounts()
    updateTagCounts()
    ElMessage.success('书签添加成功')
  }

  // 更新书签
  function updateBookmark(id: string, updates: Partial<Bookmark>) {
    const index = bookmarks.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      bookmarks.value[index] = {
        ...bookmarks.value[index],
        ...updates,
        updatedAt: Date.now(),
      }
      saveToStorage()
      updateCategoryCounts()
      updateTagCounts()
      ElMessage.success('书签更新成功')
    }
  }

  // 删除书签
  function deleteBookmark(id: string) {
    const index = bookmarks.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      bookmarks.value.splice(index, 1)
      saveToStorage()
      updateCategoryCounts()
      updateTagCounts()
      ElMessage.success('书签删除成功')
    }
  }

  // 切换置顶
  function togglePin(id: string) {
    const bookmark = bookmarks.value.find((b) => b.id === id)
    if (bookmark) {
      bookmark.isPinned = !bookmark.isPinned
      bookmark.updatedAt = Date.now()
      saveToStorage()
    }
  }

  // 切换收藏
  function toggleFavorite(id: string) {
    const bookmark = bookmarks.value.find((b) => b.id === id)
    if (bookmark) {
      bookmark.isFavorite = !bookmark.isFavorite
      bookmark.updatedAt = Date.now()
      saveToStorage()
    }
  }

  // 访问书签（打开网址）
  function visitBookmark(id: string) {
    const bookmark = bookmarks.value.find((b) => b.id === id)
    if (bookmark) {
      bookmark.visitCount++
      bookmark.lastVisitAt = Date.now()
      bookmark.updatedAt = Date.now()
      saveToStorage()
      window.open(bookmark.url, '_blank')
    }
  }

  // 添加分类
  function addCategory(category: Omit<BookmarkCategory, 'count'>) {
    categories.value.push({ ...category, count: 0 })
    saveCategoriesToStorage()
    ElMessage.success('分类添加成功')
  }

  // 删除分类
  function deleteCategory(id: string) {
    // 检查是否有书签使用该分类
    const hasBookmarks = bookmarks.value.some((b) => b.category === id)
    if (hasBookmarks) {
      ElMessage.warning('该分类下还有书签，请先移动或删除书签')
      return
    }
    const index = categories.value.findIndex((c) => c.id === id)
    if (index !== -1) {
      categories.value.splice(index, 1)
      saveCategoriesToStorage()
      ElMessage.success('分类删除成功')
    }
  }

  // 添加标签
  function addTag(tag: Omit<BookmarkTag, 'count'>) {
    const exists = tags.value.find((t) => t.name === tag.name)
    if (exists) {
      ElMessage.warning('标签已存在')
      return
    }
    tags.value.push({ ...tag, count: 0 })
    saveTagsToStorage()
    ElMessage.success('标签添加成功')
  }

  // 删除标签
  function deleteTag(id: string) {
    const tag = tags.value.find((t) => t.id === id)
    if (!tag) return
    
    // 从所有书签中移除该标签
    bookmarks.value.forEach((b) => {
      b.tags = b.tags.filter((t) => t !== tag.name)
    })
    
    const index = tags.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      tags.value.splice(index, 1)
      saveTagsToStorage()
      saveToStorage()
      ElMessage.success('标签删除成功')
    }
  }

  // 更新分类计数
  function updateCategoryCounts() {
    categories.value.forEach((cat) => {
      cat.count = bookmarks.value.filter((b) => b.category === cat.id).length
    })
    saveCategoriesToStorage()
  }

  // 更新标签计数
  function updateTagCounts() {
    const tagCounts: Record<string, number> = {}
    bookmarks.value.forEach((b) => {
      b.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    tags.value.forEach((tag) => {
      tag.count = tagCounts[tag.name] || 0
    })
    saveTagsToStorage()
  }

  // 导入书签（从 JSON）
  function importBookmarks(data: any) {
    try {
      if (Array.isArray(data.bookmarks)) {
        bookmarks.value = data.bookmarks
      }
      if (Array.isArray(data.categories)) {
        categories.value = data.categories
      }
      if (Array.isArray(data.tags)) {
        tags.value = data.tags
      }
      saveToStorage()
      saveCategoriesToStorage()
      saveTagsToStorage()
      updateCategoryCounts()
      updateTagCounts()
      ElMessage.success('导入成功')
    } catch (error) {
      ElMessage.error('导入失败：数据格式错误')
    }
  }

  // 导出书签（为 JSON）
  function exportBookmarks() {
    return {
      bookmarks: bookmarks.value,
      categories: categories.value,
      tags: tags.value,
      exportedAt: Date.now(),
    }
  }

  // 清空所有书签
  function clearAll() {
    bookmarks.value = []
    saveToStorage()
    updateCategoryCounts()
    updateTagCounts()
    ElMessage.success('已清空所有书签')
  }

  // ========== 存储方法 ==========
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.value))
    } catch (error) {
      console.error('保存书签失败:', error)
      ElMessage.error('保存失败：存储空间不足')
    }
  }

  function saveCategoriesToStorage() {
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories.value))
    } catch (error) {
      console.error('保存分类失败:', error)
    }
  }

  function saveTagsToStorage() {
    try {
      localStorage.setItem(TAGS_KEY, JSON.stringify(tags.value))
    } catch (error) {
      console.error('保存标签失败:', error)
    }
  }

  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        bookmarks.value = JSON.parse(saved)
      }
      
      const savedCategories = localStorage.getItem(CATEGORIES_KEY)
      if (savedCategories) {
        categories.value = JSON.parse(savedCategories)
      }
      
      const savedTags = localStorage.getItem(TAGS_KEY)
      if (savedTags) {
        tags.value = JSON.parse(savedTags)
      }
      
      updateCategoryCounts()
      updateTagCounts()
    } catch (error) {
      console.error('加载书签失败:', error)
      ElMessage.error('加载书签失败')
    }
  }

  // ========== 初始化 ==========
  loadFromStorage()

  return {
    // 状态
    bookmarks,
    categories,
    tags,
    isLoading,
    searchText,
    selectedCategory,
    selectedTags,
    showPinned,
    showFavorite,
    sortBy,
    sortOrder,
    
    // 计算属性
    filteredBookmarks,
    stats,
    
    // 方法
    addBookmark,
    updateBookmark,
    deleteBookmark,
    togglePin,
    toggleFavorite,
    visitBookmark,
    addCategory,
    deleteCategory,
    addTag,
    deleteTag,
    importBookmarks,
    exportBookmarks,
    clearAll,
    loadFromStorage,
  }
})

