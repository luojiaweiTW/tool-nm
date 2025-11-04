<template>
  <div class="color-converter">
    <!-- 标题和说明 -->
    <div class="page-header">
      <h2>颜色转换器</h2>
      <p class="page-description">支持 HEX、RGB、HSL、RGBA、HSLA 等颜色格式互转，提供霓虹色板预设</p>
    </div>

    <!-- 颜色预览区 -->
    <NeonCard title="颜色预览" class="preview-card">
      <div class="preview-section">
        <div class="color-preview" :style="{ backgroundColor: currentColor }">
          <div class="preview-overlay">
            <div class="preview-text">{{ currentColor }}</div>
            <div class="preview-coords" v-if="rgb">
              RGB({{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }})
            </div>
          </div>
        </div>
        <div class="preview-info">
          <div class="info-item">
            <label>亮度</label>
            <div class="info-value">{{ brightness }}%</div>
          </div>
          <div class="info-item">
            <label>是否深色</label>
            <div class="info-value">{{ isDark ? '是' : '否' }}</div>
          </div>
          <div class="info-item">
            <label>对比色</label>
            <div class="contrast-preview" :style="{ backgroundColor: contrastColor }"></div>
          </div>
        </div>
      </div>
    </NeonCard>

    <!-- 颜色格式转换 -->
    <div class="converter-grid">
      <!-- HEX -->
      <NeonCard title="HEX 格式">
        <div class="format-input-group">
          <input
            v-model="hex"
            type="text"
            class="neon-input"
            placeholder="#21E6FF"
            @input="handleHexInput"
          />
          <NeonButton @click="copyColor(hex)">
            <i class="i-mdi-content-copy" />
            复制
          </NeonButton>
        </div>
        <div class="format-example">示例: #21E6FF 或 #RGB</div>
      </NeonCard>

      <!-- RGB -->
      <NeonCard title="RGB 格式">
        <div class="rgb-inputs">
          <div class="rgb-input-item">
            <label>R</label>
            <input
              v-model.number="rgb.r"
              type="number"
              class="neon-input"
              min="0"
              max="255"
              @input="handleRgbInput"
            />
          </div>
          <div class="rgb-input-item">
            <label>G</label>
            <input
              v-model.number="rgb.g"
              type="number"
              class="neon-input"
              min="0"
              max="255"
              @input="handleRgbInput"
            />
          </div>
          <div class="rgb-input-item">
            <label>B</label>
            <input
              v-model.number="rgb.b"
              type="number"
              class="neon-input"
              min="0"
              max="255"
              @input="handleRgbInput"
            />
          </div>
        </div>
        <div class="format-actions">
          <div class="format-output">{{ rgbString }}</div>
          <NeonButton size="small" @click="copyColor(rgbString)">
            <i class="i-mdi-content-copy" />
          </NeonButton>
        </div>
      </NeonCard>

      <!-- HSL -->
      <NeonCard title="HSL 格式">
        <div class="hsl-inputs">
          <div class="hsl-input-item">
            <label>H (色相)</label>
            <input
              v-model.number="hsl.h"
              type="number"
              class="neon-input"
              min="0"
              max="360"
              @input="handleHslInput"
            />
            <input
              v-model.number="hsl.h"
              type="range"
              class="neon-slider"
              min="0"
              max="360"
              @input="handleHslInput"
            />
          </div>
          <div class="hsl-input-item">
            <label>S (饱和度)</label>
            <input
              v-model.number="hsl.s"
              type="number"
              class="neon-input"
              min="0"
              max="100"
              @input="handleHslInput"
            />
            <input
              v-model.number="hsl.s"
              type="range"
              class="neon-slider"
              min="0"
              max="100"
              @input="handleHslInput"
            />
          </div>
          <div class="hsl-input-item">
            <label>L (亮度)</label>
            <input
              v-model.number="hsl.l"
              type="number"
              class="neon-input"
              min="0"
              max="100"
              @input="handleHslInput"
            />
            <input
              v-model.number="hsl.l"
              type="range"
              class="neon-slider"
              min="0"
              max="100"
              @input="handleHslInput"
            />
          </div>
        </div>
        <div class="format-actions">
          <div class="format-output">{{ hslString }}</div>
          <NeonButton size="small" @click="copyColor(hslString)">
            <i class="i-mdi-content-copy" />
          </NeonButton>
        </div>
      </NeonCard>

      <!-- RGBA -->
      <NeonCard title="RGBA 格式">
        <div class="rgba-inputs">
          <div class="rgba-input-item">
            <label>R</label>
            <input
              v-model.number="rgba.r"
              type="number"
              class="neon-input"
              min="0"
              max="255"
              @input="handleRgbaInput"
            />
          </div>
          <div class="rgba-input-item">
            <label>G</label>
            <input
              v-model.number="rgba.g"
              type="number"
              class="neon-input"
              min="0"
              max="255"
              @input="handleRgbaInput"
            />
          </div>
          <div class="rgba-input-item">
            <label>B</label>
            <input
              v-model.number="rgba.b"
              type="number"
              class="neon-input"
              min="0"
              max="255"
              @input="handleRgbaInput"
            />
          </div>
          <div class="rgba-input-item">
            <label>A (透明度)</label>
            <input
              v-model.number="rgba.a"
              type="number"
              class="neon-input"
              min="0"
              max="1"
              step="0.01"
              @input="handleRgbaInput"
            />
          </div>
        </div>
        <div class="format-actions">
          <div class="format-output">{{ rgbaString }}</div>
          <NeonButton size="small" @click="copyColor(rgbaString)">
            <i class="i-mdi-content-copy" />
          </NeonButton>
        </div>
      </NeonCard>

      <!-- CSS Variable -->
      <NeonCard title="CSS 变量">
        <div class="format-input-group">
          <input
            v-model="cssVar"
            type="text"
            class="neon-input"
            placeholder="--neon-cyan"
          />
          <NeonButton @click="copyColor(`var(${cssVar})`)">
            <i class="i-mdi-content-copy" />
            复制
          </NeonButton>
        </div>
        <div class="format-example">
          <div>变量定义: {{ cssVar }}: {{ hex }};</div>
          <div>变量使用: color: var({{ cssVar }});</div>
        </div>
      </NeonCard>

      <!-- 颜色选择器 -->
      <NeonCard title="颜色选择器">
        <div class="color-picker-wrapper">
          <input
            v-model="hex"
            type="color"
            class="color-picker"
            @input="handleColorPicker"
          />
          <div class="picker-label">点击选择颜色</div>
        </div>
      </NeonCard>
    </div>

    <!-- 霓虹色板预设 -->
    <NeonCard title="霓虹色板" class="palette-card">
      <div class="palette-grid">
        <div
          v-for="color in neonPalette"
          :key="color.hex"
          class="palette-item"
          :style="{ backgroundColor: color.hex }"
          @click="applyColor(color.hex)"
        >
          <div class="palette-overlay">
            <div class="palette-name">{{ color.name }}</div>
            <div class="palette-hex">{{ color.hex }}</div>
          </div>
        </div>
      </div>
    </NeonCard>

    <!-- 常用色板 -->
    <NeonCard title="常用色板" class="palette-card">
      <div class="palette-tabs">
        <div
          v-for="tab in colorTabs"
          :key="tab.id"
          :class="['palette-tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </div>
      </div>
      <div class="palette-grid">
        <div
          v-for="color in currentPalette"
          :key="color.hex"
          class="palette-item"
          :style="{ backgroundColor: color.hex }"
          @click="applyColor(color.hex)"
        >
          <div class="palette-overlay">
            <div class="palette-name">{{ color.name }}</div>
            <div class="palette-hex">{{ color.hex }}</div>
          </div>
        </div>
      </div>
    </NeonCard>

    <!-- 渐变色生成 -->
    <NeonCard title="渐变色生成" class="gradient-card">
      <div class="gradient-controls">
        <div class="gradient-input-group">
          <label>起始颜色</label>
          <input v-model="gradientStart" type="color" class="color-picker" />
        </div>
        <div class="gradient-input-group">
          <label>结束颜色</label>
          <input v-model="gradientEnd" type="color" class="color-picker" />
        </div>
        <div class="gradient-input-group">
          <label>步数</label>
          <input v-model.number="gradientSteps" type="number" class="neon-input" min="2" max="20" />
        </div>
      </div>
      <div class="gradient-preview">
        <div
          v-for="(color, index) in gradientColors"
          :key="index"
          class="gradient-step"
          :style="{ backgroundColor: color }"
          @click="applyColor(color)"
        >
          <div class="gradient-step-hex">{{ color }}</div>
        </div>
      </div>
      <div class="gradient-css">
        <div class="css-label">CSS 渐变代码:</div>
        <div class="css-code">{{ gradientCSS }}</div>
        <NeonButton @click="copyColor(gradientCSS)">
          <i class="i-mdi-content-copy" />
          复制 CSS
        </NeonButton>
      </div>
    </NeonCard>

    <!-- 转换历史 -->
    <NeonCard v-if="history.length > 0" title="转换历史" class="history-card">
      <div class="history-list">
        <div
          v-for="(item, index) in history"
          :key="index"
          class="history-item"
          @click="applyColor(item.hex)"
        >
          <div class="history-color" :style="{ backgroundColor: item.hex }"></div>
          <div class="history-info">
            <div class="history-hex">{{ item.hex }}</div>
            <div class="history-rgb">{{ item.rgb }}</div>
          </div>
        </div>
      </div>
      <div class="history-actions">
        <NeonButton size="small" @click="clearHistory">
          <i class="i-mdi-delete-outline" />
          清空历史
        </NeonButton>
      </div>
    </NeonCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'

