<template>
  <div class="empty-state">
    <div class="empty-state__icon">
      <i :class="icon" />
    </div>
    <h3 v-if="title" class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.default" class="empty-state__actions">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'i-mdi-inbox',
  title: '暂无数据',
  description: ''
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 48px 24px;
  text-align: center;
  min-height: 300px;
}

.empty-state__icon {
  font-size: 4em;
  color: var(--color-muted);
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.empty-state__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.empty-state__description {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-muted);
  max-width: 480px;
}

.empty-state__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
