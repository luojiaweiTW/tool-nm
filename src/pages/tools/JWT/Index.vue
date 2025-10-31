<template>
  <div class="tool-jwt">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">JWT 解析器</h1>
        <p class="tool-header__description">解析、验证和查看 JWT Token 详细信息</p>
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

    <!-- 主要内容 -->
    <div class="tool-content">
      <!-- 输入区域 -->
      <NeonCard title="JWT Token 输入">
        <NeonTextarea
          v-model="jwtInput"
          placeholder="粘贴 JWT Token 到这里..."
          :rows="4"
          @input="parseJWT"
        />
        <div v-if="error" class="error-message">
          <i class="i-mdi-alert-circle mr-2" />
          {{ error }}
        </div>
      </NeonCard>

      <!-- 解析结果 -->
      <div v-if="parsedJWT" class="jwt-sections">
        <!-- Header -->
        <NeonCard title="🔵 Header（头部）">
          <template #extra>
            <NeonButton size="small" @click="copyToClipboard(headerJSON, 'Header')">
              <i class="i-mdi-content-copy" />
            </NeonButton>
          </template>
          <div class="json-display">
            <pre>{{ headerJSON }}</pre>
          </div>
        </NeonCard>

        <!-- Payload -->
        <NeonCard title="🟢 Payload（载荷）">
          <template #extra>
            <NeonButton size="small" @click="copyToClipboard(payloadJSON, 'Payload')">
              <i class="i-mdi-content-copy" />
            </NeonButton>
          </template>
          <div class="json-display">
            <pre>{{ payloadJSON }}</pre>
          </div>
          
          <!-- 关键时间信息 -->
          <div v-if="timeInfo.length > 0" class="time-info">
            <h4 class="time-info__title">⏰ 时间信息</h4>
            <div class="time-info__list">
              <div v-for="info in timeInfo" :key="info.label" class="time-info__item">
                <span class="time-info__label">{{ info.label }}：</span>
                <span class="time-info__value" :class="info.class">{{ info.value }}</span>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- Signature -->
        <NeonCard title="🔴 Signature（签名）">
          <template #extra>
            <NeonButton size="small" @click="copyToClipboard(parsedJWT.signature, '签名')">
              <i class="i-mdi-content-copy" />
            </NeonButton>
          </template>
          <div class="signature-display">
            <code>{{ parsedJWT.signature }}</code>
          </div>

          <!-- 签名验证 -->
          <div class="signature-verify">
            <el-divider />
            <h4 class="signature-verify__title">🔐 签名验证（可选）</h4>
            <div class="signature-verify__input">
              <NeonInput
                v-model="secretKey"
                placeholder="输入密钥（Secret）进行签名验证"
                type="password"
                show-password
              />
              <NeonButton @click="verifySignature" :disabled="!secretKey">
                验证签名
              </NeonButton>
            </div>
            <div v-if="verifyResult" class="verify-result" :class="verifyResult.valid ? 'valid' : 'invalid'">
              <i :class="verifyResult.valid ? 'i-mdi-check-circle' : 'i-mdi-alert-circle'" />
              {{ verifyResult.message }}
            </div>
          </div>
        </NeonCard>

        <!-- Token 详细信息 -->
        <NeonCard title="📊 Token 信息">
          <div class="token-stats">
            <div class="token-stat">
              <span class="token-stat__label">算法</span>
              <span class="token-stat__value">{{ parsedJWT.header?.alg || 'N/A' }}</span>
            </div>
            <div class="token-stat">
              <span class="token-stat__label">类型</span>
              <span class="token-stat__value">{{ parsedJWT.header?.typ || 'N/A' }}</span>
            </div>
            <div class="token-stat">
              <span class="token-stat__label">签发者</span>
              <span class="token-stat__value">{{ parsedJWT.payload?.iss || 'N/A' }}</span>
            </div>
            <div class="token-stat">
              <span class="token-stat__label">主题</span>
              <span class="token-stat__value">{{ parsedJWT.payload?.sub || 'N/A' }}</span>
            </div>
            <div class="token-stat">
              <span class="token-stat__label">受众</span>
              <span class="token-stat__value">{{ parsedJWT.payload?.aud || 'N/A' }}</span>
            </div>
            <div class="token-stat">
              <span class="token-stat__label">Token 长度</span>
              <span class="token-stat__value">{{ jwtInput.length }} 字符</span>
            </div>
          </div>
        </NeonCard>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!error && !jwtInput" class="empty-state">
        <i class="i-mdi-key-chain empty-state__icon" />
        <p class="empty-state__text">请输入 JWT Token</p>
        <p class="empty-state__hint">支持 HS256、HS384、HS512、RS256 等算法</p>
      </div>
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

interface ParsedJWT {
  header: Record<string, any>
  payload: Record<string, any>
  signature: string
}

const jwtInput = ref('')
const parsedJWT = ref<ParsedJWT | null>(null)
const error = ref('')
const secretKey = ref('')
const verifyResult = ref<{ valid: boolean; message: string } | null>(null)

// 示例 JWT
const exampleJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MzYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// Base64 URL 解码
function base64UrlDecode(str: string): string {
  // 替换 URL 安全字符
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  
  // 补充填充
  while (base64.length % 4) {
    base64 += '='
  }
  
  try {
    return decodeURIComponent(escape(atob(base64)))
  } catch (e) {
    throw new Error('无效的 Base64 编码')
  }
}

