import { expect, test, describe, beforeAll } from 'vitest';
import { render } from 'svelte/server';
import fs from 'fs';

describe('Wordshift Component', () => {
  let Wordshift;
  
  beforeAll(async () => {
    const module = await import('../../dist/ssr/index.js');
    Wordshift = module.Wordshift;
  });

  const testBarData = [
    { type: "apple (1 ⇋ 2)", rank_diff: -1, metric: 0.045 },
    { type: "banana (5 ⇋ 3)", rank_diff: 2, metric: -0.023 },
    { type: "cherry (2 ⇋ 1)", rank_diff: 1, metric: 0.067 },
    { type: "date (10 ⇋ 15)", rank_diff: -5, metric: -0.012 },
    { type: "elderberry (3 ⇋ 8)", rank_diff: -5, metric: 0.034 }
  ];

  test('renders successfully with valid data', () => {
    const max_shift = Math.max(...testBarData.map(d => Math.abs(d.metric)));
    
    const result = render(Wordshift, {
      props: {
        barData: testBarData,
        DashboardHeight: 600,
        DashboardWidth: 800,
        xDomain: [-max_shift * 1.5, max_shift * 1.5]
      }
    });

    expect(result.body).toContain('wordshift-container');
    expect(result.body).toContain('rect');
    expect(result.body).toContain('text');
  });

  test('handles empty data gracefully', () => {
    const result = render(Wordshift, {
      props: {
        barData: [],
        DashboardHeight: 600,
        DashboardWidth: 800,
        xDomain: [-1, 1]
      }
    });

    expect(result.body).toContain('wordshift-container');
    // Should render the container even with no data
  });

  test('handles missing optional props', () => {
    const result = render(Wordshift, {
      props: {
        barData: testBarData,
        DashboardHeight: 600,
        DashboardWidth: 800
        // No xDomain - should calculate automatically
      }
    });

    expect(result.body).toContain('wordshift-container');
  });

  test('renders with custom dimensions', () => {
    const result = render(Wordshift, {
      props: {
        barData: testBarData,
        DashboardHeight: 800,
        DashboardWidth: 1000,
        width: 400,
        marginLeft: 100
      }
    });

    expect(result.body).toContain('wordshift-container');
  });

  test('generates visual test file', () => {
    const max_shift = Math.max(...testBarData.map(d => Math.abs(d.metric)));
    
    const result = render(Wordshift, {
      props: {
        barData: testBarData,
        DashboardHeight: 600,
        DashboardWidth: 800,
        xDomain: [-max_shift * 1.5, max_shift * 1.5]
      }
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Wordshift Component Test</title>
  <style>
    body { font-family: sans-serif; margin: 20px; background: #f5f5f5; }
    .container { background: white; padding: 20px; border-radius: 8px; max-width: 1000px; margin: 0 auto; }
    .component-test { border: 1px dashed #ccc; padding: 20px; margin: 20px 0; background: #fafafa; }
    svg { border: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Wordshift Component Test</h1>
    
    <div class="component-test">
      <h3>Wordshift Component:</h3>
      <p><strong>Data points:</strong> ${testBarData.length}, <strong>Max shift:</strong> ${max_shift.toFixed(4)}</p>
      <svg width="800" height="600" style="background: #f9f9f9;">
        ${result.body}
      </svg>
    </div>
    
    <details>
      <summary>Test Data</summary>
      <pre>${JSON.stringify(testBarData, null, 2)}</pre>
    </details>
  </div>
</body>
</html>`;

    if (!fs.existsSync('test-output')) {
      fs.mkdirSync('test-output');
    }
    
    fs.writeFileSync('test-output/wordshift-vitest.html', html);
    
    // Just verify the file was created
    expect(fs.existsSync('test-output/wordshift-vitest.html')).toBe(true);
  });
});