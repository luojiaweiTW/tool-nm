<template>
  <div class="ip-scanner-container">
    <NeonCard title="IP 扫描器" description="扫描局域网中的 IP 地址使用情况">
      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-group">
          <label class="input-label">IP 网段前缀</label>
          <div class="input-wrapper">
            <NeonInput
              v-model="ipPrefix"
              placeholder="例如: 192.168.10"
              :disabled="isScanning"
              @keyup.enter="startScan"
            />
            <span class="suffix-text">.1-254</span>
          </div>
          <div class="help-text">
            <i class="i-carbon-information" />
            输入 IP 地址的前三段，将扫描该网段下的 1-254 所有 IP
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">超时时间（毫秒）</label>
          <NeonInput
            v-model.number="timeout"
            type="number"
            placeholder="1000"
            :disabled="isScanning"
          />
        </div>

        <div class="action-buttons">
          <NeonButton
            v-if="!isScanning"
            type="primary"
            icon="i-carbon-play"
            @click="startScan"
          >
            开始扫描
          </NeonButton>
          <NeonButton
            v-else
            type="danger"
            icon="i-carbon-stop"
            @click="stopScan"
          >
            停止扫描
          </NeonButton>
          <NeonButton
            v-if="scanResults.length > 0"
            icon="i-carbon-trash-can"
            @click="clearResults"
          >
            清空结果
          </NeonButton>
        </div>
      </div>

      <!-- 扫描进度 -->
      <div v-if="isScanning" class="progress-section">
        <div class="progress-info">
          <span class="progress-text">扫描进度</span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="scan-stats">
          <span class="stat-item">
            <i class="i-carbon-checkmark-filled text-neon-green" />
            在线: {{ onlineCount }}
          </span>
          <span class="stat-item">
            <i class="i-carbon-close-filled text-neon-red" />
            离线: {{ offlineCount }}
          </span>
          <span class="stat-item">
            <i class="i-carbon-chart-line" />
            已扫描: {{ currentProgress }}/254
          </span>
        </div>
      </div>

      <!-- 扫描结果统计 -->
      <div v-if="scanResults.length > 0 && !isScanning" class="summary-section">
        <div class="summary-card online">
          <i class="i-carbon-checkmark-filled" />
          <div class="summary-content">
            <div class="summary-label">可用 IP</div>
            <div class="summary-value">{{ offlineIPs.length }}</div>
          </div>
        </div>
        <div class="summary-card offline">
          <i class="i-carbon-close-filled" />
          <div class="summary-content">
            <div class="summary-label">已占用 IP</div>
            <div class="summary-value">{{ onlineIPs.length }}</div>
          </div>
        </div>
        <div class="summary-card total">
          <i class="i-carbon-analytics" />
          <div class="summary-content">
            <div class="summary-label">总计</div>
            <div class="summary-value">{{ scanResults.length }}</div>
          </div>
        </div>
      </div>

      <!-- 结果列表 -->
      <div v-if="scanResults.length > 0" class="results-section">
        <!-- Tab 切换 -->
        <div class="tabs">
          <button
            :class="['tab', { active: currentTab === 'all' }]"
            @click="currentTab = 'all'"
          >
            全部 ({{ scanResults.length }})
          </button>
          <button
            :class="['tab', { active: currentTab === 'online' }]"
            @click="currentTab = 'online'"
          >
            已占用 ({{ onlineIPs.length }})
          </button>
          <button
            :class="['tab', { active: currentTab === 'offline' }]"
            @click="currentTab = 'offline'"
          >
            可用 ({{ offlineIPs.length }})
          </button>
        </div>

        <!-- 结果表格 -->
        <div class="results-table">
          <div class="table-header">
            <div class="col-status">状态</div>
            <div class="col-ip">IP 地址</div>
            <div class="col-response">响应时间</div>
          </div>
          <div class="table-body">
            <div
              v-for="result in filteredResults"
              :key="result.ip"
              :class="['table-row', result.isOnline ? 'online' : 'offline']"
            >
              <div class="col-status">
                <span v-if="result.isOnline" class="status-badge online">
                  <i class="i-carbon-checkmark-filled" />
                  已占用
                </span>
                <span v-else class="status-badge offline">
                  <i class="i-carbon-close-filled" />
                  可用
                </span>
              </div>
              <div class="col-ip">
                <code>{{ result.ip }}</code>
              </div>
              <div class="col-response">
                <span v-if="result.responseTime">{{ result.responseTime }}ms</span>
                <span v-else class="text-gray">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!isScanning && scanResults.length === 0" class="empty-state">
        <i class="i-carbon-network-4" />
        <p>输入 IP 网段前缀开始扫描</p>
      </div>
    </NeonCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonButton from '@/components/NeonButton.vue'

