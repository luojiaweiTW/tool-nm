<template>
  <div class="tool-diff">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">文本对比</h1>
        <p class="tool-header__description">对比两段文本的差异，高亮显示增删改</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="swapTexts" type="outline">
          <i class="i-mdi-swap-horizontal mr-2" />
          交换
        </NeonButton>
        <NeonButton @click="handleExample" type="primary">
          <i class="i-mdi-lightbulb-outline mr-2" />
          示例
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <!-- 输入区域 -->
      <div class="input-area">
        <NeonCard title="📝 原文本">
          <template #extra>
            <span class="char-count">{{ leftText.length }} 字符 / {{ leftText.split('\n').length }} 行</span>
          </template>
          <NeonTextarea
            v-model="leftText"
            placeholder="请输入原文本..."
            :rows="15"
            @input="handleCompare"
          />
        </NeonCard>

        <NeonCard title="📝 新文本">
          <template #extra>
            <span class="char-count">{{ rightText.length }} 字符 / {{ rightText.split('\n').length }} 行</span>
          </template>
          <NeonTextarea
            v-model="rightText"
            placeholder="请输入新文本..."
            :rows="15"
            @input="handleCompare"
          />
        </NeonCard>
      </div>

      <!-- 对比结果 -->
      <NeonCard v-if="diffResult.length > 0" title="🔍 差异对比">
        <template #extra>
          <div class="diff-stats">
            <span class="stat-item added">+{{ stats.added }}</span>
            <span class="stat-item removed">-{{ stats.removed }}</span>
            <span class="stat-item unchanged">={{ stats.unchanged }}</span>
          </div>
        </template>
        <div class="diff-display">
          <div class="diff-line" v-for="(line, index) in diffResult" :key="index" :class="`diff-${line.type}`">
            <span class="line-number">{{ line.lineNumber }}</span>
            <span class="line-prefix">{{ line.prefix }}</span>
            <span class="line-content">{{ line.content }}</span>
          </div>
        </div>
      </NeonCard>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <i class="i-mdi-file-compare empty-state__icon" />
        <p class="empty-state__text">请输入两段文本进行对比</p>
        <p class="empty-state__hint">支持文本、代码、配置文件等任意内容的对比</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { diffLines, Change } from 'diff'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber: string
  prefix: string
}

const leftText = ref('')
const rightText = ref('')
const diffResult = ref<DiffLine[]>([])

// 统计信息
const stats = computed(() => {
  const added = diffResult.value.filter(l => l.type === 'added').length
  const removed = diffResult.value.filter(l => l.type === 'removed').length
  const unchanged = diffResult.value.filter(l => l.type === 'unchanged').length
  return { added, removed, unchanged }
})

// 示例文本
const exampleLeft = `function getUserInfo(userId) {
  const user = database.findUser(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}`

const exampleRight = `async function getUserInfo(userId) {
  const user = await database.findUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}`

// 加载示例
function handleExample() {
  leftText.value = exampleLeft
  rightText.value = exampleRight
  handleCompare()
  ElMessage.info('已加载示例文本')
}

// 对比文本
function handleCompare() {
  if (!leftText.value && !rightText.value) {
    diffResult.value = []
    return
  }

  const changes: Change[] = diffLines(leftText.value, rightText.value)
  const result: DiffLine[] = []
  let leftLineNum = 1
  let rightLineNum = 1

  changes.forEach(change => {
    const lines = change.value.split('\n').filter(line => line !== '')
    
    if (change.added) {
      lines.forEach(line => {
        result.push({
          type: 'added',
          content: line,
          lineNumber: rightLineNum.toString(),
          prefix: '+'
        })
        rightLineNum++
      })
    } else if (change.removed) {
      lines.forEach(line => {
        result.push({
          type: 'removed',
          content: line,
          lineNumber: leftLineNum.toString(),
          prefix: '-'
        })
        leftLineNum++
      })
    } else {
      lines.forEach(line => {
        result.push({
          type: 'unchanged',
          content: line,
          lineNumber: `${leftLineNum}`,
          prefix: ' '
        })
        leftLineNum++
        rightLineNum++
      })
    }
  })

  diffResult.value = result
}

// 交换文本
function swapTexts() {
  const temp = leftText.value
  leftText.value = rightText.value
  rightText.value = temp
  handleCompare()
  ElMessage.success('已交换文本')
}

// 清空
function clearAll() {
  leftText.value = ''
  rightText.value = ''
  diffResult.value = []
}
</script>

<style scoped>
.tool-diff {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border: 2px solid var(--neon-pink);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(255, 42, 161, 0.4);
}

.tool-header__info {
  flex: 1;
}

.tool-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-display);
}

.tool-header__description {
  font-size: var(--font-size-base);
  color: var(--color-muted);
}

.tool-header__actions {
  display: flex;
  gap: var(--spacing-md);
}

.tool-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.input-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.diff-stats {
  display: flex;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.stat-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.stat-item.added {
  background: rgba(48, 255, 147, 0.1);
  color: #30ff93;
}

.stat-item.removed {
  background: rgba(255, 42, 161, 0.1);
  color: var(--neon-pink);
}

.stat-item.unchanged {
  background: rgba(138, 164, 199, 0.1);
  color: var(--color-muted);
}

.diff-display {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.diff-line {
  display: flex;
  padding: 2px var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.diff-line:hover {
  background: rgba(255, 255, 255, 0.02);
}

.diff-added {
  background: rgba(48, 255, 147, 0.1);
}

.diff-removed {
  background: rgba(255, 42, 161, 0.1);
}

.line-number {
  display: inline-block;
  width: 50px;
  text-align: right;
  color: var(--color-muted);
  user-select: none;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.line-prefix {
  display: inline-block;
  width: 20px;
  font-weight: var(--font-weight-bold);
  user-select: none;
  flex-shrink: 0;
}

.diff-added .line-prefix {
  color: #30ff93;
}

.diff-removed .line-prefix {
  color: var(--neon-pink);
}

.diff-unchanged .line-prefix {
  color: var(--color-muted);
}

.line-content {
  flex: 1;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--color-text);
}

.diff-added .line-content {
  color: #30ff93;
}

.diff-removed .line-content {
  color: var(--neon-pink);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
}

.empty-state__icon {
  font-size: 4em;
  color: var(--neon-pink);
  opacity: 0.3;
  margin-bottom: var(--spacing-lg);
}

.empty-state__text {
  font-size: var(--font-size-lg);
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
}

.mr-2 {
  margin-right: 8px;
}
</style>

