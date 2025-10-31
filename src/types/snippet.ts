/**
 * 代码片段类型定义
 */

// 支持的编程语言
export type SnippetLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'go'
  | 'rust'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'swift'
  | 'kotlin'
  | 'sql'
  | 'bash'
  | 'powershell'
  | 'html'
  | 'css'
  | 'scss'
  | 'less'
  | 'json'
  | 'yaml'
  | 'markdown'
  | 'xml'
  | 'dockerfile'
  | 'other'

// 代码片段标签
export interface SnippetTag {
  id: string
  name: string
  color: string
}

// 代码片段分类
export interface SnippetCategory {
  id: string
  name: string
  icon: string
  color: string
}

// 代码片段
export interface Snippet {
  id: string
  title: string
  description: string
  code: string
  language: SnippetLanguage
  categoryId: string
  tags: string[] // tag ids
  isPinned: boolean
  isFavorite: boolean
  isPublic: boolean // 是否公开（未来可用于分享）
  createdAt: string
  updatedAt: string
  lastUsedAt?: string // 最后使用时间
  usageCount: number // 使用次数
  mdFilePath?: string // 关联的MD文件路径
}

// 代码片段数据库
export interface SnippetDatabase {
  snippets: Snippet[]
  categories: SnippetCategory[]
  tags: SnippetTag[]
  version: string
}

// 代码片段筛选器
export interface SnippetFilter {
  searchText?: string
  language?: SnippetLanguage
  categoryId?: string
  tagIds?: string[]
  isPinned?: boolean
  isFavorite?: boolean
}

// 代码片段统计
export interface SnippetStats {
  totalSnippets: number
  byLanguage: Record<SnippetLanguage, number>
  byCategory: Record<string, number>
  byTag: Record<string, number>
  mostUsed: Snippet[]
  recentlyUsed: Snippet[]
}

// 语言配置
export interface LanguageConfig {
  id: SnippetLanguage
  name: string
  icon: string
  color: string
  extensions: string[]
}
