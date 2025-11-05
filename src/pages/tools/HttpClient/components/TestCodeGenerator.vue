<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="生成测试代码"
    width="800px"
    :close-on-click-modal="false"
    class="test-code-dialog"
  >
    <!-- 模板选择 -->
    <div class="dialog-section">
      <label class="section-label">选择测试框架</label>
      <el-select v-model="selectedTemplate" size="large" style="width: 100%">
        <el-option
          v-for="template in templates"
          :key="template.id"
          :label="`${template.name} (${template.language})`"
          :value="template.id"
        >
          <div class="template-option">
            <i :class="template.icon" />
            <span class="template-name">{{ template.name }}</span>
            <span class="template-desc">{{ template.framework }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- 代码预览 -->
    <div class="dialog-section">
      <label class="section-label">
        测试代码预览
        <span class="code-language">({{ currentTemplate?.language }})</span>
      </label>
      <div class="code-preview">
        <pre class="code-content"><code :class="`language-${currentLanguage}`" v-html="highlightedCode"></code></pre>
      </div>
    </div>

    <!-- 操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <NeonButton @click="handleCopy" type="primary">
          <i class="i-mdi-content-copy mr-2" />
          复制代码
        </NeonButton>
        <NeonButton @click="handleSaveSnippet" type="primary">
          <i class="i-mdi-content-save mr-2" />
          保存到代码片段
        </NeonButton>
        <NeonButton @click="handleClose(false)" type="outline">
          关闭
        </NeonButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'
import NeonButton from '@/components/NeonButton.vue'
import {
  generateTestCode,
  getAllTemplates,
  getLanguageByTemplateId,
  type TestCodeParams,
  type TestCodeTemplate,
} from '@/utils/testTemplates'

// Props
interface Props {
  visible: boolean
  requestData: TestCodeParams
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'save-snippet': [code: string, template: TestCodeTemplate]
}>()

// State
const selectedTemplate = ref('restassured')
const generatedCode = ref('')
const templates = getAllTemplates()

// Computed
const currentTemplate = computed(() => {
  return templates.find(t => t.id === selectedTemplate.value)
})

const currentLanguage = computed(() => {
  return getLanguageByTemplateId(selectedTemplate.value)
})

const highlightedCode = computed(() => {
  if (!generatedCode.value) return ''
  
  try {
    const highlighted = hljs.highlight(generatedCode.value, {
      language: currentLanguage.value,
    })
    return highlighted.value
  } catch {
    return generatedCode.value
  }
})

// 生成代码
function generateCode() {
  if (!props.requestData) return
  
  try {
    generatedCode.value = generateTestCode(props.requestData, selectedTemplate.value)
  } catch (error: any) {
    ElMessage.error(`生成失败: ${error.message}`)
    console.error('Generate test code error:', error)
  }
}

// 监听模板变化
watch(selectedTemplate, () => {
  generateCode()
})

// 监听对话框打开
watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // 对话框打开时生成代码
    generateCode()
  }
})

// 复制代码
async function handleCopy() {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 保存到代码片段
function handleSaveSnippet() {
  if (!currentTemplate.value) return
  emit('save-snippet', generatedCode.value, currentTemplate.value)
}

// 关闭对话框
function handleClose(value: boolean) {
  emit('update:visible', value)
}
</script>

<style scoped>
.test-code-dialog :deep(.el-dialog) {
  background: var(--color-panel);
  border: 2px solid var(--neon-cyan);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.3);
}

.test-code-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.1), rgba(255, 42, 161, 0.1));
  border-bottom: 1px solid rgba(33, 230, 255, 0.2);
}

.test-code-dialog :deep(.el-dialog__title) {
  color: var(--color-text);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
}

.dialog-section {
  margin-bottom: var(--spacing-lg);
}

.section-label {
  display: block;
  font-size: var(--font-size-base);
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-sm);
}

.code-language {
  color: var(--neon-cyan);
  font-size: var(--font-size-sm);
  margin-left: var(--spacing-xs);
}

.template-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.template-option i {
  font-size: 1.2em;
  color: var(--neon-cyan);
}

.template-name {
  font-weight: var(--font-weight-medium);
  color: var(--color-text);
}

.template-desc {
  color: var(--color-muted);
  font-size: var(--font-size-sm);
  margin-left: auto;
}

.code-preview {
  background: #1e1e1e;
  border: 1px solid rgba(33, 230, 255, 0.3);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 500px;
  overflow-y: auto;
}

/* 霓虹滚动条 */
.code-preview::-webkit-scrollbar {
  width: 8px;
}

.code-preview::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.code-preview::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
}

.code-preview::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.8);
}

.code-content {
  margin: 0;
  padding: var(--spacing-md);
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #abb2bf;
  background: transparent;
  white-space: pre;
  overflow-x: auto;
}

.code-content code {
  background: transparent;
  padding: 0;
  border: none;
}

.dialog-footer {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

.mr-2 {
  margin-right: 8px;
}

/* Element Plus 组件样式覆盖 */
:deep(.el-select) {
  --el-select-input-focus-border-color: var(--neon-cyan);
}

:deep(.el-select .el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(33, 230, 255, 0.3);
  box-shadow: none;
}

:deep(.el-select .el-input__wrapper:hover) {
  border-color: var(--neon-cyan);
}

:deep(.el-select .el-input__wrapper.is-focus) {
  border-color: var(--neon-cyan);
  box-shadow: 0 0 8px rgba(33, 230, 255, 0.3);
}

:deep(.el-select .el-input__inner) {
  color: var(--color-text);
}
</style>

