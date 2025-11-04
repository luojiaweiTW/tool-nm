import { test, expect } from '@playwright/test'

/**
 * WebSocket 测试工具功能测试
 */

test.describe('WebSocket 测试工具', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tools/websocket')
    await page.waitForLoadState('networkidle')
  })

  test('应该能访问 WebSocket 页面', async ({ page }) => {
    // 检查页面标题
    const heading = await page.locator('h3').first().textContent()
    expect(heading).toContain('WebSocket')
    
    // 检查页面描述
    const description = await page.locator('.page-description').textContent()
    expect(description).toContain('实时通信')
  })

  test('应该显示连接配置区域', async ({ page }) => {
    // 检查 WebSocket 地址输入框
    const urlInput = page.locator('input[placeholder*="wss://"]').first()
    await expect(urlInput).toBeVisible()
    
    // 检查默认值
    const defaultValue = await urlInput.inputValue()
    expect(defaultValue).toBe('wss://echo.websocket.org/')
    
    // 检查自动重连选项
    const autoReconnectCheckbox = page.locator('input[type="checkbox"]').first()
    await expect(autoReconnectCheckbox).toBeVisible()
    
    // 检查心跳间隔输入
    const heartbeatInput = page.locator('input[type="number"]').first()
    await expect(heartbeatInput).toBeVisible()
  })

  test('应该显示连接状态', async ({ page }) => {
    // 检查状态标签
    const statusLabel = page.locator('.status-label')
    await expect(statusLabel).toHaveText('连接状态：')
    
    // 检查初始状态（未连接）
    const statusBadge = page.locator('.status-badge')
    await expect(statusBadge).toHaveClass(/status-disconnected/)
    await expect(statusBadge).toContainText('未连接')
  })

  test('应该有连接和断开按钮', async ({ page }) => {
    // 检查连接按钮（初始状态）
    const connectButton = page.locator('button:has-text("连接")').first()
    await expect(connectButton).toBeVisible()
    await expect(connectButton).toBeEnabled()
    
    // 断开按钮应该不可见
    const disconnectButton = page.locator('button:has-text("断开连接")')
    await expect(disconnectButton).not.toBeVisible()
  })

  test('应该能修改 WebSocket 地址', async ({ page }) => {
    const urlInput = page.locator('input[placeholder*="wss://"]').first()
    
    // 清空并输入新地址
    await urlInput.clear()
    await urlInput.fill('wss://example.com/ws')
    
    // 验证输入值
    const value = await urlInput.inputValue()
    expect(value).toBe('wss://example.com/ws')
  })

  test('应该显示消息记录区域', async ({ page }) => {
    // 检查消息记录标题
    const messagesTitle = page.locator('text=/消息记录/i')
    await expect(messagesTitle).toBeVisible()
    
    // 检查空状态提示
    const emptyMessages = page.locator('.empty-messages')
    await expect(emptyMessages).toBeVisible()
    await expect(emptyMessages).toContainText('暂无消息')
    
    // 检查清空按钮（应该禁用）
    const clearButton = page.locator('button:has-text("清空")')
    await expect(clearButton).toBeDisabled()
  })

  test('应该显示发送消息区域', async ({ page }) => {
    // 检查发送标题
    const sendTitle = page.locator('text=/发送消息/i')
    await expect(sendTitle).toBeVisible()
    
    // 检查消息输入框（应该禁用，因为未连接）
    const messageInput = page.locator('textarea').first()
    await expect(messageInput).toBeVisible()
    await expect(messageInput).toBeDisabled()
    
    // 检查发送按钮（应该禁用）
    const sendButton = page.locator('button:has-text("发送")').last()
    await expect(sendButton).toBeDisabled()
    
    // 检查提示信息
    const hint = page.locator('.send-hint')
    await expect(hint).toContainText('请先连接 WebSocket 服务器')
  })

  test('应该能连接到 WebSocket 服务器', async ({ page }) => {
    // 点击连接按钮
    const connectButton = page.locator('button:has-text("连接")').first()
    await connectButton.click()
    
    // 等待连接状态变化
    await page.waitForTimeout(2000)
    
    // 检查状态变化（连接中或已连接）
    const statusBadge = page.locator('.status-badge')
    const statusText = await statusBadge.textContent()
    expect(statusText).toMatch(/连接中|已连接/)
    
    // 如果连接成功，检查系统消息
    const systemMessages = page.locator('.message-system')
    const count = await systemMessages.count()
    expect(count).toBeGreaterThan(0)
    
    // 检查第一条消息应该是连接消息
    const firstMessage = systemMessages.first()
    const messageText = await firstMessage.textContent()
    expect(messageText).toContain('正在连接')
  })

  test('连接后应该能发送消息', async ({ page }) => {
    // 连接
    const connectButton = page.locator('button:has-text("连接")').first()
    await connectButton.click()
    
    // 等待连接成功
    await page.waitForSelector('.status-connected', { timeout: 5000 })
    
    // 输入消息
    const messageInput = page.locator('textarea').first()
    await expect(messageInput).toBeEnabled()
    await messageInput.fill('Hello WebSocket!')
    
    // 发送消息
    const sendButton = page.locator('button:has-text("发送")').last()
    await expect(sendButton).toBeEnabled()
    await sendButton.click()
    
    // 等待消息显示
    await page.waitForTimeout(500)
    
    // 检查发送的消息
    const sentMessage = page.locator('.message-sent').first()
    await expect(sentMessage).toBeVisible()
    await expect(sentMessage).toContainText('Hello WebSocket!')
    
    // echo.websocket.org 会回显消息，检查接收的消息
    await page.waitForTimeout(1000)
    const receivedMessage = page.locator('.message-received').first()
    await expect(receivedMessage).toBeVisible()
    await expect(receivedMessage).toContainText('Hello WebSocket!')
  })

  test('应该能清空消息记录', async ({ page }) => {
    // 连接并发送消息
    await page.locator('button:has-text("连接")').first().click()
    await page.waitForSelector('.status-connected', { timeout: 5000 })
    
    // 发送一条消息
    const messageInput = page.locator('textarea').first()
    await messageInput.fill('Test message')
    await page.locator('button:has-text("发送")').last().click()
    await page.waitForTimeout(500)
    
    // 检查消息数量
    const messages = page.locator('.message-item')
    const beforeCount = await messages.count()
    expect(beforeCount).toBeGreaterThan(0)
    
    // 点击清空按钮
    const clearButton = page.locator('button:has-text("清空")')
    await expect(clearButton).toBeEnabled()
    await clearButton.click()
    
    // 等待清空完成
    await page.waitForTimeout(300)
    
    // 应该只剩下清空的系统消息
    const afterCount = await messages.count()
    expect(afterCount).toBe(1) // 只有"消息已清空"的系统消息
    
    // 检查空状态（或只有系统消息）
    const systemMessage = page.locator('.message-system').last()
    await expect(systemMessage).toContainText('消息已清空')
  })

  test('应该能断开连接', async ({ page }) => {
    // 先连接
    await page.locator('button:has-text("连接")').first().click()
    await page.waitForSelector('.status-connected', { timeout: 5000 })
    
    // 检查断开按钮出现
    const disconnectButton = page.locator('button:has-text("断开连接")')
    await expect(disconnectButton).toBeVisible()
    await expect(disconnectButton).toBeEnabled()
    
    // 点击断开
    await disconnectButton.click()
    await page.waitForTimeout(500)
    
    // 检查状态变为未连接
    const statusBadge = page.locator('.status-badge')
    await expect(statusBadge).toHaveClass(/status-disconnected/)
    
    // 检查系统消息
    const systemMessages = page.locator('.message-system')
    const lastMessage = systemMessages.last()
    await expect(lastMessage).toContainText('断开连接')
  })

  test('消息应该显示时间戳', async ({ page }) => {
    // 连接并发送消息
    await page.locator('button:has-text("连接")').first().click()
    await page.waitForSelector('.status-connected', { timeout: 5000 })
    
    // 发送消息
    const messageInput = page.locator('textarea').first()
    await messageInput.fill('Test timestamp')
    await page.locator('button:has-text("发送")').last().click()
    await page.waitForTimeout(500)
    
    // 检查消息时间
    const messageTime = page.locator('.message-time').first()
    await expect(messageTime).toBeVisible()
    
    const timeText = await messageTime.textContent()
    // 时间格式应该是 HH:MM:SS
    expect(timeText).toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  test('应该正确显示消息类型图标', async ({ page }) => {
    // 连接
    await page.locator('button:has-text("连接")').first().click()
    await page.waitForSelector('.status-connected', { timeout: 5000 })
    
    // 系统消息应该有 information 图标
    const systemMessage = page.locator('.message-system').first()
    const systemIcon = systemMessage.locator('i').first()
    const systemIconClass = await systemIcon.getAttribute('class')
    expect(systemIconClass).toContain('i-mdi-information')
    
    // 发送消息
    await page.locator('textarea').first().fill('Test')
    await page.locator('button:has-text("发送")').last().click()
    await page.waitForTimeout(500)
    
    // 发送的消息应该有向上箭头图标
    const sentMessage = page.locator('.message-sent').first()
    const sentIcon = sentMessage.locator('i').first()
    const sentIconClass = await sentIcon.getAttribute('class')
    expect(sentIconClass).toContain('i-mdi-arrow-up-bold')
    
    // 等待接收消息
    await page.waitForTimeout(1000)
    const receivedMessage = page.locator('.message-received').first()
    if (await receivedMessage.isVisible()) {
      const receivedIcon = receivedMessage.locator('i').first()
      const receivedIconClass = await receivedIcon.getAttribute('class')
      expect(receivedIconClass).toContain('i-mdi-arrow-down-bold')
    }
  })
})

