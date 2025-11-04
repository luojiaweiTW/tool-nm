<template>
  <aside
    :class="[
      'neon-sidebar',
      {
        'neon-sidebar--collapsed': isCollapsed,
      }
    ]"
  >
    <!-- 顶部 Logo 区域 -->
    <div class="neon-sidebar__header">
      <div class="neon-sidebar__logo">
        <div class="neon-sidebar__logo-icon">
          <el-icon><Tools /></el-icon>
        </div>
        <transition name="sidebar">
          <span v-show="!isCollapsed" class="neon-sidebar__logo-text">
            IWork
          </span>
        </transition>
      </div>
    </div>

    <!-- 搜索框 -->
    <div v-show="!isCollapsed" class="neon-sidebar__search">
      <div class="neon-sidebar__search-wrapper">
        <i class="i-mdi-magnify neon-sidebar__search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索工具... (Ctrl+K)"
          class="neon-sidebar__search-input"
          @focus="isSearchFocused = true"
          @blur="isSearchFocused = false"
        />
      </div>
    </div>

    <!-- 折叠时的搜索图标 -->
    <div v-show="isCollapsed" class="neon-sidebar__search-collapsed" @click="handleExpandForSearch">
      <i class="i-mdi-magnify" />
    </div>

    <!-- 菜单 -->
    <el-menu
      :default-active="activeRoute"
      class="neon-sidebar__menu"
      :collapse="isCollapsed"
      :collapse-transition="false"
      @select="handleMenuSelect"
    >
      <template v-for="category in filteredCategories">
        <!-- 一级分类（含子菜单） -->
        <el-sub-menu
          v-if="category.children && category.children.length > 0"
          :key="category.id"
          :index="category.id"
          class="neon-menu-category"
        >
          <template #title>
            <i :class="category.icon" class="neon-menu-item__icon" />
            <span>{{ category.title }}</span>
          </template>
          <!-- 二级菜单项 -->
          <el-menu-item
            v-for="item in category.children"
            :key="item.path"
            :index="item.path"
            class="neon-menu-item neon-menu-item--sub"
          >
            <i :class="item.icon" class="neon-menu-item__icon" />
            <template #title>
              {{ item.title }}
            </template>
          </el-menu-item>
        </el-sub-menu>

        <!-- 一级菜单（无子菜单） -->
        <el-menu-item
          v-else
          :key="'menu-' + category.id"
          :index="category.path || category.id"
          class="neon-menu-item"
        >
          <i :class="category.icon" class="neon-menu-item__icon" />
          <template #title>
            {{ category.title }}
          </template>
        </el-menu-item>
      </template>
    </el-menu>

    <!-- 底部折叠按钮 -->
    <div class="neon-sidebar__footer">
      <div class="neon-sidebar__collapse-btn" @click="toggleCollapse">
        <i :class="isCollapsed ? 'i-mdi-chevron-right' : 'i-mdi-chevron-left'" />
        <transition name="sidebar">
          <span v-show="!isCollapsed" class="neon-sidebar__collapse-text">
            折叠侧栏
          </span>
        </transition>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { Tools } from '@element-plus/icons-vue'

interface MenuItem {
  path: string
  title: string
  icon: string
  description?: string
}

interface MenuCategory {
  id: string
  title: string
  icon: string
  path?: string
  children?: MenuItem[]
}

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()

const searchQuery = ref('')
const isSearchFocused = ref(false)

const isCollapsed = computed(() => uiStore.sidebarCollapsed)

