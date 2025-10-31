<template>
  <div class="snippets-page">
    <Header
      icon="i-mdi-code-braces-box"
      title="代码片段"
      description="管理和使用你的代码片段"
    >
      <template #actions>
        <NeonButton variant="primary" @click="handleAdd">
          <i class="i-mdi-plus" />
          新增片段
        </NeonButton>
      </template>
    </Header>

    <div class="snippets-page__content">
      <!-- 侧边栏：筛选 -->
      <aside class="snippets-sidebar">
        <NeonCard title="筛选" compact>
          <!-- 搜索 -->
          <div class="filter-section">
            <NeonInput
              v-model="searchText"
              placeholder="搜索片段..."
              clearable
            >
              <template #prefix>
                <i class="i-mdi-magnify" />
              </template>
            </NeonInput>
          </div>

          <!-- 语言筛选 -->
          <div class="filter-section">
            <div class="filter-section__title">编程语言</div>
            <el-select
              v-model="selectedLanguage"
              placeholder="全部语言"
              clearable
              size="small"
            >
              <el-option
                v-for="lang in languages"
                :key="lang.id"
                :label="lang.name"
                :value="lang.id"
              >
                <i :class="lang.icon" />
                {{ lang.name }}
              </el-option>
            </el-select>
          </div>

          <!-- 分类筛选 -->
          <div class="filter-section">
            <div class="filter-section__title">分类</div>
            <div class="filter-tags">
              <el-tag
                v-for="category in snippetStore.categories"
                :key="category.id"
                :type="selectedCategory === category.id ? 'primary' : 'info'"
                :effect="selectedCategory === category.id ? 'dark' : 'plain'"
                size="small"
                style="cursor: pointer; margin: 4px;"
                @click="toggleCategory(category.id)"
              >
                <i :class="category.icon" />
                {{ category.name }}
              </el-tag>
            </div>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-section">
            <div class="filter-section__title">标签</div>
            <div class="filter-tags">
              <el-tag
                v-for="tag in snippetStore.tags"
                :key="tag.id"
                :type="selectedTags.includes(tag.id) ? 'primary' : 'info'"
                :effect="selectedTags.includes(tag.id) ? 'dark' : 'plain'"
                :color="tag.color"
                size="small"
                style="cursor: pointer; margin: 4px;"
                @click="toggleTag(tag.id)"
              >
                {{ tag.name }}
              </el-tag>
            </div>
          </div>

          <!-- 快捷筛选 -->
          <div class="filter-section">
            <div class="filter-section__title">快捷筛选</div>
            <el-checkbox v-model="showPinned">只看置顶</el-checkbox>
            <el-checkbox v-model="showFavorite">只看收藏</el-checkbox>
          </div>
        </NeonCard>

        <!-- 统计信息 -->
        <NeonCard title="统计" compact style="margin-top: 16px;">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">总数</span>
              <span class="stat-value">{{ snippetStore.stats.totalSnippets }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">分类</span>
              <span class="stat-value">{{ snippetStore.categories.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">标签</span>
              <span class="stat-value">{{ snippetStore.tags.length }}</span>
            </div>
          </div>
        </NeonCard>
      </aside>

      <!-- 主内容区：代码片段列表 -->
      <main class="snippets-main">
        <!-- 空状态 -->
        <EmptyState
          v-if="snippetStore.filteredSnippets.length === 0 && !snippetStore.isLoading"
          icon="i-mdi-code-braces-box"
          title="暂无代码片段"
          description="点击右上角按钮添加你的第一个代码片段"
        />

        <!-- 加载中 -->
        <div v-else-if="snippetStore.isLoading" class="loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>

        <!-- 代码片段列表 -->
        <div v-else class="snippets-grid">
          <SnippetCard
            v-for="snippet in snippetStore.filteredSnippets"
            :key="snippet.id"
            :snippet="snippet"
            @edit="handleEdit"
            @delete="handleDelete"
            @use="handleUse"
            @toggle-pin="handleTogglePin"
            @toggle-favorite="handleToggleFavorite"
          />
        </div>
      </main>
    </div>

    <!-- 编辑器对话框 -->
    <SnippetEditor
      v-model="editorVisible"
      :snippet="currentSnippet"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useSnippetStore } from '@/stores/snippet'
import type { Snippet, SnippetLanguage } from '@/types/snippet'
import { Loading } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import EmptyState from '@/components/EmptyState.vue'
import SnippetCard from './components/SnippetCard.vue'
import SnippetEditor from './components/SnippetEditor.vue'

const snippetStore = useSnippetStore()

// 筛选状态
const searchText = ref('')
const selectedLanguage = ref<SnippetLanguage | ''>('')
const selectedCategory = ref('')
const selectedTags = ref<string[]>([])
const showPinned = ref(false)
const showFavorite = ref(false)

// 编辑器状态
const editorVisible = ref(false)
const currentSnippet = ref<Snippet | undefined>()

// 支持的语言列表
const languages = ref([
  { id: 'javascript', name: 'JavaScript', icon: 'i-mdi-language-javascript', color: '#f7df1e' },
  { id: 'typescript', name: 'TypeScript', icon: 'i-mdi-language-typescript', color: '#3178c6' },
  { id: 'python', name: 'Python', icon: 'i-mdi-language-python', color: '#3776ab' },
  { id: 'java', name: 'Java', icon: 'i-mdi-language-java', color: '#007396' },
  { id: 'go', name: 'Go', icon: 'i-mdi-language-go', color: '#00add8' },
  { id: 'rust', name: 'Rust', icon: 'i-mdi-language-rust', color: '#dea584' },
  { id: 'cpp', name: 'C++', icon: 'i-mdi-language-cpp', color: '#00599c' },
  { id: 'csharp', name: 'C#', icon: 'i-mdi-language-csharp', color: '#239120' },
  { id: 'php', name: 'PHP', icon: 'i-mdi-language-php', color: '#777bb4' },
  { id: 'ruby', name: 'Ruby', icon: 'i-mdi-language-ruby', color: '#cc342d' },
  { id: 'sql', name: 'SQL', icon: 'i-mdi-database', color: '#4479a1' },
  { id: 'bash', name: 'Bash', icon: 'i-mdi-bash', color: '#4eaa25' },
  { id: 'html', name: 'HTML', icon: 'i-mdi-language-html5', color: '#e34f26' },
  { id: 'css', name: 'CSS', icon: 'i-mdi-language-css3', color: '#1572b6' },
  { id: 'json', name: 'JSON', icon: 'i-mdi-code-json', color: '#000000' },
  { id: 'yaml', name: 'YAML', icon: 'i-mdi-file-code', color: '#cb171e' },
  { id: 'markdown', name: 'Markdown', icon: 'i-mdi-language-markdown', color: '#000000' },
])

// 监听筛选条件变化
watch(
  [searchText, selectedLanguage, selectedCategory, selectedTags, showPinned, showFavorite],
  () => {
    snippetStore.setFilter({
      searchText: searchText.value || undefined,
      language: selectedLanguage.value || undefined,
      categoryId: selectedCategory.value || undefined,
      tagIds: selectedTags.value.length > 0 ? selectedTags.value : undefined,
      isPinned: showPinned.value || undefined,
      isFavorite: showFavorite.value || undefined,
    })
  }
)

// 切换分类
function toggleCategory(categoryId: string) {
  selectedCategory.value = selectedCategory.value === categoryId ? '' : categoryId
}

// 切换标签
function toggleTag(tagId: string) {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagId)
  }
}

