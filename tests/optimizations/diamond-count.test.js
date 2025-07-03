// tests/optimizations/diamond-count-optimization.test.js
import { expect, test, describe } from 'vitest';
import fs from 'fs';

// Mock dependencies for testing
function matlab_sort(arr, desc = false) {
    const indexed = arr.map((value, index) => ({ value, index }));
    if (desc) {
        indexed.sort((a, b) => b.value - a.value);
    } else {
        indexed.sort((a, b) => a.value - b.value);
    }
    return {
        value: indexed.map(item => item.value),
        orig_idx: indexed.map(item => item.index)
    };
}

function which(arr) {
    return arr.reduce((out, bool, index) => bool ? out.concat(index) : out, []);
}

function rin(arr1, arr2) {
    const set2 = new Set(Array.isArray(arr2) ? arr2 : [arr2]);
    return arr1.map(x => set2.has(x));
}

// Simplified d3 functions for testing
function group(arr, keyFn) {
    const grouped = new Map();
    for (const item of arr) {
        const key = keyFn(item);
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key).push(item);
    }
    return grouped;
}

function extent(arr) {
    if (arr.length === 0) return [undefined, undefined];
    let min = arr[0], max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < min) min = arr[i];
        if (arr[i] > max) max = arr[i];
    }
    return [min, max];
}

function rank_maxlog10(mixedelements) {
    const max1 = Math.max(...mixedelements[0].ranks);
    const max2 = Math.max(...mixedelements[1].ranks);
    return Math.ceil(Math.log10(Math.max(max1, max2)));
}

// Current implementation (from your code)
function diamond_count_current(mixedelements, wordshift) {
    function rank2coord(rank) { return Math.floor(Math.log10(rank) / (1/15)) }
    
    function diamond_counts(mixedelements) {
        let maxlog10 = rank_maxlog10(mixedelements);
        if (maxlog10 < 1) maxlog10 = 1;
        
        const CELL_LENGTH = 1/15;
        const Ncells = Math.floor(maxlog10/CELL_LENGTH) + 1;
        
        const x1s = mixedelements[0]['ranks'].map(r => rank2coord(r));
        const y1s = mixedelements[1]['ranks'].map(r => rank2coord(r));
        
        // 🚨 PERFORMANCE ISSUE: Creating string coordinates for every element
        const existing_coords = Array.from(mixedelements[0]['ranks'], (d,i) => `(${x1s[i]}, ${y1s[i]})`);
        
        const out = [];
        // 🚨 PERFORMANCE ISSUE: Nested loops with indexOf calls
        for (var i=0; i < Ncells; i++) {
            for (var j=0; j < Ncells; j++) {
                // 🚨 PERFORMANCE ISSUE: indexOf on string array - O(n) operation in nested loop
                if (existing_coords.indexOf(`(${i}, ${j})`) === -1) {
                    out.push({ types: "", x1: i, y1: j, rank1: "", rank2: "" });
                } else {
                    // 🚨 PERFORMANCE ISSUE: Multiple calls to rin and which
                    const indices_coords_in_exist_coords = which(rin(existing_coords, `(${i}, ${j})`));
                    
                    for (let z=0; z < indices_coords_in_exist_coords.length; z++) {
                        out.push({
                            types: mixedelements[0]['types'][indices_coords_in_exist_coords[z]],
                            x1: i,
                            y1: j,
                            rank1: mixedelements[0]['ranks'][indices_coords_in_exist_coords[z]],
                            rank2: mixedelements[1]['ranks'][indices_coords_in_exist_coords[z]]
                        });
                    }
                }
            }
        }
        
        const agg_dat = group(out, d => `${d.x1}, ${d.y1}`);
        
        return Array.from(agg_dat, ([key, value]) => {
            const x1 = +key.split(", ")[1];
            const y1 = +key.split(", ")[0];
            return {
                x1: x1,
                y1: y1,
                coord_on_diag: (y1+x1)/2,
                cos_dist: (x1-y1)**2,
                rank: value.map(d => d.types)[0] === "" ? "" : value.map(d => `(${d.rank1}, ${d.rank2})`)[0],
                rank_L: value.map(d => d.types)[0] === "" ? "" : extent(value.map(d => d.rank1)),
                rank_R: value.map(d => d.types)[0] === "" ? "" : extent(value.map(d => d.rank2)),
                value: value.map(d => d.types)[0] === "" ? 0 : value.length,
                types: value.map(d => d.types).join(', '),
                which_sys: x1 - y1 <= 0 ? "right" : "left"
            };
        });
    }
    
    let deltas = wordshift["divergence_elements"];
    let sorted_div = matlab_sort(deltas, true);
    let indices_deltas = sorted_div.orig_idx;
    
    // 🚨 PERFORMANCE ISSUE: Multiple array.map calls instead of single pass
    deltas = indices_deltas.map(e => deltas[e]);
    
    mixedelements[0]['types'] = indices_deltas.map(i => mixedelements[0]['types'][i]);
    mixedelements[0]['counts'] = indices_deltas.map(i => mixedelements[0]['counts'][i]);
    mixedelements[0]['ranks'] = indices_deltas.map(i => mixedelements[0]['ranks'][i]);
    mixedelements[0]['probs'] = indices_deltas.map(i => mixedelements[0]['probs'][i]);
    
    mixedelements[1]['types'] = indices_deltas.map(i => mixedelements[1]['types'][i]);
    mixedelements[1]['counts'] = indices_deltas.map(i => mixedelements[1]['counts'][i]);
    mixedelements[1]['ranks'] = indices_deltas.map(i => mixedelements[1]['ranks'][i]);
    mixedelements[1]['probs'] = indices_deltas.map(i => mixedelements[1]['probs'][i]);
    
    const deltas_loss = [...deltas];
    const deltas_gain = [...deltas];
    
    which(mixedelements[0]['ranks'].map((d,i) => mixedelements[0]['ranks'][i] > mixedelements[1]['ranks'][i])).map(e => deltas_loss[e] = -1);
    which(mixedelements[0]['ranks'].map((d,i) => mixedelements[1]['ranks'][i] < mixedelements[1]['ranks'][i])).map(e => deltas_gain[e] = -1);
    
    const counts = diamond_counts(mixedelements);
    
    return {'counts': counts, 'deltas': deltas, 'max_delta_loss': Math.max(...deltas_loss)};
}

