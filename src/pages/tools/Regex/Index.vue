<template>
  <div class="tool-page">
    <Header
      title="正则表达式测试器"
      description="正则表达式测试、匹配与替换工具"
      icon="i-mdi-regex"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" @click="handleTest">
          <i class="i-mdi-play" />
          测试匹配
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="regex-tester">
        <!-- 正则表达式输入 -->
        <NeonCard title="正则表达式" icon="i-mdi-regex" variant="primary" compact>
          <div class="regex-input-section">
            <div class="regex-input-wrapper">
              <span class="regex-delimiter">/</span>
              <NeonInput
                v-model="pattern"
                placeholder="输入正则表达式，如：\d+"
                class="regex-pattern-input"
                @input="handleTest"
              />
              <span class="regex-delimiter">/</span>
              <div class="regex-flags">
                <el-checkbox v-model="flags.g" @change="handleTest">g</el-checkbox>
                <el-checkbox v-model="flags.i" @change="handleTest">i</el-checkbox>
                <el-checkbox v-model="flags.m" @change="handleTest">m</el-checkbox>
                <el-checkbox v-model="flags.s" @change="handleTest">s</el-checkbox>
              </div>
            </div>

            <div v-if="regexError" class="regex-error">
              <i class="i-mdi-alert-circle" />
              {{ regexError }}
            </div>
            <div v-else-if="pattern" class="regex-info">
              <i class="i-mdi-check-circle" style="color: var(--neon-lime);" />
              正则表达式有效
            </div>
          </div>
        </NeonCard>

        <!-- 测试文本 -->
        <NeonCard title="测试文本" icon="i-mdi-text-box" compact>
          <NeonTextarea
            v-model="testText"
            placeholder="输入要测试的文本..."
            :rows="12"
            show-count
            :maxlength="50000"
            @input="handleTest"
          />
        </NeonCard>

        <!-- 匹配结果 -->
        <NeonCard title="匹配结果" compact>
          <template #extra>
            <span v-if="matches.length > 0" class="match-count">
              找到 <strong>{{ matches.length }}</strong> 个匹配
            </span>
          </template>

          <div v-if="matches.length === 0" class="empty-result">
            <i class="i-mdi-magnify empty-result-icon" />
            <p>{{ testText ? '未找到匹配项' : '输入文本和正则表达式开始测试' }}</p>
          </div>
          <div v-else class="matches-list">
            <div v-for="(match, index) in matches" :key="index" class="match-item">
              <div class="match-header">
                <span class="match-index">#{{ index + 1 }}</span>
                <span class="match-position">位置: {{ match.index }}</span>
                <NeonButton variant="text" size="small" @click="copyMatch(match.value)">
                  <i class="i-mdi-content-copy" />
                  复制
                </NeonButton>
              </div>
              <div class="match-value">
                <code class="mono">{{ match.value }}</code>
              </div>
              <div v-if="match.groups && match.groups.length > 0" class="match-groups">
                <div class="groups-label">捕获组：</div>
                <div v-for="(group, gIndex) in match.groups" :key="gIndex" class="group-item">
                  <span class="group-index">${{ gIndex + 1 }}</span>
                  <code class="mono">{{ group }}</code>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 替换功能 -->
        <NeonCard title="替换" icon="i-mdi-find-replace" variant="success" compact>
          <div class="replace-section">
            <NeonInput
              v-model="replaceText"
              label="替换为"
              placeholder="输入替换文本，支持 $1, $2 等捕获组"
            />

            <NeonButton variant="success" style="width: 100%;" @click="handleReplace">
              <i class="i-mdi-swap-horizontal" />
              执行替换
            </NeonButton>

            <div v-if="replacedText" class="replaced-result">
              <label class="result-label">替换结果</label>
              <pre class="result-output mono">{{ replacedText }}</pre>
              <NeonButton variant="outline" size="small" @click="copyReplaced">
                <i class="i-mdi-content-copy" />
                复制结果
              </NeonButton>
            </div>
          </div>
        </NeonCard>

        <!-- 常用正则示例 -->
        <NeonCard title="常用正则" icon="i-mdi-star" variant="warning" compact style="grid-column: 1 / -1;">
          <div class="regex-examples">
            <div
              v-for="example in regexExamples"
              :key="example.pattern"
              class="regex-example"
              @click="applyExample(example)"
            >
              <div class="regex-example__pattern">
                <code class="mono">{{ example.pattern }}</code>
              </div>
              <div class="regex-example__desc">{{ example.description }}</div>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

