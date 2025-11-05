<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="hero-section">
      <div class="hero-content">
        <!-- Logo 头像 -->
        <div class="hero-logo">
          <img src="/build/icon.png" alt="IWork" class="logo-image" />
        </div>
        <h1 class="hero-title">
          <span class="neon-text">IWork</span>
        </h1>
        <p class="hero-subtitle">功能强大的在线工具集合 · 简洁高效 · 开箱即用</p>
        <transition name="slogan-fade" mode="out-in">
          <p :key="currentSloganIndex" class="hero-slogan">{{ currentSlogan }} 💪</p>
        </transition>
        
        <!-- 全局搜索 -->
        <div class="search-box">
          <div class="search-icon-wrapper">
            <i class="i-mdi-magnify search-icon" />
          </div>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索工具... (Ctrl+K)"
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <div v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">
            <i class="i-mdi-close" />
          </div>
        </div>

        <!-- 快速统计 -->
        <div class="stats-row">
          <div class="stat-item">
            <i class="i-mdi-tools" />
            <span class="stat-number">{{ totalTools }}</span>
            <span class="stat-label">个工具</span>
          </div>
          <div class="stat-item">
            <i class="i-mdi-folder-multiple" />
            <span class="stat-number">{{ categories.length }}</span>
            <span class="stat-label">个分类</span>
          </div>
          <div class="stat-item">
            <i class="i-mdi-update" />
            <span class="stat-label">持续更新</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 工具分类展示 -->
    <div class="categories-section">
      <h2 class="section-title">
        <i class="i-mdi-view-grid" />
        工具分类
      </h2>
      
      <div class="categories-grid">
        <div
          v-for="category in filteredCategories"
          :key="category.id"
          class="category-card"
          @click="handleCategoryClick(category)"
        >
          <div class="category-header">
            <i :class="category.icon" class="category-icon" />
            <h3 class="category-name">{{ category.title }}</h3>
            <span class="category-count">{{ category.children.length }}</span>
          </div>
          <div class="category-tools">
            <div
              v-for="tool in category.children"
              :key="tool.path"
              class="tool-tag"
              @click.stop="navigateToTool(tool.path)"
            >
              <i :class="tool.icon" />
              {{ tool.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 特色功能 -->
    <div class="features-section">
      <h2 class="section-title">
        <i class="i-mdi-sparkles" />
        特色功能
      </h2>
      
      <div class="features-grid">
        <div class="feature-card">
          <i class="i-mdi-lightning-bolt feature-icon" />
          <h3>快速高效</h3>
          <p>所有工具本地运行，无需上传数据，保护隐私</p>
        </div>
        <div class="feature-card">
          <i class="i-mdi-palette feature-icon" />
          <h3>霓虹风格</h3>
          <p>独特的赛博朋克霓虹设计，带来酷炫体验</p>
        </div>
        <div class="feature-card">
          <i class="i-mdi-monitor-multiple feature-icon" />
          <h3>双端支持</h3>
          <p>Web版和桌面版，随时随地使用</p>
        </div>
        <div class="feature-card">
          <i class="i-mdi-update feature-icon" />
          <h3>持续更新</h3>
          <p>不断添加新工具，优化用户体验</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')

// 打工人哲学 Slogan 列表
const slogans = [
  '我打工，故我卑微；我加班，故我存在',
  '他人即地狱，老板更是地狱中的地狱',
  '不知是我在打工，还是工作在打我',
  '某天早上醒来，发现自己变成了一只打工虫',
  '人生天地间，若白驹过隙，唯有工作最漫长',
  '世上本没有内卷，打工的人多了，便有了内卷',
  '未经反思的打工不值得过，但反思了更痛苦',
  '凝视深渊的打工人，最终也被深渊所凝视',
  '打工是西西弗斯的巨石，日复一日永无止境',
  '人生即痛苦，打工是痛苦的具象化',
  '向死而生，向钱而卷，此即打工人的宿命',
  '打工前，山是山；打工后，山还是山，但我已爬不动',
  '天地不仁，以万物为刍狗；老板不仁，以打工人为牛马',
  '人不能两次踏进同一条河流，但能无数次踏进同一个办公室',
  '打工是枷锁，自由只在梦里',
  '生老病死之外，还有第五苦：打工',
  '打工人创造价值，却只能得到工资',
  '自由意志？那是打工之前的幻觉',
  '人之初，性本善；打工后，性本累',
  '知行合一？先让我周末能合眼',
]

// 当前 Slogan 索引
const currentSloganIndex = ref(0)

// 当前 Slogan
const currentSlogan = computed(() => slogans[currentSloganIndex.value])

// Slogan 定时器
let sloganTimer: ReturnType<typeof setInterval> | null = null

// 工具分类数据（与 Sidebar.vue 保持一致）
const categories = [
  {
    id: 'text-processing',
    title: '📝 文本处理',
    icon: 'i-mdi-text-box-multiple',
    children: [
      { path: '/tools/json-formatter', title: 'JSON 格式化', icon: 'i-mdi-code-json', description: '格式化、压缩、校验 JSON 数据' },
      { path: '/tools/xml-yaml', title: 'XML/YAML 转换', icon: 'i-mdi-file-xml-box', description: 'XML、YAML、JSON 格式互转' },
      { path: '/tools/sql-formatter', title: 'SQL 格式化', icon: 'i-mdi-database-edit', description: 'SQL 语句格式化与美化' },
      { path: '/tools/text-diff', title: '文本对比', icon: 'i-mdi-file-compare', description: '文本差异对比工具' },
      { path: '/tools/regex', title: '正则表达式', icon: 'i-mdi-regex', description: '正则表达式测试与匹配' },
      { path: '/tools/doc-to-markdown', title: '文档转 Markdown', icon: 'i-mdi-file-document-arrow-right', description: 'Word 文档转 Markdown' },
      { path: '/tools/profile-merger', title: 'Profile 配置合成', icon: 'i-mdi-file-settings', description: '合并 Spring Boot 多环境配置' },
      { path: '/tools/log-analyzer', title: '日志片段分析', icon: 'i-mdi-text-search', description: '日志分级高亮、异常定位' },
    ]
  },
  {
    id: 'encoding-crypto',
    title: '🔐 编码加密',
    icon: 'i-mdi-shield-lock',
    children: [
      { path: '/tools/base64', title: 'Base64 编解码', icon: 'i-mdi-file-code-outline', description: 'Base64 编码解码工具' },
      { path: '/tools/url-encoder', title: 'URL 编码', icon: 'i-mdi-link-variant', description: 'URL 编码与解码' },
      { path: '/tools/hash', title: '哈希计算', icon: 'i-mdi-fingerprint', description: 'MD5、SHA 等哈希计算' },
      { path: '/tools/encrypt', title: '加密解密', icon: 'i-mdi-lock-outline', description: 'AES、DES、RSA 加密解密' },
      { path: '/tools/unicode', title: 'Unicode 转换', icon: 'i-mdi-format-letter-case', description: 'Unicode、HTML 实体编码转换' },
      { path: '/tools/encoding', title: '编码格式转换', icon: 'i-mdi-file-swap', description: 'UTF-8、GBK、GB2312 互转' },
      { path: '/tools/file-hash', title: '文件哈希校验', icon: 'i-mdi-shield-check', description: 'MD5/SHA1/SHA256/SHA512 哈希' },
    ]
  },
  {
    id: 'auth-security',
    title: '🔑 认证安全',
    icon: 'i-mdi-key-variant',
    children: [
      { path: '/tools/jwt', title: 'JWT 解析', icon: 'i-mdi-key-chain', description: 'JWT Token 解析与验证' },
    ]
  },
  {
    id: 'time-schedule',
    title: '⏰ 时间调度',
    icon: 'i-mdi-clock-outline',
    children: [
      { path: '/tools/timestamp', title: '时间戳转换', icon: 'i-mdi-clock-digital', description: 'Unix 时间戳与日期转换' },
      { path: '/tools/cron', title: 'Cron 表达式', icon: 'i-mdi-calendar-clock', description: 'Cron 表达式生成与解析' },
      { path: '/tools/time-calculator', title: '时间计算器', icon: 'i-mdi-calculator-variant', description: '日期时间加减运算' },
    ]
  },
  {
    id: 'image-tools',
    title: '🖼️ 图片工具',
    icon: 'i-mdi-image-multiple',
    children: [
      { path: '/tools/image-compressor', title: '图片压缩', icon: 'i-mdi-image-size-select-actual', description: '在线压缩 JPG/PNG/WebP' },
      { path: '/tools/image-converter', title: '图片格式转换', icon: 'i-mdi-image-sync', description: 'JPG/PNG/WebP/GIF 互转' },
      { path: '/tools/image-cropper', title: '图片裁剪缩放', icon: 'i-mdi-crop', description: '裁剪图片、调整尺寸' },
    ]
  },
  {
    id: 'dev-tools',
    title: '🔧 开发工具',
    icon: 'i-mdi-tools',
    children: [
      { path: '/tools/uuid', title: 'UUID 生成', icon: 'i-mdi-identifier', description: '生成 UUID/GUID' },
      { path: '/tools/random-generator', title: '随机数据生成', icon: 'i-mdi-dice-multiple', description: '生成随机字符串、模拟数据' },
      { path: '/tools/number-base', title: '进制转换', icon: 'i-mdi-numeric', description: '十进制、十六进制、二进制转换' },
      { path: '/tools/qrcode', title: '二维码生成', icon: 'i-mdi-qrcode', description: '支持文本、网址、名片、WiFi、Logo等' },
      { path: '/tools/unit-converter', title: '单位换算器', icon: 'i-mdi-swap-horizontal', description: '长度、重量、温度等单位互转' },
      { path: '/tools/color-converter', title: '颜色转换器', icon: 'i-mdi-palette', description: 'HEX、RGB、HSL 颜色格式互转' },
    ]
  },
  {
    id: 'java-tools',
    title: '💻 Java 工具',
    icon: 'i-mdi-language-java',
    children: [
      { path: '/tools/json-to-java', title: 'JSON 转 Java', icon: 'i-mdi-code-braces', description: 'JSON 转 Java 实体类' },
      { path: '/tools/exception-parser', title: '异常堆栈分析', icon: 'i-mdi-bug', description: 'Java 异常堆栈美化与分析' },
      { path: '/tools/maven-search', title: 'Maven 依赖', icon: 'i-mdi-package-variant', description: 'Maven 依赖坐标查询' },
    ]
  },
  {
    id: 'network-tools',
    title: '🌐 网络工具',
    icon: 'i-mdi-web',
    children: [
      { path: '/tools/http-client', title: 'HTTP 测试', icon: 'i-mdi-api', description: 'HTTP 请求测试工具' },
      { path: '/tools/ip-query', title: 'IP 查询', icon: 'i-mdi-ip-network', description: '查询 IP 地址详细信息' },
      { path: '/tools/ssh', title: 'SSH 连接', icon: 'i-mdi-console', description: '连接远程服务器' },
      { path: '/tools/mysql', title: 'MySQL 查询', icon: 'i-mdi-database', description: '通过SSH连接MySQL数据库' },
      { path: '/tools/redis', title: 'Redis 管理', icon: 'i-mdi-database-clock', description: '连接Redis数据库，管理键值' },
      { path: '/tools/command-history', title: '命令历史', icon: 'i-mdi-history', description: '终端命令历史管理' },
      { path: '/tools/port-scanner', title: '端口扫描', icon: 'i-mdi-lan-connect', description: '扫描服务器开放端口' },
      { path: '/tools/ip-scanner', title: 'IP 扫描器', icon: 'i-mdi-ip-network-outline', description: '扫描局域网 IP 地址' },
      { path: '/tools/websocket', title: 'WebSocket 测试', icon: 'i-mdi-connection', description: '连接 WebSocket 服务器' },
    ]
  },
  {
    id: 'knowledge-management',
    title: '📚 知识管理',
    icon: 'i-mdi-book-open-variant',
    children: [
      { path: '/tools/knowledge', title: '知识库', icon: 'i-mdi-book-open-page-variant', description: '个人知识管理，支持文本和图片' },
      { path: '/tools/snippets', title: '代码片段', icon: 'i-mdi-code-braces-box', description: '管理和使用代码片段' },
      { path: '/tools/bookmarks', title: '网页收藏夹', icon: 'i-mdi-bookmark-multiple', description: '管理常用网站和资源链接' },
    ]
  },
  {
    id: 'utility-tools',
    title: '🎯 实用工具',
    icon: 'i-mdi-apps',
    children: [
      { path: '/tools/clipboard-history', title: '剪贴板历史', icon: 'i-mdi-clipboard-text-clock', description: '自动记录复制的文本内容' },
      { path: '/tools/screenshot', title: '截图工具', icon: 'i-mdi-camera-outline', description: '快速截取屏幕或窗口' },
      { path: '/tools/system-monitor', title: '系统监控', icon: 'i-mdi-monitor-dashboard', description: '实时监控 CPU、内存、磁盘' },
      { path: '/tools/weather', title: '天气查询', icon: 'i-mdi-weather-partly-cloudy', description: '查看多个城市的天气预报' },
      { path: '/tools/calculator', title: '计算器', icon: 'i-carbon-calculator', description: '支持历史记录和时间旅行' },
    ]
  },
  {
    id: 'entertainment',
    title: '🔥 热榜聚合',
    icon: 'i-mdi-fire',
    children: [
      { path: '/tools/entertainment', title: '热榜聚合', icon: 'i-mdi-trending-up', description: '实时聚合各大平台热门话题' },
    ]
  },
]

// 计算总工具数
const totalTools = computed(() => {
  return categories.reduce((sum, cat) => sum + cat.children.length, 0)
})

// 过滤分类
const filteredCategories = computed(() => {
  if (!searchKeyword.value) return categories
  
  const keyword = searchKeyword.value.toLowerCase()
  return categories
    .map(cat => ({
      ...cat,
      children: cat.children.filter(tool => 
        tool.title.toLowerCase().includes(keyword) ||
        tool.description.toLowerCase().includes(keyword)
      )
    }))
    .filter(cat => cat.children.length > 0)
})

// 导航到工具
function navigateToTool(path: string) {
  router.push(path)
}

// 分类点击
function handleCategoryClick(category: any) {
  if (category.children.length > 0) {
    navigateToTool(category.children[0].path)
  }
}

// 搜索
function handleSearch() {
  if (filteredCategories.value.length > 0 && filteredCategories.value[0].children.length > 0) {
    navigateToTool(filteredCategories.value[0].children[0].path)
  }
}

// 快捷键
function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    document.querySelector<HTMLInputElement>('.search-input')?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  
  // 启动 Slogan 轮播定时器（每1分钟切换一次）
  sloganTimer = setInterval(() => {
    currentSloganIndex.value = (currentSloganIndex.value + 1) % slogans.length
  }, 60000) // 60000ms = 1分钟
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  
  // 清除 Slogan 定时器
  if (sloganTimer) {
    clearInterval(sloganTimer)
    sloganTimer = null
  }
})
</script>

