<template>
  <NeonCard
    :hoverable="true"
    class="bookmark-card"
    @click="handleVisit"
  >
    <template #header>
      <div class="bookmark-card__header">
        <!-- 网站图标 -->
        <div class="bookmark-card__icon">
          <img
            v-if="bookmark.icon"
            :src="bookmark.icon"
            :alt="bookmark.title"
            class="bookmark-icon__img"
            @error="handleIconError"
          />
          <i v-else class="i-mdi-bookmark bookmark-icon__fallback" />
        </div>

        <!-- 标题和URL -->
        <div class="bookmark-card__info">
          <h3 class="bookmark-card__title">
            {{ bookmark.title }}
          </h3>
          <a
            :href="bookmark.url"
            class="bookmark-card__url"
            target="_blank"
            @click.stop
          >
            {{ displayUrl }}
          </a>
        </div>

        <!-- 操作按钮 -->
        <div class="bookmark-card__actions">
          <el-tooltip content="置顶" placement="top">
            <el-button
              :type="bookmark.isPinned ? 'primary' : 'default'"
              text
              circle
              @click.stop="$emit('toggle-pin', bookmark.id)"
            >
              <i :class="bookmark.isPinned ? 'i-mdi-pin' : 'i-mdi-pin-outline'" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="收藏" placement="top">
            <el-button
              :type="bookmark.isFavorite ? 'warning' : 'default'"
              text
              circle
              @click.stop="$emit('toggle-favorite', bookmark.id)"
            >
              <i :class="bookmark.isFavorite ? 'i-mdi-star' : 'i-mdi-star-outline'" />
            </el-button>
          </el-tooltip>
          <el-dropdown @command="handleCommand" @click.stop>
            <el-button text circle>
              <i class="i-mdi-dots-vertical" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <i class="i-mdi-pencil" />
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="copy">
                  <i class="i-mdi-content-copy" />
                  复制链接
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <i class="i-mdi-delete" style="color: var(--neon-pink);" />
                  <span style="color: var(--neon-pink);">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <!-- 描述 -->
    <div v-if="bookmark.description" class="bookmark-card__description">
      {{ bookmark.description }}
    </div>

    <!-- 底部信息 -->
    <template #footer>
      <div class="bookmark-card__footer">
        <!-- 分类标签 -->
        <el-tag
          :color="categoryColor"
          size="small"
          effect="plain"
        >
          <i :class="categoryIcon" />
          {{ categoryName }}
        </el-tag>

        <!-- 标签列表 -->
        <div class="bookmark-card__tags">
          <el-tag
            v-for="tag in bookmark.tags"
            :key="tag"
            size="small"
            effect="plain"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- 访问次数和时间 -->
        <div class="bookmark-card__stats">
          <el-tooltip :content="`访问 ${bookmark.visitCount} 次`" placement="top">
            <span class="stat-item">
              <i class="i-mdi-eye" />
              {{ bookmark.visitCount }}
            </span>
          </el-tooltip>
          <el-tooltip :content="formatDate(bookmark.createdAt)" placement="top">
            <span class="stat-item">
              <i class="i-mdi-clock" />
              {{ formatRelativeTime(bookmark.createdAt) }}
            </span>
          </el-tooltip>
        </div>
      </div>
    </template>
  </NeonCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { Bookmark } from '@/stores/bookmarks'
import { useBookmarksStore } from '@/stores/bookmarks'
import NeonCard from '@/components/NeonCard.vue'

interface Props {
  bookmark: Bookmark
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'toggle-pin': [id: string]
  'toggle-favorite': [id: string]
  'edit': [bookmark: Bookmark]
  'delete': [id: string]
  'visit': [id: string]
}>()

const bookmarksStore = useBookmarksStore()

// 显示的 URL（去掉协议）
const displayUrl = computed(() => {
  try {
    const url = new URL(props.bookmark.url)
    return url.hostname + url.pathname
  } catch {
    return props.bookmark.url
  }
})

// 分类信息
const categoryInfo = computed(() => {
  return bookmarksStore.categories.find((c) => c.id === props.bookmark.category)
})

const categoryName = computed(() => categoryInfo.value?.name || '未分类')
const categoryIcon = computed(() => categoryInfo.value?.icon || 'i-mdi-folder')
const categoryColor = computed(() => categoryInfo.value?.color || '#888888')

// 处理图标加载错误
function handleIconError(e: Event) {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

// 访问书签
function handleVisit() {
  emit('visit', props.bookmark.id)
}

// 处理下拉菜单命令
function handleCommand(command: string) {
  switch (command) {
    case 'edit':
      emit('edit', props.bookmark)
      break
    case 'copy':
      navigator.clipboard.writeText(props.bookmark.url)
      ElMessage.success('链接已复制到剪贴板')
      break
    case 'delete':
      emit('delete', props.bookmark.id)
      break
  }
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 格式化相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years}年前`
  if (months > 0) return `${months}月前`
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
</script>

<style scoped>
.bookmark-card {
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.bookmark-card:hover {
  transform: translateY(-4px);
}

.bookmark-card__header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  width: 100%;
}

.bookmark-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid var(--neon-cyan-lighter);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.bookmark-icon__img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.bookmark-icon__fallback {
  font-size: 24px;
  color: var(--neon-cyan);
}

.bookmark-card__info {
  flex: 1;
  min-width: 0;
}

.bookmark-card__title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-card__url {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color var(--transition-base);
}

.bookmark-card__url:hover {
  color: var(--neon-cyan);
  text-decoration: underline;
}

.bookmark-card__actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.bookmark-card__description {
  margin-top: var(--spacing-md);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.bookmark-card__footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.bookmark-card__tags {
  display: flex;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
  flex: 1;
}

.bookmark-card__stats {
  display: flex;
  gap: var(--spacing-md);
  margin-left: auto;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.stat-item i {
  font-size: 1.2em;
}

/* Element Plus 按钮样式调整 */
:deep(.el-button.is-text) {
  padding: 8px;
}

:deep(.el-button.is-text i) {
  font-size: 18px;
}
</style>

