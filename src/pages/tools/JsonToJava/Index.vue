<template>
  <div class="tool-json2java">
    <!-- 顶部工具栏 -->
    <div class="tool-header">
      <div class="tool-header__info">
        <h1 class="tool-header__title">JSON 转 Java</h1>
        <p class="tool-header__description">从 JSON 快速生成 Java 实体类，支持 Lombok、Jackson 等</p>
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
          <NeonCard title="⚙️ 生成配置">
            <!-- 类名 -->
            <div class="form-group">
              <label class="form-label">类名</label>
              <NeonInput
                v-model="className"
                placeholder="例如：User"
              />
            </div>

            <!-- 包名 -->
            <div class="form-group">
              <label class="form-label">包名（可选）</label>
              <NeonInput
                v-model="packageName"
                placeholder="例如：com.example.model"
              />
            </div>

            <!-- 命名风格 -->
            <div class="form-group">
              <label class="form-label">命名风格</label>
              <el-select v-model="namingStyle" size="large" style="width: 100%">
                <el-option label="驼峰命名 (camelCase)" value="camel" />
                <el-option label="下划线 (snake_case)" value="snake" />
              </el-select>
            </div>

            <!-- 注解选项 -->
            <div class="form-group">
              <label class="form-label">使用 Lombok</label>
              <el-checkbox v-model="useLombok" size="large">启用 Lombok 注解</el-checkbox>
            </div>

            <div class="form-group" v-if="useLombok">
              <el-checkbox-group v-model="lombokAnnotations">
                <el-checkbox value="@Data" label="@Data">@Data</el-checkbox>
                <el-checkbox value="@Getter" label="@Getter">@Getter</el-checkbox>
                <el-checkbox value="@Setter" label="@Setter">@Setter</el-checkbox>
                <el-checkbox value="@NoArgsConstructor" label="@NoArgsConstructor">@NoArgsConstructor</el-checkbox>
                <el-checkbox value="@AllArgsConstructor" label="@AllArgsConstructor">@AllArgsConstructor</el-checkbox>
              </el-checkbox-group>
            </div>

            <!-- 序列化框架 -->
            <div class="form-group">
              <label class="form-label">序列化框架</label>
              <el-select v-model="serializationFramework" size="large" style="width: 100%">
                <el-option label="无" value="none" />
                <el-option label="Jackson" value="jackson" />
                <el-option label="Gson" value="gson" />
                <el-option label="Fastjson" value="fastjson" />
              </el-select>
            </div>

            <!-- 其他选项 -->
            <div class="form-group">
              <label class="form-label">其他选项</label>
              <el-checkbox v-model="useSerializable" size="large">实现 Serializable</el-checkbox>
            </div>

            <!-- 生成按钮 -->
            <div class="form-actions">
              <NeonButton
                @click="generateJava"
                type="primary"
                :disabled="!canGenerate"
                style="width: 100%"
              >
                <i class="i-mdi-code-braces mr-2" />
                生成 Java 类
              </NeonButton>
            </div>
          </NeonCard>
        </div>

        <!-- 右侧：输入输出 -->
        <div class="tool-main">
          <!-- JSON 输入 -->
          <NeonCard title="📝 JSON 输入">
            <template #extra>
              <span class="char-count">{{ jsonInput.length }} 字符</span>
            </template>
            <NeonTextarea
              v-model="jsonInput"
              placeholder='请输入 JSON 数据，例如：&#10;{&#10;  "name": "张三",&#10;  "age": 25,&#10;  "email": "zhangsan@example.com"&#10;}'
              :rows="15"
            />
            <div v-if="error" class="error-message">
              <i class="i-mdi-alert-circle mr-2" />
              {{ error }}
            </div>
          </NeonCard>

          <!-- Java 输出 -->
          <NeonCard title="☕ Java 代码">
            <template #extra>
              <div class="output-actions">
                <span class="char-count">{{ javaCode.split('\n').length }} 行</span>
                <NeonButton
                  size="small"
                  @click="copyCode"
                  :disabled="!javaCode"
                >
                  <i class="i-mdi-content-copy mr-1" />
                  复制代码
                </NeonButton>
              </div>
            </template>
            <div class="code-display">
              <pre v-if="javaCode" class="java-code">{{ javaCode }}</pre>
              <div v-else class="code-placeholder">
                生成的 Java 代码将显示在这里
              </div>
            </div>
          </NeonCard>
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

// 配置
const className = ref('User')
const packageName = ref('')
const namingStyle = ref<'camel' | 'snake'>('camel')
const useLombok = ref(true)
const lombokAnnotations = ref(['@Data'])
const serializationFramework = ref<'none' | 'jackson' | 'gson' | 'fastjson'>('jackson')
const useSerializable = ref(false)

// 输入输出
const jsonInput = ref('')
const javaCode = ref('')
const error = ref('')

// 是否可以生成
const canGenerate = computed(() => {
  return jsonInput.value.trim() && className.value.trim()
})

// 示例数据
const exampleJSON = `{
  "id": 1001,
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "age": 25,
  "isActive": true,
  "roles": ["admin", "user"],
  "profile": {
    "nickname": "张三",
    "avatar": "https://example.com/avatar.jpg"
  },
  "createTime": "2024-01-01T10:00:00"
}`

// 加载示例
function handleExample() {
  jsonInput.value = exampleJSON
  className.value = 'User'
  packageName.value = 'com.example.model'
  ElMessage.info('已加载示例 JSON')
}

// 转换命名风格
function convertFieldName(name: string): string {
  if (namingStyle.value === 'snake') {
    return name.replace(/([A-Z])/g, '_$1').toLowerCase()
  }
  return name
}

