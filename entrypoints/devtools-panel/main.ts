import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './devtools-panel.vue'

import messages from './lang'
import 'element-plus/dist/index.css'

const i18n = createI18n({
  locale: 'en',
  messages,
})

createApp(App).use(i18n).mount('#app')
