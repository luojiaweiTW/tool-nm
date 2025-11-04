<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑代码片段' : '新增代码片段'"
    width="900px"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      label-position="top"
    >
      <!-- 标题 -->
      <el-form-item label="标题" prop="title">
        <NeonInput
          v-model="form.title"
          placeholder="输入代码片段标题..."
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <!-- 描述 -->
      <el-form-item label="描述" prop="description">
        <NeonTextarea
          v-model="form.description"
          placeholder="简要描述这个代码片段的用途..."
          :rows="2"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 语言和分类 -->
      <div class="form-row">
        <el-form-item label="语言" prop="language" class="form-row__item">
          <el-select v-model="form.language" placeholder="选择编程语言" filterable>
            <el-option
              v-for="lang in languages"
              :key="lang.id"
              :label="lang.name"
              :value="lang.id"
            >
              <i :class="lang.icon" />
              {{ lang.name }}
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="分类" prop="categoryId" class="form-row__item">
          <el-select v-model="form.categoryId" placeholder="选择分类">
            <el-option
              v-for="category in snippetStore.categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            >
              <i :class="category.icon" />
              {{ category.name }}
            </el-option>
          </el-select>
        </el-form-item>
      </div>

      <!-- 标签 -->
      <el-form-item label="标签">
        <div class="tag-selector">
          <el-tag
            v-for="tag in snippetStore.tags"
            :key="tag.id"
            :type="form.tags.includes(tag.id) ? 'primary' : 'info'"
            :effect="form.tags.includes(tag.id) ? 'dark' : 'plain'"
            :color="tag.color"
            size="small"
            class="tag-item"
            @click="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </el-form-item>

      <!-- 代码内容 -->
      <el-form-item label="代码" prop="code">
        <div class="code-editor">
          <div class="code-editor__toolbar">
            <el-button size="small" @click="handleImportFile">
              <i class="i-mdi-folder-open" />
              导入文件
            </el-button>
            <el-button size="small" @click="handleFormat">
              <i class="i-mdi-code-braces" />
              格式化
            </el-button>
            <span class="code-editor__info">
              行数: {{ lineCount }} | 字符: {{ form.code.length }}
            </span>
          </div>
          <div class="code-editor__wrapper">
            <NeonTextarea
              ref="codeTextareaRef"
              v-model="form.code"
              placeholder="输入或粘贴代码..."
              :rows="15"
              class="code-textarea mono"
            />
          </div>
        </div>
      </el-form-item>

      <!-- 选项 -->
      <el-form-item label="选项">
        <el-checkbox v-model="form.isPinned">置顶</el-checkbox>
        <el-checkbox v-model="form.isFavorite">收藏</el-checkbox>
        <el-checkbox v-model="form.isPublic">公开（未来功能）</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <NeonButton variant="outline" @click="handleClose">取消</NeonButton>
        <NeonButton variant="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? '保存' : '创建' }}
        </NeonButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useSnippetStore } from '@/stores/snippet'
import type { Snippet, SnippetLanguage } from '@/types/snippet'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import NeonButton from '@/components/NeonButton.vue'

