// tests/performance-profile.test.js
import { expect, test, describe } from 'vitest';
import fs from 'fs';
import { Allotaxonograph } from '../src/lib/utils/allotaxonograph.svelte.ts';

describe('Full Pipeline Performance Profiling', () => {

    function generateRealisticData(numTypes, overlap = 0.3) {
        // Generate Zipf-like distribution (realistic for word frequencies, species counts, etc.)
        const zipf = (rank, s = 1.0) => 1 / Math.pow(rank, s);

        const sharedTypes = Math.floor(numTypes * overlap);
        const exclusive1 = numTypes - sharedTypes;
        const exclusive2 = numTypes - sharedTypes;

        const elem1 = [];
        const elem2 = [];

        // Shared types
        for (let i = 0; i < sharedTypes; i++) {
            const type = `shared_${i}`;
            const count1 = Math.floor(zipf(i + 1, 1.2) * 10000) + 1;
            const count2 = Math.floor(zipf(i + 1, 1.1) * 10000) + 1;
            elem1.push({ types: type, counts: count1 });
            elem2.push({ types: type, counts: count2 });
        }

        // Exclusive to elem1
        for (let i = 0; i < exclusive1; i++) {
            const type = `exclusive1_${i}`;
            const count = Math.floor(zipf(sharedTypes + i + 1, 1.2) * 10000) + 1;
            elem1.push({ types: type, counts: count });
        }

        // Exclusive to elem2
        for (let i = 0; i < exclusive2; i++) {
            const type = `exclusive2_${i}`;
            const count = Math.floor(zipf(sharedTypes + i + 1, 1.1) * 10000) + 1;
            elem2.push({ types: type, counts: count });
        }

        return { elem1, elem2 };
    }

    function profilePipeline(elem1, elem2, alpha) {
        const start = performance.now();
        const instance = new Allotaxonograph(elem1, elem2, { alpha });
        // Reading derived fields forces the pipeline to run
        const dat = instance.dat;
        const rtd = instance.rtd;
        const barData = instance.barData;
        const balanceData = instance.balanceData;
        const elapsed = performance.now() - start;
        return { elapsed, dat, rtd, barData, balanceData };
    }

    test('profile full pipeline with increasing dataset sizes', () => {
        console.log('\n🔬 FULL PIPELINE PERFORMANCE PROFILING\n');
        console.log('Testing with Zipf-like distributions (realistic for text, species, etc.)\n');

        const scenarios = [
            { size: 100, name: 'Tiny (100 types)', iterations: 10 },
            { size: 1000, name: 'Small (1K types)', iterations: 10 },
            { size: 10000, name: 'Medium (10K types) - YOUR CURRENT TARGET', iterations: 5 },
            { size: 50000, name: 'Large (50K types)', iterations: 2 },
            { size: 100000, name: 'Very Large (100K types)', iterations: 1 }
        ];

        const allResults = [];

        for (const scenario of scenarios) {
            console.log(`\n${'='.repeat(70)}`);
            console.log(`📊 ${scenario.name}`);
            console.log(`${'='.repeat(70)}`);

            const timings = [];

            for (let iter = 0; iter < scenario.iterations; iter++) {
                const { elem1, elem2 } = generateRealisticData(scenario.size, 0.3);
                const { elapsed } = profilePipeline(elem1, elem2, 1.0);
                timings.push(elapsed);
            }

            const avg = timings.reduce((s, t) => s + t, 0) / timings.length;
            const min = Math.min(...timings);
            const max = Math.max(...timings);

            console.log(`\n⏱️  Pipeline Timings (${scenario.iterations} iterations):`);
            console.log(`   avg: ${avg.toFixed(2)}ms   min: ${min.toFixed(2)}ms   max: ${max.toFixed(2)}ms`);

            const acceptable = avg < 1000;
            const status = acceptable ? '✅ ACCEPTABLE' : '⚠️  SLOW';
            console.log(`   ${status} - ${(avg / 1000).toFixed(2)}s avg`);

            allResults.push({
                scenario: scenario.name,
                size: scenario.size,
                avg,
                min,
                max,
                viable: acceptable
            });
        }

        generateHTMLReport(allResults);

        console.log(`\n${'='.repeat(70)}`);
        console.log('📊 Performance profile complete!');
        console.log('📄 Detailed report: test-output/performance-profile.html');
        console.log(`${'='.repeat(70)}\n`);

        expect(allResults.length).toBe(scenarios.length);
        for (const r of allResults) {
            expect(r.avg).toBeGreaterThan(0);
        }

    }, 300000); // 5 minute timeout

    function generateHTMLReport(results) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Allotaxonometer Pipeline Performance Profile</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #1e3a8a 0%, #0c1e4a 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #e5e7eb;
        }
        th:first-child, td:first-child {
            text-align: left;
        }
        th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
        }
        .viable { color: #16a34a; font-weight: bold; }
        .slow { color: #dc2626; font-weight: bold; }
        .section {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Allotaxonometer Pipeline Performance Profile</h1>
            <p><em>Full pipeline profiling via Allotaxonograph (WASM if available, JS fallback otherwise)</em></p>
            <p style="color: #6b7280; font-size: 0.9em;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>📊 Pipeline Timings</h2>
            <table>
                <thead>
                    <tr>
                        <th>Dataset Size</th>
                        <th>Avg (ms)</th>
                        <th>Min (ms)</th>
                        <th>Max (ms)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => `
                        <tr>
                            <td><strong>${r.scenario}</strong></td>
                            <td>${r.avg.toFixed(2)}</td>
                            <td>${r.min.toFixed(2)}</td>
                            <td>${r.max.toFixed(2)}</td>
                            <td class="${r.viable ? 'viable' : 'slow'}">${r.viable ? '✅ OK' : '⚠️ SLOW'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;

        if (!fs.existsSync('test-output')) {
            fs.mkdirSync('test-output');
        }

        fs.writeFileSync('test-output/performance-profile.html', html);
    }
});
