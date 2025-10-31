import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  shortcuts: {
    // Neon效果相关的快捷类
    'neon-border': 'border-2 border-solid',
    'neon-glow-cyan': 'shadow-[0_0_12px_#21e6ff,0_0_24px_#21e6ff66]',
    'neon-glow-pink': 'shadow-[0_0_12px_#ff2aa1,0_0_24px_#ff2aa166]',
    'neon-glow-purple': 'shadow-[0_0_12px_#9b5cff,0_0_24px_#9b5cff66]',
    
    // 布局快捷类
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    
    // 过渡效果
    'transition-neon': 'transition-all duration-180 ease-[cubic-bezier(.2,.8,.2,1)]',
  },
  theme: {
    colors: {
      // Neon配色
      'neon-pink': '#ff2aa1',
      'neon-cyan': '#21e6ff',
      'neon-purple': '#9b5cff',
      'neon-yellow': '#ffe600',
      'neon-lime': '#d0ff00',
      
      // 背景色
      'bg-primary': '#0a0f1e',
      'bg-panel': '#0e1530',
      
      // 文本色
      'text-primary': '#eaf6ff',
      'text-muted': '#8aa4c7',
    },
    breakpoints: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
    },
  },
})

