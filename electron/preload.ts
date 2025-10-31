import { contextBridge, ipcRenderer } from 'electron'

/**
 * 向渲染进程暴露受限的 Electron API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // 平台信息
  platform: process.platform,

  // 文件系统操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string, isBase64?: boolean) => ipcRenderer.invoke('write-file', filePath, content, isBase64),
  fileExists: (filePath: string) => ipcRenderer.invoke('file-exists', filePath),
  copyFile: (sourcePath: string, destPath: string) => ipcRenderer.invoke('copy-file', sourcePath, destPath),
  selectFile: (options?: any) => ipcRenderer.invoke('select-file', options),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  
  // Shell 操作
  openExternal: (url: string) => ipcRenderer.invoke('shell-open-external', url),
  
  // 数据目录
  openUserDataDir: () => ipcRenderer.invoke('open-user-data-dir'),
  
  // 系统命令
  execCommand: (command: string) => ipcRenderer.invoke('exec-command', command),
  killProcess: (pid: number) => ipcRenderer.invoke('kill-process', pid),
})

// 类型声明
export interface ElectronAPI {
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  getAppVersion: () => Promise<string>
  getAppPath: () => Promise<string>
  platform: NodeJS.Platform
  
  // 文件系统
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
  writeFile: (filePath: string, content: string, isBase64?: boolean) => Promise<{ success: boolean; error?: string }>
  fileExists: (filePath: string) => Promise<boolean>
  copyFile: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>
  selectFile: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
  deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  
  // Shell 操作
  openExternal: (url: string) => Promise<void>
  
  // 数据目录
  openUserDataDir: () => Promise<{ success: boolean; path?: string; error?: string }>
  
  // 系统命令
  execCommand: (command: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>
  killProcess: (pid: number) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