// 多级菜单结构
const menuCategories: MenuCategory[] = [
  {
    id: 'home',
    title: '🏠 首页',
    icon: 'i-mdi-home',
    path: '/',
  },
  {
    id: 'text-processing',
    title: '📝 文本处理',
    icon: 'i-mdi-text-box-multiple',
    children: [
      {
        path: '/tools/json-formatter',
        title: 'JSON 格式化',
        icon: 'i-mdi-code-json',
        description: '格式化、压缩、校验 JSON 数据',
      },
      {
        path: '/tools/xml-yaml',
        title: 'XML/YAML 转换',
        icon: 'i-mdi-file-xml-box',
        description: 'XML、YAML、JSON 格式互转',
      },
      {
        path: '/tools/sql-formatter',
        title: 'SQL 格式化',
        icon: 'i-mdi-database-edit',
        description: 'SQL 语句格式化与美化',
      },
      {
        path: '/tools/text-diff',
        title: '文本对比',
        icon: 'i-mdi-file-compare',
        description: '文本差异对比工具',
      },
      {
        path: '/tools/regex',
        title: '正则表达式',
        icon: 'i-mdi-regex',
        description: '正则表达式测试与匹配',
      },
      {
        path: '/tools/doc-to-markdown',
        title: '文档转 Markdown',
        icon: 'i-mdi-file-document-arrow-right',
        description: 'Word 文档转 Markdown，提取图片并打包',
      },
    ]
  },
  {
    id: 'encoding-crypto',
    title: '🔐 编码加密',
    icon: 'i-mdi-shield-lock',
    children: [
      {
        path: '/tools/base64',
        title: 'Base64 编解码',
        icon: 'i-mdi-file-code-outline',
        description: 'Base64 编码解码工具',
      },
      {
        path: '/tools/url-encoder',
        title: 'URL 编码',
        icon: 'i-mdi-link-variant',
        description: 'URL 编码与解码',
      },
      {
        path: '/tools/hash',
        title: '哈希计算',
        icon: 'i-mdi-fingerprint',
        description: 'MD5、SHA 等哈希计算',
      },
      {
        path: '/tools/encrypt',
        title: '加密解密',
        icon: 'i-mdi-lock-outline',
        description: 'AES、DES、RSA 加密解密',
      },
      {
        path: '/tools/unicode',
        title: 'Unicode 转换',
        icon: 'i-mdi-format-letter-case',
        description: 'Unicode、HTML 实体编码转换',
      },
      {
        path: '/tools/encoding',
        title: '编码格式转换',
        icon: 'i-mdi-file-swap',
        description: 'UTF-8、GBK、GB2312 等编码格式互转',
      },
      {
        path: '/tools/file-hash',
        title: '文件哈希校验',
        icon: 'i-mdi-shield-check',
        description: 'MD5/SHA1/SHA256/SHA512 哈希计算',
      },
    ]
  },
  {
    id: 'auth-security',
    title: '🔑 认证安全',
    icon: 'i-mdi-key-variant',
    children: [
      {
        path: '/tools/jwt',
        title: 'JWT 解析',
        icon: 'i-mdi-key-chain',
        description: 'JWT Token 解析与验证',
      },
    ]
  },
  {
    id: 'time-schedule',
    title: '⏰ 时间调度',
    icon: 'i-mdi-clock-outline',
    children: [
      {
        path: '/tools/timestamp',
        title: '时间戳转换',
        icon: 'i-mdi-clock-digital',
        description: 'Unix 时间戳与日期时间转换',
      },
      {
        path: '/tools/cron',
        title: 'Cron 表达式',
        icon: 'i-mdi-calendar-clock',
        description: 'Cron 表达式生成与解析',
      },
    ]
  },
  {
    id: 'image-tools',
    title: '🖼️ 图片工具',
    icon: 'i-mdi-image-multiple',
    children: [
      {
        path: '/tools/image-compressor',
        title: '图片压缩',
        icon: 'i-mdi-image-size-select-actual',
        description: '在线压缩 JPG/PNG/WebP 图片',
      },
      {
        path: '/tools/image-converter',
        title: '图片格式转换',
        icon: 'i-mdi-image-sync',
        description: 'JPG/PNG/WebP/GIF 格式互转',
      },
      {
        path: '/tools/image-cropper',
        title: '图片裁剪缩放',
        icon: 'i-mdi-crop',
        description: '裁剪图片、调整尺寸、预设比例',
      },
    ]
  },
  {
    id: 'dev-tools',
    title: '🔧 开发工具',
    icon: 'i-mdi-tools',
    children: [
      {
        path: '/tools/uuid',
        title: 'UUID 生成',
        icon: 'i-mdi-identifier',
        description: '生成 UUID/GUID',
      },
      {
        path: '/tools/random-generator',
        title: '随机数据生成',
        icon: 'i-mdi-dice-multiple',
        description: '生成随机字符串、模拟数据',
      },
      {
        path: '/tools/number-base',
        title: '进制转换',
        icon: 'i-mdi-numeric',
        description: '十进制、十六进制、二进制转换',
      },
      {
        path: '/tools/qrcode',
        title: '二维码生成',
        icon: 'i-mdi-qrcode',
        description: '支持文本、网址、名片、WiFi、Logo等',
      },
      {
        path: '/tools/unit-converter',
        title: '单位换算器',
        icon: 'i-mdi-swap-horizontal',
        description: '长度、重量、温度、面积、体积、时间、存储、速度等单位互转',
      },
      {
        path: '/tools/color-converter',
        title: '颜色转换器',
        icon: 'i-mdi-palette',
        description: 'HEX、RGB、HSL、RGBA、HSLA 颜色格式互转',
      },
    ]
  },
  {
    id: 'java-tools',
    title: '💻 Java 工具',
    icon: 'i-mdi-language-java',
    children: [
      {
        path: '/tools/json-to-java',
        title: 'JSON 转 Java',
        icon: 'i-mdi-code-braces',
        description: 'JSON 转 Java 实体类',
      },
      {
        path: '/tools/exception-parser',
        title: '异常堆栈分析',
        icon: 'i-mdi-bug',
        description: 'Java 异常堆栈美化与分析',
      },
      {
        path: '/tools/maven-search',
        title: 'Maven 依赖',
        icon: 'i-mdi-package-variant',
        description: 'Maven 依赖坐标查询',
      },
    ]
  },
  {
    id: 'network-tools',
    title: '🌐 网络工具',
    icon: 'i-mdi-web',
    children: [
      {
        path: '/tools/http-client',
        title: 'HTTP 测试',
        icon: 'i-mdi-api',
        description: 'HTTP 请求测试工具',
      },
      {
        path: '/tools/ip-query',
        title: 'IP 查询',
        icon: 'i-mdi-ip-network',
        description: '查询 IP 地址的地理位置、运营商、ASN、IP类型等详细信息',
      },
      {
        path: '/tools/ssh',
        title: 'SSH 连接',
        icon: 'i-mdi-console',
        description: '连接远程服务器',
      },
      {
        path: '/tools/command-history',
        title: '命令历史',
        icon: 'i-mdi-history',
        description: '终端命令历史管理和收藏夹',
      },
      {
        path: '/tools/port-scanner',
        title: '端口扫描',
        icon: 'i-mdi-lan-connect',
        description: '扫描服务器开放端口，支持多种扫描模式',
      },
      {
        path: '/tools/ip-scanner',
        title: 'IP 扫描器',
        icon: 'i-mdi-ip-network-outline',
        description: '扫描局域网中的 IP 地址使用情况',
      },
      {
        path: '/tools/websocket',
        title: 'WebSocket 测试',
        icon: 'i-mdi-connection',
        description: '连接 WebSocket 服务器，测试实时通信',
      },
    ]
  },
  {
    id: 'knowledge-management',
    title: '📚 知识管理',
    icon: 'i-mdi-book-open-variant',
    children: [
      {
        path: '/tools/knowledge',
        title: '知识库',
        icon: 'i-mdi-book-open-page-variant',
        description: '个人知识管理，支持文本和图片',
      },
      {
        path: '/tools/snippets',
        title: '代码片段',
        icon: 'i-mdi-code-braces-box',
        description: '管理和使用你的代码片段',
      },
      {
        path: '/tools/bookmarks',
        title: '网页收藏夹',
        icon: 'i-mdi-bookmark-multiple',
        description: '管理你的常用网站和资源链接',
      },
    ]
  },
  {
    id: 'utility-tools',
    title: '🎯 实用工具',
    icon: 'i-mdi-apps',
    children: [
      {
        path: '/tools/clipboard-history',
        title: '剪贴板历史',
        icon: 'i-mdi-clipboard-text-clock',
        description: '自动记录复制的文本内容',
      },
      {
        path: '/tools/screenshot',
        title: '截图工具',
        icon: 'i-mdi-camera-outline',
        description: '快速截取屏幕或窗口',
      },
      {
        path: '/tools/system-monitor',
        title: '系统监控',
        icon: 'i-mdi-monitor-dashboard',
        description: '实时监控 CPU、内存、磁盘等系统资源',
      },
      {
        path: '/tools/weather',
        title: '天气查询',
        icon: 'i-mdi-weather-partly-cloudy',
        description: '查看多个城市的实时天气和天气预报',
      },
    ]
  },
  {
    id: 'entertainment',
    title: '🔥 热榜聚合',
    icon: 'i-mdi-fire',
    children: [
      {
        path: '/tools/entertainment',
        title: '热榜聚合',
        icon: 'i-mdi-trending-up',
        description: '实时聚合各大平台热门话题',
      },
    ]
  },
]

