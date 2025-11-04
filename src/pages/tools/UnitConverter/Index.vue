<template>
  <div class="unit-converter">
    <!-- 标题和说明 -->
    <div class="page-header">
      <h2>单位换算器</h2>
      <p class="page-description">支持长度、重量、温度、面积、体积、时间、存储、速度等多种单位互转</p>
    </div>

    <!-- 单位类型选择 -->
    <NeonCard title="选择单位类型" class="mb-4">
      <div class="unit-type-grid">
        <div
          v-for="type in unitTypes"
          :key="type.id"
          :class="['unit-type-card', { active: selectedType === type.id }]"
          @click="selectType(type.id)"
        >
          <i :class="type.icon" />
          <span>{{ type.name }}</span>
        </div>
      </div>
    </NeonCard>

    <!-- 转换区域 -->
    <div class="converter-section">
      <NeonCard title="转换" class="converter-card">
        <div class="converter-grid">
          <!-- 源单位 -->
          <div class="converter-input-group">
            <label>从</label>
            <div class="input-with-select">
              <input
                v-model.number="sourceValue"
                type="number"
                class="neon-input"
                placeholder="输入数值"
                @input="handleConvert"
              />
              <select v-model="sourceUnit" class="neon-select" @change="handleConvert">
                <option v-for="unit in currentUnits" :key="unit.id" :value="unit.id">
                  {{ unit.name }} ({{ unit.symbol }})
                </option>
              </select>
            </div>
          </div>

          <!-- 转换图标 -->
          <div class="converter-icon">
            <i class="i-mdi-arrow-right-bold" />
          </div>

          <!-- 目标单位 -->
          <div class="converter-input-group">
            <label>到</label>
            <div class="input-with-select">
              <input
                v-model="targetValue"
                type="text"
                class="neon-input"
                placeholder="转换结果"
                readonly
              />
              <select v-model="targetUnit" class="neon-select" @change="handleConvert">
                <option v-for="unit in currentUnits" :key="unit.id" :value="unit.id">
                  {{ unit.name }} ({{ unit.symbol }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="converter-actions">
          <NeonButton type="primary" @click="swapUnits">
            <i class="i-mdi-swap-horizontal" />
            交换单位
          </NeonButton>
          <NeonButton @click="copyResult">
            <i class="i-mdi-content-copy" />
            复制结果
          </NeonButton>
          <NeonButton @click="clearInput">
            <i class="i-mdi-refresh" />
            清空
          </NeonButton>
        </div>
      </NeonCard>

      <!-- 常用转换快捷方式 -->
      <NeonCard title="常用转换" class="shortcuts-card">
        <div class="shortcuts-grid">
          <div
            v-for="shortcut in currentShortcuts"
            :key="shortcut.label"
            class="shortcut-item"
            @click="applyShortcut(shortcut)"
          >
            <div class="shortcut-label">{{ shortcut.label }}</div>
            <div class="shortcut-formula">{{ shortcut.formula }}</div>
          </div>
        </div>
      </NeonCard>
    </div>

    <!-- 转换历史 -->
    <NeonCard v-if="history.length > 0" title="转换历史" class="history-card">
      <div class="history-list">
        <div v-for="(item, index) in history" :key="index" class="history-item">
          <div class="history-content">
            <span class="history-source">{{ item.sourceValue }} {{ item.sourceSymbol }}</span>
            <i class="i-mdi-arrow-right history-arrow" />
            <span class="history-target">{{ item.targetValue }} {{ item.targetSymbol }}</span>
          </div>
          <div class="history-type">{{ item.typeName }}</div>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'

interface Unit {
  id: string
  name: string
  symbol: string
  toBase: number // 转换为基准单位的系数
}

interface UnitType {
  id: string
  name: string
  icon: string
  units: Unit[]
  shortcuts: Shortcut[]
}

interface Shortcut {
  label: string
  formula: string
  sourceUnit: string
  targetUnit: string
  sourceValue: number
}

interface HistoryItem {
  sourceValue: number
  sourceSymbol: string
  targetValue: string
  targetSymbol: string
  typeName: string
}

// 单位类型定义
const unitTypes: UnitType[] = [
  {
    id: 'length',
    name: '长度',
    icon: 'i-mdi-ruler',
    units: [
      { id: 'meter', name: '米', symbol: 'm', toBase: 1 },
      { id: 'kilometer', name: '千米', symbol: 'km', toBase: 1000 },
      { id: 'centimeter', name: '厘米', symbol: 'cm', toBase: 0.01 },
      { id: 'millimeter', name: '毫米', symbol: 'mm', toBase: 0.001 },
      { id: 'mile', name: '英里', symbol: 'mi', toBase: 1609.34 },
      { id: 'yard', name: '码', symbol: 'yd', toBase: 0.9144 },
      { id: 'foot', name: '英尺', symbol: 'ft', toBase: 0.3048 },
      { id: 'inch', name: '英寸', symbol: 'in', toBase: 0.0254 },
    ],
    shortcuts: [
      { label: '1 千米 = ? 米', formula: '1 km = 1000 m', sourceUnit: 'kilometer', targetUnit: 'meter', sourceValue: 1 },
      { label: '1 英里 = ? 千米', formula: '1 mi ≈ 1.609 km', sourceUnit: 'mile', targetUnit: 'kilometer', sourceValue: 1 },
      { label: '1 米 = ? 英尺', formula: '1 m ≈ 3.281 ft', sourceUnit: 'meter', targetUnit: 'foot', sourceValue: 1 },
    ]
  },
  {
    id: 'weight',
    name: '重量',
    icon: 'i-mdi-weight',
    units: [
      { id: 'kilogram', name: '千克', symbol: 'kg', toBase: 1 },
      { id: 'gram', name: '克', symbol: 'g', toBase: 0.001 },
      { id: 'milligram', name: '毫克', symbol: 'mg', toBase: 0.000001 },
      { id: 'ton', name: '吨', symbol: 't', toBase: 1000 },
      { id: 'pound', name: '磅', symbol: 'lb', toBase: 0.453592 },
      { id: 'ounce', name: '盎司', symbol: 'oz', toBase: 0.0283495 },
    ],
    shortcuts: [
      { label: '1 千克 = ? 克', formula: '1 kg = 1000 g', sourceUnit: 'kilogram', targetUnit: 'gram', sourceValue: 1 },
      { label: '1 磅 = ? 千克', formula: '1 lb ≈ 0.454 kg', sourceUnit: 'pound', targetUnit: 'kilogram', sourceValue: 1 },
      { label: '1 吨 = ? 千克', formula: '1 t = 1000 kg', sourceUnit: 'ton', targetUnit: 'kilogram', sourceValue: 1 },
    ]
  },
  {
    id: 'temperature',
    name: '温度',
    icon: 'i-mdi-thermometer',
    units: [
      { id: 'celsius', name: '摄氏度', symbol: '°C', toBase: 1 },
      { id: 'fahrenheit', name: '华氏度', symbol: '°F', toBase: 1 },
      { id: 'kelvin', name: '开尔文', symbol: 'K', toBase: 1 },
    ],
    shortcuts: [
      { label: '0°C = ? °F', formula: '0°C = 32°F', sourceUnit: 'celsius', targetUnit: 'fahrenheit', sourceValue: 0 },
      { label: '100°C = ? °F', formula: '100°C = 212°F', sourceUnit: 'celsius', targetUnit: 'fahrenheit', sourceValue: 100 },
      { label: '0 K = ? °C', formula: '0 K = -273.15°C', sourceUnit: 'kelvin', targetUnit: 'celsius', sourceValue: 0 },
    ]
  },
  {
    id: 'area',
    name: '面积',
    icon: 'i-mdi-texture-box',
    units: [
      { id: 'square-meter', name: '平方米', symbol: 'm²', toBase: 1 },
      { id: 'square-kilometer', name: '平方千米', symbol: 'km²', toBase: 1000000 },
      { id: 'square-centimeter', name: '平方厘米', symbol: 'cm²', toBase: 0.0001 },
      { id: 'hectare', name: '公顷', symbol: 'ha', toBase: 10000 },
      { id: 'acre', name: '英亩', symbol: 'ac', toBase: 4046.86 },
      { id: 'square-foot', name: '平方英尺', symbol: 'ft²', toBase: 0.092903 },
    ],
    shortcuts: [
      { label: '1 公顷 = ? 平方米', formula: '1 ha = 10000 m²', sourceUnit: 'hectare', targetUnit: 'square-meter', sourceValue: 1 },
      { label: '1 平方千米 = ? 公顷', formula: '1 km² = 100 ha', sourceUnit: 'square-kilometer', targetUnit: 'hectare', sourceValue: 1 },
      { label: '1 英亩 = ? 平方米', formula: '1 ac ≈ 4047 m²', sourceUnit: 'acre', targetUnit: 'square-meter', sourceValue: 1 },
    ]
  },
  {
    id: 'volume',
    name: '体积',
    icon: 'i-mdi-cube-outline',
    units: [
      { id: 'liter', name: '升', symbol: 'L', toBase: 1 },
      { id: 'milliliter', name: '毫升', symbol: 'mL', toBase: 0.001 },
      { id: 'cubic-meter', name: '立方米', symbol: 'm³', toBase: 1000 },
      { id: 'gallon', name: '加仑', symbol: 'gal', toBase: 3.78541 },
      { id: 'quart', name: '夸脱', symbol: 'qt', toBase: 0.946353 },
      { id: 'pint', name: '品脱', symbol: 'pt', toBase: 0.473176 },
    ],
    shortcuts: [
      { label: '1 升 = ? 毫升', formula: '1 L = 1000 mL', sourceUnit: 'liter', targetUnit: 'milliliter', sourceValue: 1 },
      { label: '1 立方米 = ? 升', formula: '1 m³ = 1000 L', sourceUnit: 'cubic-meter', targetUnit: 'liter', sourceValue: 1 },
      { label: '1 加仑 = ? 升', formula: '1 gal ≈ 3.785 L', sourceUnit: 'gallon', targetUnit: 'liter', sourceValue: 1 },
    ]
  },
  {
    id: 'time',
    name: '时间',
    icon: 'i-mdi-clock-outline',
    units: [
      { id: 'second', name: '秒', symbol: 's', toBase: 1 },
      { id: 'minute', name: '分钟', symbol: 'min', toBase: 60 },
      { id: 'hour', name: '小时', symbol: 'h', toBase: 3600 },
      { id: 'day', name: '天', symbol: 'd', toBase: 86400 },
      { id: 'week', name: '周', symbol: 'wk', toBase: 604800 },
      { id: 'month', name: '月', symbol: 'mo', toBase: 2592000 },
      { id: 'year', name: '年', symbol: 'yr', toBase: 31536000 },
    ],
    shortcuts: [
      { label: '1 小时 = ? 分钟', formula: '1 h = 60 min', sourceUnit: 'hour', targetUnit: 'minute', sourceValue: 1 },
      { label: '1 天 = ? 小时', formula: '1 d = 24 h', sourceUnit: 'day', targetUnit: 'hour', sourceValue: 1 },
      { label: '1 周 = ? 天', formula: '1 wk = 7 d', sourceUnit: 'week', targetUnit: 'day', sourceValue: 1 },
    ]
  },
  {
    id: 'storage',
    name: '存储',
    icon: 'i-mdi-harddisk',
    units: [
      { id: 'byte', name: '字节', symbol: 'B', toBase: 1 },
      { id: 'kilobyte', name: '千字节', symbol: 'KB', toBase: 1024 },
      { id: 'megabyte', name: '兆字节', symbol: 'MB', toBase: 1048576 },
      { id: 'gigabyte', name: '吉字节', symbol: 'GB', toBase: 1073741824 },
      { id: 'terabyte', name: '太字节', symbol: 'TB', toBase: 1099511627776 },
      { id: 'petabyte', name: '拍字节', symbol: 'PB', toBase: 1125899906842624 },
    ],
    shortcuts: [
      { label: '1 KB = ? B', formula: '1 KB = 1024 B', sourceUnit: 'kilobyte', targetUnit: 'byte', sourceValue: 1 },
      { label: '1 MB = ? KB', formula: '1 MB = 1024 KB', sourceUnit: 'megabyte', targetUnit: 'kilobyte', sourceValue: 1 },
      { label: '1 GB = ? MB', formula: '1 GB = 1024 MB', sourceUnit: 'gigabyte', targetUnit: 'megabyte', sourceValue: 1 },
    ]
  },
  {
    id: 'speed',
    name: '速度',
    icon: 'i-mdi-speedometer',
    units: [
      { id: 'meter-per-second', name: '米/秒', symbol: 'm/s', toBase: 1 },
      { id: 'kilometer-per-hour', name: '千米/小时', symbol: 'km/h', toBase: 0.277778 },
      { id: 'mile-per-hour', name: '英里/小时', symbol: 'mph', toBase: 0.44704 },
      { id: 'knot', name: '节', symbol: 'kn', toBase: 0.514444 },
    ],
    shortcuts: [
      { label: '100 km/h = ? m/s', formula: '100 km/h ≈ 27.78 m/s', sourceUnit: 'kilometer-per-hour', targetUnit: 'meter-per-second', sourceValue: 100 },
      { label: '60 mph = ? km/h', formula: '60 mph ≈ 96.56 km/h', sourceUnit: 'mile-per-hour', targetUnit: 'kilometer-per-hour', sourceValue: 60 },
      { label: '1 m/s = ? km/h', formula: '1 m/s = 3.6 km/h', sourceUnit: 'meter-per-second', targetUnit: 'kilometer-per-hour', sourceValue: 1 },
    ]
  },
]

// 状态管理
const selectedType = ref('length')
const sourceValue = ref<number | null>(null)
const targetValue = ref('')
const sourceUnit = ref('meter')
const targetUnit = ref('kilometer')
const history = ref<HistoryItem[]>([])

// 计算属性
const currentUnits = computed(() => {
  return unitTypes.find(t => t.id === selectedType.value)?.units || []
})

const currentShortcuts = computed(() => {
  return unitTypes.find(t => t.id === selectedType.value)?.shortcuts || []
})

const currentTypeName = computed(() => {
  return unitTypes.find(t => t.id === selectedType.value)?.name || ''
})

// 方法
const selectType = (typeId: string) => {
  selectedType.value = typeId
  const firstUnit = currentUnits.value[0]
  const secondUnit = currentUnits.value[1] || currentUnits.value[0]
  sourceUnit.value = firstUnit.id
  targetUnit.value = secondUnit.id
  sourceValue.value = null
  targetValue.value = ''
}

const handleConvert = () => {
  if (sourceValue.value === null || sourceValue.value === undefined || isNaN(sourceValue.value)) {
    targetValue.value = ''
    return
  }

  // 温度转换特殊处理
  if (selectedType.value === 'temperature') {
    targetValue.value = convertTemperature(sourceValue.value, sourceUnit.value, targetUnit.value)
  } else {
    // 其他单位转换
    const source = currentUnits.value.find(u => u.id === sourceUnit.value)
    const target = currentUnits.value.find(u => u.id === targetUnit.value)
    
    if (source && target) {
      const baseValue = sourceValue.value * source.toBase
      const result = baseValue / target.toBase
      targetValue.value = formatResult(result)
    }
  }

  // 添加到历史
  if (targetValue.value && sourceValue.value !== null) {
    addToHistory()
  }
}

const convertTemperature = (value: number, from: string, to: string): string => {
  let celsius: number

  // 转换为摄氏度
  switch (from) {
    case 'celsius':
      celsius = value
      break
    case 'fahrenheit':
      celsius = (value - 32) * 5 / 9
      break
    case 'kelvin':
      celsius = value - 273.15
      break
    default:
      celsius = value
  }

  // 从摄氏度转换为目标单位
  let result: number
  switch (to) {
    case 'celsius':
      result = celsius
      break
    case 'fahrenheit':
      result = celsius * 9 / 5 + 32
      break
    case 'kelvin':
      result = celsius + 273.15
      break
    default:
      result = celsius
  }

  return formatResult(result)
}

const formatResult = (value: number): string => {
  if (Math.abs(value) >= 1000000 || (Math.abs(value) < 0.001 && value !== 0)) {
    return value.toExponential(6)
  } else if (Math.abs(value) >= 100) {
    return value.toFixed(2)
  } else if (Math.abs(value) >= 1) {
    return value.toFixed(4)
  } else {
    return value.toFixed(8).replace(/\.?0+$/, '')
  }
}

const swapUnits = () => {
  const temp = sourceUnit.value
  sourceUnit.value = targetUnit.value
  targetUnit.value = temp
  
  if (targetValue.value) {
    sourceValue.value = parseFloat(targetValue.value)
    handleConvert()
  }
}

const copyResult = () => {
  if (!targetValue.value) {
    ElMessage.warning('没有可复制的结果')
    return
  }
  
  navigator.clipboard.writeText(targetValue.value).then(() => {
    ElMessage.success('结果已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const clearInput = () => {
  sourceValue.value = null
  targetValue.value = ''
}

const applyShortcut = (shortcut: Shortcut) => {
  sourceUnit.value = shortcut.sourceUnit
  targetUnit.value = shortcut.targetUnit
  sourceValue.value = shortcut.sourceValue
  handleConvert()
}

const addToHistory = () => {
  const source = currentUnits.value.find(u => u.id === sourceUnit.value)
  const target = currentUnits.value.find(u => u.id === targetUnit.value)
  
  if (source && target && sourceValue.value !== null) {
    const item: HistoryItem = {
      sourceValue: sourceValue.value,
      sourceSymbol: source.symbol,
      targetValue: targetValue.value,
      targetSymbol: target.symbol,
      typeName: currentTypeName.value
    }
    
    history.value.unshift(item)
    if (history.value.length > 10) {
      history.value.pop()
    }
    
    saveHistory()
  }
}

const clearHistory = () => {
  history.value = []
  localStorage.removeItem('unit-converter-history')
  ElMessage.success('历史记录已清空')
}

const saveHistory = () => {
  localStorage.setItem('unit-converter-history', JSON.stringify(history.value))
}

const loadHistory = () => {
  const saved = localStorage.getItem('unit-converter-history')
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
})
</script>

<style scoped>
.unit-converter {
  padding: var(--spacing-xl);
  max-width: 1400px;
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

.mb-4 {
  margin-bottom: var(--spacing-xl);
}

/* 单位类型网格 */
.unit-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.unit-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.unit-type-card i {
  font-size: 2em;
  color: var(--color-muted);
  transition: all var(--transition-base);
}

.unit-type-card span {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  transition: all var(--transition-base);
}

.unit-type-card:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
  transform: translateY(-2px);
}

.unit-type-card:hover i {
  color: var(--neon-cyan);
}

.unit-type-card.active {
  border-color: var(--neon-cyan);
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.15) 0%, rgba(33, 230, 255, 0.05) 100%);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.3);
}

.unit-type-card.active i {
  color: var(--neon-cyan);
  filter: drop-shadow(0 0 8px var(--neon-cyan));
}

.unit-type-card.active span {
  color: var(--neon-cyan);
}

/* 转换区域 */
.converter-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 1024px) {
  .converter-section {
    grid-template-columns: 1fr;
  }
}

