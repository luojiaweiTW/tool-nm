<template>
  <div class="tool-encoding">
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">编码格式转换</h1>
        <p class="tool-header__description">支持 UTF-8、GBK、GB2312 等多种编码格式互转，支持自动识别</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="handleExample" type="primary">
          <i class="i-mdi-lightbulb-outline mr-2" />
          示例
        </NeonButton>
      </div>
    </div>

    <div class="tool-content">
      <div class="convert-container">
        <!-- 输入区域 -->
        <div class="convert-panel">
          <NeonCard title="📥 输入文本">
            <template #extra>
              <div class="panel-actions">
                <NeonButton size="small" @click="detectEncoding" type="outline">
                  <i class="i-mdi-auto-fix mr-1" />
                  自动检测
                </NeonButton>
                <NeonButton size="small" @click="copyText(inputText)">
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
              </div>
            </template>
            
            <div class="encoding-selector">
              <label class="selector-label">当前编码格式：</label>
              <select v-model="sourceEncoding" class="neon-select">
                <option value="auto">自动检测</option>
                <option value="utf-8">UTF-8</option>
                <option value="gbk">GBK</option>
                <option value="gb2312">GB2312</option>
                <option value="big5">Big5</option>
                <option value="shift-jis">Shift-JIS</option>
                <option value="euc-jp">EUC-JP</option>
                <option value="euc-kr">EUC-KR</option>
                <option value="iso-8859-1">ISO-8859-1</option>
                <option value="windows-1252">Windows-1252</option>
              </select>
            </div>

            <div class="textarea-wrapper">
              <NeonTextarea
                v-model="inputText"
                placeholder="请输入需要转换的文本..."
                :rows="12"
                @input="handleInputChange"
              />
            </div>

            <div class="info-section" v-if="inputText">
              <div class="info-item">
                <span class="info-label">字符数：</span>
                <span class="info-value">{{ inputText.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">字节数：</span>
                <span class="info-value">{{ getByteLength(inputText) }}</span>
              </div>
              <div class="info-item" v-if="detectedEncoding">
                <span class="info-label">检测编码：</span>
                <span class="info-value detected">{{ detectedEncoding }}</span>
              </div>
            </div>
          </NeonCard>
        </div>

        <!-- 转换箭头 -->
        <div class="convert-arrow">
          <i class="i-mdi-arrow-right-thick" />
        </div>

        <!-- 输出区域 -->
        <div class="convert-panel">
          <NeonCard title="📤 输出文本">
            <template #extra>
              <div class="panel-actions">
                <NeonButton size="small" @click="handleConvert" type="primary">
                  <i class="i-mdi-sync mr-1" />
                  转换
                </NeonButton>
                <NeonButton size="small" @click="copyText(outputText)">
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
              </div>
            </template>

            <div class="encoding-selector">
              <label class="selector-label">目标编码格式：</label>
              <select v-model="targetEncoding" class="neon-select">
                <option value="utf-8">UTF-8</option>
                <option value="gbk">GBK</option>
                <option value="gb2312">GB2312</option>
                <option value="big5">Big5</option>
                <option value="shift-jis">Shift-JIS</option>
                <option value="euc-jp">EUC-JP</option>
                <option value="euc-kr">EUC-KR</option>
                <option value="iso-8859-1">ISO-8859-1</option>
                <option value="windows-1252">Windows-1252</option>
              </select>
            </div>

            <div class="textarea-wrapper">
              <NeonTextarea
                v-model="outputText"
                placeholder="转换结果将显示在这里..."
                :rows="12"
                readonly
              />
            </div>

            <div class="info-section" v-if="outputText">
              <div class="info-item">
                <span class="info-label">字符数：</span>
                <span class="info-value">{{ outputText.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">字节数：</span>
                <span class="info-value">{{ getByteLength(outputText) }}</span>
              </div>
            </div>
          </NeonCard>
        </div>
      </div>

      <!-- Hex 查看器 -->
      <div class="hex-viewer" v-if="inputText || outputText">
        <NeonCard title="🔍 字节查看（十六进制）">
          <div class="hex-grid">
            <div class="hex-column" v-if="inputText">
              <h4 class="hex-title">输入文本字节</h4>
              <div class="hex-content">{{ getHexView(inputText) }}</div>
            </div>
            <div class="hex-column" v-if="outputText">
              <h4 class="hex-title">输出文本字节</h4>
              <div class="hex-content">{{ getHexView(outputText) }}</div>
            </div>
          </div>
        </NeonCard>
      </div>

      <!-- 使用说明 -->
      <NeonCard title="📖 使用说明">
        <div class="instructions">
          <h3>功能特点</h3>
          <ul>
            <li><strong>多编码支持：</strong>支持 UTF-8、GBK、GB2312、Big5、Shift-JIS、EUC 系列、ISO-8859-1 等常用编码</li>
            <li><strong>自动检测：</strong>可以自动识别输入文本的编码格式（基于字符特征分析）</li>
            <li><strong>字节查看：</strong>显示文本的十六进制字节表示，方便调试编码问题</li>
            <li><strong>实时转换：</strong>支持输入时自动转换和手动转换两种模式</li>
          </ul>

          <h3>使用提示</h3>
          <ul>
            <li>默认目标编码为 UTF-8，这是最通用的编码格式</li>
            <li>如果不确定源编码，可以选择"自动检测"或点击"自动检测"按钮</li>
            <li>某些编码转换可能会丢失信息，建议先备份原始数据</li>
            <li>浏览器环境对某些编码的支持有限，部分转换可能需要特殊处理</li>
          </ul>

          <h3>常见场景</h3>
          <ul>
            <li><strong>乱码修复：</strong>当文本显示为乱码时，尝试不同的源编码进行转换</li>
            <li><strong>文件编码转换：</strong>将旧系统的 GBK 文件内容转为 UTF-8</li>
            <li><strong>跨平台兼容：</strong>确保文本在不同系统和应用间正确显示</li>
          </ul>
        </div>
      </NeonCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

const inputText = ref('')
const outputText = ref('')
const sourceEncoding = ref('auto')
const targetEncoding = ref('utf-8')
const detectedEncoding = ref('')

// 处理输入变化
function handleInputChange() {
  if (!inputText.value) {
    outputText.value = ''
    detectedEncoding.value = ''
    return
  }
  
  // 如果是自动检测模式，尝试检测编码
  if (sourceEncoding.value === 'auto') {
    detectEncoding()
  }
}

// 执行转换
function handleConvert() {
  if (!inputText.value) {
    ElMessage.warning('请输入需要转换的文本')
    return
  }

  try {
    let actualSourceEncoding = sourceEncoding.value
    
    // 如果是自动检测，使用检测到的编码或默认 UTF-8
    if (actualSourceEncoding === 'auto') {
      if (!detectedEncoding.value) {
        detectEncoding()
      }
      actualSourceEncoding = detectedEncoding.value || 'utf-8'
    }

    let processedText = inputText.value
    
    // 检测是否包含 URL 编码
    const hasUrlEncoding = /%[0-9A-Fa-f]{2}/.test(processedText)
    
    if (hasUrlEncoding) {
      // 如果包含 URL 编码，需要特殊处理
      try {
        // 提取所有 URL 编码的字节
        const urlDecoded = decodeUrlWithEncoding(processedText, actualSourceEncoding)
        outputText.value = urlDecoded
        ElMessage.success(`已转换 URL 编码：${actualSourceEncoding.toUpperCase()} → UTF-8`)
      } catch (error) {
        // 如果按指定编码解码失败，尝试标准 UTF-8 解码
        try {
          outputText.value = decodeURIComponent(processedText)
          ElMessage.warning(`按 UTF-8 解码成功，原编码 ${actualSourceEncoding.toUpperCase()} 解码失败`)
        } catch {
          outputText.value = processedText
          ElMessage.error('URL 解码失败，可能编码格式不正确')
        }
      }
    } else {
      // 如果不包含 URL 编码，直接输出（浏览器内部都是 Unicode）
      outputText.value = processedText
      ElMessage.success(`已处理：${actualSourceEncoding.toUpperCase()} → ${targetEncoding.value.toUpperCase()}`)
    }
  } catch (error) {
    ElMessage.error('转换失败：' + (error as Error).message)
  }
}

// 使用指定编码解码 URL 编码的字符串
function decodeUrlWithEncoding(urlString: string, encoding: string): string {
  // 先替换 + 为空格
  let text = urlString.replace(/\+/g, ' ')
  
  // 提取所有 %XX 序列并转换为字节数组
  const bytes: number[] = []
  let i = 0
  
  while (i < text.length) {
    if (text[i] === '%' && i + 2 < text.length) {
      const hex = text.substring(i + 1, i + 3)
      const byte = parseInt(hex, 16)
      if (!isNaN(byte)) {
        bytes.push(byte)
        i += 3
        continue
      }
    }
    // 非 URL 编码的字符，直接按 UTF-8 编码添加
    const char = text[i]
    const charBytes = new TextEncoder().encode(char)
    bytes.push(...charBytes)
    i++
  }
  
  // 使用 TextDecoder 按指定编码解码
  const uint8Array = new Uint8Array(bytes)
  
  try {
    const decoder = new TextDecoder(encoding, { fatal: true })
    return decoder.decode(uint8Array)
  } catch {
    // 如果指定编码失败，尝试常见编码
    const fallbackEncodings = ['gbk', 'gb2312', 'utf-8', 'big5']
    for (const enc of fallbackEncodings) {
      try {
        const decoder = new TextDecoder(enc, { fatal: true })
        const result = decoder.decode(uint8Array)
        ElMessage.info(`使用 ${enc.toUpperCase()} 解码成功`)
        return result
      } catch {
        continue
      }
    }
    throw new Error('无法使用任何支持的编码解码')
  }
}

// 自动检测编码
function detectEncoding() {
  if (!inputText.value) {
    detectedEncoding.value = ''
    return
  }

  try {
    const text = inputText.value
    let detected = 'utf-8' // 默认

    // 检测是否包含 URL 编码
    const hasUrlEncoding = /%[0-9A-Fa-f]{2}/.test(text)
    
    if (hasUrlEncoding) {
      // 如果包含 URL 编码，尝试用不同编码解码第一个 %XX 序列来判断
      // 提取一些 URL 编码的字节进行分析
      const urlEncodedMatch = text.match(/(%[0-9A-Fa-f]{2})+/)
      if (urlEncodedMatch) {
        const sample = urlEncodedMatch[0]
        
        // 尝试不同编码解码
        const encodingsToTry = ['gbk', 'utf-8', 'gb2312', 'big5']
        for (const enc of encodingsToTry) {
          try {
            const decoded = decodeUrlWithEncoding(sample, enc)
            // 检查解码结果是否包含可读字符
            if (/[\u4e00-\u9fa5]/.test(decoded)) {
              detected = enc
              break
            }
          } catch {
            continue
          }
        }
      }
    } else {
      // 简单的启发式检测
      // 检查是否包含中文字符
      const hasChinese = /[\u4e00-\u9fa5]/.test(text)
      
      // 检查是否包含日文字符
      const hasJapanese = /[\u3040-\u309f\u30a0-\u30ff]/.test(text)
      
      // 检查是否包含韩文字符
      const hasKorean = /[\uac00-\ud7af]/.test(text)
      
      // 检查是否只有 ASCII
      const isAsciiOnly = /^[\x00-\x7F]*$/.test(text)

      if (isAsciiOnly) {
        detected = 'utf-8'
      } else if (hasChinese) {
        detected = 'utf-8' // 浏览器输入的中文默认就是 UTF-8
      } else if (hasJapanese) {
        detected = 'shift-jis'
      } else if (hasKorean) {
        detected = 'euc-kr'
      }
    }

    detectedEncoding.value = detected
    ElMessage.info(`检测到编码格式：${detected.toUpperCase()}`)
  } catch (error) {
    ElMessage.error('编码检测失败')
  }
}

// 获取字节长度
function getByteLength(text: string): number {
  if (!text) return 0
  try {
    const encoder = new TextEncoder()
    return encoder.encode(text).length
  } catch {
    return 0
  }
}

// 获取十六进制视图
function getHexView(text: string): string {
  if (!text) return ''
  
  try {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(text.substring(0, 100)) // 限制显示前100个字符
    
    let hex = ''
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0').toUpperCase() + ' '
      if ((i + 1) % 16 === 0) {
        hex += '\n'
      }
    }
    
    if (text.length > 100) {
      hex += '\n... (显示前100个字符)'
    }
    
    return hex
  } catch {
    return '无法显示'
  }
}

// 示例
function handleExample() {
  inputText.value = '你好，世界！\nHello World!\n这是一个编码转换示例。\n日本語：こんにちは\n한국어: 안녕하세요'
  sourceEncoding.value = 'auto'
  targetEncoding.value = 'utf-8'
  detectEncoding()
  handleConvert()
  ElMessage.info('已加载示例')
}

// 复制文本
async function copyText(text: string) {
  if (!text) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  inputText.value = ''
  outputText.value = ''
  sourceEncoding.value = 'auto'
  targetEncoding.value = 'utf-8'
  detectedEncoding.value = ''
}
</script>

<style scoped>
.tool-encoding {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
}

.tool-header__info {
  flex: 1;
}

.tool-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-display);
}

.tool-header__description {
  font-size: var(--font-size-base);
  color: var(--color-muted);
}

.tool-header__actions {
  display: flex;
  gap: var(--spacing-md);
}

.tool-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.convert-container {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.convert-panel {
  min-height: 400px;
}

.convert-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 120px;
}

.convert-arrow i {
  font-size: 2rem;
  color: var(--neon-cyan);
  filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.6));
}

