import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000, // Mantive a porta que você já tinha configurado
    proxy: {
      // Túnel para o backend local (Python)
      '/api': {
        target: 'http://192.168.0.250:9000',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://192.168.0.250:9000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // 1. A MÁGICA: Joga o build direto para dentro da pasta do backend
    outDir: '../backend/dist',
    
    // 2. SEGURANÇA: Apaga os arquivos velhos antes de jogar os novos
    emptyOutDir: true, 
    
    // Opcional: Otimização para o sistema carregar mais rápido
    chunkSizeWarningLimit: 800,
    
    // Deixamos a configuração limpa para o Vite cuidar do empacotamento automaticamente
    rollupOptions: {
      output: {}
    }
  }
})