<template>
  <header class="neon-header">
    <div class="neon-header__main">
      <div class="neon-header__info">
        <h1 class="neon-header__title">
          <i v-if="icon" :class="icon" class="neon-header__icon" />
          {{ title }}
        </h1>
        <p v-if="description" class="neon-header__description">
          {{ description }}
        </p>
      </div>
      <div class="neon-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <div v-if="$slots.tabs" class="neon-header__tabs">
      <slot name="tabs" />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: string
}

withDefaults(defineProps<Props>(), {
  title: '',
  description: '',
})
</script>

<style scoped>
.neon-header {
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--color-panel);
  border-bottom: 3px solid var(--neon-cyan);
  box-shadow: var(--glow-cyan), var(--shadow-sm);
  z-index: var(--z-sticky);
}

.neon-header__main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl) var(--spacing-2xl);
  min-height: var(--header-height);
}

.neon-header__info {
  flex: 1;
  min-width: 0;
  max-width: 50%;  /* 确保标题区域至少占50%宽度 */
}

.neon-header__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin: 0;
  font-family: var(--font-family-display);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text);
  white-space: nowrap;  /* 防止标题换行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.neon-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 1.4em;
  color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.1);
  border: 2px solid var(--neon-cyan);
  border-radius: var(--radius-md);
  box-shadow: var(--glow-cyan);
}

.neon-header__description {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-muted);
}

.neon-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 1;  /* 允许操作区适当收缩，不要挤压标题 */
  flex-wrap: wrap;  /* 允许按钮换行 */
  max-width: 70%;  /* 最多占70%宽度 */
}

.neon-header__tabs {
  padding: 0 var(--spacing-2xl);
  border-top: var(--border-width-thin) solid var(--color-border);
}

/* ========== 几何装饰 ========== */
.neon-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, 
    var(--neon-cyan) 0%, 
    var(--neon-purple) 50%, 
    var(--neon-pink) 100%
  );
  opacity: 0.6;
}

.neon-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.02) 0%, transparent 50%);
  pointer-events: none;
}
</style>

