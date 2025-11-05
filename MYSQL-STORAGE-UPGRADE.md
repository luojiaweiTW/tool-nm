# MySQL 工具存储升级说明

## 📋 更新内容

### ✨ 核心改进

将 MySQL 工具的数据存储从 **localStorage** 升级到 **Electron 文件系统**，提供更可靠的数据持久化方案。

### 🎯 存储内容

现在所有 MySQL 相关数据都统一保存在一个文件中：

- **连接配置**：主机、端口、用户名、密码、数据库名
- **查询历史**：最近 20 条 SQL 查询记录
- **自定义 SQL 片段**：用户保存的常用 SQL 模板

### 📂 存储位置

#### Electron 桌面版

数据保存在用户数据目录的 `mysql-config.json` 文件中：

- **Windows**: `%APPDATA%\IWork\mysql-config.json`
  - 例如：`C:\Users\YourName\AppData\Roaming\IWork\mysql-config.json`
- **macOS**: `~/Library/Application Support/IWork/mysql-config.json`
- **Linux**: `~/.config/IWork/mysql-config.json`

#### Web 版本

- 自动降级到 `localStorage`
- 保持向后兼容

### 🔄 数据迁移

首次使用新版本时，系统会自动：

1. 检查 `mysql-config.json` 是否存在
2. 如果不存在，尝试从 localStorage 读取旧数据
3. 将旧数据迁移到文件系统
4. 保留 localStorage 数据作为备份

### 🌟 功能特性

#### 1. 智能存储策略

```javascript
// 优先使用文件系统（Electron）
if (window.electronAPI) {
  await window.electronAPI.writeFile('mysql-config.json', data)
} else {
  // 降级到 localStorage（Web）
  localStorage.setItem('mysql-connections', data)
}
```

#### 2. 统一数据结构

```json
{
  "connections": [
    {
      "name": "生产数据库",
      "host": "localhost",
      "port": 3306,
      "username": "root",
      "password": "******",
      "database": "my_database"
    }
  ],
  "queryHistory": [
    "SELECT * FROM users LIMIT 10;",
    "SHOW TABLES;"
  ],
  "customSnippets": [
    {
      "id": "custom_1234567890",
      "name": "查询用户统计",
      "description": "按日期统计用户注册数",
      "sql": "SELECT DATE(created_at), COUNT(*) FROM users GROUP BY DATE(created_at);"
    }
  ]
}
```

#### 3. 自动保存

所有数据变更都会自动保存：

- ✅ 新建/编辑/删除连接
- ✅ 执行 SQL 查询（保存到历史）
- ✅ 新建/编辑/删除 SQL 片段
- ✅ 清空查询历史

#### 4. 启动时自动加载

```javascript
onMounted(async () => {
  await loadConnectionsFromStorage()
  console.log('MySQL 工具初始化完成')
})
```

控制台会输出加载信息：

```
✓ 已从文件加载 MySQL 配置
  - 连接: 3 个
  - 查询历史: 15 条
  - 自定义SQL: 5 个
```

### 🛡️ 数据安全

#### 1. 错误处理

- 文件读写失败时自动降级到 localStorage
- 所有操作都有 try-catch 保护
- 错误会在控制台输出详细日志

#### 2. 数据备份

建议定期备份 `mysql-config.json` 文件：

```bash
# Windows PowerShell
Copy-Item "$env:APPDATA\IWork\mysql-config.json" "backup-mysql-config-$(Get-Date -Format 'yyyy-MM-dd').json"

# macOS/Linux
cp ~/Library/Application\ Support/IWork/mysql-config.json ~/Desktop/backup-mysql-config-$(date +%Y-%m-%d).json
```

#### 3. 密码安全

⚠️ **注意**：连接配置中的密码以明文形式存储在文件中。建议：

- 不要在公共电脑上保存密码
- 定期更换数据库密码
- 使用文件系统权限保护配置文件

### 🧪 测试验证

运行测试脚本验证功能：

```bash
node test-mysql-storage.mjs
```

测试内容：

1. ✅ 页面加载
2. ✅ 创建新连接
3. ✅ 数据持久化
4. ✅ 连接列表显示
5. ✅ 查询历史记录
6. ✅ 自定义 SQL 片段

### 📊 使用指南

#### 1. 保存连接

