<template>
  <div class="base64-image-tool">
    <div class="tool-header">
      <h2 class="tool-title">
        <i class="i-mdi-image-filter-center-focus" />
        Base64 图片转换
      </h2>
      <p class="tool-description">
        图片与 Base64 互转，支持拖拽上传和直接下载
      </p>
    </div>

    <div class="tool-content">
      <!-- 转换方向选择 -->
      <div class="conversion-tabs">
        <button
          :class="['tab-button', { active: mode === 'toBase64' }]"
          @click="mode = 'toBase64'"
        >
          <i class="i-mdi-image-arrow-right" />
          图片 → Base64
        </button>
        <button
          :class="['tab-button', { active: mode === 'toImage' }]"
          @click="mode = 'toImage'"
        >
          <i class="i-mdi-image-arrow-left" />
          Base64 → 图片
        </button>
      </div>

      <!-- 图片转 Base64 -->
      <div v-show="mode === 'toBase64'" class="conversion-panel">
        <div class="upload-section">
          <div
            class="upload-area"
            :class="{ dragging: isDragging }"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @click="triggerFileInput"
          >
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileSelect"
            />
            <div v-if="!uploadedImage" class="upload-prompt">
              <i class="i-mdi-cloud-upload-outline upload-icon" />
              <p class="upload-text">拖拽图片到此处或点击上传</p>
              <p class="upload-hint">支持 JPG、PNG、GIF、WebP 等格式</p>
            </div>
            <div v-else class="image-preview">
              <img :src="uploadedImage" alt="预览" />
              <div class="image-info">
                <span>{{ imageFileName }}</span>
                <span>{{ imageFileSize }}</span>
              </div>
              <button class="clear-button" @click.stop="clearImage">
                <i class="i-mdi-close" />
              </button>
            </div>
          </div>
        </div>

        <div v-if="base64Output" class="output-section">
          <div class="output-header">
            <h3 class="output-title">Base64 结果</h3>
            <div class="output-actions">
              <button class="action-button" @click="copyBase64">
                <i class="i-mdi-content-copy" />
                复制
              </button>
              <button class="action-button" @click="downloadBase64">
                <i class="i-mdi-download" />
                下载
              </button>
            </div>
          </div>
          <div class="output-content">
            <textarea
              v-model="base64Output"
              class="base64-textarea"
              readonly
              placeholder="Base64 编码结果将显示在这里..."
            />
          </div>
          <div class="output-info">
            <span>长度: {{ base64Output.length }} 字符</span>
            <span>大小: {{ formatSize(base64Output.length) }}</span>
          </div>
        </div>
      </div>

      <!-- Base64 转图片 -->
      <div v-show="mode === 'toImage'" class="conversion-panel">
        <div class="input-section">
          <div class="input-header">
            <h3 class="input-title">输入 Base64</h3>
            <div class="input-actions">
              <button class="action-button" @click="pasteBase64">
                <i class="i-mdi-content-paste" />
                粘贴
              </button>
              <button class="action-button" @click="clearBase64Input">
                <i class="i-mdi-delete-outline" />
                清空
              </button>
            </div>
          </div>
          <textarea
            v-model="base64Input"
            class="base64-textarea base64-input-textarea"
            placeholder="粘贴 Base64 编码（支持带或不带 data:image/...;base64, 前缀）"
            @input="handleBase64Input"
          />
        </div>

        <div v-if="decodedImage" class="result-section">
          <div class="result-header">
            <h3 class="result-title">图片预览</h3>
            <div class="result-actions">
              <button class="action-button primary" @click="downloadImage">
                <i class="i-mdi-download" />
                下载图片
              </button>
            </div>
          </div>
          <div class="result-preview">
            <img :src="decodedImage" alt="解码结果" />
          </div>
          <div class="result-info">
            <span>格式: {{ imageFormat || '未知' }}</span>
            <span>大小: {{ formatSize(base64Input.length) }}</span>
          </div>
        </div>

        <div v-if="decodeError" class="error-message">
          <i class="i-mdi-alert-circle-outline" />
          {{ decodeError }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

type Mode = 'toBase64' | 'toImage'

const mode = ref<Mode>('toBase64')
const isDragging = ref(false)
const uploadedImage = ref<string>('')
const imageFileName = ref<string>('')
const imageFileSize = ref<string>('')
const base64Output = ref<string>('')
const base64Input = ref<string>('')
const decodedImage = ref<string>('')
const decodeError = ref<string>('')
const imageFormat = ref<string>('')

const fileInputRef = ref<HTMLInputElement | null>(null)

// 触发文件选择
function triggerFileInput() {
  fileInputRef.value?.click()
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
}

// 处理拖拽上传
function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    if (file.type.startsWith('image/')) {
      processImageFile(file)
    } else {
      ElMessage.error('请上传图片文件')
    }
  }
}

