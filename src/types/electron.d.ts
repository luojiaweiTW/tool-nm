export interface SSHConfig {
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  password?: string
  keyPath?: string
}

export interface SSHResult {
  success: boolean
  error?: string
}

export interface SSHHistoryResult {
  success: boolean
  data?: any[]
  error?: string
}

export interface HotRankResult {
  success: boolean
  data?: any
  error?: string
}

export interface ElectronAPI {
  ssh: {
    connect: (config: SSHConfig) => Promise<SSHResult>
    disconnect: () => Promise<SSHResult>
    sendCommand: (command: string) => Promise<SSHResult>
    onOutput: (callback: (data: string) => void) => void
    onError: (callback: (error: string) => void) => void
    onClose: (callback: (code: number) => void) => void
    saveHistory: (history: any[]) => Promise<SSHResult>
    loadHistory: () => Promise<SSHHistoryResult>
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  // 剪贴板监听
  send: (channel: string, ...args: any[]) => void
  on: (channel: string, callback: (...args: any[]) => void) => void
  removeListener: (channel: string, callback: (...args: any[]) => void) => void
}

export interface PortScanResult {
  open: boolean
  responseTime?: number
  timeout?: boolean
  refused?: boolean
  error?: string
}

export interface SystemInfo {
  cpu: {
    model: string
    cores: number
    usage: number
    arch: string
  }
  memory: {
    total: number
    free: number
    used: number
    usagePercent: number
  }
  disks: Array<{
    mount: string
    fs: string
    total: number
    used: number
    free: number
    usagePercent: number
  }>
  os: {
    platform: string
    release: string
    hostname: string
    arch: string
    uptime: number
  }
  network: Record<string, Array<{
    address: string
    family: string
    internal: boolean
  }>>
}

export interface SystemInfoResult {
  success: boolean
  data?: SystemInfo
  error?: string
}

export interface ElectronWindowAPI {
  // 窗口控制
  windowMinimize?: () => void
  windowMaximize?: () => void
  windowClose?: () => void
  
  // 应用信息
  getAppVersion?: () => Promise<string>
  getAppPath?: () => Promise<string>
  platform?: string
  
  // 文件系统
  readFile?: (filePath: string) => Promise<any>
  writeFile?: (filePath: string, content: string, isBase64?: boolean) => Promise<any>
  fileExists?: (filePath: string) => Promise<boolean>
  copyFile?: (sourcePath: string, destPath: string) => Promise<any>
  selectFile?: (options?: any) => Promise<any>
  deleteFile?: (filePath: string) => Promise<any>
  
  // 热榜聚合
  fetchHotRank?: (platform: string) => Promise<HotRankResult>
  fetchAllHotRanks?: () => Promise<HotRankResult>
  
  // 网络工具
  network?: {
    ping?: (ip: string, options?: any) => Promise<any>
    traceroute?: (ip: string) => Promise<any>
    telnet?: (ip: string, port: number, timeout: number) => Promise<any>
    scanPort?: (host: string, port: number, timeout: number) => Promise<PortScanResult>
    onPingOutput?: (callback: (data: any) => void) => void
    removePingOutputListener?: () => void
    stopPing?: () => Promise<any>
  }
  
  // 外部链接
  openExternal?: (url: string) => void
  
  // 数据目录
  openUserDataDir?: () => Promise<{ success: boolean; path?: string; error?: string }>
  
  // 截图功能（旧版）
  screenshot?: {
    captureScreen?: () => Promise<{ success: boolean; data?: string; error?: string }>
    captureWindow?: () => Promise<{ success: boolean; data?: string; error?: string }>
    saveScreenshot?: (dataURL: string) => Promise<{ success: boolean; path?: string; error?: string }>
  }
  
  // electron-screenshots（新版 - 带标注功能）
  screenshots?: {
    start?: () => Promise<{ success: boolean; error?: string }>
    end?: () => Promise<{ success: boolean; error?: string }>
    getHistory?: () => Promise<{ 
      success: boolean
      data?: Array<{
        filename: string
        filepath: string
        timestamp: number
        size: number
        created: Date
      }>
      error?: string
    }>
    readFile?: (filepath: string) => Promise<{ success: boolean; data?: string; error?: string }>
    deleteFile?: (filepath: string) => Promise<{ success: boolean; error?: string }>
    createPinWindow?: (data: {
      imageData: string
      bounds: { x: number; y: number; width: number; height: number }
      filepath?: string
    }) => Promise<{ success: boolean; error?: string }>
    onCaptured?: (callback: (data: {
      data: string
      bounds: { x: number; y: number; width: number; height: number }
      timestamp: number
      filepath?: string
      filename?: string
    }) => void) => void
    onCancelled?: (callback: () => void) => void
    removeListeners?: () => void
  }
  
  // 系统监控
  system?: {
    getInfo?: () => Promise<SystemInfoResult>
  }
  
  // 通用 IPC 调用
  invoke?: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    electron?: ElectronAPI
    electronAPI?: ElectronWindowAPI
  }
}

export {}

