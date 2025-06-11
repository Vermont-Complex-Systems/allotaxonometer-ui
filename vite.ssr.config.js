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
    ssr: 'src/lib/index.ts', // Entry point for SSR
    outDir: 'dist/ssr',
    rollupOptions: {
      external: (id) => {
        if (id.startsWith('svelte')) return true;
        if (id === 'd3' || id.startsWith('d3/')) return true;
        if (id === 'allotaxonometer' || id.startsWith('allotaxonometer/')) return true;
        return false;
      }
    },
    target: 'node18',
    minify: false
  }
});