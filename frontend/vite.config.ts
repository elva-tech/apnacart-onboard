import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appsScriptTarget = env.VITE_APPS_SCRIPT_TARGET

  const proxy: Record<string, object> = {
    '/api/geocode/pincode': {
      target: 'https://api.postalpincode.in',
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(/^\/api\/geocode\/pincode/, '/pincode'),
    },
    '/api/geocode/nominatim': {
      target: 'https://nominatim.openstreetmap.org',
      changeOrigin: true,
      secure: true,
      rewrite: (path: string) => path.replace(/^\/api\/geocode\/nominatim/, '/search'),
    },
  }

  if (appsScriptTarget && appsScriptTarget.startsWith('https://script.google.com')) {
    proxy['/api/onboarding'] = {
      target: 'https://script.google.com',
      changeOrigin: true,
      secure: true,
      rewrite: () => new URL(appsScriptTarget).pathname,
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
  }
})
