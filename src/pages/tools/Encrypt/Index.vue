<template>
  <div class="tool-encrypt">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">加密解密工具</h1>
        <p class="tool-header__description">AES、DES、RSA 加密解密，支持多种模式和填充</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="swapInputOutput" type="outline" :disabled="!output">
          <i class="i-mdi-swap-horizontal mr-2" />
          交换
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <div class="tool-layout">
        <!-- 左侧：配置 -->
        <div class="tool-panel">
          <NeonCard title="🔧 加密配置">
            <!-- 算法选择 -->
            <div class="form-group">
              <label class="form-label">算法</label>
              <el-radio-group v-model="algorithm" size="large">
                <el-radio value="AES" label="AES">AES</el-radio>
                <el-radio value="DES" label="DES">DES</el-radio>
              </el-radio-group>
            </div>

            <!-- 操作模式 -->
            <div class="form-group">
              <label class="form-label">操作</label>
              <el-radio-group v-model="operation" size="large">
                <el-radio value="encrypt" label="encrypt">加密</el-radio>
                <el-radio value="decrypt" label="decrypt">解密</el-radio>
              </el-radio-group>
            </div>

            <!-- 密钥 -->
            <div class="form-group">
              <label class="form-label">密钥 (Key)</label>
              <NeonInput
                v-model="key"
                placeholder="请输入密钥"
                type="password"
                show-password
              />
              <div class="form-hint">
                <span v-if="algorithm === 'AES'">AES: 16/24/32 字符</span>
                <span v-else>DES: 8 字符</span>
              </div>
            </div>

            <!-- 偏移量 -->
            <div class="form-group">
              <label class="form-label">偏移量 (IV)</label>
              <NeonInput
                v-model="iv"
                placeholder="请输入偏移量（CBC 模式必需）"
              />
              <div class="form-hint">
                <span v-if="algorithm === 'AES'">AES: 16 字符</span>
                <span v-else>DES: 8 字符</span>
              </div>
            </div>

            <!-- 模式 -->
            <div class="form-group">
              <label class="form-label">模式 (Mode)</label>
              <el-select v-model="mode" placeholder="选择模式" size="large" style="width: 100%">
                <el-option label="CBC" value="CBC" />
                <el-option label="ECB" value="ECB" />
              </el-select>
            </div>

            <!-- 填充 -->
            <div class="form-group">
              <label class="form-label">填充 (Padding)</label>
              <el-select v-model="padding" placeholder="选择填充" size="large" style="width: 100%">
                <el-option label="Pkcs7" value="Pkcs7" />
                <el-option label="ZeroPadding" value="ZeroPadding" />
              </el-select>
            </div>

            <!-- 输出格式 -->
            <div class="form-group">
              <label class="form-label">输出格式</label>
              <el-select v-model="outputFormat" placeholder="选择格式" size="large" style="width: 100%">
                <el-option label="Base64" value="base64" />
                <el-option label="Hex" value="hex" />
              </el-select>
            </div>

            <!-- 执行按钮 -->
            <div class="form-actions">
              <NeonButton
                @click="handleProcess"
                type="primary"
                :disabled="!canProcess"
                style="width: 100%"
              >
                <i :class="operation === 'encrypt' ? 'i-mdi-lock' : 'i-mdi-lock-open'" class="mr-2" />
                {{ operation === 'encrypt' ? '加密' : '解密' }}
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 快捷操作 -->
          <NeonCard title="⚡ 快捷操作">
            <div class="quick-actions">
              <NeonButton @click="generateKey" size="small" style="width: 100%">
                生成随机密钥
              </NeonButton>
              <NeonButton @click="generateIV" size="small" style="width: 100%">
                生成随机 IV
              </NeonButton>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：输入输出 -->
        <div class="tool-main">
          <!-- 输入 -->
          <NeonCard title="📝 输入文本">
            <template #extra>
              <span class="char-count">{{ inputText.length }} 字符</span>
            </template>
            <NeonTextarea
              v-model="inputText"
              :placeholder="operation === 'encrypt' ? '请输入要加密的文本...' : '请输入要解密的密文...'"
              :rows="12"
            />
          </NeonCard>

          <!-- 输出 -->
          <NeonCard title="✨ 输出结果">
            <template #extra>
              <div class="output-actions">
                <span class="char-count">{{ output.length }} 字符</span>
                <NeonButton
                  size="small"
                  @click="copyOutput"
                  :disabled="!output"
                >
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
              </div>
            </template>
            <div class="output-area">
              <div v-if="error" class="error-message">
                <i class="i-mdi-alert-circle mr-2" />
                {{ error }}
              </div>
              <div v-else-if="output" class="output-text">
                {{ output }}
              </div>
              <div v-else class="output-placeholder">
                {{ operation === 'encrypt' ? '加密结果将显示在这里' : '解密结果将显示在这里' }}
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
import CryptoJS from 'crypto-js'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

