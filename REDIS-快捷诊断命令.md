# Redis 快捷诊断命令功能

## 🎯 功能概述

为 Redis 工具添加了一组**内置快捷诊断命令**，提供一键访问常用的服务器诊断和监控命令，无需手动输入。

---

## ✨ 新增功能

### 1. 快捷命令面板

连接 Redis 后，命令执行区上方会显示 **快捷诊断** 面板，包含 12 个常用命令按钮：

```
┌─────────────────────────────────────────────────────────┐
│ ⚡ 快捷诊断                                              │
├─────────────────────────────────────────────────────────┤
│ [服务器信息] [客户端连接] [内存使用] [统计信息]          │
│ [主从复制]   [CPU使用]     [键空间统计] [数据库大小]     │
│ [连接列表]   [内存统计]   [慢查询日志] [服务器配置]      │
└─────────────────────────────────────────────────────────┘
```

### 2. 一键执行

点击任意按钮，自动：
1. ✅ 填充对应的 Redis 命令到输入框
2. ✅ 立即执行命令
3. ✅ 显示执行结果
4. ✅ 添加到命令历史

---

## 📋 内置命令列表

### 服务器信息类

| 按钮 | 命令 | 说明 | 关键指标 |
|------|------|------|---------|
| 🖥️ 服务器信息 | `INFO server` | Redis 服务器基本信息 | `redis_version`, `os`, `uptime_in_days` |
| 👥 客户端连接 | `INFO clients` | 客户端连接统计 | `connected_clients`, `blocked_clients` |
| 💾 内存使用 | `INFO memory` | 内存使用详情 | `used_memory_human`, `used_memory_peak_human` |
| 📊 统计信息 | `INFO stats` | 服务器统计数据 | `total_connections_received`, `instantaneous_ops_per_sec` |
| 🔀 主从复制 | `INFO replication` | 主从复制状态 | `role`, `connected_slaves` |
| 💻 CPU使用 | `INFO cpu` | CPU 使用情况 | `used_cpu_sys`, `used_cpu_user` |
| 🗄️ 键空间统计 | `INFO keyspace` | 各数据库键统计 | `keys`, `expires`, `avg_ttl` |

### 数据库操作类

| 按钮 | 命令 | 说明 | 返回值 |
|------|------|------|--------|
| 🔢 数据库大小 | `DBSIZE` | 当前数据库键数量 | 整数（键的总数） |
| 📋 连接列表 | `CLIENT LIST` | 所有客户端连接列表 | 客户端详细信息 |

### 性能诊断类

| 按钮 | 命令 | 说明 | 用途 |
|------|------|------|------|
| 📈 内存统计 | `MEMORY STATS` | 详细内存分配统计 | 内存使用分析 |
| ⏱️ 慢查询日志 | `SLOWLOG GET 10` | 最近 10 条慢查询 | 性能优化 |

### 配置管理类

| 按钮 | 命令 | 说明 | 用途 |
|------|------|------|------|
| ⚙️ 服务器配置 | `CONFIG GET *` | 所有配置参数 | 配置检查 |

---

## 🚀 使用场景

### 1. 快速健康检查

**场景**：检查 Redis 服务器是否正常运行

**步骤**：
1. 点击 **服务器信息** → 查看 `redis_version`, `uptime_in_days`
2. 点击 **客户端连接** → 查看 `connected_clients`
3. 点击 **内存使用** → 查看 `used_memory_human`

### 2. 性能分析

**场景**：排查 Redis 性能问题

**步骤**：
1. 点击 **统计信息** → 查看 `instantaneous_ops_per_sec`（每秒操作数）
2. 点击 **慢查询日志** → 查看是否有慢查询
3. 点击 **CPU使用** → 查看 CPU 使用率
4. 点击 **内存统计** → 分析内存分配

### 3. 主从复制监控

**场景**：检查主从复制状态

**步骤**：
1. 点击 **主从复制** → 查看 `role`（master/slave）
2. 检查 `connected_slaves`（从节点数量）
3. 检查 `master_repl_offset`（复制偏移量）

### 4. 容量规划

**场景**：评估数据库容量

