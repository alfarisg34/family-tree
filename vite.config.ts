import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function apiPlugin(): Plugin {
  return {
    name: 'neon-api',
    configureServer(server) {
      server.middlewares.use('/api/data', async (request, response) => {
        const { default: handler } = await import('./api/data.mjs');
        await handler(request, response);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/data', async (request, response) => {
        const { default: handler } = await import('./api/data.mjs');
        await handler(request, response);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of ['DATABASE_URL', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET']) {
    if (!process.env[key] && env[key]) process.env[key] = env[key];
  }
  return { plugins: [react(), apiPlugin()] };
})
