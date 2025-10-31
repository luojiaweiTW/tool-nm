<template>
  <div class="tool-http">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">HTTP 测试</h1>
        <p class="tool-header__description">HTTP/HTTPS 请求测试工具，支持 GET、POST、PUT、DELETE 等</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="showHistoryDialog = true" type="outline">
          <i class="i-mdi-history mr-2" />
          历史记录
          <el-badge :value="requestHistory.length" :max="99" v-if="requestHistory.length > 0" />
        </NeonButton>
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="saveCurrentRequest" type="outline" v-if="url">
          <i class="i-mdi-content-save mr-2" />
          保存
        </NeonButton>
        <NeonButton @click="sendRequest" type="primary" :loading="loading">
          <i class="i-mdi-send mr-2" />
          发送请求
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <!-- 请求配置 -->
      <NeonCard title="🌐 请求配置">
        <!-- 请求方法和 URL -->
        <div class="request-line">
          <el-select v-model="method" size="large" style="width: 120px">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
            <el-option label="PATCH" value="PATCH" />
            <el-option label="HEAD" value="HEAD" />
            <el-option label="OPTIONS" value="OPTIONS" />
          </el-select>
          <NeonInput
            v-model="url"
            placeholder="https://api.example.com/users"
            style="flex: 1"
          />
        </div>

        <!-- Tabs -->
        <el-tabs v-model="activeTab" class="request-tabs">
          <!-- Headers -->
          <el-tab-pane label="Headers" name="headers">
            <div class="headers-section">
              <div v-for="(header, index) in headers" :key="index" class="header-row">
                <NeonInput
                  v-model="header.key"
                  placeholder="Header Name"
                  size="small"
                />
                <NeonInput
                  v-model="header.value"
                  placeholder="Header Value"
                  size="small"
                />
                <el-button
                  type="danger"
                  size="small"
                  @click="removeHeader(index)"
                  :icon="'i-mdi-delete'"
                  circle
                />
              </div>
              <NeonButton size="small" @click="addHeader">
                <i class="i-mdi-plus mr-1" />
                添加 Header
              </NeonButton>
            </div>
          </el-tab-pane>

          <!-- Body -->
          <el-tab-pane label="Body" name="body" v-if="['POST', 'PUT', 'PATCH'].includes(method)">
            <div class="body-section">
              <el-radio-group v-model="bodyType" size="small" class="mb-3">
                <el-radio-button value="json" label="json">JSON</el-radio-button>
                <el-radio-button value="form" label="form">Form Data</el-radio-button>
                <el-radio-button value="text" label="text">Raw Text</el-radio-button>
              </el-radio-group>

              <NeonTextarea
                v-if="bodyType === 'json' || bodyType === 'text'"
                v-model="body"
                :placeholder="bodyType === 'json' ? '{  &quot;key&quot;: &quot;value&quot;}' : '请输入文本...'"
                :rows="12"
              />

              <div v-else class="form-data">
                <div v-for="(param, index) in formData" :key="index" class="form-row">
                  <NeonInput
                    v-model="param.key"
                    placeholder="Key"
                    size="small"
                  />
                  <NeonInput
                    v-model="param.value"
                    placeholder="Value"
                    size="small"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    @click="removeFormParam(index)"
                    :icon="'i-mdi-delete'"
                    circle
                  />
                </div>
                <NeonButton size="small" @click="addFormParam">
                  <i class="i-mdi-plus mr-1" />
                  添加参数
                </NeonButton>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- SSL 选项 -->
        <div class="ssl-options">
          <el-checkbox v-model="ignoreSsl" size="large">
            <span class="ssl-label">
              <i class="i-mdi-shield-alert mr-1" />
              忽略 SSL 证书验证
            </span>
          </el-checkbox>
          <div class="ssl-hint">⚠️ 仅用于测试自签名证书或证书错误的服务器</div>
        </div>
      </NeonCard>

      <!-- 响应结果 -->
      <NeonCard v-if="response" title="📦 响应结果">
        <template #extra>
          <div class="response-meta">
            <el-tag :type="statusType" size="large">{{ response.status }} {{ response.statusText }}</el-tag>
            <span class="response-time">⚡ {{ response.duration }}ms</span>
            <NeonButton size="small" @click="copyResponse">
              <i class="i-mdi-content-copy mr-1" />
              复制
            </NeonButton>
          </div>
        </template>

        <!-- 响应 Tabs -->
        <el-tabs v-model="responseTab">
          <el-tab-pane label="Body" name="body">
            <div class="response-body">
              <pre v-if="formattedResponse">{{ formattedResponse }}</pre>
              <div v-else class="empty-response">无响应内容</div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Headers" name="headers">
            <div class="response-headers">
              <div v-for="(value, key) in response.headers" :key="key" class="header-item">
                <span class="header-key">{{ key }}:</span>
                <span class="header-value">{{ value }}</span>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </NeonCard>

      <!-- 错误提示 -->
      <NeonCard v-else-if="error" title="❌ 请求失败">
        <div class="error-display">
          <div class="error-message">
            <i class="i-mdi-alert-circle mr-2" />
            {{ error }}
          </div>
        </div>
      </NeonCard>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <i class="i-mdi-api empty-state__icon" />
        <p class="empty-state__text">配置并发送 HTTP 请求</p>
        <p class="empty-state__hint">支持自定义 Headers、Body 等参数</p>
      </div>
    </div>

    <!-- 历史记录管理对话框 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="HTTP 请求历史"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="history-manager">
        <!-- 顶部操作栏 -->
        <div class="history-manager__toolbar">
          <el-input
            v-model="historySearchText"
            placeholder="搜索请求（名称、URL、方法）"
            clearable
            style="width: 300px;"
          >
            <template #prefix>
              <i class="i-mdi-magnify" />
            </template>
          </el-input>
          <div style="flex: 1;"></div>
          <el-button
            type="danger"
            :disabled="requestHistory.length === 0"
            @click="confirmClearHistory"
          >
            <i class="i-mdi-delete-sweep" /> 清空全部
          </el-button>
        </div>

        <!-- 历史列表 -->
        <div class="history-list">
          <el-empty 
            v-if="filteredHistory.length === 0 && requestHistory.length === 0"
            description="暂无历史记录"
          >
            <p style="color: var(--color-muted); font-size: 14px;">
              发送请求后点击"保存"按钮可保存到历史
            </p>
          </el-empty>

          <el-empty 
            v-else-if="filteredHistory.length === 0"
            description="未找到匹配的请求"
          />

          <div v-else class="history-items">
            <div
              v-for="(item, index) in filteredHistory"
              :key="index"
              class="history-card"
            >
              <div class="history-card__content">
                <div class="history-card__header">
                  <div class="history-card__title">
                    <el-tag :type="getMethodType(item.method)" size="small">
                      {{ item.method }}
                    </el-tag>
                    <span class="history-card__name">{{ item.name || '未命名请求' }}</span>
                  </div>
                  <div class="history-card__actions">
                    <el-button
                      type="primary"
                      size="small"
                      @click="loadHistoryRequest(item)"
                    >
                      <i class="i-mdi-reload" /> 加载
                    </el-button>
                    <el-button
                      type="primary"
                      size="small"
                      @click="editHistoryRequest(item, index)"
                    >
                      <i class="i-mdi-pencil" /> 编辑
                    </el-button>
                    <el-button
                      type="success"
                      size="small"
                      @click="sendHistoryRequest(item)"
                    >
                      <i class="i-mdi-send" /> 发送
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="confirmDeleteHistory(index)"
                    >
                      <i class="i-mdi-delete" />
                    </el-button>
                  </div>
                </div>
                
                <div class="history-card__details">
                  <div class="history-card__url">
                    <i class="i-mdi-link-variant" />
                    <span>{{ item.url }}</span>
                  </div>
                  <div class="history-card__meta">
                    <div class="history-card__detail-item">
                      <i class="i-mdi-clock-outline" />
                      <span>{{ formatLastUsed(item.lastUsed) }}</span>
                    </div>
                    <div class="history-card__detail-item" v-if="item.headers && item.headers.length > 0">
                      <i class="i-mdi-tag-multiple" />
                      <span>{{ item.headers.length }} 个 Header</span>
                    </div>
                    <div class="history-card__detail-item" v-if="item.body">
                      <i class="i-mdi-file-document" />
                      <span>包含 Body</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 保存/编辑请求对话框 -->
    <el-dialog
      v-model="showSaveDialog"
      :title="editingHistoryIndex !== null ? '编辑请求' : '保存请求'"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="请求名称">
          <el-input
            v-model="saveForm.name"
            placeholder="例如：获取用户列表"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="saveForm.description"
            type="textarea"
            placeholder="可选：添加请求描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <NeonButton variant="outline" @click="showSaveDialog = false">取消</NeonButton>
        <NeonButton type="primary" @click="confirmSaveRequest">
          <i class="i-mdi-content-save" /> 保存
        </NeonButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

