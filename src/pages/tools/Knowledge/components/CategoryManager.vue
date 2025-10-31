<template>
  <el-dialog
    v-model="visible"
    title="管理分类"
    width="560px"
    class="category-manager-dialog"
  >
    <div class="category-manager">
      <!-- 添加分类 -->
      <el-form inline>
        <el-form-item>
          <NeonInput
            v-model="newCategory.name"
            placeholder="分类名称"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="newCategory.icon" placeholder="图标">
            <el-option
              v-for="icon in availableIcons"
              :key="icon"
              :label="icon"
              :value="icon"
            >
              <el-icon><component :is="icon" /></el-icon>
              {{ icon }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-color-picker v-model="newCategory.color" />
        </el-form-item>
        <el-form-item>
          <NeonButton type="primary" @click="addCategory">
            <el-icon><Plus /></el-icon>
            添加
          </NeonButton>
        </el-form-item>
      </el-form>

      <!-- 分类列表 -->
      <div class="category-list">
        <div
          v-for="cat in knowledgeStore.categories"
          :key="cat.id"
          class="category-item"
        >
          <el-icon :style="{ color: cat.color }">
            <component :is="cat.icon" />
          </el-icon>
          <span class="category-name">{{ cat.name }}</span>
          <el-tag size="small">
            {{ knowledgeStore.stats.byCategory[cat.id] || 0 }} 条
          </el-tag>
          <el-button
            type="danger"
            size="small"
            text
            @click="deleteCategory(cat.id)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useKnowledgeStore } from '@/stores/knowledge'
import NeonInput from '@/components/NeonInput.vue'
import NeonButton from '@/components/NeonButton.vue'
import { Plus, Delete } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const knowledgeStore = useKnowledgeStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 新分类
const newCategory = ref({
  name: '',
  icon: 'Document',
  color: '#21e6ff',
})

// 可用图标
const availableIcons = [
  'Document',
  'Folder',
  'Brush',
  'Edit',
  'FolderOpened',
  'Files',
  'Notebook',
  'Reading',
  'Collection',
  'Box',
]

// 添加分类
async function addCategory() {
  if (!newCategory.value.name.trim()) return

  await knowledgeStore.addCategory({
    name: newCategory.value.name,
    icon: newCategory.value.icon,
    color: newCategory.value.color,
  })

  newCategory.value = {
    name: '',
    icon: 'Document',
    color: '#21e6ff',
  }
}

// 删除分类
async function deleteCategory(id: string) {
  await knowledgeStore.deleteCategory(id)
}
</script>

<style scoped>
.category-manager {
  padding: 12px 0;
}

.category-list {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.category-name {
  flex: 1;
  color: var(--color-text);
}
</style>

