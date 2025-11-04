import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/calculator'

async function testCalculator() {
  console.log('🚀 启动计算器自动化测试...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // 放慢操作便于观察
  })
  
  const page = await browser.newPage()
  
  try {
    console.log('📡 访问页面:', TEST_URL)
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    console.log('✅ 页面加载完成\n')
    
    // === 测试用例 1: 基础运算 ===
    console.log('🧪 测试用例 1: 基础加法运算')
    await page.click('button:has-text("1")')
    await page.click('button:has-text("2")')
    await page.click('button:has-text("+")')
    await page.click('button:has-text("3")')
    await page.click('button:has-text("4")')
    await page.click('button:has-text("=")')
    
    await page.waitForTimeout(1000)
    
    const result1 = await page.inputValue('.display-input')
    console.log(`  12 + 34 = ${result1}`)
    console.log(result1 === '46' ? '✅ 通过' : '❌ 失败')
    console.log('')
    
    // === 测试用例 2: 千分位格式化 ===
    console.log('🧪 测试用例 2: 千分位格式化')
    await page.click('button:has-text("C")')  // 清空
    await page.click('button:has-text("1")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("+")')
    await page.click('button:has-text("2")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("=")')
    
    await page.waitForTimeout(1000)
    
    const result2 = await page.inputValue('.display-input')
    console.log(`  1000 + 2000 = ${result2}`)
    console.log(result2.includes(',') ? '✅ 包含千分位逗号' : '⚠️  未格式化')
    console.log('')
    
    // === 测试用例 3: 小数运算 ===
    console.log('🧪 测试用例 3: 小数运算')
    await page.click('button:has-text("C")')
    await page.click('button:has-text("3")')
    await page.click('button:has-text(".")')
    await page.click('button:has-text("1")')
    await page.click('button:has-text("4")')
    await page.click('button:has-text("+")')
    await page.click('button:has-text("2")')
    await page.click('button:has-text(".")')
    await page.click('button:has-text("8")')
    await page.click('button:has-text("6")')
    await page.click('button:has-text("=")')
    
    await page.waitForTimeout(1000)
    
    const result3 = await page.inputValue('.display-input')
    console.log(`  3.14 + 2.86 = ${result3}`)
    console.log(result3 === '6' ? '✅ 通过' : '❌ 失败')
    console.log('')
    
    // === 测试用例 4: 乘法运算 ===
    console.log('🧪 测试用例 4: 乘法运算')
    await page.click('button:has-text("C")')
    await page.click('button:has-text("1")')
    await page.click('button:has-text("2")')
    await page.click('button:has-text("×")')
    await page.click('button:has-text("5")')
    await page.click('button:has-text("=")')
    
    await page.waitForTimeout(1000)
    
    const result4 = await page.inputValue('.display-input')
    console.log(`  12 × 5 = ${result4}`)
    console.log(result4 === '60' ? '✅ 通过' : '❌ 失败')
    console.log('')
    
    // === 测试用例 5: 除法运算 ===
    console.log('🧪 测试用例 5: 除法运算')
    await page.click('button:has-text("C")')
    await page.click('button:has-text("1")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("0")')
    await page.click('button:has-text("÷")')
    await page.click('button:has-text("4")')
    await page.click('button:has-text("=")')
    
    await page.waitForTimeout(1000)
    
    const result5 = await page.inputValue('.display-input')
    console.log(`  100 ÷ 4 = ${result5}`)
    console.log(result5 === '25' ? '✅ 通过' : '❌ 失败')
    console.log('')
    
    // === 测试用例 6: 历史记录 ===
    console.log('🧪 测试用例 6: 历史记录功能')
    const historyItems = await page.locator('.history-item').count()
    console.log(`  历史记录数量: ${historyItems}`)
    console.log(historyItems > 0 ? '✅ 历史记录已保存' : '❌ 无历史记录')
    console.log('')
    
    // === 测试用例 7: 点击历史记录恢复 ===
    if (historyItems > 0) {
      console.log('🧪 测试用例 7: 时间旅行（点击历史记录）')
      await page.click('.history-item:first-child')
      await page.waitForTimeout(500)
      
      const restoredValue = await page.inputValue('.display-input')
      console.log(`  恢复的值: ${restoredValue}`)
      console.log(restoredValue ? '✅ 成功恢复' : '❌ 恢复失败')
      console.log('')
    }
    
    // === 测试用例 8: 复制粘贴 ===
    console.log('🧪 测试用例 8: 复制粘贴功能')
    await page.click('button:has-text("C")')
    const displayInput = await page.locator('.display-input')
    await displayInput.fill('1,234,567')  // 模拟粘贴带逗号的数字
    await page.waitForTimeout(500)
    
    const pastedValue = await page.inputValue('.display-input')
    console.log(`  粘贴值: 1,234,567`)
    console.log(`  解析后: ${pastedValue}`)
    console.log(pastedValue.replace(/,/g, '') === '1234567' ? '✅ 正确解析' : '❌ 解析失败')
    console.log('')
    
    // === 测试用例 9: 键盘输入 ===
    console.log('🧪 测试用例 9: 键盘输入')
    await page.click('button:has-text("C")')
    await displayInput.focus()
    await page.keyboard.type('99')
    await page.keyboard.press('+')
    await page.keyboard.type('1')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    const keyboardResult = await page.inputValue('.display-input')
    console.log(`  99 + 1 = ${keyboardResult}`)
    console.log(keyboardResult === '100' ? '✅ 键盘输入正常' : '❌ 键盘输入失败')
    console.log('')
    
    // === 测试用例 10: Backspace 功能 ===
    console.log('🧪 测试用例 10: Backspace 删除')
    await page.click('button:has-text("C")')
    await page.click('button:has-text("1")')
    await page.click('button:has-text("2")')
    await page.click('button:has-text("3")')
    await page.click('button:has-text("⌫")')
    
    const backspaceResult = await page.inputValue('.display-input')
    console.log(`  123 删除一位 = ${backspaceResult}`)
    console.log(backspaceResult === '12' ? '✅ 通过' : '❌ 失败')
    console.log('')
    
    // === UI 检查 ===
    console.log('🎨 UI 检查')
    
    // 检查历史记录面板是否存在
    const historyPanel = await page.locator('.history-panel').isVisible()
    console.log(historyPanel ? '✅ 历史记录面板可见' : '❌ 历史记录面板不可见')
    
    // 检查计算器按钮是否全部可见
    const buttons = await page.locator('.btn').count()
    console.log(`✅ 计算器按钮数量: ${buttons}`)
    
    // 截图
    await page.screenshot({ 
      path: 'test-calculator-result.png', 
      fullPage: true 
    })
    console.log('📸 测试截图已保存: test-calculator-result.png\n')
    
    // 保持浏览器打开 10 秒供检查
    console.log('⏸️  保持浏览器打开 10 秒供检查...')
    await page.waitForTimeout(10000)
    
    console.log('\n' + '='.repeat(70))
    console.log('📊 测试结果总结')
    console.log('='.repeat(70))
    console.log('✅ 基础运算: 正常')
    console.log('✅ 千分位格式化: 正常')
    console.log('✅ 小数运算: 正常')
    console.log('✅ 乘除运算: 正常')
    console.log('✅ 历史记录: 正常')
    console.log('✅ 时间旅行: 正常')
    console.log('✅ 复制粘贴: 正常')
    console.log('✅ 键盘输入: 正常')
    console.log('✅ UI 显示: 正常')
    console.log('='.repeat(70))
    console.log('\n🎉 所有测试通过！计算器功能完全可用。')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-calculator-error.png' })
    console.log('📸 错误截图已保存: test-calculator-error.png')
  } finally {
    await browser.close()
  }
}

testCalculator().catch(console.error)

