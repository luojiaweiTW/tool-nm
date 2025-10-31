# Neon Tools - 霓虹工具集

一个基于 Vue 3 + TypeScript 的桌面端工具集合应用，采用 **Pop Art × Vaporwave/Synthwave** 霓虹海报风格设计。

---

## 📚 文档导航

- **[使用介绍文档.md](./使用介绍文档.md)** - 功能介绍、使用指南、常见问题
- **[开发文档.md](./开发文档.md)** - 开发指南、构建部署、技术架构

---

## ✨ 特性

- 🎨 **霓虹风格设计**：高饱和度霓虹色、外发光效果、厚描边、网点质感
- 🛠️ **22个实用工具**：涵盖文本处理、编码加密、开发调试、网络工具等
- ⚡ **高性能**：路由懒加载、组件按需导入、代码分块
- 🎯 **用户友好**：快捷键支持、状态持久化、实时反馈
- 📱 **响应式布局**：适配不同屏幕尺寸
- 🖥️ **双端支持**：Web版 + Electron桌面版

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 20.x
- npm ≥ 10.x

### 安装依赖

```bash
cd neon-tools
npm install
```

### 启动应用

**Web 开发模式**：
```bash
npm run dev
```
访问：`http://localhost:5173`

**Electron 桌面模式**：
```bash
npm run dev:electron
```

### 生产构建

**Web 版本**：
```bash
npm run build
```

**Electron 桌面应用**：
```bash
npm run build:electron
```

**快速测试构建**（推荐）：
```bash
npm run build:dir
```

---

## 🛠️ 工具分类

### 📝 文本处理（5个）
JSON 格式化、XML/YAML 转换、SQL 格式化、文本对比、正则表达式

### 🔐 编码加密（5个）
Base64 编解码、URL 编码、哈希计算、加密解密、Unicode 转换

### 🔑 认证安全（1个）
JWT 解析

### ⏰ 时间调度（2个）
时间戳转换、Cron 表达式

### 🔧 开发工具（4个）
UUID 生成、随机数据生成、进制转换、二维码生成

### 💻 Java 工具（3个）
JSON 转 Java、异常堆栈分析、Maven 依赖查询

### 🌐 网络工具（2个）
HTTP 测试、SSH 连接

**详细功能介绍请查看 [使用介绍文档.md](./使用介绍文档.md)**

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + B` | 折叠/展开侧栏 |
| `Ctrl + K` | 聚焦全局搜索 |
| `Ctrl + F` | 聚焦当前工具输入框 |
| `Ctrl + Shift + C` | 复制结果到剪贴板 |
| `Ctrl + Shift + N` | 显示/隐藏窗口（桌面版） |

---

## 📦 技术栈

- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite 7** - 极速构建工具
- **Electron 38** - 跨平台桌面应用框架
- **Element Plus** - 组件库
- **UnoCSS** - 原子化 CSS 引擎
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

---

## 📖 了解更多

- **使用教程**：查看 [使用介绍文档.md](./使用介绍文档.md)
- **开发指南**：查看 [开发文档.md](./开发文档.md)

---

## 📄 许可证

MIT License

---

**Created with 💙 by AI Assistant**
