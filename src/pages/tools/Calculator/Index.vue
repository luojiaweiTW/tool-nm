<template>
  <div class="calculator-page">
    <div class="calculator-container">
      <!-- 计算器主体 -->
      <div class="calculator">
        <!-- 显示屏 -->
        <div class="display-section">
          <div class="expression" v-if="currentExpression">
            {{ currentExpression }}
          </div>
          <div class="display">
            <input
              ref="displayInput"
              type="text"
              :value="formattedValue"
              @input="handleInput"
              @paste="handlePaste"
              @keydown="handleKeydown"
              class="display-input"
              spellcheck="false"
            />
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="buttons">
          <!-- 第一行 -->
          <button class="btn btn-secondary" @click="clear">C</button>
          <button class="btn btn-secondary" @click="backspace">⌫</button>
          <button class="btn btn-secondary" @click="percentage">%</button>
          <button class="btn btn-operator" @click="inputOperator('÷')">÷</button>

          <!-- 第二行 -->
          <button class="btn btn-number" @click="inputNumber('7')">7</button>
          <button class="btn btn-number" @click="inputNumber('8')">8</button>
          <button class="btn btn-number" @click="inputNumber('9')">9</button>
          <button class="btn btn-operator" @click="inputOperator('×')">×</button>

          <!-- 第三行 -->
          <button class="btn btn-number" @click="inputNumber('4')">4</button>
          <button class="btn btn-number" @click="inputNumber('5')">5</button>
          <button class="btn btn-number" @click="inputNumber('6')">6</button>
          <button class="btn btn-operator" @click="inputOperator('-')">−</button>

          <!-- 第四行 -->
          <button class="btn btn-number" @click="inputNumber('1')">1</button>
          <button class="btn btn-number" @click="inputNumber('2')">2</button>
          <button class="btn btn-number" @click="inputNumber('3')">3</button>
          <button class="btn btn-operator" @click="inputOperator('+')">+</button>

          <!-- 第五行 -->
          <button class="btn btn-number" @click="toggleSign">±</button>
          <button class="btn btn-number" @click="inputNumber('0')">0</button>
          <button class="btn btn-number" @click="inputDecimal">.</button>
          <button class="btn btn-equals" @click="calculate">=</button>
        </div>
      </div>

      <!-- 历史记录面板 -->
      <div class="history-panel">
        <div class="history-header">
          <h3>历史记录</h3>
          <button
            v-if="history.length > 0"
            @click="clearHistory"
            class="clear-history-btn"
            title="清空历史"
          >
            <i class="i-carbon-trash-can" />
          </button>
        </div>

        <div class="history-list" v-if="history.length > 0">
          <div
            v-for="record in history"
            :key="record.id"
            class="history-item"
            @click="restoreFromHistory(record)"
          >
            <div class="history-expression">{{ record.expression }}</div>
            <div class="history-result">= {{ formatNumber(record.result) }}</div>
            <div class="history-time">{{ formatTime(record.timestamp) }}</div>
            <button
              class="delete-btn"
              @click.stop="deleteHistory(record.id)"
              title="删除"
            >
              <i class="i-carbon-close" />
            </button>
          </div>
        </div>

        <div v-else class="empty-state">
          <i class="i-carbon-calculator" />
          <p>暂无历史记录</p>
          <p class="hint">计算结果会自动保存</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useCalculatorStore } from '@/stores/calculator'
import { ElMessage } from 'element-plus'

const calculatorStore = useCalculatorStore()
const {
  currentValue,
  currentExpression,
  history,
  formattedValue
} = storeToRefs(calculatorStore)

const {
  inputNumber,
  inputDecimal,
  inputOperator,
  calculate,
  clear,
  backspace,
  toggleSign,
  percentage,
  clearHistory,
  deleteHistory,
  restoreFromHistory,
  formatNumber,
  parseNumber
} = calculatorStore

const displayInput = ref<HTMLInputElement | null>(null)

// 处理输入框输入（支持复制粘贴）
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value

  // 移除非数字字符（保留数字、小数点、逗号、负号）
  value = value.replace(/[^\d.,-]/g, '')

  // 移除逗号
  const rawValue = parseNumber(value)

  // 验证是否是有效数字
  if (rawValue === '' || rawValue === '-' || !isNaN(parseFloat(rawValue))) {
    currentValue.value = rawValue
  }
}

