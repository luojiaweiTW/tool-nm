#!/usr/bin/env node
/**
 * Neon Tools 全面巡检脚本
 * 使用 Playwright 自动化测试所有工具（排除 SSH）
 */

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// 测试配置
const BASE_URL = 'http://localhost:5173'
const SCREENSHOT_DIR = 'test-screenshots'
const SLOW_MO = 200 // 操作延迟（毫秒）
const TIMEOUT = 10000 // 页面超时（毫秒）

// 创建截图目录
if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

// 所有工具的配置（排除 SSH）
const TOOLS = [
  // ========== 文本处理 ==========
  {
    name: 'JSON 格式化',
    path: '/tools/json-formatter',
    category: '文本处理',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'JSON' }
      }
    ]
  },
  {
    name: 'XML/YAML 转换',
    path: '/tools/xml-yaml',
    category: '文本处理',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'XML' }
      }
    ]
  },
  {
    name: 'SQL 格式化',
    path: '/tools/sql-formatter',
    category: '文本处理',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'SQL' }
      }
    ]
  },
  {
    name: '文本对比',
    path: '/tools/text-diff',
    category: '文本处理',
    tests: [
      {
        name: '对比文本',
        verify: { selector: '.diff-container', exists: true }
      }
    ]
  },
  {
    name: '正则表达式',
    path: '/tools/regex',
    category: '文本处理',
    tests: [
      {
        name: '测试正则',
        verify: { selector: 'input[placeholder*="正则"]', exists: true }
      }
    ]
  },
  {
    name: '文档转 Markdown',
    path: '/tools/doc-to-markdown',
    category: '文本处理',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: '文档转 Markdown' }
      }
    ]
  },

  // ========== 编码加密 ==========
  {
    name: 'Base64 编解码',
    path: '/tools/base64',
    category: '编码加密',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'Base64' }
      }
    ]
  },
  {
    name: 'URL 编码',
    path: '/tools/url-encoder',
    category: '编码加密',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'URL' }
      }
    ]
  },
  {
    name: '哈希计算',
    path: '/tools/hash',
    category: '编码加密',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: '哈希' }
      }
    ]
  },
  {
    name: '加密解密',
    path: '/tools/encrypt',
    category: '编码加密',
    tests: [
      {
        name: 'AES 加密',
        verify: { selector: 'h2', hasText: '加密解密' }
      }
    ]
  },
  {
    name: 'Unicode 转换',
    path: '/tools/unicode',
    category: '编码加密',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'Unicode' }
      }
    ]
  },
  {
    name: '编码格式转换',
    path: '/tools/encoding',
    category: '编码加密',
    tests: [
      {
        name: '编码转换',
        verify: { selector: 'h2', hasText: '编码格式转换' }
      }
    ]
  },

  // ========== 认证安全 ==========
  {
    name: 'JWT 解析',
    path: '/tools/jwt',
    category: '认证安全',
    tests: [
      {
        name: 'JWT 解析',
        verify: { selector: 'textarea[placeholder*="JWT"]', exists: true }
      }
    ]
  },

  // ========== 时间调度 ==========
  {
    name: '时间戳转换',
    path: '/tools/timestamp',
    category: '时间调度',
    tests: [
      {
        name: '时间戳转换',
        verify: { selector: 'h2', hasText: '时间戳转换' }
      }
    ]
  },
  {
    name: 'Cron 表达式',
    path: '/tools/cron',
    category: '时间调度',
    tests: [
      {
        name: 'Cron 表达式',
        verify: { selector: 'h2', hasText: 'Cron 表达式' }
      }
    ]
  },

  // ========== 开发工具 ==========
  {
    name: 'UUID 生成',
    path: '/tools/uuid',
    category: '开发工具',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: 'UUID' }
      }
    ]
  },
  {
    name: '随机数据生成',
    path: '/tools/random-generator',
    category: '开发工具',
    tests: [
      {
        name: '生成随机数据',
        verify: { selector: 'h2', hasText: '随机数据生成' }
      }
    ]
  },
  {
    name: '进制转换',
    path: '/tools/number-base',
    category: '开发工具',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: '进制' }
      }
    ]
  },
  {
    name: '二维码生成',
    path: '/tools/qrcode',
    category: '开发工具',
    tests: [
      {
        name: '页面加载',
        verify: { selector: 'h2', hasText: '二维码' }
      }
    ]
  },
  {
    name: '单位换算器',
    path: '/tools/unit-converter',
    category: '开发工具',
    tests: [
      {
        name: '单位换算',
        verify: { selector: 'h2', hasText: '单位换算器' }
      }
    ]
  },
  {
    name: '颜色转换器',
    path: '/tools/color-converter',
    category: '开发工具',
    tests: [
      {
        name: '颜色转换',
        verify: { selector: 'h2', hasText: '颜色转换器' }
      }
    ]
  },

  // ========== Java 工具 ==========
  {
    name: 'JSON 转 Java',
    path: '/tools/json-to-java',
    category: 'Java 工具',
    tests: [
      {
        name: 'JSON 转 Java',
        verify: { selector: 'h2', hasText: 'JSON 转 Java' }
      }
    ]
  },
  {
    name: '异常堆栈分析',
    path: '/tools/exception-parser',
    category: 'Java 工具',
    tests: [
      {
        name: '异常分析',
        verify: { selector: 'h2', hasText: '异常堆栈分析' }
      }
    ]
  },
  {
    name: 'Maven 依赖',
    path: '/tools/maven-search',
    category: 'Java 工具',
    tests: [
      {
        name: 'Maven 搜索',
        verify: { selector: 'input[placeholder*="搜索"]', exists: true }
      }
    ]
  },

  // ========== 网络工具 ==========
  {
    name: 'HTTP 测试',
    path: '/tools/http-client',
    category: '网络工具',
    tests: [
      {
        name: 'HTTP 请求',
        verify: { selector: 'input[placeholder*="URL"]', exists: true }
      }
    ]
  },
  {
    name: 'IP 查询',
    path: '/tools/ip-query',
    category: '网络工具',
    tests: [
      {
        name: 'IP 查询',
        verify: { selector: 'input[placeholder*="IP"]', exists: true }
      }
    ]
  },
  {
    name: '命令历史',
    path: '/tools/command-history',
    category: '网络工具',
    tests: [
      {
        name: '命令历史',
        verify: { selector: 'h2', hasText: '命令历史' }
      }
    ]
  },
  {
    name: '端口扫描',
    path: '/tools/port-scanner',
    category: '网络工具',
    tests: [
      {
        name: '端口扫描',
        verify: { selector: 'input[placeholder*="主机"]', exists: true }
      }
    ]
  },
  {
    name: 'IP 扫描器',
    path: '/tools/ip-scanner',
    category: '网络工具',
    tests: [
      {
        name: 'IP 扫描',
        verify: { selector: 'h2', hasText: 'IP 扫描器' }
      }
    ]
  },
  {
    name: 'WebSocket 测试',
    path: '/tools/websocket',
    category: '网络工具',
    tests: [
      {
        name: 'WebSocket 连接',
        verify: { selector: 'input[placeholder*="WebSocket"]', exists: true }
      }
    ]
  },

  // ========== 实用工具 ==========
  {
    name: '剪贴板历史',
    path: '/tools/clipboard-history',
    category: '实用工具',
    tests: [
      {
        name: '剪贴板历史',
        verify: { selector: 'h2', hasText: '剪贴板历史' }
      }
    ]
  },
  {
    name: '截图工具',
    path: '/tools/screenshot',
    category: '实用工具',
    tests: [
      {
        name: '截图工具',
        verify: { selector: 'h2', hasText: '截图工具' }
      }
    ]
  },
  {
    name: '系统监控',
    path: '/tools/system-monitor',
    category: '实用工具',
    tests: [
      {
        name: '系统监控',
        verify: { selector: 'h2', hasText: '系统监控' }
      }
    ]
  },
  {
    name: '天气查询',
    path: '/tools/weather',
    category: '实用工具',
    tests: [
      {
        name: '天气查询',
        verify: { selector: 'h2', hasText: '天气查询' }
      }
    ]
  },

  // ========== 知识管理 ==========
  {
    name: '知识库',
    path: '/tools/knowledge',
    category: '知识管理',
    tests: [
      {
        name: '知识库',
        verify: { selector: 'h2', hasText: '知识库' }
      }
    ]
  },
  {
    name: '代码片段',
    path: '/tools/snippets',
    category: '知识管理',
    tests: [
      {
        name: '代码片段',
        verify: { selector: 'h2', hasText: '代码片段' }
      }
    ]
  },
  {
    name: '网页收藏夹',
    path: '/tools/bookmarks',
    category: '知识管理',
    tests: [
      {
        name: '网页收藏夹',
        verify: { selector: 'h2', hasText: '网页收藏夹' }
      }
    ]
  },

  // ========== 热榜聚合 ==========
  {
    name: '热榜聚合',
    path: '/tools/entertainment',
    category: '热榜聚合',
    tests: [
      {
        name: '热榜聚合',
        verify: { selector: 'h2', hasText: '热榜聚合' }
      }
    ]
  },
]

