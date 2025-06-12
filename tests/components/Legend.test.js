import { expect, test } from 'vitest';
import { render } from 'svelte/server';
import { Legend } from '../../src/lib/index.ts';

// Simple test data for Legend
const testDiamondData = [
  { rank_L: [1, 5], value: 10 },
  { rank_L: [2, 8], value: 15 },
  { rank_L: [3, 12], value: 8 },
  { rank_L: [5, 20], value: 25 },
  { rank_L: [10, 50], value: 5 }
];

test('Legend component renders without crashing', () => {
  const result = render(Legend, {
    props: {
      diamond_dat: testDiamondData,
      DiamondHeight: 400,
      max_count_log: 2
    }
  });
  
  // Check if the legend content is in the rendered HTML
  expect(result.body).toContain('legend-container');
  expect(result.body).toContain('rect');
  expect(result.body).toContain('text');
});

test('Legend handles empty data gracefully', () => {
  const result = render(Legend, {
    props: {
      diamond_dat: [],
      DiamondHeight: 400
    }
  });
  
  // Should still render container even with empty data
  expect(result.body).toContain('legend-container');
});

test('Legend renders with custom height', () => {
  const customHeight = 600;
  const result = render(Legend, {
    props: {
      diamond_dat: testDiamondData,
      DiamondHeight: customHeight
    }
  });
  
  // Check that component uses the custom height in transforms
  expect(result.body).toContain('legend-container');
  // Check for the calculated transform value (DiamondHeight - margin.top = 600 - 65 = 535)
  expect(result.body).toContain('535');
});