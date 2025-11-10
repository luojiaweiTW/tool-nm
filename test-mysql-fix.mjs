import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/mysql'

async function testMySQLPagination() {
  console.log('🚀 启动 MySQL 分页修复测试...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 800
  })
  
  const page = await browser.newPage()
  
  try {
    console.log('📡 访问 MySQL 工具页面...')
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    console.log('✅ 页面加载完成\n')
    
    // 截图检查
    await page.screenshot({ path: 'mysql-page.png', fullPage: true })
    console.log('📸 已保存截图: mysql-page.png\n')
    
    // === 检查页面元素 ===
    console.log('🔍 检查 SQL 编辑器...')
    const sqlTextarea = page.locator('textarea')
    const executeButton = page.locator('button', { hasText: '执行' })
    
    const textareaCount = await sqlTextarea.count()
    const buttonCount = await executeButton.count()
    
    console.log(`  找到 ${textareaCount} 个 textarea`)
    console.log(`  找到 ${buttonCount} 个执行按钮\n`)
    
    if (textareaCount === 0) {
      console.log('❌ 找不到 SQL 编辑器')
      console.log('⏸️  保持浏览器打开 10 秒供检查...')
      await page.waitForTimeout(10000)
      return
    }
    console.log('✅ SQL 编辑器可见\n')
    
    // === 检查是否已连接 ===
    const connectBtn = page.locator('button:has-text("连接")')
    const isConnected = await connectBtn.count() === 0
    
    if (!isConnected) {
      console.log('⚠️  MySQL 未连接，请先连接 MySQL 服务器')
      console.log('⏸️  保持浏览器打开 20 秒供手动连接...')
      await page.waitForTimeout(20000)
    }
    
    // === 输入测试 SQL ===
    console.log('📝 输入测试 SQL: SELECT * FROM `alarm_event`;')
    await sqlTextarea.fill('SELECT * FROM `alarm_event`;')
    await page.waitForTimeout(500)
    console.log('✅ SQL 已输入\n')
    
    // === 检查每页条数 ===
    const pageSizeInput = page.locator('input[type="number"]').first()
    const currentPageSize = await pageSizeInput.inputValue()
    console.log(`📊 当前每页条数: ${currentPageSize}`)
    
    // === 执行查询 ===
    console.log('⚡ 点击执行按钮...')
    await executeButton.click()
    
    // 等待查询完成
    await page.waitForTimeout(3000)
    
    // === 检查结果 ===
    console.log('🔍 检查查询结果...')
    
    const errorBox = page.locator('.query-error')
    const hasError = await errorBox.count() > 0
    
    if (hasError) {
      const errorText = await errorBox.textContent()
      console.log('❌ 查询出错:')
      console.log(errorText)
      console.log('')
      
      // 检查是否是 NaN 或重复 LIMIT 错误
      if (errorText.includes('NaN') || errorText.includes('LIMIT') && errorText.split('LIMIT').length > 3) {
        console.log('❌ 发现 NaN 或重复 LIMIT 问题！')
      }
    } else {
      console.log('✅ 查询成功！\n')
      
      // 检查结果显示
      const resultInfo = page.locator('.result-info')
      if (await resultInfo.count() > 0) {
        const infoText = await resultInfo.textContent()
        console.log('📊 结果信息:')
        console.log(infoText)
        console.log('')
        
        // 检查是否显示总数
        if (infoText.includes('总共') && infoText.includes('当前页')) {
          console.log('✅ 正确显示总数和当前页数量')
        } else {
          console.log('⚠️  结果信息格式可能不正确')
        }
      }
      
      // 检查分页控件
      const pagination = page.locator('.result-pagination')
      if (await pagination.count() > 0) {
        const paginationText = await pagination.textContent()
        console.log('📄 分页信息:')
        console.log(paginationText)
        console.log('')
      }
    }
    
    console.log('\n⏸️  保持浏览器打开 15 秒供检查...')
    await page.waitForTimeout(15000)
    
    console.log('\n' + '='.repeat(70))
    if (!hasError) {
      console.log('✅ 测试通过！MySQL 分页功能正常')
    } else {
      console.log('❌ 测试失败！请检查错误信息')
    }
    console.log('='.repeat(70))
    
  } catch (error) {
    console.error('\n❌ 测试异常:', error.message)
  } finally {
    await browser.close()
  }
}

testMySQLPagination().catch(console.error)

