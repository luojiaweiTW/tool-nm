<template>
  <div class="bookmarks-page">
    <!-- 头部 -->
    <Header
      icon="i-mdi-bookmark-multiple"
      title="网页收藏夹"
      description="管理你的常用网站和资源链接"
    >
      <template #actions>
        <div class="header-actions">
          <!-- 搜索 -->
          <NeonInput
            v-model="bookmarksStore.searchText"
            placeholder="搜索书签..."
            clearable
            style="width: 300px;"
          >
            <template #prefix>
              <i class="i-mdi-magnify" />
            </template>
          </NeonInput>

          <!-- 排序 -->
          <el-dropdown @command="handleSortChange">
            <NeonButton>
              <i class="i-mdi-sort" />
              排序
            </NeonButton>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="createdAt-desc">
                  <i class="i-mdi-clock" />
                  创建时间 ↓
                </el-dropdown-item>
                <el-dropdown-item command="createdAt-asc">
                  <i class="i-mdi-clock" />
                  创建时间 ↑
                </el-dropdown-item>
                <el-dropdown-item command="title-asc" divided>
                  <i class="i-mdi-sort-alphabetical-ascending" />
                  标题 A-Z
                </el-dropdown-item>
                <el-dropdown-item command="title-desc">
                  <i class="i-mdi-sort-alphabetical-descending" />
                  标题 Z-A
                </el-dropdown-item>
                <el-dropdown-item command="visitCount-desc" divided>
                  <i class="i-mdi-eye" />
                  访问次数 ↓
                </el-dropdown-item>
                <el-dropdown-item command="visitCount-asc">
                  <i class="i-mdi-eye" />
                  访问次数 ↑
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 筛选 -->
          <el-button-group>
            <NeonButton
              :type="bookmarksStore.showPinned ? 'primary' : 'default'"
              @click="bookmarksStore.showPinned = !bookmarksStore.showPinned"
            >
              <i class="i-mdi-pin" />
              置顶
            </NeonButton>
            <NeonButton
              :type="bookmarksStore.showFavorite ? 'primary' : 'default'"
              @click="bookmarksStore.showFavorite = !bookmarksStore.showFavorite"
            >
              <i class="i-mdi-star" />
              收藏
            </NeonButton>
          </el-button-group>

          <!-- 更多操作 -->
          <el-dropdown @command="handleMenuCommand">
            <NeonButton>
              <i class="i-mdi-dots-vertical" />
            </NeonButton>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="import">
                  <i class="i-mdi-upload" />
                  导入书签
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <i class="i-mdi-download" />
                  导出书签
                </el-dropdown-item>
                <el-dropdown-item command="clear" divided>
                  <i class="i-mdi-delete-sweep" style="color: var(--neon-pink);" />
                  <span style="color: var(--neon-pink);">清空所有</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- 新增按钮 -->
          <NeonButton type="primary" @click="handleAdd">
            <i class="i-mdi-plus" />
            新增书签
          </NeonButton>
        </div>
      </template>
    </Header>

    <div class="bookmarks-page__content">
      <!-- 侧边栏：分类和标签 -->
      <aside class="bookmarks-sidebar">
        <!-- 统计信息 -->
        <NeonCard title="统计" compact>
          <div class="stats">
            <div class="stat-item">
              <i class="i-mdi-bookmark-multiple" />
              <div class="stat-info">
                <span class="stat-label">总书签</span>
                <span class="stat-value">{{ bookmarksStore.stats.total }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="i-mdi-pin" />
              <div class="stat-info">
                <span class="stat-label">置顶</span>
                <span class="stat-value">{{ bookmarksStore.stats.pinned }}</span>
              </div>
            </div>
            <div class="stat-item">
              <i class="i-mdi-star" />
              <div class="stat-info">
                <span class="stat-label">收藏</span>
                <span class="stat-value">{{ bookmarksStore.stats.favorite }}</span>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 分类 -->
        <NeonCard title="分类" compact style="margin-top: 16px;">
          <div class="category-list">
            <div
              class="category-item"
              :class="{ active: !bookmarksStore.selectedCategory }"
              @click="selectCategory('')"
            >
              <i class="i-mdi-view-grid" />
              <span class="category-name">全部</span>
              <el-tag size="small" round>
                {{ bookmarksStore.stats.total }}
              </el-tag>
            </div>
            <div
              v-for="cat in bookmarksStore.categories"
              :key="cat.id"
              class="category-item"
              :class="{ active: bookmarksStore.selectedCategory === cat.id }"
              @click="selectCategory(cat.id)"
            >
              <i :class="cat.icon" :style="{ color: cat.color }" />
              <span class="category-name">{{ cat.name }}</span>
              <el-tag size="small" round>
                {{ bookmarksStore.stats.byCategory[cat.id] || 0 }}
              </el-tag>
            </div>
          </div>
        </NeonCard>

        <!-- 标签 -->
        <NeonCard
          v-if="bookmarksStore.tags.length > 0"
          title="标签"
          compact
          style="margin-top: 16px;"
        >
          <div class="tag-cloud">
            <el-tag
              v-for="tag in bookmarksStore.tags"
              :key="tag.id"
              :effect="bookmarksStore.selectedTags.includes(tag.name) ? 'dark' : 'plain'"
              :color="tag.color"
              size="small"
              class="tag-item"
              @click="toggleTag(tag.name)"
            >
              {{ tag.name }}
              <span class="tag-count">({{ tag.count }})</span>
            </el-tag>
          </div>
        </NeonCard>
      </aside>

      <!-- 主内容：书签列表 -->
      <main class="bookmarks-main">
        <!-- 空状态 -->
        <EmptyState
          v-if="bookmarksStore.filteredBookmarks.length === 0 && !bookmarksStore.isLoading"
          icon="i-mdi-bookmark-multiple-outline"
          title="暂无书签"
          description="点击右上角按钮添加你的第一个书签"
        />

        <!-- 加载中 -->
        <div v-else-if="bookmarksStore.isLoading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 书签列表 -->
        <div v-else class="bookmarks-grid">
          <BookmarkCard
            v-for="bookmark in paginatedBookmarks"
            :key="bookmark.id"
            :bookmark="bookmark"
            @toggle-pin="handleTogglePin"
            @toggle-favorite="handleToggleFavorite"
            @edit="handleEdit"
            @delete="handleDelete"
            @visit="handleVisit"
          />
        </div>

        <!-- 加载更多 -->
        <div
          v-if="hasMoreBookmarks"
          class="load-more"
        >
          <NeonButton @click="loadMore" style="width: 100%;">
            加载更多 (剩余 {{ bookmarksStore.filteredBookmarks.length - paginatedBookmarks.length }} 条)
          </NeonButton>
        </div>
      </main>
    </div>

    <!-- 编辑器对话框 -->
    <BookmarkEditor
      v-model="showEditor"
      :bookmark="currentBookmark"
      @saved="handleEditorSaved"
    />

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入书签"
      width="500px"
    >
      <div class="import-dialog">
        <p class="import-tip">
          <i class="i-mdi-information" />
          请粘贴导出的 JSON 数据，或选择 JSON 文件
        </p>
        <NeonTextarea
          v-model="importData"
          :rows="10"
          placeholder='{"bookmarks": [...], "categories": [...], "tags": [...]}'
        />
        <div class="import-file">
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            style="display: none;"
            @change="handleFileSelect"
          />
          <el-button @click="() => fileInputRef?.click()">
            <i class="i-mdi-file" />
            选择文件
          </el-button>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <NeonButton type="primary" @click="handleImport">
            导入
          </NeonButton>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useBookmarksStore, type Bookmark } from '@/stores/bookmarks'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import EmptyState from '@/components/EmptyState.vue'
