<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import NeonCard from '@/components/NeonCard.vue'

// WebSocket 连接状态
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface Message {
  id: number
  type: 'sent' | 'received' | 'system'
  content: string
  timestamp: Date
}

// 状态
const wsUrl = ref('wss://echo.websocket.org/')
const status = ref<ConnectionStatus>('disconnected')
const ws = ref<WebSocket | null>(null)
const message = ref('')
const messages = ref<Message[]>([])
const autoReconnect = ref(true)
const heartbeatInterval = ref(30)
const heartbeatTimer = ref<number | null>(null)
const messagesContainer = ref<HTMLElement | null>(null)

// 计算属性
const isConnected = computed(() => status.value === 'connected')
const isConnecting = computed(() => status.value === 'connecting')
const canConnect = computed(() => wsUrl.value.trim() !== '' && !isConnecting.value && !isConnected.value)
const canSend = computed(() => isConnected.value && message.value.trim() !== '')

const statusText = computed(() => {
  switch (status.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'disconnected': return '未连接'
    case 'error': return '连接错误'
    default: return '未知'
  }
})

const statusClass = computed(() => {
  switch (status.value) {
    case 'connected': return 'status-connected'
    case 'connecting': return 'status-connecting'
    case 'error': return 'status-error'
    default: return 'status-disconnected'
  }
})

// 滚动到消息底部
function scrollToBottom() {
  if (messagesContainer.value) {
    setTimeout(() => {
      messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight
    }, 100)
  }
}

// 添加系统消息
function addSystemMessage(content: string) {
  messages.value.push({
    id: Date.now(),
    type: 'system',
    content,
    timestamp: new Date()
  })
  scrollToBottom()
}

// 连接 WebSocket
function connect() {
  if (!wsUrl.value.trim()) {
    ElMessage.warning('请输入 WebSocket 地址')
    return
  }

  try {
    status.value = 'connecting'
    addSystemMessage(`正在连接到 ${wsUrl.value}...`)

    ws.value = new WebSocket(wsUrl.value)

    ws.value.onopen = () => {
      status.value = 'connected'
      addSystemMessage('✅ 连接成功')
      ElMessage.success('WebSocket 连接成功')
      
      // 启动心跳
      if (heartbeatInterval.value > 0) {
        startHeartbeat()
      }
    }

    ws.value.onmessage = (event) => {
      messages.value.push({
        id: Date.now(),
        type: 'received',
        content: event.data,
        timestamp: new Date()
      })
      scrollToBottom()
    }

    ws.value.onerror = (error) => {
      status.value = 'error'
      addSystemMessage('❌ 连接错误')
      ElMessage.error('WebSocket 连接失败')
      console.error('WebSocket error:', error)
    }

    ws.value.onclose = (event) => {
      status.value = 'disconnected'
      addSystemMessage(`🔌 连接已关闭 (code: ${event.code})`)
      stopHeartbeat()

      if (autoReconnect.value && event.code !== 1000) {
        addSystemMessage('⏳ 5秒后自动重连...')
        setTimeout(() => {
          if (status.value === 'disconnected') {
            connect()
          }
        }, 5000)
      }
    }
  } catch (error) {
    status.value = 'error'
    addSystemMessage(`❌ 连接失败: ${error}`)
    ElMessage.error('创建 WebSocket 连接失败')
  }
}

// 断开连接
function disconnect() {
  if (ws.value) {
    stopHeartbeat()
    ws.value.close(1000, 'User disconnected')
    ws.value = null
  }
  status.value = 'disconnected'
  addSystemMessage('🔌 主动断开连接')
}

// 发送消息
function sendMessage() {
  if (!canSend.value) return

  try {
    ws.value?.send(message.value)
    messages.value.push({
      id: Date.now(),
      type: 'sent',
      content: message.value,
      timestamp: new Date()
    })
    message.value = ''
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送消息失败')
    console.error('Send error:', error)
  }
}

// 清空消息
function clearMessages() {
  messages.value = []
  addSystemMessage('🗑️ 消息已清空')
}

// 心跳功能
function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer.value = window.setInterval(() => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      try {
        ws.value.send('ping')
        console.log('💓 发送心跳')
      } catch (error) {
        console.error('Heartbeat error:', error)
      }
    }
  }, heartbeatInterval.value * 1000)
}