// 使用ref而不是computed，避免每次路由变化都触发整个侧边栏重渲染
const activeRoute = ref(route.path)

// 使用watch单独更新activeRoute，不触发整个组件渲染
watch(() => route.path, (newPath) => {
  activeRoute.value = newPath
}, { flush: 'post' }) // 在DOM更新后执行，减少渲染次数

// 扁平化所有菜单项（用于搜索和最近使用）
const allMenuItems = computed(() => {
  const items: MenuItem[] = []
  menuCategories.forEach(category => {
    if (category.children) {
      items.push(...category.children)
    }
  })
  return items
})

// 搜索过滤
const filteredCategories = computed(() => {
  if (!searchQuery.value) return menuCategories
  
  const query = searchQuery.value.toLowerCase()
  
  // 过滤出匹配的分类和子项
  return menuCategories
    .map(category => {
      // 检查分类名是否匹配
      const categoryMatches = category.title.toLowerCase().includes(query)
      
      // 过滤子项
      const filteredChildren = category.children?.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      ) || []
      
      // 如果分类名匹配，保留所有子项；否则只保留匹配的子项
      if (categoryMatches) {
        return category
      } else if (filteredChildren.length > 0) {
        return {
          ...category,
          children: filteredChildren
        }
      }
      return null
    })
    .filter(Boolean) as MenuCategory[]
})

