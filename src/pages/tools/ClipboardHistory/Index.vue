<template>
  <div class="tool-page">
    <Header
      title="剪贴板历史"
      description="自动记录复制的文本内容，方便查看和管理"
      icon="i-mdi-clipboard-text-clock"
    >
      <template #actions>
        <el-switch
          v-model="isMonitoring"
          active-text="监听中"
          inactive-text="已暂停"
          inline-prompt
          size="large"
          @change="handleToggleMonitoring"
        />
        <NeonButton variant="outline" size="small" @click="handleClearAll">
          <i class="i-mdi-delete-sweep" />
          清空历史
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="clipboard-history">
        <!-- 统计信息 -->
        <NeonCard title="统计信息" icon="i-mdi-chart-box" compact>
          <div class="stats-grid">
            <div class="stat-item">
              <i class="i-mdi-clipboard-text stat-icon" />
              <div class="stat-info">
                <div class="stat-value">{{ clipboardList.length }}</div>
                <div class="stat-label">历史记录</div>
              </div>
            </div>
            <div class="stat-item">
              <i class="i-mdi-clock-outline stat-icon" />
              <div class="stat-info">
                <div class="stat-value">{{ todayCount }}</div>
                <div class="stat-label">今日记录</div>
              </div>
            </div>
            <div class="stat-item">
              <i class="i-mdi-file-document stat-icon" />
              <div class="stat-info">
                <div class="stat-value">{{ totalCharacters }}</div>
                <div class="stat-label">总字符数</div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 搜索和筛选 -->
        <NeonCard title="搜索筛选" icon="i-mdi-filter" compact>
          <div class="filter-controls">
            <NeonInput
              v-model="searchKeyword"
              placeholder="搜索剪贴板内容..."
              clearable
              style="flex: 1;"
            >
              <template #prefix>
                <i class="i-mdi-magnify" />
              </template>
            </NeonInput>
            <el-select v-model="sortOrder" placeholder="排序" style="width: 150px;">
              <el-option label="最新优先" value="newest" />
              <el-option label="最旧优先" value="oldest" />
              <el-option label="最长优先" value="longest" />
            </el-select>
          </div>
        </NeonCard>

        <!-- 剪贴板列表 -->
        <NeonCard title="历史记录" compact>
          <template #extra>
            <span class="result-count">
              共 <strong>{{ filteredList.length }}</strong> 条记录
            </span>
          </template>

          <div v-if="filteredList.length === 0" class="empty-result">
            <i class="i-mdi-clipboard-text-clock empty-result-icon" />
            <p v-if="!isMonitoring">剪贴板监听已暂停</p>
            <p v-else-if="searchKeyword">未找到匹配的记录</p>
            <p v-else>暂无剪贴板历史记录</p>
            <p class="hint">复制任意文本后会自动记录</p>
          </div>
          <div v-else class="clipboard-list-grid">
            <div
              v-for="(item, index) in paginatedList"
              :key="item.id"
              class="clipboard-item-compact"
            >
              <div class="item-header">
                <span class="item-index">#{{ index + 1 }}</span>
                <div class="item-actions">
                  <button class="action-btn-sm" @click.stop="copyToClipboard(item.content)" title="复制">
                    📋
                  </button>
                  <button class="action-btn-sm delete" @click.stop="deleteItem(item.id)" title="删除">
                    🗑️
                  </button>
                </div>
              </div>
              <div class="item-content" @click="showFullContent(item)">
                <pre class="content-text-compact">{{ truncateText(item.content, 80) }}</pre>
              </div>
              <div class="item-footer">
                <span class="item-time-sm">{{ formatTime(item.timestamp) }}</span>
                <span class="item-chars">{{ item.content.length }}字符</span>
              </div>
            </div>
            <!-- 📌 加载更多按钮 -->
            <div v-if="hasMore" class="load-more-container">
              <NeonButton variant="outline" @click="loadMore" style="width: 100%;">
                加载更多 (剩余 {{ filteredList.length - paginatedList.length }} 条)
              </NeonButton>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>

    <!-- 完整内容对话框 -->
    <el-dialog
      v-model="showDialog"
      title="完整内容"
      width="70%"
      :close-on-click-modal="true"
    >
      <div class="dialog-content">
        <div class="dialog-header">
          <span class="dialog-time">{{ selectedItem ? formatTime(selectedItem.timestamp) : '' }}</span>
          <NeonButton size="small" @click="copyToClipboard(selectedItem?.content || '')">
            <i class="i-mdi-content-copy" />
            复制
          </NeonButton>
        </div>
        <pre class="full-content">{{ selectedItem?.content || '' }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'

interface ClipboardItem {
  id: string
  content: string
  timestamp: number
}

const clipboardList = ref<ClipboardItem[]>([])
const isMonitoring = ref(true)
const searchKeyword = ref('')
const sortOrder = ref<'newest' | 'oldest' | 'longest'>('newest')
const showDialog = ref(false)
const selectedItem = ref<ClipboardItem | null>(null)
// 📌 分页加载
const pageSize = ref(20)
const currentPage = ref(1)

// 今日记录数
const todayCount = computed(() => {
  const today = new Date().setHours(0, 0, 0, 0)
  return clipboardList.value.filter(item => item.timestamp >= today).length
})

// 总字符数
const totalCharacters = computed(() => {
  return clipboardList.value.reduce((sum, item) => sum + item.content.length, 0)
})

// 过滤和排序列表
const filteredList = computed(() => {
  let list = [...clipboardList.value]

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => item.content.toLowerCase().includes(keyword))
  }

  // 排序
  if (sortOrder.value === 'newest') {
    list.sort((a, b) => b.timestamp - a.timestamp)
  } else if (sortOrder.value === 'oldest') {
    list.sort((a, b) => a.timestamp - b.timestamp)
  } else if (sortOrder.value === 'longest') {
    list.sort((a, b) => b.content.length - a.content.length)
  }

  return list
})

