<template>
  <button
    :class="[
      'neon-button',
      `neon-button--${variant}`,
      `neon-button--${size}`,
      {
        'neon-button--disabled': disabled,
        'neon-button--loading': loading,
      }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="neon-button__loading">
      <i class="i-mdi-loading animate-spin" />
    </span>
    <span class="neon-button__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'text'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
}

interface Emits {
  (e: 'click', event: MouseEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
})

const emit = defineEmits<Emits>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.neon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-base);
  line-height: var(--line-height-tight);
  border: var(--border-width-normal) solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  transition: all var(--transition-base) var(--transition-timing);
  overflow: hidden;
}

/* 按钮扫描线效果 */
.neon-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  transform: rotate(0deg);
  animation: buttonScan 3s linear infinite;
  pointer-events: none;
}

/* 悬停时的能量脉冲 */
.neon-button:hover::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  animation: buttonPulse 0.6s ease-out;
  pointer-events: none;
}

@keyframes buttonScan {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes buttonPulse {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

/* ========== 尺寸变体 ========== */
.neon-button--small {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.neon-button--medium {
  padding: var(--spacing-md) var(--spacing-xl);
  font-size: var(--font-size-base);
}

.neon-button--large {
  padding: var(--spacing-lg) var(--spacing-2xl);
  font-size: var(--font-size-lg);
}

/* ========== Primary 变体 (Cyan) ========== */
.neon-button--primary {
  background-color: transparent;
  color: var(--neon-cyan);
  border: 3px solid var(--neon-cyan);
  box-shadow: inset 0 0 20px rgba(33, 230, 255, 0.3), var(--glow-cyan);
  font-weight: var(--font-weight-bold);
  text-shadow: 0 0 10px var(--neon-cyan);
  animation: buttonGlowCyan 2s ease-in-out infinite;
}

.neon-button--primary:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: rgba(33, 230, 255, 0.2);
  border-color: var(--neon-cyan-light);
  box-shadow: inset 0 0 30px rgba(33, 230, 255, 0.5), var(--glow-cyan-strong);
  transform: translateY(-2px);
  animation: buttonGlowCyanStrong 1s ease-in-out infinite;
}

@keyframes buttonGlowCyan {
  0%, 100% {
    box-shadow: 
      inset 0 0 20px rgba(33, 230, 255, 0.3),
      0 0 10px rgba(33, 230, 255, 0.5),
      0 0 20px rgba(33, 230, 255, 0.3);
  }
  50% {
    box-shadow: 
      inset 0 0 30px rgba(33, 230, 255, 0.5),
      0 0 15px rgba(33, 230, 255, 0.7),
      0 0 30px rgba(33, 230, 255, 0.5);
  }
}

@keyframes buttonGlowCyanStrong {
  0%, 100% {
    box-shadow: 
      inset 0 0 30px rgba(33, 230, 255, 0.5),
      0 0 15px rgba(33, 230, 255, 0.8),
      0 0 30px rgba(33, 230, 255, 0.6),
      0 0 45px rgba(33, 230, 255, 0.4);
  }
  50% {
    box-shadow: 
      inset 0 0 40px rgba(33, 230, 255, 0.7),
      0 0 20px rgba(33, 230, 255, 1),
      0 0 40px rgba(33, 230, 255, 0.8),
      0 0 60px rgba(33, 230, 255, 0.6);
  }
}

.neon-button--primary:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== Success 变体 (Lime) ========== */
.neon-button--success {
  background-color: var(--neon-lime);
  color: #000000;
  border-color: var(--neon-lime);
  box-shadow: var(--glow-lime);
  font-weight: var(--font-weight-bold);
}

.neon-button--success:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: var(--neon-lime-light);
  border-color: var(--neon-lime-light);
  box-shadow: 0 0 16px var(--neon-lime), 0 0 32px var(--neon-lime-light);
  transform: translateY(-2px);
}

.neon-button--success:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== Warning 变体 (Yellow) ========== */
.neon-button--warning {
  background-color: var(--neon-yellow);
  color: #000000;
  border-color: var(--neon-yellow);
  box-shadow: var(--glow-yellow);
  font-weight: var(--font-weight-bold);
}

.neon-button--warning:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: var(--neon-yellow-light);
  border-color: var(--neon-yellow-light);
  box-shadow: 0 0 16px var(--neon-yellow), 0 0 32px var(--neon-yellow-light);
  transform: translateY(-2px);
}

.neon-button--warning:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== Danger 变体 (Pink) ========== */
.neon-button--danger {
  background-color: var(--neon-pink);
  color: #ffffff;
  border-color: var(--neon-pink);
  box-shadow: var(--glow-pink);
  font-weight: var(--font-weight-bold);
}

.neon-button--danger:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: var(--neon-pink-light);
  border-color: var(--neon-pink-light);
  box-shadow: var(--glow-pink-strong);
  transform: translateY(-2px);
}

.neon-button--danger:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== Info 变体 (Purple) ========== */
.neon-button--info {
  background-color: var(--neon-purple);
  color: #ffffff;
  border-color: var(--neon-purple);
  box-shadow: var(--glow-purple);
  font-weight: var(--font-weight-bold);
}

.neon-button--info:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: var(--neon-purple-light);
  border-color: var(--neon-purple-light);
  box-shadow: var(--glow-purple-strong);
  transform: translateY(-2px);
}

.neon-button--info:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== Outline 变体 ========== */
.neon-button--outline {
  background-color: transparent;
  color: var(--neon-cyan);
  border-color: var(--neon-cyan);
  box-shadow: inset 0 0 20px rgba(33, 230, 255, 0.1);
}

.neon-button--outline:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: rgba(33, 230, 255, 0.15);
  border-color: var(--neon-cyan-light);
  box-shadow: var(--glow-cyan), inset 0 0 20px rgba(33, 230, 255, 0.2);
  color: var(--neon-cyan-light);
  transform: translateY(-2px);
}

.neon-button--outline:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== Text 变体 ========== */
.neon-button--text {
  background-color: transparent;
  color: var(--neon-cyan);
  border-color: transparent;
  box-shadow: none;
}

.neon-button--text:hover:not(.neon-button--disabled):not(.neon-button--loading) {
  background-color: rgba(33, 230, 255, 0.1);
  color: var(--neon-cyan-light);
  text-shadow: var(--glow-cyan);
}

.neon-button--text:active:not(.neon-button--disabled):not(.neon-button--loading) {
  transform: scale(0.98);
}

/* ========== 禁用状态 ========== */
.neon-button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: saturate(0.5);
  transform: none !important;
  box-shadow: none !important;
}

/* ========== 加载状态 ========== */
.neon-button--loading {
  cursor: wait;
}

.neon-button__loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.neon-button__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

/* ========== 按钮内图标 ========== */
.neon-button :deep(.iconify) {
  font-size: 1.2em;
}
</style>

