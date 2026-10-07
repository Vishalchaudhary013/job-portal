import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // .jfif isn't in Vite's default image asset list
  // assetsInclude: ['**/*.jfif'],
  // server: { port: 5175 },
})
