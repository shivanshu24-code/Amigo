import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { nodePolyfills } from "vite-plugin-node-polyfills";
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({ protocolImports: true }),
    basicSsl(), // Enables HTTPS with self-signed certificate
  ],
  server: {
    https: true, // Enable HTTPS
    host: true,  // Listen on all addresses
  },
  define: {
    global: "globalThis",
    process: { env: {} }  // ⬅️ FIX for socket.io-client
  },
})
