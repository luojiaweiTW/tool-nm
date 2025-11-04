<template>
  <div class="tool-exception">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">异常堆栈分析</h1>
        <p class="tool-header__description">Java 异常堆栈美化、高亮关键行、快速定位问题</p>
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
          <NeonCard title="⚙️ 分析选项">
            <!-- 包名过滤 -->
            <div class="form-group">
              <label class="form-label">业务包名（高亮显示）</label>
              <NeonInput
                v-model="packageFilter"
                placeholder="例如：com.example"
              />
              <div class="form-hint">只高亮显示匹配的业务代码行</div>
            </div>

            <!-- 过滤选项 -->
            <div class="form-group">
              <label class="form-label">过滤选项</label>
              <el-checkbox-group v-model="filterOptions">
                <el-checkbox value="hideFramework" label="hideFramework">隐藏框架代码</el-checkbox>
                <el-checkbox value="hideJDK" label="hideJDK">隐藏 JDK 代码</el-checkbox>
                <el-checkbox value="hideReflect" label="hideReflect">隐藏反射调用</el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 分析按钮 -->
            <div class="form-actions">
              <NeonButton
                @click="parseException"
                type="primary"
                :disabled="!stackInput"
                style="width: 100%"
              >
                <i class="i-mdi-bug-check mr-2" />
                分析堆栈
              </NeonButton>
            </div>
          </NeonCard>

          <!-- 分析结果摘要 -->
          <NeonCard v-if="summary" title="📊 分析摘要">
            <div class="summary-list">
              <div class="summary-item">
                <span class="summary-label">异常类型：</span>
                <span class="summary-value">{{ summary.exceptionType }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">异常消息：</span>
                <span class="summary-value">{{ summary.message }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">总行数：</span>
                <span class="summary-value">{{ summary.totalLines }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">业务代码：</span>
                <span class="summary-value highlight">{{ summary.businessLines }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">框架代码：</span>
                <span class="summary-value">{{ summary.frameworkLines }}</span>
              </div>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：输入输出 -->
        <div class="tool-main">
          <!-- 堆栈输入 -->
          <NeonCard title="📝 异常堆栈输入">
            <template #extra>
              <span class="char-count">{{ stackInput.split('\n').length }} 行</span>
            </template>
            <div class="textarea-wrapper">
              <NeonTextarea
                v-model="stackInput"
                placeholder="粘贴 Java 异常堆栈信息到这里..."
                :rows="15"
              />
            </div>
          </NeonCard>

          <!-- 分析结果 -->
          <NeonCard v-if="parsedStack.length > 0" title="🔍 美化结果">
            <template #extra>
              <div class="output-actions">
                <NeonButton size="small" @click="copyParsed">
                  <i class="i-mdi-content-copy mr-1" />
                  复制
                </NeonButton>
              </div>
            </template>
            <div class="stack-display">
              <div
                v-for="(line, index) in filteredStack"
                :key="index"
                class="stack-line"
                :class="line.type"
              >
                <span class="line-number">{{ index + 1 }}</span>
                <span class="line-icon">
                  <i v-if="line.type === 'business'" class="i-mdi-alert-circle" />
                  <i v-else-if="line.type === 'framework'" class="i-mdi-package-variant" />
                  <i v-else-if="line.type === 'exception'" class="i-mdi-alert-octagon" />
                </span>
                <span class="line-content">{{ line.content }}</span>
              </div>
            </div>
          </NeonCard>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <i class="i-mdi-bug empty-state__icon" />
            <p class="empty-state__text">粘贴 Java 异常堆栈信息</p>
            <p class="empty-state__hint">自动高亮业务代码，过滤框架代码</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import NeonCard from '@/components/NeonCard.vue'
import NeonButton from '@/components/NeonButton.vue'
import NeonInput from '@/components/NeonInput.vue'
import NeonTextarea from '@/components/NeonTextarea.vue'

interface StackLine {
  content: string
  type: 'exception' | 'business' | 'framework' | 'jdk' | 'reflect'
}

interface Summary {
  exceptionType: string
  message: string
  totalLines: number
  businessLines: number
  frameworkLines: number
}

const stackInput = ref('')
const parsedStack = ref<StackLine[]>([])
const packageFilter = ref('com.example')
const filterOptions = ref<string[]>([])
const summary = ref<Summary | null>(null)

// 框架包名前缀
const frameworkPackages = [
  'org.springframework',
  'org.apache',
  'org.hibernate',
  'org.mybatis',
  'com.alibaba',
  'io.netty',
  'javax.servlet',
  'org.eclipse',
  'org.junit',
  'org.slf4j',
  'ch.qos.logback'
]

// 示例异常
const exampleException = `java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null
    at com.example.service.UserService.processUser(UserService.java:45)
    at com.example.controller.UserController.getUser(UserController.java:28)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
    at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)
    at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
    at java.base/java.lang.reflect.Method.invoke(Method.java:568)
    at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)
    at org.springframework.web.method.support.InvocableHandlerMethod.invokeForRequest(InvocableHandlerMethod.java:150)
    at org.springframework.web.servlet.mvc.method.annotation.ServletInvocableHandlerMethod.invokeAndHandle(ServletInvocableHandlerMethod.java:117)
    at com.example.util.StringUtil.validate(StringUtil.java:12)
    at org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter.invokeHandlerMethod(RequestMappingHandlerAdapter.java:895)`

// 加载示例
function handleExample() {
  stackInput.value = exampleException
  packageFilter.value = 'com.example'
  ElMessage.info('已加载示例异常堆栈')
}

// 解析异常堆栈
function parseException() {
  if (!stackInput.value.trim()) {
    return
  }

  const lines = stackInput.value.split('\n')
  const result: StackLine[] = []
  let exceptionType = ''
  let message = ''
  let businessCount = 0
  let frameworkCount = 0

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) return

    let type: StackLine['type'] = 'framework'

    // 第一行通常是异常类型和消息
    if (index === 0 && trimmed.includes('Exception')) {
      type = 'exception'
      const parts = trimmed.split(':')
      exceptionType = parts[0].trim()
      message = parts.slice(1).join(':').trim()
    }
    // 匹配 at 开头的堆栈行
    else if (trimmed.startsWith('at ')) {
      // 检查是否是业务代码
      if (packageFilter.value && trimmed.includes(packageFilter.value)) {
        type = 'business'
        businessCount++
      }
      // 检查是否是 JDK 代码
      else if (trimmed.includes('java.base/') || trimmed.includes('jdk.internal')) {
        type = 'jdk'
      }
      // 检查是否是反射调用
      else if (trimmed.includes('reflect.') || trimmed.includes('Reflect')) {
        type = 'reflect'
      }
      // 检查是否是框架代码
      else if (frameworkPackages.some(pkg => trimmed.includes(pkg))) {
        type = 'framework'
        frameworkCount++
      }
      // 其他情况，检查是否包含包名
      else if (trimmed.match(/at\s+[a-z]+\.[a-z]+\./)) {
        type = 'framework'
        frameworkCount++
      }
    }

    result.push({
      content: line,
      type
    })
  })

  parsedStack.value = result

  // 生成摘要
  summary.value = {
    exceptionType: exceptionType || 'Unknown',
    message: message || '无消息',
    totalLines: result.length,
    businessLines: businessCount,
    frameworkLines: frameworkCount
  }

  ElMessage.success('堆栈分析完成')
}

// 过滤后的堆栈
const filteredStack = computed(() => {
  if (!parsedStack.value.length) return []

  return parsedStack.value.filter(line => {
    if (filterOptions.value.includes('hideFramework') && line.type === 'framework') return false
    if (filterOptions.value.includes('hideJDK') && line.type === 'jdk') return false
    if (filterOptions.value.includes('hideReflect') && line.type === 'reflect') return false
    return true
  })
})

// 复制结果
async function copyParsed() {
  try {
    const text = filteredStack.value.map(l => l.content).join('\n')
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  stackInput.value = ''
  parsedStack.value = []
  summary.value = null
}
</script>

<style scoped>
.tool-exception {
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
  border: 2px solid var(--neon-pink);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(255, 42, 161, 0.4);
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
  grid-template-columns: 320px 1fr;
  gap: var(--spacing-lg);
  height: 100%;
}

.tool-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
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

.form-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.form-actions {
  margin-top: var(--spacing-xl);
}

.char-count {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
}

.output-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  margin-bottom: var(--spacing-xs);
}

.summary-value {
  font-size: var(--font-size-sm);
  color: var(--color-text);
  font-weight: var(--font-weight-medium);
  word-break: break-all;
}

.summary-value.highlight {
  color: var(--neon-pink);
  font-size: var(--font-size-base);
}

.stack-display {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  /* 移除固定高度限制，使用flex自适应 */
  flex: 1;
  min-height: 0;
  overflow: auto;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: 1.8;
}

.stack-line {
  display: flex;
  align-items: flex-start;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.stack-line:hover {
  background: rgba(255, 255, 255, 0.02);
}

.stack-line.exception {
  background: rgba(255, 42, 161, 0.15);
  border-left: 3px solid var(--neon-pink);
  padding-left: calc(var(--spacing-sm) - 3px);
}

.stack-line.business {
  background: rgba(208, 255, 0, 0.1);
  border-left: 3px solid var(--neon-lime);
  padding-left: calc(var(--spacing-sm) - 3px);
}

.stack-line.framework {
  color: var(--color-muted);
  opacity: 0.7;
}

.stack-line.jdk {
  color: var(--color-text-disabled);
  opacity: 0.5;
}

.stack-line.reflect {
  color: var(--color-text-disabled);
  opacity: 0.5;
  font-style: italic;
}

.line-number {
  display: inline-block;
  min-width: 40px;
  text-align: right;
  color: var(--color-muted);
  margin-right: var(--spacing-md);
  flex-shrink: 0;
  user-select: none;
}

.line-icon {
  display: inline-block;
  width: 20px;
  margin-right: var(--spacing-sm);
  flex-shrink: 0;
}

.stack-line.exception .line-icon {
  color: var(--neon-pink);
}

.stack-line.business .line-icon {
  color: var(--neon-lime);
}

.stack-line.framework .line-icon,
.stack-line.jdk .line-icon,
.stack-line.reflect .line-icon {
  opacity: 0.3;
}

.line-content {
  flex: 1;
  word-break: break-all;
}

.stack-line.exception .line-content {
  color: var(--neon-pink);
  font-weight: var(--font-weight-bold);
}

.stack-line.business .line-content {
  color: var(--neon-lime);
  font-weight: var(--font-weight-semibold);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4xl);
  text-align: center;
}

.empty-state__icon {
  font-size: 4em;
  color: var(--neon-pink);
  opacity: 0.3;
  margin-bottom: var(--spacing-lg);
}

.empty-state__text {
  font-size: var(--font-size-lg);
  color: var(--color-muted);
  margin-bottom: var(--spacing-sm);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
}

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}

/* 🔧 固定高度确保滚动 */
.textarea-wrapper {
  height: 450px;
  overflow: hidden;
}

.textarea-wrapper :deep(textarea) {
  height: 100% !important;
  min-height: 450px !important;
}
</style>

