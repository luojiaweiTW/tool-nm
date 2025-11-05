<template>
  <div class="tool-profile-merger">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">Profile 配置合成</h1>
        <p class="tool-header__description">合并 Spring Boot 多环境配置文件（application.yml + application-*.yml）</p>
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
        <NeonButton @click="handleMerge" type="primary" :disabled="!baseYaml || !profileYaml">
          <i class="i-mdi-merge mr-2" />
          合并配置
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <!-- 三栏布局 -->
      <div class="three-column-layout">
        <!-- 左栏：主配置 -->
        <NeonCard title="📝 主配置 (application.yml)">
          <template #extra>
            <NeonButton size="small" @click="loadFile('base')">
              <i class="i-mdi-file-upload mr-1" />
              导入文件
            </NeonButton>
          </template>
          <div class="yaml-editor-wrapper">
            <NeonTextarea
              v-model="baseYaml"
              placeholder="粘贴或导入主配置文件..."
              :rows="20"
            />
          </div>
          <div class="file-info" v-if="baseYaml">
            {{ baseYaml.split('\n').length }} 行
          </div>
        </NeonCard>

        <!-- 中栏：Profile 配置 -->
        <NeonCard title="🔧 Profile 配置 (application-dev.yml)">
          <template #extra>
            <NeonButton size="small" @click="loadFile('profile')">
              <i class="i-mdi-file-upload mr-1" />
              导入文件
            </NeonButton>
          </template>
          <div class="yaml-editor-wrapper">
            <NeonTextarea
              v-model="profileYaml"
              placeholder="粘贴或导入 Profile 配置文件..."
              :rows="20"
            />
          </div>
          <div class="file-info" v-if="profileYaml">
            {{ profileYaml.split('\n').length }} 行
          </div>
        </NeonCard>

        <!-- 右栏：合成结果 -->
        <NeonCard title="✨ 合成结果">
          <template #extra>
            <div class="result-actions" v-if="mergedYaml">
              <NeonButton size="small" @click="copyResult">
                <i class="i-mdi-content-copy mr-1" />
                复制
              </NeonButton>
              <NeonButton size="small" @click="exportYaml">
                <i class="i-mdi-download mr-1" />
                导出 YAML
              </NeonButton>
              <NeonButton size="small" @click="exportJson">
                <i class="i-mdi-code-json mr-1" />
                导出 JSON
              </NeonButton>
            </div>
          </template>
          <div class="yaml-output-wrapper">
            <pre v-if="mergedYaml" class="yaml-output">{{ mergedYaml }}</pre>
            <div v-else class="empty-result">
              <i class="i-mdi-file-settings-outline" />
              <p>合并结果将显示在这里</p>
            </div>
          </div>
          <div class="file-info" v-if="mergedYaml">
            {{ mergedYaml.split('\n').length }} 行
          </div>
        </NeonCard>
      </div>

      <!-- 合并选项 -->
      <NeonCard title="⚙️ 合并选项" v-if="baseYaml || profileYaml" class="merge-options-card">
        <div class="merge-options">
          <label class="option-label">数组合并策略：</label>
          <el-radio-group v-model="mergeOptions.arrayMergeStrategy">
            <el-radio value="replace" label="replace">替换（Profile 覆盖 Base）</el-radio>
            <el-radio value="concat" label="concat">拼接（Profile 追加到 Base）</el-radio>
          </el-radio-group>
        </div>
      </NeonCard>

      <!-- 配置差异 -->
      <NeonCard title="🔍 配置差异" v-if="diffResults.length > 0" class="diff-card">
        <template #extra>
          <div class="diff-stats">
            <span class="stat-item stat-inherited">
              <i class="i-mdi-check-circle" />
              继承: {{ diffStats.inherited }}
            </span>
            <span class="stat-item stat-overridden">
              <i class="i-mdi-pencil-circle" />
              覆盖: {{ diffStats.overridden }}
            </span>
            <span class="stat-item stat-added">
              <i class="i-mdi-plus-circle" />
              新增: {{ diffStats.added }}
            </span>
            <span class="stat-item">总计: {{ diffStats.total }}</span>
          </div>
        </template>
        
        <div class="diff-list">
          <div
            v-for="(diff, index) in diffResults"
            :key="index"
            :class="['diff-item', `diff-${diff.type}`]"
          >
            <div class="diff-item__path">
              <i :class="getDiffIcon(diff.type)" />
              {{ diff.path }}
            </div>
            <div class="diff-item__type">
              {{ getDiffTypeLabel(diff.type) }}
            </div>
            <div class="diff-item__value">
              <span class="value-label">值:</span>
              <code>{{ formatValue(diff.mergedValue) }}</code>
            </div>
          </div>
        </div>
      </NeonCard>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".yml,.yaml"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as yaml from 'js-yaml'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import {
  deepMerge,
  detectDiff,
  getDiffTypeLabel,
  getDiffTypeColor,
  formatValue,
  calculateDiffStats,
  type MergeOptions,
  type YamlDiffResult,
  type DiffType,
} from '@/utils/yamlMerger'

