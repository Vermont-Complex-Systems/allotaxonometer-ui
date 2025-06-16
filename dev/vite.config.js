import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte({
    compilerOptions: {
      runes: true
    }
  })],
  resolve: {
    alias: {
      'allotaxonometer-ui': path.resolve(__dirname, '../src/lib'), // Absolute path
      '$lib': path.resolve(__dirname, './src/lib')
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
});