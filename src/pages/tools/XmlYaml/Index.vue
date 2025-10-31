<template>
  <div class="tool-xml">
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">XML/YAML 转换</h1>
        <p class="tool-header__description">XML、YAML、JSON 三种格式互相转换</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="convert" type="primary" :disabled="!input">
          <i class="i-mdi-swap-horizontal mr-2" />
          转换
        </NeonButton>
      </div>
    </div>

    <div class="tool-content">
      <div class="tool-layout">
        <NeonCard title="📝 输入">
          <div class="form-group">
            <label class="form-label">输入格式</label>
            <el-select v-model="inputFormat">
              <el-option label="JSON" value="json" />
              <el-option label="XML" value="xml" />
              <el-option label="YAML" value="yaml" />
            </el-select>
          </div>
          <NeonTextarea v-model="input" :rows="18" placeholder="输入内容..." />
        </NeonCard>

        <NeonCard title="✨ 输出">
          <template #extra>
            <NeonButton size="small" @click="copyOutput" :disabled="!output">
              <i class="i-mdi-content-copy mr-1" />
              复制
            </NeonButton>
          </template>
          <div class="form-group">
            <label class="form-label">输出格式</label>
            <el-select v-model="outputFormat">
              <el-option label="JSON" value="json" />
              <el-option label="XML" value="xml" />
              <el-option label="YAML" value="yaml" />
            </el-select>
          </div>
          <div class="output-area">
            <div v-if="error" class="error-message">
              <i class="i-mdi-alert-circle mr-2" />
              {{ error }}
            </div>
            <pre v-else-if="output" class="output-text">{{ output }}</pre>
            <div v-else class="output-placeholder">转换结果将显示在这里</div>
          </div>
        </NeonCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as yaml from 'js-yaml'
import { xml2json, json2xml } from 'xml-js'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

const input = ref('')
const output = ref('')
const error = ref('')
const inputFormat = ref('json')
const outputFormat = ref('xml')

function convert() {
  error.value = ''
  output.value = ''
  
  if (!input.value) return
  
  try {
    let data: any
    
    // 解析输入
    if (inputFormat.value === 'json') {
      data = JSON.parse(input.value)
    } else if (inputFormat.value === 'xml') {
      const jsonStr = xml2json(input.value, { compact: true, spaces: 2 })
      data = JSON.parse(jsonStr)
    } else {
      data = yaml.load(input.value)
    }
    
    // 格式化输出
    if (outputFormat.value === 'json') {
      output.value = JSON.stringify(data, null, 2)
    } else if (outputFormat.value === 'xml') {
      const jsonStr = JSON.stringify(data)
      output.value = json2xml(jsonStr, { compact: true, spaces: 2 })
    } else {
      output.value = yaml.dump(data, { indent: 2 })
    }
    
    ElMessage.success('转换成功')
  } catch (e: any) {
    error.value = e.message || '转换失败'
    ElMessage.error(error.value)
  }
}

async function copyOutput() {
  try {
    await navigator.clipboard.writeText(output.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

function clearAll() {
  input.value = ''
  output.value = ''
  error.value = ''
}
</script>

<style scoped>
.tool-xml {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--color-panel);
  border: 2px solid var(--neon-yellow);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(255, 230, 0, 0.4);
}

.tool-header__info {
  flex: 1;
}

.tool-header__title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
  font-family: var(--font-family-display);
}

.tool-header__description {
  font-size: var(--font-size-base);
  color: var(--color-muted);
}

.tool-header__actions {
  display: flex;
  gap: var(--spacing-md);
}

.tool-content {
  flex: 1;
  overflow: hidden;
  padding: 0 var(--spacing-lg) var(--spacing-lg);
}

.tool-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  height: 100%;
}

.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.output-area {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.output-text {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-yellow);
  line-height: 1.6;
  white-space: pre;
}

.output-placeholder {
  color: var(--color-text-disabled);
  font-size: var(--font-size-sm);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-4xl) 0;
}

.error-message {
  padding: var(--spacing-md);
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}
</style>