<style scoped>
.home-page {
  min-height: 100%;
  padding: var(--spacing-xl);
  overflow-y: auto;
}

/* 欢迎横幅 */
.hero-section {
  position: relative;
  padding: var(--spacing-4xl) var(--spacing-xl);
  margin-bottom: var(--spacing-4xl);
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.1) 0%, rgba(155, 92, 255, 0.1) 100%);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-xl);
  box-shadow: 
    inset 0 0 60px rgba(33, 230, 255, 0.1),
    0 0 30px rgba(33, 230, 255, 0.3);
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 50%, rgba(33, 230, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(155, 92, 255, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  text-align: center;
  z-index: 1;
}

.hero-logo {
  display: flex;
  justify-content: center;
  margin-bottom: var(--spacing-xl);
}

.logo-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid var(--neon-cyan);
  box-shadow: 
    0 0 20px rgba(33, 230, 255, 0.6),
    0 0 40px rgba(33, 230, 255, 0.4),
    inset 0 0 20px rgba(33, 230, 255, 0.2);
  animation: logoFloat 3s ease-in-out infinite;
  object-fit: cover;
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-title {
  font-size: 3.5em;
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-md);
  font-family: var(--font-family-display);
}

.neon-text {
  font-size: 3rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-purple) 50%, var(--neon-pink) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 
    0 0 10px rgba(33, 230, 255, 0.8),
    0 0 20px rgba(33, 230, 255, 0.6),
    0 0 30px rgba(33, 230, 255, 0.4),
    0 0 40px rgba(155, 92, 255, 0.4);
  animation: neonPulse 2s ease-in-out infinite;
}