// 配置
const algorithm = ref<'AES' | 'DES'>('AES')
const operation = ref<'encrypt' | 'decrypt'>('encrypt')
const key = ref('')
const iv = ref('')
const mode = ref('CBC')
const padding = ref('Pkcs7')
const outputFormat = ref<'base64' | 'hex'>('base64')

// 输入输出
const inputText = ref('')
const output = ref('')
const error = ref('')

// 是否可以处理
const canProcess = computed(() => {
  return inputText.value && key.value && (mode.value === 'ECB' || iv.value)
})

// 生成随机密钥
function generateKey() {
  const length = algorithm.value === 'AES' ? 16 : 8
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  key.value = result
  ElMessage.success(`已生成 ${length} 位随机密钥`)
}

// 生成随机 IV
function generateIV() {
  const length = algorithm.value === 'AES' ? 16 : 8
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  iv.value = result
  ElMessage.success(`已生成 ${length} 位随机 IV`)
}

// 处理加密解密
function handleProcess() {
  error.value = ''
  output.value = ''

  try {
    // 验证密钥长度
    const keyLength = algorithm.value === 'AES' ? [16, 24, 32] : [8]
    if (!keyLength.includes(key.value.length)) {
      throw new Error(`${algorithm.value} 密钥长度必须是 ${keyLength.join(' 或 ')} 字符`)
    }

    // 验证 IV 长度（CBC 模式需要）
    if (mode.value === 'CBC') {
      const ivLength = algorithm.value === 'AES' ? 16 : 8
      if (iv.value.length !== ivLength) {
        throw new Error(`${algorithm.value} IV 长度必须是 ${ivLength} 字符`)
      }
    }

    // 准备密钥和 IV
    const keyHex = CryptoJS.enc.Utf8.parse(key.value)
    const ivHex = mode.value === 'CBC' ? CryptoJS.enc.Utf8.parse(iv.value) : undefined

    // 配置选项
    const options: any = {
      mode: mode.value === 'CBC' ? CryptoJS.mode.CBC : CryptoJS.mode.ECB,
      padding: padding.value === 'Pkcs7' ? CryptoJS.pad.Pkcs7 : CryptoJS.pad.ZeroPadding,
    }

    if (ivHex) {
      options.iv = ivHex
    }

    if (operation.value === 'encrypt') {
      // 加密
      let encrypted
      if (algorithm.value === 'AES') {
        encrypted = CryptoJS.AES.encrypt(inputText.value, keyHex, options)
      } else {
        encrypted = CryptoJS.DES.encrypt(inputText.value, keyHex, options)
      }

      // 输出格式
      if (outputFormat.value === 'base64') {
        output.value = encrypted.toString()
      } else {
        output.value = encrypted.ciphertext.toString()
      }

      ElMessage.success('加密成功')
    } else {
      // 解密
      let decrypted
      if (algorithm.value === 'AES') {
        decrypted = CryptoJS.AES.decrypt(inputText.value, keyHex, options)
      } else {
        decrypted = CryptoJS.DES.decrypt(inputText.value, keyHex, options)
      }

      output.value = decrypted.toString(CryptoJS.enc.Utf8)

      if (!output.value) {
        throw new Error('解密失败，请检查密钥、IV 和密文是否正确')
      }

      ElMessage.success('解密成功')
    }
  } catch (e: any) {
    error.value = e.message || '处理失败'
    ElMessage.error(error.value)
  }
}

// 复制输出
async function copyOutput() {
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 交换输入输出
function swapInputOutput() {
  const temp = inputText.value
  inputText.value = output.value
  output.value = temp
  operation.value = operation.value === 'encrypt' ? 'decrypt' : 'encrypt'
  ElMessage.success('已交换输入输出')
}

// 清空
function clearAll() {
  inputText.value = ''
  output.value = ''
  error.value = ''
  key.value = ''
  iv.value = ''
}
</script>

<style scoped>
.tool-encrypt {
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
  border: 2px solid var(--neon-purple);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(155, 92, 255, 0.4);
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
  overflow: hidden;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.tool-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-lg);
  height: 100%;
}

.tool-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.tool-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.form-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.form-actions {
  margin-top: var(--spacing-xl);
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-right: var(--spacing-md);
}

.output-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.output-area {
  min-height: 300px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.output-text {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}

.output-placeholder {
  color: var(--color-text-disabled);
  font-size: var(--font-size-sm);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-4xl) 0;
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

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}
</style>

