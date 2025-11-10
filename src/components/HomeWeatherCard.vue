<template>
  <div v-if="weatherData" class="home-weather-card" @click="navigateToWeather">
    <div class="weather-compact-header">
      <div class="city-info">
        <i class="i-mdi-map-marker" />
        <span class="city-name">{{ cityName }}</span>
      </div>
      <i :class="getWeatherIcon(weatherData.text)" class="weather-icon" />
    </div>
    
    <div class="weather-compact-main">
      <div class="temperature">{{ weatherData.temp }}°</div>
      <div class="weather-text">{{ weatherData.text }}</div>
    </div>
    
    <div v-if="hasExtraData" class="weather-compact-footer">
      <span v-if="weatherData.feelsLike && weatherData.feelsLike !== '--'" class="detail-text">
        <i class="i-mdi-thermometer" /> {{ weatherData.feelsLike }}°
      </span>
      <span v-if="weatherData.humidity && weatherData.humidity !== '--'" class="detail-text">
        <i class="i-mdi-water-percent" /> {{ weatherData.humidity }}%
      </span>
      <span v-if="weatherData.windDir && weatherData.windDir !== '--'" class="detail-text">
        <i class="i-mdi-weather-windy" /> {{ weatherData.windDir }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// 声明 Window 类型扩展（避免 TypeScript 错误）
declare global {
  interface Window {
    electronAPI?: any
  }
}

interface WeatherData {
  temp: string
  feelsLike: string
  text: string
  humidity: string
  windDir: string
  windScale: string
  updateTime: string
}

interface City {
  id: string
  name: string
  lat: string
  lon: string
}

const router = useRouter()

const weatherData = ref<WeatherData | null>(null)
const cityName = ref('')

// 检查是否有额外数据需要显示
const hasExtraData = computed(() => {
  if (!weatherData.value) return false
  
  const hasFeelsLike = weatherData.value.feelsLike && weatherData.value.feelsLike !== '--'
  const hasHumidity = weatherData.value.humidity && weatherData.value.humidity !== '--' && weatherData.value.humidity !== '-- '
  const hasWind = weatherData.value.windDir && weatherData.value.windDir !== '--'
  
  return hasFeelsLike || hasHumidity || hasWind
})

// 加载天气数据
async function loadWeatherData() {
  try {
    if (!window.electronAPI) {
      console.log('ℹ️  浏览器环境，不加载天气数据')
      return
    }
    
    // 检查配置文件是否存在
    const exists = await window.electronAPI.fileExists('weather-config.json')
    if (!exists) {
      console.log('ℹ️  未配置天气，跳过加载')
      return
    }
    
    // 读取配置
    const result = await window.electronAPI.readFile('weather-config.json')
    if (!result.success || !result.data) {
      console.log('ℹ️  读取天气配置失败')
      return
    }
    
    const config = JSON.parse(result.data)
    
    // 检查是否有API Key和城市
    const hasKey = config.qweatherKey || config.seniverseKey
    if (!hasKey || !config.cities || config.cities.length === 0) {
      console.log('ℹ️  未配置天气 API Key 或城市')
      return
    }
    
    const firstCity = config.cities[0] as City
    cityName.value = firstCity.name
    
    // 获取天气数据
    if (config.source === 'qweather' && config.qweatherKey) {
      await fetchQWeatherData(firstCity, config.qweatherKey)
    } else if (config.source === 'seniverse' && config.seniverseKey) {
      await fetchSeniverseWeatherData(firstCity, config.seniverseKey)
    }
    
    console.log('✓ 首页天气数据加载成功')
  } catch (error) {
    console.error('❌ 加载首页天气失败:', error)
  }
}

// 获取和风天气数据
async function fetchQWeatherData(city: City, apiKey: string) {
  try {
    const url = `https://devapi.qweather.com/v7/weather/now?location=${city.lon},${city.lat}&key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.code === '200' && data.now) {
      weatherData.value = {
        temp: data.now.temp,
        feelsLike: data.now.feelsLike,
        text: data.now.text,
        humidity: data.now.humidity,
        windDir: data.now.windDir,
        windScale: data.now.windScale,
        updateTime: data.now.obsTime
      }
    }
  } catch (error) {
    console.error('获取和风天气失败:', error)
  }
}

// 获取心知天气数据
async function fetchSeniverseWeatherData(city: City, apiKey: string) {
  try {
    const url = `https://api.seniverse.com/v3/weather/now.json?key=${apiKey}&location=${city.lat}:${city.lon}&language=zh-Hans&unit=c`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      const now = result.now
      
      weatherData.value = {
        temp: now.temperature,
        feelsLike: '', // 心知天气免费版没有体感温度
        text: now.text,
        humidity: '', // 心知天气免费版没有湿度
        windDir: '',
        windScale: '',
        updateTime: result.last_update
      }
    }
  } catch (error) {
    console.error('获取心知天气失败:', error)
  }
}

