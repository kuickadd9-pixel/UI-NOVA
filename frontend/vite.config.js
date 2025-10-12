import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-redirects-after-build',
      closeBundle() {
        const from = resolve(__dirname, 'public/_redirects')
        const toDir = resolve(__dirname, 'dist')
        const to = resolve(toDir, '_redirects')

        if (!existsSync(toDir)) mkdirSync(toDir, { recursive: true })
        try {
          copyFileSync(from, to)
          console.log('✅ Copied _redirects file successfully.')
        } catch (err) {
          console.warn('⚠️  No _redirects file found or failed to copy:', err.message)
        }
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  base: '/',
  esbuild: {
    legalComments: 'none',
  },
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
})