// 防抖处理路由跳转
let navigateTimer: ReturnType<typeof setTimeout> | null = null

const handleMenuSelect = (path: string) => {
  // 如果是分类，不处理
  if (!path.startsWith('/')) return
  
  // 如果已经在当前路由，不处理
  if (route.path === path) return
  
  // 清除之前的定时器，防止重复点击
  if (navigateTimer) {
    clearTimeout(navigateTimer)
  }
  
  // 立即跳转，不需要延迟
  router.push(path).catch(err => {
    // 忽略导航重复错误
    if (err.name !== 'NavigationDuplicated') {
      console.error('Navigation error:', err)
    }
  })
  
  // 记录到最近使用
  const item = allMenuItems.value.find(m => m.path === path)
  if (item) {
    uiStore.addRecentTool({
      id: path,
      name: item.title,
      path: item.path,
      icon: item.icon,
    })
  }
}

const toggleCollapse = () => {
  uiStore.toggleSidebar()
}

const handleExpandForSearch = () => {
  uiStore.setSidebarCollapsed(false)
  // 等待展开动画完成后聚焦搜索框
  setTimeout(() => {
    const searchInput = document.querySelector('.neon-sidebar__search-input') as HTMLInputElement
    searchInput?.focus()
  }, 250)
}

// 全局快捷键
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl+B 折叠/展开
  if (event.ctrlKey && event.key === 'b') {
    event.preventDefault()
    toggleCollapse()
  }
  
  // Ctrl+K 聚焦搜索
  if (event.ctrlKey && event.key === 'k') {
    event.preventDefault()
    if (isCollapsed.value) {
      handleExpandForSearch()
    } else {
      const searchInput = document.querySelector('.neon-sidebar__search-input') as HTMLInputElement
      searchInput?.focus()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.neon-sidebar {
  position: relative;
  display: flex;
  /* GPU加速，防止闪烁 */
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: auto;
  flex-direction: column;
  width: var(--sidebar-width-expanded);
  height: 100vh;
  /* 渐变背景 */
  background: linear-gradient(180deg, var(--color-panel) 0%, var(--color-panel-light) 50%, var(--color-panel) 100%);
  border-right: 2px solid var(--neon-cyan-lighter);  /* 浅色边框 */
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2), 0 0 40px rgba(33, 230, 255, 0.1);  /* 柔和发光 */
  transition: width var(--transition-slow) var(--transition-timing);
  overflow: hidden;
  z-index: var(--z-fixed);
}

.neon-sidebar--collapsed {
  width: var(--sidebar-width-collapsed);
}

/* ========== 顶部 Logo ========== */
.neon-sidebar__header {
  padding: var(--spacing-xl) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-light);  /* 浅色边框 */
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.05) 0%, transparent 100%);  /* 浅色渐变 */
}

