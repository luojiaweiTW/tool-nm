<template>
  <div class="weather-page">
    <Header title="天气查询" subtitle="查看多个城市的实时天气" icon="i-mdi-weather-partly-cloudy" />

    <div class="weather-content">
      <!-- 城市管理卡片 -->
      <NeonCard title="我的城市" class="cities-card">
        <template #extra>
          <div style="display: flex; gap: 8px;">
            <NeonButton size="small" @click="showApiKeyDialog = true" title="配置 API Key">
              <i class="i-mdi-key" />
            </NeonButton>
            <NeonButton size="small" @click="showAddCity = true" :disabled="!apiKey">
              <i class="i-mdi-plus" />
              添加城市
            </NeonButton>
          </div>
        </template>

        <div v-if="!apiKey" class="empty-cities">
          <i class="i-mdi-key-outline" />
          <p>请先配置 API Key</p>
          <p class="hint">点击右上角钥匙图标配置和风天气 API Key</p>
          <NeonButton @click="showApiKeyDialog = true" style="margin-top: 16px;">
            <i class="i-mdi-key" />
            立即配置
          </NeonButton>
        </div>

        <div v-else-if="savedCities.length === 0" class="empty-cities">
          <i class="i-mdi-map-marker-outline" />
          <p>还没有添加城市</p>
          <p class="hint">点击右上角添加按钮添加你关注的城市</p>
        </div>

        <div v-else class="cities-list">
          <div
            v-for="city in savedCities"
            :key="city.id"
            class="city-item"
            :class="{ active: currentCity?.id === city.id }"
            @click="selectCity(city)"
          >
            <div class="city-info">
              <div class="city-name">
                <i class="i-mdi-map-marker" />
                {{ city.name }}
              </div>
              <div v-if="city.weather" class="city-weather">
                <span class="temp">{{ city.weather.temp }}°</span>
                <span class="weather-text">{{ city.weather.text }}</span>
              </div>
            </div>
            <button class="delete-btn" @click.stop="deleteCity(city.id)" title="删除">
              <i class="i-mdi-close" />
            </button>
          </div>
        </div>
      </NeonCard>

      <!-- 天气详情卡片 -->
      <div v-if="currentCity" class="weather-detail">
        <!-- 加载中 -->
        <div v-if="loading" class="loading-state">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>加载天气数据中...</p>
        </div>

        <!-- 天气信息 -->
        <div v-else-if="weatherData" class="weather-info">
          <!-- 主要天气信息 -->
          <NeonCard class="main-weather">
            <div class="weather-main">
              <div class="weather-icon">
                <i :class="getWeatherIcon(weatherData.text)" />
              </div>
              <div class="weather-primary">
                <div class="location">
                  <i class="i-mdi-map-marker" />
                  <span>{{ currentCity.name }}</span>
                </div>
                <div class="temperature">{{ weatherData.temp }}°C</div>
                <div class="weather-text">{{ weatherData.text }}</div>
                <div class="update-time">
                  <i class="i-mdi-clock-outline" />
                  更新时间：{{ formatTime(weatherData.updateTime) }}
                </div>
              </div>
            </div>
          </NeonCard>

          <!-- 详细信息网格 -->
          <div class="weather-details-grid">
            <NeonCard compact class="detail-item">
              <div class="detail-icon">
                <i class="i-mdi-thermometer" />
              </div>
              <div class="detail-info">
                <div class="detail-label">体感温度</div>
                <div class="detail-value">{{ weatherData.feelsLike }}°C</div>
              </div>
            </NeonCard>

            <NeonCard compact class="detail-item">
              <div class="detail-icon">
                <i class="i-mdi-water-percent" />
              </div>
              <div class="detail-info">
                <div class="detail-label">相对湿度</div>
                <div class="detail-value">{{ weatherData.humidity }}%</div>
              </div>
            </NeonCard>

            <NeonCard compact class="detail-item">
              <div class="detail-icon">
                <i class="i-mdi-weather-windy" />
              </div>
              <div class="detail-info">
                <div class="detail-label">风速风向</div>
                <div class="detail-value">{{ weatherData.windDir }} {{ weatherData.windScale }}级</div>
              </div>
            </NeonCard>

            <NeonCard compact class="detail-item">
              <div class="detail-icon">
                <i class="i-mdi-gauge" />
              </div>
              <div class="detail-info">
                <div class="detail-label">气压</div>
                <div class="detail-value">{{ weatherData.pressure }} hPa</div>
              </div>
            </NeonCard>

            <NeonCard compact class="detail-item">
              <div class="detail-icon">
                <i class="i-mdi-eye" />
              </div>
              <div class="detail-info">
                <div class="detail-label">能见度</div>
                <div class="detail-value">{{ weatherData.vis }} km</div>
              </div>
            </NeonCard>

            <NeonCard compact class="detail-item">
              <div class="detail-icon">
                <i class="i-mdi-cloud" />
              </div>
              <div class="detail-info">
                <div class="detail-label">云量</div>
                <div class="detail-value">{{ weatherData.cloud }}%</div>
              </div>
            </NeonCard>
          </div>

          <!-- 未来天气预报 -->
          <NeonCard v-if="forecast && forecast.length > 0" title="未来天气" class="forecast-card">
            <div class="forecast-list">
              <div v-for="day in forecast" :key="day.date" class="forecast-item">
                <div class="forecast-date">{{ formatDate(day.date) }}</div>
                <div class="forecast-icon">
                  <i :class="getWeatherIcon(day.textDay)" />
                </div>
                <div class="forecast-text">{{ day.textDay }}</div>
                <div class="forecast-temp">
                  <span class="temp-high">{{ day.tempMax }}°</span>
                  <span class="temp-divider">/</span>
                  <span class="temp-low">{{ day.tempMin }}°</span>
                </div>
              </div>
            </div>
          </NeonCard>
        </div>

        <!-- 错误状态 -->
        <div v-else class="error-state">
          <i class="i-mdi-alert-circle-outline" />
          <p>加载天气数据失败</p>
          <NeonButton @click="loadWeatherData">重试</NeonButton>
        </div>
      </div>

      <!-- 未选择城市 -->
      <div v-else class="no-city-selected">
        <i class="i-mdi-map-search-outline" />
        <p>请选择或添加一个城市</p>
      </div>
    </div>

    <!-- API Key 设置对话框 -->
    <el-dialog
      v-model="showApiKeyDialog"
      title="配置和风天气 API Key"
      width="600px"
      :close-on-click-modal="false"
      :show-close="!!apiKey"
    >
      <div class="api-key-dialog">
        <div class="api-key-info">
          <i class="i-mdi-information-outline" />
          <div>
            <p><strong>获取免费 API Key：</strong></p>
            <ol>
              <li>访问 <a href="https://dev.qweather.com/" target="_blank">和风天气开发平台</a></li>
              <li>注册并登录账号</li>
              <li>创建项目，选择 <strong>Web API</strong></li>
              <li>创建 KEY，选择 <strong>免费订阅</strong></li>
              <li>复制生成的 API Key 粘贴到下方</li>
              <li>⚠️ <strong>重要</strong>：等待几分钟让 Key 激活后再使用</li>
            </ol>
            <p class="limit-info">免费版限制：每天 1000 次请求，仅支持开发测试</p>
            <p class="api-key-warning">⚠️ 如果出现 403 错误，请检查 Key 是否已激活或是否选择了正确的订阅类型</p>
          </div>
        </div>
        
        <el-input
          v-model="tempApiKey"
          placeholder="请输入和风天气 API Key"
          clearable
          size="large"
        >
          <template #prefix>
            <i class="i-mdi-key" />
          </template>
        </el-input>

        <div class="api-key-actions">
          <el-button @click="cancelApiKeyDialog" v-if="apiKey">取消</el-button>
          <el-button type="primary" @click="saveApiKey" :disabled="!tempApiKey">
            保存配置
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加城市对话框 -->
    <el-dialog
      v-model="showAddCity"
      title="添加城市"
      width="500px"
      :close-on-click-modal="false"
    >
      <div class="add-city-dialog">
        <div class="search-tip">
          <i class="i-mdi-information-outline" />
          <span>从预设城市列表中搜索（已包含国内20个主要城市）</span>
        </div>

        <el-input
          v-model="searchQuery"
          placeholder="输入城市名称搜索（如：北京、上海、深圳）"
          clearable
        >
          <template #prefix>
            <i class="i-mdi-magnify" />
          </template>
        </el-input>

        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="city in searchResults"
            :key="city.id"
            class="search-result-item"
            @click="addCity(city)"
          >
            <div class="result-name">
              <i class="i-mdi-map-marker" />
              {{ city.name }}
            </div>
            <div class="result-info">{{ city.country }} - {{ city.adm1 }}</div>
          </div>
        </div>

        <div v-else-if="searchQuery" class="no-results">
          <i class="i-mdi-magnify" />
          <p>未找到相关城市</p>
        </div>

        <div v-else-if="searchQuery.trim()" class="no-results">
          <i class="i-mdi-alert-circle-outline" />
          <p>未找到匹配的城市</p>
        </div>

        <div v-else class="preset-cities">
          <div class="preset-title">热门城市</div>
          <div class="preset-grid">
            <div
              v-for="city in PRESET_CITIES.slice(0, 12)"
              :key="city.id"
              class="preset-city-item"
              @click="addCity(city)"
            >
              <i class="i-mdi-map-marker" />
              <span>{{ city.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'

interface City {
  id: string
  name: string
  country: string
  adm1: string
  lat: string
  lon: string
  weather?: {
    temp: string
    text: string
  }
}

interface WeatherData {
  temp: string
  feelsLike: string
  text: string
  humidity: string
  windDir: string
  windScale: string
  pressure: string
  vis: string
  cloud: string
  updateTime: string
}

interface ForecastDay {
  date: string
  tempMax: string
  tempMin: string
  textDay: string
  textNight: string
}

// 状态
const savedCities = ref<City[]>([])
const currentCity = ref<City | null>(null)
const weatherData = ref<WeatherData | null>(null)
const forecast = ref<ForecastDay[]>([])
const loading = ref(false)
const showAddCity = ref(false)
const searchQuery = ref('')
const searchResults = ref<City[]>([])
const searchLoading = ref(false)

// API Key 配置
const apiKey = ref('')
const tempApiKey = ref('')
const showApiKeyDialog = ref(false)

// 本地存储键名
const STORAGE_KEY = 'weather-cities'
const API_KEY_STORAGE = 'weather-api-key'

// 预设热门城市列表（免费版API不支持城市搜索，提供常用城市）
const PRESET_CITIES: City[] = [
  { id: '101010100', name: '北京', country: '中国', adm1: '北京', lat: '39.90499', lon: '116.40529' },
  { id: '101020100', name: '上海', country: '中国', adm1: '上海', lat: '31.23039', lon: '121.47370' },
  { id: '101280101', name: '广州', country: '中国', adm1: '广东', lat: '23.12518', lon: '113.28065' },
  { id: '101280601', name: '深圳', country: '中国', adm1: '广东', lat: '22.54286', lon: '114.05957' },
  { id: '101210101', name: '杭州', country: '中国', adm1: '浙江', lat: '30.28745', lon: '120.15358' },
  { id: '101030100', name: '天津', country: '中国', adm1: '天津', lat: '39.08540', lon: '117.19940' },
  { id: '101190101', name: '南京', country: '中国', adm1: '江苏', lat: '32.04154', lon: '118.76741' },
  { id: '101230101', name: '福州', country: '中国', adm1: '福建', lat: '26.07530', lon: '119.30623' },
  { id: '101230201', name: '厦门', country: '中国', adm1: '福建', lat: '24.47950', lon: '118.08950' },
  { id: '101200101', name: '武汉', country: '中国', adm1: '湖北', lat: '30.59276', lon: '114.30525' },
  { id: '101270101', name: '成都', country: '中国', adm1: '四川', lat: '30.66208', lon: '104.06570' },
  { id: '101040100', name: '重庆', country: '中国', adm1: '重庆', lat: '29.56357', lon: '106.55066' },
  { id: '101110101', name: '西安', country: '中国', adm1: '陕西', lat: '34.26600', lon: '108.94140' },
  { id: '101250101', name: '长沙', country: '中国', adm1: '湖南', lat: '28.22880', lon: '112.94068' },
  { id: '101120101', name: '济南', country: '中国', adm1: '山东', lat: '36.65150', lon: '117.12000' },
  { id: '101120201', name: '青岛', country: '中国', adm1: '山东', lat: '36.06640', lon: '120.38264' },
  { id: '101070101', name: '沈阳', country: '中国', adm1: '辽宁', lat: '41.80571', lon: '123.43148' },
  { id: '101060101', name: '长春', country: '中国', adm1: '吉林', lat: '43.81800', lon: '125.32357' },
  { id: '101050101', name: '哈尔滨', country: '中国', adm1: '黑龙江', lat: '45.80200', lon: '126.53400' },
  { id: '101240101', name: '南昌', country: '中国', adm1: '江西', lat: '28.68202', lon: '115.85800' },
]

// 初始化
onMounted(() => {
  loadApiKey()
  loadSavedCities()
  
  // 如果没有 API Key，自动打开配置对话框
  if (!apiKey.value) {
    showApiKeyDialog.value = true
  }
})

// 加载 API Key
function loadApiKey() {
  try {
    const saved = localStorage.getItem(API_KEY_STORAGE)
    if (saved) {
      apiKey.value = saved
    }
  } catch (error) {
    console.error('Failed to load API key:', error)
  }
}

// 保存 API Key
function saveApiKey() {
  if (!tempApiKey.value.trim()) {
    ElMessage.warning('请输入 API Key')
    return
  }
  
  try {
    localStorage.setItem(API_KEY_STORAGE, tempApiKey.value.trim())
    apiKey.value = tempApiKey.value.trim()
    showApiKeyDialog.value = false
    ElMessage.success('API Key 配置成功！')
    
    // 如果有城市，重新加载天气
    if (currentCity.value) {
      loadWeatherData()
    }
  } catch (error) {
    console.error('Failed to save API key:', error)
    ElMessage.error('保存失败')
  }
}

// 取消 API Key 配置
function cancelApiKeyDialog() {
  tempApiKey.value = apiKey.value
  showApiKeyDialog.value = false
}

// 加载保存的城市
function loadSavedCities() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      savedCities.value = JSON.parse(saved)
      if (savedCities.value.length > 0) {
        selectCity(savedCities.value[0])
      }
    }
  } catch (error) {
    console.error('Failed to load saved cities:', error)
  }
}