interface RGB {
  r: number
  g: number
  b: number
}

interface HSL {
  h: number
  s: number
  l: number
}

interface RGBA {
  r: number
  g: number
  b: number
  a: number
}

interface ColorItem {
  name: string
  hex: string
}

interface HistoryItem {
  hex: string
  rgb: string
}

// 状态管理
const hex = ref('#21E6FF')
const rgb = ref<RGB>({ r: 33, g: 230, b: 255 })
const hsl = ref<HSL>({ h: 187, s: 100, l: 56 })
const rgba = ref<RGBA>({ r: 33, g: 230, b: 255, a: 1 })
const cssVar = ref('--neon-cyan')
const history = ref<HistoryItem[]>([])
const activeTab = ref('material')

// 渐变色
const gradientStart = ref('#21E6FF')
const gradientEnd = ref('#FF006E')
const gradientSteps = ref(5)

// 霓虹色板
const neonPalette: ColorItem[] = [
  { name: '霓虹蓝', hex: '#21E6FF' },
  { name: '霓虹粉', hex: '#FF006E' },
  { name: '霓虹紫', hex: '#B042FF' },
  { name: '霓虹绿', hex: '#39FF14' },
  { name: '霓虹橙', hex: '#FF9E00' },
  { name: '霓虹红', hex: '#FF073A' },
  { name: '霓虹黄', hex: '#FFFF00' },
  { name: '霓虹青', hex: '#00FFFF' },
]

