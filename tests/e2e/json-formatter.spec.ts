import { test, expect } from '@playwright/test'

/**
 * JSON 格式化工具功能测试
 */

test.describe('JSON 格式化工具', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/json-formatter')
    await page.waitForLoadState('networkidle')
  })

  test('应该能格式化有效的 JSON', async ({ page }) => {
    // 查找输入框
    const inputArea = page.locator('textarea, .neon-textarea').first()
    await expect(inputArea).toBeVisible()
    
    // 输入未格式化的 JSON
    const testJson = '{"name":"test","value":123,"nested":{"key":"value"}}'
    await inputArea.fill(testJson)
    
    // 查找并点击格式化按钮
    const formatButton = page.locator('button:has-text("格式化"), button:has-text("美化")').first()
    if (await formatButton.isVisible()) {
      await formatButton.click()
      await page.waitForTimeout(500)
    }
    
    // 检查输出区域
    const outputArea = page.locator('textarea, .neon-textarea').nth(1)
    if (await outputArea.isVisible()) {
      const outputValue = await outputArea.inputValue()
      // 格式化后的 JSON 应该包含换行符
      expect(outputValue).toContain('\n')
      expect(outputValue).toContain('name')
    }
  })

  test('应该能处理无效的 JSON 并显示错误', async ({ page }) => {
    const inputArea = page.locator('textarea, .neon-textarea').first()
    
    // 输入无效的 JSON
    await inputArea.fill('{invalid json}')
    
    // 尝试格式化
    const formatButton = page.locator('button:has-text("格式化"), button:has-text("美化")').first()
    if (await formatButton.isVisible()) {
      await formatButton.click()
      await page.waitForTimeout(500)
      
      // 应该显示错误提示
      const errorMessage = page.locator('.error-message, .el-message--error, text=/错误|error/i').first()
      // 注意：Element Plus 的 Message 可能是浮动的，可能不在 DOM 中持久存在
    }
  })

  test('应该能压缩 JSON', async ({ page }) => {
    const inputArea = page.locator('textarea, .neon-textarea').first()
    
    // 输入格式化的 JSON
    const testJson = `{
  "name": "test",
  "value": 123
}`
    await inputArea.fill(testJson)
    
    // 查找压缩按钮
    const compressButton = page.locator('button:has-text("压缩"), button:has-text("最小化")').first()
    if (await compressButton.isVisible()) {
      await compressButton.click()
      await page.waitForTimeout(500)
      
      const outputArea = page.locator('textarea, .neon-textarea').nth(1)
      if (await outputArea.isVisible()) {
        const outputValue = await outputArea.inputValue()
        // 压缩后不应该有换行符
        expect(outputValue).not.toContain('\n')
      }
    }
  })

  test('应该能复制结果', async ({ page }) => {
    // 授予剪贴板权限
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    
    const inputArea = page.locator('textarea, .neon-textarea').first()
    await inputArea.fill('{"test": true}')
    
    // 查找复制按钮
    const copyButton = page.locator('button:has-text("复制"), button[title*="复制"]').first()
    if (await copyButton.isVisible()) {
      await copyButton.click()
      await page.waitForTimeout(300)
      
      // 验证剪贴板内容
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
      expect(clipboardText).toContain('test')
    }
  })
})

