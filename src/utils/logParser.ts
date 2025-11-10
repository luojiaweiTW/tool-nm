/**
 * 日志解析工具
 * 支持多种日志格式的解析、分级、时间戳提取、堆栈折叠
 */

// ========== 类型定义 ==========

/**
 * 日志级别
 */
export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

/**
 * 日志行类型
 */
export type LogLineType = 'log' | 'exception' | 'stacktrace' | 'business' | 'framework' | 'jdk'

/**
 * 解析后的日志行
 */
export interface ParsedLogLine {
  index: number          // 原始行号（从 0 开始）
  content: string        // 原始内容
  level: LogLevel | null // 日志级别
  timestamp: Date | null // 时间戳
  type: LogLineType      // 行类型
  isDuplicate: boolean   // 是否重复行
  className?: string     // 类名（如果是堆栈行）
  methodName?: string    // 方法名（如果是堆栈行）
  lineNumber?: number    // 行号（如果是堆栈行）
}

/**
 * 日志统计信息
 */
export interface LogStats {
  total: number
  trace: number
  debug: number
  info: number
  warn: number
  error: number
  fatal: number
  exceptions: number
  stackTraces: number
  duplicates: number
  timeRange: {
    start: Date | null
    end: Date | null
  }
}

// ========== 常量定义 ==========

/**
 * 日志级别正则表达式（支持多种格式）
 */
