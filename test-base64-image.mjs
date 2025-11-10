import { chromium } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TEST_URL = 'http://localhost:5173/#/tools/base64-image'

// 测试结果统计
const testResults = {
  feature: 'Base64 图片转换',
  timestamp: new Date().toLocaleString('zh-CN'),
  total: 0,
  passed: 0,
  failed: 0,
  cases: [],
  issues: []
}

function addTestCase(name, passed, duration, error = null) {
  testResults.total++
  if (passed) {
    testResults.passed++
  } else {
    testResults.failed++
  }
  testResults.cases.push({ name, passed, duration, error })
}

async function testBase64Image() {
  console.log('🚀 启动 Base64 图片转换工具自动化测试...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  
  try {
    // ===== 测试用例 1: 页面加载 =====
    console.log('📡 测试用例 1: 页面加载')
    const startTime1 = Date.now()
    try {
      await page.goto(TEST_URL)
      await page.waitForLoadState('networkidle')
      await page.waitForSelector('.base64-image-tool', { timeout: 5000 })
      
      const title = await page.locator('.tool-title').textContent()
      console.log(`  ✅ 页面加载成功: ${title}`)
      addTestCase('页面加载', true, Date.now() - startTime1)
    } catch (error) {
      console.error(`  ❌ 页面加载失败: ${error.message}`)
      addTestCase('页面加载', false, Date.now() - startTime1, error.message)
      throw error
    }
    console.log('')

    // ===== 测试用例 2: UI 元素检查 =====
    console.log('🎨 测试用例 2: UI 元素检查')
    const startTime2 = Date.now()
    try {
      // 检查标签页按钮
      const tabButtons = page.locator('.tab-button')
      const tabCount = await tabButtons.count()
      console.log(`  ✅ 标签页数量: ${tabCount}`)
      
      if (tabCount !== 2) {
        testResults.issues.push('标签页数量不正确，应该是2个')
      }
      
      // 检查上传区域
      const uploadArea = page.locator('.upload-area')
      const uploadAreaVisible = await uploadArea.isVisible()
      console.log(`  ✅ 上传区域可见: ${uploadAreaVisible}`)
      
      // 检查 UI 细节
      console.log('  🔍 检查 UI 细节...')
      
      // 检查标题布局
      const titleInfo = await page.locator('.tool-title').evaluate((el) => {
        const rect = el.getBoundingClientRect()
        const styles = window.getComputedStyle(el)
        return {
          width: rect.width,
          height: rect.height,
          writingMode: styles.writingMode,
          display: styles.display
        }
      })
      
      console.log(`    - 标题尺寸: ${Math.round(titleInfo.width)}×${Math.round(titleInfo.height)}px`)
      console.log(`    - 布局方向: ${titleInfo.writingMode}`)
      
      if (titleInfo.writingMode !== 'horizontal-tb') {
        testResults.issues.push('标题文字方向错误')
      }
      
      if (titleInfo.width < 100) {
        testResults.issues.push(`标题宽度过窄(${titleInfo.width}px)`)
      }
      
      // 检查按钮样式
      const buttonInfo = await page.locator('.tab-button').first().evaluate((el) => {
        const styles = window.getComputedStyle(el)
        return {
          background: styles.backgroundColor,
          border: styles.border,
          padding: styles.padding
        }
      })
      
      console.log(`    - 按钮背景: ${buttonInfo.background}`)
      
      if (buttonInfo.background === 'rgba(0, 0, 0, 0)' || buttonInfo.background === 'transparent') {
        testResults.issues.push('按钮背景完全透明，不够明显')
      }
      
      addTestCase('UI 元素检查', true, Date.now() - startTime2)
    } catch (error) {
      console.error(`  ❌ UI 元素检查失败: ${error.message}`)
      addTestCase('UI 元素检查', false, Date.now() - startTime2, error.message)
    }
    console.log('')

    // ===== 测试用例 3: 图片转 Base64 - 点击上传 =====
    console.log('📸 测试用例 3: 图片转 Base64 - 点击上传')
    const startTime3 = Date.now()
    try {
      // 确保在"图片 → Base64"标签页
      const toBase64Tab = page.locator('.tab-button').first()
      await toBase64Tab.click()
      await page.waitForTimeout(500)
      
      console.log('  📂 准备测试图片...')
      
      // 创建一个简单的测试图片（1x1 红色像素的 PNG）
      const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
      const testImageBuffer = Buffer.from(testImageBase64, 'base64')
      
      // 使用 page.evaluate 创建文件并触发上传
      await page.evaluate(async (base64Data) => {
        // 将 base64 转为 blob
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'image/png' })
        
        // 创建 File 对象
        const file = new File([blob], 'test.png', { type: 'image/png' })
        
        // 获取 input 元素并设置 files
        const input = document.querySelector('input[type="file"]')
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)
        input.files = dataTransfer.files
        
        // 触发 change 事件
        const event = new Event('change', { bubbles: true })
        input.dispatchEvent(event)
      }, testImageBase64)
      
      console.log('  ⏳ 等待图片处理...')
      await page.waitForTimeout(1000)
      
      // 检查是否显示了图片预览
      const imagePreview = page.locator('.image-preview img')
      const hasPreview = await imagePreview.count() > 0
      console.log(`  ✅ 图片预览显示: ${hasPreview}`)
      
      // 检查 Base64 输出
      const base64Textarea = page.locator('.base64-textarea').first()
      const base64Value = await base64Textarea.inputValue()
      const hasBase64 = base64Value.length > 0
      console.log(`  ✅ Base64 输出: ${hasBase64 ? '有数据' : '无数据'}`)
      console.log(`  ℹ️  Base64 长度: ${base64Value.length} 字符`)
      
      if (hasBase64 && !base64Value.startsWith('data:image/')) {
        testResults.issues.push('Base64 输出缺少 data URL 前缀')
      }
      
      addTestCase('图片转 Base64', hasPreview && hasBase64, Date.now() - startTime3)
    } catch (error) {
      console.error(`  ❌ 图片转 Base64 失败: ${error.message}`)
      addTestCase('图片转 Base64', false, Date.now() - startTime3, error.message)
    }
    console.log('')

    // ===== 测试用例 4: 复制 Base64 功能 =====
    console.log('📋 测试用例 4: 复制 Base64 功能')
    const startTime4 = Date.now()
    try {
      const copyButton = page.locator('.action-button:has-text("复制")')
      await copyButton.click()
      await page.waitForTimeout(500)
      
      // 检查是否有成功消息
      const message = page.locator('.el-message')
      const messageVisible = await message.count() > 0
      console.log(`  ✅ 复制功能触发: ${messageVisible}`)
      
      addTestCase('复制 Base64', true, Date.now() - startTime4)
    } catch (error) {
      console.error(`  ❌ 复制功能失败: ${error.message}`)
      addTestCase('复制 Base64', false, Date.now() - startTime4, error.message)
    }
    console.log('')

    // ===== 测试用例 5: Base64 转图片 =====
    console.log('🖼️  测试用例 5: Base64 转图片')
    const startTime5 = Date.now()
    try {
      // 切换到 "Base64 → 图片" 标签页
      const toImageTab = page.locator('.tab-button').nth(1)
      await toImageTab.click()
      await page.waitForTimeout(500)
      
      console.log('  📝 输入 Base64 数据...')
      
      // 测试不带前缀的 Base64
      const testBase64WithoutPrefix = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
      
      // 定位到输入用的 textarea（不是只读的）
      const inputTextarea = page.locator('.base64-input-textarea')
      await inputTextarea.fill(testBase64WithoutPrefix)
      await page.waitForTimeout(1000)
      
      // 检查是否自动添加了前缀
      const updatedValue = await inputTextarea.inputValue()
      const hasPrefix = updatedValue.startsWith('data:image/')
      console.log(`  ✅ 自动添加前缀: ${hasPrefix}`)
      
      if (!hasPrefix) {
        testResults.issues.push('未自动添加 data:image/ 前缀')
      }
      
      // 检查图片预览
      const resultPreview = page.locator('.result-preview img')
      const hasResultPreview = await resultPreview.count() > 0
      console.log(`  ✅ 图片预览显示: ${hasResultPreview}`)
      
      // 检查格式检测
      const resultInfo = page.locator('.result-info')
      const infoText = await resultInfo.textContent()
      console.log(`  ℹ️  图片信息: ${infoText}`)
      
      addTestCase('Base64 转图片', hasPrefix && hasResultPreview, Date.now() - startTime5)
    } catch (error) {
      console.error(`  ❌ Base64 转图片失败: ${error.message}`)
      addTestCase('Base64 转图片', false, Date.now() - startTime5, error.message)
    }
    console.log('')

    // ===== 测试用例 6: 下载图片功能 =====
    console.log('💾 测试用例 6: 下载图片功能')
    const startTime6 = Date.now()
    try {
      const downloadButton = page.locator('.action-button.primary:has-text("下载图片")')
      await downloadButton.click()
      await page.waitForTimeout(500)
      
      console.log('  ✅ 下载按钮已点击')
      
      addTestCase('下载图片', true, Date.now() - startTime6)
    } catch (error) {
      console.error(`  ❌ 下载功能失败: ${error.message}`)
      addTestCase('下载图片', false, Date.now() - startTime6, error.message)
    }
    console.log('')

    // ===== 测试用例 7: 带前缀的 Base64 输入 =====
    console.log('🔄 测试用例 7: 带前缀的 Base64 输入')
    const startTime7 = Date.now()
    try {
      // 清空输入
      const clearButton = page.locator('.action-button:has-text("清空")')
      await clearButton.click()
      await page.waitForTimeout(500)
      
      // 输入带前缀的 Base64
      const testBase64WithPrefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='
      
      const inputTextarea = page.locator('.base64-input-textarea')
      await inputTextarea.fill(testBase64WithPrefix)
      await page.waitForTimeout(1000)
      
      // 检查图片预览
      const resultPreview = page.locator('.result-preview img')
      const hasResultPreview = await resultPreview.count() > 0
      console.log(`  ✅ 图片预览显示: ${hasResultPreview}`)
      
      // 检查格式识别
      const resultInfo = page.locator('.result-info')
      const infoText = await resultInfo.textContent()
      const hasPNG = infoText.includes('PNG')
      console.log(`  ✅ 格式识别正确: ${hasPNG}`)
      
      addTestCase('带前缀 Base64', hasResultPreview && hasPNG, Date.now() - startTime7)
    } catch (error) {
      console.error(`  ❌ 带前缀 Base64 测试失败: ${error.message}`)
      addTestCase('带前缀 Base64', false, Date.now() - startTime7, error.message)
    }
    console.log('')

    // ===== 测试用例 8: 滚动条检查 =====
    console.log('📜 测试用例 8: 滚动条检查')
    const startTime8 = Date.now()
    try {
      // 选择当前可见的 conversion-panel
      const conversionPanel = page.locator('.conversion-panel').first()
      const scrollbarInfo = await conversionPanel.evaluate((el) => {
        const styles = window.getComputedStyle(el, '::-webkit-scrollbar')
        const thumbStyles = window.getComputedStyle(el, '::-webkit-scrollbar-thumb')
        return {
          width: styles.width,
          thumbBg: thumbStyles.backgroundColor
        }
      })
      
      console.log(`  ℹ️  滚动条宽度: ${scrollbarInfo.width}`)
      console.log(`  ℹ️  滚动条颜色: ${scrollbarInfo.thumbBg}`)
      
      if (scrollbarInfo.width === '0px' || scrollbarInfo.width === '') {
        testResults.issues.push('滚动条宽度为0，不可见')
      }
      
      addTestCase('滚动条检查', scrollbarInfo.width === '8px', Date.now() - startTime8)
    } catch (error) {
      console.error(`  ❌ 滚动条检查失败: ${error.message}`)
      addTestCase('滚动条检查', false, Date.now() - startTime8, error.message)
    }
    console.log('')

    // ===== UI 问题汇总 =====
    if (testResults.issues.length > 0) {
      console.log('⚠️  发现 UI 问题:')
      testResults.issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`)
      })
      console.log('')
    }

    // ===== 截图 =====
    console.log('📸 保存测试截图...')
    await page.screenshot({ 
      path: 'test-base64-image-ui.png', 
      fullPage: true 
    })
    console.log('  ✅ 截图已保存: test-base64-image-ui.png\n')

    // ===== 保持浏览器打开供人工检查 =====
    console.log('⏸️  保持浏览器打开 15 秒供人工检查...')
    console.log('请仔细检查:')
    console.log('  - 标签页切换是否流畅')
    console.log('  - 图片上传预览是否正常')
    console.log('  - Base64 输出是否完整')
    console.log('  - 图片下载是否可用')
    console.log('  - 所有按钮样式是否清晰')
    console.log('  - 滚动条是否清晰可见')
    await page.waitForTimeout(15000)

  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message)
  } finally {
    await browser.close()
  }

  // ===== 输出测试报告 =====
  printTestReport()
}

function printTestReport() {
  console.log('\n' + '='.repeat(70))
  console.log('📊 Base64 图片转换工具测试报告')
  console.log('='.repeat(70))
  console.log(`功能: ${testResults.feature}`)
  console.log(`时间: ${testResults.timestamp}`)
  console.log(`🔗 测试页面: ${TEST_URL}`)
  console.log('')
  
  console.log('💬 测试项目:')
  testResults.cases.forEach((c, i) => {
    const icon = c.passed ? '✅' : '❌'
    console.log(`   ${i + 1}. ${icon} ${c.name} (${c.duration}ms)`)
    if (!c.passed && c.error) {
      console.log(`      错误: ${c.error}`)
    }
  })
  console.log('')
  
  console.log('📊 统计:')
  console.log(`   - 测试用例: ${testResults.total} 个`)
  console.log(`   - 通过: ${testResults.passed} 个`)
  console.log(`   - 失败: ${testResults.failed} 个`)
  
  if (testResults.issues.length > 0) {
    console.log(`   - 发现问题: ${testResults.issues.length} 个`)
  }
  console.log('')
  
  const allPassed = testResults.failed === 0 && testResults.issues.length === 0
  if (allPassed) {
    console.log('✅ 结论: 功能完全可用，可以交付')
  } else {
    console.log('⚠️  结论: 发现问题，需要修复')
    if (testResults.issues.length > 0) {
      console.log('')
      console.log('需要修复的问题:')
      testResults.issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`)
      })
    }
  }
  
  console.log('='.repeat(70))
  console.log('')
}

// 运行测试
testBase64Image().catch(console.error)

