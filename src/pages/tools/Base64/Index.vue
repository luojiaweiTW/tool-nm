<template>
  <div class="tool-page">
    <Header
      title="Base64 编解码"
      description="Base64 编码解码工具，支持文本与文件"
      icon="i-mdi-file-code-outline"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" data-action="copy" @click="handleCopy">
          <i class="i-mdi-content-copy" />
          复制结果 <span style="opacity: 0.6;">(Ctrl+Shift+C)</span>
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="base64-converter">
        <!-- 左侧：编码/解码选择 -->
        <div class="base64-converter__main">
          <NeonCard title="Base64 转换" compact>
            <div class="converter-controls">
              <el-radio-group v-model="mode" size="large">
                <el-radio-button value="encode">编码</el-radio-button>
                <el-radio-button value="decode">解码</el-radio-button>
              </el-radio-group>

              <el-radio-group v-model="inputType" size="default">
                <el-radio-button value="text">
                  <i class="i-mdi-text" />
                  文本
                </el-radio-button>
                <el-radio-button value="file">
                  <i class="i-mdi-file" />
                  文件
                </el-radio-button>
              </el-radio-group>
            </div>

            <!-- 文本输入 -->
            <div v-if="inputType === 'text'" class="text-input-section">
              <div class="textarea-wrapper">
                <NeonTextarea
                  v-model="textInput"
                  :label="mode === 'encode' ? '输入文本' : '输入 Base64'"
                  :placeholder="mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'"
                  :rows="12"
                  show-count
                  :maxlength="50000"
                />
              </div>

              <div class="action-buttons">
                <NeonButton
                  variant="primary"
                  style="width: 100%;"
                  @click="handleTextConvert"
                >
                  <i :class="mode === 'encode' ? 'i-mdi-lock' : 'i-mdi-lock-open'" />
                  {{ mode === 'encode' ? '编码' : '解码' }}
                </NeonButton>
              </div>
            </div>

            <!-- 文件输入 -->
            <div v-else class="file-input-section">
              <div
                class="file-drop-zone"
                :class="{ 'file-drop-zone--dragover': isDragging }"
                @drop.prevent="handleFileDrop"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
              >
                <i class="i-mdi-cloud-upload file-drop-icon" />
                <p class="file-drop-text">拖放文件到这里，或点击选择</p>
                <input
                  ref="fileInputRef"
                  type="file"
                  class="file-input-hidden"
                  @change="handleFileSelect"
                />
                <NeonButton variant="outline" @click="triggerFileSelect">
                  <i class="i-mdi-folder-open" />
                  选择文件
                </NeonButton>
              </div>

              <div v-if="selectedFile" class="file-info">
                <div class="file-info__item">
                  <label>文件名</label>
                  <span>{{ selectedFile.name }}</span>
                </div>
                <div class="file-info__item">
                  <label>文件大小</label>
                  <span>{{ formatFileSize(selectedFile.size) }}</span>
                </div>
                <div class="file-info__item">
                  <label>文件类型</label>
                  <span>{{ selectedFile.type || '未知' }}</span>
                </div>
              </div>

              <div class="action-buttons">
                <NeonButton
                  variant="primary"
                  style="width: 100%;"
                  :disabled="!selectedFile"
                  @click="handleFileConvert"
                >
                  <i :class="mode === 'encode' ? 'i-mdi-lock' : 'i-mdi-lock-open'" />
                  {{ mode === 'encode' ? '编码文件' : '解码文件' }}
                </NeonButton>
              </div>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：结果显示 -->
        <div class="base64-converter__result">
          <NeonCard title="转换结果" compact>
            <div v-if="!result" class="empty-state">
              <i class="i-mdi-information-outline empty-state-icon" />
              <p>转换结果将显示在这里</p>
            </div>
            <div v-else class="result-content">
              <div class="result-header">
                <span class="result-label">
                  {{ mode === 'encode' ? 'Base64 编码结果' : '解码结果' }}
                </span>
                <span class="result-size">
                  {{ result.length }} 字符
                </span>
              </div>
              <pre class="result-output mono">{{ result }}</pre>
              <div class="result-actions">
                <NeonButton variant="success" size="small" @click="handleDownloadResult">
                  <i class="i-mdi-download" />
                  下载结果
                </NeonButton>
              </div>
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

