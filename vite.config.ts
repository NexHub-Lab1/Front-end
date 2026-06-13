import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://back-end-6tzt.onrender.com',
        changeOrigin: true,
        secure: true,
      },
      '/ws': {
        target: 'https://back-end-6tzt.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
