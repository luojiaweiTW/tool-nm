<template>
  <div class="knowledge-base">
    <!-- 顶部操作栏 -->
    <div class="knowledge-header">
      <div class="header-left">
        <h1 class="title">📚 知识库</h1>
        <div class="stats">
          <el-tag type="info" size="small">
            共 {{ knowledgeStore.stats.totalItems }} 条
          </el-tag>
          <el-tag v-if="knowledgeStore.filter.isFavorite" type="warning" size="small">
            收藏
          </el-tag>
          <el-tag v-if="knowledgeStore.filter.isPinned" type="success" size="small">
            钉选
          </el-tag>
        </div>
      </div>
      <div class="header-actions">
        <NeonInput
          v-model="searchText"
          placeholder="搜索标题、内容..."
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </NeonInput>
        
        <el-button-group>
          <NeonButton
            :type="knowledgeStore.filter.isPinned ? 'primary' : 'default'"
            @click="togglePinnedFilter"
          >
            <el-icon><Location /></el-icon>
            钉选
          </NeonButton>
          <NeonButton
            :type="knowledgeStore.filter.isFavorite ? 'primary' : 'default'"
            @click="toggleFavoriteFilter"
          >
            <el-icon><Star /></el-icon>
            收藏
          </NeonButton>
        </el-button-group>

        <el-dropdown @command="handleMenuCommand">
          <NeonButton>
            <el-icon><MoreFilled /></el-icon>
          </NeonButton>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="export">
                <el-icon><Download /></el-icon>
                导出数据
              </el-dropdown-item>
              <el-dropdown-item command="import">
                <el-icon><Upload /></el-icon>
                导入数据
              </el-dropdown-item>
              <el-dropdown-item divided command="manage-categories">
                <el-icon><Folder /></el-icon>
                管理分类
              </el-dropdown-item>
              <el-dropdown-item command="manage-tags">
                <el-icon><Discount /></el-icon>
                管理标签
              </el-dropdown-item>
              <el-dropdown-item divided command="shortcuts">
                <el-icon><Opportunity /></el-icon>
                快捷键 (?)
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <NeonButton type="primary" @click="showEditor()">
          <el-icon><Plus /></el-icon>
          新增知识
        </NeonButton>
      </div>
    </div>

    <!-- 主体区域 -->
    <div class="knowledge-body">
      <!-- 左侧：分类和标签 -->
      <div class="knowledge-sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <!-- 分类 -->
        <NeonCard title="分类" class="sidebar-card">
          <div class="category-list">
            <div
              v-for="cat in knowledgeStore.categories"
              :key="cat.id"
              class="category-item"
              :class="{ active: knowledgeStore.filter.categoryId === cat.id }"
              @click="selectCategory(cat.id)"
            >
              <el-icon :style="{ color: cat.color }">
                <component :is="cat.icon" />
              </el-icon>
              <span class="category-name">{{ cat.name }}</span>
              <el-tag size="small" round>
                {{ knowledgeStore.stats.byCategory[cat.id] || 0 }}
              </el-tag>
            </div>
            <div
              class="category-item"
              :class="{ active: !knowledgeStore.filter.categoryId }"
              @click="selectCategory(undefined)"
            >
              <el-icon><FolderOpened /></el-icon>
              <span class="category-name">全部</span>
              <el-tag size="small" round>
                {{ knowledgeStore.stats.totalItems }}
              </el-tag>
            </div>
          </div>
        </NeonCard>

        <!-- 标签云 -->
        <NeonCard title="标签" class="sidebar-card">
          <div class="tag-cloud">
            <el-tag
              v-for="tag in knowledgeStore.tags"
              :key="tag.id"
              :color="tag.color"
              :effect="isTagSelected(tag.id) ? 'dark' : 'plain'"
              class="tag-item"
              size="small"
              round
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
              <span class="tag-count">{{ knowledgeStore.stats.byTag[tag.id] || 0 }}</span>
            </el-tag>
          </div>
        </NeonCard>

        <!-- 类型筛选 -->
        <NeonCard title="类型" class="sidebar-card">
          <div class="type-filter">
            <el-radio-group v-model="typeFilter" @change="handleTypeChange">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="text">文本</el-radio-button>
              <el-radio-button label="image">图片</el-radio-button>
              <el-radio-button label="url">网址</el-radio-button>
            </el-radio-group>
          </div>
        </NeonCard>
      </div>

      <!-- 中间：知识列表 -->
      <div class="knowledge-list">
        <!-- 加载状态 -->
        <div v-if="knowledgeStore.isLoading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 空状态 -->
        <EmptyState
          v-else-if="knowledgeStore.filteredItems.length === 0"
          title="还没有知识条目"
          description="点击右上角「新增知识」开始收集您的知识宝藏"
        >
          <NeonButton type="primary" @click="showEditor()">
            <el-icon><Plus /></el-icon>
            新增第一条知识
          </NeonButton>
        </EmptyState>

        <!-- 知识列表 -->
        <div v-else class="knowledge-items">
          <div
            v-for="item in knowledgeStore.filteredItems"
            :key="item.id"
            class="knowledge-list-item"
            :class="{ active: selectedItem?.id === item.id }"
            @click="selectItem(item)"
          >
            <!-- 标记 -->
            <div class="item-badges">
              <el-icon v-if="item.isPinned" class="badge-icon pinned">
                <Location />
              </el-icon>
              <el-icon v-if="item.isFavorite" class="badge-icon favorite">
                <StarFilled />
              </el-icon>
            </div>

            <!-- 图片预览 -->
            <div v-if="item.type === 'image'" class="item-image">
              <img :src="getImagePath(item.content)" :alt="item.title" />
            </div>

            <!-- URL图标 -->
            <div v-else-if="item.type === 'url'" class="item-icon url-icon-type">
              <el-icon><Link /></el-icon>
            </div>

            <!-- 文本图标 -->
            <div v-else class="item-icon">
              <el-icon><Document /></el-icon>
            </div>

            <!-- 内容 -->
            <div class="item-content">
              <h4 class="item-title">{{ item.title }}</h4>
              <p v-if="item.description" class="item-description">
                {{ truncateText(item.description, 60) }}
              </p>
              <div class="item-meta">
                <span class="item-category" :style="{ color: getCategoryColor(item.categoryId) }">
                  {{ getCategoryName(item.categoryId) }}
                </span>
                <span class="item-time">{{ formatDate(item.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：详情面板 -->
      <div class="knowledge-detail" :class="{ 'has-selection': !!selectedItem, 'detail-expanded': sidebarCollapsed }">
        <!-- 折叠按钮 -->
        <div class="sidebar-toggle-btn" @click="toggleSidebar" :title="sidebarCollapsed ? '展开筛选' : '收起筛选'">
          <el-icon v-if="sidebarCollapsed">
            <DArrowRight />
          </el-icon>
          <el-icon v-else>
            <DArrowLeft />
          </el-icon>
          <span class="toggle-text">{{ sidebarCollapsed ? '展开' : '收起' }}</span>
        </div>

        <!-- 未选中状态 -->
        <div v-if="!selectedItem" class="detail-empty">
          <el-icon class="empty-icon"><DocumentCopy /></el-icon>
          <p>选择一个知识条目查看详情</p>
        </div>

        <!-- 详情内容 -->
        <div v-else class="detail-content">
          <!-- 顶部操作 -->
          <div class="detail-header">
            <div class="detail-actions">
              <el-button
                size="small"
                :type="selectedItem.isPinned ? 'warning' : 'default'"
                @click="handleTogglePin(selectedItem.id)"
                title="快捷键: P"
              >
                <el-icon><Location /></el-icon>
                {{ selectedItem.isPinned ? '取消钉选' : '钉选' }}
              </el-button>
              <el-button
                size="small"
                :type="selectedItem.isFavorite ? 'warning' : 'default'"
                @click="handleToggleFavorite(selectedItem.id)"
                title="快捷键: F"
              >
                <el-icon><Star /></el-icon>
                {{ selectedItem.isFavorite ? '取消收藏' : '收藏' }}
              </el-button>
              <el-button
                size="small"
                @click="handleCopyContent"
                title="复制内容 (Ctrl+C)"
              >
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
              <el-button
                size="small"
                type="primary"
                @click="showEditor(selectedItem)"
                title="快捷键: E"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDelete(selectedItem.id)"
                title="快捷键: Delete"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>

          <!-- 详情主体 -->
          <div class="detail-body">
            <!-- 标题 -->
            <h2 class="detail-title">{{ selectedItem.title }}</h2>

            <!-- 元信息 -->
            <div class="detail-meta">
              <el-tag
                :color="getCategoryColor(selectedItem.categoryId)"
                effect="dark"
                size="small"
              >
                {{ getCategoryName(selectedItem.categoryId) }}
              </el-tag>
              <span class="detail-time">
                创建于 {{ formatFullDate(selectedItem.createdAt) }}
              </span>
              <span class="detail-time">
                更新于 {{ formatFullDate(selectedItem.updatedAt) }}
              </span>
            </div>

            <!-- 标签 -->
            <div v-if="getItemTags(selectedItem).length > 0" class="detail-tags">
              <el-tag
                v-for="tag in getItemTags(selectedItem)"
                :key="tag.id"
                :color="tag.color"
                effect="plain"
                size="small"
              >
                {{ tag.name }}
              </el-tag>
            </div>

            <!-- 描述 -->
            <div v-if="selectedItem.description" class="detail-description">
              <h3>描述</h3>
              <p>{{ selectedItem.description }}</p>
            </div>

            <!-- 内容 -->
            <div class="detail-main">
              <h3>内容</h3>
              <!-- 图片（可点击放大）-->
              <div v-if="selectedItem.type === 'image'" class="detail-image" @click="showImageViewer">
                <img
                  :src="getImagePath(selectedItem.content)"
                  :alt="selectedItem.title"
                />
                <div class="image-hover-tip">
                  <el-icon><ZoomIn /></el-icon>
                  点击放大查看
                </div>
              </div>
              <!-- URL网址（iframe预览）-->
              <div v-else-if="selectedItem.type === 'url'" class="detail-url">
                <div class="url-info">
                  <el-tag type="info" size="large">
                    <el-icon><Link /></el-icon>
                    {{ selectedItem.url || selectedItem.content }}
                  </el-tag>
                  <el-button
                    type="primary"
                    size="small"
                    @click="openUrlInBrowser(selectedItem.url || selectedItem.content)"
                  >
                    <el-icon><View /></el-icon>
                    在浏览器中打开
                  </el-button>
                </div>
                <div class="url-iframe-container">
                  <iframe
                    :src="selectedItem.url || selectedItem.content"
                    frameborder="0"
                    class="url-iframe"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  ></iframe>
                </div>
              </div>
              <!-- 文本（支持 Markdown）-->
              <div v-else class="detail-text">
                <MarkdownRenderer :content="selectedItem.content" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑器对话框 -->
    <KnowledgeEditor
      v-model="editorVisible"
      :item="currentItem"
      @save="handleSave"
    />

    <!-- 分类管理对话框 -->
    <CategoryManager v-model="categoryManagerVisible" />

    <!-- 标签管理对话框 -->
    <TagManager v-model="tagManagerVisible" />

    <!-- 快捷键帮助 -->
    <KeyboardShortcuts v-model="shortcutsVisible" />

    <!-- 图片查看器 -->
    <ImageViewer
      v-model="imageViewerVisible"
      :src="currentImageSrc"
      :title="currentImageTitle"
    />

    <!-- 导入文件输入 -->
    <input
      ref="importInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge'
import type { KnowledgeItem } from '@/types/knowledge'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonCard from '@/components/NeonCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import KnowledgeCard from './components/KnowledgeCard.vue'
import KnowledgeEditor from './components/KnowledgeEditor.vue'
import CategoryManager from './components/CategoryManager.vue'
import TagManager from './components/TagManager.vue'
import KeyboardShortcuts from './components/KeyboardShortcuts.vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Search,
  Plus,
  MoreFilled,
  Download,
  Upload,
  Folder,
  Discount,
  Location,
  Star,
  StarFilled,
  FolderOpened,
  Loading,
  Document,
  DocumentCopy,
  Edit,
  Delete,
  Opportunity,
  ZoomIn,
  Link,
  View,
  DArrowLeft,
  DArrowRight,
} from '@element-plus/icons-vue'

const knowledgeStore = useKnowledgeStore()

// 搜索
const searchText = ref('')

// 筛选
const typeFilter = ref<'' | 'text' | 'image' | 'url'>('')
const selectedTags = ref<string[]>([])

// 选中的项目
const selectedItem = ref<KnowledgeItem | undefined>()

// 侧边栏折叠状态
const sidebarCollapsed = ref(false)

// 对话框
const editorVisible = ref(false)
const categoryManagerVisible = ref(false)
const tagManagerVisible = ref(false)
const shortcutsVisible = ref(false)
const imageViewerVisible = ref(false)
const currentItem = ref<KnowledgeItem | undefined>()

// 图片查看器
const currentImageSrc = ref('')
const currentImageTitle = ref('')

// 导入
const importInput = ref<HTMLInputElement>()

// 初始化
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  loadSidebarState()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// 搜索
function handleSearch() {
  knowledgeStore.setFilter({ searchText: searchText.value })
}

// 选择分类
function selectCategory(categoryId: string | undefined) {
  if (knowledgeStore.filter.categoryId === categoryId) {
    knowledgeStore.setFilter({ categoryId: undefined })
  } else {
    knowledgeStore.setFilter({ categoryId })
  }
}

// 切换标签
function toggleTag(tagId: string) {
  const tags = knowledgeStore.filter.tagIds || []
  const index = tags.indexOf(tagId)
  
  if (index > -1) {
    tags.splice(index, 1)
  } else {
    tags.push(tagId)
  }
  
  knowledgeStore.setFilter({ tagIds: [...tags] })
}

// 检查标签是否选中
function isTagSelected(tagId: string) {
  return knowledgeStore.filter.tagIds?.includes(tagId) || false
}

// 类型筛选
function handleTypeChange(type: '' | 'text' | 'image' | 'url') {
  knowledgeStore.setFilter({ type: type || undefined })
}

// 切换钉选筛选
function togglePinnedFilter() {
  const current = knowledgeStore.filter.isPinned
  knowledgeStore.setFilter({ isPinned: current ? undefined : true })
}

// 切换收藏筛选
function toggleFavoriteFilter() {
  const current = knowledgeStore.filter.isFavorite
  knowledgeStore.setFilter({ isFavorite: current ? undefined : true })
}

// 显示编辑器
function showEditor(item?: KnowledgeItem) {
  currentItem.value = item
  editorVisible.value = true
}

// 保存
function handleSave() {
  currentItem.value = undefined
  // 如果当前选中的项目被更新，刷新选中项
  if (selectedItem.value && currentItem.value?.id === selectedItem.value.id) {
    const updated = knowledgeStore.items.find(i => i.id === selectedItem.value!.id)
    if (updated) {
      selectedItem.value = updated
    }
  }
}

// 删除
async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这条知识吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await knowledgeStore.deleteItem(id)
    
    // 如果删除的是当前选中项，清空选中
    if (selectedItem.value?.id === id) {
      selectedItem.value = undefined
    }
  } catch {
    // 取消删除
  }
}