// 常用色板
const colorTabs = [
  { id: 'material', name: 'Material' },
  { id: 'flat', name: 'Flat UI' },
  { id: 'web', name: 'Web安全色' },
]

const materialColors: ColorItem[] = [
  { name: 'Red 500', hex: '#F44336' },
  { name: 'Pink 500', hex: '#E91E63' },
  { name: 'Purple 500', hex: '#9C27B0' },
  { name: 'Deep Purple 500', hex: '#673AB7' },
  { name: 'Indigo 500', hex: '#3F51B5' },
  { name: 'Blue 500', hex: '#2196F3' },
  { name: 'Light Blue 500', hex: '#03A9F4' },
  { name: 'Cyan 500', hex: '#00BCD4' },
  { name: 'Teal 500', hex: '#009688' },
  { name: 'Green 500', hex: '#4CAF50' },
  { name: 'Light Green 500', hex: '#8BC34A' },
  { name: 'Lime 500', hex: '#CDDC39' },
  { name: 'Yellow 500', hex: '#FFEB3B' },
  { name: 'Amber 500', hex: '#FFC107' },
  { name: 'Orange 500', hex: '#FF9800' },
  { name: 'Deep Orange 500', hex: '#FF5722' },
]

const flatColors: ColorItem[] = [
  { name: 'Turquoise', hex: '#1ABC9C' },
  { name: 'Emerald', hex: '#2ECC71' },
  { name: 'Peter River', hex: '#3498DB' },
  { name: 'Amethyst', hex: '#9B59B6' },
  { name: 'Wet Asphalt', hex: '#34495E' },
  { name: 'Green Sea', hex: '#16A085' },
  { name: 'Nephritis', hex: '#27AE60' },
  { name: 'Belize Hole', hex: '#2980B9' },
  { name: 'Wisteria', hex: '#8E44AD' },
  { name: 'Midnight Blue', hex: '#2C3E50' },
  { name: 'Sun Flower', hex: '#F1C40F' },
  { name: 'Carrot', hex: '#E67E22' },
  { name: 'Alizarin', hex: '#E74C3C' },
  { name: 'Clouds', hex: '#ECF0F1' },
  { name: 'Concrete', hex: '#95A5A6' },
  { name: 'Orange', hex: '#F39C12' },
]

