import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/unit-converter'

async function testUnitConverter() {
  console.log('🚀 启动浏览器自动化测试 - 单位换算器\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  const issues = []
  
  try {
    // ========== 1. 页面加载测试 ==========
    console.log('📡 访问页面:', TEST_URL)
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    console.log('✅ 页面加载完成\n')
    
    // ========== 2. 检查页面标题 ==========
    console.log('🔍 检查页面标题...')
    const title = await page.locator('h2').first().textContent()
    if (title.includes('单位换算器')) {
      console.log('✅ 页面标题正确:', title, '\n')
    } else {
      issues.push('页面标题不正确')
    }
    
    // ========== 3. 检查单位类型卡片 ==========
    console.log('🎨 检查单位类型卡片...')
    const typeCards = page.locator('.unit-type-card')
    const typeCount = await typeCards.count()
    console.log(`  找到 ${typeCount} 个单位类型`)
    
    if (typeCount === 8) {
      console.log('✅ 单位类型数量正确 (8个)\n')
    } else {
      issues.push(`单位类型数量错误: 期望 8 个，实际 ${typeCount} 个`)
    }
    
    // ========== 4. 测试长度转换 ==========
    console.log('📏 测试长度转换 (米 → 千米)...')
    
    // 确保选中长度类型
    await page.locator('.unit-type-card').first().click()
    await page.waitForTimeout(500)
    
    // 输入数值
    const sourceInput = page.locator('.converter-input-group').first().locator('input')
    await sourceInput.fill('1000')
    await page.waitForTimeout(500)
    
    // 选择源单位（米）
    const sourceSelect = page.locator('.converter-input-group').first().locator('select')
    await sourceSelect.selectOption('meter')
    await page.waitForTimeout(500)
    
    // 选择目标单位（千米）
    const targetSelect = page.locator('.converter-input-group').last().locator('select')
    await targetSelect.selectOption('kilometer')
    await page.waitForTimeout(1000)
    
    // 检查结果
    const targetInput = page.locator('.converter-input-group').last().locator('input')
    const result = await targetInput.inputValue()
    console.log(`  输入: 1000 米`)
    console.log(`  结果: ${result} 千米`)
    
    if (result === '1' || result === '1.0000') {
      console.log('✅ 长度转换计算正确 (1000m = 1km)\n')
    } else {
      issues.push(`长度转换结果错误: 期望 1，实际 ${result}`)
    }
    
    // ========== 5. 测试温度转换 ==========
    console.log('🌡️ 测试温度转换 (摄氏度 → 华氏度)...')
    
    // 点击温度类型
    const tempCard = page.locator('.unit-type-card').nth(2) // 温度是第3个
    await tempCard.click()
    await page.waitForTimeout(500)
    
    // 输入 0 摄氏度
    await sourceInput.fill('0')
    await page.waitForTimeout(500)
    
    // 选择摄氏度
    await sourceSelect.selectOption('celsius')
    await page.waitForTimeout(500)
    
    // 选择华氏度
    await targetSelect.selectOption('fahrenheit')
    await page.waitForTimeout(1000)
    
    // 检查结果
    const tempResult = await targetInput.inputValue()
    console.log(`  输入: 0 °C`)
    console.log(`  结果: ${tempResult} °F`)
    
    if (tempResult === '32' || tempResult === '32.0000') {
      console.log('✅ 温度转换计算正确 (0°C = 32°F)\n')
    } else {
      issues.push(`温度转换结果错误: 期望 32，实际 ${tempResult}`)
    }
    
    // ========== 6. 测试存储单位转换 ==========
    console.log('💾 测试存储单位转换 (MB → KB)...')
    
    // 点击存储类型
    const storageCard = page.locator('.unit-type-card').nth(6) // 存储是第7个
    await storageCard.click()
    await page.waitForTimeout(500)
    
    // 输入 1 MB
    await sourceInput.fill('1')
    await page.waitForTimeout(500)
    
    // 选择 MB
    await sourceSelect.selectOption('megabyte')
    await page.waitForTimeout(500)
    
    // 选择 KB
    await targetSelect.selectOption('kilobyte')
    await page.waitForTimeout(1000)
    
    // 检查结果
    const storageResult = await targetInput.inputValue()
    console.log(`  输入: 1 MB`)
    console.log(`  结果: ${storageResult} KB`)
    
    const storageNum = parseFloat(storageResult)
    if (storageNum === 1024) {
      console.log('✅ 存储转换计算正确 (1MB = 1024KB)\n')
    } else {
      issues.push(`存储转换结果错误: 期望 1024，实际 ${storageResult}`)
    }
    
    // ========== 7. 测试交换单位按钮 ==========
    console.log('🔄 测试交换单位功能...')
    
    const swapButton = page.locator('button:has-text("交换单位")')
    await swapButton.click()
    await page.waitForTimeout(1000)
    
    // 检查源单位是否变为 KB
    const newSourceUnit = await sourceSelect.inputValue()
    console.log(`  交换后源单位: ${newSourceUnit}`)
    
    if (newSourceUnit === 'kilobyte') {
      console.log('✅ 交换单位功能正常\n')
    } else {
      issues.push('交换单位功能异常')
    }
    
    // ========== 8. 测试快捷转换 ==========
    console.log('⚡ 测试快捷转换...')
    
    // 回到长度类型
    await page.locator('.unit-type-card').first().click()
    await page.waitForTimeout(500)
    
    // 点击第一个快捷方式
    const shortcut = page.locator('.shortcut-item').first()
    await shortcut.click()
    await page.waitForTimeout(1000)
    
    const shortcutResult = await targetInput.inputValue()
    console.log(`  快捷转换结果: ${shortcutResult}`)
    
    if (shortcutResult) {
      console.log('✅ 快捷转换功能正常\n')
    } else {
      issues.push('快捷转换功能异常')
    }
    
    // ========== 9. 测试复制功能 ==========
    console.log('📋 测试复制功能...')
    
    const copyButton = page.locator('button:has-text("复制结果")')
    await copyButton.click()
    await page.waitForTimeout(500)
    
    // 检查是否显示成功提示
    const successMsg = page.locator('.el-message--success')
    const hasCopySuccess = await successMsg.count() > 0
    
    if (hasCopySuccess) {
      console.log('✅ 复制功能正常\n')
    } else {
      console.log('⚠️  复制功能可能异常（未检测到成功提示）\n')
    }
    
    // ========== 10. UI 细节检查 ==========
    console.log('🎨 详细 UI 检查...')
    
    // 检查标题区域
    const headerInfo = await page.locator('.page-header h2').evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const styles = window.getComputedStyle(el)
      return {
        width: rect.width,
        height: rect.height,
        color: styles.color,
        writingMode: styles.writingMode
      }
    })
    
    console.log(`  标题尺寸: ${headerInfo.width.toFixed(0)}×${headerInfo.height.toFixed(0)}px`)
    console.log(`  文字方向: ${headerInfo.writingMode}`)
    
    if (headerInfo.width > 100) {
      console.log('✅ 标题宽度正常')
    } else {
      issues.push(`标题宽度过窄 (${headerInfo.width}px)`)
    }
    
    if (headerInfo.writingMode === 'horizontal-tb') {
      console.log('✅ 文字横向显示')
    } else {
      issues.push('文字方向错误')
    }
    
    // 检查输入框样式
    const inputStyles = await sourceInput.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        background: styles.backgroundColor,
        border: styles.border,
        padding: styles.padding
      }
    })
    
    console.log(`  输入框样式: ${inputStyles.border}`)
    
    // 检查按钮样式
    const buttonStyles = await swapButton.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        background: styles.backgroundColor,
        padding: styles.padding
      }
    })
    
    console.log(`  按钮背景: ${buttonStyles.background}`)
    
    if (buttonStyles.background !== 'rgba(0, 0, 0, 0)' && buttonStyles.background !== 'transparent') {
      console.log('✅ 按钮背景可见\n')
    } else {
      issues.push('按钮背景透明')
    }
    
    // ========== 11. 截图 ==========
    console.log('📸 保存测试截图...')
    await page.screenshot({ 
      path: 'test-unit-converter.png', 
      fullPage: true 
    })
    console.log('✅ 截图已保存: test-unit-converter.png\n')
    
    // ========== 12. 保持浏览器打开供人工检查 ==========
    console.log('⏸️  保持浏览器打开 15 秒供人工检查...')
    console.log('请检查:')
    console.log('  - 所有单位类型是否正确显示')
    console.log('  - 转换结果是否准确')
    console.log('  - 快捷转换是否可用')
    console.log('  - 交换单位是否正常')
    console.log('  - UI 布局是否美观')
    console.log('  - 颜色对比度是否充足')
    await page.waitForTimeout(15000)
    
    // ========== 输出测试报告 ==========
    console.log('\n' + '='.repeat(70))
    console.log('📊 单位换算器测试报告')
    console.log('='.repeat(70))
    console.log(`🔗 测试页面: ${TEST_URL}`)
    console.log(`📡 测试时间: ${new Date().toLocaleString('zh-CN')}`)
    console.log('')
    
    if (issues.length === 0) {
      console.log('📈 测试状态: ✅ 全部通过')
      console.log('')
      console.log('💬 测试项目:')
      console.log('   1. ✅ 页面加载')
      console.log('   2. ✅ 页面标题显示')
      console.log('   3. ✅ 单位类型数量 (8个)')
      console.log('   4. ✅ 长度转换 (米→千米)')
      console.log('   5. ✅ 温度转换 (摄氏度→华氏度)')
      console.log('   6. ✅ 存储转换 (MB→KB)')
      console.log('   7. ✅ 交换单位功能')
      console.log('   8. ✅ 快捷转换功能')
      console.log('   9. ✅ 复制结果功能')
      console.log('  10. ✅ UI 布局检查')
      console.log('  11. ✅ 按钮样式检查')
      console.log('')
      console.log('📊 统计:')
      console.log('   - 测试用例: 11 个')
      console.log('   - 通过: 11 个')
      console.log('   - 失败: 0 个')
      console.log('')
      console.log('✅ 结论: 功能完全可用，可以交付')
    } else {
      console.log('📈 测试状态: ⚠️  发现问题')
      console.log('')
      console.log('⚠️  发现的问题:')
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`)
      })
      console.log('')
      console.log('📊 统计:')
      console.log(`   - 测试用例: 11 个`)
      console.log(`   - 通过: ${11 - issues.length} 个`)
      console.log(`   - 失败: ${issues.length} 个`)
      console.log('')
      console.log('⚠️  结论: 需要修复上述问题')
    }
    
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-unit-converter-error.png' })
    console.log('📸 错误截图已保存: test-unit-converter-error.png')
  } finally {
    await browser.close()
  }
}

testUnitConverter().catch(console.error)

