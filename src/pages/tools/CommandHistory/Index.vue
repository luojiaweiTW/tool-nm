<template>
  <div class="command-history-page">
    <Header
      icon="i-mdi-history"
      title="命令历史"
      description="管理终端命令历史和收藏夹"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClearHistory">
          <i class="i-mdi-delete-sweep" />
          清空历史
        </NeonButton>
        <NeonButton variant="primary" size="small" @click="showFavorites = !showFavorites">
          <i :class="showFavorites ? 'i-mdi-history' : 'i-mdi-star'" />
          {{ showFavorites ? '查看历史' : '查看收藏' }}
        </NeonButton>
      </template>
    </Header>

    <div class="command-history-page__content">
      <!-- 侧边栏：筛选 -->
      <aside class="command-history-sidebar">
        <NeonCard title="筛选" compact>
          <!-- 搜索 -->
          <div class="filter-section">
            <NeonInput
              v-model="searchText"
              placeholder="搜索命令..."
              clearable
            >
              <template #prefix>
                <i class="i-mdi-magnify" />
              </template>
            </NeonInput>
          </div>

          <!-- 服务器筛选 -->
          <div v-if="commandStore.stats.topServers.length > 0" class="filter-section">
            <div class="filter-section__title">服务器</div>
            <el-select
              v-model="selectedServer"
              placeholder="全部服务器"
              clearable
              size="small"
            >
              <el-option
                v-for="server in commandStore.stats.topServers"
                :key="server.host"
                :label="`${server.host} (${server.count})`"
                :value="server.host"
              />
            </el-select>
          </div>

          <!-- 分类筛选 -->
          <div class="filter-section">
            <div class="filter-section__title">分类</div>
            <div class="filter-tags">
              <el-tag
                v-for="category in commandStore.categories"
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
                v-for="tag in commandStore.tags"
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
            <el-checkbox v-model="showFavoriteOnly">只看收藏</el-checkbox>
          </div>
        </NeonCard>

        <!-- 统计信息 -->
        <NeonCard title="统计" compact style="margin-top: 16px;">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">总记录</span>
              <span class="stat-value">{{ commandStore.stats.totalCommands }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">收藏</span>
              <span class="stat-value">{{ commandStore.stats.favoriteCommands }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">服务器</span>
              <span class="stat-value">{{ commandStore.stats.topServers.length }}</span>
            </div>
          </div>
        </NeonCard>
      </aside>

      <!-- 主内容区 -->
      <main class="command-history-main">
        <!-- 历史记录视图 -->
        <div v-if="!showFavorites">
          <!-- 空状态 -->
          <EmptyState
            v-if="commandStore.filteredHistory.length === 0 && !commandStore.isLoading"
            icon="i-mdi-history"
            title="暂无命令历史"
            description="在SSH终端执行命令后会自动记录"
          />

          <!-- 加载中 -->
          <div v-else-if="commandStore.isLoading" class="loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <!-- 命令列表 -->
          <div v-else class="command-list">
            <CommandHistoryCard
              v-for="cmd in commandStore.filteredHistory"
              :key="cmd.id"
              :command="cmd"
              @copy="handleCopy"
              @delete="handleDelete"
              @toggle-favorite="handleToggleFavorite"
              @add-to-favorites="handleAddToFavorites"
            />
          </div>
        </div>

        <!-- 收藏夹视图 -->
        <div v-else>
          <EmptyState
            v-if="commandStore.favorites.length === 0"
            icon="i-mdi-star-outline"
            title="暂无收藏命令"
            description="从历史记录中添加常用命令到收藏夹"
          />

          <div v-else class="favorites-grid">
            <FavoriteCommandCard
              v-for="fav in commandStore.favorites"
              :key="fav.id"
              :favorite="fav"
              @use="handleUseFavorite"
              @delete="handleDeleteFavorite"
            />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useCommandHistoryStore } from '@/stores/command-history'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import EmptyState from '@/components/EmptyState.vue'
import CommandHistoryCard from './components/CommandHistoryCard.vue'
import FavoriteCommandCard from './components/FavoriteCommandCard.vue'

const commandStore = useCommandHistoryStore()

// 视图状态
const showFavorites = ref(false)

// 筛选状态
const searchText = ref('')
const selectedServer = ref('')
const selectedCategory = ref('')
const selectedTags = ref<string[]>([])
const showFavoriteOnly = ref(false)

// 监听筛选条件变化
watch(
  [searchText, selectedServer, selectedCategory, selectedTags, showFavoriteOnly],
  () => {
    commandStore.setFilter({
      searchText: searchText.value || undefined,
      serverHost: selectedServer.value || undefined,
      category: selectedCategory.value || undefined,
      tagIds: selectedTags.value.length > 0 ? selectedTags.value : undefined,
      isFavorite: showFavoriteOnly.value || undefined,
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

// 复制命令
function handleCopy(command: string) {
  commandStore.copyCommand(command)
}

// 删除命令
async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这条命令历史吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await commandStore.deleteCommand(id)
  } catch {
    // 取消删除
  }
}

// 切换收藏
function handleToggleFavorite(id: string) {
  commandStore.toggleFavorite(id)
}

// 添加到收藏夹
async function handleAddToFavorites(cmd: any) {
  await commandStore.addToFavorites({
    name: cmd.command.substring(0, 50),
    command: cmd.command,
    description: cmd.description,
    category: cmd.category,
    tags: cmd.tags,
  })
}

// 使用收藏命令
async function handleUseFavorite(id: string) {
  const command = await commandStore.useFavorite(id)
  if (command) {
    await navigator.clipboard.writeText(command)
  }
}

// 删除收藏
async function handleDeleteFavorite(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除这个收藏命令吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    commandStore.favorites = commandStore.favorites.filter((f) => f.id !== id)
    await commandStore.saveIndex()
  } catch {
    // 取消删除
  }
}

// 清空历史
async function handleClearHistory() {
  try {
    await ElMessageBox.confirm('确定要清空所有命令历史吗？此操作不可恢复！', '清空确认', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger',
    })
    await commandStore.clearHistory()
  } catch {
    // 取消清空
  }
}

// 初始化
onMounted(() => {
  commandStore.initialize()
})
</script>

<style scoped>
.command-history-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.command-history-page__content {
  flex: 1;
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  overflow: hidden;
}

/* 侧边栏 */
.command-history-sidebar {
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
.command-history-main {
  flex: 1;
  overflow-y: auto;
}

.command-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  .command-history-page__content {
    flex-direction: column;
  }

  .command-history-sidebar {
    width: 100%;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
