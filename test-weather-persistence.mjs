/**
 * 天气查询工具 - 数据持久化测试
 * 测试 API Key 和城市列表是否能够正确保存和加载
 */
import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/weather'

// 测试数据
const TEST_API_KEY = 'test-api-key-12345'
const TEST_CITY = '北京'

async function testWeatherPersistence() {
  console.log('🚀 启动天气数据持久化测试...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  
  try {
    // ===== 第一阶段：保存数据 =====
    console.log('📊 第一阶段：保存 API Key 和城市')
    console.log('=' .repeat(70))
    
    console.log('📡 访问页面:', TEST_URL)
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    console.log('✅ 页面加载完成\n')
    
    // 检查是否有 API Key 配置对话框
    console.log('🔍 检查 API Key 配置对话框...')
    const dialog = page.locator('.el-dialog').first()
    const isDialogVisible = await dialog.isVisible().catch(() => false)
    
    if (isDialogVisible) {
      console.log('✅ API Key 配置对话框已打开\n')
      
      // 输入测试 API Key
      console.log(`📝 输入测试 API Key: ${TEST_API_KEY}`)
      const input = dialog.locator('input[placeholder*="Key"]').first()
      await input.fill(TEST_API_KEY)
      await page.waitForTimeout(500)
      console.log('✅ API Key 已输入\n')
      
      // 点击保存按钮
      console.log('💾 点击保存按钮...')
      const saveButton = dialog.locator('button:has-text("保存")').first()
      await saveButton.click()
      await page.waitForTimeout(2000)
      console.log('✅ API Key 已保存\n')
    } else {
      console.log('ℹ️  未检测到 API Key 配置对话框（可能已有配置）\n')
      
      // 手动打开配置对话框
      console.log('🔧 手动打开 API Key 配置...')
      const configButton = page.locator('button:has-text("配置")').first()
      if (await configButton.isVisible().catch(() => false)) {
        await configButton.click()
        await page.waitForTimeout(1000)
        
        // 重新输入 API Key
        const dialog = page.locator('.el-dialog').first()
        const input = dialog.locator('input[placeholder*="Key"]').first()
        await input.clear()
        await input.fill(TEST_API_KEY)
        await page.waitForTimeout(500)
        
        const saveButton = dialog.locator('button:has-text("保存")').first()
        await saveButton.click()
        await page.waitForTimeout(2000)
        console.log('✅ API Key 已更新\n')
      }
    }
    
    // 添加测试城市
    console.log(`🏙️  添加测试城市: ${TEST_CITY}`)
    const addCityButton = page.locator('button:has-text("添加城市")').first()
    if (await addCityButton.isVisible().catch(() => false)) {
      await addCityButton.click()
      await page.waitForTimeout(1500)
      
      // 从预设城市列表中选择（不需要搜索）
      console.log('🔍 查找预设城市列表...')
      const presetCity = page.locator('.preset-city-item').first()
      if (await presetCity.isVisible().catch(() => false)) {
        const cityName = await presetCity.textContent()
        console.log(`📍 找到预设城市: ${cityName?.trim()}`)
        await presetCity.click()
        await page.waitForTimeout(1500)
        console.log('✅ 城市已添加\n')
      } else {
        console.log('⚠️  未找到预设城市列表\n')
      }
    } else {
      console.log('ℹ️  未找到添加城市按钮\n')
    }
    
    // 检查城市是否显示在列表中
    console.log('🔍 检查城市列表...')
    const cityList = page.locator('.city-item')
    const cityCount = await cityList.count()
    console.log(`✅ 当前城市数量: ${cityCount}\n`)
    
    console.log('💾 数据保存阶段完成\n')
    console.log('⏸️  等待 3 秒后刷新页面...\n')
    await page.waitForTimeout(3000)
    
    // ===== 第二阶段：刷新页面验证持久化 =====
    console.log('=' .repeat(70))
    console.log('📊 第二阶段：刷新页面验证持久化')
    console.log('=' .repeat(70))
    
    console.log('🔄 刷新页面...')
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)
    console.log('✅ 页面已刷新\n')
    
    // 检查 API Key 是否保留（通过是否弹出配置对话框判断）
    console.log('🔍 检查 API Key 是否保留...')
    const dialogAfterReload = page.locator('.el-dialog').first()
    const isDialogVisibleAfterReload = await dialogAfterReload.isVisible().catch(() => false)
    
    if (isDialogVisibleAfterReload) {
      console.log('❌ 失败：API Key 配置对话框仍然显示，说明 API Key 未保存\n')
    } else {
      console.log('✅ 成功：API Key 已保留（配置对话框未显示）\n')
    }
    
    // 检查城市列表是否保留
    console.log('🔍 检查城市列表是否保留...')
    await page.waitForTimeout(2000)
    const cityListAfterReload = page.locator('.cities-list .city-item')
    const cityCountAfterReload = await cityListAfterReload.count()
    console.log(`城市数量: ${cityCountAfterReload}`)
    
    if (cityCountAfterReload > 0) {
      console.log('✅ 成功：城市列表已保留\n')
      
      // 显示城市名称
      for (let i = 0; i < Math.min(cityCountAfterReload, 5); i++) {
        const cityName = await cityListAfterReload.nth(i).textContent()
        console.log(`  ${i + 1}. ${cityName?.trim()}`)
      }
      console.log('')
    } else {
      console.log('❌ 失败：城市列表为空，数据未保留\n')
    }
    
    // ===== 测试报告 =====
    console.log('=' .repeat(70))
    console.log('📊 测试报告')
    console.log('=' .repeat(70))
    
    const apiKeyPersisted = !isDialogVisibleAfterReload
    const citiesPersisted = cityCountAfterReload > 0
    const allTestsPassed = apiKeyPersisted && citiesPersisted
    
    console.log('测试结果:')
    console.log(`  1. ${apiKeyPersisted ? '✅' : '❌'} API Key 持久化`)
    console.log(`  2. ${citiesPersisted ? '✅' : '❌'} 城市列表持久化`)
    console.log('')
    console.log(`总结: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`)
    console.log('=' .repeat(70) + '\n')
    
    // 保持浏览器打开供检查
    console.log('⏸️  保持浏览器打开 10 秒供人工检查...')
    console.log('请检查:')
    console.log('  - API Key 配置对话框是否没有弹出')
    console.log('  - 城市列表是否正确显示')
    console.log('  - 可以正常查看天气数据')
    await page.waitForTimeout(10000)
    
    if (!allTestsPassed) {
      console.error('\n⚠️  测试未完全通过，请检查控制台日志和浏览器截图')
      await page.screenshot({ path: 'test-weather-persistence-failed.png', fullPage: true })
      console.log('📸 失败截图已保存: test-weather-persistence-failed.png\n')
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-weather-persistence-error.png', fullPage: true })
    console.log('📸 错误截图已保存: test-weather-persistence-error.png\n')
  } finally {
    await browser.close()
    console.log('🏁 测试完成')
  }
}

testWeatherPersistence().catch(console.error)

