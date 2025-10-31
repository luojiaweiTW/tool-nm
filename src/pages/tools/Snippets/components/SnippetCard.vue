<template>
  <NeonCard class="snippet-card" compact>
    <!-- 头部 -->
    <div class="snippet-card__header">
      <div class="snippet-card__title-row">
        <i :class="languageIcon" :style="{ color: languageColor }" />
        <h3 class="snippet-card__title">{{ snippet.title }}</h3>
        <div class="snippet-card__badges">
          <el-icon v-if="snippet.isPinned" class="badge-icon" title="已置顶">
            <i class="i-mdi-pin" />
          </el-icon>
          <el-icon v-if="snippet.isFavorite" class="badge-icon" style="color: var(--neon-pink);" title="已收藏">
            <i class="i-mdi-heart" />
          </el-icon>
        </div>
      </div>
      <p v-if="snippet.description" class="snippet-card__description">
        {{ snippet.description }}
      </p>
    </div>

    <!-- 代码预览 -->
    <div class="snippet-card__code">
      <pre class="mono"><code>{{ previewCode }}</code></pre>
    </div>

    <!-- 标签 -->
    <div v-if="snippet.tags.length > 0" class="snippet-card__tags">
      <el-tag
        v-for="tagId in snippet.tags"
        :key="tagId"
        size="small"
        :color="getTagColor(tagId)"
        effect="dark"
      >
        {{ getTagName(tagId) }}
      </el-tag>
    </div>

    <!-- 底部操作栏 -->
    <div class="snippet-card__footer">
      <div class="snippet-card__meta">
        <span class="meta-item">
          <i class="i-mdi-eye" />
          {{ snippet.usageCount }}
        </span>
        <span class="meta-item">
          <i class="i-mdi-clock-outline" />
          {{ formatDate(snippet.updatedAt) }}
        </span>
      </div>
      <div class="snippet-card__actions">
        <el-tooltip effect="dark">
          <template #content>
            <span style="font-size: 13px; font-weight: bold; color: #bef264;">📋 复制代码</span>
          </template>
          <el-button
            size="small"
            type="primary"
            plain
            circle
            @click="$emit('use', snippet)"
          >
            <el-icon><i class="i-mdi-content-copy" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark">
          <template #content>
            <span style="font-size: 13px; font-weight: bold; color: #fcd34d;">{{ snippet.isPinned ? '📌 取消置顶' : '📌 置顶' }}</span>
          </template>
          <el-button
            size="small"
            :type="snippet.isPinned ? 'warning' : 'default'"
            plain
            circle
            @click="$emit('togglePin', snippet)"
          >
            <el-icon><i class="i-mdi-pin" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark">
          <template #content>
            <span style="font-size: 13px; font-weight: bold; color: #fb7185;">{{ snippet.isFavorite ? '💔 取消收藏' : '❤️ 收藏' }}</span>
          </template>
          <el-button
            size="small"
            :type="snippet.isFavorite ? 'danger' : 'default'"
            plain
            circle
            @click="$emit('toggleFavorite', snippet)"
          >
            <el-icon><i class="i-mdi-heart" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark">
          <template #content>
            <span style="font-size: 13px; font-weight: bold; color: #60a5fa;">✏️ 编辑</span>
          </template>
          <el-button
            size="small"
            type="primary"
            plain
            circle
            @click="$emit('edit', snippet)"
          >
            <el-icon><i class="i-mdi-pencil" /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark">
          <template #content>
            <span style="font-size: 13px; font-weight: bold; color: #f87171;">🗑️ 删除</span>
          </template>
          <el-button
            size="small"
            type="danger"
            plain
            circle
            @click="handleDelete"
          >
            <el-icon><i class="i-mdi-delete" /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </NeonCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useSnippetStore } from '@/stores/snippet'
import type { Snippet } from '@/types/snippet'
import NeonCard from '@/components/NeonCard.vue'

interface Props {
  snippet: Snippet
}

interface Emits {
  (e: 'edit', snippet: Snippet): void
  (e: 'delete', snippet: Snippet): void
  (e: 'use', snippet: Snippet): void
  (e: 'togglePin', snippet: Snippet): void
  (e: 'toggleFavorite', snippet: Snippet): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const snippetStore = useSnippetStore()

// 语言图标和颜色
const languageIcons: Record<string, string> = {
  javascript: 'i-mdi-language-javascript',
  typescript: 'i-mdi-language-typescript',
  python: 'i-mdi-language-python',
  java: 'i-mdi-language-java',
  go: 'i-mdi-language-go',
  rust: 'i-mdi-language-rust',
  cpp: 'i-mdi-language-cpp',
  csharp: 'i-mdi-language-csharp',
  php: 'i-mdi-language-php',
  ruby: 'i-mdi-language-ruby',
  sql: 'i-mdi-database',
  bash: 'i-mdi-bash',
  html: 'i-mdi-language-html5',
  css: 'i-mdi-language-css3',
  json: 'i-mdi-code-json',
  yaml: 'i-mdi-file-code',
  markdown: 'i-mdi-language-markdown',
}

const languageColors: Record<string, string> = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3776ab',
  java: '#007396',
  go: '#00add8',
  rust: '#dea584',
  cpp: '#00599c',
  csharp: '#239120',
  php: '#777bb4',
  ruby: '#cc342d',
  sql: '#4479a1',
  bash: '#4eaa25',
  html: '#e34f26',
  css: '#1572b6',
}

const languageIcon = computed(() => languageIcons[props.snippet.language] || 'i-mdi-code-braces')
const languageColor = computed(() => languageColors[props.snippet.language] || 'var(--neon-cyan)')

// 代码预览（最多6行）
const previewCode = computed(() => {
  const lines = props.snippet.code.split('\n')
  if (lines.length > 6) {
    return lines.slice(0, 6).join('\n') + '\n...'
  }
  return props.snippet.code
})

// 获取标签名称
function getTagName(tagId: string): string {
  const tag = snippetStore.getTagById(tagId)
  return tag?.name || tagId
}

// 获取标签颜色
function getTagColor(tagId: string): string {
  const tag = snippetStore.getTagById(tagId)
  return tag?.color || '#21e6ff'
}

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  if (days < 30) return `${Math.floor(days / 7)}周前`
  if (days < 365) return `${Math.floor(days / 30)}个月前`
  return `${Math.floor(days / 365)}年前`
}

// 删除确认
async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定要删除这个代码片段吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    emit('delete', props.snippet)
  } catch {
    // 取消删除
  }
}
</script>

<style scoped>
.snippet-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.snippet-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(33, 230, 255, 0.2);
}

.snippet-card__header {
  margin-bottom: var(--spacing-md);
}

.snippet-card__title-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xs);
}

.snippet-card__title-row > i {
  font-size: 20px;
  flex-shrink: 0;
}

.snippet-card__title {
  flex: 1;
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-card__badges {
  display: flex;
  gap: var(--spacing-xs);
}

.badge-icon {
  font-size: 16px;
  color: var(--neon-yellow);
}

.snippet-card__description {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.snippet-card__code {
  flex: 1;
  margin-bottom: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.snippet-card__code pre {
  margin: 0;
  padding: var(--spacing-md);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--color-text);
  overflow: auto;
  max-height: 150px;
}

.snippet-card__code code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}

.snippet-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.snippet-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border);
}

.snippet-card__meta {
  display: flex;
  gap: var(--spacing-md);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.meta-item i {
  font-size: 14px;
}

.snippet-card__actions {
  display: flex;
  gap: var(--spacing-xs);
}
</style>
