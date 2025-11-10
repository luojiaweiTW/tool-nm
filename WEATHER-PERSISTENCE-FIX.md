# 天气查询工具 - 数据持久化问题修复报告

## 📋 问题描述

用户反馈：每次重启应用后，保存的 API Key 和选择的城市都会丢失。

## 🔍 问题分析

经过代码审查，发现天气组件在使用 `window.electronAPI.fileExists()` 时存在逻辑错误：

### 错误代码（3处）

```typescript
// ❌ 错误：fileExists 返回 boolean，但代码当作对象使用
const exists = await window.electronAPI.fileExists(CONFIG_FILE)
if (exists.exists) {  // 错误：undefined，导致条件永远为 false
  const result = await window.electronAPI.readFile(CONFIG_FILE)
  // ...
}
```

### 正确的使用方式

其他工具（Redis、MySQL、剪贴板历史、知识库等）都是正确使用的：

```typescript
// ✅ 正确：直接判断布尔值
const exists = await window.electronAPI.fileExists('config.json')
if (exists) {
  const result = await window.electronAPI.readFile('config.json')
  // ...
}
```

## 🔧 修复方案

### 1. 修复 `src/pages/tools/Weather/Index.vue` 中的 3 处错误

**修复位置 1：`loadConfig()` 函数（第 495 行）**
```diff
  const exists = await window.electronAPI.fileExists(CONFIG_FILE)
- if (exists.exists) {
+ if (exists) {
    const result = await window.electronAPI.readFile(CONFIG_FILE)
```

**修复位置 2：`saveConfig()` 函数（第 556 行）**
```diff
  const exists = await window.electronAPI.fileExists(CONFIG_FILE)
- if (exists.exists) {
+ if (exists) {
    const result = await window.electronAPI.readFile(CONFIG_FILE)
```

**修复位置 3：`watch(weatherSource)` 函数（第 663 行）**
```diff
  const exists = await window.electronAPI.fileExists(CONFIG_FILE)
- if (exists.exists) {
+ if (exists) {
    const result = await window.electronAPI.readFile(CONFIG_FILE)
```

### 2. 数据存储位置

根据项目规范，数据统一存储到 `appData/` 目录：

- **开发模式**：`项目根目录/appData/weather-config.json`
- **生产模式**：`安装目录/appData/weather-config.json`

### 3. 配置文件结构

```json
{
  "source": "qweather",
  "qweatherKey": "你的和风天气API Key",
  "seniverseKey": "你的心知天气API Key",
  "cities": [
    {
      "id": "101010100",
      "name": "北京",
      "country": "中国",
      "adm1": "北京",
      "lat": "39.90499",
      "lon": "116.40529"
    }
  ]
}
```

## ✅ 测试验证

### 自动化测试脚本

创建了完整的自动化测试脚本 `test-weather-persistence.mjs`：

**测试流程：**
1. ✅ 访问天气查询页面
2. ✅ 输入 API Key 并保存
3. ✅ 添加测试城市
4. ✅ 刷新页面
5. ✅ 验证 API Key 是否保留（配置对话框不弹出）
6. ✅ 验证城市列表是否保留

### 测试结果

```
======================================================================
📊 测试报告
======================================================================
测试结果:
  1. ✅ API Key 持久化
  2. ✅ 城市列表持久化

总结: ✅ 所有测试通过
======================================================================
```

**测试详情：**
- ✅ API Key 成功保存到文件
- ✅ 城市列表成功保存到文件
- ✅ 刷新页面后 API Key 自动加载
- ✅ 刷新页面后城市列表自动加载
- ✅ 配置对话框不再重复弹出

## 📊 影响范围

### 修改的文件
- `src/pages/tools/Weather/Index.vue` - 修复 3 处 fileExists 使用错误

### 新增的文件
- `test-weather-persistence.mjs` - 自动化测试脚本
- `WEATHER-PERSISTENCE-FIX.md` - 修复报告（本文件）

### 不需要修改的文件
- `electron-main.cjs` - 文件系统 IPC 处理器正常
- `electron-preload.cjs` - API 暴露正常
- 其他工具页面 - 使用方式正确，无需修改

## 🎯 修复效果

