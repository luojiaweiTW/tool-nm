import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 测试配置
 * 用于测试 Neon Tools 的 22 个工具页面
 */
export default defineConfig({
  // 测试文件目录
  testDir: './tests/e2e',
  
  // 测试超时时间（30秒）
  timeout: 30 * 1000,
  
  // 并行运行测试
  fullyParallel: true,
  
  // CI 环境下失败后不重试，本地环境重试失败的测试
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  
  // CI 环境下使用更少的 worker
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  
  // 全局测试配置
  use: {
    // 基础 URL（需要先启动 Vite 开发服务器）
    baseURL: 'http://localhost:5173',
    
    // 截图配置
    screenshot: 'only-on-failure',
    
    // 视频录制
    video: 'retain-on-failure',
    
    // 追踪配置
    trace: 'on-first-retry',
    
    // 浏览器上下文配置
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Electron 应用特定配置
    // 注意：Electron 测试需要特殊处理，见 tests/e2e/electron.spec.ts
  },

  // 测试项目配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // 可以添加更多浏览器测试
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // 开发服务器配置
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})

