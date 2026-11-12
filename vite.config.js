import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: [
      // Every `import … from "antd"` goes through our wrapper, which adds
      // scroll-to-error + toast feedback to all forms. (antd/es/* is untouched.)
      { find: /^antd$/, replacement: fileURLToPath(new URL('./src/lib/antd-shim.jsx', import.meta.url)) },
    ],
  },
})