// 📌 分页显示的列表
const paginatedList = computed(() => {
  return filteredList.value.slice(0, currentPage.value * pageSize.value)
})

// 📌 是否还有更多数据
const hasMore = computed(() => {
  return paginatedList.value.length < filteredList.value.length
})

// 📌 加载更多
const loadMore = () => {
  if (hasMore.value) {
    currentPage.value++
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000 && date.getDate() === now.getDate()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } else if (diff < 172800000) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } else {
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
}

// 截断文本
const truncateText = (text: string, maxLength: number = 200): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 显示完整内容
const showFullContent = (item: ClipboardItem) => {
  selectedItem.value = item
  showDialog.value = true
}

// 复制到剪贴板
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 删除单条记录
const deleteItem = (id: string) => {
  clipboardList.value = clipboardList.value.filter(item => item.id !== id)
  saveToLocalStorage()
  ElMessage.success('已删除')
}

// 清空所有记录
const handleClearAll = () => {
  ElMessageBox.confirm('确定要清空所有剪贴板历史吗？', '确认清空', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    clipboardList.value = []
    saveToLocalStorage()
    ElMessage.success('已清空所有记录')
  }).catch(() => {
    // 用户取消
  })
}

// 切换监听状态
const handleToggleMonitoring = (value: boolean) => {
  if (window.electron) {
    window.electron.send('clipboard-monitoring', value)
  }
  ElMessage.success(value ? '已开启剪贴板监听' : '已暂停剪贴板监听')
  saveMonitoringState()
}

// 添加剪贴板记录
const addClipboardItem = (content: string) => {
  if (!content || !content.trim()) return
  
  // 检查是否与最近一条重复
  if (clipboardList.value.length > 0 && clipboardList.value[0].content === content) {
    return
  }

  const item: ClipboardItem = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    content: content.trim(),
    timestamp: Date.now()
  }

  clipboardList.value.unshift(item)
  
  // 限制最多保存 500 条
  if (clipboardList.value.length > 500) {
    clipboardList.value = clipboardList.value.slice(0, 500)
  }

  saveToLocalStorage()
}

