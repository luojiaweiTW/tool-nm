<template>
  <div class="doc-to-markdown-container">
    <div class="tool-header">
      <h1 class="tool-title">
        <span class="icon">📄</span>
        文档转 Markdown
      </h1>
      <p class="tool-description">
        将 Word 文档转换为 Markdown 格式，自动提取图片并打包下载
      </p>
    </div>

    <div class="content-wrapper">
      <!-- 上传区域 -->
      <div class="upload-section neon-card">
        <div class="card-header">
          <h3>上传文档</h3>
        </div>
        <div class="card-body">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".docx"
            :show-file-list="false"
          >
            <el-icon class="upload-icon"><Upload /></el-icon>
            <div class="upload-text">
              <p class="primary-text">点击或拖拽文件到此处</p>
              <p class="secondary-text">支持 .docx 格式的 Word 文档</p>
            </div>
          </el-upload>

          <div v-if="selectedFile" class="file-info">
            <div class="file-item">
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              <el-button 
                type="danger" 
                size="small" 
                text
                @click="clearFile"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="action-buttons">
            <el-button
              type="primary"
              :disabled="!selectedFile || converting"
              :loading="converting"
              @click="convertToMarkdown"
            >
              <el-icon><Refresh /></el-icon>
              {{ converting ? '转换中...' : '开始转换' }}
            </el-button>
          </div>
        </div>
      </div>

      <!-- 转换选项 -->
      <div class="options-section neon-card">
        <div class="card-header">
          <h3>转换选项</h3>
        </div>
        <div class="card-body">
          <el-form label-position="left" label-width="120px">
            <el-form-item label="图片处理">
              <el-radio-group v-model="options.imageHandling">
                <el-radio value="embed">嵌入图片（Base64）</el-radio>
                <el-radio value="extract">提取为文件</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="图片目录名">
              <el-input
                v-model="options.imageFolderName"
                placeholder="images"
                :disabled="options.imageHandling === 'embed'"
              />
            </el-form-item>

            <el-form-item label="标题样式">
              <el-radio-group v-model="options.headingStyle">
                <el-radio value="atx">ATX 风格 (# ## ###)</el-radio>
                <el-radio value="setext">Setext 风格</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="代码块">
              <el-switch v-model="options.preserveCodeBlocks" />
              <span class="form-tip">保留代码块格式</span>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 下载区域 -->
      <div v-if="markdownContent" class="download-section neon-card">
        <div class="card-header">
          <h3>下载</h3>
        </div>
        <div class="card-body">
          <div class="download-buttons">
            <el-button
              type="success"
              @click="downloadZip"
            >
              <el-icon><Download /></el-icon>
              下载 ZIP 包
            </el-button>

            <el-button
              type="primary"
              @click="downloadMarkdown"
            >
              <el-icon><Document /></el-icon>
              仅下载 Markdown
            </el-button>

            <el-button
              @click="copyToClipboard"
            >
              <el-icon><CopyDocument /></el-icon>
              复制到剪贴板
            </el-button>
          </div>

          <div class="download-info">
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <template #title>
                <div class="alert-content">
                  <p style="font-weight: bold; font-size: 14px; color: var(--neon-cyan); margin-bottom: 8px;">📦 ZIP 包将包含：</p>
                  <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li style="font-size: 13px;"><strong style="color: var(--neon-cyan);">📝 Markdown 文件</strong> - {{ selectedFile?.name.replace('.docx', '.md') }}</li>
                    <li v-if="options.imageHandling === 'extract' && extractedImages.length > 0" style="font-size: 13px;">
                      <strong style="color: var(--neon-yellow);">🖼️ 图片文件夹</strong> - {{ options.imageFolderName }}/ (共 <span style="color: var(--neon-yellow); font-weight: bold;">{{ extractedImages.length }}</span> 张)
                    </li>
                  </ul>
                </div>
              </template>
            </el-alert>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div v-if="statistics" class="statistics-section neon-card">
        <div class="card-header">
          <h3>统计信息</h3>
        </div>
        <div class="card-body">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">字符数</div>
              <div class="stat-value">{{ statistics.characters }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">行数</div>
              <div class="stat-value">{{ statistics.lines }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">段落数</div>
              <div class="stat-value">{{ statistics.paragraphs }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">图片数</div>
              <div class="stat-value">{{ extractedImages.length }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { Upload, Document, Close, Refresh, Download, CopyDocument } from '@element-plus/icons-vue'
import * as mammoth from 'mammoth'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Buffer } from 'buffer'

// 将 Buffer 挂载到全局，让 mammoth 可以使用
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer
}

// 状态
const uploadRef = ref()
const selectedFile = ref<File | null>(null)
const converting = ref(false)
const markdownContent = ref('')
const extractedImages = ref<Array<{ filename: string; data: string; buffer: Uint8Array }>>([])

// 选项
const options = reactive({
  imageHandling: 'extract' as 'embed' | 'extract',
  imageFolderName: 'images',
  headingStyle: 'atx' as 'atx' | 'setext',
  preserveCodeBlocks: true,
})

// 统计信息
const statistics = computed(() => {
  if (!markdownContent.value) return null
  
  const lines = markdownContent.value.split('\n')
  const paragraphs = markdownContent.value.split(/\n\s*\n/).filter(p => p.trim())
  
  return {
    characters: markdownContent.value.length,
    lines: lines.length,
    paragraphs: paragraphs.length,
  }
})

// 文件选择
const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  // 清除之前的结果
  markdownContent.value = ''
  extractedImages.value = []
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
  markdownContent.value = ''
  extractedImages.value = []
  uploadRef.value?.clearFiles()
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 转换为 Markdown
const convertToMarkdown = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  converting.value = true
  extractedImages.value = []

  try {
    console.log('📄 开始转换文档...')
    const arrayBuffer = await selectedFile.value.arrayBuffer()
    console.log('✓ 文件已读取，大小:', arrayBuffer.byteLength, 'bytes')
    
    let imageCounter = 0
    const imageMap = new Map<string, string>()

    // 使用 mammoth 转换为 HTML，然后转为 Markdown
    console.log('🔄 开始解析 Word 文档...')
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement(async (image: any) => {
          imageCounter++
          console.log(`🖼️ 发现图片 #${imageCounter}:`, {
            contentType: image.contentType,
            hasRead: typeof image.read === 'function'
          })
          
          const filename = `image-${imageCounter}.${getImageExtension(image.contentType)}`
          
          try {
            // 读取图片数据
            const buffer = await image.read()
            console.log(`  ✓ 图片 ${filename} 读取成功，大小:`, buffer.byteLength || buffer.length, 'bytes')
            
            // 确保 buffer 是 Uint8Array
            const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
            console.log(`  ✓ 转换为 Uint8Array，大小:`, uint8Array.byteLength, 'bytes')
            
            // 转换为 base64
            const base64 = arrayBufferToBase64(uint8Array.buffer)
            const dataUrl = `data:${image.contentType};base64,${base64}`
            
            // 保存图片信息（同时保存 buffer 和 uint8Array）
            extractedImages.value.push({
              filename,
              data: dataUrl,
              buffer: uint8Array,  // 使用 Uint8Array
            })
            
            console.log(`  ✓ 图片 ${filename} 已保存到 extractedImages`)
            
            imageMap.set(filename, dataUrl)
            
            // 根据选项返回不同的图片引用
            if (options.imageHandling === 'embed') {
              return { src: dataUrl }
            } else {
              return { src: `${options.imageFolderName}/${filename}` }
            }
          } catch (error) {
            console.error(`  ✗ 图片 ${filename} 处理失败:`, error)
            throw error
          }
        }),
      }
    )
    
    console.log('✓ Word 解析完成')
    console.log('📊 解析结果:', {
      提取的图片数量: extractedImages.value.length,
      消息数量: result.messages.length
    })

    // 将 HTML 转换为 Markdown（简单转换）
    markdownContent.value = htmlToMarkdown(result.value)

    // 显示警告信息（如果有）
    if (result.messages.length > 0) {
      console.warn('转换警告:', result.messages)
    }

    ElNotification({
      title: '转换成功',
      message: `已转换为 Markdown，提取了 ${extractedImages.value.length} 张图片`,
      type: 'success',
      duration: 3000,
    })
  } catch (error: any) {
    console.error('转换失败:', error)
    ElMessage.error('转换失败: ' + error.message)
  } finally {
    converting.value = false
  }
}