.converter-card,
.shortcuts-card {
  height: fit-content;
}

.converter-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--spacing-xl);
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

@media (max-width: 768px) {
  .converter-grid {
    grid-template-columns: 1fr;
  }
  
  .converter-icon {
    transform: rotate(90deg);
  }
}

.converter-input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.converter-input-group label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.input-with-select {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.neon-input,
.neon-select {
  width: 100%;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--font-size-base);
  transition: all var(--transition-base);
}

.neon-input:focus,
.neon-select:focus {
  outline: none;
  border-color: var(--neon-cyan);
  box-shadow: 0 0 15px rgba(33, 230, 255, 0.3);
}

.neon-input[readonly] {
  background: var(--color-panel);
  cursor: not-allowed;
  color: var(--neon-cyan);
  font-weight: var(--font-weight-semibold);
}

.converter-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2em;
  color: var(--neon-cyan);
  opacity: 0.6;
}

/* 操作按钮 */
.converter-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* 快捷方式 */
.shortcuts-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.shortcut-item {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.shortcut-item:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
  transform: translateX(4px);
}

.shortcut-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.shortcut-formula {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

/* 历史记录 */
.history-card {
  margin-top: var(--spacing-xl);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.history-item:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.history-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-family: var(--font-family-mono);
}

.history-source {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

.history-arrow {
  color: var(--color-muted);
  font-size: 1.2em;
}

.history-target {
  color: var(--neon-cyan);
  font-weight: var(--font-weight-semibold);
}

.history-type {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: var(--color-panel);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.history-actions {
  display: flex;
  justify-content: flex-end;
}
</style>