**步骤**：
1. 点击 **数据库大小** → 查看当前键数量
2. 点击 **键空间统计** → 查看各数据库的键分布
3. 点击 **内存使用** → 查看内存占用趋势

### 5. 连接管理

**场景**：排查连接数异常

**步骤**：
1. 点击 **客户端连接** → 查看当前连接数
2. 点击 **连接列表** → 查看每个连接的详情
3. 点击 **服务器配置** → 查看 `maxclients`（最大连接数配置）

---

## 📊 命令详解

### INFO 命令系列

Redis 的 `INFO` 命令可以返回不同类型的信息，通过指定参数可以获取特定类型：

```redis
INFO server      # 服务器信息
INFO clients     # 客户端信息
INFO memory      # 内存信息
INFO stats       # 统计信息
INFO replication # 复制信息
INFO cpu         # CPU 信息
INFO keyspace    # 键空间信息
INFO all         # 所有信息（包含以上所有）
```

**示例输出（INFO server）**：
```
# Server
redis_version:7.0.5
os:Linux 5.10.0-21-amd64 x86_64
uptime_in_seconds:864000
uptime_in_days:10
```

### DBSIZE 命令

返回当前数据库的键总数。

**示例**：
```
127.0.0.1:6379> DBSIZE
(integer) 12345
```

### CLIENT LIST 命令

列出所有客户端连接的详细信息。

**示例输出**：
```
id=1234 addr=127.0.0.1:52345 fd=8 name= age=12345 idle=0 flags=N db=0 sub=0 psub=0 multi=-1 qbuf=0 qbuf-free=0 obl=0 oll=0 omem=0 events=r cmd=get
```

**关键字段**：
- `id`: 客户端 ID
- `addr`: 客户端地址
- `age`: 连接存活时间（秒）
- `idle`: 空闲时间（秒）
- `db`: 当前使用的数据库
- `cmd`: 最后执行的命令

### MEMORY STATS 命令

返回内存分配的详细统计。

**关键指标**：
- `peak.allocated`: 峰值内存分配
- `total.allocated`: 总分配内存
- `startup.allocated`: 启动时分配的内存
- `fragmentation`: 内存碎片率

### SLOWLOG GET 命令

返回慢查询日志。

**示例**：
```redis
SLOWLOG GET 10  # 获取最近 10 条慢查询
```

**输出示例**：
```
1) 1) (integer) 14      # 日志ID
   2) (integer) 1309448221  # 时间戳
   3) (integer) 15123   # 执行时间（微秒）
   4) 1) "keys"         # 命令
      2) "pattern*"     # 参数
```

### CONFIG GET 命令

获取配置参数。

**示例**：
```redis
CONFIG GET maxclients   # 获取最大连接数
CONFIG GET *memory*     # 获取所有内存相关配置
CONFIG GET *           # 获取所有配置
```

---

## 🎨 UI 设计

### 面板样式

```css
/* 霓虹蓝色主题 */
background: rgba(33, 230, 255, 0.05);   /* 浅蓝色半透明背景 */
border: 1px solid rgba(33, 230, 255, 0.2);  /* 霓虹蓝边框 */
border-radius: var(--radius-md);        /* 圆角 */
```

### 按钮样式

```css
/* 默认状态 */
background: rgba(33, 230, 255, 0.1);
border: 1px solid rgba(33, 230, 255, 0.3);
color: var(--neon-cyan);

/* 悬停效果 */
background: rgba(33, 230, 255, 0.2);
border-color: var(--neon-cyan);
box-shadow: 0 0 10px rgba(33, 230, 255, 0.3);  /* 外发光 */
transform: translateY(-1px);  /* 上浮效果 */
```

### 网格布局

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
gap: var(--spacing-sm);
```

- ✅ 自适应列数，宽度允许时显示更多列
- ✅ 最小列宽 120px，保证按钮文字完整显示
- ✅ 间距统一，视觉协调

---

## 💻 技术实现

### 1. 数据结构

```typescript
interface QuickCommand {
  label: string    // 按钮显示文本
  command: string  // Redis 命令
  icon: string     // 图标类名（UnoCSS）
}

