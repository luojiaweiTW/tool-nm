<template>
  <div class="tool-page">
    <Header
      title="Cron 表达式"
      description="Cron 表达式生成器与解析工具"
      icon="i-mdi-calendar-clock"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" data-action="copy" @click="handleCopy">
          <i class="i-mdi-content-copy" />
          复制表达式
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="cron-generator">
        <!-- 表达式输入 -->
        <NeonCard title="Cron 表达式" icon="i-mdi-code-tags" compact>
          <div class="generator-section">
            <div class="field-group">
              <label class="field-label">直接输入表达式</label>
              <NeonInput
                v-model="cronInput"
                placeholder="例如: 0 */5 * * * ?"
                @input="handleInputChange"
              >
                <template #suffix>
                  <NeonButton
                    variant="text"
                    size="small"
                    @click="parseExpression"
                  >
                    <i class="i-mdi-import" />
                    解析
                  </NeonButton>
                </template>
              </NeonInput>
            </div>

            <div class="divider">
              <span>或使用生成器</span>
            </div>

            <div class="field-group">
              <label class="field-label">秒 (0-59)</label>
              <NeonInput v-model="fields.second" placeholder="* 或 0-59 或 */5" @input="updateExpression" />
            </div>

            <div class="field-group">
              <label class="field-label">分钟 (0-59)</label>
              <NeonInput v-model="fields.minute" placeholder="* 或 0-59 或 */10" @input="updateExpression" />
            </div>

            <div class="field-group">
              <label class="field-label">小时 (0-23)</label>
              <NeonInput v-model="fields.hour" placeholder="* 或 0-23 或 8-18" @input="updateExpression" />
            </div>

            <div class="field-group">
              <label class="field-label">日期 (1-31)</label>
              <NeonInput v-model="fields.day" placeholder="* 或 1-31 或 */2" @input="updateExpression" />
            </div>

            <div class="field-group">
              <label class="field-label">月份 (1-12)</label>
              <NeonInput v-model="fields.month" placeholder="* 或 1-12 或 JAN-DEC" @input="updateExpression" />
            </div>

            <div class="field-group">
              <label class="field-label">星期 (0-7)</label>
              <NeonInput v-model="fields.week" placeholder="* 或 0-7 或 MON-SUN" @input="updateExpression" />
            </div>

            <div class="generated-result">
              <label class="result-label">当前 Cron 表达式</label>
              <div class="cron-expression" @click="handleCopy">
                <code class="mono">{{ cronExpression }}</code>
                <i class="i-mdi-content-copy copy-icon" />
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 解析与说明 -->
        <div class="cron-details">
          <NeonCard title="表达式说明" icon="i-mdi-information" compact>
            <div class="description-section">
              <div class="description-item">
                <strong>当前表达式：</strong>
                <code class="mono neon-text-cyan">{{ cronExpression }}</code>
              </div>
              <div class="description-item">
                <strong>可读描述：</strong>
                <p>{{ cronDescription }}</p>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="未来10次执行时间" icon="i-mdi-clock-fast" variant="success" compact>
            <div v-if="parseError" class="parse-error">
              <i class="i-mdi-alert-circle" />
              {{ parseError }}
            </div>
            <div v-else class="next-runs">
              <div v-for="(time, index) in nextRuns" :key="index" class="next-run-item">
                <span class="run-number">#{{ index + 1 }}</span>
                <span class="run-time">{{ time }}</span>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="常用示例" icon="i-mdi-star" variant="warning" compact>
            <div class="examples-grid">
              <div
                v-for="example in examples"
                :key="example.cron"
                class="example-item"
                @click="applyExample(example)"
              >
                <div class="example-cron">
                  <code class="mono">{{ example.cron }}</code>
                  <i class="i-mdi-arrow-right-bold" />
                </div>
                <div class="example-desc">{{ example.description }}</div>
              </div>
            </div>
          </NeonCard>

          <NeonCard title="语法说明" icon="i-mdi-help-circle" variant="info" compact>
            <div class="syntax-help">
              <div class="help-item">
                <code>*</code> - 任意值
              </div>
              <div class="help-item">
                <code>*/5</code> - 每5个单位
              </div>
              <div class="help-item">
                <code>1-5</code> - 范围（1到5）
              </div>
              <div class="help-item">
                <code>1,3,5</code> - 列表（1、3、5）
              </div>
              <div class="help-item">
                <code>?</code> - 不指定（日期/星期）
              </div>
              <div class="help-item">
                <code>L</code> - 最后一天/周
              </div>
            </div>
          </NeonCard>
        </div>
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

