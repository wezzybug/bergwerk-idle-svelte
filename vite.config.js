import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// BASE_URL defaults to '/' locally. On GitHub Pages it's '/bergwerk-idle-svelte/'.
const base = process.env.BASE_URL || '/';

export default defineConfig({
  base,
  plugins: [svelte()],
  build: {
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})