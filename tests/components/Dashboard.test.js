// tests/Dashboard.test.js
import { render } from '@testing-library/svelte';
import { Dashboard } from '../../src/lib/index.js';

test('Dashboard renders without crashing', () => {
  const { container } = render(Dashboard, {
    props: {
      diamond_count: [],
      diamond_dat: [],
      barData: [],
      // ... minimal props
    }
  });
  
  expect(container.querySelector('.allotaxonometer-dashboard')).toBeTruthy();
});

test('Dashboard handles missing data gracefully', () => {
  const { container } = render(Dashboard, {
    props: {} // No props
  });
  
  // Should not crash
  expect(container).toBeTruthy();
});