// 获取天气图标
function getWeatherIcon(text: string): string {
  const iconMap: Record<string, string> = {
    '晴': 'i-mdi-weather-sunny',
    '多云': 'i-mdi-weather-partly-cloudy',
    '阴': 'i-mdi-weather-cloudy',
    '雨': 'i-mdi-weather-rainy',
    '小雨': 'i-mdi-weather-rainy',
    '中雨': 'i-mdi-weather-pouring',
    '大雨': 'i-mdi-weather-pouring',
    '暴雨': 'i-mdi-weather-lightning-rainy',
    '雷阵雨': 'i-mdi-weather-lightning-rainy',
    '雪': 'i-mdi-weather-snowy',
    '小雪': 'i-mdi-weather-snowy',
    '中雪': 'i-mdi-weather-snowy-heavy',
    '大雪': 'i-mdi-weather-snowy-heavy',
    '雾': 'i-mdi-weather-fog',
    '霾': 'i-mdi-weather-hazy',
    '风': 'i-mdi-weather-windy',
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
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return time
  }
}

// 导航到天气页面
function navigateToWeather() {
  router.push('/tools/weather')
}

onMounted(() => {
  loadWeatherData()
})
</script>

<style scoped>
.home-weather-card {
  position: relative;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(135deg, 
    rgba(33, 230, 255, 0.15) 0%, 
    rgba(155, 92, 255, 0.15) 100%
  );
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: 
    inset 0 0 30px rgba(33, 230, 255, 0.1),
    0 0 15px rgba(33, 230, 255, 0.3);
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.home-weather-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 80% 20%, rgba(33, 230, 255, 0.2) 0%, transparent 50%),
    radial-gradient(circle at 20% 80%, rgba(155, 92, 255, 0.2) 0%, transparent 50%);
  pointer-events: none;
}

.home-weather-card:hover {
  border-color: var(--neon-cyan-lighter);
  transform: translateY(-2px);
  box-shadow: 
    inset 0 0 40px rgba(33, 230, 255, 0.15),
    0 6px 25px rgba(33, 230, 255, 0.4);
}

/* 紧凑头部 */
.weather-compact-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  z-index: 1;
}

.city-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.city-info i {
  font-size: 1em;
  color: var(--neon-cyan);
}

.city-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.weather-icon {
  font-size: 1.8em;
  color: var(--neon-cyan);
  filter: drop-shadow(0 0 8px rgba(33, 230, 255, 0.6));
}

/* 紧凑主要信息 */
.weather-compact-main {
  position: relative;
  text-align: center;
  padding: var(--spacing-xs) 0;
  z-index: 1;
}

.temperature {
  font-size: 2rem;
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-purple) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 20px rgba(33, 230, 255, 0.5));
  font-family: var(--font-family-mono);
  line-height: 1;
  margin-bottom: 2px;
}

.weather-text {
  font-size: var(--font-size-xs);
  color: var(--neon-cyan);
  font-weight: var(--font-weight-medium);
}

/* 紧凑底部 */
.weather-compact-footer {
  position: relative;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  border-top: 1px solid rgba(33, 230, 255, 0.2);
  z-index: 1;
}

.detail-text {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  white-space: nowrap;
}

.detail-text i {
  font-size: 0.9em;
  color: var(--neon-cyan);
}

/* 响应式 */
@media (max-width: 768px) {
  .home-weather-card {
    padding: var(--spacing-lg);
  }
  
  .temperature {
    font-size: 2rem;
  }
}
</style>

