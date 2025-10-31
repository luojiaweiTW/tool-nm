<template>
  <div class="tool-qrcode">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">🎨 二维码生成器</h1>
        <p class="tool-header__description">功能强大的在线二维码生成工具，支持多种类型和自定义样式</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="generateQR" type="primary" :disabled="!canGenerate">
          <i class="i-mdi-qrcode mr-2" />
          生成二维码
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <div class="tool-layout">
        <!-- 左侧：配置 -->
        <div class="tool-panel">
          <!-- 内容类型选择 -->
          <NeonCard title="📝 内容类型">
            <div class="type-selector">
              <div
                v-for="type in contentTypes"
                :key="type.value"
                class="type-item"
                :class="{ active: selectedType === type.value }"
                @click="selectedType = type.value"
              >
                <i :class="type.icon" />
                <span>{{ type.label }}</span>
              </div>
            </div>
          </NeonCard>

          <!-- 内容输入 -->
          <NeonCard title="✏️ 内容">
            <!-- 文本类型 -->
            <div v-if="selectedType === 'text'" class="form-group">
              <label class="form-label">文本内容</label>
              <NeonTextarea
                v-model="contentData.text"
                placeholder="输入文本内容..."
                :rows="6"
              />
            </div>

            <!-- URL类型 -->
            <div v-if="selectedType === 'url'" class="form-group">
              <label class="form-label">网址链接</label>
              <el-input v-model="contentData.url" placeholder="https://example.com" />
            </div>

            <!-- 名片类型 -->
            <div v-if="selectedType === 'vcard'">
              <div class="form-group">
                <label class="form-label">姓名</label>
                <el-input v-model="contentData.vcard.name" placeholder="张三" />
              </div>
              <div class="form-group">
                <label class="form-label">公司</label>
                <el-input v-model="contentData.vcard.company" placeholder="科技有限公司" />
              </div>
              <div class="form-group">
                <label class="form-label">职位</label>
                <el-input v-model="contentData.vcard.title" placeholder="产品经理" />
              </div>
              <div class="form-group">
                <label class="form-label">电话</label>
                <el-input v-model="contentData.vcard.phone" placeholder="13800138000" />
              </div>
              <div class="form-group">
                <label class="form-label">邮箱</label>
                <el-input v-model="contentData.vcard.email" placeholder="example@email.com" />
              </div>
              <div class="form-group">
                <label class="form-label">地址</label>
                <el-input v-model="contentData.vcard.address" placeholder="北京市朝阳区" />
              </div>
            </div>

            <!-- WiFi类型 -->
            <div v-if="selectedType === 'wifi'">
              <div class="form-group">
                <label class="form-label">网络名称 (SSID)</label>
                <el-input v-model="contentData.wifi.ssid" placeholder="MyWiFi" />
              </div>
              <div class="form-group">
                <label class="form-label">密码</label>
                <el-input v-model="contentData.wifi.password" type="password" placeholder="密码" show-password />
              </div>
              <div class="form-group">
                <label class="form-label">加密方式</label>
                <el-select v-model="contentData.wifi.encryption" style="width: 100%">
                  <el-option label="WPA/WPA2" value="WPA" />
                  <el-option label="WEP" value="WEP" />
                  <el-option label="无加密" value="nopass" />
                </el-select>
              </div>
              <div class="form-group">
                <label class="form-label">隐藏网络</label>
                <el-switch v-model="contentData.wifi.hidden" />
              </div>
            </div>

            <!-- 电话类型 -->
            <div v-if="selectedType === 'phone'" class="form-group">
              <label class="form-label">电话号码</label>
              <el-input v-model="contentData.phone" placeholder="13800138000" />
            </div>

            <!-- 短信类型 -->
            <div v-if="selectedType === 'sms'">
              <div class="form-group">
                <label class="form-label">手机号码</label>
                <el-input v-model="contentData.sms.phone" placeholder="13800138000" />
              </div>
              <div class="form-group">
                <label class="form-label">短信内容</label>
                <NeonTextarea v-model="contentData.sms.message" placeholder="短信内容" :rows="4" />
              </div>
            </div>

            <!-- 邮件类型 -->
            <div v-if="selectedType === 'email'">
              <div class="form-group">
                <label class="form-label">收件人</label>
                <el-input v-model="contentData.email.to" placeholder="example@email.com" />
              </div>
              <div class="form-group">
                <label class="form-label">主题</label>
                <el-input v-model="contentData.email.subject" placeholder="邮件主题" />
              </div>
              <div class="form-group">
                <label class="form-label">内容</label>
                <NeonTextarea v-model="contentData.email.body" placeholder="邮件内容" :rows="4" />
              </div>
            </div>

            <!-- 地理位置类型 -->
            <div v-if="selectedType === 'location'">
              <div class="form-group">
                <label class="form-label">纬度</label>
                <el-input v-model="contentData.location.lat" placeholder="39.9042" />
              </div>
              <div class="form-group">
                <label class="form-label">经度</label>
                <el-input v-model="contentData.location.lng" placeholder="116.4074" />
              </div>
            </div>
          </NeonCard>

          <!-- 样式配置 -->
          <NeonCard title="🎨 样式配置">

            <!-- 尺寸 -->
            <div class="form-group">
              <label class="form-label">尺寸（像素）</label>
              <el-input-number v-model="qrConfig.size" :min="128" :max="1024" :step="64" />
            </div>

            <!-- 纠错级别 -->
            <div class="form-group">
              <label class="form-label">纠错级别</label>
              <el-select v-model="qrConfig.errorLevel" style="width: 100%">
                <el-option label="L (低 7%)" value="L" />
                <el-option label="M (中 15%)" value="M" />
                <el-option label="Q (较高 25%)" value="Q" />
                <el-option label="H (高 30%)" value="H" />
              </el-select>
            </div>

            <!-- 边距 -->
            <div class="form-group">
              <label class="form-label">边距</label>
              <el-input-number v-model="qrConfig.margin" :min="0" :max="10" />
            </div>

            <div class="form-group">
              <label class="form-label">前景色</label>
              <div class="color-picker-group">
                <el-color-picker v-model="qrConfig.color" show-alpha />
                <span class="color-value">{{ qrConfig.color }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">背景色</label>
              <div class="color-picker-group">
                <el-color-picker v-model="qrConfig.bgColor" show-alpha />
                <span class="color-value">{{ qrConfig.bgColor }}</span>
              </div>
            </div>

            <!-- Logo上传 -->
            <div class="form-group">
              <label class="form-label">中心Logo</label>
              <div class="logo-upload">
                <el-upload
                  :show-file-list="false"
                  :before-upload="handleLogoUpload"
                  accept="image/*"
                  :auto-upload="false"
                >
                  <NeonButton size="small" type="outline" style="width: 100%">
                    <i class="i-mdi-image-plus mr-2" />
                    {{ logoImage ? '更换Logo' : '上传Logo' }}
                  </NeonButton>
                </el-upload>
                <NeonButton v-if="logoImage" size="small" @click="removeLogo" style="width: 100%; margin-top: 8px">
                  <i class="i-mdi-delete mr-2" />
                  移除Logo
                </NeonButton>
              </div>
              <div v-if="logoImage" class="logo-preview">
                <img :src="logoImage" alt="Logo预览" />
              </div>
            </div>

            <!-- Logo尺寸 -->
            <div v-if="logoImage" class="form-group">
              <label class="form-label">Logo大小（占比%）</label>
              <el-slider v-model="qrConfig.logoSize" :min="10" :max="30" :step="1" />
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：预览 -->
        <div class="tool-main">
          <NeonCard v-if="qrCodeUrl" title="📱 二维码预览">
            <template #extra>
              <NeonButton size="small" @click="downloadQR">
                <i class="i-mdi-download mr-1" />
                下载
              </NeonButton>
            </template>
            <div class="qr-preview">
              <canvas ref="qrCanvas" style="display: none"></canvas>
              <img :src="qrCodeUrl" alt="QR Code" class="qr-image" />
              <div class="qr-info">
                <span>尺寸：{{ qrConfig.size }}×{{ qrConfig.size }}</span>
                <span>纠错：{{ qrConfig.errorLevel }}</span>
              </div>
            </div>
          </NeonCard>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <i class="i-mdi-qrcode empty-state__icon" />
            <p class="empty-state__text">选择类型并输入内容</p>
            <p class="empty-state__hint">支持文本、网址、名片、WiFi、电话、短信、邮件、位置等</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

// 内容类型
const contentTypes = [
  { value: 'text', label: '文本', icon: 'i-mdi-text' },
  { value: 'url', label: '网址', icon: 'i-mdi-link' },
  { value: 'vcard', label: '名片', icon: 'i-mdi-card-account-details' },
  { value: 'wifi', label: 'WiFi', icon: 'i-mdi-wifi' },
  { value: 'phone', label: '电话', icon: 'i-mdi-phone' },
  { value: 'sms', label: '短信', icon: 'i-mdi-message-text' },
  { value: 'email', label: '邮件', icon: 'i-mdi-email' },
  { value: 'location', label: '位置', icon: 'i-mdi-map-marker' },
]

const selectedType = ref('text')
const qrCodeUrl = ref('')
const qrCanvas = ref<HTMLCanvasElement>()
const logoImage = ref('')

// 不同类型的内容数据
const contentData = ref({
  text: '',
  url: '',
  vcard: {
    name: '',
    company: '',
    title: '',
    phone: '',
    email: '',
    address: ''
  },
  wifi: {
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false
  },
  phone: '',
  sms: {
    phone: '',
    message: ''
  },
  email: {
    to: '',
    subject: '',
    body: ''
  },
  location: {
    lat: '',
    lng: ''
  }
})

// 配置
const qrConfig = ref({
  size: 300,
  errorLevel: 'M' as 'L' | 'M' | 'Q' | 'H',
  margin: 2,
  color: '#000000',
  bgColor: '#FFFFFF',
  logoSize: 20
})

// 判断是否可以生成
const canGenerate = computed(() => {
  switch (selectedType.value) {
    case 'text':
      return !!contentData.value.text
    case 'url':
      return !!contentData.value.url
    case 'vcard':
      return !!contentData.value.vcard.name
    case 'wifi':
      return !!contentData.value.wifi.ssid
    case 'phone':
      return !!contentData.value.phone
    case 'sms':
      return !!contentData.value.sms.phone
    case 'email':
      return !!contentData.value.email.to
    case 'location':
      return !!contentData.value.location.lat && !!contentData.value.location.lng
    default:
      return false
  }
})

// 生成内容字符串
function getContentString(): string {
  switch (selectedType.value) {
    case 'text':
      return contentData.value.text
    
    case 'url':
      return contentData.value.url
    
    case 'vcard': {
      const v = contentData.value.vcard
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${v.name}\nORG:${v.company}\nTITLE:${v.title}\nTEL:${v.phone}\nEMAIL:${v.email}\nADR:${v.address}\nEND:VCARD`
    }
    
    case 'wifi': {
      const w = contentData.value.wifi
      const encryption = w.encryption === 'nopass' ? '' : w.encryption
      const hidden = w.hidden ? 'H:true' : ''
      return `WIFI:T:${encryption};S:${w.ssid};P:${w.password};${hidden};`
    }
    
    case 'phone':
      return `tel:${contentData.value.phone}`
    
    case 'sms': {
      const s = contentData.value.sms
      return `smsto:${s.phone}:${s.message}`
    }
    
    case 'email': {
      const e = contentData.value.email
      return `mailto:${e.to}?subject=${encodeURIComponent(e.subject)}&body=${encodeURIComponent(e.body)}`
    }
    
    case 'location': {
      const l = contentData.value.location
      return `geo:${l.lat},${l.lng}`
    }
    
    default:
      return ''
  }
}

// 生成二维码
async function generateQR() {
  const content = getContentString()
  if (!content) {
    ElMessage.warning('请输入要生成二维码的内容')
    return
  }

  try {
    // 创建临时canvas
    let canvas = qrCanvas.value
    if (!canvas) {
      canvas = document.createElement('canvas')
    }

    // 生成二维码
    await QRCode.toCanvas(canvas, content, {
      width: qrConfig.value.size,
      margin: qrConfig.value.margin,
      errorCorrectionLevel: qrConfig.value.errorLevel,
      color: {
        dark: qrConfig.value.color,
        light: qrConfig.value.bgColor
      }
    })

    // 如果有Logo，添加到中心
    if (logoImage.value) {
      await addLogoToQRCode(canvas)
    }

    qrCodeUrl.value = canvas.toDataURL('image/png')
    ElMessage.success('二维码生成成功')
  } catch (e: any) {
    console.error('生成失败:', e)
    ElMessage.error('生成失败：' + e.message)
  }
}

// 添加Logo到二维码中心
async function addLogoToQRCode(canvas: HTMLCanvasElement) {
  return new Promise((resolve, reject) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('无法获取canvas context'))
      return
    }

    const logo = new Image()
    logo.onload = () => {
      try {
        const size = qrConfig.value.size
        const logoSize = (size * qrConfig.value.logoSize) / 100
        const x = (size - logoSize) / 2
        const y = (size - logoSize) / 2

        // 绘制白色背景
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10)

        // 绘制Logo
        ctx.drawImage(logo, x, y, logoSize, logoSize)
        resolve(true)
      } catch (e) {
        reject(e)
      }
    }
    logo.onerror = () => reject(new Error('Logo加载失败'))
    logo.src = logoImage.value
  })
}

// 处理Logo上传
function handleLogoUpload(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    logoImage.value = e.target?.result as string
    ElMessage.success('Logo上传成功')
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}

// 移除Logo
function removeLogo() {
  logoImage.value = ''
  if (qrCodeUrl.value) {
    generateQR()
  }
}

// 下载二维码
function downloadQR() {
  if (!qrCodeUrl.value) return

  const link = document.createElement('a')
  link.href = qrCodeUrl.value
  link.download = `qrcode-${Date.now()}.png`
  link.click()
  ElMessage.success('已开始下载')
}

// 清空
function clearAll() {
  contentData.value = {
    text: '',
    url: '',
    vcard: {
      name: '',
      company: '',
      title: '',
      phone: '',
      email: '',
      address: ''
    },
    wifi: {
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false
    },
    phone: '',
    sms: {
      phone: '',
      message: ''
    },
    email: {
      to: '',
      subject: '',
      body: ''
    },
    location: {
      lat: '',
      lng: ''
    }
  }
  qrCodeUrl.value = ''
  logoImage.value = ''
  ElMessage.success('已清空')
}
</script>

<style scoped>
.tool-qrcode {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow: hidden;
  box-sizing: border-box;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border: 2px solid var(--neon-lime);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(208, 255, 0, 0.4);
  flex-shrink: 0;
}

.tool-header__info {
  flex: 1;
}

.tool-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-display);
}

.tool-header__description {
  font-size: var(--font-size-base);
  color: var(--color-muted);
}

.tool-header__actions {
  display: flex;
  gap: var(--spacing-md);
}

.tool-content {
  flex: 1;
  overflow: hidden;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
}

.tool-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-lg);
  flex: 1;
  overflow: hidden;
}

@media (max-width: 1200px) {
  .tool-layout {
    grid-template-columns: 1fr;
  }
  
  .type-selector {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .type-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tool-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: var(--spacing-sm);
  padding-bottom: var(--spacing-xl);
}

.tool-panel::-webkit-scrollbar {
  width: 8px;
}

.tool-panel::-webkit-scrollbar-track {
  background: rgba(10, 14, 39, 0.6);
  border-radius: 4px;
}

.tool-panel::-webkit-scrollbar-thumb {
  background: var(--neon-lime);
  border-radius: 4px;
  border: 2px solid rgba(10, 14, 39, 0.6);
}

.tool-panel::-webkit-scrollbar-thumb:hover {
  background: #d0ff00;
}

.tool-main {
  overflow-y: auto;
  overflow-x: hidden;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

/* 类型选择器 */
.type-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

/* NeonCard内容区域优化 - 确保内容完整显示 */
.tool-panel :deep(.neon-card) {
  flex-shrink: 0;
}

.tool-panel :deep(.neon-card__body) {
  max-height: none !important;
  overflow: visible;
}

.type-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: rgba(10, 14, 39, 0.4);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
}

.type-item i {
  font-size: 1.5em;
  color: var(--neon-lime);
}

.type-item:hover {
  border-color: var(--neon-lime);
  background: rgba(208, 255, 0, 0.05);
  transform: translateY(-2px);
}

.type-item.active {
  border-color: var(--neon-lime);
  background: rgba(208, 255, 0, 0.1);
  box-shadow: 0 0 15px rgba(208, 255, 0, 0.3);
}

.type-item.active i {
  color: var(--neon-lime);
  filter: drop-shadow(0 0 8px var(--neon-lime));
}

/* 颜色选择器组 */
.color-picker-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.color-value {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

/* Logo上传 */
.logo-upload {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.logo-preview {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(10, 14, 39, 0.4);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  text-align: center;
}

.logo-preview img {
  max-width: 100px;
  max-height: 100px;
  border-radius: var(--radius-sm);
}

.qr-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.qr-image {
  max-width: 100%;
  border: 2px solid var(--neon-lime);
  border-radius: var(--radius-md);
  box-shadow: 0 0 20px rgba(208, 255, 0, 0.3);
}

.qr-info {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
  height: 100%;
}

.empty-state__icon {
  font-size: 4em;
  color: var(--neon-lime);
  opacity: 0.3;
  margin-bottom: var(--spacing-lg);
}

.empty-state__text {
  font-size: var(--font-size-lg);
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}
</style>

