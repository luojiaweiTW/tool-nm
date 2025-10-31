<template>
  <NeonCard class="favorite-command-card" compact>
    <div class="favorite-command-card__header">
      <h3 class="favorite-command-card__name">
        <i class="i-mdi-star" />
        {{ favorite.name }}
      </h3>
      <div class="favorite-command-card__meta">
        <span class="meta-item">
          <i class="i-mdi-counter" />
          使用 {{ favorite.usageCount }} 次
        </span>
        <span v-if="favorite.lastUsedAt" class="meta-item">
          <i class="i-mdi-clock-outline" />
          {{ formatTime(favorite.lastUsedAt) }}
        </span>
      </div>
    </div>

    <!-- 描述 -->
    <div v-if="favorite.description" class="favorite-command-card__description">
      {{ favorite.description }}
    </div>

    <!-- 命令内容 -->
    <div class="favorite-command-card__command" @click="handleUse">
      <pre class="mono">{{ favorite.command }}</pre>
      <el-tooltip effect="dark">
        <template #content>
          <div style="font-size: 13px; font-weight: bold; color: #bef264;">
            ▶️ 点击使用（复制到剪贴板）
          </div>
        </template>
        <i class="use-icon i-mdi-play-circle" />
      </el-tooltip>
    </div>

    <!-- 标签 -->
    <div v-if="favorite.tags.length > 0 || favorite.category" class="favorite-command-card__tags">
      <el-tag v-if="favorite.category" size="small" :color="getCategoryColor(favorite.category)">
        <i :class="getCategoryIcon(favorite.category)" />
        {{ getCategoryName(favorite.category) }}
      </el-tag>
      <el-tag
        v-for="tagId in favorite.tags"
        :key="tagId"
        size="small"
        :color="getTagColor(tagId)"
      >
        {{ getTagName(tagId) }}
      </el-tag>
    </div>

    <!-- 操作栏 -->
    <div class="favorite-command-card__actions">
      <el-button size="small" type="primary" @click="handleUse">
        <i class="i-mdi-play" />
        使用
      </el-button>
      <el-button size="small" type="danger" plain @click="$emit('delete', favorite.id)">
        <i class="i-mdi-delete" />
        删除
      </el-button>
    </div>
  </NeonCard>
</template>

<script setup lang="ts">
import { useCommandHistoryStore } from '@/stores/command-history'
import type { FavoriteCommand } from '@/types/command-history'
import NeonCard from '@/components/NeonCard.vue'

interface Props {
  favorite: FavoriteCommand
}

interface Emits {
  (e: 'use', id: string): void
  (e: 'delete', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const commandStore = useCommandHistoryStore()

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 使用命令
function handleUse() {
  emit('use', props.favorite.id)
}

// 获取分类信息
function getCategoryName(id: string): string {
  return commandStore.getCategoryById(id)?.name || id
}

function getCategoryIcon(id: string): string {
  return commandStore.getCategoryById(id)?.icon || 'i-mdi-console'
}

function getCategoryColor(id: string): string {
  return commandStore.getCategoryById(id)?.color || 'var(--neon-cyan)'
}

// 获取标签信息
function getTagName(id: string): string {
  return commandStore.getTagById(id)?.name || id
}

function getTagColor(id: string): string {
  return commandStore.getTagById(id)?.color || '#21e6ff'
}
</script>

<style scoped>
.favorite-command-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.favorite-command-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

.favorite-command-card__header {
  margin-bottom: var(--spacing-md);
}

.favorite-command-card__name {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.favorite-command-card__name i {
  font-size: 18px;
  color: var(--neon-yellow);
}

.favorite-command-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.meta-item i {
  font-size: 14px;
}

.favorite-command-card__description {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(208, 255, 0, 0.05);
  border-left: 2px solid var(--neon-yellow);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.favorite-command-card__command {
  position: relative;
  flex: 1;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: 2px solid var(--neon-yellow);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.favorite-command-card__command:hover {
  background-color: rgba(208, 255, 0, 0.05);
  box-shadow: 0 0 20px rgba(208, 255, 0, 0.2);
}

.favorite-command-card__command:hover .use-icon {
  opacity: 1;
}

.favorite-command-card__command pre {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--neon-lime);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow: auto;
}

.use-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 24px;
  color: var(--neon-yellow);
  opacity: 0;
  transition: opacity 0.2s;
}

.favorite-command-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.favorite-command-card__actions {
  display: flex;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border);
}
</style>
