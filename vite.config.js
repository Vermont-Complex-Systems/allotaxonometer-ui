import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        runes: true
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
        if (id.startsWith('svelte')) return true;
        if (id === 'd3' || id.startsWith('d3/')) return true;
        if (id === 'allotaxonometer' || id.startsWith('allotaxonometer/')) return true;
        return false;
      }
    },
    target: 'esnext'
  }
});