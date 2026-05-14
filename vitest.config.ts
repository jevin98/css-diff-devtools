import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing/vitest-plugin'

export default defineConfig({
  plugins: [vue(), WxtVitest()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['entrypoints/**/*.{ts,vue}'],
      exclude: [
        'entrypoints/**/*.html',
        'entrypoints/**/main.ts',
        'entrypoints/**/lang.ts',
        'entrypoints/**/types.ts',
      ],
    },
  },
})
