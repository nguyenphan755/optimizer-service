import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const clientDir = path.resolve(__dirname);
  const projectRoot = path.resolve(clientDir, '..');
  const clientEnv = loadEnv(mode, clientDir, '');
  const rootEnv = loadEnv(mode, projectRoot, '');
  const apiPort = rootEnv.PORT || '3000';
  const proxyTarget =
    clientEnv.VITE_API_PROXY_TARGET || `http://localhost:${apiPort}`;

  return {
    plugins: [react()],
    server: {
      /** Tailscale / LAN: mở http://<ip-tailscale>:5100 từ máy khác */
      host: true,
      port: parseInt(clientEnv.VITE_DEV_PORT || '5100', 10),
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
