import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appsScriptTarget = env.VITE_APPS_SCRIPT_TARGET

  const proxy =
    appsScriptTarget && appsScriptTarget.startsWith('https://script.google.com')
      ? {
          '/api/onboarding': {
            target: 'https://script.google.com',
            changeOrigin: true,
            secure: true,
            rewrite: () => new URL(appsScriptTarget).pathname,
          },
        }
      : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: { proxy },
  }
})