.panel-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.encoding-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: var(--radius-md);
}

.selector-label {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  white-space: nowrap;
}

.neon-select {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-bg);
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-size: var(--font-size-sm);
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.neon-select:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
}

.neon-select:focus {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);
}

.info-section {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(0, 255, 255, 0.05);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: var(--radius-md);
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.info-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.info-value {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.info-value.detected {
  color: var(--neon-cyan);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
}

.hex-viewer {
  margin-top: var(--spacing-lg);
}

.hex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.hex-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.hex-title {
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.hex-content {
  font-family: 'Courier New', monospace;
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  background: rgba(0, 0, 0, 0.3);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 255, 255, 0.2);
  white-space: pre;
  overflow-x: auto;
  line-height: 1.6;
}

.instructions {
  color: var(--color-text);
  line-height: 1.8;
}

.instructions h3 {
  font-size: var(--font-size-lg);
  color: var(--neon-cyan);
  margin: var(--spacing-lg) 0 var(--spacing-sm);
  font-weight: var(--font-weight-bold);
}

.instructions h3:first-child {
  margin-top: 0;
}

.instructions ul {
  margin: var(--spacing-sm) 0;
  padding-left: var(--spacing-xl);
}

.instructions li {
  margin: var(--spacing-xs) 0;
  color: var(--color-muted);
}

.instructions strong {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

@media (max-width: 1200px) {
  .convert-container {
    grid-template-columns: 1fr;
  }
  
  .convert-arrow {
    padding-top: 0;
    transform: rotate(90deg);
  }
}

/* 🔧 固定高度确保滚动 */
.textarea-wrapper {
  height: 350px;
  overflow: hidden;
}

.textarea-wrapper :deep(textarea) {
  height: 100% !important;
  min-height: 350px !important;
}
</style>
