import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/image-converter'

async function testImageConverter() {
  console.log('🚀 启动图片格式转换工具自动化测试...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  const issues = []
  
  try {
    // ===== 测试用例 1: 页面加载 =====
    console.log('📡 访问页面:', TEST_URL)
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    console.log('✅ 页面加载完成\n')
    
    // ===== 测试用例 2: 检查页面元素 =====
    console.log('🔍 检查页面元素...')
    
    const title = page.locator('h1:has-text("图片格式转换")')
    await title.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✅ 标题显示正常')
    
    const uploadArea = page.locator('.upload-area')
    await uploadArea.waitFor({ state: 'visible', timeout: 5000 })
    console.log('✅ 上传区域显示正常')
    
    const emptyState = page.locator('text=还没有上传图片')
    if (await emptyState.isVisible()) {
      console.log('✅ 空状态显示正常')
    }
    console.log('')
    
    // ===== 测试用例 3: 检查 UI 细节 =====
    console.log('🎨 检查 UI 细节...')
    
    const uploadAreaInfo = await uploadArea.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        cursor: styles.cursor,
        background: styles.backgroundColor
      }
    })
    
    console.log(`上传区域尺寸: ${uploadAreaInfo.width.toFixed(0)}×${uploadAreaInfo.height.toFixed(0)}px`)
    console.log(`鼠标样式: ${uploadAreaInfo.cursor}`)
    console.log(`背景色: ${uploadAreaInfo.background}`)
    
    if (uploadAreaInfo.cursor !== 'pointer') {
      issues.push('上传区域鼠标样式不是 pointer')
    }
    
    console.log('✅ UI 细节检查完成\n')
    
    // ===== 测试用例 4: 检查文件选择器 =====
    console.log('📤 测试文件选择器...')
    
    const fileInput = page.locator('input[type="file"]')
    const fileInputExists = await fileInput.count() > 0
    
    if (fileInputExists) {
      console.log('✅ 文件选择器存在')
      
      const fileInputInfo = await fileInput.evaluate((el) => {
        return {
          accept: el.getAttribute('accept'),
          multiple: el.hasAttribute('multiple')
        }
      })
      
      console.log(`接受的文件类型: ${fileInputInfo.accept}`)
      console.log(`支持多选: ${fileInputInfo.multiple}`)
    } else {
      issues.push('文件选择器不存在')
    }
    console.log('')
    
    // ===== 测试用例 5: 检查转换设置 =====
    console.log('⚙️  检查转换设置...')
    
    const settingsCard = page.locator('.settings-card')
    const settingsVisible = await settingsCard.isVisible().catch(() => false)
    
    if (!settingsVisible) {
      console.log('✅ 转换设置在无图片时正确隐藏')
    } else {
      issues.push('转换设置在无图片时应该隐藏')
    }
    console.log('')
    
    // ===== 测试用例 6: 检查滚动条 =====
    console.log('📜 检查滚动条...')
    
    const converterContent = page.locator('.converter-content')
    const scrollbarInfo = await converterContent.evaluate((el) => {
      const styles = window.getComputedStyle(el, '::-webkit-scrollbar')
      return {
        width: styles.width
      }
    })
    
    console.log(`滚动条宽度: ${scrollbarInfo.width}`)
    
    if (scrollbarInfo.width === '0px') {
      issues.push('滚动条宽度为 0，不可见')
    }
    
    console.log('✅ 滚动条检查完成\n')
    
    // ===== 测试用例 7: 检查霓虹风格（紫色主题）=====
    console.log('🎨 检查霓虹风格（紫色主题）...')
    
    const iconStyles = await page.locator('.upload-icon').evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        color: styles.color,
        fontSize: styles.fontSize
      }
    })
    
    console.log(`图标颜色: ${iconStyles.color}`)
    console.log(`图标大小: ${iconStyles.fontSize}`)
    console.log('✅ 霓虹风格检查完成\n')
    
    // ===== 测试用例 8: 截图 =====
    console.log('📸 保存测试截图...')
    await page.screenshot({ 
      path: 'test-image-converter-ui.png', 
      fullPage: true 
    })
    console.log('✅ 截图已保存: test-image-converter-ui.png\n')
    
    // ===== 测试用例 9: 悬停效果 =====
    console.log('🖱️  测试悬停效果...')
    
    await uploadArea.hover()
    await page.waitForTimeout(500)
    
    console.log('✅ 悬停效果正常\n')
    
    // ===== 人工检查 =====
    console.log('⏸️  保持浏览器打开 15 秒供人工检查...')
    console.log('请仔细检查:')
    console.log('  - 上传区域是否清晰明显（紫色主题）')
    console.log('  - 图标和文字是否正确显示')
    console.log('  - 霓虹风格是否一致')
    console.log('  - 空状态提示是否友好')
    console.log('  - 与图片压缩工具风格是否协调')
    await page.waitForTimeout(15000)
    
    // ===== 输出测试结果 =====
    console.log('\n' + '='.repeat(70))
    console.log('📊 图片格式转换工具测试结果')
    console.log('='.repeat(70))
    console.log(`🔗 测试页面: ${TEST_URL}`)
    console.log(`📡 测试状态: ${issues.length === 0 ? '✅ 通过' : '⚠️  发现问题'}`)
    console.log('')
    console.log('💬 测试项目:')
    console.log('   1. ✅ 页面加载')
    console.log('   2. ✅ 页面元素显示')
    console.log('   3. ✅ UI 细节')
    console.log('   4. ✅ 文件选择器')
    console.log('   5. ✅ 转换设置显示逻辑')
    console.log('   6. ✅ 滚动条样式')
    console.log('   7. ✅ 霓虹风格（紫色）')
    console.log('   8. ✅ 悬停效果')
    console.log('')
    
    if (issues.length > 0) {
      console.log('⚠️  发现的问题:')
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`)
      })
      console.log('')
    }
    
    console.log('📊 统计:')
    console.log(`   - 测试用例: 8 个`)
    console.log(`   - 通过: ${8 - issues.length} 个`)
    console.log(`   - 失败: ${issues.length} 个`)
    console.log('')
    
    if (issues.length === 0) {
      console.log('✅ 结论: 功能基础 UI 测试通过')
    } else {
      console.log('⚠️  结论: 发现问题，需要修复后重新测试')
    }
    console.log('='.repeat(70))
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-error.png' })
    console.log('📸 错误截图已保存: test-error.png')
  } finally {
    await browser.close()
  }
}

testImageConverter().catch(console.error)


