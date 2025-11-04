<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑书签' : '新增书签'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      label-position="top"
    >
      <el-form-item label="标题" prop="title">
        <NeonInput
          v-model="form.title"
          placeholder="请输入书签标题"
          clearable
        />
      </el-form-item>

      <el-form-item label="网址" prop="url">
        <NeonInput
          v-model="form.url"
          placeholder="https://example.com"
          clearable
        >
          <template #prefix>
            <i class="i-mdi-link-variant" />
          </template>
        </NeonInput>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <NeonTextarea
          v-model="form.description"
          placeholder="请输入书签描述（选填）"
          :rows="3"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="图标URL" prop="icon">
        <NeonInput
          v-model="form.icon"
          placeholder="https://example.com/favicon.ico（选填）"
          clearable
        >
          <template #prefix>
            <i class="i-mdi-image" />
          </template>
          <template #append>
            <el-button @click="autoFetchIcon">
              <i class="i-mdi-auto-fix" />
              自动获取
            </el-button>
          </template>
        </NeonInput>
        <div v-if="form.icon" class="icon-preview">
          <img :src="form.icon" alt="Icon Preview" @error="iconLoadError = true" />
          <span v-if="iconLoadError" class="icon-error">图标加载失败</span>
        </div>
      </el-form-item>

      <el-form-item label="分类" prop="category">
        <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%;">
          <el-option
            v-for="cat in bookmarksStore.categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          >
            <i :class="cat.icon" :style="{ color: cat.color }" />
            {{ cat.name }}
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="标签" prop="tags">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入标签"
          style="width: 100%;"
        >
          <el-option
            v-for="tag in bookmarksStore.tags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.name"
          />
        </el-select>
      </el-form-item>

      <el-form-item>
        <div class="form-options">
          <el-checkbox v-model="form.isPinned">
            <i class="i-mdi-pin" />
            置顶
          </el-checkbox>
          <el-checkbox v-model="form.isFavorite">
            <i class="i-mdi-star" />
            收藏
          </el-checkbox>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <NeonButton type="primary" @click="handleSubmit">
          {{ isEdit ? '保存' : '添加' }}
        </NeonButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useBookmarksStore, type Bookmark } from '@/stores/bookmarks'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import NeonButton from '@/components/NeonButton.vue'

interface Props {
  modelValue: boolean
  bookmark?: Bookmark | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const bookmarksStore = useBookmarksStore()

const visible = ref(props.modelValue)
const formRef = ref<FormInstance>()
const iconLoadError = ref(false)

const isEdit = ref(false)

const form = reactive<{
  title: string
  url: string
  description: string
  icon: string
  category: string
  tags: string[]
  isPinned: boolean
  isFavorite: boolean
}>({
  title: '',
  url: '',
  description: '',
  icon: '',
  category: 'dev',
  tags: [],
  isPinned: false,
  isFavorite: false,
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入书签标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度在 1 到 100 个字符', trigger: 'blur' },
  ],
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' },
    {
      pattern: /^https?:\/\/.+/,
      message: '请输入有效的网址（以 http:// 或 https:// 开头）',
      trigger: 'blur',
    },
  ],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      if (props.bookmark) {
        // 编辑模式
        isEdit.value = true
        Object.assign(form, {
          title: props.bookmark.title,
          url: props.bookmark.url,
          description: props.bookmark.description || '',
          icon: props.bookmark.icon || '',
          category: props.bookmark.category,
          tags: [...props.bookmark.tags],
          isPinned: props.bookmark.isPinned,
          isFavorite: props.bookmark.isFavorite,
        })
      } else {
        // 新增模式
        isEdit.value = false
        resetForm()
      }
      iconLoadError.value = false
    }
  }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// 重置表单
function resetForm() {
  Object.assign(form, {
    title: '',
    url: '',
    description: '',
    icon: '',
    category: 'dev',
    tags: [],
    isPinned: false,
    isFavorite: false,
  })
  formRef.value?.clearValidate()
}

// 自动获取图标
function autoFetchIcon() {
  if (!form.url) {
    ElMessage.warning('请先输入网址')
    return
  }

  try {
    const url = new URL(form.url)
    form.icon = `${url.protocol}//${url.hostname}/favicon.ico`
    iconLoadError.value = false
    ElMessage.success('已自动填充图标地址')
  } catch {
    ElMessage.error('网址格式不正确')
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value && props.bookmark) {
        // 更新书签
        bookmarksStore.updateBookmark(props.bookmark.id, {
          title: form.title,
          url: form.url,
          description: form.description,
          icon: form.icon,
          category: form.category,
          tags: form.tags,
          isPinned: form.isPinned,
          isFavorite: form.isFavorite,
        })
      } else {
        // 添加书签
        bookmarksStore.addBookmark({
          title: form.title,
          url: form.url,
          description: form.description,
          icon: form.icon,
          category: form.category,
          tags: form.tags,
          isPinned: form.isPinned,
          isFavorite: form.isFavorite,
        })
      }
      emit('saved')
      handleClose()
    } else {
      ElMessage.error('请检查表单填写')
      return false
    }
  })
}

// 关闭对话框
function handleClose() {
  visible.value = false
}
</script>

<style scoped>
.form-options {
  display: flex;
  gap: var(--spacing-lg);
}

.icon-preview {
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.icon-preview img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 4px;
  background: var(--color-bg);
}

.icon-error {
  font-size: var(--font-size-sm);
  color: var(--neon-pink);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

/* Element Plus Dialog 样式优化 */
:deep(.el-dialog) {
  background: linear-gradient(135deg, var(--color-panel) 0%, var(--color-panel-light) 100%);
  border: 2px solid var(--neon-cyan-lighter);
  box-shadow: 0 0 30px rgba(33, 230, 255, 0.3);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(33, 230, 255, 0.05) 0%, transparent 100%);
}

:deep(.el-dialog__title) {
  color: var(--color-text);
  font-weight: var(--font-weight-bold);
}

:deep(.el-form-item__label) {
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
}

:deep(.el-checkbox__label) {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text);
}
</style>

