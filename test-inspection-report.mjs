#!/usr/bin/env node
/**
 * Neon Tools 巡检报告生成器
 * 基于截图和页面访问情况生成详细报告
 */

import { chromium } from '@playwright/test'
import { writeFileSync } from 'fs'

const BASE_URL = 'http://localhost:5173'
const SLOW_MO = 100

// 所有工具列表（排除 SSH）
const TOOLS = [
  // 文本处理
  { name: 'JSON 格式化', path: '/tools/json-formatter', category: '文本处理' },
  { name: 'XML/YAML 转换', path: '/tools/xml-yaml', category: '文本处理' },
  { name: 'SQL 格式化', path: '/tools/sql-formatter', category: '文本处理' },
  { name: '文本对比', path: '/tools/text-diff', category: '文本处理' },
  { name: '正则表达式', path: '/tools/regex', category: '文本处理' },
  { name: '文档转 Markdown', path: '/tools/doc-to-markdown', category: '文本处理' },
  
  // 编码加密
  { name: 'Base64 编解码', path: '/tools/base64', category: '编码加密' },
  { name: 'URL 编码', path: '/tools/url-encoder', category: '编码加密' },
  { name: '哈希计算', path: '/tools/hash', category: '编码加密' },
  { name: '加密解密', path: '/tools/encrypt', category: '编码加密' },
  { name: 'Unicode 转换', path: '/tools/unicode', category: '编码加密' },
  { name: '编码格式转换', path: '/tools/encoding', category: '编码加密' },
  
  // 认证安全
  { name: 'JWT 解析', path: '/tools/jwt', category: '认证安全' },
  
  // 时间调度
  { name: '时间戳转换', path: '/tools/timestamp', category: '时间调度' },
  { name: 'Cron 表达式', path: '/tools/cron', category: '时间调度' },
  
  // 开发工具
  { name: 'UUID 生成', path: '/tools/uuid', category: '开发工具' },
  { name: '随机数据生成', path: '/tools/random-generator', category: '开发工具' },
  { name: '进制转换', path: '/tools/number-base', category: '开发工具' },
  { name: '二维码生成', path: '/tools/qrcode', category: '开发工具' },
  { name: '单位换算器', path: '/tools/unit-converter', category: '开发工具' },
  { name: '颜色转换器', path: '/tools/color-converter', category: '开发工具' },
  
  // Java 工具
  { name: 'JSON 转 Java', path: '/tools/json-to-java', category: 'Java 工具' },
  { name: '异常堆栈分析', path: '/tools/exception-parser', category: 'Java 工具' },
  { name: 'Maven 依赖', path: '/tools/maven-search', category: 'Java 工具' },
  
  // 网络工具
  { name: 'HTTP 测试', path: '/tools/http-client', category: '网络工具' },
  { name: 'IP 查询', path: '/tools/ip-query', category: '网络工具' },
  { name: '命令历史', path: '/tools/command-history', category: '网络工具' },
  { name: '端口扫描', path: '/tools/port-scanner', category: '网络工具' },
  { name: 'IP 扫描器', path: '/tools/ip-scanner', category: '网络工具' },
  { name: 'WebSocket 测试', path: '/tools/websocket', category: '网络工具' },
  
  // 实用工具
  { name: '剪贴板历史', path: '/tools/clipboard-history', category: '实用工具' },
  { name: '截图工具', path: '/tools/screenshot', category: '实用工具' },
  { name: '系统监控', path: '/tools/system-monitor', category: '实用工具' },
  { name: '天气查询', path: '/tools/weather', category: '实用工具' },
  
  // 知识管理
  { name: '知识库', path: '/tools/knowledge', category: '知识管理' },
  { name: '代码片段', path: '/tools/snippets', category: '知识管理' },
  { name: '网页收藏夹', path: '/tools/bookmarks', category: '知识管理' },
  
  // 热榜聚合
  { name: '热榜聚合', path: '/tools/entertainment', category: '热榜聚合' },
]

