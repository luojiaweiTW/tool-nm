<template>
  <el-dialog
    v-model="visible"
    :show-close="true"
    width="90%"
    class="image-viewer-dialog"
    @close="handleClose"
  >
    <template #header>
      <div class="viewer-header">
        <span class="viewer-title">{{ title }}</span>
        <div class="viewer-actions">
          <el-button size="small" @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button size="small" @click="handleReset">
            <el-icon><RefreshRight /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </template>
    
    <div class="image-viewer-content" @wheel="handleWheel">
      <img
        ref="imageRef"
        :src="src"
        :alt="title"
        :style="{
          transform: `scale(${scale}) rotate(${rotate}deg)`,
          cursor: scale > 1 ? 'move' : 'default'
        }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      />
    </div>
    
    <template #footer>
      <div class="viewer-footer">
        <span class="scale-info">{{ Math.round(scale * 100) }}%</span>
        <el-button @click="visible = false">關閉 (ESC)</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ZoomIn, ZoomOut, RefreshRight } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  src: string
  title?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const imageRef = ref<HTMLImageElement>()
const scale = ref(1)
const rotate = ref(0)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const translate = ref({ x: 0, y: 0 })

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 重置时清空状态
watch(visible, (val) => {
  if (val) {
    scale.value = 1
    rotate.value = 0
    translate.value = { x: 0, y: 0 }
  }
})

// 放大
function handleZoomIn() {
  scale.value = Math.min(scale.value + 0.2, 3)
}

// 缩小
function handleZoomOut() {
  scale.value = Math.max(scale.value - 0.2, 0.5)
}

// 重置
function handleReset() {
  scale.value = 1
  rotate.value = 0
  translate.value = { x: 0, y: 0 }
}

// 鼠标滚轮缩放
function handleWheel(event: WheelEvent) {
  event.preventDefault()
  if (event.deltaY < 0) {
    handleZoomIn()
  } else {
    handleZoomOut()
  }
}

// 拖拽
function handleMouseDown(event: MouseEvent) {
  if (scale.value <= 1) return
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY }
}

function handleMouseMove(event: MouseEvent) {
  if (!isDragging.value) return
  const dx = event.clientX - dragStart.value.x
  const dy = event.clientY - dragStart.value.y
  translate.value = {
    x: translate.value.x + dx,
    y: translate.value.y + dy,
  }
  dragStart.value = { x: event.clientX, y: event.clientY }
}

function handleMouseUp() {
  isDragging.value = false
}

// 关闭
function handleClose() {
  visible.value = false
}
</script>

<style scoped>
:deep(.image-viewer-dialog) {
  .el-dialog__header {
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(33, 230, 255, 0.1), rgba(155, 92, 255, 0.1));
    border-bottom: 2px solid rgba(33, 230, 255, 0.3);
  }
  
  .el-dialog__body {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.5);
    min-height: 400px;
    max-height: 70vh;
  }
  
  .el-dialog__footer {
    padding: 12px 20px;
    background: linear-gradient(135deg, rgba(33, 230, 255, 0.05), rgba(155, 92, 255, 0.05));
    border-top: 1px solid rgba(138, 164, 199, 0.2);
  }
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.viewer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--neon-cyan);
}

.viewer-actions {
  display: flex;
  gap: 8px;
}

.image-viewer-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.image-viewer-content img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  user-select: none;
}

.viewer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scale-info {
  font-size: 14px;
  font-weight: 600;
  color: var(--neon-cyan);
  font-family: monospace;
}
</style>