// 保存到文件
const saveToFile = async () => {
  if (!window.electronAPI) {
    // 降级到 localStorage（浏览器环境）
    try {
      localStorage.setItem('clipboard-history', JSON.stringify(clipboardList.value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
    return
  }

  try {
    const data = {
      history: clipboardList.value,
      monitoring: isMonitoring.value
    }
    await window.electronAPI.writeFile('clipboard-history.json', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to save clipboard history:', error)
  }
}

// 保存到本地存储（兼容旧方法名）
const saveToLocalStorage = saveToFile

// 保存监听状态
const saveMonitoringState = saveToFile

// 从文件加载
const loadFromFile = async () => {
  if (!window.electronAPI) {
    // 降级到 localStorage（浏览器环境）
    try {
      const saved = localStorage.getItem('clipboard-history')
      if (saved) {
        clipboardList.value = JSON.parse(saved)
      }

      const monitoringState = localStorage.getItem('clipboard-monitoring')
      if (monitoringState !== null) {
        isMonitoring.value = JSON.parse(monitoringState)
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
    }
    return
  }

  try {
    const exists = await window.electronAPI.fileExists('clipboard-history.json')
    if (exists) {
      const result = await window.electronAPI.readFile('clipboard-history.json')
      if (result.success && result.data) {
        const data = JSON.parse(result.data)
        clipboardList.value = data.history || []
        isMonitoring.value = data.monitoring !== undefined ? data.monitoring : true
        console.log('✅ Loaded clipboard history from file:', clipboardList.value.length, 'items')
      }
    } else {
      console.log('📝 No clipboard history file found, starting fresh')
    }
  } catch (error) {
    console.error('Failed to load clipboard history:', error)
  }
}

// 从本地存储加载（兼容旧方法名）
const loadFromLocalStorage = loadFromFile

// 监听来自 Electron 的剪贴板更新
const handleClipboardChange = (content: string) => {
  if (isMonitoring.value) {
    addClipboardItem(content)
  }
}

onMounted(() => {
  loadFromLocalStorage()
  
  if (window.electron) {
    window.electron.on('clipboard-change', handleClipboardChange)
    window.electron.send('clipboard-monitoring', isMonitoring.value)
  }
})

onUnmounted(() => {
  if (window.electron) {
    window.electron.removeListener('clipboard-change', handleClipboardChange)
  }
})
</script>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tool-page__content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-xl);
}

.clipboard-history {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: rgba(33, 230, 255, 0.05);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-md);
}

.stat-icon {
  font-size: 2.5em;
  color: var(--neon-cyan);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-value {
  font-size: 1.8em;
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  font-family: var(--font-family-mono);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

/* 筛选控制 */
.filter-controls {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.result-count {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.result-count strong {
  color: var(--neon-cyan);
  font-size: var(--font-size-base);
}

/* 空状态 */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) * 2;
  text-align: center;
  color: var(--color-muted);
}

.empty-result-icon {
  font-size: 4em;
  color: var(--neon-cyan);
  opacity: 0.6;
}

.empty-result .hint {
  font-size: var(--font-size-sm);
  opacity: 0.7;
}

/* 剪贴板列表 */
.clipboard-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 70vh;
  overflow-y: auto;
}

.clipboard-item {
  padding: var(--spacing-lg);
  background: rgba(10, 14, 39, 0.4);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.clipboard-item:hover {
  border-color: var(--neon-cyan-lighter);
  box-shadow: var(--glow-cyan);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.item-index {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid var(--neon-cyan);
  border-radius: 50%;
}

.item-time {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.item-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-sm);
  color: var(--neon-cyan);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(33, 230, 255, 0.2);
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3);
}

.action-btn.delete {
  border-color: var(--neon-pink);
  color: var(--neon-pink);
  background: rgba(255, 42, 161, 0.1);
}

.action-btn.delete:hover {
  background: rgba(255, 42, 161, 0.2);
  box-shadow: 0 0 10px rgba(255, 42, 161, 0.3);
}

.item-content {
  margin-bottom: var(--spacing-md);
}

.content-text {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.2);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 150px;
  overflow-y: auto;
}

.content-more {
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.content-more:hover {
  color: var(--neon-cyan-lighter);
}

.item-footer {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.item-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 对话框 */
.dialog-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.dialog-time {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.full-content {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.3);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 60vh;
  overflow-y: auto;
}

/* 📌 紧凑网格布局 */
.clipboard-list-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.clipboard-item-compact {
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-height: 120px;
}

.clipboard-item-compact:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  transform: translateY(-2px);
}

.clipboard-item-compact .item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--color-border);
}

.clipboard-item-compact .item-index {
  font-size: var(--font-size-xs);
  color: var(--neon-cyan);
  font-weight: bold;
}

.clipboard-item-compact .item-actions {
  display: flex;
  gap: 4px;
}

.action-btn-sm {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(33, 230, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn-sm:hover {
  background: rgba(33, 230, 255, 0.3);
  transform: scale(1.1);
}

.action-btn-sm.delete:hover {
  background: rgba(255, 42, 161, 0.3);
}

.content-text-compact {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
  flex: 1;
}

.clipboard-item-compact .item-footer {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--color-muted);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--color-border);
}

.item-time-sm {
  opacity: 0.7;
}

.item-chars {
  color: var(--neon-cyan);
  opacity: 0.7;
}

.load-more-container {
  grid-column: 1 / -1;
  padding: var(--spacing-md) 0;
}

/* 响应式 */
@media (max-width: 1400px) {
  .clipboard-list-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1000px) {
  .clipboard-list-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .clipboard-list-grid {
    grid-template-columns: 1fr;
  }
}
</style>