import BookmarkCard from './components/BookmarkCard.vue'
import BookmarkEditor from './components/BookmarkEditor.vue'

const bookmarksStore = useBookmarksStore()

// ========== 编辑器 ==========
const showEditor = ref(false)
const currentBookmark = ref<Bookmark | null>(null)

function handleAdd() {
  currentBookmark.value = null
  showEditor.value = true
}

function handleEdit(bookmark: Bookmark) {
  currentBookmark.value = bookmark
  showEditor.value = true
}

function handleEditorSaved() {
  // 编辑器保存后刷新列表
}

// ========== 书签操作 ==========
function handleTogglePin(id: string) {
  bookmarksStore.togglePin(id)
}

function handleToggleFavorite(id: string) {
  bookmarksStore.toggleFavorite(id)
}

function handleVisit(id: string) {
  bookmarksStore.visitBookmark(id)
}

async function handleDelete(id: string) {
  await ElMessageBox.confirm('确定要删除这个书签吗？', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  bookmarksStore.deleteBookmark(id)
}

// ========== 分类和标签 ==========
function selectCategory(categoryId: string) {
  bookmarksStore.selectedCategory = categoryId
}

function toggleTag(tagName: string) {
  const index = bookmarksStore.selectedTags.indexOf(tagName)
  if (index > -1) {
    bookmarksStore.selectedTags.splice(index, 1)
  } else {
    bookmarksStore.selectedTags.push(tagName)
  }
}

// ========== 排序 ==========
function handleSortChange(command: string) {
  const [sortBy, sortOrder] = command.split('-')
  bookmarksStore.sortBy = sortBy as any
  bookmarksStore.sortOrder = sortOrder as any
  ElMessage.success('排序已更新')
}

// ========== 导入导出 ==========
const showImportDialog = ref(false)
const importData = ref('')
const fileInputRef = ref<HTMLInputElement>()

function handleMenuCommand(command: string) {
  switch (command) {
    case 'import':
      showImportDialog.value = true
      importData.value = ''
      break
    case 'export':
      handleExport()
      break
    case 'clear':
      handleClearAll()
      break
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      importData.value = e.target?.result as string
    }
    reader.readAsText(file)
  }
}

