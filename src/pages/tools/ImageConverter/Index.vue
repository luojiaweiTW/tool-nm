<template>
  <div class="image-converter-page">
    <Header 
      title="图片格式转换" 
      description="在线转换 JPG、PNG、WebP、GIF 图片格式" 
      icon="i-mdi-image-sync"
    />

    <div class="converter-content">
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
            accept="image/*"
            multiple
            style="display: none"
            @change="handleFileSelect"
          />
          <i class="i-mdi-file-swap upload-icon" />
          <div class="upload-text">
            <p class="primary">点击或拖拽图片到此处</p>
            <p class="secondary">支持 JPG、PNG、WebP、GIF 等常见格式</p>
          </div>
        </div>
      </NeonCard>

      <!-- 转换设置 -->
      <NeonCard v-if="images.length > 0" title="转换设置" class="settings-card" compact>
        <div class="settings-grid">
          <!-- 目标格式 -->
          <div class="setting-item">
            <label>目标格式</label>
            <el-radio-group v-model="targetFormat" size="large">
              <el-radio-button value="jpeg">JPEG</el-radio-button>
              <el-radio-button value="png">PNG</el-radio-button>
              <el-radio-button value="webp">WebP</el-radio-button>
              <el-radio-button value="gif">GIF</el-radio-button>
            </el-radio-group>
          </div>

          <!-- JPEG/WebP 质量 -->
          <div v-if="targetFormat === 'jpeg' || targetFormat === 'webp'" class="setting-item">
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
          </div>

          <!-- 操作按钮 -->
          <div class="setting-actions">
            <NeonButton @click="convertAll" :loading="isConverting">
              <i class="i-mdi-sync" />
              转换全部 ({{ images.length }})
            </NeonButton>
            <NeonButton @click="downloadAll" :disabled="convertedImages.length === 0">
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
              <div class="format-badge">{{ getFormatName(image.format) }}</div>
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
              
              <!-- 转换结果 -->
              <div v-if="image.converted" class="convert-result">
                <div class="result-row">
                  <span class="label">目标格式:</span>
                  <span class="value">{{ getFormatName(targetFormat) }}</span>
                </div>
                <div class="result-row">
                  <span class="label">文件大小:</span>
                  <span class="value">{{ formatFileSize(image.convertedSize!) }}</span>
                </div>
                <div v-if="image.convertedSize! > image.size" class="result-row">
                  <span class="label warning">提示:</span>
                  <span class="value warning">文件增大了</span>
                </div>
              </div>

              <!-- 转换状态 -->
              <div v-if="image.converting" class="convert-status">
                <el-progress :percentage="100" :indeterminate="true" />
                <span>转换中...</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="image-actions">
              <NeonButton 
                v-if="!image.converted"
                size="small" 
                @click="convertImage(index)"
                :loading="image.converting"
              >
                <i class="i-mdi-sync" />
                转换
              </NeonButton>
              <NeonButton 
                v-if="image.converted"
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
import { ref, computed } from 'vue'
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
  format: string
  width: number
  height: number
  size: number
  converting: boolean
  converted: boolean
  convertedBlob?: Blob
  convertedSize?: number
}

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const images = ref<ImageItem[]>([])
const targetFormat = ref<'jpeg' | 'png' | 'webp' | 'gif'>('png')
const quality = ref(90)
const isConverting = ref(false)

const convertedImages = computed(() => images.value.filter(img => img.converted))

