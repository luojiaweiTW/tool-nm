<template>
  <div class="tool-base">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">进制转换</h1>
        <p class="tool-header__description">十进制、二进制、八进制、十六进制互相转换</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <div class="base-grid">
        <!-- 十进制 -->
        <NeonCard title="🔟 十进制 (DEC)">
          <NeonInput
            v-model="decValue"
            placeholder="输入十进制数..."
            @input="handleDecChange"
          />
          <div class="info-text">范围：0 ~ 2^53-1</div>
        </NeonCard>

        <!-- 二进制 -->
        <NeonCard title="🔢 二进制 (BIN)">
          <NeonTextarea
            v-model="binValue"
            placeholder="输入二进制数..."
            :rows="3"
            @input="handleBinChange"
          />
          <div class="info-text">仅包含 0 和 1</div>
        </NeonCard>

        <!-- 八进制 -->
        <NeonCard title="8️⃣ 八进制 (OCT)">
          <NeonInput
            v-model="octValue"
            placeholder="输入八进制数..."
            @input="handleOctChange"
          />
          <div class="info-text">数字：0-7</div>
        </NeonCard>

        <!-- 十六进制 -->
        <NeonCard title="🔠 十六进制 (HEX)">
          <NeonInput
            v-model="hexValue"
            placeholder="输入十六进制数..."
            @input="handleHexChange"
          />
          <div class="info-text">数字：0-9, A-F</div>
        </NeonCard>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        <i class="i-mdi-alert-circle mr-2" />
        {{ error }}
      </div>

      <!-- 快捷示例 -->
      <NeonCard title="💡 快捷示例">
        <div class="example-buttons">
          <NeonButton size="small" @click="setExample(255)">255</NeonButton>
          <NeonButton size="small" @click="setExample(1024)">1024</NeonButton>
          <NeonButton size="small" @click="setExample(65535)">65535</NeonButton>
          <NeonButton size="small" @click="setExample(16777215)">16777215</NeonButton>
        </div>
      </NeonCard>

      <!-- 位操作说明 -->
      <NeonCard v-if="decValue && !error" title="📋 位信息">
        <div class="bit-info">
          <div class="bit-row">
            <span class="bit-label">二进制位数：</span>
            <span class="bit-value">{{ bitLength }} 位</span>
          </div>
          <div class="bit-row">
            <span class="bit-label">字节数：</span>
            <span class="bit-value">{{ Math.ceil(bitLength / 8) }} 字节</span>
          </div>
        </div>
      </NeonCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

const decValue = ref('')
const binValue = ref('')
const octValue = ref('')
const hexValue = ref('')
const error = ref('')

// 计算二进制位数
const bitLength = computed(() => {
  if (!decValue.value || error.value) return 0
  const num = parseInt(decValue.value, 10)
  return num === 0 ? 1 : Math.floor(Math.log2(num)) + 1
})

// 十进制变化
function handleDecChange() {
  error.value = ''
  
  if (!decValue.value) {
    binValue.value = ''
    octValue.value = ''
    hexValue.value = ''
    return
  }

  const num = parseInt(decValue.value, 10)
  
  if (isNaN(num)) {
    error.value = '请输入有效的十进制数'
    return
  }

  if (num < 0) {
    error.value = '暂不支持负数'
    return
  }

  if (num > Number.MAX_SAFE_INTEGER) {
    error.value = '数值过大，超出安全范围'
    return
  }

  binValue.value = num.toString(2)
  octValue.value = num.toString(8)
  hexValue.value = num.toString(16).toUpperCase()
}

// 二进制变化
function handleBinChange() {
  error.value = ''
  
  if (!binValue.value) {
    decValue.value = ''
    octValue.value = ''
    hexValue.value = ''
    return
  }

  // 移除空格和换行
  const bin = binValue.value.replace(/\s/g, '')

  if (!/^[01]+$/.test(bin)) {
    error.value = '二进制只能包含 0 和 1'
    return
  }

  try {
    const num = parseInt(bin, 2)
    
    if (num > Number.MAX_SAFE_INTEGER) {
      error.value = '数值过大，超出安全范围'
      return
    }

    decValue.value = num.toString(10)
    octValue.value = num.toString(8)
    hexValue.value = num.toString(16).toUpperCase()
  } catch (e) {
    error.value = '二进制转换失败'
  }
}

// 八进制变化
function handleOctChange() {
  error.value = ''
  
  if (!octValue.value) {
    decValue.value = ''
    binValue.value = ''
    hexValue.value = ''
    return
  }

  if (!/^[0-7]+$/.test(octValue.value)) {
    error.value = '八进制只能包含 0-7'
    return
  }

  try {
    const num = parseInt(octValue.value, 8)
    
    if (num > Number.MAX_SAFE_INTEGER) {
      error.value = '数值过大，超出安全范围'
      return
    }

    decValue.value = num.toString(10)
    binValue.value = num.toString(2)
    hexValue.value = num.toString(16).toUpperCase()
  } catch (e) {
    error.value = '八进制转换失败'
  }
}

// 十六进制变化
function handleHexChange() {
  error.value = ''
  
  if (!hexValue.value) {
    decValue.value = ''
    binValue.value = ''
    octValue.value = ''
    return
  }

  if (!/^[0-9A-Fa-f]+$/.test(hexValue.value)) {
    error.value = '十六进制只能包含 0-9, A-F'
    return
  }

  try {
    const num = parseInt(hexValue.value, 16)
    
    if (num > Number.MAX_SAFE_INTEGER) {
      error.value = '数值过大，超出安全范围'
      return
    }

    decValue.value = num.toString(10)
    binValue.value = num.toString(2)
    octValue.value = num.toString(8)
  } catch (e) {
    error.value = '十六进制转换失败'
  }
}

// 设置示例
function setExample(num: number) {
  decValue.value = num.toString()
  handleDecChange()
  ElMessage.success(`已设置示例值：${num}`)
}

// 清空
function clearAll() {
  decValue.value = ''
  binValue.value = ''
  octValue.value = ''
  hexValue.value = ''
  error.value = ''
}
</script>

<style scoped>
.tool-base {
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
  box-shadow: var(--glow-cyan);
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

.base-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.info-text {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.error-message {
  padding: var(--spacing-md);
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
}

.example-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.bit-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.bit-row {
  display: flex;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.bit-row:last-child {
  border-bottom: none;
}

.bit-label {
  color: var(--color-muted);
  min-width: 120px;
}

.bit-value {
  color: var(--neon-cyan);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-mono);
}

.mr-2 {
  margin-right: 8px;
}
</style>