// 保存城市列表
function saveCities() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCities.value))
  } catch (error) {
    console.error('Failed to save cities:', error)
  }
}

// 搜索城市（从预设列表中搜索）
function searchCity() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  const query = searchQuery.value.toLowerCase().trim()
  
  // 从预设城市列表中搜索
  searchResults.value = PRESET_CITIES.filter(city => 
    city.name.toLowerCase().includes(query) ||
    city.adm1.toLowerCase().includes(query)
  ).slice(0, 10) // 最多显示10个结果
}

// 监听搜索输入（带防抖）
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    searchCity()
  }, 300)
})

// 添加城市
function addCity(city: City) {
  // 检查是否已存在
  if (savedCities.value.some(c => c.id === city.id)) {
    ElMessage.warning('该城市已添加')
    return
  }

  savedCities.value.push(city)
  saveCities()
  showAddCity.value = false
  searchQuery.value = ''
  searchResults.value = []
  ElMessage.success(`已添加 ${city.name}`)
  
  // 自动选中新添加的城市
  selectCity(city)
}

// 删除城市
function deleteCity(cityId: string) {
  const index = savedCities.value.findIndex(c => c.id === cityId)
  if (index > -1) {
    const cityName = savedCities.value[index].name
    savedCities.value.splice(index, 1)
    saveCities()
    ElMessage.success(`已删除 ${cityName}`)
    
    // 如果删除的是当前城市，切换到第一个城市
    if (currentCity.value?.id === cityId) {
      currentCity.value = savedCities.value.length > 0 ? savedCities.value[0] : null
      if (currentCity.value) {
        loadWeatherData()
      } else {
        weatherData.value = null
        forecast.value = []
      }
    }
  }
}