.neon-sidebar__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  user-select: none;
}

.neon-sidebar__logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 1.8em;
  color: var(--neon-cyan-light);  /* 浅色霓虹 */
  background: rgba(33, 230, 255, 0.15);  /* 提高亮度 */
  border: 2px solid var(--neon-cyan-lighter);  /* 浅色边框 */
  border-radius: var(--radius-md);
  box-shadow: inset 0 0 20px rgba(33, 230, 255, 0.20), 0 0 15px rgba(33, 230, 255, 0.4);  /* 增强发光 */
  flex-shrink: 0;
}

.neon-sidebar__logo-text {
  font-family: var(--font-family-display);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan-light);  /* 浅色霓虹 */
  text-shadow: 0 0 15px rgba(33, 230, 255, 0.6), 0 0 30px rgba(33, 230, 255, 0.3);  /* 柔和发光 */
  white-space: nowrap;
}

/* ========== 搜索框 ========== */
.neon-sidebar__search {
  padding: var(--spacing-lg);
}

.neon-sidebar__search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, var(--color-panel-light) 0%, var(--color-panel) 100%);  /* 浅色渐变 */
  border: 1px solid var(--color-border-light);  /* 浅色边框 */
  border-radius: var(--radius-md);
  transition: all var(--transition-base) var(--transition-timing);
}

.neon-sidebar__search-wrapper:hover {
  border-color: var(--neon-cyan-lighter);  /* 浅色霓虹 */
  background: var(--color-panel-hover);
}

.neon-sidebar__search-wrapper:focus-within {
  border-color: var(--neon-cyan-light);  /* 浅色霓虹 */
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.3);  /* 柔和发光 */
  background: var(--color-panel-hover);
}

.neon-sidebar__search-icon {
  color: var(--color-muted);
  font-size: 1.2em;
  flex-shrink: 0;
}

.neon-sidebar__search-input {
  flex: 1;
  min-width: 0;
  padding: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text);
  background: transparent;
  border: none;
  outline: none;
}

.neon-sidebar__search-input::placeholder {
  color: var(--color-text-disabled);
}