@keyframes neonPulse {
  0%, 100% {
    text-shadow: 
      0 0 10px rgba(33, 230, 255, 0.8),
      0 0 20px rgba(33, 230, 255, 0.6),
      0 0 30px rgba(33, 230, 255, 0.4);
  }
  50% {
    text-shadow: 
      0 0 15px rgba(33, 230, 255, 1),
      0 0 30px rgba(33, 230, 255, 0.8),
      0 0 45px rgba(33, 230, 255, 0.6),
      0 0 60px rgba(155, 92, 255, 0.6);
  }
}

.hero-subtitle {
  font-size: var(--font-size-xl);
  color: var(--color-muted);
  margin-bottom: var(--spacing-md);
}

.hero-slogan {
  font-size: 1.1rem;
  color: var(--neon-yellow);
  margin-top: var(--spacing-md);
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 
    0 0 10px rgba(208, 255, 0, 0.6),
    0 0 20px rgba(208, 255, 0, 0.4);
  animation: sloganGlow 2s ease-in-out infinite;
}

/* Slogan 淡入淡出过渡动画 */
.slogan-fade-enter-active,
.slogan-fade-leave-active {
  transition: all 0.5s ease;
}

.slogan-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slogan-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes sloganGlow {
  0%, 100% {
    text-shadow: 
      0 0 10px rgba(208, 255, 0, 0.6),
      0 0 20px rgba(208, 255, 0, 0.4);
  }
  50% {
    text-shadow: 
      0 0 15px rgba(208, 255, 0, 0.8),
      0 0 30px rgba(208, 255, 0, 0.6),
      0 0 45px rgba(208, 255, 0, 0.4);
  }
}

