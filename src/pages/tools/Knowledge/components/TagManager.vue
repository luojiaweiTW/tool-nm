<template>
  <el-dialog
    v-model="visible"
    title="管理标签"
    width="560px"
    class="tag-manager-dialog"
  >
    <div class="tag-manager">
      <!-- 添加标签 -->
      <el-form inline>
        <el-form-item>
          <NeonInput
            v-model="newTag.name"
            placeholder="标签名称"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-color-picker v-model="newTag.color" />
        </el-form-item>
        <el-form-item>
          <NeonButton type="primary" @click="addTag">
            <el-icon><Plus /></el-icon>
            添加
          </NeonButton>
        </el-form-item>
      </el-form>

      <!-- 标签列表 -->
      <div class="tag-list">
        <div
          v-for="tag in knowledgeStore.tags"
          :key="tag.id"
          class="tag-item-row"
        >
          <el-tag :color="tag.color" effect="dark" size="large">
            {{ tag.name }}
          </el-tag>
          <el-tag size="small">
            {{ knowledgeStore.stats.byTag[tag.id] || 0 }} 条
          </el-tag>
          <el-button
            type="danger"
            size="small"
            text
            @click="deleteTag(tag.id)"
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

// 新标签
const newTag = ref({
  name: '',
  color: '#21e6ff',
})

// 添加标签
async function addTag() {
  if (!newTag.value.name.trim()) return

  await knowledgeStore.addTag({
    name: newTag.value.name,
    color: newTag.value.color,
  })

  newTag.value = {
    name: '',
    color: '#21e6ff',
  }
}

// 删除标签
async function deleteTag(id: string) {
  await knowledgeStore.deleteTag(id)
}
</script>

<style scoped>
.tag-manager {
  padding: 12px 0;
}

.tag-list {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.tag-item-row > :first-child {
  flex: 1;
}
</style>