1. ✅ **API Key 持久化正常**：配置一次后永久生效
2. ✅ **城市列表持久化正常**：添加的城市重启后仍然存在
3. ✅ **多天气源支持**：和风天气和心知天气的 Key 分别保存
4. ✅ **配置体验改善**：不再重复弹出配置对话框

## 📝 代码规范总结

### ✅ 正确的文件持久化方式

```typescript
// 1. 定义配置文件名
const CONFIG_FILE = 'tool-config.json'

// 2. 保存数据
async function saveConfig() {
  if (window.electronAPI) {
    const config = {
      key: 'value',
      data: myData.value
    }
    const result = await window.electronAPI.writeFile(
      CONFIG_FILE,
      JSON.stringify(config, null, 2)
    )
    if (result.success) {
      console.log('✓ 配置已保存')
    }
  }
}

// 3. 加载数据
async function loadConfig() {
  if (window.electronAPI) {
    const exists = await window.electronAPI.fileExists(CONFIG_FILE)
    if (exists) {  // ⚠️ 直接判断布尔值
      const result = await window.electronAPI.readFile(CONFIG_FILE)
      if (result.success && result.data) {
        const config = JSON.parse(result.data)
        myData.value = config.data
        console.log('✓ 配置已加载')
      }
    }
  }
}

// 4. 组件挂载时加载
onMounted(async () => {
  await loadConfig()
})

// 5. 数据变化时自动保存
watch(myData, () => {
  saveConfig()
}, { deep: true })
```

### ❌ 常见错误

```typescript
// ❌ 错误 1：将 boolean 当作对象
const exists = await window.electronAPI.fileExists('file.json')
if (exists.exists) { ... }  // undefined

// ❌ 错误 2：返回格式错误
ipcMain.handle('file-exists', () => {
  return { exists: true }  // 应该直接返回 boolean
})

// ❌ 错误 3：使用 localStorage（不推荐）
localStorage.setItem('config', JSON.stringify(config))  // 应该使用文件系统
```

## 🚀 验证方法

### 手动测试步骤

1. 打开天气查询工具
2. 配置 API Key（和风天气或心知天气）
3. 添加一个或多个城市
4. 关闭应用并重新打开
5. 验证：
   - ✅ 配置对话框不应弹出
   - ✅ 城市列表应该完整保留
   - ✅ 可以正常查看天气数据

### 自动化测试

```bash
# 确保开发服务器正在运行
npm run dev

# 在新终端运行测试
node test-weather-persistence.mjs
```

## 📌 相关文档

### Electron 文件系统 API

**位置**：`electron-main.cjs`

```javascript
// 文件存在检查
ipcMain.handle('file-exists', async (_event, relativePath) => {
  const absolutePath = path.join(getDataPath(), relativePath)
  await fs.promises.access(absolutePath)
  return true  // ⚠️ 返回 boolean
})

// 读取文件
ipcMain.handle('read-file', async (_event, relativePath) => {
  const absolutePath = path.join(getDataPath(), relativePath)
  const content = await fs.promises.readFile(absolutePath, 'utf-8')
  return { success: true, data: content }
})

// 写入文件
ipcMain.handle('write-file', async (_event, relativePath, content) => {
  const absolutePath = path.join(getDataPath(), relativePath)
  // 确保目录存在
  const dir = path.dirname(absolutePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  await fs.promises.writeFile(absolutePath, content, 'utf-8')
  return { success: true }
})
```

### 数据存储目录结构

```
appData/
├── weather-config.json       # ✅ 新修复：天气配置
├── ssh-history.json          # SSH 连接历史
├── mysql-config.json         # MySQL 配置
├── redis-config.json         # Redis 配置
├── http-history.json         # HTTP 请求历史
├── clipboard-history.json    # 剪贴板历史
├── knowledge-index.json      # 知识库索引
├── screenshots/              # 截图文件夹
└── ...
```

## 🎉 总结

**问题根因**：将 `fileExists()` 返回的 `boolean` 错误地当作对象使用（`exists.exists`），导致条件永远为 `false`，文件永远无法读取。

**修复方案**：修正 3 处判断逻辑，从 `if (exists.exists)` 改为 `if (exists)`。

**测试结果**：✅ 所有测试通过，API Key 和城市列表持久化正常。

**影响**：✅ 用户配置一次后永久生效，不再丢失数据。

---

**修复日期**：2025-11-06  
**测试状态**：✅ 通过  
**可以交付**：✅ 是

