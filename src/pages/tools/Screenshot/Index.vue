<template>
  <div class="screenshot-container">
    <!-- 顶部标题区 -->
    <div class="screenshot-header">
      <div class="screenshot-header__title">
        <i class="i-mdi-camera-outline" />
        <h1>截图工具</h1>
      </div>
      <p class="screenshot-header__description">
        快速截取屏幕或窗口，支持保存和复制到剪贴板
      </p>
    </div>

    <!-- 功能按钮区 -->
    <div class="screenshot-actions">
      <!-- 新版：带标注功能的截图 -->
      <el-card class="action-card action-card--featured">
        <div class="action-card__content">
          <div class="featured-badge">推荐</div>
          <i class="i-mdi-vector-rectangle action-card__icon" />
          <h3>快速截图（带标注）</h3>
          <p>区域选择 + 箭头、文字、马赛克等标注工具</p>
          <el-button 
            type="primary" 
            size="large"
            :loading="isStartingCapture"
            @click="startQuickScreenshot"
          >
            <i class="i-mdi-camera" />
            开始截图
          </el-button>
          <div class="hotkey-tip">
            <i class="i-mdi-keyboard" />
            快捷键: Ctrl+Shift+X
          </div>
        </div>
      </el-card>

      <!-- 旧版：简单截图 -->
      <el-card class="action-card">
        <div class="action-card__content">
          <i class="i-mdi-monitor-screenshot action-card__icon" />
          <h3>截取全屏</h3>
          <p>捕获整个屏幕的截图</p>
          <el-button 
            :loading="isCapturing && captureType === 'screen'"
            @click="captureScreen"
          >
            <i class="i-mdi-camera" />
            截取全屏
          </el-button>
        </div>
      </el-card>

      <el-card class="action-card">
        <div class="action-card__content">
          <i class="i-mdi-window-maximize action-card__icon" />
          <h3>截取当前窗口</h3>
          <p>捕获当前应用窗口</p>
          <el-button 
            :loading="isCapturing && captureType === 'window'"
            @click="captureWindow"
          >
            <i class="i-mdi-camera" />
            截取窗口
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 截图预览区 -->
    <el-card v-if="screenshotData" class="screenshot-preview">
      <template #header>
        <div class="preview-header">
          <span>截图预览</span>
          <div class="preview-header__actions">
            <el-button size="small" @click="pinToTop">
              <i class="i-mdi-pin" />
              置顶显示
            </el-button>
            <el-button size="small" @click="copyToClipboard">
              <i class="i-mdi-content-copy" />
              复制到剪贴板
            </el-button>
            <el-button size="small" type="primary" @click="saveScreenshot">
              <i class="i-mdi-download" />
              保存到本地
            </el-button>
            <el-button size="small" type="danger" @click="clearScreenshot">
              <i class="i-mdi-delete" />
              清除
            </el-button>
          </div>
        </div>
      </template>

      <div class="preview-content">
        <img :src="screenshotData" alt="截图预览" class="preview-image" />
        <div class="preview-info">
          <div class="info-item">
            <i class="i-mdi-resize" />
            <span>尺寸：{{ imageSize.width }} × {{ imageSize.height }}</span>
          </div>
          <div class="info-item">
            <i class="i-mdi-clock-outline" />
            <span>时间：{{ captureTime }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 截图历史 -->
    <el-card class="screenshot-history">
      <template #header>
        <div class="history-header">
          <span>截图历史（按时间倒序）</span>
          <el-button size="small" @click="loadHistory">
            <i class="i-mdi-refresh" />
            刷新
          </el-button>
        </div>
      </template>

      <div v-if="historyLoading" class="history-loading">
        <el-icon class="is-loading"><i class="i-mdi-loading" /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="!historyList.length" class="history-empty">
        <i class="i-mdi-image-off-outline" />
        <p>暂无截图历史</p>
        <p class="empty-tip">使用"快速截图"功能，截图将自动保存</p>
      </div>

      <div v-else class="history-grid">
        <div 
          v-for="item in paginatedHistory" 
          :key="item.timestamp"
          class="history-item"
          @click="previewHistoryItem(item)"
        >
          <div class="history-item__image">
            <img :src="item.preview" alt="截图" />
            <div class="history-item__overlay">
              <el-button circle size="small" @click.stop="deleteHistoryItem(item)">
                <i class="i-mdi-delete" />
              </el-button>
            </div>
          </div>
          <div class="history-item__info">
            <div class="history-item__time">
              {{ formatTime(item.timestamp) }}
            </div>
            <div class="history-item__size">
              {{ formatSize(item.size) }}
            </div>
          </div>
        </div>
        
        <!-- 📌 加载更多按钮 -->
        <div v-if="hasMoreHistory" class="load-more-section">
          <el-button @click="loadMoreHistory" style="width: 100%; margin-top: 16px;">
            加载更多 (剩余 {{ historyList.length - paginatedHistory.length }} 张)
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 使用说明 -->
    <el-card class="screenshot-tips">
      <template #header>
        <span style="font-size: 16px; font-weight: bold; color: var(--neon-cyan);">
          💡 使用说明
        </span>
      </template>
      <div class="tips-content">
        <div class="tip-item">
          <i class="i-mdi-monitor-screenshot" style="color: var(--neon-cyan); font-size: 20px;" />
          <span><strong style="color: var(--neon-cyan);">截取全屏：</strong>捕获所有显示器的完整屏幕内容</span>
        </div>
        <div class="tip-item">
          <i class="i-mdi-window-maximize" style="color: var(--neon-cyan); font-size: 20px;" />
          <span><strong style="color: var(--neon-cyan);">截取窗口：</strong>只捕获当前应用窗口的内容</span>
        </div>
        <div class="tip-item">
          <i class="i-mdi-keyboard" style="color: var(--neon-yellow); font-size: 20px;" />
          <span><strong style="color: var(--neon-yellow);">快捷键：</strong>可以使用 <kbd style="background: rgba(251, 191, 36, 0.2); padding: 3px 8px; border-radius: 4px; color: var(--neon-yellow); font-family: monospace; font-weight: bold; border: 1px solid rgba(251, 191, 36, 0.4);">Ctrl+Shift+X</kbd> 快速截图</span>
        </div>
        <div class="tip-item">
          <i class="i-mdi-file-image" style="color: var(--neon-green); font-size: 20px;" />
          <span><strong style="color: var(--neon-green);">格式：</strong>截图保存为 PNG 格式，保证最佳质量</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

const isCapturing = ref(false)
const captureType = ref<'screen' | 'window' | ''>('')
const screenshotData = ref('')
const captureTime = ref('')
const imageSize = ref({ width: 0, height: 0 })
const isStartingCapture = ref(false)
// 📌 保存最后一次截图的详细信息
const lastScreenshotInfo = ref<{
  data: string
  bounds: { x: number; y: number; width: number; height: number }
  filepath?: string
} | null>(null)

// 截图历史
const historyList = ref<Array<{
  filename: string
  filepath: string
  timestamp: number
  size: number
  preview?: string
}>>([])
const historyLoading = ref(false)
// 📌 分页加载
const pageSize = ref(20)
const currentPage = ref(1)

// 📌 分页显示的列表
const paginatedHistory = computed(() => {
  return historyList.value.slice(0, currentPage.value * pageSize.value)
})

// 📌 是否还有更多
const hasMoreHistory = computed(() => {
  return paginatedHistory.value.length < historyList.value.length
})

// 📌 加载更多（并懒加载预览图）
const loadMoreHistory = async () => {
  if (!hasMoreHistory.value) return
  
  const oldLength = paginatedHistory.value.length
  currentPage.value++
  const newLength = paginatedHistory.value.length
  
  // 加载新显示的项目的预览
  const itemsToLoad = historyList.value.slice(oldLength, newLength).filter(item => !item.preview)
  
  if (itemsToLoad.length > 0 && window.electronAPI.screenshots) {
    console.log(`📌 [Screenshot] Loading ${itemsToLoad.length} more previews...`)
    
    for (const item of itemsToLoad) {
      try {
        const fileResult = await window.electronAPI.screenshots.readFile!(item.filepath)
        if (fileResult?.success && fileResult.data) {
          item.preview = fileResult.data
        }
      } catch (error) {
        console.error('Failed to load preview:', error)
      }
    }
  }
}

// 检查 Electron API 是否可用
const isElectronAvailable = computed(() => {
  return window.electronAPI !== undefined
})

// 快速截图（electron-screenshots）
const startQuickScreenshot = async () => {
  console.log('📸 [Frontend] Starting quick screenshot...')
  
  if (!isElectronAvailable.value) {
    console.warn('❌ [Frontend] Electron API not available')
    ElMessage.warning('截图功能仅在 Electron 环境下可用')
    return
  }

  if (!window.electronAPI.screenshots) {
    console.error('❌ [Frontend] Screenshots API not found')
    ElMessage.error('Screenshots API 未加载')
    return
  }

  // 🔧 修复：防止重复点击
  if (isStartingCapture.value) {
    console.warn('⚠ [Frontend] Screenshot already in progress')
    ElMessage.warning('截图已在进行中，请稍候')
    return
  }

  try {
    isStartingCapture.value = true
    
    console.log('📸 [Frontend] Calling screenshots.start()...')
    const result = await window.electronAPI.screenshots.start()
    
    if (result?.success) {
      ElMessage.success('按 ESC 取消截图')
      console.log('✓ [Frontend] Screenshot capture started')
    } else {
      console.error('❌ [Frontend] Failed to start capture:', result?.error)
      
      // 🔧 修复：如果是"已在进行中"错误，给出更友好的提示
      if (result?.error?.includes('已在进行中')) {
        ElMessage.warning('请先完成或取消当前截图')
      } else {
        ElMessage.error(result?.error || '启动截图失败')
      }
    }
  } catch (error: any) {
    console.error('❌ [Frontend] Quick screenshot error:', error)
    ElMessage.error(error.message || '启动截图失败')
  } finally {
    // 🔧 修复：延迟重置状态，避免快速重复点击
    setTimeout(() => {
      isStartingCapture.value = false
    }, 500)
  }
}

// 截取全屏
const captureScreen = async () => {
  console.log('📸 [Frontend] Starting screen capture...')
  
  if (!isElectronAvailable.value) {
    console.warn('❌ [Frontend] Electron API not available')
    ElMessage.warning('截图功能仅在 Electron 环境下可用')
    return
  }

  if (!window.electronAPI.screenshot) {
    console.error('❌ [Frontend] Screenshot API not found')
    ElMessage.error('截图 API 未加载')
    return
  }

  try {
    isCapturing.value = true
    captureType.value = 'screen'

    console.log('📸 [Frontend] Calling captureScreen API...')
    const result = await window.electronAPI.screenshot.captureScreen()
    console.log('📸 [Frontend] Capture result:', result ? 'success' : 'failed', result)
    
    if (result?.success && result.data) {
      screenshotData.value = result.data
      captureTime.value = new Date().toLocaleString('zh-CN')
      
      // 计算图片尺寸
      const img = new Image()
      img.onload = () => {
        imageSize.value = { width: img.width, height: img.height }
        console.log('✓ [Frontend] Image loaded, size:', imageSize.value)
      }
      img.src = result.data

      ElMessage.success('截图成功！')
    } else {
      console.error('❌ [Frontend] Capture failed:', result?.error)
      ElMessage.error(result?.error || '截图失败')
    }
  } catch (error: any) {
    console.error('❌ [Frontend] Screenshot error:', error)
    ElMessage.error(error.message || '截图失败')
  } finally {
    isCapturing.value = false
    captureType.value = ''
  }
}

// 截取当前窗口
const captureWindow = async () => {
  console.log('📸 [Frontend] Starting window capture...')
  
  if (!isElectronAvailable.value) {
    console.warn('❌ [Frontend] Electron API not available')
    ElMessage.warning('截图功能仅在 Electron 环境下可用')
    return
  }

  if (!window.electronAPI.screenshot) {
    console.error('❌ [Frontend] Screenshot API not found')
    ElMessage.error('截图 API 未加载')
    return
  }

  try {
    isCapturing.value = true
    captureType.value = 'window'

    console.log('📸 [Frontend] Calling captureWindow API...')
    const result = await window.electronAPI.screenshot.captureWindow()
    console.log('📸 [Frontend] Capture result:', result ? 'success' : 'failed', result)
    
    if (result?.success && result.data) {
      screenshotData.value = result.data
      captureTime.value = new Date().toLocaleString('zh-CN')
      
      // 计算图片尺寸
      const img = new Image()
      img.onload = () => {
        imageSize.value = { width: img.width, height: img.height }
        console.log('✓ [Frontend] Image loaded, size:', imageSize.value)
      }
      img.src = result.data

      ElMessage.success('截图成功！')
    } else {
      console.error('❌ [Frontend] Capture failed:', result?.error)
      ElMessage.error(result?.error || '截图失败')
    }
  } catch (error: any) {
    console.error('❌ [Frontend] Screenshot error:', error)
    ElMessage.error(error.message || '截图失败')
  } finally {
    isCapturing.value = false
    captureType.value = ''
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!screenshotData.value) return

  try {
    // 将 base64 转换为 blob
    const base64Data = screenshotData.value.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/png' })

    // 使用 Clipboard API
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])

    ElMessage.success('已复制到剪贴板！')
  } catch (error: any) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动保存')
  }
}

