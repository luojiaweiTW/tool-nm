<template>
  <div class="tool-sql">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">SQL 格式化</h1>
        <p class="tool-header__description">SQL 语句格式化、压缩、美化，支持多种数据库</p>
      </div>
      <div class="tool-header__actions">
        <NeonButton @click="clearAll" type="outline">
          <i class="i-mdi-delete-outline mr-2" />
          清空
        </NeonButton>
        <NeonButton @click="handleExample" type="primary">
          <i class="i-mdi-lightbulb-outline mr-2" />
          示例
        </NeonButton>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="tool-content">
      <div class="tool-layout">
        <!-- 左侧：配置 -->
        <div class="tool-panel">
          <NeonCard title="⚙️ 格式化选项">
            <!-- 操作模式 -->
            <div class="form-group">
              <label class="form-label">操作模式</label>
              <el-radio-group v-model="operation" size="large">
                <el-radio value="format" label="format">美化</el-radio>
                <el-radio value="compress" label="compress">压缩</el-radio>
              </el-radio-group>
            </div>

            <!-- 数据库类型 -->
            <div class="form-group">
              <label class="form-label">数据库类型</label>
              <el-select v-model="language" size="large" style="width: 100%">
                <el-option label="标准 SQL" value="sql" />
                <el-option label="MySQL" value="mysql" />
                <el-option label="PostgreSQL" value="postgresql" />
                <el-option label="MariaDB" value="mariadb" />
                <el-option label="PL/SQL" value="plsql" />
                <el-option label="T-SQL" value="tsql" />
              </el-select>
            </div>

            <!-- 缩进 -->
            <div class="form-group" v-if="operation === 'format'">
              <label class="form-label">缩进</label>
              <el-select v-model="indent" size="large" style="width: 100%">
                <el-option label="2 空格" value="  " />
                <el-option label="4 空格" value="    " />
                <el-option label="Tab" value="\t" />
              </el-select>
            </div>

            <!-- 关键字大小写 -->
            <div class="form-group" v-if="operation === 'format'">
              <label class="form-label">关键字</label>
              <el-select v-model="keywordCase" size="large" style="width: 100%">
                <el-option label="大写" value="upper" />
                <el-option label="小写" value="lower" />
                <el-option label="保持原样" value="preserve" />
              </el-select>
            </div>

            <!-- 执行按钮 -->
            <div class="form-actions">
              <NeonButton
                @click="formatSQL"
                type="primary"
                :disabled="!sqlInput"
                style="width: 100%"
              >
                <i class="i-mdi-auto-fix mr-2" />
                {{ operation === 'format' ? '格式化' : '压缩' }}
              </NeonButton>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：输入输出 -->
        <div class="tool-main">
          <!-- SQL 输入 -->
          <NeonCard title="📝 SQL 输入">
            <template #extra>
              <span class="char-count">{{ sqlInput.length }} 字符</span>
            </template>
            <div class="textarea-wrapper">
              <NeonTextarea
                v-model="sqlInput"
                placeholder="粘贴 SQL 语句到这里..."
                :rows="18"
              />
            </div>
          </NeonCard>

          <!-- SQL 输出 -->
          <NeonCard title="✨ 格式化结果">
            <template #extra>
              <div class="output-actions">
                <span class="char-count">{{ sqlOutput.length }} 字符 / {{ sqlOutput.split('\n').length }} 行</span>
                <NeonButton
                  size="small"
                  @click="copyOutput"
                  :disabled="!sqlOutput"
                >
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
              </div>
            </template>
            <div class="code-display">
              <div v-if="error" class="error-message">
                <i class="i-mdi-alert-circle mr-2" />
                {{ error }}
              </div>
              <pre v-else-if="sqlOutput" class="sql-code">{{ sqlOutput }}</pre>
              <div v-else class="code-placeholder">
                格式化后的 SQL 将显示在这里
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
import { format } from 'sql-formatter'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

// 配置
const operation = ref<'format' | 'compress'>('format')
const language = ref('sql')
const indent = ref('  ')
const keywordCase = ref<'upper' | 'lower' | 'preserve'>('upper')

// 输入输出
const sqlInput = ref('')
const sqlOutput = ref('')
const error = ref('')

// 示例 SQL
const exampleSQL = `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_amount FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND o.created_at >= '2024-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY total_amount DESC LIMIT 10;`

// 加载示例
function handleExample() {
  sqlInput.value = exampleSQL
  ElMessage.info('已加载示例 SQL')
}

// 格式化 SQL
function formatSQL() {
  error.value = ''
  sqlOutput.value = ''

  if (!sqlInput.value.trim()) {
    error.value = '请输入 SQL 语句'
    return
  }

  try {
    if (operation.value === 'format') {
      // 格式化
      sqlOutput.value = format(sqlInput.value, {
        language: language.value as any,
        tabWidth: indent.value === '\t' ? 4 : indent.value.length,
        keywordCase: keywordCase.value,
        linesBetweenQueries: 2,
      })
      ElMessage.success('SQL 格式化成功')
    } else {
      // 压缩：移除多余空格和换行
      sqlOutput.value = sqlInput.value
        .replace(/\s+/g, ' ')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')')
        .replace(/ ,/g, ',')
        .trim()
      ElMessage.success('SQL 压缩成功')
    }
  } catch (e: any) {
    error.value = e.message || 'SQL 格式化失败'
    ElMessage.error(error.value)
  }
}

// 复制输出
async function copyOutput() {
  try {
    await navigator.clipboard.writeText(sqlOutput.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  sqlInput.value = ''
  sqlOutput.value = ''
  error.value = ''
}
</script>

<style scoped>
.tool-sql {
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
  grid-template-columns: 300px 1fr;
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

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
}

.form-actions {
  margin-top: var(--spacing-xl);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-right: var(--spacing-md);
}

.output-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.code-display {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.sql-code {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-yellow);
  line-height: 1.6;
  white-space: pre;
  tab-size: 4;
}

.code-placeholder {
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

/* 🔧 固定高度确保滚动 */
.textarea-wrapper {
  height: 500px;
  overflow: hidden;
}

.textarea-wrapper :deep(textarea) {
  height: 100% !important;
  min-height: 500px !important;
}
</style>

