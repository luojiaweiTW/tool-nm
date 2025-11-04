import { app, BrowserWindow, Menu, globalShortcut, ipcMain, dialog, shell, nativeImage } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { existsSync, mkdirSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development'

// 设置应用名称和进程标题（在任务管理器中显示）
const APP_NAME = 'IWork'
app.setName(APP_NAME)
app.setAppUserModelId('com.iwork.app')

// 强制设置进程标题（特别是在开发模式下）
// 这会影响任务管理器中的进程名称显示
if (process.platform === 'win32') {
  process.title = APP_NAME
}

/**
 * 创建主窗口
 */
function createWindow() {
  // 加载应用图标
  const iconPath = isDev 
    ? join(__dirname, '../../build/icon.ico')  // 开发模式
    : join(process.resourcesPath, 'icon.ico')  // 打包后
  
  let icon: Electron.NativeImage | undefined
  if (existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath)
    console.log('✓ Icon loaded from:', iconPath)
  } else {
    console.warn('⚠️ Icon not found at:', iconPath)
  }
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'IWork',
    icon: icon,  // 设置窗口图标
    backgroundColor: '#0a0e27',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/index.js'),
      devTools: isDev,
    },
    frame: true, // 使用系统边框
    show: false, // 等待ready-to-show事件
  })

  // 窗口准备好后显示，避免闪烁
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.reload()
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
            mainWindow?.webContents.setZoomLevel(0)
          },
        },
        {
          label: '放大',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            const level = mainWindow?.webContents.getZoomLevel() || 0
            mainWindow?.webContents.setZoomLevel(level + 0.5)
          },
        },
        {
          label: '缩小',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            const level = mainWindow?.webContents.getZoomLevel() || 0
            mainWindow?.webContents.setZoomLevel(level - 0.5)
          },
        },
        { type: 'separator' },
        {
          label: '全屏',
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow?.isFullScreen()
            mainWindow?.setFullScreen(!isFullScreen)
          },
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow?.webContents.toggleDevTools()
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
            mainWindow?.minimize()
          },
        },
        {
          label: '最大化',
          click: () => {
            if (mainWindow?.isMaximized()) {
              mainWindow.unmaximize()
            } else {
              mainWindow?.maximize()
            }
          },
        },
        { type: 'separator' },
        {
          label: '置顶',
          type: 'checkbox',
          click: (menuItem) => {
            mainWindow?.setAlwaysOnTop(menuItem.checked)
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '打开数据目录',
          click: async () => {
            const userDataPath = app.getPath('userData')
            // 确保目录存在
            if (!existsSync(userDataPath)) {
              mkdirSync(userDataPath, { recursive: true })
            }
            await shell.openPath(userDataPath)
          },
        },
        { type: 'separator' },
        {
          label: '关于 IWork',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 IWork',
              message: 'IWork - 爱工作',
              detail: `版本: ${app.getVersion()}\n\n实用开发工具合集\n\n数据位置:\n${app.getPath('userData')}`,
              buttons: ['确定'],
            })
          },
        },
        { type: 'separator' },
        {
          label: '访问 GitHub',
          click: () => {
            shell.openExternal('https://github.com/yourusername/iwork')
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

/**
 * 注册全局快捷键（仅在非开发模式下注册，避免与浏览器快捷键冲突）
 */
function registerGlobalShortcuts() {
  // 显示/隐藏窗口
  globalShortcut.register('CmdOrCtrl+Shift+N', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
}

/**
 * IPC 通信处理
 */
function setupIPC() {
  // 窗口控制
  ipcMain.on('window-minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow?.close()
  })

  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // 获取应用路径（用户数据目录，升级时不会丢失）
  ipcMain.handle('get-app-path', () => {
    // 始终返回用户数据目录，确保升级时数据不丢失
    // Windows: %APPDATA%/IWork
    // macOS: ~/Library/Application Support/IWork
    // Linux: ~/.config/IWork
    return app.getPath('userData')
  })

  // 读取文件
  ipcMain.handle('read-file', async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 写入文件
  ipcMain.handle('write-file', async (_, filePath: string, content: string, isBase64?: boolean) => {
    try {
      // 确保目录存在
      const dir = join(filePath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      
      // 如果是 base64 數據（圖片），以二進制方式寫入
      if (isBase64) {
        const buffer = Buffer.from(content, 'base64')
        await fs.writeFile(filePath, buffer)
      } else {
        // 普通文本文件
        await fs.writeFile(filePath, content, 'utf-8')
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 检查文件是否存在
  ipcMain.handle('file-exists', async (_, filePath: string) => {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  })

  // 复制文件（用于图片上传）
  ipcMain.handle('copy-file', async (_, sourcePath: string, destPath: string) => {
    try {
      // 确保目标目录存在
      const dir = join(destPath, '..')
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      await fs.copyFile(sourcePath, destPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 选择文件对话框
  ipcMain.handle('select-file', async (_, options?: Electron.OpenDialogOptions) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: options?.filters || [],
      ...options,
    })
    return result
  })

  // 删除文件
  ipcMain.handle('delete-file', async (_, filePath: string) => {
    try {
      await fs.unlink(filePath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
  
  // Shell 操作：打开外部链接
  ipcMain.handle('shell-open-external', async (_, url: string) => {
    try {
      await shell.openExternal(url)
    } catch (error: any) {
      console.error('Failed to open external URL:', error)
    }
  })

  // Shell 操作：打开数据目录
  ipcMain.handle('open-user-data-dir', async () => {
    try {
      const userDataPath = app.getPath('userData')
      // 确保目录存在
      if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath, { recursive: true })
      }
      await shell.openPath(userDataPath)
      return { success: true, path: userDataPath }
    } catch (error: any) {
      console.error('Failed to open user data directory:', error)
      return { success: false, error: error.message }
    }
  })

  // 执行系统命令（用于端口扫描等功能）
  ipcMain.handle('exec-command', async (_, command: string) => {
    try {
      const { stdout, stderr } = await execAsync(command, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      })
      return { success: true, stdout, stderr }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || ''
      }
    }
  })

  // 杀死进程（用于端口管理）
  ipcMain.handle('kill-process', async (_, pid: number) => {
    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /F /PID ${pid}`)
      } else {
        await execAsync(`kill -9 ${pid}`)
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}

/**
 * 应用启动
 */
app.whenReady().then(() => {
  createWindow()
  createMenu()
  registerGlobalShortcuts()
  setupIPC()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

/**
 * 所有窗口关闭时退出（macOS 除外）
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
})

