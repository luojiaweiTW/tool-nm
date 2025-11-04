<template>
  <div class="json-formatter-compact">
    <!-- 顶部工具栏 -->
    <div class="formatter-toolbar">
      <div class="formatter-toolbar__left">
        <h2 class="formatter-title">
          <i class="i-mdi-code-json" />
          <span>JSON 格式化器</span>
        </h2>
        <span class="formatter-desc">快速格式化、压缩、校验 JSON/YAML 数据</span>
      </div>
      <div class="formatter-toolbar__right">
        <CompactButtonGroup size="sm">
          <CompactButton variant="default" size="sm" icon="i-mdi-broom" @click="handleClear">
            清空
          </CompactButton>
          <CompactButton variant="primary" size="sm" icon="i-mdi-content-copy" @click="handleCopy">
            复制
          </CompactButton>
          <CompactButton variant="success" size="sm" icon="i-mdi-download" @click="handleDownload">
            下载
          </CompactButton>
        </CompactButtonGroup>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="formatter-content">
      <!-- 左侧：输入区 -->
      <CompactCard title="输入">
        <template #actions>
          <CompactButtonGroup size="xs">
            <CompactButton
              v-for="fmt in ['json', 'yaml']"
              :key="fmt"
              :active="inputFormat === fmt"
              size="xs"
              @click="inputFormat = fmt"
            >
              {{ fmt.toUpperCase() }}
            </CompactButton>
          </CompactButtonGroup>
          
          <div class="toolbar-divider" />
          
          <CompactButtonGroup size="xs">
            <CompactButton size="xs" icon="i-mdi-code-braces" @click="handleFormat">
              格式化
            </CompactButton>
            <CompactButton size="xs" icon="i-mdi-compress" @click="handleCompress">
              压缩
            </CompactButton>
            <CompactButton size="xs" icon="i-mdi-check-circle-outline" @click="handleValidate">
              校验
            </CompactButton>
          </CompactButtonGroup>
        </template>

        <div class="editor-wrapper">
          <textarea
            v-model="inputJson"
            class="compact-textarea"
            :class="{ 'has-error': validationError }"
            placeholder="粘贴或输入 JSON/YAML 数据..."
            spellcheck="false"
            @input="handleInput"
          />
          <div v-if="validationError" class="editor-error">
            <i class="i-mdi-alert-circle" />
            {{ validationError }}
          </div>
        </div>
      </CompactCard>

      <!-- 右侧：输出区 -->
      <CompactCard title="输出">
        <template #actions>
          <!-- 状态标签 -->
          <StatusTag
            v-if="validationError"
            type="error"
            icon="i-mdi-alert-circle"
          >
            格式错误
          </StatusTag>
          <StatusTag
            v-else-if="outputJson"
            type="success"
            icon="i-mdi-check-circle"
          >
            格式正确
          </StatusTag>

          <div class="toolbar-divider" />

          <!-- 视图模式 -->
          <CompactButtonGroup size="xs">
            <CompactButton
              v-for="mode in ['text', 'tree']"
              :key="mode"
              :active="viewMode === mode"
              size="xs"
              @click="viewMode = mode"
            >
              {{ mode === 'text' ? '文本' : '树形' }}
            </CompactButton>
          </CompactButtonGroup>

          <!-- 输出格式 -->
          <CompactButtonGroup v-if="viewMode === 'text'" size="xs">
            <CompactButton
              v-for="fmt in ['json', 'yaml']"
              :key="fmt"
              :active="outputFormat === fmt"
              size="xs"
              @click="outputFormat = fmt; handleOutputFormatChange()"
            >
              {{ fmt.toUpperCase() }}
            </CompactButton>
          </CompactButtonGroup>

          <!-- 树形控制 -->
          <template v-if="viewMode === 'tree'">
            <div class="toolbar-divider" />
            <CompactButtonGroup size="xs">
              <CompactButton size="xs" icon="i-mdi-unfold-more-horizontal" @click="expandAll">
                展开
              </CompactButton>
              <CompactButton size="xs" icon="i-mdi-unfold-less-horizontal" @click="collapseAll">
                折叠
              </CompactButton>
            </CompactButtonGroup>
          </template>
        </template>

        <div class="editor-wrapper">
          <!-- 文本模式 -->
          <pre v-if="viewMode === 'text'" class="compact-output"><code>{{ outputJson || '输出结果将显示在这里...' }}</code></pre>
          
          <!-- 树形模式 -->
          <div v-else class="json-tree-compact">
            <JsonTreeNode
              v-if="parsedData !== null"
              :data="parsedData"
              :path="'root'"
            />
            <div v-else class="json-tree-compact__empty">
              输入 JSON 数据后将显示树形结构...
            </div>
          </div>
        </div>
      </CompactCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide } from 'vue'