interface Header {
  key: string
  value: string
}

interface FormParam {
  key: string
  value: string
}

interface Response {
  status: number
  statusText: string
  headers: Record<string, string>
  data: any
  duration: number
}

interface HttpRequestHistory {
  name: string
  description?: string
  method: string
  url: string
  headers: Header[]
  bodyType: 'json' | 'form' | 'text'
  body: string
  formData: FormParam[]
  ignoreSsl: boolean
  lastUsed: number
}

// 请求配置
const method = ref('GET')
const url = ref('')
const headers = ref<Header[]>([
  { key: 'Content-Type', value: 'application/json' }
])
const bodyType = ref<'json' | 'form' | 'text'>('json')
const body = ref('')
const formData = ref<FormParam[]>([])
const ignoreSsl = ref(false)

// UI 状态
const activeTab = ref('headers')
const responseTab = ref('body')
const loading = ref(false)

// 响应数据
const response = ref<Response | null>(null)
const error = ref('')

// 历史记录
const requestHistory = ref<HttpRequestHistory[]>([])
const showHistoryDialog = ref(false)
const showSaveDialog = ref(false)
const historySearchText = ref('')
const editingHistoryIndex = ref<number | null>(null)
const saveForm = ref({
  name: '',
  description: ''
})

// 过滤历史记录
const filteredHistory = computed(() => {
  if (!historySearchText.value.trim()) {
    return requestHistory.value
  }
  
  const search = historySearchText.value.toLowerCase()
  return requestHistory.value.filter(item =>
    (item.name && item.name.toLowerCase().includes(search)) ||
    item.url.toLowerCase().includes(search) ||
    item.method.toLowerCase().includes(search) ||
    (item.description && item.description.toLowerCase().includes(search))
  )
})

