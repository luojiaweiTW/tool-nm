const { execSync } = require('child_process')

function killPort(port) {
  try {
    console.log(`正在检查端口 ${port}...`)
    
    // Windows: 查找占用端口的进程
    const findCmd = `netstat -ano | findstr :${port}`
    const result = execSync(findCmd, { encoding: 'utf-8' })
    
    if (result) {
      // 提取 PID
      const lines = result.split('\n').filter(line => line.trim())
      const pids = new Set()
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/)
        const pid = parts[parts.length - 1]
        if (pid && !isNaN(pid)) {
          pids.add(pid)
        }
      })
      
      // 杀掉所有占用该端口的进程
      pids.forEach(pid => {
        try {
          console.log(`正在终止进程 PID ${pid}...`)
          execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' })
          console.log(`✓ 已终止进程 PID ${pid}`)
        } catch (e) {
          // 忽略已经不存在的进程
        }
      })
      
      console.log(`✓ 端口 ${port} 已释放`)
    } else {
      console.log(`✓ 端口 ${port} 未被占用`)
    }
  } catch (error) {
    // 端口未被占用或查询失败
    console.log(`✓ 端口 ${port} 可用`)
  }
}

// 杀掉 5173 端口
killPort(5173)

// 等待一下确保端口释放
setTimeout(() => {
  console.log('端口检查完成，准备启动应用...\n')
}, 500)