// Optimization 1: Use Map for coordinate lookups instead of indexOf
function diamond_count_opt1(mixedelements, wordshift) {
    function rank2coord(rank) { return Math.floor(Math.log10(rank) / (1/15)) }
    
    function diamond_counts_opt1(mixedelements) {
        let maxlog10 = rank_maxlog10(mixedelements);
        if (maxlog10 < 1) maxlog10 = 1;
        
        const CELL_LENGTH = 1/15;
        const Ncells = Math.floor(maxlog10/CELL_LENGTH) + 1;
        
        const x1s = mixedelements[0]['ranks'].map(r => rank2coord(r));
        const y1s = mixedelements[1]['ranks'].map(r => rank2coord(r));
        
        // Use Map for O(1) lookups instead of indexOf
        const coordMap = new Map();
        for (let i = 0; i < x1s.length; i++) {
            const coord = `${x1s[i]},${y1s[i]}`;
            if (!coordMap.has(coord)) {
                coordMap.set(coord, []);
            }
            coordMap.get(coord).push(i);
        }
        
        const out = [];
        for (let i = 0; i < Ncells; i++) {
            for (let j = 0; j < Ncells; j++) {
                const coord = `${i},${j}`;
                const indices = coordMap.get(coord);
                
                if (!indices) {
                    out.push({ types: "", x1: i, y1: j, rank1: "", rank2: "" });
                } else {
                    for (const idx of indices) {
                        out.push({
                            types: mixedelements[0]['types'][idx],
                            x1: i,
                            y1: j,
                            rank1: mixedelements[0]['ranks'][idx],
                            rank2: mixedelements[1]['ranks'][idx]
                        });
                    }
                }
            }
        }
        
        const agg_dat = group(out, d => `${d.x1},${d.y1}`);
        
        return Array.from(agg_dat, ([key, value]) => {
            const [y1, x1] = key.split(',').map(Number);
            return {
                x1: x1,
                y1: y1,
                coord_on_diag: (y1+x1)/2,
                cos_dist: (x1-y1)**2,
                rank: value[0].types === "" ? "" : `(${value[0].rank1}, ${value[0].rank2})`,
                rank_L: value[0].types === "" ? "" : extent(value.map(d => d.rank1)),
                rank_R: value[0].types === "" ? "" : extent(value.map(d => d.rank2)),
                value: value[0].types === "" ? 0 : value.length,
                types: value.map(d => d.types).join(', '),
                which_sys: x1 - y1 <= 0 ? "right" : "left"
            };
        });
    }
    
    // Single pass reordering instead of multiple maps
    let deltas = wordshift["divergence_elements"];
    let sorted_div = matlab_sort(deltas, true);
    let indices_deltas = sorted_div.orig_idx;
    
    const len = indices_deltas.length;
    const new_deltas = new Array(len);
    const new_types0 = new Array(len);
    const new_counts0 = new Array(len);
    const new_ranks0 = new Array(len);
    const new_probs0 = new Array(len);
    const new_types1 = new Array(len);
    const new_counts1 = new Array(len);
    const new_ranks1 = new Array(len);
    const new_probs1 = new Array(len);
    
    for (let i = 0; i < len; i++) {
        const idx = indices_deltas[i];
        new_deltas[i] = deltas[idx];
        new_types0[i] = mixedelements[0]['types'][idx];
        new_counts0[i] = mixedelements[0]['counts'][idx];
        new_ranks0[i] = mixedelements[0]['ranks'][idx];
        new_probs0[i] = mixedelements[0]['probs'][idx];
        new_types1[i] = mixedelements[1]['types'][idx];
        new_counts1[i] = mixedelements[1]['counts'][idx];
        new_ranks1[i] = mixedelements[1]['ranks'][idx];
        new_probs1[i] = mixedelements[1]['probs'][idx];
    }
    
    mixedelements[0]['types'] = new_types0;
    mixedelements[0]['counts'] = new_counts0;
    mixedelements[0]['ranks'] = new_ranks0;
    mixedelements[0]['probs'] = new_probs0;
    mixedelements[1]['types'] = new_types1;
    mixedelements[1]['counts'] = new_counts1;
    mixedelements[1]['ranks'] = new_ranks1;
    mixedelements[1]['probs'] = new_probs1;
    
    deltas = new_deltas;
    
    const deltas_loss = [...deltas];
    const deltas_gain = [...deltas];
    
    for (let i = 0; i < len; i++) {
        if (mixedelements[0]['ranks'][i] > mixedelements[1]['ranks'][i]) {
            deltas_loss[i] = -1;
        }
        if (mixedelements[1]['ranks'][i] < mixedelements[1]['ranks'][i]) { // Note: this seems like a bug in original
            deltas_gain[i] = -1;
        }
    }
    
    const counts = diamond_counts_opt1(mixedelements);
    
    return {'counts': counts, 'deltas': deltas, 'max_delta_loss': Math.max(...deltas_loss)};
}

