<template>
  <span class="status-tag" :class="`status-tag--${type}`">
    <i v-if="icon" :class="icon" />
    <span class="status-tag__text"><slot /></span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  type?: 'success' | 'warning' | 'error' | 'info'
  icon?: string
}>()
</script>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 11px;
  border-radius: 3px;
  font-weight: 600;
  letter-spacing: 0.2px;
  line-height: 1.3;
  border: 1px solid;
}

.status-tag i {
  font-size: 12px;
}

.status-tag__text {
  line-height: 1;
}

.status-tag--success {
  background: rgba(34, 197, 94, 0.12);
  color: rgb(34, 197, 94);
  border-color: rgba(34, 197, 94, 0.3);
}

.status-tag--warning {
  background: rgba(251, 191, 36, 0.12);
  color: rgb(251, 191, 36);
  border-color: rgba(251, 191, 36, 0.3);
}

.status-tag--error {
  background: rgba(239, 68, 68, 0.12);
  color: rgb(239, 68, 68);
  border-color: rgba(239, 68, 68, 0.3);
}

.status-tag--info {
  background: rgba(33, 230, 255, 0.12);
  color: var(--neon-blue);
  border-color: rgba(33, 230, 255, 0.3);
}
</style>


