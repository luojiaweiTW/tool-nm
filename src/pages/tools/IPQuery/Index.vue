<template>
  <div class="tool-page">
    <Header
      title="IP 查询"
      description="查询 IP 地址的地理位置、运营商、ASN、IP类型等详细信息"
      icon="i-mdi-ip-network"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleGetMyIP">
          <i class="i-mdi-map-marker" />
          查询本机IP
        </NeonButton>
        <NeonButton variant="outline" size="small" @click="handleClear">
          <i class="i-mdi-broom" />
          清空
        </NeonButton>
        <NeonButton variant="primary" size="small" @click="handleQuery" :disabled="isQuerying">
          <i class="i-mdi-magnify" :class="{ 'animate-spin': isQuerying }" />
          查询
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="ip-query-container">
        <div class="ip-query">
          <!-- 输入区 -->
          <NeonCard title="IP 地址输入" icon="i-mdi-ip" compact>
            <div class="input-section">
              <NeonTextarea
                v-model="ipInput"
                label="IP 地址"
                placeholder="输入 IP 地址，支持多个（每行一个）&#10;例如：&#10;8.8.8.8&#10;114.114.114.114&#10;1.1.1.1"
                :rows="8"
                show-count
                :maxlength="5000"
              />
              <div class="input-tips">
                <i class="i-mdi-information-outline" />
                <span>支持 IPv4 地址，每行一个 IP，最多支持 20 个</span>
              </div>
            </div>
          </NeonCard>

        <!-- 结果区 -->
        <NeonCard title="查询结果" icon="i-mdi-database-search" compact>
          <div v-if="queryResults.length === 0 && !isQuerying" class="empty-state">
            <i class="i-mdi-information-outline empty-icon" />
            <p>请输入 IP 地址后点击查询</p>
          </div>
          
          <div v-else-if="isQuerying" class="loading-state">
            <i class="i-mdi-loading animate-spin loading-icon" />
            <p>正在查询中...</p>
          </div>

          <div v-else class="results-container">
            <div
              v-for="(result, index) in queryResults"
              :key="index"
              class="result-item"
              :class="{ 'result-item--error': result.error }"
            >
              <div class="result-header">
                <div class="result-ip">
                  <i class="i-mdi-ip-network" />
                  <span class="mono">{{ result.ip }}</span>
                </div>
                <NeonButton
                  v-if="!result.error"
                  variant="text"
                  size="small"
                  @click="copyResult(result)"
                >
                  <i class="i-mdi-content-copy" />
                  复制
                </NeonButton>
              </div>

              <div v-if="result.error" class="result-error">
                <i class="i-mdi-alert-circle" />
                <span>{{ result.error }}</span>
              </div>

              <div v-else class="result-details">
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-earth" />
                    国家
                  </span>
                  <span class="detail-value">{{ result.country || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-map-marker" />
                    省份
                  </span>
                  <span class="detail-value">{{ result.province || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-city" />
                    城市
                  </span>
                  <span class="detail-value">{{ result.city || '-' }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-office-building" />
                    运营商
                  </span>
                  <span class="detail-value">{{ result.isp || '-' }}</span>
                </div>
                <div v-if="result.ipType" class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-information" />
                    IP类型
                  </span>
                  <span class="detail-value">{{ result.ipType }}</span>
                </div>
                <div v-if="result.asn" class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-network" />
                    ASN
                  </span>
                  <span class="detail-value mono">{{ result.asn }}</span>
                </div>
                <div v-if="result.asnOrg" class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-domain" />
                    ASN组织
                  </span>
                  <span class="detail-value">{{ result.asnOrg }}</span>
                </div>
                <div v-if="result.cidr" class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-ip-network-outline" />
                    CIDR
                  </span>
                  <span class="detail-value mono">{{ result.cidr }}</span>
                </div>
                <div v-if="result.latitude && result.longitude" class="detail-row">
                  <span class="detail-label">
                    <i class="i-mdi-crosshairs-gps" />
                    坐标
                  </span>
                  <span class="detail-value mono">
                    {{ result.latitude }}, {{ result.longitude }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>
        </div>

        <!-- 网络测试工具 -->
        <div class="network-test">
          <NeonCard title="网络测试" icon="i-mdi-network" compact>
            <div class="test-tabs">
              <el-tabs v-model="activeTestTab">
                <!-- Ping 测试 -->
                <el-tab-pane label="Ping 测试" name="ping">
                  <div class="test-section">
                    <div class="test-input-row">
                      <NeonInput v-model="pingTarget" label="目标IP" placeholder="输入要 Ping 的 IP 地址" style="flex: 1;" />
                      <el-select v-model="pingMode" placeholder="选择模式" style="width: 150px;">
                        <el-option label="普通Ping" value="normal" />
                        <el-option label="长Ping" value="continuous" />
                        <el-option label="路由追踪" value="traceroute" />
                      </el-select>
                      <el-input-number v-if="pingMode === 'normal'" v-model="pingCount" :min="1" :max="100" placeholder="次数" style="width: 120px;" />
                      <NeonButton variant="primary" @click="handleStartTest" :disabled="isTestRunning">
                        <i :class="isTestRunning ? 'i-mdi-loading animate-spin' : 'i-mdi-play'" />
                        {{ isTestRunning ? '测试中...' : '开始测试' }}
                      </NeonButton>
                      <NeonButton v-if="isTestRunning" variant="outline" @click="handleStopTest">
                        <i class="i-mdi-stop" />
                        停止
                      </NeonButton>
                    </div>

                    <div v-if="testOutput" class="test-output">
                      <div class="output-header">
                        <span>测试结果</span>
                        <NeonButton variant="text" size="small" @click="copyTestOutput">
                          <i class="i-mdi-content-copy" />
                          复制
                        </NeonButton>
                      </div>
                      <pre class="output-content">{{ testOutput }}</pre>
                      
                      <div v-if="testStats" class="test-stats">
                        <div class="stat-item">
                          <span class="stat-label">已发送</span>
                          <span class="stat-value">{{ testStats.sent }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">已接收</span>
                          <span class="stat-value">{{ testStats.received }}</span>
                        </div>
                        <div class="stat-item">
                          <span class="stat-label">丢失</span>
                          <span class="stat-value">{{ testStats.loss }}</span>
                        </div>
                        <div v-if="testStats.avgTime" class="stat-item">
                          <span class="stat-label">平均</span>
                          <span class="stat-value">{{ testStats.avgTime }}ms</span>
                        </div>
                        <div v-if="testStats.minTime" class="stat-item">
                          <span class="stat-label">最小</span>
                          <span class="stat-value">{{ testStats.minTime }}ms</span>
                        </div>
                        <div v-if="testStats.maxTime" class="stat-item">
                          <span class="stat-label">最大</span>
                          <span class="stat-value">{{ testStats.maxTime }}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <!-- Telnet 端口测试 -->
                <el-tab-pane label="Telnet 端口测试" name="telnet">
                  <div class="test-section">
                    <div class="test-input-row">
                      <NeonInput v-model="telnetTarget" label="目标IP" placeholder="输入 IP 地址" style="flex: 1;" />
                      <el-input-number v-model="telnetPort" :min="1" :max="65535" placeholder="端口" style="width: 120px;" />
                      <el-input-number v-model="telnetTimeout" :min="1000" :max="30000" :step="1000" placeholder="超时(ms)" style="width: 130px;" />
                      <NeonButton variant="primary" @click="handleTelnetTest" :disabled="isTestRunning">
                        <i :class="isTestRunning ? 'i-mdi-loading animate-spin' : 'i-mdi-lan-connect'" />
                        测试端口
                      </NeonButton>
                    </div>

                    <div v-if="telnetResults.length > 0" class="telnet-results">
                      <div v-for="(result, index) in telnetResults" :key="index" class="telnet-result-item">
                        <div class="telnet-header">
                          <span class="telnet-target mono">{{ result.ip }}:{{ result.port }}</span>
                          <span :class="['telnet-status', result.open ? 'status-open' : 'status-closed']">
                            <i :class="result.open ? 'i-mdi-check-circle' : 'i-mdi-close-circle'" />
                            {{ result.open ? '开放' : '关闭' }}
                          </span>
                        </div>
                        <div class="telnet-message">{{ result.message }}</div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import NeonInput from '@/components/NeonInput.vue'

// 声明 electronAPI 类型
declare global {
  interface Window {
    electronAPI?: {
      network?: {
        ping: (ip: string, options: any) => Promise<any>
        traceroute: (ip: string) => Promise<any>
        telnet: (ip: string, port: number, timeout: number) => Promise<any>
        onPingOutput: (callback: (data: any) => void) => void
        removePingOutputListener: () => void
        stopPing: () => Promise<any>
      }
    }
  }
}

interface IPResult {
  ip: string
  country?: string
  province?: string
  city?: string
  isp?: string
  latitude?: number
  longitude?: number
  ipType?: string // IP类型：数据中心、家庭宽带等
  asn?: string // ASN号码
  asnOrg?: string // ASN组织
  range?: string // IP段范围
  netmask?: string // 子网掩码
  cidr?: string // CIDR表示
  error?: string
}

const ipInput = ref('')
const isQuerying = ref(false)
const queryResults = ref<IPResult[]>([])

/**
 * 验证 IP 地址格式
 */
const isValidIP = (ip: string): boolean => {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipPattern.test(ip)) return false
  
  const parts = ip.split('.')
  return parts.every(part => {
    const num = parseInt(part, 10)
    return num >= 0 && num <= 255
  })
}

/**
 * 查询单个 IP 地址
 */
const queryIPAddress = async (ip: string): Promise<IPResult> => {
  // 尝试多个 IP 查询 API，优先使用国内准确的服务
  const apis = [
    // API 1: ip-api.com (详细信息，中文支持，数据最准确)
    {
      url: `http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query`,
      parse: (data: any) => {
        if (data.status === 'fail') {
          throw new Error(data.message || '查询失败')
        }
        console.log('ip-api.com 原始数据:', data)
        return {
          ip,
          country: data.country,
          province: data.regionName,
          city: data.city,
          isp: data.isp || data.org,
          latitude: data.lat,
          longitude: data.lon,
          asn: data.as ? data.as.split(' ')[0] : undefined,
          asnOrg: data.asname || (data.as ? data.as.substring(data.as.indexOf(' ') + 1) : undefined),
          ipType: data.mobile ? '移动网络' : data.proxy ? '代理' : data.hosting ? '数据中心' : '家庭宽带'
        }
      }
    },
    // API 2: ipinfo.io (详细信息，包括ASN、IP类型等)
    {
      url: `https://ipinfo.io/${ip}/json`,
      parse: (data: any) => {
        return {
          ip,
          country: data.country,
          province: data.region,
          city: data.city,
          isp: data.org,
          latitude: data.loc ? parseFloat(data.loc.split(',')[0]) : undefined,
          longitude: data.loc ? parseFloat(data.loc.split(',')[1]) : undefined,
          asn: data.asn?.asn,
          asnOrg: data.asn?.name || (data.org ? data.org.split(' ')[0] : undefined),
          ipType: data.privacy?.hosting ? '数据中心' : data.privacy?.vpn ? 'VPN' : data.privacy?.proxy ? '代理' : '家庭宽带',
          cidr: data.asn?.route
        }
      }
    },
    // API 3: pconline (太平洋IP数据库，国内数据准确)
    {
      url: `https://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`,
      parse: (data: any) => {
        return {
          ip,
          country: '中国',
          province: data.pro,
          city: data.city,
          isp: data.addr,
          latitude: undefined,
          longitude: undefined
        }
      }
    },
    // API 4: ip.sb (简洁准确，包含ASN信息)
    {
      url: `https://api.ip.sb/geoip/${ip}`,
      parse: (data: any) => {
        return {
          ip,
          country: data.country,
          province: data.region,
          city: data.city,
          isp: data.isp || data.organization,
          latitude: data.latitude,
          longitude: data.longitude,
          asn: data.asn ? `AS${data.asn}` : undefined,
          asnOrg: data.organization
        }
      }
    }
  ]

  // 尝试每个 API
  for (const api of apis) {
    try {
      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        continue
      }

      const text = await response.text()
      
      // 处理 JSONP 格式 (pconline返回的是JSONP)
      let jsonText = text
      if (text.includes('(') && text.includes(')')) {
        // 提取 JSONP 中的 JSON 部分
        const match = text.match(/\((.+)\)/)
        if (match) {
          jsonText = match[1]
        }
      }
      
      const data = JSON.parse(jsonText)
      console.log(`API ${api.url} 返回数据:`, data)
      const result = api.parse(data)
      console.log(`API ${api.url} 解析结果:`, result)
      
      // 验证结果是否有效
      if (result.province || result.city || result.country) {
        console.log(`使用 API: ${api.url}`)
        return result
      }
    } catch (error) {
      console.warn(`API ${api.url} 查询失败:`, error)
      continue
    }
  }

  // 所有 API 都失败
  return {
    ip,
    error: '查询失败，所有 API 都无法访问'
  }
}

/**
 * 查询本机 IP
 */
const handleGetMyIP = async () => {
  try {
    isQuerying.value = true
    queryResults.value = []
    
    let myIP = ''
    
    // 尝试多个 API 获取本机公网 IP
    const apis = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://ipapi.co/json/'
    ]
    
    for (const api of apis) {
      try {
        const response = await fetch(api, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        
        if (response.ok) {
          const data = await response.json()
          myIP = data.ip || data.query
          if (myIP) break
        }
      } catch (err) {
        console.warn(`API ${api} 失败:`, err)
        continue
      }
    }
    
    if (!myIP) {
      throw new Error('所有 API 都无法获取 IP')
    }
    
    ipInput.value = myIP
    ElMessage.success(`已获取本机 IP: ${myIP}`)
    
    // 自动查询
    await handleQuery()
  } catch (error) {
    console.error('获取本机 IP 失败:', error)
    ElMessage.error('获取本机 IP 失败，请手动输入 IP 地址')
    isQuerying.value = false
  }
}

/**
 * 执行查询
 */
const handleQuery = async () => {
  if (!ipInput.value.trim()) {
    ElMessage.warning('请输入 IP 地址')
    return
  }

  // 解析输入的 IP 地址
  const ips = ipInput.value
    .split('\n')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)
    .slice(0, 20) // 最多 20 个

  // 验证 IP 格式
  const invalidIPs = ips.filter(ip => !isValidIP(ip))
  if (invalidIPs.length > 0) {
    ElMessage.error(`以下 IP 地址格式不正确: ${invalidIPs.join(', ')}`)
    return
  }

  isQuerying.value = true
  queryResults.value = []

  try {
    // 并发查询所有 IP（但有速率限制的话可能需要串行）
    const results = await Promise.all(
      ips.map(ip => queryIPAddress(ip))
    )
    
    queryResults.value = results
    
    const successCount = results.filter(r => !r.error).length
    const failCount = results.length - successCount
    
    if (failCount === 0) {
      ElMessage.success(`查询完成，共 ${successCount} 个`)
    } else {
      ElMessage.warning(`查询完成，成功 ${successCount} 个，失败 ${failCount} 个`)
    }
  } catch (error) {
    console.error('批量查询失败:', error)
    ElMessage.error('批量查询失败')
  } finally {
    isQuerying.value = false
  }
}

/**
 * 清空
 */
const handleClear = () => {
  ipInput.value = ''
  queryResults.value = []
  ElMessage.success('已清空')
}

/**
 * 复制结果
 */
const copyResult = (result: IPResult) => {
  const parts = [
    `IP地址: ${result.ip}`,
    `国家: ${result.country || '-'}`,
    `省份: ${result.province || '-'}`,
    `城市: ${result.city || '-'}`,
    `运营商: ${result.isp || '-'}`
  ]
  
  if (result.ipType) {
    parts.push(`IP类型: ${result.ipType}`)
  }
  if (result.asn) {
    parts.push(`ASN: ${result.asn}`)
  }
  if (result.asnOrg) {
    parts.push(`ASN组织: ${result.asnOrg}`)
  }
  if (result.cidr) {
    parts.push(`CIDR: ${result.cidr}`)
  }
  if (result.latitude && result.longitude) {
    parts.push(`坐标: ${result.latitude}, ${result.longitude}`)
  }
  
  const text = parts.join('\n')

  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// ========== 网络测试功能 ==========
const activeTestTab = ref('ping')
const isTestRunning = ref(false)

// Ping 相关
const pingTarget = ref('')
const pingMode = ref('normal')
const pingCount = ref(4)
const testOutput = ref('')
const testStats = ref<any>(null)

// Telnet 相关
const telnetTarget = ref('')
const telnetPort = ref(80)
const telnetTimeout = ref(5000)
const telnetResults = ref<any[]>([])

/**
 * 开始网络测试
 */
const handleStartTest = async () => {
  // 防止重复点击：如果已经在运行，直接返回
  if (isTestRunning.value) {
    console.log('⚠️ 测试正在进行中，忽略重复点击')
    return
  }

  console.log('开始测试，目标IP:', pingTarget.value)
  console.log('测试模式:', pingMode.value)
  
  if (!pingTarget.value.trim()) {
    ElMessage.warning('请输入目标IP地址')
    return
  }

  if (!isValidIP(pingTarget.value.trim())) {
    ElMessage.error('IP地址格式不正确')
    return
  }

  // 检查是否在 Electron 环境中
  if (!window.electronAPI?.network) {
    ElMessage.error('网络测试功能仅在 Electron 应用中可用，请重启应用')
    console.error('Electron API 不可用')
    return
  }

  // 清理旧的监听器，防止累积
  console.log('🧹 清理旧的 Ping 监听器')
  window.electronAPI.network.removePingOutputListener()

  // 立即设置运行状态，防止重复点击
  isTestRunning.value = true
  testOutput.value = ''
  testStats.value = null

  try {
    if (pingMode.value === 'traceroute') {
      // 路由追踪
      await handleTraceroute()
    } else if (pingMode.value === 'continuous') {
      // 长Ping
      await handleContinuousPing()
    } else {
      // 普通Ping
      await handleNormalPing()
    }
  } catch (error: any) {
    console.error('测试失败:', error)
    ElMessage.error(error.message || '测试失败')
    isTestRunning.value = false
  }
}

/**
 * 普通Ping（实时输出版）
 */
const handleNormalPing = async () => {
  console.log('执行普通Ping...')
  
  if (!window.electronAPI?.network) {
    ElMessage.error('Electron API 不可用')
    isTestRunning.value = false
    return
  }

  // 清空之前的输出
  testOutput.value = ''
  testStats.value = null

  // 监听实时输出
  window.electronAPI.network.onPingOutput((data: any) => {
    if (data.type === 'data') {
      testOutput.value += data.data
      // 自动滚动到底部
      setTimeout(() => {
        const outputEl = document.querySelector('.output-content')
        if (outputEl) {
          outputEl.scrollTop = outputEl.scrollHeight
        }
      }, 10)
    } else if (data.type === 'error') {
      testOutput.value += `错误: ${data.data}\n`
    } else if (data.type === 'complete') {
      // 收到完成信号，设置统计信息
      testStats.value = data.stats
      isTestRunning.value = false
      ElMessage.success('Ping 完成')
      // 清理监听器
      window.electronAPI.network.removePingOutputListener()
    } else if (data.type === 'cancelled') {
      // 测试被取消
      testOutput.value += '\n\n===== 测试已被用户中断 =====\n'
      isTestRunning.value = false
      ElMessage.info('测试已停止')
      // 清理监听器
      window.electronAPI.network.removePingOutputListener()
    }
  })

  console.log('调用 network.ping, 参数:', {
    ip: pingTarget.value.trim(),
    count: pingCount.value,
    continuous: false,
    timeout: 5000
  })

  const result = await window.electronAPI.network.ping(pingTarget.value.trim(), {
    count: pingCount.value,
    continuous: false,
    timeout: 5000
  })

  console.log('Ping 结果:', result)

  // 如果没有通过实时输出设置状态，这里设置
  if (isTestRunning.value) {
    isTestRunning.value = false
    if (result.success) {
      if (!testOutput.value) {
        testOutput.value = result.output
      }
      if (!testStats.value) {
        testStats.value = result.stats
      }
      ElMessage.success('Ping 完成')
    } else {
      testOutput.value = result.error
      ElMessage.error('Ping 失败')
    }
  }
}

/**
 * 连续Ping
 */
const handleContinuousPing = async () => {
  if (!window.electronAPI?.network) {
    ElMessage.error('Electron API 不可用')
    isTestRunning.value = false
    return
  }

  // 监听连续ping输出
  window.electronAPI.network.onPingOutput((data: any) => {
    if (data.type === 'data') {
      testOutput.value += data.data
      // 自动滚动到底部
      setTimeout(() => {
        const outputEl = document.querySelector('.output-content')
        if (outputEl) {
          outputEl.scrollTop = outputEl.scrollHeight
        }
      }, 10)
    } else if (data.type === 'error') {
      testOutput.value += `错误: ${data.data}\n`
    } else if (data.type === 'close' || data.type === 'cancelled') {
      isTestRunning.value = false
      ElMessage.info('Ping 已停止')
      // 清理监听器
      window.electronAPI.network.removePingOutputListener()
    }
  })

  const result = await window.electronAPI.network.ping(pingTarget.value.trim(), {
    continuous: true,
    timeout: 5000
  })

  if (result.success) {
    ElMessage.success('连续Ping已启动，点击"停止"按钮结束')
  } else {
    ElMessage.error(result.message || '启动失败')
    isTestRunning.value = false
    // 启动失败时清理监听器
    window.electronAPI.network.removePingOutputListener()
  }
}

/**
 * 停止测试
 */
const handleStopTest = async () => {
  if (!window.electronAPI?.network) {
    return
  }

  console.log('⏹️ 用户请求停止测试')
  
  try {
    const result = await window.electronAPI.network.stopPing()
    
    if (result.success) {
      console.log('✅ 停止成功:', result.message)
      testOutput.value += '\n\n===== 测试已停止 =====\n'
    } else {
      console.log('⚠️ 停止失败:', result.message)
      testOutput.value += '\n\n===== 尝试停止测试 =====\n'
    }
  } catch (error) {
    console.error('停止测试出错:', error)
  } finally {
    // 无论如何都要停止测试状态
    isTestRunning.value = false
    ElMessage.info('已停止测试')
    
    // 清理监听器，防止累积
    console.log('🧹 清理 Ping 输出监听器')
    window.electronAPI.network.removePingOutputListener()
  }
}

/**
 * 路由追踪（实时输出版）
 */
const handleTraceroute = async () => {
  if (!window.electronAPI?.network) {
    ElMessage.error('Electron API 不可用')
    isTestRunning.value = false
    return
  }

  // 清空之前的输出
  testOutput.value = ''

  // 监听实时输出
  window.electronAPI.network.onPingOutput((data: any) => {
    if (data.type === 'data') {
      testOutput.value += data.data
      // 自动滚动到底部
      setTimeout(() => {
        const outputEl = document.querySelector('.output-content')
        if (outputEl) {
          outputEl.scrollTop = outputEl.scrollHeight
        }
      }, 10)
    } else if (data.type === 'error') {
      testOutput.value += `错误: ${data.data}\n`
    } else if (data.type === 'complete') {
      isTestRunning.value = false
      ElMessage.success('路由追踪完成')
      // 清理监听器
      window.electronAPI.network.removePingOutputListener()
    } else if (data.type === 'cancelled') {
      testOutput.value += '\n\n===== 测试已被用户中断 =====\n'
      isTestRunning.value = false
      ElMessage.info('测试已停止')
      // 清理监听器
      window.electronAPI.network.removePingOutputListener()
    }
  })

  const result = await window.electronAPI.network.traceroute(pingTarget.value.trim())

  // 如果没有通过实时输出设置状态，这里设置
  if (isTestRunning.value) {
    isTestRunning.value = false
    if (result.success) {
      if (!testOutput.value) {
        testOutput.value = result.output
      }
      ElMessage.success('路由追踪完成')
    } else {
      testOutput.value = result.error
      ElMessage.error('路由追踪失败')
    }
  }
}

/**
 * Telnet 端口测试
 */
const handleTelnetTest = async () => {
  if (!telnetTarget.value.trim()) {
    ElMessage.warning('请输入目标IP地址')
    return
  }

  if (!isValidIP(telnetTarget.value.trim())) {
    ElMessage.error('IP地址格式不正确')
    return
  }

  if (!window.electronAPI?.network) {
    ElMessage.error('Electron API 不可用')
    return
  }

  isTestRunning.value = true

  try {
    const result = await window.electronAPI.network.telnet(
      telnetTarget.value.trim(),
      telnetPort.value,
      telnetTimeout.value
    )

    if (result.success) {
      telnetResults.value.unshift({
        ip: telnetTarget.value.trim(),
        port: telnetPort.value,
        open: result.open,
        message: result.message,
        responseTime: result.responseTime
      })
    } else {
      ElMessage.error(result.error || '测试失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '测试失败')
  } finally {
    isTestRunning.value = false
  }
}

/**
 * 复制测试输出
 */
const copyTestOutput = () => {
  navigator.clipboard.writeText(testOutput.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 组件卸载时清理
onUnmounted(() => {
  console.log('🔄 组件卸载，清理资源')
  
  // 停止正在运行的测试
  if (isTestRunning.value) {
    console.log('停止正在运行的测试')
    handleStopTest()
  }
  
  // 清理事件监听器，防止内存泄漏
  if (window.electronAPI?.network?.removePingOutputListener) {
    console.log('清理 Ping 输出监听器')
    window.electronAPI.network.removePingOutputListener()
  }
})
</script>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tool-page__content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-xl);
}

/* 🎨 霓虹风格滚动条 */
.tool-page__content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tool-page__content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.tool-page__content::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.tool-page__content::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.ip-query {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.input-tips {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(155, 92, 255, 0.1);
  border: 1px solid rgba(155, 92, 255, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.input-tips i {
  color: var(--neon-purple);
}

.empty-state,
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--color-muted);
}

.empty-icon,
.loading-icon {
  font-size: 3em;
  margin-bottom: var(--spacing-md);
  color: var(--neon-purple);
}

.results-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.result-item {
  padding: var(--spacing-lg);
  background-color: rgba(10, 14, 39, 0.4);
  border: 2px solid var(--neon-purple);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 15px rgba(155, 92, 255, 0.1), var(--glow-purple);
  transition: all var(--transition-base) var(--transition-timing);
}

.result-item:hover {
  border-color: var(--neon-purple-light);
  box-shadow: inset 0 0 20px rgba(155, 92, 255, 0.2), var(--glow-purple-strong);
}

.result-item--error {
  border-color: var(--color-error);
  box-shadow: inset 0 0 15px rgba(255, 92, 92, 0.1);
}

.result-item--error:hover {
  border-color: var(--color-error);
  box-shadow: inset 0 0 20px rgba(255, 92, 92, 0.2);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.result-ip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--neon-purple);
}

.result-ip i {
  font-size: 1.2em;
}

.result-error {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(255, 92, 92, 0.1);
  border-radius: var(--radius-sm);
  color: var(--color-error);
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: rgba(155, 92, 255, 0.05);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.detail-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-muted);
  font-weight: var(--font-weight-medium);
}

.detail-label i {
  color: var(--neon-purple);
}

.detail-value {
  color: var(--neon-purple);
  font-weight: var(--font-weight-medium);
}

.mono {
  font-family: var(--font-family-mono);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 网络测试 */
.ip-query-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  max-width: 1600px;
}

.network-test {
  width: 100%;
}

.test-tabs {
  width: 100%;
}

.test-section {
  padding: var(--spacing-md) 0;
}

.test-input-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
  margin-bottom: var(--spacing-lg);
}

.test-output {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background-color: rgba(10, 14, 39, 0.6);
  border: 2px solid var(--neon-purple);
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 15px rgba(155, 92, 255, 0.1);
}

.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  font-weight: var(--font-weight-bold);
  color: var(--neon-purple);
}

.output-content {
  background-color: rgba(0, 0, 0, 0.4);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  color: var(--color-text);
  height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.test-stats {
  display: flex;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: rgba(155, 92, 255, 0.05);
  border-radius: var(--radius-sm);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 80px;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--neon-purple);
  font-family: var(--font-family-mono);
}

.telnet-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.telnet-result-item {
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.telnet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.telnet-target {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--neon-purple);
}

.telnet-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.status-open {
  color: #52c41a;
  background-color: rgba(82, 196, 26, 0.1);
}

.status-closed {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.1);
}

.telnet-message {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

@media (max-width: 1024px) {
  .ip-query {
    grid-template-columns: 1fr;
  }
  
  .test-input-row {
    flex-wrap: wrap;
  }
}
</style>
