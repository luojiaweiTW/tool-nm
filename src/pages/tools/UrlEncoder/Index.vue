<template>
  <div class="tool-page">
    <Header
      title="URL 编码解码"
      description="URL 编码与解码工具，支持完整URL和组件编码"
      icon="i-mdi-link-variant"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" data-action="copy" @click="handleCopy">
          <i class="i-mdi-content-copy" />
          复制结果 <span style="opacity: 0.6;">(Ctrl+Shift+C)</span>
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="url-encoder">
        <!-- 左侧：输入区 -->
        <NeonCard class="url-encoder__panel" title="输入" compact>
          <template #extra>
            <el-radio-group v-model="mode" size="default">
              <el-radio-button value="encode">
                <i class="i-mdi-lock" />
                编码
              </el-radio-button>
              <el-radio-button value="decode">
                <i class="i-mdi-lock-open" />
                解码
              </el-radio-button>
            </el-radio-group>
          </template>
          
          <div class="encoder-section">
            <NeonTextarea
              v-model="inputText"
              :label="mode === 'encode' ? '原始文本/URL' : '已编码的 URL'"
              :placeholder="mode === 'encode' ? '输入要编码的文本或URL...' : '输入要解码的 URL...'"
              :rows="15"
              show-count
              :maxlength="10000"
            />

            <div class="action-buttons">
              <NeonButton
                variant="primary"
                style="width: 100%;"
                @click="handleConvert"
              >
                <i :class="mode === 'encode' ? 'i-mdi-lock' : 'i-mdi-lock-open'" />
                {{ mode === 'encode' ? 'URL 编码' : 'URL 解码' }}
              </NeonButton>
            </div>
          </div>
        </NeonCard>

        <!-- 右侧：输出区 -->
        <NeonCard class="url-encoder__panel" title="输出结果" compact>
          <template #extra>
            <el-radio-group v-model="encodeType" size="small" @change="handleConvert">
              <el-radio-button value="standard">标准编码</el-radio-button>
              <el-radio-button value="component">组件编码</el-radio-button>
            </el-radio-group>
          </template>

          <div v-if="!outputText" class="empty-result">
            <i class="i-mdi-code-tags empty-result-icon" />
            <p>转换结果将显示在这里...</p>
          </div>
          <div v-else class="result-content">
            <div class="result-header">
              <span class="result-label">
                {{ mode === 'encode' ? '已编码' : '已解码' }}
              </span>
              <span class="result-size">
                {{ outputText.length }} 字符
              </span>
            </div>
            <pre class="result-output mono">{{ outputText }}</pre>
          </div>
        </NeonCard>

        <!-- 示例 -->
        <NeonCard title="常用示例" icon="i-mdi-lightbulb-outline" variant="info" compact style="grid-column: 1 / -1;">
          <div class="examples">
            <div class="example-item">
              <div class="example-label">中文参数</div>
              <div class="example-original">原始：https://example.com?name=张三&city=北京</div>
              <div class="example-encoded copyable" @click="copyExample('https://example.com?name=%E5%BC%A0%E4%B8%89&city=%E5%8C%97%E4%BA%AC')">
                编码：https://example.com?name=%E5%BC%A0%E4%B8%89&city=%E5%8C%97%E4%BA%AC
                <i class="i-mdi-content-copy copy-icon" />
              </div>
            </div>
            <div class="example-item">
              <div class="example-label">特殊字符</div>
              <div class="example-original">原始：key=hello world!@#$%^&*()</div>
              <div class="example-encoded copyable" @click="copyExample('key=hello%20world!%40%23%24%25%5E%26*()') ">
                编码：key=hello%20world!%40%23%24%25%5E%26*()
                <i class="i-mdi-content-copy copy-icon" />
              </div>
            </div>
            <div class="example-item">
              <div class="example-label">JSON 参数</div>
              <div class="example-original">原始：data={"name":"test","value":123}</div>
              <div class="example-encoded copyable" @click="copyExample('data=%7B%22name%22%3A%22test%22%2C%22value%22%3A123%7D')">
                编码：data=%7B%22name%22%3A%22test%22%2C%22value%22%3A123%7D
                <i class="i-mdi-content-copy copy-icon" />
              </div>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

type Mode = 'encode' | 'decode'
type EncodeType = 'standard' | 'component'

const mode = ref<Mode>('encode')
const encodeType = ref<EncodeType>('component')
const inputText = ref('')
const outputText = ref('')

const handleConvert = () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  try {
    if (mode.value === 'encode') {
      // 编码
      if (encodeType.value === 'standard') {
        outputText.value = encodeURI(inputText.value)
      } else {
        outputText.value = encodeURIComponent(inputText.value)
      }
      ElMessage.success('编码成功')
    } else {
      // 解码
      outputText.value = decodeURIComponent(inputText.value)
      ElMessage.success('解码成功')
    }
  } catch (error: any) {
    ElMessage.error(`转换失败: ${error.message}`)
    outputText.value = ''
  }
}

const handleClear = () => {
  inputText.value = ''
  outputText.value = ''
  ElMessage.success('已清空')
}

const handleCopy = () => {
  if (!outputText.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }

  navigator.clipboard.writeText(outputText.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const copyExample = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('示例已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
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

.url-encoder {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.url-encoder__panel {
  display: flex;
  flex-direction: column;
}

.url-encoder__panel :deep(.neon-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.encoder-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  flex: 1;
}

.encoder-section :deep(.neon-textarea-wrapper) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.encoder-section :deep(.neon-textarea) {
  flex: 1;
}

.encoder-section :deep(.neon-textarea__inner) {
  flex: 1;
  min-height: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  min-height: 300px;
  color: var(--color-muted);
}

.empty-result-icon {
  font-size: 3em;
  opacity: 0.5;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--spacing-sm);
  border-bottom: var(--border-width-thin) solid var(--color-border);
}

.result-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.result-size {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  font-family: var(--font-family-mono);
}

.result-output {
  margin: 0;
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.6);
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-md);
  min-height: 300px;
  max-height: 500px;
  overflow: auto;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--neon-lime);
  word-break: break-all;
  white-space: pre-wrap;
}

.examples {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.example-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.example-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--neon-purple);
  margin-bottom: var(--spacing-xs);
}

.example-original {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm);
  background-color: rgba(33, 230, 255, 0.05);
  border-radius: var(--radius-sm);
}

.example-encoded {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  padding: var(--spacing-sm);
  background-color: rgba(33, 230, 255, 0.1);
  border: 1px solid rgba(33, 230, 255, 0.3);
  border-radius: var(--radius-sm);
}

.copyable {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all var(--transition-base) var(--transition-timing);
}

.copyable:hover {
  background-color: rgba(33, 230, 255, 0.2);
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.copy-icon {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.copyable:hover .copy-icon {
  opacity: 1;
}

@media (max-width: 1024px) {
  .url-encoder {
    grid-template-columns: 1fr;
  }
}
</style>

