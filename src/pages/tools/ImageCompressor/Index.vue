<template>
  <div class="image-compressor-page">
    <Header 
      title="图片压缩" 
      description="在线压缩 JPG/PNG/WebP 图片，减小文件大小" 
      icon="i-mdi-image-size-select-actual"
    />

    <div class="compressor-content">
      <!-- 上传区域 -->
      <NeonCard title="上传图片" class="upload-card" compact>
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
            accept="image/jpeg,image/png,image/webp"
            multiple
            style="display: none"
            @change="handleFileSelect"
          />
          <i class="i-mdi-cloud-upload upload-icon" />
          <div class="upload-text">
            <p class="primary">点击或拖拽图片到此处</p>
            <p class="secondary">支持 JPG、PNG、WebP 格式</p>
          </div>
        </div>
      </NeonCard>

      <!-- 压缩设置 -->
      <NeonCard v-if="images.length > 0" title="压缩设置" class="settings-card" compact>
        <div class="settings-grid">
          <!-- 质量设置 -->
          <div class="setting-item">
            <label>图片质量</label>
            <div class="quality-control">
              <el-slider 
                v-model="quality" 
                :min="10" 
                :max="100" 
                :step="5"
                show-input
                :show-input-controls="false"
              />
              <span class="quality-label">{{ quality }}%</span>
            </div>
            <div class="quality-presets">
              <NeonButton size="small" @click="quality = 30">低质量</NeonButton>
              <NeonButton size="small" @click="quality = 60">中质量</NeonButton>
              <NeonButton size="small" @click="quality = 80">高质量</NeonButton>
              <NeonButton size="small" @click="quality = 95">极高质量</NeonButton>
            </div>
          </div>

          <!-- 输出格式 -->
          <div class="setting-item">
            <label>输出格式</label>
            <el-radio-group v-model="outputFormat">
              <el-radio-button value="same">保持原格式</el-radio-button>
              <el-radio-button value="jpeg">JPEG</el-radio-button>
              <el-radio-button value="png">PNG</el-radio-button>
              <el-radio-button value="webp">WebP</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 操作按钮 -->
          <div class="setting-actions">
            <NeonButton @click="compressAll" :loading="isCompressing">
              <i class="i-mdi-compress" />
              压缩全部 ({{ images.length }})
            </NeonButton>
            <NeonButton @click="downloadAll" :disabled="compressedImages.length === 0">
              <i class="i-mdi-download" />
              下载全部
            </NeonButton>
            <NeonButton @click="clearAll">
              <i class="i-mdi-delete" />
              清空
            </NeonButton>
          </div>
        </div>
      </NeonCard>

      <!-- 图片列表 -->
      <NeonCard v-if="images.length > 0" title="图片列表" class="images-card" compact>
        <div class="images-list">
          <div 
            v-for="(image, index) in images" 
            :key="image.id"
            class="image-item"
          >
            <!-- 预览图 -->
            <div class="image-preview">
              <img :src="image.preview" :alt="image.name" />
            </div>

            <!-- 图片信息 -->
            <div class="image-info">
              <div class="image-name" :title="image.name">
                {{ image.name }}
              </div>
              <div class="image-meta">
                <span>{{ image.width }} × {{ image.height }}</span>
                <span>{{ formatFileSize(image.size) }}</span>
              </div>
              
              <!-- 压缩结果 -->
              <div v-if="image.compressed" class="compress-result">
                <div class="result-row">
                  <span class="label">压缩后:</span>
                  <span class="value">{{ formatFileSize(image.compressedSize) }}</span>
                </div>
                <div class="result-row">
                  <span class="label">压缩率:</span>
                  <span class="value success">
                    {{ ((1 - image.compressedSize / image.size) * 100).toFixed(1) }}%
                  </span>
                </div>
              </div>

              <!-- 压缩状态 -->
              <div v-if="image.compressing" class="compress-status">
                <el-progress :percentage="100" :indeterminate="true" />
                <span>压缩中...</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="image-actions">
              <NeonButton 
                v-if="!image.compressed"
                size="small" 
                @click="compressImage(index)"
                :loading="image.compressing"
              >
                <i class="i-mdi-compress" />
                压缩
              </NeonButton>
              <NeonButton 
                v-if="image.compressed"
                size="small" 
                @click="downloadImage(index)"
              >
                <i class="i-mdi-download" />
                下载
              </NeonButton>
              <NeonButton 
                size="small" 
                @click="removeImage(index)"
              >
                <i class="i-mdi-delete" />
                删除
              </NeonButton>
            </div>
          </div>
        </div>
      </NeonCard>

      <!-- 空状态 -->
      <EmptyState 
        v-if="images.length === 0"
        icon="i-mdi-image-outline"
        title="还没有上传图片"
        description="点击上方上传区域或拖拽图片文件到此处"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import EmptyState from '@/components/EmptyState.vue'

interface ImageItem {
  id: string
  file: File
  name: string
  preview: string
  width: number
  height: number
  size: number
  compressing: boolean
  compressed: boolean
  compressedBlob?: Blob
  compressedSize?: number
}

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const images = ref<ImageItem[]>([])
const quality = ref(80)
const outputFormat = ref<'same' | 'jpeg' | 'png' | 'webp'>('same')
const isCompressing = ref(false)

