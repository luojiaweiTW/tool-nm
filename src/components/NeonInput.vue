<template>
  <div class="neon-input-wrapper">
    <label v-if="label" :for="inputId" class="neon-input__label">
      {{ label }}
      <span v-if="required" class="neon-input__required">*</span>
    </label>
    <div
      :class="[
        'neon-input',
        {
          'neon-input--focused': isFocused,
          'neon-input--disabled': disabled,
          'neon-input--error': error,
        }
      ]"
    >
      <span v-if="$slots.prefix || prefixIcon" class="neon-input__prefix">
        <slot name="prefix">
          <i v-if="prefixIcon" :class="prefixIcon" />
        </slot>
      </span>
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        class="neon-input__inner"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown.enter="emit('enter', $event)"
      />
      <span v-if="$slots.suffix || suffixIcon || showClear" class="neon-input__suffix">
        <i
          v-if="showClear && modelValue"
          class="i-mdi-close-circle neon-input__clear"
          @click="handleClear"
        />
        <slot name="suffix">
          <i v-if="suffixIcon" :class="suffixIcon" />
        </slot>
      </span>
    </div>
    <div v-if="error || hint" class="neon-input__message">
      <span v-if="error" class="neon-input__error">{{ error }}</span>
      <span v-else-if="hint" class="neon-input__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'number' | 'email' | 'url' | 'tel' | 'search'
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  prefixIcon?: string
  suffixIcon?: string
  clearable?: boolean
  maxlength?: number
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'clear'): void
  (e: 'enter', event: KeyboardEvent): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
})

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

const inputId = computed(() => {
  return `neon-input-${Math.random().toString(36).substr(2, 9)}`
})

const showClear = computed(() => {
  return props.clearable && !props.disabled && !props.readonly
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

defineExpose({
  focus,
  blur,
  inputRef,
})
</script>

<style scoped>
.neon-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.neon-input__label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  user-select: none;
}

.neon-input__required {
  color: var(--neon-pink);
  margin-left: 2px;
}

.neon-input {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-panel);
  border: var(--border-width-normal) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base) var(--transition-timing);
}

.neon-input:hover:not(.neon-input--disabled) {
  border-color: var(--neon-cyan);
}

.neon-input--focused {
  border-color: var(--neon-cyan);
  box-shadow: var(--glow-cyan);
}

.neon-input--error {
  border-color: var(--neon-pink);
}

.neon-input--error.neon-input--focused {
  box-shadow: var(--glow-pink);
}

.neon-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: saturate(0.5);
}

.neon-input__inner {
  flex: 1;
  min-width: 0;
  padding: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  color: var(--color-text);
  background: transparent;
  border: none;
  outline: none;
}

.neon-input__inner::placeholder {
  color: var(--color-text-disabled);
}

.neon-input__inner:disabled {
  cursor: not-allowed;
}

.neon-input__prefix,
.neon-input__suffix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-muted);
  font-size: 1.2em;
}

.neon-input__clear {
  cursor: pointer;
  color: var(--color-muted);
  transition: color var(--transition-fast) var(--transition-timing);
}

.neon-input__clear:hover {
  color: var(--neon-cyan);
}

.neon-input__message {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
  min-height: 18px;
}

.neon-input__error {
  color: var(--neon-pink);
}

.neon-input__hint {
  color: var(--color-muted);
}

/* ========== 特殊类型输入框 ========== */
.neon-input__inner[type="number"]::-webkit-inner-spin-button,
.neon-input__inner[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.neon-input__inner[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>

