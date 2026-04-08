#!/usr/bin/env node
// Diagnostic: compare wordshift output between the pure-JS pipeline and the
// Rust/WASM pipeline for the same input. Helps isolate whether any observed
// discrepancies are in the WASM layer or elsewhere.
//
// Usage:
//   node scripts/wordshift-compare.mjs               # boys-1895 vs boys-1968, alpha=0.17
//   node scripts/wordshift-compare.mjs 0.5           # custom alpha
//   node scripts/wordshift-compare.mjs 0.17 20       # alpha + top-N

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  combElems,
  wordShift_dat,
  balanceDat,
} from '../src/lib/utils/combine_distributions.js';
import diamond_count from '../src/lib/utils/diamond_count.js';
import { rank_turbulence_divergence } from '../src/lib/utils/pipeline.js';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const alpha = Number(process.argv[2] ?? 0.17);
const topN = Number(process.argv[3] ?? 15);

const sys1 = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tests/fixtures/boys-1895.json'), 'utf8')
);
const sys2 = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tests/fixtures/boys-1968.json'), 'utf8')
);

console.log(`fixtures: boys-1895 (${sys1.length}) vs boys-1968 (${sys2.length})`);
console.log(`alpha=${alpha}  top=${topN}`);
console.log('');

// ---------------------------------------------------------------------------
// Pure-JS pipeline (reference)
// ---------------------------------------------------------------------------

function runJS(s1, s2, a) {
  const me = combElems(s1, s2);
  const rtd = rank_turbulence_divergence(me, a);
  const dat = diamond_count(me, rtd); // mutates me to reordered
  const barData = wordShift_dat(me, dat);
  // Import balanceDat lazily so the script still works if it's missing
  // eslint-disable-next-line
  return { barData, rtd, dat, me };
}

// ---------------------------------------------------------------------------
// WASM pipeline
// ---------------------------------------------------------------------------