const LOG_LEVEL_PATTERNS = [
  // Spring Boot 格式：2024-01-01 10:00:00.123  INFO 12345 --- [main] com.example.App : message
  /\b(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+\d+\s+---/,
  
  // Logback 格式：10:00:00.123 [main] INFO  com.example.App - message
  /\[(.*?)\]\s+(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s+/,
  
  // Log4j 格式：[INFO] 2024-01-01 10:00:00 - message
  /\[(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\]/,
  
  // 简单格式：INFO: message
  /^(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s*[:：]/,
  
  // 包含级别的任意位置
  /\s(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\s/,
]

/**
 * 时间戳正则表达式（支持多种格式）
 */
const TIMESTAMP_PATTERNS = [
  // ISO 8601: 2024-01-01T10:00:00.123Z
  /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?)/,
  
  // 标准日期时间: 2024-01-01 10:00:00.123
  /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/,
  
  // 时间: 10:00:00.123
  /^(\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/,
  
  // Unix 时间戳（13位毫秒）
  /\b(\d{13})\b/,
]

/**
 * 异常类型正则
 */
const EXCEPTION_PATTERN = /\b[a-zA-Z0-9.]+Exception\b|\b[a-zA-Z0-9.]+Error\b/

/**
 * 堆栈跟踪行正则（Java）
 */
const STACK_TRACE_PATTERN = /^\s*at\s+([\w.$]+)\.([\w<>$]+)\((.*?):(\d+)\)$/

/**
 * 框架包名前缀
 */
const FRAMEWORK_PACKAGES = [
  'org.springframework',
  'org.apache',
  'org.hibernate',
  'org.mybatis',
  'com.alibaba',
  'io.netty',
  'javax.servlet',
  'org.eclipse',
  'org.junit',
  'org.slf4j',
  'ch.qos.logback',
  'org.jboss',
  'com.fasterxml',
  'org.thymeleaf',
]

// ========== 核心函数 ==========

/**
 * 检测日志级别
 */
export function detectLogLevel(line: string): LogLevel | null {
  for (const pattern of LOG_LEVEL_PATTERNS) {
    const match = line.match(pattern)
    if (match) {
      // 找到匹配的级别
      const levelMatch = match[0].match(/\b(TRACE|DEBUG|INFO|WARN|ERROR|FATAL)\b/)
      if (levelMatch) {
        return levelMatch[1] as LogLevel
      }
    }
  }
  return null
}

/**
 * 提取时间戳
 */
export function extractTimestamp(line: string): Date | null {
  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = line.match(pattern)
    if (match) {
      const timeStr = match[1]
      
      // 尝试解析为日期
      try {
        // Unix 时间戳（13位毫秒）
        if (/^\d{13}$/.test(timeStr)) {
          return new Date(parseInt(timeStr))
        }
        
        // 只有时间（没有日期），使用今天的日期
        if (/^\d{2}:\d{2}:\d{2}/.test(timeStr)) {
          const today = new Date().toISOString().split('T')[0]
          return new Date(`${today}T${timeStr}`)
        }
        
        // 标准日期时间
        const date = new Date(timeStr.replace(' ', 'T'))
        if (!isNaN(date.getTime())) {
          return date
        }
      } catch {
        continue
      }
    }
  }
  
  return null
}

/**
 * 检测是否是异常行
 */
export function isExceptionLine(line: string): boolean {
  return EXCEPTION_PATTERN.test(line)
}

/**
 * 检测是否是堆栈跟踪行
 */
export function isStackTraceLine(line: string): boolean {
  return STACK_TRACE_PATTERN.test(line.trim())
}

/**
 * 解析堆栈跟踪行
 */
export function parseStackTraceLine(line: string): {
  className: string
  methodName: string
  fileName: string
  lineNumber: number
} | null {
  const match = line.trim().match(STACK_TRACE_PATTERN)
  if (!match) return null
  
  return {
    className: match[1],
    methodName: match[2],
    fileName: match[3],
    lineNumber: parseInt(match[4]),
  }
}

/**
 * 判断是否是框架代码
 */
export function isFrameworkCode(className: string): boolean {
  return FRAMEWORK_PACKAGES.some(pkg => className.startsWith(pkg))
}

/**
 * 判断是否是 JDK 代码
 */
export function isJDKCode(className: string): boolean {
  return className.startsWith('java.') ||
         className.startsWith('javax.') ||
         className.startsWith('jdk.') ||
         className.includes('jdk.internal')
}

/**
 * 判断是否是业务代码
 */
export function isBusinessCode(className: string, businessPackage?: string): boolean {
  if (!businessPackage) return false
  return className.startsWith(businessPackage)
}

/**
 * 检测重复堆栈行
 * 返回重复行的索引数组
 */
export function detectDuplicateStackLines(lines: ParsedLogLine[]): number[] {
  const duplicateIndices: number[] = []
  
  // 检测连续重复的堆栈行（至少 3 次）
  let currentLine: string | null = null
  let repeatCount = 0
  let startIndex = -1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    if (line.type === 'stacktrace') {
      if (line.content.trim() === currentLine) {
        repeatCount++
        if (repeatCount >= 2) { // 第三次及以后算重复
          duplicateIndices.push(i)
        }
      } else {
        currentLine = line.content.trim()
        repeatCount = 0
        startIndex = i
      }
    } else {
      currentLine = null
      repeatCount = 0
      startIndex = -1
    }
  }
  
  return duplicateIndices
}

/**
 * 解析日志行（主函数）
 */
export function parseLogLines(input: string, businessPackage?: string): ParsedLogLine[] {
  const lines = input.split('\n')
  const results: ParsedLogLine[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const content = lines[i]
    if (!content.trim()) continue // 跳过空行
    
    const level = detectLogLevel(content)
    const timestamp = extractTimestamp(content)
    let type: LogLineType = 'log'
    let className: string | undefined
    let methodName: string | undefined
    let lineNumber: number | undefined
    
    // 判断行类型
    if (isExceptionLine(content) && !isStackTraceLine(content)) {
      type = 'exception'
    } else if (isStackTraceLine(content)) {
      type = 'stacktrace'
      
      // 解析堆栈信息
      const stackInfo = parseStackTraceLine(content)
      if (stackInfo) {
        className = stackInfo.className
        methodName = stackInfo.methodName
        lineNumber = stackInfo.lineNumber
        
        // 细化类型
        if (businessPackage && isBusinessCode(stackInfo.className, businessPackage)) {
          type = 'business'
        } else if (isJDKCode(stackInfo.className)) {
          type = 'jdk'
        } else if (isFrameworkCode(stackInfo.className)) {
          type = 'framework'
        }
      }
    }
    
    results.push({
      index: i,
      content,
      level,
      timestamp,
      type,
      isDuplicate: false, // 稍后检测
      className,
      methodName,
      lineNumber,
    })
  }
  
  // 检测重复行
  const duplicateIndices = detectDuplicateStackLines(results)
  duplicateIndices.forEach(index => {
    if (results[index]) {
      results[index].isDuplicate = true
    }
  })
  
  return results
}

/**
 * 计算日志统计信息
 */
export function calculateLogStats(logs: ParsedLogLine[]): LogStats {
  const stats: LogStats = {
    total: logs.length,
    trace: 0,
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0,
    exceptions: 0,
    stackTraces: 0,
    duplicates: 0,
    timeRange: {
      start: null,
      end: null,
    },
  }
  
  const timestamps: Date[] = []
  
  logs.forEach(log => {
    // 统计级别
    if (log.level) {
      const levelKey = log.level.toLowerCase() as keyof typeof stats
      if (typeof stats[levelKey] === 'number') {
        (stats[levelKey] as number)++
      }
    }
    
    // 统计类型
    if (log.type === 'exception') stats.exceptions++
    if (log.type === 'stacktrace' || log.type === 'business' || log.type === 'framework' || log.type === 'jdk') {
      stats.stackTraces++
    }
    if (log.isDuplicate) stats.duplicates++
    
    // 收集时间戳
    if (log.timestamp) {
      timestamps.push(log.timestamp)
    }
  })
  
  // 计算时间范围
  if (timestamps.length > 0) {
    timestamps.sort((a, b) => a.getTime() - b.getTime())
    stats.timeRange.start = timestamps[0]
    stats.timeRange.end = timestamps[timestamps.length - 1]
  }
  
  return stats
}

/**
 * 按级别过滤日志
 */
export function filterByLevel(logs: ParsedLogLine[], level: LogLevel | 'ALL'): ParsedLogLine[] {
  if (level === 'ALL') return logs
  return logs.filter(log => log.level === level)
}

/**
 * 按类型过滤日志
 */
export function filterByType(logs: ParsedLogLine[], types: LogLineType[]): ParsedLogLine[] {
  return logs.filter(log => types.includes(log.type))
}

/**
 * 隐藏重复行
 */
export function filterDuplicates(logs: ParsedLogLine[]): ParsedLogLine[] {
  return logs.filter(log => !log.isDuplicate)
}

/**
 * 按时间排序
 */
export function sortByTime(logs: ParsedLogLine[], order: 'asc' | 'desc' = 'asc'): ParsedLogLine[] {
  const sorted = [...logs].sort((a, b) => {
    if (!a.timestamp && !b.timestamp) return 0
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    
    const diff = a.timestamp.getTime() - b.timestamp.getTime()
    return order === 'asc' ? diff : -diff
  })
  
  return sorted
}

/**
 * 获取日志上下文（前后 N 行）
 */
export function getContext(logs: ParsedLogLine[], index: number, contextSize = 5): ParsedLogLine[] {
  const start = Math.max(0, index - contextSize)
  const end = Math.min(logs.length, index + contextSize + 1)
  return logs.slice(start, end)
}









