<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NeonCard from '@/components/NeonCard.vue'

const route = useRoute()

const title = computed(() => route.meta.title as string || '工具开发中')
const description = computed(() => route.meta.description as string || '')
const icon = computed(() => route.meta.icon as string || 'i-mdi-hammer-wrench')
</script>

<template>
  <div class="tool-placeholder">
    <NeonCard>
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <i :class="icon" />
        </div>
        <h2 class="placeholder-title">{{ title }}</h2>
        <p class="placeholder-description">{{ description }}</p>
        <div class="placeholder-status">
          <el-tag type="info" size="large" effect="plain">
            <i class="i-mdi-wrench mr-2" />
            功能开发中
          </el-tag>
        </div>
        <p class="placeholder-hint">
          该工具正在开发中，敬请期待！
        </p>
      </div>
    </NeonCard>
  </div>
</template>

<style scoped>
.tool-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  max-width: 600px;
  padding: var(--spacing-4xl) var(--spacing-2xl);
}

.placeholder-icon {
  font-size: 6em;
  color: var(--neon-cyan);
  margin-bottom: var(--spacing-xl);
  opacity: 0.6;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.placeholder-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-md);
  font-family: var(--font-family-display);
}

.placeholder-description {
  font-size: var(--font-size-lg);
  color: var(--color-muted);
  margin-bottom: var(--spacing-2xl);
  line-height: 1.6;
}

.placeholder-status {
  margin-bottom: var(--spacing-xl);
}

.placeholder-status :deep(.el-tag) {
  font-size: var(--font-size-base);
  padding: var(--spacing-md) var(--spacing-xl);
  border: 2px solid var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  color: var(--neon-cyan);
}

.placeholder-hint {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  opacity: 0.8;
}

.mr-2 {
  margin-right: 8px;
}
</style>

