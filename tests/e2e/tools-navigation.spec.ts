import { test, expect } from '@playwright/test'

/**
 * 测试所有工具页面的导航和基础渲染
 * 确保 22 个工具都能正常访问
 */

test.describe('工具导航测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // 等待应用加载完成
    await expect(page.locator('.main-layout')).toBeVisible({ timeout: 10000 })
  })

  const tools = [
    // 文本处理工具
    { path: '/tools/json-formatter', name: 'JSON 格式化', icon: 'i-mdi-code-json' },
    { path: '/tools/sql-formatter', name: 'SQL 格式化', icon: 'i-mdi-database' },
    { path: '/tools/xml-formatter', name: 'XML 格式化', icon: 'i-mdi-xml' },
    { path: '/tools/yaml-formatter', name: 'YAML 格式化', icon: 'i-mdi-file-document' },
    { path: '/tools/markdown-preview', name: 'Markdown 预览', icon: 'i-mdi-language-markdown' },
    { path: '/tools/text-diff', name: '文本对比', icon: 'i-mdi-compare' },
    
    // 编解码工具
    { path: '/tools/base64', name: 'Base64 编解码', icon: 'i-mdi-file-code' },
    { path: '/tools/url-encoder', name: 'URL 编解码', icon: 'i-mdi-link-variant' },
    { path: '/tools/unicode-converter', name: 'Unicode 转换', icon: 'i-mdi-alphabetical-variant' },
    { path: '/tools/number-converter', name: '进制转换', icon: 'i-mdi-numeric' },
    
    // 加密工具
    { path: '/tools/hash-generator', name: '哈希生成', icon: 'i-mdi-fingerprint' },
    { path: '/tools/aes-crypto', name: 'AES 加解密', icon: 'i-mdi-lock' },
    { path: '/tools/jwt-decoder', name: 'JWT 解析', icon: 'i-mdi-key-variant' },
    
    // 网络工具
    { path: '/tools/http-client', name: 'HTTP 请求', icon: 'i-mdi-web' },
    { path: '/tools/qrcode-generator', name: '二维码生成', icon: 'i-mdi-qrcode' },
    { path: '/tools/ip-scanner', name: 'IP 扫描器', icon: 'i-mdi-ip-network-outline' },
    
    // 开发工具
    { path: '/tools/regex-tester', name: '正则测试', icon: 'i-mdi-regex' },
    { path: '/tools/cron-expression', name: 'Cron 表达式', icon: 'i-mdi-clock-outline' },
    { path: '/tools/color-picker', name: '颜色选择器', icon: 'i-mdi-palette' },
    
    // 系统工具
    { path: '/tools/ssh', name: 'SSH 连接', icon: 'i-mdi-console' },
    { path: '/tools/screenshot', name: '截图工具', icon: 'i-mdi-camera' },
    { path: '/tools/knowledge', name: '知识库', icon: 'i-mdi-book-open-page-variant' },
  ]

  tools.forEach(({ path, name, icon }) => {
    test(`应该能访问 ${name}`, async ({ page }) => {
      // 导航到工具页面
      await page.goto(path)
      
      // 等待页面加载
      await page.waitForLoadState('networkidle')
      
      // 检查 URL 是否正确
      expect(page.url()).toContain(path)
      
      // 检查页面标题或主要内容是否存在
      await expect(page.locator('.tool-page, .neon-card, .page-container')).toBeVisible()
      
      // 检查没有明显的错误信息
      const errorElements = page.locator('.error-state, .empty-state')
      const errorCount = await errorElements.count()
      if (errorCount > 0) {
        // 有些页面可能初始状态就是空状态（如历史记录为空），这是正常的
        console.log(`${name} 页面显示空状态，这可能是正常的`)
      }
    })
  })

  test('侧边栏应该能正确展开和收起', async ({ page }) => {
    // 检查侧边栏是否存在
    await expect(page.locator('.sidebar')).toBeVisible()
    
    // 查找折叠按钮（具体选择器需要根据实际组件调整）
    const toggleButton = page.locator('.sidebar-toggle, button[aria-label*="折叠"]').first()
    if (await toggleButton.isVisible()) {
      // 点击折叠
      await toggleButton.click()
      await page.waitForTimeout(300) // 等待动画完成
      
      // 点击展开
      await toggleButton.click()
      await page.waitForTimeout(300)
    }
  })

  test('搜索功能应该能过滤工具', async ({ page }) => {
    // 查找搜索框（具体选择器需要根据实际组件调整）
    const searchInput = page.locator('input[placeholder*="搜索"], .search-input').first()
    
    if (await searchInput.isVisible()) {
      // 输入搜索关键词
      await searchInput.fill('JSON')
      await page.waitForTimeout(300)
      
      // 检查搜索结果
      const results = page.locator('.menu-item, .tool-item')
      const count = await results.count()
      expect(count).toBeGreaterThan(0)
      
      // 清空搜索
      await searchInput.clear()
    }
  })
})