// 状态
const baseYaml = ref('')
const profileYaml = ref('')
const mergedYaml = ref('')
const diffResults = ref<YamlDiffResult[]>([])
const mergeOptions = ref<MergeOptions>({
  arrayMergeStrategy: 'replace'
})

// 文件上传
const fileInput = ref<HTMLInputElement | null>(null)
const currentFileType = ref<'base' | 'profile'>('base')

// 计算属性
const diffStats = computed(() => {
  return calculateDiffStats(diffResults.value)
})

// 获取差异图标
function getDiffIcon(type: DiffType): string {
  const icons: Record<DiffType, string> = {
    'inherited': 'i-mdi-check-circle',
    'overridden': 'i-mdi-pencil-circle',
    'added': 'i-mdi-plus-circle',
  }
  return icons[type]
}

// 导入文件
function loadFile(type: 'base' | 'profile') {
  currentFileType.value = type
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    
    if (currentFileType.value === 'base') {
      baseYaml.value = content
      ElMessage.success('主配置文件已导入')
    } else {
      profileYaml.value = content
      ElMessage.success('Profile 配置文件已导入')
    }
  }
  
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  
  reader.readAsText(file)
  
  // 清空 input，允许重复选择同一文件
  target.value = ''
}

// 合并配置
function handleMerge() {
  if (!baseYaml.value || !profileYaml.value) {
    ElMessage.warning('请先输入主配置和 Profile 配置')
    return
  }
  
  try {
    // 解析 YAML
    const baseObj = yaml.load(baseYaml.value) as any
    const profileObj = yaml.load(profileYaml.value) as any
    
    if (!baseObj || !profileObj) {
      ElMessage.error('YAML 解析失败：配置为空')
      return
    }
    
    // 深度合并
    const mergedObj = deepMerge(baseObj, profileObj, mergeOptions.value)
    
    // 转换为 YAML 字符串
    mergedYaml.value = yaml.dump(mergedObj, {
      indent: 2,
      lineWidth: -1, // 不限制行宽
      noRefs: true,  // 不使用引用
    })
    
    // 检测差异
    diffResults.value = detectDiff(baseObj, profileObj, mergedObj)
    
    ElMessage.success(`配置合成成功！共 ${diffResults.value.length} 个配置项`)
  } catch (error: any) {
    ElMessage.error(`合并失败: ${error.message}`)
    console.error('Merge error:', error)
  }
}