.neon-sidebar__search-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--spacing-lg) var(--spacing-md);
  padding: var(--spacing-md);
  font-size: 1.5em;
  color: var(--color-muted);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.neon-sidebar__search-collapsed:hover {
  color: var(--neon-cyan);
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

/* ========== 菜单 ========== */
.neon-sidebar__menu {
  flex: 1 1 auto;
  min-height: 0;
  border-right: none;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Element Plus 菜单内部容器高度修正 */
.neon-sidebar__menu :deep(.el-menu) {
  min-height: 100%;
  padding-bottom: var(--spacing-md);
}

/* 自定义滚动条样式 */
.neon-sidebar__menu::-webkit-scrollbar {
  width: 6px;
}

.neon-sidebar__menu::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.neon-sidebar__menu::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.3);
  border-radius: 3px;
}

.neon-sidebar__menu::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.5);
}

/* ========== 菜单分类 ========== */
:deep(.neon-menu-category) {
  margin: var(--spacing-xs) 0;
}

:deep(.neon-menu-category > .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  padding-left: var(--spacing-lg) !important;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  background: transparent;
  border-radius: 0;
  transition: all var(--transition-base) var(--transition-timing);
}

:deep(.neon-menu-category > .el-sub-menu__title:hover) {
  background: rgba(33, 230, 255, 0.10);  /* 提高亮度 */
  color: var(--neon-cyan-light);  /* 浅色霓虹 */
}

:deep(.neon-menu-category .el-sub-menu__icon-arrow) {
  color: var(--color-muted);
  transition: color var(--transition-base) var(--transition-timing);
}

:deep(.neon-menu-category.is-opened > .el-sub-menu__title) {
  color: var(--neon-cyan-light);  /* 浅色霓虹 */
  background: rgba(33, 230, 255, 0.08);  /* 添加浅色背景 */
}

:deep(.neon-menu-category.is-opened .el-sub-menu__icon-arrow) {
  color: var(--neon-cyan-light);  /* 浅色霓虹 */
}

/* ========== 菜单项 ========== */
:deep(.neon-menu-item) {
  margin: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: all var(--transition-base) var(--transition-timing);
}

:deep(.neon-menu-item--sub) {
  margin-left: var(--spacing-xl);
  margin-right: var(--spacing-md);
}

:deep(.neon-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(33, 230, 255, 0.20) 0%, rgba(33, 230, 255, 0.10) 100%) !important;  /* 浅色渐变 */
  border-left: 3px solid var(--neon-cyan-light);  /* 浅色霓虹 */
  box-shadow: inset 0 0 25px rgba(33, 230, 255, 0.25);  /* 增强内发光 */
}

/* 折叠状态下的激活菜单项 */
.neon-sidebar--collapsed :deep(.neon-menu-item.is-active) {
  border-left: none !important;
  border: 2px solid var(--neon-cyan-light) !important;
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.4) !important;
}

/* 折叠状态下移除子菜单项的额外边距 */
.neon-sidebar--collapsed :deep(.neon-menu-item--sub) {
  margin-left: var(--spacing-sm) !important;
}

:deep(.neon-menu-item__icon) {
  font-size: 1.5em;
  color: var(--color-muted);
  transition: color var(--transition-base) var(--transition-timing);
  margin-right: 12px;
  flex-shrink: 0;
}

:deep(.neon-menu-item.is-active .neon-menu-item__icon) {
  color: var(--neon-cyan-light);  /* 浅色霓虹 */
  filter: drop-shadow(0 0 8px var(--neon-cyan));  /* 图标发光 */
}

:deep(.neon-menu-item:hover .neon-menu-item__icon) {
  color: var(--neon-cyan-lighter);  /* 超浅色霓虹 */
}

:deep(.neon-menu-item:hover) {
  background: rgba(33, 230, 255, 0.08);  /* 悬停浅色背景 */
}

