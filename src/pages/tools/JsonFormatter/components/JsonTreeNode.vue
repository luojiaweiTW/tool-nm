<template>
  <div class="json-tree-node">
    <!-- 对象或数组 -->
    <div v-if="isExpandable" class="json-tree-node__expandable">
      <div class="json-tree-node__header" @click="toggleExpand">
        <i class="json-tree-node__icon" :class="expanded ? 'i-mdi-chevron-down' : 'i-mdi-chevron-right'" />
        <span v-if="nodeKey !== 'root'" class="json-tree-node__key">{{ nodeKey }}:</span>
        <span class="json-tree-node__preview">
          {{ typePreview }}
          <span v-if="!expanded" class="json-tree-node__count">{{ itemCount }}</span>
        </span>
      </div>
      <div v-show="expanded" class="json-tree-node__children">
        <JsonTreeNode
          v-for="(value, key) in data"
          :key="key"
          :data="value"
          :node-key="String(key)"
          :path="`${path}.${key}`"
        />
      </div>
    </div>

    <!-- 基本类型 -->
    <div v-else class="json-tree-node__simple">
      <span v-if="nodeKey !== 'root'" class="json-tree-node__key">{{ nodeKey }}:</span>
      <span class="json-tree-node__value" :class="`json-tree-node__value--${valueType}`">
        {{ formattedValue }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, type Ref } from 'vue'

interface Props {
  data: any
  nodeKey?: string
  path: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeKey: 'root'
})

const expanded = ref(true)

// 注入展开/折叠信号
const expandAllSignal = inject<Ref<number>>('expandAllSignal')
const collapseAllSignal = inject<Ref<number>>('collapseAllSignal')

// 监听展开所有信号
if (expandAllSignal) {
  watch(expandAllSignal, () => {
    if (isExpandable.value) {
      expanded.value = true
    }
  })
}

// 监听折叠所有信号
if (collapseAllSignal) {
  watch(collapseAllSignal, () => {
    if (isExpandable.value) {
      expanded.value = false
    }
  })
}

// 判断是否可展开（对象或数组）
const isExpandable = computed(() => {
  return typeof props.data === 'object' && props.data !== null
})

// 值类型
const valueType = computed(() => {
  if (props.data === null) return 'null'
  if (typeof props.data === 'boolean') return 'boolean'
  if (typeof props.data === 'number') return 'number'
  if (typeof props.data === 'string') return 'string'
  return 'unknown'
})

// 类型预览
const typePreview = computed(() => {
  if (Array.isArray(props.data)) {
    return '['
  }
  if (typeof props.data === 'object' && props.data !== null) {
    return '{'
  }
  return ''
})

// 项目数量
const itemCount = computed(() => {
  if (Array.isArray(props.data)) {
    return `${props.data.length} items]`
  }
  if (typeof props.data === 'object' && props.data !== null) {
    return `${Object.keys(props.data).length} keys}`
  }
  return ''
})

// 格式化值
const formattedValue = computed(() => {
  if (props.data === null) return 'null'
  if (typeof props.data === 'string') return `"${props.data}"`
  if (typeof props.data === 'boolean') return props.data.toString()
  if (typeof props.data === 'number') return props.data.toString()
  return String(props.data)
})

// 切换展开
function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.json-tree-node {
  user-select: text;
}

.json-tree-node__expandable {
  margin-left: 0;
}

.json-tree-node__header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  transition: background-color 0.2s;
}

.json-tree-node__header:hover {
  background-color: rgba(33, 230, 255, 0.1);
}

.json-tree-node__icon {
  font-size: 16px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  transition: transform 0.2s;
}

.json-tree-node__key {
  color: var(--neon-purple);
  font-weight: var(--font-weight-medium);
}

.json-tree-node__preview {
  color: var(--color-text-secondary);
}

.json-tree-node__count {
  margin-left: 8px;
  color: var(--color-text-tertiary);
  font-size: 0.9em;
}

.json-tree-node__children {
  margin-left: 20px;
  border-left: 1px solid rgba(33, 230, 255, 0.2);
  padding-left: 8px;
}

.json-tree-node__simple {
  padding: 2px 4px;
}

.json-tree-node__value {
  margin-left: 8px;
}

.json-tree-node__value--string {
  color: var(--neon-lime);
}

.json-tree-node__value--number {
  color: var(--neon-cyan);
}

.json-tree-node__value--boolean {
  color: var(--neon-pink);
}

.json-tree-node__value--null {
  color: var(--color-text-tertiary);
  font-style: italic;
}
</style>