// 表单数据
const ipPrefix = ref('192.168.1')
const timeout = ref(1000)

// 扫描状态
const isScanning = ref(false)
const currentProgress = ref(0)
const progressPercent = computed(() => {
  return Math.floor((currentProgress.value / 254) * 100)
})

// 扫描结果
const scanResults = ref<Array<{
  ip: string
  isOnline: boolean
  responseTime: number | null
}>>([])

const onlineCount = ref(0)
const offlineCount = ref(0)

// Tab 切换
const currentTab = ref<'all' | 'online' | 'offline'>('all')

// 计算属性
const onlineIPs = computed(() => scanResults.value.filter(r => r.isOnline))
const offlineIPs = computed(() => scanResults.value.filter(r => !r.isOnline))

const filteredResults = computed(() => {
  if (currentTab.value === 'online') return onlineIPs.value
  if (currentTab.value === 'offline') return offlineIPs.value
  return scanResults.value
})

/**
 * 验证 IP 前缀格式
 */
function validateIPPrefix(prefix: string): boolean {
  const parts = prefix.split('.')
  if (parts.length !== 3) return false
  
  for (const part of parts) {
    const num = parseInt(part)
    if (isNaN(num) || num < 0 || num > 255) return false
  }
  
  return true
}

/**
 * 开始扫描
 */
async function startScan() {
  // 验证输入
  if (!ipPrefix.value.trim()) {
    ElMessage.warning('请输入 IP 网段前缀')
    return
  }
  
  if (!validateIPPrefix(ipPrefix.value)) {
    ElMessage.error('IP 网段前缀格式错误，应为 x.x.x 格式')
    return
  }
  
  if (timeout.value < 100 || timeout.value > 10000) {
    ElMessage.warning('超时时间应在 100-10000 毫秒之间')
    return
  }
  
  // 重置状态
  isScanning.value = true
  scanResults.value = []
  currentProgress.value = 0
  onlineCount.value = 0
  offlineCount.value = 0
  
  try {
    // 调用 Electron API 开始扫描
    const result = await window.electron.invoke('ip-scanner:scan', ipPrefix.value, timeout.value)
    
    if (result.success) {
      // 注意：不需要再次赋值 scanResults，因为实时进度已经通过 handleProgress 添加了
      // scanResults.value = result.data.results
      
      ElMessage.success({
        message: `扫描完成！在线: ${result.data.summary.online}，离线: ${result.data.summary.offline}`,
        duration: 3000
      })
    } else {
      ElMessage.error(result.error || '扫描失败')
    }
  } catch (error: any) {
    console.error('Scan error:', error)
    ElMessage.error('扫描失败: ' + error.message)
  } finally {
    isScanning.value = false
  }
}

/**
 * 停止扫描
 */
function stopScan() {
  isScanning.value = false
  ElMessage.info('扫描已停止')
}

/**
 * 清空结果
 */
function clearResults() {
  scanResults.value = []
  currentProgress.value = 0
  onlineCount.value = 0
  offlineCount.value = 0
  currentTab.value = 'all'
}

/**
 * 监听扫描进度
 */
function handleProgress(data: any) {
  currentProgress.value = data.current
  
  if (data.isOnline) {
    onlineCount.value++
  } else {
    offlineCount.value++
  }
  
  // 将结果添加到列表（实时显示，包含响应时间）
  scanResults.value.push({
    ip: data.ip,
    isOnline: data.isOnline,
    responseTime: data.responseTime
  })
}

