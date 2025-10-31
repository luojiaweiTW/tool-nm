<template>
  <div class="tool-page">
    <Header
      title="JSON 格式化器"
      description="格式化、压缩、校验 JSON 数据"
      icon="i-mdi-code-json"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" data-action="copy" @click="handleCopy">
          <i class="i-mdi-content-copy" />
          复制 <span style="opacity: 0.6;">(Ctrl+Shift+C)</span>
        </NeonButton>
        <NeonButton variant="success" size="small" @click="handleDownload">
          <i class="i-mdi-download" />
          下载
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="json-formatter">
        <!-- 左侧：输入区 -->
        <NeonCard class="json-formatter__panel" title="输入 JSON" compact>
          <template #extra>
            <div class="json-formatter__controls">
              <el-radio-group v-model="inputFormat" size="small">
                <el-radio-button value="json">JSON</el-radio-button>
                <el-radio-button value="yaml">YAML</el-radio-button>
              </el-radio-group>
              <el-button-group>
                <el-button size="small" @click="handleFormat">
                  <i class="i-mdi-code-braces" />
                  格式化
                </el-button>
                <el-button size="small" @click="handleCompress">
                  <i class="i-mdi-compress" />
                  压缩
                </el-button>
                <el-button size="small" @click="handleValidate">
                  <i class="i-mdi-check-circle-outline" />
                  校验
                </el-button>
              </el-button-group>
            </div>
          </template>
          <NeonTextarea
            v-model="inputJson"
            placeholder="粘贴或输入 JSON 数据..."
            :rows="20"
            :error="validationError"
            @input="handleInput"
          />
        </NeonCard>

        <!-- 右侧：输出区 -->
        <NeonCard class="json-formatter__panel" title="输出结果" compact>
          <template #extra>
            <div class="json-formatter__controls">
              <span class="json-formatter__status">
                <template v-if="validationError">
                  <i class="i-mdi-alert-circle" style="color: var(--neon-pink);" />
                  <span style="color: var(--neon-pink);">格式错误</span>
                </template>
                <template v-else-if="outputJson">
                  <i class="i-mdi-check-circle" style="color: var(--neon-lime);" />
                  <span style="color: var(--neon-lime);">格式正确</span>
                </template>
              </span>
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button value="text">文本</el-radio-button>
                <el-radio-button value="tree">树形</el-radio-button>
              </el-radio-group>
              <el-radio-group v-if="viewMode === 'text'" v-model="outputFormat" size="small" @change="handleOutputFormatChange">
                <el-radio-button value="json">JSON</el-radio-button>
                <el-radio-button value="yaml">YAML</el-radio-button>
              </el-radio-group>
              <template v-if="viewMode === 'tree'">
                <el-button size="small" @click="expandAll">
                  <i class="i-mdi-unfold-more-horizontal" />
                  全部展开
                </el-button>
                <el-button size="small" @click="collapseAll">
                  <i class="i-mdi-unfold-less-horizontal" />
                  全部折叠
                </el-button>
              </template>
            </div>
          </template>
          <!-- 文本模式 -->
          <pre v-if="viewMode === 'text'" class="json-formatter__output mono"><code>{{ outputJson || '输出结果将显示在这里...' }}</code></pre>
          
          <!-- 树形模式 -->
          <div v-else class="json-tree">
            <JsonTreeNode
              v-if="parsedData !== null"
              :data="parsedData"
              :path="'root'"
            />
            <div v-else class="json-tree__empty">
              输入JSON数据后将显示树形结构...
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, provide } from 'vue'
import { ElMessage } from 'element-plus'
import * as yaml from 'js-yaml'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
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

.json-formatter {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  height: 100%;
}

.json-formatter__panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.json-formatter__panel :deep(.neon-card__body) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.json-formatter__panel :deep(.neon-textarea-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-formatter__panel :deep(.neon-textarea) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-formatter__panel :deep(.neon-textarea__inner) {
  flex: 1;
  min-height: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

.json-formatter__output {
  flex: 1;
  margin: 0;
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: auto;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-all;
}

.json-formatter__controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.json-formatter__status {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.json-formatter__output code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}

/* 树形视图 */
.json-tree {
  flex: 1;
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: auto;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.8;
}

.json-tree__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-style: italic;
}

@media (max-width: 1024px) {
  .json-formatter {
    grid-template-columns: 1fr;
  }
}
</style>

