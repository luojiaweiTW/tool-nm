<template>
  <NeonCard class="command-history-card" compact>
    <div class="command-history-card__header">
      <div class="command-history-card__meta">
        <span v-if="command.serverHost" class="meta-item server">
          <i class="i-mdi-server" />
          {{ command.serverName || command.serverHost }}
        </span>
        <span class="meta-item time">
          <i class="i-mdi-clock-outline" />
          {{ formatTime(command.executedAt) }}
        </span>
        <span v-if="command.duration" class="meta-item duration">
          <i class="i-mdi-timer-outline" />
          {{ formatDuration(command.duration) }}
        </span>
        <span v-if="command.exitCode !== undefined" class="meta-item exit-code" :class="{ success: command.exitCode === 0, error: command.exitCode !== 0 }">
          <i :class="command.exitCode === 0 ? 'i-mdi-check-circle' : 'i-mdi-alert-circle'" />
          {{ command.exitCode === 0 ? '成功' : `退出码 ${command.exitCode}` }}
        </span>
      </div>
      <el-icon v-if="command.isFavorite" class="favorite-icon" title="已收藏">
        <i class="i-mdi-star" />
      </el-icon>
    </div>

    <!-- 命令内容 -->
    <div class="command-history-card__command" @click="handleCopy">
      <pre class="mono">{{ command.command }}</pre>
      <el-tooltip effect="dark">
        <template #content>
          <div style="font-size: 13px; font-weight: bold; color: #bef264;">
            📋 点击复制到剪贴板
          </div>
        </template>
        <i class="copy-icon i-mdi-content-copy" />
      </el-tooltip>
    </div>

    <!-- 描述 -->
    <div v-if="command.description" class="command-history-card__description">
      {{ command.description }}
    </div>

    <!-- 工作目录 -->
    <div v-if="command.workingDirectory" class="command-history-card__directory">
      <i class="i-mdi-folder-outline" />
      {{ command.workingDirectory }}
    </div>

    <!-- 标签 -->
    <div v-if="command.tags.length > 0 || command.category" class="command-history-card__tags">
      <el-tag v-if="command.category" size="small" :color="getCategoryColor(command.category)">
        <i :class="getCategoryIcon(command.category)" />
        {{ getCategoryName(command.category) }}
      </el-tag>
      <el-tag
        v-for="tagId in command.tags"
        :key="tagId"
        size="small"
        :color="getTagColor(tagId)"
      >
        {{ getTagName(tagId) }}
      </el-tag>
    </div>

    <!-- 操作栏 -->
    <div class="command-history-card__actions">
      <el-button size="small" type="primary" plain @click="handleCopy">
        <i class="i-mdi-content-copy" />
        复制
      </el-button>
      <el-button
        size="small"
        :type="command.isFavorite ? 'warning' : 'default'"
        plain
        @click="$emit('toggleFavorite', command.id)"
      >
        <i :class="command.isFavorite ? 'i-mdi-star' : 'i-mdi-star-outline'" />
        {{ command.isFavorite ? '取消收藏' : '收藏' }}
      </el-button>
      <el-button
        v-if="!command.isFavorite"
        size="small"
        type="success"
        plain
        @click="$emit('addToFavorites', command)"
      >
        <i class="i-mdi-bookmark-plus-outline" />
        添加到收藏夹
      </el-button>
      <el-button size="small" type="danger" plain @click="$emit('delete', command.id)">
        <i class="i-mdi-delete" />
        删除
      </el-button>
    </div>
  </NeonCard>
</template>

<script setup lang="ts">
import { useCommandHistoryStore } from '@/stores/command-history'
import type { CommandHistory } from '@/types/command-history'
import NeonCard from '@/components/NeonCard.vue'

interface Props {
  command: CommandHistory
}

interface Emits {
  (e: 'copy', command: string): void
  (e: 'delete', id: string): void
  (e: 'toggleFavorite', id: string): void
  (e: 'addToFavorites', command: CommandHistory): void
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

// 格式化时长
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// 复制命令
function handleCopy() {
  emit('copy', props.command.command)
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
.command-history-card {
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.command-history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 230, 255, 0.2);
}

.command-history-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-sm);
}

.command-history-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  flex: 1;
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

.meta-item.server {
  color: var(--neon-cyan);
  font-weight: var(--font-weight-medium);
}

.meta-item.exit-code.success {
  color: var(--neon-lime);
}

.meta-item.exit-code.error {
  color: var(--neon-pink);
}

.favorite-icon {
  font-size: 18px;
  color: var(--neon-yellow);
}

.command-history-card__command {
  position: relative;
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.command-history-card__command:hover {
  border-color: var(--neon-cyan);
}

.command-history-card__command:hover .copy-icon {
  opacity: 1;
}

.command-history-card__command pre {
  margin: 0;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--neon-lime);
  white-space: pre-wrap;
  word-break: break-all;
}

.copy-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 16px;
  color: var(--color-text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
}

.command-history-card__description {
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(33, 230, 255, 0.05);
  border-left: 2px solid var(--neon-cyan);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.command-history-card__directory {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-family: var(--font-family-mono);
}

.command-history-card__directory i {
  font-size: 14px;
}

.command-history-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.command-history-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border);
}
</style>
