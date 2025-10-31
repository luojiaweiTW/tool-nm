<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑知识' : '新增知识'"
    width="680px"
    :close-on-click-modal="false"
    class="knowledge-editor-dialog"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
      label-position="top"
    >
      <!-- 类型选择 -->
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type" :disabled="isEdit">
          <el-radio-button label="text">📝 文本</el-radio-button>
          <el-radio-button label="image">🖼️ 图片</el-radio-button>
          <el-radio-button label="url">🔗 网址</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 标题 -->
      <el-form-item label="标题" prop="title">
        <NeonInput
          v-model="form.title"
          placeholder="输入知识标题"
          clearable
        />
      </el-form-item>

      <!-- 分类 -->
      <el-form-item label="分类" prop="categoryId">
        <el-select
          v-model="form.categoryId"
          placeholder="选择分类"
          style="width: 100%"
        >
          <el-option
            v-for="cat in knowledgeStore.categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          >
            <div class="category-option">
              <el-icon :style="{ color: cat.color }">
                <component :is="cat.icon" />
              </el-icon>
              <span>{{ cat.name }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <!-- 文本内容（带工具栏和预览）-->
      <el-form-item
        v-if="form.type === 'text'"
        label="内容（支持 Markdown）"
        prop="content"
      >
        <div class="content-editor">
          <!-- Markdown 工具栏和导入按钮 -->
          <div class="toolbar-row">
            <MarkdownToolbar
              :show-preview="showPreview"
              @insert="handleInsertMarkdown"
              @toggle-preview="showPreview = !showPreview"
            />
            <el-button
              size="small"
              type="primary"
              plain
              @click="handleImportMdFile"
              title="从本地导入 Markdown 文件"
            >
              <el-icon><FolderOpened /></el-icon>
              导入MD文件
            </el-button>
          </div>
          
          <!-- 编辑器和预览区域 -->
          <div class="editor-container" :class="{ 'split-view': showPreview }">
            <!-- 编辑区 -->
            <div class="editor-area">
              <NeonTextarea
                ref="textareaRef"
                v-model="form.content"
                placeholder="输入知识内容，支持 Markdown 格式&#10;&#10;快速提示：&#10;- 代码块：```language&#10;- 标题：## 标题&#10;- 粗体：**文本**&#10;- 斜体：*文本*"
                :rows="showPreview ? 12 : 10"
                :maxlength="10000"
                show-word-limit
              />
            </div>
            
            <!-- 预览区 -->
            <div v-if="showPreview" class="preview-area">
              <div class="preview-header">预览</div>
              <div class="preview-content">
                <MarkdownRenderer :content="form.content || '暂无内容'" />
              </div>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- URL 输入 -->
      <el-form-item
        v-if="form.type === 'url'"
        label="网址"
        prop="url"
      >
        <NeonInput
          v-model="form.url"
          placeholder="输入网址，例如：https://example.com"
          clearable
          @blur="handleUrlBlur"
        >
          <template #prefix>
            <el-icon><Link /></el-icon>
          </template>
          <template #append>
            <el-button @click="testUrl" :loading="urlTesting">
              <el-icon><View /></el-icon>
              测试
            </el-button>
          </template>
        </NeonInput>
        
        <!-- URL 预览 -->
        <div v-if="form.url && urlValid" class="url-preview-mini">
          <el-alert type="success" :closable="false" show-icon>
            <template #title>
              <span style="font-weight: bold; font-size: 13px;">✅ 网址有效 - 保存后可以在右侧预览</span>
            </template>
          </el-alert>
        </div>
        <div v-else-if="form.url && !urlValid" class="url-preview-mini">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>
              <span style="font-weight: bold; font-size: 13px;">⚠️ 请输入有效的网址（需要包含 http:// 或 https://）</span>
            </template>
          </el-alert>
        </div>
      </el-form-item>

      <!-- 图片上传 -->
      <el-form-item
        v-if="form.type === 'image'"
        label="图片"
        prop="content"
      >
        <div class="image-upload-area">
          <!-- 预览图片 -->
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="预览" />
            <div class="image-overlay">
              <el-button
                type="danger"
                size="small"
                circle
                @click="clearImage"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <!-- 上传区域 -->
          <div v-else class="upload-placeholder" @click="selectImage">
            <el-icon class="upload-icon"><Plus /></el-icon>
            <p>点击选择图片</p>
            <p class="upload-hint">支持 JPG、PNG、GIF 格式</p>
          </div>

          <input
            ref="imageInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleImageSelect"
          />
        </div>
      </el-form-item>

      <!-- 描述 -->
      <el-form-item label="描述（可选）">
        <NeonTextarea
          v-model="form.description"
          placeholder="添加简短描述"
          :rows="3"
          :maxlength="200"
          show-word-limit
        />
      </el-form-item>

      <!-- 标签 -->
      <el-form-item label="标签">
        <div class="tag-selector">
          <el-tag
            v-for="tag in knowledgeStore.tags"
            :key="tag.id"
            :color="tag.color"
            :effect="form.tags.includes(tag.id) ? 'dark' : 'plain'"
            class="tag-item"
            @click="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </el-form-item>

      <!-- 选项 -->
      <el-form-item label="选项">
        <el-checkbox v-model="form.isPinned">钉选</el-checkbox>
        <el-checkbox v-model="form.isFavorite">收藏</el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <NeonButton variant="outline" @click="handleClose">取消</NeonButton>
        <NeonButton type="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? '保存' : '创建' }}
        </NeonButton>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge'
import type { KnowledgeItem, KnowledgeItemType } from '@/types/knowledge'
import type { FormInstance, FormRules } from 'element-plus'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'
import NeonButton from '@/components/NeonButton.vue'
import MarkdownToolbar from './MarkdownToolbar.vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { Plus, Delete, Link, View, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: boolean
  item?: KnowledgeItem
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const knowledgeStore = useKnowledgeStore()

// 表单
const formRef = ref<FormInstance>()
const textareaRef = ref()
const form = ref({
  type: 'text' as KnowledgeItemType,
  title: '',
  content: '',
  url: '',
  categoryId: '',
  tags: [] as string[],
  description: '',
  isPinned: false,
  isFavorite: false,
  mdFilePath: '',  // MD文件相对路径
  mdFileName: '',  // MD文件名
})

// 图片
const imageInput = ref<HTMLInputElement>()
const imagePreview = ref('')
const imageFile = ref<File>()

// URL
const urlValid = ref(false)
const urlTesting = ref(false)

// 状态
const saving = ref(false)
const showPreview = ref(false)
const isEdit = computed(() => !!props.item)

// 表单规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 100, message: '标题长度 1-100 字符', trigger: 'blur' },
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' },
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' },
  ],
  content: [
    { required: true, message: '请输入内容或选择图片', trigger: 'blur' },
  ],
}