// 获取格式名称
const getFormatName = (format: string): string => {
  const names: Record<string, string> = {
    'jpeg': 'JPEG',
    'jpg': 'JPG',
    'png': 'PNG',
    'webp': 'WebP',
    'gif': 'GIF'
  }
  return names[format] || format.toUpperCase()
}

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
  const imageFiles = files.filter(file => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    ElMessage.warning('请选择图片文件')
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
        // 检测格式
        let format = file.type.replace('image/', '')
        if (format === 'jpeg') format = 'jpg'
        
        images.value.push({
          id: Date.now().toString() + Math.random(),
          file,
          name: file.name,
          preview: e.target?.result as string,
          format,
          width: img.width,
          height: img.height,
          size: file.size,
          converting: false,
          converted: false,
        })
        resolve()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// 转换单张图片
const convertImage = async (index: number) => {
  const image = images.value[index]
  if (!image || image.converting) return

  image.converting = true

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

    // 确定输出 MIME 类型
    const mimeType = `image/${targetFormat.value === 'jpg' ? 'jpeg' : targetFormat.value}`

    // 转换
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('转换失败'))
        },
        mimeType,
        targetFormat.value === 'jpeg' || targetFormat.value === 'webp' 
          ? quality.value / 100 
          : undefined
      )
    })

    image.convertedBlob = blob
    image.convertedSize = blob.size
    image.converted = true
    image.converting = false

    ElMessage.success(`${image.name} 转换完成`)
  } catch (error) {
    console.error('转换失败:', error)
    ElMessage.error(`${image.name} 转换失败`)
    image.converting = false
  }
}

// 转换全部
const convertAll = async () => {
  isConverting.value = true
  for (let i = 0; i < images.value.length; i++) {
    if (!images.value[i].converted) {
      await convertImage(i)
    }
  }
  isConverting.value = false
  ElMessage.success('全部图片转换完成')
}

// 下载单张图片
const downloadImage = (index: number) => {
  const image = images.value[index]
  if (!image.convertedBlob) return

  const url = URL.createObjectURL(image.convertedBlob)
  const a = document.createElement('a')
  a.href = url
  
  const extension = targetFormat.value === 'jpeg' ? 'jpg' : targetFormat.value
  const nameWithoutExt = image.name.replace(/\.[^/.]+$/, '')
  a.download = `${nameWithoutExt}.${extension}`
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('图片下载成功')
}

// 下载全部
const downloadAll = () => {
  convertedImages.value.forEach((_, index) => {
    const originalIndex = images.value.findIndex(img => img.converted)
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
/* 复用图片压缩工具的样式 */
.image-converter-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.converter-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

/* 自定义滚动条 */
.converter-content::-webkit-scrollbar {
  width: 8px;
}

.converter-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.converter-content::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
}

.converter-content::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

/* 上传区域 */
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
  background: rgba(155, 92, 255, 0.03);
  cursor: pointer;
  transition: all var(--transition-base);
}

.upload-area:hover {
  border-color: var(--neon-purple);
  background: rgba(155, 92, 255, 0.08);
  box-shadow: 0 0 20px rgba(155, 92, 255, 0.2);
}

.upload-area.drag-over {
  border-color: var(--neon-purple-light);
  background: rgba(155, 92, 255, 0.15);
  box-shadow: 0 0 30px rgba(155, 92, 255, 0.3);
}

.upload-icon {
  font-size: 4em;
  color: var(--neon-purple);
  filter: drop-shadow(0 0 10px var(--neon-purple));
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

/* 设置区域 */
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
  color: var(--neon-purple);
}

.setting-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* 图片列表 */
.images-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.image-item {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: rgba(155, 92, 255, 0.03);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.image-item:hover {
  border-color: var(--neon-purple);
  background: rgba(155, 92, 255, 0.08);
  box-shadow: 0 0 15px rgba(155, 92, 255, 0.2);
}

.image-preview {
  position: relative;
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

.format-badge {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(0, 0, 0, 0.8);
  color: var(--neon-purple);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--radius-sm);
  border: 1px solid var(--neon-purple);
  box-shadow: 0 0 10px rgba(155, 92, 255, 0.5);
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

.convert-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: rgba(155, 92, 255, 0.05);
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

.result-row .label.warning,
.result-row .value.warning {
  color: var(--neon-yellow);
}

.convert-status {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.convert-status span {
  font-size: var(--font-size-sm);
  color: var(--neon-purple);
}

.image-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .converter-content {
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
}
</style>