interface CronFields {
  second: string
  minute: string
  hour: string
  day: string
  month: string
  week: string
}

const cronInput = ref('0 */5 * * * ?')
const parseError = ref('')

const fields = ref<CronFields>({
  second: '0',
  minute: '*/5',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
})

const cronExpression = computed(() => {
  return cronInput.value || `${fields.value.second} ${fields.value.minute} ${fields.value.hour} ${fields.value.day} ${fields.value.month} ${fields.value.week}`
})

const handleInputChange = () => {
  parseError.value = ''
}

const updateExpression = () => {
  cronInput.value = `${fields.value.second} ${fields.value.minute} ${fields.value.hour} ${fields.value.day} ${fields.value.month} ${fields.value.week}`
  parseError.value = ''
}

const parseExpression = () => {
  const parts = cronInput.value.trim().split(/\s+/)
  if (parts.length === 6) {
    fields.value = {
      second: parts[0],
      minute: parts[1],
      hour: parts[2],
      day: parts[3],
      month: parts[4],
      week: parts[5],
    }
    parseError.value = ''
    ElMessage.success('表达式解析成功')
  } else {
    parseError.value = 'Cron 表达式格式错误，应为6个字段，用空格分隔'
    ElMessage.error('表达式格式错误')
  }
}

const cronDescription = computed(() => {
  const { second, minute, hour, day, month, week } = fields.value
  
  let desc = '每'
  
  // 月份
  if (month !== '*') {
    desc += month + '月'
  }
  
  // 日期或星期
  if (week !== '?' && week !== '*') {
    desc += '星期' + week
  } else if (day !== '*') {
    desc += day + '日'
  } else {
    desc += '天'
  }
  
  // 小时
  if (hour === '*') {
    desc += '的每小时'
  } else if (hour.includes('/')) {
    desc += `每${hour.split('/')[1]}小时`
  } else {
    desc += hour + '点'
  }
  
  // 分钟
  if (minute === '*') {
    desc += '每分钟'
  } else if (minute.includes('/')) {
    desc += `每${minute.split('/')[1]}分钟`
  } else {
    desc += minute + '分'
  }
  
  // 秒
  if (second !== '0' && second !== '*') {
    desc += second + '秒'
  }
  
  desc += '执行'
  
  return desc
})

const nextRuns = computed(() => {
  try {
    const parts = cronExpression.value.trim().split(/\s+/)
    if (parts.length !== 6) {
      parseError.value = 'Cron 表达式应包含6个字段'
      return []
    }

    const [second, minute, hour, day, month, week] = parts
    const now = new Date()
    const runs: string[] = []
    let currentTime = new Date(now)
    
    // 简化的 Cron 执行时间计算（支持常见模式）
    let foundCount = 0
    let iterations = 0
    const maxIterations = 10000 // 防止无限循环
    
    while (foundCount < 10 && iterations < maxIterations) {
      iterations++
      currentTime = new Date(currentTime.getTime() + 1000) // 每秒检查一次
      
      const s = currentTime.getSeconds()
      const m = currentTime.getMinutes()
      const h = currentTime.getHours()
      const d = currentTime.getDate()
      const mon = currentTime.getMonth() + 1
      const w = currentTime.getDay()
      
      // 检查是否匹配
      if (matchField(second, s, 0, 59) &&
          matchField(minute, m, 0, 59) &&
          matchField(hour, h, 0, 23) &&
          matchField(day, d, 1, 31) &&
          matchField(month, mon, 1, 12) &&
          matchField(week, w, 0, 7)) {
        runs.push(currentTime.toLocaleString('zh-CN', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false 
        }))
        foundCount++
        // 跳到下一秒，避免重复
        currentTime = new Date(currentTime.getTime() + 1000)
      }
    }
    
    parseError.value = ''
    return runs
  } catch (error: any) {
    parseError.value = '表达式解析错误'
    return []
  }
})

/**
 * 匹配 Cron 字段
 */
const matchField = (pattern: string, value: number, min: number, max: number): boolean => {
  if (pattern === '*' || pattern === '?') {
    return true
  }
  
  // 处理 */n 格式（每n个单位）
  if (pattern.startsWith('*/')) {
    const step = parseInt(pattern.substring(2))
    return value % step === 0
  }
  
  // 处理单个值
  if (/^\d+$/.test(pattern)) {
    return value === parseInt(pattern)
  }
  
  // 处理范围 n-m
  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-').map(v => parseInt(v))
    return value >= start && value <= end
  }
  
  // 处理列表 n,m,k
  if (pattern.includes(',')) {
    const values = pattern.split(',').map(v => parseInt(v.trim()))
    return values.includes(value)
  }
  
  return true
}

