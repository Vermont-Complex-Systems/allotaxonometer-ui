import { render } from '@testing-library/svelte';
import { DivergingBarChart } from '../../src/lib/index.js';
import { testData } from '../fixtures/fakeData.js';

test('DivergingBarChart renders balance data', () => {
  const { container } = render(DivergingBarChart, {
    props: {
      data: testData.balanceData,
      DiamondHeight: 400,
      DiamondWidth: 400
    }
  });
  
  expect(container.querySelector('.balance-chart')).toBeTruthy();
  expect(container.querySelectorAll('rect').length).toBe(testData.balanceData.length);
});