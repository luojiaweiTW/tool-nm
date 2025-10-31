const { contextBridge, ipcRenderer } = require('electron')

console.log('Preload script loaded!')

// 暴露 SSH 和 SFTP API 到渲染进程
contextBridge.exposeInMainWorld('electron', {
  ssh: {
    // 连接 SSH
    connect: (config) => ipcRenderer.invoke('ssh:connect', config),
    
    // 断开连接
    disconnect: () => ipcRenderer.invoke('ssh:disconnect'),
    
    // 🔥 强制结束 Shell 会话（用于无法中断的程序）
    forceKillSession: () => ipcRenderer.invoke('ssh:forceKillSession'),
    
    // 发送命令
    sendCommand: (command) => {
      // 确保控制字符正确传递
      console.log('[Preload] Sending command, length:', command.length, 'charCode:', command.charCodeAt(0))
      return ipcRenderer.invoke('ssh:sendCommand', command)
    },
    
    // 发送数据（用于xterm的实时输入）
    sendData: (data) => {
      return ipcRenderer.invoke('ssh:sendData', data)
    },
    
    // 调整终端大小
    resize: (cols, rows) => {
      return ipcRenderer.invoke('ssh:resize', cols, rows)
    },
    
    // 监听输出
    onOutput: (callback) => {
      ipcRenderer.on('ssh:output', (_event, data) => callback(data))
    },
    
    // 监听错误
    onError: (callback) => {
      ipcRenderer.on('ssh:error', (_event, data) => callback(data))
    },
    
    // 监听关闭
    onClose: (callback) => {
      ipcRenderer.on('ssh:close', (_event, code) => callback(code))
    },
    
    // 保存历史记录
    saveHistory: (history) => ipcRenderer.invoke('ssh:saveHistory', history),
    
    // 加载历史记录
    loadHistory: () => ipcRenderer.invoke('ssh:loadHistory'),
    
    // 复制密钥文件到 toolData
    copyKeyFile: (sourcePath) => ipcRenderer.invoke('ssh:copyKeyFile', sourcePath),
    
    // 保存快捷命令配置
    saveCommands: (commands) => ipcRenderer.invoke('ssh:saveCommands', commands),
    
    // 加载快捷命令配置
    loadCommands: () => ipcRenderer.invoke('ssh:loadCommands'),
  },
  
  sftp: {
    // 列出目录
    listDir: (remotePath) => ipcRenderer.invoke('sftp:listDir', remotePath),
    
    // 下载文件
    downloadFile: (remotePath, localPath) => ipcRenderer.invoke('sftp:downloadFile', remotePath, localPath),
    
    // 上传文件
    uploadFile: (localPath, remotePath) => ipcRenderer.invoke('sftp:uploadFile', localPath, remotePath),
    
    // 删除文件
    deleteFile: (remotePath) => ipcRenderer.invoke('sftp:deleteFile', remotePath),
    
    // 创建目录
    createDir: (remotePath) => ipcRenderer.invoke('sftp:createDir', remotePath),
    
    // 监听上传进度
    onUploadProgress: (callback) => {
      ipcRenderer.on('sftp:upload-progress', (_event, data) => callback(data))
    },
    
    // 监听下载进度
    onDownloadProgress: (callback) => {
      ipcRenderer.on('sftp:download-progress', (_event, data) => callback(data))
    },
  },
  
  dialog: {
    // 选择文件
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
    
    // 选择保存路径
    selectSavePath: (defaultName) => ipcRenderer.invoke('dialog:selectSavePath', defaultName),
  },
  
  http: {
    // 保存历史记录
    saveHistory: (history) => ipcRenderer.invoke('http:saveHistory', history),
    
    // 加载历史记录
    loadHistory: () => ipcRenderer.invoke('http:loadHistory'),
  },
  
  // 剪贴板监听
  send: (channel, ...args) => ipcRenderer.send(channel, ...args),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(_event, ...args))
  },
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback)
  }
})