// 状态标签类型
const statusType = computed(() => {
  if (!response.value) return 'info'
  const status = response.value.status
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
})

// 格式化响应
const formattedResponse = computed(() => {
  if (!response.value?.data) return ''
  
  try {
    if (typeof response.value.data === 'object') {
      return JSON.stringify(response.value.data, null, 2)
    }
    return response.value.data
  } catch {
    return response.value.data
  }
})

// 添加 Header
function addHeader() {
  headers.value.push({ key: '', value: '' })
}

// 移除 Header
function removeHeader(index: number) {
  headers.value.splice(index, 1)
}

// 添加表单参数
function addFormParam() {
  formData.value.push({ key: '', value: '' })
}

// 移除表单参数
function removeFormParam(index: number) {
  formData.value.splice(index, 1)
}

// 发送请求
async function sendRequest() {
  if (!url.value) {
    ElMessage.warning('请输入请求 URL')
    return
  }

  loading.value = true
  response.value = null
  error.value = ''

  const startTime = Date.now()

  try {
    // 构建请求头
    const requestHeaders: Record<string, string> = {}
    headers.value.forEach(h => {
      if (h.key && h.value) {
        requestHeaders[h.key] = h.value
      }
    })

    // 构建请求体
    let requestBody: any = undefined
    if (['POST', 'PUT', 'PATCH'].includes(method.value)) {
      if (bodyType.value === 'json') {
        try {
          requestBody = body.value ? JSON.parse(body.value) : undefined
        } catch {
          throw new Error('JSON 格式错误')
        }
      } else if (bodyType.value === 'form') {
        const data = new FormData()
        formData.value.forEach(p => {
          if (p.key && p.value) {
            data.append(p.key, p.value)
          }
        })
        requestBody = data
      } else {
        requestBody = body.value
      }
    }

    // 配置 axios（仅在 Node/Electron 环境中设置 httpsAgent）
    const config: any = {
      method: method.value.toLowerCase(),
      url: url.value,
      headers: requestHeaders,
      data: requestBody,
      timeout: 30000,
      validateStatus: () => true, // 接受所有状态码
    }

    // 在浏览器环境中，无法忽略 SSL（浏览器限制）
    // 在 Electron 环境中，可以通过主进程处理
    if (ignoreSsl.value) {
      // 提示用户这是不安全的操作
      console.warn('[不安全] 已禁用 SSL 证书验证')
    }

    // 发送请求
    const res = await axios(config)

    const duration = Date.now() - startTime

    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers as Record<string, string>,
      data: res.data,
      duration
    }

    ElMessage.success('请求成功')
  } catch (e: any) {
    const duration = Date.now() - startTime
    
    if (e.response) {
      // 服务器返回错误
      response.value = {
        status: e.response.status,
        statusText: e.response.statusText,
        headers: e.response.headers,
        data: e.response.data,
        duration
      }
      error.value = `HTTP ${e.response.status}: ${e.response.statusText}`
    } else if (e.request) {
      // 请求已发送但没有收到响应
      error.value = '请求超时或网络错误'
    } else {
      // 其他错误
      error.value = e.message || '请求失败'
    }
    
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 复制响应
async function copyResponse() {
  try {
    await navigator.clipboard.writeText(formattedResponse.value)
    ElMessage.success('响应已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  url.value = ''
  body.value = ''
  formData.value = []
  response.value = null
  error.value = ''
}

// 获取请求方法的标签类型
function getMethodType(method: string) {
  switch (method) {
    case 'GET': return 'primary'
    case 'POST': return 'success'
    case 'PUT': return 'warning'
    case 'DELETE': return 'danger'
    case 'PATCH': return 'info'
    default: return ''
  }
}

// 格式化最后使用时间
function formatLastUsed(timestamp: number) {
  const now = Date.now()
  const diff = now - timestamp
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`
  } else {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }
}

// 保存当前请求
function saveCurrentRequest() {
  if (!url.value) {
    ElMessage.warning('请先配置请求')
    return
  }
  
  saveForm.value = {
    name: '',
    description: ''
  }
  editingHistoryIndex.value = null
  showSaveDialog.value = true
}

// 确认保存请求
function confirmSaveRequest() {
  if (!saveForm.value.name.trim()) {
    ElMessage.warning('请输入请求名称')
    return
  }
  
  const record: HttpRequestHistory = {
    name: saveForm.value.name.trim(),
    description: saveForm.value.description?.trim(),
    method: method.value,
    url: url.value,
    headers: [...headers.value],
    bodyType: bodyType.value,
    body: body.value,
    formData: [...formData.value],
    ignoreSsl: ignoreSsl.value,
    lastUsed: Date.now()
  }
  
  if (editingHistoryIndex.value !== null) {
    // 更新现有记录
    requestHistory.value[editingHistoryIndex.value] = record
    ElMessage.success('请求已更新')
  } else {
    // 添加新记录
    requestHistory.value.unshift(record)
    ElMessage.success('请求已保存')
  }
  
  // 限制历史记录数量
  if (requestHistory.value.length > 50) {
    requestHistory.value = requestHistory.value.slice(0, 50)
  }
  
  showSaveDialog.value = false
  editingHistoryIndex.value = null
}

// 加载历史请求
function loadHistoryRequest(item: HttpRequestHistory) {
  method.value = item.method
  url.value = item.url
  headers.value = [...item.headers]
  bodyType.value = item.bodyType
  body.value = item.body
  formData.value = [...item.formData]
  ignoreSsl.value = item.ignoreSsl
  
  showHistoryDialog.value = false
  ElMessage.success('已加载历史请求')
}

// 发送历史请求
async function sendHistoryRequest(item: HttpRequestHistory) {
  loadHistoryRequest(item)
  await new Promise(resolve => setTimeout(resolve, 100))
  sendRequest()
}

// 编辑历史请求
function editHistoryRequest(item: HttpRequestHistory, index: number) {
  saveForm.value = {
    name: item.name,
    description: item.description || ''
  }
  editingHistoryIndex.value = index
  showHistoryDialog.value = false
  showSaveDialog.value = true
}

// 删除历史记录
function deleteHistoryRequest(index: number) {
  requestHistory.value.splice(index, 1)
  ElMessage.success('已删除')
}

// 确认删除
async function confirmDeleteHistory(index: number) {
  const item = requestHistory.value[index]
  try {
    await ElMessageBox.confirm(
      `确定要删除请求 "${item.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    deleteHistoryRequest(index)
  } catch {
    // 用户取消
  }
}

// 清空历史
function clearHistory() {
  requestHistory.value = []
  ElMessage.success('已清空历史记录')
}

// 确认清空
async function confirmClearHistory() {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有历史记录吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    clearHistory()
  } catch {
    // 用户取消
  }
}

// 加载历史记录
async function loadHistory() {
  try {
    // 优先从 Electron 文件加载
    if (window.electron?.http) {
      const result = await window.electron.http.loadHistory()
      if (result.success && result.data) {
        requestHistory.value = result.data
        console.log('✓ Loaded', requestHistory.value.length, 'HTTP request history from file')
        return
      }
    }
    
    // 降级到 localStorage
    const stored = localStorage.getItem('http-request-history')
    if (stored) {
      requestHistory.value = JSON.parse(stored)
      console.log('Loaded', requestHistory.value.length, 'HTTP request history from localStorage')
    }
  } catch (e) {
    console.error('Failed to load HTTP history:', e)
  }
}

// 保存历史记录
async function saveHistory() {
  try {
    // 将响应式对象转换为普通对象（避免 IPC 序列化错误）
    const plainHistory = JSON.parse(JSON.stringify(requestHistory.value))
    
    // 优先保存到 Electron 文件
    if (window.electron?.http) {
      const result = await window.electron.http.saveHistory(plainHistory)
      if (result.success) {
        console.log('✓ Saved', plainHistory.length, 'HTTP request history to file')
        return
      }
    }
    
    // 降级到 localStorage
    localStorage.setItem('http-request-history', JSON.stringify(plainHistory))
    console.log('Saved', plainHistory.length, 'HTTP request history to localStorage')
  } catch (e) {
    console.error('Failed to save HTTP history:', e)
  }
}

// 监听历史记录变化，自动保存
watch(requestHistory, () => {
  saveHistory()
}, { deep: true })

// 初始化
onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.tool-http {
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

.request-line {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.request-tabs {
  margin-top: var(--spacing-md);
}

.headers-section,
.form-data {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.header-row,
.form-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.header-row :deep(.neon-input),
.form-row :deep(.neon-input) {
  flex: 1;
}

.body-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mb-3 {
  margin-bottom: var(--spacing-md);
}

.response-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.response-time {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.response-body {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.response-body pre {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-response {
  color: var(--color-text-disabled);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-xl);
}

.response-headers {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.header-item {
  display: flex;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
  font-family: var(--font-family-mono);
}

.header-item:last-child {
  border-bottom: none;
}

.header-key {
  color: var(--neon-cyan);
  font-weight: var(--font-weight-semibold);
  min-width: 200px;
  flex-shrink: 0;
}

.header-value {
  color: var(--color-text);
  word-break: break-all;
}

.error-display {
  padding: var(--spacing-lg);
}

.error-message {
  padding: var(--spacing-md);
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  display: flex;
  align-items: center;
  font-size: var(--font-size-base);
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

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

.ssl-options {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(255, 230, 0, 0.05);
  border: 1px solid rgba(255, 230, 0, 0.2);
  border-radius: var(--radius-md);
}

.ssl-label {
  display: flex;
  align-items: center;
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.ssl-hint {
  margin-top: var(--spacing-sm);
  margin-left: var(--spacing-xl);
  font-size: var(--font-size-xs);
  color: var(--neon-yellow);
}

.form-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

/* 历史记录管理界面 */
.history-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-manager__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.history-list {
  max-height: 500px;
  overflow-y: auto;
}

.history-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-card {
  background: var(--color-panel);
  border: 2px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  transition: all var(--transition-base);
}

.history-card:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2);
  transform: translateY(-2px);
}

.history-card__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.history-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
}

.history-card__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
}

.history-card__name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-text);
}

.history-card__actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.history-card__details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.history-card__url {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  word-break: break-all;
}

.history-card__url i {
  font-size: 14px;
  flex-shrink: 0;
  color: var(--neon-cyan);
}

.history-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.history-card__detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.history-card__detail-item i {
  font-size: 14px;
  color: var(--neon-cyan);
}
</style>

