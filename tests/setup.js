import { expect } from 'vitest';
import { beforeAll } from 'vitest';

// Make expect globally available
globalThis.expect = expect;

// Set up DOM environment
beforeAll(() => {
  // Ensure we're in a browser-like environment
  global.window = window;
  global.document = document;
  global.navigator = navigator;
});

// Import jest-dom extensions
import '@testing-library/jest-dom';