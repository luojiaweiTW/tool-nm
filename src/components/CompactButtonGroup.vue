<template>
  <div class="compact-btn-group" :class="`compact-btn-group--${size}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  size?: 'xs' | 'sm' | 'md'
}>()
</script>

<style scoped>
.compact-btn-group {
  display: inline-flex;
  gap: 4px;
}

.compact-btn-group--xs {
  gap: 3px;
}

.compact-btn-group--sm {
  gap: 4px;
}

.compact-btn-group--md {
  gap: 6px;
}
</style>