const webColors: ColorItem[] = [
  { name: 'Black', hex: '#000000' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Blue', hex: '#0000FF' },
  { name: 'Green', hex: '#008000' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Lime', hex: '#00FF00' },
  { name: 'Aqua', hex: '#00FFFF' },
  { name: 'Maroon', hex: '#800000' },
  { name: 'Purple', hex: '#800080' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Gray', hex: '#808080' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Red', hex: '#FF0000' },
  { name: 'Fuchsia', hex: '#FF00FF' },
  { name: 'Yellow', hex: '#FFFF00' },
  { name: 'White', hex: '#FFFFFF' },
]

// 计算属性
const currentColor = computed(() => hex.value)

const rgbString = computed(() => `rgb(${rgb.value.r}, ${rgb.value.g}, ${rgb.value.b})`)

const hslString = computed(() => `hsl(${hsl.value.h}, ${hsl.value.s}%, ${hsl.value.l}%)`)

const rgbaString = computed(() => `rgba(${rgba.value.r}, ${rgba.value.g}, ${rgba.value.b}, ${rgba.value.a})`)

const brightness = computed(() => {
  const { r, g, b } = rgb.value
  return Math.round((r * 299 + g * 587 + b * 114) / 1000 / 255 * 100)
})

const isDark = computed(() => brightness.value < 50)

const contrastColor = computed(() => isDark.value ? '#FFFFFF' : '#000000')

const currentPalette = computed(() => {
  switch (activeTab.value) {
    case 'material':
      return materialColors
    case 'flat':
      return flatColors
    case 'web':
      return webColors
    default:
      return materialColors
  }
})

const gradientColors = computed(() => {
  const colors: string[] = []
  const start = hexToRgb(gradientStart.value)
  const end = hexToRgb(gradientEnd.value)
  
  if (!start || !end) return colors
  
  for (let i = 0; i < gradientSteps.value; i++) {
    const ratio = i / (gradientSteps.value - 1)
    const r = Math.round(start.r + (end.r - start.r) * ratio)
    const g = Math.round(start.g + (end.g - start.g) * ratio)
    const b = Math.round(start.b + (end.b - start.b) * ratio)
    colors.push(rgbToHex({ r, g, b }))
  }
  
  return colors
})

const gradientCSS = computed(() => {
  return `background: linear-gradient(90deg, ${gradientStart.value}, ${gradientEnd.value});`
})

// 转换函数
function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    // 尝试解析短格式 #RGB
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)
    if (!shortResult) return null
    return {
      r: parseInt(shortResult[1] + shortResult[1], 16),
      g: parseInt(shortResult[2] + shortResult[2], 16),
      b: parseInt(shortResult[3] + shortResult[3], 16)
    }
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  }
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase()
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360
  const s = hsl.s / 100
  const l = hsl.l / 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

// 输入处理
function handleHexInput() {
  const rgbValue = hexToRgb(hex.value)
  if (rgbValue) {
    rgb.value = rgbValue
    rgba.value = { ...rgbValue, a: rgba.value.a }
    hsl.value = rgbToHsl(rgbValue)
    addToHistory()
  }
}

function handleRgbInput() {
  hex.value = rgbToHex(rgb.value)
  rgba.value = { ...rgb.value, a: rgba.value.a }
  hsl.value = rgbToHsl(rgb.value)
  addToHistory()
}

function handleHslInput() {
  const rgbValue = hslToRgb(hsl.value)
  rgb.value = rgbValue
  rgba.value = { ...rgbValue, a: rgba.value.a }
  hex.value = rgbToHex(rgbValue)
  addToHistory()
}

function handleRgbaInput() {
  rgb.value = { r: rgba.value.r, g: rgba.value.g, b: rgba.value.b }
  hex.value = rgbToHex(rgb.value)
  hsl.value = rgbToHsl(rgb.value)
  addToHistory()
}

function handleColorPicker() {
  handleHexInput()
}

function applyColor(color: string) {
  hex.value = color
  handleHexInput()
}

function copyColor(value: string) {
  navigator.clipboard.writeText(value).then(() => {
    ElMessage.success('颜色值已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function addToHistory() {
  const item: HistoryItem = {
    hex: hex.value,
    rgb: rgbString.value
  }
  
  // 避免重复
  const exists = history.value.some(h => h.hex === item.hex)
  if (!exists) {
    history.value.unshift(item)
    if (history.value.length > 20) {
      history.value.pop()
    }
    saveHistory()
  }
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('color-converter-history')
  ElMessage.success('历史记录已清空')
}

function saveHistory() {
  localStorage.setItem('color-converter-history', JSON.stringify(history.value))
}

function loadHistory() {
  const saved = localStorage.getItem('color-converter-history')
  if (saved) {
    try {
      history.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load history:', e)
    }
  }
}

onMounted(() => {
  loadHistory()
  handleHexInput()
})
</script>

<style scoped>
.color-converter {
  padding: var(--spacing-xl);
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-header h2 {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--neon-cyan);
  text-shadow: 0 0 20px rgba(33, 230, 255, 0.6);
  margin-bottom: var(--spacing-sm);
}

.page-description {
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
}

/* 颜色预览 */
.preview-card {
  margin-bottom: var(--spacing-xl);
}

.preview-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-xl);
}

@media (max-width: 768px) {
  .preview-section {
    grid-template-columns: 1fr;
  }
}

.color-preview {
  position: relative;
  height: 200px;
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
  overflow: hidden;
  transition: all var(--transition-base);
}

.color-preview:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.3);
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.5) 100%);
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.preview-text {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-mono);
  margin-bottom: var(--spacing-sm);
}