async function runWasm(s1, s2, a) {
  const mod = await import('../src/lib/utils/wasm/allotaxonometer_wasm.js');
  // Manually fetch wasm binary from disk: Node's fetch() supports file: URLs
  // but wasm-pack's default loader expects a URL relative to import.meta.url,
  // which works if we pass it through.
  const wasmUrl = new URL(
    '../src/lib/utils/wasm/allotaxonometer_wasm_bg.wasm',
    import.meta.url
  );
  const wasmBytes = fs.readFileSync(wasmUrl);
  await mod.default({ module_or_path: wasmBytes });

  const types1 = s1.map((d) => d.types);
  const counts1 = Float64Array.from(s1, (d) => d.counts);
  const types2 = s2.map((d) => d.types);
  const counts2 = Float64Array.from(s2, (d) => d.counts);

  const result = mod.compute_allotax(types1, counts1, types2, counts2, a);
  return result; // { normalization, diamond_counts, wordshift, ... }
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

function fmtNum(x) {
  if (x === undefined || x === null || Number.isNaN(x)) return 'NaN';
  const s = Number(x).toExponential(3);
  return s.padStart(11);
}

function fmtStr(s, n) {
  const str = String(s ?? '');
  return str.length > n ? str.slice(0, n - 1) + '…' : str.padEnd(n);
}

function compareWordshift(jsBar, wasmBar, n) {
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log(`TOP ${n} WORDSHIFT ENTRIES`);
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log(
    `${'#'.padStart(3)}  ${fmtStr('JS type', 36)}  ${'JS metric'.padStart(11)}   ` +
    `${fmtStr('WASM type', 36)}  ${'WASM metric'.padStart(11)}   match`
  );
  console.log('-'.repeat(115));

  let mismatches = 0;
  for (let i = 0; i < n; i++) {
    const j = jsBar[i];
    const w = wasmBar[i];
    const jLabel = j?.type ?? '';
    const wLabel = w?.type ?? '';
    // Strip the " (rank ⇋ rank)" suffix to compare bare tokens
    const jBare = jLabel.replace(/ \(.*/, '');
    const wBare = wLabel.replace(/ \(.*/, '');
    const sameType = jBare === wBare;
    const sameMetric = j && w && Math.abs((j.metric - w.metric) / (j.metric || 1)) < 1e-6;
    const ok = sameType && sameMetric;
    if (!ok) mismatches++;
    const mark = ok ? 'ok' : sameType ? '~metric' : '!!';
    console.log(
      `${String(i + 1).padStart(3)}  ${fmtStr(jLabel, 36)}  ${fmtNum(j?.metric)}   ` +
      `${fmtStr(wLabel, 36)}  ${fmtNum(w?.metric)}   ${mark}`
    );
  }
  console.log('-'.repeat(115));
  console.log(`mismatches in top ${n}: ${mismatches}`);
  console.log('');

  // Full-list set comparison (bare type tokens), ignoring order
  const jsSet = new Set(jsBar.map((e) => e.type.replace(/ \(.*/, '')));
  const wasmSet = new Set(wasmBar.map((e) => e.type.replace(/ \(.*/, '')));
  const onlyJS = [...jsSet].filter((t) => !wasmSet.has(t));
  const onlyWasm = [...wasmSet].filter((t) => !jsSet.has(t));
  console.log(`JS total: ${jsSet.size}   WASM total: ${wasmSet.size}`);
  console.log(`only in JS: ${onlyJS.length}   only in WASM: ${onlyWasm.length}`);
  if (onlyJS.length && onlyJS.length <= 10) console.log(`  onlyJS sample: ${onlyJS.slice(0, 10).join(', ')}`);
  if (onlyWasm.length && onlyWasm.length <= 10) console.log(`  onlyWasm sample: ${onlyWasm.slice(0, 10).join(', ')}`);
}

function compareScalars(js, wasm) {
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log('SCALARS');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  // JS ncells is implicit in the dense grid: length = ncells².
  const jsNcells = Math.round(Math.sqrt(js.dat.counts.length));
  // JS maxlog10 comes from pipeline's d3.max + log10, pre-ceil.
  const jsMaxRank1 = Math.max(...js.me[0].ranks);
  const jsMaxRank2 = Math.max(...js.me[1].ranks);
  const jsMaxlog10Raw = Math.max(Math.log10(jsMaxRank1), Math.log10(jsMaxRank2));
  const jsMaxlog10Ceiled = Math.ceil(jsMaxlog10Raw);
  const rows = [
    ['normalization', js.rtd.normalization, wasm.normalization],
    ['max_delta_loss', js.dat.max_delta_loss, wasm.max_delta_loss],
    ['ncells', jsNcells, wasm.ncells],
    ['maxlog10 raw', jsMaxlog10Raw.toFixed(6), wasm.maxlog10.toFixed(6)],
    ['maxlog10 ceiled', jsMaxlog10Ceiled, Math.ceil(wasm.maxlog10)],
  ];
  for (const [name, jv, wv] of rows) {
    console.log(`  ${name.padEnd(18)} JS=${String(jv).padStart(14)}   WASM=${String(wv).padStart(14)}`);
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Diamond comparison
// ---------------------------------------------------------------------------

function compareDiamond(jsCells, wasmCells) {
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log('DIAMOND CELLS');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');

  // JS dense grid: most are value=0. Filter to populated.
  const jsPop = jsCells.filter((c) => c.value > 0);
  // WASM is already sparse (value > 0 only).
  const wasmPop = wasmCells;

  console.log(`JS populated cells: ${jsPop.length}   WASM cells: ${wasmPop.length}`);

  // Build (x1,y1) → cell maps
  const keyOf = (c) => `${c.x1},${c.y1}`;
  const jsMap = new Map(jsPop.map((c) => [keyOf(c), c]));
  const wasmMap = new Map(wasmPop.map((c) => [keyOf(c), c]));

  const jsOnly = [];
  const wasmOnly = [];
  const valueMismatches = [];
  const whichSysMismatches = [];

  for (const [k, j] of jsMap) {
    const w = wasmMap.get(k);
    if (!w) {
      jsOnly.push(k);
      continue;
    }
    if (j.value !== w.value) valueMismatches.push({ k, js: j.value, wasm: w.value });
    if (j.which_sys !== w.which_sys)
      whichSysMismatches.push({ k, js: j.which_sys, wasm: w.which_sys });
  }
  for (const k of wasmMap.keys()) {
    if (!jsMap.has(k)) wasmOnly.push(k);
  }

  console.log(`only in JS: ${jsOnly.length}   only in WASM: ${wasmOnly.length}`);
  console.log(`value mismatches: ${valueMismatches.length}`);
  console.log(`which_sys mismatches: ${whichSysMismatches.length}`);

  if (jsOnly.length) console.log(`  JS-only cells: ${jsOnly.slice(0, 10).join(' ')}${jsOnly.length > 10 ? ' ...' : ''}`);
  if (wasmOnly.length)
    console.log(`  WASM-only cells: ${wasmOnly.slice(0, 10).join(' ')}${wasmOnly.length > 10 ? ' ...' : ''}`);
  if (valueMismatches.length) {
    console.log('  value mismatches:');
    for (const m of valueMismatches.slice(0, 10)) {
      console.log(`    (${m.k}) JS=${m.js}  WASM=${m.wasm}`);
    }
  }

  // Extent sanity check
  const jsMaxX = Math.max(...jsPop.map((c) => c.x1));
  const jsMaxY = Math.max(...jsPop.map((c) => c.y1));
  const wasmMaxX = Math.max(...wasmPop.map((c) => c.x1));
  const wasmMaxY = Math.max(...wasmPop.map((c) => c.y1));
  console.log(`extent: JS x∈[0,${jsMaxX}] y∈[0,${jsMaxY}]   WASM x∈[0,${wasmMaxX}] y∈[0,${wasmMaxY}]`);

  // Distance-from-diagonal distribution
  const distBuckets = (cells) => {
    const b = new Array(8).fill(0);
    for (const c of cells) {
      const d = Math.abs(c.x1 - c.y1);
      const bi = Math.min(d, b.length - 1);
      b[bi] += c.value;
    }
    return b;
  };
  const jsDist = distBuckets(jsPop);
  const wasmDist = distBuckets(wasmPop);
  console.log('cell-count by |x1-y1|  (sum of values)');
  console.log('  |Δ|  ' + [0, 1, 2, 3, 4, 5, 6, '7+'].map((x) => String(x).padStart(7)).join(''));
  console.log('  JS   ' + jsDist.map((x) => String(x).padStart(7)).join(''));
  console.log('  WASM ' + wasmDist.map((x) => String(x).padStart(7)).join(''));
  console.log('');
}

// ---------------------------------------------------------------------------
// Balance comparison
// ---------------------------------------------------------------------------

function compareBalance(jsBal, wasmBal) {
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  console.log('BALANCE');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════════════════');
  const n = Math.max(jsBal.length, wasmBal.length);
  for (let i = 0; i < n; i++) {
    const j = jsBal[i];
    const w = wasmBal[i];
    const match =
      j && w && j.y_coord === w.y_coord && Math.abs(j.frequency - w.frequency) < 1e-9;
    console.log(
      `  ${String(i).padStart(2)}  ` +
        `JS=${fmtStr(j?.y_coord, 18)} ${fmtNum(j?.frequency)}   ` +
        `WASM=${fmtStr(w?.y_coord, 18)} ${fmtNum(w?.frequency)}   ${match ? 'ok' : '!!'}`
    );
  }
  console.log('');
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const js = runJS(sys1, sys2, alpha);
const wasm = await runWasm(sys1, sys2, alpha);
const jsBalance = balanceDat(sys1, sys2);

compareScalars(js, wasm);
compareDiamond(js.dat.counts, wasm.diamond_counts);
compareBalance(jsBalance, wasm.balance);
compareWordshift(js.barData, wasm.wordshift, topN);