type Mode = 'encode' | 'decode'
type InputType = 'text' | 'file'

const mode = ref<Mode>('encode')
const inputType = ref<InputType>('text')
const textInput = ref('')
const result = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const isDragging = ref(false)

const handleTextConvert = () => {
  if (!textInput.value) {
    ElMessage.warning('请输入内容')
    return
  }

  try {
    if (mode.value === 'encode') {
      result.value = btoa(unescape(encodeURIComponent(textInput.value)))
      ElMessage.success('编码成功')
    } else {
      result.value = decodeURIComponent(escape(atob(textInput.value)))
      ElMessage.success('解码成功')
    }
  } catch (error: any) {
    ElMessage.error(`转换失败: ${error.message}`)
  }
}

const handleFileConvert = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  const reader = new FileReader()
  
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      
      if (mode.value === 'encode') {
        // 编码：读取文件内容并转为 Base64
        const base64 = content.split(',')[1] || '' // 移除 data:... 前缀
        result.value = base64
        ElMessage.success('文件编码成功')
      } else {
        // 解码：将 Base64 转回文件
        result.value = content
        ElMessage.success('文件解码成功')
      }
    } catch (error: any) {
      ElMessage.error(`转换失败: ${error.message}`)
    }
  }

  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }

  if (mode.value === 'encode') {
    reader.readAsDataURL(selectedFile.value)
  } else {
    reader.readAsText(selectedFile.value)
  }
}

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0] || null
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    selectedFile.value = event.dataTransfer.files[0] || null
  }
}

const handleClear = () => {
  textInput.value = ''
  result.value = ''
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  ElMessage.success('已清空')
}

const handleCopy = () => {
  if (!result.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }

  navigator.clipboard.writeText(result.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const handleDownloadResult = () => {
  if (!result.value) {
    ElMessage.warning('没有可下载的内容')
    return
  }

  const blob = new Blob([result.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `base64-${mode.value}-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}
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

.base64-converter {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.converter-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
}

.text-input-section,
.file-input-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.file-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  min-height: 200px;
  background-color: var(--color-bg);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.file-drop-zone:hover,
.file-drop-zone--dragover {
  border-color: var(--neon-cyan);
  background-color: rgba(33, 230, 255, 0.05);
}

.file-drop-icon {
  font-size: 3em;
  color: var(--color-muted);
}

.file-drop-text {
  font-size: var(--font-size-base);
  color: var(--color-muted);
  text-align: center;
}

.file-input-hidden {
  display: none;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
}

.file-info__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
}

.file-info__item label {
  color: var(--color-muted);
  font-weight: var(--font-weight-medium);
}

.file-info__item span {
  color: var(--neon-cyan);
  font-family: var(--font-family-mono);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  min-height: 300px;
  color: var(--color-muted);
}

.empty-state-icon {
  font-size: 3em;
  opacity: 0.5;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: var(--border-width-thin) solid var(--color-border);
}

.result-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.result-size {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  font-family: var(--font-family-mono);
}

.result-output {
  margin: 0;
  padding: var(--spacing-md);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  max-height: 400px;
  overflow: auto;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--neon-lime);
  word-break: break-all;
  white-space: pre-wrap;
}

.result-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

@media (max-width: 1024px) {
  .base64-converter {
    grid-template-columns: 1fr;
  }
}

/* 🔧 固定高度确保滚动 */
.textarea-wrapper {
  height: 350px;
  overflow: hidden;
}

.textarea-wrapper :deep(textarea) {
  height: 100% !important;
  min-height: 350px !important;
}
</style>

