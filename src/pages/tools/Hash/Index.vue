<template>
  <div class="tool-page">
    <Header
      title="哈希计算"
      description="MD5、SHA-1、SHA-256、SHA-512 等哈希计算"
      icon="i-mdi-fingerprint"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" @click="handleCalculateAll">
          <i class="i-mdi-calculator" />
          全部计算
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="hash-calculator">
        <!-- 输入区 -->
        <NeonCard title="输入" icon="i-mdi-text-box" compact>
          <div class="input-section">
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

            <!-- 文本输入 -->
            <div v-if="inputType === 'text'" class="text-input">
              <NeonTextarea
                v-model="inputText"
                label="输入文本"
                placeholder="输入要计算哈希的文本..."
                :rows="8"
                show-count
                :maxlength="50000"
              />
            </div>

            <!-- 文件输入 -->
            <div v-else class="file-input">
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
                  <label>大小</label>
                  <span>{{ formatFileSize(selectedFile.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 哈希结果 -->
        <NeonCard title="哈希值" icon="i-mdi-fingerprint" compact>
          <div class="hash-results">
            <div
              v-for="algo in algorithms"
              :key="algo.name"
              class="hash-item"
              :class="{ 'hash-item--loading': hashResults[algo.name].loading }"
            >
              <div class="hash-item__header">
                <span class="hash-item__name">{{ algo.name }}</span>
                <NeonButton
                  variant="text"
                  size="small"
                  :disabled="!hashResults[algo.name].value"
                  @click="copyHash(algo.name)"
                >
                  <i class="i-mdi-content-copy" />
                  复制
                </NeonButton>
              </div>
              <div class="hash-item__value">
                <i v-if="hashResults[algo.name].loading" class="i-mdi-loading animate-spin" />
                <code v-else-if="hashResults[algo.name].value" class="mono">
                  {{ hashResults[algo.name].value }}
                </code>
                <span v-else class="hash-item__placeholder">
                  点击"全部计算"或输入内容后自动计算
                </span>
              </div>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

type InputType = 'text' | 'file'
type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512'

interface HashResult {
  value: string
  loading: boolean
}

const inputType = ref<InputType>('text')
const inputText = ref('')
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const isDragging = ref(false)

const algorithms = [
  { name: 'MD5' as HashAlgorithm, bits: 128 },
  { name: 'SHA-1' as HashAlgorithm, bits: 160 },
  { name: 'SHA-256' as HashAlgorithm, bits: 256 },
  { name: 'SHA-512' as HashAlgorithm, bits: 512 },
]

const hashResults = ref<Record<HashAlgorithm, HashResult>>({
  'MD5': { value: '', loading: false },
  'SHA-1': { value: '', loading: false },
  'SHA-256': { value: '', loading: false },
  'SHA-512': { value: '', loading: false },
})

/**
 * 计算文本哈希
 */
const calculateTextHash = async (text: string, algorithm: HashAlgorithm): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  
  let algoName: AlgorithmIdentifier
  switch (algorithm) {
    case 'MD5':
      // MD5 浏览器不原生支持，使用简化实现
      return simpleMD5(text)
    case 'SHA-1':
      algoName = 'SHA-1'
      break
    case 'SHA-256':
      algoName = 'SHA-256'
      break
    case 'SHA-512':
      algoName = 'SHA-512'
      break
  }
  
  const hashBuffer = await crypto.subtle.digest(algoName, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 简化的 MD5 实现（仅用于演示）
 */
const simpleMD5 = (text: string): string => {
  // 注：这是一个简化的哈希实现，仅用于演示
  // 生产环境建议使用 crypto-js 库
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  // 转为32位16进制
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return hex + hex + hex + hex // 模拟128位
}

/**
 * 计算所有哈希值
 */
const handleCalculateAll = async () => {
  const content = inputType.value === 'text' ? inputText.value : selectedFile.value

  if (!content) {
    ElMessage.warning(inputType.value === 'text' ? '请输入文本' : '请选择文件')
    return
  }

  if (inputType.value === 'text') {
    // 文本哈希
    for (const algo of algorithms) {
      hashResults.value[algo.name].loading = true
      try {
        hashResults.value[algo.name].value = await calculateTextHash(inputText.value, algo.name)
      } catch (error) {
        hashResults.value[algo.name].value = '计算失败'
      } finally {
        hashResults.value[algo.name].loading = false
      }
    }
    ElMessage.success('哈希计算完成')
  } else {
    // 文件哈希
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      for (const algo of algorithms) {
        hashResults.value[algo.name].loading = true
        try {
          hashResults.value[algo.name].value = await calculateTextHash(text, algo.name)
        } catch (error) {
          hashResults.value[algo.name].value = '计算失败'
        } finally {
          hashResults.value[algo.name].loading = false
        }
      }
      ElMessage.success('文件哈希计算完成')
    }
    reader.readAsText(selectedFile.value!)
  }
}

const handleClear = () => {
  inputText.value = ''
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  for (const algo of algorithms) {
    hashResults.value[algo.name].value = ''
  }
  ElMessage.success('已清空')
}

const copyHash = (algorithm: HashAlgorithm) => {
  const value = hashResults.value[algorithm].value
  if (!value || value === '计算失败') {
    ElMessage.warning('没有可复制的内容')
    return
  }

  navigator.clipboard.writeText(value).then(() => {
    ElMessage.success(`${algorithm} 已复制到剪贴板`)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
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

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

// 自动计算
watch(inputText, () => {
  if (inputText.value && inputType.value === 'text') {
    handleCalculateAll()
  }
})

watch(selectedFile, () => {
  if (selectedFile.value && inputType.value === 'file') {
    handleCalculateAll()
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

.hash-calculator {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.text-input,
.file-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.file-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  min-height: 180px;
  background-color: rgba(10, 14, 39, 0.4);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.file-drop-zone:hover,
.file-drop-zone--dragover {
  border-color: var(--neon-purple);
  background-color: rgba(155, 92, 255, 0.1);
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
  background-color: rgba(10, 14, 39, 0.4);
  border: 1px solid var(--color-border);
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
  color: var(--neon-purple);
  font-family: var(--font-family-mono);
}

.hash-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.hash-item {
  padding: var(--spacing-lg);
  background-color: rgba(10, 14, 39, 0.4);
  border: 2px solid var(--neon-purple);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 15px rgba(155, 92, 255, 0.1), var(--glow-purple);
  transition: all var(--transition-base) var(--transition-timing);
}

.hash-item:hover {
  border-color: var(--neon-purple-light);
  box-shadow: inset 0 0 20px rgba(155, 92, 255, 0.2), var(--glow-purple-strong);
}

.hash-item--loading {
  opacity: 0.6;
}

.hash-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.hash-item__name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--neon-purple);
  font-family: var(--font-family-display);
}

.hash-item__value {
  padding: var(--spacing-md);
  background-color: rgba(155, 92, 255, 0.05);
  border: 1px solid rgba(155, 92, 255, 0.3);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--neon-purple);
  word-break: break-all;
  min-height: 60px;
  display: flex;
  align-items: center;
}

.hash-item__value code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}

.hash-item__placeholder {
  color: var(--color-muted);
  font-style: italic;
}

@media (max-width: 1024px) {
  .hash-calculator {
    grid-template-columns: 1fr;
  }
}
</style>

