import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  base: './',  // 使用相对路径，适配 Electron 打包
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      buffer: 'buffer',
    },
  },
  define: {
    // 为浏览器环境提供 Buffer 全局变量
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  build: {
    // 🔧 构建优化：减少内存使用
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // 手动分块，减少单个chunk大小
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
              return 'vue-vendor'
            }
            if (id.includes('element-plus')) {
              return 'element-plus'
            }
            if (id.includes('xterm')) {
              return 'xterm'
            }
            if (id.includes('axios') || id.includes('crypto-js') || id.includes('js-yaml') || id.includes('marked')) {
              return 'utils'
            }
            // ⚡ 图标集单独打包
            if (id.includes('@iconify')) {
              return 'icons'
            }
            return 'vendor' // 其他第三方库
          }
        },
      },
    },
    // 减少内存压力
    minify: 'esbuild', // 使用 esbuild 代替 terser，更快且内存占用更少
    target: 'esnext',
    sourcemap: false, // 生产环境不生成 sourcemap，节省时间和空间
    // ⚡ 确保图标资源被正确打包
    assetsInlineLimit: 0, // 禁用内联，确保所有资源都被正确复制
  },
})
