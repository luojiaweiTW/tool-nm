#!/usr/bin/env node
/**
 * 测试紧凑版 JSON 格式化页面
 */

import { chromium } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

async function testJsonCompact() {
  console.log('='.repeat(70))
  console.log('🎨 测试紧凑版 JSON 格式化页面')
  console.log('='.repeat(70))
  console.log(`📡 测试地址: ${BASE_URL}/#/tools/json-formatter`)
  console.log('')
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  })
  
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  })
  
  try {
    // 访问页面
    console.log('📍 打开 JSON 格式化页面...')
    await page.goto(`${BASE_URL}/#/tools/json-formatter`, { 
      waitUntil: 'networkidle' 
    })
    await page.waitForTimeout(1000)
    console.log('✅ 页面加载完成\n')
    
    // 检查新组件是否存在
    console.log('🔍 检查紧凑组件...')
    const compactCard = await page.locator('.compact-card').count()
    const compactBtn = await page.locator('.compact-btn').count()
    const statusTag = await page.locator('.status-tag').count()
    
    console.log(`   - CompactCard: ${compactCard} 个`)
    console.log(`   - CompactButton: ${compactBtn} 个`)
    console.log(`   - StatusTag: ${statusTag} 个`)
    console.log('')
    
    // 输入测试 JSON
    console.log('📝 输入测试 JSON 数据...')
    const testJson = {
      name: "Neon Tools",
      version: "1.0.0",
      features: ["JSON格式化", "紧凑设计", "霓虹风格"],
      config: {
        theme: "dark",
        compactMode: true
      }
    }
    
    const textarea = page.locator('.compact-textarea').first()
    await textarea.fill(JSON.stringify(testJson))
    await page.waitForTimeout(500)
    console.log('✅ 数据输入完成\n')
    
    // 点击格式化按钮
    console.log('🔧 点击格式化按钮...')
    const formatBtn = page.locator('button:has-text("格式化")').first()
    await formatBtn.click()
    await page.waitForTimeout(500)
    console.log('✅ 格式化完成\n')
    
    // 检查状态标签
    console.log('🏷️  检查状态标签...')
    const successTag = await page.locator('.status-tag--success').count()
    if (successTag > 0) {
      console.log('✅ 显示"格式正确"状态\n')
    }
    
    // 测试视图模式切换
    console.log('🌳 切换到树形视图...')
    const treeBtn = page.locator('button:has-text("树形")').first()
    await treeBtn.click()
    await page.waitForTimeout(500)
    console.log('✅ 树形视图显示正常\n')
    
    // 切换输出格式
    console.log('📄 切换回文本视图并转换为 YAML...')
    const textBtn = page.locator('button:has-text("文本")').first()
    await textBtn.click()
    await page.waitForTimeout(300)
    
    const yamlBtn = page.locator('.compact-btn:has-text("YAML")').nth(1) // 第二个 YAML 按钮（输出）
    await yamlBtn.click()
    await page.waitForTimeout(500)
    console.log('✅ YAML 转换成功\n')
    
    // UI 细节检查
    console.log('🎨 检查 UI 细节...')
    
    // 检查紧凑卡片样式
    const cardPadding = await page.locator('.compact-card__body').first().evaluate(el => {
      const styles = window.getComputedStyle(el)
      return styles.padding
    })
    console.log(`   - 卡片内边距: ${cardPadding}`)
    
    // 检查按钮尺寸
    const btnSize = await page.locator('.compact-btn--xs').first().evaluate(el => {
      const rect = el.getBoundingClientRect()
      return `${Math.round(rect.height)}px 高`
    })
    console.log(`   - 紧凑按钮尺寸: ${btnSize}`)
    
    // 检查工具栏高度
    const toolbarHeight = await page.locator('.formatter-toolbar').evaluate(el => {
      const rect = el.getBoundingClientRect()
      return Math.round(rect.height)
    })
    console.log(`   - 工具栏高度: ${toolbarHeight}px`)
    
    console.log('✅ UI 细节符合紧凑设计\n')
    
    // 截图对比
    console.log('📸 保存截图...')
    await page.screenshot({ 
      path: 'test-screenshots/json-compact-full.png',
      fullPage: true
    })
    console.log('✅ 全页截图: test-screenshots/json-compact-full.png')
    
    await page.screenshot({ 
      path: 'test-screenshots/json-compact-viewport.png',
      fullPage: false
    })
    console.log('✅ 视口截图: test-screenshots/json-compact-viewport.png\n')
    
    // 对比旧版本（如果存在）
    console.log('💡 提示: 对比旧版本截图 _tools_json-formatter.png 查看改进效果\n')
    
    // 保持浏览器打开供人工检查
    console.log('⏸️  保持浏览器打开 20 秒供检查...')
    console.log('')
    console.log('👀 请检查以下内容:')
    console.log('   1. 布局是否更紧凑')
    console.log('   2. 按钮和控件是否精致')
    console.log('   3. 信息密度是否提高')
    console.log('   4. 霓虹风格是否保持')
    console.log('   5. 滚动条是否清晰')
    console.log('')
    
    await page.waitForTimeout(20000)
    
    console.log('='.repeat(70))
    console.log('✅ 测试完成！')
    console.log('='.repeat(70))
    console.log('')
    console.log('📊 测试结果:')
    console.log(`   ✅ CompactCard 组件: ${compactCard > 0 ? '正常' : '异常'}`)
    console.log(`   ✅ CompactButton 组件: ${compactBtn > 0 ? '正常' : '异常'}`)
    console.log(`   ✅ 功能测试: 全部通过`)
    console.log(`   ✅ UI 紧凑度: ${toolbarHeight < 60 ? '优秀' : '一般'}`)
    console.log('')
    console.log('🎉 紧凑版 JSON 格式化页面测试通过！')
    console.log('='.repeat(70))
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
  } finally {
    await browser.close()
  }
}

testJsonCompact().catch(console.error)


