<template>
  <div class="tool-page">
    <Header
      title="UUID 生成器"
      description="生成 UUID/GUID，支持 v1、v4 版本"
      icon="i-mdi-identifier"
    >
      <template #actions>
        <NeonButton variant="outline" size="small" @click="handleClearAll">
          <i class="i-mdi-broom" />
          清空列表
        </NeonButton>
        <NeonButton variant="success" size="small" @click="handleCopyAll">
          <i class="i-mdi-content-copy-multiple" />
          复制全部
        </NeonButton>
      </template>
    </Header>

    <div class="tool-page__content">
      <div class="uuid-generator">
        <!-- 生成控制 -->
        <NeonCard title="生成选项" icon="i-mdi-cog" compact>
          <div class="generate-controls">
            <div class="control-group">
              <label class="control-label">UUID 版本</label>
              <el-radio-group v-model="version" size="large">
                <el-radio-button value="v4">
                  <i class="i-mdi-dice-4" />
                  v4（随机）
                </el-radio-button>
                <el-radio-button value="v1">
                  <i class="i-mdi-clock-outline" />
                  v1（时间戳）
                </el-radio-button>
              </el-radio-group>
            </div>

            <div class="control-group">
              <label class="control-label">格式选项</label>
              <div class="format-options">
                <el-checkbox v-model="uppercase" label="大写" />
                <el-checkbox v-model="withBraces" label="带大括号 {}" />
                <el-checkbox v-model="withoutDashes" label="移除连字符" />
              </div>
            </div>

            <div class="control-group">
              <label class="control-label">批量生成</label>
              <div class="batch-controls">
                <NeonInput
                  v-model="batchCount"
                  type="number"
                  placeholder="数量（1-100）"
                  style="flex: 1;"
                />
                <NeonButton variant="primary" @click="handleGenerate">
                  <i class="i-mdi-auto-fix" />
                  生成
                </NeonButton>
              </div>
            </div>

            <div class="quick-actions">
              <NeonButton variant="success" style="width: 100%;" @click="handleGenerateOne">
                <i class="i-mdi-plus-circle" />
                生成单个 UUID
              </NeonButton>
            </div>
          </div>
        </NeonCard>

        <!-- UUID 列表 -->
        <NeonCard title="生成结果" compact>
          <template #extra>
            <span class="result-count">
              已生成：<strong>{{ uuidList.length }}</strong> 个
            </span>
          </template>

          <div v-if="uuidList.length === 0" class="empty-result">
            <i class="i-mdi-identifier empty-result-icon" />
            <p>点击"生成"按钮创建 UUID</p>
            <p class="hint">支持批量生成，最多100个</p>
          </div>
          <div v-else class="uuid-list">
            <div
              v-for="(uuid, index) in uuidList"
              :key="index"
              class="uuid-item"
              @click="copyUUID(uuid)"
            >
              <span class="uuid-index">{{ index + 1 }}</span>
              <code class="uuid-value mono">{{ formatUUID(uuid) }}</code>
              <i class="i-mdi-content-copy uuid-copy-icon" />
            </div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/Header.vue'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'

type Version = 'v1' | 'v4'

const version = ref<Version>('v4')
const uppercase = ref(false)
const withBraces = ref(false)
const withoutDashes = ref(false)
const batchCount = ref('1')
const uuidList = ref<string[]>([])

/**
 * 生成 UUID v4（随机）
 */
const generateUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 生成 UUID v1（基于时间戳）
 */
const generateUUIDv1 = (): string => {
  const timestamp = Date.now()
  const timeHex = timestamp.toString(16).padStart(12, '0')
  const random = Math.random().toString(16).substring(2, 14)
  
  return `${timeHex.substring(0, 8)}-${timeHex.substring(8, 12)}-1${random.substring(0, 3)}-${random.substring(3, 7)}-${random.substring(7, 19)}`
}

/**
 * 格式化 UUID
 */
