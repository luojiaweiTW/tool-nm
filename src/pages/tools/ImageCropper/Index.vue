<template>
  <div class="image-cropper-page">
    <Header 
      title="图片裁剪缩放" 
      description="裁剪图片、调整尺寸、支持多种预设比例" 
      icon="i-mdi-crop"
    />

    <div class="cropper-content">
      <!-- 上传区域 -->
      <NeonCard v-if="!currentImage" title="上传图片" class="upload-card" compact>
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
            style="display: none"
            @change="handleFileSelect"
          />
          <i class="i-mdi-crop-free upload-icon" />
          <div class="upload-text">
            <p class="primary">点击或拖拽图片到此处</p>
            <p class="secondary">支持 JPG、PNG、WebP、GIF 等格式</p>
          </div>
        </div>
      </NeonCard>

      <!-- 裁剪编辑区 -->
      <template v-if="currentImage">
        <!-- 工具栏 -->
        <NeonCard title="裁剪设置" class="toolbar-card" compact>
          <div class="toolbar-grid">
            <!-- 预设比例 -->
            <div class="toolbar-item">
              <label>裁剪比例</label>
              <div class="aspect-ratio-buttons">
                <NeonButton 
                  size="small" 
                  :type="aspectRatio === 'free' ? 'primary' : 'default'"
                  @click="setAspectRatio('free')"
                >
                  自由
                </NeonButton>
                <NeonButton 
                  size="small" 
                  :type="aspectRatio === '1:1' ? 'primary' : 'default'"
                  @click="setAspectRatio('1:1')"
                >
                  1:1
                </NeonButton>
                <NeonButton 
                  size="small" 
                  :type="aspectRatio === '16:9' ? 'primary' : 'default'"
                  @click="setAspectRatio('16:9')"
                >
                  16:9
                </NeonButton>
                <NeonButton 
                  size="small" 
                  :type="aspectRatio === '4:3' ? 'primary' : 'default'"
                  @click="setAspectRatio('4:3')"
                >
                  4:3
                </NeonButton>
                <NeonButton 
                  size="small" 
                  :type="aspectRatio === '3:2' ? 'primary' : 'default'"
                  @click="setAspectRatio('3:2')"
                >
                  3:2
                </NeonButton>
              </div>
            </div>

            <!-- 缩放尺寸 -->
            <div class="toolbar-item">
              <label>输出尺寸</label>
              <div class="size-inputs">
                <el-input 
                  v-model.number="outputWidth" 
                  placeholder="宽度"
                  type="number"
                  :min="1"
                  class="size-input"
                >
                  <template #append>px</template>
                </el-input>
                <span class="size-separator">×</span>
                <el-input 
                  v-model.number="outputHeight" 
                  placeholder="高度"
                  type="number"
                  :min="1"
                  class="size-input"
                >
                  <template #append>px</template>
                </el-input>
                <el-checkbox v-model="keepAspectRatio" label="保持比例" />
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="toolbar-actions">
              <NeonButton @click="handleCrop" :loading="isCropping">
                <i class="i-mdi-content-cut" />
                裁剪
              </NeonButton>
              <NeonButton @click="downloadCroppedImage" :disabled="!croppedImage">
                <i class="i-mdi-download" />
                下载
              </NeonButton>
              <NeonButton @click="resetImage">
                <i class="i-mdi-refresh" />
                重置
              </NeonButton>
              <NeonButton @click="clearImage">
                <i class="i-mdi-close" />
                关闭
              </NeonButton>
            </div>
          </div>
        </NeonCard>

        <!-- 裁剪预览区 -->
        <div class="preview-container">
          <NeonCard title="原图预览" class="preview-card" compact>
            <div class="canvas-wrapper">
              <canvas ref="canvas" class="crop-canvas" />
              <div 
                v-if="cropArea"
                class="crop-overlay"
                :style="overlayStyle"
                @mousedown="startDrag"
              >
                <div class="crop-border" />
                <div class="resize-handle resize-nw" @mousedown.stop="startResize('nw')" />
                <div class="resize-handle resize-ne" @mousedown.stop="startResize('ne')" />
                <div class="resize-handle resize-sw" @mousedown.stop="startResize('sw')" />
                <div class="resize-handle resize-se" @mousedown.stop="startResize('se')" />
              </div>
            </div>
          </NeonCard>

          <NeonCard v-if="croppedImage" title="裁剪结果" class="result-card" compact>
            <div class="result-wrapper">
              <img :src="croppedImage" alt="裁剪结果" class="result-image" />
              <div class="result-info">
                <p>尺寸: {{ croppedWidth }} × {{ croppedHeight }} px</p>
                <p>文件大小: {{ formatFileSize(croppedSize) }}</p>
              </div>
            </div>
          </NeonCard>
        </div>
      </template>

      <!-- 空状态 -->
      <EmptyState 
        v-if="!currentImage"
        icon="i-mdi-crop-outline"
        title="还没有上传图片"
        description="点击上方上传区域或拖拽图片文件到此处开始裁剪"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import EmptyState from '@/components/EmptyState.vue'

