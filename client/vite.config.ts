import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/convert': 'http://localhost:5000', // Twój serwer Express
      '/output': 'http://localhost:5000'
    }
  }
})