// 暴露 electronAPI 用於知識庫等功能
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  
  // 應用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // 平台信息
  platform: process.platform,

  // 文件系統操作
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content, isBase64) => ipcRenderer.invoke('write-file', filePath, content, isBase64),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  copyFile: (sourcePath, destPath) => ipcRenderer.invoke('copy-file', sourcePath, destPath),
  selectFile: (options) => ipcRenderer.invoke('select-file', options),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  
  // 热榜聚合
  fetchHotRank: (platform) => ipcRenderer.invoke('hotrank:fetch', platform),
  fetchAllHotRanks: () => ipcRenderer.invoke('hotrank:fetchAll'),
  
  // 网络测试工具
  network: {
    // Ping 测试
    ping: (ip, options) => ipcRenderer.invoke('network:ping', ip, options),
    // Traceroute 路由追踪
    traceroute: (ip) => ipcRenderer.invoke('network:traceroute', ip),
    // Telnet 端口测试
    telnet: (ip, port, timeout) => ipcRenderer.invoke('network:telnet', ip, port, timeout),
    // 端口扫描
    scanPort: (host, port, timeout) => ipcRenderer.invoke('scan-port', { host, port, timeout }),
    // 监听ping输出（用于长ping）
    onPingOutput: (callback) => {
      // 先移除所有旧的监听器，避免重复注册
      ipcRenderer.removeAllListeners('network:ping-output')
      ipcRenderer.on('network:ping-output', (_event, data) => callback(data))
    },
    // 移除ping输出监听器
    removePingOutputListener: () => {
      ipcRenderer.removeAllListeners('network:ping-output')
    },
    // 取消长ping
    stopPing: () => ipcRenderer.invoke('network:stop-ping'),
  },
  
  // 知识库MD文件管理
  knowledge_selectMdFile: () => ipcRenderer.invoke('knowledge:selectMdFile'),
  knowledge_saveMdFile: (content, fileName, existingPath) => ipcRenderer.invoke('knowledge:saveMdFile', content, fileName, existingPath),
  knowledge_readMdFile: (relativePath) => ipcRenderer.invoke('knowledge:readMdFile', relativePath),
  
  // 截图功能（旧版）
  screenshot: {
    captureScreen: () => ipcRenderer.invoke('screenshot:captureScreen'),
    captureWindow: () => ipcRenderer.invoke('screenshot:captureWindow'),
    saveScreenshot: (dataURL) => ipcRenderer.invoke('screenshot:saveScreenshot', dataURL),
  },
  
  // electron-screenshots（新版 - 带标注功能）
  screenshots: {
    // 开始截图
    start: () => ipcRenderer.invoke('screenshots:start'),
    // 结束截图
    end: () => ipcRenderer.invoke('screenshots:end'),
    // 获取截图历史
    getHistory: () => ipcRenderer.invoke('screenshots:getHistory'),
    // 读取截图文件
    readFile: (filepath) => ipcRenderer.invoke('screenshots:readFile', filepath),
    // 删除截图文件
    deleteFile: (filepath) => ipcRenderer.invoke('screenshots:deleteFile', filepath),
    // 📌 创建置顶窗口
    createPinWindow: (data) => ipcRenderer.invoke('screenshots:createPinWindow', data),
    // 监听截图完成（允许多个监听器，不要删除已有的）
    onCaptured: (callback) => {
      ipcRenderer.on('screenshot-captured', (_event, data) => callback(data))
    },
    // 监听截图取消（允许多个监听器，不要删除已有的）
    onCancelled: (callback) => {
      ipcRenderer.on('screenshot-cancelled', () => callback())
    },
    // 移除监听器
    removeListeners: () => {
      ipcRenderer.removeAllListeners('screenshot-captured')
      ipcRenderer.removeAllListeners('screenshot-cancelled')
    },
  },
  
  // 系统监控
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
  },
  
  // 通用 IPC 调用（用于系统监控等需要灵活调用的场景）
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
})

console.log('✅ electronAPI exposed successfully!')

