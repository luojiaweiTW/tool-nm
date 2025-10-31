<template>
  <div class="main-layout">
    <!-- 侧边栏（不参与页面切换动画） -->
    <Sidebar />
    
    <!-- 主内容区 -->
    <main class="main-layout__content">
      <!-- 页面内容 - 使用 keep-alive 缓存所有页面，实现无刷新切换 -->
      <router-view v-slot="{ Component }">
        <keep-alive :max="30">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import { useGlobalShortcuts } from '@/composables/useKeyboard'

const router = useRouter()

// 注册全局快捷键
useGlobalShortcuts()

onMounted(() => {
  // 打印快捷键帮助信息
  console.log('%c🎹 全局快捷键', 'color: #21e6ff; font-size: 14px; font-weight: bold;')
  console.log('%cCtrl+K%c - 聚焦搜索框', 'color: #ff2aa1; font-weight: bold;', 'color: #b8d4f2;')
  console.log('%cCtrl+B%c - 折叠/展开侧栏', 'color: #ff2aa1; font-weight: bold;', 'color: #b8d4f2;')
  console.log('%cCtrl+F%c - 聚焦输入框', 'color: #ff2aa1; font-weight: bold;', 'color: #b8d4f2;')
  console.log('%cCtrl+Shift+C%c - 复制结果', 'color: #ff2aa1; font-weight: bold;', 'color: #b8d4f2;')
  console.log('%cEsc%c - 清除焦点', 'color: #ff2aa1; font-weight: bold;', 'color: #b8d4f2;')
  
  // 🔧 全局监听截图事件（不要删除，允许多个监听器共存）
  // 这样即使用户未打开过截图页面，主进程的事件也能被接收
  if (window.electronAPI?.screenshots?.onCaptured) {
    console.log('📸 [MainLayout] Registering global screenshot listener')
    
    // 注册监听器（不要先removeAllListeners，让它和Screenshot组件的监听器共存）
    window.electronAPI.screenshots.onCaptured((data) => {
      console.log('✓ [MainLayout] Global screenshot listener received:', data.filename)
      // 这里什么都不做，只是确保有人接收事件
      // Screenshot 组件有自己的监听器来处理UI更新
    })
    
    window.electronAPI.screenshots.onCancelled(() => {
      console.log('⚠ [MainLayout] Global screenshot cancelled')
    })
  }
})
</script>

<style scoped>
.main-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--color-bg);
  position: fixed;
  top: 0;
  left: 0;
  /* 强制GPU加速 */
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 侧边栏固定，不受任何动画影响 */
.main-layout > :first-child {
  position: relative;
  z-index: 100;
  background-color: var(--color-bg);
  /* 防止侧边栏闪烁 */
  transform: translateZ(0);
  will-change: auto;
}

.main-layout__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: auto;
  position: relative;
  background-color: var(--color-bg);
  /* 强制GPU加速，防止闪烁 */
  transform: translateZ(0);
  backface-visibility: hidden;
}
</style>

