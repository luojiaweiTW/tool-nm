/**
 * Electron Builder afterPack Hook
 * 在打包后自动使用 rcedit 修改 exe 的图标和元数据
 */

const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const util = require('util')
const execAsync = util.promisify(exec)

const https = require('https')
const http = require('http')

/**
 * 下载文件
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const protocol = url.startsWith('https') ? https : http
    
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        downloadFile(response.headers.location, dest).then(resolve).catch(reject)
        return
      }
      
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

/**
 * afterPack hook
 */
module.exports = async function(context) {
  // 只处理 Windows 平台
  if (context.electronPlatformName !== 'win32') {
    console.log('⏭️  跳过非 Windows 平台')
    return
  }
  
  console.log('')
  console.log('========================================')
  console.log('🔧 开始修改 exe 图标和元数据...')
  console.log('========================================')
  
  const appOutDir = context.appOutDir
  const exePath = path.join(appOutDir, `${context.packager.appInfo.productFilename}.exe`)
  const iconPath = path.join(__dirname, '../build/icon.ico')
  const rceditPath = path.join(__dirname, 'rcedit.exe')
  
  console.log(`📁 输出目录: ${appOutDir}`)
  console.log(`📄 exe 文件: ${exePath}`)
  console.log(`🎨 图标文件: ${iconPath}`)
  
  // 检查文件是否存在
  if (!fs.existsSync(exePath)) {
    console.error(`❌ 未找到 exe 文件: ${exePath}`)
    return
  }
  
  if (!fs.existsSync(iconPath)) {
    console.error(`❌ 未找到图标文件: ${iconPath}`)
    return
  }
  
  // 下载 rcedit（如果不存在）
  if (!fs.existsSync(rceditPath)) {
    console.log('📥 下载 rcedit...')
    const rceditUrl = 'https://github.com/electron/rcedit/releases/download/v2.0.0/rcedit-x64.exe'
    try {
      await downloadFile(rceditUrl, rceditPath)
      console.log('✅ rcedit 下载完成')
    } catch (error) {
      console.error(`❌ 下载 rcedit 失败: ${error.message}`)
      return
    }
  } else {
    console.log('✅ rcedit 已存在')
  }
  
  // 使用 rcedit 修改 exe
  try {
    console.log('')
    console.log('🔧 修改 exe 文件...')
    
    // 1. 设置图标
    console.log('  1️⃣ 设置图标...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-icon "${iconPath}"`)
    console.log('     ✅ 图标已设置')
    
    // 2. 设置产品名称
    console.log('  2️⃣ 设置产品名称...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-version-string "ProductName" "IWork"`)
    console.log('     ✅ 产品名称已设置')
    
    // 3. 设置文件描述
    console.log('  3️⃣ 设置文件描述...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-version-string "FileDescription" "IWork - 实用开发工具合集"`)
    console.log('     ✅ 文件描述已设置')
    
    // 4. 设置公司名称
    console.log('  4️⃣ 设置公司名称...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-version-string "CompanyName" "IWork"`)
    console.log('     ✅ 公司名称已设置')
    
    // 5. 设置版权信息
    console.log('  5️⃣ 设置版权信息...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-version-string "LegalCopyright" "Copyright © 2025 IWork"`)
    console.log('     ✅ 版权信息已设置')
    
    // 6. 设置文件版本
    console.log('  6️⃣ 设置文件版本...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-file-version "1.0.0.0"`)
    console.log('     ✅ 文件版本已设置')
    
    // 7. 设置产品版本
    console.log('  7️⃣ 设置产品版本...')
    await execAsync(`"${rceditPath}" "${exePath}" --set-product-version "1.0.0.0"`)
    console.log('     ✅ 产品版本已设置')
    
    console.log('')
    console.log('========================================')
    console.log('✅ exe 修改完成！')
    console.log('========================================')
    console.log('')
    
  } catch (error) {
    console.error(`❌ 修改 exe 失败: ${error.message}`)
    console.error(error)
  }
}