interface Match {
  value: string
  index: number
  groups?: string[]
}

interface RegexFlags {
  g: boolean
  i: boolean
  m: boolean
  s: boolean
}

const pattern = ref('')
const testText = ref('')
const replaceText = ref('')
const replacedText = ref('')
const regexError = ref('')

const flags = ref<RegexFlags>({
  g: true,
  i: false,
  m: false,
  s: false,
})

const matches = ref<Match[]>([])

const flagsString = computed(() => {
  let str = ''
  if (flags.value.g) str += 'g'
  if (flags.value.i) str += 'i'
  if (flags.value.m) str += 'm'
  if (flags.value.s) str += 's'
  return str
})

const handleTest = () => {
  matches.value = []
  regexError.value = ''
  replacedText.value = ''

  if (!pattern.value || !testText.value) {
    return
  }

  try {
    const regex = new RegExp(pattern.value, flagsString.value)
    const results: Match[] = []

    if (flags.value.g) {
      // 全局匹配
      let match
      while ((match = regex.exec(testText.value)) !== null) {
        results.push({
          value: match[0],
          index: match.index,
          groups: match.slice(1),
        })
        
        // 防止无限循环
        if (!regex.global) break
      }
    } else {
      // 单次匹配
      const match = regex.exec(testText.value)
      if (match) {
        results.push({
          value: match[0],
          index: match.index,
          groups: match.slice(1),
        })
      }
    }

    matches.value = results
    
    if (results.length > 0) {
      ElMessage.success(`找到 ${results.length} 个匹配`)
    }
  } catch (error: any) {
    regexError.value = error.message
  }
}

const handleReplace = () => {
  if (!pattern.value || !testText.value) {
    ElMessage.warning('请输入正则表达式和测试文本')
    return
  }

  if (!replaceText.value) {
    ElMessage.warning('请输入替换文本')
    return
  }

  try {
    const regex = new RegExp(pattern.value, flagsString.value)
    replacedText.value = testText.value.replace(regex, replaceText.value)
    ElMessage.success('替换成功')
  } catch (error: any) {
    ElMessage.error(`替换失败: ${error.message}`)
  }
}

const handleClear = () => {
  pattern.value = ''
  testText.value = ''
  replaceText.value = ''
  replacedText.value = ''
  matches.value = []
  regexError.value = ''
  flags.value = { g: true, i: false, m: false, s: false }
  ElMessage.success('已清空')
}

