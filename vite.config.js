import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true,
        dev: true
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
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}', 'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Add this to ensure proper Svelte compilation for tests
    alias: {
      // Make sure we're using the client build of Svelte
      'svelte': 'svelte'
    }
  }
});