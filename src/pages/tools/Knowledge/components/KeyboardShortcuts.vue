<template>
  <el-dialog
    v-model="visible"
    title="⌨️ 快捷键"
    width="500px"
    class="shortcuts-dialog"
  >
    <div class="shortcuts-list">
      <div class="shortcuts-section">
        <h4>详情页操作</h4>
        <div class="shortcut-item">
          <kbd>P</kbd>
          <span>切换钉选</span>
        </div>
        <div class="shortcut-item">
          <kbd>F</kbd>
          <span>切换收藏</span>
        </div>
        <div class="shortcut-item">
          <kbd>E</kbd>
          <span>编辑知识</span>
        </div>
        <div class="shortcut-item">
          <kbd>Delete</kbd>
          <span>删除知识</span>
        </div>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>C</kbd>
          <span>复制内容</span>
        </div>
      </div>

      <div class="shortcuts-section">
        <h4>全局操作</h4>
        <div class="shortcut-item">
          <kbd>Ctrl</kbd> + <kbd>K</kbd>
          <span>聚焦搜索框</span>
        </div>
        <div class="shortcut-item">
          <kbd>?</kbd>
          <span>显示快捷键帮助</span>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<style scoped>
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.shortcuts-section h4 {
  margin: 0 0 12px 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px rgba(33, 230, 255, 0.6);
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(33, 230, 255, 0.3);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  margin-bottom: 6px;
}

.shortcut-item kbd {
  display: inline-block;
  min-width: 36px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.25) 0%, rgba(33, 230, 255, 0.15) 100%);
  border: 2px solid var(--neon-cyan);
  border-radius: 6px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--neon-cyan);
  text-align: center;
  box-shadow: 0 0 12px rgba(33, 230, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  text-shadow: 0 0 8px rgba(33, 230, 255, 0.8);
  transition: all 0.2s;
}

.shortcut-item kbd:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 16px rgba(33, 230, 255, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.shortcut-item span {
  flex: 1;
  color: var(--color-text);
  font-size: 14px;
}

:deep(.shortcuts-dialog .el-dialog__title) {
  font-size: 18px;
}
</style>