.preview-coords {
  font-size: var(--font-size-sm);
  opacity: 0.9;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.info-item label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.info-value {
  font-weight: var(--font-weight-semibold);
  color: var(--neon-cyan);
}

.contrast-preview {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
}

/* 转换器网格 */
.converter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

/* 格式输入 */
.format-input-group {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.neon-input {
  flex: 1;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-base);
  font-family: var(--font-family-mono);
  transition: all var(--transition-base);
}

.neon-input:focus {
  outline: none;
  border-color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.3);
}

.format-example {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
}

/* RGB/RGBA 输入 */
.rgb-inputs,
.rgba-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.rgba-inputs {
  grid-template-columns: repeat(4, 1fr);
}

.rgb-input-item,
.rgba-input-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.rgb-input-item label,
.rgba-input-item label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

/* HSL 输入 */
.hsl-inputs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.hsl-input-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.hsl-input-item label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.neon-slider {
  width: 100%;
  height: 6px;
  background: var(--color-bg);
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
}

.neon-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--neon-cyan);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.5);
}

.neon-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--neon-cyan);
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 10px rgba(33, 230, 255, 0.5);
}

/* 格式输出 */
.format-actions {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.format-output {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
}

/* 颜色选择器 */
.color-picker-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.color-picker {
  width: 100%;
  height: 80px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.color-picker:hover {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.3);
}

.picker-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

/* 色板 */
.palette-card {
  margin-bottom: var(--spacing-xl);
}

.palette-tabs {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.palette-tab {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
}

.palette-tab:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.palette-tab.active {
  border-color: var(--neon-cyan);
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.15) 0%, rgba(33, 230, 255, 0.05) 100%);
  color: var(--neon-cyan);
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.palette-item {
  position: relative;
  height: 100px;
  border-radius: var(--radius-md);
  border: 2px solid var(--color-border);
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-base);
}

.palette-item:hover {
  transform: translateY(-4px);
  border-color: var(--neon-cyan);
  box-shadow: 0 4px 20px rgba(33, 230, 255, 0.3);
}

.palette-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.palette-item:hover .palette-overlay {
  opacity: 1;
}

.palette-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
}

.palette-hex {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  opacity: 0.9;
}

/* 渐变色 */
.gradient-card {
  margin-bottom: var(--spacing-xl);
}

.gradient-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.gradient-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.gradient-input-group label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.gradient-preview {
  display: flex;
  gap: 2px;
  margin-bottom: var(--spacing-md);
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--color-border);
}

.gradient-step {
  flex: 1;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}

.gradient-step:hover {
  transform: scaleY(1.1);
  z-index: 1;
}

.gradient-step-hex {
  font-size: var(--font-size-xs);
  font-family: var(--font-family-mono);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.gradient-step:hover .gradient-step-hex {
  opacity: 1;
}

.gradient-css {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.css-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.css-code {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-cyan);
  word-break: break-all;
}

/* 历史记录 */
.history-card {
  margin-top: var(--spacing-xl);
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.history-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.history-item:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.history-color {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  flex-shrink: 0;
}

.history-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-xs);
  flex: 1;
  min-width: 0;
}

.history-hex {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.history-rgb {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
}
</style>