// 选择城市
function selectCity(city: City) {
  currentCity.value = city
  loadWeatherData()
}

// 加载天气数据
async function loadWeatherData() {
  if (!currentCity.value) return
  
  if (!apiKey.value) {
    ElMessage.warning('请先配置 API Key')
    return
  }

  loading.value = true
  weatherData.value = null
  forecast.value = []

  try {
    console.log('Loading weather for city:', currentCity.value.name, currentCity.value.id)
    
    // 获取实时天气
    const weatherUrl = `https://devapi.qweather.com/v7/weather/now?location=${currentCity.value.id}&key=${apiKey.value}&lang=zh`
    console.log('Weather URL:', weatherUrl)
    
    const weatherResponse = await fetch(weatherUrl)
    console.log('Weather response status:', weatherResponse.status)
    
    // 处理 HTTP 状态码错误
    if (weatherResponse.status === 403) {
      throw new Error('API Key 没有访问权限（403）\n请检查：\n1. Key 是否已激活（需等待几分钟）\n2. 是否选择了正确的订阅类型（免费订阅/Web API）\n3. Key 是否已过期或被禁用')
    }
    
    if (!weatherResponse.ok) {
      throw new Error(`HTTP 错误：${weatherResponse.status}`)
    }
    
    const weatherResult = await weatherResponse.json()
    console.log('Weather result:', weatherResult)

    // 检查 API 返回的 code
    if (weatherResult.code === '200') {
      const now = weatherResult.now
      weatherData.value = {
        temp: now.temp,
        feelsLike: now.feelsLike,
        text: now.text,
        humidity: now.humidity,
        windDir: now.windDir,
        windScale: now.windScale,
        pressure: now.pressure,
        vis: now.vis,
        cloud: now.cloud,
        updateTime: now.obsTime,
      }

      // 更新城市列表中的简要天气信息
      const cityIndex = savedCities.value.findIndex(c => c.id === currentCity.value!.id)
      if (cityIndex > -1) {
        savedCities.value[cityIndex].weather = {
          temp: now.temp,
          text: now.text,
        }
        saveCities()
      }
    } else {
      // 处理 API 错误码
      const errorMessages: Record<string, string> = {
        '400': 'API 请求参数错误',
        '401': 'API Key 无效或未激活',
        '402': 'API Key 已超出请求额度',
        '403': 'API Key 没有访问权限，请检查订阅状态',
        '404': '请求的数据不存在',
        '429': '请求过于频繁，请稍后再试',
        '500': '服务器错误，请稍后再试',
      }
      const errorMsg = errorMessages[weatherResult.code] || `API 返回错误: ${weatherResult.code}`
      throw new Error(errorMsg)
    }

    // 获取3天天气预报
    const forecastUrl = `https://devapi.qweather.com/v7/weather/3d?location=${currentCity.value.id}&key=${apiKey.value}&lang=zh`
    console.log('Forecast URL:', forecastUrl)
    
    const forecastResponse = await fetch(forecastUrl)
    console.log('Forecast response status:', forecastResponse.status)
    
    // 处理 HTTP 状态码错误
    if (!forecastResponse.ok) {
      console.warn('Forecast API HTTP error:', forecastResponse.status)
      return // 预报失败不影响实时天气显示
    }
    
    const forecastResult = await forecastResponse.json()
    console.log('Forecast result:', forecastResult)

    if (forecastResult.code === '200') {
      forecast.value = forecastResult.daily.map((day: any) => ({
        date: day.fxDate,
        tempMax: day.tempMax,
        tempMin: day.tempMin,
        textDay: day.textDay,
        textNight: day.textNight,
      }))
    } else {
      console.warn('Forecast API warning:', forecastResult.code)
      // 预报数据失败不影响实时天气显示
    }
  } catch (error: any) {
    console.error('Load weather data failed:', error)
    ElMessage.error(error.message || '加载天气数据失败，请检查 API Key 配置')
    weatherData.value = null
    forecast.value = []
  } finally {
    loading.value = false
  }
}

