<template>
  <div
    :class="[
      'neon-card',
      `neon-card--${variant}`,
      {
        'neon-card--hoverable': hoverable,
        'neon-card--compact': compact,
      }
    ]"
  >
    <div v-if="$slots.header || title" class="neon-card__header">
      <div class="neon-card__header-content">
        <div v-if="icon" class="neon-card__icon">
          <i :class="icon" />
        </div>
        <div class="neon-card__header-text">
          <h3 v-if="title" class="neon-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="neon-card__subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div v-if="$slots.extra" class="neon-card__extra">
        <slot name="extra" />
      </div>
      <slot name="header" />
    </div>
    <div class="neon-card__body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="neon-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  icon?: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  hoverable?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: false,
  compact: false,
})
</script>

<style scoped>
.neon-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--color-panel) 0%, var(--color-panel-light) 100%);
  border: 2px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  box-shadow: inset 0 0 40px rgba(33, 230, 255, 0.06), 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all var(--transition-base) var(--transition-timing);
  backdrop-filter: blur(12px);
  animation: cardGlow 4s ease-in-out infinite;
}

/* 卡片边框发光动画 */
@keyframes cardGlow {
  0%, 100% {
    box-shadow: 
      inset 0 0 40px rgba(33, 230, 255, 0.06),
      0 4px 20px rgba(0, 0, 0, 0.3),
      0 0 5px rgba(33, 230, 255, 0.2);
  }
  50% {
    box-shadow: 
      inset 0 0 50px rgba(33, 230, 255, 0.1),
      0 4px 20px rgba(0, 0, 0, 0.3),
      0 0 10px rgba(33, 230, 255, 0.4),
      0 0 20px rgba(155, 92, 255, 0.2);
  }
}

/* 卡片扫描线效果 */
.neon-card::after {
  content: '';
  position: absolute;
  top: -100%;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(33, 230, 255, 0.1) 50%,
    transparent 100%
  );
  animation: cardScan 6s linear infinite;
  pointer-events: none;
  z-index: 10;
}

@keyframes cardScan {
  0% {
    top: -100%;
  }
  100% {
    top: 100%;
  }
}

/* 悬停增强效果 */
.neon-card:hover {
  background: linear-gradient(135deg, var(--color-panel-light) 0%, var(--color-panel-hover) 100%);
  border-color: var(--neon-cyan-lighter);
  box-shadow: 
    inset 0 0 50px rgba(33, 230, 255, 0.10),
    0 6px 24px rgba(0, 0, 0, 0.35),
    0 0 15px rgba(33, 230, 255, 0.5),
    0 0 30px rgba(155, 92, 255, 0.3);
  animation: cardGlowStrong 2s ease-in-out infinite;
}

@keyframes cardGlowStrong {
  0%, 100% {
    box-shadow: 
      inset 0 0 50px rgba(33, 230, 255, 0.10),
      0 6px 24px rgba(0, 0, 0, 0.35),
      0 0 15px rgba(33, 230, 255, 0.5),
      0 0 30px rgba(155, 92, 255, 0.3);
  }
  50% {
    box-shadow: 
      inset 0 0 60px rgba(33, 230, 255, 0.15),
      0 6px 24px rgba(0, 0, 0, 0.35),
      0 0 20px rgba(33, 230, 255, 0.7),
      0 0 40px rgba(155, 92, 255, 0.5),
      0 0 60px rgba(255, 42, 161, 0.3);
  }
}

.neon-card--hoverable {
  cursor: pointer;
}

.neon-card--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--neon-cyan);
}

/* ========== 紧凑模式 ========== */
.neon-card--compact .neon-card__header {
  padding: var(--spacing-md) var(--spacing-lg);
}

.neon-card--compact .neon-card__body {
  padding: var(--spacing-md) var(--spacing-lg);
}

.neon-card--compact .neon-card__footer {
  padding: var(--spacing-md) var(--spacing-lg);
}

/* ========== 变体样式 ========== */
.neon-card--primary {
  border-color: var(--neon-cyan);
}

.neon-card--primary .neon-card__header {
  border-bottom-color: var(--neon-cyan);
}

.neon-card--success {
  border-color: var(--neon-lime);
}

.neon-card--success .neon-card__header {
  border-bottom-color: var(--neon-lime);
}

.neon-card--warning {
  border-color: var(--neon-yellow);
}

.neon-card--warning .neon-card__header {
  border-bottom-color: var(--neon-yellow);
}

.neon-card--danger {
  border-color: var(--neon-pink);
}

.neon-card--danger .neon-card__header {
  border-bottom-color: var(--neon-pink);
}

.neon-card--info {
  border-color: var(--neon-purple);
}

.neon-card--info .neon-card__header {
  border-bottom-color: var(--neon-purple);
}

/* ========== 卡片头部（浅色优化）========== */
.neon-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border-light);  /* 浅色边框 */
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.08) 0%, rgba(155, 92, 255, 0.04) 100%);  /* 浅色渐变 */
}

.neon-card__header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.neon-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 1.5em;
  color: var(--neon-cyan-light);
  background: rgba(33, 230, 255, 0.15);
  border: 1px solid var(--neon-cyan-lighter);
  border-radius: var(--radius-sm);
  box-shadow: inset 0 0 15px rgba(33, 230, 255, 0.20), 0 0 8px rgba(33, 230, 255, 0.3);
  animation: iconGlow 2s ease-in-out infinite;
}

@keyframes iconGlow {
  0%, 100% {
    box-shadow: 
      inset 0 0 15px rgba(33, 230, 255, 0.20),
      0 0 8px rgba(33, 230, 255, 0.3);
  }
  50% {
    box-shadow: 
      inset 0 0 20px rgba(33, 230, 255, 0.30),
      0 0 12px rgba(33, 230, 255, 0.5),
      0 0 20px rgba(155, 92, 255, 0.3);
  }
}

.neon-card__header-text {
  flex: 1;
  min-width: 0;
}

.neon-card__title {
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text);
}

.neon-card__subtitle {
  margin: var(--spacing-xs) 0 0;
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-muted);
}

.neon-card__extra {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-md);
}

/* ========== 卡片主体 ========== */
.neon-card__body {
  flex: 1;
  padding: var(--spacing-xl);
}

/* ========== 卡片底部（浅色优化）========== */
.neon-card__footer {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);  /* 浅色边框 */
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.05) 0%, rgba(155, 92, 255, 0.03) 100%);  /* 浅色渐变 */
}

/* ========== 几何点缀装饰 ========== */
.neon-card__header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--neon-cyan) 0%, transparent 100%);
  opacity: 0.6;
}

.neon-card--primary .neon-card__header::before {
  background: linear-gradient(180deg, var(--neon-cyan) 0%, transparent 100%);
}

.neon-card--success .neon-card__header::before {
  background: linear-gradient(180deg, var(--neon-lime) 0%, transparent 100%);
}

.neon-card--warning .neon-card__header::before {
  background: linear-gradient(180deg, var(--neon-yellow) 0%, transparent 100%);
}

.neon-card--danger .neon-card__header::before {
  background: linear-gradient(180deg, var(--neon-pink) 0%, transparent 100%);
}

.neon-card--info .neon-card__header::before {
  background: linear-gradient(180deg, var(--neon-purple) 0%, transparent 100%);
}
</style>