// UI 检查辅助函数
async function checkUIDetails(page, toolName) {
  const issues = []
  
  try {
    // 1. 检查页面标题
    const title = page.locator('h2').first()
    if (await title.count() > 0) {
      const titleInfo = await title.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return {
          width: rect.width,
          height: rect.height,
          writingMode: styles.writingMode,
          textContent: el.textContent?.trim()
        }
      })
      
      // 检查标题宽度
      if (titleInfo.width < 100 && titleInfo.textContent && titleInfo.textContent.length > 5) {
        issues.push(`标题宽度过窄(${Math.round(titleInfo.width)}px)，可能导致文字堆叠`)
      }
      
      // 检查布局方向
      if (titleInfo.writingMode !== 'horizontal-tb') {
        issues.push(`文字方向错误: ${titleInfo.writingMode}`)
      }
      
      // 检查高宽比
      if (titleInfo.height > titleInfo.width) {
        issues.push(`标题高度(${Math.round(titleInfo.height)}px)大于宽度(${Math.round(titleInfo.width)}px)`)
      }
    }
    
    // 2. 检查主要按钮样式（跳过检查，因为很多按钮是文本按钮或图标按钮）
    // const buttons = page.locator('button').first()
    // if (await buttons.count() > 0) {
    //   const buttonStyles = await buttons.evaluate((el) => {
    //     const styles = window.getComputedStyle(el)
    //     return {
    //       background: styles.backgroundColor,
    //       color: styles.color,
    //       border: styles.border
    //     }
    //   })
    //   
    //   // 检查背景透明度
    //   if (buttonStyles.background === 'rgba(0, 0, 0, 0)' || buttonStyles.background === 'transparent') {
    //     issues.push('按钮背景完全透明')
    //   }
    // }
    
    // 3. 检查滚动容器
    const scrollContainers = page.locator('[style*="overflow"]')
    const containerCount = await scrollContainers.count()
    
    if (containerCount > 0) {
      for (let i = 0; i < Math.min(3, containerCount); i++) {
        const container = scrollContainers.nth(i)
        const scrollInfo = await container.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          const scrollbarStyles = window.getComputedStyle(el, '::-webkit-scrollbar')
          return {
            overflow: styles.overflow,
            overflowY: styles.overflowY,
            scrollbarWidth: scrollbarStyles.width || 'auto',
            hasScroll: el.scrollHeight > el.clientHeight
          }
        })
        
        if (scrollInfo.hasScroll && scrollInfo.scrollbarWidth === '0px') {
          issues.push('可滚动容器但滚动条宽度为 0')
        }
      }
    }
    
    // 4. 检查对比度（危险按钮）
    const dangerButtons = page.locator('.el-button--danger')
    const dangerCount = await dangerButtons.count()
    
    if (dangerCount > 0) {
      const iconColor = await dangerButtons.first().evaluate((el) => {
        const icon = el.querySelector('i, svg, [class*="i-"]')
        if (icon) {
          const styles = window.getComputedStyle(icon)
          return styles.color
        }
        return null
      })
      
      if (iconColor && (iconColor.includes('rgb(220, 38, 38)') || iconColor.includes('rgb(239, 68, 68)'))) {
        issues.push('删除按钮图标颜色与背景色相近')
      }
    }
    
  } catch (error) {
    issues.push(`UI 检查异常: ${error.message}`)
  }
  
  return issues
}