// 获取天气图标
function getWeatherIcon(text: string): string {
  const iconMap: Record<string, string> = {
    '晴': 'i-mdi-weather-sunny',
    '多云': 'i-mdi-weather-partly-cloudy',
    '阴': 'i-mdi-weather-cloudy',
    '小雨': 'i-mdi-weather-rainy',
    '中雨': 'i-mdi-weather-pouring',
    '大雨': 'i-mdi-weather-pouring',
    '暴雨': 'i-mdi-weather-lightning-rainy',
    '雷阵雨': 'i-mdi-weather-lightning',
    '雪': 'i-mdi-weather-snowy',
    '小雪': 'i-mdi-weather-snowy',
    '中雪': 'i-mdi-weather-snowy-heavy',
    '大雪': 'i-mdi-weather-snowy-heavy',
    '雾': 'i-mdi-weather-fog',
    '霾': 'i-mdi-weather-hazy',
  }

  for (const key in iconMap) {
    if (text.includes(key)) {
      return iconMap[key]
    }
  }

  return 'i-mdi-weather-partly-cloudy'
}

// 格式化时间
function formatTime(time: string): string {
  try {
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return time
  }
}

// 格式化日期
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天'
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      })
    }
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.weather-page {
  padding: var(--spacing-lg);
  max-width: 1400px;
  margin: 0 auto;
}

