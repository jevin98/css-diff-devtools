import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  browser: 'chrome',
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['nativeMessaging', 'tabs', 'activeTab', 'scripting'],
  },
  modules: ['@wxt-dev/module-vue'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
})
