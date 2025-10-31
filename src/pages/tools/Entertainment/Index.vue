<template>
  <div class="hot-rank-aggregator">
    <!-- 标题区 -->
    <div class="tool-header">
      <div>
        <h1 class="tool-title">热榜聚合</h1>
        <p class="tool-desc">实时聚合各大平台热门话题</p>
      </div>
      <div class="tool-actions">
        <NeonButton @click="refreshAll" :loading="loading">
          <i class="i-mdi-refresh" />
          全部刷新
        </NeonButton>
        <NeonButton variant="outline" @click="showSettings = true">
          <i class="i-mdi-cog" />
          设置
        </NeonButton>
      </div>
    </div>

    <!-- 搜索栏 -->
    <NeonCard class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索热榜内容..."
        size="large"
        clearable
        @input="handleSearch"
      >
        <template #prefix>
          <i class="i-mdi-magnify" />
        </template>
      </el-input>
    </NeonCard>

    <!-- 热榜网格 -->
    <div class="rank-container" v-loading="loading">
      <div class="rank-grid">
        <!-- 知乎热榜 -->
        <NeonCard class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">
              <i class="i-mdi-alpha-z-box text-2xl" style="color: #0084ff;" />
              <span>知乎热榜</span>
              <span class="rank-count">({{ filteredRanks.zhihu.length }}条热榜)</span>
            </div>
            <NeonButton size="small" @click="refreshRank('zhihu')" :loading="loadingMap.zhihu">
              <i class="i-mdi-refresh" />
            </NeonButton>
          </div>
          <div class="rank-list">
            <div
              v-for="(item, index) in filteredRanks.zhihu"
          :key="item.id"
              class="rank-item"
              @click="openLink(item.url)"
        >
              <div class="rank-index" :class="index < 3 ? 'rank-index--top' : ''">
                {{ index + 1 }}
          </div>
              <div class="rank-content">
                <div class="rank-item-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span class="rank-hot">{{ item.hot }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 自选类型 -->
        <NeonCard class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">
              <i class="i-mdi-auto-fix text-2xl" style="color: #9b5cff;" />
              <span>自选热榜</span>
              <span class="rank-count">({{ filteredRanks.custom.length }}条热榜)</span>
            </div>
            <NeonButton size="small" @click="refreshRank('custom')" :loading="loadingMap.custom">
              <i class="i-mdi-refresh" />
            </NeonButton>
          </div>
          
          <!-- 类型选择下拉框 -->
          <div class="custom-type-selector">
            <el-select 
              v-model="customType" 
              placeholder="选择热榜类型"
              size="large"
              @change="handleCustomTypeChange"
            >
              <el-option
                v-for="type in availableTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </div>
          
          <div class="rank-list">
            <div
              v-for="(item, index) in filteredRanks.custom"
              :key="item.id"
              class="rank-item"
              @click="openLink(item.url)"
            >
              <div class="rank-index" :class="index < 3 ? 'rank-index--top' : ''">
                {{ index + 1 }}
              </div>
              <div class="rank-content">
                <div class="rank-item-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span class="rank-hot">{{ item.hot }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 微博热搜 -->
        <NeonCard class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">
              <i class="i-mdi-sina-weibo text-2xl" style="color: #ff8200;" />
              <span>微博热搜</span>
              <span class="rank-count">({{ filteredRanks.weibo.length }}刷新更新)</span>
            </div>
            <NeonButton size="small" @click="refreshRank('weibo')" :loading="loadingMap.weibo">
              <i class="i-mdi-refresh" />
            </NeonButton>
          </div>
          <div class="rank-list">
            <div
              v-for="(item, index) in filteredRanks.weibo"
              :key="item.id"
              class="rank-item"
              @click="openLink(item.url)"
            >
              <div class="rank-index" :class="index < 3 ? 'rank-index--top' : ''">
                {{ index + 1 }}
              </div>
              <div class="rank-content">
                <div class="rank-item-title">
                  {{ item.title }}
                  <span v-if="item.tag" class="rank-tag" :style="{ background: item.tagColor }">
                    {{ item.tag }}
            </span>
          </div>
                <div class="rank-meta">
                  <span class="rank-hot">{{ item.hot }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 今日头条 -->
        <NeonCard class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">
              <i class="i-mdi-newspaper text-2xl" style="color: #ff4040;" />
              <span>今日头条</span>
              <span class="rank-count">({{ filteredRanks.toutiao.length }}刷新更新)</span>
            </div>
            <NeonButton size="small" @click="refreshRank('toutiao')" :loading="loadingMap.toutiao">
              <i class="i-mdi-refresh" />
            </NeonButton>
          </div>
          <div class="rank-list">
            <div
              v-for="(item, index) in filteredRanks.toutiao"
              :key="item.id"
              class="rank-item"
              @click="openLink(item.url)"
            >
              <div class="rank-index" :class="index < 3 ? 'rank-index--top' : ''">
                {{ index + 1 }}
              </div>
              <div class="rank-content">
                <div class="rank-item-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span class="rank-hot">{{ item.hot }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- 虎扑步行街 -->
        <NeonCard class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">
              <i class="i-mdi-basketball text-2xl" style="color: #ff6700;" />
              <span>虎扑步行街</span>
              <span class="rank-count">({{ filteredRanks.hupu.length }}刷新更新)</span>
            </div>
            <NeonButton size="small" @click="refreshRank('hupu')" :loading="loadingMap.hupu">
              <i class="i-mdi-refresh" />
            </NeonButton>
          </div>
          <div class="rank-list">
            <div
              v-for="(item, index) in filteredRanks.hupu"
              :key="item.id"
              class="rank-item"
              @click="openLink(item.url)"
            >
              <div class="rank-index" :class="index < 3 ? 'rank-index--top' : ''">
                {{ index + 1 }}
              </div>
              <div class="rank-content">
                <div class="rank-item-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span class="rank-hot">{{ item.hot }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>

        <!-- IT之家 -->
        <NeonCard class="rank-panel">
          <div class="rank-header">
            <div class="rank-title">
              <i class="i-mdi-laptop text-2xl" style="color: #d81e06;" />
              <span>IT之家</span>
              <span class="rank-count">({{ filteredRanks.ithome.length }}分钟前)</span>
            </div>
            <NeonButton size="small" @click="refreshRank('ithome')" :loading="loadingMap.ithome">
              <i class="i-mdi-refresh" />
            </NeonButton>
          </div>
          <div class="rank-list">
            <div
              v-for="(item, index) in filteredRanks.ithome"
              :key="item.id"
              class="rank-item"
              @click="openLink(item.url)"
            >
              <div class="rank-index" :class="index < 3 ? 'rank-index--top' : ''">
                {{ index + 1 }}
              </div>
              <div class="rank-content">
                <div class="rank-item-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span class="rank-tag" v-if="item.tag">{{ item.tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </NeonCard>
      </div>
    </div>

      <!-- 空状态 -->
      <EmptyState
      v-if="!loading && allRanksEmpty"
        icon="i-mdi-file-document-outline"
      title="暂无数据"
      description="请点击刷新按钮获取最新热榜"
      />

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="热榜设置" width="600px">
      <el-form label-width="120px">
        <el-form-item label="自动刷新">
          <el-switch v-model="autoRefresh" />
          <span class="ml-2 text-sm text-gray-400">开启后每5分钟自动刷新</span>
          </el-form-item>
          <el-form-item label="显示数量">
          <el-slider v-model="displayLimit" :min="5" :max="20" :step="5" show-stops />
          </el-form-item>
        </el-form>
      <template #footer>
        <NeonButton variant="outline" @click="showSettings = false">取消</NeonButton>
        <NeonButton @click="saveSettings">保存</NeonButton>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'

interface RankItem {
  id: string
  title: string
  url: string
  hot: string
  tag?: string
  tagColor?: string
}

interface RankData {
  zhihu: RankItem[]
  weibo: RankItem[]
  toutiao: RankItem[]
  hupu: RankItem[]
  ithome: RankItem[]
  custom: RankItem[]
}

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const showSettings = ref(false)
const autoRefresh = ref(false)
const displayLimit = ref(10)

// 各平台加载状态
const loadingMap = reactive({
  zhihu: false,
  weibo: false,
  toutiao: false,
  hupu: false,
  ithome: false,
  custom: false
})

// 热榜数据
const ranks = reactive<RankData>({
  zhihu: [],
  weibo: [],
  toutiao: [],
  hupu: [],
  ithome: [],
  custom: []
})

// 自选类型
const customType = ref('douban')

// 可选的平台类型列表
const availableTypes = [
  { value: 'douban', label: '豆瓣小组' },
  { value: 'baidu', label: '百度热搜' },
  { value: 'bilibili', label: 'B站热门' },
  { value: 'tieba', label: '贴吧热议' },
  { value: '36kr', label: '36氪热榜' },
  { value: 'juejin', label: '掘金热榜' },
  { value: 'douyin', label: '抖音热点' },
  { value: 'kuaishou', label: '快手热榜' },
  { value: 'thepaper', label: '澎湃新闻' },
  { value: 'netease-news', label: '网易新闻' },
]

let refreshTimer: NodeJS.Timeout | null = null

// 计算属性 - 过滤后的热榜
const filteredRanks = computed(() => {
  const keyword = searchKeyword.value.toLowerCase().trim()
  
  const filterItems = (items: RankItem[]) => {
    let result = items
    if (keyword) {
      result = items.filter(item => item.title.toLowerCase().includes(keyword))
    }
    return result.slice(0, displayLimit.value)
  }

  return {
    zhihu: filterItems(ranks.zhihu),
    weibo: filterItems(ranks.weibo),
    toutiao: filterItems(ranks.toutiao),
    hupu: filterItems(ranks.hupu),
    ithome: filterItems(ranks.ithome),
    custom: filterItems(ranks.custom)
  }
})

// 是否所有热榜都为空
const allRanksEmpty = computed(() => {
  return Object.values(ranks).every(list => list.length === 0)
})

// 转换 API 数据为统一格式 (uapis.cn 格式)
const transformRankData = (platform: string, apiData: any): RankItem[] => {
  if (!apiData || !Array.isArray(apiData)) {
    console.warn(`${platform} 数据格式不正确:`, apiData)
    return []
  }
  
  try {
    return apiData.map((item: any) => ({
      id: `${platform}-${item.index || Date.now()}-${Math.random()}`,
      title: item.title || '无标题',
      url: item.url || `https://uapis.cn`,
      hot: formatHotValue(item.hot_value || item.hot || ''),
      tag: item.extra?.tag || item.extra?.label,
      tagColor: item.extra?.tag_color || getRandomTagColor()
    }))
  } catch (error) {
    console.error(`转换 ${platform} 数据失败:`, error)
    return []
  }
}

// 格式化热度值
const formatHotValue = (hot: any): string => {
  if (!hot) return ''
  
  // 如果已经是字符串且包含"万"或"热"，直接返回
  if (typeof hot === 'string' && (hot.includes('万') || hot.includes('热'))) {
    return hot
  }
  
  // 数字转换
  const num = typeof hot === 'number' ? hot : parseInt(hot)
  if (isNaN(num)) return String(hot)
  
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  return String(num)
}

// 随机标签颜色
const getRandomTagColor = (): string => {
  const colors = ['#ff4040', '#ff8200', '#ffd700', '#ff2aa1', '#9b5cff']
  return colors[Math.floor(Math.random() * colors.length)]
}

// 刷新单个平台
const refreshRank = async (platform: keyof RankData, typeOverride?: string) => {
  loadingMap[platform] = true
  
  try {
    const electronAPI = (window as any).electronAPI
    if (!electronAPI || !electronAPI.fetchHotRank) {
      console.error('electronAPI 不可用，使用模拟数据')
      // 如果不在 Electron 环境中，使用空数据
      ranks[platform] = []
      ElMessage.warning(`暂不支持在浏览器中使用`)
      return
    }
    
    // 如果是自选类型，使用 customType 的值
    const actualType = typeOverride || (platform === 'custom' ? customType.value : platform)
    console.log(`正在获取 ${actualType} 热榜...`)
    
    const result = await electronAPI.fetchHotRank(actualType)
    
    if (result.success && result.data) {
      // 转换数据格式
      const transformedData = transformRankData(actualType, result.data)
      ranks[platform] = transformedData
      console.log(`${actualType} 热榜获取成功，共 ${transformedData.length} 条`)
      ElMessage.success(`热榜已刷新`)
    } else {
      console.error(`${actualType} 获取失败:`, result.error)
      ranks[platform] = []
      ElMessage.error(`刷新失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error(`刷新失败:`, error)
    ranks[platform] = []
    ElMessage.error(`刷新失败: ${error.message}`)
  } finally {
    loadingMap[platform] = false
  }
}

// 自选类型改变时刷新
const handleCustomTypeChange = () => {
  // 保存选择
  localStorage.setItem('hot_rank_custom_type', customType.value)
  refreshRank('custom')
}

// 刷新所有平台
const refreshAll = async () => {
  loading.value = true
  
  try {
    await Promise.all([
      refreshRank('zhihu'),
      refreshRank('weibo'),
      refreshRank('toutiao'),
      refreshRank('hupu'),
      refreshRank('ithome'),
      refreshRank('custom')
    ])
    ElMessage.success('所有热榜已刷新')
  } catch (error) {
    console.error('刷新失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在 computed 中处理
}

// 打开链接
const openLink = (url: string) => {
  const electronAPI = (window as any).electronAPI
  if (electronAPI && electronAPI.openExternal) {
    electronAPI.openExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

// 保存设置
const saveSettings = () => {
  localStorage.setItem('hot_rank_settings', JSON.stringify({
    autoRefresh: autoRefresh.value,
    displayLimit: displayLimit.value
  }))
  
  showSettings.value = false
  ElMessage.success('设置已保存')
  
  // 重新设置定时器
  setupAutoRefresh()
}

// 设置自动刷新
const setupAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      refreshAll()
    }, 5 * 60000) // 5分钟
  }
}

// 加载设置
const loadSettings = () => {
  const saved = localStorage.getItem('hot_rank_settings')
  if (saved) {
    try {
      const settings = JSON.parse(saved)
      autoRefresh.value = settings.autoRefresh || false
      displayLimit.value = settings.displayLimit || 10
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
  
  // 加载自选类型
  const savedCustomType = localStorage.getItem('hot_rank_custom_type')
  if (savedCustomType) {
    customType.value = savedCustomType
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  refreshAll()
  setupAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.hot-rank-aggregator {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow: hidden;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.tool-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  text-shadow: var(--glow-cyan);
  font-family: 'Orbitron', sans-serif;
}

.tool-desc {
  margin: 8px 0 0;
  color: var(--color-muted);
  font-size: 14px;
}

.tool-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.search-bar {
  padding: 16px;
}

.rank-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.rank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  padding-bottom: 20px;
}

/* 热榜面板 */
.rank-panel {
  display: flex;
  flex-direction: column;
  height: 600px;
  overflow: hidden;
  animation: cardGlow 3s ease-in-out infinite;
  position: relative;
}

/* 卡片扫描线效果 */
.rank-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(33, 230, 255, 0.05) 50%,
    transparent 100%
  );
  animation: scanline 4s linear infinite;
  pointer-events: none;
  z-index: 1;
}

.rank-panel > * {
  position: relative;
  z-index: 2;
}

/* 确保 NeonCard 内部使用 flex 布局 */
.rank-panel :deep(.neon-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(33, 230, 255, 0.2);
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* 自选类型下拉框 */
.custom-type-selector {
  padding: 0 0 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(33, 230, 255, 0.1);
  flex-shrink: 0;
}

.custom-type-selector :deep(.el-select) {
  width: 100%;
}

.custom-type-selector :deep(.el-input__wrapper) {
  background: rgba(33, 230, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.2);
  box-shadow: none;
  transition: all 0.2s;
}

.custom-type-selector :deep(.el-input__wrapper:hover) {
  border-color: rgba(33, 230, 255, 0.4);
  background: rgba(33, 230, 255, 0.08);
}

.custom-type-selector :deep(.el-input__wrapper.is-focus) {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.3);
  background: rgba(33, 230, 255, 0.1);
}

.custom-type-selector :deep(.el-input__inner) {
  color: var(--color-text);
}

.rank-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.rank-count {
  font-size: 12px;
  color: var(--color-muted);
  font-weight: 400;
}

.rank-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 8px;
  min-height: 0;
}

.rank-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgba(33, 230, 255, 0.03);
  border: 1px solid rgba(33, 230, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  position: relative;
  overflow: hidden;
}

/* 数据流动背景 */
.rank-item::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(33, 230, 255, 0.1) 50%,
    transparent 70%
  );
  animation: dataFlow 3s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
}

.rank-item:hover::before {
  opacity: 1;
}

.rank-item:hover {
  background: rgba(33, 230, 255, 0.08);
  border-color: rgba(33, 230, 255, 0.3);
  transform: translateX(4px);
  box-shadow: 
    0 0 12px rgba(33, 230, 255, 0.4),
    0 0 24px rgba(155, 92, 255, 0.2),
    inset 0 0 12px rgba(33, 230, 255, 0.1);
  animation: cardGlow 1s ease-in-out infinite;
}

.rank-index {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-muted);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
}

.rank-index--top {
  background: linear-gradient(135deg, var(--neon-pink) 0%, var(--neon-purple) 100%);
  color: #fff;
  box-shadow: 0 0 12px rgba(255, 42, 161, 0.5);
}

.rank-content {
  flex: 1;
  min-width: 0;
}

.rank-item-title {
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text);
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.rank-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--color-muted);
}

.rank-hot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--neon-pink);
  font-weight: 600;
}

.rank-hot::before {
  content: '🔥';
  font-size: 12px;
}

.rank-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  margin-left: 8px;
}

/* 霓虹炫彩滚动条 - 强制应用 */
.rank-list::-webkit-scrollbar,
.rank-container::-webkit-scrollbar {
  width: 12px !important;
  height: 12px !important;
}

.rank-list::-webkit-scrollbar-track,
.rank-container::-webkit-scrollbar-track {
  background: rgba(10, 15, 30, 0.9) !important;
  border-radius: 6px !important;
  border: 2px solid rgba(33, 230, 255, 0.3) !important;
  box-shadow: 
    inset 0 0 15px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(33, 230, 255, 0.5) !important;
}

.rank-list::-webkit-scrollbar-thumb,
.rank-container::-webkit-scrollbar-thumb {
  background: 
    linear-gradient(180deg, 
      #21e6ff 0%, 
      #21e6ff 10%,
      #9b5cff 50%, 
      #ff2aa1 90%,
      #ff2aa1 100%) !important;
  border-radius: 6px !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  box-shadow: 
    0 0 20px #21e6ff,
    0 0 30px #9b5cff,
    0 0 40px #ff2aa1,
    inset 0 0 15px rgba(255, 255, 255, 0.5) !important;
  animation: scrollbarGlow 1.5s ease-in-out infinite !important;
  transition: all 0.3s ease !important;
}

.rank-list::-webkit-scrollbar-thumb:hover,
.rank-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    #ff2aa1 0%, 
    #9b5cff 50%, 
    #21e6ff 100%) !important;
  box-shadow: 
    0 0 25px #ff2aa1,
    0 0 40px #9b5cff,
    0 0 55px #21e6ff,
    0 0 70px #ffe600,
    inset 0 0 20px rgba(255, 255, 255, 0.7) !important;
  transform: scaleX(1.4) !important;
  cursor: pointer !important;
  animation: scrollbarGlowStrong 1s ease-in-out infinite !important;
}

.rank-list::-webkit-scrollbar-thumb:active,
.rank-container::-webkit-scrollbar-thumb:active {
  background: linear-gradient(180deg, 
    #ffe600 0%, 
    #d0ff00 50%, 
    #21e6ff 100%) !important;
  box-shadow: 
    0 0 30px #ffe600,
    0 0 50px #d0ff00,
    0 0 70px #21e6ff,
    0 0 90px #ff2aa1,
    inset 0 0 25px rgba(255, 255, 255, 0.8) !important;
  animation: scrollbarGlowActive 0.8s ease-in-out infinite !important;
}

/* 滚动条动态流光动画 - 超强版 */
@keyframes scrollbarGlow {
  0% {
    box-shadow: 
      0 0 30px #21e6ff,
      0 0 50px #21e6ff,
      0 0 70px #9b5cff,
      0 0 90px #ff2aa1,
      inset 0 0 20px rgba(255, 255, 255, 0.6);
  }
  25% {
    box-shadow: 
      0 0 40px #ff2aa1,
      0 0 60px #ff2aa1,
      0 0 80px #21e6ff,
      0 0 100px #9b5cff,
      inset 0 0 25px rgba(255, 255, 255, 0.7);
  }
  50% {
    box-shadow: 
      0 0 50px #9b5cff,
      0 0 70px #9b5cff,
      0 0 90px #ff2aa1,
      0 0 110px #21e6ff,
      inset 0 0 30px rgba(255, 255, 255, 0.8);
  }
  75% {
    box-shadow: 
      0 0 40px #21e6ff,
      0 0 60px #21e6ff,
      0 0 80px #9b5cff,
      0 0 100px #ff2aa1,
      inset 0 0 25px rgba(255, 255, 255, 0.7);
  }
  100% {
    box-shadow: 
      0 0 30px #21e6ff,
      0 0 50px #21e6ff,
      0 0 70px #9b5cff,
      0 0 90px #ff2aa1,
      inset 0 0 20px rgba(255, 255, 255, 0.6);
  }
}

@keyframes scrollbarGlowStrong {
  0%, 100% {
    box-shadow: 
      0 0 40px #ff2aa1,
      0 0 60px #ff2aa1,
      0 0 80px #9b5cff,
      0 0 100px #21e6ff,
      0 0 120px #ffe600,
      inset 0 0 30px rgba(255, 255, 255, 0.8);
  }
  50% {
    box-shadow: 
      0 0 60px #ff2aa1,
      0 0 80px #ff2aa1,
      0 0 100px #9b5cff,
      0 0 120px #21e6ff,
      0 0 140px #ffe600,
      inset 0 0 40px rgba(255, 255, 255, 0.9);
  }
}

@keyframes scrollbarGlowActive {
  0%, 100% {
    box-shadow: 
      0 0 50px #ffe600,
      0 0 70px #ffe600,
      0 0 90px #d0ff00,
      0 0 110px #21e6ff,
      0 0 130px #ff2aa1,
      inset 0 0 35px rgba(255, 255, 255, 0.9);
  }
  50% {
    box-shadow: 
      0 0 70px #ffe600,
      0 0 90px #ffe600,
      0 0 110px #d0ff00,
      0 0 130px #21e6ff,
      0 0 150px #ff2aa1,
      inset 0 0 45px rgba(255, 255, 255, 1);
  }
}

/* ========== 赛博朋克2077动画 ========== */
@keyframes cardGlow {
  0%, 100% {
    box-shadow: 
      0 0 5px rgba(33, 230, 255, 0.3),
      0 0 10px rgba(33, 230, 255, 0.2),
      inset 0 0 5px rgba(33, 230, 255, 0.1);
  }
  50% {
    box-shadow: 
      0 0 10px rgba(33, 230, 255, 0.5),
      0 0 20px rgba(33, 230, 255, 0.3),
      0 0 30px rgba(155, 92, 255, 0.2),
      inset 0 0 10px rgba(33, 230, 255, 0.2);
  }
}

@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes dataFlow {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

/* 响应式 */
@media (max-width: 1400px) {
  .rank-grid {
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }
}

@media (max-width: 768px) {
  .hot-rank-aggregator {
    padding: 16px;
  }
  
  .rank-grid {
    grid-template-columns: 1fr;
  }
  
  .rank-panel {
    height: 500px;
  }
  
  .tool-header {
    flex-direction: column;
  }
  
  .tool-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .tool-actions button {
    flex: 1;
  }
}
</style>

