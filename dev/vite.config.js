import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite'; // Add this import
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tailwindcss(), // Add this plugin FIRST
    svelte({
      compilerOptions: {
        runes: true
      }
    })
  ],
  resolve: {
    alias: {
      'allotaxonometer-ui': path.resolve(__dirname, '../src/lib'),
      '$lib': path.resolve(__dirname, './src/lib')
    }
  }
});