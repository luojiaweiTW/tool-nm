<template>
  <div class="file-hash-page">
    <Header 
      title="文件哈希校验" 
      description="计算文件 MD5、SHA-1、SHA-256、SHA-512 哈希值" 
      icon="i-mdi-shield-check"
    />

    <div class="hash-content">
      <!-- 上传区域 -->
      <NeonCard title="选择文件" class="upload-card" compact>
        <div 
          class="upload-area"
          :class="{ 'drag-over': isDragging }"
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            style="display: none"
            @change="handleFileSelect"
          />
          <i class="i-mdi-file-document-check upload-icon" />
          <div class="upload-text">
            <p class="primary">点击或拖拽文件到此处</p>
            <p class="secondary">支持任意类型文件</p>
          </div>
        </div>

        <div v-if="currentFile" class="file-info">
          <div class="file-meta">
            <i class="i-mdi-file" />
            <div class="file-details">
              <div class="file-name" :title="currentFile.name">
                {{ currentFile.name }}
              </div>
              <div class="file-size">
                {{ formatFileSize(currentFile.size) }}
              </div>
            </div>
            <NeonButton size="small" @click="clearFile">
              <i class="i-mdi-close" />
              清除
            </NeonButton>
          </div>
        </div>
      </NeonCard>

      <!-- 哈希算法选择 -->
      <NeonCard v-if="currentFile" title="哈希算法" class="algorithm-card" compact>
        <div class="algorithm-grid">
          <el-checkbox-group v-model="selectedAlgorithms">
            <el-checkbox value="md5" label="MD5" />
            <el-checkbox value="sha1" label="SHA-1" />
            <el-checkbox value="sha256" label="SHA-256" />
            <el-checkbox value="sha512" label="SHA-512" />
          </el-checkbox-group>
          
          <NeonButton 
            @click="calculateHash" 
            :loading="isCalculating"
            :disabled="selectedAlgorithms.length === 0"
          >
            <i class="i-mdi-calculator" />
            计算哈希值
          </NeonButton>
        </div>
      </NeonCard>

      <!-- 哈希结果 -->
      <NeonCard v-if="hashResults.length > 0" title="哈希值" class="results-card" compact>
        <div class="hash-results">
          <div 
            v-for="result in hashResults" 
            :key="result.algorithm"
            class="hash-result-item"
          >
            <div class="hash-algorithm">
              {{ result.algorithm.toUpperCase() }}
            </div>
            <div class="hash-value-wrapper">
              <div class="hash-value" :title="result.hash">
                {{ result.hash }}
              </div>
              <div class="hash-actions">
                <NeonButton size="small" @click="copyHash(result.hash)">
                  <i class="i-mdi-content-copy" />
                  复制
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      </NeonCard>

      <!-- 哈希值对比 -->
      <NeonCard v-if="hashResults.length > 0" title="哈希值对比" class="compare-card" compact>
        <div class="compare-section">
          <el-input
            v-model="compareHash"
            placeholder="输入要对比的哈希值"
            clearable
            @input="handleCompare"
          >
            <template #prefix>
              <i class="i-mdi-compare" />
            </template>
          </el-input>

          <div v-if="compareHash && compareResult !== null" class="compare-result">
            <div v-if="compareResult" class="compare-success">
              <i class="i-mdi-check-circle" />
              <span>哈希值匹配！文件完整无篡改</span>
            </div>
            <div v-else class="compare-error">
              <i class="i-mdi-alert-circle" />
              <span>哈希值不匹配！文件可能已被篡改</span>
            </div>
          </div>
        </div>
      </NeonCard>

      <!-- 空状态 -->
      <EmptyState 
        v-if="!currentFile"
        icon="i-mdi-shield-lock-outline"
        title="还没有选择文件"
        description="点击上方上传区域或拖拽文件到此处进行哈希校验"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import EmptyState from '@/components/EmptyState.vue'

interface HashResult {
  algorithm: string
  hash: string
}

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const currentFile = ref<File | null>(null)
const selectedAlgorithms = ref<string[]>(['md5', 'sha256'])
const isCalculating = ref(false)
const hashResults = ref<HashResult[]>([])
const compareHash = ref('')
const compareResult = ref<boolean | null>(null)

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    loadFile(target.files[0])
  }
}

// 处理拖拽
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    loadFile(event.dataTransfer.files[0])
  }
}

// 加载文件
const loadFile = (file: File) => {
  currentFile.value = file
  hashResults.value = []
  compareHash.value = ''
  compareResult.value = null
  ElMessage.success('文件加载成功')
}