const formatUUID = (uuid: string): string => {
  let formatted = uuid

  if (withoutDashes.value) {
    formatted = formatted.replace(/-/g, '')
  }

  if (uppercase.value) {
    formatted = formatted.toUpperCase()
  } else {
    formatted = formatted.toLowerCase()
  }

  if (withBraces.value) {
    formatted = `{${formatted}}`
  }

  return formatted
}

/**
 * 生成 UUID
 */
const handleGenerate = () => {
  const count = parseInt(batchCount.value)
  
  if (isNaN(count) || count < 1 || count > 100) {
    ElMessage.warning('请输入1-100之间的数字')
    return
  }

  const newUUIDs: string[] = []
  for (let i = 0; i < count; i++) {
    const uuid = version.value === 'v4' ? generateUUIDv4() : generateUUIDv1()
    newUUIDs.push(uuid)
  }

  uuidList.value = [...newUUIDs, ...uuidList.value]
  ElMessage.success(`已生成 ${count} 个 UUID`)
}

/**
 * 生成单个 UUID
 */
const handleGenerateOne = () => {
  const uuid = version.value === 'v4' ? generateUUIDv4() : generateUUIDv1()
  uuidList.value.unshift(uuid)
  ElMessage.success('UUID 已生成')
}

/**
 * 复制单个 UUID
 */
const copyUUID = (uuid: string) => {
  const formatted = formatUUID(uuid)
  navigator.clipboard.writeText(formatted).then(() => {
    ElMessage.success('UUID 已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

/**
 * 复制所有 UUID
 */
const handleCopyAll = () => {
  if (uuidList.value.length === 0) {
    ElMessage.warning('没有可复制的 UUID')
    return
  }

  const formatted = uuidList.value.map(uuid => formatUUID(uuid)).join('\n')
  navigator.clipboard.writeText(formatted).then(() => {
    ElMessage.success(`已复制 ${uuidList.value.length} 个 UUID 到剪贴板`)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

/**
 * 清空列表
 */
const handleClearAll = () => {
  uuidList.value = []
  ElMessage.success('已清空列表')
}
</script>

<style scoped>
.tool-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tool-page__content {
  flex: 1;
  overflow: auto;
  padding: var(--spacing-xl);
}

.uuid-generator {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--spacing-xl);
  max-width: 1400px;
}

.generate-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.control-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background-color: rgba(10, 14, 39, 0.4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.batch-controls {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.quick-actions {
  padding-top: var(--spacing-md);
  border-top: var(--border-width-thin) solid var(--color-border);
}

.result-count {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.result-count strong {
  color: var(--neon-lime);
  font-size: var(--font-size-base);
}

.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-2xl) * 2;
  text-align: center;
  color: var(--color-muted);
}

.empty-result-icon {
  font-size: 4em;
  color: var(--neon-lime);
  opacity: 0.6;
}

.empty-result .hint {
  font-size: var(--font-size-sm);
  opacity: 0.7;
}

.uuid-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 600px;
  overflow-y: auto;
}

.uuid-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: rgba(10, 14, 39, 0.4);
  border: 2px solid var(--neon-lime);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base) var(--transition-timing);
}

.uuid-item:hover {
  background-color: rgba(208, 255, 0, 0.1);
  border-color: var(--neon-lime-light);
  box-shadow: var(--glow-lime);
  transform: translateX(4px);
}

.uuid-index {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--neon-lime);
  background-color: rgba(208, 255, 0, 0.1);
  border: 1px solid var(--neon-lime);
  border-radius: 50%;
}

.uuid-value {
  flex: 1;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-base);
  color: var(--neon-lime);
  background: none;
  border: none;
  padding: 0;
}

.uuid-copy-icon {
  flex-shrink: 0;
  font-size: 1.2em;
  color: var(--color-muted);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.uuid-item:hover .uuid-copy-icon {
  opacity: 1;
  color: var(--neon-lime);
}

@media (max-width: 1024px) {
  .uuid-generator {
    grid-template-columns: 1fr;
  }
}
</style>