import { ElMessage } from 'element-plus'
import * as yaml from 'js-yaml'
import CompactCard from '@/components/CompactCard.vue'
import CompactButton from '@/components/CompactButton.vue'
import CompactButtonGroup from '@/components/CompactButtonGroup.vue'
import StatusTag from '@/components/StatusTag.vue'
import JsonTreeNode from './components/JsonTreeNode.vue'

const inputJson = ref('')
const outputJson = ref('')
const validationError = ref('')
const inputFormat = ref<'json' | 'yaml'>('json')
const outputFormat = ref<'json' | 'yaml'>('json')
const viewMode = ref<'text' | 'tree'>('text')
const parsedData = ref<any>(null)

const handleInput = () => {
  validationError.value = ''
}

// 解析输入（支持JSON和YAML）
const parseInput = () => {
  if (inputFormat.value === 'json') {
    return JSON.parse(inputJson.value)
  } else {
    return yaml.load(inputJson.value)
  }
}

// 格式化输出（支持JSON和YAML）
const formatOutput = (data: any, compress = false) => {
  if (outputFormat.value === 'json') {
    return compress ? JSON.stringify(data) : JSON.stringify(data, null, 2)
  } else {
    return yaml.dump(data, { indent: compress ? 0 : 2, lineWidth: -1 })
  }
}

const handleFormat = () => {
  try {
    const parsed = parseInput()
    outputJson.value = formatOutput(parsed, false)
    validationError.value = ''
    ElMessage.success(`格式化成功 (${inputFormat.value.toUpperCase()} → ${outputFormat.value.toUpperCase()})`)
  } catch (error: any) {
    validationError.value = `${inputFormat.value.toUpperCase()} 格式错误: ${error.message}`
    ElMessage.error(`${inputFormat.value.toUpperCase()} 格式错误`)
  }
}

const handleCompress = () => {
  try {
    const parsed = parseInput()
    outputJson.value = formatOutput(parsed, true)
    validationError.value = ''
    ElMessage.success('压缩成功')
  } catch (error: any) {
    validationError.value = `${inputFormat.value.toUpperCase()} 格式错误: ${error.message}`
    ElMessage.error(`${inputFormat.value.toUpperCase()} 格式错误`)
  }
}

const handleValidate = () => {
  try {
    parseInput()
    validationError.value = ''
    ElMessage.success(`${inputFormat.value.toUpperCase()} 格式正确`)
  } catch (error: any) {
    validationError.value = `${inputFormat.value.toUpperCase()} 格式错误: ${error.message}`
    ElMessage.error(`${inputFormat.value.toUpperCase()} 格式错误`)
  }
}

// 输出格式切换时自动转换
const handleOutputFormatChange = () => {
  if (!inputJson.value) return
  try {
    const parsed = parseInput()
    outputJson.value = formatOutput(parsed, false)
    validationError.value = ''
  } catch (error: any) {
    // 保持当前输出，不清空
  }
}

const handleClear = () => {
  inputJson.value = ''
  outputJson.value = ''
  validationError.value = ''
  ElMessage.success('已清空')
}

