#!/usr/bin/env node
/**
 * 批量测试紧凑版页面
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

const COMPACT_PAGES = [
  {
    name: 'JSON 格式化',
    path: '/tools/json-formatter',
    tests: [
      {
        name: '输入测试数据',
        action: async (page) => {
          const textarea = page.locator('.compact-textarea').first()
          await textarea.fill('{"name":"test","value":123}')
          await page.waitForTimeout(300)
        }
      },
      {
        name: '点击格式化',
        action: async (page) => {
          const btn = page.locator('button:has-text("格式化")').first()
          await btn.click()
          await page.waitForTimeout(300)
        }
      }
    ]
  },
  {
    name: 'Base64 编解码',
    path: '/tools/base64',
    tests: [
      {
        name: '输入测试文本',
        action: async (page) => {
          const textarea = page.locator('.compact-textarea').first()
          await textarea.fill('Hello Neon Tools!')
          await page.waitForTimeout(300)
        }
      },
      {
        name: '点击编码',
        action: async (page) => {
          const btn = page.locator('button:has-text("编码")').first()
          await btn.click()
          await page.waitForTimeout(300)
        }
      }
    ]
  },
  {
    name: 'URL 编码',
    path: '/tools/url-encoder',
    tests: [
      {
        name: '输入测试URL',
        action: async (page) => {
          const textarea = page.locator('.compact-textarea').first()
          await textarea.fill('https://example.com?name=张三&city=北京')
          await page.waitForTimeout(300)
        }
      },
      {
        name: '点击编码',
        action: async (page) => {
          const btn = page.locator('button:has-text("编码")').first()
          await btn.click()
          await page.waitForTimeout(300)
        }
      }
    ]
  }
]

async function testCompactPage(browser, pageInfo) {
  const page = await browser.newPage()
  const result = {
    name: pageInfo.name,
    passed: true,
    issues: [],
    metrics: {}
  }
  
  try {
    console.log(`\n📍 测试: ${pageInfo.name}`)
    console.log(`   路径: ${BASE_URL}/#${pageInfo.path}`)
    
    // 访问页面
    await page.goto(`${BASE_URL}/#${pageInfo.path}`, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    await page.waitForTimeout(1000)
    console.log('   ✅ 页面加载完成')
    
    // 检查紧凑组件
    const compactCard = await page.locator('.compact-card').count()
    const compactBtn = await page.locator('.compact-btn').count()
    
    result.metrics.compactCard = compactCard
    result.metrics.compactBtn = compactBtn
    
    console.log(`   🔍 紧凑组件: Card(${compactCard}) Button(${compactBtn})`)
    
    // 检查工具栏高度
    const toolbarHeight = await page.locator('.formatter-toolbar').evaluate(el => {
      return Math.round(el.getBoundingClientRect().height)
    })
    result.metrics.toolbarHeight = toolbarHeight
    console.log(`   📏 工具栏高度: ${toolbarHeight}px ${toolbarHeight <= 54 ? '✅' : '⚠️'}`)
    
    if (toolbarHeight > 60) {
      result.issues.push('工具栏高度超过60px')
    }
    
    // 运行功能测试
    for (const test of pageInfo.tests) {
      console.log(`   🧪 ${test.name}...`)
      await test.action(page)
      console.log(`   ✅ ${test.name}完成`)
    }
    
    // 检查结果显示
    const hasOutput = await page.locator('.compact-output, .status-tag--success').count() > 0
    if (hasOutput) {
      console.log('   ✅ 结果显示正常')
    } else {
      result.issues.push('结果未显示')
      result.passed = false
    }
    
    // 截图
    await page.screenshot({ 
      path: `test-screenshots/compact-${pageInfo.path.replace(/\//g, '_')}.png`,
      fullPage: true
    })
    console.log(`   📸 截图已保存`)
    
  } catch (error) {
    result.passed = false
    result.issues.push(`测试失败: ${error.message}`)
    console.log(`   ❌ 错误: ${error.message}`)
  } finally {
    await page.close()
  }
  
  return result
}

async function runBatchTest() {
  console.log('='.repeat(70))
  console.log('🚀 紧凑版页面批量测试')
  console.log('='.repeat(70))
  console.log(`📡 测试地址: ${BASE_URL}`)
  console.log(`🔍 测试页面: ${COMPACT_PAGES.length} 个`)
  console.log('='.repeat(70))
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  })
  
  const results = []
  
  try {
    for (const pageInfo of COMPACT_PAGES) {
      const result = await testCompactPage(browser, pageInfo)
      results.push(result)
      await browser.contexts()[0].pages()[0].waitForTimeout(500)
    }
    
  } finally {
    console.log('\n⏸️  保持浏览器打开 5 秒...')
    await browser.contexts()[0].pages()[0].waitForTimeout(5000)
    await browser.close()
  }
  
  // 输出报告
  console.log('\n' + '='.repeat(70))
  console.log('📊 测试报告')
  console.log('='.repeat(70))
  
  results.forEach((r, i) => {
    const icon = r.passed ? '✅' : '❌'
    console.log(`\n${i + 1}. ${icon} ${r.name}`)
    console.log(`   - 紧凑卡片: ${r.metrics.compactCard} 个`)
    console.log(`   - 紧凑按钮: ${r.metrics.compactBtn} 个`)
    console.log(`   - 工具栏高度: ${r.metrics.toolbarHeight}px`)
    
    if (r.issues.length > 0) {
      console.log(`   - 问题: ${r.issues.join(', ')}`)
    }
  })
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log('\n' + '='.repeat(70))
  console.log('📈 总体统计:')
  console.log(`   通过: ${passed}/${results.length}`)
  console.log(`   失败: ${failed}`)
  
  // 平均工具栏高度
  const avgToolbarHeight = Math.round(
    results.reduce((sum, r) => sum + r.metrics.toolbarHeight, 0) / results.length
  )
  console.log(`   平均工具栏高度: ${avgToolbarHeight}px`)
  
  console.log('='.repeat(70))
  
  if (failed === 0) {
    console.log('\n🎉 所有紧凑页面测试通过！')
  } else {
    console.log(`\n⚠️  有 ${failed} 个页面测试失败`)
  }
  
  console.log('='.repeat(70) + '\n')
  
  return passed === results.length
}

runBatchTest()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ 测试异常:', error)
    process.exit(1)
  })