function stopHeartbeat() {
  if (heartbeatTimer.value) {
    clearInterval(heartbeatTimer.value)
    heartbeatTimer.value = null
  }
}

// 快捷发送（回车）
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 格式化时间
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 组件卸载时清理
onBeforeUnmount(() => {
  disconnect()
})
</script>

<template>
  <div class="websocket-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h3 class="page-title">
          <i class="i-mdi-connection" />
          WebSocket 测试工具
        </h3>
        <p class="page-description">连接 WebSocket 服务器，测试实时通信功能</p>
      </div>
      <div class="header-actions">
        <NeonButton
          v-if="isConnected"
          type="danger"
          icon="i-mdi-close-network"
          @click="disconnect"
        >
          断开连接
        </NeonButton>
        <NeonButton
          v-else
          type="primary"
          icon="i-mdi-connection"
          :loading="isConnecting"
          :disabled="!canConnect"
          @click="connect"
        >
          {{ isConnecting ? '连接中...' : '连接' }}
        </NeonButton>
      </div>
    </div>

    <div class="websocket-container">
      <!-- 连接配置 -->
      <NeonCard class="config-section">
        <template #title>
          <i class="i-mdi-cog" />
          连接配置
        </template>

        <div class="config-content">
          <div class="form-group">
            <label class="form-label">WebSocket 地址</label>
            <NeonInput
              v-model="wsUrl"
              placeholder="wss://echo.websocket.org/"
              :disabled="isConnected || isConnecting"
            >
              <template #prefix>
                <i class="i-mdi-web" />
              </template>
            </NeonInput>
            <div class="form-hint">
              支持 ws:// 和 wss:// 协议，测试可使用：wss://echo.websocket.org/
            </div>
          </div>

          <div class="config-row">
            <div class="config-item">
              <label class="checkbox-label">
                <input
                  v-model="autoReconnect"
                  type="checkbox"
                  class="neon-checkbox"
                  :disabled="isConnected"
                />
                <span>自动重连</span>
              </label>
              <div class="form-hint">连接断开时自动尝试重连</div>
            </div>

            <div class="config-item">
              <label class="form-label">心跳间隔（秒）</label>
              <NeonInput
                v-model.number="heartbeatInterval"
                type="number"
                placeholder="30"
                :disabled="isConnected"
                :min="0"
              />
              <div class="form-hint">0 表示关闭心跳</div>
            </div>
          </div>

          <div class="status-bar">
            <span class="status-label">连接状态：</span>
            <span :class="['status-badge', statusClass]">
              <i
                :class="[
                  isConnected ? 'i-mdi-check-circle' : 
                  isConnecting ? 'i-mdi-loading i-mdi-spin' : 
                  'i-mdi-close-circle'
                ]"
              />
              {{ statusText }}
            </span>
          </div>
        </div>
      </NeonCard>

      <!-- 消息区域 -->
      <div class="message-section">
        <!-- 消息列表 -->
        <NeonCard class="messages-card">
          <template #title>
            <i class="i-mdi-message-text" />
            消息记录
            <span class="message-count">{{ messages.length }}</span>
          </template>
          <template #extra>
            <button
              class="clear-btn"
              :disabled="messages.length === 0"
              @click="clearMessages"
            >
              <i class="i-mdi-delete-sweep" />
              清空
            </button>
          </template>

          <div ref="messagesContainer" class="messages-container scrollbar">
            <div
              v-for="msg in messages"
              :key="msg.id"
              :class="['message-item', `message-${msg.type}`]"
            >
              <div class="message-header">
                <span class="message-type">
                  <i
                    :class="[
                      msg.type === 'sent' ? 'i-mdi-arrow-up-bold' :
                      msg.type === 'received' ? 'i-mdi-arrow-down-bold' :
                      'i-mdi-information'
                    ]"
                  />
                  {{ msg.type === 'sent' ? '发送' : msg.type === 'received' ? '接收' : '系统' }}
                </span>
                <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
              </div>
              <div class="message-content">{{ msg.content }}</div>
            </div>

            <div v-if="messages.length === 0" class="empty-messages">
              <i class="i-mdi-message-outline" />
              <p>暂无消息</p>
              <p class="hint">连接后发送消息或等待服务器推送</p>
            </div>
          </div>
        </NeonCard>

        <!-- 发送区域 -->
        <NeonCard class="send-card">
          <template #title>
            <i class="i-mdi-send" />
            发送消息
          </template>

          <div class="send-content">
            <NeonTextarea
              v-model="message"
              placeholder="输入要发送的消息... (Enter 发送, Shift+Enter 换行)"
              :rows="4"
              :disabled="!isConnected"
              @keydown="handleKeydown"
            />
            <div class="send-actions">
              <span class="send-hint">
                <i class="i-mdi-information" />
                {{ isConnected ? 'Enter 发送，Shift+Enter 换行' : '请先连接 WebSocket 服务器' }}
              </span>
              <NeonButton
                type="primary"
                icon="i-mdi-send"
                :disabled="!canSend"
                @click="sendMessage"
              >
                发送
              </NeonButton>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.websocket-page {
  padding: var(--spacing-lg);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm) 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-title i {
  color: var(--neon-cyan);
}