// 复制结果
async function copyResult() {
  try {
    await navigator.clipboard.writeText(mergedYaml.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 导出 YAML
function exportYaml() {
  try {
    const blob = new Blob([mergedYaml.value], { type: 'text/yaml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'application-merged.yml'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('YAML 文件已导出')
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

// 导出 JSON
function exportJson() {
  try {
    const obj = yaml.load(mergedYaml.value)
    const jsonStr = JSON.stringify(obj, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'application-merged.json'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('JSON 文件已导出')
  } catch (error: any) {
    ElMessage.error(`导出失败: ${error.message}`)
  }
}

// 清空
function clearAll() {
  baseYaml.value = ''
  profileYaml.value = ''
  mergedYaml.value = ''
  diffResults.value = []
  ElMessage.info('已清空所有内容')
}

// 加载示例
function loadExample() {
  baseYaml.value = `# application.yml (主配置)
spring:
  application:
    name: my-app
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/db
    username: root
    password: 123456
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

server:
  port: 8080
  
logging:
  level:
    root: INFO`

  profileYaml.value = `# application-dev.yml (开发环境)
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/db_dev
    username: dev_user
    password: dev_pass
  jpa:
    show-sql: true
    
server:
  port: 8081
  
logging:
  level:
    root: DEBUG
    com.example: TRACE`

  ElMessage.success('已加载示例配置')
}
</script>

<style scoped>
.tool-profile-merger {
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
  border: 2px solid var(--neon-lime);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(208, 255, 0, 0.4);
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

.three-column-layout {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  min-height: 0;
}

.yaml-editor-wrapper {
  height: 500px;
  overflow: hidden;
}

.yaml-editor-wrapper :deep(textarea) {
  height: 100% !important;
  min-height: 500px !important;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.yaml-output-wrapper {
  height: 500px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

/* 霓虹滚动条 */
.yaml-output-wrapper::-webkit-scrollbar {
  width: 8px;
}

.yaml-output-wrapper::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.yaml-output-wrapper::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.yaml-output-wrapper::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.yaml-output {
  margin: 0;
  padding: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-muted);
  gap: var(--spacing-sm);
}

.empty-result i {
  font-size: 3em;
  opacity: 0.3;
}

.file-info {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  text-align: right;
}

.result-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.merge-options-card,
.diff-card {
  margin-top: 0;
}

.merge-options {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.option-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.diff-stats {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.stat-item i {
  font-size: 1.2em;
}

.stat-inherited {
  color: var(--color-muted);
}

.stat-inherited i {
  color: var(--color-muted);
}

.stat-overridden {
  color: var(--neon-yellow);
}

.stat-overridden i {
  color: var(--neon-yellow);
}

.stat-added {
  color: var(--neon-lime);
}

.stat-added i {
  color: var(--neon-lime);
}

.diff-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 400px;
  overflow-y: auto;
}

/* 霓虹滚动条 */
.diff-list::-webkit-scrollbar {
  width: 8px;
}

.diff-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.diff-list::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.diff-list::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.diff-item {
  display: grid;
  grid-template-columns: 2fr 80px 3fr;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.02);
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.diff-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.diff-item.diff-inherited {
  border-left-color: var(--color-muted);
}

.diff-item.diff-overridden {
  border-left-color: var(--neon-yellow);
}

.diff-item.diff-added {
  border-left-color: var(--neon-lime);
}

.diff-item__path {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  word-break: break-all;
}

.diff-item__path i {
  flex-shrink: 0;
  font-size: 1.1em;
}

.diff-item.diff-inherited .diff-item__path i {
  color: var(--color-muted);
}

.diff-item.diff-overridden .diff-item__path i {
  color: var(--neon-yellow);
}

.diff-item.diff-added .diff-item__path i {
  color: var(--neon-lime);
}

.diff-item__type {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
}

.diff-item.diff-inherited .diff-item__type {
  color: var(--color-muted);
  background: rgba(255, 255, 255, 0.05);
}

.diff-item.diff-overridden .diff-item__type {
  color: var(--neon-yellow);
  background: rgba(255, 230, 0, 0.1);
}

.diff-item.diff-added .diff-item__type {
  color: var(--neon-lime);
  background: rgba(208, 255, 0, 0.1);
}

.diff-item__value {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  overflow: hidden;
}

.value-label {
  color: var(--color-muted);
  flex-shrink: 0;
}

.diff-item__value code {
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

/* 响应式 */
@media (max-width: 1400px) {
  .three-column-layout {
    grid-template-columns: 1fr;
  }
}
</style>