// 添加
function handleAdd() {
  currentSnippet.value = undefined
  editorVisible.value = true
}

// 编辑
function handleEdit(snippet: Snippet) {
  currentSnippet.value = snippet
  editorVisible.value = true
}

// 删除
async function handleDelete(snippet: Snippet) {
  await snippetStore.deleteSnippet(snippet.id)
}

// 使用（复制）
async function handleUse(snippet: Snippet) {
  await snippetStore.useSnippet(snippet.id)
}

// 切换置顶
async function handleTogglePin(snippet: Snippet) {
  await snippetStore.togglePin(snippet.id)
}

// 切换收藏
async function handleToggleFavorite(snippet: Snippet) {
  await snippetStore.toggleFavorite(snippet.id)
}

// 保存
async function handleSave() {
  editorVisible.value = false
  currentSnippet.value = undefined
}

// 初始化
onMounted(() => {
  snippetStore.initialize()
})
</script>

<style scoped>
.snippets-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.snippets-page__content {
  flex: 1;
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  overflow: hidden;
}

/* 侧边栏 */
.snippets-sidebar {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: var(--spacing-lg);
}

.filter-section__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.filter-section el-checkbox {
  display: block;
  margin-bottom: var(--spacing-xs);
}

.stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
}

/* 主内容区 */
.snippets-main {
  flex: 1;
  overflow-y: auto;
}

.snippets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.loading .el-icon {
  font-size: 32px;
}

@media (max-width: 1024px) {
  .snippets-page__content {
    flex-direction: column;
  }

  .snippets-sidebar {
    width: 100%;
  }

  .snippets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