// 检查页面是否正常加载
async function checkPage(page, tool) {
  const result = {
    name: tool.name,
    path: tool.path,
    category: tool.category,
    status: 'unknown',
    issues: [],
    hasContent: false,
    hasError: false,
    elementCounts: {}
  }
  
  try {
    await page.goto(`${BASE_URL}/#${tool.path}`, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    
    await page.waitForTimeout(1000)
    
    // 检查是否有错误信息
    const errorMessages = await page.locator('.el-message--error, .error, [class*="error"]').count()
    result.hasError = errorMessages > 0
    
    // 检查页面内容
    const bodyText = await page.locator('body').textContent()
    result.hasContent = bodyText && bodyText.length > 100
    
    // 统计页面元素
    result.elementCounts = {
      buttons: await page.locator('button').count(),
      inputs: await page.locator('input, textarea').count(),
      cards: await page.locator('.neon-card, .el-card').count(),
      tables: await page.locator('table').count()
    }
    
    // 判断状态
    if (result.hasError) {
      result.status = 'error'
      result.issues.push('页面显示错误信息')
    } else if (!result.hasContent) {
      result.status = 'empty'
      result.issues.push('页面内容为空')
    } else if (result.elementCounts.buttons === 0 && result.elementCounts.inputs === 0) {
      result.status = 'incomplete'
      result.issues.push('页面缺少交互元素')
    } else {
      result.status = 'ok'
    }
    
  } catch (error) {
    result.status = 'failed'
    result.issues.push(`加载失败: ${error.message}`)
  }
  
  return result
}

async function generateReport() {
  console.log('='.repeat(80))
  console.log('🔍 Neon Tools 巡检报告生成器')
  console.log('='.repeat(80))
  console.log(`📡 测试地址: ${BASE_URL}`)
  console.log(`🔍 工具数量: ${TOOLS.length} 个`)
  console.log('='.repeat(80))
  
  const browser = await chromium.launch({
    headless: true,  // 无头模式，更快
    slowMo: SLOW_MO
  })
  
  const page = await browser.newPage()
  page.setDefaultTimeout(10000)
  
  const results = []
  
  try {
    for (let i = 0; i < TOOLS.length; i++) {
      const tool = TOOLS[i]
      process.stdout.write(`\r检查进度: ${i + 1}/${TOOLS.length} (${Math.round((i + 1) / TOOLS.length * 100)}%) - ${tool.name}...                    `)
      
      const result = await checkPage(page, tool)
      results.push(result)
      
      await page.waitForTimeout(300)
    }
    
    console.log('\n\n✅ 巡检完成！\n')
    
  } finally {
    await browser.close()
  }
  
  // 生成报告
  const report = generateMarkdownReport(results)
  const reportFile = 'inspection-report.md'
  writeFileSync(reportFile, report, 'utf-8')
  
  // 控制台输出摘要
  printSummary(results)
  
  console.log(`\n📄 详细报告已保存: ${reportFile}`)
  
  return results
}

function generateMarkdownReport(results) {
  const now = new Date().toLocaleString('zh-CN')
  
  let md = `# Neon Tools 巡检报告\n\n`
  md += `**生成时间**: ${now}\n\n`
  md += `**工具总数**: ${results.length} 个\n\n`
  
  // 状态统计
  const statusCount = {
    ok: results.filter(r => r.status === 'ok').length,
    error: results.filter(r => r.status === 'error').length,
    empty: results.filter(r => r.status === 'empty').length,
    incomplete: results.filter(r => r.status === 'incomplete').length,
    failed: results.filter(r => r.status === 'failed').length
  }
  
  md += `## 📊 总体状态\n\n`
  md += `| 状态 | 数量 | 占比 |\n`
  md += `|------|------|------|\n`
  md += `| ✅ 正常 | ${statusCount.ok} | ${Math.round(statusCount.ok / results.length * 100)}% |\n`
  md += `| ❌ 错误 | ${statusCount.error} | ${Math.round(statusCount.error / results.length * 100)}% |\n`
  md += `| ⚠️ 空白 | ${statusCount.empty} | ${Math.round(statusCount.empty / results.length * 100)}% |\n`
  md += `| 🔸 不完整 | ${statusCount.incomplete} | ${Math.round(statusCount.incomplete / results.length * 100)}% |\n`
  md += `| 💥 加载失败 | ${statusCount.failed} | ${Math.round(statusCount.failed / results.length * 100)}% |\n\n`
  
  // 按分类统计
  const categories = {}
  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { total: 0, ok: 0 }
    }
    categories[r.category].total++
    if (r.status === 'ok') {
      categories[r.category].ok++
    }
  })
  
  md += `## 📂 分类统计\n\n`
  md += `| 分类 | 正常 | 总数 | 通过率 |\n`
  md += `|------|------|------|--------|\n`
  Object.entries(categories).forEach(([cat, stats]) => {
    const rate = Math.round(stats.ok / stats.total * 100)
    const icon = rate === 100 ? '✅' : rate >= 50 ? '⚠️' : '❌'
    md += `| ${icon} ${cat} | ${stats.ok} | ${stats.total} | ${rate}% |\n`
  })
  md += `\n`
  
  // 详细列表
  md += `## 📋 详细列表\n\n`
  
  Object.keys(categories).forEach(category => {
    md += `### ${category}\n\n`
    md += `| 工具名称 | 状态 | 问题 | 元素统计 |\n`
    md += `|----------|------|------|----------|\n`
    
    results
      .filter(r => r.category === category)
      .forEach(r => {
        const statusIcon = {
          'ok': '✅',
          'error': '❌',
          'empty': '⚠️',
          'incomplete': '🔸',
          'failed': '💥'
        }[r.status] || '❓'
        
        const statusText = {
          'ok': '正常',
          'error': '错误',
          'empty': '空白',
          'incomplete': '不完整',
          'failed': '失败'
        }[r.status] || '未知'
        
        const issues = r.issues.length > 0 ? r.issues.join('; ') : '-'
        const elements = `按钮:${r.elementCounts.buttons} 输入:${r.elementCounts.inputs} 卡片:${r.elementCounts.cards}`
        
        md += `| ${r.name} | ${statusIcon} ${statusText} | ${issues} | ${elements} |\n`
      })
    
    md += `\n`
  })
  
  // 问题列表
  const problemTools = results.filter(r => r.status !== 'ok')
  if (problemTools.length > 0) {
    md += `## ⚠️ 需要关注的工具 (${problemTools.length})\n\n`
    problemTools.forEach((r, i) => {
      md += `${i + 1}. **${r.name}** (${r.category})\n`
      md += `   - 状态: ${r.status}\n`
      md += `   - 路径: ${r.path}\n`
      r.issues.forEach(issue => {
        md += `   - 问题: ${issue}\n`
      })
      md += `\n`
    })
  }
  
  return md
}

function printSummary(results) {
  console.log('='.repeat(80))
  console.log('📊 巡检摘要')
  console.log('='.repeat(80))
  
  const statusCount = {
    ok: results.filter(r => r.status === 'ok').length,
    error: results.filter(r => r.status === 'error').length,
    empty: results.filter(r => r.status === 'empty').length,
    incomplete: results.filter(r => r.status === 'incomplete').length,
    failed: results.filter(r => r.status === 'failed').length
  }
  
  console.log(`✅ 正常工具: ${statusCount.ok}/${results.length} (${Math.round(statusCount.ok / results.length * 100)}%)`)
  console.log(`❌ 错误工具: ${statusCount.error}`)
  console.log(`⚠️  空白页面: ${statusCount.empty}`)
  console.log(`🔸 不完整: ${statusCount.incomplete}`)
  console.log(`💥 加载失败: ${statusCount.failed}`)
  
  if (statusCount.ok === results.length) {
    console.log('\n🎉 所有工具巡检通过！')
  } else {
    console.log(`\n⚠️  发现 ${results.length - statusCount.ok} 个工具需要关注`)
  }
  
  console.log('='.repeat(80))
}

// 运行
generateReport().catch(console.error)

