#!/usr/bin/env node
/**
 * 检查所有页面的滚动条样式
 */

import { chromium } from '@playwright/test'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const BASE_URL = 'http://localhost:5173'

// 所有工具路由
const TOOLS = [
  '/tools/json-formatter',
  '/tools/xml-yaml',
  '/tools/sql-formatter',
  '/tools/text-diff',
  '/tools/regex',
  '/tools/doc-to-markdown',
  '/tools/base64',
  '/tools/url-encoder',
  '/tools/hash',
  '/tools/encrypt',
  '/tools/unicode',
  '/tools/encoding',
  '/tools/jwt',
  '/tools/timestamp',
  '/tools/cron',
  '/tools/uuid',
  '/tools/random-generator',
  '/tools/number-base',
  '/tools/qrcode',
  '/tools/unit-converter',
  '/tools/color-converter',
  '/tools/json-to-java',
  '/tools/exception-parser',
  '/tools/maven-search',
  '/tools/http-client',
  '/tools/ip-query',
  '/tools/command-history',
  '/tools/port-scanner',
  '/tools/ip-scanner',
  '/tools/websocket',
  '/tools/clipboard-history',
  '/tools/screenshot',
  '/tools/system-monitor',
  '/tools/weather',
  '/tools/knowledge',
  '/tools/snippets',
  '/tools/bookmarks',
  '/tools/entertainment',
]

// 检查页面滚动条
async function checkPageScrollbar(page, path) {
  const result = {
    path,
    issues: [],
    scrollableElements: []
  }
  
  try {
    await page.goto(`${BASE_URL}/#${path}`, { 
      waitUntil: 'networkidle',
      timeout: 10000 
    })
    await page.waitForTimeout(1000)
    
    // 查找所有可能需要滚动的元素
    const scrollableSelectors = [
      'textarea',
      'pre',
      '.diff-display',
      '.json-tree',
      '.result-output',
      '.compact-output',
      '.output',
      '[style*="overflow"]',
      '[class*="scroll"]',
      '.tool-page__content',
      '.formatter-content',
      '.editor-wrapper',
    ]
    
    for (const selector of scrollableSelectors) {
      const elements = await page.locator(selector).all()
      
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i]
        const info = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          const scrollbarStyles = window.getComputedStyle(el, '::-webkit-scrollbar')
          const scrollbarThumbStyles = window.getComputedStyle(el, '::-webkit-scrollbar-thumb')
          
          return {
            tagName: el.tagName,
            className: el.className,
            overflow: styles.overflow,
            overflowY: styles.overflowY,
            overflowX: styles.overflowX,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            hasScroll: el.scrollHeight > el.clientHeight,
            scrollbarWidth: scrollbarStyles.width,
            scrollbarDisplay: scrollbarStyles.display,
            thumbBackground: scrollbarThumbStyles.backgroundColor,
            thumbBorder: scrollbarThumbStyles.border,
          }
        })
        
        // 如果元素可滚动
        if (info.hasScroll) {
          const hasScrollbarStyle = info.scrollbarWidth && info.scrollbarWidth !== '0px' && info.scrollbarWidth !== 'auto'
          const hasThumbStyle = info.thumbBackground && info.thumbBackground !== 'rgba(0, 0, 0, 0)'
          
          const elementInfo = {
            selector,
            index: i,
            ...info,
            hasScrollbarStyle,
            hasThumbStyle
          }
          
          result.scrollableElements.push(elementInfo)
          
          // 检查是否缺少滚动条样式
          if (!hasScrollbarStyle || !hasThumbStyle) {
            result.issues.push({
              type: 'missing-scrollbar-style',
              element: `${selector}[${i}]`,
              className: info.className,
              reason: !hasScrollbarStyle ? '缺少滚动条宽度样式' : '缺少滚动条滑块样式'
            })
          }
          
          // 检查滚动条宽度
          if (hasScrollbarStyle) {
            const width = parseInt(info.scrollbarWidth)
            if (width < 6) {
              result.issues.push({
                type: 'scrollbar-too-small',
                element: `${selector}[${i}]`,
                width: info.scrollbarWidth,
                reason: '滚动条宽度小于6px，可能不够明显'
              })
            }
          }
        }
      }
    }
    
  } catch (error) {
    result.issues.push({
      type: 'page-error',
      reason: error.message
    })
  }
  
  return result
}

