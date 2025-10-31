declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron API 全局类型声明
interface Window {
  electronAPI?: {
    windowMinimize: () => void
    windowMaximize: () => void
    windowClose: () => void
    getAppVersion: () => Promise<string>
    getAppPath: () => Promise<string>
    platform: NodeJS.Platform
    readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>
    writeFile: (filePath: string, content: string, isBase64?: boolean) => Promise<{ success: boolean; error?: string }>
    fileExists: (filePath: string) => Promise<boolean>
    copyFile: (sourcePath: string, destPath: string) => Promise<{ success: boolean; error?: string }>
    selectFile: (options?: any) => Promise<{ canceled: boolean; filePaths: string[] }>
    deleteFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
    openExternal: (url: string) => Promise<void>
  }
}

