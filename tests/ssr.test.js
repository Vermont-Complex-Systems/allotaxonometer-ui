import { expect, test, describe } from 'vitest';
import { render } from 'svelte/server';

describe('Basic SSR Component Tests', () => {
  
  test('can import all components from SSR build', async () => {
    const { Dashboard, Legend, Diamond, Wordshift, DivergingBarChart } = await import('../dist/ssr/index.js');
    
    expect(Dashboard).toBeDefined();
    expect(Legend).toBeDefined();
    expect(Diamond).toBeDefined();
    expect(Wordshift).toBeDefined();
    expect(DivergingBarChart).toBeDefined();
  });

  test('Legend component renders successfully', async () => {
    const { Legend } = await import('../dist/ssr/index.js');
    
    const legendResult = render(Legend, {
      props: {
        diamond_dat: [
          { rank_L: [1, 5], value: 10 }
        ],
        DiamondHeight: 400
      }
    });
    
    expect(legendResult.body).toContain('legend-container');
    expect(legendResult.body).toContain('rect');
    expect(legendResult.body).toContain('text');
  });

  test('Dashboard renders with minimal props', async () => {
    const { Dashboard } = await import('../dist/ssr/index.js');
    
    const dashboardResult = render(Dashboard, {
      props: {
        dat: {
          counts: [{ 
            x1: 0, y1: 0, value: 1, types: "test", 
            rank_L: [1, 1], rank_R: [1, 1], 
            coord_on_diag: 0, cos_dist: 0, which_sys: "left" 
          }],
          deltas: [0.1]
        },
        alpha: 0.5,
        divnorm: 1,
        title: ['Test 1', 'Test 2'],
        maxlog10: 1,
        barData: [],
        balanceData: [],
        // Add the missing dimensions
        height: 400,
        width: 600,
        DiamondHeight: 300,
        DiamondWidth: 300,
        DashboardHeight: 400,
        DashboardWidth: 600
      }
    });
    
    expect(dashboardResult.body).toContain('allotaxonometer-dashboard');
  });

  test('Legend handles empty data gracefully', async () => {
    const { Legend } = await import('../dist/ssr/index.js');
    
    const legendResult = render(Legend, {
      props: {
        diamond_dat: [],
        DiamondHeight: 400
      }
    });
    
    expect(legendResult.body).toContain('legend-container');
  });

  test('Dashboard handles missing optional props', async () => {
    const { Dashboard } = await import('../dist/ssr/index.js');
    
    const dashboardResult = render(Dashboard, {
      props: {
        // Minimal required props only
        dat: null,
        barData: [],
        balanceData: []
      }
    });
    
    expect(dashboardResult.body).toContain('allotaxonometer-dashboard');
  });
});