/* 搜索框 */
.search-box {
  position: relative;
  max-width: 600px;
  margin: 0 auto var(--spacing-2xl);
  display: flex;
  align-items: center;
}

.search-icon-wrapper {
  position: absolute;
  left: var(--spacing-xl);
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
}

.search-icon {
  font-size: 1.5em;
  color: var(--neon-cyan);
  display: block;
}

.search-input {
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-lg) 60px;
  background: rgba(10, 14, 39, 0.6);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-full);
  font-size: var(--font-size-lg);
  color: var(--color-text);
  outline: none;
  transition: all var(--transition-base);
  box-shadow: inset 0 0 20px rgba(33, 230, 255, 0.1);
}

.search-input:focus {
  border-color: var(--neon-cyan-lighter);
  box-shadow: 
    inset 0 0 30px rgba(33, 230, 255, 0.2),
    0 0 20px rgba(33, 230, 255, 0.4);
}

.search-clear {
  position: absolute;
  right: var(--spacing-lg);
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--transition-base);
}

.search-clear:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 统计行 */
.stats-row {
  display: flex;
  justify-content: center;
  gap: var(--spacing-2xl);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid var(--neon-cyan);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-lg);
}

.stat-item i {
  font-size: 1.5em;
  color: var(--neon-cyan);
}