// 处理粘贴
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  
  const pastedText = event.clipboardData?.getData('text')
  if (!pastedText) return

  // 移除非数字字符
  const cleaned = pastedText.replace(/[^\d.,-]/g, '')
  const rawValue = parseNumber(cleaned)

  if (rawValue && !isNaN(parseFloat(rawValue))) {
    currentValue.value = rawValue
    ElMessage.success('已粘贴数字')
  } else {
    ElMessage.warning('粘贴的内容不是有效数字')
  }
}

// 处理键盘事件
const handleKeydown = (event: KeyboardEvent) => {
  const key = event.key

  // 数字键
  if (/^[0-9]$/.test(key)) {
    event.preventDefault()
    inputNumber(key)
  }
  // 运算符
  else if (key === '+') {
    event.preventDefault()
    inputOperator('+')
  } else if (key === '-') {
    event.preventDefault()
    inputOperator('-')
  } else if (key === '*') {
    event.preventDefault()
    inputOperator('×')
  } else if (key === '/') {
    event.preventDefault()
    inputOperator('÷')
  } else if (key === '%') {
    event.preventDefault()
    percentage()
  }
  // Enter 或 =
  else if (key === 'Enter' || key === '=') {
    event.preventDefault()
    calculate()
  }
  // Backspace
  else if (key === 'Backspace') {
    event.preventDefault()
    backspace()
  }
  // Escape
  else if (key === 'Escape') {
    event.preventDefault()
    clear()
  }
  // 小数点
  else if (key === '.') {
    event.preventDefault()
    inputDecimal()
  }
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}

// 键盘事件监听
const handleGlobalKeydown = (event: KeyboardEvent) => {
  // 如果焦点不在输入框，也响应键盘事件
  if (document.activeElement !== displayInput.value) {
    handleKeydown(event)
  }
}

onMounted(() => {
  // 聚焦输入框
  displayInput.value?.focus()
  
  // 监听全局键盘事件
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
.calculator-page {
  padding: var(--spacing-lg);
  height: 100vh;
  overflow: hidden;
}

.calculator-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-lg);
  height: calc(100vh - var(--spacing-lg) * 2);
}

/* 计算器主体 */
.calculator {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* 显示屏 */
.display-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.expression {
  color: var(--neon-blue);
  font-size: 16px;
  opacity: 0.7;
  margin-bottom: var(--spacing-xs);
  text-align: right;
  font-family: 'Courier New', monospace;
}

.display {
  position: relative;
}

.display-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: var(--color-text);
  font-size: 48px;
  font-weight: bold;
  text-align: right;
  font-family: 'Courier New', monospace;
  cursor: text;
}

.display-input::selection {
  background: var(--neon-blue);
  color: var(--color-bg);
}

/* 按钮区域 */
.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  flex: 1;
}

.btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-sm);
  color: var(--color-text);
  font-size: 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--neon-blue);
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3);
}

.btn:active {
  transform: scale(0.95);
}

.btn-number {
  background: rgba(255, 255, 255, 0.08);
}

.btn-operator {
  background: rgba(33, 230, 255, 0.15);
  border-color: var(--neon-blue);
  color: var(--neon-blue);
}

.btn-operator:hover {
  background: rgba(33, 230, 255, 0.25);
}

.btn-equals {
  background: var(--neon-blue);
  color: var(--color-bg);
  font-size: 32px;
  font-weight: bold;
}

.btn-equals:hover {
  background: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.5);
}

.btn-secondary {
  background: rgba(255, 107, 237, 0.15);
  border-color: var(--neon-pink);
  color: var(--neon-pink);
}

.btn-secondary:hover {
  background: rgba(255, 107, 237, 0.25);
}

/* 历史记录面板 */
.history-panel {
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.history-header h3 {
  color: var(--neon-blue);
  font-size: 20px;
  margin: 0;
}

.clear-history-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--border-radius-sm);
  color: #ef4444;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-history-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: #ef4444;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 霓虹风格滚动条 */
.history-list::-webkit-scrollbar {
  width: 8px;
}

.history-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.history-list::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.history-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.history-item:hover {
  background: rgba(33, 230, 255, 0.1);
  border-color: var(--neon-blue);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.2);
}

.history-expression {
  color: var(--color-text);
  font-size: 16px;
  font-family: 'Courier New', monospace;
  margin-bottom: 4px;
}

.history-result {
  color: var(--neon-blue);
  font-size: 20px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-bottom: 4px;
}

.history-time {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.delete-btn {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 50%;
  color: #ef4444;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  gap: var(--spacing-sm);
}

.empty-state i {
  font-size: 48px;
  opacity: 0.3;
}

.empty-state p {
  margin: 0;
}

.empty-state .hint {
  font-size: 14px;
  opacity: 0.7;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .calculator-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .calculator {
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>

