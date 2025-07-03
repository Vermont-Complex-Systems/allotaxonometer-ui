// tests/matlab-sort-optimization.test.js
import { expect, test, describe } from 'vitest';
import fs from 'fs';

// Current implementation (the slow one)
function matlab_sort_current(A, rev) {
    let sorted = rev ? A.slice().sort((a, b) => b - a) : A.slice().sort((a, b) => a - b);
    
    const A_cp = A.slice();
    const orig_idx = [];
    for (let i = 0; i < A.length; ++i) {
        orig_idx.push(A_cp.indexOf(sorted[i]));
        delete A_cp[A_cp.indexOf(sorted[i])];
    }
    
    return {'value': sorted, 'orig_idx': orig_idx};
}

// Optimized implementation
function matlab_sort_optimized(A, rev = false) {
    if (A.length === 0) return { value: [], orig_idx: [] };
    if (A.length === 1) return { value: [...A], orig_idx: [0] };
    
    // Create array of [value, originalIndex] pairs
    const indexedArray = A.map((value, index) => ({ value, index }));
    
    // Sort by value (ascending or descending)
    if (rev) {
        indexedArray.sort((a, b) => b.value - a.value);
    } else {
        indexedArray.sort((a, b) => a.value - b.value);
    }
    
    // Extract sorted values and original indices
    const value = indexedArray.map(item => item.value);
    const orig_idx = indexedArray.map(item => item.index);
    
    return { value, orig_idx };
}

