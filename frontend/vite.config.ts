import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.VITE_API_PORT || '3002'

  const proxyTarget = env.VITE_API_PROXY_TARGET || `http://127.0.0.1:${apiPort}`

  return {
    server: {
      /** Tailscale / LAN: mở http://<ip-tailscale>:5100 từ máy khác trong mesh */
      host: true,
      port: parseInt(env.VITE_DEV_PORT || '5100', 10),
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    assetsInclude: ['**/*.svg', '**/*.csv'],
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  }
})
