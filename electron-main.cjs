const { app, BrowserWindow, Menu, globalShortcut, ipcMain, nativeImage, clipboard, screen, desktopCapturer, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')
const fs = require('fs')
const { Client } = require('ssh2')
const https = require('https')
const http = require('http')
const mysql = require('mysql2/promise')
// electron-screenshots 导入
const Screenshots = require('electron-screenshots')
console.log('📸 [Init] Screenshots module loaded:', typeof Screenshots)

// 判断是否为开发环境
const isDev = !app.isPackaged

// 🔧 根据Electron官方文档配置应用信息
// 参考：https://www.electronjs.org/docs/latest/api/app

// 1. 设置应用名称（显示在任务管理器和通知中心）
// 必须与package.json和electron-builder.json中的productName一致
app.setName('IWork')

// 2. 设置App User Model ID (Windows专用)
// 参考：https://www.electronjs.org/docs/latest/tutorial/windows-taskbar
// 用于Windows任务栏分组和通知，必须保持稳定不变
// 格式：CompanyName.ProductName.SubProduct.VersionInformation
const appId = 'com.iwork.app'
if (process.platform === 'win32') {
  app.setAppUserModelId(appId)
  // 强制设置进程标题，确保任务栏显示应用名
  process.title = 'IWork'
}
console.log('🔧 Product Name:', app.getName())
console.log('🔧 App User Model ID:', appId)
console.log('🔧 Is Development:', isDev)

let mainWindow = null
let sshProcess = null
let sshClient = null
let sshStream = null
let sftpClient = null
let isInterrupting = false  // 标志：是否正在发送中断信号（此时丢弃所有输出）

// MySQL 连接管理
let mysqlConnection = null  // MySQL 连接对象
let mysqlConfig = null      // MySQL 配置

// 剪贴板监听相关变量
let clipboardMonitorInterval = null
let lastClipboardText = ''
let isClipboardMonitoring = false

// 🔥 性能优化：输出限流机制（大幅降低CPU占用）
let outputBuffer = ''           // 输出缓冲区
let lastSendTime = 0            // 上次发送时间
let flushTimer = null           // 定时器：确保缓冲区最终会被清空
let droppedBytes = 0            // 统计丢弃的字节数
let dataEventCount = 0          // 统计收到的数据事件数
let samplingRate = 1            // 采样率：1=全部接收，2=每2个取1个，10=每10个取1个
const SEND_INTERVAL = 16        // ⚡ 性能优化：16ms = 60fps，从200ms改为16ms
const MAX_BUFFER_SIZE = 2048    // ⚡ 性能优化：减少到2KB，从5000减少
const FLUSH_TIMEOUT = 50        // ⚡ 性能优化：快速刷新，从300ms改为50ms

/**
 * 🔥 限流输出到前端 - 防止大量日志卡死 UI
 */
function throttledSendOutput(data) {
  // 如果正在中断，丢弃输出
  if (isInterrupting) {
    return
  }
  
  // 🔥 关键优化：采样！不是每个数据都接收
  dataEventCount++
  if (samplingRate > 1 && dataEventCount % samplingRate !== 0) {
    // 跳过这个数据包，采样丢弃
    droppedBytes += data.length
    return
  }
  
  // 添加到缓冲区
  outputBuffer += data
  
  // 检查缓冲区大小，超过限制就丢弃旧数据
  if (outputBuffer.length > MAX_BUFFER_SIZE) {
    const dropped = outputBuffer.length - MAX_BUFFER_SIZE
    droppedBytes += dropped
    
    // 🔥 动态调整采样率：如果频繁溢出，增加采样率（丢弃更多）
    if (samplingRate < 10) {
      samplingRate++
      console.log(`⚠️ Buffer overflow! Increasing sampling rate to ${samplingRate} (drop ${samplingRate-1}/${samplingRate})`)
    } else {
      console.log(`⚠️ Buffer overflow! Already at max sampling (total dropped: ${droppedBytes})`)
    }
    
    outputBuffer = outputBuffer.slice(-MAX_BUFFER_SIZE)  // 只保留最新的
  }
  
  const now = Date.now()
  const timeSinceLastSend = now - lastSendTime
  
  // 如果距离上次发送不足 SEND_INTERVAL，设置定时器等待
  if (timeSinceLastSend < SEND_INTERVAL && outputBuffer.length < MAX_BUFFER_SIZE) {
    // 设置定时器，确保最终会发送
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushOutputBuffer()
      }, FLUSH_TIMEOUT)
    }
    return
  }
  
  // 立即发送
  flushOutputBuffer()
}

/**
 * 🔥 定期降低采样率（如果数据流量减少）
 */
function decreaseSamplingRate() {
  if (samplingRate > 1) {
    samplingRate--
    console.log(`✓ Data flow decreased, reducing sampling rate to ${samplingRate}`)
  }
}

/**
 * 强制刷新输出缓冲区
 */
function flushOutputBuffer() {
  // 清除定时器
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  
  // 发送缓冲区内容到前端
  if (outputBuffer && mainWindow && !isInterrupting) {
    mainWindow.webContents.send('ssh:output', outputBuffer)
    outputBuffer = ''  // 清空缓冲区
    lastSendTime = Date.now()
    
    // 🔥 发送后尝试降低采样率（如果缓冲区没有持续溢出）
    if (samplingRate > 1) {
      setTimeout(decreaseSamplingRate, 2000)  // 2秒后降低采样率
    }
  }
}

/**
 * 获取数据存储目录（安装目录的 appData 文件夹）
 */
function getDataPath() {
  let basePath
  
  if (isDev) {
    // 开发模式：使用项目根目录
    basePath = __dirname
  } else {
    // 生产模式：使用安装目录（可执行文件所在目录）
    // 例如：C:\Users\用户名\AppData\Local\Programs\IWork
    basePath = path.dirname(process.execPath)
  }
  
  const dataPath = path.join(basePath, 'appData')
  
  // 确保目录存在
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
    console.log('✓ Created data directory:', dataPath)
  }
  
  console.log('📁 Data path:', dataPath)
  return dataPath
}

/**
 * 获取图标路径（支持多平台）
 * 参考：https://blog.csdn.net/m0_71071209/article/details/140386945
 */
function getIconPath() {
  const platform = process.platform
  
  if (isDev) {
    // 开发模式：使用项目根目录的 build/icon.ico
    const devIconPath = path.join(__dirname, 'build/icon.ico')
    console.log('🔍 [DEV] Icon path:', devIconPath)
    return devIconPath
  }
  
  // 🔧 生产模式：按优先级尝试多个路径
  const possiblePaths = [
    // 方案1：extraResources 配置的路径（推荐）
    path.join(process.resourcesPath, 'icon.ico'),
    
    // 方案2：asarUnpack 解包的路径
    path.join(process.resourcesPath, 'app.asar.unpacked', 'build', 'icon.ico'),
    
    // 方案3：备用路径（某些打包配置）
    path.join(__dirname, '../icon.ico'),
    path.join(__dirname, 'build/icon.ico'),
  ]
  
  // 遍历尝试所有可能的路径
  for (const iconPath of possiblePaths) {
    if (fs.existsSync(iconPath)) {
      console.log('✓ Icon found at:', iconPath)
      return iconPath
    } else {
      console.log('⚠️ Icon not found at:', iconPath)
    }
  }
  
  // 都找不到，使用第一个作为默认值（即使不存在）
  console.error('❌ Icon file not found in any location!')
  console.error('   Tried paths:', possiblePaths)
  return possiblePaths[0]
}

/**
 * 创建主窗口
 */
function createWindow() {
  const preloadPath = path.join(__dirname, 'electron-preload.cjs')
  const iconPath = getIconPath()
  
  console.log('Preload script path:', preloadPath)
  console.log('Preload script exists:', require('fs').existsSync(preloadPath))
  console.log('Icon path:', iconPath)
  console.log('Icon exists:', require('fs').existsSync(iconPath))
  
  // 🔧 加载图标（确保图标正确显示在任务栏）
  let appIcon = undefined
  try {
    if (fs.existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath)
      if (!appIcon.isEmpty()) {
        console.log('✓ Icon loaded successfully:', iconPath)
        console.log('  Icon size:', appIcon.getSize())
        console.log('  Icon aspect ratio:', appIcon.getAspectRatio())
      } else {
        console.error('❌ Icon is empty after loading')
        appIcon = undefined
      }
    } else {
      console.error('❌ Icon file not found:', iconPath)
    }
  } catch (error) {
    console.error('❌ Error loading icon:', error)
    appIcon = undefined
  }
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'IWork',  // 窗口标题（任务管理器显示）
    icon: appIcon,  // 窗口图标（任务栏和Alt+Tab显示）
    backgroundColor: '#0a0e27',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
      preload: preloadPath,
      webSecurity: false, // 🌤️ 禁用 web 安全以允许天气 API 请求
    },
    frame: true,
    show: false,
  })

  // 阻止页面更新窗口标题，确保任务栏名称固定为应用名
  mainWindow.on('page-title-updated', (event) => {
    event.preventDefault()
    if (!mainWindow.isDestroyed()) {
      mainWindow.setTitle('IWork')
    }
  })

  // 配置证书错误处理（仅用于开发测试）
  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    // 总是接受证书（不安全，仅用于开发）
    callback(0)
  })

  // 允许 desktopCapturer 访问（用于截图功能）
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    // 允许所有媒体权限请求（包括 desktopCapturer）
    if (permission === 'media' || permission === 'mediaKeySystem') {
      callback(true)
    } else {
      callback(false)
    }
  })

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    // 🔧 Windows特定配置（根据Electron官方文档）
    // 参考：https://www.electronjs.org/docs/latest/tutorial/windows-taskbar
    if (process.platform === 'win32') {
      // 设置窗口图标（影响任务栏、Alt+Tab、任务管理器）
      if (appIcon) {
        mainWindow.setIcon(appIcon)
        console.log('✓ Window icon set for Windows taskbar')
      }
      
      // 设置窗口标题（任务管理器显示）
      mainWindow.setTitle('IWork')
      
      // 可选：设置任务栏覆盖图标（用于显示状态，如通知数量）
      // mainWindow.setOverlayIcon(overlayIcon, 'Description')
    }
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    // ⚡ 性能优化：禁用自动打开DevTools（需要时按F12手动打开）
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // 窗口关闭时
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * 创建应用菜单
 */
function createMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) mainWindow.reload()
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          },
        },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '实际大小',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (mainWindow) mainWindow.webContents.setZoomLevel(0)
          },
        },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (mainWindow) {
              const level = mainWindow.webContents.getZoomLevel()
              mainWindow.webContents.setZoomLevel(level + 0.5)
            }
          },
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const level = mainWindow.webContents.getZoomLevel()
              mainWindow.webContents.setZoomLevel(level - 0.5)
            }
          },
        },
        { type: 'separator' },
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            if (mainWindow) {
              const isFullScreen = mainWindow.isFullScreen()
              mainWindow.setFullScreen(!isFullScreen)
            }
          },
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools()
          },
        },
      ],
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            if (mainWindow) mainWindow.minimize()
          },
        },
        {
          label: '最大化',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMaximized()) {
                mainWindow.unmaximize()
              } else {
                mainWindow.maximize()
              }
            }
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 IWork',
          click: () => {
            const { shell } = require('electron')
            shell.openExternal('https://github.com')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * 剪贴板监听功能
 */
function startClipboardMonitoring() {
  if (clipboardMonitorInterval) return
  
  console.log('✓ Starting clipboard monitoring...')
  isClipboardMonitoring = true
  lastClipboardText = clipboard.readText()
  
  clipboardMonitorInterval = setInterval(() => {
    if (!isClipboardMonitoring) return
    
    try {
      const currentText = clipboard.readText()
      
      // 只处理文本，且内容有变化时才发送
      if (currentText && currentText !== lastClipboardText && currentText.trim()) {
        lastClipboardText = currentText
        
        // 发送到渲染进程
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('clipboard-change', currentText)
        }
      }
    } catch (error) {
      console.error('Clipboard monitoring error:', error)
    }
  }, 500) // 每500ms检查一次
}

function stopClipboardMonitoring() {
  if (clipboardMonitorInterval) {
    console.log('✓ Stopping clipboard monitoring...')
    clearInterval(clipboardMonitorInterval)
    clipboardMonitorInterval = null
    isClipboardMonitoring = false
  }
}

// 处理剪贴板监听开关
ipcMain.on('clipboard-monitoring', (_event, enabled) => {
  console.log(`Clipboard monitoring ${enabled ? 'enabled' : 'disabled'}`)
  if (enabled) {
    startClipboardMonitoring()
  } else {
    stopClipboardMonitoring()
  }
})

// Screenshots 实例
let screenshots = null
// 截图状态标志：防止重复触发
let isCapturing = false
// 置顶窗口列表
const pinWindows = []

/**
 * 确保截图目录存在
 * 所有截图统一保存在 appData/screenshots 目录
 */
function ensureScreenshotDir() {
  const dataPath = getDataPath() // 返回 appData 目录
  const screenshotDir = path.join(dataPath, 'screenshots')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
    console.log('✓ [Screenshots] Created screenshot directory:', screenshotDir)
  }
  console.log('📸 [Screenshots] Using directory:', screenshotDir)
  return screenshotDir
}

/**
 * 保存截图到文件
 */
