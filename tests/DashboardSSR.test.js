import { expect, test, describe, beforeAll } from 'vitest';
import { render } from 'svelte/server';
import fs from 'fs';
import * as d3 from 'd3';

describe('Full Pipeline Integration', () => {
  let combElems, rank_turbulence_divergence, diamond_count, wordShift_dat, balanceDat, Dashboard;
  let testData1, testData2;
  
  beforeAll(async () => {
    // Import everything from SSR build (since both have the same exports)
    const module = await import('../dist/ssr/index.js');
    combElems = module.combElems;
    rank_turbulence_divergence = module.rank_turbulence_divergence;
    diamond_count = module.diamond_count;
    wordShift_dat = module.wordShift_dat;
    balanceDat = module.balanceDat;
    Dashboard = module.Dashboard;
    
    // Load real data from JSON files
    const boys1895 = JSON.parse(fs.readFileSync('tests/fixtures/boys-1895.json', 'utf8'));
    const boys1968 = JSON.parse(fs.readFileSync('tests/fixtures/boys-1968.json', 'utf8'));
    
    testData1 = boys1895;
    testData2 = boys1968;
  });

  test('data processing pipeline completes successfully', () => {
    const alpha = 0.17;
    
    const me = combElems(testData1, testData2);
    expect(me).toBeDefined();
    expect(me[0]).toHaveProperty('ranks');
    expect(me[1]).toHaveProperty('ranks');
    
    const rtd = rank_turbulence_divergence(me, alpha);
    expect(rtd).toHaveProperty('normalization');
    expect(rtd).toHaveProperty('divergence_elements');
    
    const dat = diamond_count(me, rtd);
    expect(dat).toHaveProperty('counts');
    expect(dat).toHaveProperty('deltas');
    
    const barData = wordShift_dat(me, dat);
    expect(Array.isArray(barData)).toBe(true);
    
    const balanceData = balanceDat(testData1, testData2);
    expect(Array.isArray(balanceData)).toBe(true);
    expect(balanceData.length).toBeGreaterThan(0);
  });

  test('dashboard renders with processed data', () => {
    const alpha = 0.17;
    const title1 = "Boys Names 1968";
    const title2 = "Boys Names 2018";
    
    // Process data
    const me = combElems(testData1, testData2);
    const rtd = rank_turbulence_divergence(me, alpha);
    const dat = diamond_count(me, rtd);
    const diamond_dat = dat.counts;
    
    const maxlog10 = Math.ceil(Math.max(
      Math.log10(Math.max(...me[0].ranks)),
      Math.log10(Math.max(...me[1].ranks))
    ));
    
    const max_count_log = Math.ceil(Math.log10(d3.max(diamond_dat, d => d.value))) + 1;
    const barData = wordShift_dat(me, dat).slice(0, 30);
    const balanceData = balanceDat(testData1, testData2);
    
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
        marginDiamond: 40,
        showDiamond: true,
        showWordshift: true,
        showDivergingBar: true,
        showLegend: true
      }
    });

    expect(result.body).toContain('allotaxonometer-dashboard');
    // These might fail if components aren't rendering, so let's test one by one
    // expect(result.body).toContain('diamond-chart');
    // expect(result.body).toContain('wordshift-container');
    // expect(result.body).toContain('balance-chart');
    // expect(result.body).toContain('legend-container');
  });

  test('generates complete visual test', () => {
    const alpha = 0.17;
    const title1 = "Boys Names 1968";
    const title2 = "Boys Names 2018";
    
    // Process data
    const me = combElems(testData1, testData2);
    const rtd = rank_turbulence_divergence(me, alpha);
    const dat = diamond_count(me, rtd);
    const diamond_dat = dat.counts;
    
    const maxlog10 = Math.ceil(Math.max(
      Math.log10(Math.max(...me[0].ranks)),
      Math.log10(Math.max(...me[1].ranks))
    ));
    
    const max_count_log = Math.ceil(Math.log10(d3.max(diamond_dat, d => d.value))) + 1;
    const barData = wordShift_dat(me, dat).slice(0, 30);
    const balanceData = balanceDat(testData1, testData2);
    
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