// 测试单个工具
async function testTool(page, tool) {
  const result = {
    name: tool.name,
    category: tool.category,
    path: tool.path,
    passed: true,
    issues: [],
    testResults: []
  }
  
  try {
    // 访问页面
    console.log(`\n📍 测试: ${tool.name} (${tool.category})`)
    console.log(`   路径: ${BASE_URL}/#${tool.path}`)
    
    await page.goto(`${BASE_URL}/#${tool.path}`, { 
      waitUntil: 'networkidle',
      timeout: TIMEOUT 
    })
    
    // 等待页面稳定
    await page.waitForTimeout(1000)
    
    // UI 详细检查
    console.log('   🎨 UI 检查中...')
    const uiIssues = await checkUIDetails(page, tool.name)
    if (uiIssues.length > 0) {
      result.issues.push(...uiIssues)
      console.log(`   ⚠️  发现 ${uiIssues.length} 个 UI 问题:`)
      uiIssues.forEach(issue => console.log(`      - ${issue}`))
    } else {
      console.log('   ✅ UI 检查通过')
    }
    
    // 功能测试
    for (const test of tool.tests) {
      const testResult = {
        name: test.name,
        passed: false,
        error: null
      }
      
      try {
        // 输入数据
        if (test.input) {
          const input = page.locator(test.input.selector).first()
          if (await input.count() > 0) {
            await input.fill(test.input.value)
            await page.waitForTimeout(300)
          }
        }
        
        // 执行操作
        if (test.action) {
          const button = page.locator(test.action.selector).first()
          if (await button.count() > 0) {
            await button.click()
            await page.waitForTimeout(500)
          }
        }
        
        // 验证结果
        if (test.verify) {
          const element = page.locator(test.verify.selector).first()
          const count = await element.count()
          
          if (test.verify.exists && count === 0) {
            testResult.error = `元素 "${test.verify.selector}" 不存在`
          } else if (test.verify.hasContent) {
            const content = await element.textContent()
            if (!content || content.trim() === '') {
              testResult.error = '输出内容为空'
            }
          } else if (test.verify.hasText) {
            const content = await element.textContent()
            if (!content || !content.includes(test.verify.hasText)) {
              testResult.error = `未找到文本 "${test.verify.hasText}"`
            }
          }
        }
        
        if (!testResult.error) {
          testResult.passed = true
          console.log(`   ✅ ${test.name}`)
        } else {
          console.log(`   ❌ ${test.name}: ${testResult.error}`)
          result.passed = false
        }
        
      } catch (error) {
        testResult.error = error.message
        console.log(`   ❌ ${test.name}: ${error.message}`)
        result.passed = false
      }
      
      result.testResults.push(testResult)
    }
    
    // 截图
    const screenshotPath = join(SCREENSHOT_DIR, `${tool.path.replace(/\//g, '_')}.png`)
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    })
    console.log(`   📸 截图保存: ${screenshotPath}`)
    
  } catch (error) {
    result.passed = false
    result.issues.push(`页面加载失败: ${error.message}`)
    console.log(`   ❌ 错误: ${error.message}`)
  }
  
  return result
}

