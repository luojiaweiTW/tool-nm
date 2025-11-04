<template>
  <button
    class="compact-btn"
    :class="[
      `compact-btn--${variant}`,
      `compact-btn--${size}`,
      { 'compact-btn--active': active, 'compact-btn--disabled': disabled }
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <i v-if="icon" :class="icon" />
    <span v-if="$slots.default" class="compact-btn__text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'default' | 'primary' | 'success' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  icon?: string
  active?: boolean
  disabled?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.compact-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  white-space: nowrap;
}

.compact-btn:hover:not(.compact-btn--disabled) {
  transform: translateY(-1px);
}

.compact-btn:active:not(.compact-btn--disabled) {
  transform: translateY(0);
}

/* Sizes */
.compact-btn--xs {
  padding: 3px 8px;
  font-size: 11px;
  line-height: 1.4;
}

.compact-btn--xs i {
  font-size: 13px;
}

.compact-btn--sm {
  padding: 5px 10px;
  font-size: 12px;
  line-height: 1.4;
}

.compact-btn--sm i {
  font-size: 14px;
}

.compact-btn--md {
  padding: 7px 14px;
  font-size: 13px;
  line-height: 1.5;
}

.compact-btn--md i {
  font-size: 16px;
}

/* Variants */
.compact-btn--default {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(33, 230, 255, 0.25);
  color: rgba(255, 255, 255, 0.85);
}

.compact-btn--default:hover:not(.compact-btn--disabled) {
  background: rgba(33, 230, 255, 0.1);
  border-color: rgba(33, 230, 255, 0.4);
  color: var(--neon-blue);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.15);
}

.compact-btn--primary {
  background: rgba(33, 230, 255, 0.12);
  border-color: rgba(33, 230, 255, 0.35);
  color: var(--neon-blue);
}

.compact-btn--primary:hover:not(.compact-btn--disabled) {
  background: rgba(33, 230, 255, 0.18);
  border-color: rgba(33, 230, 255, 0.5);
  box-shadow: 0 0 16px rgba(33, 230, 255, 0.2);
}

.compact-btn--success {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.35);
  color: rgb(34, 197, 94);
}

.compact-btn--success:hover:not(.compact-btn--disabled) {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.5);
  box-shadow: 0 0 16px rgba(34, 197, 94, 0.15);
}

.compact-btn--danger {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: rgb(239, 68, 68);
}

.compact-btn--danger:hover:not(.compact-btn--disabled) {
  background: rgba(239, 68, 68, 0.18);
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.15);
}

/* Active state */
.compact-btn--active {
  background: rgba(33, 230, 255, 0.18);
  border-color: var(--neon-blue);
  color: var(--neon-blue);
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.2);
}

/* Disabled */
.compact-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.compact-btn__text {
  line-height: 1;
}
</style>


