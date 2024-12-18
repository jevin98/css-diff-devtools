import { createApp } from 'vue';
import App from './devtools-panel.vue';
import { createI18n } from 'vue-i18n'

import messages from './lang'
import 'element-plus/dist/index.css'

const i18n = createI18n({
  locale: 'zh-CN',
  messages
})

createApp(App).use(i18n).mount('#app');
