import { render } from '@testing-library/svelte';
import { Diamond } from '../../src/lib/index.js';
import { testData } from '../fixtures/testData.js';

test('Diamond component renders without crashing', () => {
  const { container } = render(Diamond, {
    props: {
      dat: testData.dat,
      alpha: testData.alpha,
      divnorm: testData.divnorm,
      title: testData.title,
      maxlog10: testData.maxlog10,
      DiamondHeight: 400,
      marginInner: 100,
      marginDiamond: 20
    }
  });
  
  expect(container.querySelector('.diamond-chart')).toBeTruthy();
  expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
});

test('Diamond component handles empty data', () => {
  const { container } = render(Diamond, {
    props: {
      dat: { counts: [], deltas: [] },
      alpha: 0.5,
      divnorm: 1,
      title: ["Empty 1", "Empty 2"],
      maxlog10: 1
    }
  });
  
  expect(container).toBeTruthy();
});