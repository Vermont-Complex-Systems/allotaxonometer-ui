// tests/build-check.test.js
import { expect, test } from 'vitest';

test('can import from built SSR module', async () => {
  try {
    const module = await import('../dist/ssr/index.js');
    console.log('SSR exports:', Object.keys(module));
    expect(module).toBeDefined();
  } catch (error) {
    console.error('SSR import failed:', error);
    throw error;
  }
});

test('can import from regular build', async () => {
  try {
    const module = await import('../dist/index.js');
    console.log('Regular exports:', Object.keys(module));
    expect(module).toBeDefined();
  } catch (error) {
    console.error('Regular import failed:', error);
    throw error;
  }
});