<template>
  <div class="url-encoder-compact">
    <!-- 顶部工具栏 -->
    <div class="formatter-toolbar">
      <div class="formatter-toolbar__left">
        <h2 class="formatter-title">
          <i class="i-mdi-link-variant" />
          <span>URL 编码解码</span>
        </h2>
        <span class="formatter-desc">支持完整URL和组件编码</span>
      </div>
      <div class="formatter-toolbar__right">
        <CompactButtonGroup size="sm">
          <CompactButton variant="default" size="sm" icon="i-mdi-broom" @click="handleClear">
            清空
          </CompactButton>
          <CompactButton variant="primary" size="sm" icon="i-mdi-content-copy" @click="handleCopy">
            复制
          </CompactButton>
        </CompactButtonGroup>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="formatter-content">
      <!-- 左侧：输入 -->
      <CompactCard title="输入">
        <template #actions>
          <CompactButtonGroup size="xs">
            <CompactButton
              :active="mode === 'encode'"
              size="xs"
              icon="i-mdi-lock"
              @click="mode = 'encode'"
            >
              编码
            </CompactButton>
            <CompactButton
              :active="mode === 'decode'"
              size="xs"
              icon="i-mdi-lock-open"
              @click="mode = 'decode'"
            >
              解码
            </CompactButton>
          </CompactButtonGroup>
        </template>

        <div class="editor-wrapper">
          <textarea
            v-model="inputText"
            class="compact-textarea"
            :placeholder="mode === 'encode' ? '输入要编码的文本或URL...' : '输入要解码的 URL...'"
            spellcheck="false"
          />
          <div class="editor-footer">
            <span class="char-count">{{ inputText.length }} 字符</span>
            <CompactButton
              variant="primary"
              size="sm"
              :icon="mode === 'encode' ? 'i-mdi-lock' : 'i-mdi-lock-open'"
              @click="handleConvert"
            >
              {{ mode === 'encode' ? '编码' : '解码' }}
            </CompactButton>
          </div>
        </div>
      </CompactCard>

      <!-- 右侧：结果 -->
      <CompactCard title="结果">
        <template #actions>
          <StatusTag v-if="outputText" type="success" icon="i-mdi-check-circle">
            {{ outputText.length }} 字符
          </StatusTag>
          <CompactButtonGroup v-if="mode === 'encode'" size="xs">
            <CompactButton
              :active="encodeType === 'standard'"
              size="xs"
              @click="encodeType = 'standard'; handleConvert()"
            >
              标准
            </CompactButton>
            <CompactButton
              :active="encodeType === 'component'"
              size="xs"
              @click="encodeType = 'component'; handleConvert()"
            >
              组件
            </CompactButton>
          </CompactButtonGroup>
        </template>

        <div class="editor-wrapper">
          <pre v-if="outputText" class="compact-output"><code>{{ outputText }}</code></pre>
          <div v-else class="empty-state-compact">
            <i class="i-mdi-code-tags" />
            <p>转换结果将显示在这里...</p>
          </div>
        </div>
      </CompactCard>
    </div>

    <!-- 底部示例区 -->
    <div class="examples-section">
      <CompactCard title="常用示例" icon="i-mdi-lightbulb-outline">
        <div class="examples-grid">
          <div
            v-for="(ex, idx) in examples"
            :key="idx"
            class="example-compact"
            @click="useExample(ex)"
          >
            <div class="example-compact__label">{{ ex.label }}</div>
            <div class="example-compact__original">{{ ex.original }}</div>
            <div class="example-compact__encoded">{{ ex.encoded }}</div>
          </div>
        </div>
      </CompactCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import CompactCard from '@/components/CompactCard.vue'
import CompactButton from '@/components/CompactButton.vue'
import CompactButtonGroup from '@/components/CompactButtonGroup.vue'
import StatusTag from '@/components/StatusTag.vue'

type Mode = 'encode' | 'decode'
type EncodeType = 'standard' | 'component'