const compressedImages = computed(() => images.value.filter(img => img.compressed))

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    handleFiles(Array.from(target.files))
  }
}

// 处理拖拽
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files))
  }
}

// 处理文件
const handleFiles = async (files: File[]) => {
  const imageFiles = files.filter(file => 
    file.type === 'image/jpeg' || 
    file.type === 'image/png' || 
    file.type === 'image/webp'
  )

  if (imageFiles.length === 0) {
    ElMessage.warning('请选择 JPG、PNG 或 WebP 格式的图片')
    return
  }

  for (const file of imageFiles) {
    await addImage(file)
  }
}

// 添加图片
const addImage = async (file: File): Promise<void> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        images.value.push({
          id: Date.now().toString() + Math.random(),
          file,
          name: file.name,
          preview: e.target?.result as string,
          width: img.width,
          height: img.height,
          size: file.size,
          compressing: false,
          compressed: false,
        })
        resolve()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// 压缩单张图片
const compressImage = async (index: number) => {
  const image = images.value[index]
  if (!image || image.compressing) return

  image.compressing = true

  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建 Canvas 上下文')

    const img = new Image()
    img.src = image.preview

    await new Promise((resolve) => {
      img.onload = resolve
    })

    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(img, 0, 0)

    // 确定输出格式
    let mimeType = image.file.type
    if (outputFormat.value !== 'same') {
      mimeType = `image/${outputFormat.value}`
    }

    // 压缩
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('压缩失败'))
        },
        mimeType,
        quality.value / 100
      )
    })

    image.compressedBlob = blob
    image.compressedSize = blob.size
    image.compressed = true
    image.compressing = false

    ElMessage.success(`${image.name} 压缩完成`)
  } catch (error) {
    console.error('压缩失败:', error)
    ElMessage.error(`${image.name} 压缩失败`)
    image.compressing = false
  }
}

// 压缩全部
const compressAll = async () => {
  isCompressing.value = true
  for (let i = 0; i < images.value.length; i++) {
    if (!images.value[i].compressed) {
      await compressImage(i)
    }
  }
  isCompressing.value = false
  ElMessage.success('全部图片压缩完成')
}

// 下载单张图片
const downloadImage = (index: number) => {
  const image = images.value[index]
  if (!image.compressedBlob) return

  const url = URL.createObjectURL(image.compressedBlob)
  const a = document.createElement('a')
  a.href = url
  
  // 获取文件扩展名
  let extension = image.name.split('.').pop() || 'jpg'
  if (outputFormat.value !== 'same') {
    extension = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  }
  
  const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '')
  a.download = `${nameWithoutExt}_compressed.${extension}`
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('图片下载成功')
}

// 下载全部
const downloadAll = () => {
  compressedImages.value.forEach((_, index) => {
    const originalIndex = images.value.findIndex(img => img.compressed)
    if (originalIndex !== -1) {
      setTimeout(() => downloadImage(originalIndex), index * 100)
    }
  })
}

// 删除图片
const removeImage = (index: number) => {
  images.value.splice(index, 1)
}

// 清空全部
const clearAll = () => {
  images.value = []
  ElMessage.info('已清空所有图片')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.image-compressor-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.compressor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

/* 自定义滚动条 */
.compressor-content::-webkit-scrollbar {
  width: 8px;
}

.compressor-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.compressor-content::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
}

.compressor-content::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

/* ========== 上传区域 ========== */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  min-height: 200px;
  padding: var(--spacing-xl);
  border: 2px dashed var(--color-border-light);
  border-radius: var(--radius-lg);
  background: rgba(33, 230, 255, 0.03);
  cursor: pointer;
  transition: all var(--transition-base);
}

.upload-area:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.08);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2);
}

.upload-area.drag-over {
  border-color: var(--neon-cyan-light);
  background: rgba(33, 230, 255, 0.15);
  box-shadow: 0 0 30px rgba(33, 230, 255, 0.3);
}

.upload-icon {
  font-size: 4em;
  color: var(--neon-cyan);
  filter: drop-shadow(0 0 10px var(--neon-cyan));
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

/* ========== 压缩设置 ========== */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-item label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.quality-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.quality-control :deep(.el-slider) {
  flex: 1;
}

.quality-label {
  min-width: 50px;
  text-align: right;
  font-weight: var(--font-weight-semibold);
  color: var(--neon-cyan);
}

.quality-presets {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.setting-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* ========== 图片列表 ========== */
.images-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.image-item {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: rgba(33, 230, 255, 0.03);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.image-item:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.08);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.2);
}

.image-preview {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-width: 0;
}

.image-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-meta {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.compress-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: rgba(33, 230, 255, 0.05);
  border-radius: var(--radius-sm);
}

.result-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.result-row .label {
  color: var(--color-text-secondary);
}

.result-row .value {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.result-row .value.success {
  color: var(--neon-lime);
}

.compress-status {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.compress-status span {
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .compressor-content {
    padding-right: 0;
  }

  .upload-card,
  .settings-card,
  .images-card {
    margin: 0;
  }

  .image-item {
    flex-direction: column;
  }

  .image-preview {
    width: 100%;
    height: 200px;
  }

  .image-actions {
    flex-direction: row;
  }

  .setting-actions {
    flex-direction: column;
  }

  .quality-presets {
    flex-direction: column;
  }
}
</style>

