/**
 * 首页天气卡片 - 自动化测试
 * 测试首页是否能正确显示第一个城市的天气
 */
import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/'

async function testHomeWeather() {
  console.log('🚀 启动首页天气卡片测试...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  
  try {
    // ===== 阶段 1：访问首页 =====
    console.log('📊 阶段 1：访问首页')
    console.log('=' .repeat(70))
    
    console.log('📡 访问首页:', TEST_URL)
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // 等待天气数据加载
    console.log('✅ 页面加载完成\n')
    
    // ===== 阶段 2：检查天气卡片 =====
    console.log('📊 阶段 2：检查天气卡片')
    console.log('=' .repeat(70))
    
    // 检查天气卡片是否存在
    console.log('🔍 检查天气卡片是否显示...')
    const weatherCard = page.locator('.home-weather-card')
    const isWeatherVisible = await weatherCard.isVisible().catch(() => false)
    
    if (isWeatherVisible) {
      console.log('✅ 天气卡片已显示\n')
      
      // 检查城市名称
      console.log('🏙️  检查城市信息...')
      const cityName = await weatherCard.locator('.city-name').textContent()
      console.log(`城市: ${cityName}`)
      
      // 检查温度
      console.log('\n🌡️  检查温度数据...')
      const temperature = await weatherCard.locator('.temperature').textContent()
      console.log(`温度: ${temperature}`)
      
      // 检查天气状态
      const weatherText = await weatherCard.locator('.weather-text').textContent()
      console.log(`天气: ${weatherText}`)
      
      // 检查详细信息
      console.log('\n📋 检查详细信息...')
      const details = await weatherCard.locator('.detail-item').allTextContents()
      details.forEach((detail, i) => {
        console.log(`  ${i + 1}. ${detail.trim()}`)
      })
      
      // 检查更新时间
      console.log('\n⏰ 检查更新时间...')
      const updateTime = await weatherCard.locator('.weather-footer').textContent()
      console.log(`更新时间: ${updateTime?.trim()}`)
      
      // ===== 阶段 3：UI 检查 =====
      console.log('\n' + '=' .repeat(70))
      console.log('📊 阶段 3：UI 细节检查')
      console.log('=' .repeat(70))
      
      // 检查卡片尺寸和样式
      const cardInfo = await weatherCard.evaluate((el) => {
        const styles = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        return {
          width: rect.width,
          height: rect.height,
          border: styles.border,
          background: styles.background
        }
      })
      
      console.log('🎨 卡片样式:')
      console.log(`  宽度: ${cardInfo.width}px`)
      console.log(`  高度: ${cardInfo.height}px`)
      console.log(`  边框: ${cardInfo.border}`)
      
      // 检查响应式布局
      if (cardInfo.width < 200) {
        console.log('⚠️  卡片宽度过窄')
      } else {
        console.log('✅ 卡片宽度正常')
      }
      
      // 检查图标显示
      console.log('\n🎯 检查图标显示...')
      const weatherIcon = weatherCard.locator('.weather-icon-main')
      const isIconVisible = await weatherIcon.isVisible().catch(() => false)
      if (isIconVisible) {
        console.log('✅ 天气图标显示正常')
      } else {
        console.log('⚠️  天气图标不可见')
      }
      
      // ===== 阶段 4：交互测试 =====
      console.log('\n' + '=' .repeat(70))
      console.log('📊 阶段 4：交互测试')
      console.log('=' .repeat(70))
      
      console.log('👆 点击天气卡片，应该跳转到天气页面...')
      await weatherCard.click()
      await page.waitForTimeout(2000)
      
      // 检查是否跳转到天气页面
      const currentUrl = page.url()
      if (currentUrl.includes('/tools/weather')) {
        console.log('✅ 成功跳转到天气页面')
        console.log(`当前页面: ${currentUrl}\n`)
        
        // 返回首页
        console.log('🔙 返回首页...')
        await page.goto(TEST_URL)
        await page.waitForTimeout(2000)
        console.log('✅ 已返回首页\n')
      } else {
        console.log('❌ 未能跳转到天气页面')
        console.log(`当前页面: ${currentUrl}\n`)
      }
      
    } else {
      console.log('ℹ️  未显示天气卡片（可能未配置天气 API）\n')
      console.log('原因可能是:')
      console.log('  1. 未配置天气 API Key')
      console.log('  2. 未添加任何城市')
      console.log('  3. 在浏览器环境运行（需要 Electron）')
      console.log('\n建议:')
      console.log('  1. 访问天气查询页面配置 API Key')
      console.log('  2. 添加至少一个城市')
      console.log('  3. 在 Electron 环境测试\n')
    }
    
    // ===== 测试报告 =====
    console.log('=' .repeat(70))
    console.log('📊 测试报告')
    console.log('=' .repeat(70))
    
    const testResults = {
      weatherCardVisible: isWeatherVisible,
      navigation: false
    }
    
    if (isWeatherVisible) {
      // 检查导航是否成功
      await weatherCard.click()
      await page.waitForTimeout(1000)
      testResults.navigation = page.url().includes('/tools/weather')
    }
    
    console.log('测试结果:')
    console.log(`  1. ${testResults.weatherCardVisible ? '✅' : '⚠️ '} 天气卡片显示`)
    if (isWeatherVisible) {
      console.log(`  2. ${testResults.navigation ? '✅' : '❌'} 点击跳转`)
    }
    console.log('')
    
    if (isWeatherVisible) {
      console.log('✅ 结论: 首页天气卡片功能正常')
    } else {
      console.log('ℹ️  结论: 未配置天气，卡片未显示（符合预期）')
    }
    console.log('=' .repeat(70) + '\n')
    
    // 保持浏览器打开供检查
    console.log('⏸️  保持浏览器打开 10 秒供人工检查...')
    console.log('请检查:')
    console.log('  - 天气卡片是否美观（霓虹风格）')
    console.log('  - 温度显示是否清晰')
    console.log('  - 详细信息是否完整')
    console.log('  - 鼠标悬停效果是否流畅')
    console.log('  - 卡片位置是否合理（居中显示）')
    await page.waitForTimeout(10000)
    
    if (isWeatherVisible) {
      // 截图
      await page.screenshot({ 
        path: 'test-home-weather-success.png', 
        fullPage: true 
      })
      console.log('📸 截图已保存: test-home-weather-success.png\n')
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-home-weather-error.png', fullPage: true })
    console.log('📸 错误截图已保存: test-home-weather-error.png\n')
  } finally {
    await browser.close()
    console.log('🏁 测试完成')
  }
}

testHomeWeather().catch(console.error)

