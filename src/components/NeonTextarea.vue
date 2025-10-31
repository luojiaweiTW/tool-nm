<template>
  <div class="neon-textarea-wrapper">
    <label v-if="label" :for="textareaId" class="neon-textarea__label">
      {{ label }}
      <span v-if="required" class="neon-textarea__required">*</span>
    </label>
    <div
      :class="[
        'neon-textarea',
        {
          'neon-textarea--focused': isFocused,
          'neon-textarea--disabled': disabled,
          'neon-textarea--error': error,
        }
      ]"
    >
      <textarea
        :id="textareaId"
        ref="textareaRef"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :rows="rows"
        :maxlength="maxlength"
        class="neon-textarea__inner"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <div v-if="showCount && maxlength" class="neon-textarea__count">
        {{ currentLength }} / {{ maxlength }}
      </div>
    </div>
    <div v-if="error || hint" class="neon-textarea__message">
      <span v-if="error" class="neon-textarea__error">{{ error }}</span>
      <span v-else-if="hint" class="neon-textarea__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  rows?: number
  maxlength?: number
  showCount?: boolean
  autosize?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  readonly: false,
  required: false,
  rows: 4,
  showCount: false,
  autosize: false,
})

const emit = defineEmits<Emits>()

const textareaRef = ref<HTMLTextAreaElement>()
const isFocused = ref(false)

const textareaId = computed(() => {
  return `neon-textarea-${Math.random().toString(36).substr(2, 9)}`
})

const currentLength = computed(() => {
  return props.modelValue?.length || 0
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
  
  if (props.autosize) {
    autoResize()
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const autoResize = () => {
  if (!textareaRef.value) return
  
  textareaRef.value.style.height = 'auto'
  textareaRef.value.style.height = textareaRef.value.scrollHeight + 'px'
}

const focus = () => {
  textareaRef.value?.focus()
}

const blur = () => {
  textareaRef.value?.blur()
}

defineExpose({
  focus,
  blur,
  textareaRef,
})
</script>

<style scoped>
.neon-textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.neon-textarea__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  user-select: none;
}

.neon-textarea__required {
  color: var(--neon-pink);
  margin-left: 2px;
}

.neon-textarea {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-panel);
  border: var(--border-width-normal) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base) var(--transition-timing);
}

.neon-textarea:hover:not(.neon-textarea--disabled) {
  border-color: var(--neon-cyan);
}

.neon-textarea--focused {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.neon-textarea--error {
  border-color: var(--neon-pink);
}

.neon-textarea--error.neon-textarea--focused {
  box-shadow: var(--glow-pink);
}

.neon-textarea--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: saturate(0.5);
}

.neon-textarea__inner {
  flex: 1;
  min-height: 80px;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-text);
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
}

.neon-textarea__inner::placeholder {
  color: var(--color-text-disabled);
}

.neon-textarea__inner:disabled {
  cursor: not-allowed;
  resize: none;
}

.neon-textarea__count {
  margin-top: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  text-align: right;
  user-select: none;
}

.neon-textarea__message {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
  min-height: 18px;
}

.neon-textarea__error {
  color: var(--neon-pink);
}

.neon-textarea__hint {
  color: var(--color-muted);
}
</style>