// ArrayBuffer 转 Base64（浏览器环境优化版本）
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer)
  
  // 使用更高效的方式转换大文件
  // 分块处理，避免栈溢出
  const chunkSize = 8192
  let binary = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}

// 获取图片扩展名
const getImageExtension = (contentType: string): string => {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/webp': 'webp',
  }
  return map[contentType] || 'png'
}

// HTML 转 Markdown（简单实现）
const htmlToMarkdown = (html: string): string => {
  let md = html
  
  // 标题
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
  
  // 段落
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  
  // 粗体和斜体
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
  
  // 链接
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  
  // 图片
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
  
  // 列表
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
  md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n')
  
  // 代码
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n\n')
  
  // 换行
  md = md.replace(/<br\s*\/?>/gi, '\n')
  
  // 清理多余的 HTML 标签
  md = md.replace(/<[^>]+>/g, '')
  
  // 清理多余的空行
  md = md.replace(/\n{3,}/g, '\n\n')
  
  return md.trim()
}

// 下载 ZIP
const downloadZip = async () => {
  if (!markdownContent.value || !selectedFile.value) return

  try {
    const zip = new JSZip()
    const filename = selectedFile.value.name.replace('.docx', '')

    console.log('开始生成 ZIP...')
    console.log('图片处理模式:', options.imageHandling)
    console.log('提取的图片数量:', extractedImages.value.length)

    // 添加 Markdown 文件
    zip.file(`${filename}.md`, markdownContent.value)
    console.log('✓ 已添加 Markdown 文件')

    // 添加图片（如果是提取模式）
    if (options.imageHandling === 'extract' && extractedImages.value.length > 0) {
      const imagesFolder = zip.folder(options.imageFolderName)
      
      for (const img of extractedImages.value) {
        console.log(`  添加图片: ${img.filename}, 大小: ${img.buffer.byteLength} bytes`)
        imagesFolder?.file(img.filename, img.buffer)
      }
      console.log(`✓ 已添加 ${extractedImages.value.length} 张图片到 ${options.imageFolderName}/ 文件夹`)
    }

    // 生成并下载 ZIP
    console.log('正在生成 ZIP 文件...')
    const blob = await zip.generateAsync({ type: 'blob' })
    console.log('✓ ZIP 生成成功，大小:', blob.size, 'bytes')
    
    saveAs(blob, `${filename}.zip`)

    ElMessage.success('ZIP 包已下载')
  } catch (error: any) {
    console.error('生成 ZIP 失败:', error)
    ElMessage.error('生成 ZIP 失败: ' + error.message)
  }
}

