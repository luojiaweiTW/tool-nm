import { chromium } from '@playwright/test'

async function checkMySQLStorage() {
  console.log('🔍 检查 MySQL 连接管理状态...\n')
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  })
  
  const page = await browser.newPage()
  
  try {
    await page.goto('http://localhost:5173/#/tools/mysql')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // 检查 localStorage
    const storageData = await page.evaluate(() => {
      return {
        connections: localStorage.getItem('mysql-connections'),
        snippets: localStorage.getItem('mysql-sql-snippets'),
        history: localStorage.getItem('mysql-query-history'),
        allKeys: Object.keys(localStorage)
      }
    })
    
    console.log('📦 localStorage 内容:')
    console.log('─'.repeat(70))
    
    if (storageData.connections) {
      const connections = JSON.parse(storageData.connections)
      console.log('\n✅ MySQL 连接配置 (mysql-connections):')
      console.log(`   数量: ${connections.length}`)
      connections.forEach((conn, i) => {
        console.log(`   ${i + 1}. ${conn.name || conn.username + '@' + conn.host}`)
        console.log(`      主机: ${conn.host}:${conn.port}`)
        console.log(`      用户: ${conn.username}`)
        console.log(`      数据库: ${conn.database || '(未指定)'}`)
      })
    } else {
      console.log('\n❌ 没有找到保存的连接 (mysql-connections)')
    }
    
    if (storageData.snippets) {
      const snippets = JSON.parse(storageData.snippets)
      console.log(`\n✅ SQL 片段 (mysql-sql-snippets): ${snippets.length} 个`)
    } else {
      console.log('\n⚠️  没有自定义 SQL 片段')
    }
    
    if (storageData.history) {
      const history = JSON.parse(storageData.history)
      console.log(`\n✅ 查询历史 (mysql-query-history): ${history.length} 条`)
      if (history.length > 0) {
        console.log('   最近的查询:')
        history.slice(0, 3).forEach((q, i) => {
          console.log(`   ${i + 1}. ${q.substring(0, 60)}${q.length > 60 ? '...' : ''}`)
        })
      }
    } else {
      console.log('\n⚠️  没有查询历史')
    }
    
    console.log('\n📋 所有 localStorage keys:')
    console.log('   ', storageData.allKeys.join(', '))
    
    console.log('\n' + '─'.repeat(70))
    
    // 检查页面上的连接管理按钮
    console.log('\n🔍 检查页面元素:')
    const connectionBtn = page.locator('button').filter({ hasText: '连接管理' })
    const btnExists = await connectionBtn.count() > 0
    
    if (btnExists) {
      console.log('   ✅ "连接管理" 按钮存在')
      
      // 点击按钮
      await connectionBtn.click()
      await page.waitForTimeout(500)
      
      const dialog = page.locator('.el-dialog').filter({ hasText: 'MySQL 连接管理' })
      const dialogVisible = await dialog.isVisible()
      
      if (dialogVisible) {
        console.log('   ✅ 连接管理对话框可以打开')
        
        // 检查对话框内容
        const emptyState = dialog.locator('.empty-connections')
        const hasEmptyState = await emptyState.isVisible()
        
        const connectionItems = dialog.locator('.connection-item')
        const itemCount = await connectionItems.count()
        
        if (hasEmptyState) {
          console.log('   ℹ️  对话框显示 "暂无保存的连接"')
        } else {
          console.log(`   ✅ 对话框显示 ${itemCount} 个连接`)
        }
        
        // 截图
        await page.screenshot({ 
          path: 'mysql-connection-manager.png',
          fullPage: true
        })
        console.log('   📸 截图已保存: mysql-connection-manager.png')
        
        await page.waitForTimeout(3000)
      } else {
        console.log('   ❌ 连接管理对话框未打开')
      }
    } else {
      console.log('   ❌ "连接管理" 按钮不存在')
    }
    
    console.log('\n' + '='.repeat(70))
    console.log('📊 诊断结果')
    console.log('='.repeat(70))
    
    if (!storageData.connections || JSON.parse(storageData.connections).length === 0) {
      console.log('\n⚠️  问题诊断:')
      console.log('   1. 你还没有成功保存过任何 MySQL 连接')
      console.log('   2. 或者之前的连接是在旧版本中创建的（使用了不同的存储key）')
      console.log('')
      console.log('✅ 解决方案:')
      console.log('   1. 点击 "新建连接" 按钮')
      console.log('   2. 填写 MySQL 连接信息')
      console.log('   3. 点击 "连接" 按钮')
      console.log('   4. 连接成功后，配置会自动保存到 "连接管理" 中')
      console.log('')
      console.log('💡 提示:')
      console.log('   - 连接成功后，在工具栏点击 "连接管理" 即可查看')
      console.log('   - 下次就可以快速选择已保存的连接了')
    } else {
      console.log('\n✅ 连接管理功能正常！')
      console.log(`   已保存 ${JSON.parse(storageData.connections).length} 个连接`)
    }
    
    console.log('\n' + '='.repeat(70))
    
    await page.waitForTimeout(5000)
    
  } catch (error) {
    console.error('\n❌ 检查过程出错:', error.message)
    await page.screenshot({ path: 'mysql-check-error.png' })
  } finally {
    await browser.close()
  }
}

checkMySQLStorage().catch(console.error)