function saveScreenshotToFile(buffer, bounds) {
  try {
    const screenshotDir = ensureScreenshotDir()
    const timestamp = Date.now()
    const filename = `screenshot_${timestamp}.png`
    const filepath = path.join(screenshotDir, filename)
    
    fs.writeFileSync(filepath, buffer)
    console.log('✓ [Screenshots] Saved to:', filepath)
    
    return {
      filepath,
      filename,
      timestamp,
      bounds
    }
  } catch (error) {
    console.error('❌ [Screenshots] Save error:', error)
    return null
  }
}

/**
 * 创建置顶窗口（使用本地文件路径）
 */
function createPinWindow(imageData, bounds, filepath) {
  console.log('📌 [Pin Window] Creating pin window...')
  console.log('   filepath:', filepath)
  console.log('   file exists:', filepath ? fs.existsSync(filepath) : false)
  console.log('   bounds:', bounds)
  
  // 🔧 必须有有效的文件路径
  if (!filepath || !fs.existsSync(filepath)) {
    console.error('❌ [Pin Window] Invalid filepath:', filepath)
    return null
  }
  
  // 🔧 修复：获取正确的 preload 路径
  let preloadPath
  if (isDev) {
    preloadPath = path.join(__dirname, 'electron-preload.cjs')
  } else {
    // 生产环境：preload 在 app.asar 中，使用相对路径
    preloadPath = path.join(__dirname, 'electron-preload.cjs')
  }
  
  console.log('📌 [Pin Window] Preload path:', preloadPath)
  console.log('📌 [Pin Window] Preload exists:', fs.existsSync(preloadPath))
  
  // 🔧 获取应用图标
  const iconPath = getIconPath()
  let appIcon = undefined
  try {
    if (fs.existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath)
    }
  } catch (error) {
    console.error('❌ Error loading icon for pin window:', error)
  }

  const pinWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    title: 'IWork - 置顶截图',  // 🔧 设置窗口标题
    icon: appIcon,  // 🔧 设置窗口图标
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,  // 📌 显示在任务栏
    resizable: true,
    minimizable: true,   // 📌 允许最小化
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: false  // 📌 允许加载本地文件
    }
  })
  
  // 保存原始尺寸
  const originalWidth = bounds.width
  const originalHeight = bounds.height
  
  // ✅ 转换为 file:// URL（Windows 需要特殊处理）
  const fileUrl = filepath.replace(/\\/g, '/').replace(/^([A-Z]):/, (match, drive) => {
    return `file:///${drive}:`
  })
  
  console.log('📁 [Pin Window] File URL:', fileUrl)
  
  // 加载HTML内容
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box;
          /* 禁止文本选择 */
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        body { 
          background: transparent;
          overflow: hidden;
          cursor: move;
          -webkit-app-region: drag;
          /* 禁止拖拽选择 */
          -webkit-user-drag: none;
          user-select: none;
        }
        .container {
          width: 100%;
          height: 100%;
          position: relative;
          border: 2px solid rgba(33, 230, 255, 0.8);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          background: rgba(10, 14, 39, 0.5);
          /* 禁止选择 */
          user-select: none;
          -webkit-user-select: none;
        }
        img {
          width: 100%;
          height: 100%;
          display: block;
          pointer-events: none;
          object-fit: contain;
          /* 禁止图片被拖拽和选择 */
          -webkit-user-drag: none;
          user-select: none;
          -webkit-user-select: none;
        }
        .loading {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #21e6ff;
          font-size: 14px;
        }
        .toolbar {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(10, 14, 39, 0.95);
          padding: 4px;
          display: flex;
          gap: 4px;
          border-radius: 6px;
          -webkit-app-region: no-drag;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .btn {
          width: 28px;
          height: 28px;
          border: 1px solid rgba(33, 230, 255, 0.3);
          background: rgba(33, 230, 255, 0.1);
          color: #21e6ff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn:hover {
          background: rgba(33, 230, 255, 0.3);
          border-color: rgba(33, 230, 255, 0.6);
          transform: scale(1.1);
        }
        .scale-info {
          color: #21e6ff;
          font-size: 11px;
          padding: 0 6px;
          display: flex;
          align-items: center;
          background: rgba(33, 230, 255, 0.05);
          border-radius: 4px;
        }
        .resize-handle {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 24px;
          height: 24px;
          cursor: nwse-resize;
          -webkit-app-region: no-drag;
        }
        .resize-handle::after {
          content: '';
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          border-right: 2px solid rgba(33, 230, 255, 0.8);
          border-bottom: 2px solid rgba(33, 230, 255, 0.8);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img id="screenshot-image" src="${fileUrl}" alt="截图" />
        <div class="loading" id="loading">加载中...</div>
        <div class="toolbar">
          <span class="scale-info" id="scaleInfo">100%</span>
          <button class="btn" onclick="window.close()" title="关闭 (Esc)">✕</button>
        </div>
        <div class="resize-handle"></div>
      </div>
      
      <script>
        console.log('📌 [Pin Window] Initializing...');
        console.log('📌 [Pin Window] Image URL:', '${fileUrl}');
        
        // 🔧 禁止选择和拖拽
        document.addEventListener('selectstart', (e) => e.preventDefault());
        document.addEventListener('dragstart', (e) => e.preventDefault());
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        let scale = 1.0;
        const MIN_SCALE = 0.1;
        const MAX_SCALE = 5.0;
        const SCALE_STEP = 0.1;
        
        // 应用缩放
        function applyScale() {
          const newWidth = Math.round(${originalWidth} * scale);
          const newHeight = Math.round(${originalHeight} * scale);
          window.resizeTo(newWidth, newHeight);
          document.getElementById('scaleInfo').textContent = Math.round(scale * 100) + '%';
          console.log('🔍 [Pin Window] Scale:', Math.round(scale * 100) + '%', 'Size:', newWidth, 'x', newHeight);
        }
        
        // 🎯 Shift + 鼠标滚轮缩放
        document.addEventListener('wheel', (e) => {
          if (e.shiftKey) {
            e.preventDefault();
            
            if (e.deltaY < 0) {
              // 向前滚（放大）
              if (scale < MAX_SCALE) {
                scale = Math.min(scale + SCALE_STEP, MAX_SCALE);
                applyScale();
              }
            } else {
              // 向后滚（缩小）
              if (scale > MIN_SCALE) {
                scale = Math.max(scale - SCALE_STEP, MIN_SCALE);
                applyScale();
              }
            }
          }
        }, { passive: false });
        
        // 快捷键：ESC 关闭，Ctrl+0 重置
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === '0') {
            e.preventDefault();
            scale = 1.0;
            applyScale();
          } else if (e.key === 'Escape') {
            window.close();
          }
        });
        
        // 🔧 图片加载完成后的处理
        const img = document.getElementById('screenshot-image');
        const loading = document.getElementById('loading');
        
        if (img) {
          img.onload = function() {
            console.log('✅ [Pin Window] Image loaded successfully');
            console.log('📊 [Pin Window] Image size:', img.naturalWidth, 'x', img.naturalHeight);
            if (loading) loading.style.display = 'none';
          };
          img.onerror = function(e) {
            console.error('❌ [Pin Window] Image load error:', e);
            console.error('❌ [Pin Window] Image src:', img.src);
            if (loading) {
              loading.textContent = '图片加载失败';
              loading.style.color = '#ff3b3b';
            }
          };
          
          // 如果图片已经加载完成（同步加载）
          if (img.complete && img.naturalWidth > 0) {
            console.log('✅ [Pin Window] Image already loaded (sync)');
            if (loading) loading.style.display = 'none';
          }
        }
      </script>
    </body>
    </html>
  `
  
  // ✅ 直接加载 HTML（使用 file:// URL 引用图片）
  console.log('📌 [Pin Window] Loading HTML...')
  console.log('   HTML length:', html.length)
  
  pinWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  
  // 🔧 添加错误处理
  pinWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ [Screenshots] Pin window load failed:', errorCode, errorDescription)
  })
  
  pinWindow.webContents.on('did-finish-load', () => {
    console.log('✓ [Screenshots] Pin window content loaded')
    console.log('✅ [Screenshots] Image loaded via file:// URL')
  })
  
  // 防止窗口意外关闭
  pinWindow.on('close', (event) => {
    console.log('⚠ [Screenshots] Pin window closing...')
  })
  
  // 监听窗口关闭
  pinWindow.on('closed', () => {
    const index = pinWindows.indexOf(pinWindow)
    if (index > -1) {
      pinWindows.splice(index, 1)
    }
    console.log('✓ [Screenshots] Pin window closed, remaining:', pinWindows.length)
  })
  
  pinWindows.push(pinWindow)
  console.log('✓ [Screenshots] Pin window created, total:', pinWindows.length)
  console.log('📊 [Screenshots] Image data length:', imageData.length)
  console.log('📊 [Screenshots] Bounds:', bounds)
  
  return pinWindow
}

/**
 * 初始化截图功能
 */
function initScreenshots() {
  console.log('🚀 [Screenshots] initScreenshots() called!')
  console.log('📦 [Screenshots] Screenshots module:', typeof Screenshots)
  console.log('📦 [Screenshots] Screenshots value:', Screenshots)
  
  if (!Screenshots) {
    console.error('❌ [Screenshots] Screenshots module not loaded')
    return
  }
  
  console.log('✅ [Screenshots] Screenshots module is available, proceeding with initialization...')
  
  // 🔧 修复：如果已经初始化，先清理旧实例
  if (screenshots) {
    console.log('⚠ [Screenshots] Already initialized, cleaning up old instance...')
    try {
      screenshots.removeAllListeners('ok')
      screenshots.removeAllListeners('cancel')
      screenshots.removeAllListeners('save')
      if (screenshots.endCapture) {
        screenshots.endCapture()
      }
    } catch (error) {
      console.error('❌ [Screenshots] Error cleaning up:', error)
    }
    screenshots = null
  }
  
  try {
    screenshots = new Screenshots({
      singleWindow: true  // 使用单一截图窗口
    })
    
    console.log('✅ [Screenshots] Screenshots instance created:', !!screenshots)
    console.log('📊 [Screenshots] Instance details:', {
      hasStartCapture: typeof screenshots.startCapture === 'function',
      hasEndCapture: typeof screenshots.endCapture === 'function',
      hasOn: typeof screenshots.on === 'function'
    })
    
    // 监听截图完成事件
    console.log('📝 [Screenshots] Registering "ok" event listener...')
    screenshots.on('ok', (e, buffer, bounds) => {
      console.log('🎉🎉🎉 [Screenshots] OK EVENT TRIGGERED! 🎉🎉🎉')
      console.log('✓ [Screenshots] Screenshot captured successfully')
      console.log('  Bounds:', bounds)
      console.log('  Buffer size:', buffer.length, 'bytes')
      
      // 🔧 修复：立即重置状态
      isCapturing = false
      
      // 保存到文件
      const saveResult = saveScreenshotToFile(buffer, bounds)
      console.log('📁 [Screenshots] Save result:', saveResult)
      
      // 将 buffer 转为 base64
      const base64Data = `data:image/png;base64,${buffer.toString('base64')}`
      console.log('📊 [Screenshots] Base64 data length:', base64Data.length)
      
      // ✅ 通知渲染进程（必须在置顶窗口之前，确保前端能收到）
      console.log('📢 [Screenshots] Notifying renderer process...')
      console.log('   mainWindow exists:', !!mainWindow)
      console.log('   mainWindow destroyed:', mainWindow ? mainWindow.isDestroyed() : 'N/A')
      
      if (mainWindow && !mainWindow.isDestroyed()) {
        const eventData = {
          data: base64Data,
          bounds: bounds.bounds,
          timestamp: saveResult?.timestamp || Date.now(),
          filepath: saveResult?.filepath,
          filename: saveResult?.filename
        }
        console.log('📤 [Screenshots] Sending screenshot-captured event:', {
          dataLength: eventData.data?.length,
          bounds: eventData.bounds,
          timestamp: eventData.timestamp,
          filepath: eventData.filepath,
          filename: eventData.filename
        })
        mainWindow.webContents.send('screenshot-captured', eventData)
        console.log('✅ [Screenshots] Event sent successfully')
      } else {
        console.error('❌ [Screenshots] Cannot send event - mainWindow not available')
      }
      
      // 📌 用户需求：截图完成后自动创建置顶窗口
      console.log('📌 [Screenshots] Auto-creating pin window...')
      
      // ✅ 确保文件已写入后再创建窗口（添加短暂延迟）
      setTimeout(() => {
        if (saveResult?.filepath && fs.existsSync(saveResult.filepath)) {
          console.log('✅ [Screenshots] File verified, creating pin window')
          console.log('   Filepath:', saveResult.filepath)
          console.log('   Base64 length:', base64Data.length)
          createPinWindow(base64Data, bounds.bounds, saveResult.filepath)
        } else {
          console.error('❌ [Screenshots] File not found after save:', saveResult?.filepath)
        }
      }, 100)
      
      // 🔧 修复：截图完成后结束捕获，防止持续打开状态
      setTimeout(() => {
        try {
          if (screenshots && screenshots.endCapture) {
            screenshots.endCapture()
            console.log('✓ [Screenshots] Capture ended')
          }
        } catch (error) {
          console.error('❌ [Screenshots] Error ending capture:', error)
        }
      }, 100)
    })
    
    // 监听取消事件
    console.log('📝 [Screenshots] Registering "cancel" event listener...')
    screenshots.on('cancel', () => {
      console.log('🚫🚫🚫 [Screenshots] CANCEL EVENT TRIGGERED! 🚫🚫🚫')
      
      // 🔧 修复：立即重置状态
      isCapturing = false
      
      // 通知渲染进程
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('screenshot-cancelled')
      }
      
      // 🔧 修复：取消后也要结束捕获
      setTimeout(() => {
        try {
          if (screenshots && screenshots.endCapture) {
            screenshots.endCapture()
          }
        } catch (error) {
          // 忽略错误
        }
      }, 100)
    })
    
    // 监听保存事件
    console.log('📝 [Screenshots] Registering "save" event listener...')
    screenshots.on('save', (e, buffer, bounds) => {
      console.log('💾💾💾 [Screenshots] SAVE EVENT TRIGGERED! 💾💾💾')
    })
    
    console.log('✅✅✅ [Screenshots] Screenshots initialized successfully!')
    console.log('📊 [Screenshots] All event listeners registered:')
    console.log('   - ok: ✓')
    console.log('   - cancel: ✓')
    console.log('   - save: ✓')
  } catch (error) {
    console.error('❌ [Screenshots] Failed to initialize:', error)
  }
}

/**
 * 注册截图快捷键
 * 强制使用 Ctrl+Shift+X
 */
function registerScreenshotHotkey() {
  const hotkey = 'Ctrl+Shift+X'
  
  console.log('🔧 [Screenshots] Force registering screenshot hotkey:', hotkey)
  
  // 🔥 强制注销（清理所有可能的冲突）
  try {
    globalShortcut.unregisterAll()
    console.log('🧹 [Screenshots] Unregistered ALL global shortcuts')
  } catch (e) {
    console.warn('⚠ [Screenshots] Failed to unregister all:', e.message)
  }
  
  // 等待一下，确保注销完成
  setTimeout(() => {
    try {
      console.log('📝 [Screenshots] Registering hotkey:', hotkey)
      
      const registered = globalShortcut.register(hotkey, () => {
        console.log('🎯🎯🎯 [Screenshots] ===== HOTKEY TRIGGERED ===== 🎯🎯🎯')
        console.log('📸 [Screenshots] Hotkey pressed:', hotkey)
        console.log('📸 [Screenshots] Time:', new Date().toLocaleTimeString())
        
        // 🔧 修复：使用和按钮相同的状态检查逻辑
        if (!screenshots) {
          console.error('❌ [Screenshots] Screenshots not initialized')
          return
        }
        
        // 🔧 修复：防止重复触发截图
        if (isCapturing) {
          console.warn('⚠ [Screenshots] Already capturing, ignoring hotkey trigger')
          return
        }
        
        try {
          isCapturing = true
          console.log('📸 [Screenshots] Calling startCapture() from hotkey...')
          console.log('   screenshots instance:', !!screenshots)
          console.log('   screenshots.startCapture:', typeof screenshots.startCapture)
          
          screenshots.startCapture()
          console.log('✅ [Screenshots] startCapture() called successfully')
          
          // 🔧 修复：10秒后自动重置状态（防止卡住）
          setTimeout(() => {
            if (isCapturing) {
              isCapturing = false
              console.log('⚠ [Screenshots] Hotkey capture timeout, reset state')
            }
          }, 10000)
          
          console.log('✓ [Screenshots] Hotkey capture started')
        } catch (error) {
          isCapturing = false
          console.error('❌ [Screenshots] Hotkey capture error:', error)
        }
      })
      
      if (registered) {
        console.log(`✅✅✅ [Screenshots] Hotkey registered successfully: ${hotkey}`)
        console.log(`🎉 [Screenshots] Use ${hotkey} to take screenshots!`)
      } else {
        // 静默跳过，快捷键可能被其他应用占用
        console.log(`⚠️ [Screenshots] Hotkey ${hotkey} is already in use, skipped registration`)
      }
      
      return registered ? hotkey : null
    } catch (error) {
      // 静默跳过注册错误
      console.log(`⚠️ [Screenshots] Unable to register ${hotkey}, skipped`)
      return null
    }
  }, 100)
}

// 注意：electron-screenshots 在关闭时会产生一些无害的 WebFrameMain 警告
// 这些警告不影响功能，可以安全忽略

/**
 * 应用启动
 */
app.whenReady().then(() => {
  console.log('🚀 [App] App is ready, starting initialization...')
  
  createWindow()
  console.log('✅ [App] Main window created')
  
  createMenu()
  console.log('✅ [App] Menu created')
  
  // 初始化截图功能
  console.log('📸 [App] Initializing screenshots...')
  initScreenshots()
  console.log('✅ [App] Screenshots initialization completed')
  
  // 注册截图快捷键
  console.log('⌨️ [App] Registering screenshot hotkey...')
  registerScreenshotHotkey()
  console.log('✅ [App] Hotkey registration completed')

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * 所有窗口关闭时退出
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/**
 * 应用退出前清理
 */
app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  
  // 停止剪贴板监听
  stopClipboardMonitoring()
  
  // 关闭 SSH 连接
  if (sshClient) {
    sshClient.end()
    sshClient = null
    sshStream = null
  }
  
  if (sshProcess) {
    sshProcess.kill()
    sshProcess = null
  }
})

/**
 * SSH 连接处理 - 使用 ssh2 库实现可靠的 SSH 连接
 */
ipcMain.handle('ssh:connect', async (_event, config) => {
  return new Promise((resolve) => {
    try {
      // 关闭之前的连接
      if (sshClient) {
        sshClient.end()
        sshClient = null
        sshStream = null
      }
      
      // 🔥 关键：重置所有状态
      isInterrupting = false
      outputBuffer = ''
      droppedBytes = 0
      dataEventCount = 0
      samplingRate = 1  // 重置采样率
      if (flushTimer) {
        clearTimeout(flushTimer)
        flushTimer = null
      }

      console.log('Connecting via ssh2...')
      console.log('Host:', config.host, 'Port:', config.port, 'User:', config.username, 'Auth:', config.authType)

      sshClient = new Client()

      sshClient.on('ready', () => {
        console.log('✓ SSH Client connected!')
        
        // 保存配置
        global.sshConfig = config
        
        // 打开一个 shell 会话
        sshClient.shell({
          term: 'xterm-256color',
          cols: 80,
          rows: 30
        }, (err, stream) => {
          if (err) {
            console.error('Failed to open shell:', err)
            resolve({ success: false, error: '无法打开 shell: ' + err.message })
            return
          }

          sshStream = stream
          console.log('✓ Shell session opened')

          // 监听输出
          stream.on('data', (data) => {
            // 🔥 使用限流函数，防止大量日志卡死 UI
            const output = data.toString('utf8')
            throttledSendOutput(output)
          })

          stream.on('close', () => {
            console.log('Shell stream closed')
            // 🔥 重置中断标志
            isInterrupting = false
            if (mainWindow) {
              mainWindow.webContents.send('ssh:close', 0)
            }
            sshStream = null
          })

          stream.stderr.on('data', (data) => {
            // 🔥 stderr 也使用限流
            const error = data.toString('utf8')
            throttledSendOutput(error)
          })

          // 同时建立 SFTP 会话
          sshClient.sftp((sftpErr, sftp) => {
            if (sftpErr) {
              console.error('Failed to open SFTP:', sftpErr)
            } else {
              sftpClient = sftp
              console.log('✓ SFTP session opened')
            }
          })

          // 连接成功
          if (mainWindow) {
            mainWindow.webContents.send('ssh:output', '\r\n✓ SSH 连接成功！\r\n')
          }
          resolve({ success: true })
        })
      })

      sshClient.on('error', (err) => {
        console.error('SSH connection error:', err)
        console.error('Error level:', err.level)
        console.error('Error message:', err.message)
        
        let errorMsg = '连接失败'
        
        // 根据错误类型提供更友好的提示
        if (err.level === 'client-authentication') {
          errorMsg = '❌ 认证失败：用户名或密码错误，请检查登录信息'
        } else if (err.code === 'ECONNREFUSED') {
          errorMsg = '❌ 连接被拒绝：请检查服务器地址和端口是否正确'
        } else if (err.code === 'ETIMEDOUT' || err.message.includes('Timed out')) {
          errorMsg = '❌ 连接超时：无法连接到服务器，请检查网络和防火墙设置'
        } else if (err.code === 'ENOTFOUND') {
          errorMsg = '❌ 主机未找到：请检查服务器地址是否正确'
        } else {
          errorMsg = `❌ 连接失败: ${err.message}`
        }
        
        if (mainWindow) {
          mainWindow.webContents.send('ssh:output', errorMsg + '\r\n')
        }
        
        resolve({ success: false, error: errorMsg })
        sshClient = null
      })

      sshClient.on('close', () => {
        console.log('SSH connection closed')
        // 🔥 重置中断标志
        isInterrupting = false
        if (mainWindow) {
          mainWindow.webContents.send('ssh:close', 0)
        }
        sshClient = null
        sshStream = null
      })

      // 准备连接配置
      const connConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: 10000,
        keepaliveInterval: 30000,
      }

      // 根据认证方式添加配置
      if (config.authType === 'password') {
        connConfig.password = config.password
        console.log('Using password authentication')
      } else if (config.authType === 'key') {
        if (config.keyMode === 'text' && config.keyText) {
          // 使用密钥文本
          connConfig.privateKey = Buffer.from(config.keyText, 'utf8')
          console.log('Using key text authentication (length:', config.keyText.length, ')')
        } else if (config.keyMode === 'file' && config.keyPath) {
          // 使用密钥文件
          try {
            let keyFilePath = config.keyPath
            
            // 判断是否为相对路径（不以盘符或 / 开头）
            const isRelativePath = !path.isAbsolute(keyFilePath)
            
            if (isRelativePath) {
              // 相对路径，基于 toolData 目录解析
              keyFilePath = path.join(getDataPath(), keyFilePath)
              console.log('Using relative key path, resolved to:', keyFilePath)
            }
            
            connConfig.privateKey = fs.readFileSync(keyFilePath)
            console.log('Using key file authentication:', keyFilePath)
          } catch (err) {
            console.error('Failed to read private key file:', err)
            resolve({ success: false, error: '无法读取密钥文件: ' + err.message })
            return
          }
        } else {
          console.error('No key provided')
          resolve({ success: false, error: '未提供密钥文件或密钥文本' })
          return
        }
      }

      // 发起连接
      console.log('Initiating SSH connection...')
      sshClient.connect(connConfig)

    } catch (error) {
      console.error('SSH connect error:', error)
      resolve({ success: false, error: error.message })
    }
  })
})

/**
 * 🔥 强制结束当前 Shell 会话（用于无法中断的程序）
 */
ipcMain.handle('ssh:forceKillSession', async () => {
  console.log('🔥 Force killing shell session...')
  
  if (!sshStream) {
    console.log('No shell session to kill')
    return { success: false, error: '没有活动的会话' }
  }
  
  try {
    // 🔥 方案1：向 Shell 发送 exit 命令
    if (sshStream.writable) {
      console.log('✓ Sending "exit" to shell')
      sshStream.write('\x03\x03\x03exit\n')  // 3次 Ctrl+C + exit
    }
    
    // 🔥 方案2：200ms 后强制关闭 stream
    setTimeout(() => {
      if (sshStream) {
        console.log('✓ Force closing shell stream')
        sshStream.end()
        sshStream = null
      }
    }, 200)
    
    // 🔥 方案3：500ms 后重新打开新的 Shell 会话
    setTimeout(() => {
      if (sshClient && !sshStream) {
        console.log('✓ Reopening shell session...')
        sshClient.shell({
          term: 'xterm-256color',
          cols: 80,
          rows: 30
        }, (err, stream) => {
          if (err) {
            console.error('Failed to reopen shell:', err)
            return
          }
          
          sshStream = stream
          console.log('✓ Shell session reopened')
          
          // 重新设置监听器
          stream.on('data', (data) => {
            const output = data.toString('utf8')
            throttledSendOutput(output)
          })
          
          stream.on('close', () => {
            console.log('Shell stream closed')
            isInterrupting = false
            if (mainWindow) {
              mainWindow.webContents.send('ssh:close', 0)
            }
            sshStream = null
          })
          
          stream.stderr.on('data', (data) => {
            const error = data.toString('utf8')
            throttledSendOutput(error)
          })
          
          // 通知前端会话已重启
          if (mainWindow) {
            mainWindow.webContents.send('ssh:output', '\r\n\r\n🔄 Shell 会话已重启\r\n\r\n')
          }
        })
      }
    }, 500)
    
    // 重置状态
    isInterrupting = false
    outputBuffer = ''
    droppedBytes = 0
    dataEventCount = 0
    samplingRate = 1
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error force killing session:', error)
    return { success: false, error: error.message }
  }
})

/**
 * SSH 断开连接
 */
ipcMain.handle('ssh:disconnect', async () => {
  console.log('Disconnecting SSH...')
  
  // 🔥 关键：重置所有状态
  isInterrupting = false
  outputBuffer = ''
  droppedBytes = 0
  dataEventCount = 0
  samplingRate = 1
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  
  // 清除保存的配置
  global.sshConfig = null
  
  // 关闭 SFTP
  if (sftpClient) {
    sftpClient = null
    console.log('✓ SFTP session closed')
  }
  
  // 关闭 ssh2 客户端
  if (sshClient) {
    sshClient.end()
    sshClient = null
    sshStream = null
    console.log('✓ SSH client disconnected')
  }
  
  // 清理旧的进程（如果有）
  if (sshProcess) {
    sshProcess.kill()
    sshProcess = null
  }
  
  return { success: true }
})

/**
 * 发送 SSH 命令 - 通过 ssh2 的 shell stream 发送
 */
ipcMain.handle('ssh:sendCommand', async (_event, command) => {
  if (!sshStream || !sshStream.writable) {
    console.error('SSH stream not available')
    return { success: false, error: '未连接或连接已断开' }
  }

  try {
    // 特殊处理：空字符串直接返回
    if (!command || command.length === 0) {
      console.log('Empty command, ignoring')
      return { success: true }
    }
    
    // 显示命令的十六进制表示用于调试
    const hexDump = Array.from(command).map(c => '\\x' + c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    console.log('Sending command (length:', command.length, '):', hexDump)
    
    // 判断是否为控制字符（不可打印字符或 ANSI 转义序列）
    const isControlChar = /^[\x00-\x1f]/.test(command) || command.startsWith('\x1b[')
    
    if (isControlChar) {
      // 🔑 关键优化：Ctrl+C (0x03) 需要特殊处理
      if (command.charCodeAt(0) === 0x03) {
        console.log('🛑 Detected Ctrl+C - Using BOTH signal() AND write()')
        
        // 🔥 激进方案：直接丢弃所有输出
        isInterrupting = true
        
        // 🔥 方案1：使用 ssh2 的 signal() 方法（标准方式）
        // 只用 SIGINT 和 SIGTERM，不用 SIGKILL（会杀死整个 SSH 连接）
        if (sshStream.signal) {
          console.log('✓ Sending SIGINT via stream.signal("INT")')
          sshStream.signal('INT')
          
          // 200ms 后发送 SIGTERM（如果 SIGINT 无效）
          setTimeout(() => {
            if (sshStream && sshStream.signal && isInterrupting) {
              console.log('✓ Sending SIGTERM via stream.signal("TERM")')
              sshStream.signal('TERM')
            }
          }, 200)
        } else {
          console.log('⚠️ stream.signal() not available, falling back to write()')
        }
        
        // 🔥 方案2：同时写入 Ctrl+C 字符（备用方案）
        const buffer = Buffer.from(command, 'binary')
        console.log('✓ Also writing Ctrl+C as Buffer:', buffer, 'hex:', buffer.toString('hex'))
        sshStream.write(buffer)
        
        // 🔥 关键：等待 500ms，这段时间内所有输出都会被丢弃
        // 这样 Ctrl+C 信号就不会被淹没了
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // 恢复接收输出
        isInterrupting = false
        console.log('✓ Interrupt signals sent, output unblocked')
      } else {
        // 其他控制字符正常发送
        const buffer = Buffer.from(command, 'binary')
        console.log('✓ Sending control character as Buffer:', buffer, 'hex:', buffer.toString('hex'))
        sshStream.write(buffer)
        console.log('✓ Control character sent to shell')
      }
    } else {
      // 普通命令添加换行符
      sshStream.write(command + '\n')
      console.log('✓ Command sent to shell')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error sending command:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 发送数据到SSH（用于xterm实时输入）
 */
ipcMain.handle('ssh:sendData', async (_event, data) => {
  if (!sshStream || !sshStream.writable) {
    console.error('[ssh:sendData] SSH stream not available')
    return { success: false, error: '未连接或连接已断开' }
  }

  try {
    sshStream.write(data)
    return { success: true }
  } catch (error) {
    console.error('[ssh:sendData] Error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 调整终端大小
 */
ipcMain.handle('ssh:resize', async (_event, cols, rows) => {
  if (!sshStream) {
    console.error('[ssh:resize] SSH stream not available')
    return { success: false, error: '未连接' }
  }

  try {
    // 使用ssh2的setWindow方法调整终端大小
    if (sshStream.setWindow) {
      sshStream.setWindow(rows, cols, 0, 0)
      console.log(`✓ Terminal resized to ${cols}x${rows}`)
    } else {
      console.warn('⚠️ setWindow not available on stream')
    }
    return { success: true }
  } catch (error) {
    console.error('[ssh:resize] Error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 保存历史记录到文件
 */
ipcMain.handle('ssh:saveHistory', async (_event, history) => {
  try {
    // 保存到 toolData 目录
    const historyPath = path.join(getDataPath(), 'ssh-history.json')
    
    console.log('Saving SSH history to:', historyPath)
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8')
    console.log('✓ SSH history saved,', history.length, 'records')
    return { success: true }
  } catch (error) {
    console.error('Failed to save SSH history:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 从文件加载历史记录
 */
ipcMain.handle('ssh:loadHistory', async () => {
  try {
    // 从 toolData 目录加载
    const historyPath = path.join(getDataPath(), 'ssh-history.json')
    
    console.log('Loading SSH history from:', historyPath)
    
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8')
      const history = JSON.parse(data)
      console.log('✓ SSH history loaded,', history.length, 'records')
      return { success: true, data: history }
    }
    
    console.log('No SSH history file found')
    return { success: true, data: [] }
  } catch (error) {
    console.error('Failed to load SSH history:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 复制 SSH 密钥文件到 toolData 目录
 * @param {string} sourcePath - 源密钥文件路径
 * @returns {Promise<{success: boolean, relativePath?: string, error?: string}>}
 */
ipcMain.handle('ssh:copyKeyFile', async (_event, sourcePath) => {
  try {
    const keysDir = path.join(getDataPath(), 'ssh-keys')
    
    // 确保 ssh-keys 目录存在
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true })
      console.log('✓ Created ssh-keys directory:', keysDir)
    }
    
    // 生成唯一的文件名（保留原始文件名）
    const originalName = path.basename(sourcePath)
    const timestamp = Date.now()
    const destFileName = `${timestamp}_${originalName}`
    const destPath = path.join(keysDir, destFileName)
    
    // 复制文件
    fs.copyFileSync(sourcePath, destPath)
    
    // 返回相对路径（相对于 toolData）
    const relativePath = `ssh-keys/${destFileName}`
    
    console.log('✓ SSH key copied to:', destPath)
    console.log('  Relative path:', relativePath)
    
    return { success: true, relativePath }
  } catch (error) {
    console.error('Failed to copy SSH key:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 保存 SSH 快捷命令配置到文件
 */
ipcMain.handle('ssh:saveCommands', async (_event, commands) => {
  try {
    // 保存到 toolData 目录
    const commandsPath = path.join(getDataPath(), 'ssh-commands.json')
    
    console.log('Saving SSH commands to:', commandsPath)
    fs.writeFileSync(commandsPath, JSON.stringify(commands, null, 2), 'utf-8')
    console.log('✓ SSH commands saved,', commands.length, 'groups')
    return { success: true }
  } catch (error) {
    console.error('Failed to save SSH commands:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 从文件加载 SSH 快捷命令配置
 */
ipcMain.handle('ssh:loadCommands', async () => {
  try {
    // 从 toolData 目录加载
    const commandsPath = path.join(getDataPath(), 'ssh-commands.json')
    
    console.log('Loading SSH commands from:', commandsPath)
    
    if (fs.existsSync(commandsPath)) {
      const data = fs.readFileSync(commandsPath, 'utf-8')
      const commands = JSON.parse(data)
      console.log('✓ SSH commands loaded,', commands.length, 'groups')
      return { success: true, data: commands }
    }
    
    console.log('No SSH commands file found')
    return { success: true, data: [] }
  } catch (error) {
    console.error('Failed to load SSH commands:', error)
    return { success: false, error: error.message }
  }
})

// ========================================
// MySQL 连接与查询功能（基于SSH连接）
// ========================================

/**
 * 通过SSH连接MySQL数据库
 */
ipcMain.handle('mysql:connect', async (_event, config) => {
  try {
    console.log('Connecting to MySQL directly...')
    console.log('MySQL Config:', { ...config, password: '***' })
    
    // 关闭之前的连接
    if (mysqlConnection) {
      try {
        await mysqlConnection.end()
        console.log('Previous connection closed')
      } catch (err) {
        console.error('Error closing previous MySQL connection:', err)
      }
      mysqlConnection = null
    }
    
    // 保存配置
    mysqlConfig = config
    
    // 使用 mysql2/promise 直接连接
    const connectionConfig = {
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.username,
      password: config.password || '',
      connectTimeout: 10000, // 10秒超时
    }
    
    // 如果指定了数据库，添加到配置
    if (config.database) {
      connectionConfig.database = config.database
    }
    
    console.log('Creating MySQL connection...')
    mysqlConnection = await mysql.createConnection(connectionConfig)
    
    // 测试连接
    console.log('Testing connection with SELECT 1...')
    await mysqlConnection.query('SELECT 1')
    
    console.log('✓ MySQL connection successful!')
    return { success: true }
    
  } catch (error) {
    console.error('MySQL connect error:', error)
    
    // 清理连接
    if (mysqlConnection) {
      try {
        await mysqlConnection.end()
      } catch (e) {}
      mysqlConnection = null
    }
    
    // 返回友好的错误信息
    let errorMessage = error.message
    if (error.code === 'ECONNREFUSED') {
      errorMessage = `连接被拒绝：无法连接到 ${config.host}:${config.port}`
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = '访问被拒绝：用户名或密码错误'
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '连接超时：请检查主机地址和网络连接'
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `主机不存在：无法解析主机 ${config.host}`
    }
    
    return { success: false, error: errorMessage }
  }
})

/**
 * 断开MySQL连接
 */
ipcMain.handle('mysql:disconnect', async () => {
  try {
    if (mysqlConnection) {
      await mysqlConnection.end()
      mysqlConnection = null
    }
    mysqlConfig = null
    return { success: true }
  } catch (error) {
    console.error('MySQL disconnect error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 获取所有数据库
 */
ipcMain.handle('mysql:getDatabases', async () => {
  try {
    if (!mysqlConnection) {
      return { success: false, error: '请先连接MySQL' }
    }
    
    console.log('Querying databases...')
    const [rows] = await mysqlConnection.query('SHOW DATABASES')
    
    // 过滤掉系统数据库
    const filtered = rows.filter(row => 
      row.Database && 
      !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(row.Database)
    )
    
    console.log('✓ Found', filtered.length, 'databases')
    return { success: true, data: filtered }
    
  } catch (error) {
    console.error('MySQL getDatabases error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 获取指定数据库的所有表
 */
ipcMain.handle('mysql:getTables', async (_event, database) => {
  try {
    if (!mysqlConnection) {
      return { success: false, error: '请先连接MySQL' }
    }
    
    if (!database) {
      return { success: false, error: '请指定数据库' }
    }
    
    console.log('Querying tables for database:', database)
    const [rows] = await mysqlConnection.query(`SHOW TABLES FROM \`${database}\``)
    
    console.log('✓ Found', rows.length, 'tables')
    return { success: true, data: rows }
    
  } catch (error) {
    console.error('MySQL getTables error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 执行SQL查询
 */
ipcMain.handle('mysql:query', async (_event, sql, maxRows = 200, database = null) => {
  try {
    if (!mysqlConnection) {
      return { success: false, error: '请先连接MySQL' }
    }
    
    console.log('Executing SQL:', sql)
    console.log('Max rows:', maxRows)
    console.log('Database:', database || mysqlConfig?.database || 'none')
    
    // 自动添加LIMIT限制
    let finalSql = sql.trim()
    
    // 检查是否为SELECT语句且没有LIMIT
    // ⚡ 修复：正则需要匹配 "LIMIT 200" 和 "LIMIT 0, 200" 两种格式
    if (/^SELECT/i.test(finalSql) && !/LIMIT\s+\d+(\s*,\s*\d+)?/i.test(finalSql)) {
      // 移除末尾的分号
      finalSql = finalSql.replace(/;$/, '')
      finalSql += ` LIMIT ${maxRows}`
      console.log('Added LIMIT:', finalSql)
    } else if (/LIMIT\s+\d+(\s*,\s*\d+)?/i.test(finalSql)) {
      console.log('SQL already has LIMIT, skip adding')
    }
    
    // 如果指定了数据库，先切换
    if (database) {
      await mysqlConnection.query(`USE \`${database}\``)
    }
    
    // 执行查询
    const [rows, fields] = await mysqlConnection.query(finalSql)
    
    console.log('✓ Query executed, returned', rows.length, 'rows')
    
    // 解析结果
    let result = {
      rows: [],
      columns: [],
      affectedRows: undefined
    }
    
    // 判断是SELECT还是其他语句
    if (fields && Array.isArray(rows)) {
      // SELECT 查询
      if (rows.length > 0) {
        result.columns = Object.keys(rows[0])
        result.rows = rows
      }
    } else if (typeof rows === 'object' && 'affectedRows' in rows) {
      // INSERT/UPDATE/DELETE 等语句
      result.affectedRows = rows.affectedRows
      result.insertId = rows.insertId
      result.rows = []
      result.columns = []
    }
    
    return { 
      success: true, 
      data: result
    }
    
  } catch (error) {
    console.error('MySQL query error:', error)
    
    // 返回友好的错误信息
    let errorMessage = error.message
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = '表不存在'
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = '数据库不存在'
    } else if (error.code === 'ER_PARSE_ERROR') {
      errorMessage = 'SQL语法错误'
    }
    
    return { success: false, error: errorMessage }
  }
})

/**
 * 保存MySQL配置
 */
ipcMain.handle('mysql:saveConfig', async (_event, config) => {
  try {
    const configPath = path.join(getDataPath(), 'mysql-config.json')
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    console.log('MySQL config saved to:', configPath)
    return { success: true }
  } catch (error) {
    console.error('Failed to save MySQL config:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 加载MySQL配置
 */
ipcMain.handle('mysql:loadConfig', async () => {
  try {
    const configPath = path.join(getDataPath(), 'mysql-config.json')
    
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8')
      const config = JSON.parse(data)
      console.log('MySQL config loaded from:', configPath)
      return { success: true, data: config }
    }
    
    return { success: true, data: null }
  } catch (error) {
    console.error('Failed to load MySQL config:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 辅助函数：构建MySQL命令
 * @param {string} sql - SQL语句
 * @param {string} database - 数据库名（可选，优先使用此参数）
 */
function buildMysqlCommand(sql, database = null) {
  const config = mysqlConfig
  const host = config.host || 'localhost'
  const port = config.port || 3306
  const username = config.username
  const password = config.password || ''
  // 使用传入的database参数（优先）或配置中的database
  const dbName = database || config.database || ''
  
  // 使用和连接时一样的安全格式
  let cmd = `mysql -h"${host}" -P"${port}" -u"${username}"`
  
  if (password) {
    // 使用单引号包裹密码，避免特殊字符问题
    cmd += ` -p'${password.replace(/'/g, "'\\''")}'`
  }
  
  // 添加数据库名
  if (dbName) {
    cmd += ` "${dbName}"`
  }
  
  cmd += ' --batch --raw -e'
  // SQL语句用双引号包裹，内部的双引号转义
  cmd += ` "${sql.replace(/"/g, '\\"')}"`
  
  console.log('Built MySQL command:', cmd.replace(/-p'[^']+'/g, "-p'***'"))
  
  return cmd
}

/**
 * 辅助函数：解析MySQL输出为JSON格式
 */
function parseMysqlOutput(output) {
  const lines = output.trim().split('\n')
  
  if (lines.length === 0) {
    return []
  }
  
  // 第一行是列名（用Tab分隔）
  const headers = lines[0].split('\t')
  
  // 后续行是数据
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    const row = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] === 'NULL' ? null : values[index]
    })
    
    rows.push(row)
  }
  
  return rows
}

/**
 * 保存 HTTP 测试历史记录到文件
 */
ipcMain.handle('http:saveHistory', async (_event, history) => {
  try {
    // 保存到 toolData 目录
    const historyPath = path.join(getDataPath(), 'http-history.json')
    
    console.log('Saving HTTP history to:', historyPath)
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8')
    console.log('✓ HTTP history saved,', history.length, 'records')
    return { success: true }
  } catch (error) {
    console.error('Failed to save HTTP history:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 从文件加载 HTTP 测试历史记录
 */
ipcMain.handle('http:loadHistory', async () => {
  try {
    // 从 toolData 目录加载
    const historyPath = path.join(getDataPath(), 'http-history.json')
    
    console.log('Loading HTTP history from:', historyPath)
    
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8')
      const history = JSON.parse(data)
      console.log('✓ HTTP history loaded,', history.length, 'records')
      return { success: true, data: history }
    }
    
    console.log('No HTTP history file found')
    return { success: true, data: [] }
  } catch (error) {
    console.error('Failed to load HTTP history:', error)
    return { success: false, error: error.message }
  }
})

/**
 * SFTP - 列出目录
 */
ipcMain.handle('sftp:listDir', async (_event, remotePath) => {
  return new Promise((resolve) => {
    if (!sftpClient) {
      resolve({ success: false, error: 'SFTP未连接' })
      return
    }

    console.log('Listing directory:', remotePath)

    sftpClient.readdir(remotePath, (err, list) => {
      if (err) {
        console.error('Failed to list directory:', err)
        resolve({ success: false, error: err.message })
        return
      }

      const files = list.map(item => ({
        name: item.filename,
        type: item.longname.startsWith('d') ? 'directory' : 'file',
        size: item.attrs.size,
        modified: item.attrs.mtime * 1000,
        permissions: item.longname.substring(0, 10)
      }))

      console.log('✓ Listed', files.length, 'items')
      resolve({ success: true, data: files })
    })
  })
})

/**
 * SFTP - 下载文件（带进度）
 */
ipcMain.handle('sftp:downloadFile', async (_event, remotePath, localPath) => {
  return new Promise((resolve) => {
    if (!sftpClient) {
      resolve({ success: false, error: 'SFTP未连接' })
      return
    }

    console.log('Downloading:', remotePath, '→', localPath)

    // 先获取文件大小
    sftpClient.stat(remotePath, (statErr, stats) => {
      if (statErr) {
        console.error('Failed to get file stats:', statErr)
        resolve({ success: false, error: statErr.message })
        return
      }

      const totalSize = stats.size
      let transferred = 0

      const options = {
        step: (total, chunk, current) => {
          transferred += chunk
          const percent = Math.floor((transferred / totalSize) * 100)
          
          // 发送进度到渲染进程
          if (mainWindow) {
            mainWindow.webContents.send('sftp:download-progress', {
              remotePath,
              percent,
              transferred,
              total: totalSize
            })
          }
        }
      }

      sftpClient.fastGet(remotePath, localPath, options, (err) => {
        if (err) {
          console.error('Download failed:', err)
          resolve({ success: false, error: err.message })
          return
        }

        console.log('✓ Download completed')
        resolve({ success: true })
      })
    })
  })
})

/**
 * SFTP - 上传文件（带进度）
 */
ipcMain.handle('sftp:uploadFile', async (_event, localPath, remotePath) => {
  return new Promise((resolve) => {
    if (!sftpClient) {
      resolve({ success: false, error: 'SFTP未连接' })
      return
    }

    console.log('Uploading:', localPath, '→', remotePath)

    // 获取本地文件大小
    fs.stat(localPath, (statErr, stats) => {
      if (statErr) {
        console.error('Failed to get local file stats:', statErr)
        resolve({ success: false, error: statErr.message })
        return
      }

      const totalSize = stats.size
      let transferred = 0

      const options = {
        step: (total, chunk, current) => {
          transferred += chunk
          const percent = Math.floor((transferred / totalSize) * 100)
          
          // 发送进度到渲染进程
          if (mainWindow) {
            mainWindow.webContents.send('sftp:upload-progress', {
              localPath,
              remotePath,
              percent,
              transferred,
              total: totalSize
            })
          }
        }
      }

      sftpClient.fastPut(localPath, remotePath, options, (err) => {
        if (err) {
          console.error('Upload failed:', err)
          resolve({ success: false, error: err.message })
          return
        }

        console.log('✓ Upload completed')
        resolve({ success: true })
      })
    })
  })
})

/**
 * SFTP - 删除文件
 */
ipcMain.handle('sftp:deleteFile', async (_event, remotePath) => {
  return new Promise((resolve) => {
    if (!sftpClient) {
      resolve({ success: false, error: 'SFTP未连接' })
      return
    }

    console.log('Deleting:', remotePath)

    sftpClient.unlink(remotePath, (err) => {
      if (err) {
        console.error('Delete failed:', err)
        resolve({ success: false, error: err.message })
        return
      }

      console.log('✓ File deleted')
      resolve({ success: true })
    })
  })
})

/**
 * SFTP - 创建目录
 */
ipcMain.handle('sftp:createDir', async (_event, remotePath) => {
  return new Promise((resolve) => {
    if (!sftpClient) {
      resolve({ success: false, error: 'SFTP未连接' })
      return
    }

    console.log('Creating directory:', remotePath)

    sftpClient.mkdir(remotePath, (err) => {
      if (err) {
        console.error('Create directory failed:', err)
        resolve({ success: false, error: err.message })
        return
      }

      console.log('✓ Directory created')
      resolve({ success: true })
    })
  })
})

/**
 * 选择本地文件
 */
ipcMain.handle('dialog:selectFile', async () => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  })
  
  if (result.canceled) {
    return { success: false, canceled: true }
  }
  
  return { success: true, filePath: result.filePaths[0] }
})

/**
 * 选择本地保存路径
 */
ipcMain.handle('dialog:selectSavePath', async (_event, defaultName) => {
  const { dialog } = require('electron')
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName
  })
  
  if (result.canceled) {
    return { success: false, canceled: true }
  }
  
  return { success: true, filePath: result.filePath }
})

// ==================== 知識庫 API ====================

/**
 * 獲取應用路徑（返回 toolData 数据目录）
 */
ipcMain.handle('get-app-path', () => {
  // 返回 toolData 数据目录
  return getDataPath()
})

/**
 * 獲取應用版本
 */
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

/**
 * 讀取文件（使用相對路徑，基于 toolData 目录）
 */
ipcMain.handle('read-file', async (_event, relativePath) => {
  try {
    // 將相對路徑轉為絕對路徑（基于 toolData 目录）
    const absolutePath = path.join(getDataPath(), relativePath)
    console.log('📖 Reading file:', relativePath)
    console.log('   Absolute path:', absolutePath)
    
    const content = await fs.promises.readFile(absolutePath, 'utf-8')
    return { success: true, data: content }
  } catch (error) {
    console.error('❌ Read file failed:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 寫入文件（使用相對路徑，基于 toolData 目录）
 */
ipcMain.handle('write-file', async (_event, relativePath, content, isBase64) => {
  try {
    // 將相對路徑轉為絕對路徑（基于 toolData 目录）
    const absolutePath = path.join(getDataPath(), relativePath)
    console.log('💾 Writing file:', relativePath)
    console.log('   Absolute path:', absolutePath)
    console.log('   Is Base64:', isBase64)
    
    // 確保目錄存在
    const dir = path.dirname(absolutePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // 根據類型寫入
    if (isBase64) {
      const buffer = Buffer.from(content, 'base64')
      await fs.promises.writeFile(absolutePath, buffer)
    } else {
      await fs.promises.writeFile(absolutePath, content, 'utf-8')
    }
    
    console.log('✅ File written successfully')
    return { success: true }
  } catch (error) {
    console.error('❌ Write file failed:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 檢查文件是否存在（使用相對路徑，基于 toolData 目录）
 */
ipcMain.handle('file-exists', async (_event, relativePath) => {
  try {
    const absolutePath = path.join(getDataPath(), relativePath)
    await fs.promises.access(absolutePath)
    return true
  } catch {
    return false
  }
})

/**
 * 複製文件（使用相對路徑，基于 toolData 目录）
 */
ipcMain.handle('copy-file', async (_event, sourcePath, destRelativePath) => {
  try {
    const destAbsolutePath = path.join(getDataPath(), destRelativePath)
    
    // 確保目標目錄存在
    const dir = path.dirname(destAbsolutePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    await fs.promises.copyFile(sourcePath, destAbsolutePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

/**
 * 選擇文件對話框
 */
ipcMain.handle('select-file', async (_event, options) => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: options?.filters || [],
    ...options,
  })
  return result
})

/**
 * 刪除文件（使用相對路徑，基于 toolData 目录）
 */
ipcMain.handle('delete-file', async (_event, relativePath) => {
  try {
    const absolutePath = path.join(getDataPath(), relativePath)
    await fs.promises.unlink(absolutePath)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
})

// ==================== 知识库MD文件管理 ====================

/**
 * 选择并导入MD文件到知识库
 */
ipcMain.handle('knowledge:selectMdFile', async () => {
  const { dialog } = require('electron')
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择 Markdown 文件',
      properties: ['openFile'],
      filters: [
        { name: 'Markdown 文件', extensions: ['md', 'markdown'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }
    
    const filePath = result.filePaths[0]
    console.log('📄 Selected MD file:', filePath)
    
    // 读取文件内容
    const content = await fs.promises.readFile(filePath, 'utf-8')
    const fileName = path.basename(filePath)
    
    return {
      success: true,
      data: {
        content,
        fileName,
        originalPath: filePath
      }
    }
  } catch (error) {
    console.error('❌ Failed to read MD file:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 保存MD内容到知识库文档目录
 * @param {string} content - MD内容
 * @param {string} fileName - 文件名（可选，不提供则生成）
 * @param {string} existingPath - 已存在的文件路径（更新时使用）
 */
ipcMain.handle('knowledge:saveMdFile', async (_event, content, fileName, existingPath) => {
  try {
    const docsDir = path.join(getDataPath(), 'knowledge-docs')
    
    // 确保文档目录存在
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true })
      console.log('✓ Created knowledge-docs directory')
    }
    
    // 确定文件路径
    let targetFileName
    let targetPath
    
    if (existingPath) {
      // 更新现有文件
      targetPath = path.join(getDataPath(), existingPath)
      targetFileName = path.basename(existingPath)
      console.log('📝 Updating existing MD file:', existingPath)
    } else {
      // 创建新文件
      if (fileName) {
        targetFileName = fileName
      } else {
        // 生成唯一文件名
        const timestamp = Date.now()
        targetFileName = `knowledge_${timestamp}.md`
      }
      targetPath = path.join(docsDir, targetFileName)
      
      // 如果文件已存在，添加后缀
      let counter = 1
      while (fs.existsSync(targetPath)) {
        const nameWithoutExt = path.basename(targetFileName, path.extname(targetFileName))
        targetFileName = `${nameWithoutExt}_${counter}.md`
        targetPath = path.join(docsDir, targetFileName)
        counter++
      }
      
      console.log('📄 Creating new MD file:', targetFileName)
    }
    
    // 写入文件
    await fs.promises.writeFile(targetPath, content, 'utf-8')
    
    // 返回相对路径
    const relativePath = existingPath || `knowledge-docs/${targetFileName}`
    
    console.log('✅ MD file saved successfully')
    console.log('   Relative path:', relativePath)
    
    return {
      success: true,
      relativePath
    }
  } catch (error) {
    console.error('❌ Failed to save MD file:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 读取MD文件内容
 */
ipcMain.handle('knowledge:readMdFile', async (_event, relativePath) => {
  try {
    const absolutePath = path.join(getDataPath(), relativePath)
    console.log('📖 Reading MD file:', relativePath)
    
    const content = await fs.promises.readFile(absolutePath, 'utf-8')
    return { success: true, data: content }
  } catch (error) {
    console.error('❌ Failed to read MD file:', error)
    return { success: false, error: error.message }
  }
})

// ==================== 热榜聚合 API ====================

/**
 * 通用 HTTP GET 请求函数
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    }, (res) => {
      let data = ''
      
      // 处理重定向
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchData(res.headers.location).then(resolve).catch(reject)
        return
      }
      
      res.on('data', chunk => {
        data += chunk
      })
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (error) {
            resolve(data) // 返回原始数据
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        }
      })
    })
    
    request.on('error', reject)
    request.setTimeout(15000, () => {
      request.destroy()
      reject(new Error('请求超时'))
    })
  })
}

/**
 * 获取热榜数据
 */
ipcMain.handle('hotrank:fetch', async (_event, platform) => {
  try {
    console.log(`🔥 Fetching ${platform} hot rank...`)
    
    // 使用统一的热榜 API
    const apiUrl = `https://uapis.cn/api/v1/misc/hotboard?type=${platform}`
    
    const result = await fetchData(apiUrl)
    console.log(`✅ ${platform} data fetched successfully`)
    
    // 返回 list 数组
    return { success: true, data: result.list || result }
  } catch (error) {
    console.error(`❌ Failed to fetch ${platform}:`, error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 批量获取所有热榜
 */
ipcMain.handle('hotrank:fetchAll', async () => {
  const platforms = ['zhihu', 'douban', 'weibo', 'toutiao', 'hupu', 'ithome']
  const results = {}
  
  console.log('🔥 Fetching all hot ranks...')
  
  // 并发获取所有平台数据
  const promises = platforms.map(async (platform) => {
    try {
      const apiUrl = `https://uapis.cn/api/v1/misc/hotboard?type=${platform}`
      const result = await fetchData(apiUrl)
      const data = result.list || result
      return { platform, success: true, data }
    } catch (error) {
      console.error(`Failed to fetch ${platform}:`, error)
      return { platform, success: false, error: error.message }
    }
  })
  
  const allResults = await Promise.all(promises)
  
  // 转换为对象格式
  allResults.forEach(result => {
    results[result.platform] = {
      success: result.success,
      data: result.data,
      error: result.error
    }
  })
  
  console.log('✅ All hot ranks fetched')
  return { success: true, data: results }
})

// ========== 端口扫描工具 ==========
const net = require('net')

// ========== 系统监控工具 ==========
const os = require('os')

// ========== IP 扫描工具 ==========
/**
 * 扫描 IP 段中的所有 IP
 * @param {string} ipPrefix - IP 前缀，例如 "192.168.10"
 * @param {number} timeout - 超时时间（毫秒）
 */
ipcMain.handle('ip-scanner:scan', async (_event, ipPrefix, timeout = 1000) => {
  return new Promise(async (resolve) => {
    try {
      console.log(`🔍 [IP Scanner] Scanning IP range: ${ipPrefix}.1-254`)
      
      const results = []
      const isWindows = process.platform === 'win32'
      
      // 扫描 1-254（总共 254 个 IP）
      const scanPromises = []
      const BATCH_SIZE = 20
      
      for (let i = 1; i <= 254; i++) {
        const ip = `${ipPrefix}.${i}`
        const currentIndex = i // 保存当前索引，避免闭包问题
        
        // 创建 ping 扫描 Promise
        const scanPromise = new Promise((resolveIp) => {
          const args = isWindows
            ? ['/c', 'ping', '-n', '1', '-w', timeout.toString(), ip]
            : ['-c', '1', '-W', (timeout / 1000).toString(), ip]
          
          const pingCmd = isWindows ? 'cmd' : 'ping'
          const child = spawn(pingCmd, args, { 
            shell: false,
            windowsHide: true, // Windows 下隐藏命令行窗口
            encoding: 'utf8'
          })
          
          let output = ''
          
          child.stdout.on('data', (data) => {
            output += data.toString()
          })
          
          child.on('close', (code) => {
            // 更严格的在线判断：
            // 1. Windows: 必须包含 "TTL=" 且不包含失败标识
            // 2. Linux/Mac: code 为 0 或包含 ttl=
            let isOnline = false
            
            if (isWindows) {
              // Windows 中文/英文系统判断
              const hasTTL = output.includes('TTL=') || output.includes('ttl=')
              const hasFailure = output.includes('请求超时') || 
                                 output.includes('无法访问') || 
                                 output.includes('传输失败') ||
                                 output.includes('Request timed out') ||
                                 output.includes('Destination host unreachable') ||
                                 output.includes('General failure')
              
              isOnline = hasTTL && !hasFailure
            } else {
              // Linux/Mac
              isOnline = code === 0 || output.includes('ttl=')
            }
            
            const responseTime = isOnline ? extractPingTime(output, isWindows) : null
            
            // 调试日志（仅显示前几个和在线的）
            if (currentIndex <= 5 || isOnline) {
              console.log(`[IP ${ip}] code=${code}, isOnline=${isOnline}, time=${responseTime}`)
              console.log(`   output: ${output.substring(0, 150)}`)
            }
            
            // 实时发送进度到前端（包含响应时间）
            if (mainWindow) {
              mainWindow.webContents.send('ip-scanner:progress', {
                ip,
                isOnline,
                responseTime,
                current: currentIndex,
                total: 254
              })
            }
            
            resolveIp({
              ip,
              isOnline,
              responseTime
            })
          })
          
          child.on('error', () => {
            if (mainWindow) {
              mainWindow.webContents.send('ip-scanner:progress', {
                ip,
                isOnline: false,
                responseTime: null,
                current: currentIndex,
                total: 254
              })
            }
            
            resolveIp({
              ip,
              isOnline: false,
              responseTime: null
            })
          })
        })
        
        scanPromises.push(scanPromise)
        
        // 每次最多并发 BATCH_SIZE 个，避免系统资源耗尽
        if (scanPromises.length >= BATCH_SIZE) {
          const batchResults = await Promise.all(scanPromises)
          results.push(...batchResults)
          scanPromises.length = 0 // 清空数组
        }
      }
      
      // 处理最后一批（如果有剩余）
      if (scanPromises.length > 0) {
        const batchResults = await Promise.all(scanPromises)
        results.push(...batchResults)
      }
      
      // 统计结果
      const onlineIPs = results.filter(r => r.isOnline)
      const offlineIPs = results.filter(r => !r.isOnline)
      
      console.log(`✅ [IP Scanner] Scan completed:`)
      console.log(`   Total results: ${results.length}`)
      console.log(`   Online: ${onlineIPs.length}`)
      console.log(`   Offline: ${offlineIPs.length}`)
      
      // 发送完成事件
      if (mainWindow) {
        mainWindow.webContents.send('ip-scanner:complete', {
          onlineCount: onlineIPs.length,
          offlineCount: offlineIPs.length
        })
      }
      
      resolve({
        success: true,
        data: {
          results,
          onlineIPs,
          offlineIPs,
          summary: {
            total: results.length,
            online: onlineIPs.length,
            offline: offlineIPs.length
          }
        }
      })
    } catch (error) {
      console.error('❌ [IP Scanner] Scan error:', error)
      resolve({ success: false, error: error.message })
    }
  })
})

/**
 * 从 Ping 输出中提取响应时间
 */
function extractPingTime(output, isWindows) {
  try {
    if (isWindows) {
      // Windows 中文系统：
      // "时间=1ms" 或 "时间<1ms"
      let match = output.match(/时间[=<](\d+)ms/i)
      if (match) {
        return parseInt(match[1])
      }
      
      // Windows 英文系统：
      // "time=1ms" 或 "time<1ms"
      match = output.match(/time[=<](\d+)ms/i)
      if (match) {
        return parseInt(match[1])
      }
      
      // Windows 中文系统（带空格）：
      // "时间 = 1ms"
      match = output.match(/时间\s*[=<]\s*(\d+)\s*ms/i)
      if (match) {
        return parseInt(match[1])
      }
      
      // 通用匹配（最后尝试）：匹配任何 "数字ms" 模式
      match = output.match(/(\d+)\s*ms/i)
      if (match) {
        return parseInt(match[1])
      }
    } else {
      // Linux/Mac: "time=1.234 ms"
      const match = output.match(/time=([\d.]+)\s*ms/i)
      if (match) {
        return Math.round(parseFloat(match[1]))
      }
    }
    
    // 调试：如果没有匹配成功，打印输出以便分析
    if (output.includes('TTL') || output.includes('ttl')) {
      console.log('⚠️ [IP Scanner] Failed to extract time from output:', output.substring(0, 200))
    }
  } catch (err) {
    console.error('❌ [IP Scanner] Error extracting ping time:', err)
  }
  return null
}

/**
 * 扫描单个端口
 */
ipcMain.handle('scan-port', async (_event, { host, port, timeout }) => {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const socket = new net.Socket()
    
    let isResolved = false
    
    // 设置超时
    socket.setTimeout(timeout)
    
    socket.on('connect', () => {
      if (!isResolved) {
        isResolved = true
        socket.destroy()
        const responseTime = Date.now() - startTime
        resolve({ open: true, responseTime })
      }
    })
    
    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true
        socket.destroy()
        resolve({ open: false, timeout: true })
      }
    })
    
    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true
        socket.destroy()
        // ECONNREFUSED 表示端口关闭但主机可达
        // ETIMEDOUT 或 EHOSTUNREACH 表示超时
        if (err.code === 'ECONNREFUSED') {
          resolve({ open: false, refused: true })
        } else {
          resolve({ open: false, timeout: true })
        }
      }
    })
    
    try {
      socket.connect(port, host)
    } catch (err) {
      if (!isResolved) {
        isResolved = true
        resolve({ open: false, error: err.message })
      }
    }
  })
})

// ========== 网络测试工具 ==========
let pingProcess = null
let currentPingProcess = null  // 用于普通ping和traceroute

/**
 * Ping 测试
 */
ipcMain.handle('network:ping', async (_event, ip, options = {}) => {
  try {
    const { count = 4, continuous = false, timeout = 5000 } = options
    console.log('🔍 [主进程] 收到 Ping 请求:', { ip, count, continuous, timeout })
    
    // 如果是连续ping，使用不同的处理方式
    if (continuous) {
      console.log('🔄 [主进程] 启动连续 Ping')
      return startContinuousPing(ip, timeout)
    }
    
    // 普通ping
    console.log('📡 [主进程] 执行普通 Ping')
    return await executePing(ip, count, timeout)
  } catch (error) {
    console.error('❌ [主进程] Ping error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 执行普通Ping命令（实时输出版本）
 */
function executePing(ip, count, timeout) {
  console.log('📍 [executePing] 开始执行 Ping 命令')
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32'
    const args = isWindows
      ? ['/c', 'chcp 65001 >nul && ping', '-n', count.toString(), '-w', timeout.toString(), ip]
      : ['-c', count.toString(), '-W', (timeout / 1000).toString(), ip]
    
    const pingCmd = isWindows ? 'cmd' : 'ping'
    console.log('🚀 [executePing] 执行命令:', pingCmd, args.join(' '))
    
    const child = spawn(pingCmd, args, { 
      shell: false,
      encoding: 'utf8'
    })
    
    // 保存进程引用，以便可以中断
    currentPingProcess = child
    
    let output = ''
    let error = ''
    let wasCancelled = false
    
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    
    // 实时发送输出到前端
    child.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      console.log('📤 [executePing] 收到输出:', text.substring(0, 100))
      // 实时发送到前端
      if (mainWindow) {
        console.log('📨 [executePing] 发送到前端')
        mainWindow.webContents.send('network:ping-output', { type: 'data', data: text })
      } else {
        console.log('⚠️ [executePing] mainWindow 不存在!')
      }
    })
    
    child.stderr.on('data', (data) => {
      const text = data.toString()
      error += text
      if (mainWindow) {
        mainWindow.webContents.send('network:ping-output', { type: 'error', data: text })
      }
    })
    
    child.on('close', (code) => {
      console.log('✅ [executePing] 命令执行完成, code:', code)
      console.log('📊 [executePing] 输出长度:', output.length)
      
      // 清除进程引用
      if (currentPingProcess === child) {
        currentPingProcess = null
      }
      
      // 如果被取消，发送取消信号
      if (wasCancelled) {
        if (mainWindow) {
          mainWindow.webContents.send('network:ping-output', { type: 'cancelled' })
        }
        resolve({ success: false, cancelled: true, output })
        return
      }
      
      if (code === 0 || output) {
        const stats = parsePingOutput(output, isWindows)
        console.log('📈 [executePing] 统计信息:', stats)
        // 发送完成信号
        if (mainWindow) {
          mainWindow.webContents.send('network:ping-output', { type: 'complete', stats })
        }
        resolve({ success: true, output, stats })
      } else {
        console.log('❌ [executePing] 执行失败')
        resolve({ success: false, error: error || output })
      }
    })
    
    child.on('error', (err) => {
      console.log('❌ [executePing] 进程错误:', err)
      
      // 清除进程引用
      if (currentPingProcess === child) {
        currentPingProcess = null
      }
      
      resolve({ success: false, error: err.message })
    })
    
    // 监听进程被杀死的事件
    child.on('exit', (code, signal) => {
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        console.log('⏹️ [executePing] 进程被终止')
        wasCancelled = true
      }
    })
  })
}

/**
 * 启动连续Ping
 */
function startContinuousPing(ip, timeout) {
  // 停止之前的ping
  if (pingProcess) {
    pingProcess.kill()
    pingProcess = null
  }
  
  const isWindows = process.platform === 'win32'
  const args = isWindows
    ? ['/c', 'chcp 65001 >nul && ping', '-t', '-w', timeout.toString(), ip]  // Windows: -t 表示持续ping
    : ['-W', (timeout / 1000).toString(), ip]  // Linux/Mac: 不加-c就是持续ping
  
  const pingCmd = isWindows ? 'cmd' : 'ping'
  pingProcess = spawn(pingCmd, args, { 
    shell: false,
    encoding: 'utf8'
  })
  
  pingProcess.stdout.setEncoding('utf8')
  pingProcess.stderr.setEncoding('utf8')
  
  pingProcess.stdout.on('data', (data) => {
    const line = data.toString()
    if (mainWindow) {
      mainWindow.webContents.send('network:ping-output', { type: 'data', data: line })
    }
  })
  
  pingProcess.stderr.on('data', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('network:ping-output', { type: 'error', data: data.toString() })
    }
  })
  
  pingProcess.on('close', (code) => {
    if (mainWindow) {
      mainWindow.webContents.send('network:ping-output', { type: 'close', code })
    }
    pingProcess = null
  })
  
  return { success: true, message: '连续Ping已启动' }
}

/**
 * 停止所有Ping进程
 */
ipcMain.handle('network:stop-ping', () => {
  console.log('⏹️ [主进程] 收到停止Ping请求')
  const isWindows = process.platform === 'win32'
  let stopped = false
  
  // 停止连续Ping
  if (pingProcess) {
    console.log('🛑 停止连续Ping进程, PID:', pingProcess.pid)
    try {
      if (isWindows) {
        // Windows: 使用 taskkill 强制终止进程树
        spawn('taskkill', ['/pid', pingProcess.pid.toString(), '/T', '/F'])
      } else {
        // Linux/Mac: 发送 SIGTERM
        pingProcess.kill('SIGTERM')
      }
    } catch (err) {
      console.error('终止连续Ping进程失败:', err)
    }
    pingProcess = null
    stopped = true
  }
  
  // 停止普通Ping或traceroute
  if (currentPingProcess) {
    console.log('🛑 停止当前Ping/Traceroute进程, PID:', currentPingProcess.pid)
    try {
      if (isWindows) {
        // Windows: 使用 taskkill 强制终止进程树
        spawn('taskkill', ['/pid', currentPingProcess.pid.toString(), '/T', '/F'])
      } else {
        // Linux/Mac: 发送 SIGTERM
        currentPingProcess.kill('SIGTERM')
      }
    } catch (err) {
      console.error('终止Ping/Traceroute进程失败:', err)
    }
    currentPingProcess = null
    stopped = true
  }
  
  if (stopped) {
    return { success: true, message: 'Ping已停止' }
  }
  
  return { success: false, message: '没有正在运行的Ping' }
})

/**
 * 解析Ping输出统计信息
 */
function parsePingOutput(output, isWindows) {
  const stats = {
    sent: 0,
    received: 0,
    loss: 0,
    minTime: null,
    maxTime: null,
    avgTime: null
  }
  
  if (isWindows) {
    // Windows: 已发送 = 4，已接收 = 4，丢失 = 0 (0% 丢失)
    const packetMatch = output.match(/已发送 = (\d+)，已接收 = (\d+)，丢失 = (\d+)/i)
    if (packetMatch) {
      stats.sent = parseInt(packetMatch[1])
      stats.received = parseInt(packetMatch[2])
      stats.loss = parseInt(packetMatch[3])
    }
    
    // 最短 = 1ms，最长 = 2ms，平均 = 1ms
    const timeMatch = output.match(/最短 = (\d+)ms，最长 = (\d+)ms，平均 = (\d+)ms/i)
    if (timeMatch) {
      stats.minTime = parseInt(timeMatch[1])
      stats.maxTime = parseInt(timeMatch[2])
      stats.avgTime = parseInt(timeMatch[3])
    }
  } else {
    // Linux/Mac: 4 packets transmitted, 4 received, 0% packet loss
    const packetMatch = output.match(/(\d+) packets transmitted, (\d+) received/i)
    if (packetMatch) {
      stats.sent = parseInt(packetMatch[1])
      stats.received = parseInt(packetMatch[2])
      stats.loss = stats.sent - stats.received
    }
    
    // rtt min/avg/max = 1.234/2.345/3.456 ms
    const timeMatch = output.match(/rtt min\/avg\/max.*= ([\d.]+)\/([\d.]+)\/([\d.]+)/i)
    if (timeMatch) {
      stats.minTime = parseFloat(timeMatch[1])
      stats.avgTime = parseFloat(timeMatch[2])
      stats.maxTime = parseFloat(timeMatch[3])
    }
  }
  
  return stats
}

/**
 * Traceroute 路由追踪
 */
ipcMain.handle('network:traceroute', async (_event, ip) => {
  try {
    return await executeTraceroute(ip)
  } catch (error) {
    console.error('Traceroute error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 执行Traceroute命令
 */
function executeTraceroute(ip) {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32'
    const args = isWindows 
      ? ['/c', 'chcp 65001 >nul && tracert', '-d', ip]
      : ['-n', ip]
    const cmd = isWindows ? 'cmd' : 'traceroute'
    
    const child = spawn(cmd, args, { 
      shell: false,
      encoding: 'utf8'
    })
    
    // 保存进程引用，以便可以中断
    currentPingProcess = child
    
    let output = ''
    let error = ''
    let wasCancelled = false
    
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    
    // 实时输出
    child.stdout.on('data', (data) => {
      const text = data.toString()
      output += text
      if (mainWindow) {
        mainWindow.webContents.send('network:ping-output', { type: 'data', data: text })
      }
    })
    
    child.stderr.on('data', (data) => {
      const text = data.toString()
      error += text
      if (mainWindow) {
        mainWindow.webContents.send('network:ping-output', { type: 'error', data: text })
      }
    })
    
    child.on('close', (code) => {
      // 清除进程引用
      if (currentPingProcess === child) {
        currentPingProcess = null
      }
      
      // 如果被取消，发送取消信号
      if (wasCancelled) {
        if (mainWindow) {
          mainWindow.webContents.send('network:ping-output', { type: 'cancelled' })
        }
        resolve({ success: false, cancelled: true, output })
        return
      }
      
      if (code === 0 || output) {
        const hops = parseTracerouteOutput(output, isWindows)
        if (mainWindow) {
          mainWindow.webContents.send('network:ping-output', { type: 'complete' })
        }
        resolve({ success: true, output, hops })
      } else {
        resolve({ success: false, error: error || '路由追踪失败' })
      }
    })
    
    child.on('error', (err) => {
      // 清除进程引用
      if (currentPingProcess === child) {
        currentPingProcess = null
      }
      resolve({ success: false, error: err.message })
    })
    
    // 监听进程被杀死的事件
    child.on('exit', (code, signal) => {
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        wasCancelled = true
      }
    })
  })
}

/**
 * 解析Traceroute输出
 */
function parseTracerouteOutput(output, isWindows) {
  const hops = []
  const lines = output.split('\n')
  
  for (const line of lines) {
    if (isWindows) {
      // Windows: "  1    <1 ms    <1 ms    <1 ms  192.168.1.1"
      const match = line.match(/^\s*(\d+)\s+(<?\d+)\s*ms\s+(<?\d+)\s*ms\s+(<?\d+)\s*ms\s+(\S+)/)
      if (match) {
        hops.push({
          hop: parseInt(match[1]),
          ip: match[5],
          times: [match[2], match[3], match[4]].filter(t => t !== '*')
        })
      }
    } else {
      // Linux/Mac: " 1  192.168.1.1  1.234 ms  1.345 ms  1.456 ms"
      const match = line.match(/^\s*(\d+)\s+(\S+)\s+([\d.]+)\s*ms/)
      if (match) {
        hops.push({
          hop: parseInt(match[1]),
          ip: match[2],
          times: [match[3]]
        })
      }
    }
  }
  
  return hops
}

/**
 * Telnet 端口测试
 */
ipcMain.handle('network:telnet', async (_event, ip, port, timeout = 5000) => {
  try {
    return await testPort(ip, port, timeout)
  } catch (error) {
    console.error('Telnet error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * 测试端口连通性
 */
function testPort(ip, port, timeout) {
  return new Promise((resolve) => {
    const net = require('net')
    const socket = new net.Socket()
    const startTime = Date.now()
    
    socket.setTimeout(timeout)
    
    socket.connect(port, ip, () => {
      const responseTime = Date.now() - startTime
      socket.destroy()
      resolve({
        success: true,
        open: true,
        responseTime,
        message: `端口 ${port} 开放 (响应时间: ${responseTime}ms)`
      })
    })
    
    socket.on('timeout', () => {
      socket.destroy()
      resolve({
        success: true,
        open: false,
        message: `端口 ${port} 超时 (${timeout}ms)`
      })
    })
    
    socket.on('error', (err) => {
      socket.destroy()
      resolve({
        success: true,
        open: false,
        message: `端口 ${port} 关闭 (${err.message})`
      })
    })
  })
}

/**
 * 截图功能
 */

// 截取全屏
ipcMain.handle('screenshot:captureScreen', async () => {
  console.log('📸 [Screenshot] Capture screen requested...')
  try {
    // 获取所有屏幕信息
    const displays = screen.getAllDisplays()
    const primaryDisplay = screen.getPrimaryDisplay()
    console.log('📸 [Screenshot] Primary display:', primaryDisplay.size)
    
    // 使用 desktopCapturer 获取屏幕截图
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: primaryDisplay.size.width * primaryDisplay.scaleFactor,
        height: primaryDisplay.size.height * primaryDisplay.scaleFactor
      }
    })
    
    if (sources.length === 0) {
      console.error('❌ [Screenshot] No screen sources found')
      return { success: false, error: '未找到可用的屏幕' }
    }
    
    console.log('📸 [Screenshot] Found', sources.length, 'screen sources')
    
    // 获取主屏幕的截图
    const primarySource = sources[0]
    const thumbnail = primarySource.thumbnail
    const dataURL = thumbnail.toDataURL()
    
    console.log('✓ [Screenshot] Screenshot captured successfully, size:', thumbnail.getSize())
    return { success: true, data: dataURL }
  } catch (error) {
    console.error('Screenshot error:', error)
    return { success: false, error: error.message }
  }
})

// 截取当前窗口
ipcMain.handle('screenshot:captureWindow', async () => {
  console.log('📸 [Screenshot] Capture window requested...')
  try {
    if (!mainWindow) {
      console.error('❌ [Screenshot] Main window not found')
      return { success: false, error: '窗口未找到' }
    }
    
    // 捕获当前窗口
    const image = await mainWindow.capturePage()
    const dataURL = image.toDataURL()
    
    console.log('✓ [Screenshot] Window screenshot captured successfully, size:', image.getSize())
    return { success: true, data: dataURL }
  } catch (error) {
    console.error('Window screenshot error:', error)
    return { success: false, error: error.message }
  }
})

// 保存截图到本地
ipcMain.handle('screenshot:saveScreenshot', async (_event, dataURL) => {
  try {
    // 打开保存对话框
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存截图',
      defaultPath: `screenshot_${Date.now()}.png`,
      filters: [
        { name: 'PNG 图片', extensions: ['png'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    
    if (result.canceled) {
      return { success: false, error: '用户取消保存' }
    }
    
    // 将 base64 数据转换为 Buffer
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // 写入文件
    fs.writeFileSync(result.filePath, buffer)
    
    console.log('✓ Screenshot saved to:', result.filePath)
    return { success: true, path: result.filePath }
  } catch (error) {
    console.error('Save screenshot error:', error)
    return { success: false, error: error.message }
  }
})

/**
 * electron-screenshots 功能
 */

// 获取截图历史列表
ipcMain.handle('screenshots:getHistory', async () => {
  try {
    const screenshotDir = ensureScreenshotDir()
    
    // 如果目录不存在，返回空数组
    if (!fs.existsSync(screenshotDir)) {
      return { success: true, data: [] }
    }
    
    // 读取所有PNG文件
    const files = fs.readdirSync(screenshotDir)
      .filter(file => file.endsWith('.png'))
      .map(filename => {
        const filepath = path.join(screenshotDir, filename)
        const stats = fs.statSync(filepath)
        
        // 从文件名提取时间戳
        const match = filename.match(/screenshot_(\d+)\.png/)
        const timestamp = match ? parseInt(match[1]) : stats.mtimeMs
        
        return {
          filename,
          filepath,
          timestamp,
          size: stats.size,
          created: stats.birthtime
        }
      })
      // 按时间倒序排序
      .sort((a, b) => b.timestamp - a.timestamp)
    
    console.log(`✓ [Screenshots] Found ${files.length} screenshots in ${screenshotDir}`)
    return { success: true, data: files }
  } catch (error) {
    console.error('❌ [Screenshots] Get history error:', error)
    return { success: false, error: error.message }
  }
})

// 读取截图文件
ipcMain.handle('screenshots:readFile', async (_event, filepath) => {
  try {
    const buffer = fs.readFileSync(filepath)
    const base64Data = `data:image/png;base64,${buffer.toString('base64')}`
    return { success: true, data: base64Data }
  } catch (error) {
    console.error('❌ [Screenshots] Read file error:', error)
    return { success: false, error: error.message }
  }
})

// 删除截图文件
ipcMain.handle('screenshots:deleteFile', async (_event, filepath) => {
  try {
    fs.unlinkSync(filepath)
    console.log('✓ [Screenshots] Deleted:', filepath)
    return { success: true }
  } catch (error) {
    console.error('❌ [Screenshots] Delete error:', error)
    return { success: false, error: error.message }
  }
})

// 开始截图（带标注功能）
ipcMain.handle('screenshots:start', async () => {
  console.log('📸 [Screenshots] Start capture requested from frontend')
  
  try {
    if (!screenshots) {
      console.error('❌ [Screenshots] Screenshots not initialized')
      return { success: false, error: 'Screenshots 未初始化' }
    }
    
    // 🔧 修复：防止重复触发截图
    if (isCapturing) {
      console.warn('⚠ [Screenshots] Already capturing, ignoring duplicate request')
      return { success: false, error: '截图已在进行中' }
    }
    
    isCapturing = true
    screenshots.startCapture()
    
    // 10秒后自动重置状态（防止卡住）
    setTimeout(() => {
      isCapturing = false
    }, 10000)
    
    return { success: true }
  } catch (error) {
    isCapturing = false
    console.error('❌ [Screenshots] Start capture error:', error)
    return { success: false, error: error.message }
  }
})

// 结束截图
ipcMain.handle('screenshots:end', async () => {
  console.log('📸 [Screenshots] End capture requested')
  
  try {
    if (screenshots) {
      screenshots.endCapture()
    }
    return { success: true }
  } catch (error) {
    console.error('❌ [Screenshots] End capture error:', error)
    return { success: false, error: error.message }
  }
})

// ==================== 系统监控 ====================

/**
 * 获取 CPU 使用率（简化版本，基于负载平均值）
 */
function getCPUUsage() {
  const cpus = os.cpus()
  const model = cpus[0].model
  const cores = cpus.length
  const arch = os.arch()
  
  // 计算 CPU 使用率
  let totalIdle = 0
  let totalTick = 0
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type]
    }
    totalIdle += cpu.times.idle
  })
  
  const idle = totalIdle / cpus.length
  const total = totalTick / cpus.length
  const usage = 100 - Math.floor((idle / total) * 100)
  
  return {
    model,
    cores,
    arch,
    usage: Math.max(0, Math.min(100, usage)) // 确保在 0-100 范围内
  }
}

/**
 * 获取内存信息
 */
function getMemoryInfo() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const usagePercent = (used / total) * 100
  
  return {
    total,
    free,
    used,
    usagePercent
  }
}

/**
 * 获取磁盘信息（Windows）
 */
function getDiskInfo() {
  const disks = []
  
  try {
    // Windows: 使用 wmic 命令获取磁盘信息
    if (process.platform === 'win32') {
      const { execSync } = require('child_process')
      
      try {
        // 执行 wmic 命令获取逻辑磁盘信息
        const output = execSync('wmic logicaldisk get caption,filesystem,size,freespace', {
          encoding: 'utf8',
          windowsHide: true
        })
        
        const lines = output.trim().split('\n').slice(1) // 跳过标题行
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/)
          if (parts.length >= 4 && parts[1] !== '') {
            const mount = parts[0] // 例如 C:
            const fs = parts[1] // 文件系统类型
            const free = parseInt(parts[2]) || 0
            const total = parseInt(parts[3]) || 0
            
            if (total > 0) {
              const used = total - free
              const usagePercent = (used / total) * 100
              
              disks.push({
                mount,
                fs,
                total,
                free,
                used,
                usagePercent
              })
            }
          }
        }
      } catch (wmicError) {
        console.error('Failed to get disk info via wmic:', wmicError)
      }
    } else {
      // Linux/Mac: 可以使用 df 命令（这里先提供一个占位）
      disks.push({
        mount: '/',
        fs: 'ext4',
        total: 0,
        free: 0,
        used: 0,
        usagePercent: 0
      })
    }
  } catch (error) {
    console.error('Error getting disk info:', error)
  }
  
  // 如果没有获取到磁盘信息，返回空数组
  return disks
}

/**
 * 获取操作系统信息
 */
function getOSInfo() {
  return {
    platform: os.platform(),
    release: os.release(),
    hostname: os.hostname(),
    arch: os.arch(),
    uptime: os.uptime()
  }
}

/**
 * 获取网络接口信息
 */
function getNetworkInfo() {
  const interfaces = os.networkInterfaces()
  const result = {}
  
  for (const name in interfaces) {
    const addrs = interfaces[name]
    result[name] = addrs
      .filter(addr => !addr.internal) // 过滤掉内部地址
      .map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal
      }))
  }
  
  return result
}

/**
 * 获取完整系统信息
 */
ipcMain.handle('system:getInfo', async () => {
  try {
    console.log('📊 [System] Getting system information...')
    
    const systemInfo = {
      cpu: getCPUUsage(),
      memory: getMemoryInfo(),
      disks: getDiskInfo(),
      os: getOSInfo(),
      network: getNetworkInfo()
    }
    
    console.log('✅ [System] System information retrieved successfully')
    return { success: true, data: systemInfo }
  } catch (error) {
    console.error('❌ [System] Failed to get system information:', error)
    return { success: false, error: error.message }
  }
})

// ========================================
// Redis 连接管理
// ========================================

const Redis = require('ioredis')

let redisClient = null
let redisConfig = null

/**
 * 连接 Redis 数据库
 */
ipcMain.handle('redis:connect', async (_event, config) => {
  try {
    console.log('🔵 [Redis] 开始连接 Redis...')
    console.log('🔵 [Redis] 配置:', { ...config, password: config.password ? '***' : '(无)' })
    
    // 关闭之前的连接
    if (redisClient) {
      console.log('🔵 [Redis] 关闭旧连接...')
      redisClient.disconnect()
      redisClient = null
    }
    
    // 构建连接选项
    const options = {
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      username: config.username || undefined,
      db: 0, // 默认连接到 DB0
      retryStrategy: (times) => {
        if (times > 3) {
          return null // 停止重试
        }
        return Math.min(times * 100, 3000)
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true, // 不自动连接，手动调用 connect()
    }
    
    // SSL/TLS 配置
    if (config.ssl) {
      options.tls = {}
    }
    
    // 创建 Redis 客户端
    if (config.cluster) {
      // Cluster 模式
      console.log('🔵 [Redis] 使用 Cluster 模式')
      redisClient = new Redis.Cluster([{ host: config.host, port: config.port }], {
        redisOptions: options
      })
    } else if (config.sentinel) {
      // Sentinel 模式
      console.log('🔵 [Redis] 使用 Sentinel 模式')
      redisClient = new Redis({
        ...options,
        sentinels: [{ host: config.host, port: config.port }],
        name: 'mymaster', // sentinel master name
      })
    } else {
      // 普通模式
      console.log('🔵 [Redis] 使用普通模式')
      redisClient = new Redis(options)
    }
    
    // 连接错误处理
    redisClient.on('error', (err) => {
      console.error('❌ [Redis] 连接错误:', err.message)
    })
    
    redisClient.on('ready', () => {
      console.log('✅ [Redis] 连接就绪')
    })
    
    // 尝试连接
    await redisClient.connect()
    
    // 测试连接
    const pong = await redisClient.ping()
    if (pong !== 'PONG') {
      throw new Error('Redis PING 测试失败')
    }
    
    // 保存配置
    redisConfig = config
    
    // 获取服务器信息
    const info = await redisClient.info('server')
    const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'
    
    console.log('✅ [Redis] 连接成功')
    console.log('✅ [Redis] 服务器版本:', version)
    
    return { 
      success: true, 
      data: {
        version,
        host: config.host,
        port: config.port
      }
    }
  } catch (error) {
    console.error('❌ [Redis] 连接失败:', error.message)
    
    // 清理连接
    if (redisClient) {
      try {
        redisClient.disconnect()
      } catch (e) {
        // 忽略断开连接时的错误
      }
      redisClient = null
    }
    
    return { 
      success: false, 
      error: error.message || '连接失败' 
    }
  }
})

/**
 * 断开 Redis 连接
 */
ipcMain.handle('redis:disconnect', async () => {
  try {
    console.log('🔵 [Redis] 断开连接...')
    
    if (redisClient) {
      await redisClient.quit()
      redisClient = null
      redisConfig = null
      console.log('✅ [Redis] 已断开连接')
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ [Redis] 断开连接失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 执行 Redis 命令
 */
ipcMain.handle('redis:execute', async (_event, command) => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 执行命令:', command)
    
    // 解析命令
    const parts = command.trim().split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)
    
    // 执行命令
    const result = await redisClient.call(cmd, ...args)
    
    console.log('✅ [Redis] 命令执行成功')
    
    return { 
      success: true, 
      data: result 
    }
  } catch (error) {
    console.error('❌ [Redis] 命令执行失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 获取所有数据库信息
 */
ipcMain.handle('redis:getDatabases', async () => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 获取数据库列表...')
    
    // 获取 Redis 配置中的数据库数量（默认 16）
    const configInfo = await redisClient.config('GET', 'databases')
    const dbCount = parseInt(configInfo[1]) || 16
    
    // 获取每个数据库的键数量
    const databases = []
    const currentDb = await redisClient.call('SELECT', 0)
    
    for (let i = 0; i < dbCount; i++) {
      await redisClient.select(i)
      const dbSize = await redisClient.dbsize()
      databases.push({
        index: i,
        keys: dbSize
      })
    }
    
    // 恢复到原来的数据库
    await redisClient.select(0)
    
    console.log('✅ [Redis] 获取数据库列表成功')
    
    return { 
      success: true, 
      data: databases 
    }
  } catch (error) {
    console.error('❌ [Redis] 获取数据库列表失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 选择数据库
 */
ipcMain.handle('redis:selectDb', async (_event, dbIndex) => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 切换到数据库', dbIndex)
    
    await redisClient.select(dbIndex)
    
    console.log('✅ [Redis] 数据库切换成功')
    
    return { success: true }
  } catch (error) {
    console.error('❌ [Redis] 数据库切换失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 获取键列表（使用 SCAN 命令，限制数量）
 */
ipcMain.handle('redis:getKeys', async (_event, pattern = '*', limit = 100) => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 获取键列表, 模式:', pattern, ', 限制:', limit)
    
    const keys = []
    let cursor = '0'
    
    // 使用 SCAN 命令分批获取键，避免阻塞
    do {
      const result = await redisClient.scan(
        cursor,
        'MATCH', pattern,
        'COUNT', 100  // 每次扫描的数量
      )
      
      cursor = result[0]  // 新的游标
      const batchKeys = result[1]  // 本批次的键
      
      keys.push(...batchKeys)
      
      // 达到限制数量则停止
      if (keys.length >= limit) {
        keys.splice(limit)  // 只保留前 limit 个
        break
      }
      
      // cursor 为 0 表示扫描完成
    } while (cursor !== '0')
    
    console.log('✅ [Redis] 获取键列表成功, 共', keys.length, '个键')
    
    return { 
      success: true, 
      data: keys,
      hasMore: cursor !== '0' || keys.length === limit  // 是否还有更多
    }
  } catch (error) {
    console.error('❌ [Redis] 获取键列表失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 获取键值和类型
 */
ipcMain.handle('redis:getKeyValue', async (_event, key) => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 获取键值:', key)
    
    // 获取键的类型
    const type = await redisClient.type(key)
    
    let value = null
    
    // 根据类型获取值
    switch (type) {
      case 'string':
        value = await redisClient.get(key)
        break
      case 'list':
        value = await redisClient.lrange(key, 0, -1)
        break
      case 'set':
        value = await redisClient.smembers(key)
        break
      case 'zset':
        value = await redisClient.zrange(key, 0, -1, 'WITHSCORES')
        break
      case 'hash':
        value = await redisClient.hgetall(key)
        break
      default:
        value = null
    }
    
    console.log('✅ [Redis] 获取键值成功, 类型:', type)
    
    return { 
      success: true, 
      data: {
        type,
        value
      }
    }
  } catch (error) {
    console.error('❌ [Redis] 获取键值失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 设置键值
 */
ipcMain.handle('redis:setKeyValue', async (_event, key, value) => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 设置键值:', key)
    
    // 目前只支持 string 类型
    await redisClient.set(key, value)
    
    console.log('✅ [Redis] 设置键值成功')
    
    return { success: true }
  } catch (error) {
    console.error('❌ [Redis] 设置键值失败:', error.message)
    return { success: false, error: error.message }
  }
})

/**
 * 删除键
 */
ipcMain.handle('redis:deleteKey', async (_event, key) => {
  try {
    if (!redisClient) {
      return { success: false, error: '请先连接 Redis' }
    }
    
    console.log('🔵 [Redis] 删除键:', key)
    
    await redisClient.del(key)
    
    console.log('✅ [Redis] 删除键成功')
    
    return { success: true }
  } catch (error) {
    console.error('❌ [Redis] 删除键失败:', error.message)
    return { success: false, error: error.message }
  }
})

