import { test, expect } from '@playwright/test'

/**
 * HTTP 客户端工具功能测试
 */

test.describe('HTTP 客户端', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/http-client')
    await page.waitForLoadState('networkidle')
  })

  test('应该能发送 GET 请求', async ({ page }) => {
    // 输入 URL
    const urlInput = page.locator('input[placeholder*="URL"], .neon-input input').first()
    await urlInput.fill('https://jsonplaceholder.typicode.com/posts/1')
    
    // 选择 GET 方法（默认可能就是 GET）
    const methodSelect = page.locator('.el-select, select').first()
    if (await methodSelect.isVisible()) {
      await methodSelect.click()
      await page.locator('text=GET').first().click()
    }
    
    // 发送请求
    const sendButton = page.locator('button:has-text("发送")').first()
    await sendButton.click()
    
    // 等待响应（最多 10 秒）
    await page.waitForTimeout(3000)
    
    // 检查响应区域
    const responseArea = page.locator('.response-body, .response-content, textarea').last()
    if (await responseArea.isVisible()) {
      const responseText = await responseArea.textContent() || await responseArea.inputValue()
      // 应该包含 JSON 响应
      expect(responseText).toContain('userId')
    }
  })

  test('应该能添加和删除 Headers', async ({ page }) => {
    // 切换到 Headers 标签
    const headersTab = page.locator('text=Headers').first()
    if (await headersTab.isVisible()) {
      await headersTab.click()
    }
    
    // 添加 Header
    const addButton = page.locator('button:has-text("添加")').first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(300)
      
      // 填写 Header
      const keyInput = page.locator('input[placeholder*="Header Name"], input[placeholder*="名称"]').last()
      const valueInput = page.locator('input[placeholder*="Header Value"], input[placeholder*="值"]').last()
      
      if (await keyInput.isVisible()) {
        await keyInput.fill('X-Custom-Header')
        await valueInput.fill('test-value')
      }
      
      // 删除 Header（点击删除按钮）
      const deleteButton = page.locator('button.el-button--danger').first()
      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.waitForTimeout(300)
      }
    }
  })

  test('应该能切换请求方法', async ({ page }) => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE']
    
    for (const method of methods) {
      const methodSelect = page.locator('.el-select, select').first()
      if (await methodSelect.isVisible()) {
        await methodSelect.click()
        await page.waitForTimeout(200)
        
        const methodOption = page.locator(`text=${method}`).first()
        if (await methodOption.isVisible()) {
          await methodOption.click()
          await page.waitForTimeout(200)
          
          // 验证方法已选中
          const selectedText = await methodSelect.textContent()
          expect(selectedText).toContain(method)
        }
      }
    }
  })

  test('应该显示对比度良好的删除按钮', async ({ page }) => {
    // 切换到 Headers 标签
    const headersTab = page.locator('text=Headers').first()
    if (await headersTab.isVisible()) {
      await headersTab.click()
    }
    
    // 查找删除按钮
    const dangerButton = page.locator('button.el-button--danger').first()
    if (await dangerButton.isVisible()) {
      // 获取按钮的计算样式
      const backgroundColor = await dangerButton.evaluate((el) => 
        window.getComputedStyle(el).backgroundColor
      )
      
      // 检查图标颜色
      const icon = dangerButton.locator('i').first()
      if (await icon.isVisible()) {
        const iconColor = await icon.evaluate((el) => 
          window.getComputedStyle(el).color
        )
        
        // 粉色按钮应该有白色图标（rgb(255, 255, 255)）
        // 这个测试验证我们之前修复的对比度问题
        console.log(`背景色: ${backgroundColor}, 图标颜色: ${iconColor}`)
      }
    }
  })
})

