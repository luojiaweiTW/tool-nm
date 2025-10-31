<template>
  <div class="port-scanner-container">
    <el-card class="tool-card">
      <template #header>
        <div class="card-header">
          <span class="i-mdi-lan-connect text-xl"></span>
          <span class="ml-2">端口扫描</span>
        </div>
      </template>

      <el-form :model="scanForm" label-width="100px" class="scan-form">
        <el-form-item label="目标地址">
          <el-input
            v-model="scanForm.target"
            placeholder="输入 IP 地址或域名，如: 192.168.1.1 或 example.com"
            clearable
          />
        </el-form-item>

        <el-form-item label="扫描模式">
          <el-radio-group v-model="scanForm.scanMode">
            <el-radio label="common">常用端口</el-radio>
            <el-radio label="range">端口范围</el-radio>
            <el-radio label="custom">自定义端口</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="scanForm.scanMode === 'range'" label="端口范围">
          <div class="flex gap-2 items-center">
            <el-input-number
              v-model="scanForm.startPort"
              :min="1"
              :max="65535"
              placeholder="起始端口"
            />
            <span>-</span>
            <el-input-number
              v-model="scanForm.endPort"
              :min="1"
              :max="65535"
              placeholder="结束端口"
            />
          </div>
        </el-form-item>

        <el-form-item v-if="scanForm.scanMode === 'custom'" label="自定义端口">
          <el-input
            v-model="scanForm.customPorts"
            type="textarea"
            :rows="3"
            placeholder="输入端口号，多个端口用逗号分隔，如: 80,443,8080,3306"
          />
        </el-form-item>

        <el-form-item label="超时时间">
          <el-slider
            v-model="scanForm.timeout"
            :min="500"
            :max="10000"
            :step="500"
            :format-tooltip="(val) => `${val}ms`"
            show-input
          />
        </el-form-item>

        <el-form-item label="并发数">
          <el-slider
            v-model="scanForm.concurrency"
            :min="1"
            :max="50"
            :step="1"
            show-input
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="isScanning"
            :disabled="!canStartScan"
            @click="startScan"
          >
            {{ isScanning ? '扫描中...' : '开始扫描' }}
          </el-button>
          <el-button v-if="isScanning" @click="stopScan">
            停止扫描
          </el-button>
          <el-button @click="clearResults" :disabled="results.length === 0">
            清空结果
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 扫描进度 -->
      <div v-if="isScanning || scanProgress.total > 0" class="progress-section">
        <el-progress
          :percentage="progressPercentage"
          :status="isScanning ? undefined : 'success'"
        >
          <span class="text-sm">
            {{ scanProgress.completed }} / {{ scanProgress.total }}
          </span>
        </el-progress>
        <div class="mt-2 text-sm text-gray-600">
          已发现 {{ openPorts.length }} 个开放端口
        </div>
      </div>

      <!-- 扫描结果 -->
      <div v-if="results.length > 0" class="results-section mt-4">
        <el-divider content-position="left">扫描结果</el-divider>
        
        <div class="result-summary mb-4">
          <el-tag type="success" size="large">
            开放: {{ openPorts.length }}
          </el-tag>
          <el-tag type="info" size="large" class="ml-2">
            关闭: {{ closedPorts.length }}
          </el-tag>
          <el-tag type="warning" size="large" class="ml-2">
            超时: {{ timeoutPorts.length }}
          </el-tag>
        </div>

        <el-tabs v-model="activeTab">
          <el-tab-pane label="开放端口" name="open">
            <el-table :data="openPorts" stripe max-height="400">
              <el-table-column prop="port" label="端口" width="100" />
              <el-table-column prop="service" label="服务" width="150" />
              <el-table-column prop="description" label="说明" />
              <el-table-column prop="responseTime" label="响应时间" width="120">
                <template #default="{ row }">
                  {{ row.responseTime }}ms
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default>
                  <el-tag type="success" size="small">开放</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="关闭端口" name="closed">
            <el-table :data="closedPorts" stripe max-height="400">
              <el-table-column prop="port" label="端口" width="100" />
              <el-table-column prop="service" label="服务" width="150" />
              <el-table-column prop="description" label="说明" />
              <el-table-column label="状态" width="100">
                <template #default>
                  <el-tag type="info" size="small">关闭</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="超时端口" name="timeout">
            <el-table :data="timeoutPorts" stripe max-height="400">
              <el-table-column prop="port" label="端口" width="100" />
              <el-table-column prop="service" label="服务" width="150" />
              <el-table-column prop="description" label="说明" />
              <el-table-column label="状态" width="100">
                <template #default>
                  <el-tag type="warning" size="small">超时</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="全部" name="all">
            <el-table :data="results" stripe max-height="400">
              <el-table-column prop="port" label="端口" width="100" />
              <el-table-column prop="service" label="服务" width="150" />
              <el-table-column prop="description" label="说明" />
              <el-table-column prop="responseTime" label="响应时间" width="120">
                <template #default="{ row }">
                  {{ row.responseTime ? `${row.responseTime}ms` : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag
                    :type="row.status === 'open' ? 'success' : row.status === 'closed' ? 'info' : 'warning'"
                    size="small"
                  >
                    {{ row.status === 'open' ? '开放' : row.status === 'closed' ? '关闭' : '超时' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <div class="export-section mt-4">
          <el-button @click="exportResults('txt')">
            导出为文本
          </el-button>
          <el-button @click="exportResults('json')">
            导出为 JSON
          </el-button>
          <el-button @click="exportResults('csv')">
            导出为 CSV
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 使用说明 -->
    <el-card class="mt-4">
      <template #header>
        <span>使用说明</span>
      </template>
      <div class="usage-tips">
        <ul>
          <li><strong>常用端口:</strong> 扫描 21,22,23,25,80,110,143,443,3306,3389,5432,6379,8080,27017 等常见服务端口</li>
          <li><strong>端口范围:</strong> 扫描指定范围内的所有端口（建议范围不要过大，避免扫描时间过长）</li>
          <li><strong>自定义端口:</strong> 手动指定要扫描的端口列表，多个端口用逗号分隔</li>
          <li><strong>超时时间:</strong> 每个端口的连接超时时间，默认 2000ms</li>
          <li><strong>并发数:</strong> 同时扫描的端口数量，提高并发可加快扫描速度，但可能被目标防火墙拦截</li>
          <li><strong>注意:</strong> 请仅扫描您有权限的服务器，未经授权的端口扫描可能违反法律法规</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 常用端口列表
const COMMON_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 1433, 3306, 3389, 5432, 5900, 6379, 8000, 8080, 8443, 27017, 27018]

// 端口服务映射
const PORT_SERVICES: Record<number, { name: string; description: string }> = {
  21: { name: 'FTP', description: '文件传输协议' },
  22: { name: 'SSH', description: '安全外壳协议' },
  23: { name: 'Telnet', description: '远程登录服务' },
  25: { name: 'SMTP', description: '简单邮件传输协议' },
  53: { name: 'DNS', description: '域名系统' },
  80: { name: 'HTTP', description: '超文本传输协议' },
  110: { name: 'POP3', description: '邮局协议版本3' },
  143: { name: 'IMAP', description: '互联网消息访问协议' },
  443: { name: 'HTTPS', description: '安全超文本传输协议' },
  465: { name: 'SMTPS', description: 'SMTP over SSL' },
  587: { name: 'SMTP', description: 'SMTP (提交)' },
  993: { name: 'IMAPS', description: 'IMAP over SSL' },
  995: { name: 'POP3S', description: 'POP3 over SSL' },
  1433: { name: 'MSSQL', description: 'Microsoft SQL Server' },
  3306: { name: 'MySQL', description: 'MySQL 数据库' },
  3389: { name: 'RDP', description: '远程桌面协议' },
  5432: { name: 'PostgreSQL', description: 'PostgreSQL 数据库' },
  5900: { name: 'VNC', description: '虚拟网络计算' },
  6379: { name: 'Redis', description: 'Redis 数据库' },
  8000: { name: 'HTTP-Alt', description: 'HTTP 备用端口' },
  8080: { name: 'HTTP-Proxy', description: 'HTTP 代理' },
  8443: { name: 'HTTPS-Alt', description: 'HTTPS 备用端口' },
  27017: { name: 'MongoDB', description: 'MongoDB 数据库' },
  27018: { name: 'MongoDB', description: 'MongoDB Shard' }
}

interface ScanForm {
  target: string
  scanMode: 'common' | 'range' | 'custom'
  startPort: number
  endPort: number
  customPorts: string
  timeout: number
  concurrency: number
}

interface ScanResult {
  port: number
  status: 'open' | 'closed' | 'timeout'
  service: string
  description: string
  responseTime?: number
}

interface ScanProgress {
  completed: number
  total: number
}

const scanForm = ref<ScanForm>({
  target: '',
  scanMode: 'common',
  startPort: 1,
  endPort: 1024,
  customPorts: '',
  timeout: 2000,
  concurrency: 10
})

const isScanning = ref(false)
const results = ref<ScanResult[]>([])
const scanProgress = ref<ScanProgress>({ completed: 0, total: 0 })
const activeTab = ref('open')
const shouldStop = ref(false)

const canStartScan = computed(() => {
  if (!scanForm.value.target.trim()) return false
  
  if (scanForm.value.scanMode === 'range') {
    return scanForm.value.startPort <= scanForm.value.endPort &&
           scanForm.value.startPort >= 1 &&
           scanForm.value.endPort <= 65535
  }
  
  if (scanForm.value.scanMode === 'custom') {
    return scanForm.value.customPorts.trim().length > 0
  }
  
  return true
})

const progressPercentage = computed(() => {
  if (scanProgress.value.total === 0) return 0
  return Math.round((scanProgress.value.completed / scanProgress.value.total) * 100)
})

const openPorts = computed(() => results.value.filter(r => r.status === 'open'))
const closedPorts = computed(() => results.value.filter(r => r.status === 'closed'))
const timeoutPorts = computed(() => results.value.filter(r => r.status === 'timeout'))

const getPortInfo = (port: number) => {
  const info = PORT_SERVICES[port]
  return {
    service: info?.name || '未知服务',
    description: info?.description || '-'
  }
}

const getPorts = (): number[] => {
  const mode = scanForm.value.scanMode
  
  if (mode === 'common') {
    return [...COMMON_PORTS]
  }
  
  if (mode === 'range') {
    const ports: number[] = []
    for (let i = scanForm.value.startPort; i <= scanForm.value.endPort; i++) {
      ports.push(i)
    }
    return ports
  }
  
  if (mode === 'custom') {
    const portsStr = scanForm.value.customPorts.split(',')
    const ports: number[] = []
    for (const portStr of portsStr) {
      const port = parseInt(portStr.trim())
      if (!isNaN(port) && port >= 1 && port <= 65535) {
        ports.push(port)
      }
    }
    return ports
  }
  
  return []
}

const scanPort = async (host: string, port: number, timeout: number): Promise<ScanResult> => {
  const startTime = Date.now()
  const { service, description } = getPortInfo(port)
  
  try {
    // 使用 Electron IPC 调用后端的端口扫描功能
    if (window.electronAPI?.network?.scanPort) {
      const result = await window.electronAPI.network.scanPort(host, port, timeout)
      const responseTime = result.responseTime || (Date.now() - startTime)
      
      return {
        port,
        status: result.open ? 'open' : 'closed',
        service,
        description,
        responseTime: result.open ? responseTime : undefined
      }
    }
    
    // 如果没有 Electron，返回模拟结果
    return {
      port,
      status: 'timeout',
      service,
      description,
      responseTime: undefined
    }
  } catch (error) {
    return {
      port,
      status: 'timeout',
      service,
      description,
      responseTime: undefined
    }
  }
}

const startScan = async () => {
  const target = scanForm.value.target.trim()
  if (!target) {
    ElMessage.warning('请输入目标地址')
    return
  }
  
  const ports = getPorts()
  if (ports.length === 0) {
    ElMessage.warning('请配置要扫描的端口')
    return
  }
  
  if (ports.length > 1000) {
    const confirmed = await new Promise((resolve) => {
      ElMessageBox.confirm(
        `即将扫描 ${ports.length} 个端口，可能需要较长时间，是否继续？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => resolve(true))
        .catch(() => resolve(false))
    })
    
    if (!confirmed) return
  }
  
  isScanning.value = true
  shouldStop.value = false
  results.value = []
  scanProgress.value = { completed: 0, total: ports.length }
  
  ElMessage.info(`开始扫描 ${target}，共 ${ports.length} 个端口`)
  
  // 分批并发扫描
  const concurrency = scanForm.value.concurrency
  for (let i = 0; i < ports.length; i += concurrency) {
    if (shouldStop.value) break
    
    const batch = ports.slice(i, i + concurrency)
    const promises = batch.map(port => scanPort(target, port, scanForm.value.timeout))
    
    const batchResults = await Promise.all(promises)
    results.value.push(...batchResults)
    scanProgress.value.completed += batchResults.length
  }
  
  isScanning.value = false
  
  if (shouldStop.value) {
    ElMessage.info('扫描已停止')
  } else {
    ElMessage.success(`扫描完成！发现 ${openPorts.value.length} 个开放端口`)
  }
}

const stopScan = () => {
  shouldStop.value = true
}

const clearResults = () => {
  results.value = []
  scanProgress.value = { completed: 0, total: 0 }
}

const exportResults = (format: 'txt' | 'json' | 'csv') => {
  if (results.value.length === 0) {
    ElMessage.warning('暂无扫描结果')
    return
  }
  
  let content = ''
  let filename = `port-scan-${scanForm.value.target}-${Date.now()}`
  
  if (format === 'txt') {
    content = `端口扫描结果\n目标: ${scanForm.value.target}\n时间: ${new Date().toLocaleString()}\n\n`
    content += `开放端口 (${openPorts.value.length}):\n`
    openPorts.value.forEach(r => {
      content += `  ${r.port} - ${r.service} (${r.description}) - ${r.responseTime}ms\n`
    })
    content += `\n关闭端口 (${closedPorts.value.length}):\n`
    closedPorts.value.forEach(r => {
      content += `  ${r.port} - ${r.service} (${r.description})\n`
    })
    filename += '.txt'
  } else if (format === 'json') {
    content = JSON.stringify({
      target: scanForm.value.target,
      scanTime: new Date().toISOString(),
      summary: {
        total: results.value.length,
        open: openPorts.value.length,
        closed: closedPorts.value.length,
        timeout: timeoutPorts.value.length
      },
      results: results.value
    }, null, 2)
    filename += '.json'
  } else if (format === 'csv') {
    content = 'Port,Status,Service,Description,Response Time(ms)\n'
    results.value.forEach(r => {
      content += `${r.port},${r.status},${r.service},"${r.description}",${r.responseTime || ''}\n`
    })
    filename += '.csv'
  }
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('导出成功')
}
</script>

<style scoped>
.port-scanner-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.tool-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.scan-form {
  margin-top: 20px;
}

.progress-section {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.results-section {
  margin-top: 20px;
}

.result-summary {
  display: flex;
  gap: 12px;
  align-items: center;
}

.export-section {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.usage-tips ul {
  list-style: none;
  padding: 0;
}

.usage-tips li {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #606266;
}

.usage-tips strong {
  color: #303133;
}
</style>