const fileInput = ref<HTMLInputElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const isDragging = ref(false)
const currentImage = ref<HTMLImageElement | null>(null)
const aspectRatio = ref<string>('free')
const outputWidth = ref<number>(800)
const outputHeight = ref<number>(600)
const keepAspectRatio = ref(true)
const isCropping = ref(false)
const croppedImage = ref<string>('')
const croppedWidth = ref(0)
const croppedHeight = ref(0)
const croppedSize = ref(0)

// 裁剪区域
const cropArea = ref<{
  x: number
  y: number
  width: number
  height: number
} | null>(null)

const dragging = ref(false)
const resizing = ref<string | null>(null)
const dragStart = ref({ x: 0, y: 0 })

// 计算裁剪区域样式
const overlayStyle = computed(() => {
  if (!cropArea.value) return {}
  return {
    left: `${cropArea.value.x}px`,
    top: `${cropArea.value.y}px`,
    width: `${cropArea.value.width}px`,
    height: `${cropArea.value.height}px`,
  }
})

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    loadImage(target.files[0])
  }
}

// 处理拖拽
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    loadImage(event.dataTransfer.files[0])
  }
}

// 加载图片
const loadImage = (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      currentImage.value = img
      drawCanvas()
      initCropArea()
      ElMessage.success('图片加载成功')
    }
    img.src = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// 绘制画布
const drawCanvas = () => {
  if (!canvas.value || !currentImage.value) return

  const ctx = canvas.value.getContext('2d')
  if (!ctx) return

  const img = currentImage.value
  const maxWidth = 800
  const maxHeight = 600

  let width = img.width
  let height = img.height

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height)
    width *= ratio
    height *= ratio
  }

  canvas.value.width = width
  canvas.value.height = height
  ctx.drawImage(img, 0, 0, width, height)

  // 设置默认输出尺寸
  outputWidth.value = Math.round(width)
  outputHeight.value = Math.round(height)
}

// 初始化裁剪区域
const initCropArea = () => {
  if (!canvas.value) return

  const width = canvas.value.width
  const height = canvas.value.height

  cropArea.value = {
    x: width * 0.1,
    y: height * 0.1,
    width: width * 0.8,
    height: height * 0.8,
  }
}

// 设置裁剪比例
const setAspectRatio = (ratio: string) => {
  aspectRatio.value = ratio
  if (!cropArea.value || ratio === 'free') return

  const [w, h] = ratio.split(':').map(Number)
  const targetRatio = w / h
  const currentWidth = cropArea.value.width
  const newHeight = currentWidth / targetRatio

  if (newHeight <= canvas.value!.height - cropArea.value.y) {
    cropArea.value.height = newHeight
  } else {
    cropArea.value.width = cropArea.value.height * targetRatio
  }
}

// 开始拖拽
const startDrag = (e: MouseEvent) => {
  dragging.value = true
  dragStart.value = {
    x: e.clientX - (cropArea.value?.x || 0),
    y: e.clientY - (cropArea.value?.y || 0),
  }
}

// 开始调整大小
const startResize = (handle: string) => {
  resizing.value = handle
}

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!cropArea.value || !canvas.value) return

  if (dragging.value) {
    const newX = e.clientX - dragStart.value.x
    const newY = e.clientY - dragStart.value.y

    cropArea.value.x = Math.max(0, Math.min(newX, canvas.value.width - cropArea.value.width))
    cropArea.value.y = Math.max(0, Math.min(newY, canvas.value.height - cropArea.value.height))
  } else if (resizing.value) {
    const rect = canvas.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (resizing.value.includes('e')) {
      cropArea.value.width = Math.max(50, mouseX - cropArea.value.x)
    }
    if (resizing.value.includes('s')) {
      cropArea.value.height = Math.max(50, mouseY - cropArea.value.y)
    }
    if (resizing.value.includes('w')) {
      const newWidth = cropArea.value.x + cropArea.value.width - mouseX
      if (newWidth >= 50) {
        cropArea.value.x = mouseX
        cropArea.value.width = newWidth
      }
    }
    if (resizing.value.includes('n')) {
      const newHeight = cropArea.value.y + cropArea.value.height - mouseY
      if (newHeight >= 50) {
        cropArea.value.y = mouseY
        cropArea.value.height = newHeight
      }
    }

    // 限制在画布内
    cropArea.value.x = Math.max(0, cropArea.value.x)
    cropArea.value.y = Math.max(0, cropArea.value.y)
    cropArea.value.width = Math.min(cropArea.value.width, canvas.value.width - cropArea.value.x)
    cropArea.value.height = Math.min(cropArea.value.height, canvas.value.height - cropArea.value.y)
  }
}

