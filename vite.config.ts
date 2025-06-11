import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
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
      external: [
        'svelte',
        'svelte/internal', 
        'svelte/internal/client',
        'svelte/internal/server',
        // Externalize all svelte internal modules
        /^svelte\//,
        'd3', 
        'allotaxonometer'
      ],
      output: {
        globals: {
          svelte: 'Svelte'
        }
      }
    },
    target: 'esnext',
    minify: false
  }
});