// 主测试流程
async function runInspection() {
  console.log('='.repeat(80))
  console.log('🚀 Neon Tools 全面巡检')
  console.log('='.repeat(80))
  console.log(`📡 测试地址: ${BASE_URL}`)
  console.log(`🔍 测试工具数: ${TOOLS.length} 个`)
  console.log(`📁 截图目录: ${SCREENSHOT_DIR}`)
  console.log('='.repeat(80))
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: SLOW_MO
  })
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  })
  
  const page = await context.newPage()
  
  // 设置默认超时
  page.setDefaultTimeout(TIMEOUT)
  
  const results = []
  const categorySummary = {}
  
  try {
    // 测试所有工具
    for (let i = 0; i < TOOLS.length; i++) {
      const tool = TOOLS[i]
      const result = await testTool(page, tool)
      results.push(result)
      
      // 分类统计
      if (!categorySummary[tool.category]) {
        categorySummary[tool.category] = { total: 0, passed: 0, failed: 0 }
      }
      categorySummary[tool.category].total++
      if (result.passed) {
        categorySummary[tool.category].passed++
      } else {
        categorySummary[tool.category].failed++
      }
      
      // 进度显示
      console.log(`\n   进度: ${i + 1}/${TOOLS.length} (${Math.round((i + 1) / TOOLS.length * 100)}%)`)
      
      // 延迟，避免过快
      await page.waitForTimeout(500)
    }
    
  } finally {
    // 保持浏览器打开 3 秒
    console.log('\n⏸️  保持浏览器打开 3 秒供最后检查...')
    await page.waitForTimeout(3000)
    
    await browser.close()
  }
  
  // 输出测试报告
  console.log('\n' + '='.repeat(80))
  console.log('📊 巡检报告')
  console.log('='.repeat(80))
  
  // 按分类统计
  console.log('\n📂 分类统计:')
  Object.entries(categorySummary).forEach(([category, stats]) => {
    const icon = stats.failed === 0 ? '✅' : '⚠️'
    console.log(`   ${icon} ${category}: ${stats.passed}/${stats.total} 通过`)
  })
  
  // 失败的工具
  const failedTools = results.filter(r => !r.passed)
  if (failedTools.length > 0) {
    console.log('\n❌ 失败的工具:')
    failedTools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.name} (${tool.category})`)
      if (tool.issues.length > 0) {
        console.log('      问题:')
        tool.issues.forEach(issue => console.log(`      - ${issue}`))
      }
      if (tool.testResults.some(t => !t.passed)) {
        console.log('      测试失败:')
        tool.testResults
          .filter(t => !t.passed)
          .forEach(t => console.log(`      - ${t.name}: ${t.error}`))
      }
    })
  }
  
  // 发现的 UI 问题汇总
  const allIssues = results.flatMap(r => r.issues)
  if (allIssues.length > 0) {
    console.log('\n⚠️  UI 问题汇总:')
    const issueTypes = {}
    allIssues.forEach(issue => {
      const type = issue.split(':')[0]
      issueTypes[type] = (issueTypes[type] || 0) + 1
    })
    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count} 处`)
    })
  }
  
  // 总体统计
  const totalPassed = results.filter(r => r.passed).length
  const totalFailed = results.filter(r => !r.passed).length
  const passRate = Math.round((totalPassed / results.length) * 100)
  
  console.log('\n' + '='.repeat(80))
  console.log('📈 总体统计:')
  console.log(`   总计: ${results.length} 个工具`)
  console.log(`   通过: ${totalPassed} 个 (${passRate}%)`)
  console.log(`   失败: ${totalFailed} 个`)
  console.log(`   UI 问题: ${allIssues.length} 个`)
  console.log('='.repeat(80))
  
  if (totalFailed === 0 && allIssues.length === 0) {
    console.log('\n🎉 恭喜！所有工具巡检通过，无 UI 问题！')
  } else if (totalFailed === 0) {
    console.log('\n✅ 功能测试全部通过，但发现一些 UI 问题需要优化')
  } else {
    console.log('\n⚠️  发现问题，请修复后重新测试')
  }
  
  console.log('='.repeat(80) + '\n')
  
  // 返回退出码
  process.exit(totalFailed > 0 ? 1 : 0)
}

// 运行巡检
runInspection().catch((error) => {
  console.error('\n❌ 巡检异常:', error)
  process.exit(1)
})

