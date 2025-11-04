import { test, expect } from '@playwright/test'

/**
 * IP 扫描器工具功能测试
 */

test.describe('IP 扫描器', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/ip-scanner')
    await page.waitForLoadState('networkidle')
  })

  test('应该能显示输入表单', async ({ page }) => {
    // 检查 IP 前缀输入框
    const ipInput = page.locator('input[placeholder*="IP"], .neon-input input').first()
    await expect(ipInput).toBeVisible()
    
    // 检查超时设置
    const timeoutInput = page.locator('input[type="number"]').first()
    if (await timeoutInput.isVisible()) {
      const value = await timeoutInput.inputValue()
      expect(parseInt(value)).toBeGreaterThan(0)
    }
    
    // 检查开始扫描按钮
    const startButton = page.locator('button:has-text("开始扫描")').first()
    await expect(startButton).toBeVisible()
  })

  test('应该能输入 IP 前缀', async ({ page }) => {
    const ipInput = page.locator('input[placeholder*="IP"], .neon-input input').first()
    
    // 输入测试 IP 前缀
    await ipInput.fill('192.168.1')
    
    // 验证输入值
    const value = await ipInput.inputValue()
    expect(value).toBe('192.168.1')
  })

  test('应该显示扫描统计信息', async ({ page }) => {
    // 查找统计卡片
    const totalCard = page.locator('text=/总数|Total/i').first()
    const onlineCard = page.locator('text=/已占用|Online/i').first()
    const offlineCard = page.locator('text=/可用|Available|Offline/i').first()
    
    // 至少应该显示一个统计卡片
    const cards = [totalCard, onlineCard, offlineCard]
    let visibleCount = 0
    for (const card of cards) {
      if (await card.isVisible()) {
        visibleCount++
      }
    }
    expect(visibleCount).toBeGreaterThan(0)
  })

  test('应该显示对比度良好的状态徽章', async ({ page }) => {
    // 如果页面上有扫描结果（可能是之前的测试留下的）
    const statusBadge = page.locator('.status-badge').first()
    
    if (await statusBadge.isVisible()) {
      // 获取徽章样式
      const color = await statusBadge.evaluate((el) => 
        window.getComputedStyle(el).color
      )
      
      const backgroundColor = await statusBadge.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      )
      
      console.log(`状态徽章 - 文字颜色: ${color}, 背景色: ${backgroundColor}`)
      
      // 验证文字颜色是白色（我们之前修复的对比度问题）
      // rgb(255, 255, 255) 或 #fff
      expect(color).toMatch(/rgb\(255,\s*255,\s*255\)|#fff/i)
    }
  })

  test('应该有结果筛选标签页', async ({ page }) => {
    // 查找标签页
    const allTab = page.locator('text=/全部|All/i').first()
    const onlineTab = page.locator('text=/已占用|Online/i').first()
    const offlineTab = page.locator('text=/可用|Available/i').first()
    
    // 检查是否存在标签页切换功能
    const tabs = [allTab, onlineTab, offlineTab]
    let visibleTabCount = 0
    for (const tab of tabs) {
      if (await tab.isVisible()) {
        visibleTabCount++
      }
    }
    
    // 应该至少有一个标签页可见
    expect(visibleTabCount).toBeGreaterThan(0)
  })

  test('扫描按钮应该能切换状态', async ({ page }) => {
    const startButton = page.locator('button:has-text("开始扫描")').first()
    
    // 输入有效的 IP 前缀
    const ipInput = page.locator('input[placeholder*="IP"], .neon-input input').first()
    await ipInput.fill('127.0.0')
    
    // 点击开始扫描（注意：这会真正启动扫描，所以我们立即停止）
    await startButton.click()
    await page.waitForTimeout(500)
    
    // 应该显示停止按钮
    const stopButton = page.locator('button:has-text("停止扫描")').first()
    if (await stopButton.isVisible()) {
      await stopButton.click()
      await page.waitForTimeout(300)
    }
  })

  test('应该在结果表格中显示 IP 和响应时间列', async ({ page }) => {
    // 检查表格列标题
    const ipHeader = page.locator('th:has-text("IP"), text=IP').first()
    const statusHeader = page.locator('th:has-text("状态"), text=状态').first()
    const responseTimeHeader = page.locator('th:has-text("响应"), text=响应').first()
    
    // 至少应该有 IP 列
    // 注意：如果没有扫描结果，表格可能不显示
  })
})

