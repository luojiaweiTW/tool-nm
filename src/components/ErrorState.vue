<template>
  <div :class="['error-state', `error-state--${type}`]">
    <div class="error-state__icon">
      <i :class="iconClass" />
    </div>
    <h3 v-if="title" class="error-state__title">{{ title }}</h3>
    <p v-if="message" class="error-state__message">{{ message }}</p>
    <pre v-if="details && showDetails" class="error-state__details">{{ details }}</pre>
    <div class="error-state__actions">
      <slot>
        <NeonButton v-if="onRetry" variant="primary" @click="onRetry">
          <i class="i-mdi-refresh" />
          重试
        </NeonButton>
        <NeonButton v-if="details && !showDetails" variant="outline" @click="showDetails = true">
          <i class="i-mdi-information-outline" />
          查看详情
        </NeonButton>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import NeonButton from './NeonButton.vue'

interface Props {
  type?: 'error' | 'warning' | 'network'
  title?: string
  message?: string
  details?: string
  onRetry?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'error',
  title: '出错了'
})

const showDetails = ref(false)

const iconClass = computed(() => {
  switch (props.type) {
    case 'warning':
      return 'i-mdi-alert-outline'
    case 'network':
      return 'i-mdi-wifi-off'
    default:
      return 'i-mdi-alert-circle-outline'
  }
})
</script>

<style scoped>
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-2xl);
  text-align: center;
}

.error-state__icon {
  font-size: 4em;
  color: var(--neon-pink);
  text-shadow: var(--glow-pink);
  animation: shake 0.5s ease-in-out;
}

.error-state--warning .error-state__icon {
  color: var(--neon-yellow);
  text-shadow: var(--glow-yellow);
}

.error-state--network .error-state__icon {
  color: var(--neon-purple);
  text-shadow: var(--glow-purple);
}

.error-state__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
}

.error-state__message {
  margin: 0;
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-muted);
  max-width: 480px;
}

.error-state__details {
  margin: var(--spacing-md) 0 0;
  padding: var(--spacing-md);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--neon-pink);
  background-color: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  text-align: left;
  max-width: 600px;
  overflow-x: auto;
}

.error-state__actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}
</style>