describe('matlab_sort Optimization', () => {
    test('optimized version produces same results as current version', () => {
        const testCases = [
            [5, 4, 1, 2, 3],
            [1, 1, 2, 2, 3],
            [10, 20, 15],
            [],
            [42],
            [3, 1, 4, 1, 5, 9, 2, 6], // with duplicates
        ];
        
        for (const testCase of testCases) {
            const current = matlab_sort_current(testCase);
            const optimized = matlab_sort_optimized(testCase);
            
            expect(optimized.value).toEqual(current.value);
            
            // Verify that both produce valid index mappings
            for (let i = 0; i < testCase.length; i++) {
                expect(testCase[current.orig_idx[i]]).toBe(current.value[i]);
                expect(testCase[optimized.orig_idx[i]]).toBe(optimized.value[i]);
            }
        }
    });
    
    test('performance comparison with detailed timing', () => {
        const testSizes = [100, 500, 1000, 2500, 5000];
        const results = [];
        
        for (const size of testSizes) {
            const testArray = Array.from({length: size}, () => Math.floor(Math.random() * (size/10)));
            
            // Test current implementation
            const iterations = size > 2500 ? 1 : 3; // Reduce iterations for large arrays
            
            let currentTotal = 0;
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                matlab_sort_current([...testArray]);
                currentTotal += performance.now() - start;
            }
            const currentAvg = currentTotal / iterations;
            
            // Test optimized implementation
            let optimizedTotal = 0;
            for (let i = 0; i < iterations; i++) {
                const start = performance.now();
                matlab_sort_optimized([...testArray]);
                optimizedTotal += performance.now() - start;
            }
            const optimizedAvg = optimizedTotal / iterations;
            
            const speedup = currentAvg / optimizedAvg;
            
            results.push({
                size,
                current: currentAvg.toFixed(3),
                optimized: optimizedAvg.toFixed(3),
                speedup: speedup.toFixed(1)
            });
            
            console.log(`Size ${size}: Current: ${currentAvg.toFixed(3)}ms, Optimized: ${optimizedAvg.toFixed(3)}ms, Speedup: ${speedup.toFixed(1)}x`);
        }
        
        // Generate detailed report
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>matlab_sort Optimization Report</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            min-height: 100vh;
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            max-width: 1000px;
            margin: 0 auto;
        }
        .status {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
            margin-left: 15px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .speed-excellent { color: #10b981; font-weight: bold; }
        .speed-good { color: #0ea5e9; font-weight: bold; }
        .speed-ok { color: #f59e0b; font-weight: bold; }
        .speed-poor { color: #ef4444; font-weight: bold; }
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #0f172a;
        }
        .highlight {
            background: linear-gradient(90deg, #fef3c7, #fbbf24);
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #f59e0b;
        }
        .code {
            background: #1e293b;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            overflow-x: auto;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 matlab_sort Optimization Report<span class="status">✓ OPTIMIZED</span></h1>
        <p><em>Performance analysis of matlab_sort function optimization</em></p>
        
        <div class="highlight">
            <h3>🎯 Key Achievement</h3>
            <p><strong>Reduced time complexity from O(n²) to O(n log n)</strong></p>
            <p>The bottleneck was the original implementation using <code>indexOf()</code> and <code>delete</code> in a loop, creating quadratic behavior.</p>
        </div>
        
        <div class="section">
            <h3>📊 Performance Comparison Results:</h3>
            <table>
                <tr>
                    <th>Array Size</th>
                    <th>Current Version</th>
                    <th>Optimized Version</th>
                    <th>Speedup</th>
                </tr>
                ${results.map(r => {
                    const speedup = parseFloat(r.speedup);
                    const speedClass = speedup >= 50 ? 'speed-excellent' : 
                                     speedup >= 10 ? 'speed-good' : 
                                     speedup >= 3 ? 'speed-ok' : 'speed-poor';
                    return `
                    <tr>
                        <td><strong>${r.size.toLocaleString()}</strong></td>
                        <td>${r.current}ms</td>
                        <td>${r.optimized}ms</td>
                        <td class="${speedClass}">${r.speedup}x faster</td>
                    </tr>
                    `;
                }).join('')}
            </table>
        </div>

        <div class="section">
            <h3>🔧 What Was Optimized:</h3>
            <div class="code">
// OLD (O(n²) - slow):
const orig_idx = [];
for (let i = 0; i < A.length; ++i) {
    orig_idx.push(A_cp.indexOf(sorted[i]));  // O(n) lookup
    delete A_cp[A_cp.indexOf(sorted[i])];     // O(n) operation
}

// NEW (O(n log n) - fast):
const indexedArray = A.map((value, index) => ({ value, index }));
indexedArray.sort((a, b) => rev ? b.value - a.value : a.value - b.value);
const orig_idx = indexedArray.map(item => item.index);
            </div>
        </div>

        <div class="section">
            <h3>💡 Impact on Your Pipeline:</h3>
            <ul>
                <li><strong>combElems():</strong> Uses matlab_sort for sorting divergence elements</li>
                <li><strong>diamond_count():</strong> Calls matlab_sort on deltas array</li>
                <li><strong>Overall pipeline:</strong> Should see significant speedup with large datasets</li>
                <li><strong>Real-world benefit:</strong> ${results[results.length-1] ? `At 5,000 elements: ${results[results.length-1].speedup}x faster` : 'Major performance improvement'}</li>
            </ul>
        </div>

        <div class="section">
            <h3>🎯 Recommended Action:</h3>
            <p><strong>Replace the matlab_sort function in utils_helpers.js with the optimized version.</strong></p>
            <p>The optimization maintains identical output while dramatically improving performance.</p>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666;">
            <p><strong>matlab_sort Optimization Analysis</strong></p>
            <p><em>Generated: ${new Date().toLocaleString()}</em></p>
            <p>🚀 Ready to deploy optimized version!</p>
        </div>
    </div>
</body>
</html>`;

        if (!fs.existsSync('test-output')) {
            fs.mkdirSync('test-output');
        }
        
        fs.writeFileSync('test-output/matlab-sort-optimization.html', html);
        
        // Verify the speedup is significant
        const bigSpeedup = results.find(r => parseFloat(r.speedup) > 10);
        expect(bigSpeedup).toBeDefined();
        console.log('📊 Generated optimization report: test-output/matlab-sort-optimization.html');
    }, 30000); // Long timeout for performance testing
});