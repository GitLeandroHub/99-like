import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  // ordem: wasm + topLevelAwait ANTES do react ajuda a evitar o erro no dev
  plugins: [wasm(), topLevelAwait(), react()],
  build: {
    target: 'esnext', // top-level await
  },
  optimizeDeps: {
    // evita que o Vite “pré-bundle” os pacotes wasm do Automerge
    exclude: ['@automerge/automerge', '@automerge/automerge-wasm'],
  },
})
