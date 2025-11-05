<template>
  <div class="tool-page redis-page">
    <!-- 顶部工具栏 -->
    <div class="redis-toolbar">
      <div class="redis-toolbar__left">
        <div class="redis-toolbar__status">
          <i :class="redisConnected ? 'i-mdi-database-check' : 'i-mdi-database-off'" 
             :style="{ color: redisConnected ? 'var(--neon-lime)' : 'var(--color-muted)' }" />
          <span>{{ redisConnected ? `已连接: ${currentConnection?.name || currentConnection?.host + ':' + currentConnection?.port}` : '未连接Redis' }}</span>
        </div>
      </div>
      
      <div class="redis-toolbar__right">
        <el-button
          v-if="!redisConnected"
          type="primary"
          size="default"
          @click="showConfigDialog = true"
        >
          <i class="i-mdi-plus" /> 新建连接
        </el-button>
        
        <el-button
          size="default"
          @click="showConnectionManager = true"
        >
          <i class="i-mdi-connection" /> 连接管理
          <el-badge :value="redisConnections.length" :max="99" v-if="redisConnections.length > 0" />
        </el-button>
        
        <el-button
          v-if="redisConnected"
          type="success"
          size="default"
          @click="refreshKeys"
        >
          <i class="i-mdi-refresh" /> 刷新
        </el-button>
        
        <el-button
          v-if="redisConnected"
          type="danger"
          size="default"
          @click="disconnectRedis"
        >
          <i class="i-mdi-database-remove" /> 断开
        </el-button>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="tool-content redis-content">
      <!-- 左侧：数据库选择、键列表 -->
      <div class="redis-sidebar">
        <!-- 数据库选择 -->
        <div class="sidebar-section" v-if="redisConnected">
          <div class="sidebar-section__header">
            <i class="i-mdi-database-outline" />
            <span>数据库</span>
          </div>
          
          <el-select
            v-model="selectedDb"
            placeholder="选择数据库"
            size="large"
            @change="handleDbChange"
            v-loading="redisLoading"
          >
            <el-option
              v-for="db in databases"
              :key="db.index"
              :label="`DB${db.index} (${db.keys} keys)`"
              :value="db.index"
            />
          </el-select>
        </div>

        <!-- 键搜索 -->
        <div class="sidebar-section" v-if="redisConnected">
          <div class="sidebar-section__header">
            <i class="i-mdi-key" />
            <span>键 ({{ filteredKeys.length }}/{{ keys.length }})</span>
          </div>
          
          <el-input
            v-model="keySearchKeyword"
            placeholder="搜索键名..."
            size="small"
            clearable
            class="key-search"
          >
            <template #prefix>
              <i class="i-mdi-magnify" />
            </template>
          </el-input>
          
          <div class="key-list">
            <div
              v-for="key in filteredKeys"
              :key="key"
              :class="['key-item', { 'key-item--active': selectedKey === key }]"
              @click="handleKeyClick(key)"
            >
              <div class="key-item__main">
                <i class="i-mdi-key-variant" />
                <span>{{ key }}</span>
              </div>
              <div class="key-item__actions">
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click.stop="deleteKey(key)"
                  title="删除键"
                >
                  <i class="i-mdi-delete" />
                </el-button>
              </div>
            </div>
            
            <div v-if="filteredKeys.length === 0 && keys.length > 0" class="empty-hint">
              <i class="i-mdi-information-outline" />
              <span>未找到匹配的键</span>
            </div>
            
            <div v-if="keys.length === 0" class="empty-hint">
              <i class="i-mdi-information-outline" />
              <span>暂无数据</span>
            </div>
            
            <div v-if="hasMoreKeys" class="more-keys-hint">
              <i class="i-mdi-alert-circle-outline" />
              <span>只显示前 100 个键，使用搜索查找更多</span>
            </div>
          </div>
        </div>

        <!-- 命令历史 -->
        <div class="sidebar-section" v-if="commandHistory.length > 0">
          <div class="sidebar-section__header">
            <i class="i-mdi-history" />
            <span>命令历史</span>
            <el-button
              size="small"
              text
              @click="clearCommandHistory"
            >
              清空
            </el-button>
          </div>
          
          <div class="history-list">
            <div
              v-for="(cmd, index) in commandHistory"
              :key="index"
              class="history-item"
              @click="selectHistoryCommand(cmd)"
            >
              <i class="i-mdi-console" />
              <span>{{ cmd }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：命令执行和结果 -->
      <div class="redis-main">
        <!-- 键值显示 -->
        <div class="value-section" v-if="redisConnected && selectedKey">
          <div class="value-header">
            <div class="value-title">
              <i class="i-mdi-key-variant" />
              <span>{{ selectedKey }}</span>
              <el-tag :type="getKeyTypeColor(keyType)" size="small">{{ keyType }}</el-tag>
            </div>
            <div class="value-actions">
              <el-button size="small" @click="refreshKeyValue">
                <i class="i-mdi-refresh" /> 刷新
              </el-button>
              <el-button size="small" type="danger" @click="deleteKey(selectedKey)">
                <i class="i-mdi-delete" /> 删除
              </el-button>
            </div>
          </div>
          
          <div class="value-content">
            <el-input
              v-model="keyValue"
              type="textarea"
              :rows="10"
              placeholder="键值内容"
              class="value-textarea"
            />
            
            <div class="value-footer">
              <el-button type="primary" @click="updateKeyValue" :loading="redisLoading">
                <i class="i-mdi-content-save" /> 保存
              </el-button>
            </div>
          </div>
        </div>

        <!-- 命令执行区 -->
        <div class="command-section">
          <div class="command-header">
            <div class="command-title">
              <i class="i-mdi-console" />
              Redis 命令
            </div>
          </div>
          
          <!-- 内置快捷命令 -->
          <div class="quick-commands" v-if="redisConnected">
            <div class="quick-commands__header">
              <i class="i-mdi-flash" />
              <span>快捷诊断</span>
            </div>
            <div class="quick-commands__grid">
              <el-button
                v-for="cmd in quickCommands"
                :key="cmd.command"
                size="small"
                @click="executeQuickCommand(cmd.command)"
                :loading="redisLoading"
              >
                <i :class="cmd.icon" />
                {{ cmd.label }}
              </el-button>
            </div>
          </div>
          
          <el-input
            v-model="commandInput"
            placeholder="输入 Redis 命令 (例如: GET key, SET key value, KEYS *)"
            class="command-input"
            @keydown.enter="executeCommand"
          >
            <template #append>
              <el-button
                @click="executeCommand"
                :loading="redisLoading"
                :disabled="!redisConnected || !commandInput.trim()"
              >
                <i class="i-mdi-play-circle" /> 执行
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 命令结果 -->
        <div class="result-section" v-if="commandResult !== null">
          <div class="result-header">
            <div class="result-info">
              <i class="i-mdi-check-circle" />
              <span>执行结果</span>
            </div>
            <div class="result-actions">
              <el-button size="small" @click="clearCommandResult">
                <i class="i-mdi-close" /> 清空
              </el-button>
            </div>
          </div>
          
          <div class="result-content">
            <pre class="result-text">{{ formatResult(commandResult) }}</pre>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-state">
          <i class="i-mdi-console" />
          <h3>开始操作</h3>
          <p>连接 Redis 后，可以执行命令或查看键值</p>
        </div>
      </div>
    </div>

    <!-- Redis 连接配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      title="Redis 连接配置"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="redisForm" label-width="120px">
        <el-form-item label="连接名称">
          <el-input v-model="redisForm.name" placeholder="给连接起个名字" />
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="主机地址" required>
              <el-input v-model="redisForm.host" placeholder="127.0.0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="端口" required>
              <el-input-number 
                v-model="redisForm.port" 
                :min="1" 
                :max="65535" 
                :controls-position="'right'"
                :step="1"
                placeholder="6379"
                class="port-input"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="密码">
          <el-input v-model="redisForm.password" type="password" show-password placeholder="可选" />
        </el-form-item>
        
        <el-form-item label="用户名">
          <el-input v-model="redisForm.username" placeholder="Redis 6+ ACL 用户名（可选）" />
        </el-form-item>
        
        <el-form-item label="分隔符">
          <el-input v-model="redisForm.separator" placeholder="默认为 :" />
        </el-form-item>
        
        <el-form-item label="连接选项">
          <el-checkbox v-model="redisForm.ssl">SSL</el-checkbox>
          <el-checkbox v-model="redisForm.sentinel">Sentinel</el-checkbox>
          <el-checkbox v-model="redisForm.cluster">Cluster</el-checkbox>
          <el-checkbox v-model="redisForm.readonly">只读模式</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button @click="showConfigDialog = false">取消</el-button>
          <div style="display: flex; gap: 10px;">
            <el-button @click="saveConnectionOnly">
              <i class="i-mdi-content-save" /> 仅保存
            </el-button>
            <el-button type="primary" @click="connectRedis" :loading="redisLoading">
              <i class="i-mdi-connection" /> 保存并连接
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 连接管理对话框 -->
    <el-dialog
      v-model="showConnectionManager"
      title="Redis 连接管理"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="connection-manager">
        <div
          v-for="(conn, index) in redisConnections"
          :key="index"
          class="connection-item"
        >
          <div class="connection-item__icon">
            <i class="i-mdi-database" />
          </div>
          <div class="connection-item__info">
            <div class="connection-item__name">{{ conn.name || `${conn.host}:${conn.port}` }}</div>
            <div class="connection-item__details">
              {{ conn.host }}:{{ conn.port }}
              <span v-if="conn.username">| {{ conn.username }}</span>
            </div>
          </div>
          <div class="connection-item__actions">
            <el-button
              size="small"
              type="primary"
              @click="connectToSavedConnection(conn)"
            >
              连接
            </el-button>
            <el-button
              size="small"
              @click="editConnection(conn)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteConnection(index)"
            >
              删除
            </el-button>
          </div>
        </div>
        
        <div v-if="redisConnections.length === 0" class="empty-connections">
          <i class="i-mdi-database-off" />
          <p>暂无保存的连接</p>
          <el-button type="primary" @click="showConfigDialog = true; showConnectionManager = false">
            新建连接
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface RedisConfig {
  name?: string
  host: string
  port: number
  password?: string
  username?: string
  separator?: string
  ssl?: boolean
  sentinel?: boolean
  cluster?: boolean
  readonly?: boolean
}

interface RedisDb {
  index: number
  keys: number
}

// ============ 状态管理 ============
const redisConnected = ref(false)
const redisLoading = ref(false)
const showConfigDialog = ref(false)
const showConnectionManager = ref(false)

// 连接管理
const redisConnections = ref<RedisConfig[]>([])
const currentConnection = ref<RedisConfig | null>(null)
const redisForm = ref<RedisConfig>({
  host: '127.0.0.1',
  port: 6379,
  password: '',
  username: '',
  separator: ':',
  ssl: false,
  sentinel: false,
  cluster: false,
  readonly: false,
})

// 数据库和键
const databases = ref<RedisDb[]>([])
const selectedDb = ref(0)
const keys = ref<string[]>([])
const hasMoreKeys = ref(false)
const selectedKey = ref('')
const keySearchKeyword = ref('')
const keyType = ref('')
const keyValue = ref('')

// 命令执行
const commandInput = ref('')
const commandResult = ref<any>(null)
const commandHistory = ref<string[]>([])

// 快捷命令配置
const quickCommands = [
  { label: '服务器信息', command: 'INFO server', icon: 'i-mdi-server' },
  { label: '客户端连接', command: 'INFO clients', icon: 'i-mdi-account-multiple' },
  { label: '内存使用', command: 'INFO memory', icon: 'i-mdi-memory' },
  { label: '统计信息', command: 'INFO stats', icon: 'i-mdi-chart-line' },
  { label: '主从复制', command: 'INFO replication', icon: 'i-mdi-source-branch' },
  { label: 'CPU使用', command: 'INFO cpu', icon: 'i-mdi-chip' },
  { label: '键空间统计', command: 'INFO keyspace', icon: 'i-mdi-database' },
  { label: '数据库大小', command: 'DBSIZE', icon: 'i-mdi-counter' },
  { label: '连接列表', command: 'CLIENT LIST', icon: 'i-mdi-format-list-bulleted' },
  { label: '内存统计', command: 'MEMORY STATS', icon: 'i-mdi-chart-box' },
  { label: '慢查询日志', command: 'SLOWLOG GET 10', icon: 'i-mdi-clock-alert' },
  { label: '服务器配置', command: 'CONFIG GET *', icon: 'i-mdi-cog' },
]

// 过滤后的键列表
const filteredKeys = computed(() => {
  if (!keySearchKeyword.value.trim()) {
    return keys.value
  }
  const keyword = keySearchKeyword.value.toLowerCase()
  return keys.value.filter(key => 
    key.toLowerCase().includes(keyword)
  )
})

// ============ 连接管理 ============

// 保存配置（内部函数）
async function saveConfig() {
  console.log('🔵 [Redis] 当前表单数据:', redisForm.value)
  
  if (!redisForm.value.host) {
    ElMessage.warning('请填写主机地址')
    return false
  }
  
  const config = { ...redisForm.value }
  console.log('🔵 [Redis] 配置对象:', config)
  
  const existingIndex = redisConnections.value.findIndex(
    c => c.host === config.host && c.port === config.port
  )
  
  console.log('🔵 [Redis] 现有连接索引:', existingIndex)
  
  if (existingIndex >= 0) {
    redisConnections.value[existingIndex] = config
    console.log('✅ [Redis] 连接配置已更新')
  } else {
    redisConnections.value.unshift(config)
    console.log('✅ [Redis] 连接配置已保存')
  }
  
  console.log('🔵 [Redis] 当前连接列表:', redisConnections.value)
  console.log('🔵 [Redis] 开始调用 saveConnectionsToStorage...')
  await saveConnectionsToStorage()
  console.log('✅ [Redis] saveConnectionsToStorage 完成')
  
  return true
}

async function saveConnectionOnly() {
  console.log('🔵 [Redis] 点击仅保存按钮')
  
  const success = await saveConfig()
  if (success) {
    ElMessage.success('连接配置已保存')
    showConfigDialog.value = false
    console.log('✅ [Redis] 对话框已关闭')
  }
}

async function connectRedis() {
  console.log('🔵 [Redis] 点击保存并连接按钮')
  
  const success = await saveConfig()
  if (!success) {
    return
  }
  
  showConfigDialog.value = false
  
  // 检查 Electron API
  if (!window.electron || !(window.electron as any).invoke) {
    ElMessage.error('该功能仅在Electron版本中可用')
    return
  }
  
  redisLoading.value = true
  
  try {
    // 将响应式对象转换为普通对象
    const config = JSON.parse(JSON.stringify(redisForm.value))
    
    // 调用 Electron 主进程连接 Redis
    const result = await (window.electron as any).invoke('redis:connect', config)
    
    if (result.success) {
      redisConnected.value = true
      currentConnection.value = redisForm.value
      
      ElMessage.success(`连接成功！Redis ${result.data.version}`)
      console.log('✅ [Redis] 连接成功:', result.data)
      
      // 加载数据库列表
      await loadDatabases()
      
      // 加载当前数据库的键
      await loadKeys()
    } else {
      ElMessage.error(`连接失败: ${result.error}`)
      console.error('❌ [Redis] 连接失败:', result.error)
    }
  } catch (error: any) {
    console.error('❌ [Redis] 连接异常:', error)
    ElMessage.error(`连接异常: ${error.message}`)
  } finally {
    redisLoading.value = false
  }
}

async function disconnectRedis() {
  if (window.electron && (window.electron as any).invoke) {
    try {
      await (window.electron as any).invoke('redis:disconnect')
      console.log('✅ [Redis] 已断开连接')
    } catch (error: any) {
      console.error('❌ [Redis] 断开连接异常:', error)
    }
  }
  
  redisConnected.value = false
  currentConnection.value = null
  databases.value = []
  keys.value = []
  selectedKey.value = ''
  commandResult.value = null
  keyValue.value = ''
  keyType.value = ''
  ElMessage.success('已断开 Redis 连接')
}

async function connectToSavedConnection(conn: RedisConfig) {
  redisForm.value = { ...conn }
  showConnectionManager.value = false
  await connectRedis()
}

function editConnection(conn: RedisConfig) {
  redisForm.value = { ...conn }
  showConnectionManager.value = false
  showConfigDialog.value = true
}

function deleteConnection(index: number) {
  ElMessageBox.confirm('确定要删除这个连接吗？', '确认删除', {
    type: 'warning',
  }).then(async () => {
    redisConnections.value.splice(index, 1)
    await saveConnectionsToStorage()
    ElMessage.success('连接已删除')
  }).catch(() => {})
}

// ============ 数据存储 ============

async function saveConnectionsToStorage() {
  console.log('💾 [Redis] 开始保存配置...')
  
  try {
    if (window.electronAPI) {
      const data = {
        connections: redisConnections.value,
        commandHistory: commandHistory.value,
      }
      const result = await window.electronAPI.writeFile(
        'redis-config.json',
        JSON.stringify(data, null, 2)
      )
      if (result.success) {
        console.log('✅ [Redis] Redis配置已保存到文件')
      }
    } else {
      localStorage.setItem('redis-connections', JSON.stringify(redisConnections.value))
      localStorage.setItem('redis-command-history', JSON.stringify(commandHistory.value))
    }
  } catch (error) {
    console.error('❌ [Redis] 保存配置失败:', error)
  }
}

async function loadConnectionsFromStorage() {
  console.log('🔵 [Redis] 开始加载配置...')
  
  try {
    if (window.electronAPI) {
      const fileExists = await window.electronAPI.fileExists('redis-config.json')
      if (fileExists) {
        const result = await window.electronAPI.readFile('redis-config.json')
        if (result.success) {
          const data = JSON.parse(result.data)
          redisConnections.value = data.connections || []
          commandHistory.value = data.commandHistory || []
          console.log('✅ [Redis] 已从文件加载配置')
          return
        }
      }
    }
    
    const storedConnections = localStorage.getItem('redis-connections')
    const storedHistory = localStorage.getItem('redis-command-history')
    
    if (storedConnections) {
      redisConnections.value = JSON.parse(storedConnections)
    }
    if (storedHistory) {
      commandHistory.value = JSON.parse(storedHistory)
    }
  } catch (error) {
    console.error('❌ [Redis] 加载配置失败:', error)
  }
}

// ============ 数据库和键管理 ============

async function loadDatabases() {
  if (!window.electron || !(window.electron as any).invoke) {
    return
  }
  
  try {
    redisLoading.value = true
    const result = await (window.electron as any).invoke('redis:getDatabases')
    
    if (result.success) {
      databases.value = result.data
      console.log('✅ [Redis] 数据库列表加载成功:', result.data.length, '个')
    } else {
      console.error('❌ [Redis] 数据库列表加载失败:', result.error)
    }
  } catch (error: any) {
    console.error('❌ [Redis] 数据库列表加载异常:', error)
  } finally {
    redisLoading.value = false
  }
}

async function loadKeys() {
  if (!window.electron || !(window.electron as any).invoke) {
    return
  }
  
  try {
    redisLoading.value = true
    // 限制加载 100 个键
    const result = await (window.electron as any).invoke('redis:getKeys', '*', 100)
    
    if (result.success) {
      keys.value = result.data
      hasMoreKeys.value = result.hasMore || false
      console.log('✅ [Redis] 键列表加载成功:', result.data.length, '个')
      
      if (hasMoreKeys.value) {
        console.log('⚠️  [Redis] 数据库中还有更多键未显示')
      }
    } else {
      console.error('❌ [Redis] 键列表加载失败:', result.error)
      ElMessage.error(`加载键列表失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error('❌ [Redis] 键列表加载异常:', error)
    ElMessage.error(`加载键列表异常: ${error.message}`)
  } finally {
    redisLoading.value = false
  }
}

async function handleDbChange(db: number) {
  selectedKey.value = ''
  keys.value = []
  keySearchKeyword.value = ''
  commandResult.value = null
  
  if (!window.electron || !(window.electron as any).invoke) {
    return
  }
  
  try {
    redisLoading.value = true
    
    // 切换数据库
    const result = await (window.electron as any).invoke('redis:selectDb', db)
    
    if (result.success) {
      console.log('✅ [Redis] 切换到数据库', db)
      // 加载新数据库的键
      await loadKeys()
    } else {
      console.error('❌ [Redis] 切换数据库失败:', result.error)
      ElMessage.error(`切换数据库失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error('❌ [Redis] 切换数据库异常:', error)
    ElMessage.error(`切换数据库异常: ${error.message}`)
  } finally {
    redisLoading.value = false
  }
}

async function handleKeyClick(key: string) {
  selectedKey.value = key
  
  if (!window.electron || !(window.electron as any).invoke) {
    return
  }
  
  try {
    redisLoading.value = true
    
    const result = await (window.electron as any).invoke('redis:getKeyValue', key)
    
    if (result.success) {
      keyType.value = result.data.type
      
      // 根据类型格式化值
      if (result.data.type === 'string') {
        keyValue.value = result.data.value || ''
      } else if (result.data.type === 'list' || result.data.type === 'set') {
        keyValue.value = JSON.stringify(result.data.value, null, 2)
      } else if (result.data.type === 'hash' || result.data.type === 'zset') {
        keyValue.value = JSON.stringify(result.data.value, null, 2)
      } else {
        keyValue.value = String(result.data.value || '')
      }
      
      console.log('✅ [Redis] 键值加载成功, 类型:', result.data.type)
    } else {
      console.error('❌ [Redis] 键值加载失败:', result.error)
      ElMessage.error(`加载键值失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error('❌ [Redis] 键值加载异常:', error)
    ElMessage.error(`加载键值异常: ${error.message}`)
  } finally {
    redisLoading.value = false
  }
}

async function refreshKeys() {
  await loadKeys()
  ElMessage.success('已刷新键列表')
}

function deleteKey(key: string) {
  ElMessageBox.confirm(`确定要删除键 "${key}" 吗？`, '确认删除', {
    type: 'warning',
  }).then(async () => {
    if (!window.electron || !(window.electron as any).invoke) {
      ElMessage.error('该功能仅在Electron版本中可用')
      return
    }
    
    try {
      redisLoading.value = true
      
      const result = await (window.electron as any).invoke('redis:deleteKey', key)
      
      if (result.success) {
        ElMessage.success('删除成功')
        console.log('✅ [Redis] 键删除成功:', key)
        
        // 刷新键列表
        await loadKeys()
        
        // 清空选中
        if (selectedKey.value === key) {
          selectedKey.value = ''
          keyValue.value = ''
          keyType.value = ''
        }
      } else {
        ElMessage.error(`删除失败: ${result.error}`)
        console.error('❌ [Redis] 键删除失败:', result.error)
      }
    } catch (error: any) {
      console.error('❌ [Redis] 键删除异常:', error)
      ElMessage.error(`删除异常: ${error.message}`)
    } finally {
      redisLoading.value = false
    }
  }).catch(() => {})
}

async function refreshKeyValue() {
  if (selectedKey.value) {
    await handleKeyClick(selectedKey.value)
    ElMessage.success('已刷新键值')
  }
}

async function updateKeyValue() {
  if (!selectedKey.value) {
    ElMessage.warning('请先选择一个键')
    return
  }
  
  if (!window.electron || !(window.electron as any).invoke) {
    ElMessage.error('该功能仅在Electron版本中可用')
    return
  }
  
  try {
    redisLoading.value = true
    
    const result = await (window.electron as any).invoke('redis:setKeyValue', selectedKey.value, keyValue.value)
    
    if (result.success) {
      ElMessage.success('保存成功')
      console.log('✅ [Redis] 键值更新成功:', selectedKey.value)
    } else {
      ElMessage.error(`保存失败: ${result.error}`)
      console.error('❌ [Redis] 键值更新失败:', result.error)
    }
  } catch (error: any) {
    console.error('❌ [Redis] 键值更新异常:', error)
    ElMessage.error(`保存异常: ${error.message}`)
  } finally {
    redisLoading.value = false
  }
}

// ============ 命令执行 ============

/**
 * 执行快捷命令
 */
async function executeQuickCommand(command: string) {
  commandInput.value = command
  await executeCommand()
}

async function executeCommand() {
  if (!commandInput.value.trim()) {
    ElMessage.warning('请输入命令')
    return
  }
  
  if (!window.electron || !(window.electron as any).invoke) {
    ElMessage.error('该功能仅在Electron版本中可用')
    return
  }
  
  if (!redisConnected.value) {
    ElMessage.warning('请先连接 Redis')
    return
  }
  
  try {
    redisLoading.value = true
    
    const result = await (window.electron as any).invoke('redis:execute', commandInput.value)
    
    if (result.success) {
      commandResult.value = result.data
      console.log('✅ [Redis] 命令执行成功:', result.data)
      
      // 添加到历史记录
      if (!commandHistory.value.includes(commandInput.value)) {
        commandHistory.value.unshift(commandInput.value)
        if (commandHistory.value.length > 20) {
          commandHistory.value = commandHistory.value.slice(0, 20)
        }
        await saveConnectionsToStorage()
      }
      
      // 如果是修改数据的命令，刷新键列表
      const cmd = commandInput.value.trim().split(/\s+/)[0].toLowerCase()
      if (['set', 'del', 'flushdb', 'flushall', 'expire', 'rename'].includes(cmd)) {
        await loadKeys()
      }
    } else {
      ElMessage.error(`命令执行失败: ${result.error}`)
      console.error('❌ [Redis] 命令执行失败:', result.error)
      commandResult.value = `Error: ${result.error}`
    }
  } catch (error: any) {
    console.error('❌ [Redis] 命令执行异常:', error)
    ElMessage.error(`命令执行异常: ${error.message}`)
    commandResult.value = `Exception: ${error.message}`
  } finally {
    redisLoading.value = false
  }
}

function selectHistoryCommand(cmd: string) {
  commandInput.value = cmd
}

function clearCommandHistory() {
  commandHistory.value = []
  saveConnectionsToStorage()
  ElMessage.success('命令历史已清空')
}

function clearCommandResult() {
  commandResult.value = null
}

function formatResult(result: any): string {
  if (typeof result === 'string') {
    return result
  }
  return JSON.stringify(result, null, 2)
}

function getKeyTypeColor(type: string): string {
  const colors: Record<string, string> = {
    string: 'success',
    list: 'primary',
    set: 'warning',
    zset: 'danger',
    hash: 'info',
  }
  return colors[type] || ''
}

// ============ 生命周期 ============

onMounted(async () => {
  await loadConnectionsFromStorage()
  console.log('Redis 工具初始化完成')
})
</script>

<style scoped>
.redis-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%);
}

.redis-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.1) 0%, rgba(255, 20, 147, 0.08) 100%);
  border-bottom: 2px solid rgba(33, 230, 255, 0.4);
  box-shadow: 0 2px 10px rgba(33, 230, 255, 0.2);
}

.redis-toolbar__left,
.redis-toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.redis-toolbar__status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 15px;
  font-weight: 500;
  color: #e0e0e0;
}

.redis-toolbar__status i {
  font-size: 22px;
}

.redis-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.redis-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.redis-sidebar::-webkit-scrollbar {
  width: 8px;
}

.redis-sidebar::-webkit-scrollbar-track {
  background: rgba(33, 230, 255, 0.1);
  border-radius: 4px;
}

.redis-sidebar::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
}

.redis-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--neon-cyan);
}

.sidebar-section {
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.08) 0%, rgba(33, 230, 255, 0.03) 100%);
  border: 1px solid rgba(33, 230, 255, 0.3);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.sidebar-section__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 15px;
  font-weight: 700;
  color: var(--neon-cyan);
  margin-bottom: var(--spacing-md);
  text-shadow: 0 0 8px rgba(33, 230, 255, 0.5);
}

.key-search {
  margin-bottom: var(--spacing-md);
}

.key-search :deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  box-shadow: none !important;
}

.key-search :deep(.el-input__wrapper.is-focus) {
  border-color: var(--neon-cyan) !important;
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3) !important;
}

.key-list {
  max-height: 400px;
  overflow-y: auto;
}

.key-list::-webkit-scrollbar {
  width: 6px;
}

.key-list::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.3);
  border-radius: 3px;
}

.key-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  margin: 4px 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: #d0d0d0;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(33, 230, 255, 0.15);
}

.key-item__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.key-item__main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.key-item__actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.key-item:hover {
  background: rgba(33, 230, 255, 0.15);
  border-color: rgba(33, 230, 255, 0.4);
  color: #ffffff;
  transform: translateX(4px);
}

.key-item:hover .key-item__actions {
  opacity: 1;
}

.key-item--active {
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.25) 0%, rgba(33, 230, 255, 0.15) 100%);
  border-left: 4px solid var(--neon-cyan);
  color: #ffffff;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(33, 230, 255, 0.08);
  border: 1px solid rgba(33, 230, 255, 0.25);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: #d0d0d0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(33, 230, 255, 0.18);
  color: #ffffff;
}

.history-item span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  color: var(--color-muted);
  font-size: 13px;
}

.more-keys-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
  background: rgba(255, 159, 64, 0.1);
  border: 1px solid rgba(255, 159, 64, 0.3);
  border-radius: var(--radius-sm);
  color: #ffb84d;
  font-size: 12px;
  line-height: 1.4;
}

.more-keys-hint i {
  font-size: 16px;
  flex-shrink: 0;
}

.more-keys-hint span {
  flex: 1;
  text-align: center;
}

.redis-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow: hidden;
}

.value-section,
.command-section,
.result-section {
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.06) 0%, rgba(33, 230, 255, 0.02) 100%);
  border: 1px solid rgba(33, 230, 255, 0.35);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.value-header,
.command-header,
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

/* 快捷命令面板 */
.quick-commands {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-md);
}

.quick-commands__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  color: var(--neon-cyan);
  font-size: 13px;
  font-weight: 600;
}

.quick-commands__header i {
  font-size: 16px;
}

.quick-commands__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.quick-commands__grid .el-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid rgba(33, 230, 255, 0.3);
  color: var(--neon-cyan);
  transition: all 0.3s ease;
  font-size: 12px;
}

.quick-commands__grid .el-button:hover {
  background: rgba(33, 230, 255, 0.2);
  border-color: var(--neon-cyan);
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3);
  transform: translateY(-1px);
}

.quick-commands__grid .el-button i {
  font-size: 14px;
}

.value-title,
.command-title,
.result-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 16px;
  font-weight: 700;
  color: var(--neon-cyan);
}

.value-actions,
.result-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.value-textarea :deep(textarea),
.result-text {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  color: #e8e8e8 !important;
  font-family: var(--font-family-mono);
  font-size: 14px;
  line-height: 1.6;
}

.value-footer {
  margin-top: var(--spacing-md);
  display: flex;
  justify-content: flex-end;
}

.command-input :deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
}

.command-input :deep(.el-input__inner) {
  color: #e8e8e8 !important;
  font-family: var(--font-family-mono);
}

.result-content {
  max-height: 400px;
  overflow-y: auto;
}

.result-text {
  margin: 0;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  color: var(--color-muted);
}

.empty-state i {
  font-size: 64px;
  color: var(--neon-cyan);
  opacity: 0.3;
}

/* 连接管理对话框 */
.connection-manager {
  max-height: 500px;
  overflow-y: auto;
}

.connection-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
}

.connection-item__icon {
  font-size: 32px;
  color: var(--neon-cyan);
}

.connection-item__info {
  flex: 1;
}

.connection-item__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.connection-item__details {
  font-size: 13px;
  color: var(--color-muted);
}

.connection-item__actions {
  display: flex;
  gap: var(--spacing-sm);
}

.empty-connections {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--color-muted);
}

.empty-connections i {
  font-size: 64px;
  color: var(--neon-cyan);
  opacity: 0.3;
}

/* Element Plus 组件样式增强 */
:deep(.el-select .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: var(--neon-cyan) !important;
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.4) !important;
}

/* 端口输入框容器 */
:deep(.el-input-number) {
  width: 100%;
  min-width: 150px !important;
}

/* 端口输入框特殊样式 */
:deep(.port-input) {
  --el-input-text-color: #e8e8e8 !important;
  --el-input-placeholder-color: #999999 !important;
}

:deep(.port-input .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.6) !important;
}

:deep(.port-input input) {
  color: #e8e8e8 !important;
  -webkit-text-fill-color: #e8e8e8 !important;
  opacity: 1 !important;
  padding-right: 60px !important;
  padding-left: 12px !important;
}

:deep(.el-input-number .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  box-shadow: none !important;
}

/* 端口输入框文字 - 多重选择器确保生效 */
:deep(.el-input-number .el-input__inner) {
  color: #e8e8e8 !important;
  -webkit-text-fill-color: #e8e8e8 !important;
  text-align: center !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

:deep(.el-input-number input) {
  color: #e8e8e8 !important;
  -webkit-text-fill-color: #e8e8e8 !important;
}

:deep(.el-input-number input[type="number"]) {
  color: #e8e8e8 !important;
  -webkit-text-fill-color: #e8e8e8 !important;
}

/* 增减按钮 */
:deep(.el-input-number .el-input-number__decrease),
:deep(.el-input-number .el-input-number__increase) {
  background: rgba(33, 230, 255, 0.1) !important;
  border-left: 1px solid rgba(33, 230, 255, 0.3) !important;
  color: var(--neon-cyan) !important;
}

:deep(.el-input-number .el-input-number__decrease):hover,
:deep(.el-input-number .el-input-number__increase):hover {
  background: rgba(33, 230, 255, 0.2) !important;
  color: #ffffff !important;
}
</style>

