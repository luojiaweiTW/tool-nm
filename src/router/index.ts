import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

// 预加载所有页面组件
import Home from '@/pages/Home/Index.vue'
import JsonFormatter from '@/pages/tools/JsonFormatter/IndexCompact.vue'
import XmlYaml from '@/pages/tools/XmlYaml/Index.vue'
import SqlFormatter from '@/pages/tools/SqlFormatter/Index.vue'
import TextDiff from '@/pages/tools/TextDiff/Index.vue'
import Regex from '@/pages/tools/Regex/Index.vue'
import DocToMarkdown from '@/pages/tools/DocToMarkdown/Index.vue'
import Base64 from '@/pages/tools/Base64/IndexCompact.vue'
import UrlEncoder from '@/pages/tools/UrlEncoder/IndexCompact.vue'
import Hash from '@/pages/tools/Hash/Index.vue'
import Encrypt from '@/pages/tools/Encrypt/Index.vue'
import Unicode from '@/pages/tools/Unicode/Index.vue'
import JWT from '@/pages/tools/JWT/Index.vue'
import Timestamp from '@/pages/tools/Timestamp/Index.vue'
import Cron from '@/pages/tools/Cron/Index.vue'
import UUID from '@/pages/tools/UUID/Index.vue'
import RandomGenerator from '@/pages/tools/RandomGenerator/Index.vue'
import NumberBase from '@/pages/tools/NumberBase/Index.vue'
import QRCode from '@/pages/tools/QRCode/Index.vue'
import JsonToJava from '@/pages/tools/JsonToJava/Index.vue'
import ExceptionParser from '@/pages/tools/ExceptionParser/Index.vue'
import MavenSearch from '@/pages/tools/MavenSearch/Index.vue'
import HttpClient from '@/pages/tools/HttpClient/Index.vue'
import IPQuery from '@/pages/tools/IPQuery/Index.vue'
import SSH from '@/pages/tools/SSH/Index.vue'
import CommandHistory from '@/pages/tools/CommandHistory/Index.vue'
import Knowledge from '@/pages/tools/Knowledge/Index.vue'
import Snippets from '@/pages/tools/Snippets/Index.vue'
import Entertainment from '@/pages/tools/Entertainment/Index.vue'
import Encoding from '@/pages/tools/Encoding/Index.vue'
import PortScanner from '@/pages/tools/PortScanner/Index.vue'
import IPScanner from '@/pages/tools/ip-scanner/Index.vue'
import WebSocketTool from '@/pages/tools/WebSocket/Index.vue'
import ClipboardHistory from '@/pages/tools/ClipboardHistory/Index.vue'
import Screenshot from '@/pages/tools/Screenshot/Index.vue'
import SystemMonitor from '@/pages/tools/SystemMonitor/Index.vue'
import Weather from '@/pages/tools/Weather/Index.vue'
import Bookmarks from '@/pages/tools/Bookmarks/Index.vue'
import UnitConverter from '@/pages/tools/UnitConverter/Index.vue'
import ColorConverter from '@/pages/tools/ColorConverter/Index.vue'
import ImageCompressor from '@/pages/tools/ImageCompressor/Index.vue'
import ImageConverter from '@/pages/tools/ImageConverter/Index.vue'
import ImageCropper from '@/pages/tools/ImageCropper/Index.vue'
import FileHash from '@/pages/tools/FileHash/Index.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      // ========== 首页 ==========
      {
        path: '',
        name: 'Home',
        component: Home,
        meta: {
          title: '首页',
          description: '便捷的在线工具集合',
          icon: 'i-mdi-home',
        }
      },
      // ========== 文本处理 ==========
      {
        path: 'tools/json-formatter',
        name: 'JsonFormatter',
        component: JsonFormatter,
        meta: {
          title: 'JSON 格式化',
          description: '格式化、压缩、校验 JSON 数据',
          icon: 'i-mdi-code-json',
          category: '文本处理',
        }
      },
      {
        path: 'tools/xml-yaml',
        name: 'XmlYaml',
        component: XmlYaml,
        meta: {
          title: 'XML/YAML 转换',
          description: 'XML、YAML、JSON 格式互转',
          icon: 'i-mdi-file-xml-box',
          category: '文本处理',
        }
      },
      {
        path: 'tools/sql-formatter',
        name: 'SqlFormatter',
        component: SqlFormatter,
        meta: {
          title: 'SQL 格式化',
          description: 'SQL 语句格式化与美化',
          icon: 'i-mdi-database-edit',
          category: '文本处理',
        }
      },
      {
        path: 'tools/text-diff',
        name: 'TextDiff',
        component: TextDiff,
        meta: {
          title: '文本对比',
          description: '文本差异对比工具',
          icon: 'i-mdi-file-compare',
          category: '文本处理',
        }
      },
      {
        path: 'tools/regex',
        name: 'Regex',
        component: Regex,
        meta: {
          title: '正则表达式',
          description: '正则表达式测试与匹配',
          icon: 'i-mdi-regex',
          category: '文本处理',
        }
      },
      {
        path: 'tools/doc-to-markdown',
        name: 'DocToMarkdown',
        component: DocToMarkdown,
        meta: {
          title: '文档转 Markdown',
          description: 'Word 文档转 Markdown，提取图片并打包',
          icon: 'i-mdi-file-document-arrow-right',
          category: '文本处理',
        }
      },
      
      // ========== 编码加密 ==========
      {
        path: 'tools/base64',
        name: 'Base64',
        component: Base64,
        meta: {
          title: 'Base64 编解码',
          description: 'Base64 编码解码工具，支持文本与文件',
          icon: 'i-mdi-file-code-outline',
          category: '编码加密',
        }
      },
      {
        path: 'tools/url-encoder',
        name: 'UrlEncoder',
        component: UrlEncoder,
        meta: {
          title: 'URL 编码',
          description: 'URL 编码与解码工具',
          icon: 'i-mdi-link-variant',
          category: '编码加密',
        }
      },
      {
        path: 'tools/hash',
        name: 'Hash',
        component: Hash,
        meta: {
          title: '哈希计算',
          description: 'MD5、SHA-1、SHA-256 等哈希计算',
          icon: 'i-mdi-fingerprint',
          category: '编码加密',
        }
      },
      {
        path: 'tools/encrypt',
        name: 'Encrypt',
        component: Encrypt,
        meta: {
          title: '加密解密',
          description: 'AES、DES、RSA 加密解密',
          icon: 'i-mdi-lock-outline',
          category: '编码加密',
        }
      },
      {
        path: 'tools/unicode',
        name: 'Unicode',
        component: Unicode,
        meta: {
          title: 'Unicode 转换',
          description: 'Unicode、HTML 实体编码转换',
          icon: 'i-mdi-format-letter-case',
          category: '编码加密',
        }
      },
      {
        path: 'tools/encoding',
        name: 'Encoding',
        component: Encoding,
        meta: {
          title: '编码格式转换',
          description: 'UTF-8、GBK、GB2312 等编码格式互转',
          icon: 'i-mdi-file-swap',
          category: '编码加密',
        }
      },
      {
        path: 'tools/file-hash',
        name: 'FileHash',
        component: FileHash,
        meta: {
          title: '文件哈希校验',
          description: '计算文件 MD5、SHA-1、SHA-256、SHA-512 哈希值',
          icon: 'i-mdi-shield-check',
          category: '编码加密',
        }
      },
      
      // ========== 认证安全 ==========
      {
        path: 'tools/jwt',
        name: 'JWT',
        component: JWT,
        meta: {
          title: 'JWT 解析',
          description: 'JWT Token 解析与验证',
          icon: 'i-mdi-key-chain',
          category: '认证安全',
        }
      },
      
      // ========== 时间调度 ==========
      {
        path: 'tools/timestamp',
        name: 'Timestamp',
        component: Timestamp,
        meta: {
          title: '时间戳转换',
          description: 'Unix 时间戳与日期时间相互转换',
          icon: 'i-mdi-clock-digital',
          category: '时间调度',
        }
      },
      {
        path: 'tools/cron',
        name: 'Cron',
        component: Cron,
        meta: {
          title: 'Cron 表达式',
          description: 'Cron 表达式生成器与解析',
          icon: 'i-mdi-calendar-clock',
          category: '时间调度',
        }
      },
      
      // ========== 开发工具 ==========
      {
        path: 'tools/uuid',
        name: 'UUID',
        component: UUID,
        meta: {
          title: 'UUID 生成',
          description: '生成 UUID/GUID',
          icon: 'i-mdi-identifier',
          category: '开发工具',
        }
      },
      {
        path: 'tools/random-generator',
        name: 'RandomGenerator',
        component: RandomGenerator,
        meta: {
          title: '随机数据生成',
          description: '生成随机字符串、模拟数据',
          icon: 'i-mdi-dice-multiple',
          category: '开发工具',
        }
      },
      {
        path: 'tools/number-base',
        name: 'NumberBase',
        component: NumberBase,
        meta: {
          title: '进制转换',
          description: '十进制、十六进制、二进制转换',
          icon: 'i-mdi-numeric',
          category: '开发工具',
        }
      },
      {
        path: 'tools/qrcode',
        name: 'QRCode',
        component: QRCode,
        meta: {
          title: '二维码生成',
          description: '文本、URL 生成二维码',
          icon: 'i-mdi-qrcode',
          category: '开发工具',
        }
      },
      {
        path: 'tools/unit-converter',
        name: 'UnitConverter',
        component: UnitConverter,
        meta: {
          title: '单位换算器',
          description: '长度、重量、温度、面积、体积、时间、存储、速度等单位互转',
          icon: 'i-mdi-swap-horizontal',
          category: '开发工具',
        }
      },
      {
        path: 'tools/color-converter',
        name: 'ColorConverter',
        component: ColorConverter,
        meta: {
          title: '颜色转换器',
          description: 'HEX、RGB、HSL、RGBA、HSLA 颜色格式互转，霓虹色板预设',
          icon: 'i-mdi-palette',
          category: '开发工具',
        }
      },
      {
        path: 'tools/image-compressor',
        name: 'ImageCompressor',
        component: ImageCompressor,
        meta: {
          title: '图片压缩',
          description: '在线压缩 JPG/PNG/WebP 图片，减小文件大小',
          icon: 'i-mdi-image-size-select-actual',
          category: '图片工具',
        }
      },
      {
        path: 'tools/image-converter',
        name: 'ImageConverter',
        component: ImageConverter,
        meta: {
          title: '图片格式转换',
          description: '在线转换 JPG、PNG、WebP、GIF 图片格式',
          icon: 'i-mdi-image-sync',
          category: '图片工具',
        }
      },
      {
        path: 'tools/image-cropper',
        name: 'ImageCropper',
        component: ImageCropper,
        meta: {
          title: '图片裁剪缩放',
          description: '裁剪图片、调整尺寸、支持多种预设比例',
          icon: 'i-mdi-crop',
          category: '图片工具',
        }
      },
      
      // ========== Java 工具 ==========
      {
        path: 'tools/json-to-java',
        name: 'JsonToJava',
        component: JsonToJava,
        meta: {
          title: 'JSON 转 Java',
          description: 'JSON 转 Java 实体类',
          icon: 'i-mdi-code-braces',
          category: 'Java 工具',
        }
      },
      {
        path: 'tools/exception-parser',
        name: 'ExceptionParser',
        component: ExceptionParser,
        meta: {
          title: '异常堆栈分析',
          description: 'Java 异常堆栈美化与分析',
          icon: 'i-mdi-bug',
          category: 'Java 工具',
        }
      },
      {
        path: 'tools/maven-search',
        name: 'MavenSearch',
        component: MavenSearch,
        meta: {
          title: 'Maven 依赖',
          description: 'Maven 依赖坐标查询',
          icon: 'i-mdi-package-variant',
          category: 'Java 工具',
        }
      },
      
      // ========== 网络工具 ==========
      {
        path: 'tools/http-client',
        name: 'HttpClient',
        component: HttpClient,
        meta: {
          title: 'HTTP 测试',
          description: 'HTTP 请求测试工具',
          icon: 'i-mdi-api',
          category: '网络工具',
        }
      },
      {
        path: 'tools/ip-query',
        name: 'IPQuery',
        component: IPQuery,
        meta: {
          title: 'IP 查询',
          description: '查询 IP 地址的地理位置、运营商、ASN、IP类型等详细信息',
          icon: 'i-mdi-ip-network',
          category: '网络工具',
        }
      },
      {
        path: 'tools/ssh',
        name: 'SSH',
        component: SSH,
        meta: {
          title: 'SSH 连接',
          description: '连接远程服务器，支持保存连接历史',
          icon: 'i-mdi-console',
          category: '网络工具',
        }
      },
      {
        path: 'tools/command-history',
        name: 'CommandHistory',
        component: CommandHistory,
        meta: {
          title: '命令历史',
          description: '终端命令历史管理和收藏夹',
          icon: 'i-mdi-history',
          category: '网络工具',
        }
      },
      {
        path: 'tools/port-scanner',
        name: 'PortScanner',
        component: PortScanner,
        meta: {
          title: '端口扫描',
          description: '扫描服务器开放端口，支持多种扫描模式',
          icon: 'i-mdi-lan-connect',
          category: '网络工具',
        }
      },
      {
        path: 'tools/ip-scanner',
        name: 'IPScanner',
        component: IPScanner,
        meta: {
          title: 'IP 扫描器',
          description: '扫描局域网中的 IP 地址使用情况',
          icon: 'i-mdi-ip-network-outline',
          category: '网络工具',
        }
      },
      {
        path: 'tools/websocket',
        name: 'WebSocket',
        component: WebSocketTool,
        meta: {
          title: 'WebSocket 测试',
          description: '连接 WebSocket 服务器，测试实时通信功能',
          icon: 'i-mdi-connection',
          category: '网络工具',
        }
      },
      
      // ========== 实用工具 ==========
      {
        path: 'tools/clipboard-history',
        name: 'ClipboardHistory',
        component: ClipboardHistory,
        meta: {
          title: '剪贴板历史',
          description: '自动记录复制的文本内容',
          icon: 'i-mdi-clipboard-text-clock',
          category: '实用工具',
        }
      },
      {
        path: 'tools/screenshot',
        name: 'Screenshot',
        component: Screenshot,
        meta: {
          title: '截图工具',
          description: '快速截取屏幕或窗口',
          icon: 'i-mdi-camera-outline',
          category: '实用工具',
        }
      },
      {
        path: 'tools/system-monitor',
        name: 'SystemMonitor',
        component: SystemMonitor,
        meta: {
          title: '系统监控',
          description: '实时监控 CPU、内存、磁盘等系统资源',
          icon: 'i-mdi-monitor-dashboard',
          category: '实用工具',
        }
      },
      {
        path: 'tools/weather',
        name: 'Weather',
        component: Weather,
        meta: {
          title: '天气查询',
          description: '查看多个城市的实时天气和天气预报',
          icon: 'i-mdi-weather-partly-cloudy',
          category: '实用工具',
        }
      },
      
      // ========== 知识管理 ==========
      {
        path: 'tools/knowledge',
        name: 'Knowledge',
        component: Knowledge,
        meta: {
          title: '知识库',
          description: '个人知识管理，支持文本和图片',
          icon: 'i-mdi-book-open-page-variant',
          category: '知识管理',
        }
      },
      {
        path: 'tools/snippets',
        name: 'Snippets',
        component: Snippets,
        meta: {
          title: '代码片段',
          description: '管理和使用你的代码片段',
          icon: 'i-mdi-code-braces-box',
          category: '知识管理',
        }
      },
      {
        path: 'tools/bookmarks',
        name: 'Bookmarks',
        component: Bookmarks,
        meta: {
          title: '网页收藏夹',
          description: '管理你的常用网站和资源链接',
          icon: 'i-mdi-bookmark-multiple',
          category: '知识管理',
        }
      },
      
      // ========== 热榜聚合 ==========
      {
        path: 'tools/entertainment',
        name: 'Entertainment',
        component: Entertainment,
        meta: {
          title: '热榜聚合',
          description: '实时聚合各大平台热门话题',
          icon: 'i-mdi-trending-up',
          category: '热榜聚合',
        }
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：保存路由状态并更新页面标题
router.beforeEach((to, _from, next) => {
  // 使用 requestIdleCallback 在空闲时保存状态，不阻塞路由跳转
  if (to.path && to.path !== '/') {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        sessionStorage.setItem('last-route', to.path)
      })
    } else {
      setTimeout(() => {
        sessionStorage.setItem('last-route', to.path)
      }, 0)
    }
  }

  // 更新页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - IWork`
  } else {
    document.title = 'IWork'
  }
  
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('Router error:', error)
})

export default router