// 首字母大写
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// 获取 Java 类型
function getJavaType(value: any): string {
  if (value === null) return 'Object'
  
  const type = typeof value
  switch (type) {
    case 'string':
      return 'String'
    case 'number':
      return Number.isInteger(value) ? 'Integer' : 'Double'
    case 'boolean':
      return 'Boolean'
    case 'object':
      if (Array.isArray(value)) {
        if (value.length > 0) {
          const elementType = getJavaType(value[0])
          return `List<${elementType}>`
        }
        return 'List<Object>'
      }
      return 'Object'
    default:
      return 'Object'
  }
}

// 生成字段
function generateFields(obj: Record<string, any>): string[] {
  const fields: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    const fieldName = convertFieldName(key)
    const javaType = getJavaType(value)
    
    // 添加序列化注解
    if (serializationFramework.value === 'jackson' && key !== fieldName) {
      fields.push(`    @JsonProperty("${key}")`)
    } else if (serializationFramework.value === 'gson' && key !== fieldName) {
      fields.push(`    @SerializedName("${key}")`)
    } else if (serializationFramework.value === 'fastjson' && key !== fieldName) {
      fields.push(`    @JSONField(name = "${key}")`)
    }
    
    fields.push(`    private ${javaType} ${fieldName};`)
  }
  
  return fields
}

// 生成 Java 代码
function generateJava() {
  error.value = ''
  javaCode.value = ''
  
  try {
    // 解析 JSON
    const jsonObj = JSON.parse(jsonInput.value)
    
    if (typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
      throw new Error('JSON 必须是一个对象')
    }
    
    const lines: string[] = []
    
    // 包声明
    if (packageName.value) {
      lines.push(`package ${packageName.value};`)
      lines.push('')
    }
    
    // 导入语句
    const imports: string[] = []
    
    if (useSerializable.value) {
      imports.push('import java.io.Serializable;')
    }
    
    // 检查是否需要 List
    const hasArrayField = Object.values(jsonObj).some(v => Array.isArray(v))
    if (hasArrayField) {
      imports.push('import java.util.List;')
    }
    
    // Lombok 导入
    if (useLombok.value) {
      lombokAnnotations.value.forEach(annotation => {
        const lombokClass = annotation.replace('@', '')
        imports.push(`import lombok.${lombokClass};`)
      })
    }
    
    // 序列化框架导入
    if (serializationFramework.value === 'jackson') {
      imports.push('import com.fasterxml.jackson.annotation.JsonProperty;')
    } else if (serializationFramework.value === 'gson') {
      imports.push('import com.google.gson.annotations.SerializedName;')
    } else if (serializationFramework.value === 'fastjson') {
      imports.push('import com.alibaba.fastjson.annotation.JSONField;')
    }
    
    if (imports.length > 0) {
      lines.push(...imports)
      lines.push('')
    }
    
    // 类注释
    lines.push('/**')
    lines.push(` * ${className.value}`)
    lines.push(' * ')
    lines.push(` * @author Auto Generated`)
    lines.push(` * @date ${new Date().toLocaleDateString('zh-CN')}`)
    lines.push(' */')
    
    // Lombok 注解
    if (useLombok.value) {
      lombokAnnotations.value.forEach(annotation => {
        lines.push(annotation)
      })
    }
    
    // 类声明
    let classDeclaration = `public class ${className.value}`
    if (useSerializable.value) {
      classDeclaration += ' implements Serializable'
    }
    classDeclaration += ' {'
    lines.push(classDeclaration)
    
    // serialVersionUID
    if (useSerializable.value) {
      lines.push('')
      lines.push('    private static final long serialVersionUID = 1L;')
    }
    
    // 字段
    lines.push('')
    lines.push(...generateFields(jsonObj))
    
    // 如果不使用 Lombok，生成 Getter/Setter
    if (!useLombok.value) {
      lines.push('')
      lines.push('    // Getter and Setter methods')
      
      for (const [key, value] of Object.entries(jsonObj)) {
        const fieldName = convertFieldName(key)
        const javaType = getJavaType(value)
        const capitalizedFieldName = capitalize(fieldName)
        
        lines.push('')
        lines.push(`    public ${javaType} get${capitalizedFieldName}() {`)
        lines.push(`        return ${fieldName};`)
        lines.push(`    }`)
        
        lines.push('')
        lines.push(`    public void set${capitalizedFieldName}(${javaType} ${fieldName}) {`)
        lines.push(`        this.${fieldName} = ${fieldName};`)
        lines.push(`    }`)
      }
    }
    
    lines.push('}')
    
    javaCode.value = lines.join('\n')
    ElMessage.success('Java 代码生成成功')
  } catch (e: any) {
    error.value = e.message || 'JSON 解析失败'
    ElMessage.error(error.value)
  }
}

// 复制代码
async function copyCode() {
  try {
    await navigator.clipboard.writeText(javaCode.value)
    ElMessage.success('Java 代码已复制到剪贴板')
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 清空
function clearAll() {
  jsonInput.value = ''
  javaCode.value = ''
  error.value = ''
  className.value = 'User'
  packageName.value = ''
}
</script>

<style scoped>
.tool-json2java {
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
  border: 2px solid var(--neon-lime);
  border-radius: var(--radius-lg);
  box-shadow: 0 0 12px rgba(208, 255, 0, 0.4);
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
  grid-template-columns: 350px 1fr;
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

.error-message {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 42, 161, 0.1);
  border: 1px solid var(--neon-pink);
  border-radius: var(--radius-md);
  color: var(--neon-pink);
  display: flex;
  align-items: center;
  font-size: var(--font-size-sm);
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

.java-code {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  color: var(--neon-lime);
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

.mr-1 {
  margin-right: 4px;
}

.mr-2 {
  margin-right: 8px;
}
</style>