1. 点击 **"新建连接"** 按钮
2. 填写连接信息（名称、主机、端口、用户名、密码）
3. 点击 **"仅保存"** - 只保存配置，不立即连接
4. 或点击 **"保存并连接"** - 保存并立即连接数据库

#### 2. 管理连接

1. 点击 **"连接管理"** 按钮
2. 查看所有已保存的连接
3. 可以：
   - **连接** - 使用该配置连接数据库
   - **编辑** - 修改连接配置
   - **删除** - 删除连接配置

#### 3. 查询历史

- 左侧边栏自动显示最近 20 条查询记录
- 点击历史记录可快速复用查询语句
- 点击 **"清空"** 按钮删除所有历史记录

#### 4. 自定义 SQL 片段

1. 在 "SQL语句库" 区域点击 ➕ 按钮
2. 填写名称、说明、SQL 语句
3. 点击 **"保存"**
4. 后续可以点击片段快速加载 SQL

### 🔍 故障排查

#### 问题1：数据没有保存

**检查项：**

1. 打开浏览器控制台（F12）
2. 查看是否有错误日志
3. 确认是否在 Electron 桌面版中运行
4. 检查 `%APPDATA%\IWork\` 目录是否有写入权限

**解决方案：**

```bash
# Windows - 检查文件是否存在
dir %APPDATA%\IWork\mysql-config.json

# 如果文件不存在，手动创建目录
mkdir %APPDATA%\IWork
```

#### 问题2：升级后数据丢失

**原因：** 可能是从旧版本升级时迁移失败

**解决方案：**

1. 打开浏览器控制台
2. 运行以下代码手动迁移：

```javascript
// 查看 localStorage 中是否有旧数据
console.log('连接:', localStorage.getItem('mysql-connections'))
console.log('历史:', localStorage.getItem('mysql-query-history'))
console.log('片段:', localStorage.getItem('mysql-sql-snippets'))

// 如果有数据，刷新页面触发自动迁移
location.reload()
```

#### 问题3：文件损坏

**症状：** 启动时报错 "Failed to load connections"

**解决方案：**

1. 备份现有文件（如果存在）
2. 删除损坏的 `mysql-config.json`
3. 重启应用，会创建新文件
4. 手动重新添加连接

### 🎉 功能演示

#### 测试结果

```
======================================================================
📊 MySQL 存储功能测试结果
======================================================================
✅ 页面加载: 正常
✅ 连接管理: 1 个连接
✅ 数据持久化: 已实现文件存储
✅ 兼容性: 支持 Electron 文件存储 + localStorage 降级

💡 功能特点:
   1. 优先使用 Electron 文件系统存储（mysql-config.json）
   2. 自动从 localStorage 迁移旧数据
   3. Web 版本自动降级到 localStorage
   4. 统一存储: 连接、历史、SQL片段
======================================================================
```

### 🔮 未来计划

- [ ] 连接配置密码加密
- [ ] 导出/导入连接配置
- [ ] 多环境配置支持（开发/测试/生产）
- [ ] 连接配置云同步
- [ ] 查询历史搜索和分类

### 📝 技术细节

#### 文件操作 API

使用 Electron IPC 进行文件读写：

```javascript
// 写入文件
await window.electronAPI.writeFile('mysql-config.json', JSON.stringify(data, null, 2))

// 读取文件
const result = await window.electronAPI.readFile('mysql-config.json')
const data = JSON.parse(result.data)

// 检查文件是否存在
const exists = await window.electronAPI.fileExists('mysql-config.json')
```

#### 数据结构设计

```typescript
interface MySQLConfig {
  name?: string
  host: string
  port: number
  username: string
  password: string
  database?: string
}

interface SqlSnippet {
  id: string
  name: string
  description?: string
  sql: string
  icon?: string
  builtin?: boolean
}

interface MySQLStorageData {
  connections: MySQLConfig[]
  queryHistory: string[]
  customSnippets: SqlSnippet[]
}
```

### 📞 支持

如有问题，请：

1. 查看控制台日志（F12）
2. 检查配置文件位置和权限
3. 运行测试脚本诊断问题
4. 提交 Issue 并附上错误日志

---

**版本**: v2.0
**更新日期**: 2025-11-05
**作者**: Neon Tools Team

