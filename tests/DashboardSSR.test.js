import { expect, test, describe, beforeAll } from 'vitest';
import { render } from 'svelte/server';
import fs from 'fs';

describe('Full Pipeline Integration', () => {
  let Allotaxonograph, Dashboard;
  let testData1, testData2;

  beforeAll(async () => {
    // Import everything from SSR build (since both have the same exports)
    const module = await import('../dist/ssr/index.js');
    Allotaxonograph = module.Allotaxonograph;
    Dashboard = module.Dashboard;

    // Load real data from JSON files
    const boys1895 = JSON.parse(fs.readFileSync('tests/fixtures/boys-1895.json', 'utf8'));
    const boys1968 = JSON.parse(fs.readFileSync('tests/fixtures/boys-1968.json', 'utf8'));

    testData1 = boys1895;
    testData2 = boys1968;
  });

  test('data processing pipeline completes successfully', () => {
    const alpha = 0.17;
    const instance = new Allotaxonograph(testData1, testData2, { alpha });

    const rtd = instance.rtd;
    expect(rtd).toHaveProperty('normalization');
    expect(rtd).toHaveProperty('divergence_elements');

    const dat = instance.dat;
    expect(dat).toHaveProperty('counts');
    expect(dat).toHaveProperty('deltas');

    expect(Array.isArray(instance.barData)).toBe(true);

    const balanceData = instance.balanceData;
    expect(Array.isArray(balanceData)).toBe(true);
    expect(balanceData.length).toBeGreaterThan(0);
  });

  test('dashboard renders with processed data', () => {
    const alpha = 0.17;
    const title1 = "Boys Names 1968";
    const title2 = "Boys Names 2018";

    const instance = new Allotaxonograph(testData1, testData2, { alpha });

    // Render Dashboard
    const result = render(Dashboard, {
      props: {
        dat: instance.dat,
        alpha,
        divnorm: instance.rtd.normalization,
        barData: instance.barData,
        balanceData: instance.balanceData,
        title: [title1, title2],
        maxlog10: instance.maxlog10,
        max_count_log: instance.max_count_log,
        height: 815,
        width: 1200,
        DiamondHeight: 600,
        DiamondWidth: 600,
        DashboardHeight: 815,
        DashboardWidth: 1200,
        marginInner: 160,
        marginDiamond: 40,
        showDiamond: true,
        showWordshift: true,
        showDivergingBar: true,
        showLegend: true
      }
    });

    expect(result.body).toContain('allotaxonometer-dashboard');
  });

  test('dashboard renders with canonical (flat) Rust/Python shape', () => {
    // Simulate the shape returned by `allotax.compute_allotax(...)` from the
    // Python binding (or the equivalent Rust API): a flat object with
    // `diamond_counts`, `wordshift`, `balance`, `normalization`, etc.
    const alpha = 0.17;
    const instance = new Allotaxonograph(testData1, testData2, { alpha });

    const flatResult = {
      diamond_counts: instance.dat.counts,
      ncells: instance.dat.ncells,
      wordshift: instance.barData,
      balance: instance.balanceData,
      normalization: instance.rtd.normalization,
      max_delta_loss: instance.dat.max_delta_loss,
      maxlog10: instance.maxlog10,
      alpha,
    };

    const result = render(Dashboard, {
      props: {
        ...flatResult,
        title: ['Boys Names 1895', 'Boys Names 1968'],
        max_count_log: instance.max_count_log,
        DiamondHeight: 600,
      },
    });

    expect(result.body).toContain('allotaxonometer-dashboard');
    // Sanity-check that the chart actually rendered cells (not an empty SVG).
    expect(result.body).toMatch(/<rect/);
  });

  test('dashboard renders when spreading Allotaxonograph directly', () => {
    // Sanity-check that <Dashboard {...allotax} /> still works after the
    // canonical/legacy alias split. Allotaxonograph exposes both shapes.
    const alpha = 0.17;
    const instance = new Allotaxonograph(testData1, testData2, { alpha });

    // Manually spread the fields the way Svelte's spread would.
    const result = render(Dashboard, {
      props: {
        dat: instance.dat,
        diamond_counts: instance.diamond_counts,
        ncells: instance.ncells,
        wordshift: instance.wordshift,
        balance: instance.balance,
        normalization: instance.normalization,
        barData: instance.barData,
        balanceData: instance.balanceData,
        divnorm: instance.divnorm,
        maxlog10: instance.maxlog10,
        max_count_log: instance.max_count_log,
        alpha,
        DiamondHeight: 600,
      },
    });

    expect(result.body).toContain('allotaxonometer-dashboard');
    expect(result.body).toMatch(/<rect/);
  });

  test('generates complete visual test', () => {
    const alpha = 0.17;
    const title1 = "Boys Names 1968";
    const title2 = "Boys Names 2018";

    const instance = new Allotaxonograph(testData1, testData2, { alpha });
    const rtd = instance.rtd;
    const dat = instance.dat;
    const diamond_dat = dat.counts;
    const maxlog10 = instance.maxlog10;
    const max_count_log = instance.max_count_log;
    const barData = instance.barData;
    const balanceData = instance.balanceData;

    // Render Dashboard
    const result = render(Dashboard, {
      props: {
        dat,
        alpha,
        divnorm: rtd.normalization,
        barData,
        balanceData,
        title: [title1, title2],
        maxlog10,
        max_count_log,
        height: 815,
        width: 1200,
        DiamondHeight: 600,
        DiamondWidth: 600,
        DashboardHeight: 815,
        DashboardWidth: 1200,
        marginInner: 160,
        marginDiamond: 40
      }
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Full Pipeline Test - Boys Names 1885 vs 1968</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .info { background: #e8f4f8; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    .dashboard { border: 2px dashed #ddd; padding: 10px; background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔬 Full Pipeline Integration Test - Boys Names Analysis</h1>
    
    <div class="info">
      <h3>Pipeline Results:</h3>
      <ul>
        <li><strong>Input data:</strong> ${testData1.length} vs ${testData2.length} names</li>
        <li><strong>Alpha:</strong> ${alpha}</li>
        <li><strong>Max log10:</strong> ${maxlog10}</li>
        <li><strong>Bar data:</strong> ${barData.length} points</li>
        <li><strong>Balance data:</strong> ${balanceData.length} points</li>
        <li><strong>Diamond data:</strong> ${diamond_dat.length} points</li>
        <li><strong>Normalization:</strong> ${rtd.normalization.toFixed(4)}</li>
      </ul>
    </div>

    <div class="dashboard">
      ${result.body}
    </div>
    
    <details>
      <summary>Raw HTML Output</summary>
      <pre>${result.body}</pre>
    </details>
  </div>
</body>
</html>`;

    if (!fs.existsSync('test-output')) {
      fs.mkdirSync('test-output');
    }
    
    fs.writeFileSync('test-output/full-pipeline-vitest.html', html);
    
    expect(fs.existsSync('test-output/full-pipeline-vitest.html')).toBe(true);
  });
});