.page-description {
  color: var(--color-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.websocket-container {
  flex: 1;
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-lg);
  min-height: 0;
}

/* 配置区域 */
.config-section {
  height: fit-content;
}

.config-content {
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
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.form-hint {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text);
  cursor: pointer;
}

.neon-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--neon-cyan);
}

.status-bar {
  padding: var(--spacing-md);
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.status-connected {
  background: rgba(48, 255, 147, 0.15);
  color: #30ff93;
  border: 1px solid rgba(48, 255, 147, 0.3);
}

.status-connecting {
  background: rgba(255, 230, 0, 0.15);
  color: var(--neon-yellow);
  border: 1px solid rgba(255, 230, 0, 0.3);
}

.status-disconnected {
  background: rgba(138, 164, 199, 0.15);
  color: var(--color-text-secondary);
  border: 1px solid rgba(138, 164, 199, 0.3);
}

.status-error {
  background: rgba(255, 42, 161, 0.15);
  color: var(--neon-pink);
  border: 1px solid rgba(255, 42, 161, 0.3);
}

/* 消息区域 */
.message-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-height: 0;
}

.messages-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.message-count {
  margin-left: var(--spacing-sm);
  padding: 2px 8px;
  background: rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--neon-cyan);
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 12px;
  background: transparent;
  border: 1px solid rgba(255, 42, 161, 0.3);
  border-radius: var(--radius-sm);
  color: var(--neon-pink);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.clear-btn:hover:not(:disabled) {
  background: rgba(255, 42, 161, 0.1);
  border-color: var(--neon-pink);
}

.clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 300px;
  max-height: 500px;
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.message-item {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid;
  background: rgba(255, 255, 255, 0.02);
}

.message-sent {
  border-color: rgba(33, 230, 255, 0.3);
  background: rgba(33, 230, 255, 0.05);
}

.message-received {
  border-color: rgba(48, 255, 147, 0.3);
  background: rgba(48, 255, 147, 0.05);
}

.message-system {
  border-color: rgba(138, 164, 199, 0.3);
  background: rgba(138, 164, 199, 0.05);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.message-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  font-weight: 500;
  text-transform: uppercase;
}

.message-sent .message-type {
  color: var(--neon-cyan);
}

.message-received .message-type {
  color: #30ff93;
}

.message-system .message-type {
  color: var(--color-text-secondary);
}

.message-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.message-content {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  word-break: break-word;
  white-space: pre-wrap;
}

.empty-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  gap: var(--spacing-sm);
}

.empty-messages i {
  font-size: 48px;
  opacity: 0.3;
}

.empty-messages p {
  margin: 0;
}

.empty-messages .hint {
  font-size: var(--font-size-xs);
}

/* 发送区域 */
.send-card {
  flex-shrink: 0;
}

.send-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.send-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-xs);
}

.send-hint i {
  color: var(--neon-cyan);
}

/* 响应式 */
@media (max-width: 1200px) {
  .websocket-container {
    grid-template-columns: 1fr;
  }

  .config-row {
    grid-template-columns: 1fr;
  }
}
</style>

