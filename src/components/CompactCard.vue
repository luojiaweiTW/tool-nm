<template>
  <div class="compact-card" :class="{ 'compact-card--dark': dark }">
    <div v-if="title || $slots.header || $slots.actions" class="compact-card__header">
      <div class="compact-card__title">
        <slot name="header">
          <i v-if="icon" :class="icon" />
          <span>{{ title }}</span>
        </slot>
      </div>
      <div v-if="$slots.actions" class="compact-card__actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="compact-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  icon?: string
  dark?: boolean
}>()
</script>

<style scoped>
.compact-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(33, 230, 255, 0.15);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.25s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.compact-card:hover {
  border-color: rgba(33, 230, 255, 0.3);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.1);
}

.compact-card--dark {
  background: rgba(0, 0, 0, 0.2);
}

.compact-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(33, 230, 255, 0.03);
  border-bottom: 1px solid rgba(33, 230, 255, 0.1);
  gap: 12px;
  min-height: 42px;
}

.compact-card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--neon-blue);
  letter-spacing: 0.3px;
  flex: 1;
  min-width: 0;
}

.compact-card__title i {
  font-size: 16px;
  flex-shrink: 0;
}

.compact-card__title span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.compact-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.compact-card__body {
  padding: 12px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>


