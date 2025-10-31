/**
 * 知識庫類型定義
 */

export type KnowledgeItemType = 'text' | 'image' | 'url'

export interface KnowledgeTag {
  id: string
  name: string
  color: string // 霓虹色
}

export interface KnowledgeCategory {
  id: string
  name: string
  icon: string // Element Plus 圖標名
  color: string
}

export interface KnowledgeItem {
  id: string
  title: string
  content: string // 文本內容、圖片相對路徑、或URL地址
  type: KnowledgeItemType
  categoryId: string
  tags: string[] // tag ids
  isPinned: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  description?: string // 圖片描述、文本摘要、或URL說明
  url?: string // URL類型時使用
  mdFilePath?: string // MD文件相對路徑（knowledge-docs目錄下）
}

export interface KnowledgeBase {
  items: KnowledgeItem[]
  categories: KnowledgeCategory[]
  tags: KnowledgeTag[]
  version: string
}

export interface KnowledgeFilter {
  searchText?: string
  categoryId?: string
  tagIds?: string[]
  type?: KnowledgeItemType
  isPinned?: boolean
  isFavorite?: boolean
}

export interface KnowledgeStats {
  totalItems: number
  byCategory: Record<string, number>
  byTag: Record<string, number>
  byType: Record<KnowledgeItemType, number>
}