// 保存截图
const saveScreenshot = async () => {
  if (!screenshotData.value) return
  if (!isElectronAvailable.value) {
    // 浏览器环境，使用下载链接
    downloadScreenshot()
    return
  }

  try {
    const result = await window.electronAPI.screenshot?.saveScreenshot(screenshotData.value)
    
    if (result?.success) {
      ElMessage.success(`截图已保存到：${result.path}`)
    } else {
      ElMessage.error(result?.error || '保存失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

// 浏览器环境下载截图
const downloadScreenshot = () => {
  const link = document.createElement('a')
  link.href = screenshotData.value
  link.download = `screenshot_${Date.now()}.png`
  link.click()
  ElMessage.success('截图已下载！')
}

// 清除截图
const clearScreenshot = () => {
  screenshotData.value = ''
  captureTime.value = ''
  imageSize.value = { width: 0, height: 0 }
  lastScreenshotInfo.value = null
  ElMessage.info('已清除截图')
}

// 📌 置顶显示截图
const pinToTop = async () => {
  if (!screenshotData.value || !lastScreenshotInfo.value) {
    ElMessage.warning('没有可置顶的截图')
    return
  }

  if (!isElectronAvailable.value || !window.electronAPI.screenshots) {
    ElMessage.warning('置顶功能仅在 Electron 环境下可用')
    return
  }

  try {
    const result = await window.electronAPI.screenshots.createPinWindow({
      imageData: lastScreenshotInfo.value.data,
      bounds: lastScreenshotInfo.value.bounds,
      filepath: lastScreenshotInfo.value.filepath
    })

    if (result?.success) {
      ElMessage.success('已创建置顶窗口！\n提示：\n- 拖动图片可移动\n- 拖动右下角可调整大小\n- Ctrl+/- 放大缩小\n- ESC 关闭')
    } else {
      ElMessage.error(result?.error || '创建置顶窗口失败')
    }
  } catch (error: any) {
    console.error('❌ [Frontend] Pin window error:', error)
    ElMessage.error(error.message || '创建置顶窗口失败')
  }
}

// 加载截图历史
const loadHistory = async () => {
  if (!isElectronAvailable.value || !window.electronAPI.screenshots) {
    return
  }

  try {
    historyLoading.value = true
    const result = await window.electronAPI.screenshots.getHistory()
    
    if (result?.success && result.data) {
      // 📌 只加载前20张的预览（分页加载）
      const toLoad = result.data.slice(0, pageSize.value)
      const historyWithPreview = await Promise.all(
        toLoad.map(async (item) => {
          try {
            const fileResult = await window.electronAPI.screenshots!.readFile!(item.filepath)
            return {
              ...item,
              preview: fileResult?.data || ''
            }
          } catch (error) {
            console.error('Failed to load preview:', error)
            return item
          }
        })
      )
      
      // 其余的先不加载预览，等用户滚动时再加载
      const remaining = result.data.slice(pageSize.value).map(item => ({
        ...item,
        preview: ''  // 暂不加载
      }))
      
      historyList.value = [...historyWithPreview, ...remaining]
      console.log(`✓ [Frontend] Loaded ${historyWithPreview.length} previews, total ${historyList.value.length} screenshots`)
    }
  } catch (error: any) {
    console.error('❌ [Frontend] Load history error:', error)
    ElMessage.error('加载截图历史失败')
  } finally {
    historyLoading.value = false
  }
}

// 预览历史截图
const previewHistoryItem = (item: any) => {
  screenshotData.value = item.preview
  captureTime.value = formatTime(item.timestamp)
  
  // 计算图片尺寸
  const img = new Image()
  img.onload = () => {
    imageSize.value = { width: img.width, height: img.height }
    
    // 📌 保存截图信息（用于置顶），使用实际图片尺寸作为 bounds
    lastScreenshotInfo.value = {
      data: item.preview,
      bounds: {
        x: 100,  // 默认位置
        y: 100,
        width: img.width,
        height: img.height
      },
      filepath: item.filepath
    }
  }
  img.src = item.preview
  
  // 滚动到预览区
  document.querySelector('.screenshot-preview')?.scrollIntoView({ behavior: 'smooth' })
}

// 删除历史截图
const deleteHistoryItem = async (item: any) => {
  if (!window.electronAPI.screenshots) return
  
  try {
    const result = await window.electronAPI.screenshots.deleteFile(item.filepath)
    
    if (result?.success) {
      ElMessage.success('删除成功')
      // 重新加载历史
      await loadHistory()
      
      // 如果当前预览的是被删除的截图，清除预览
      if (screenshotData.value === item.preview) {
        clearScreenshot()
      }
    } else {
      ElMessage.error(result?.error || '删除失败')
    }
  } catch (error: any) {
    console.error('❌ [Frontend] Delete error:', error)
    ElMessage.error('删除失败')
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // 本周内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${days[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // 更早
  return date.toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 格式化文件大小
const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onMounted(() => {
  console.log('📸 [Frontend] Screenshot component mounted')
  console.log('📸 [Frontend] Electron API available:', isElectronAvailable.value)
  console.log('📸 [Frontend] Screenshot API available:', !!window.electronAPI?.screenshot)
  console.log('📸 [Frontend] Screenshots API available:', !!window.electronAPI?.screenshots)
  
  if (!isElectronAvailable.value) {
    console.warn('❌ [Frontend] 截图功能需要在 Electron 环境下运行')
    return
  }
  
  if (isElectronAvailable.value && !window.electronAPI?.screenshots) {
    console.error('❌ [Frontend] Screenshots API not found in electronAPI')
  }
  
  // 监听截图完成事件
  if (window.electronAPI?.screenshots) {
    console.log('📸 [Frontend] Registering screenshot event listeners...')
    
    window.electronAPI.screenshots.onCaptured?.((data) => {
      console.log('✅✅✅ [Frontend] Screenshot captured event received! ✅✅✅')
      console.log('📊 [Frontend] Full event data:', data)
      console.log('📊 [Frontend] Data details:', {
        hasData: !!data.data,
        dataLength: data.data?.length,
        dataPrefix: data.data?.substring(0, 50),
        timestamp: data.timestamp,
        filepath: data.filepath,
        filename: data.filename,
        bounds: data.bounds
      })
      
      // 🔧 修复：重置截图状态
      isStartingCapture.value = false
      console.log('🔄 [Frontend] Reset isStartingCapture to false')
      
      screenshotData.value = data.data
      captureTime.value = new Date(data.timestamp).toLocaleString('zh-CN')
      console.log('💾 [Frontend] Screenshot data saved to state')
      console.log('   screenshotData length:', screenshotData.value?.length)
      console.log('   captureTime:', captureTime.value)
      
      // 📌 保存截图信息（用于置顶）
      lastScreenshotInfo.value = {
        data: data.data,
        bounds: data.bounds,
        filepath: data.filepath
      }
      console.log('📌 [Frontend] Last screenshot info saved:', {
        dataLength: lastScreenshotInfo.value.data?.length,
        bounds: lastScreenshotInfo.value.bounds,
        filepath: lastScreenshotInfo.value.filepath
      })
      
      // 计算图片尺寸
      const img = new Image()
      img.onload = () => {
        imageSize.value = { width: img.width, height: img.height }
        console.log('✓ [Frontend] Image loaded successfully, size:', imageSize.value)
      }
      img.onerror = (error) => {
        console.error('❌ [Frontend] Image load error:', error)
        console.error('❌ [Frontend] Image src:', img.src?.substring(0, 100))
        ElMessage.error('图片加载失败，请重试')
      }
      img.src = data.data
      
      ElMessage.success('截图已保存！')
      
      // 刷新历史记录
      console.log('🔄 [Frontend] Scheduling history refresh in 500ms...')
      setTimeout(() => {
        console.log('📜 [Frontend] Loading history...')
        loadHistory()
      }, 500)
    })
    
    console.log('✅ [Frontend] Screenshot event listeners registered')
    
    window.electronAPI.screenshots.onCancelled?.(() => {
      console.log('⚠ [Frontend] Screenshot cancelled')
      
      // 🔧 修复：重置截图状态
      isStartingCapture.value = false
      
      ElMessage.info('已取消截图')
    })
    
    // 初始加载历史
    loadHistory()
  }
})

onUnmounted(() => {
  console.log('📸 [Frontend] Screenshot component unmounting, cleaning up...')
  
  // 🔧 修复：清理事件监听和重置状态
  if (window.electronAPI?.screenshots) {
    window.electronAPI.screenshots.removeListeners?.()
    
    // 如果还在截图中，尝试结束
    if (isStartingCapture.value) {
      window.electronAPI.screenshots.end?.()
        .then(() => console.log('✓ [Frontend] Screenshot capture ended on unmount'))
        .catch(err => console.error('❌ [Frontend] Error ending capture on unmount:', err))
    }
  }
  
  // 重置状态
  isStartingCapture.value = false
})
</script>

<style scoped>
.screenshot-container {
  padding: var(--spacing-xl);
  max-width: 1200px;
  margin: 0 auto;
}

/* 头部样式 */
.screenshot-header {
  margin-bottom: var(--spacing-xl);
}

.screenshot-header__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.screenshot-header__title i {
  font-size: 2em;
  color: var(--neon-cyan);
}

.screenshot-header__title h1 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin: 0;
}

.screenshot-header__description {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: var(--font-size-base);
}

/* 操作按钮区 */
.screenshot-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.action-card {
  transition: all var(--transition-base);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(33, 230, 255, 0.2);
}

.action-card__content {
  text-align: center;
  padding: var(--spacing-lg);
}

.action-card__icon {
  font-size: 3em;
  color: var(--neon-cyan);
  margin-bottom: var(--spacing-md);
  display: block;
}

.action-card__content h3 {
  font-size: var(--font-size-lg);
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm) 0;
}

.action-card__content p {
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-sm);
}

.action-card__content .el-button {
  width: 100%;
}

/* 推荐卡片 */
.action-card--featured {
  position: relative;
  border: 2px solid var(--neon-cyan);
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.05) 0%, transparent 100%);
}

.action-card--featured:hover {
  box-shadow: 0 8px 32px rgba(33, 230, 255, 0.3);
}

.featured-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-cyan-light) 100%);
  color: var(--color-bg);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  box-shadow: 0 2px 8px rgba(33, 230, 255, 0.3);
}