const mode = ref<Mode>('encode')
const encodeType = ref<EncodeType>('standard')
const inputText = ref('')
const outputText = ref('')

const examples = [
  {
    label: '中文参数',
    original: 'https://example.com?name=张三&city=北京',
    encoded: 'https://example.com?name=%E5%BC%A0%E4%B8%89&city=%E5%8C%97%E4%BA%AC'
  },
  {
    label: '特殊字符',
    original: 'key=hello world!@#$%^&*()',
    encoded: 'key=hello%20world!%40%23%24%25%5E%26*()'
  },
  {
    label: '空格处理',
    original: 'search=hello world',
    encoded: 'search=hello+world'
  }
]

const handleConvert = () => {
  if (!inputText.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  try {
    if (mode.value === 'encode') {
      if (encodeType.value === 'standard') {
        outputText.value = encodeURI(inputText.value)
      } else {
        outputText.value = encodeURIComponent(inputText.value)
      }
      ElMessage.success('编码成功')
    } else {
      outputText.value = decodeURIComponent(inputText.value)
      ElMessage.success('解码成功')
    }
  } catch (error: any) {
    ElMessage.error(`转换失败: ${error.message}`)
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

const useExample = (ex: typeof examples[0]) => {
  mode.value = 'decode'
  inputText.value = ex.encoded
  handleConvert()
  ElMessage.success('已加载示例')
}
</script>

<style scoped>
.url-encoder-compact {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(10, 10, 20, 0.9) 0%, rgba(20, 20, 40, 0.95) 100%);
}

.formatter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(33, 230, 255, 0.15);
  gap: 16px;
  flex-shrink: 0;
}

.formatter-toolbar__left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.formatter-toolbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.formatter-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--neon-blue);
  margin: 0;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.formatter-title i {
  font-size: 20px;
}

.formatter-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.formatter-content {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px;
  overflow: hidden;
  min-height: 0;
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 10px;
}

.compact-textarea {
  flex: 1;
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.9);
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: all 0.25s ease;
}

.compact-textarea:focus {
  border-color: rgba(33, 230, 255, 0.4);
  background: rgba(0, 0, 0, 0.4);
  box-shadow: 0 0 0 2px rgba(33, 230, 255, 0.1);
}

.compact-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.char-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Cascadia Code', monospace;
}

.compact-output {
  flex: 1;
  margin: 0;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 4px;
  overflow: auto;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--neon-lime);
  white-space: pre-wrap;
  word-break: break-all;
}

.compact-output code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
}

.empty-state-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state-compact i {
  font-size: 40px;
  opacity: 0.5;
}

.empty-state-compact p {
  font-size: 12px;
  margin: 0;
  font-style: italic;
}

/* 示例区域 */
.examples-section {
  padding: 0 12px 12px;
  flex-shrink: 0;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 10px;
}

.example-compact {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(33, 230, 255, 0.15);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-compact:hover {
  border-color: rgba(33, 230, 255, 0.4);
  background: rgba(33, 230, 255, 0.05);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.1);
}

.example-compact__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--neon-blue);
  margin-bottom: 6px;
}

.example-compact__original,
.example-compact__encoded {
  font-size: 10px;
  font-family: 'Cascadia Code', monospace;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.example-compact__original {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.example-compact__encoded {
  color: rgba(255, 255, 255, 0.4);
}

/* 滚动条 */
.compact-textarea::-webkit-scrollbar,
.compact-output::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.compact-textarea::-webkit-scrollbar-track,
.compact-output::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 3px;
}

.compact-textarea::-webkit-scrollbar-thumb,
.compact-output::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.4);
  border-radius: 3px;
}

.compact-textarea::-webkit-scrollbar-thumb:hover,
.compact-output::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.6);
}

/* 响应式 */
@media (max-width: 1200px) {
  .formatter-content {
    grid-template-columns: 1fr;
  }
  
  .formatter-desc {
    display: none;
  }
}
</style>




