<template>
  <div class="system-monitor">
    <!-- 顶部控制栏 -->
    <div class="monitor-header">
      <div class="header-left">
        <h2 class="monitor-title">
          <i class="i-mdi-monitor-dashboard" />
          系统监控
        </h2>
        <span class="monitor-subtitle">实时监控系统资源使用情况</span>
      </div>
      <div class="header-right">
        <!-- 自动刷新开关 -->
        <div class="refresh-control">
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            inactive-text="手动模式"
            @change="toggleAutoRefresh"
          />
          <el-select
            v-if="autoRefresh"
            v-model="refreshInterval"
            size="small"
            style="width: 100px; margin-left: 12px"
            @change="restartAutoRefresh"
          >
            <el-option label="1秒" :value="1000" />
            <el-option label="2秒" :value="2000" />
            <el-option label="5秒" :value="5000" />
            <el-option label="10秒" :value="10000" />
          </el-select>
        </div>
        <!-- 手动刷新按钮 -->
        <el-button
          type="primary"
          :icon="Refresh"
          :loading="loading"
          @click="fetchSystemInfo"
        >
          {{ autoRefresh ? '立即刷新' : '刷新数据' }}
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !systemInfo" class="loading-container">
      <el-icon class="is-loading" :size="48">
        <Loading />
      </el-icon>
      <p>正在获取系统信息...</p>
    </div>

    <!-- 系统信息面板 -->
    <div v-else-if="systemInfo" class="monitor-content">
      <!-- 第一行：CPU 和 内存 -->
      <div class="monitor-row">
        <!-- CPU 使用率 -->
        <div class="monitor-card">
          <div class="card-header">
            <i class="i-mdi-cpu-64-bit card-icon" />
            <h3>CPU 使用率</h3>
          </div>
          <div class="card-body">
            <div class="metric-main">
              <div class="metric-value">{{ systemInfo.cpu.usage.toFixed(1) }}%</div>
              <el-progress
                :percentage="systemInfo.cpu.usage"
                :color="getProgressColor(systemInfo.cpu.usage)"
                :stroke-width="12"
              />
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="detail-label">处理器：</span>
                <span class="detail-value">{{ systemInfo.cpu.model }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">核心数：</span>
                <span class="detail-value">{{ systemInfo.cpu.cores }} 核</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">架构：</span>
                <span class="detail-value">{{ systemInfo.cpu.arch }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 内存使用情况 -->
        <div class="monitor-card">
          <div class="card-header">
            <i class="i-mdi-memory card-icon" />
            <h3>内存使用情况</h3>
          </div>
          <div class="card-body">
            <div class="metric-main">
              <div class="metric-value">{{ systemInfo.memory.usagePercent.toFixed(1) }}%</div>
              <el-progress
                :percentage="systemInfo.memory.usagePercent"
                :color="getProgressColor(systemInfo.memory.usagePercent)"
                :stroke-width="12"
              />
            </div>
            <div class="metric-details">
              <div class="detail-item">
                <span class="detail-label">已用：</span>
                <span class="detail-value">{{ formatBytes(systemInfo.memory.used) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">总计：</span>
                <span class="detail-value">{{ formatBytes(systemInfo.memory.total) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">可用：</span>
                <span class="detail-value">{{ formatBytes(systemInfo.memory.free) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行：磁盘信息 -->
      <div class="monitor-row">
        <div class="monitor-card monitor-card--full">
          <div class="card-header">
            <i class="i-mdi-harddisk card-icon" />
            <h3>磁盘使用情况</h3>
          </div>
          <div class="card-body">
            <div class="disk-list">
              <div
                v-for="disk in systemInfo.disks"
                :key="disk.mount"
                class="disk-item"
              >
                <div class="disk-header">
                  <div class="disk-info">
                    <i class="i-mdi-harddisk disk-icon" />
                    <span class="disk-mount">{{ disk.mount }}</span>
                    <el-tag size="small" type="info">{{ disk.fs }}</el-tag>
                  </div>
                  <div class="disk-usage">
                    <span class="usage-text">
                      {{ formatBytes(disk.used) }} / {{ formatBytes(disk.total) }}
                    </span>
                    <span class="usage-percent">{{ disk.usagePercent.toFixed(1) }}%</span>
                  </div>
                </div>
                <el-progress
                  :percentage="disk.usagePercent"
                  :color="getProgressColor(disk.usagePercent)"
                  :stroke-width="8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第三行：系统信息和网络信息 -->
      <div class="monitor-row">
        <!-- 系统信息 -->
        <div class="monitor-card">
          <div class="card-header">
            <i class="i-mdi-information-outline card-icon" />
            <h3>系统信息</h3>
          </div>
          <div class="card-body">
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">操作系统：</span>
                <span class="info-value">{{ systemInfo.os.platform }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">系统版本：</span>
                <span class="info-value">{{ systemInfo.os.release }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">主机名：</span>
                <span class="info-value">{{ systemInfo.os.hostname }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">系统架构：</span>
                <span class="info-value">{{ systemInfo.os.arch }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">运行时长：</span>
                <span class="info-value">{{ formatUptime(systemInfo.os.uptime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 网络信息 -->
        <div class="monitor-card">
          <div class="card-header">
            <i class="i-mdi-network card-icon" />
            <h3>网络接口</h3>
          </div>
          <div class="card-body">
            <div class="network-list">
              <div
                v-for="(network, name) in systemInfo.network"
                :key="name"
                class="network-item"
              >
                <div class="network-name">
                  <i class="i-mdi-ethernet" />
                  {{ name }}
                </div>
                <div class="network-addresses">
                  <div
                    v-for="(addr, idx) in network"
                    :key="idx"
                    class="network-address"
                  >
                    <el-tag :type="addr.family === 'IPv4' ? 'primary' : 'success'" size="small">
                      {{ addr.family }}
                    </el-tag>
                    <span class="address-value">{{ addr.address }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最后更新时间 -->
      <div class="update-info">
        <i class="i-mdi-clock-outline" />
        最后更新：{{ lastUpdateTime }}
        <span v-if="autoRefresh" class="auto-refresh-indicator">
          <i class="i-mdi-sync rotating" />
          自动刷新中
        </span>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-icon :size="48" color="#f56c6c">
        <WarningFilled />
      </el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchSystemInfo">重试</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, WarningFilled } from '@element-plus/icons-vue'

// 声明全局类型
declare global {
  interface Window {
    electronAPI?: {
      invoke?: (channel: string, ...args: any[]) => Promise<any>
    }
  }
}

interface CPUInfo {
  model: string
  cores: number
  usage: number
  arch: string
}

interface MemoryInfo {
  total: number
  free: number
  used: number
  usagePercent: number
}

interface DiskInfo {
  mount: string
  fs: string
  total: number
  used: number
  free: number
  usagePercent: number
}

interface OSInfo {
  platform: string
  release: string
  hostname: string
  arch: string
  uptime: number
}

interface NetworkAddress {
  address: string
  family: string
  internal: boolean
}

interface SystemInfo {
  cpu: CPUInfo
  memory: MemoryInfo
  disks: DiskInfo[]
  os: OSInfo
  network: Record<string, NetworkAddress[]>
}

const systemInfo = ref<SystemInfo | null>(null)
const loading = ref(false)
const error = ref('')
const lastUpdateTime = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(2000) // 默认2秒
let refreshTimer: NodeJS.Timeout | null = null

// 获取系统信息
const fetchSystemInfo = async () => {
  if (!window.electronAPI) {
    error.value = '请在 Electron 环境中运行'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await window.electronAPI.invoke('system:getInfo')
    
    if (result.success) {
      systemInfo.value = result.data
      lastUpdateTime.value = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } else {
      error.value = result.error || '获取系统信息失败'
      ElMessage.error(error.value)
    }
  } catch (err) {
    error.value = '获取系统信息时发生错误：' + (err as Error).message
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 切换自动刷新
const toggleAutoRefresh = (value: boolean) => {
  if (value) {
    startAutoRefresh()
    ElMessage.success(`已开启自动刷新，间隔 ${refreshInterval.value / 1000} 秒`)
  } else {
    stopAutoRefresh()
    ElMessage.info('已关闭自动刷新')
  }
}

// 启动自动刷新
const startAutoRefresh = () => {
  stopAutoRefresh() // 先停止之前的定时器
  
  // 立即刷新一次
  fetchSystemInfo()
  
  // 设置定时器
  refreshTimer = setInterval(() => {
    fetchSystemInfo()
  }, refreshInterval.value)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 重启自动刷新（改变刷新间隔时）
const restartAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
    ElMessage.success(`刷新间隔已设置为 ${refreshInterval.value / 1000} 秒`)
  }
}

// 格式化字节大小
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化运行时长
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (minutes > 0) parts.push(`${minutes}分钟`)
  
  return parts.join(' ') || '不到1分钟'
}

// 根据使用率获取进度条颜色
const getProgressColor = (percent: number): string => {
  if (percent < 50) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

onMounted(() => {
  // 初始加载
  fetchSystemInfo()
})

onUnmounted(() => {
  // 组件卸载时清理定时器
  stopAutoRefresh()
})
</script>

<style scoped>
.system-monitor {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-xl);
  overflow: hidden;
}

/* 顶部控制栏 */
.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 2px solid var(--color-border-light);
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.monitor-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan-light);
  text-shadow: 0 0 10px rgba(33, 230, 255, 0.5);
}

.monitor-title i {
  font-size: 1.5em;
}

.monitor-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-left: 44px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.refresh-control {
  display: flex;
  align-items: center;
}

/* 内容区域 */
.monitor-content {
  flex: 1;
  overflow-y: auto;
  padding-right: var(--spacing-md);
}

/* 自定义滚动条 */
.monitor-content::-webkit-scrollbar {
  width: 8px;
}

.monitor-content::-webkit-scrollbar-track {
  background: var(--color-bg);
  border-radius: 4px;
}

.monitor-content::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.3);
  border-radius: 4px;
}

.monitor-content::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.5);
}

/* 行布局 */
.monitor-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

/* 卡片 */
.monitor-card {
  background: var(--color-panel);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-base);
}

.monitor-card:hover {
  border-color: var(--neon-cyan-lighter);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2);
}

.monitor-card--full {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.card-icon {
  font-size: 1.8em;
  color: var(--neon-cyan-light);
}

.card-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 主要指标 */
.metric-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.metric-value {
  font-size: 2.5em;
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan-light);
  text-shadow: 0 0 15px rgba(33, 230, 255, 0.5);
  line-height: 1;
}

/* 详细信息 */
.metric-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-value {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

/* 磁盘列表 */
.disk-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.disk-item {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.disk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.disk-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.disk-icon {
  font-size: 1.5em;
  color: var(--neon-cyan);
}

.disk-mount {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.disk-usage {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-sm);
}

.usage-text {
  color: var(--color-text-secondary);
}

.usage-percent {
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan-light);
  min-width: 50px;
  text-align: right;
}

/* 信息列表 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.info-label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.info-value {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

/* 网络列表 */
.network-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.network-item {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.network-name {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.network-addresses {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-left: var(--spacing-xl);
}

.network-address {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.address-value {
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

/* 更新信息 */
.update-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.auto-refresh-indicator {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--neon-cyan);
  font-weight: var(--font-weight-medium);
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 加载状态 */
.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}

/* 错误状态 */
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  color: var(--color-text-secondary);
}
</style>