// 清除文件
const clearFile = () => {
  currentFile.value = null
  hashResults.value = []
  compareHash.value = ''
  compareResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  ElMessage.info('已清除文件')
}

// 读取文件为 ArrayBuffer
const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 读取文件为 WordArray (for crypto-js)
const readFileAsWordArray = (file: File): Promise<CryptoJS.lib.WordArray> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer) as any)
      resolve(wordArray)
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// 计算哈希值
const calculateHash = async () => {
  if (!currentFile.value) return

  isCalculating.value = true
  hashResults.value = []

  try {
    const file = currentFile.value
    const results: HashResult[] = []

    for (const algorithm of selectedAlgorithms.value) {
      let hash = ''

      if (algorithm === 'md5') {
        const wordArray = await readFileAsWordArray(file)
        hash = CryptoJS.MD5(wordArray).toString()
      } else if (algorithm === 'sha1') {
        const wordArray = await readFileAsWordArray(file)
        hash = CryptoJS.SHA1(wordArray).toString()
      } else if (algorithm === 'sha256') {
        const wordArray = await readFileAsWordArray(file)
        hash = CryptoJS.SHA256(wordArray).toString()
      } else if (algorithm === 'sha512') {
        const wordArray = await readFileAsWordArray(file)
        hash = CryptoJS.SHA512(wordArray).toString()
      }

      results.push({ algorithm, hash })
    }

    hashResults.value = results
    ElMessage.success('哈希值计算完成')
  } catch (error) {
    console.error('计算哈希失败:', error)
    ElMessage.error('计算哈希失败')
  } finally {
    isCalculating.value = false
  }
}

// 复制哈希值
const copyHash = async (hash: string) => {
  try {
    await navigator.clipboard.writeText(hash)
    ElMessage.success('哈希值已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 对比哈希值
const handleCompare = () => {
  if (!compareHash.value) {
    compareResult.value = null
    return
  }

  const inputHash = compareHash.value.trim().toLowerCase().replace(/[:\s-]/g, '')
  
  compareResult.value = hashResults.value.some(result => 
    result.hash.toLowerCase() === inputHash
  )
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.file-hash-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.hash-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

/* 自定义滚动条 */
.hash-content::-webkit-scrollbar {
  width: 8px;
}

.hash-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.hash-content::-webkit-scrollbar-thumb {
  background: rgba(208, 255, 0, 0.5);
  border-radius: 4px;
}

.hash-content::-webkit-scrollbar-thumb:hover {
  background: rgba(208, 255, 0, 0.8);
}

/* 上传区域 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  min-height: 180px;
  padding: var(--spacing-xl);
  border: 2px dashed var(--color-border-light);
  border-radius: var(--radius-lg);
  background: rgba(208, 255, 0, 0.03);
  cursor: pointer;
  transition: all var(--transition-base);
}

.upload-area:hover {
  border-color: var(--neon-lime);
  background: rgba(208, 255, 0, 0.08);
  box-shadow: 0 0 20px rgba(208, 255, 0, 0.2);
}

.upload-area.drag-over {
  border-color: var(--neon-lime-light);
  background: rgba(208, 255, 0, 0.15);
  box-shadow: 0 0 30px rgba(208, 255, 0, 0.3);
}

.upload-icon {
  font-size: 4em;
  color: var(--neon-lime);
  filter: drop-shadow(0 0 10px var(--neon-lime));
}

.upload-text {
  text-align: center;
}

.upload-text .primary {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.upload-text .secondary {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 文件信息 */
.file-info {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(208, 255, 0, 0.05);
  border-radius: var(--radius-md);
}

.file-meta > i {
  font-size: 2em;
  color: var(--neon-lime);
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

/* 算法选择 */
.algorithm-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 哈希结果 */
.hash-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.hash-result-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: rgba(208, 255, 0, 0.05);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
}

.hash-algorithm {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--neon-lime);
  text-transform: uppercase;
}

.hash-value-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.hash-value {
  flex: 1;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  word-break: break-all;
}

.hash-actions {
  flex-shrink: 0;
}

/* 对比区域 */
.compare-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.compare-result {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.compare-success {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(208, 255, 0, 0.1);
  border: 1px solid var(--neon-lime);
  border-radius: var(--radius-md);
  color: var(--neon-lime);
}

.compare-success i {
  font-size: 1.5em;
}

.compare-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
}

.compare-error i {
  font-size: 1.5em;
}

/* 响应式 */
@media (max-width: 768px) {
  .hash-content {
    padding-right: 0;
  }

  .hash-value {
    font-size: var(--font-size-xs);
  }

  .file-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>


