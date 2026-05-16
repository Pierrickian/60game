import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  base: isGitHubPages ? '/60game/' : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