.weather-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-lg);
}

/* 城市列表 */
.cities-card {
  height: fit-content;
  max-height: calc(100vh - 200px);
}

.empty-cities {
  text-align: center;
  padding: var(--spacing-4xl) var(--spacing-lg);
  color: var(--color-muted);
}

.empty-cities i {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

.empty-cities .hint {
  font-size: 12px;
  margin-top: var(--spacing-sm);
}

.cities-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.city-item:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.city-item.active {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.3);
}

.city-info {
  flex: 1;
}

.city-name {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.city-weather {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 14px;
  color: var(--color-muted);
}

.city-weather .temp {
  font-size: 16px;
  font-weight: 600;
  color: var(--neon-cyan);
}

.delete-btn {
  padding: var(--spacing-xs);
  background: transparent;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.delete-btn:hover {
  background: rgba(255, 42, 161, 0.1);
  color: var(--neon-pink);
}

/* 天气详情 */
.weather-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.loading-state,
.error-state,
.no-city-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
  color: var(--color-muted);
}

.loading-state i,
.error-state i,
.no-city-selected i {
  font-size: 64px;
  opacity: 0.5;
  margin-bottom: var(--spacing-lg);
}

/* 主要天气信息 */
.weather-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
  padding: var(--spacing-lg);
}

.weather-icon {
  font-size: 120px;
  color: var(--neon-cyan);
}

