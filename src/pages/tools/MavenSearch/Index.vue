<template>
  <div class="tool-maven">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">Maven 依赖查询</h1>
        <p class="tool-header__description">搜索 Maven 依赖坐标，快速复制配置</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <!-- 搜索框 -->
      <NeonCard title="🔍 搜索依赖">
        <div class="search-box">
          <NeonInput
            v-model="searchQuery"
            placeholder="输入库名称，例如：mybatis、jackson、lombok..."
            @keyup.enter="searchMaven"
          />
          <NeonButton @click="searchMaven" type="primary" :loading="loading">
            <i class="i-mdi-magnify mr-2" />
            搜索
          </NeonButton>
        </div>

        <!-- 快捷搜索 -->
        <div class="quick-search">
          <span class="quick-label">热门：</span>
          <el-tag v-for="tag in popularLibs" :key="tag" @click="quickSearch(tag)" style="cursor: pointer">
            {{ tag }}
          </el-tag>
        </div>
      </NeonCard>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="results-section">
        <NeonCard
          v-for="result in searchResults"
          :key="result.id"
          :title="result.id"
        >
          <div class="result-content">
            <!-- 基本信息 -->
            <div class="result-info">
              <div class="info-row">
                <span class="info-label">Group ID：</span>
                <span class="info-value">{{ result.g }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Artifact ID：</span>
                <span class="info-value">{{ result.a }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">最新版本：</span>
                <span class="info-value version">{{ result.latestVersion }}</span>
              </div>
            </div>

            <!-- 依赖代码 -->
            <div class="dependency-codes">
              <!-- Maven -->
              <div class="code-block">
                <div class="code-header">
                  <span class="code-title">Maven</span>
                  <NeonButton size="small" @click="copyDependency(result, 'maven')">
                    <i class="i-mdi-content-copy mr-1" />
                    复制
                  </NeonButton>
                </div>
                <pre class="code-content">{{ generateMavenDependency(result) }}</pre>
              </div>

              <!-- Gradle -->
              <div class="code-block">
                <div class="code-header">
                  <span class="code-title">Gradle</span>
                  <NeonButton size="small" @click="copyDependency(result, 'gradle')">
                    <i class="i-mdi-content-copy mr-1" />
                    复制
                  </NeonButton>
                </div>
                <pre class="code-content">{{ generateGradleDependency(result) }}</pre>
              </div>
            </div>
          </div>
        </NeonCard>
      </div>

      <!-- 加载中 -->
      <div v-else-if="loading" class="loading-state">
        <i class="i-mdi-loading rotating" />
        <p>正在搜索...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="searched && searchResults.length === 0" class="empty-result">
        <i class="i-mdi-package-variant-closed empty-state__icon" />
        <p class="empty-state__text">未找到相关依赖</p>
        <p class="empty-state__hint">请尝试其他关键词</p>
      </div>

      <!-- 初始状态 -->
      <div v-else class="empty-state">
        <i class="i-mdi-package-variant empty-state__icon" />
        <p class="empty-state__text">搜索 Maven 依赖</p>
        <p class="empty-state__hint">支持模糊搜索，输入库名称或关键词</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'

interface MavenResult {
  id: string
  g: string
  a: string
  latestVersion: string
}

const searchQuery = ref('')
const searchResults = ref<MavenResult[]>([])
const loading = ref(false)
const searched = ref(false)

// 热门库
const popularLibs = ['mybatis', 'lombok', 'jackson', 'fastjson', 'hutool', 'guava']

// 搜索 Maven
async function searchMaven() {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  searched.value = true
  searchResults.value = []

  try {
    // 使用 Maven Central Search API
    const response = await axios.get('https://search.maven.org/solrsearch/select', {
      params: {
        q: searchQuery.value,
        rows: 10,
        wt: 'json'
      }
    })

    const docs = response.data?.response?.docs || []
    
    searchResults.value = docs.map((doc: any) => ({
      id: doc.id,
      g: doc.g,
      a: doc.a,
      latestVersion: doc.latestVersion
    }))

    if (searchResults.value.length === 0) {
      ElMessage.info('未找到相关依赖')
    } else {
      ElMessage.success(`找到 ${searchResults.value.length} 个依赖`)
    }
  } catch (e: any) {
    ElMessage.error('搜索失败：' + (e.message || '网络错误'))
  } finally {
    loading.value = false
  }
}

// 快捷搜索
function quickSearch(keyword: string) {
  searchQuery.value = keyword
  searchMaven()
}

// 生成 Maven 依赖
function generateMavenDependency(result: MavenResult): string {
  return `<dependency>
    <groupId>${result.g}</groupId>
    <artifactId>${result.a}</artifactId>
    <version>${result.latestVersion}</version>
</dependency>`
}

// 生成 Gradle 依赖
function generateGradleDependency(result: MavenResult): string {
  return `implementation '${result.g}:${result.a}:${result.latestVersion}'`
}

// 复制依赖
async function copyDependency(result: MavenResult, type: 'maven' | 'gradle') {
  try {
    const text = type === 'maven' 
      ? generateMavenDependency(result) 
      : generateGradleDependency(result)
    
    await navigator.clipboard.writeText(text)
    ElMessage.success(`${type.toUpperCase()} 依赖已复制`)
  } catch {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  searchQuery.value = ''
  searchResults.value = []
  searched.value = false
}
</script>

<style scoped>
.tool-maven {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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
  overflow-y: auto;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.search-box {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.search-box :deep(.neon-input) {
  flex: 1;
}

.quick-search {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.quick-label {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.results-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.info-row {
  display: flex;
  font-size: var(--font-size-sm);
}

.info-label {
  color: var(--color-muted);
  min-width: 100px;
  flex-shrink: 0;
}

.info-value {
  color: var(--color-text);
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.info-value.version {
  color: var(--neon-lime);
  font-weight: var(--font-weight-bold);
}

.dependency-codes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.code-block {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(208, 255, 0, 0.05);
  border-bottom: 1px solid var(--color-border);
}

.code-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--neon-lime);
}

.code-content {
  margin: 0;
  padding: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text);
  line-height: 1.6;
  white-space: pre;
  overflow-x: auto;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  gap: var(--spacing-lg);
}

.loading-state i {
  font-size: 3em;
  color: var(--neon-lime);
}

.loading-state p {
  font-size: var(--font-size-lg);
  color: var(--color-muted);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state,
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
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