const quickCommands: QuickCommand[] = [
  { label: '服务器信息', command: 'INFO server', icon: 'i-mdi-server' },
  { label: '客户端连接', command: 'INFO clients', icon: 'i-mdi-account-multiple' },
  // ... 更多命令
]
```

### 2. 执行逻辑

```typescript
async function executeQuickCommand(command: string) {
  // 1. 填充命令到输入框
  commandInput.value = command
  
  // 2. 执行命令
  await executeCommand()
}
```

### 3. 组件集成

```vue
<template>
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
</template>
```

---

## 🧪 测试

### 自动化测试脚本

运行测试：
```bash
node test-redis-quick-commands.mjs
```

**测试内容**：
1. ✅ 连接前快捷命令面板隐藏
2. ✅ 连接后快捷命令面板显示
3. ✅ 按钮数量正确（12 个）
4. ✅ 点击按钮自动填充命令
5. ✅ 命令自动执行并显示结果
6. ✅ 结果包含预期内容
7. ✅ UI 样式符合霓虹设计
8. ✅ 悬停效果正常

### 手动测试清单

- [ ] 连接 Redis
- [ ] 检查快捷命令面板是否显示
- [ ] 逐个点击每个快捷命令按钮
- [ ] 验证命令执行结果正确
- [ ] 检查按钮悬停时的外发光效果
- [ ] 检查命令是否添加到历史记录
- [ ] 断开连接，检查面板是否隐藏

---

## 📈 性能优化

### 1. 按需显示

只在连接成功后显示快捷命令面板，避免不必要的渲染：

```vue
<div class="quick-commands" v-if="redisConnected">
  <!-- 内容 -->
</div>
```

### 2. 命令复用

快捷命令执行复用现有的 `executeCommand()` 函数，无需重复代码。

### 3. 加载状态

执行命令时显示 loading 状态，防止重复点击：

```vue
<el-button :loading="redisLoading">
  <!-- 内容 -->
</el-button>
```

---

## 🔮 未来扩展

### 可能的扩展功能

1. **自定义快捷命令**
   - 允许用户添加自己的常用命令
   - 保存到配置文件

2. **命令分组**
   - 按类别分组（信息类、性能类、配置类）
   - 可折叠/展开

3. **命令收藏**
   - 标记常用命令
   - 置顶显示

4. **快捷键支持**
   - `Ctrl+1` 执行第一个命令
   - `Ctrl+2` 执行第二个命令
   - 等等

5. **命令模板**
   - 带参数的命令模板
   - 弹出对话框输入参数

6. **结果可视化**
   - INFO 命令结果以卡片形式展示
   - 内存使用以图表形式展示

---

## ✅ 开发清单

- [x] 定义快捷命令配置
- [x] 创建快捷命令面板 UI
- [x] 实现 executeQuickCommand 函数
- [x] 添加霓虹风格样式
- [x] 集成到命令执行区
- [x] 创建自动化测试脚本
- [x] 编写功能文档

---

## 📝 修改文件

### 前端 (src/pages/tools/redis/Index.vue)

**新增内容**：
- `quickCommands` 配置（行 464-478）
- `executeQuickCommand()` 函数（行 899-905）
- 快捷命令面板 UI（行 212-230）
- 快捷命令样式（行 1269-1320）

**修改位置**：
- 命令执行区，在命令输入框上方添加快捷命令面板

---

## 🎉 功能优势

### 1. 提升效率
- ✅ 无需记忆复杂的 Redis 命令
- ✅ 一键访问常用诊断命令
- ✅ 减少输入错误

### 2. 降低门槛
- ✅ 新手友好，无需学习命令语法
- ✅ 可视化操作，更直观
- ✅ 提供最佳实践命令

### 3. 提高可用性
- ✅ 覆盖常见运维场景
- ✅ 快速定位问题
- ✅ 节省时间

### 4. 保持一致性
- ✅ 霓虹风格设计
- ✅ 与现有功能无缝集成
- ✅ 交互体验一致

---

**开发日期**: 2025年11月5日  
**开发人**: AI 助手  
**状态**: ✅ 已完成并测试