async function runCheck() {
  console.log('='.repeat(80))
  console.log('🔍 检查所有页面的滚动条样式')
  console.log('='.repeat(80))
  console.log(`📡 测试地址: ${BASE_URL}`)
  console.log(`📄 页面数量: ${TOOLS.length} 个`)
  console.log('='.repeat(80))
  
  const browser = await chromium.launch({
    headless: true
  })
  
  const page = await browser.newPage()
  page.setDefaultTimeout(10000)
  
  const results = []
  
  try {
    for (let i = 0; i < TOOLS.length; i++) {
      const path = TOOLS[i]
      process.stdout.write(`\r检查进度: ${i + 1}/${TOOLS.length} (${Math.round((i + 1) / TOOLS.length * 100)}%) - ${path}...                    `)
      
      const result = await checkPageScrollbar(page, path)
      results.push(result)
      
      await page.waitForTimeout(300)
    }
    
    console.log('\n\n✅ 检查完成！\n')
    
  } finally {
    await browser.close()
  }
  
  // 输出报告
  console.log('='.repeat(80))
  console.log('📊 检查报告')
  console.log('='.repeat(80))
  
  const problemPages = results.filter(r => r.issues.length > 0)
  
  if (problemPages.length === 0) {
    console.log('\n✅ 所有页面的滚动条样式都正常！\n')
  } else {
    console.log(`\n⚠️  发现 ${problemPages.length} 个页面有滚动条问题：\n`)
    
    problemPages.forEach((page, idx) => {
      console.log(`${idx + 1}. ${page.path}`)
      console.log(`   可滚动元素: ${page.scrollableElements.length} 个`)
      console.log(`   问题数量: ${page.issues.length} 个`)
      
      // 按问题类型分组
      const missingStyle = page.issues.filter(i => i.type === 'missing-scrollbar-style')
      const tooSmall = page.issues.filter(i => i.type === 'scrollbar-too-small')
      const errors = page.issues.filter(i => i.type === 'page-error')
      
      if (missingStyle.length > 0) {
        console.log(`   ❌ 缺少滚动条样式: ${missingStyle.length} 处`)
        missingStyle.forEach(issue => {
          console.log(`      - ${issue.element} (${issue.className || 'no class'})`)
          console.log(`        原因: ${issue.reason}`)
        })
      }
      
      if (tooSmall.length > 0) {
        console.log(`   ⚠️  滚动条太小: ${tooSmall.length} 处`)
        tooSmall.forEach(issue => {
          console.log(`      - ${issue.element}: ${issue.width}`)
        })
      }
      
      if (errors.length > 0) {
        console.log(`   💥 页面错误: ${errors[0].reason}`)
      }
      
      console.log('')
    })
  }
  
  // 统计
  const totalScrollable = results.reduce((sum, r) => sum + r.scrollableElements.length, 0)
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  
  console.log('='.repeat(80))
  console.log('📈 统计:')
  console.log(`   检查页面: ${TOOLS.length} 个`)
  console.log(`   可滚动元素: ${totalScrollable} 个`)
  console.log(`   有问题的页面: ${problemPages.length} 个`)
  console.log(`   总问题数: ${totalIssues} 个`)
  console.log('='.repeat(80))
  
  // 生成修复建议
  if (problemPages.length > 0) {
    console.log('\n💡 修复建议:\n')
    console.log('添加以下CSS到相应的组件中：\n')
    console.log('```css')
    console.log('/* 霓虹风格滚动条 */')
    console.log('.your-scrollable-element::-webkit-scrollbar {')
    console.log('  width: 8px;')
    console.log('  height: 8px;')
    console.log('}')
    console.log('')
    console.log('.your-scrollable-element::-webkit-scrollbar-track {')
    console.log('  background: rgba(255, 255, 255, 0.05);')
    console.log('  border-radius: 4px;')
    console.log('}')
    console.log('')
    console.log('.your-scrollable-element::-webkit-scrollbar-thumb {')
    console.log('  background: rgba(33, 230, 255, 0.5);')
    console.log('  border-radius: 4px;')
    console.log('  transition: background 0.3s ease;')
    console.log('}')
    console.log('')
    console.log('.your-scrollable-element::-webkit-scrollbar-thumb:hover {')
    console.log('  background: rgba(33, 230, 255, 0.8);')
    console.log('}')
    console.log('```\n')
  }
  
  console.log('='.repeat(80))
  
  return problemPages.length === 0
}

runCheck()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n❌ 检查失败:', error)
    process.exit(1)
  })