// 可见性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 监听 item 变化，初始化表单
watch(
  () => props.item,
  (item) => {
    if (item) {
      // 先清空特定类型的状态
      imagePreview.value = ''
      imageFile.value = undefined
      urlValid.value = false
      showPreview.value = false
      
      // 初始化表单
      form.value = {
        type: item.type,
        title: item.title,
        content: item.content,
        url: item.url || item.content || '',
        categoryId: item.categoryId,
        tags: [...item.tags],
        description: item.description || '',
        isPinned: item.isPinned,
        isFavorite: item.isFavorite,
        mdFilePath: item.mdFilePath || '',
        mdFileName: item.mdFilePath ? item.mdFilePath.split('/').pop() || '' : '',
      }

      // 如果是图片类型，设置预览
      if (item.type === 'image') {
        imagePreview.value = knowledgeStore.getImagePath(item.content)
      }
      
      // 如果是URL类型，验证URL
      if (item.type === 'url' && item.url) {
        urlValid.value = validateUrl(item.url)
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 重置表单
function resetForm() {
  form.value = {
    type: 'text',
    title: '',
    content: '',
    url: '',
    categoryId: knowledgeStore.categories[0]?.id || '',
    tags: [],
    description: '',
    isPinned: false,
    isFavorite: false,
    mdFilePath: '',
    mdFileName: '',
  }
  imagePreview.value = ''
  imageFile.value = undefined
  urlValid.value = false
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

// 选择图片
function selectImage() {
  imageInput.value?.click()
}

// 处理图片选择
async function handleImageSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }

  // 验证文件大小（最大 10MB）
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 10MB')
    return
  }

  imageFile.value = file

  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // 重置文件输入
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// 清除图片
function clearImage() {
  imagePreview.value = ''
  imageFile.value = undefined
  form.value.content = ''
}

// 导入MD文件
async function handleImportMdFile() {
  try {
    const electronAPI = (window as any).electronAPI
    if (!electronAPI || !electronAPI.knowledge_selectMdFile) {
      ElMessage.error('当前环境不支持文件选择功能')
      return
    }
    
    const result = await electronAPI.knowledge_selectMdFile()
    
    if (!result.success) {
      if (!result.canceled) {
        ElMessage.error('导入失败：' + (result.error || '未知错误'))
      }
      return
    }
    
    // 更新表单内容
    form.value.content = result.data.content
    form.value.mdFileName = result.data.fileName
    
    // 提示文件名
    ElMessage.success({
      message: `已导入：${result.data.fileName}`,
      duration: 2000
    })
    
    console.log('✓ MD文件已导入:', result.data.fileName)
  } catch (error) {
    console.error('导入MD文件失败:', error)
    ElMessage.error('导入失败')
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
  
  // URL类型验证
  if (form.value.type === 'url' && form.value.url && !validateUrl(form.value.url)) {
    ElMessage.error('请输入有效的网址')
    return
  }

  saving.value = true

  try {
    // 如果是图片类型且有新文件，先上传
    if (form.value.type === 'image' && imageFile.value) {
      const relativePath = await knowledgeStore.uploadImage(imageFile.value)
      form.value.content = relativePath
    }
    
    // 如果是URL类型，使用URL作为content
    if (form.value.type === 'url') {
      form.value.content = form.value.url
    }
    
    // 如果是文本类型且有内容，保存到MD文件
    let mdFilePath = form.value.mdFilePath
    if (form.value.type === 'text' && form.value.content) {
      const electronAPI = (window as any).electronAPI
      if (electronAPI && electronAPI.knowledge_saveMdFile) {
        try {
          const result = await electronAPI.knowledge_saveMdFile(
            form.value.content,
            form.value.mdFileName || undefined,
            form.value.mdFilePath || undefined
          )
          
          if (result.success) {
            mdFilePath = result.relativePath
            console.log('✓ MD文件已保存:', mdFilePath)
          }
        } catch (error) {
          console.error('保存MD文件失败:', error)
          // 不阻止知识条目的保存
        }
      }
    }

    // 保存或更新知识条目
    if (isEdit.value && props.item) {
      await knowledgeStore.updateItem(props.item.id, {
        title: form.value.title,
        content: form.value.content,
        categoryId: form.value.categoryId,
        tags: form.value.tags,
        description: form.value.description,
        isPinned: form.value.isPinned,
        isFavorite: form.value.isFavorite,
        url: form.value.type === 'url' ? form.value.url : undefined,
        mdFilePath: form.value.type === 'text' ? mdFilePath : undefined,
      })
    } else {
      await knowledgeStore.addItem({
        type: form.value.type,
        title: form.value.title,
        content: form.value.content,
        categoryId: form.value.categoryId,
        tags: form.value.tags,
        description: form.value.description,
        isPinned: form.value.isPinned,
        isFavorite: form.value.isFavorite,
        url: form.value.type === 'url' ? form.value.url : undefined,
        mdFilePath: form.value.type === 'text' ? mdFilePath : undefined,
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

// 验证URL格式
function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

// URL输入框失焦时验证
function handleUrlBlur() {
  if (form.value.url) {
    urlValid.value = validateUrl(form.value.url)
  } else {
    urlValid.value = false
  }
}

// 测试URL
async function testUrl() {
  if (!form.value.url) {
    ElMessage.warning('请先输入网址')
    return
  }
  
  if (!validateUrl(form.value.url)) {
    ElMessage.error('网址格式不正确')
    return
  }
  
  urlTesting.value = true
  
  try {
    // 在外部浏览器打开测试
    const electronAPI = (window as any).electronAPI
    if (electronAPI && electronAPI.openExternal) {
      electronAPI.openExternal(form.value.url)
      ElMessage.success('已在浏览器中打开')
    } else {
      window.open(form.value.url, '_blank')
      ElMessage.success('已在新窗口中打开')
    }
    urlValid.value = true
  } catch (error) {
    ElMessage.error('无法打开网址')
    urlValid.value = false
  } finally {
    urlTesting.value = false
  }
}

// 关闭
function handleClose() {
  visible.value = false
  showPreview.value = false
  nextTick(() => {
    resetForm()
  })
}

// 插入 Markdown 标记
function handleInsertMarkdown(before: string, after: string) {
  const textarea = textareaRef.value?.$el?.querySelector('textarea')
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.value.content.substring(start, end)
  
  // 插入文本
  const newText = form.value.content.substring(0, start) + before + selectedText + after + form.value.content.substring(end)
  form.value.content = newText
  
  // 设置光标位置
  nextTick(() => {
    const newCursorPos = start + before.length + selectedText.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    textarea.focus()
  })
}
</script>

<style scoped>
.category-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* URL 預覽 */
.url-preview-mini {
  margin-top: 12px;
}

.url-preview-mini :deep(.el-alert) {
  background: rgba(33, 230, 255, 0.1);
  border: 1px solid rgba(33, 230, 255, 0.3);
}

.url-preview-mini :deep(.el-alert--success) {
  background: rgba(208, 255, 0, 0.1);
  border-color: rgba(208, 255, 0, 0.3);
}

.url-preview-mini :deep(.el-alert--warning) {
  background: rgba(255, 230, 0, 0.1);
  border-color: rgba(255, 230, 0, 0.3);
}

/* 圖片上傳 */
.image-upload-area {
  width: 100%;
  min-height: 240px;
}

.image-preview {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(33, 230, 255, 0.3);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: rgba(0, 0, 0, 0.3);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  background: rgba(255, 255, 255, 0.02);
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.upload-placeholder:hover {
  border-color: var(--neon-cyan);
  background: rgba(33, 230, 255, 0.05);
  box-shadow: 0 0 20px rgba(33, 230, 255, 0.2);
}

.upload-icon {
  font-size: 48px;
  color: var(--color-muted);
  margin-bottom: 12px;
}

.upload-placeholder p {
  margin: 4px 0;
  color: var(--color-text);
  font-size: 14px;
}

.upload-hint {
  font-size: 12px !important;
  color: var(--color-muted) !important;
}

/* 標籤選擇器 */
.tag-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.tag-item:hover {
  transform: scale(1.05);
  box-shadow: 0 0 12px currentColor;
}

/* 對話框樣式 */
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
  padding: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 内容编辑器 */
.content-editor {
  width: 100%;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.toolbar-row .el-button {
  flex-shrink: 0;
}

.editor-container {
  display: flex;
  gap: 16px;
}

.editor-container.split-view .editor-area {
  flex: 1;
}

.editor-area {
  flex: 1;
  min-width: 0;
}

.preview-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 2px solid rgba(138, 164, 199, 0.3);
  border-radius: 8px;
  background: rgba(14, 21, 48, 0.5);
  max-height: 400px;
}

.preview-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(138, 164, 199, 0.2);
  font-size: 13px;
  font-weight: 600;
  color: var(--neon-cyan);
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.preview-content::-webkit-scrollbar {
  width: 6px;
}

.preview-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.preview-content::-webkit-scrollbar-thumb {
  background: rgba(33, 230, 255, 0.3);
  border-radius: 3px;
}

.preview-content::-webkit-scrollbar-thumb:hover {
  background: rgba(33, 230, 255, 0.5);
}
</style>