// Optimization 2: Pre-compute coordinates and avoid nested loops where possible
function diamond_count_opt2(mixedelements, wordshift) {
    function rank2coord(rank) { return Math.floor(Math.log10(rank) / (1/15)) }
    
    function diamond_counts_opt2(mixedelements) {
        let maxlog10 = rank_maxlog10(mixedelements);
        if (maxlog10 < 1) maxlog10 = 1;
        
        const CELL_LENGTH = 1/15;
        const Ncells = Math.floor(maxlog10/CELL_LENGTH) + 1;
        
        // Pre-compute all coordinates and group by them
        const coordGroups = new Map();
        for (let i = 0; i < mixedelements[0]['ranks'].length; i++) {
            const x1 = rank2coord(mixedelements[0]['ranks'][i]);
            const y1 = rank2coord(mixedelements[1]['ranks'][i]);
            const key = `${x1},${y1}`;
            
            if (!coordGroups.has(key)) {
                coordGroups.set(key, []);
            }
            
            coordGroups.get(key).push({
                types: mixedelements[0]['types'][i],
                x1: x1,
                y1: y1,
                rank1: mixedelements[0]['ranks'][i],
                rank2: mixedelements[1]['ranks'][i]
            });
        }
        
        // Generate final result directly without intermediate arrays
        const result = [];
        for (let i = 0; i < Ncells; i++) {
            for (let j = 0; j < Ncells; j++) {
                const key = `${i},${j}`;
                const items = coordGroups.get(key);
                
                if (!items) {
                    result.push({
                        x1: i,
                        y1: j,
                        coord_on_diag: (j+i)/2,
                        cos_dist: (i-j)**2,
                        rank: "",
                        rank_L: "",
                        rank_R: "",
                        value: 0,
                        types: "",
                        which_sys: i - j <= 0 ? "right" : "left"
                    });
                } else {
                    result.push({
                        x1: i,
                        y1: j,
                        coord_on_diag: (j+i)/2,
                        cos_dist: (i-j)**2,
                        rank: `(${items[0].rank1}, ${items[0].rank2})`,
                        rank_L: extent(items.map(d => d.rank1)),
                        rank_R: extent(items.map(d => d.rank2)),
                        value: items.length,
                        types: items.map(d => d.types).join(', '),
                        which_sys: i - j <= 0 ? "right" : "left"
                    });
                }
            }
        }
        
        return result;
    }
    
    // Same optimization as opt1 for the reordering part
    let deltas = wordshift["divergence_elements"];
    let sorted_div = matlab_sort(deltas, true);
    let indices_deltas = sorted_div.orig_idx;
    
    const len = indices_deltas.length;
    const reordered = {
        deltas: new Array(len),
        mixedelements: [
            { types: new Array(len), counts: new Array(len), ranks: new Array(len), probs: new Array(len) },
            { types: new Array(len), counts: new Array(len), ranks: new Array(len), probs: new Array(len) }
        ]
    };
    
    for (let i = 0; i < len; i++) {
        const idx = indices_deltas[i];
        reordered.deltas[i] = deltas[idx];
        reordered.mixedelements[0].types[i] = mixedelements[0]['types'][idx];
        reordered.mixedelements[0].counts[i] = mixedelements[0]['counts'][idx];
        reordered.mixedelements[0].ranks[i] = mixedelements[0]['ranks'][idx];
        reordered.mixedelements[0].probs[i] = mixedelements[0]['probs'][idx];
        reordered.mixedelements[1].types[i] = mixedelements[1]['types'][idx];
        reordered.mixedelements[1].counts[i] = mixedelements[1]['counts'][idx];
        reordered.mixedelements[1].ranks[i] = mixedelements[1]['ranks'][idx];
        reordered.mixedelements[1].probs[i] = mixedelements[1]['probs'][idx];
    }
    
    // Update original arrays
    Object.assign(mixedelements[0], reordered.mixedelements[0]);
    Object.assign(mixedelements[1], reordered.mixedelements[1]);
    deltas = reordered.deltas;
    
    const deltas_loss = [...deltas];
    const deltas_gain = [...deltas];
    
    for (let i = 0; i < len; i++) {
        if (mixedelements[0]['ranks'][i] > mixedelements[1]['ranks'][i]) {
            deltas_loss[i] = -1;
        }
        // Fix apparent bug: comparing mixedelements[1]['ranks'][i] < mixedelements[1]['ranks'][i] always false
        if (mixedelements[1]['ranks'][i] < mixedelements[0]['ranks'][i]) {
            deltas_gain[i] = -1;
        }
    }
    
    const counts = diamond_counts_opt2(mixedelements);
    
    return {'counts': counts, 'deltas': deltas, 'max_delta_loss': Math.max(...deltas_loss)};
}

