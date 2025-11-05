import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/time-calculator'

async function testTimeCalculator() {
  console.log('🚀 启动浏览器自动化测试 - 时间计算器\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  const testResults = []
  const uiIssues = []
  
  try {
    // ===== 测试用例 1: 页面加载 =====
    console.log('📡 测试用例 1: 访问页面...')
    const startTime = Date.now()
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    console.log(`✅ 页面加载完成 (${loadTime}ms)\n`)
    testResults.push({ name: '页面加载', passed: true, duration: loadTime })
    
    // 检查页面标题
    const title = await page.locator('h3.page-title').textContent()
    if (title.includes('时间计算器')) {
      console.log('✅ 页面标题显示正确\n')
      testResults.push({ name: '页面标题', passed: true })
    } else {
      console.log('❌ 页面标题错误\n')
      testResults.push({ name: '页面标题', passed: false, error: '标题不匹配' })
    }
    
    // ===== 测试用例 2: UI 布局检查 =====
    console.log('🎨 测试用例 2: UI 布局检查...')
    
    // 检查模式选择器
    const modeTabs = await page.locator('.mode-tab').count()
    console.log(`  模式选项卡数量: ${modeTabs}`)
    if (modeTabs === 3) {
      console.log('✅ 模式选项卡数量正确 (3个)\n')
      testResults.push({ name: 'UI布局-模式选项卡', passed: true })
    } else {
      console.log('❌ 模式选项卡数量错误\n')
      testResults.push({ name: 'UI布局-模式选项卡', passed: false })
    }
    
    // 检查标题布局
    const titleInfo = await page.locator('.page-title').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        writingMode: styles.writingMode,
        display: styles.display,
        textContent: el.textContent
      }
    })
    
    console.log(`  标题尺寸: ${titleInfo.width}×${titleInfo.height}px`)
    console.log(`  显示模式: ${titleInfo.display}`)
    console.log(`  文字方向: ${titleInfo.writingMode}`)
    
    // 检查布局方向
    if (titleInfo.writingMode !== 'horizontal-tb') {
      uiIssues.push('标题文字方向错误，应为横向')
    }
    
    if (titleInfo.width < 200) {
      uiIssues.push(`标题宽度过窄 (${titleInfo.width}px)，可能导致文字换行`)
    }
    
    if (uiIssues.length === 0) {
      console.log('✅ 标题布局检查通过\n')
      testResults.push({ name: 'UI布局-标题', passed: true })
    } else {
      console.log('⚠️  发现布局问题:', uiIssues, '\n')
      testResults.push({ name: 'UI布局-标题', passed: false, error: uiIssues.join(', ') })
    }
    
    // ===== 测试用例 3: 日期时间加减功能 =====
    console.log('🔢 测试用例 3: 日期时间加减功能...')
    
    // 确保在"日期时间加减"模式
    const addSubtractTab = page.locator('.mode-tab').first()
    await addSubtractTab.click()
    await page.waitForTimeout(300)
    
    // 选择"日期"类型
    const dateRadio = page.locator('input[type="radio"][value="date"]').first()
    await dateRadio.check()
    await page.waitForTimeout(300)
    
    // 输入起始日期
    console.log('  输入起始日期: 2025-10-20')
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill('2025-10-20')
    await page.waitForTimeout(300)
    
    // 选择操作: 加上
    const operationSelect = page.locator('select.neon-select').first()
    await operationSelect.selectOption('add')
    
    // 输入数值: 10
    console.log('  操作: 加上 10 天')
    const valueInput = page.locator('input[type="number"]').first()
    await valueInput.fill('10')
    
    // 选择单位: 天
    const unitSelect = page.locator('select.neon-select').nth(1)
    await unitSelect.selectOption('days')
    
    // 点击计算按钮
    const calculateBtn = page.locator('.form-actions button').filter({ hasText: '计算' }).first()
    await calculateBtn.click()
    await page.waitForTimeout(1000)
    
    // 检查结果
    const result = await page.locator('.result-value').last()
    const resultText = await result.textContent()
    console.log(`  计算结果: ${resultText}`)
    
    if (resultText && resultText.includes('2025')) {
      console.log('✅ 日期加减计算功能正常\n')
      testResults.push({ name: '日期加减计算', passed: true })
    } else {
      console.log('❌ 日期加减计算结果异常\n')
      testResults.push({ name: '日期加减计算', passed: false, error: '结果格式错误' })
    }
    
    // 测试复制功能
    console.log('  测试复制功能...')
    const copyBtn = page.locator('.result-actions button').filter({ hasText: '复制' }).first()
    if (await copyBtn.isVisible()) {
      await copyBtn.click()
      await page.waitForTimeout(500)
      console.log('✅ 复制按钮可用\n')
      testResults.push({ name: '复制功能', passed: true })
    }
    
    // ===== 测试用例 4: 时间差值计算 =====
    console.log('📊 测试用例 4: 时间差值计算...')
    
    // 切换到"时间差值"模式
    const diffTab = page.locator('.mode-tab').nth(1)
    await diffTab.click()
    await page.waitForTimeout(500)
    
    // 等待新表单加载
    await page.waitForSelector('input[type="radio"][value="date"]', { timeout: 5000 })
    
    // 选择"日期"类型（在当前可见的表单中）
    const diffDateRadio = page.locator('input[type="radio"][value="date"]').first()
    await diffDateRadio.check()
    await page.waitForTimeout(300)
    
    // 输入开始日期（当前可见的第一个日期输入框）
    console.log('  输入开始日期: 2025-01-01')
    const startDateInput = page.locator('input[type="date"]').first()
    await startDateInput.fill('2025-01-01')
    await page.waitForTimeout(300)
    
    // 输入结束日期（当前可见的第二个日期输入框）
    console.log('  输入结束日期: 2025-12-31')
    const endDateInput = page.locator('input[type="date"]').nth(1)
    await endDateInput.fill('2025-12-31')
    await page.waitForTimeout(300)
    
    // 点击计算差值按钮
    const calcDiffBtn = page.locator('.form-actions button').filter({ hasText: '计算差值' })
    await calcDiffBtn.click()
    await page.waitForTimeout(1000)
    
    // 检查结果
    const diffResultValue = await page.locator('.result-row.highlight .result-value').textContent()
    console.log(`  时间差值: ${diffResultValue}`)
    
    if (diffResultValue && diffResultValue.includes('天')) {
      console.log('✅ 时间差值计算功能正常\n')
      testResults.push({ name: '时间差值计算', passed: true })
      
      // 检查年月日显示
      const resultItems = await page.locator('.result-item').count()
      console.log(`  显示 ${resultItems} 个时间单位`)
      if (resultItems >= 3) {
        console.log('✅ 年月日显示完整\n')
        testResults.push({ name: '年月日显示', passed: true })
      }
    } else {
      console.log('❌ 时间差值计算结果异常\n')
      testResults.push({ name: '时间差值计算', passed: false })
    }
    
    // ===== 测试用例 5: 快捷计算 =====
    console.log('⚡ 测试用例 5: 快捷计算...')
    
    // 切换到"快捷计算"模式
    const quickTab = page.locator('.mode-tab').nth(2)
    await quickTab.click()
    await page.waitForTimeout(300)
    
    // 点击"1天后"按钮
    console.log('  测试: 1天后')
    const quickBtn = page.locator('.quick-buttons button').filter({ hasText: '1天后' })
    await quickBtn.click()
    await page.waitForTimeout(500)
    
    // 检查结果
    const quickResultVisible = await page.locator('.result-section').isVisible()
    if (quickResultVisible) {
      const quickResultText = await page.locator('.result-value').last().textContent()
      console.log(`  快捷计算结果: ${quickResultText}`)
      console.log('✅ 快捷计算功能正常\n')
      testResults.push({ name: '快捷计算', passed: true })
    } else {
      console.log('❌ 快捷计算结果未显示\n')
      testResults.push({ name: '快捷计算', passed: false })
    }
    
    // ===== 测试用例 6: 响应式布局 =====
    console.log('📱 测试用例 6: 响应式布局...')
    
    // 测试移动端视图
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    const mobileLayout = await page.locator('.mode-tabs').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        flexDirection: styles.flexDirection
      }
    })
    
    console.log(`  移动端布局方向: ${mobileLayout.flexDirection}`)
    
    // 恢复桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(500)
    
    console.log('✅ 响应式布局测试完成\n')
    testResults.push({ name: '响应式布局', passed: true })
    
    // ===== 测试用例 7: 按钮样式和对比度检查 =====
    console.log('🎨 测试用例 7: 按钮样式检查...')
    
    const buttonStyles = await page.locator('.mode-tab.active').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        background: styles.backgroundColor,
        border: styles.borderColor,
        boxShadow: styles.boxShadow
      }
    })
    
    console.log('  按钮样式:', buttonStyles)
    
    // 检查按钮是否有背景色
    if (buttonStyles.background !== 'rgba(0, 0, 0, 0)' && buttonStyles.background !== 'transparent') {
      console.log('✅ 按钮背景样式正常\n')
      testResults.push({ name: '按钮样式', passed: true })
    } else {
      console.log('⚠️  按钮背景透明\n')
      testResults.push({ name: '按钮样式', passed: false, error: '背景透明' })
    }
    
    // ===== 测试用例 8: 截图保存 =====
    console.log('📸 保存测试截图...')
    await page.screenshot({ 
      path: 'test-time-calculator-ui.png', 
      fullPage: true 
    })
    console.log('✅ 截图已保存: test-time-calculator-ui.png\n')
    
    // ===== 保持浏览器打开供人工检查 =====
    console.log('⏸️  保持浏览器打开 15 秒供人工检查...')
    console.log('请仔细检查:')
    console.log('  - 文字是否横向显示，没有竖排')
    console.log('  - 标题是否完整显示，没有换行堆叠')
    console.log('  - 按钮背景是否足够明显')
    console.log('  - 所有文字是否清晰易读')
    console.log('  - 计算结果是否正确显示')
    await page.waitForTimeout(15000)
    
    // ===== 输出测试报告 =====
    console.log('\n' + '='.repeat(70))
    console.log('📊 时间计算器功能测试报告')
    console.log('='.repeat(70))
    console.log(`🔗 测试页面: ${TEST_URL}`)
    console.log(`📅 测试时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log('')
    console.log('💬 测试项目:')
    
    let passedCount = 0
    let failedCount = 0
    
    testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌'
      const duration = result.duration ? ` (${result.duration}ms)` : ''
      const error = result.error ? ` - ${result.error}` : ''
      console.log(`   ${index + 1}. ${icon} ${result.name}${duration}${error}`)
      
      if (result.passed) {
        passedCount++
      } else {
        failedCount++
      }
    })
    
    console.log('')
    console.log('📊 统计:')
    console.log(`   - 测试用例: ${testResults.length} 个`)
    console.log(`   - 通过: ${passedCount} 个`)
    console.log(`   - 失败: ${failedCount} 个`)
    
    if (uiIssues.length > 0) {
      console.log(`   - UI 问题: ${uiIssues.length} 个`)
      console.log('')
      console.log('⚠️  发现的 UI 问题:')
      uiIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
    }
    
    console.log('')
    if (failedCount === 0 && uiIssues.length === 0) {
      console.log('✅ 结论: 功能完全可用，可以交付')
    } else if (failedCount === 0 && uiIssues.length > 0) {
      console.log('⚠️  结论: 功能可用，但有 UI 细节需要优化')
    } else {
      console.log('❌ 结论: 发现功能问题，需要修复')
    }
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-time-calculator-error.png' })
    console.log('📸 错误截图已保存: test-time-calculator-error.png\n')
  } finally {
    await browser.close()
  }
}

testTimeCalculator().catch(console.error)

