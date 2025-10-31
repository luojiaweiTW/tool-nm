import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 样式导入
import 'uno.css'
import '@unocss/reset/tailwind.css'
import './styles/tokens.css'
import './styles/element-override.css'
import './styles/global.css'
// ⚡ 性能优化：禁用所有动画，大幅降低CPU/GPU占用
import './styles/disable-animations.css'

const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)

app.mount('#app')
