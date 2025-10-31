<template>
  <div class="tool-random">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">随机数据生成器</h1>
        <p class="tool-header__description">生成随机字符串、数字、姓名、手机号等测试数据</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <div class="tool-layout">
        <!-- 左侧：类型选择 -->
        <div class="tool-panel">
          <NeonCard title="📋 数据类型">
            <div class="type-list">
              <div
                v-for="type in dataTypes"
                :key="type.id"
                class="type-item"
                :class="{ active: selectedType === type.id }"
                @click="selectedType = type.id"
              >
                <i :class="type.icon" class="type-icon" />
                <div class="type-info">
                  <div class="type-name">{{ type.name }}</div>
                  <div class="type-desc">{{ type.desc }}</div>
                </div>
              </div>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：配置和结果 -->
        <div class="tool-main">
          <!-- 随机字符串 -->
          <NeonCard v-if="selectedType === 'string'" title="🔤 随机字符串">
            <div class="config-section">
              <div class="form-group">
                <label class="form-label">字符串长度</label>
                <el-input-number v-model="stringConfig.length" :min="1" :max="1000" />
              </div>

              <div class="form-group">
                <label class="form-label">包含字符</label>
                <el-checkbox-group v-model="stringConfig.includes">
                  <el-checkbox value="uppercase" label="uppercase">大写字母 (A-Z)</el-checkbox>
                  <el-checkbox value="lowercase" label="lowercase">小写字母 (a-z)</el-checkbox>
                  <el-checkbox value="numbers" label="numbers">数字 (0-9)</el-checkbox>
                  <el-checkbox value="symbols" label="symbols">特殊符号</el-checkbox>
                </el-checkbox-group>
              </div>

              <div class="form-group">
                <label class="form-label">生成数量</label>
                <el-input-number v-model="stringConfig.count" :min="1" :max="100" />
              </div>

              <NeonButton @click="generateString" type="primary" style="width: 100%">
                <i class="i-mdi-auto-fix mr-2" />
                生成
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 随机数字 -->
          <NeonCard v-if="selectedType === 'number'" title="🔢 随机数字">
            <div class="config-section">
              <div class="form-group">
                <label class="form-label">最小值</label>
                <el-input-number v-model="numberConfig.min" :max="numberConfig.max - 1" />
              </div>

              <div class="form-group">
                <label class="form-label">最大值</label>
                <el-input-number v-model="numberConfig.max" :min="numberConfig.min + 1" />
              </div>

              <div class="form-group">
                <label class="form-label">生成数量</label>
                <el-input-number v-model="numberConfig.count" :min="1" :max="100" />
              </div>

              <NeonButton @click="generateNumber" type="primary" style="width: 100%">
                <i class="i-mdi-auto-fix mr-2" />
                生成
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 中文姓名 -->
          <NeonCard v-if="selectedType === 'name'" title="👤 中文姓名">
            <div class="config-section">
              <div class="form-group">
                <label class="form-label">生成数量</label>
                <el-input-number v-model="nameConfig.count" :min="1" :max="100" />
              </div>

              <NeonButton @click="generateName" type="primary" style="width: 100%">
                <i class="i-mdi-auto-fix mr-2" />
                生成
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 手机号 -->
          <NeonCard v-if="selectedType === 'phone'" title="📱 手机号">
            <div class="config-section">
              <div class="form-group">
                <label class="form-label">生成数量</label>
                <el-input-number v-model="phoneConfig.count" :min="1" :max="100" />
              </div>

              <NeonButton @click="generatePhone" type="primary" style="width: 100%">
                <i class="i-mdi-auto-fix mr-2" />
                生成
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 邮箱地址 -->
          <NeonCard v-if="selectedType === 'email'" title="📧 邮箱地址">
            <div class="config-section">
              <div class="form-group">
                <label class="form-label">域名</label>
                <el-select v-model="emailConfig.domain" style="width: 100%">
                  <el-option label="@gmail.com" value="gmail.com" />
                  <el-option label="@qq.com" value="qq.com" />
                  <el-option label="@163.com" value="163.com" />
                  <el-option label="@example.com" value="example.com" />
                </el-select>
              </div>

              <div class="form-group">
                <label class="form-label">生成数量</label>
                <el-input-number v-model="emailConfig.count" :min="1" :max="100" />
              </div>

              <NeonButton @click="generateEmail" type="primary" style="width: 100%">
                <i class="i-mdi-auto-fix mr-2" />
                生成
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 结果显示 -->
          <NeonCard v-if="result.length > 0" title="✨ 生成结果">
            <template #extra>
              <div class="result-actions">
                <span class="result-count">共 {{ result.length }} 条</span>
                <NeonButton size="small" @click="copyResult">
                  <i class="i-mdi-content-copy mr-1" />
                  复制全部
                </NeonButton>
              </div>
            </template>
            <div class="result-display">
              <div v-for="(item, index) in result" :key="index" class="result-item">
                <span class="result-index">{{ index + 1 }}.</span>
                <span class="result-value">{{ item }}</span>
              </div>
            </div>
          </NeonCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'