// 处理图片文件
function processImageFile(file: File) {
  imageFileName.value = file.name
  imageFileSize.value = formatSize(file.size)

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    uploadedImage.value = result
    base64Output.value = result
  }
  reader.onerror = () => {
    ElMessage.error('图片读取失败')
  }
  reader.readAsDataURL(file)
}

// 清除图片
function clearImage() {
  uploadedImage.value = ''
  base64Output.value = ''
  imageFileName.value = ''
  imageFileSize.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// 复制 Base64
async function copyBase64() {
  try {
    await navigator.clipboard.writeText(base64Output.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 下载 Base64 文本
function downloadBase64() {
  const blob = new Blob([base64Output.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `base64-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('下载成功')
}

// 粘贴 Base64
async function pasteBase64() {
  try {
    const text = await navigator.clipboard.readText()
    base64Input.value = text
    handleBase64Input()
  } catch (error) {
    ElMessage.error('粘贴失败，请手动输入')
  }
}

// 清空 Base64 输入
function clearBase64Input() {
  base64Input.value = ''
  decodedImage.value = ''
  decodeError.value = ''
  imageFormat.value = ''
}

// 处理 Base64 输入
function handleBase64Input() {
  decodeError.value = ''
  decodedImage.value = ''
  imageFormat.value = ''

  if (!base64Input.value.trim()) {
    return
  }

  try {
    let base64Data = base64Input.value.trim()

    // 检测并提取图片格式
    const dataUrlMatch = base64Data.match(/^data:image\/(\w+);base64,/)
    if (dataUrlMatch) {
      imageFormat.value = dataUrlMatch[1].toUpperCase()
    } else {
      // 尝试从 Base64 数据头部检测格式
      const formatDetected = detectImageFormat(base64Data)
      if (formatDetected) {
        imageFormat.value = formatDetected
        // 自动添加 data URL 前缀
        base64Data = `data:image/${formatDetected.toLowerCase()};base64,${base64Data}`
        base64Input.value = base64Data
      } else {
        // 默认使用 PNG
        imageFormat.value = 'PNG'
        base64Data = `data:image/png;base64,${base64Data}`
        base64Input.value = base64Data
      }
    }

    // 验证 Base64 格式
    const base64Part = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data
    if (!isValidBase64(base64Part)) {
      decodeError.value = 'Base64 格式无效'
      return
    }

    // 显示图片
    decodedImage.value = base64Data

    // 测试图片是否能加载
    const img = new Image()
    img.onload = () => {
      ElMessage.success('图片解码成功')
    }
    img.onerror = () => {
      decodeError.value = '图片数据无效或已损坏'
      decodedImage.value = ''
    }
    img.src = base64Data
  } catch (error) {
    decodeError.value = '解码失败，请检查 Base64 格式'
  }
}

// 检测图片格式
function detectImageFormat(base64: string): string | null {
  try {
    // 移除可能的空格和换行
    const cleanBase64 = base64.replace(/\s/g, '')
    // 解码前几个字节来检测文件签名
    const binaryString = atob(cleanBase64.substring(0, 20))
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // 检测常见图片格式的文件签名
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return 'JPEG'
    }
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return 'PNG'
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return 'GIF'
    }
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'WEBP'
    }
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return 'BMP'
    }
  } catch (error) {
    // 忽略检测错误
  }
  return null
}

// 验证 Base64 格式
function isValidBase64(str: string): boolean {
  try {
    const cleanStr = str.replace(/\s/g, '')
    return /^[A-Za-z0-9+/]*={0,2}$/.test(cleanStr)
  } catch (error) {
    return false
  }
}

// 下载图片
function downloadImage() {
  if (!decodedImage.value) {
    ElMessage.error('没有可下载的图片')
    return
  }

  const link = document.createElement('a')
  link.href = decodedImage.value
  const ext = imageFormat.value.toLowerCase()
  link.download = `image-${Date.now()}.${ext}`
  link.click()
  ElMessage.success('下载成功')
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.base64-image-tool {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-lg);
}

/* ========== 工具头部 ========== */
.tool-header {
  flex-shrink: 0;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  text-shadow: var(--text-glow-cyan);
}

.tool-title i {
  font-size: 1.2em;
}

.tool-description {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

/* ========== 工具内容 ========== */
.tool-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* ========== 转换标签页 ========== */
.conversion-tabs {
  display: flex;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  background-color: rgba(33, 230, 255, 0.08) !important;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.tab-button:hover {
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.3);
}

.tab-button.active {
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.15) 0%, rgba(33, 230, 255, 0.05) 100%);
  border-color: var(--neon-cyan);
  color: var(--neon-cyan);
  box-shadow: inset 0 0 20px rgba(33, 230, 255, 0.2), 0 0 15px rgba(33, 230, 255, 0.3);
}

.tab-button i {
  font-size: 1.3em;
}

/* ========== 转换面板 ========== */
.conversion-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

/* 自定义滚动条 */
.conversion-panel::-webkit-scrollbar {
  width: 8px;
}

.conversion-panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.conversion-panel::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.conversion-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

/* ========== 上传区域 ========== */
.upload-section {
  flex-shrink: 0;
}

.upload-area {
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-panel);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.upload-area:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.upload-area.dragging {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  box-shadow: inset 0 0 30px rgba(33, 230, 255, 0.2);
}

.upload-prompt {
  text-align: center;
  padding: var(--spacing-xl);
}

.upload-icon {
  font-size: 4em;
  color: var(--neon-cyan);
  margin-bottom: var(--spacing-lg);
  filter: drop-shadow(0 0 10px rgba(33, 230, 255, 0.5));
}

.upload-text {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.upload-hint {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* ========== 图片预览 ========== */
.image-preview {
  position: relative;
  width: 100%;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  min-height: 200px;
}

.image-preview img {
  max-width: 100%;
  max-height: 400px;
  min-height: 100px;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

.image-info {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.clear-button {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 51, 102, 0.9);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.clear-button:hover {
  background: rgba(255, 51, 102, 1);
  box-shadow: 0 0 15px rgba(255, 51, 102, 0.5);
  transform: scale(1.1);
}

/* ========== 输出/输入区域 ========== */
.output-section,
.input-section,
.result-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.output-header,
.input-header,
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-title,
.input-title,
.result-title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--neon-cyan);
}

.output-actions,
.input-actions,
.result-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  background: rgba(33, 230, 255, 0.15);
  border: 1px solid rgba(33, 230, 255, 0.3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.action-button:hover {
  background: rgba(33, 230, 255, 0.25);
  border-color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.3);
}

.action-button.primary {
  background: linear-gradient(135deg, var(--neon-cyan) 0%, rgba(33, 230, 255, 0.8) 100%);
  border-color: var(--neon-cyan);
  color: var(--color-bg);
  font-weight: var(--font-weight-semibold);
}

.action-button.primary:hover {
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.5);
  transform: translateY(-1px);
}

.base64-textarea {
  width: 100%;
  min-height: 200px;
  padding: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  transition: all var(--transition-base) var(--transition-timing);
}

.base64-textarea:focus {
  outline: none;
  border-color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.2);
}

.base64-textarea::-webkit-scrollbar {
  width: 8px;
}

.base64-textarea::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.base64-textarea::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
}

.base64-textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.output-info,
.result-info {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* ========== 结果预览 ========== */
.result-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  padding: var(--spacing-lg);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.result-preview img {
  max-width: 100%;
  max-height: 500px;
  min-height: 100px;
  object-fit: contain;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.05);
}

/* ========== 错误消息 ========== */
.error-message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(255, 51, 102, 0.1);
  border: 1px solid rgba(255, 51, 102, 0.3);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  font-size: var(--font-size-sm);
}

.error-message i {
  font-size: 1.3em;
}
</style>