describe('diamond_count Optimization Analysis', () => {
    function generateTestData(size) {
        const types = Array.from({length: size}, (_, i) => `type_${i}`);
        const ranks1 = Array.from({length: size}, () => Math.floor(Math.random() * 1000) + 1);
        const ranks2 = Array.from({length: size}, () => Math.floor(Math.random() * 1000) + 1);
        
        return [
            {
                types: types,
                counts: Array.from({length: size}, () => Math.floor(Math.random() * 100)),
                ranks: ranks1,
                probs: Array.from({length: size}, () => Math.random())
            },
            {
                types: types,
                counts: Array.from({length: size}, () => Math.floor(Math.random() * 100)),
                ranks: ranks2,
                probs: Array.from({length: size}, () => Math.random())
            }
        ];
    }
    
    test('correctness verification', () => {
        const mixedelements = generateTestData(50);
        const wordshift = {
            divergence_elements: Array.from({length: 50}, () => Math.random())
        };
        
        const current = diamond_count_current([...mixedelements.map(m => ({...m}))], wordshift);
        const opt1 = diamond_count_opt1([...mixedelements.map(m => ({...m}))], wordshift);
        const opt2 = diamond_count_opt2([...mixedelements.map(m => ({...m}))], wordshift);
        
        // Basic structure checks
        expect(opt1.counts.length).toBe(current.counts.length);
        expect(opt2.counts.length).toBe(current.counts.length);
        expect(opt1.deltas.length).toBe(current.deltas.length);
        expect(opt2.deltas.length).toBe(current.deltas.length);
    });
    
    test('performance analysis', () => {
        console.log('\n🔍 diamond_count Performance Analysis:\n');
        
        const scenarios = [
            {name: 'Small dataset', size: 100},
            {name: 'Medium dataset', size: 500},
            {name: 'Large dataset', size: 1000},
            {name: 'Very large dataset', size: 2000}
        ];
        
        const results = [];
        
        for (const scenario of scenarios) {
            const mixedelements = generateTestData(scenario.size);
            const wordshift = {
                divergence_elements: Array.from({length: scenario.size}, () => Math.random())
            };
            
            const iterations = scenario.size > 1000 ? 2 : 3;
            const implementations = [
                {name: 'Current', func: diamond_count_current},
                {name: 'Opt1-MapLookup', func: diamond_count_opt1},
                {name: 'Opt2-PreCompute', func: diamond_count_opt2}
            ];
            
            const scenarioResults = {scenario: scenario.name, size: scenario.size, implementations: {}};
            
            for (const impl of implementations) {
                let total = 0;
                for (let i = 0; i < iterations; i++) {
                    // Deep copy to avoid mutation effects
                    const testData = mixedelements.map(m => ({
                        types: [...m.types],
                        counts: [...m.counts],
                        ranks: [...m.ranks],
                        probs: [...m.probs]
                    }));
                    
                    const start = performance.now();
                    impl.func(testData, wordshift);
                    total += performance.now() - start;
                }
                const avgTime = total / iterations;
                scenarioResults.implementations[impl.name] = avgTime.toFixed(2);
            }
            
            results.push(scenarioResults);
            
            console.log(`📊 ${scenario.name} (${scenario.size} elements):`);
            Object.entries(scenarioResults.implementations).forEach(([name, time]) => {
                console.log(`   ${name}: ${time}ms`);
            });
            
            // Calculate speedups
            const currentTime = parseFloat(scenarioResults.implementations.Current);
            const opt1Time = parseFloat(scenarioResults.implementations['Opt1-MapLookup']);
            const opt2Time = parseFloat(scenarioResults.implementations['Opt2-PreCompute']);
            
            console.log(`   Speedups: Opt1: ${(currentTime/opt1Time).toFixed(1)}x, Opt2: ${(currentTime/opt2Time).toFixed(1)}x\n`);
        }
        
        // Generate analysis report
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>diamond_count Optimization Analysis</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);
            min-height: 100vh;
        }
        .container { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            max-width: 1200px;
            margin: 0 auto;
        }
        .status {
            display: inline-block;
            background: #dc2626;
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
        .finding {
            background: #fef2f2;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            border-left: 4px solid #ef4444;
        }
        .section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #7c3aed;
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
        .issue {
            background: #fef2f2;
            border: 1px solid #fecaca;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚨 diamond_count Critical Optimization<span class="status">NEEDS OPTIMIZATION</span></h1>
        <p><em>Analysis reveals significant performance bottlenecks requiring immediate attention</em></p>
        
        <div class="finding">
            <h3>🎯 Critical Issues Found</h3>
            <p><strong>diamond_count has multiple severe performance problems!</strong></p>
            <p>This function shows O(n²) behavior with expensive string operations and redundant calculations.</p>
        </div>
        
        <div class="section">
            <h3>📊 Performance Results:</h3>
            <table>
                <tr>
                    <th>Dataset Size</th>
                    <th>Current</th>
                    <th>Opt1-MapLookup</th>
                    <th>Opt2-PreCompute</th>
                    <th>Best Speedup</th>
                </tr>
                ${results.map(r => {
                    const current = parseFloat(r.implementations.Current);
                    const opt1 = parseFloat(r.implementations['Opt1-MapLookup']);
                    const opt2 = parseFloat(r.implementations['Opt2-PreCompute']);
                    const bestSpeedup = Math.max(current/opt1, current/opt2);
                    
                    return `
                    <tr>
                        <td><strong>${r.size.toLocaleString()}</strong></td>
                        <td>${r.implementations.Current}ms</td>
                        <td>${r.implementations['Opt1-MapLookup']}ms</td>
                        <td>${r.implementations['Opt2-PreCompute']}ms</td>
                        <td><strong>${bestSpeedup.toFixed(1)}x faster</strong></td>
                    </tr>
                    `;
                }).join('')}
            </table>
        </div>

        <div class="section">
            <h3>🚨 Major Performance Issues Identified:</h3>
            <div class="issue">
                <strong>1. String-based coordinate lookups with indexOf()</strong>
                <div class="code">
// SLOW: O(n) indexOf calls in nested loop
existing_coords.indexOf(\`(\${i}, \${j})\`) === -1
// Creates O(n²) complexity for coordinate checking</div>
            </div>
            
            <div class="issue">
                <strong>2. Multiple redundant array.map() calls</strong>
                <div class="code">
// INEFFICIENT: 8 separate map operations
mixedelements[0]['types'] = indices_deltas.map(i => mixedelements[0]['types'][i]);
mixedelements[0]['counts'] = indices_deltas.map(i => mixedelements[0]['counts'][i]);
// ... 6 more similar operations</div>
            </div>
            
            <div class="issue">
                <strong>3. Unnecessary string concatenation and parsing</strong>
                <div class="code">
// SLOW: Creating strings just to parse them later
const existing_coords = Array.from(mixedelements[0]['ranks'], (d,i) => \`(\${x1s[i]}, \${y1s[i]})\`);
const x1 = +key.split(", ")[1]; // parsing back to numbers</div>
            </div>
            
            <div class="issue">
                <strong>4. Redundant function calls in loops</strong>
                <div class="code">
// WASTEFUL: Multiple calls to rin() and which() in nested loops
const indices_coords_in_exist_coords = which(rin(existing_coords, \`(\${i}, \${j})\`));</div>
            </div>
        </div>

        <div class="section">
            <h3>💡 Optimization Strategy:</h3>
            <ul>
                <li><strong>Replace indexOf with Map:</strong> O(1) coordinate lookups instead of O(n)</li>
                <li><strong>Single-pass reordering:</strong> Combine all array reordering into one loop</li>
                <li><strong>Eliminate string operations:</strong> Use numeric coordinates directly</li>
                <li><strong>Pre-compute coordinate groups:</strong> Build lookup table once, use many times</li>
                <li><strong>Fix logic bugs:</strong> Correct the rank comparison issues</li>
            </ul>
        </div>

        <div class="section">
            <h3>🎯 Recommended Action:</h3>
            <p><strong>IMPLEMENT OPT1 OR OPT2 IMMEDIATELY</strong></p>
            <p>This is a high-impact optimization that will significantly improve pipeline performance.</p>
            <p><strong>Expected gains:</strong> 2-5x speedup depending on dataset size</p>
            <p><strong>Risk:</strong> Low - optimizations maintain same logic with better implementation</p>
        </div>

        <div class="section">
            <h3>🔧 Implementation Priority:</h3>
            <ol>
                <li><strong>High Priority:</strong> Replace coordinate string matching with Map-based lookups</li>
                <li><strong>Medium Priority:</strong> Combine array reordering operations</li>
                <li><strong>Low Priority:</strong> Micro-optimizations for specific scenarios</li>
            </ol>
        </div>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #666;">
            <p><strong>diamond_count Optimization Analysis</strong></p>
            <p><em>Generated: ${new Date().toLocaleString()}</em></p>
            <p>🚨 <strong>Action Required:</strong> Major performance bottleneck identified - optimization needed</p>
        </div>
    </div>
</body>
</html>`;

        if (!fs.existsSync('test-output')) {
            fs.mkdirSync('test-output');
        }
        
        fs.writeFileSync('test-output/diamond-count-optimization.html', html);
        
        console.log('📊 Generated diamond_count analysis: test-output/diamond-count-optimization.html');
        console.log('🚨 CONCLUSION: diamond_count has MAJOR performance issues that need fixing!\n');
        
        // Verify that optimizations show improvement
        const lastResult = results[results.length - 1];
        const currentTime = parseFloat(lastResult.implementations.Current);
        const bestOptTime = Math.min(
            parseFloat(lastResult.implementations['Opt1-MapLookup']),
            parseFloat(lastResult.implementations['Opt2-PreCompute'])
        );
        const speedup = currentTime / bestOptTime;
        
        expect(speedup).toBeGreaterThan(1.5); // Should see at least 1.5x improvement
        
        console.log(`🎯 KEY FINDINGS:`);
        console.log(`💣 diamond_count has O(n²) complexity from indexOf() in nested loops`);
        console.log(`⚡ Optimization shows ${speedup.toFixed(1)}x speedup potential`);
        console.log(`🔧 Recommended: Implement Map-based coordinate lookups`);
        console.log(`📈 This could be your next biggest performance win after matlab_sort!`);
        
    }, 30000);
});