.stat-number {
  font-size: 1.5em;
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  font-family: var(--font-family-mono);
}

.stat-label {
  color: var(--color-muted);
}

/* 分类网格 */
.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-xl);
  color: var(--neon-lime);
  font-family: var(--font-family-display);
}

.section-title i {
  font-size: 1.2em;
}

.categories-section {
  margin-bottom: var(--spacing-4xl);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-xl);
}

.category-card {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, var(--color-panel) 0%, var(--color-panel-light) 100%);
  border: 2px solid var(--neon-lime);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: inset 0 0 30px rgba(208, 255, 0, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.category-card:hover {
  border-color: var(--neon-lime-light);
  transform: translateY(-4px);
  box-shadow: 
    inset 0 0 40px rgba(208, 255, 0, 0.1),
    0 8px 30px rgba(208, 255, 0, 0.3);
}

.category-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.category-icon {
  font-size: 2em;
  color: var(--neon-lime);
}

.category-name {
  flex: 1;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.category-count {
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(208, 255, 0, 0.2);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--neon-lime);
}

.category-tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  flex: 1;
  align-content: flex-start;
}

.tool-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md);
  background: rgba(208, 255, 0, 0.1);
  border: 1px solid rgba(208, 255, 0, 0.3);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text);
  transition: all var(--transition-base);
}

.tool-tag:hover {
  background: rgba(208, 255, 0, 0.2);
  border-color: var(--neon-lime);
  transform: scale(1.05);
}

.tool-tag i {
  color: var(--neon-lime);
}

/* 特色功能 */
.features-section {
  margin-bottom: var(--spacing-4xl);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-xl);
}

.feature-card {
  padding: var(--spacing-2xl);
  text-align: center;
  background: linear-gradient(135deg, var(--color-panel) 0%, var(--color-panel-light) 100%);
  border: 2px solid var(--neon-pink);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.feature-card:hover {
  border-color: var(--neon-pink-light);
  transform: translateY(-4px);
  box-shadow: 
    inset 0 0 30px rgba(255, 42, 161, 0.1),
    0 8px 30px rgba(255, 42, 161, 0.3);
}

.feature-icon {
  font-size: 3em;
  color: var(--neon-pink);
  margin-bottom: var(--spacing-md);
}

.feature-card h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-sm);
  color: var(--neon-pink);
}

.feature-card p {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
  margin: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2em;
  }
  
  .categories-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