// 仅下载 Markdown
const downloadMarkdown = () => {
  if (!markdownContent.value || !selectedFile.value) return

  const filename = selectedFile.value.name.replace('.docx', '.md')
  const blob = new Blob([markdownContent.value], { type: 'text/markdown;charset=utf-8' })
  saveAs(blob, filename)

  ElMessage.success('Markdown 文件已下载')
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!markdownContent.value) return

  try {
    await navigator.clipboard.writeText(markdownContent.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="css">
.doc-to-markdown-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
}

.tool-header {
  margin-bottom: 2rem;
  text-align: center;
}

.tool-title {
  font-size: 2rem;
  font-weight: bold;
  color: var(--neon-cyan);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.tool-title .icon {
  font-size: 2.5rem;
}

.tool-description {
  color: var(--text-secondary);
  font-size: 1rem;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.neon-card {
  background: var(--card-bg);
  border: 2px solid var(--neon-cyan);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.3);
}

.card-header {
  padding: 1rem 1.5rem;
  background: rgba(33, 230, 255, 0.1);
  border-bottom: 1px solid var(--neon-cyan);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  color: var(--neon-cyan);
  font-size: 1.2rem;
  font-weight: bold;
}

.card-body {
  padding: 1.5rem;
}

/* 上传区域 */
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: 3rem 2rem;
  background: rgba(33, 230, 255, 0.05);
  border: 2px dashed var(--neon-cyan);
  border-radius: 8px;
  transition: all 0.3s;
}

.upload-area :deep(.el-upload-dragger:hover) {
  background: rgba(33, 230, 255, 0.1);
  border-color: var(--neon-pink);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.3);
}

.upload-icon {
  font-size: 4rem;
  color: var(--neon-cyan);
  margin-bottom: 1rem;
}

.upload-text .primary-text {
  font-size: 1.2rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.upload-text .secondary-text {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.file-info {
  margin-top: 1.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid var(--neon-cyan);
  border-radius: 8px;
}

.file-name {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

.file-size {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

/* 选项区域 */
.form-tip {
  margin-left: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 下载区域 */
.download-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.download-info {
  margin-top: 1rem;
}

.alert-content ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
}

.alert-content li {
  margin: 0.3rem 0;
}

/* 统计信息 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid var(--neon-cyan);
  border-radius: 8px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  color: var(--neon-cyan);
  font-size: 1.8rem;
  font-weight: bold;
}

/* 响应式 */
@media (max-width: 768px) {
  .doc-to-markdown-container {
    padding: 1rem;
  }

  .tool-title {
    font-size: 1.5rem;
  }

  .download-buttons {
    flex-direction: column;
  }

  .images-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>

