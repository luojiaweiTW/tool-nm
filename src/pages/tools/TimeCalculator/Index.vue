<template>
  <div class="time-calculator">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h3 class="page-title">
          <i class="i-mdi-calendar-clock" />
          时间计算器
        </h3>
        <p class="page-description">日期时间加减运算，计算时间差值，支持多种时间单位</p>
      </div>
    </div>

    <div class="calculator-container">
      <!-- 功能选择 -->
      <NeonCard class="mode-selector">
        <div class="mode-tabs">
          <div
            v-for="mode in modes"
            :key="mode.value"
            :class="['mode-tab', { active: currentMode === mode.value }]"
            @click="currentMode = mode.value"
          >
            <i :class="mode.icon" />
            <span>{{ mode.label }}</span>
          </div>
        </div>
      </NeonCard>

      <!-- 日期时间加减计算 -->
      <NeonCard v-if="currentMode === 'add-subtract'" title="日期时间加减">
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">输入类型</label>
            <div class="radio-group">
              <label class="radio-item">
                <input v-model="addSubtractType" type="radio" value="date" />
                <span>日期</span>
              </label>
              <label class="radio-item">
                <input v-model="addSubtractType" type="radio" value="datetime" />
                <span>日期时间</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">{{ addSubtractType === 'date' ? '起始日期' : '起始时间' }}</label>
            <NeonInput
              v-model="startDateTime"
              :type="addSubtractType === 'date' ? 'date' : 'datetime-local'"
              placeholder="选择日期时间"
            />
            <div class="form-hint">或留空使用当前时间</div>
          </div>

          <div class="form-group">
            <label class="form-label">运算</label>
            <div class="calculation-row">
              <select v-model="operation" class="neon-select">
                <option value="add">加上</option>
                <option value="subtract">减去</option>
              </select>
              <NeonInput
                v-model.number="timeValue"
                type="number"
                placeholder="数值"
                class="flex-1"
              />
              <select v-model="timeUnit" class="neon-select">
                <option v-if="addSubtractType === 'datetime'" value="seconds">秒</option>
                <option v-if="addSubtractType === 'datetime'" value="minutes">分钟</option>
                <option v-if="addSubtractType === 'datetime'" value="hours">小时</option>
                <option value="days">天</option>
                <option value="weeks">周</option>
                <option value="months">月</option>
                <option value="years">年</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <NeonButton @click="calculateAddSubtract" type="primary">
              <i class="i-mdi-calculator" />
              计算
            </NeonButton>
            <NeonButton @click="clearAddSubtract" type="outline">
              <i class="i-mdi-refresh" />
              重置
            </NeonButton>
          </div>

          <div v-if="addSubtractResult" class="result-section">
            <h4 class="result-title">计算结果</h4>
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">起始时间</span>
                <span class="result-value">{{ addSubtractResult.start }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">运算</span>
                <span class="result-value">{{ addSubtractResult.operation }}</span>
              </div>
              <div class="result-row highlight">
                <span class="result-label">结果时间</span>
                <span class="result-value">{{ addSubtractResult.end }}</span>
              </div>
              <div class="result-actions">
                <NeonButton @click="copyResult(addSubtractResult.end)" size="small">
                  <i class="i-mdi-content-copy" />
                  复制结果
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      </NeonCard>

      <!-- 时间差值计算 -->
      <NeonCard v-if="currentMode === 'difference'" title="时间差值计算">
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">输入类型</label>
            <div class="radio-group">
              <label class="radio-item">
                <input v-model="diffType" type="radio" value="date" />
                <span>日期</span>
              </label>
              <label class="radio-item">
                <input v-model="diffType" type="radio" value="datetime" />
                <span>日期时间</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">开始时间</label>
            <NeonInput
              v-model="diffStartDateTime"
              :type="diffType === 'date' ? 'date' : 'datetime-local'"
              placeholder="选择开始时间"
            />
          </div>

          <div class="form-group">
            <label class="form-label">结束时间</label>
            <NeonInput
              v-model="diffEndDateTime"
              :type="diffType === 'date' ? 'date' : 'datetime-local'"
              placeholder="选择结束时间"
            />
            <div class="form-hint">或留空使用当前时间</div>
          </div>

          <div class="form-actions">
            <NeonButton @click="calculateDifference" type="primary">
              <i class="i-mdi-calculator" />
              计算差值
            </NeonButton>
            <NeonButton @click="clearDifference" type="outline">
              <i class="i-mdi-refresh" />
              重置
            </NeonButton>
          </div>

          <div v-if="diffResult" class="result-section">
            <h4 class="result-title">时间差值</h4>
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">开始时间</span>
                <span class="result-value">{{ diffResult.start }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">结束时间</span>
                <span class="result-value">{{ diffResult.end }}</span>
              </div>
              <div class="result-divider"></div>
              <div class="result-row highlight">
                <span class="result-label">总共相差</span>
                <span class="result-value">{{ diffResult.totalDays }} 天</span>
              </div>
              <div class="result-grid">
                <div class="result-item">
                  <span class="item-value">{{ diffResult.years }}</span>
                  <span class="item-label">年</span>
                </div>
                <div class="result-item">
                  <span class="item-value">{{ diffResult.months }}</span>
                  <span class="item-label">月</span>
                </div>
                <div class="result-item">
                  <span class="item-value">{{ diffResult.days }}</span>
                  <span class="item-label">天</span>
                </div>
                <div v-if="diffType === 'datetime'" class="result-item">
                  <span class="item-value">{{ diffResult.hours }}</span>
                  <span class="item-label">小时</span>
                </div>
                <div v-if="diffType === 'datetime'" class="result-item">
                  <span class="item-value">{{ diffResult.minutes }}</span>
                  <span class="item-label">分钟</span>
                </div>
                <div v-if="diffType === 'datetime'" class="result-item">
                  <span class="item-value">{{ diffResult.seconds }}</span>
                  <span class="item-label">秒</span>
                </div>
              </div>
              <div v-if="diffType === 'datetime'" class="result-summary">
                <div class="summary-item">
                  <i class="i-mdi-clock-outline" />
                  总共 {{ diffResult.totalHours }} 小时
                </div>
                <div class="summary-item">
                  <i class="i-mdi-timer-outline" />
                  总共 {{ diffResult.totalMinutes }} 分钟
                </div>
                <div class="summary-item">
                  <i class="i-mdi-timer-sand" />
                  总共 {{ diffResult.totalSeconds }} 秒
                </div>
              </div>
            </div>
          </div>
        </div>
      </NeonCard>

      <!-- 快捷计算 -->
      <NeonCard v-if="currentMode === 'quick'" title="快捷计算">
        <div class="quick-section">
          <div class="quick-group">
            <h4 class="quick-title">从现在开始</h4>
            <div class="quick-buttons">
              <NeonButton
                v-for="preset in quickPresets"
                :key="preset.label"
                @click="quickCalculate(preset)"
                type="outline"
                size="small"
              >
                {{ preset.label }}
              </NeonButton>
            </div>
          </div>

          <div v-if="quickResult" class="result-section">
            <h4 class="result-title">计算结果</h4>
            <div class="result-card">
              <div class="result-row">
                <span class="result-label">当前时间</span>
                <span class="result-value">{{ quickResult.now }}</span>
              </div>
              <div class="result-row">
                <span class="result-label">{{ quickResult.label }}</span>
                <span class="result-value">{{ quickResult.result }}</span>
              </div>
              <div class="result-actions">
                <NeonButton @click="copyResult(quickResult.result)" size="small">
                  <i class="i-mdi-content-copy" />
                  复制结果
                </NeonButton>
              </div>
            </div>
          </div>
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
import NeonInput from '@/components/NeonInput.vue'

// 模式选择
const modes = [
  { value: 'add-subtract', label: '日期时间加减', icon: 'i-mdi-calendar-plus' },
  { value: 'difference', label: '时间差值', icon: 'i-mdi-calendar-range' },
  { value: 'quick', label: '快捷计算', icon: 'i-mdi-lightning-bolt' },
]
const currentMode = ref('add-subtract')

// ===== 日期时间加减 =====
const addSubtractType = ref<'date' | 'datetime'>('date')
const startDateTime = ref('')
const operation = ref<'add' | 'subtract'>('add')
const timeValue = ref<number>(1)
const timeUnit = ref('days')
const addSubtractResult = ref<{
  start: string
  operation: string
  end: string
} | null>(null)

function calculateAddSubtract() {
  try {
    // 获取起始时间
    let startDate: Date
    if (startDateTime.value) {
      startDate = new Date(startDateTime.value)
    } else {
      startDate = new Date()
    }

    if (isNaN(startDate.getTime())) {
      ElMessage.error('起始时间格式不正确')
      return
    }

    // 计算结果时间
    const resultDate = new Date(startDate)
    const value = operation.value === 'add' ? timeValue.value : -timeValue.value

    switch (timeUnit.value) {
      case 'seconds':
        resultDate.setSeconds(resultDate.getSeconds() + value)
        break
      case 'minutes':
        resultDate.setMinutes(resultDate.getMinutes() + value)
        break
      case 'hours':
        resultDate.setHours(resultDate.getHours() + value)
        break
      case 'days':
        resultDate.setDate(resultDate.getDate() + value)
        break
      case 'weeks':
        resultDate.setDate(resultDate.getDate() + value * 7)
        break
      case 'months':
        resultDate.setMonth(resultDate.getMonth() + value)
        break
      case 'years':
        resultDate.setFullYear(resultDate.getFullYear() + value)
        break
    }

    // 格式化结果
    const formatDate = (date: Date) => {
      if (addSubtractType.value === 'date') {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      } else {
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      }
    }

    const unitLabel = {
      seconds: '秒',
      minutes: '分钟',
      hours: '小时',
      days: '天',
      weeks: '周',
      months: '月',
      years: '年',
    }[timeUnit.value]

    addSubtractResult.value = {
      start: formatDate(startDate),
      operation: `${operation.value === 'add' ? '加上' : '减去'} ${timeValue.value} ${unitLabel}`,
      end: formatDate(resultDate),
    }

    ElMessage.success('计算完成')
  } catch (error) {
    console.error('计算错误:', error)
    ElMessage.error('计算失败，请检查输入')
  }
}

function clearAddSubtract() {
  startDateTime.value = ''
  operation.value = 'add'
  timeValue.value = 1
  timeUnit.value = 'days'
  addSubtractResult.value = null
}

// ===== 时间差值计算 =====
const diffType = ref<'date' | 'datetime'>('date')
const diffStartDateTime = ref('')
const diffEndDateTime = ref('')
const diffResult = ref<any>(null)

function calculateDifference() {
  try {
    if (!diffStartDateTime.value) {
      ElMessage.error('请选择开始时间')
      return
    }

    const startDate = new Date(diffStartDateTime.value)
    const endDate = diffEndDateTime.value ? new Date(diffEndDateTime.value) : new Date()

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      ElMessage.error('时间格式不正确')
      return
    }

    // 确保开始时间早于结束时间
    const [earlierDate, laterDate] = startDate <= endDate 
      ? [startDate, endDate] 
      : [endDate, startDate]

    // 计算差值
    const diffMs = laterDate.getTime() - earlierDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    // 计算年月日
    let years = laterDate.getFullYear() - earlierDate.getFullYear()
    let months = laterDate.getMonth() - earlierDate.getMonth()
    let days = laterDate.getDate() - earlierDate.getDate()

    if (days < 0) {
      months--
      const prevMonth = new Date(laterDate.getFullYear(), laterDate.getMonth(), 0)
      days += prevMonth.getDate()
    }

    if (months < 0) {
      years--
      months += 12
    }

    // 时分秒
    const hours = laterDate.getHours() - earlierDate.getHours()
    const minutes = laterDate.getMinutes() - earlierDate.getMinutes()
    const seconds = laterDate.getSeconds() - earlierDate.getSeconds()

    const formatDate = (date: Date) => {
      if (diffType.value === 'date') {
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      } else {
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      }
    }

    diffResult.value = {
      start: formatDate(earlierDate),
      end: formatDate(laterDate),
      totalDays: diffDays,
      totalHours: diffHours,
      totalMinutes: diffMinutes,
      totalSeconds: diffSeconds,
      years,
      months,
      days,
      hours: Math.abs(hours),
      minutes: Math.abs(minutes),
      seconds: Math.abs(seconds),
    }

    ElMessage.success('计算完成')
  } catch (error) {
    console.error('计算错误:', error)
    ElMessage.error('计算失败，请检查输入')
  }
}

function clearDifference() {
  diffStartDateTime.value = ''
  diffEndDateTime.value = ''
  diffResult.value = null
}

// ===== 快捷计算 =====
const quickPresets = [
  { label: '1小时后', value: 1, unit: 'hours' },
  { label: '1天后', value: 1, unit: 'days' },
  { label: '1周后', value: 7, unit: 'days' },
  { label: '1月后', value: 1, unit: 'months' },
  { label: '1年后', value: 1, unit: 'years' },
  { label: '1小时前', value: -1, unit: 'hours' },
  { label: '1天前', value: -1, unit: 'days' },
  { label: '1周前', value: -7, unit: 'days' },
  { label: '1月前', value: -1, unit: 'months' },
  { label: '1年前', value: -1, unit: 'years' },
]
const quickResult = ref<any>(null)

function quickCalculate(preset: any) {
  const now = new Date()
  const result = new Date(now)

  switch (preset.unit) {
    case 'hours':
      result.setHours(result.getHours() + preset.value)
      break
    case 'days':
      result.setDate(result.getDate() + preset.value)
      break
    case 'months':
      result.setMonth(result.getMonth() + preset.value)
      break
    case 'years':
      result.setFullYear(result.getFullYear() + preset.value)
      break
  }

  quickResult.value = {
    now: now.toLocaleString('zh-CN'),
    label: preset.label,
    result: result.toLocaleString('zh-CN'),
  }
}

// ===== 工具函数 =====
function copyResult(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.time-calculator {
  padding: var(--spacing-lg);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.header-content {
  max-width: 100%;
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  margin: 0 0 var(--spacing-sm) 0;
}

.page-title i {
  font-size: 1.3em;
}

.page-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.calculator-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 模式选择 */
.mode-selector {
  background: var(--color-panel);
}

.mode-tabs {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  flex: 1;
  min-width: 150px;
  justify-content: center;
}

.mode-tab i {
  font-size: 1.5em;
  color: var(--color-text-secondary);
  transition: color var(--transition-base);
}

.mode-tab span {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.mode-tab:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.mode-tab.active {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.15);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.3);
}

.mode-tab.active i {
  color: var(--neon-cyan);
}

.mode-tab.active span {
  color: var(--neon-cyan);
}

/* 表单 */
.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.form-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.radio-group {
  display: flex;
  gap: var(--spacing-lg);
}

.radio-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.radio-item input[type="radio"] {
  cursor: pointer;
}

.calculation-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.neon-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
  cursor: pointer;
}

.neon-select:hover {
  border-color: var(--neon-cyan);
}

.neon-select:focus {
  outline: none;
  border-color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3);
}

.flex-1 {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

/* 结果区域 */
.result-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.result-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--neon-cyan);
  margin: 0 0 var(--spacing-lg) 0;
}

.result-card {
  background: rgba(33, 230, 255, 0.05);
  border: 2px solid rgba(33, 230, 255, 0.3);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--color-border);
}

.result-row:last-child {
  border-bottom: none;
}

.result-row.highlight {
  background: rgba(33, 230, 255, 0.1);
  margin: var(--spacing-sm) calc(-1 * var(--spacing-lg));
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
}

.result-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.result-value {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--neon-cyan);
}

.result-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-md) 0;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.item-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
}

.item-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.result-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.summary-item i {
  color: var(--neon-cyan);
}

.result-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

/* 快捷计算 */
.quick-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.quick-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.quick-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: 0;
}

.quick-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

/* 响应式 */
@media (max-width: 768px) {
  .mode-tabs {
    flex-direction: column;
  }

  .mode-tab {
    min-width: auto;
  }

  .calculation-row {
    flex-direction: column;
    align-items: stretch;
  }

  .result-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>






