# 🚀 Neon Tools - 霓虹工具集

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?logo=electron)
![Vue](https://img.shields.io/badge/Vue-3.5.13-4FC08D?logo=vue.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一款功能强大的桌面工具集，采用 Electron + Vue3 + TypeScript 构建  
集成截图、SSH、剪贴板历史、知识库等40+实用工具

[English](./README_EN.md) | 简体中文

</div>

---

## ✨ 特性

- 🎨 **霓虹赛博风格** - 独特的视觉设计，科技感十足
- ⚡ **性能优化** - 经过深度优化，流畅运行
- 🔧 **40+工具** - 覆盖开发、办公、娱乐等多场景
- 💾 **本地存储** - 数据保存在本地，隐私安全
- 🔑 **快捷键支持** - 高效的键盘操作
- 🌙 **深色主题** - 护眼舒适的视觉体验

---

## 📦 核心功能

### 🖼️ 截图工具
- **快捷截图** (`Ctrl+Shift+X`) - 区域选择 + 标注工具
- **截图历史** - 自动保存，随时查看
- **置顶显示** - 截图可置顶在屏幕上参考
- **标注功能** - 箭头、矩形、文字、马赛克等

### 🔐 SSH客户端
- **连接管理** - 保存常用服务器配置
- **密钥认证** - 支持密码和私钥登录
- **多标签支持** - 同时连接多个服务器
- **命令历史** - 记录执行过的命令
- **快捷命令** - 自定义常用命令模板

### 📋 剪贴板历史
- **自动记录** - 监控并保存剪贴板内容
- **快速搜索** - 模糊搜索历史记录
- **一键复用** - 点击即可重新复制
- **富文本支持** - 支持文本和图片

### 📚 知识库管理
- **Markdown编辑** - 实时预览，所见即所得
- **分类管理** - 支持分类和标签
- **本地存储** - 数据保存在本地
- **全文搜索** - 快速查找知识点

### 🛠️ 开发工具

#### 编解码工具
- Base64 编解码
- URL 编解码
- Unicode 转换
- HTML 编解码

#### 格式化工具
- JSON 格式化 / 压缩
- SQL 格式化
- XML / YAML 互转

#### 加密工具
- MD5 / SHA1 / SHA256 哈希
- AES / DES 加密解密
- JWT 编解码

#### 生成工具
- UUID 生成器
- 随机密码生成
- 二维码生成器
- 占位图生成

### 🌐 网络工具
- HTTP 客户端 (类 Postman)
- IP 地址查询
- 端口扫描
- Ping / Traceroute

### 📊 其他工具
- 时间戳转换
- 正则表达式测试
- 文本差异对比
- Cron 表达式生成
- 进制转换
- Maven 依赖搜索
- JSON 转 Java 类
- 异常堆栈解析

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev:electron
```

### 打包应用

```bash
# 打包 Windows 版本
npm run build:win

# 打包后的文件在 release-new 目录
```

---

## 📸 功能截图

### 主界面
> 霓虹风格的主界面，工具分类清晰

### 截图工具
> 支持区域选择、标注、置顶显示

### SSH客户端
> 完整的SSH终端，支持多标签

### 知识库
> Markdown编辑器，支持实时预览

---

## ⌨️ 快捷键

| 功能 | 快捷键 | 说明 |
|------|--------|------|
| 快速截图 | `Ctrl+Shift+X` | 启动截图工具 |
| 取消截图 | `ESC` | 取消当前截图 |
| 复制内容 | `Ctrl+C` | 复制选中内容 |
| 粘贴内容 | `Ctrl+V` | 粘贴剪贴板内容 |

---

## 📁 项目结构

```
neon-tools/
├── electron-main.cjs          # Electron 主进程
├── electron-preload.cjs       # Preload 脚本
├── src/
│   ├── pages/                 # 页面组件
│   │   ├── Home/             # 首页
│   │   └── tools/            # 工具页面
│   ├── components/           # 公共组件
│   ├── stores/               # 状态管理
│   ├── router/               # 路由配置
│   └── styles/               # 样式文件
├── build/                    # 构建资源
│   └── icon.ico              # 应用图标
├── appData/                  # 用户数据目录
│   ├── screenshots/          # 截图文件
│   └── knowledge-docs/       # 知识库文档
└── package.json              # 项目配置
```

---

## 🔧 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Element Plus** - Vue3 组件库
- **UnoCSS** - 原子化 CSS 引擎
- **Vue Router** - 路由管理
- **Pinia** - 状态管理

### 桌面端
- **Electron** - 跨平台桌面应用框架
- **electron-screenshots** - 截图功能
- **ssh2** - SSH 连接

### 构建工具
- **Vite** - 新一代前端构建工具
- **electron-builder** - Electron 打包工具

---

## 📦 打包说明

### Windows 打包

应用会自动将数据保存在安装目录下的 `appData` 文件夹中：

```
安装目录/
├── 牛马工具集.exe
└── appData/
    ├── screenshots/          # 截图文件
    ├── knowledge-docs/       # 知识库文档
    ├── ssh-history.json      # SSH 连接历史
    └── ...
```

### 安装包特性

- ✅ 支持安装版和便携版
- ✅ 自动关联文件类型
- ✅ 开机自启动（可选）
- ✅ 自动检查更新

---

## 🛠️ 开发指南

### 添加新工具

1. 在 `src/pages/tools/` 创建新目录
2. 创建 `Index.vue` 组件
3. 在 `src/router/index.ts` 添加路由
4. 在首页添加入口卡片

### 调试技巧

```bash
# 查看主进程日志
# 在终端查看输出

# 查看渲染进程日志
# 按 Ctrl+Shift+I 打开开发者工具
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献步骤

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📝 更新日志

### v1.0.0 (2025-10-31)

**新功能**
- ✨ 完整的截图工具，支持区域选择和标注
- ✨ SSH 客户端，支持密钥认证
- ✨ 剪贴板历史记录
- ✨ 知识库管理系统
- ✨ 40+ 开发工具集成

**优化**
- ⚡ 性能优化，减少内存占用
- 🎨 优化界面动画和交互
- 🐛 修复已知问题

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

---

## 👨‍💻 作者

**luojiawei**

- GitHub: [@luojiaweiTW](https://github.com/luojiaweiTW)

---

## 🙏 鸣谢

感谢以下开源项目：

- [Electron](https://www.electronjs.org/)
- [Vue.js](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [electron-screenshots](https://github.com/nashaofu/electron-screenshots)
- [UnoCSS](https://unocss.dev/)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ 吧！**

Made with ❤️ by luojiawei

</div>