function handleImport() {
  try {
    const data = JSON.parse(importData.value)
    bookmarksStore.importBookmarks(data)
    showImportDialog.value = false
  } catch (error) {
    ElMessage.error('导入失败：JSON 格式错误')
  }
}

function handleExport() {
  const data = bookmarksStore.exportBookmarks()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bookmarks-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

async function handleClearAll() {
  await ElMessageBox.confirm(
    '确定要清空所有书签吗？此操作不可恢复！',
    '确认清空',
    {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  bookmarksStore.clearAll()
}

// ========== 分页 ==========
const pageSize = ref(20)
const currentPage = ref(1)

const paginatedBookmarks = computed(() => {
  const start = 0
  const end = currentPage.value * pageSize.value
  return bookmarksStore.filteredBookmarks.slice(start, end)
})

const hasMoreBookmarks = computed(() => {
  return paginatedBookmarks.value.length < bookmarksStore.filteredBookmarks.length
})

function loadMore() {
  currentPage.value++
}
</script>

<style scoped>
.bookmarks-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-lg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.bookmarks-page__content {
  display: flex;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

/* ========== 侧边栏 ========== */
.bookmarks-sidebar {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
.bookmarks-sidebar::-webkit-scrollbar {
  width: 8px;
}

.bookmarks-sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.bookmarks-sidebar::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.bookmarks-sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

/* 统计信息 */
.stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: rgba(33, 230, 255, 0.05);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.stat-item:hover {
  background: rgba(33, 230, 255, 0.1);
}

.stat-item i {
  font-size: 24px;
  color: var(--neon-cyan);
}

.stat-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
}

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.category-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.category-item:hover {
  background: rgba(33, 230, 255, 0.1);
}

.category-item.active {
  background: rgba(33, 230, 255, 0.2);
  border-left: 3px solid var(--neon-cyan);
}

.category-item i {
  font-size: 20px;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  font-size: var(--font-size-base);
  color: var(--color-text);
}

/* 标签云 */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag-item {
  cursor: pointer;
  transition: all var(--transition-base);
}

.tag-item:hover {
  transform: translateY(-2px);
}

.tag-count {
  margin-left: var(--spacing-xs);
  opacity: 0.7;
}

/* ========== 主内容 ========== */
.bookmarks-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* 自定义滚动条 */
.bookmarks-main::-webkit-scrollbar {
  width: 8px;
}

.bookmarks-main::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.bookmarks-main::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.bookmarks-main::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xxl);
  color: var(--color-muted);
}

.loading i {
  font-size: 48px;
}

/* 书签网格 */
.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.load-more {
  margin-top: var(--spacing-md);
}

/* ========== 导入对话框 ========== */
.import-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.import-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(33, 230, 255, 0.1);
  border-left: 3px solid var(--neon-cyan);
  border-radius: var(--radius-md);
  color: var(--color-text);
  margin: 0;
}

.import-tip i {
  font-size: 20px;
  color: var(--neon-cyan);
}

.import-file {
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

/* ========== 响应式 ========== */
@media (max-width: 1200px) {
  .bookmarks-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
}

@media (max-width: 992px) {
  .bookmarks-page__content {
    flex-direction: column;
  }

  .bookmarks-sidebar {
    width: 100%;
    max-height: 300px;
  }

  .bookmarks-grid {
    grid-template-columns: 1fr;
  }
}
</style>

