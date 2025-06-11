import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
        generate: 'server' // This is the key change!
      }
    })
  ],
  build: {
    lib: {
      entry: 'src/lib/index.ts',
      name: 'AllotaxonometerUI',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: (id) => {
        return id.startsWith('svelte') || 
               id.startsWith('d3') || 
               id === 'allotaxonometer';
      }
    },
    target: 'esnext',
    minify: false
  }
});