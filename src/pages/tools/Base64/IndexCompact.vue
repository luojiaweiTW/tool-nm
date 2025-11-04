<template>
  <div class="base64-compact">
    <!-- 顶部工具栏 -->
    <div class="formatter-toolbar">
      <div class="formatter-toolbar__left">
        <h2 class="formatter-title">
          <i class="i-mdi-file-code-outline" />
          <span>Base64 编解码</span>
        </h2>
        <span class="formatter-desc">文本与文件的 Base64 编码解码</span>
      </div>
      <div class="formatter-toolbar__right">
        <CompactButtonGroup size="sm">
          <CompactButton variant="default" size="sm" icon="i-mdi-broom" @click="handleClear">
            清空
          </CompactButton>
          <CompactButton variant="primary" size="sm" icon="i-mdi-content-copy" @click="handleCopy">
            复制
          </CompactButton>
        </CompactButtonGroup>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="formatter-content">
      <!-- 左侧：输入 -->
      <CompactCard title="输入">
        <template #actions>
          <CompactButtonGroup size="xs">
            <CompactButton
              v-for="m in modes"
              :key="m.value"
              :active="mode === m.value"
              size="xs"
              @click="mode = m.value"
            >
              {{ m.label }}
            </CompactButton>
          </CompactButtonGroup>

          <div class="toolbar-divider" />

          <CompactButtonGroup size="xs">
            <CompactButton
              v-for="type in inputTypes"
              :key="type.value"
              :active="inputType === type.value"
              size="xs"
              :icon="type.icon"
              @click="inputType = type.value"
            >
              {{ type.label }}
            </CompactButton>
          </CompactButtonGroup>
        </template>

        <!-- 文本输入模式 -->
        <div v-if="inputType === 'text'" class="editor-wrapper">
          <textarea
            v-model="textInput"
            class="compact-textarea"
            :placeholder="mode === 'encode' ? '输入要编码的文本...' : '输入要解码的 Base64...'"
            spellcheck="false"
          />
          <div class="editor-footer">
            <span class="char-count">{{ textInput.length }} 字符</span>
            <CompactButton
              variant="primary"
              size="sm"
              :icon="mode === 'encode' ? 'i-mdi-lock' : 'i-mdi-lock-open'"
              @click="handleTextConvert"
            >
              {{ mode === 'encode' ? '编码' : '解码' }}
            </CompactButton>
          </div>
        </div>

        <!-- 文件输入模式 -->
        <div v-else class="file-section">
          <div
            class="file-drop-compact"
            :class="{ 'file-drop-compact--dragover': isDragging }"
            @drop.prevent="handleFileDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @click="triggerFileSelect"
          >
            <i class="i-mdi-cloud-upload" />
            <p>拖放文件或点击选择</p>
            <input
              ref="fileInputRef"
              type="file"
              class="file-input-hidden"
              @change="handleFileSelect"
            />
          </div>

          <div v-if="selectedFile" class="file-info-compact">
            <div class="file-info-compact__item">
              <span class="label">文件名</span>
              <span class="value">{{ selectedFile.name }}</span>
            </div>
            <div class="file-info-compact__item">
              <span class="label">大小</span>
              <span class="value">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
            <div class="file-info-compact__item">
              <span class="label">类型</span>
              <span class="value">{{ selectedFile.type || '未知' }}</span>
            </div>
          </div>

          <CompactButton
            variant="primary"
            size="sm"
            :icon="mode === 'encode' ? 'i-mdi-lock' : 'i-mdi-lock-open'"
            :disabled="!selectedFile"
            style="width: 100%"
            @click="handleFileConvert"
          >
            {{ mode === 'encode' ? '编码文件' : '解码文件' }}
          </CompactButton>
        </div>
      </CompactCard>

      <!-- 右侧：结果 -->
      <CompactCard title="结果">
        <template #actions>
          <StatusTag v-if="result" type="success" icon="i-mdi-check-circle">
            {{ result.length }} 字符
          </StatusTag>
          <CompactButton
            v-if="result"
            size="xs"
            variant="success"
            icon="i-mdi-download"
            @click="handleDownloadResult"
          >
            下载
          </CompactButton>
        </template>

        <div class="editor-wrapper">
          <pre v-if="result" class="compact-output"><code>{{ result }}</code></pre>
          <div v-else class="empty-state-compact">
            <i class="i-mdi-information-outline" />
            <p>转换结果将显示在这里</p>
          </div>
        </div>
      </CompactCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import CompactCard from '@/components/CompactCard.vue'
import CompactButton from '@/components/CompactButton.vue'
import CompactButtonGroup from '@/components/CompactButtonGroup.vue'
import StatusTag from '@/components/StatusTag.vue'

type Mode = 'encode' | 'decode'
type InputType = 'text' | 'file'

const modes = [
  { value: 'encode' as Mode, label: '编码' },
  { value: 'decode' as Mode, label: '解码' }
]

const inputTypes = [
  { value: 'text' as InputType, label: '文本', icon: 'i-mdi-text' },
  { value: 'file' as InputType, label: '文件', icon: 'i-mdi-file' }
]

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
        const base64 = content.split(',')[1] || ''
        result.value = base64
        ElMessage.success('文件编码成功')
      } else {
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
.base64-compact {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(10, 10, 20, 0.9) 0%, rgba(20, 20, 40, 0.95) 100%);
}

/* 复用 JSON 格式化的工具栏样式 */
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

.formatter-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  min-height: 0;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 10px;
}

/* 文本域样式 */
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

.compact-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

/* 编辑器底部 */
.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.char-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Cascadia Code', monospace;
}

/* 文件区域 */
.file-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-drop-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border: 2px dashed rgba(33, 230, 255, 0.25);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  min-height: 140px;
}

.file-drop-compact:hover,
.file-drop-compact--dragover {
  border-color: rgba(33, 230, 255, 0.5);
  background: rgba(33, 230, 255, 0.05);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.1);
}

.file-drop-compact i {
  font-size: 32px;
  color: rgba(33, 230, 255, 0.6);
}

.file-drop-compact p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

.file-input-hidden {
  display: none;
}

/* 文件信息 */
.file-info-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(33, 230, 255, 0.15);
  border-radius: 4px;
}

.file-info-compact__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  gap: 12px;
}

.file-info-compact__item .label {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  white-space: nowrap;
}

.file-info-compact__item .value {
  color: var(--neon-blue);
  font-family: 'Cascadia Code', monospace;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 输出结果 */
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
  color: var(--neon-lime);
  white-space: pre-wrap;
  word-break: break-all;
}

.compact-output code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

/* 空状态 */
.empty-state-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state-compact i {
  font-size: 40px;
  opacity: 0.5;
}

.empty-state-compact p {
  font-size: 12px;
  margin: 0;
  font-style: italic;
}

/* 工具栏分隔线 */
.toolbar-divider {
  width: 1px;
  height: 16px;
  background: rgba(33, 230, 255, 0.2);
  flex-shrink: 0;
}

/* 滚动条 */
.compact-textarea::-webkit-scrollbar,
.compact-output::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.compact-textarea::-webkit-scrollbar-track,
.compact-output::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.compact-textarea::-webkit-scrollbar-thumb,
.compact-output::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.4);
  border-radius: 3px;
}

.compact-textarea::-webkit-scrollbar-thumb:hover,
.compact-output::-webkit-scrollbar-thumb:hover {
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
</style>