// 数据类型
const dataTypes = [
  { id: 'string', name: '随机字符串', desc: '字母、数字、符号', icon: 'i-mdi-format-letter-case' },
  { id: 'number', name: '随机数字', desc: '指定范围的数字', icon: 'i-mdi-numeric' },
  { id: 'name', name: '中文姓名', desc: '真实的中文姓名', icon: 'i-mdi-account' },
  { id: 'phone', name: '手机号', desc: '中国大陆手机号', icon: 'i-mdi-phone' },
  { id: 'email', name: '邮箱地址', desc: '电子邮件地址', icon: 'i-mdi-email' },
]

const selectedType = ref('string')
const result = ref<string[]>([])

// 字符串配置
const stringConfig = ref({
  length: 16,
  includes: ['uppercase', 'lowercase', 'numbers'],
  count: 5
})

// 数字配置
const numberConfig = ref({
  min: 1,
  max: 100,
  count: 10
})

// 姓名配置
const nameConfig = ref({
  count: 10
})

// 手机号配置
const phoneConfig = ref({
  count: 10
})

// 邮箱配置
const emailConfig = ref({
  domain: 'gmail.com',
  count: 10
})

// 常用姓氏和名字
const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
const givenNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英']

// 生成随机字符串
function generateString() {
  const charSets: Record<string, string> = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }

  let charset = ''
  stringConfig.value.includes.forEach(type => {
    charset += charSets[type] || ''
  })

  if (!charset) {
    ElMessage.warning('请至少选择一种字符类型')
    return
  }

  result.value = []
  for (let i = 0; i < stringConfig.value.count; i++) {
    let str = ''
    for (let j = 0; j < stringConfig.value.length; j++) {
      str += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    result.value.push(str)
  }

  ElMessage.success(`已生成 ${result.value.length} 个随机字符串`)
}

// 生成随机数字
function generateNumber() {
  result.value = []
  for (let i = 0; i < numberConfig.value.count; i++) {
    const num = Math.floor(Math.random() * (numberConfig.value.max - numberConfig.value.min + 1)) + numberConfig.value.min
    result.value.push(num.toString())
  }
  ElMessage.success(`已生成 ${result.value.length} 个随机数字`)
}

// 生成随机姓名
function generateName() {
  result.value = []
  for (let i = 0; i < nameConfig.value.count; i++) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)]
    const given = givenNames[Math.floor(Math.random() * givenNames.length)]
    result.value.push(surname + given)
  }
  ElMessage.success(`已生成 ${result.value.length} 个姓名`)
}

// 生成随机手机号
function generatePhone() {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
  
  result.value = []
  for (let i = 0; i < phoneConfig.value.count; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    let phone = prefix
    for (let j = 0; j < 8; j++) {
      phone += Math.floor(Math.random() * 10)
    }
    result.value.push(phone)
  }
  ElMessage.success(`已生成 ${result.value.length} 个手机号`)
}

// 生成随机邮箱
function generateEmail() {
  result.value = []
  for (let i = 0; i < emailConfig.value.count; i++) {
    const username = generateRandomString(8, 'abcdefghijklmnopqrstuvwxyz0123456789')
    result.value.push(`${username}@${emailConfig.value.domain}`)
  }
  ElMessage.success(`已生成 ${result.value.length} 个邮箱`)
}

// 辅助函数：生成随机字符串
function generateRandomString(length: number, charset: string): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return result
}

// 复制结果
async function copyResult() {
  try {
    await navigator.clipboard.writeText(result.value.join('\n'))
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  result.value = []
}
</script>

<style scoped>
.tool-random {
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
  border: 2px solid var(--neon-purple);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(155, 92, 255, 0.4);
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
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
  height: 100%;
}

.tool-panel {
  overflow-y: auto;
}

.tool-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  overflow-y: auto;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.type-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
}

.type-item:hover {
  border-color: var(--neon-purple);
  background: rgba(155, 92, 255, 0.05);
}

.type-item.active {
  border-color: var(--neon-purple);
  background: rgba(155, 92, 255, 0.1);
  box-shadow: 0 0 12px rgba(155, 92, 255, 0.3);
}

.type-icon {
  font-size: 1.5em;
  color: var(--neon-purple);
}

.type-info {
  flex: 1;
}

.type-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-xs);
}

.type-desc {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.result-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.result-count {
  font-size: var(--font-size-sm);
  color: var(--color-muted);
}

.result-display {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  max-height: 500px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
}

.result-item:last-child {
  border-bottom: none;
}

.result-index {
  color: var(--color-muted);
  min-width: 40px;
  flex-shrink: 0;
}

.result-value {
  color: var(--neon-purple);
  word-break: break-all;
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}
</style>