:deep(.neon-menu-item__title) {
  font-weight: var(--font-weight-medium);
}

/* 子菜单面板 */
:deep(.el-menu--inline) {
  background: rgba(0, 0, 0, 0.2) !important;
}

/* 折叠状态下图标居中显示 */
.neon-sidebar--collapsed :deep(.el-menu-item),
.neon-sidebar--collapsed :deep(.el-menu-item *) {
  text-align: center !important;
}

.neon-sidebar--collapsed :deep(.el-menu-item) {
  padding: 0 !important;
  margin: var(--spacing-xs) var(--spacing-sm) !important;
  height: 48px !important;
  line-height: 48px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

.neon-sidebar--collapsed :deep(.el-sub-menu__title) {
  padding: 0 !important;
  margin: 0 var(--spacing-sm) !important;
  height: 48px !important;
  line-height: 48px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

.neon-sidebar--collapsed :deep(.neon-menu-item__icon),
.neon-sidebar--collapsed :deep(.el-sub-menu__title .neon-menu-item__icon) {
  margin: 0 !important;
  margin-right: 0 !important;
  font-size: 1.8em !important;
}

/* 隐藏文本 */
.neon-sidebar--collapsed :deep(.el-menu-item span),
.neon-sidebar--collapsed :deep(.el-sub-menu__title span),
.neon-sidebar--collapsed :deep(.el-menu-item .el-menu-tooltip__trigger),
.neon-sidebar--collapsed :deep(.el-sub-menu__title .el-menu-tooltip__trigger) {
  display: none !important;
}

/* 确保折叠状态下的菜单项宽度一致 */
.neon-sidebar--collapsed :deep(.neon-menu-item) {
  width: calc(100% - var(--spacing-md) * 2) !important;
  min-width: auto !important;
}

/* 确保折叠状态下一级菜单项（如首页）正确显示 */
.neon-sidebar--collapsed :deep(.el-menu > .el-menu-item) {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  padding: 0 !important;
  margin: var(--spacing-xs) var(--spacing-sm) !important;
  height: 48px !important;
  line-height: 48px !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 确保一级菜单项的图标在折叠状态下正确显示 */
.neon-sidebar--collapsed :deep(.el-menu > .el-menu-item .neon-menu-item__icon) {
  margin: 0 !important;
  font-size: 1.8em !important;
}

/* 折叠状态下隐藏子菜单箭头 */
.neon-sidebar--collapsed :deep(.el-sub-menu__icon-arrow) {
  display: none !important;
}

/* 折叠状态下的子菜单面板位置修正 */
.neon-sidebar--collapsed :deep(.el-menu--popup) {
  min-width: 200px;
}

/* ========== 底部折叠按钮 ========== */
.neon-sidebar__footer {
  padding: var(--spacing-lg);
  border-top: var(--border-width-thin) solid var(--color-border);
}

.neon-sidebar__collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-muted);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-base) var(--transition-timing);
}

.neon-sidebar__collapse-btn:hover {
  color: var(--neon-cyan);
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.neon-sidebar__collapse-btn i {
  font-size: 1.4em;
  transition: transform var(--transition-base) var(--transition-timing);
}

/* 折叠状态下按钮样式 */
.neon-sidebar--collapsed .neon-sidebar__collapse-btn {
  padding: var(--spacing-lg) var(--spacing-md);
  width: auto;
  min-width: 40px;
}

.neon-sidebar--collapsed .neon-sidebar__collapse-btn i {
  font-size: 1.8em;
  margin: 0;
}

.neon-sidebar__collapse-text {
  white-space: nowrap;
}

/* ========== 折叠时居中图标 ========== */
.neon-sidebar--collapsed .neon-sidebar__logo {
  justify-content: center;
}

/* ========== 过渡动画 ========== */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: opacity var(--transition-base) var(--transition-timing),
              transform var(--transition-base) var(--transition-timing);
}

.sidebar-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.sidebar-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>