const handleCopy = () => {
  if (!outputJson.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(outputJson.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const handleDownload = () => {
  if (!outputJson.value) {
    ElMessage.warning('没有可下载的内容')
    return
  }
  
  const blob = new Blob([outputJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `formatted-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}

// 展开/折叠控制
const expandAllSignal = ref(0)
const collapseAllSignal = ref(0)

function expandAll() {
  expandAllSignal.value++
}

function collapseAll() {
  collapseAllSignal.value++
}

// 提供展开/折叠信号给子组件
provide('expandAllSignal', expandAllSignal)
provide('collapseAllSignal', collapseAllSignal)

// 自动格式化（可选）
watch(inputJson, () => {
  if (inputJson.value) {
    try {
      const parsed = parseInput()
      outputJson.value = formatOutput(parsed, false)
      parsedData.value = parsed // 更新树形数据
      validationError.value = ''
    } catch {
      // 输入时不显示错误，只在校验时显示
      parsedData.value = null
    }
  } else {
    outputJson.value = ''
    parsedData.value = null
  }
})
</script>

<style scoped>
.json-formatter-compact {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(10, 10, 20, 0.9) 0%, rgba(20, 20, 40, 0.95) 100%);
}

/* 顶部工具栏 */
.formatter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(33, 230, 255, 0.15);
  gap: 16px;
  flex-shrink: 0;
}

.formatter-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.formatter-toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.formatter-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--neon-blue);
  margin: 0;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.formatter-title i {
  font-size: 20px;
}

.formatter-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主体内容 */
.formatter-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  min-height: 0;
}

/* 编辑器包装 */
.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
}

/* 紧凑文本域 */
.compact-textarea {
  flex: 1;
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: all 0.25s ease;
}

.compact-textarea:focus {
  border-color: rgba(33, 230, 255, 0.4);
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 2px rgba(33, 230, 255, 0.1);
}

.compact-textarea.has-error {
  border-color: rgba(239, 68, 68, 0.4);
}

.compact-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

/* 错误提示 */
.editor-error {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  color: rgb(239, 68, 68);
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
  max-height: 80px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
}

.editor-error i {
  font-size: 13px;
  flex-shrink: 0;
}

/* 紧凑输出 */
.compact-output {
  flex: 1;
  margin: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 4px;
  overflow: auto;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  white-space: pre-wrap;
  word-break: break-word;
}

.compact-output code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

/* 树形视图 */
.json-tree-compact {
  flex: 1;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 4px;
  overflow: auto;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.7;
}

.json-tree-compact__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  font-size: 12px;
}

/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 16px;
  background: rgba(33, 230, 255, 0.2);
  flex-shrink: 0;
}

/* 滚动条样式 */
.compact-textarea::-webkit-scrollbar,
.compact-output::-webkit-scrollbar,
.json-tree-compact::-webkit-scrollbar,
.editor-error::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.compact-textarea::-webkit-scrollbar-track,
.compact-output::-webkit-scrollbar-track,
.json-tree-compact::-webkit-scrollbar-track,
.editor-error::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.compact-textarea::-webkit-scrollbar-thumb,
.compact-output::-webkit-scrollbar-thumb,
.json-tree-compact::-webkit-scrollbar-thumb,
.editor-error::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.4);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.compact-textarea::-webkit-scrollbar-thumb:hover,
.compact-output::-webkit-scrollbar-thumb:hover,
.json-tree-compact::-webkit-scrollbar-thumb:hover,
.editor-error::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.6);
}

/* 响应式 */
@media (max-width: 1200px) {
  .formatter-content {
    grid-template-columns: 1fr;
  }
  
  .formatter-desc {
    display: none;
  }
}

@media (max-width: 768px) {
  .formatter-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .formatter-toolbar__left,
  .formatter-toolbar__right {
    justify-content: space-between;
  }
}
</style>