const examples = [
  { cron: '0 0 * * * ?', description: '每小时整点执行' },
  { cron: '0 */5 * * * ?', description: '每5分钟执行' },
  { cron: '0 0 0 * * ?', description: '每天凌晨执行' },
  { cron: '0 0 9 * * ?', description: '每天上午9点执行' },
  { cron: '0 0 9 * * MON-FRI', description: '工作日上午9点执行' },
  { cron: '0 0 0 1 * ?', description: '每月1号凌晨执行' },
  { cron: '0 0/30 8-18 * * ?', description: '工作时间每30分钟' },
  { cron: '0 0 12 ? * WED', description: '每周三中午12点' },
]

const applyExample = (example: typeof examples[0]) => {
  cronInput.value = example.cron
  parseExpression()
  ElMessage.success('已应用示例')
}

const handleClear = () => {
  cronInput.value = '0 0 * * * ?'
  fields.value = {
    second: '0',
    minute: '0',
    hour: '*',
    day: '*',
    month: '*',
    week: '?',
  }
  parseError.value = ''
  ElMessage.success('已清空')
}

const handleCopy = () => {
  navigator.clipboard.writeText(cronExpression.value).then(() => {
    ElMessage.success('Cron 表达式已复制到剪贴板')
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

.cron-generator {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.generator-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.divider {
  position: relative;
  text-align: center;
  margin: var(--spacing-md) 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border);
}

.divider span {
  position: relative;
  display: inline-block;
  padding: 0 var(--spacing-md);
  background-color: var(--color-panel);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  z-index: 1;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.generated-result {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 2px solid var(--color-border);
}

.result-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
  display: block;
}

.cron-expression {
  padding: var(--spacing-lg);
  background-color: rgba(10, 14, 39, 0.6);
  border: 2px solid var(--neon-yellow);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 20px rgba(255, 230, 0, 0.1), var(--glow-yellow);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cron-expression:hover {
  border-color: var(--neon-yellow-light);
  box-shadow: inset 0 0 30px rgba(255, 230, 0, 0.2), var(--glow-yellow);
  background-color: rgba(255, 230, 0, 0.1);
}

.cron-expression code {
  font-size: var(--font-size-lg);
  color: var(--neon-yellow);
  background: none;
  border: none;
  padding: 0;
  font-weight: var(--font-weight-bold);
}

.copy-icon {
  opacity: 0;
  color: var(--neon-yellow);
  transition: opacity var(--transition-fast);
}

.cron-expression:hover .copy-icon {
  opacity: 1;
}

.cron-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.description-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.description-item {
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.description-item strong {
  display: block;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.description-item p {
  margin: 0;
  color: var(--neon-yellow);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
}

.parse-error {
  padding: var(--spacing-md);
  background-color: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.next-runs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 500px;
  overflow-y: auto;
}

.next-run-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(208, 255, 0, 0.05);
  border-left: 3px solid var(--neon-lime);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  transition: all var(--transition-base) var(--transition-timing);
}

.next-run-item:hover {
  background-color: rgba(208, 255, 0, 0.1);
  border-color: var(--neon-lime-light);
  transform: translateX(4px);
}

.run-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--neon-lime);
  background-color: rgba(208, 255, 0, 0.1);
  border: 1px solid var(--neon-lime);
  border-radius: 50%;
  font-size: var(--font-size-xs);
  flex-shrink: 0;
}

.run-time {
  flex: 1;
  color: var(--neon-lime);
  font-weight: var(--font-weight-medium);
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.example-item {
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.4);
  border: 1px solid var(--neon-yellow);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.example-item:hover {
  background-color: rgba(255, 230, 0, 0.1);
  border-color: var(--neon-yellow-light);
  box-shadow: var(--glow-yellow);
  transform: translateY(-2px);
}

.example-cron {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-yellow);
  font-weight: var(--font-weight-bold);
}

.example-desc {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.syntax-help {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.help-item {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.3);
  border: 1px solid var(--neon-purple);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.help-item code {
  color: var(--neon-purple);
  font-weight: var(--font-weight-bold);
  background: none;
  border: none;
  padding: 0;
  margin-right: var(--spacing-xs);
}

@media (max-width: 1024px) {
  .cron-generator {
    grid-template-columns: 1fr;
  }
}
</style>