.weather-primary {
  flex: 1;
}

.location {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.temperature {
  font-size: 64px;
  font-weight: 700;
  color: var(--neon-cyan);
  line-height: 1;
  margin-bottom: var(--spacing-sm);
}

.weather-text {
  font-size: 24px;
  margin-bottom: var(--spacing-md);
}

.update-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 12px;
  color: var(--color-muted);
}

/* 详细信息网格 */
.weather-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.detail-icon {
  font-size: 32px;
  color: var(--neon-purple);
}

.detail-info {
  flex: 1;
}

.detail-label {
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: var(--spacing-xs);
}

.detail-value {
  font-size: 18px;
  font-weight: 600;
}

/* 未来天气预报 */
.forecast-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.forecast-item {
  text-align: center;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.forecast-item:hover {
  border-color: var(--neon-cyan);
  transform: translateY(-2px);
}

.forecast-date {
  font-size: 14px;
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.forecast-icon {
  font-size: 48px;
  color: var(--neon-cyan);
  margin: var(--spacing-md) 0;
}

.forecast-text {
  margin-bottom: var(--spacing-sm);
}

.forecast-temp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.temp-high {
  color: var(--neon-pink);
  font-weight: 600;
}

.temp-low {
  color: var(--neon-cyan);
}

.temp-divider {
  color: var(--color-muted);
}

/* API Key 设置对话框 */
.api-key-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.api-key-info {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-md);
  font-size: 14px;
}

.api-key-info i {
  font-size: 24px;
  color: var(--neon-cyan);
  flex-shrink: 0;
}

.api-key-info ol {
  margin: var(--spacing-xs) 0;
  padding-left: var(--spacing-lg);
}

.api-key-info li {
  margin: var(--spacing-xs) 0;
}

.api-key-info a {
  color: var(--neon-cyan);
  text-decoration: none;
}

.api-key-info a:hover {
  text-decoration: underline;
}

.limit-info {
  margin-top: var(--spacing-sm);
  color: var(--color-muted);
  font-size: 12px;
}

.api-key-warning {
  margin-top: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: rgba(255, 87, 51, 0.1);
  border-left: 2px solid #ff5733;
  border-radius: var(--radius-sm);
  color: #ff5733;
  font-size: 12px;
}

.api-key-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* 添加城市对话框 */
.add-city-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.search-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 193, 7, 0.1);
  border-left: 3px solid #ffc107;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: #ffc107;
}

.search-tip i {
  font-size: 16px;
}

.preset-cities {
  margin-top: var(--spacing-md);
}

.preset-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.preset-city-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.preset-city-item:hover {
  background: rgba(33, 230, 255, 0.1);
  border-color: var(--neon-cyan);
  transform: translateY(-2px);
}

.preset-city-item i {
  color: var(--neon-cyan);
  font-size: 16px;
}

.search-loading,
.search-hint,
.no-results {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-muted);
}

.search-loading i,
.search-hint i,
.no-results i {
  font-size: 48px;
  opacity: 0.5;
  margin-bottom: var(--spacing-md);
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.search-result-item {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-item:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
}

.result-name {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.result-info {
  font-size: 12px;
  color: var(--color-muted);
}

/* 响应式 */
@media (max-width: 1024px) {
  .weather-content {
    grid-template-columns: 1fr;
  }

  .weather-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .weather-main {
    flex-direction: column;
    text-align: center;
  }

  .temperature {
    font-size: 48px;
  }

  .weather-details-grid {
    grid-template-columns: 1fr;
  }

  .forecast-list {
    grid-template-columns: 1fr;
  }
}
</style>