// 切换钉选
function handleTogglePin(id: string) {
  knowledgeStore.togglePin(id)
}

// 切换收藏
function handleToggleFavorite(id: string) {
  knowledgeStore.toggleFavorite(id)
}

// 菜單命令
function handleMenuCommand(command: string) {
  switch (command) {
    case 'export':
      knowledgeStore.exportData()
      break
    case 'import':
      importInput.value?.click()
      break
    case 'manage-categories':
      categoryManagerVisible.value = true
      break
    case 'manage-tags':
      tagManagerVisible.value = true
      break
    case 'shortcuts':
      shortcutsVisible.value = true
      break
  }
}

// 导入数据
async function handleImport(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    await knowledgeStore.importData(data)
  } catch (error) {
    console.error('Import failed:', error)
  }
  
  // 重置文件输入
  if (importInput.value) {
    importInput.value.value = ''
  }
}

// 选择项目
function selectItem(item: KnowledgeItem) {
  selectedItem.value = item
}

// 获取图片路径
function getImagePath(relativePath: string): string {
  return knowledgeStore.getImagePath(relativePath)
}

// 截断文本
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 格式化日期（相對時間）
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`
  } else {
    return date.toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
    })
  }
}

// 格式化日期（完整）
function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 获取分类名称
function getCategoryName(categoryId: string): string {
  return knowledgeStore.getCategoryById(categoryId)?.name || '未知'
}

// 获取分类颜色
function getCategoryColor(categoryId: string): string {
  return knowledgeStore.getCategoryById(categoryId)?.color || '#666'
}

// 获取项目标签
function getItemTags(item: KnowledgeItem) {
  return item.tags
    .map(tagId => knowledgeStore.getTagById(tagId))
    .filter(Boolean)
}

// 复制内容
function handleCopyContent() {
  if (!selectedItem.value) return
  
  const content = selectedItem.value.type === 'text' 
    ? selectedItem.value.content 
    : selectedItem.value.description || selectedItem.value.title
  
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('内容已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 显示图片查看器
function showImageViewer() {
  if (!selectedItem.value || selectedItem.value.type !== 'image') return
  
  currentImageSrc.value = getImagePath(selectedItem.value.content)
  currentImageTitle.value = selectedItem.value.title
  imageViewerVisible.value = true
}

// 在浏览器中打开URL
function openUrlInBrowser(url: string) {
  const electronAPI = (window as any).electronAPI
  if (electronAPI && electronAPI.openExternal) {
    electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
  ElMessage.success('已在浏览器中打开')
}

// 切换侧边栏折叠
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  // 保存状态到 localStorage
  localStorage.setItem('knowledge-sidebar-collapsed', String(sidebarCollapsed.value))
}

// 加载侧边栏折叠状态
function loadSidebarState() {
  const saved = localStorage.getItem('knowledge-sidebar-collapsed')
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true'
  }
}

// 快捷键处理
function handleKeyDown(event: KeyboardEvent) {
  // 只在知识详情页面处理
  if (!selectedItem.value) return
  
  // 防止在输入框中触发
  const target = event.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
  
  // P - 切换钉选
  if (event.key === 'p' || event.key === 'P') {
    event.preventDefault()
    handleTogglePin(selectedItem.value.id)
  }
  
  // F - 切换收藏
  if (event.key === 'f' || event.key === 'F') {
    event.preventDefault()
    handleToggleFavorite(selectedItem.value.id)
  }
  
  // E - 编辑
  if (event.key === 'e' || event.key === 'E') {
    event.preventDefault()
    showEditor(selectedItem.value)
  }
  
  // Delete - 删除
  if (event.key === 'Delete') {
    event.preventDefault()
    handleDelete(selectedItem.value.id)
  }
  
  // Ctrl+C - 复制
  if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
    // 如果没有选中文本，则复制整个内容
    const selection = window.getSelection()
    if (!selection || selection.toString().length === 0) {
      event.preventDefault()
      handleCopyContent()
    }
  }
  
  // ? - 显示快捷键帮助
  if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    shortcutsVisible.value = true
  }
}
</script>

<style scoped>
.knowledge-base {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

/* 頂部操作欄 */
.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--color-panel);
  border: 2px solid rgba(33, 230, 255, 0.3);
  border-radius: 12px;
  box-shadow: var(--glow-cyan);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stats {
  display: flex;
  gap: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 280px;
}

/* 主體區域 */
.knowledge-body {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

/* 側邊欄 */
.knowledge-sidebar {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  opacity: 1;
}

/* 侧边栏折叠状态 */
.knowledge-sidebar.sidebar-collapsed {
  width: 0;
  opacity: 0;
  overflow: hidden;
  padding: 0;
  margin: 0;
}

.sidebar-card {
  flex-shrink: 0;
}

/* 分類列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.category-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(33, 230, 255, 0.3);
  transform: translateX(4px);
}

.category-item.active {
  background: rgba(33, 230, 255, 0.1);
  border-color: var(--neon-cyan);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.3);
}

.category-name {
  flex: 1;
  font-size: 14px;
  color: var(--color-text);
}

/* 標籤雲 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tag-item:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px currentColor;
}

.tag-count {
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.8;
}

/* 類型篩選 */
.type-filter {
  display: flex;
  justify-content: center;
}

/* 知識列表（中間欄） */
.knowledge-list {
  width: 380px;
  overflow-y: auto;
  padding: 4px;
  border-right: 2px solid rgba(33, 230, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  opacity: 1;
}

/* 侧边栏收起时，列表可以稍微扩展宽度 */
.knowledge-sidebar.sidebar-collapsed ~ .knowledge-list {
  width: 420px;
}

.knowledge-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 列表項 */
.knowledge-list-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: var(--color-panel);
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
}

.knowledge-list-item:hover {
  border-color: rgba(33, 230, 255, 0.3);
  background: rgba(33, 230, 255, 0.05);
  transform: translateX(4px);
}

.knowledge-list-item.active {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2);
}

.item-badges {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
}

.item-badges .badge-icon {
  font-size: 14px;
}

.item-badges .pinned {
  color: var(--neon-yellow);
}

.item-badges .favorite {
  color: var(--neon-pink);
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid rgba(33, 230, 255, 0.3);
  border-radius: 6px;
  flex-shrink: 0;
}

.item-icon .el-icon {
  font-size: 28px;
  color: var(--neon-cyan);
}

/* URL类型图标样式 */
.item-icon.url-icon-type {
  background: rgba(155, 92, 255, 0.15);
  border-color: rgba(155, 92, 255, 0.3);
}

.item-icon.url-icon-type .el-icon {
  color: var(--neon-purple);
}

.item-content {
  flex: 1;
  min-width: 0;
  padding-right: 24px;
}

.item-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-description {
  margin: 0 0 6px 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.item-category {
  font-weight: 500;
}

.item-time {
  color: var(--color-muted);
  opacity: 0.7;
}

/* 詳情面板（右側） */
.knowledge-detail {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: var(--color-panel);
  border-radius: 12px;
  margin-left: 16px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* 详情区展开状态 - 侧边栏收起时，占据更多空间 */
.knowledge-detail.detail-expanded {
  margin-left: 0;
}

/* 侧边栏折叠按钮 */
.sidebar-toggle-btn {
  position: sticky;
  top: 0;
  left: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  margin-bottom: 20px;
  background: rgba(33, 230, 255, 0.15);
  border: 2px solid rgba(33, 230, 255, 0.4);
  border-radius: 10px;
  color: var(--neon-cyan);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 0 15px rgba(33, 230, 255, 0.3),
    0 0 25px rgba(33, 230, 255, 0.2);
  animation: buttonGlowCyan 2s ease-in-out infinite;
  user-select: none;
  width: fit-content;
}

.sidebar-toggle-btn:hover {
  background: rgba(33, 230, 255, 0.3);
  border-color: var(--neon-cyan);
  box-shadow: 
    0 0 25px rgba(33, 230, 255, 0.8),
    0 0 40px rgba(33, 230, 255, 0.5),
    0 0 55px rgba(155, 92, 255, 0.3);
  transform: translateY(-2px) scale(1.05);
}

.sidebar-toggle-btn .el-icon {
  font-size: 20px;
  transition: transform 0.3s;
}

.sidebar-toggle-btn:hover .el-icon {
  transform: scale(1.3);
}

.toggle-text {
  font-size: 13px;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(33, 230, 255, 0.6);
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* 按钮发光动画 */
@keyframes buttonGlowCyan {
  0%, 100% {
    box-shadow: 
      0 0 10px rgba(33, 230, 255, 0.2),
      0 0 15px rgba(33, 230, 255, 0.1);
  }
  50% {
    box-shadow: 
      0 0 15px rgba(33, 230, 255, 0.4),
      0 0 25px rgba(33, 230, 255, 0.2),
      0 0 35px rgba(155, 92, 255, 0.1);
  }
}

.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-muted);
  padding-top: 80px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.detail-empty p {
  font-size: 16px;
  opacity: 0.7;
}

/* 詳情內容 */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(33, 230, 255, 0.2);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-time {
  font-size: 13px;
  color: var(--color-muted);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-description h3,
.detail-main h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--neon-cyan);
}

.detail-description p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
}

.detail-image {
  position: relative;
  width: 100%;
  max-width: 800px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(33, 230, 255, 0.3);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.detail-image:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.4);
  transform: scale(1.02);
}

.detail-image img {
  width: 100%;
  height: auto;
  display: block;
}

.image-hover-tip {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  color: var(--neon-cyan);
  font-size: 14px;
  font-weight: 600;
}

.image-hover-tip .el-icon {
  font-size: 32px;
}

.detail-image:hover .image-hover-tip {
  opacity: 1;
}

.detail-text {
  padding: 4px;
}

/* URL 預覽 */
.detail-url {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.url-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(33, 230, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(33, 230, 255, 0.2);
  flex-wrap: wrap;
}

.url-info .el-tag {
  flex: 1;
  min-width: 200px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(33, 230, 255, 0.1);
  border-color: rgba(33, 230, 255, 0.3);
  color: var(--neon-cyan);
  padding: 8px 12px;
}

.url-iframe-container {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(33, 230, 255, 0.3);
  box-shadow: 
    0 0 15px rgba(33, 230, 255, 0.3),
    inset 0 0 20px rgba(33, 230, 255, 0.05);
  background: rgba(10, 15, 30, 0.9);
  animation: cardGlow 3s ease-in-out infinite;
}

.url-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
  position: relative;
  z-index: 2;
}

@keyframes neonFlicker {
  0%, 100% {
    opacity: 1;
    text-shadow: 
      0 0 10px #21e6ff,
      0 0 20px #21e6ff,
      0 0 30px #21e6ff;
  }
  50% {
    opacity: 0.7;
    text-shadow: 
      0 0 5px #21e6ff,
      0 0 10px #21e6ff;
  }
}

/* iframe 容器发光动画 */
@keyframes cardGlow {
  0%, 100% {
    box-shadow: 
      0 0 15px rgba(33, 230, 255, 0.3),
      inset 0 0 20px rgba(33, 230, 255, 0.05);
  }
  50% {
    box-shadow: 
      0 0 25px rgba(33, 230, 255, 0.5),
      0 0 40px rgba(155, 92, 255, 0.3),
      inset 0 0 30px rgba(33, 230, 255, 0.1);
  }
}

/* 加載狀態 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: var(--color-muted);
  font-size: 16px;
}

.loading .el-icon {
  font-size: 32px;
}

/* 響應式 */
@media (max-width: 1400px) {
  .knowledge-list {
    width: 320px;
  }
}

@media (max-width: 1200px) {
  .knowledge-sidebar {
    width: 240px;
  }
  
  .knowledge-list {
    width: 280px;
  }
  
  .search-input {
    width: 220px;
  }
}

@media (max-width: 900px) {
  .knowledge-body {
    flex-direction: column;
  }
  
  .knowledge-sidebar {
    width: 100%;
    flex-direction: row;
    overflow-x: auto;
    border-bottom: 2px solid rgba(33, 230, 255, 0.2);
    border-right: none;
  }
  
  .sidebar-card {
    min-width: 280px;
  }
  
  .knowledge-list {
    width: 100%;
    max-height: 300px;
    border-right: none;
    border-bottom: 2px solid rgba(33, 230, 255, 0.2);
  }
  
  .knowledge-detail {
    margin-left: 0;
    margin-top: 16px;
  }
}
</style>

