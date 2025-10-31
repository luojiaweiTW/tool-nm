<template>
  <NeonCard class="knowledge-card" :class="`type-${item.type}`">
    <!-- 顶部标记 -->
    <div class="card-header">
      <div class="badges">
        <el-icon
          v-if="item.isPinned"
          class="badge-icon pinned"
          title="已钉选"
        >
          <Location />
        </el-icon>
        <el-icon
          v-if="item.isFavorite"
          class="badge-icon favorite"
          title="已收藏"
        >
          <StarFilled />
        </el-icon>
      </div>
      <div class="actions">
        <el-icon
          class="action-icon"
          title="钉选"
          @click.stop="$emit('toggle-pin', item.id)"
        >
          <Location />
        </el-icon>
        <el-icon
          class="action-icon"
          title="收藏"
          @click.stop="$emit('toggle-favorite', item.id)"
        >
          <Star />
        </el-icon>
        <el-icon
          class="action-icon"
          title="编辑"
          @click.stop="$emit('edit', item)"
        >
          <Edit />
        </el-icon>
        <el-icon
          class="action-icon danger"
          title="删除"
          @click.stop="$emit('delete', item.id)"
        >
          <Delete />
        </el-icon>
      </div>
    </div>

    <!-- 分类标识 -->
    <div v-if="category" class="category-badge">
      <el-icon :style="{ color: category.color }">
        <component :is="category.icon" />
      </el-icon>
      <span>{{ category.name }}</span>
    </div>

    <!-- 内容 -->
    <div class="card-body" @click="$emit('edit', item)">
      <!-- 图片类型 -->
      <div v-if="item.type === 'image'" class="image-content">
        <img :src="imagePath" :alt="item.title" />
      </div>

      <!-- URL类型 -->
      <div v-if="item.type === 'url'" class="url-preview">
        <el-icon class="url-icon"><Link /></el-icon>
        <div class="url-text">{{ item.url || item.content }}</div>
      </div>

      <!-- 标题 -->
      <h3 class="card-title">{{ item.title }}</h3>

      <!-- 描述/内容预览 -->
      <p v-if="item.description" class="card-description">
        {{ item.description }}
      </p>
      <p v-else-if="item.type === 'text'" class="card-content">
        {{ truncateText(item.content, 120) }}
      </p>
    </div>

    <!-- 标签 -->
    <div v-if="itemTags.length > 0" class="card-tags">
      <el-tag
        v-for="tag in itemTags"
        :key="tag.id"
        :color="tag.color"
        size="small"
        effect="plain"
      >
        {{ tag.name }}
      </el-tag>
    </div>

    <!-- 底部信息 -->
    <div class="card-footer">
      <div class="type-badge">
        <el-icon>
          <Document v-if="item.type === 'text'" />
          <Picture v-else-if="item.type === 'image'" />
          <Link v-else-if="item.type === 'url'" />
        </el-icon>
        <span>{{ item.type === 'text' ? '文本' : item.type === 'image' ? '图片' : '网址' }}</span>
      </div>
      <div class="timestamp">
        {{ formatDate(item.updatedAt) }}
      </div>
    </div>
  </NeonCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge'
import type { KnowledgeItem } from '@/types/knowledge'
import NeonCard from '@/components/NeonCard.vue'
import {
  Location,
  Star,
  StarFilled,
  Edit,
  Delete,
  Document,
  Picture,
  Link,
} from '@element-plus/icons-vue'

interface Props {
  item: KnowledgeItem
}

const props = defineProps<Props>()

defineEmits<{
  edit: [item: KnowledgeItem]
  delete: [id: string]
  'toggle-pin': [id: string]
  'toggle-favorite': [id: string]
}>()

const knowledgeStore = useKnowledgeStore()

// 分类
const category = computed(() => 
  knowledgeStore.getCategoryById(props.item.categoryId)
)

// 标签
const itemTags = computed(() =>
  props.item.tags
    .map(tagId => knowledgeStore.getTagById(tagId))
    .filter(Boolean)
)

// 图片路径
const imagePath = computed(() => {
  if (props.item.type !== 'image') return ''
  
  // 在 Electron 环境中使用本地文件路径
  if (window.electronAPI) {
    return knowledgeStore.getImagePath(props.item.content)
  }
  
  return props.item.content
})

// 截断文本
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 格式化日期
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
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}
</script>

<style scoped>
.knowledge-card {
  position: relative;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  overflow: hidden;
}

.knowledge-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--glow-cyan), var(--shadow-strong);
}

.knowledge-card.type-image:hover {
  box-shadow: var(--glow-pink), var(--shadow-strong);
}

/* 卡片頭部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge-icon {
  font-size: 18px;
  color: var(--color-muted);
}

.badge-icon.pinned {
  color: var(--neon-yellow);
}

.badge-icon.favorite {
  color: var(--neon-pink);
}

.actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.knowledge-card:hover .actions {
  opacity: 1;
}

.action-icon {
  font-size: 16px;
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.action-icon:hover {
  color: var(--neon-cyan);
  transform: scale(1.1);
}

.action-icon.danger:hover {
  color: var(--neon-pink);
}

/* 分類標識 */
.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text);
  margin-bottom: 12px;
}

/* 卡片主體 */
.card-body {
  margin-bottom: 14px;
}

.image-content {
  width: 100%;
  height: 180px;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.image-content img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* URL 预览 */
.url-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: rgba(33, 230, 255, 0.08);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
}

.url-icon {
  font-size: 20px;
  color: var(--neon-cyan);
  flex-shrink: 0;
}

.url-text {
  flex: 1;
  font-size: 12px;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-family-mono);
}

.knowledge-card.type-url:hover {
  box-shadow: var(--glow-purple), var(--shadow-strong);
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-description,
.card-content {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 標籤 */
.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.type-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-muted);
}

.timestamp {
  font-size: 11px;
  color: var(--color-muted);
  opacity: 0.7;
}
</style>

