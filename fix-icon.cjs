/**
 * 手动修复 exe 图标和元数据
 * 使用方法：node fix-icon.cjs
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const exePath = path.join(__dirname, 'release-new/win-unpacked/electron.exe')
const iworkExePath = path.join(__dirname, 'release-new/win-unpacked/IWork.exe')
const iconPath = path.join(__dirname, 'build/icon.ico')
const rceditPath = path.join(__dirname, 'build-scripts/rcedit.exe')

console.log('========================================')
console.log('🔧 手动修复 exe 图标和元数据')
console.log('========================================')
console.log('')

// 检查文件是否存在（优先检查 IWork.exe）
let targetExe = exePath
if (fs.existsSync(iworkExePath)) {
  targetExe = iworkExePath
  console.log('✅ 找到 IWork.exe，已经打包完成')
  console.log('📁 exe 位置:', iworkExePath)
  console.log('')
  console.log('========================================')
  console.log('✅ 打包成功！无需额外修复')
  console.log('========================================')
  process.exit(0)
} else if (!fs.existsSync(exePath)) {
  console.error(`❌ 未找到 exe 文件: ${exePath} 或 ${iworkExePath}`)
  process.exit(1)
}

if (!fs.existsSync(iconPath)) {
  console.error(`❌ 未找到图标文件: ${iconPath}`)
  process.exit(1)
}

if (!fs.existsSync(rceditPath)) {
  console.error(`❌ 未找到 rcedit.exe: ${rceditPath}`)
  process.exit(1)
}

console.log(`📄 原 exe: ${exePath}`)
console.log(`🎨 图标: ${iconPath}`)
console.log(`🔧 工具: ${rceditPath}`)
console.log('')

try {
  // 1. 设置图标
  console.log('1️⃣ 设置图标...')
  execSync(`"${rceditPath}" "${exePath}" --set-icon "${iconPath}"`, { stdio: 'inherit' })
  console.log('   ✅ 图标已设置')
  
  // 2. 设置产品名称
  console.log('2️⃣ 设置产品名称...')
  execSync(`"${rceditPath}" "${exePath}" --set-version-string "ProductName" "IWork"`, { stdio: 'inherit' })
  console.log('   ✅ 产品名称已设置')
  
  // 3. 设置文件描述
  console.log('3️⃣ 设置文件描述...')
  execSync(`"${rceditPath}" "${exePath}" --set-version-string "FileDescription" "IWork - 实用开发工具合集"`, { stdio: 'inherit' })
  console.log('   ✅ 文件描述已设置')
  
  // 4. 设置公司名称
  console.log('4️⃣ 设置公司名称...')
  execSync(`"${rceditPath}" "${exePath}" --set-version-string "CompanyName" "IWork"`, { stdio: 'inherit' })
  console.log('   ✅ 公司名称已设置')
  
  // 5. 设置版权信息
  console.log('5️⃣ 设置版权信息...')
  execSync(`"${rceditPath}" "${exePath}" --set-version-string "LegalCopyright" "Copyright © 2025 IWork"`, { stdio: 'inherit' })
  console.log('   ✅ 版权信息已设置')
  
  // 6. 设置文件版本
  console.log('6️⃣ 设置文件版本...')
  execSync(`"${rceditPath}" "${exePath}" --set-file-version "1.0.0.0"`, { stdio: 'inherit' })
  console.log('   ✅ 文件版本已设置')
  
  // 7. 设置产品版本
  console.log('7️⃣ 设置产品版本...')
  execSync(`"${rceditPath}" "${exePath}" --set-product-version "1.0.0.0"`, { stdio: 'inherit' })
  console.log('   ✅ 产品版本已设置')
  
  // 8. 重命名为 IWork.exe
  console.log('8️⃣ 重命名为 IWork.exe...')
  fs.renameSync(exePath, iworkExePath)
  console.log('   ✅ 已重命名')
  
  console.log('')
  console.log('========================================')
  console.log('✅ 修复完成！')
  console.log('========================================')
  console.log('')
  console.log(`📁 新文件: ${iworkExePath}`)
  
} catch (error) {
  console.error('')
  console.error('❌ 修复失败:', error.message)
  process.exit(1)
}



