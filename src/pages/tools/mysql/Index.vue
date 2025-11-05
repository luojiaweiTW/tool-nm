<template>
  <div class="tool-page mysql-page">
    <!-- 顶部工具栏 -->
    <div class="mysql-toolbar">
      <div class="mysql-toolbar__left">
        <div class="mysql-toolbar__status">
          <i :class="mysqlConnected ? 'i-mdi-database-check' : 'i-mdi-database-off'" 
             :style="{ color: mysqlConnected ? 'var(--neon-lime)' : 'var(--color-muted)' }" />
          <span>{{ mysqlConnected ? `已连接: ${currentConnection?.name || currentConnection?.username + '@' + currentConnection?.host}` : '未连接MySQL' }}</span>
        </div>
      </div>
      
      <div class="mysql-toolbar__right">
        <el-button
          v-if="!mysqlConnected"
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
          <el-badge :value="mysqlConnections.length" :max="99" v-if="mysqlConnections.length > 0" />
        </el-button>
        
        <el-button
          v-if="mysqlConnected"
          type="success"
          size="default"
          @click="loadDatabases"
        >
          <i class="i-mdi-refresh" /> 刷新
        </el-button>
        
        <el-button
          v-if="mysqlConnected"
          type="danger"
          size="default"
          @click="disconnectMysql"
        >
          <i class="i-mdi-database-remove" /> 断开
        </el-button>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="tool-content mysql-content">
      <!-- 左侧：数据库、表、SQL语句库 -->
      <div class="mysql-sidebar">
        <!-- 数据库和表 -->
        <div class="sidebar-section" v-if="mysqlConnected">
          <div class="sidebar-section__header">
            <i class="i-mdi-database-outline" />
            <span>数据库 ({{ databases.length }})</span>
          </div>
          
          <el-select
            v-model="selectedDatabase"
            placeholder="选择数据库"
            size="large"
            filterable
            @change="handleDatabaseChange"
            v-loading="mysqlLoading"
          >
            <el-option
              v-for="db in databases"
              :key="db"
              :label="db"
              :value="db"
            />
          </el-select>
        </div>

        <div class="sidebar-section" v-if="mysqlConnected && selectedDatabase">
          <div class="sidebar-section__header">
            <i class="i-mdi-table" />
            <span>表 ({{ filteredTables.length }}/{{ tables.length }})</span>
          </div>
          
          <!-- 表搜索 -->
          <el-input
            v-model="tableSearchKeyword"
            placeholder="搜索表名..."
            size="small"
            clearable
            class="table-search"
          >
            <template #prefix>
              <i class="i-mdi-magnify" />
            </template>
          </el-input>
          
          <div class="table-list">
            <div
              v-for="table in filteredTables"
              :key="table"
              :class="['table-item', { 'table-item--active': selectedTable === table }]"
              @click="handleTableClick(table)"
            >
              <div class="table-item__main">
                <i class="i-mdi-table-large" />
                <span>{{ table }}</span>
              </div>
              <div class="table-item__actions">
                <el-button
                  size="small"
                  text
                  @click.stop="showCreateTableSQL(table)"
                  title="查看建表语句"
                >
                  <i class="i-mdi-code-tags" />
                </el-button>
              </div>
            </div>
            
            <div v-if="filteredTables.length === 0 && tables.length > 0" class="empty-hint">
              <i class="i-mdi-information-outline" />
              <span>未找到匹配的表</span>
            </div>
            
            <div v-if="tables.length === 0" class="empty-hint">
              <i class="i-mdi-information-outline" />
              <span>暂无表</span>
            </div>
          </div>
        </div>

        <!-- SQL语句库 -->
        <div class="sidebar-section">
          <div class="sidebar-section__header">
            <i class="i-mdi-code-braces-box" />
            <span>SQL语句库</span>
            <el-button
              size="small"
              text
              @click="showSqlSnippetDialog = true"
            >
              <i class="i-mdi-plus" />
            </el-button>
          </div>
          
          <!-- 内置SQL -->
          <div class="sql-category">
            <div class="sql-category__title">内置查询</div>
            <div
              v-for="snippet in builtInSnippets"
              :key="snippet.id"
              class="sql-snippet-item"
              @click="loadSqlSnippet(snippet)"
            >
              <i :class="snippet.icon" />
              <span>{{ snippet.name }}</span>
            </div>
          </div>
          
          <!-- 自定义SQL -->
          <div class="sql-category" v-if="customSnippets.length > 0">
            <div class="sql-category__title">自定义查询</div>
            <div
              v-for="snippet in customSnippets"
              :key="snippet.id"
              class="sql-snippet-item"
            >
              <div class="sql-snippet-item__main" @click="loadSqlSnippet(snippet)">
                <i class="i-mdi-code-tags" />
                <span>{{ snippet.name }}</span>
              </div>
              <div class="sql-snippet-item__actions">
                <el-button
                  size="small"
                  text
                  @click.stop="editSqlSnippet(snippet)"
                >
                  <i class="i-mdi-pencil" />
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click.stop="deleteSqlSnippet(snippet.id)"
                >
                  <i class="i-mdi-delete" />
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 查询历史 -->
        <div class="sidebar-section" v-if="queryHistory.length > 0">
          <div class="sidebar-section__header">
            <i class="i-mdi-history" />
            <span>查询历史</span>
            <el-button
              size="small"
              text
              @click="clearQueryHistory"
            >
              清空
            </el-button>
          </div>
          
          <div class="history-list">
            <div
              v-for="(query, index) in queryHistory"
              :key="index"
              class="history-item"
              @click="selectHistoryQuery(query)"
            >
              <i class="i-mdi-history" />
              <span>{{ query }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：SQL输入和结果 -->
      <div class="mysql-main">
        <!-- SQL输入区 -->
        <div class="sql-input-section">
          <div class="sql-input-header">
            <div class="sql-input-title">
              <i class="i-mdi-code-braces" />
              SQL 语句
            </div>
            <div class="sql-input-actions">
              <el-input-number
                v-model="maxRows"
                :min="1"
                :max="10000"
                :step="100"
                size="small"
                style="width: 120px"
              />
              <span style="font-size: 13px; color: var(--color-muted);">最大行数</span>
              <el-button
                type="primary"
                size="default"
                @click="executeQuery"
                :loading="mysqlLoading"
                :disabled="!mysqlConnected || !sqlInput.trim()"
              >
                <i class="i-mdi-play-circle" /> 执行 (F5)
              </el-button>
            </div>
          </div>
          
          <el-input
            v-model="sqlInput"
            type="textarea"
            :rows="8"
            placeholder="输入 SQL 查询语句...&#10;提示：&#10;- 按 F5 执行查询&#10;- 左侧可选择表或SQL模板&#10;- SELECT 查询会自动添加 LIMIT"
            class="sql-textarea"
            @keydown.f5.prevent="executeQuery"
          />
        </div>

        <!-- 查询结果 -->
        <div class="result-section" v-if="queryResult">
          <div class="result-header">
            <div class="result-info">
              <i class="i-mdi-table-check" />
              <span>查询结果: {{ queryResult.rows.length }} 条记录</span>
              <span v-if="queryResult.affectedRows !== undefined" style="margin-left: 10px;">
                影响行数: {{ queryResult.affectedRows }}
              </span>
            </div>
            <div class="result-actions">
              <el-button
                size="small"
                @click="exportResultAsCSV"
              >
                <i class="i-mdi-download" /> 导出CSV
              </el-button>
              <el-button
                size="small"
                @click="clearQueryResult"
              >
                <i class="i-mdi-close" /> 清空
              </el-button>
            </div>
          </div>
          
          <div class="result-table-wrapper">
            <table class="result-table" v-if="queryResult.rows.length > 0">
              <thead>
                <tr>
                  <th v-for="col in queryResult.columns" :key="col">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in queryResult.rows" :key="index">
                  <td v-for="col in queryResult.columns" :key="col">
                    <span v-if="row[col] === null" class="null-value">NULL</span>
                    <span v-else>{{ row[col] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-else class="empty-result">
              <i class="i-mdi-information-outline" />
              <span>查询无结果</span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-state">
          <i class="i-mdi-database-search" />
          <h3>开始查询</h3>
          <p>输入SQL语句并点击执行，或从左侧选择表和SQL模板</p>
        </div>
      </div>
    </div>

    <!-- MySQL 连接配置对话框 -->
    <el-dialog
      v-model="showConfigDialog"
      title="MySQL 连接配置"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="mysqlForm" label-width="100px">
        <el-form-item label="连接名称">
          <el-input v-model="mysqlForm.name" placeholder="给连接起个名字" />
        </el-form-item>
        <el-form-item label="主机地址" required>
          <el-input v-model="mysqlForm.host" placeholder="localhost" />
        </el-form-item>
        <el-form-item label="端口" required>
          <el-input-number v-model="mysqlForm.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="用户名" required>
          <el-input v-model="mysqlForm.username" placeholder="root" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="mysqlForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="默认数据库">
          <el-input v-model="mysqlForm.database" placeholder="选填" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button @click="showConfigDialog = false">取消</el-button>
          <div style="display: flex; gap: 10px;">
            <el-button @click="saveConnectionOnly">
              <i class="i-mdi-content-save" /> 仅保存
            </el-button>
            <el-button type="primary" @click="connectMysql" :loading="mysqlLoading">
              <i class="i-mdi-connection" /> 保存并连接
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 连接管理对话框 -->
    <el-dialog
      v-model="showConnectionManager"
      title="MySQL 连接管理"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="connection-manager">
        <div
          v-for="(conn, index) in mysqlConnections"
          :key="index"
          class="connection-item"
        >
          <div class="connection-item__icon">
            <i class="i-mdi-database" />
          </div>
          <div class="connection-item__info">
            <div class="connection-item__name">{{ conn.name || `${conn.username}@${conn.host}` }}</div>
            <div class="connection-item__details">
              {{ conn.host }}:{{ conn.port }} 
              <span v-if="conn.database">| {{ conn.database }}</span>
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
        
        <div v-if="mysqlConnections.length === 0" class="empty-connections">
          <i class="i-mdi-database-off" />
          <p>暂无保存的连接</p>
          <el-button type="primary" @click="showConfigDialog = true; showConnectionManager = false">
            新建连接
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- SQL片段编辑对话框 -->
    <el-dialog
      v-model="showSqlSnippetDialog"
      :title="editingSnippet ? '编辑SQL片段' : '新建SQL片段'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="sqlSnippetForm" label-width="100px">
        <el-form-item label="名称" required>
          <el-input v-model="sqlSnippetForm.name" placeholder="SQL片段名称" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="sqlSnippetForm.description" placeholder="简要说明" />
        </el-form-item>
        <el-form-item label="SQL语句" required>
          <el-input
            v-model="sqlSnippetForm.sql"
            type="textarea"
            :rows="10"
            placeholder="输入SQL语句"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="closeSqlSnippetDialog">取消</el-button>
        <el-button type="primary" @click="saveSqlSnippet">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 建表语句对话框 -->
    <el-dialog
      v-model="showCreateTableDialog"
      title="建表语句"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="create-table-info">
        <div class="create-table-header">
          <i class="i-mdi-table" />
          <span>{{ currentTableName }}</span>
        </div>
        
        <el-input
          v-model="createTableSQL"
          type="textarea"
          :rows="20"
          readonly
          class="create-table-sql"
        />
      </div>
      
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <el-button @click="showCreateTableDialog = false">关闭</el-button>
          <div style="display: flex; gap: 10px;">
            <el-button @click="copyCreateTableSQL">
              <i class="i-mdi-content-copy" /> 复制
            </el-button>
            <el-button type="primary" @click="executeCreateTableSQL">
              <i class="i-mdi-play-circle" /> 执行
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface MySQLConfig {
  name?: string
  host: string
  port: number
  username: string
  password: string
  database?: string
}

interface MySQLQueryResult {
  columns: string[]
  rows: any[]
  affectedRows?: number
}

interface SqlSnippet {
  id: string
  name: string
  description?: string
  sql: string
  icon?: string
  builtin?: boolean
}

// ============ 状态管理 ============
const mysqlConnected = ref(false)
const mysqlLoading = ref(false)
const showConfigDialog = ref(false)
const showConnectionManager = ref(false)
const showSqlSnippetDialog = ref(false)

// 连接管理
const mysqlConnections = ref<MySQLConfig[]>([])
const currentConnection = ref<MySQLConfig | null>(null)
const mysqlForm = ref<MySQLConfig>({
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: '',
})

// 数据库和表
const databases = ref<string[]>([])
const tables = ref<string[]>([])
const selectedDatabase = ref('')
const selectedTable = ref('')
const tableSearchKeyword = ref('')

// 建表语句对话框
const showCreateTableDialog = ref(false)
const currentTableName = ref('')
const createTableSQL = ref('')

// 过滤后的表列表
const filteredTables = computed(() => {
  if (!tableSearchKeyword.value.trim()) {
    return tables.value
  }
  const keyword = tableSearchKeyword.value.toLowerCase()
  return tables.value.filter(table => 
    table.toLowerCase().includes(keyword)
  )
})

// SQL查询
const sqlInput = ref('')
const queryResult = ref<MySQLQueryResult | null>(null)
const maxRows = ref(200)
const queryHistory = ref<string[]>([])

// SQL片段
const customSnippets = ref<SqlSnippet[]>([])
const editingSnippet = ref<SqlSnippet | null>(null)
const sqlSnippetForm = ref({
  name: '',
  description: '',
  sql: '',
})

// 内置SQL片段
const builtInSnippets: SqlSnippet[] = [
  {
    id: 'deadlock',
    name: '死锁查询',
    icon: 'i-mdi-lock-alert',
    description: '查询当前数据库死锁信息',
    sql: `-- 查询当前死锁
SHOW ENGINE INNODB STATUS;`,
    builtin: true,
  },
  {
    id: 'transactions',
    name: '活跃事务',
    icon: 'i-mdi-database-clock',
    description: '查看当前活跃的事务',
    sql: `-- 查询活跃事务
SELECT *
FROM information_schema.INNODB_TRX
ORDER BY trx_started;`,
    builtin: true,
  },
  {
    id: 'locks',
    name: '锁等待',
    icon: 'i-mdi-lock-clock',
    description: '查询当前锁等待情况',
    sql: `-- 查询锁等待
SELECT 
  r.trx_id waiting_trx_id,
  r.trx_mysql_thread_id waiting_thread,
  r.trx_query waiting_query,
  b.trx_id blocking_trx_id,
  b.trx_mysql_thread_id blocking_thread,
  b.trx_query blocking_query
FROM information_schema.INNODB_LOCK_WAITS w
INNER JOIN information_schema.INNODB_TRX b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.INNODB_TRX r ON r.trx_id = w.requesting_trx_id;`,
    builtin: true,
  },
  {
    id: 'processlist',
    name: '进程列表',
    icon: 'i-mdi-format-list-bulleted',
    description: '查看当前MySQL进程列表',
    sql: `-- 查询进程列表
SHOW FULL PROCESSLIST;`,
    builtin: true,
  },
  {
    id: 'slow-queries',
    name: '慢查询统计',
    icon: 'i-mdi-speedometer-slow',
    description: '查看慢查询统计信息',
    sql: `-- 慢查询统计
SELECT 
  SCHEMA_NAME,
  DIGEST_TEXT,
  COUNT_STAR,
  AVG_TIMER_WAIT/1000000000000 AS avg_time_sec,
  SUM_ROWS_EXAMINED,
  SUM_ROWS_SENT
FROM performance_schema.events_statements_summary_by_digest
WHERE SCHEMA_NAME IS NOT NULL
ORDER BY AVG_TIMER_WAIT DESC
LIMIT 20;`,
    builtin: true,
  },
  {
    id: 'table-size',
    name: '表大小统计',
    icon: 'i-mdi-database-eye',
    description: '查询数据库中各表的大小',
    sql: `-- 表大小统计
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
  ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb,
  ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;`,
    builtin: true,
  },
  {
    id: 'connection-count',
    name: '连接数统计',
    icon: 'i-mdi-connection',
    description: '查看当前连接数统计',
    sql: `-- 连接数统计
SELECT 
  USER,
  HOST,
  DB,
  COUNT(*) AS connection_count
FROM information_schema.PROCESSLIST
GROUP BY USER, HOST, DB
ORDER BY connection_count DESC;`,
    builtin: true,
  },
]

// ============ 连接管理 ============

// 仅保存连接配置（不连接）
async function saveConnectionOnly() {
  if (!mysqlForm.value.host || !mysqlForm.value.username) {
    ElMessage.warning('请填写主机地址和用户名')
    return
  }
  
  const config = {
    host: mysqlForm.value.host,
    port: mysqlForm.value.port,
    username: mysqlForm.value.username,
    password: mysqlForm.value.password,
    database: mysqlForm.value.database || '',
    name: mysqlForm.value.name,
  }
  
  // 检查是否已存在相同的连接
  const existingIndex = mysqlConnections.value.findIndex(
    c => c.host === config.host && c.port === config.port && c.username === config.username
  )
  
  if (existingIndex >= 0) {
    // 更新现有连接
    mysqlConnections.value[existingIndex] = config
    ElMessage.success('连接配置已更新')
  } else {
    // 添加新连接
    mysqlConnections.value.unshift(config)
    ElMessage.success('连接配置已保存')
  }
  
  await saveConnectionsToStorage()
  showConfigDialog.value = false
  
  console.log('✓ Connection saved:', config.name || `${config.username}@${config.host}`)
}

// 保存并连接
async function connectMysql() {
  if (!window.electron || !(window.electron as any).invoke) {
    ElMessage.error('MySQL功能仅在Electron版本中可用')
    return
  }
  
  if (!mysqlForm.value.host || !mysqlForm.value.username) {
    ElMessage.warning('请填写主机地址和用户名')
    return
  }
  
  mysqlLoading.value = true
  
  try {
    const config = {
      host: mysqlForm.value.host,
      port: mysqlForm.value.port,
      username: mysqlForm.value.username,
      password: mysqlForm.value.password,
      database: mysqlForm.value.database || '',
      name: mysqlForm.value.name,
    }
    
    const result = await (window.electron as any).invoke('mysql:connect', config)
    
    if (result.success) {
      mysqlConnected.value = true
      currentConnection.value = config
      showConfigDialog.value = false
      ElMessage.success('MySQL连接成功')
      
      // 保存到连接列表
      const existingIndex = mysqlConnections.value.findIndex(
        c => c.host === config.host && c.port === config.port && c.username === config.username
      )
      
      if (existingIndex >= 0) {
        mysqlConnections.value[existingIndex] = config
      } else {
        mysqlConnections.value.unshift(config)
      }
      
      await saveConnectionsToStorage()
      
      // 加载数据库列表
      await loadDatabases()
    } else {
      ElMessage.error('MySQL连接失败: ' + result.error)
    }
  } catch (error: any) {
    console.error('MySQL connect error:', error)
    ElMessage.error('MySQL连接失败: ' + error.message)
  } finally {
    mysqlLoading.value = false
  }
}

async function disconnectMysql() {
  if (!window.electron || !(window.electron as any).invoke) return
  
  try {
    await (window.electron as any).invoke('mysql:disconnect')
    mysqlConnected.value = false
    currentConnection.value = null
    databases.value = []
    tables.value = []
    selectedDatabase.value = ''
    selectedTable.value = ''
    queryResult.value = null
    ElMessage.success('已断开MySQL连接')
  } catch (error: any) {
    console.error('Disconnect error:', error)
    ElMessage.error('断开连接失败: ' + error.message)
  }
}

async function connectToSavedConnection(conn: MySQLConfig) {
  mysqlForm.value = { ...conn }
  showConnectionManager.value = false
  await connectMysql()
}

function editConnection(conn: MySQLConfig) {
  mysqlForm.value = { ...conn }
  showConnectionManager.value = false
  showConfigDialog.value = true
}

function deleteConnection(index: number) {
  ElMessageBox.confirm('确定要删除这个连接吗？', '确认删除', {
    type: 'warning',
  }).then(async () => {
    mysqlConnections.value.splice(index, 1)
    await saveConnectionsToStorage()
    ElMessage.success('连接已删除')
  }).catch(() => {})
}

// 保存连接配置到文件
async function saveConnectionsToStorage() {
  console.log('💾 [MySQL] 开始保存配置...')
  console.log('💾 [MySQL] 当前数据:', {
    connections: mysqlConnections.value.length,
    history: queryHistory.value.length,
    snippets: customSnippets.value.length
  })
  
  try {
    // 优先使用文件系统（Electron）
    if (window.electronAPI) {
      console.log('💾 [MySQL] 使用 electronAPI 保存到文件')
      const data = {
        connections: mysqlConnections.value,
        queryHistory: queryHistory.value,
        customSnippets: customSnippets.value,
      }
      const result = await window.electronAPI.writeFile(
        'mysql-config.json',
        JSON.stringify(data, null, 2)
      )
      console.log('💾 [MySQL] 写入结果:', result)
      
      if (result.success) {
        console.log('✅ [MySQL] MySQL配置已保存到文件: mysql-config.json')
      } else {
        console.error('❌ [MySQL] 保存失败:', result.error)
        // 降级到 localStorage
        console.log('⚠️ [MySQL] 降级到 localStorage')
        localStorage.setItem('mysql-connections', JSON.stringify(mysqlConnections.value))
        localStorage.setItem('mysql-query-history', JSON.stringify(queryHistory.value))
        localStorage.setItem('mysql-sql-snippets', JSON.stringify(customSnippets.value))
      }
    } else {
      // Web 版本使用 localStorage
      console.log('💾 [MySQL] electronAPI 不可用，使用 localStorage')
      localStorage.setItem('mysql-connections', JSON.stringify(mysqlConnections.value))
      localStorage.setItem('mysql-query-history', JSON.stringify(queryHistory.value))
      localStorage.setItem('mysql-sql-snippets', JSON.stringify(customSnippets.value))
    }
  } catch (error) {
    console.error('❌ [MySQL] 保存配置失败:', error)
  }
}

// 从文件加载连接配置
async function loadConnectionsFromStorage() {
  console.log('🔵 [MySQL] 开始加载配置...')
  console.log('🔵 [MySQL] window.electronAPI:', !!window.electronAPI)
  
  try {
    // 优先使用文件系统（Electron）
    if (window.electronAPI) {
      console.log('🔵 [MySQL] 检查 mysql-config.json 是否存在...')
      const fileExists = await window.electronAPI.fileExists('mysql-config.json')
      console.log('🔵 [MySQL] 文件存在:', fileExists)
      
      if (fileExists) {
        console.log('🔵 [MySQL] 文件存在，开始读取...')
        const result = await window.electronAPI.readFile('mysql-config.json')
        console.log('🔵 [MySQL] 文件读取结果:', result.success ? '成功' : '失败')
        
        if (result.success) {
          console.log('🔵 [MySQL] 文件内容长度:', result.data.length)
          const data = JSON.parse(result.data)
          mysqlConnections.value = data.connections || []
          queryHistory.value = data.queryHistory || []
          customSnippets.value = data.customSnippets || []
          console.log('✅ [MySQL] 已从文件加载 MySQL 配置')
          console.log(`  - 连接: ${mysqlConnections.value.length} 个`)
          console.log(`  - 查询历史: ${queryHistory.value.length} 条`)
          console.log(`  - 自定义SQL: ${customSnippets.value.length} 个`)
          return
        } else {
          console.error('❌ [MySQL] 文件读取失败:', result.error)
        }
      } else {
        console.log('⚠️ [MySQL] mysql-config.json 不存在，尝试从 localStorage 迁移...')
        // 尝试从 localStorage 迁移数据
        await migrateFromLocalStorage()
        return
      }
    } else {
      console.log('⚠️ [MySQL] electronAPI 不可用，使用 localStorage')
    }
    
    // Web 版本或文件读取失败时使用 localStorage
    console.log('🔵 [MySQL] 尝试从 localStorage 加载...')
    const storedConnections = localStorage.getItem('mysql-connections')
    const storedHistory = localStorage.getItem('mysql-query-history')
    const storedSnippets = localStorage.getItem('mysql-sql-snippets')
    
    console.log('🔵 [MySQL] localStorage 数据:', {
      connections: storedConnections ? 'exists' : 'null',
      history: storedHistory ? 'exists' : 'null',
      snippets: storedSnippets ? 'exists' : 'null'
    })
    
    if (storedConnections) {
      mysqlConnections.value = JSON.parse(storedConnections)
    }
    if (storedHistory) {
      queryHistory.value = JSON.parse(storedHistory)
    }
    if (storedSnippets) {
      customSnippets.value = JSON.parse(storedSnippets)
    }
    
    console.log('✅ [MySQL] 已从 localStorage 加载配置')
  } catch (error) {
    console.error('❌ [MySQL] 加载配置失败:', error)
  }
  
  console.log('🔵 [MySQL] 加载完成，当前连接数:', mysqlConnections.value.length)
}

// 从 localStorage 迁移数据到文件
async function migrateFromLocalStorage() {
  console.log('🔄 [MySQL] 开始从 localStorage 迁移数据...')
  
  try {
    const storedConnections = localStorage.getItem('mysql-connections')
    const storedHistory = localStorage.getItem('mysql-query-history')
    const storedSnippets = localStorage.getItem('mysql-sql-snippets')
    
    console.log('🔄 [MySQL] localStorage 中的数据:', {
      connections: storedConnections ? `${JSON.parse(storedConnections).length} 个` : '无',
      history: storedHistory ? `${JSON.parse(storedHistory).length} 条` : '无',
      snippets: storedSnippets ? `${JSON.parse(storedSnippets).length} 个` : '无'
    })
    
    if (storedConnections || storedHistory || storedSnippets) {
      mysqlConnections.value = storedConnections ? JSON.parse(storedConnections) : []
      queryHistory.value = storedHistory ? JSON.parse(storedHistory) : []
      customSnippets.value = storedSnippets ? JSON.parse(storedSnippets) : []
      
      console.log('🔄 [MySQL] 开始保存到文件...')
      // 保存到文件
      await saveConnectionsToStorage()
      
      console.log('✅ [MySQL] 已从 localStorage 迁移数据到文件')
      console.log(`  - 连接: ${mysqlConnections.value.length} 个`)
      console.log(`  - 查询历史: ${queryHistory.value.length} 条`)
      console.log(`  - 自定义SQL: ${customSnippets.value.length} 个`)
    } else {
      console.log('ℹ️ [MySQL] localStorage 中没有需要迁移的数据')
    }
  } catch (error) {
    console.error('❌ [MySQL] 迁移数据失败:', error)
  }
}

// ============ 数据库和表管理 ============

async function loadDatabases() {
  if (!window.electron || !(window.electron as any).invoke || !mysqlConnected.value) return
  
  mysqlLoading.value = true
  
  try {
    const result = await (window.electron as any).invoke('mysql:getDatabases')
    
    if (result.success) {
      databases.value = result.data.map((db: any) => db.Database)
      
      if (currentConnection.value?.database && databases.value.includes(currentConnection.value.database)) {
        selectedDatabase.value = currentConnection.value.database
        await loadTables(selectedDatabase.value)
      }
    } else {
      ElMessage.error('加载数据库列表失败: ' + result.error)
    }
  } catch (error: any) {
    console.error('Load databases error:', error)
    ElMessage.error('加载数据库列表失败: ' + error.message)
  } finally {
    mysqlLoading.value = false
  }
}

async function loadTables(database: string) {
  if (!window.electron || !(window.electron as any).invoke || !database) return
  
  mysqlLoading.value = true
  
  try {
    const result = await (window.electron as any).invoke('mysql:getTables', database)
    
    if (result.success) {
      const firstKey = Object.keys(result.data[0] || {})[0]
      tables.value = result.data.map((table: any) => table[firstKey])
    } else {
      ElMessage.error('加载表列表失败: ' + result.error)
    }
  } catch (error: any) {
    console.error('Load tables error:', error)
    ElMessage.error('加载表列表失败: ' + error.message)
  } finally {
    mysqlLoading.value = false
  }
}

async function handleDatabaseChange(database: string) {
  selectedTable.value = ''
  tables.value = []
  tableSearchKeyword.value = ''
  queryResult.value = null
  
  if (database) {
    await loadTables(database)
  }
}

function handleTableClick(table: string) {
  selectedTable.value = table
  sqlInput.value = `SELECT * FROM \`${table}\`;`
}

// 查看建表语句
async function showCreateTableSQL(table: string) {
  if (!window.electron || !(window.electron as any).invoke) {
    ElMessage.error('该功能仅在Electron版本中可用')
    return
  }
  
  if (!selectedDatabase.value) {
    ElMessage.warning('请先选择数据库')
    return
  }
  
  mysqlLoading.value = true
  currentTableName.value = table
  
  try {
    // 执行 SHOW CREATE TABLE 语句
    const result = await (window.electron as any).invoke(
      'mysql:query',
      `SHOW CREATE TABLE \`${table}\``,
      1,
      selectedDatabase.value
    )
    
    if (result.success && result.data.rows.length > 0) {
      // SHOW CREATE TABLE 返回的第二列是建表语句
      const row = result.data.rows[0]
      createTableSQL.value = row['Create Table'] || row['Create View'] || ''
      showCreateTableDialog.value = true
    } else {
      ElMessage.error('获取建表语句失败')
    }
  } catch (error: any) {
    console.error('Get CREATE TABLE error:', error)
    ElMessage.error('获取建表语句失败: ' + error.message)
  } finally {
    mysqlLoading.value = false
  }
}

// 复制建表语句
function copyCreateTableSQL() {
  if (!createTableSQL.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(createTableSQL.value)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

// 执行建表语句（加载到编辑器）
function executeCreateTableSQL() {
  sqlInput.value = createTableSQL.value
  showCreateTableDialog.value = false
  ElMessage.success('已加载到SQL编辑器')
}

// ============ SQL查询 ============

async function executeQuery() {
  if (!window.electron || !(window.electron as any).invoke) {
    ElMessage.error('MySQL功能仅在Electron版本中可用')
    return
  }
  
  if (!sqlInput.value.trim()) {
    ElMessage.warning('请输入SQL语句')
    return
  }
  
  if (!selectedDatabase.value) {
    ElMessage.warning('请先选择数据库')
    return
  }
  
  mysqlLoading.value = true
  
  try {
    const result = await (window.electron as any).invoke(
      'mysql:query',
      sqlInput.value,
      maxRows.value,
      selectedDatabase.value
    )
    
    if (result.success) {
      queryResult.value = result.data
      
      // 添加到历史记录
      const trimmedQuery = sqlInput.value.trim().substring(0, 100)
      if (!queryHistory.value.includes(trimmedQuery)) {
        queryHistory.value.unshift(trimmedQuery)
        if (queryHistory.value.length > 20) {
          queryHistory.value = queryHistory.value.slice(0, 20)
        }
        // 保存到文件或 localStorage
        await saveConnectionsToStorage()
      }
      
      ElMessage.success('查询完成')
    } else {
      ElMessage.error('查询失败: ' + result.error)
    }
  } catch (error: any) {
    console.error('Query error:', error)
    ElMessage.error('查询失败: ' + error.message)
  } finally {
    mysqlLoading.value = false
  }
}

function selectHistoryQuery(query: string) {
  sqlInput.value = query
}

async function clearQueryHistory() {
  queryHistory.value = []
  await saveConnectionsToStorage()
  ElMessage.success('查询历史已清空')
}

function clearQueryResult() {
  queryResult.value = null
}

function exportResultAsCSV() {
  if (!queryResult.value || queryResult.value.rows.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  
  try {
    const { columns, rows } = queryResult.value
    
    // CSV 头部
    let csv = columns.map(col => `"${col}"`).join(',') + '\n'
    
    // CSV 数据行
    rows.forEach(row => {
      const line = columns.map(col => {
        const value = row[col]
        if (value === null) return '""'
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
      csv += line + '\n'
    })
    
    // 下载
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mysql_export_${Date.now()}.csv`
    link.click()
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败')
  }
}

// ============ SQL片段管理 ============

function loadSqlSnippet(snippet: SqlSnippet) {
  sqlInput.value = snippet.sql
  ElMessage.success(`已加载: ${snippet.name}`)
}

function editSqlSnippet(snippet: SqlSnippet) {
  editingSnippet.value = snippet
  sqlSnippetForm.value = {
    name: snippet.name,
    description: snippet.description || '',
    sql: snippet.sql,
  }
  showSqlSnippetDialog.value = true
}

async function saveSqlSnippet() {
  if (!sqlSnippetForm.value.name || !sqlSnippetForm.value.sql) {
    ElMessage.warning('请填写名称和SQL语句')
    return
  }
  
  if (editingSnippet.value) {
    // 编辑现有片段
    const index = customSnippets.value.findIndex(s => s.id === editingSnippet.value!.id)
    if (index >= 0) {
      customSnippets.value[index] = {
        ...customSnippets.value[index],
        name: sqlSnippetForm.value.name,
        description: sqlSnippetForm.value.description,
        sql: sqlSnippetForm.value.sql,
      }
    }
  } else {
    // 新建片段
    customSnippets.value.push({
      id: `custom_${Date.now()}`,
      name: sqlSnippetForm.value.name,
      description: sqlSnippetForm.value.description,
      sql: sqlSnippetForm.value.sql,
    })
  }
  
  await saveConnectionsToStorage()
  closeSqlSnippetDialog()
  ElMessage.success('保存成功')
}

function deleteSqlSnippet(id: string) {
  ElMessageBox.confirm('确定要删除这个SQL片段吗？', '确认删除', {
    type: 'warning',
  }).then(async () => {
    const index = customSnippets.value.findIndex(s => s.id === id)
    if (index >= 0) {
      customSnippets.value.splice(index, 1)
      await saveConnectionsToStorage()
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

function closeSqlSnippetDialog() {
  showSqlSnippetDialog.value = false
  editingSnippet.value = null
  sqlSnippetForm.value = {
    name: '',
    description: '',
    sql: '',
  }
}


// ============ 生命周期 ============

onMounted(async () => {
  await loadConnectionsFromStorage()
  console.log('MySQL 工具初始化完成')
})
</script>

<style scoped>
.mysql-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(10, 15, 30, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%);
}

.mysql-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.1) 0%, rgba(255, 20, 147, 0.08) 100%);
  border-bottom: 2px solid rgba(33, 230, 255, 0.4);
  box-shadow: 0 2px 10px rgba(33, 230, 255, 0.2);
}

.mysql-toolbar__left,
.mysql-toolbar__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.mysql-toolbar__status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 15px;
  font-weight: 500;
  color: #e0e0e0;
}

.mysql-toolbar__status i {
  font-size: 22px;
}

.mysql-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.mysql-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow-y: auto;
}

.mysql-sidebar::-webkit-scrollbar {
  width: 10px;
}

.mysql-sidebar::-webkit-scrollbar-track {
  background: rgba(33, 230, 255, 0.1);
  border-radius: 5px;
}

.mysql-sidebar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(33, 230, 255, 0.6) 0%, rgba(33, 230, 255, 0.8) 100%);
  border-radius: 5px;
}

.mysql-sidebar::-webkit-scrollbar-thumb:hover {
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

.table-search {
  margin-bottom: var(--spacing-md);
}

.table-search :deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  box-shadow: none !important;
}

.table-search :deep(.el-input__wrapper:hover) {
  border-color: rgba(33, 230, 255, 0.6) !important;
}

.table-search :deep(.el-input__wrapper.is-focus) {
  border-color: var(--neon-cyan) !important;
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3) !important;
}

.table-search :deep(.el-input__inner) {
  color: #e8e8e8 !important;
  font-size: 13px;
}

.table-search :deep(.el-input__prefix) {
  color: var(--neon-cyan);
}

.table-list {
  max-height: 300px;
  overflow-y: auto;
}

.table-list::-webkit-scrollbar {
  width: 6px;
}

.table-list::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.3);
  border-radius: 3px;
}

.table-item {
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

.table-item__main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.table-item__main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-item__actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.table-item:hover {
  background: rgba(33, 230, 255, 0.15);
  border-color: rgba(33, 230, 255, 0.4);
  color: #ffffff;
  transform: translateX(4px);
  box-shadow: 0 2px 10px rgba(33, 230, 255, 0.3);
}

.table-item:hover .table-item__actions {
  opacity: 1;
}

.table-item__actions .el-button {
  padding: 4px 6px;
  min-height: unset;
}

.table-item__actions .el-button i {
  font-size: 16px;
  color: var(--neon-cyan);
}

.table-item__actions .el-button:hover i {
  color: #ffffff;
}

.table-item--active {
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.25) 0%, rgba(33, 230, 255, 0.15) 100%);
  border-left: 4px solid var(--neon-cyan);
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.4);
}

.sql-category {
  margin-bottom: var(--spacing-md);
}

.sql-category__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
  padding-left: 4px;
}

.sql-snippet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  margin: 4px 0;
  background: rgba(33, 230, 255, 0.08);
  border: 1px solid rgba(33, 230, 255, 0.25);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: #d0d0d0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sql-snippet-item:hover {
  background: rgba(33, 230, 255, 0.18);
  border-color: rgba(33, 230, 255, 0.5);
  color: #ffffff;
  transform: translateX(4px);
  box-shadow: 0 2px 12px rgba(33, 230, 255, 0.4);
}

.sql-snippet-item__main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sql-snippet-item__actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.sql-snippet-item:hover .sql-snippet-item__actions {
  opacity: 1;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
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
  font-weight: 500;
  color: #d0d0d0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item:hover {
  background: rgba(33, 230, 255, 0.18);
  border-color: rgba(33, 230, 255, 0.5);
  color: #ffffff;
  transform: translateX(4px);
  box-shadow: 0 2px 12px rgba(33, 230, 255, 0.4);
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

.mysql-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  overflow: hidden;
}

.sql-input-section {
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.06) 0%, rgba(33, 230, 255, 0.02) 100%);
  border: 1px solid rgba(33, 230, 255, 0.35);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.sql-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.sql-input-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 17px;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px rgba(33, 230, 255, 0.6);
}

.sql-input-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sql-textarea :deep(textarea) {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  color: #e8e8e8 !important;
  font-family: var(--font-family-mono);
  font-size: 15px;
  line-height: 1.7;
}

.sql-textarea :deep(textarea):focus {
  border-color: var(--neon-cyan) !important;
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.5) !important;
  background: rgba(0, 0, 0, 0.7) !important;
}

.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.06) 0%, rgba(33, 230, 255, 0.02) 100%);
  border: 1px solid rgba(33, 230, 255, 0.35);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.5);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.12) 0%, rgba(255, 20, 147, 0.08) 100%);
  border-bottom: 2px solid rgba(33, 230, 255, 0.4);
}

.result-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 15px;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px rgba(33, 230, 255, 0.5);
}

.result-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.result-table-wrapper {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-md);
}

.result-table-wrapper::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.result-table-wrapper::-webkit-scrollbar-track {
  background: rgba(33, 230, 255, 0.08);
  border-radius: 5px;
}

.result-table-wrapper::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(33, 230, 255, 0.6) 0%, rgba(33, 230, 255, 0.8) 100%);
  border-radius: 5px;
}

.result-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--neon-cyan);
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: var(--font-family-mono);
  line-height: 1.4;
}

.result-table thead {
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, rgba(33, 230, 255, 0.2) 0%, rgba(33, 230, 255, 0.15) 100%);
  z-index: 1;
}

.result-table th {
  padding: 6px 10px;
  text-align: left;
  font-weight: 700;
  font-size: 12px;
  color: var(--neon-cyan);
  border: 1px solid rgba(33, 230, 255, 0.4);
  background: linear-gradient(180deg, rgba(33, 230, 255, 0.18) 0%, rgba(33, 230, 255, 0.12) 100%);
  white-space: nowrap;
  text-shadow: 0 0 8px rgba(33, 230, 255, 0.4);
}

.result-table td {
  padding: 5px 10px;
  border: 1px solid rgba(33, 230, 255, 0.25);
  color: #d8d8d8;
  background: rgba(255, 255, 255, 0.02);
  font-size: 12px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

/* ID列样式 - 更小的字体 */
.result-table td:first-child {
  font-size: 11px;
  max-width: 180px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #a0a0a0;
}

/* 对于超长内容，鼠标悬停显示完整内容 */
.result-table td:hover {
  overflow: visible;
  white-space: normal;
  word-break: break-all;
  position: relative;
  z-index: 10;
  background: rgba(33, 230, 255, 0.15);
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.3);
}

.result-table tbody tr:hover {
  background: rgba(33, 230, 255, 0.08);
}

.result-table tbody tr:hover td {
  color: #ffffff;
  border-color: rgba(33, 230, 255, 0.3);
}

.null-value {
  color: #888888;
  font-style: italic;
  font-weight: 400;
}

/* Element Plus 选择器样式增强 */
:deep(.el-select) {
  width: 100%;
}

:deep(.el-select .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  box-shadow: none !important;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: rgba(33, 230, 255, 0.6) !important;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: var(--neon-cyan) !important;
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.4) !important;
}

:deep(.el-select .el-input__inner) {
  color: #e8e8e8 !important;
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-input-number .el-input__wrapper) {
  background: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  box-shadow: none !important;
}

:deep(.el-input-number .el-input__inner) {
  color: #e8e8e8 !important;
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--color-muted);
}

.empty-result i {
  font-size: 48px;
  color: var(--neon-cyan);
  opacity: 0.5;
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

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--neon-cyan);
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

/* 建表语句对话框 */
.create-table-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.create-table-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.15) 0%, rgba(33, 230, 255, 0.05) 100%);
  border-left: 4px solid var(--neon-cyan);
  border-radius: var(--radius-sm);
}

.create-table-header i {
  font-size: 20px;
  color: var(--neon-cyan);
}

.create-table-header span {
  font-size: 16px;
  font-weight: 600;
  color: var(--neon-cyan);
}

.create-table-sql :deep(textarea) {
  background: rgba(0, 0, 0, 0.6) !important;
  border: 1px solid rgba(33, 230, 255, 0.4) !important;
  color: #e8e8e8 !important;
  font-family: var(--font-family-mono);
  font-size: 13px;
  line-height: 1.6;
}

.create-table-sql :deep(textarea):focus {
  border-color: var(--neon-cyan) !important;
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.4) !important;
}
</style>
