<template>
  <div class="tool-log-analyzer">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">日志片段分析</h1>
        <p class="tool-header__description">日志分级高亮、异常定位、堆栈折叠、时间线视图</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="loadExample" type="outline">
          <i class="i-mdi-lightbulb-outline mr-2" />
          示例
        </NeonButton>
        <NeonButton @click="handleParse" type="primary" :disabled="!logInput">
          <i class="i-mdi-magnify-scan mr-2" />
          分析日志
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <div class="tool-layout">
        <!-- 左侧：配置面板 -->
        <div class="tool-panel">
          <NeonCard title="⚙️ 分析选项">
            <!-- 业务包名 -->
            <div class="form-group">
              <label class="form-label">业务包名（高亮显示）</label>
              <NeonInput
                v-model="businessPackage"
                placeholder="例如：com.example"
              />
              <div class="form-hint">只高亮显示匹配的业务代码行</div>
            </div>

            <!-- 级别过滤 -->
            <div class="form-group">
              <label class="form-label">日志级别过滤</label>
              <el-select v-model="filterLevel" size="large" style="width: 100%">
                <el-option label="全部" value="ALL" />
                <el-option label="TRACE" value="TRACE" />
                <el-option label="DEBUG" value="DEBUG" />
                <el-option label="INFO" value="INFO" />
                <el-option label="WARN" value="WARN" />
                <el-option label="ERROR" value="ERROR" />
                <el-option label="FATAL" value="FATAL" />
              </el-select>
            </div>

            <!-- 显示选项 -->
            <div class="form-group">
              <label class="form-label">显示选项</label>
              <el-checkbox v-model="showDuplicates">显示重复堆栈</el-checkbox>
              <el-checkbox v-model="showTimestamp">显示时间戳</el-checkbox>
              <el-checkbox v-model="showLineNumber">显示行号</el-checkbox>
            </div>

            <!-- 视图模式 -->
            <div class="form-group">
              <label class="form-label">视图模式</label>
              <el-radio-group v-model="viewMode" size="large">
                <el-radio value="timeline" label="timeline">时间线视图</el-radio>
                <el-radio value="level" label="level">分级视图</el-radio>
              </el-radio-group>
            </div>

            <!-- 导入文件 -->
            <div class="form-actions">
              <NeonButton @click="loadFile" style="width: 100%">
                <i class="i-mdi-file-upload mr-2" />
                导入日志文件
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 统计面板 -->
          <NeonCard title="📊 日志统计" v-if="parsedLogs.length > 0">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">总行数</div>
                <div class="stat-value">{{ logStats.total }}</div>
              </div>
              <div class="stat-item stat-error">
                <div class="stat-label">ERROR</div>
                <div class="stat-value">{{ logStats.error }}</div>
              </div>
              <div class="stat-item stat-warn">
                <div class="stat-label">WARN</div>
                <div class="stat-value">{{ logStats.warn }}</div>
              </div>
              <div class="stat-item stat-info">
                <div class="stat-label">INFO</div>
                <div class="stat-value">{{ logStats.info }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">DEBUG</div>
                <div class="stat-value">{{ logStats.debug }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">异常数</div>
                <div class="stat-value">{{ logStats.exceptions }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">堆栈行数</div>
                <div class="stat-value">{{ logStats.stackTraces }}</div>
              </div>
              <div class="stat-item" v-if="logStats.timeRange.start">
                <div class="stat-label">时间跨度</div>
                <div class="stat-value-small">
                  {{ formatTimeRange(logStats.timeRange) }}
                </div>
              </div>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：主区域 -->
        <div class="tool-main">
          <!-- 日志输入 -->
          <NeonCard title="📝 日志输入" v-if="parsedLogs.length === 0">
            <div class="textarea-wrapper">
              <NeonTextarea
                v-model="logInput"
                placeholder="粘贴日志内容到这里..."
                :rows="25"
              />
            </div>
          </NeonCard>

          <!-- 分析结果 - 时间线视图 -->
          <NeonCard v-else-if="viewMode === 'timeline'" title="🕐 时间线视图">
            <template #extra>
              <div class="view-actions">
                <NeonButton size="small" @click="copyFilteredLogs">
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
                <NeonButton size="small" @click="exportLogs">
                  <i class="i-mdi-download mr-1" />
                  导出
                </NeonButton>
                <NeonButton size="small" @click="backToEdit" type="outline">
                  <i class="i-mdi-pencil mr-1" />
                  重新编辑
                </NeonButton>
              </div>
            </template>
            <div class="log-display">
              <div
                v-for="(log, index) in filteredLogs"
                :key="index"
                :class="['log-line', `log-${log.level?.toLowerCase() || 'normal'}`, `log-type-${log.type}`]"
                @click="handleLogClick(log)"
              >
                <span v-if="showLineNumber" class="log-line-number">{{ log.index + 1 }}</span>
                <span v-if="showTimestamp && log.timestamp" class="log-timestamp">
                  {{ formatTimestamp(log.timestamp) }}
                </span>
                <span v-if="log.level" :class="['log-level', `level-${log.level.toLowerCase()}`]">
                  {{ log.level }}
                </span>
                <span class="log-icon">
                  <i :class="getLogIcon(log)" />
                </span>
                <span class="log-content">{{ log.content }}</span>
              </div>
            </div>
          </NeonCard>

          <!-- 分析结果 - 分级视图 -->
          <NeonCard v-else title="📑 分级视图">
            <template #extra>
              <div class="view-actions">
                <NeonButton size="small" @click="copyFilteredLogs">
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
                <NeonButton size="small" @click="exportLogs">
                  <i class="i-mdi-download mr-1" />
                  导出
                </NeonButton>
                <NeonButton size="small" @click="backToEdit" type="outline">
                  <i class="i-mdi-pencil mr-1" />
                  重新编辑
                </NeonButton>
              </div>
            </template>
            <div class="level-groups">
              <el-collapse v-model="expandedLevels">
                <el-collapse-item
                  v-for="level in logLevels"
                  :key="level"
                  :name="level"
                  v-if="getLogsByLevel(level).length > 0"
                >
                  <template #title>
                    <div :class="['level-group-title', `level-${level.toLowerCase()}`]">
                      <i :class="getLevelIcon(level)" />
                      <span class="level-name">{{ level }}</span>
                      <span class="level-count">({{ getLogsByLevel(level).length }})</span>
                    </div>
                  </template>
                  <div class="log-display">
                    <div
                      v-for="(log, index) in getLogsByLevel(level)"
                      :key="index"
                      :class="['log-line', `log-${log.level?.toLowerCase() || 'normal'}`, `log-type-${log.type}`]"
                      @click="handleLogClick(log)"
                    >
                      <span v-if="showLineNumber" class="log-line-number">{{ log.index + 1 }}</span>
                      <span v-if="showTimestamp && log.timestamp" class="log-timestamp">
                        {{ formatTimestamp(log.timestamp) }}
                      </span>
                      <span class="log-icon">
                        <i :class="getLogIcon(log)" />
                      </span>
                      <span class="log-content">{{ log.content }}</span>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </NeonCard>
        </div>
      </div>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".log,.txt"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import {
  parseLogLines,
  calculateLogStats,
  filterByLevel,
  filterDuplicates,
  sortByTime,
  type ParsedLogLine,
  type LogLevel,
  type LogStats,
} from '@/utils/logParser'

// 状态
const logInput = ref('')
const businessPackage = ref('com.example')
const parsedLogs = ref<ParsedLogLine[]>([])
const filterLevel = ref<LogLevel | 'ALL'>('ALL')
const showDuplicates = ref(false)
const showTimestamp = ref(true)
const showLineNumber = ref(true)
const viewMode = ref<'timeline' | 'level'>('timeline')
const expandedLevels = ref<string[]>(['ERROR', 'WARN'])

// 文件上传
const fileInput = ref<HTMLInputElement | null>(null)

// 统计信息
const logStats = computed(() => {
  return calculateLogStats(parsedLogs.value)
})

// 过滤后的日志
const filteredLogs = computed(() => {
  let logs = parsedLogs.value
  
  // 级别过滤
  logs = filterByLevel(logs, filterLevel.value)
  
  // 重复行过滤
  if (!showDuplicates.value) {
    logs = filterDuplicates(logs)
  }
  
  // 按时间排序（如果有时间戳）
  logs = sortByTime(logs, 'asc')
  
  return logs
})

// 所有日志级别
const logLevels: LogLevel[] = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE']

// 按级别获取日志
function getLogsByLevel(level: LogLevel): ParsedLogLine[] {
  return filteredLogs.value.filter(log => log.level === level)
}

// 解析日志
function handleParse() {
  if (!logInput.value.trim()) {
    ElMessage.warning('请输入日志内容')
    return
  }
  
  try {
    parsedLogs.value = parseLogLines(logInput.value, businessPackage.value)
    ElMessage.success(`日志解析完成！共 ${parsedLogs.value.length} 行`)
  } catch (error: any) {
    ElMessage.error(`解析失败: ${error.message}`)
    console.error('Parse error:', error)
  }
}

// 获取日志图标
function getLogIcon(log: ParsedLogLine): string {
  if (log.type === 'exception') return 'i-mdi-alert-octagon'
  if (log.type === 'business') return 'i-mdi-alert-circle'
  if (log.type === 'framework') return 'i-mdi-package-variant'
  if (log.type === 'jdk') return 'i-mdi-language-java'
  if (log.level === 'ERROR') return 'i-mdi-close-circle'
  if (log.level === 'WARN') return 'i-mdi-alert'
  if (log.level === 'INFO') return 'i-mdi-information'
  return 'i-mdi-text'
}

// 获取级别图标
function getLevelIcon(level: LogLevel): string {
  const icons: Record<LogLevel, string> = {
    'FATAL': 'i-mdi-skull',
    'ERROR': 'i-mdi-close-circle',
    'WARN': 'i-mdi-alert',
    'INFO': 'i-mdi-information',
    'DEBUG': 'i-mdi-bug',
    'TRACE': 'i-mdi-magnify',
  }
  return icons[level]
}

// 格式化时间戳
function formatTimestamp(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  const ms = String(date.getMilliseconds()).padStart(3, '0')
  return `${hours}:${minutes}:${seconds}.${ms}`
}

// 格式化时间范围
function formatTimeRange(range: { start: Date | null; end: Date | null }): string {
  if (!range.start || !range.end) return '-'
  const diff = range.end.getTime() - range.start.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

// 点击日志行
function handleLogClick(log: ParsedLogLine) {
  // TODO: 显示上下文
  console.log('Clicked log:', log)
}

// 导入文件
function loadFile() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    logInput.value = e.target?.result as string
    ElMessage.success('日志文件已导入')
  }
  
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  
  reader.readAsText(file)
  target.value = ''
}

// 复制过滤后的日志
async function copyFilteredLogs() {
  try {
    const text = filteredLogs.value.map(log => log.content).join('\n')
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 导出日志
function exportLogs() {
  try {
    const text = filteredLogs.value.map(log => log.content).join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filtered-logs-${Date.now()}.log`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('日志文件已导出')
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

// 返回编辑
function backToEdit() {
  parsedLogs.value = []
}

// 清空
function clearAll() {
  logInput.value = ''
  parsedLogs.value = []
  filterLevel.value = 'ALL'
  businessPackage.value = 'com.example'
}

// 加载示例
function loadExample() {
  logInput.value = `2024-01-15 10:00:00.123  INFO 12345 --- [main] com.example.Application : Starting Application
2024-01-15 10:00:00.456  DEBUG 12345 --- [main] com.example.config.DatabaseConfig : Initializing datasource
2024-01-15 10:00:00.789  INFO 12345 --- [main] org.springframework.boot.SpringApplication : Started Application in 2.5 seconds
2024-01-15 10:00:05.123  WARN 12345 --- [http-nio-8080-exec-1] com.example.service.UserService : User not found: userId=123
2024-01-15 10:00:10.456  ERROR 12345 --- [http-nio-8080-exec-2] com.example.controller.OrderController : Failed to process order
java.lang.NullPointerException: Cannot invoke "String.length()" because "orderId" is null
\tat com.example.service.OrderService.processOrder(OrderService.java:45)
\tat com.example.controller.OrderController.createOrder(OrderController.java:28)
\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)
\tat java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
\tat java.base/java.lang.reflect.Method.invoke(Method.java:568)
\tat org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)
\tat org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:150)
\tat com.example.util.Validator.validate(Validator.java:12)
2024-01-15 10:00:11.789  INFO 12345 --- [http-nio-8080-exec-3] com.example.controller.UserController : User retrieved successfully: userId=456`
  
  ElMessage.success('已加载示例日志')
}
</script>

<style scoped>
.tool-log-analyzer {
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
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.4);
}

.tool-header__info {
  flex: 1;
  min-width: 0;
  max-width: 50%;
}

.tool-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-display);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tool-header__description {
  font-size: var(--font-size-base);
  color: var(--color-muted);
  line-height: 1.5;
}

.tool-header__actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  flex-shrink: 1;
  max-width: 70%;
}

.tool-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
}

.tool-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

.tool-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tool-main {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.form-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.form-actions {
  margin-top: var(--spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.stat-item {
  padding: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  text-align: center;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-bottom: 2px;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.stat-value-small {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.stat-error {
  border-color: var(--neon-pink);
}

.stat-error .stat-value {
  color: var(--neon-pink);
}

.stat-warn {
  border-color: var(--neon-yellow);
}

.stat-warn .stat-value {
  color: var(--neon-yellow);
}

.stat-info {
  border-color: var(--neon-cyan);
}

.stat-info .stat-value {
  color: var(--neon-cyan);
}

.textarea-wrapper {
  height: 600px;
  overflow: hidden;
}

.textarea-wrapper :deep(textarea) {
  height: 100% !important;
  min-height: 600px !important;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.view-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.log-display {
  max-height: 600px;
  overflow-y: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
}

/* 霓虹滚动条 */
.log-display::-webkit-scrollbar {
  width: 8px;
}

.log-display::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.log-display::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.log-display::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.log-line {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  padding: 2px var(--spacing-sm);
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.03);
}

.log-line-number {
  flex-shrink: 0;
  width: 40px;
  text-align: right;
  color: var(--color-muted);
  user-select: none;
}

.log-timestamp {
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 0.95em;
}

.log-level {
  flex-shrink: 0;
  width: 50px;
  font-weight: var(--font-weight-bold);
  text-align: center;
}

.log-icon {
  flex-shrink: 0;
  font-size: 1.1em;
}

.log-content {
  flex: 1;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 日志级别颜色 */
.log-fatal,
.log-error,
.level-fatal,
.level-error {
  color: var(--neon-pink);
}

.log-fatal,
.log-error {
  border-left-color: var(--neon-pink);
  background: rgba(255, 42, 161, 0.05);
}

.log-warn,
.level-warn {
  color: var(--neon-yellow);
}

.log-warn {
  border-left-color: var(--neon-yellow);
  background: rgba(255, 230, 0, 0.05);
}

.log-info,
.level-info {
  color: var(--neon-cyan);
}

.log-info {
  border-left-color: var(--neon-cyan);
}

.log-debug,
.level-debug {
  color: var(--color-muted);
}

.log-trace,
.level-trace {
  color: var(--color-text-disabled);
}

.log-type-business .log-content {
  color: var(--neon-lime);
}

.log-type-exception .log-content {
  color: var(--neon-pink);
  font-weight: var(--font-weight-medium);
}

.level-groups {
  max-height: 600px;
  overflow-y: auto;
}

.level-group-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-base);
}

.level-group-title i {
  font-size: 1.2em;
}

.level-name {
  flex: 1;
}

.level-count {
  color: var(--color-muted);
  font-size: var(--font-size-sm);
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-checkbox) {
  display: block;
  margin-bottom: var(--spacing-xs);
}

:deep(.el-collapse) {
  border: none;
}

:deep(.el-collapse-item__header) {
  background: rgba(255, 255, 255, 0.02);
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
}

:deep(.el-collapse-item__content) {
  padding: 0;
  border: none;
}
</style>