.hotkey-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: rgba(33, 230, 255, 0.1);
  border-radius: var(--radius-sm);
  color: var(--neon-cyan-light);
  font-size: var(--font-size-sm);
}

.hotkey-tip i {
  font-size: 1.2em;
}

/* 预览区域 */
.screenshot-preview {
  margin-bottom: var(--spacing-xl);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header__actions {
  display: flex;
  gap: var(--spacing-sm);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.preview-image {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.preview-info {
  display: flex;
  gap: var(--spacing-xl);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.info-item i {
  color: var(--neon-cyan);
  font-size: 1.2em;
}

/* 使用说明 */
.tips-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}

.tip-item i {
  color: var(--neon-cyan);
  font-size: 1.2em;
  flex-shrink: 0;
  margin-top: 2px;
}

.tip-item span {
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.tip-item strong {
  color: var(--color-text);
}

/* 截图历史 */
.screenshot-history {
  margin-bottom: var(--spacing-xl);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.history-empty i {
  font-size: 4em;
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-md);
}

.history-empty p {
  margin: var(--spacing-xs) 0;
  font-size: var(--font-size-base);
}

.empty-tip {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .history-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1000px) {
  .history-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .history-grid {
    grid-template-columns: 1fr;
  }
}

.history-item {
  cursor: pointer;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);
}

.history-item:hover {
  border-color: var(--neon-cyan);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(33, 230, 255, 0.2);
}

.history-item__image {
  position: relative;
  width: 100%;
  padding-top: 60%; /* 紧凑比例 */
  background: var(--color-bg-secondary);
  overflow: hidden;
}

.history-item__image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.history-item:hover .history-item__image img {
  transform: scale(1.1);
}

.history-item__overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.history-item:hover .history-item__overlay {
  opacity: 1;
}

.history-item__info {
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
}

.history-item__time {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  margin-bottom: 4px;
}

.history-item__size {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

/* 响应式 */
@media (max-width: 768px) {
  .screenshot-actions {
    grid-template-columns: 1fr;
  }

  .preview-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: flex-start;
  }

  .preview-header__actions {
    width: 100%;
    flex-direction: column;
  }

  .preview-header__actions .el-button {
    width: 100%;
  }

  .preview-info {
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .history-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--spacing-md);
  }
}
</style>
