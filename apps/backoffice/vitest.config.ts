import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@idance/auth': path.resolve(__dirname, '../../packages/auth/src'),
      '@idance/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
})