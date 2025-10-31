<script setup lang="ts">
// App.vue - 应用根组件
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useKnowledgeStore } from '@/stores/knowledge'

const router = useRouter()
const knowledgeStore = useKnowledgeStore()

// 应用启动时初始化知识库（异步，不阻塞）
onMounted(() => {
  // 使用 requestIdleCallback 在浏览器空闲时初始化，不影响路由跳转
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      knowledgeStore.initialize()
    })
  } else {
    setTimeout(() => {
      knowledgeStore.initialize()
    }, 100)
  }
})

// 处理路由加载错误
router.isReady().then(() => {
  console.log('Router ready')
}).catch((err) => {
  console.error('Router initialization error:', err)
})
</script>

<template>
  <!-- 直接渲染，keep-alive 在 MainLayout 中处理 -->
  <router-view />
</template>

<style scoped>
/* 页面切换动画在 global.css 中定义 */
</style>
