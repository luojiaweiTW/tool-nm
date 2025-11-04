<template>
  <div class="tool-page">
    <Header
      title="时间戳转换"
      description="Unix 时间戳与日期时间相互转换"
      icon="i-mdi-clock-outline"
    >
      <template #actions>
        <NeonButton variant="primary" size="small" data-action="copy" @click="handleNow">
          <i class="i-mdi-clock-fast" />
          当前时间
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="timestamp-converter">
        <!-- 时间戳转日期 -->
        <NeonCard title="时间戳 → 日期时间" icon="i-mdi-arrow-right-bold" compact>
          <div class="converter-section">
            <NeonInput
              v-model="timestampInput"
              label="时间戳（秒）"
              placeholder="例如: 1234567890"
              type="number"
              clearable
              @input="handleTimestampInput"
            >
              <template #suffix>
                <span class="input-unit">秒</span>
              </template>
            </NeonInput>

            <NeonInput
              v-model="timestampMillisInput"
              label="时间戳（毫秒）"
              placeholder="例如: 1234567890000"
              type="number"
              clearable
              @input="handleTimestampMillisInput"
            >
              <template #suffix>
                <span class="input-unit">毫秒</span>
              </template>
            </NeonInput>

            <div class="result-group">
              <div class="result-item">
                <label>本地时间</label>
                <div class="result-value">{{ localDateTime }}</div>
              </div>
              <div class="result-item">
                <label>UTC 时间</label>
                <div class="result-value">{{ utcDateTime }}</div>
              </div>
              <div class="result-item">
                <label>ISO 8601</label>
                <div class="result-value">{{ isoDateTime }}</div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 日期转时间戳 -->
        <NeonCard title="日期时间 → 时间戳" icon="i-mdi-arrow-left-bold" compact>
          <div class="converter-section">
            <div class="datetime-picker-group">
              <label class="field-label">选择日期时间</label>
              <el-date-picker
                v-model="dateInput"
                type="datetime"
                placeholder="选择日期时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%;"
                @change="handleDateInput"
              />
            </div>

            <div class="result-group">
              <div class="result-item">
                <label>时间戳（秒）</label>
                <div class="result-value copyable" @click="copyToClipboard(timestampOutput)">
                  {{ timestampOutput }}
                  <i class="i-mdi-content-copy copy-icon" />
                </div>
              </div>
              <div class="result-item">
                <label>时间戳（毫秒）</label>
                <div class="result-value copyable" @click="copyToClipboard(timestampMillisOutput)">
                  {{ timestampMillisOutput }}
                  <i class="i-mdi-content-copy copy-icon" />
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 常用时间格式模板 -->
        <NeonCard title="常用格式模板" icon="i-mdi-format-list-bulleted" variant="info" compact>
          <div class="format-templates">
            <div v-for="format in formatTemplates" :key="format.name" class="template-item">
              <div class="template-label">{{ format.name }}</div>
              <div class="template-value copyable" @click="copyToClipboard(format.value)">
                {{ format.value }}
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'

const timestampInput = ref('')
const timestampMillisInput = ref('')
const dateInput = ref('')

const localDateTime = computed(() => {
  const ts = parseInt(timestampInput.value)
  if (isNaN(ts)) return '-'
  const date = new Date(ts * 1000)
  return date.toLocaleString('zh-CN', { hour12: false })
})

const utcDateTime = computed(() => {
  const ts = parseInt(timestampInput.value)
  if (isNaN(ts)) return '-'
  const date = new Date(ts * 1000)
  return date.toUTCString()
})

const isoDateTime = computed(() => {
  const ts = parseInt(timestampInput.value)
  if (isNaN(ts)) return '-'
  const date = new Date(ts * 1000)
  return date.toISOString()
})

const timestampOutput = computed(() => {
  if (!dateInput.value) return '-'
  return Math.floor(new Date(dateInput.value).getTime() / 1000).toString()
})

const timestampMillisOutput = computed(() => {
  if (!dateInput.value) return '-'
  return new Date(dateInput.value).getTime().toString()
})

const formatTemplates = computed(() => {
  const now = new Date()
  return [
    { name: 'YYYY-MM-DD HH:mm:ss', value: formatDate(now, 'YYYY-MM-DD HH:mm:ss') },
    { name: 'YYYY/MM/DD HH:mm:ss', value: formatDate(now, 'YYYY/MM/DD HH:mm:ss') },
    { name: 'YYYY-MM-DD', value: formatDate(now, 'YYYY-MM-DD') },
    { name: 'HH:mm:ss', value: formatDate(now, 'HH:mm:ss') },
    { name: 'Unix 时间戳（秒）', value: Math.floor(now.getTime() / 1000).toString() },
    { name: 'Unix 时间戳（毫秒）', value: now.getTime().toString() },
  ]
})

const handleTimestampInput = () => {
  if (timestampInput.value) {
    timestampMillisInput.value = (parseInt(timestampInput.value) * 1000).toString()
  }
}

const handleTimestampMillisInput = () => {
  if (timestampMillisInput.value) {
    timestampInput.value = Math.floor(parseInt(timestampMillisInput.value) / 1000).toString()
  }
}

const handleDateInput = () => {
  // 日期输入后自动计算时间戳
}

const handleNow = () => {
  const now = Date.now()
  timestampInput.value = Math.floor(now / 1000).toString()
  timestampMillisInput.value = now.toString()
  dateInput.value = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  ElMessage.success('已设置为当前时间')
}

const copyToClipboard = (text: string) => {
  if (!text || text === '-') {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

onMounted(() => {
  handleNow()
})
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

/* 🎨 霓虹风格滚动条 */
.tool-page__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tool-page__content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.tool-page__content::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.tool-page__content::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.timestamp-converter {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.timestamp-converter > :last-child {
  grid-column: 1 / -1;
}

.converter-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.input-unit {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.datetime-picker-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.result-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.result-item label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.result-value {
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-base);
  color: var(--neon-cyan);
  background-color: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-sm);
}

.result-value.copyable {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all var(--transition-base) var(--transition-timing);
}

.result-value.copyable:hover {
  background-color: rgba(33, 230, 255, 0.1);
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.copy-icon {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.result-value.copyable:hover .copy-icon {
  opacity: 1;
}

.format-templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.template-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.template-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-muted);
}

.template-value {
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-purple);
  background-color: rgba(155, 92, 255, 0.05);
  border: 1px solid rgba(155, 92, 255, 0.2);
  border-radius: var(--radius-sm);
}

@media (max-width: 1024px) {
  .timestamp-converter {
    grid-template-columns: 1fr;
  }
  
  .timestamp-converter > :last-child {
    grid-column: 1;
  }
}
</style>

