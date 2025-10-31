<template>
  <div class="markdown-toolbar">
    <div class="toolbar-section">
      <el-button
        size="small"
        title="标题"
        @click="insertMarkdown('## ', '')"
      >
        <el-icon><Opportunity /></el-icon>
        H
      </el-button>
      <el-button
        size="small"
        title="粗体 (Ctrl+B)"
        @click="insertMarkdown('**', '**')"
      >
        <el-icon><Document /></el-icon>
        B
      </el-button>
      <el-button
        size="small"
        title="斜体 (Ctrl+I)"
        @click="insertMarkdown('*', '*')"
      >
        <el-icon><EditPen /></el-icon>
        I
      </el-button>
      <el-button
        size="small"
        title="行内代码"
        @click="insertMarkdown('`', '`')"
      >
        <el-icon><Document /></el-icon>
        <>
      </el-button>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-section">
      <el-button
        size="small"
        title="代码块"
        @click="insertCodeBlock"
      >
        <el-icon><DocumentCopy /></el-icon>
        代码
      </el-button>
      <el-button
        size="small"
        title="链接"
        @click="insertLink"
      >
        <el-icon><Link /></el-icon>
        链接
      </el-button>
      <el-button
        size="small"
        title="列表"
        @click="insertMarkdown('- ', '')"
      >
        <el-icon><List /></el-icon>
        列表
      </el-button>
      <el-button
        size="small"
        title="引用"
        @click="insertMarkdown('> ', '')"
      >
        <el-icon><ChatLineRound /></el-icon>
        引用
      </el-button>
    </div>

    <el-divider direction="vertical" />

    <div class="toolbar-section">
      <el-button
        size="small"
        :type="showPreview ? 'primary' : 'default'"
        title="预览"
        @click="$emit('toggle-preview')"
      >
        <el-icon><View /></el-icon>
        预览
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Opportunity,
  Document,
  EditPen,
  DocumentCopy,
  Link,
  List,
  ChatLineRound,
  View,
} from '@element-plus/icons-vue'

interface Props {
  showPreview?: boolean
}

interface Emits {
  (e: 'insert', before: string, after: string): void
  (e: 'toggle-preview'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

function insertMarkdown(before: string, after: string) {
  emit('insert', before, after)
}

function insertCodeBlock() {
  const before = '```javascript\n'
  const after = '\n```'
  emit('insert', before, after)
}

function insertLink() {
  const before = '['
  const after = '](https://)'
  emit('insert', before, after)
}
</script>

<style scoped>
.markdown-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(138, 164, 199, 0.2);
  border-radius: 8px 8px 0 0;
  border-bottom: none;
}

.toolbar-section {
  display: flex;
  gap: 4px;
}

.markdown-toolbar :deep(.el-button) {
  min-width: auto;
  padding: 6px 10px;
  font-size: 12px;
}

.markdown-toolbar :deep(.el-divider) {
  margin: 0 4px;
  height: 20px;
}
</style>

