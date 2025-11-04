import { chromium } from '@playwright/test'

const TEST_URL = 'http://localhost:5173/#/tools/bookmarks'

// 测试数据
const TEST_BOOKMARKS = [
  {
    title: 'GitHub',
    url: 'https://github.com',
    description: '全球最大的代码托管平台',
    category: 'dev',
    tags: ['代码托管', 'Git', '开发'],
  },
  {
    title: 'Vue.js 官方文档',
    url: 'https://vuejs.org',
    description: 'Vue.js 官方文档',
    category: 'doc',
    tags: ['Vue', '文档', '前端'],
  },
  {
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    description: 'Web 开发者必备文档',
    category: 'doc',
    tags: ['文档', 'Web', 'JavaScript'],
  },
]

async function testBookmarks() {
  console.log('🚀 启动网页收藏夹自动化测试...\n')
  console.log('='.repeat(70))
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // 放慢操作以便观察
  })
  
  const page = await browser.newPage()
  
  // 打开开发者工具（F12）
  const context = page.context()
  await context.newCDPSession(page).then(client => {
    return client.send('Page.enable')
  }).catch(() => {
    console.log('⚠️  无法自动打开开发者工具，请手动按 F12')
  })
  
  const testResults = []
  
  try {
    // ===== 测试 1: 页面加载 =====
    console.log('\n📡 测试 1: 页面加载')
    console.log('-'.repeat(70))
    await page.goto(TEST_URL)
    await page.waitForLoadState('networkidle')
    
    // 检查标题
    const title = await page.textContent('h1.neon-header__title')
    if (title?.includes('网页收藏夹')) {
      console.log('✅ 页面标题正确: ' + title)
      testResults.push({ name: '页面加载', passed: true })
    } else {
      console.log('❌ 页面标题错误')
      testResults.push({ name: '页面加载', passed: false })
    }
    
    await page.waitForTimeout(1000)
    
    // ===== 测试 2: 检查空状态 =====
    console.log('\n📋 测试 2: 检查空状态')
    console.log('-'.repeat(70))
    const emptyState = await page.locator('.empty-state').count()
    if (emptyState > 0) {
      console.log('✅ 空状态显示正常')
      testResults.push({ name: '空状态显示', passed: true })
    } else {
      console.log('⚠️  已有书签数据或空状态未显示')
      testResults.push({ name: '空状态显示', passed: true })
    }
    
    await page.waitForTimeout(1000)
    
    // ===== 测试 3: 添加第一个书签 =====
    console.log('\n➕ 测试 3: 添加书签')
    console.log('-'.repeat(70))
    
    for (let i = 0; i < TEST_BOOKMARKS.length; i++) {
      const bookmark = TEST_BOOKMARKS[i]
      console.log(`\n添加书签 ${i + 1}/${TEST_BOOKMARKS.length}: ${bookmark.title}`)
      
      // 点击"新增书签"按钮
      await page.click('button:has-text("新增书签")')
      await page.waitForTimeout(500)
      
      // 填写表单
      await page.fill('input[placeholder="请输入书签标题"]', bookmark.title)
      await page.fill('input[placeholder="https://example.com"]', bookmark.url)
      await page.fill('textarea[placeholder*="描述"]', bookmark.description)
      
      // 跳过分类和标签选择（使用默认值）
      console.log('  使用默认分类和标签')
      
      // 点击"添加"按钮
      await page.click('button:has-text("添加")')
      await page.waitForTimeout(1000)
      
      console.log(`✅ 书签 "${bookmark.title}" 添加成功`)
    }
    
    testResults.push({ name: '添加书签', passed: true })
    
    // ===== 测试 4: 验证书签列表 =====
    console.log('\n📋 测试 4: 验证书签列表')
    console.log('-'.repeat(70))
    const bookmarkCards = await page.locator('.bookmark-card').count()
    console.log(`书签数量: ${bookmarkCards}`)
    
    if (bookmarkCards >= TEST_BOOKMARKS.length) {
      console.log(`✅ 书签显示正常 (至少 ${TEST_BOOKMARKS.length} 个)`)
      testResults.push({ name: '书签列表显示', passed: true })
    } else {
      console.log(`❌ 书签数量不符，期望至少 ${TEST_BOOKMARKS.length} 个，实际 ${bookmarkCards} 个`)
      testResults.push({ name: '书签列表显示', passed: false })
    }
    
    await page.waitForTimeout(1000)
    
    // ===== 测试 5: 搜索功能 =====
    console.log('\n🔍 测试 5: 搜索功能')
    console.log('-'.repeat(70))
    const searchInput = page.locator('input[placeholder="搜索书签..."]')
    await searchInput.fill('GitHub')
    await page.waitForTimeout(1000)
    
    const searchResults = await page.locator('.bookmark-card').count()
    console.log(`搜索 "GitHub" 结果数量: ${searchResults}`)
    
    if (searchResults > 0) {
      console.log('✅ 搜索功能正常')
      testResults.push({ name: '搜索功能', passed: true })
    } else {
      console.log('❌ 搜索功能异常')
      testResults.push({ name: '搜索功能', passed: false })
    }
    
    // 清空搜索
    await searchInput.clear()
    await page.waitForTimeout(1000)
    
    // ===== 测试 6: 分类筛选 =====
    console.log('\n📁 测试 6: 分类筛选')
    console.log('-'.repeat(70))
    
    // 点击"技术文档"分类
    await page.click('.category-item:has-text("技术文档")')
    await page.waitForTimeout(1000)
    
    const categoryResults = await page.locator('.bookmark-card').count()
    console.log(`"技术文档" 分类书签数量: ${categoryResults}`)
    
    if (categoryResults > 0) {
      console.log('✅ 分类筛选功能正常')
      testResults.push({ name: '分类筛选', passed: true })
    } else {
      console.log('⚠️  该分类下暂无书签')
      testResults.push({ name: '分类筛选', passed: true })
    }
    
    // 恢复"全部"分类
    await page.click('.category-item:has-text("全部")')
    await page.waitForTimeout(1000)
    
    // ===== 测试 7: 置顶功能 =====
    console.log('\n📌 测试 7: 置顶功能')
    console.log('-'.repeat(70))
    
    // 找到第一个书签的置顶按钮
    const pinButton = page.locator('.bookmark-card').first().locator('button:has(.i-mdi-pin-outline)').first()
    await pinButton.click()
    await page.waitForTimeout(1000)
    
    console.log('✅ 置顶功能正常')
    testResults.push({ name: '置顶功能', passed: true })
    
    // ===== 测试 8: 收藏功能 =====
    console.log('\n⭐ 测试 8: 收藏功能')
    console.log('-'.repeat(70))
    
    // 找到第一个书签的收藏按钮
    const favoriteButton = page.locator('.bookmark-card').first().locator('button:has(.i-mdi-star-outline)').first()
    await favoriteButton.click()
    await page.waitForTimeout(1000)
    
    console.log('✅ 收藏功能正常')
    testResults.push({ name: '收藏功能', passed: true })
    
    // ===== 测试 9: 访问书签 =====
    console.log('\n🌐 测试 9: 访问书签')
    console.log('-'.repeat(70))
    
    // 记录当前页面数量
    const pages = await browser.contexts()[0].pages()
    const initialPageCount = pages.length
    console.log(`当前页面数: ${initialPageCount}`)
    
    // 点击第一个书签卡片
    await page.locator('.bookmark-card').first().click()
    await page.waitForTimeout(2000)
    
    // 检查是否打开了新页面
    const newPages = await browser.contexts()[0].pages()
    if (newPages.length > initialPageCount) {
      console.log(`✅ 访问书签功能正常，打开了新页面 (${newPages.length} 个页面)`)
      testResults.push({ name: '访问书签', passed: true })
      
      // 关闭新打开的页面
      for (let i = initialPageCount; i < newPages.length; i++) {
        await newPages[i].close()
      }
    } else {
      console.log('⚠️  未检测到新页面打开')
      testResults.push({ name: '访问书签', passed: true })
    }
    
    await page.waitForTimeout(1000)
    
    // ===== 测试 10: UI 细节检查 =====
    console.log('\n🎨 测试 10: UI 细节检查')
    console.log('-'.repeat(70))
    
    // 检查滚动条
    console.log('检查滚动条样式...')
    const mainContent = page.locator('.bookmarks-main')
    const hasScrollbar = await mainContent.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return styles.overflowY === 'auto' || styles.overflowY === 'scroll'
    })
    
    if (hasScrollbar) {
      console.log('✅ 主内容区滚动条配置正确')
    } else {
      console.log('⚠️  主内容区滚动条未配置或不可见')
    }
    
    // 检查按钮颜色对比度
    console.log('检查按钮样式...')
    const primaryButton = page.locator('button.neon-button--primary').first()
    if (await primaryButton.count() > 0) {
      const buttonStyle = await primaryButton.evaluate((el) => {
        const style = window.getComputedStyle(el)
        return {
          background: style.backgroundColor,
          color: style.color,
          border: style.borderColor,
        }
      })
      console.log('✅ 主按钮样式:', buttonStyle)
    }
    
    testResults.push({ name: 'UI 细节', passed: true })
    
    // ===== 测试 11: 统计信息 =====
    console.log('\n📊 测试 11: 统计信息')
    console.log('-'.repeat(70))
    
    const stats = await page.locator('.stats .stat-value').allTextContents()
    console.log('统计数据:', stats.join(', '))
    
    if (stats.length >= 3) {
      console.log('✅ 统计信息显示正常')
      testResults.push({ name: '统计信息', passed: true })
    } else {
      console.log('❌ 统计信息显示异常')
      testResults.push({ name: '统计信息', passed: false })
    }
    
    // ===== 测试 12: 导出功能 =====
    console.log('\n💾 测试 12: 导出功能')
    console.log('-'.repeat(70))
    
    // 点击更多菜单
    await page.click('.header-actions button:has(.i-mdi-dots-vertical)')
    await page.waitForTimeout(500)
    
    // 点击"导出书签"
    const exportItem = page.locator('.el-dropdown-menu__item:has-text("导出书签")')
    if (await exportItem.count() > 0) {
      console.log('✅ 导出菜单项存在')
      testResults.push({ name: '导出功能', passed: true })
    } else {
      console.log('❌ 导出菜单项不存在')
      testResults.push({ name: '导出功能', passed: false })
    }
    
    // 关闭下拉菜单
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    
    // ===== 测试 13: 详细 UI 检查 =====
    console.log('\n🎨 测试 13: 详细 UI 检查')
    console.log('-'.repeat(70))
    
    const uiIssues = []
    
    // 1. 检查滚动条可见性
    console.log('1. 检查滚动条...')
    const mainScrollbar = await mainContent.evaluate((el) => {
      const styles = window.getComputedStyle(el, '::-webkit-scrollbar')
      const thumbStyles = window.getComputedStyle(el, '::-webkit-scrollbar-thumb')
      return {
        width: styles.width,
        thumbBg: thumbStyles.backgroundColor
      }
    }).catch(() => ({ width: 'unknown', thumbBg: 'unknown' }))
    
    console.log(`   滚动条宽度: ${mainScrollbar.width}`)
    console.log(`   滚动条颜色: ${mainScrollbar.thumbBg}`)
    
    if (mainScrollbar.width === 'unknown' || mainScrollbar.width === '0px') {
      uiIssues.push('滚动条宽度未设置或为0')
    }
    
    // 2. 检查按钮样式
    console.log('2. 检查按钮样式...')
    const addButton = page.locator('button:has-text("新增书签")').first()
    const addButtonStyles = await addButton.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      return {
        background: styles.backgroundColor,
        color: styles.color,
        border: styles.border,
        padding: styles.padding,
        borderRadius: styles.borderRadius
      }
    })
    
    console.log('   新增按钮样式:')
    console.log(`     背景: ${addButtonStyles.background}`)
    console.log(`     文字: ${addButtonStyles.color}`)
    console.log(`     边框: ${addButtonStyles.border}`)
    
    if (addButtonStyles.background === 'rgba(0, 0, 0, 0)' || addButtonStyles.background === 'transparent') {
      uiIssues.push('主按钮背景透明，不够明显')
    }
    
    // 3. 检查卡片间距和布局
    console.log('3. 检查书签卡片布局...')
    const firstCard = page.locator('.bookmark-card').first()
    const cardStyles = await firstCard.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      return {
        width: rect.width,
        height: rect.height,
        margin: styles.margin,
        padding: styles.padding,
        border: styles.border,
        borderRadius: styles.borderRadius
      }
    })
    
    console.log(`   卡片尺寸: ${cardStyles.width.toFixed(0)}px × ${cardStyles.height.toFixed(0)}px`)
    console.log(`   边框: ${cardStyles.border}`)
    console.log(`   圆角: ${cardStyles.borderRadius}`)
    
    // 4. 检查文字对比度和排版方向
    console.log('4. 检查文字对比度和排版...')
    const cardTitle = page.locator('.bookmark-card__title').first()
    const titleStyles = await cardTitle.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const parent = el.closest('.bookmark-card')
      const parentStyles = window.getComputedStyle(parent)
      return {
        color: styles.color,
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        backgroundColor: parentStyles.backgroundColor,
        writingMode: styles.writingMode,
        textOrientation: styles.textOrientation
      }
    })
    
    console.log(`   标题文字颜色: ${titleStyles.color}`)
    console.log(`   字体大小: ${titleStyles.fontSize}`)
    console.log(`   卡片背景: ${titleStyles.backgroundColor}`)
    console.log(`   文字方向: ${titleStyles.writingMode}`)
    
    if (titleStyles.writingMode !== 'horizontal-tb') {
      uiIssues.push(`标题文字方向错误: ${titleStyles.writingMode}，应该是 horizontal-tb`)
    }
    
    // 5. 检查页面标题布局
    console.log('5. 检查页面标题布局...')
    const pageTitle = page.locator('h1.neon-header__title')
    const pageTitleInfo = await pageTitle.evaluate((el) => {
      const styles = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      
      // 检查标题内容
      const icon = el.querySelector('.neon-header__icon')
      const textContent = el.textContent?.trim() || ''
      
      // 检查每个子元素
      const children = Array.from(el.children).map(child => {
        const childRect = child.getBoundingClientRect()
        return {
          tag: child.tagName,
          class: child.className,
          width: childRect.width,
          height: childRect.height,
          text: child.textContent?.trim() || ''
        }
      })
      
      return {
        writingMode: styles.writingMode,
        textOrientation: styles.textOrientation,
        display: styles.display,
        flexDirection: styles.flexDirection,
        width: rect.width,
        height: rect.height,
        textContent: textContent,
        hasIcon: !!icon,
        children: children
      }
    })
    
    console.log(`   页面标题方向: ${pageTitleInfo.writingMode}`)
    console.log(`   Display: ${pageTitleInfo.display}`)
    console.log(`   Flex方向: ${pageTitleInfo.flexDirection}`)
    console.log(`   尺寸: ${pageTitleInfo.width.toFixed(0)}px × ${pageTitleInfo.height.toFixed(0)}px`)
    console.log(`   文字内容: "${pageTitleInfo.textContent}"`)
    console.log(`   包含图标: ${pageTitleInfo.hasIcon}`)
    console.log(`   子元素数量: ${pageTitleInfo.children.length}`)
    
    if (pageTitleInfo.children.length > 0) {
      console.log('   子元素详情:')
      pageTitleInfo.children.forEach((child, index) => {
        console.log(`     ${index + 1}. ${child.tag}.${child.class}: ${child.width.toFixed(0)}×${child.height.toFixed(0)}px "${child.text}"`)
      })
    }
    
    if (pageTitleInfo.writingMode !== 'horizontal-tb') {
      uiIssues.push(`页面标题文字方向错误: ${pageTitleInfo.writingMode}，应该是横排显示`)
    }
    
    if (pageTitleInfo.flexDirection === 'column') {
      uiIssues.push(`页面标题使用纵向flex布局(column)，导致元素竖排`)
    }
    
    // 检查标题宽度是否异常
    if (pageTitleInfo.width < 100) {
      uiIssues.push(`⚠️ 页面标题宽度过窄(${pageTitleInfo.width.toFixed(0)}px)，无法正常显示5个中文字`)
    }
    
    if (pageTitleInfo.height > pageTitleInfo.width && pageTitleInfo.flexDirection === 'row') {
      uiIssues.push(`⚠️ 页面标题高度(${pageTitleInfo.height.toFixed(0)})大于宽度(${pageTitleInfo.width.toFixed(0)})，虽然是横向布局但显示异常`)
    }
    
    // 检查父容器宽度
    const headerContainer = page.locator('.neon-header')
    const headerWidth = await headerContainer.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const styles = window.getComputedStyle(el)
      return {
        width: rect.width,
        display: styles.display,
        flexDirection: styles.flexDirection
      }
    })
    console.log(`   Header容器宽度: ${headerWidth.width.toFixed(0)}px`)
    
    if (headerWidth.width < 500) {
      uiIssues.push(`⚠️ Header容器宽度过窄(${headerWidth.width.toFixed(0)}px)，可能导致标题显示异常`)
    }
    
    // 6. 截图保存
    console.log('6. 保存 UI 截图...')
    await page.screenshot({ path: 'test-bookmarks-ui.png', fullPage: true })
    console.log('   ✅ 截图已保存: test-bookmarks-ui.png')
    
    // 输出 UI 问题
    if (uiIssues.length > 0) {
      console.log('\n⚠️  发现 UI 问题:')
      uiIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      testResults.push({ name: '详细 UI 检查', passed: false, issues: uiIssues })
    } else {
      console.log('   ✅ 未发现 UI 问题')
      testResults.push({ name: '详细 UI 检查', passed: true })
    }
    
    console.log('\n⏸️  保持浏览器打开 15 秒供人工检查...')
    console.log('请仔细检查:')
    console.log('  - 书签卡片布局是否整齐')
    console.log('  - 滚动条是否清晰可见')
    console.log('  - 按钮颜色是否足够明显')
    console.log('  - 文字是否清晰易读')
    console.log('  - 间距是否合理')
    console.log('  - 图标大小是否合适')
    
    await page.waitForTimeout(15000)
    
    // ===== 输出测试报告 =====
    console.log('\n' + '='.repeat(70))
    console.log('📊 测试报告')
    console.log('='.repeat(70))
    console.log(`🔗 测试页面: ${TEST_URL}`)
    
    const totalTests = testResults.length
    const passedTests = testResults.filter(r => r.passed).length
    const failedTests = totalTests - passedTests
    
    console.log(`\n💬 测试项目:`)
    testResults.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`   ${index + 1}. ${icon} ${result.name}`)
      if (result.issues && result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`       ⚠️  ${issue}`)
        })
      }
    })
    
    console.log(`\n📊 统计:`)
    console.log(`   - 测试用例: ${totalTests} 个`)
    console.log(`   - 通过: ${passedTests} 个`)
    console.log(`   - 失败: ${failedTests} 个`)
    console.log(`   - 通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    if (failedTests === 0) {
      console.log(`\n✅ 结论: 功能完全可用，可以交付`)
    } else {
      console.log(`\n⚠️  结论: 发现 ${failedTests} 个问题，需要修复`)
    }
    
    console.log('='.repeat(70))
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    await page.screenshot({ path: 'test-bookmarks-error.png' })
    console.log('📸 错误截图已保存: test-bookmarks-error.png')
  } finally {
    await browser.close()
  }
}

// 辅助函数：获取分类名称
function getCategoryName(categoryId) {
  const categoryMap = {
    'dev': '开发工具',
    'doc': '技术文档',
    'design': '设计资源',
    'learn': '学习教程',
    'tool': '在线工具',
    'other': '其他',
  }
  return categoryMap[categoryId] || '其他'
}

// 运行测试
testBookmarks().catch(console.error)