// 鼠标释放
const handleMouseUp = () => {
  dragging.value = false
  resizing.value = null
}

// 裁剪图片
const handleCrop = () => {
  if (!canvas.value || !cropArea.value || !currentImage.value) return

  isCropping.value = true

  try {
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) throw new Error('无法创建临时画布')

    // 计算原图比例
    const scaleX = currentImage.value.width / canvas.value.width
    const scaleY = currentImage.value.height / canvas.value.height

    // 裁剪原图坐标
    const sourceX = cropArea.value.x * scaleX
    const sourceY = cropArea.value.y * scaleY
    const sourceWidth = cropArea.value.width * scaleX
    const sourceHeight = cropArea.value.height * scaleY

    // 设置输出尺寸
    tempCanvas.width = outputWidth.value
    tempCanvas.height = outputHeight.value

    // 绘制裁剪后的图片
    tempCtx.drawImage(
      currentImage.value,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputWidth.value,
      outputHeight.value
    )

    // 转换为 Blob
    tempCanvas.toBlob((blob) => {
      if (blob) {
        croppedImage.value = URL.createObjectURL(blob)
        croppedWidth.value = outputWidth.value
        croppedHeight.value = outputHeight.value
        croppedSize.value = blob.size
        ElMessage.success('裁剪完成')
      }
      isCropping.value = false
    }, 'image/png')
  } catch (error) {
    console.error('裁剪失败:', error)
    ElMessage.error('裁剪失败')
    isCropping.value = false
  }
}

// 下载裁剪后的图片
const downloadCroppedImage = () => {
  if (!croppedImage.value) return

  const a = document.createElement('a')
  a.href = croppedImage.value
  a.download = `cropped_${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  ElMessage.success('图片下载成功')
}

// 重置图片
const resetImage = () => {
  drawCanvas()
  initCropArea()
  croppedImage.value = ''
  ElMessage.info('已重置')
}

// 清空图片
const clearImage = () => {
  currentImage.value = null
  cropArea.value = null
  croppedImage.value = ''
  ElMessage.info('已清空')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 监听输出尺寸变化
watch([outputWidth, outputHeight], ([newWidth, newHeight], [oldWidth, oldHeight]) => {
  if (!keepAspectRatio.value) return

  if (newWidth !== oldWidth && oldWidth > 0) {
    const ratio = newWidth / oldWidth
    outputHeight.value = Math.round(oldHeight * ratio)
  } else if (newHeight !== oldHeight && oldHeight > 0) {
    const ratio = newHeight / oldHeight
    outputWidth.value = Math.round(oldWidth * ratio)
  }
})

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<style scoped>
.image-cropper-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
}

.cropper-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

/* 自定义滚动条 */
.cropper-content::-webkit-scrollbar {
  width: 8px;
}

.cropper-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.cropper-content::-webkit-scrollbar-thumb {
  background: rgba(255, 42, 161, 0.5);
  border-radius: 4px;
}

.cropper-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 42, 161, 0.8);
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
  background: rgba(255, 42, 161, 0.03);
  cursor: pointer;
  transition: all var(--transition-base);
}

.upload-area:hover {
  border-color: var(--neon-pink);
  background: rgba(255, 42, 161, 0.08);
  box-shadow: 0 0 20px rgba(255, 42, 161, 0.2);
}

.upload-area.drag-over {
  border-color: var(--neon-pink-light);
  background: rgba(255, 42, 161, 0.15);
  box-shadow: 0 0 30px rgba(255, 42, 161, 0.3);
}

.upload-icon {
  font-size: 4em;
  color: var(--neon-pink);
  filter: drop-shadow(0 0 10px var(--neon-pink));
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

/* 工具栏 */
.toolbar-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.toolbar-item label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.aspect-ratio-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.size-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.size-input {
  width: 150px;
}

.size-separator {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.toolbar-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* 预览容器 */
.preview-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.canvas-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.crop-canvas {
  max-width: 100%;
  max-height: 600px;
  border-radius: var(--radius-sm);
}

/* 裁剪覆盖层 */
.crop-overlay {
  position: absolute;
  border: 2px solid var(--neon-pink);
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px var(--neon-pink);
  cursor: move;
  user-select: none;
}

.crop-border {
  position: absolute;
  inset: 0;
  border: 1px dashed rgba(255, 255, 255, 0.5);
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--neon-pink);
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 10px var(--neon-pink);
}

.resize-nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

/* 结果区域 */
.result-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  align-items: center;
}

.result-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: var(--radius-md);
  box-shadow: 0 0 20px rgba(255, 42, 161, 0.3);
}

.result-info {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.result-info p {
  margin: var(--spacing-xs) 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .preview-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .cropper-content {
    padding-right: 0;
  }

  .toolbar-actions,
  .aspect-ratio-buttons,
  .size-inputs {
    flex-direction: column;
  }

  .size-input {
    width: 100%;
  }
}
</style>