interface Props {
  modelValue: boolean
  snippet?: Snippet
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const snippetStore = useSnippetStore()

// 表单
const formRef = ref<FormInstance>()
const codeTextareaRef = ref()
const form = ref({
  title: '',
  description: '',
  language: 'javascript' as SnippetLanguage,
  categoryId: '',
  tags: [] as string[],
  code: '',
  isPinned: false,
  isFavorite: false,
  isPublic: false,
})

const saving = ref(false)

// 支持的语言
const languages = [
  { id: 'javascript', name: 'JavaScript', icon: 'i-mdi-language-javascript' },
  { id: 'typescript', name: 'TypeScript', icon: 'i-mdi-language-typescript' },
  { id: 'python', name: 'Python', icon: 'i-mdi-language-python' },
  { id: 'java', name: 'Java', icon: 'i-mdi-language-java' },
  { id: 'go', name: 'Go', icon: 'i-mdi-language-go' },
  { id: 'rust', name: 'Rust', icon: 'i-mdi-language-rust' },
  { id: 'cpp', name: 'C++', icon: 'i-mdi-language-cpp' },
  { id: 'c', name: 'C', icon: 'i-mdi-language-c' },
  { id: 'csharp', name: 'C#', icon: 'i-mdi-language-csharp' },
  { id: 'php', name: 'PHP', icon: 'i-mdi-language-php' },
  { id: 'ruby', name: 'Ruby', icon: 'i-mdi-language-ruby' },
  { id: 'swift', name: 'Swift', icon: 'i-mdi-language-swift' },
  { id: 'kotlin', name: 'Kotlin', icon: 'i-mdi-language-kotlin' },
  { id: 'sql', name: 'SQL', icon: 'i-mdi-database' },
  { id: 'bash', name: 'Bash', icon: 'i-mdi-bash' },
  { id: 'powershell', name: 'PowerShell', icon: 'i-mdi-powershell' },
  { id: 'html', name: 'HTML', icon: 'i-mdi-language-html5' },
  { id: 'css', name: 'CSS', icon: 'i-mdi-language-css3' },
  { id: 'scss', name: 'SCSS', icon: 'i-mdi-sass' },
  { id: 'json', name: 'JSON', icon: 'i-mdi-code-json' },
  { id: 'yaml', name: 'YAML', icon: 'i-mdi-file-code' },
  { id: 'markdown', name: 'Markdown', icon: 'i-mdi-language-markdown' },
  { id: 'xml', name: 'XML', icon: 'i-mdi-xml' },
  { id: 'dockerfile', name: 'Dockerfile', icon: 'i-mdi-docker' },
  { id: 'other', name: '其他', icon: 'i-mdi-code-braces' },
]

// 验证规则
const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  language: [{ required: true, message: '请选择语言', trigger: 'change' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  code: [{ required: true, message: '请输入代码', trigger: 'blur' }],
}

// 是否编辑模式
const isEdit = computed(() => !!props.snippet)

// 代码行数
const lineCount = computed(() => {
  return form.value.code.split('\n').length
})

// 对话框可见性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 监听 snippet 变化
watch(
  () => props.snippet,
  (snippet) => {
    if (snippet) {
      // 编辑模式：初始化表单
      form.value = {
        title: snippet.title,
        description: snippet.description,
        language: snippet.language,
        categoryId: snippet.categoryId,
        tags: [...snippet.tags],
        code: snippet.code,
        isPinned: snippet.isPinned,
        isFavorite: snippet.isFavorite,
        isPublic: snippet.isPublic,
      }
    } else {
      // 新增模式：重置表单
      resetForm()
    }
  },
  { immediate: true }
)

// 重置表单
function resetForm() {
  form.value = {
    title: '',
    description: '',
    language: 'javascript',
    categoryId: snippetStore.categories[0]?.id || '',
    tags: [],
    code: '',
    isPinned: false,
    isFavorite: false,
    isPublic: false,
  }
  formRef.value?.clearValidate()
}

// 切换标签
function toggleTag(tagId: string) {
  const index = form.value.tags.indexOf(tagId)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  } else {
    form.value.tags.push(tagId)
  }
}

// 导入文件
async function handleImportFile() {
  try {
    const electronAPI = (window as any).electronAPI
    if (!electronAPI || !electronAPI.selectFile) {
      ElMessage.error('当前环境不支持文件选择功能')
      return
    }

    const result = await electronAPI.selectFile({
      title: '选择代码文件',
      filters: [
        { name: '所有文件', extensions: ['*'] },
        { name: '代码文件', extensions: ['js', 'ts', 'py', 'java', 'go', 'rs', 'cpp', 'c', 'cs', 'php', 'rb'] },
      ],
    })

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return
    }

    const filePath = result.filePaths[0]
    const readResult = await electronAPI.readFile(filePath)

    if (readResult.success) {
      form.value.code = readResult.data
      ElMessage.success('文件已导入')

      // 根据文件扩展名自动设置语言
      const ext = filePath.split('.').pop()?.toLowerCase()
      const langMap: Record<string, SnippetLanguage> = {
        js: 'javascript',
        ts: 'typescript',
        py: 'python',
        java: 'java',
        go: 'go',
        rs: 'rust',
        cpp: 'cpp',
        c: 'c',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        sh: 'bash',
        ps1: 'powershell',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        yaml: 'yaml',
        md: 'markdown',
        xml: 'xml',
      }
      if (ext && langMap[ext]) {
        form.value.language = langMap[ext]
      }
    } else {
      ElMessage.error('文件读取失败')
    }
  } catch (error) {
    console.error('导入文件失败:', error)
    ElMessage.error('导入失败')
  }
}

// 格式化代码（简单版）
function handleFormat() {
  try {
    if (form.value.language === 'json') {
      const parsed = JSON.parse(form.value.code)
      form.value.code = JSON.stringify(parsed, null, 2)
      ElMessage.success('格式化成功')
    } else {
      ElMessage.info('当前仅支持 JSON 格式化')
    }
  } catch (error) {
    ElMessage.error('格式化失败')
  }
}

// 保存
async function handleSave() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true

  try {
    if (isEdit.value && props.snippet) {
      // 更新
      await snippetStore.updateSnippet(props.snippet.id, {
        title: form.value.title,
        description: form.value.description,
        language: form.value.language,
        categoryId: form.value.categoryId,
        tags: form.value.tags,
        code: form.value.code,
        isPinned: form.value.isPinned,
        isFavorite: form.value.isFavorite,
        isPublic: form.value.isPublic,
      })
    } else {
      // 新增
      await snippetStore.addSnippet({
        title: form.value.title,
        description: form.value.description,
        language: form.value.language,
        categoryId: form.value.categoryId,
        tags: form.value.tags,
        code: form.value.code,
        isPinned: form.value.isPinned,
        isFavorite: form.value.isFavorite,
        isPublic: form.value.isPublic,
      })
    }

    emit('save')
    visible.value = false
  } catch (error) {
    console.error('Save failed:', error)
  } finally {
    saving.value = false
  }
}

// 关闭
function handleClose() {
  visible.value = false
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-row__item {
  margin-bottom: 0 !important;
}

.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tag-item:hover {
  transform: scale(1.05);
}

.code-editor {
  width: 100%;
}

.code-editor__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-bg);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
}

.code-editor__info {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

/* 🔧 代码编辑区域固定高度 */
.code-editor__wrapper {
  height: 400px;
  overflow: hidden;
}

.code-textarea :deep(.neon-textarea__inner) {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  height: 100% !important;
  min-height: 400px !important;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.1), rgba(155, 92, 255, 0.1));
  border-bottom: 2px solid rgba(33, 230, 255, 0.3);
}

:deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

:deep(.el-dialog__body) {
  padding: var(--spacing-xl);
}
</style>