/**
 * 监听扫描完成
 */
function handleComplete(data: any) {
  console.log('Scan complete:', data)
}

// 生命周期
onMounted(() => {
  // 监听扫描进度事件
  window.electron.on('ip-scanner:progress', handleProgress)
  window.electron.on('ip-scanner:complete', handleComplete)
})

onBeforeUnmount(() => {
  // 移除事件监听
  window.electron.off('ip-scanner:progress', handleProgress)
  window.electron.off('ip-scanner:complete', handleComplete)
})
</script>

<style scoped>
.ip-scanner-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 输入区域 */
.input-section {
  margin-bottom: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  color: var(--neon-blue);
  font-size: 14px;
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suffix-text {
  color: var(--neon-blue);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  white-space: nowrap;
}

.help-text {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(33, 230, 255, 0.6);
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

/* 进度区域 */
.progress-section {
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  color: var(--neon-blue);
  font-size: 14px;
  font-weight: 500;
}

.progress-percent {
  color: var(--neon-blue);
  font-size: 18px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

.progress-bar {
  height: 8px;
  background: rgba(33, 230, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--neon-blue), var(--neon-pink));
  border-radius: 4px;
  transition: width 0.3s ease;
}

.scan-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

/* 统计卡片 */
.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid;
}

.summary-card.online {
  background: rgba(94, 234, 212, 0.05);
  border-color: rgba(94, 234, 212, 0.3);
}

.summary-card.online i {
  color: #5eead4;
  font-size: 32px;
}

.summary-card.offline {
  background: rgba(251, 113, 133, 0.08);
  border-color: rgba(251, 113, 133, 0.4);
}

.summary-card.offline i {
  color: #ff6b87;
  font-size: 32px;
}

.summary-card.total {
  background: rgba(33, 230, 255, 0.05);
  border-color: rgba(33, 230, 255, 0.3);
}

.summary-card.total i {
  color: var(--neon-blue);
  font-size: 32px;
}

.summary-content {
  flex: 1;
}

.summary-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  margin-bottom: 4px;
}

.summary-value {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
}

/* 结果区域 */
.results-section {
  margin-top: 30px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(33, 230, 255, 0.2);
}

.tab {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab:hover {
  color: var(--neon-blue);
}

.tab.active {
  color: var(--neon-blue);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--neon-blue);
  box-shadow: 0 0 8px var(--neon-blue);
}

/* 结果表格 */
.results-table {
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(33, 230, 255, 0.05);
  color: var(--neon-blue);
  font-size: 14px;
  font-weight: 600;
}

.table-body {
  max-height: 500px;
  overflow-y: auto;
}

.table-row {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  gap: 16px;
  padding: 16px 20px;
  border-top: 1px solid rgba(33, 230, 255, 0.1);
  transition: background 0.2s;
}

.table-row:hover {
  background: rgba(33, 230, 255, 0.05);
}

.col-status,
.col-ip,
.col-response {
  display: flex;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.online {
  background: rgba(94, 234, 212, 0.2);
  color: #fff;
  border: 1px solid rgba(94, 234, 212, 0.5);
}

.status-badge.online i {
  color: #5eead4;
}

.status-badge.offline {
  background: rgba(251, 113, 133, 0.2);
  color: #fff;
  border: 1px solid rgba(251, 113, 133, 0.5);
}

.status-badge.offline i {
  color: #ff6b87;
}

.col-ip code {
  font-family: 'JetBrains Mono', monospace;
  color: var(--neon-blue);
  font-size: 14px;
}

.col-response {
  color: rgba(255, 255, 255, 0.8);
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
}

.text-gray {
  color: rgba(255, 255, 255, 0.3);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 16px;
  color: rgba(33, 230, 255, 0.3);
}

.empty-state p {
  font-size: 16px;
}

/* 滚动条样式 */
.table-body::-webkit-scrollbar {
  width: 8px;
}

.table-body::-webkit-scrollbar-track {
  background: rgba(33, 230, 255, 0.05);
}

.table-body::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.3);
  border-radius: 4px;
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.5);
}
</style>