const copyMatch = (value: string) => {
  navigator.clipboard.writeText(value).then(() => {
    ElMessage.success('匹配项已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const copyReplaced = () => {
  if (!replacedText.value) return

  navigator.clipboard.writeText(replacedText.value).then(() => {
    ElMessage.success('替换结果已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const regexExamples = [
  { pattern: '\\d+', description: '匹配数字', test: '价格 123 元，数量 456 个' },
  { pattern: '[a-zA-Z]+', description: '匹配字母', test: 'Hello World 123' },
  { pattern: '[\\w.-]+@[\\w.-]+\\.\\w+', description: '匹配邮箱', test: '联系邮箱：test@example.com 或 user@domain.cn' },
  { pattern: '1[3-9]\\d{9}', description: '匹配手机号', test: '手机：13812345678，座机：021-12345678' },
  { pattern: 'https?://[\\w.-]+', description: '匹配URL', test: '访问 https://example.com 或 http://test.com' },
  { pattern: '#[0-9a-fA-F]{6}', description: '匹配颜色代码', test: '主色 #21e6ff，辅色 #ff2aa1' },
  { pattern: '\\d{4}-\\d{2}-\\d{2}', description: '匹配日期', test: '日期：2025-10-10 时间：12:30:45' },
  { pattern: '\\b(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\b', description: '匹配IP地址', test: '服务器：192.168.1.1 或 10.0.0.255' },
]

const applyExample = (example: typeof regexExamples[0]) => {
  pattern.value = example.pattern
  if (example.test) {
    testText.value = example.test
  }
  ElMessage.success('已应用示例正则')
  setTimeout(() => handleTest(), 100)
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

.regex-tester {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.regex-input-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.regex-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.6);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 20px rgba(33, 230, 255, 0.1), var(--glow-cyan);
}

.regex-delimiter {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  flex-shrink: 0;
}

.regex-pattern-input {
  flex: 1;
}

.regex-pattern-input :deep(.neon-input) {
  background: transparent;
  border: none;
  box-shadow: none;
}

.regex-pattern-input :deep(.neon-input__inner) {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  color: var(--neon-cyan);
}

.regex-flags {
  display: flex;
  gap: var(--spacing-sm);
  padding-left: var(--spacing-sm);
  border-left: 1px solid var(--color-border);
}

.regex-flags :deep(.el-checkbox__label) {
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
}

.regex-error {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-sm);
  color: var(--neon-pink);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.regex-info {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(208, 255, 0, 0.1);
  border: 1px solid var(--neon-lime);
  border-radius: var(--radius-sm);
  color: var(--neon-lime);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.match-count {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.match-count strong {
  color: var(--neon-cyan);
  font-size: var(--font-size-base);
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl);
  min-height: 200px;
  color: var(--color-muted);
}

.empty-result-icon {
  font-size: 3em;
  opacity: 0.5;
}

.matches-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.match-item {
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.4);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 15px rgba(33, 230, 255, 0.1);
}

.match-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.match-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  background-color: rgba(33, 230, 255, 0.1);
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-sm);
}

.match-position {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  font-family: var(--font-family-mono);
}

.match-value {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.3);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-sm);
}

.match-value code {
  color: var(--neon-cyan);
  background: none;
  border: none;
  padding: 0;
  font-size: var(--font-size-base);
  word-break: break-all;
}

.match-groups {
  padding: var(--spacing-sm);
  background-color: rgba(155, 92, 255, 0.05);
  border: 1px solid rgba(155, 92, 255, 0.2);
  border-radius: var(--radius-sm);
}

.groups-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-bottom: var(--spacing-xs);
}

.group-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}

.group-index {
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-bold);
  color: var(--neon-purple);
  min-width: 24px;
}

.group-item code {
  color: var(--neon-purple);
  background: none;
  border: none;
  padding: 0;
}

.replace-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.replaced-result {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.result-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.result-output {
  margin: 0;
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.6);
  border: 1px solid var(--neon-lime);
  border-radius: var(--radius-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--neon-lime);
  word-break: break-all;
  white-space: pre-wrap;
}

.regex-examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.regex-example {
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.4);
  border: 1px solid var(--neon-yellow);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.regex-example:hover {
  background-color: rgba(255, 230, 0, 0.1);
  border-color: var(--neon-yellow-light);
  box-shadow: var(--glow-yellow);
  transform: translateY(-2px);
}

.regex-example__pattern {
  margin-bottom: var(--spacing-xs);
}

.regex-example__pattern code {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--neon-yellow);
  background: none;
  border: none;
  padding: 0;
}

.regex-example__desc {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

@media (max-width: 1024px) {
  .regex-tester {
    grid-template-columns: 1fr;
  }
}
</style>

