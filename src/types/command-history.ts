/**
 * 终端命令历史类型定义
 */

// 命令历史记录
export interface CommandHistory {
  id: string
  command: string
  description?: string
  serverName?: string // 服务器名称
  serverHost?: string // 服务器地址
  workingDirectory?: string // 工作目录
  exitCode?: number // 退出码
  output?: string // 命令输出（可选）
  executedAt: string // 执行时间
  duration?: number // 执行时长（毫秒）
  isFavorite: boolean // 是否收藏
  tags: string[] // 标签
  category?: string // 分类
}

// 命令标签
export interface CommandTag {
  id: string
  name: string
  color: string
}

// 命令分类
export interface CommandCategory {
  id: string
  name: string
  icon: string
  color: string
}

// 收藏的命令（快捷命令）
export interface FavoriteCommand {
  id: string
  name: string
  command: string
  description?: string
  category?: string
  tags: string[]
  usageCount: number
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

// 命令历史数据库
export interface CommandHistoryDatabase {
  history: CommandHistory[]
  favorites: FavoriteCommand[]
  categories: CommandCategory[]
  tags: CommandTag[]
  version: string
}

// 命令筛选器
export interface CommandFilter {
  searchText?: string
  serverHost?: string
  category?: string
  tagIds?: string[]
  isFavorite?: boolean
  dateRange?: {
    start: string
    end: string
  }
}

// 命令统计
export interface CommandStats {
  totalCommands: number
  favoriteCommands: number
  byServer: Record<string, number>
  byCategory: Record<string, number>
  byTag: Record<string, number>
  mostUsed: CommandHistory[]
  recentlyUsed: CommandHistory[]
  topServers: Array<{ host: string; count: number }>
}

// SSH服务器信息（用于关联）
export interface SSHServerInfo {
  host: string
  port: number
  username: string
  name?: string
}
