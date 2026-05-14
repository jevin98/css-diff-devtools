import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  browser: 'chrome',
  manifest: {
    permissions: ['nativeMessaging', 'tabs', 'activeTab', 'scripting'],
  },
  modules: ['@wxt-dev/module-vue'],
})
