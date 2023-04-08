import { createApp } from 'vue'
import App from './App.vue'
import Layui from '@layui/layui-vue'

import '@layui/layui-vue/lib/index.css'
import './assets/main.css'

createApp(App).use(Layui).mount('#app')
