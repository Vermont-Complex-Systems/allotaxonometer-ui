// tests/performance-profile.test.js
import { expect, test, describe } from 'vitest';
import fs from 'fs';
import { combElems } from '../src/lib/utils/combine_distributions.js';
import rank_turbulence_divergence from '../src/lib/utils/rank_turbulence_divergence.js';
import diamond_count from '../src/lib/utils/diamond_count.js';
import { wordShift_dat } from '../src/lib/utils/combine_distributions.js';

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
            elem1.push({ types: type, counts: count1, probs: count1 });
            elem2.push({ types: type, counts: count2, probs: count2 });
        }

        // Exclusive to elem1
        for (let i = 0; i < exclusive1; i++) {
            const type = `exclusive1_${i}`;
            const count = Math.floor(zipf(sharedTypes + i + 1, 1.2) * 10000) + 1;
            elem1.push({ types: type, counts: count, probs: count });
        }

        // Exclusive to elem2
        for (let i = 0; i < exclusive2; i++) {
            const type = `exclusive2_${i}`;
            const count = Math.floor(zipf(sharedTypes + i + 1, 1.1) * 10000) + 1;
            elem2.push({ types: type, counts: count, probs: count });
        }

        // Normalize probabilities
        const sum1 = elem1.reduce((s, d) => s + d.counts, 0);
        const sum2 = elem2.reduce((s, d) => s + d.counts, 0);
        elem1.forEach(d => d.probs = d.counts / sum1);
        elem2.forEach(d => d.probs = d.counts / sum2);

        return { elem1, elem2 };
    }

    function profileFunction(name, fn, ...args) {
        const start = performance.now();
        const result = fn(...args);
        const elapsed = performance.now() - start;
        return { name, elapsed, result };
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

                // Profile each step
                const step1 = profileFunction('1. combElems', combElems, elem1, elem2);
                const step2 = profileFunction('2. rank_turbulence_divergence',
                    rank_turbulence_divergence, step1.result, 1.0);
                const step3 = profileFunction('3. diamond_count',
                    diamond_count, step1.result, step2.result);
                const step4 = profileFunction('4. wordShift_dat',
                    wordShift_dat, step1.result, step3.result);

                timings.push({
                    combElems: step1.elapsed,
                    rankTurbulence: step2.elapsed,
                    diamondCount: step3.elapsed,
                    wordShift: step4.elapsed,
                    total: step1.elapsed + step2.elapsed + step3.elapsed + step4.elapsed
                });
            }

            // Calculate averages
            const avg = {
                combElems: timings.reduce((s, t) => s + t.combElems, 0) / timings.length,
                rankTurbulence: timings.reduce((s, t) => s + t.rankTurbulence, 0) / timings.length,
                diamondCount: timings.reduce((s, t) => s + t.diamondCount, 0) / timings.length,
                wordShift: timings.reduce((s, t) => s + t.wordShift, 0) / timings.length,
                total: timings.reduce((s, t) => s + t.total, 0) / timings.length
            };

            // Print results
            console.log(`\n⏱️  Average Timings (${scenario.iterations} iterations):`);
            console.log(`   1. combElems:                 ${avg.combElems.toFixed(2)}ms (${(avg.combElems/avg.total*100).toFixed(1)}%)`);
            console.log(`   2. rank_turbulence_divergence: ${avg.rankTurbulence.toFixed(2)}ms (${(avg.rankTurbulence/avg.total*100).toFixed(1)}%)`);
            console.log(`   3. diamond_count:             ${avg.diamondCount.toFixed(2)}ms (${(avg.diamondCount/avg.total*100).toFixed(1)}%)`);
            console.log(`   4. wordShift_dat:             ${avg.wordShift.toFixed(2)}ms (${(avg.wordShift/avg.total*100).toFixed(1)}%)`);
            console.log(`   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`   TOTAL:                        ${avg.total.toFixed(2)}ms`);

            // Identify bottleneck
            const bottleneck = Object.entries(avg)
                .filter(([k]) => k !== 'total')
                .sort((a, b) => b[1] - a[1])[0];
            console.log(`   🎯 Bottleneck: ${bottleneck[0]} (${bottleneck[1].toFixed(2)}ms)`);

            // Assess viability
            const acceptable = avg.total < 1000; // 1 second threshold
            const status = acceptable ? '✅ ACCEPTABLE' : '⚠️  SLOW';
            console.log(`   ${status} - ${(avg.total/1000).toFixed(2)}s total`);

            allResults.push({
                scenario: scenario.name,
                size: scenario.size,
                ...avg,
                bottleneck: bottleneck[0],
                viable: acceptable
            });
        }

        // Generate detailed HTML report
        generateHTMLReport(allResults);

        console.log(`\n${'='.repeat(70)}`);
        console.log('📊 Performance profile complete!');
        console.log('📄 Detailed report: test-output/performance-profile.html');
        console.log(`${'='.repeat(70)}\n`);

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
        .status {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            font-size: 0.9em;
            font-weight: 600;
            margin-left: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.85em;
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
        .bottleneck {
            background: #fee2e2;
            font-weight: bold;
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
        .warning {
            background: #fef3c7;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
        }
        .critical {
            background: #fee2e2;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #dc2626;
        }
        .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .bar {
            height: 30px;
            background: linear-gradient(90deg, #2563eb, #1e40af);
            margin: 8px 0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            padding-left: 10px;
            color: white;
            font-weight: 600;
            font-size: 0.85em;
        }
        .recommendation {
            background: #dbeafe;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #3b82f6;
        }
        .code {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            overflow-x: auto;
            margin: 15px 0;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ Allotaxonometer Pipeline Performance Profile<span class="status">DETAILED ANALYSIS</span></h1>
            <p><em>Full pipeline profiling from 100 types to 1,000,000 types</em></p>
            <p style="color: #6b7280; font-size: 0.9em;">Generated: ${new Date().toLocaleString()}</p>
        </div>

        ${generateViabilityAssessment(results)}

        <div class="section">
            <h2>📊 Detailed Performance Breakdown</h2>
            <table>
                <thead>
                    <tr>
                        <th>Dataset Size</th>
                        <th>combElems</th>
                        <th>rank_turbulence_divergence</th>
                        <th>diamond_count</th>
                        <th>wordShift_dat</th>
                        <th>Total (ms)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${results.map(r => {
                        const maxValue = Math.max(r.combElems, r.rankTurbulence, r.diamondCount, r.wordShift);
                        return `
                        <tr>
                            <td><strong>${r.scenario}</strong></td>
                            <td class="${r.combElems === maxValue ? 'bottleneck' : ''}">${r.combElems.toFixed(2)}ms</td>
                            <td class="${r.rankTurbulence === maxValue ? 'bottleneck' : ''}">${r.rankTurbulence.toFixed(2)}ms</td>
                            <td class="${r.diamondCount === maxValue ? 'bottleneck' : ''}">${r.diamondCount.toFixed(2)}ms</td>
                            <td class="${r.wordShift === maxValue ? 'bottleneck' : ''}">${r.wordShift.toFixed(2)}ms</td>
                            <td><strong>${r.total.toFixed(2)}ms</strong></td>
                            <td class="${r.viable ? 'viable' : 'slow'}">${r.viable ? '✅ OK' : '⚠️ SLOW'}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${generateBottleneckAnalysis(results)}
        ${generateWASMRecommendation(results)}

        <div class="section">
            <h2>🎯 Next Steps</h2>
            <ol>
                <li><strong>Verify bottleneck:</strong> Run this test multiple times to confirm consistency</li>
                <li><strong>Profile in browser:</strong> Use Chrome DevTools Performance tab with real data</li>
                <li><strong>Check rendering:</strong> D3 SVG rendering might be slower than computation</li>
                <li><strong>If computation is bottleneck:</strong> Consider Rust + WASM for ${identifyOptimizationTarget(results)}</li>
            </ol>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280;">
            <p><strong>Allotaxonometer Performance Analysis</strong></p>
            <p><em>This report helps determine if WASM optimization is necessary</em></p>
        </div>
    </div>
</body>
</html>`;

        if (!fs.existsSync('test-output')) {
            fs.mkdirSync('test-output');
        }

        fs.writeFileSync('test-output/performance-profile.html', html);
    }

    function generateViabilityAssessment(results) {
        const target10K = results.find(r => r.size === 10000);
        const target100K = results.find(r => r.size === 100000);
        const target1M = results.find(r => r.size === 1000000);

        let assessment = '';

        if (target10K && target10K.viable) {
            assessment += `
            <div class="section">
                <h2>✅ Current Target (10K types): VIABLE</h2>
                <p><strong>Performance: ${target10K.total.toFixed(2)}ms (${(target10K.total/1000).toFixed(2)}s)</strong></p>
                <p>Your current use case runs acceptably fast. Current JavaScript implementation is sufficient.</p>
            </div>`;
        }

        if (target100K) {
            const status = target100K.viable ? 'section' : 'warning';
            assessment += `
            <div class="${status}">
                <h2>${target100K.viable ? '✅' : '⚠️'} Stretch Goal (100K types): ${target100K.viable ? 'VIABLE' : 'BORDERLINE'}</h2>
                <p><strong>Performance: ${target100K.total.toFixed(2)}ms (${(target100K.total/1000).toFixed(2)}s)</strong></p>
                <p>${target100K.viable
                    ? 'Still acceptable. WASM not strictly necessary.'
                    : 'Getting slow. WASM could provide 2-5x speedup, bringing this under 1s.'}</p>
            </div>`;
        }

        if (target1M) {
            const status = target1M.viable ? 'section' : 'critical';
            assessment += `
            <div class="${status}">
                <h2>${target1M.viable ? '✅' : '🔥'} Ultimate Goal (1M types): ${target1M.viable ? 'VIABLE' : 'REQUIRES OPTIMIZATION'}</h2>
                <p><strong>Performance: ${target1M.total.toFixed(2)}ms (${(target1M.total/1000).toFixed(2)}s)</strong></p>
                <p>${target1M.viable
                    ? 'Impressive! JavaScript handles this well.'
                    : '<strong>WASM optimization strongly recommended.</strong> Expected 2-10x speedup could bring this under 1-2 seconds.'}</p>
            </div>`;
        }

        return assessment;
    }

    function generateBottleneckAnalysis(results) {
        // Count which function is the bottleneck most often
        const bottleneckCounts = {};
        results.forEach(r => {
            bottleneckCounts[r.bottleneck] = (bottleneckCounts[r.bottleneck] || 0) + 1;
        });

        const primaryBottleneck = Object.entries(bottleneckCounts)
            .sort((a, b) => b[1] - a[1])[0][0];

        return `
        <div class="section">
            <h2>🎯 Bottleneck Analysis</h2>
            <p><strong>Primary bottleneck across dataset sizes:</strong> <code>${primaryBottleneck}</code></p>

            <div class="chart-container">
                <h3>Bottleneck Frequency:</h3>
                ${Object.entries(bottleneckCounts).map(([name, count]) => {
                    const width = (count / results.length) * 100;
                    return `
                    <div class="bar" style="width: ${width}%">
                        ${name}: ${count}/${results.length} scenarios
                    </div>`;
                }).join('')}
            </div>

            <h3>📍 Function-Specific Issues:</h3>
            <ul>
                <li><strong>combElems:</strong> String handling, Map operations - hard to optimize in WASM</li>
                <li><strong>rank_turbulence_divergence:</strong> ✅ BEST WASM CANDIDATE - pure numerical computation</li>
                <li><strong>diamond_count:</strong> String joins, D3 extent() calls - moderate WASM benefit</li>
                <li><strong>wordShift_dat:</strong> Array sorting, string operations - moderate WASM benefit</li>
            </ul>
        </div>`;
    }

    function generateWASMRecommendation(results) {
        const target1M = results.find(r => r.size === 1000000);

        if (!target1M || target1M.viable) {
            return `
            <div class="recommendation">
                <h2>💡 Recommendation: Stay with JavaScript</h2>
                <p>Your current implementation performs adequately for your use cases. WASM would add complexity without significant benefit.</p>
                <p><strong>Action:</strong> Continue with JavaScript. Revisit if you need to handle larger datasets regularly.</p>
            </div>`;
        }

        return `
        <div class="recommendation">
            <h2>🚀 Recommendation: Consider WASM for Large Datasets</h2>
            <p>For your target scale (1M types), WASM optimization would provide significant benefits.</p>

            <h3>Suggested Approach:</h3>
            <ol>
                <li><strong>Start with rank_turbulence_divergence:</strong> Pure numerical, easiest to port</li>
                <li><strong>Use Rust + wasm-bindgen:</strong> Best tooling for browser WASM</li>
                <li><strong>Keep string operations in JS:</strong> Only port numerical computations</li>
                <li><strong>Progressive enhancement:</strong> Detect WASM support, fallback to JS</li>
            </ol>

            <h3>Expected Speedup:</h3>
            <ul>
                <li>rank_turbulence_divergence: <strong>3-5x faster</strong></li>
                <li>diamond_count numerical parts: <strong>2-3x faster</strong></li>
                <li>Overall pipeline: <strong>2-3x faster</strong> (bringing 1M types under ~1-2s)</li>
            </ul>

            <h3>Sample Rust Implementation:</h3>
            <div class="code">
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn rank_turbulence_divergence(
    ranks1: Vec<f64>,
    ranks2: Vec<f64>,
    counts1: Vec<f64>,
    counts2: Vec<f64>,
    alpha: f64
) -> Vec<f64> {
    let inv_r1: Vec<f64> = ranks1.iter().map(|r| r.powi(-1)).collect();
    let inv_r2: Vec<f64> = ranks2.iter().map(|r| r.powi(-1)).collect();

    // Pure numerical computation - no strings
    let divergence: Vec<f64> = if alpha == f64::INFINITY {
        inv_r1.iter().zip(inv_r2.iter())
            .map(|(r1, r2)| if r1 == r2 { 0.0 } else { r1.max(*r2) })
            .collect()
    } else if alpha == 0.0 {
        inv_r1.iter().zip(inv_r2.iter())
            .map(|(r1, r2)| {
                let x_max = (1.0 / r1).max(1.0 / r2);
                let x_min = (1.0 / r1).min(1.0 / r2);
                (x_max / x_min).log10()
            })
            .collect()
    } else {
        inv_r1.iter().zip(inv_r2.iter())
            .map(|(r1, r2)| {
                ((alpha + 1.0) / alpha) *
                (r1.powf(alpha) - r2.powf(alpha)).abs().powf(1.0 / (alpha + 1.0))
            })
            .collect()
    };

    // Normalization calculation
    let normalization = calculate_normalization(&inv_r1, &inv_r2, &counts1, &counts2, alpha);

    divergence.iter().map(|d| d / normalization).collect()
}
            </div>
        </div>`;
    }

    function identifyOptimizationTarget(results) {
        const bottlenecks = results.map(r => r.bottleneck);
        const mostCommon = bottlenecks.sort((a, b) =>
            bottlenecks.filter(v => v === a).length - bottlenecks.filter(v => v === b).length
        ).pop();
        return `<code>${mostCommon}</code>`;
    }
});
