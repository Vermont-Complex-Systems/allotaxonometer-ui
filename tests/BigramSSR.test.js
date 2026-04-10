import { expect, test, describe, beforeAll } from 'vitest';
import { render } from 'svelte/server';
import fs from 'fs';

describe('Bigram SSR Pipeline', () => {
  let Allotaxonograph, Dashboard;
  let bigramData1, bigramData2;

  beforeAll(async () => {
    const module = await import('../dist/ssr/index.js');
    Allotaxonograph = module.Allotaxonograph;
    Dashboard = module.Dashboard;

    bigramData1 = JSON.parse(fs.readFileSync('tests/fixtures/wiki-bigrams-2025-04-21.json', 'utf8'));
    bigramData2 = JSON.parse(fs.readFileSync('tests/fixtures/wiki-bigrams-2025-08-21.json', 'utf8'));
  });

  test('data processing pipeline completes with bigram data', () => {
    const alpha = 0.17;
    const instance = new Allotaxonograph(bigramData1, bigramData2, { alpha });

    const rtd = instance.rtd;
    expect(rtd).toHaveProperty('normalization');
    expect(rtd).toHaveProperty('divergence_elements');

    const dat = instance.dat;
    expect(dat).toHaveProperty('counts');
    expect(dat).toHaveProperty('deltas');

    expect(Array.isArray(instance.barData)).toBe(true);
    expect(instance.barData.length).toBeGreaterThan(0);

    const balanceData = instance.balanceData;
    expect(Array.isArray(balanceData)).toBe(true);
    expect(balanceData.length).toBeGreaterThan(0);
  });

  test('dashboard renders with bigram data', () => {
    const alpha = 0.17;
    const instance = new Allotaxonograph(bigramData1, bigramData2, { alpha });

    const result = render(Dashboard, {
      props: {
        dat: instance.dat,
        alpha,
        divnorm: instance.rtd.normalization,
        barData: instance.barData,
        balanceData: instance.balanceData,
        title: ['Wiki Bigrams 2025-04-21', 'Wiki Bigrams 2025-08-21'],
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
    expect(result.body).toMatch(/<rect/);
  });

  test('dashboard renders bigram data with canonical flat shape', () => {
    const alpha = 0.17;
    const instance = new Allotaxonograph(bigramData1, bigramData2, { alpha });

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
        title: ['Wiki Bigrams 2025-04-21', 'Wiki Bigrams 2025-08-21'],
        max_count_log: instance.max_count_log,
        DiamondHeight: 600,
      },
    });

    expect(result.body).toContain('allotaxonometer-dashboard');
    expect(result.body).toMatch(/<rect/);
  });

  test('generates visual test output', () => {
    const alpha = 0.17;
    const title1 = 'Wiki Bigrams 2025-04-21';
    const title2 = 'Wiki Bigrams 2025-08-21';

    const instance = new Allotaxonograph(bigramData1, bigramData2, { alpha });
    const rtd = instance.rtd;
    const dat = instance.dat;
    const barData = instance.barData;
    const balanceData = instance.balanceData;
    const maxlog10 = instance.maxlog10;
    const max_count_log = instance.max_count_log;

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
  <title>Bigram Pipeline Test - Wiki Bigrams</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .info { background: #e8f4f8; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    .dashboard { border: 2px dashed #ddd; padding: 10px; background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Bigram Pipeline Test - Wiki Bigrams</h1>

    <div class="info">
      <h3>Pipeline Results:</h3>
      <ul>
        <li><strong>Input data:</strong> ${bigramData1.length} vs ${bigramData2.length} bigrams</li>
        <li><strong>Alpha:</strong> ${alpha}</li>
        <li><strong>Max log10:</strong> ${maxlog10}</li>
        <li><strong>Bar data:</strong> ${barData.length} points</li>
        <li><strong>Balance data:</strong> ${balanceData.length} points</li>
        <li><strong>Diamond data:</strong> ${dat.counts.length} points</li>
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

    fs.writeFileSync('test-output/bigram-pipeline-vitest.html', html);
    expect(fs.existsSync('test-output/bigram-pipeline-vitest.html')).toBe(true);
  });

  test('bigram types contain spaces', () => {
    const alpha = 0.17;
    const instance = new Allotaxonograph(bigramData1, bigramData2, { alpha });

    // Verify that bigram types (multi-word) are preserved in barData
    const typesWithSpaces = instance.barData.filter(d => d.type && d.type.includes(' '));
    expect(typesWithSpaces.length).toBeGreaterThan(0);
  });
});
