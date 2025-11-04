/**
 * 计算器状态管理
 * 支持历史记录和时间旅行
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CalculatorHistory {
  id: string
  expression: string
  result: string
  timestamp: number
}

export const useCalculatorStore = defineStore('calculator', () => {
  // 当前显示的值
  const currentValue = ref('0')
  
  // 当前表达式
  const currentExpression = ref('')
  
  // 上一个操作符
  const lastOperator = ref('')
  
  // 上一个数字
  const lastNumber = ref('')
  
  // 是否刚完成计算
  const justCalculated = ref(false)
  
  // 历史记录
  const history = ref<CalculatorHistory[]>([])
  
  // 从 localStorage 加载历史记录
  const loadHistory = () => {
    const saved = localStorage.getItem('calculator-history')
    if (saved) {
      try {
        history.value = JSON.parse(saved)
      } catch (error) {
        console.error('加载历史记录失败:', error)
      }
    }
  }
  
  // 保存历史记录到 localStorage
  const saveHistory = () => {
    localStorage.setItem('calculator-history', JSON.stringify(history.value))
  }
  
  // 添加历史记录
  const addHistory = (expression: string, result: string) => {
    const record: CalculatorHistory = {
      id: Date.now().toString(),
      expression,
      result,
      timestamp: Date.now()
    }
    
    history.value.unshift(record)
    
    // 只保留最近 100 条记录
    if (history.value.length > 100) {
      history.value = history.value.slice(0, 100)
    }
    
    saveHistory()
  }
  
  // 清空历史记录
  const clearHistory = () => {
    history.value = []
    saveHistory()
  }
  
  // 删除单条历史记录
  const deleteHistory = (id: string) => {
    history.value = history.value.filter(h => h.id !== id)
    saveHistory()
  }
  
  // 恢复到某个历史状态
  const restoreFromHistory = (record: CalculatorHistory) => {
    currentValue.value = record.result
    currentExpression.value = record.expression
    justCalculated.value = true
  }
  
  // 格式化数字（添加千分位逗号）
  const formatNumber = (num: string): string => {
    // 移除现有的逗号
    const cleaned = num.replace(/,/g, '')
    
    // 分离整数和小数部分
    const parts = cleaned.split('.')
    const integerPart = parts[0]
    const decimalPart = parts.length > 1 ? parts[1] : ''
    
    // 添加千分位逗号
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    
    return decimalPart ? `${formatted}.${decimalPart}` : formatted
  }
  
  // 解析数字（移除逗号）
  const parseNumber = (num: string): string => {
    return num.replace(/,/g, '')
  }
  
  // 输入数字
  const inputNumber = (num: string) => {
    if (justCalculated.value) {
      currentValue.value = num
      currentExpression.value = ''
      justCalculated.value = false
    } else {
      if (currentValue.value === '0') {
        currentValue.value = num
      } else {
        // 移除逗号后拼接，然后重新格式化
        const rawValue = parseNumber(currentValue.value) + num
        currentValue.value = rawValue
      }
    }
  }
  
  // 输入小数点
  const inputDecimal = () => {
    const rawValue = parseNumber(currentValue.value)
    
    if (justCalculated.value) {
      currentValue.value = '0.'
      currentExpression.value = ''
      justCalculated.value = false
    } else if (!rawValue.includes('.')) {
      currentValue.value = rawValue + '.'
    }
  }
  
  // 输入操作符
  const inputOperator = (operator: string) => {
    if (currentExpression.value && lastOperator.value && !justCalculated.value) {
      // 连续运算
      calculate()
    }
    
    lastNumber.value = parseNumber(currentValue.value)
    lastOperator.value = operator
    currentExpression.value = `${formatNumber(lastNumber.value)} ${operator}`
    justCalculated.value = true
  }
  
  // 计算结果
  const calculate = () => {
    if (!lastOperator.value || !lastNumber.value) return
    
    const num1 = parseFloat(lastNumber.value)
    const num2 = parseFloat(parseNumber(currentValue.value))
    let result = 0
    
    switch (lastOperator.value) {
      case '+':
        result = num1 + num2
        break
      case '-':
        result = num1 - num2
        break
      case '×':
        result = num1 * num2
        break
      case '÷':
        if (num2 === 0) {
          currentValue.value = '错误：除数不能为0'
          clear()
          return
        }
        result = num1 / num2
        break
      case '%':
        result = num1 % num2
        break
      default:
        return
    }
    
    // 格式化结果
    let resultStr = result.toString()
    
    // 处理小数精度
    if (resultStr.includes('.')) {
      const decimalPlaces = resultStr.split('.')[1].length
      if (decimalPlaces > 10) {
        resultStr = result.toFixed(10).replace(/\.?0+$/, '')
      }
    }
    
    // 添加到历史记录
    const expression = `${formatNumber(lastNumber.value)} ${lastOperator.value} ${formatNumber(currentValue.value)}`
    addHistory(expression, resultStr)
    
    currentValue.value = resultStr
    currentExpression.value = expression
    lastOperator.value = ''
    lastNumber.value = ''
    justCalculated.value = true
  }
  
  // 清空当前输入
  const clear = () => {
    currentValue.value = '0'
    currentExpression.value = ''
    lastOperator.value = ''
    lastNumber.value = ''
    justCalculated.value = false
  }
  
  // 删除最后一位
  const backspace = () => {
    if (justCalculated.value) {
      clear()
      return
    }
    
    const rawValue = parseNumber(currentValue.value)
    
    if (rawValue.length > 1) {
      currentValue.value = rawValue.slice(0, -1)
    } else {
      currentValue.value = '0'
    }
  }
  
  // 切换正负号
  const toggleSign = () => {
    const rawValue = parseNumber(currentValue.value)
    
    if (rawValue === '0') return
    
    if (rawValue.startsWith('-')) {
      currentValue.value = rawValue.substring(1)
    } else {
      currentValue.value = '-' + rawValue
    }
  }
  
  // 计算百分比
  const percentage = () => {
    const num = parseFloat(parseNumber(currentValue.value))
    currentValue.value = (num / 100).toString()
  }
  
  // 格式化后的当前值（用于显示）
  const formattedValue = computed(() => {
    const rawValue = parseNumber(currentValue.value)
    
    // 如果包含小数点，保持原样
    if (rawValue.includes('.')) {
      const parts = rawValue.split('.')
      return formatNumber(parts[0]) + '.' + parts[1]
    }
    
    return formatNumber(rawValue)
  })
  
  // 初始化时加载历史记录
  loadHistory()
  
  return {
    currentValue,
    currentExpression,
    history,
    formattedValue,
    inputNumber,
    inputDecimal,
    inputOperator,
    calculate,
    clear,
    backspace,
    toggleSign,
    percentage,
    clearHistory,
    deleteHistory,
    restoreFromHistory,
    formatNumber,
    parseNumber
  }
})

