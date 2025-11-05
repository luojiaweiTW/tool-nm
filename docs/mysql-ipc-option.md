# 可选：为 MySQL 添加专用 IPC 接口

## 如果想要与 SSH 一致的专用接口

### 1. 修改 electron-preload.cjs

```javascript
// 添加 MySQL 专用接口
contextBridge.exposeInMainWorld('electron', {
  // ... 现有代码 ...
  
  mysql: {
    // 保存配置
    saveConfig: (config) => ipcRenderer.invoke('mysql:saveConfig', config),
    
    // 加载配置
    loadConfig: () => ipcRenderer.invoke('mysql:loadConfig'),
  }
})
```

### 2. 修改 electron-main.cjs

```javascript
/**
 * 保存 MySQL 配置到文件
 */
ipcMain.handle('mysql:saveConfig', async (_event, config) => {
  try {
    const configPath = path.join(getDataPath(), 'mysql-config.json')
    
    console.log('Saving MySQL config to:', configPath)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    console.log('✓ MySQL config saved')
    return { success: true }
  } catch (error) {
    console.error('Failed to save MySQL config:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 从文件加载 MySQL 配置
 */
ipcMain.handle('mysql:loadConfig', async () => {
  try {
    const configPath = path.join(getDataPath(), 'mysql-config.json')
    
    console.log('Loading MySQL config from:', configPath)
    
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      const config = JSON.parse(data)
      console.log('✓ MySQL config loaded')
      return { success: true, data: config }
    }
    
    console.log('No MySQL config file found')
    return { success: true, data: { connections: [], queryHistory: [], customSnippets: [] } }
  } catch (error) {
    console.error('Failed to load MySQL config:', error)
    return { success: false, error: error.message }
  }
})
```

### 3. 修改 src/pages/tools/mysql/Index.vue

```javascript
// 保存配置（专用接口）
async function saveConnectionsToStorage() {
  try {
    const data = {
      connections: mysqlConnections.value,
      queryHistory: queryHistory.value,
      customSnippets: customSnippets.value,
    }
    
    // 优先使用专用 IPC
    if (window.electron && window.electron.mysql) {
      const result = await window.electron.mysql.saveConfig(data)
      if (result.success) {
        console.log('✓ MySQL配置已保存到文件')
      } else {
        console.error('保存失败:', result.error)
        // 降级到 localStorage
        localStorage.setItem('mysql-connections', JSON.stringify(mysqlConnections.value))
        localStorage.setItem('mysql-query-history', JSON.stringify(queryHistory.value))
        localStorage.setItem('mysql-sql-snippets', JSON.stringify(customSnippets.value))
      }
    } else {
      // Web 版本使用 localStorage
      localStorage.setItem('mysql-connections', JSON.stringify(mysqlConnections.value))
      localStorage.setItem('mysql-query-history', JSON.stringify(queryHistory.value))
      localStorage.setItem('mysql-sql-snippets', JSON.stringify(customSnippets.value))
    }
  } catch (error) {
    console.error('Failed to save connections:', error)
  }
}

// 加载配置（专用接口）
async function loadConnectionsFromStorage() {
  try {
    // 优先使用专用 IPC
    if (window.electron && window.electron.mysql) {
      const result = await window.electron.mysql.loadConfig()
      if (result.success && result.data) {
        mysqlConnections.value = result.data.connections || []
        queryHistory.value = result.data.queryHistory || []
        customSnippets.value = result.data.customSnippets || []
        console.log('✓ 已从文件加载 MySQL 配置')
        console.log(`  - 连接: ${mysqlConnections.value.length} 个`)
        console.log(`  - 查询历史: ${queryHistory.value.length} 条`)
        console.log(`  - 自定义SQL: ${customSnippets.value.length} 个`)
        return
      }
    }
    
    // 降级到 localStorage
    const storedConnections = localStorage.getItem('mysql-connections')
    const storedHistory = localStorage.getItem('mysql-query-history')
    const storedSnippets = localStorage.getItem('mysql-sql-snippets')
    
    if (storedConnections) {
      mysqlConnections.value = JSON.parse(storedConnections)
    }
    if (storedHistory) {
      queryHistory.value = JSON.parse(storedHistory)
    }
    if (storedSnippets) {
      customSnippets.value = JSON.parse(storedSnippets)
    }
    
    console.log('✓ 已从 localStorage 加载 MySQL 配置')
  } catch (error) {
    console.error('Failed to load connections:', error)
  }
}
```

## 对比

### 当前实现（通用文件 API）

**优点：**
- ✅ 复用通用接口，不需要额外代码
- ✅ 灵活性高，可以保存任意文件
- ✅ 维护成本低

**代码：**
```javascript
await window.electronAPI.writeFile('mysql-config.json', data)
await window.electronAPI.readFile('mysql-config.json')
```

### 专用接口方式

**优点：**
- ✅ 语义更清晰（saveConfig/loadConfig）
- ✅ 与 SSH 工具保持一致
- ✅ 业务逻辑封装在主进程

**代码：**
```javascript
await window.electron.mysql.saveConfig(data)
await window.electron.mysql.loadConfig()
```

## 建议

**保持当前实现即可**，因为：

1. 两种方式都保存到 `appData/` 目录
2. 通用文件 API 更灵活，适合更多场景
3. 功能完全相同，只是接口封装不同
4. SSH 的专用接口是历史原因，不一定是最佳实践

如果未来需要为 MySQL 添加更复杂的主进程逻辑（比如密码加密），再改为专用接口也不迟。