// 解析 JWT
function parseJWT() {
  error.value = ''
  parsedJWT.value = null
  verifyResult.value = null
  
  if (!jwtInput.value.trim()) {
    return
  }
  
  try {
    const parts = jwtInput.value.trim().split('.')
    
    if (parts.length !== 3) {
      throw new Error('JWT Token 格式错误，应该包含三个部分（用点号分隔）')
    }
    
    const [headerB64, payloadB64, signatureB64] = parts
    
    // 解码 Header
    const headerStr = base64UrlDecode(headerB64)
    const header = JSON.parse(headerStr)
    
    // 解码 Payload
    const payloadStr = base64UrlDecode(payloadB64)
    const payload = JSON.parse(payloadStr)
    
    parsedJWT.value = {
      header,
      payload,
      signature: signatureB64
    }
  } catch (e: any) {
    error.value = e.message || '解析 JWT 失败'
  }
}

// 格式化 JSON
const headerJSON = computed(() => {
  if (!parsedJWT.value) return ''
  return JSON.stringify(parsedJWT.value.header, null, 2)
})

const payloadJSON = computed(() => {
  if (!parsedJWT.value) return ''
  return JSON.stringify(parsedJWT.value.payload, null, 2)
})

// 时间信息
const timeInfo = computed(() => {
  if (!parsedJWT.value?.payload) return []
  
  const info = []
  const payload = parsedJWT.value.payload
  const now = Math.floor(Date.now() / 1000)
  
  if (payload.iat) {
    const iatDate = new Date(payload.iat * 1000)
    info.push({
      label: '签发时间 (iat)',
      value: iatDate.toLocaleString('zh-CN'),
      class: ''
    })
  }
  
  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000)
    const isExpired = payload.exp < now
    info.push({
      label: '过期时间 (exp)',
      value: expDate.toLocaleString('zh-CN') + (isExpired ? ' [已过期]' : ' [有效]'),
      class: isExpired ? 'expired' : 'valid'
    })
  }
  
  if (payload.nbf) {
    const nbfDate = new Date(payload.nbf * 1000)
    info.push({
      label: '生效时间 (nbf)',
      value: nbfDate.toLocaleString('zh-CN'),
      class: ''
    })
  }
  
  return info
})

// 简单的 HMAC-SHA256 验证（仅用于演示，生产环境应使用专业库）
async function verifySignature() {
  if (!parsedJWT.value || !secretKey.value) {
    return
  }
  
  try {
    const parts = jwtInput.value.trim().split('.')
    const message = parts[0] + '.' + parts[1]
    const signature = parts[2]
    
    // 提示：这里简化处理，实际应该根据算法使用不同的验证方式
    const alg = parsedJWT.value.header.alg
    
    if (!alg.startsWith('HS')) {
      ElMessage.warning('当前仅支持 HMAC (HS256/HS384/HS512) 算法验证')
      return
    }
    
    // 使用 Web Crypto API 进行 HMAC 验证
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secretKey.value)
    const messageData = encoder.encode(message)
    
    const algMap: Record<string, string> = {
      'HS256': 'SHA-256',
      'HS384': 'SHA-384',
      'HS512': 'SHA-512'
    }
    
    const cryptoAlg = algMap[alg]
    if (!cryptoAlg) {
      ElMessage.warning(`不支持的算法: ${alg}`)
      return
    }
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: cryptoAlg },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData)
    const signatureArray = new Uint8Array(signatureBuffer)
    
    // 转换为 Base64 URL
    let binary = ''
    signatureArray.forEach(byte => binary += String.fromCharCode(byte))
    const computedSignature = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    const isValid = computedSignature === signature
    
    verifyResult.value = {
      valid: isValid,
      message: isValid ? '✓ 签名验证通过' : '✗ 签名验证失败，密钥可能不正确'
    }
    
    ElMessage[isValid ? 'success' : 'error'](verifyResult.value.message)
  } catch (e: any) {
    verifyResult.value = {
      valid: false,
      message: `验证出错: ${e.message}`
    }
    ElMessage.error(verifyResult.value.message)
  }
}

// 复制到剪贴板
async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(`${label} 已复制到剪贴板`)
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  jwtInput.value = ''
  parsedJWT.value = null
  error.value = ''
  secretKey.value = ''
  verifyResult.value = null
}

// 加载示例
function handleExample() {
  jwtInput.value = exampleJWT
  parseJWT()
  ElMessage.info('已加载示例 JWT Token')
}
</script>

<style scoped>
.tool-jwt {
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

.error-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
}

.jwt-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.json-display {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  overflow-x: auto;
}

.json-display pre {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  line-height: 1.6;
}

.signature-display {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  word-break: break-all;
}

.signature-display code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-pink);
}

.signature-verify {
  margin-top: var(--spacing-md);
}

.signature-verify__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.signature-verify__input {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.signature-verify__input :deep(.neon-input) {
  flex: 1;
}

.verify-result {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.verify-result.valid {
  background: rgba(48, 255, 147, 0.1);
  border: 1px solid #30ff93;
  color: #30ff93;
}

.verify-result.invalid {
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  color: var(--neon-pink);
}

.time-info {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-md);
}

.time-info__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--neon-cyan);
  margin-bottom: var(--spacing-md);
}

.time-info__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.time-info__item {
  display: flex;
  font-size: var(--font-size-sm);
}

.time-info__label {
  color: var(--color-muted);
  min-width: 120px;
}

.time-info__value {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.time-info__value.expired {
  color: var(--neon-pink);
}

.time-info__value.valid {
  color: #30ff93;
}

.token-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.token-stat {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.token-stat__label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.token-stat__value {
  font-size: var(--font-size-base);
  color: var(--color-text);
  font-weight: var(--font-weight-semibold);
  word-break: break-all;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
}

.empty-state__icon {
  font-size: 4em;
  color: var(--neon-cyan);
  opacity: 0.3;
  margin-bottom: var(--spacing-lg);
}

.empty-state__text {
  font-size: var(--font-size-lg);
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
}

.mr-2 {
  margin-right: 8px;
}
</style>

