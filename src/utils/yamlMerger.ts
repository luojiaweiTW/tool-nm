/**
 * YAML 配置文件深度合并工具
 * 用于合并 Spring Boot 多环境配置文件（application.yml + application-*.yml）
 */

// ========== 类型定义 ==========

/**
 * 差异类型
 */
export type DiffType = 'inherited' | 'overridden' | 'added'

/**
 * YAML 差异结果
 */
export interface YamlDiffResult {
  path: string          // 配置路径（如：spring.datasource.url）
  type: DiffType        // 差异类型
  baseValue: any        // 基础配置的值
  profileValue: any     // Profile 配置的值
  mergedValue: any      // 合并后的值
}

/**
 * 合并选项
 */
export interface MergeOptions {
  /**
   * 数组合并策略
   * - 'replace': Profile 数组完全替换 Base 数组（默认）
   * - 'concat': Profile 数组追加到 Base 数组后
   */
  arrayMergeStrategy?: 'replace' | 'concat'
}

// ========== 核心函数 ==========

/**
 * 深度合并对象
 * Profile 配置会覆盖 Base 配置
 */
export function deepMerge(
  base: any,
  profile: any,
  options: MergeOptions = {}
): any {
  const { arrayMergeStrategy = 'replace' } = options
  
  // 处理 null 或 undefined
  if (profile == null) {
    return base
  }
  if (base == null) {
    return profile
  }
  
  // 基本类型：Profile 覆盖 Base
  if (typeof profile !== 'object' || typeof base !== 'object') {
    return profile
  }
  
  // 数组处理
  if (Array.isArray(profile)) {
    if (!Array.isArray(base)) {
      return profile
    }
    
    if (arrayMergeStrategy === 'concat') {
      return [...base, ...profile]
    } else {
      return profile // replace
    }
  }
  
  // 对象深度合并
  const result: any = { ...base }
  
  for (const key in profile) {
    if (Object.prototype.hasOwnProperty.call(profile, key)) {
      if (key in base) {
        // 递归合并
        result[key] = deepMerge(base[key], profile[key], options)
      } else {
        // Profile 新增的键
        result[key] = profile[key]
      }
    }
  }
  
  return result
}

/**
 * 检测配置差异
 * 比较 Base、Profile、Merged 三个配置，生成差异报告
 */
export function detectDiff(
  base: any,
  profile: any,
  merged: any,
  basePath = ''
): YamlDiffResult[] {
  const results: YamlDiffResult[] = []
  
  // 递归检测差异
  function traverse(
    baseObj: any,
    profileObj: any,
    mergedObj: any,
    currentPath: string
  ) {
    // 处理 merged 对象的所有键
    if (mergedObj && typeof mergedObj === 'object' && !Array.isArray(mergedObj)) {
      for (const key in mergedObj) {
        if (!Object.prototype.hasOwnProperty.call(mergedObj, key)) {
          continue
        }
        
        const newPath = currentPath ? `${currentPath}.${key}` : key
        const baseVal = baseObj?.[key]
        const profileVal = profileObj?.[key]
        const mergedVal = mergedObj[key]
        
        // 判断差异类型
        let diffType: DiffType
        
        if (profileVal === undefined) {
          // Profile 中不存在，继承自 Base
          diffType = 'inherited'
        } else if (baseVal === undefined) {
          // Base 中不存在，Profile 新增
          diffType = 'added'
        } else {
          // 两者都存在，Profile 覆盖
          diffType = 'overridden'
        }
        
        // 如果值是对象且非数组，递归处理
        if (
          mergedVal &&
          typeof mergedVal === 'object' &&
          !Array.isArray(mergedVal)
        ) {
          traverse(baseVal, profileVal, mergedVal, newPath)
        } else {
          // 叶子节点，记录差异
          results.push({
            path: newPath,
            type: diffType,
            baseValue: baseVal,
            profileValue: profileVal,
            mergedValue: mergedVal,
          })
        }
      }
    }
  }
  
  traverse(base, profile, merged, basePath)
  
  return results
}

/**
 * 导出为 YAML 字符串
 */
export function exportAsYaml(data: any): string {
  // 这里假设调用方会使用 js-yaml.dump
  // 为了保持工具函数的独立性，这里只做简单处理
  return JSON.stringify(data, null, 2)
}

/**
 * 导出为 JSON 字符串
 */
export function exportAsJson(data: any): string {
  return JSON.stringify(data, null, 2)
}

/**
 * 格式化差异值（用于显示）
 */
export function formatValue(value: any): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * 获取差异类型的显示文本
 */
export function getDiffTypeLabel(type: DiffType): string {
  const labels: Record<DiffType, string> = {
    'inherited': '继承',
    'overridden': '覆盖',
    'added': '新增',
  }
  return labels[type]
}

/**
 * 获取差异类型的颜色（CSS 变量）
 */
export function getDiffTypeColor(type: DiffType): string {
  const colors: Record<DiffType, string> = {
    'inherited': 'var(--color-muted)',
    'overridden': 'var(--neon-yellow)',
    'added': 'var(--neon-lime)',
  }
  return colors[type]
}

/**
 * 统计差异
 */
export interface DiffStats {
  total: number
  inherited: number
  overridden: number
  added: number
}

export function calculateDiffStats(diffs: YamlDiffResult[]): DiffStats {
  const stats: DiffStats = {
    total: diffs.length,
    inherited: 0,
    overridden: 0,
    added: 0,
  }
  
  diffs.forEach(diff => {
    stats[diff.type]++
  })
  
  return stats
}









