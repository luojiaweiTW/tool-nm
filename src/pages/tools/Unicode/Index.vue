<template>
  <div class="tool-unicode">
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">Unicode 转换</h1>
        <p class="tool-header__description">Unicode 编码、HTML 实体、原文互相转换</p>
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
      <div class="convert-section">
        <!-- 原文 -->
        <NeonCard title="📝 原文本">
          <template #extra>
            <NeonButton size="small" @click="copyText(originalText)">
              <i class="i-mdi-content-copy mr-1" />
              复制
            </NeonButton>
          </template>
          <NeonTextarea
            v-model="originalText"
            placeholder="输入原文本..."
            :rows="8"
            @input="handleOriginalChange"
          />
        </NeonCard>

        <!-- Unicode 编码 -->
        <NeonCard title="🔤 Unicode 编码">
          <template #extra>
            <NeonButton size="small" @click="copyText(unicodeText)">
              <i class="i-mdi-content-copy mr-1" />
              复制
            </NeonButton>
          </template>
          <NeonTextarea
            v-model="unicodeText"
            placeholder="\u4F60\u597D..."
            :rows="8"
            @input="handleUnicodeChange"
          />
          <div class="info-text">格式：\uXXXX</div>
        </NeonCard>

        <!-- HTML 实体 -->
        <NeonCard title="🌐 HTML 实体">
          <template #extra>
            <NeonButton size="small" @click="copyText(htmlEntityText)">
              <i class="i-mdi-content-copy mr-1" />
              复制
            </NeonButton>
          </template>
          <NeonTextarea
            v-model="htmlEntityText"
            placeholder="&amp;#20320;&amp;#22909;..."
            :rows="8"
            @input="handleHtmlEntityChange"
          />
          <div class="info-text">格式：&amp;#XXXXX;</div>
        </NeonCard>

        <!-- URL 编码 -->
        <NeonCard title="🔗 URL 编码">
          <template #extra>
            <NeonButton size="small" @click="copyText(urlEncodedText)">
              <i class="i-mdi-content-copy mr-1" />
              复制
            </NeonButton>
          </template>
          <NeonTextarea
            v-model="urlEncodedText"
            placeholder="%E4%BD%A0%E5%A5%BD..."
            :rows="8"
            @input="handleUrlEncodedChange"
          />
          <div class="info-text">格式：%XX</div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

const originalText = ref('')
const unicodeText = ref('')
const htmlEntityText = ref('')
const urlEncodedText = ref('')

// 原文变化
function handleOriginalChange() {
  if (!originalText.value) {
    unicodeText.value = ''
    htmlEntityText.value = ''
    urlEncodedText.value = ''
    return
  }

  // 转 Unicode
  unicodeText.value = Array.from(originalText.value)
    .map(char => {
      const code = char.charCodeAt(0)
      return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char
    })
    .join('')

  // 转 HTML 实体
  htmlEntityText.value = Array.from(originalText.value)
    .map(char => {
      const code = char.charCodeAt(0)
      return code > 127 ? `&#${code};` : char
    })
    .join('')

  // 转 URL 编码
  try {
    urlEncodedText.value = encodeURIComponent(originalText.value)
  } catch (e) {
    urlEncodedText.value = ''
  }
}

// Unicode 变化
function handleUnicodeChange() {
  if (!unicodeText.value) {
    originalText.value = ''
    htmlEntityText.value = ''
    urlEncodedText.value = ''
    return
  }

  try {
    // Unicode 转原文
    originalText.value = unicodeText.value.replace(/\\u([\dA-Fa-f]{4})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    
    // 然后更新其他格式
    handleOriginalChange()
  } catch (e) {
    ElMessage.error('Unicode 解码失败')
  }
}

// HTML 实体变化
function handleHtmlEntityChange() {
  if (!htmlEntityText.value) {
    originalText.value = ''
    unicodeText.value = ''
    urlEncodedText.value = ''
    return
  }

  try {
    // HTML 实体转原文
    const textarea = document.createElement('textarea')
    textarea.innerHTML = htmlEntityText.value
    originalText.value = textarea.value

    // 然后更新其他格式
    handleOriginalChange()
  } catch (e) {
    ElMessage.error('HTML 实体解码失败')
  }
}

// URL 编码变化
function handleUrlEncodedChange() {
  if (!urlEncodedText.value) {
    originalText.value = ''
    unicodeText.value = ''
    htmlEntityText.value = ''
    return
  }

  try {
    // URL 解码转原文
    originalText.value = decodeURIComponent(urlEncodedText.value)
    
    // 然后更新其他格式
    handleOriginalChange()
  } catch (e) {
    ElMessage.error('URL 解码失败')
  }
}

// 示例
function handleExample() {
  originalText.value = '你好，世界！Hello World!'
  handleOriginalChange()
  ElMessage.info('已加载示例')
}

// 复制文本
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  originalText.value = ''
  unicodeText.value = ''
  htmlEntityText.value = ''
  urlEncodedText.value = ''
}
</script>

<style scoped>
.tool-unicode {
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
  border: 2px solid var(--neon-pink);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(255, 42, 161, 0.4);
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
}

.convert-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.info-text {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}
</style>
