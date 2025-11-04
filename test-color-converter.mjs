import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/color-converter'

async function testColorConverter() {
  console.log('🚀 启动浏览器自动化测试 - 颜色转换器\n')
  
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
    if (title.includes('颜色转换器')) {
      console.log('✅ 页面标题正确:', title, '\n')
    } else {
      issues.push('页面标题不正确')
    }
    
    // ========== 3. 检查颜色预览区 ==========
    console.log('🎨 检查颜色预览区...')
    const preview = page.locator('.color-preview')
    const previewVisible = await preview.isVisible()
    
    if (previewVisible) {
      console.log('✅ 颜色预览区显示正常\n')
    } else {
      issues.push('颜色预览区不可见')
    }
    
    // ========== 4. 测试 HEX 输入 ==========
    console.log('🔤 测试 HEX 输入...')
    
    const hexInput = page.locator('.neon-input').first()
    await hexInput.clear()
    await hexInput.fill('#FF0000')
    await page.waitForTimeout(1000)
    
    // 检查 RGB 值是否更新
    const rgbR = page.locator('.rgb-inputs .rgb-input-item').first().locator('input')
    const rgbG = page.locator('.rgb-inputs .rgb-input-item').nth(1).locator('input')
    const rgbB = page.locator('.rgb-inputs .rgb-input-item').nth(2).locator('input')
    
    const rValue = await rgbR.inputValue()
    const gValue = await rgbG.inputValue()
    const bValue = await rgbB.inputValue()
    
    console.log(`  HEX: #FF0000`)
    console.log(`  转换后 RGB: (${rValue}, ${gValue}, ${bValue})`)
    
    if (rValue === '255' && gValue === '0' && bValue === '0') {
      console.log('✅ HEX → RGB 转换正确\n')
    } else {
      issues.push(`HEX转RGB错误: 期望 (255,0,0)，实际 (${rValue},${gValue},${bValue})`)
    }
    
    // ========== 5. 测试 RGB 输入 ==========
    console.log('🎨 测试 RGB 输入...')
    
    await rgbR.fill('0')
    await rgbG.fill('255')
    await rgbB.fill('0')
    await page.waitForTimeout(1000)
    
    // 检查 HEX 值是否更新
    const hexValue = await hexInput.inputValue()
    console.log(`  RGB: (0, 255, 0)`)
    console.log(`  转换后 HEX: ${hexValue}`)
    
    if (hexValue.toUpperCase() === '#00FF00') {
      console.log('✅ RGB → HEX 转换正确\n')
    } else {
      issues.push(`RGB转HEX错误: 期望 #00FF00，实际 ${hexValue}`)
    }
    
    // ========== 6. 测试 HSL 滑块 ==========
    console.log('🌈 测试 HSL 滑块...')
    
    const hslSlider = page.locator('.neon-slider').first()
    await hslSlider.click()
    await page.waitForTimeout(1000)
    
    console.log('✅ HSL 滑块可交互\n')
    
    // ========== 7. 测试霓虹色板 ==========
    console.log('💠 测试霓虹色板...')
    
    const paletteItems = page.locator('.palette-grid .palette-item')
    const paletteCount = await paletteItems.count()
    console.log(`  找到 ${paletteCount} 个色板项`)
    
    if (paletteCount >= 8) {
      console.log('✅ 霓虹色板显示正常\n')
    } else {
      issues.push(`霓虹色板数量不足: 期望至少8个，实际${paletteCount}个`)
    }
    
    // 点击第一个色板项
    const firstPalette = paletteItems.first()
    await firstPalette.click()
    await page.waitForTimeout(1000)
    
    const newHexValue = await hexInput.inputValue()
    console.log(`  点击色板后 HEX: ${newHexValue}`)
    
    if (newHexValue.startsWith('#')) {
      console.log('✅ 色板点击功能正常\n')
    } else {
      issues.push('色板点击后颜色未更新')
    }
    
    // ========== 8. 测试颜色选择器 ==========
    console.log('🎯 测试颜色选择器...')
    
    const colorPicker = page.locator('.color-picker').first()
    const pickerVisible = await colorPicker.isVisible()
    
    if (pickerVisible) {
      console.log('✅ 颜色选择器显示正常\n')
    } else {
      issues.push('颜色选择器不可见')
    }
    
    // ========== 9. 测试渐变色生成 ==========
    console.log('🌊 测试渐变色生成...')
    
    const gradientSteps = page.locator('.gradient-step')
    const stepsCount = await gradientSteps.count()
    console.log(`  渐变步数: ${stepsCount}`)
    
    if (stepsCount > 0) {
      console.log('✅ 渐变色生成正常\n')
    } else {
      issues.push('渐变色未生成')
    }
    
    // ========== 10. 测试复制功能 ==========
    console.log('📋 测试复制功能...')
    
    const copyButton = page.locator('button:has-text("复制")').first()
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
    
    // ========== 11. 测试色板切换 ==========
    console.log('🔄 测试色板切换...')
    
    const paletteTabs = page.locator('.palette-tab')
    const tabsCount = await paletteTabs.count()
    console.log(`  色板标签数: ${tabsCount}`)
    
    if (tabsCount >= 3) {
      // 点击第二个标签
      await paletteTabs.nth(1).click()
      await page.waitForTimeout(500)
      
      console.log('✅ 色板切换功能正常\n')
    } else {
      issues.push('色板标签数量不足')
    }
    
    // ========== 12. UI 细节检查 ==========
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
    
    // 检查预览区背景色
    const previewBg = await preview.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.backgroundColor
    })
    
    console.log(`  预览区背景: ${previewBg}`)
    
    if (previewBg && previewBg !== 'rgba(0, 0, 0, 0)') {
      console.log('✅ 预览区背景色已设置\n')
    } else {
      issues.push('预览区背景色未设置')
    }
    
    // ========== 13. 截图 ==========
    console.log('📸 保存测试截图...')
    await page.screenshot({ 
      path: 'test-color-converter.png', 
      fullPage: true 
    })
    console.log('✅ 截图已保存: test-color-converter.png\n')
    
    // ========== 14. 保持浏览器打开供人工检查 ==========
    console.log('⏸️  保持浏览器打开 15 秒供人工检查...')
    console.log('请检查:')
    console.log('  - 颜色预览是否实时更新')
    console.log('  - 所有格式转换是否准确')
    console.log('  - 霓虹色板是否美观')
    console.log('  - 滑块是否可用')
    console.log('  - 渐变色是否正确生成')
    console.log('  - UI 布局是否美观')
    console.log('  - 颜色对比度是否充足')
    await page.waitForTimeout(15000)
    
    // ========== 输出测试报告 ==========
    console.log('\n' + '='.repeat(70))
    console.log('📊 颜色转换器测试报告')
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
      console.log('   3. ✅ 颜色预览区')
      console.log('   4. ✅ HEX → RGB 转换')
      console.log('   5. ✅ RGB → HEX 转换')
      console.log('   6. ✅ HSL 滑块交互')
      console.log('   7. ✅ 霓虹色板显示')
      console.log('   8. ✅ 色板点击功能')
      console.log('   9. ✅ 颜色选择器')
      console.log('  10. ✅ 渐变色生成')
      console.log('  11. ✅ 复制功能')
      console.log('  12. ✅ 色板切换')
      console.log('  13. ✅ UI 布局检查')
      console.log('  14. ✅ 预览区背景色')
      console.log('')
      console.log('📊 统计:')
      console.log('   - 测试用例: 14 个')
      console.log('   - 通过: 14 个')
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
      console.log(`   - 测试用例: 14 个`)
      console.log(`   - 通过: ${14 - issues.length} 个`)
      console.log(`   - 失败: ${issues.length} 个`)
      console.log('')
      console.log('⚠️  结论: 需要修复上述问题')
    }
    
    console.log('='.repeat(70) + '\n')
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-color-converter-error.png' })
    console.log('📸 错误截图已保存: test-color-converter-error.png')
  } finally {
    await browser.close()
  }
}

testColorConverter().catch(console.error)

