<template>
  <div class="markdown-renderer" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
// 导入 highlight.js 样式会在全局样式中处理

interface Props {
  content: string
}

const props = defineProps<Props>()

// 配置 marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true, // 支持 GitHub Flavored Markdown
  highlight: function(code, lang) {
    // 代码高亮
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error('Highlight error:', err)
      }
    }
    // 自动检测语言
    try {
      return hljs.highlightAuto(code).value
    } catch (err) {
      return code
    }
  }
})

// 渲染内容
const renderedContent = computed(() => {
  if (!props.content) return ''
  
  try {
    return marked.parse(props.content)
  } catch (error) {
    console.error('Markdown parse error:', error)
    return `<pre>${props.content}</pre>`
  }
})
</script>

<style scoped>
.markdown-renderer {
  color: var(--color-text);
  line-height: 1.8;
  font-size: 14px;
}

/* 标题 */
.markdown-renderer :deep(h1) {
  font-size: 28px;
  font-weight: 700;
  color: var(--neon-cyan);
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(33, 230, 255, 0.3);
}

.markdown-renderer :deep(h2) {
  font-size: 24px;
  font-weight: 700;
  color: var(--neon-cyan);
  margin: 20px 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(33, 230, 255, 0.2);
}

.markdown-renderer :deep(h3) {
  font-size: 20px;
  font-weight: 600;
  color: var(--neon-purple);
  margin: 16px 0 10px 0;
}

.markdown-renderer :deep(h4) {
  font-size: 18px;
  font-weight: 600;
  color: var(--neon-purple);
  margin: 14px 0 8px 0;
}

.markdown-renderer :deep(h5),
.markdown-renderer :deep(h6) {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 12px 0 6px 0;
}

/* 段落 */
.markdown-renderer :deep(p) {
  margin: 12px 0;
}

/* 链接 */
.markdown-renderer :deep(a) {
  color: var(--neon-cyan);
  text-decoration: none;
  border-bottom: 1px solid rgba(33, 230, 255, 0.3);
  transition: all 0.2s;
}

.markdown-renderer :deep(a:hover) {
  color: var(--neon-cyan-light);
  border-bottom-color: var(--neon-cyan);
  text-shadow: 0 0 8px rgba(33, 230, 255, 0.5);
}

/* 行内代码 */
.markdown-renderer :deep(code:not(pre code)) {
  background: rgba(33, 230, 255, 0.1);
  color: var(--neon-cyan);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
  border: 1px solid rgba(33, 230, 255, 0.3);
}

/* 代码块 */
.markdown-renderer :deep(pre) {
  background: rgba(10, 14, 30, 0.8);
  border: 2px solid rgba(33, 230, 255, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.markdown-renderer :deep(pre code) {
  background: none;
  color: var(--color-text);
  padding: 0;
  border: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 代码高亮颜色 */
.markdown-renderer :deep(.hljs-keyword) {
  color: var(--neon-pink);
  font-weight: 600;
}

.markdown-renderer :deep(.hljs-string) {
  color: var(--neon-lime);
}

.markdown-renderer :deep(.hljs-number) {
  color: var(--neon-yellow);
}

.markdown-renderer :deep(.hljs-comment) {
  color: var(--color-muted);
  font-style: italic;
}

.markdown-renderer :deep(.hljs-function) {
  color: var(--neon-cyan);
}

.markdown-renderer :deep(.hljs-title) {
  color: var(--neon-cyan);
  font-weight: 600;
}

.markdown-renderer :deep(.hljs-variable) {
  color: var(--neon-purple);
}

.markdown-renderer :deep(.hljs-built_in) {
  color: var(--neon-purple);
}

.markdown-renderer :deep(.hljs-attr) {
  color: var(--neon-cyan);
}

.markdown-renderer :deep(.hljs-tag) {
  color: var(--neon-pink);
}

/* 引用 */
.markdown-renderer :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 4px solid var(--neon-purple);
  background: rgba(155, 92, 255, 0.08);
  color: var(--color-text);
  font-style: italic;
}

.markdown-renderer :deep(blockquote p) {
  margin: 8px 0;
}

/* 列表 */
.markdown-renderer :deep(ul),
.markdown-renderer :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.markdown-renderer :deep(li) {
  margin: 6px 0;
  line-height: 1.8;
}

.markdown-renderer :deep(ul li) {
  list-style-type: none;
  position: relative;
}

.markdown-renderer :deep(ul li::before) {
  content: '▸';
  color: var(--neon-cyan);
  position: absolute;
  left: -16px;
  font-weight: 600;
}

/* 分隔线 */
.markdown-renderer :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(33, 230, 255, 0.5),
    transparent
  );
  margin: 24px 0;
}

/* 表格 */
.markdown-renderer :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  border: 1px solid rgba(33, 230, 255, 0.3);
}

.markdown-renderer :deep(th) {
  background: rgba(33, 230, 255, 0.15);
  color: var(--neon-cyan);
  font-weight: 600;
  padding: 10px;
  text-align: left;
  border: 1px solid rgba(33, 230, 255, 0.3);
}

.markdown-renderer :deep(td) {
  padding: 10px;
  border: 1px solid rgba(138, 164, 199, 0.2);
}

.markdown-renderer :deep(tr:hover) {
  background: rgba(33, 230, 255, 0.05);
}

/* 粗体 */
.markdown-renderer :deep(strong) {
  color: var(--neon-yellow);
  font-weight: 700;
}

/* 斜体 */
.markdown-renderer :deep(em) {
  color: var(--neon-purple);
  font-style: italic;
}

/* 删除线 */
.markdown-renderer :deep(del) {
  color: var(--color-muted);
  text-decoration: line-through;
}

/* 图片 */
.markdown-renderer :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  border: 2px solid rgba(33, 230, 255, 0.3);
  margin: 16px 0;
}

/* 任务列表 */
.markdown-renderer :deep(input[type="checkbox"]) {
  margin-right: 8px;
  accent-color: var(--neon-cyan);
}
</style>

